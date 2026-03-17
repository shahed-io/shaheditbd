import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, category, brand, productType, price, duration, type } = await req.json();

    if (!productName) {
      return new Response(JSON.stringify({ error: "productName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";
    let maxTokens = 600;

    if (type === "short_description") {
      systemPrompt = "You are a product copywriter for a Bangladeshi digital software store called Shahed Store. Write compelling short product descriptions in Bangla-English mix. Return ONLY plain text, no JSON, no markdown, max 1–2 sentences.";
      const ctx = [productName, brand && `Brand: ${brand}`, category && `Category: ${category}`, productType && `Type: ${productType}`].filter(Boolean).join(", ");
      userPrompt = `Write a short product description (1-2 sentences, Bangla-English mix) for: ${ctx}`;

    } else if (type === "description") {
      maxTokens = 2000;
      systemPrompt = `You are an expert eCommerce product description writer for Shahed Store — a certified Digital E-commerce Platform, officially registered under the Ministry of Commerce, People's Republic of Bangladesh (DBID: 586772174).

Write a professional, high-converting, SEO-friendly product description using Bangla + simple English mix. Use emojis sparingly. Mobile-friendly formatting.

STRICT STRUCTURE — follow exactly in this order:
1. ## 🛍️ [Product Title]
2. ### 📦 Product Overview  (2-3 engaging sentences in Bangla-English mix)
3. ### ✅ Key Features  (5-7 bullet points)
4. ### 💡 Benefits  (3-5 bullets — why user should buy)
5. ### 💰 Pricing  (Price, Duration, Type in a small table or bullets)
6. ### 🔍 SEO Paragraph  (Bangladesh-targeted keywords, 2-3 sentences)
7. ### 🏪 Why Choose Shahed Store  (3-4 trust points)
8. ### 🚀 Call To Action  (1-2 lines, action-oriented)

--- FOOTER (ALWAYS AT THE VERY END, never in the middle) ---
9. ### ⚠️ Important Notes
🔐 We are a certified Digital E-commerce Platform, officially registered under the Ministry of Commerce, People's Republic of Bangladesh.
Our DBID Number: 586772174 — ensuring secure and authentic digital product delivery.
❌ Sold products are non-refundable
❌ Activate your product within 2 days of purchase
⚠️ Delayed activation may void warranty or support

Return ONLY the formatted markdown text. No JSON. No extra commentary.`;

      userPrompt = `Generate the full product description for:
- Product Name: ${productName}
- Category: ${category || "Software"}
- Type: ${productType || brand || "Digital"}
- Duration: ${duration || "Lifetime"}
- Price: ${price ? `৳${price}` : "Contact for price"}

Follow the exact structure from the system prompt. The footer with DBID and Important Notes MUST be the last section.`;

    } else if (type === "seo") {
      systemPrompt = "You are an SEO expert for a digital software store in Bangladesh. Return ONLY valid JSON in this exact format: {\"seo_title\": \"...\", \"seo_description\": \"...\"}. No markdown, no extra text. seo_title max 60 chars, seo_description max 160 chars. Write in Bengali/বাংলা mixed with English product names.";
      const ctx = [productName, brand && `Brand: ${brand}`, category && `Category: ${category}`, productType && `Type: ${productType}`].filter(Boolean).join(", ");
      userPrompt = `Generate SEO title and meta description for this digital product: ${ctx}. Rules: seo_title must be under 60 chars, seo_description must be under 160 chars, include primary keyword naturally.`;

    } else if (type === "all") {
      maxTokens = 2400;
      systemPrompt = `You are a product copywriter and SEO expert for Shahed Store — a certified Bangladeshi Digital E-commerce Platform (DBID: 586772174).

Return ONLY valid JSON in this exact format:
{
  "short_description": "1-2 sentences in Bangla-English mix",
  "description": "full markdown formatted description following the 9-section structure below",
  "seo_title": "max 60 chars",
  "seo_description": "max 160 chars"
}

For the description field, follow this exact structure:
1. ## 🛍️ [Product Title]
2. ### 📦 Product Overview
3. ### ✅ Key Features (bullets)
4. ### 💡 Benefits (bullets)
5. ### 💰 Pricing
6. ### 🔍 SEO Paragraph
7. ### 🏪 Why Choose Shahed Store
8. ### 🚀 Call To Action
9. ### ⚠️ Important Notes (ALWAYS LAST — include DBID 586772174, non-refundable policy, activate within 2 days)

No markdown outside the JSON string values. Escape newlines as \\n in the JSON.`;

      userPrompt = `Generate complete product content for:
- Product Name: ${productName}
- Category: ${category || "Software"}
- Type: ${productType || brand || "Digital"}
- Duration: ${duration || "Lifetime"}
- Price: ${price ? `৳${price}` : "Contact for price"}`;

    } else {
      return new Response(JSON.stringify({ error: "Invalid type. Use: short_description, description, seo, or all" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      throw new Error(`AI gateway error [${response.status}]: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Plain text types
    if (type === "short_description" || type === "description") {
      return new Response(JSON.stringify({ result: content.trim() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // JSON types — parse safely
    let parsed: any;
    try {
      const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          throw new Error("Failed to parse AI response as JSON");
        }
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("generate-product-content error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, category, brand, productType, type } = await req.json();

    if (!productName) {
      return new Response(JSON.stringify({ error: "productName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const context = [
      productName,
      brand ? `Brand: ${brand}` : null,
      category ? `Category: ${category}` : null,
      productType ? `Type: ${productType}` : null,
    ].filter(Boolean).join(", ");

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "short_description") {
      systemPrompt = "You are a product copywriter for a Bangladeshi digital software store called Shahed Store. Write compelling short product descriptions in Bangla (Bengali). Return ONLY plain text, no JSON, no markdown, max 1–2 sentences.";
      userPrompt = `Write a short product description (1-2 sentences, in Bengali/বাংলা) for: ${context}`;
    } else if (type === "description") {
      systemPrompt = "You are a product copywriter for a Bangladeshi digital software store called Shahed Store. Write detailed product descriptions in Bangla (Bengali). Return ONLY plain text, no JSON, no markdown, 3–5 sentences.";
      userPrompt = `Write a detailed product description (3–5 sentences, in Bengali/বাংলা) for: ${context}. Include key features, benefits, and what the customer gets.`;
    } else if (type === "seo") {
      systemPrompt = "You are an SEO expert for a digital software store in Bangladesh. Return ONLY valid JSON in this exact format: {\"seo_title\": \"...\", \"seo_description\": \"...\"}. No markdown, no extra text. seo_title max 60 chars, seo_description max 160 chars. Write in Bengali/বাংলা mixed with English product names.";
      userPrompt = `Generate SEO title and meta description for this digital product: ${context}. Rules: seo_title must be under 60 chars, seo_description must be under 160 chars, include primary keyword naturally.`;
    } else if (type === "all") {
      systemPrompt = "You are a product copywriter and SEO expert for a Bangladeshi digital software store called Shahed Store. Return ONLY valid JSON in this exact format: {\"short_description\": \"...\", \"description\": \"...\", \"seo_title\": \"...\", \"seo_description\": \"...\"}. No markdown, no extra text. Write short_description and description in Bengali/বাংলা. seo_title max 60 chars, seo_description max 160 chars.";
      userPrompt = `Generate product content for: ${context}. 
- short_description: 1-2 sentences in Bengali about the product
- description: 3-5 sentences in Bengali with features and benefits  
- seo_title: max 60 chars, Bengali + English product name
- seo_description: max 160 chars Bengali meta description`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid type. Use: short_description, description, seo, or all" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      throw new Error(`AI gateway error [${response.status}]: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // For plain text types
    if (type === "short_description" || type === "description") {
      return new Response(JSON.stringify({ result: content.trim() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For JSON types — parse safely
    let parsed: any;
    try {
      // Remove potential markdown code blocks
      const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Try to extract JSON from response
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("generate-product-content error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
