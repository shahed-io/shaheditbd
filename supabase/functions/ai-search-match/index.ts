// AI-powered fuzzy product search.
// Input:  { query: string, products: [{ id, name, category? }] }
// Output: { matchedIds: string[], correctedQuery?: string, keywords?: string[] }
//
// Uses Gemini (via shared fallback helper) to interpret misspellings,
// shortcuts, Bangla/English mixed input, and synonyms, returning the best
// matching product IDs from the provided catalog.

import { callAIWithFallback } from "../_shared/ai-fallback.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ProductLite { id: string; name: string; category?: string | null }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const query: string = (body?.query || "").toString().trim().slice(0, 200);
    const products: ProductLite[] = Array.isArray(body?.products) ? body.products : [];

    if (!query || products.length === 0) {
      return new Response(JSON.stringify({ matchedIds: [], correctedQuery: query }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Trim catalog to keep prompt small
    const catalog = products.slice(0, 400).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category || undefined,
    }));

    const system = `You are a smart product search assistant for a Bangladeshi digital software store.
Given a user's possibly misspelled / shortcut / mixed-language (Bangla + English) search query and a JSON catalog of products,
return the most relevant products. Handle:
- typos (e.g. "ofice" → "Office", "windws" → "Windows", "nflx" → "Netflix")
- shortcuts ("win 11" → "Windows 11", "ms office" → "Microsoft Office")
- synonyms ("antivirus" → "Kaspersky", "Norton", "Bitdefender")
- Bangla/English mix ("উইন্ডোজ" → "Windows", "নেটফ্লিক্স" → "Netflix")
- partial / vague queries
Pick ONLY products that genuinely relate to what the user likely wants.
Return STRICT JSON. No markdown, no commentary.`;

    const user = `User query: "${query}"

Catalog (JSON array of {id, name, category?}):
${JSON.stringify(catalog)}

Return STRICT JSON of this shape:
{
  "correctedQuery": "best-guess corrected/expanded query in same language",
  "keywords": ["keyword1", "keyword2"],
  "matchedIds": ["product-id-1", "product-id-2", ...]
}

Order matchedIds by relevance, max 12. If nothing relates, return matchedIds: [].`;

    const result = await callAIWithFallback({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      maxTokens: 800,
    });

    // Extract first JSON block from the response
    let parsed: any = {};
    try {
      const text = result.text.trim();
      const m = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(m ? m[0] : text);
    } catch {
      parsed = {};
    }

    const validIds = new Set(products.map((p) => p.id));
    const matchedIds: string[] = Array.isArray(parsed.matchedIds)
      ? parsed.matchedIds.filter((id: any) => typeof id === "string" && validIds.has(id)).slice(0, 12)
      : [];

    return new Response(
      JSON.stringify({
        matchedIds,
        correctedQuery: typeof parsed.correctedQuery === "string" ? parsed.correctedQuery : query,
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 8) : [],
        provider: result.provider,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("ai-search-match error:", e);
    return new Response(
      JSON.stringify({ matchedIds: [], error: e instanceof Error ? e.message : String(e) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
