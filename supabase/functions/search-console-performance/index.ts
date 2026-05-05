// Google Search Console Performance API - last 28 days
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

// Build a JWT signed with the service account RS256 key
async function getAccessToken(saJson: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: saJson.client_email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  const enc = (o: any) =>
    btoa(JSON.stringify(o)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsigned = `${enc(header)}.${enc(claim)}`;

  // Import private key
  const pem = saJson.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const jwt = `${unsigned}.${sig}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const tok = await tokenRes.json();
  if (!tok.access_token) throw new Error(`Token error: ${JSON.stringify(tok)}`);
  return tok.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const saRaw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (!saRaw) {
      return new Response(JSON.stringify({ error: "GOOGLE_SERVICE_ACCOUNT_JSON not configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const saJson = JSON.parse(saRaw);

    const { siteUrl = "sc-domain:shahedstore.com.bd", days = 28 } = await req.json().catch(() => ({}));

    const token = await getAccessToken(saJson);

    const end = new Date();
    const start = new Date(Date.now() - days * 86400000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const apiUrl = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;

    // Totals
    const totalsRes = await fetch(apiUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: fmt(start), endDate: fmt(end), dimensions: [] }),
    });
    const totalsJson = await totalsRes.json();
    if (!totalsRes.ok) throw new Error(`GSC error: ${JSON.stringify(totalsJson)}`);

    // Daily series
    const dailyRes = await fetch(apiUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: fmt(start), endDate: fmt(end), dimensions: ["date"] }),
    });
    const dailyJson = await dailyRes.json();

    // Top queries
    const queriesRes = await fetch(apiUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: fmt(start), endDate: fmt(end), dimensions: ["query"], rowLimit: 10 }),
    });
    const queriesJson = await queriesRes.json();

    // Top pages
    const pagesRes = await fetch(apiUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: fmt(start), endDate: fmt(end), dimensions: ["page"], rowLimit: 10 }),
    });
    const pagesJson = await pagesRes.json();

    const t = totalsJson.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };

    return new Response(JSON.stringify({
      siteUrl,
      days,
      totals: {
        clicks: t.clicks || 0,
        impressions: t.impressions || 0,
        ctr: t.ctr || 0,
        position: t.position || 0,
      },
      daily: (dailyJson.rows || []).map((r: any) => ({
        date: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position,
      })),
      topQueries: (queriesJson.rows || []).map((r: any) => ({
        query: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position,
      })),
      topPages: (pagesJson.rows || []).map((r: any) => ({
        page: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position,
      })),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
