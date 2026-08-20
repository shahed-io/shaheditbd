import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import postgres from "npm:postgres@3.4.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BACKUP_DB_URL = Deno.env.get("BACKUP_DB_URL")!;
const SYNC_SECRET = Deno.env.get("BACKUP_SYNC_SECRET")!;

const SKIP = new Set(["backup_sync_queue", "backup_sync_state", "backup_sync_log"]);

type Json = Record<string, unknown>;

function admin() {
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
}

/** Parse a Postgres URL robustly (passwords may contain unescaped @ or : characters). */
function parseDbUrl(raw: string) {
  const trimmed = raw.trim().replace(/^postgres(ql)?:\/\//, "");
  const at = trimmed.lastIndexOf("@");
  if (at === -1) throw new Error("BACKUP_DB_URL is malformed (missing credentials)");
  const auth = trimmed.slice(0, at);
  let rest = trimmed.slice(at + 1);
  const colon = auth.indexOf(":");
  const username = decodeURIComponent(colon === -1 ? auth : auth.slice(0, colon));
  const password = colon === -1 ? "" : decodeURIComponent(auth.slice(colon + 1));

  let database = "postgres";
  const slash = rest.indexOf("/");
  if (slash !== -1) {
    database = rest.slice(slash + 1).split("?")[0] || "postgres";
    rest = rest.slice(0, slash);
  }
  const [host, portStr] = rest.split(":");
  return { host, port: Number(portStr || 5432), database, username, password };
}

function backupDb() {
  const cfg = parseDbUrl(BACKUP_DB_URL);
  return postgres({
    ...cfg,
    max: 3,
    idle_timeout: 20,
    connect_timeout: 20,
    prepare: false,
    ssl: { rejectUnauthorized: false },
  });
}


async function isAuthorized(req: Request): Promise<boolean> {
  if (req.headers.get("x-backup-secret") === SYNC_SECRET) return true;
  const headerSecret = req.headers.get("x-backup-secret");
  if (headerSecret) {
    const { data: row } = await admin()
      .from("backup_sync_state")
      .select("value")
      .eq("key", "cron_secret")
      .maybeSingle();
    const dbSecret = (row?.value as Json | undefined)?.secret as string | undefined;
    if (dbSecret && headerSecret === dbSecret) return true;
  }
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const sb = admin();
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return false;
  const { data: role } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "admin")
    .maybeSingle();
  return !!role;
}

async function getState(sb: ReturnType<typeof admin>, key: string): Promise<Json> {
  const { data } = await sb.from("backup_sync_state").select("value").eq("key", key).maybeSingle();
  return (data?.value as Json) ?? {};
}

async function setState(sb: ReturnType<typeof admin>, key: string, value: Json) {
  await sb.from("backup_sync_state").upsert(
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
}

async function log(sb: ReturnType<typeof admin>, kind: string, status: string, details: Json) {
  await sb.from("backup_sync_log").insert({ kind, status, details });
}

// ---------------------------------------------------------------- schema
async function ensureSchema(sb: ReturnType<typeof admin>, sql: postgres.Sql) {
  const { data, error } = await sb.rpc("backup_schema_snapshot");
  if (error) throw new Error(`snapshot failed: ${error.message}`);
  const snap = data as { enums: { name: string; labels: string[] }[]; tables: { name: string; columns: { name: string; type: string }[]; pk: string[] }[] };

  for (const e of snap.enums) {
    const labels = e.labels.map((l) => `'${l.replace(/'/g, "''")}'`).join(",");
    await sql.unsafe(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='${e.name}') THEN
        CREATE TYPE public."${e.name}" AS ENUM (${labels});
      END IF;
    END $$;`);
    // add any missing labels
    for (const l of e.labels) {
      await sql.unsafe(
        `ALTER TYPE public."${e.name}" ADD VALUE IF NOT EXISTS '${l.replace(/'/g, "''")}'`,
      );
    }
  }

  // resumable: only a bounded batch of tables per invocation
  const { data: stateRow } = await sb
    .from("backup_sync_state").select("value").eq("key", "schema_progress").maybeSingle();
  const done = new Set<string>(((stateRow?.value as { done?: string[] } | null)?.done) ?? []);

  let created = 0;
  const pending = snap.tables.filter((t) => !SKIP.has(t.name) && !done.has(t.name));
  for (const t of pending.slice(0, 12)) {
    const cols = t.columns.map((c) => `"${c.name}" ${c.type}`).join(", ");
    await sql.unsafe(`CREATE TABLE IF NOT EXISTS public."${t.name}" (${cols})`);
    for (const c of t.columns) {
      await sql.unsafe(
        `ALTER TABLE public."${t.name}" ADD COLUMN IF NOT EXISTS "${c.name}" ${c.type}`,
      );
    }
    if (t.pk.length) {
      const pkCols = t.pk.map((c) => `"${c}"`).join(", ");
      await sql.unsafe(`DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public."${t.name}"'::regclass AND contype='p') THEN
          BEGIN
            ALTER TABLE public."${t.name}" ALTER COLUMN ${t.pk.map((c) => `"${c}" SET NOT NULL`).join(", ALTER COLUMN ")};
            ALTER TABLE public."${t.name}" ADD PRIMARY KEY (${pkCols});
          EXCEPTION WHEN OTHERS THEN NULL;
          END;
        END IF;
      END $$;`);
    }
    done.add(t.name);
    created++;
  }
  await sb.from("backup_sync_state")
    .upsert({ key: "schema_progress", value: { done: [...done] } }, { onConflict: "key" });
  const schemaFinished = pending.length <= 12;


  // auth users mirror (metadata only, never password hashes or tokens)
  await sql.unsafe(`CREATE TABLE IF NOT EXISTS public.auth_users_backup (
    id uuid PRIMARY KEY,
    email text,
    phone text,
    provider text,
    created_at timestamptz,
    last_sign_in_at timestamptz,
    user_metadata jsonb,
    synced_at timestamptz DEFAULT now()
  )`);

  await setState(sb, "config", { ...(await getState(sb, "config")), schema_ready: schemaFinished });
  return { tables: created, remaining: Math.max(0, pending.length - 12), finished: schemaFinished, enums: snap.enums.length };

}

// ---------------------------------------------------------------- helpers
async function pkMap(sb: ReturnType<typeof admin>) {
  const { data } = await sb.rpc("backup_schema_snapshot");
  const snap = data as { tables: { name: string; pk: string[]; columns: { name: string }[] }[] };
  const map: Record<string, { pk: string[]; cols: string[] }> = {};
  for (const t of snap.tables) map[t.name] = { pk: t.pk, cols: t.columns.map((c) => c.name) };
  return map;
}

async function upsertRows(
  sql: postgres.Sql,
  table: string,
  pk: string[],
  cols: string[],
  rows: Json[],
) {
  if (!rows.length) return;
  const colList = cols.map((c) => `"${c}"`).join(", ");
  if (pk.length) {
    const conflict = pk.map((c) => `"${c}"`).join(", ");
    const updates = cols
      .filter((c) => !pk.includes(c))
      .map((c) => `"${c}" = EXCLUDED."${c}"`)
      .join(", ");
    const setClause = updates ? `DO UPDATE SET ${updates}` : "DO NOTHING";
    await sql.unsafe(
      `INSERT INTO public."${table}" (${colList})
       SELECT ${colList} FROM jsonb_populate_recordset(NULL::public."${table}", $1::jsonb)
       ON CONFLICT (${conflict}) ${setClause}`,
      [JSON.stringify(rows)],
    );
  } else {
    await sql.unsafe(
      `INSERT INTO public."${table}" (${colList})
       SELECT ${colList} FROM jsonb_populate_recordset(NULL::public."${table}", $1::jsonb)`,
      [JSON.stringify(rows)],
    );
  }
}

async function deleteRow(sql: postgres.Sql, table: string, pk: string[], pkText: string) {
  if (!pk.length) return;
  const parts = pkText.split("|");
  const where = pk.map((c, i) => `"${c}"::text = $${i + 1}`).join(" AND ");
  await sql.unsafe(`DELETE FROM public."${table}" WHERE ${where}`, parts);
}

// ---------------------------------------------------------------- backfill
async function backfill(sb: ReturnType<typeof admin>, sql: postgres.Sql, budgetMs: number) {
  const started = Date.now();
  const meta = await pkMap(sb);
  const state = await getState(sb, "backfill");
  const done: string[] = (state.done as string[]) ?? [];
  let cursor = (state.cursor as number) ?? 0;
  let current = (state.table as string) ?? null;
  let copied = 0;

  const tables = Object.keys(meta).filter((t) => !SKIP.has(t)).sort();

  for (const table of tables) {
    if (done.includes(table)) continue;
    if (current && current !== table) continue;
    current = table;
    const { pk, cols } = meta[table];

    while (Date.now() - started < budgetMs) {
      let q = sb.from(table).select("*").range(cursor, cursor + 499);
      if (pk.length) q = q.order(pk[0], { ascending: true });
      const { data, error } = await q;
      if (error) {
        await log(sb, "backfill", "error", { table, error: error.message });
        break;
      }
      const rows = (data ?? []) as Json[];
      if (rows.length) {
        await upsertRows(sql, table, pk, cols, rows);
        copied += rows.length;
        cursor += rows.length;
      }
      if (rows.length < 500) {
        done.push(table);
        cursor = 0;
        current = null;
        break;
      }
    }

    await setState(sb, "backfill", { done, cursor, table: current });
    if (Date.now() - started >= budgetMs) {
      return { copied, finished: false, remaining: tables.length - done.length };
    }
  }

  // auth users metadata mirror
  await syncAuthUsers(sb, sql);

  const cfg = await getState(sb, "config");
  await setState(sb, "config", { ...cfg, initial_done: true });
  await setState(sb, "backfill", { done, cursor: 0, table: null });
  await log(sb, "backfill", "completed", { copied, tables: done.length });
  return { copied, finished: true, remaining: 0 };
}

async function syncAuthUsers(sb: ReturnType<typeof admin>, sql: postgres.Sql) {
  let page = 1;
  let total = 0;
  for (;;) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    const users = data.users ?? [];
    if (!users.length) break;
    const rows = users.map((u) => ({
      id: u.id,
      email: u.email ?? null,
      phone: u.phone ?? null,
      provider: (u.app_metadata as Json)?.provider ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      user_metadata: u.user_metadata ?? {},
    }));
    await sql.unsafe(
      `INSERT INTO public.auth_users_backup (id,email,phone,provider,created_at,last_sign_in_at,user_metadata,synced_at)
       SELECT id,email,phone,provider,created_at,last_sign_in_at,user_metadata,now()
       FROM jsonb_populate_recordset(NULL::public.auth_users_backup, $1::jsonb)
       ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email, phone=EXCLUDED.phone,
         provider=EXCLUDED.provider, last_sign_in_at=EXCLUDED.last_sign_in_at,
         user_metadata=EXCLUDED.user_metadata, synced_at=now()`,
      [JSON.stringify(rows)],
    );
    total += rows.length;
    if (users.length < 200) break;
    page++;
  }
  return total;
}

// ---------------------------------------------------------------- drain queue
async function drain(sb: ReturnType<typeof admin>, sql: postgres.Sql, limit = 400) {
  const meta = await pkMap(sb);
  const { data, error } = await sb
    .from("backup_sync_queue")
    .select("*")
    .lte("next_retry_at", new Date().toISOString())
    .order("id", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  const items = data ?? [];
  let ok = 0;
  let failed = 0;

  for (const item of items) {
    const info = meta[item.table_name];
    if (!info) {
      await sb.from("backup_sync_queue").delete().eq("id", item.id);
      continue;
    }
    try {
      if (item.op === "DELETE") {
        await deleteRow(sql, item.table_name, info.pk, item.pk_text);
      } else {
        await upsertRows(sql, item.table_name, info.pk, info.cols, [item.row_data as Json]);
      }
      await sb.from("backup_sync_queue").delete().eq("id", item.id);
      ok++;
    } catch (e) {
      failed++;
      const attempts = (item.attempts ?? 0) + 1;
      const delay = Math.min(60 * 60, 2 ** Math.min(attempts, 10)) * 1000;
      await sb
        .from("backup_sync_queue")
        .update({
          attempts,
          last_error: String((e as Error).message ?? e).slice(0, 500),
          next_retry_at: new Date(Date.now() + delay).toISOString(),
        })
        .eq("id", item.id);
    }
  }
  return { processed: items.length, ok, failed };
}

// ---------------------------------------------------------------- verify
async function verify(sb: ReturnType<typeof admin>, sql: postgres.Sql) {
  const { data } = await sb.rpc("backup_table_counts");
  const primary = (data ?? {}) as Record<string, number>;
  const rows = await sql.unsafe(
    `SELECT c.relname AS t FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind='r'`,
  );
  const backupTables = new Set(rows.map((r: Record<string, unknown>) => r.t as string));
  const result: Record<string, { primary: number; backup: number | null; match: boolean }> = {};
  for (const [t, n] of Object.entries(primary)) {
    let b: number | null = null;
    if (backupTables.has(t)) {
      const r = await sql.unsafe(`SELECT count(*)::int AS n FROM public."${t}"`);
      b = (r[0] as Record<string, number>).n;
    }
    result[t] = { primary: n, backup: b, match: b === n };
  }
  return result;
}

// ---------------------------------------------------------------- handler
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    if (!BACKUP_DB_URL) return json({ error: "Backup database is not configured" }, 500);
    if (!(await isAuthorized(req))) return json({ error: "Unauthorized" }, 401);

    let action = new URL(req.url).searchParams.get("action") ?? "";
    if (!action && req.method === "POST") {
      try {
        action = ((await req.json()) as Json).action as string;
      } catch { /* ignore */ }
    }
    action = action || "cron";

    const sb = admin();
    const cfg = await getState(sb, "config");

    if (action === "status") {
      const [{ count: queued }, { count: failing }] = await Promise.all([
        sb.from("backup_sync_queue").select("*", { count: "exact", head: true }),
        sb.from("backup_sync_queue").select("*", { count: "exact", head: true }).gt("attempts", 0),
      ]);
      const { data: logs } = await sb
        .from("backup_sync_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      const backfillState = await getState(sb, "backfill");
      return json({ config: cfg, queued: queued ?? 0, failing: failing ?? 0, backfill: backfillState, logs });
    }

    if (action === "pause" || action === "resume") {
      await setState(sb, "config", { ...cfg, paused: action === "pause" });
      return json({ ok: true, paused: action === "pause" });
    }

    if (action === "reset-backfill") {
      await setState(sb, "backfill", { done: [], cursor: 0, table: null });
      await setState(sb, "config", { ...cfg, initial_done: false });
      return json({ ok: true });
    }

    if (cfg.paused && action !== "setup" && action !== "verify") {
      return json({ skipped: true, reason: "paused" });
    }

    const sql = backupDb();
    try {
      if (action === "setup") {
        const r = await ensureSchema(sb, sql);
        await log(sb, "setup", "completed", r);
        return json({ ok: true, ...r });
      }
      if (action === "verify") return json({ ok: true, tables: await verify(sb, sql) });
      if (action === "backfill") {
        if (!cfg.schema_ready) await ensureSchema(sb, sql);
        return json({ ok: true, ...(await backfill(sb, sql, 45_000)) });
      }
      if (action === "drain") return json({ ok: true, ...(await drain(sb, sql)) });
      if (action === "auth-users") return json({ ok: true, users: await syncAuthUsers(sb, sql) });

      // default cron pass: schema -> backfill -> drain
      if (!cfg.schema_ready) await ensureSchema(sb, sql);
      let bf = null;
      if (!cfg.initial_done) bf = await backfill(sb, sql, 40_000);
      const dr = await drain(sb, sql);
      return json({ ok: true, backfill: bf, drain: dr });
    } finally {
      await sql.end({ timeout: 5 });
    }
  } catch (e) {
    const message = String((e as Error).message ?? e);
    try {
      await log(admin(), "worker", "error", { message });
    } catch { /* ignore */ }
    return json({ error: message }, 500);
  }
});
