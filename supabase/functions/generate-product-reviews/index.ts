import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAIWithFallback } from "../_shared/ai-fallback.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      product,
      count = 8,
      language = "bn",
      ratingMin = 4,
      ratingMax = 5,
    } = await req.json();
    if (!product?.name) throw new Error("product.name required");

    const storeName = language === "en" ? "Shahed Store" : "শাহেদ স্টোর";
    const lang = language === "en" ? "English" : "Bengali (বাংলা)";
    const nameRule = language === "en"
      ? `The store name must be exactly "Shahed Store". Never write Shahid Store, Sahed Store, or ShahedStore.`
      : `দোকানের নাম সবসময় হুবহু "শাহেদ স্টোর" লিখবে। কখনো "Shahed Store", "ShahedStore", "Shahid Store", "শাহিদ স্টোর", "সাহেদ স্টোর" বা অন্য কোনো ভুল বানান লিখবে না।`;
    const prompt = `You are writing authentic customer reviews for "${storeName}", a digital software store in Bangladesh.

${nameRule}

Generate exactly ${count} realistic, diverse, Google-ranking-friendly customer reviews for the product below.

Guidelines:
- Write reviews in ${lang} only. Use natural everyday tone (not promotional).
- Mix short (1 sentence) and medium (2-3 sentence) reviews.
- Each review must feel like a real Bangladeshi customer wrote it.
- Vary writing style, vocabulary, and focus (delivery speed, activation, price, support, product quality).
- Rating between ${ratingMin} and ${ratingMax} stars. Most should be 5, some 4.
- Use realistic Bangladeshi names (first name + last name). Mix male/female.
- Avoid repeated phrases. Avoid generic words like "good product".
- Include relevant product keywords naturally for SEO.
- Title must be short (3-7 words), catchy.
- Do NOT use markdown, emojis, or hashtags.

Product:
- Name: ${product.name}
- Category: ${product.category || "Digital Product"}
- Price: ৳${product.price || "N/A"}
- Description: ${(product.description || product.short_description || "").slice(0, 600)}
- Delivery time: ${product.delivery_time || "1-24 hours"}

Return ONLY a valid JSON array, no prose, no code fences. Schema:
[{"name":"Full Name","rating":5,"title":"Short title","body":"Review text"}, ...]`;

    const { text } = await callAIWithFallback({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You output ONLY valid JSON arrays. No markdown, no prose." },
        { role: "user", content: prompt },
      ],
    });

    let jsonStr = text.trim();
    const fenced = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) jsonStr = fenced[1].trim();
    const start = jsonStr.indexOf("[");
    const end = jsonStr.lastIndexOf("]");
    if (start >= 0 && end > start) jsonStr = jsonStr.slice(start, end + 1);

    let reviews: { name: string; rating: number; title: string; body: string }[] = [];
    try {
      reviews = JSON.parse(jsonStr);
    } catch {
      throw new Error("AI did not return valid JSON");
    }

    const sanitizeStoreName = (value: string) => {
      let out = value;
      if (language !== "en") {
        out = out
          .replace(/Shahed\s+Store(?:'|’)s/gi, "শাহেদ স্টোর-এর")
          .replace(/Shahed\s+Store/gi, "শাহেদ স্টোর")
          .replace(/ShahedStore/g, "শাহেদ স্টোর");
      } else {
        out = out.replace(/ShahedStore/g, "Shahed Store");
      }
      return out
        .replace(/Shahid\s*Store|Sahed\s*Store|Shawon\s*Store/gi, storeName)
        .replace(/শাহিদ স্টোর|শাওন স্টোর|শায়েদ স্টোর|শায়েদ স্টোর|সাহেদ স্টোর|সাহিদ স্টোর|শাহীদ স্টোর|শহীদ স্টোর|শাহেদ ষ্টোর|শাহেদ ইস্টোর/g, storeName);
    };

    reviews = (reviews || [])
      .filter((r) => r && typeof r.name === "string" && typeof r.body === "string" && r.name.trim() && r.body.trim())
      .map((r) => ({
        name: r.name.trim().slice(0, 80),
        rating: Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5))),
        title: sanitizeStoreName((r.title || "").toString().trim()).slice(0, 120),
        body: sanitizeStoreName(r.body.trim()).slice(0, 1000),
      }));

    if (!reviews.length) throw new Error("No reviews generated");

    return new Response(JSON.stringify({ reviews }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-product-reviews error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
