import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAIWithFallback } from "../_shared/ai-fallback.ts";
import { normalizeBrandNameText } from "../_shared/brand-name.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, count = 8, language = "bn" } = await req.json();
    if (!product?.name) throw new Error("product.name required");

    // Enforce correct store name based on language — never let AI invent variants
    const storeName = "Shahed Store";
    const lang = language === "en" ? "English" : "Bengali (বাংলা)";
    const nameRule = `CRITICAL STORE NAME RULE: The store name must ALWAYS be written in English as exactly "Shahed Store" — even when the surrounding text is Bengali. Never use Bengali script for the name (no "শাহেদ স্টোর", "শাহিদ স্টোর", "সাহেদ স্টোর", etc.) and never use variants like "ShahedStore", "Shahid Store", "Sahed Store", "Shawon Store". Do not attach Bengali case markers/suffixes immediately after the brand (avoid "Shahed Store-এর", "Shahed Store এর", "Shahed Store কে", "Shahed Store-এ", "Shahed Storeএ"); rephrase so the visible brand stays exactly "Shahed Store".`;
    const prompt = `You are an expert SEO copywriter for "${storeName}", a digital software store in Bangladesh.

${nameRule}

Generate exactly ${count} high-quality, Google-ranking-friendly FAQs for the product below. Mix product-specific questions (features, activation, devices, delivery, warranty, refund) and store-trust questions (about ${storeName}, payment safety, support).

Write the questions and answers in ${lang}. Use natural, professional, conversational tone. Answers must be 2-4 sentences, specific, helpful, and include relevant keywords for SEO. Avoid generic filler. Do NOT use markdown.

Product:
- Name: ${product.name}
- Category: ${product.category || "Digital Product"}
- Price: ৳${product.price || "N/A"}
- Description: ${(product.description || product.short_description || "").slice(0, 800)}
- Delivery time: ${product.delivery_time || "1-24 hours"}

Return ONLY a valid JSON array, no prose, no code fences. Schema:
[{"q":"question text","a":"answer text"}, ...]`;

    const { text } = await callAIWithFallback({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You output ONLY valid JSON arrays. No markdown, no prose." },
        { role: "user", content: prompt },
      ],
    });

    // Extract JSON
    let jsonStr = text.trim();
    const fenced = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) jsonStr = fenced[1].trim();
    const start = jsonStr.indexOf("[");
    const end = jsonStr.lastIndexOf("]");
    if (start >= 0 && end > start) jsonStr = jsonStr.slice(start, end + 1);

    let faqs: { q: string; a: string }[] = [];
    try {
      faqs = JSON.parse(jsonStr);
    } catch {
      throw new Error("AI did not return valid JSON");
    }
    faqs = (faqs || [])
      .filter((f) => f && typeof f.q === "string" && typeof f.a === "string" && f.q.trim() && f.a.trim())
      .map((f) => ({ q: normalizeBrandNameText(f.q.trim()), a: normalizeBrandNameText(f.a.trim()) }));

    if (!faqs.length) throw new Error("No FAQs generated");

    return new Response(JSON.stringify({ faqs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-product-faqs error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
