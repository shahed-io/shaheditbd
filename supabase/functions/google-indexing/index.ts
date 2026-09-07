// Google Indexing API integration.
// All Google API calls happen here (server-side). Service account JSON
// is stored in the google_indexing_config table (RLS closed to clients,
// only service_role can read it). The frontend never sees the key.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_URL = "https://shahedit.com";
const INDEXING_ENDPOINT =
  "https://indexing.googleapis.com/v3/urlNotifications:publish";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const INDEXING_SCOPE = "https://www.googleapis.com/auth/indexing";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── JWT (RS256) signing for service-account access-token exchange ─────
function b64url(input: ArrayBuffer | Uint8Array | string): string {
  let bytes: Uint8Array;
  if (typeof input === "string") bytes = new TextEncoder().encode(input);
  else if (input instanceof ArrayBuffer) bytes = new Uint8Array(input);
  else bytes = input;
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function pemToPkcs8(pem: string): ArrayBuffer {
  const clean = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function signJwtRS256(
  clientEmail: string,
  privateKeyPem: string,
  scope: string,
): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: clientEmail,
    scope,
    aud: TOKEN_ENDPOINT,
    exp: now + 3600,
    iat: now,
  };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(
    JSON.stringify(claim),
  )}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${b64url(sig)}`;
}

async function getAccessToken(saJson: {
  client_email: string;
  private_key: string;
}): Promise<{ access_token: string }> {
  const jwt = await signJwtRS256(
    saJson.client_email,
    saJson.private_key,
    INDEXING_SCOPE,
  );
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Token exchange failed [${res.status}]: ${text}`);
  }
  return JSON.parse(text);
}

async function submitUrl(
  accessToken: string,
  url: string,
  type: "URL_UPDATED" | "URL_DELETED",
) {
  const res = await fetch(INDEXING_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, type }),
  });
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

async function pingSitemap(): Promise<{ ok: boolean; status: number }> {
  const url = `https://www.google.com/ping?sitemap=${encodeURIComponent(
    `${SITE_URL}/sitemap.xml`,
  )}`;
  try {
    const r = await fetch(url);
    return { ok: r.ok, status: r.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

// ── main handler ─────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const admin = createClient(supabaseUrl, serviceKey);

  // ── admin auth check ──
  const authHeader = req.headers.get("Authorization") || "";
  const asUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userRes } = await asUser.auth.getUser();
  const user = userRes?.user;
  if (!user) return json(401, { error: "Unauthorized" });

  const { data: isAdmin } = await admin.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  if (!isAdmin) return json(403, { error: "Admin only" });

  let payload: { action?: string; [k: string]: any } = {};
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const action = String(payload.action || "");

  // Helper: load & parse service account JSON
  async function loadServiceAccount() {
    const { data, error } = await admin
      .from("google_indexing_config")
      .select("service_account_json")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data?.service_account_json) {
      throw new Error("Service account not configured");
    }
    let sa: any;
    try {
      sa = JSON.parse(data.service_account_json);
    } catch {
      throw new Error("Stored service account JSON is invalid");
    }
    if (!sa.client_email || !sa.private_key) {
      throw new Error("Service account JSON missing client_email / private_key");
    }
    return sa as {
      client_email: string;
      private_key: string;
      project_id?: string;
    };
  }

  try {
    // ── STATUS ────────────────────────────────────────────────
    if (action === "status") {
      const { data } = await admin
        .from("google_indexing_config")
        .select(
          "service_account_email, project_id, last_tested_at, last_test_ok, last_test_message, updated_at",
        )
        .eq("id", 1)
        .maybeSingle();
      return json(200, { configured: !!data?.service_account_email, ...data });
    }

    // ── SAVE KEY ──────────────────────────────────────────────
    if (action === "save_key") {
      const raw = String(payload.service_account_json || "").trim();
      if (!raw) return json(400, { error: "service_account_json required" });
      let parsed: any;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return json(400, { error: "Invalid JSON — paste the full service account key file" });
      }
      if (parsed.type !== "service_account" || !parsed.client_email || !parsed.private_key) {
        return json(400, {
          error:
            "Not a valid service account key (need type=service_account, client_email, private_key)",
        });
      }
      const { error } = await admin
        .from("google_indexing_config")
        .upsert({
          id: 1,
          service_account_json: raw,
          service_account_email: parsed.client_email,
          project_id: parsed.project_id ?? null,
          updated_at: new Date().toISOString(),
          last_tested_at: null,
          last_test_ok: null,
          last_test_message: null,
        });
      if (error) return json(500, { error: error.message });
      return json(200, { ok: true, service_account_email: parsed.client_email });
    }

    // ── DELETE KEY ────────────────────────────────────────────
    if (action === "delete_key") {
      await admin.from("google_indexing_config").delete().eq("id", 1);
      return json(200, { ok: true });
    }

    // ── TEST CONNECTION ───────────────────────────────────────
    if (action === "test") {
      let msg = "";
      let ok = false;
      try {
        const sa = await loadServiceAccount();
        const { access_token } = await getAccessToken(sa);
        // Query the metadata endpoint for the site URL (safe, doesn't consume quota).
        const metaRes = await fetch(
          `https://indexing.googleapis.com/v3/urlNotifications/metadata?url=${encodeURIComponent(
            SITE_URL,
          )}`,
          { headers: { Authorization: `Bearer ${access_token}` } },
        );
        const body = await metaRes.text();
        // 404 = URL never submitted (fine — auth worked).
        // 403 = auth ok but service account not verified as site owner.
        // 200 = fully working.
        if (metaRes.status === 200 || metaRes.status === 404) {
          ok = true;
          msg =
            metaRes.status === 200
              ? "Connected — service account is a verified site owner."
              : "Authenticated. Add the service account email as an owner in Google Search Console to submit URLs.";
        } else {
          msg = `Google returned ${metaRes.status}: ${body.slice(0, 400)}`;
        }
      } catch (e: any) {
        msg = e?.message || String(e);
      }
      await admin.from("google_indexing_config").update({
        last_tested_at: new Date().toISOString(),
        last_test_ok: ok,
        last_test_message: msg,
      }).eq("id", 1);
      return json(200, { ok, message: msg });
    }

    // ── SUBMIT URLS ───────────────────────────────────────────
    if (action === "submit") {
      const productIds: string[] | undefined = Array.isArray(payload.product_ids)
        ? payload.product_ids
        : undefined;
      const submitAll = !!payload.all;
      const notificationType: "URL_UPDATED" | "URL_DELETED" =
        payload.notification_type === "URL_DELETED" ? "URL_DELETED" : "URL_UPDATED";

      // Load target products
      let query = admin
        .from("products")
        .select("id, slug, status")
        .eq("status", "active");
      if (productIds && productIds.length) query = query.in("id", productIds);
      const { data: products, error: pErr } = await query.limit(5000);
      if (pErr) return json(500, { error: pErr.message });
      if (!products?.length) return json(200, { ok: true, submitted: 0, results: [] });
      if (!submitAll && !productIds) {
        return json(400, { error: "Provide product_ids or all:true" });
      }

      // Load service account & mint token once
      let accessToken: string;
      try {
        const sa = await loadServiceAccount();
        const tok = await getAccessToken(sa);
        accessToken = tok.access_token;
      } catch (e: any) {
        return json(400, { error: e?.message || "Auth failed" });
      }

      const results: any[] = [];
      const logRows: any[] = [];
      for (const p of products) {
        const url = `${SITE_URL}/product/${p.slug}`;
        try {
          const r = await submitUrl(accessToken, url, notificationType);
          results.push({ id: p.id, url, ok: r.ok, status: r.status });
          logRows.push({
            product_id: p.id,
            url,
            notification_type: notificationType,
            status_code: r.status,
            ok: r.ok,
            response_body: r.body?.slice(0, 4000) ?? null,
            error: r.ok ? null : `HTTP ${r.status}`,
          });
        } catch (e: any) {
          const err = e?.message || String(e);
          results.push({ id: p.id, url, ok: false, status: 0, error: err });
          logRows.push({
            product_id: p.id,
            url,
            notification_type: notificationType,
            status_code: null,
            ok: false,
            response_body: null,
            error: err,
          });
        }
      }

      // Best-effort ping to Google for sitemap
      const ping = await pingSitemap();

      if (logRows.length) {
        await admin.from("google_indexing_log").insert(logRows);
      }

      const okCount = results.filter((r) => r.ok).length;
      return json(200, {
        ok: true,
        submitted: results.length,
        succeeded: okCount,
        failed: results.length - okCount,
        sitemap_ping: ping,
        results,
      });
    }

    return json(400, { error: `Unknown action: ${action}` });
  } catch (e: any) {
    console.error("google-indexing error:", e);
    return json(500, { error: e?.message || "Unknown error" });
  }
});
