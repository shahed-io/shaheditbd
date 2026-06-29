import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAIWithFallback } from "../_shared/ai-fallback.ts";

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
    const storeName = language === "en" ? "Shahed Store" : "শাহেদ স্টোর";
    const lang = language === "en" ? "English" : "Bengali (বাংলা)";
    const nameRule = language === "en"
      ? `CRITICAL: The store name is EXACTLY "Shahed Store" (English spelling). Never write it in Bengali, never use variants like "Shahid", "Sahed", "Shawon", etc.`
      : `গুরুত্বপূর্ণ নিয়ম: দোকানের নাম সবসময় হুবহু "শাহেদ স্টোর" লিখতে হবে। কখনোই "Shahed Store" (ইংরেজি), "ShahedStore", "Shahid Store", "Sahed Store", "শাহিদ স্টোর", "শাওন স্টোর", "শায়েদ স্টোর", "সাহেদ স্টোর", "সাহিদ স্টোর", "শাহেদ ষ্টোর" বা অন্য কোনো রূপ ব্যবহার করা যাবে না।`;
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
    const sanitizeName = (s: string) => {
      let out = s;
      if (language !== "en") {
        out = out
          .replace(/Shahed\s+Store(?:'|’)s/gi, "শাহেদ স্টোর-এর")
          .replace(/Shahed\s+Store\s+Bangladesh/gi, "শাহেদ স্টোর বাংলাদেশ")
          .replace(/Shahed\s+Store\s+BD/gi, "শাহেদ স্টোর BD")
          .replace(/Shahed\s+Store/gi, "শাহেদ স্টোর")
          .replace(/ShahedStore/g, "শাহেদ স্টোর")
          .replace(/Shahid\s*Store/gi, "শাহেদ স্টোর")
          .replace(/Sahed\s*Store/gi, "শাহেদ স্টোর")
          .replace(/Shawon\s*Store/gi, "শাহেদ স্টোর");
      } else {
        out = out
          .replace(/Shahid\s*Store/gi, storeName)
          .replace(/Sahed\s*Store/gi, storeName)
          .replace(/Shawon\s*Store/gi, storeName);
      }
      const wrongVariants = [
        "শাহিদ স্টোর", "শাওন স্টোর", "শায়েদ স্টোর", "শায়েদ স্টোর", "সাহেদ স্টোর",
        "সাহিদ স্টোর", "শাহীদ স্টোর", "শহীদ স্টোর", "শাহেদ ষ্টোর", "শাহেদ ইস্টোর",
      ];
      for (const v of wrongVariants) out = out.split(v).join(storeName);
      return out;
    };
    faqs = (faqs || [])
      .filter((f) => f && typeof f.q === "string" && typeof f.a === "string" && f.q.trim() && f.a.trim())
      .map((f) => ({ q: sanitizeName(f.q.trim()), a: sanitizeName(f.a.trim()) }));

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
