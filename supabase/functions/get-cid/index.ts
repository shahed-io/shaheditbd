import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PRICE_CENTS = 100; // $1 per CID

// ─── Provider endpoints ────────────────────────────────────────────────
const GETCID_API_URL     = 'https://panel.getcid.app/user-api/getcid';
const GETCID_BALANCE_URL = 'https://panel.getcid.app/user-api/checkbalance';

// ─── Provider call: GetCID.app ─────────────────────────────────────────
async function callGetCID(token: string, iid: string): Promise<{ ok: boolean; cid?: string; error?: string; raw?: string }> {
  const url = `${GETCID_API_URL}?token=${encodeURIComponent(token)}&iid=${encodeURIComponent(iid)}`;
  try {
    const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try { data = JSON.parse(text); } catch {
      return { ok: false, error: 'Invalid JSON from GetCID', raw: text };
    }
    if (data['cid']) return { ok: true, cid: String(data['cid']) };
    return { ok: false, error: (data['error'] as string) || 'No CID returned', raw: text };
  } catch (e) {
    return { ok: false, error: `GetCID network error: ${String(e)}` };
  }
}

async function callGetCIDBalance(token: string, userId?: string): Promise<{ ok: boolean; balance?: number; raw?: string; error?: string }> {
  if (!userId) {
    return { ok: false, error: 'GETCID_USER_ID not configured' };
  }
  const url = `${GETCID_BALANCE_URL}?token=${encodeURIComponent(token)}&user_id=${encodeURIComponent(userId)}`;
  try {
    const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json,text/plain' } });
    const text = await res.text();
    // Try JSON first
    try {
      const data = JSON.parse(text);
      const bal = data.balance ?? data.amount ?? data.credits ?? data.user_balance;
      if (typeof bal === 'number') return { ok: true, balance: bal, raw: text };
      if (typeof bal === 'string') {
        const n = parseFloat(bal);
        if (!isNaN(n)) return { ok: true, balance: n, raw: text };
      }
    } catch { /* not JSON, fall through */ }
    // Plain text numeric
    const m = text.match(/([0-9]+(?:\.[0-9]+)?)/);
    if (m) return { ok: true, balance: parseFloat(m[1]), raw: text };
    return { ok: false, error: 'Could not parse balance', raw: text };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ─── Provider call: Grahok.io (BACKUP) ─────────────────────────────────
async function callGrahok(token: string, apiUrl: string, iid: string): Promise<{ ok: boolean; cid?: string; error?: string; raw?: string }> {
  try {
    const formData = new FormData();
    formData.append('token', token);
    formData.append('installation_id', iid);
    const apiUrlWithToken = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
    const res = await fetch(apiUrlWithToken, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'X-API-TOKEN': token },
      body: formData,
    });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try { data = JSON.parse(text); } catch {
      return { ok: false, error: 'Invalid JSON from Grahok', raw: text };
    }
    if (data['cid']) return { ok: true, cid: String(data['cid']) };
    return { ok: false, error: (data['error'] as string) || 'No CID returned', raw: text };
  } catch (e) {
    return { ok: false, error: `Grahok network error: ${String(e)}` };
  }
}

async function callGrahokBalance(token: string, balanceUrl: string): Promise<{ ok: boolean; balance?: number | null; raw?: string; error?: string }> {
  try {
    const url = `${balanceUrl}${balanceUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
    const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json', 'X-API-TOKEN': token } });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text);
      const bal = (data['balance'] ?? data['amount']) as number | undefined;
      return { ok: true, balance: typeof bal === 'number' ? bal : null, raw: text };
    } catch {
      const m = text.match(/([0-9]+(?:\.[0-9]+)?)/);
      return { ok: true, balance: m ? parseFloat(m[1]) : null, raw: text };
    }
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const GETCID_TOKEN = Deno.env.get('GETCID_API_TOKEN');
  const GRAHOK_TOKEN = Deno.env.get('GRAHOK_API_TOKEN');
  const GRAHOK_URL   = Deno.env.get('GRAHOK_API_URL')     || 'https://grahok.io/api/getcid.php';
  const GRAHOK_BAL   = Deno.env.get('GRAHOK_BALANCE_URL') || 'https://grahok.io/api/balance.php';

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (!GETCID_TOKEN && !GRAHOK_TOKEN) {
    return json({ error: 'No CID provider configured' }, 500);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // ── Helper: validate Supabase JWT and return user + roles ────────────
  const authenticate = async () => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return { error: 'Authentication required', status: 401 as const };
    const jwt = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !userData.user) return { error: 'Invalid session', status: 401 as const };
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id);
    const roleList = (roles ?? []).map((r: { role: string }) => r.role);
    return { user: userData.user, roles: roleList };
  };

  try {
    const body = await req.json().catch(() => ({}));
    const { action, installation_id } = body;

    // ═══════════════════════════════════════════════════════════════
    // RESELLER ACTIONS — require reseller or admin role
    // ═══════════════════════════════════════════════════════════════

    if (action === 'balance') {
      const auth = await authenticate();
      if ('error' in auth) return json({ ok: false, error: auth.error }, auth.status);
      const isReseller = auth.roles.includes('reseller') || auth.roles.includes('admin');
      if (!isReseller) return json({ ok: false, error: 'Reseller access required' }, 403);

      // Reseller's wallet balance (from reseller_profiles)
      const { data: profile } = await supabase
        .from('reseller_profiles')
        .select('balance_cents, is_active')
        .eq('user_id', auth.user.id)
        .maybeSingle();

      return json({
        ok: true,
        balance_cents: profile?.balance_cents ?? 0,
        is_active: profile?.is_active ?? false,
      });
    }

    if (action === 'getcid') {
      const auth = await authenticate();
      if ('error' in auth) return json({ error: auth.error }, auth.status);
      const isAdmin    = auth.roles.includes('admin');
      const isReseller = auth.roles.includes('reseller');
      if (!isReseller && !isAdmin) return json({ error: 'Reseller access required' }, 403);

      if (!installation_id || String(installation_id).trim().length < 4) {
        return json({ error: 'Installation ID too short' }, 400);
      }

      // Load reseller profile (admins also get one auto if missing)
      let { data: profile } = await supabase
        .from('reseller_profiles')
        .select('id, balance_cents, is_active')
        .eq('user_id', auth.user.id)
        .maybeSingle();

      if (!profile && isAdmin) {
        const { data: created } = await supabase
          .from('reseller_profiles')
          .insert({ user_id: auth.user.id })
          .select('id, balance_cents, is_active')
          .single();
        profile = created;
      }

      if (!profile) return json({ error: 'Reseller profile not found' }, 403);
      if (!profile.is_active && !isAdmin) return json({ error: 'Account suspended. Contact admin.' }, 403);

      // Admins skip billing; resellers must have balance
      if (!isAdmin && profile.balance_cents < PRICE_CENTS) {
        return json({ error: `Insufficient balance. Need $${(PRICE_CENTS/100).toFixed(2)}, have $${(profile.balance_cents/100).toFixed(2)}` }, 402);
      }

      const iid = String(installation_id).trim().replace(/\s+/g, ' ');

      // Try PRIMARY then BACKUP
      let cidValue: string | null = null;
      let usedProvider = '';

      if (GETCID_TOKEN) {
        const r = await callGetCID(GETCID_TOKEN, iid);
        if (r.ok && r.cid) { cidValue = r.cid; usedProvider = 'primary'; }
        else console.log(`[primary] failed: ${r.error} | raw: ${r.raw}`);
      }
      if (!cidValue && GRAHOK_TOKEN) {
        const r = await callGrahok(GRAHOK_TOKEN, GRAHOK_URL, iid);
        if (r.ok && r.cid) { cidValue = r.cid; usedProvider = 'backup'; }
        else console.log(`[backup] failed: ${r.error} | raw: ${r.raw}`);
      }

      if (!cidValue) {
        return json({ error: 'CID generation temporarily unavailable. Please try again.' }, 502);
      }

      // Deduct & log
      const shouldDeduct = !isAdmin;
      const newBalance = shouldDeduct ? profile.balance_cents - PRICE_CENTS : profile.balance_cents;

      const ops: Promise<unknown>[] = [
        supabase.from('reseller_generations').insert({
          user_id: auth.user.id,
          installation_id: iid,
          cid: cidValue,
          price_cents: shouldDeduct ? PRICE_CENTS : 0,
          provider: usedProvider,
        }),
      ];
      if (shouldDeduct) {
        ops.push(supabase.from('reseller_profiles').update({
          balance_cents: newBalance,
          updated_at: new Date().toISOString(),
        }).eq('user_id', auth.user.id));
      }
      await Promise.all(ops);

      return json({ cid: cidValue, balance_after_cents: newBalance });
    }

    if (action === 'my_history') {
      const auth = await authenticate();
      if ('error' in auth) return json({ error: auth.error }, auth.status);
      const { data: generations } = await supabase
        .from('reseller_generations')
        .select('id, installation_id, cid, price_cents, created_at')
        .eq('user_id', auth.user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      return json({ generations: generations ?? [] });
    }

    // ═══════════════════════════════════════════════════════════════
    // ADMIN-ONLY ACTIONS
    // ═══════════════════════════════════════════════════════════════
    const isAdminAction = ['admin_balance', 'admin_generate', 'admin_compare', 'admin_batch', 'admin_history'].includes(action);
    if (isAdminAction) {
      const auth = await authenticate();
      if ('error' in auth) return json({ error: auth.error }, auth.status);
      if (!auth.roles.includes('admin')) return json({ error: 'Admin role required' }, 403);

      if (action === 'admin_balance') {
        const result: Record<string, unknown> = { providers: {} };
        const providers = result.providers as Record<string, unknown>;
        const GETCID_USER_ID = Deno.env.get('GETCID_USER_ID');
        if (GETCID_TOKEN) {
          const r = await callGetCIDBalance(GETCID_TOKEN, GETCID_USER_ID);
          if (r.ok) {
            providers.getcid = { balance: r.balance, status: 'ok', currency: 'USD', endpoint: GETCID_BALANCE_URL };
          } else {
            // GetCID balance API is known to be unreliable — surface as "unavailable" instead of error
            const isApiLimitation = r.raw === 'User ID is required' || r.error === 'GETCID_USER_ID not configured';
            providers.getcid = isApiLimitation
              ? { status: 'unavailable', message: 'Balance API not exposed by provider', endpoint: GETCID_BALANCE_URL }
              : { error: r.error, status: 'error', raw: r.raw };
          }
        } else {
          providers.getcid = { status: 'not_configured' };
        }
        if (GRAHOK_TOKEN) {
          const r = await callGrahokBalance(GRAHOK_TOKEN, GRAHOK_BAL);
          providers.grahok = r.ok
            ? { balance: r.balance, status: 'ok', endpoint: GRAHOK_BAL }
            : { error: r.error, status: 'error', raw: r.raw };
        } else {
          providers.grahok = { status: 'not_configured' };
        }
        return json(result);
      }

      if (action === 'admin_generate') {
        if (!installation_id || String(installation_id).trim().length < 4) {
          return json({ error: 'Installation ID too short' }, 400);
        }
        const provider = (body.provider as string) || 'auto';
        const iid = String(installation_id).trim().replace(/\s+/g, ' ');
        const errors: Record<string, string> = {};
        let cidValue: string | null = null;
        let usedProvider = '';
        const startTime = Date.now();

        const tryGetCID = async () => {
          if (!GETCID_TOKEN) { errors.getcid = 'token not configured'; return; }
          const r = await callGetCID(GETCID_TOKEN, iid);
          if (r.ok && r.cid) { cidValue = r.cid; usedProvider = 'getcid'; }
          else errors.getcid = r.error || 'unknown';
        };
        const tryGrahok = async () => {
          if (!GRAHOK_TOKEN) { errors.grahok = 'token not configured'; return; }
          const r = await callGrahok(GRAHOK_TOKEN, GRAHOK_URL, iid);
          if (r.ok && r.cid) { cidValue = r.cid; usedProvider = 'grahok'; }
          else errors.grahok = r.error || 'unknown';
        };

        if (provider === 'getcid') await tryGetCID();
        else if (provider === 'grahok') await tryGrahok();
        else { await tryGetCID(); if (!cidValue) await tryGrahok(); }

        const elapsed = Date.now() - startTime;
        if (!cidValue) return json({ error: 'CID generation failed', details: errors, elapsed_ms: elapsed }, 502);
        return json({ cid: cidValue, provider: usedProvider, elapsed_ms: elapsed, billed: false });
      }

      if (action === 'admin_compare') {
        if (!installation_id || String(installation_id).trim().length < 4) {
          return json({ error: 'Installation ID too short' }, 400);
        }
        const iid = String(installation_id).trim().replace(/\s+/g, ' ');
        const t1 = Date.now();
        const [getcidRes, grahokRes] = await Promise.all([
          GETCID_TOKEN ? callGetCID(GETCID_TOKEN, iid) : Promise.resolve({ ok: false, error: 'not configured' }),
          GRAHOK_TOKEN ? callGrahok(GRAHOK_TOKEN, GRAHOK_URL, iid) : Promise.resolve({ ok: false, error: 'not configured' }),
        ]);
        return json({
          installation_id: iid,
          total_elapsed_ms: Date.now() - t1,
          getcid: getcidRes.ok
            ? { status: 'success', cid: getcidRes.cid }
            : { status: 'failed', error: getcidRes.error, raw: getcidRes.raw },
          grahok: grahokRes.ok
            ? { status: 'success', cid: grahokRes.cid }
            : { status: 'failed', error: grahokRes.error, raw: grahokRes.raw },
        });
      }

      if (action === 'admin_batch') {
        const iids = body.installation_ids as unknown;
        if (!Array.isArray(iids) || iids.length === 0) {
          return json({ error: 'installation_ids must be a non-empty array' }, 400);
        }
        if (iids.length > 50) {
          return json({ error: 'Maximum 50 IIDs per batch' }, 400);
        }
        const provider = (body.provider as string) || 'auto';
        const results: Array<Record<string, unknown>> = [];
        for (const raw of iids) {
          const iid = String(raw).trim().replace(/\s+/g, ' ');
          if (iid.length < 4) {
            results.push({ installation_id: iid, status: 'skipped', error: 'too short' });
            continue;
          }
          const errors: Record<string, string> = {};
          let cidValue: string | null = null;
          let usedProvider = '';
          const tryGetCID = async () => {
            if (!GETCID_TOKEN) { errors.getcid = 'no token'; return; }
            const r = await callGetCID(GETCID_TOKEN, iid);
            if (r.ok && r.cid) { cidValue = r.cid; usedProvider = 'getcid'; }
            else errors.getcid = r.error || 'unknown';
          };
          const tryGrahok = async () => {
            if (!GRAHOK_TOKEN) { errors.grahok = 'no token'; return; }
            const r = await callGrahok(GRAHOK_TOKEN, GRAHOK_URL, iid);
            if (r.ok && r.cid) { cidValue = r.cid; usedProvider = 'grahok'; }
            else errors.grahok = r.error || 'unknown';
          };
          if (provider === 'getcid') await tryGetCID();
          else if (provider === 'grahok') await tryGrahok();
          else { await tryGetCID(); if (!cidValue) await tryGrahok(); }

          if (cidValue) results.push({ installation_id: iid, status: 'success', cid: cidValue, provider: usedProvider });
          else results.push({ installation_id: iid, status: 'failed', errors });
        }
        const successCount = results.filter(r => r.status === 'success').length;
        return json({ total: results.length, success: successCount, failed: results.length - successCount, results });
      }

      if (action === 'admin_history') {
        const limit = Math.min(Number(body.limit) || 100, 500);
        const { data: generations } = await supabase
          .from('reseller_generations')
          .select('id, installation_id, cid, price_cents, created_at, user_id, provider')
          .order('created_at', { ascending: false })
          .limit(limit);

        // Enrich with user emails
        const userIds = Array.from(new Set((generations ?? []).map((g: { user_id: string }) => g.user_id)));
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email, display_name')
          .in('user_id', userIds);
        const userMap = new Map((profiles ?? []).map((p: { user_id: string; email?: string; display_name?: string }) => [p.user_id, p]));

        const enriched = (generations ?? []).map((g: Record<string, unknown>) => ({
          ...g,
          user: userMap.get(g.user_id as string) || null,
        }));

        return json({ generations: enriched });
      }
    }

    return json({ error: 'Invalid action' }, 400);
  } catch (err) {
    return json({ error: 'Server error', detail: String(err) }, 500);
  }
});
