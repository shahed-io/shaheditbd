// Google Search Console — Sitemaps & Indexing status (via connector gateway)
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_search_console";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    const GSC_KEY = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
    if (!GSC_KEY) throw new Error("GOOGLE_SEARCH_CONSOLE_API_KEY is not configured");

    const body = await req.json().catch(() => ({}));
    const siteUrl: string = body.siteUrl || "sc-domain:shahedstore.com.bd";

    const headers = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GSC_KEY,
    };

    // 1. List sites (verifies access)
    const sitesRes = await fetch(`${GATEWAY_URL}/webmasters/v3/sites`, { headers });
    const sitesJson = await sitesRes.json();
    if (!sitesRes.ok) {
      throw new Error(`Sites list failed [${sitesRes.status}]: ${JSON.stringify(sitesJson)}`);
    }
    const matched = (sitesJson.siteEntry || []).find((s: any) => s.siteUrl === siteUrl)
      || (sitesJson.siteEntry || []).find((s: any) => s.siteUrl?.includes("shahedstore"));
    const resolvedSiteUrl = matched?.siteUrl || siteUrl;

    // 2. List sitemaps for the site
    const smRes = await fetch(
      `${GATEWAY_URL}/webmasters/v3/sites/${encodeURIComponent(resolvedSiteUrl)}/sitemaps`,
      { headers },
    );
    const smJson = await smRes.json();
    if (!smRes.ok) {
      throw new Error(`Sitemaps list failed [${smRes.status}]: ${JSON.stringify(smJson)}`);
    }

    const sitemaps = (smJson.sitemap || []).map((sm: any) => {
      const webContent = (sm.contents || []).find((c: any) => c.type === "web") || sm.contents?.[0];
      return {
        path: sm.path,
        lastSubmitted: sm.lastSubmitted || null,
        lastDownloaded: sm.lastDownloaded || null,
        isPending: !!sm.isPending,
        isSitemapsIndex: !!sm.isSitemapsIndex,
        type: sm.type || "sitemap",
        errors: Number(sm.errors || 0),
        warnings: Number(sm.warnings || 0),
        submitted: Number(webContent?.submitted || 0),
        indexed: Number(webContent?.indexed || 0),
      };
    });

    // 3. Aggregate totals
    const totals = sitemaps.reduce(
      (acc: any, s: any) => ({
        sitemaps: acc.sitemaps + 1,
        submitted: acc.submitted + s.submitted,
        indexed: acc.indexed + s.indexed,
        errors: acc.errors + s.errors,
        warnings: acc.warnings + s.warnings,
      }),
      { sitemaps: 0, submitted: 0, indexed: 0, errors: 0, warnings: 0 },
    );

    const indexCoverage = totals.submitted > 0
      ? Math.round((totals.indexed / totals.submitted) * 100)
      : 0;

    return new Response(
      JSON.stringify({
        siteUrl: resolvedSiteUrl,
        sitemaps,
        totals: { ...totals, indexCoverage },
        availableSites: (sitesJson.siteEntry || []).map((s: any) => ({
          siteUrl: s.siteUrl,
          permissionLevel: s.permissionLevel,
        })),
        fetchedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
