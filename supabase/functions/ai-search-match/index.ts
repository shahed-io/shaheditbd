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
    const catalog = products.slice(0, 600).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category || undefined,
    }));

    const system = `You are an EXTREMELY forgiving fuzzy product search assistant for a Bangladeshi digital software store (Shahed Store).
Your #1 goal: NEVER return an empty list if there's even a remotely related product. Always suggest something useful.

Handle aggressively:
- Heavy typos & misspellings (e.g. "ofice" → "Office", "windws"/"windoss"/"winddoz" → "Windows", "nflx"/"netflics"/"netflex" → "Netflix", "adoby"/"adobi" → "Adobe", "kasperky"/"kasparsky" → "Kaspersky")
- Phonetic / Banglish typing ("ofish", "officeh", "neetflix", "uindoj", "addobi", "anti virus", "vipien")
- Shortcuts & abbreviations ("win 11" → "Windows 11", "ms office" → "Microsoft Office", "o365" → "Office 365", "av" → "antivirus")
- Synonyms & categories ("antivirus" → all antivirus products like Kaspersky, Norton, Bitdefender, McAfee, ESET; "vpn" → all VPN products; "design software" → Adobe, Canva)
- Bangla / English mix ("উইন্ডোজ" → "Windows", "নেটফ্লিক্স" → "Netflix", "অফিস" → "Office", "অ্যান্টিভাইরাস" → "antivirus")
- Partial words ("net" → Netflix, "win" → Windows, "off" → Office)
- Vague / category queries ("movie" → Netflix, Prime; "music" → Spotify, YouTube Premium; "ai" → ChatGPT, Gemini)
- Brand-only queries — return ALL products from that brand
- If query is gibberish but contains a recognizable substring, still match on that substring

CRITICAL: If the query has even partial similarity to anything in the catalog, INCLUDE IT. Be generous, not strict.
Return STRICT JSON. No markdown, no commentary.`;

    const user = `User query: "${query}"

Catalog (JSON array of {id, name, category?}):
${JSON.stringify(catalog)}

Return STRICT JSON of this shape:
{
  "correctedQuery": "best-guess corrected/expanded query in English (e.g. 'Microsoft Office' for 'ofice')",
  "didYouMean": "user-facing suggestion if the original query had a clear typo, else empty string",
  "keywords": ["keyword1", "keyword2"],
  "matchedIds": ["product-id-1", "product-id-2", ...]
}

Order matchedIds by relevance, max 16. Always try to return at least 3-6 ids if anything in the catalog is even loosely related.
Return matchedIds: [] ONLY if the catalog has absolutely nothing remotely related (e.g. user searches "pizza" in a software store).`;

    const result = await callAIWithFallback({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      maxTokens: 1200,
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
      ? parsed.matchedIds.filter((id: any) => typeof id === "string" && validIds.has(id)).slice(0, 16)
      : [];

    return new Response(
      JSON.stringify({
        matchedIds,
        correctedQuery: typeof parsed.correctedQuery === "string" ? parsed.correctedQuery : query,
        didYouMean: typeof parsed.didYouMean === "string" ? parsed.didYouMean : "",
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
