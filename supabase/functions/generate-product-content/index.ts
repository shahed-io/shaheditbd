import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ─── Admin Auth Check ─────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: adminRole } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!adminRole) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  // ─────────────────────────────────────────────────────────────────────────

  try {
    const { productName, category, brand, productType, price, duration, durationPlans, accountType, subtitle, type, demoDescription, count } = await req.json();

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

    // Build enriched product context
    const durationInfo = durationPlans || duration || "Lifetime";
    const accountInfo = accountType ? `Account Type: ${accountType}` : "";
    const subtitleInfo = subtitle ? `Subtitle: ${subtitle}` : "";

    // ── Bangladesh SEO keyword strategy ─────────────────────────────────────
    // Core intent: rank #1 on Google Bangladesh for product-related searches
    // Strategy: Bangla + English mix, city-level coverage, price in BDT,
    //           intent keywords (কিনুন, সস্তা, অফার, ডিসকাউন্ট, বাংলাদেশে),
    //           brand + "bangladesh" long-tail, semantic LSI keywords
    const bdCities = "ঢাকা, চট্টগ্রাম, সিলেট, রাজশাহী, খুলনা, বরিশাল, ময়মনসিংহ, কুমিল্লা";
    const bdSeoContext = `
TARGET MARKET: Bangladesh (বাংলাদেশ)
TARGET CITIES: ${bdCities}
LANGUAGE MIX: Bangla (বাংলা) + English brand names — exactly like how Bangladeshi users search Google.
KEYWORD INTENT TYPES to include naturally:
  - Informational: "[product] কী", "[product] কিভাবে কিনবেন"
  - Transactional: "[product] কিনুন বাংলাদেশ", "[product] buy bangladesh", "[product] price bd"
  - Commercial: "[product] সেরা দাম", "[product] সবচেয়ে কম দাম", "সস্তায় [product]"
  - Local: "[product] ঢাকা", "[product] bangladesh online shop"
PRICE FORMAT: Always write price as ৳[amount] (Taka symbol)
TRUST SIGNALS: "১০০% genuine", "instant delivery", "official license", "নিরাপদ পেমেন্ট"`;

    if (type === "short_description") {
      const numOptions = count && count > 1 ? count : 1;
      systemPrompt = `You are a product copywriter for Shahed Store — Bangladesh's top digital software shop. Write compelling short product descriptions in Bangla-English mix optimized for Bangladesh Google search ranking.

${bdSeoContext}

Return ONLY plain text, no JSON, no markdown, max 1–2 sentences per option.${numOptions > 1 ? ` Generate exactly ${numOptions} different options, each on a new line, prefixed with the number like: 1. ... 2. ... 3. ...` : ""}

CRITICAL PUNCTUATION RULE: After any English word, number, or alphanumeric content, ALWAYS use English period (.) not Bengali danda (।). Only use । at the end of purely Bengali sentences.`;

      const ctx = [
        productName,
        subtitleInfo,
        brand && `Brand: ${brand}`,
        category && `Category: ${category}`,
        productType && `Type: ${productType}`,
        accountInfo,
        durationInfo !== "Lifetime" && `Plans: ${durationInfo}`,
        price && `Price: ৳${price}`,
      ].filter(Boolean).join(", ");

      userPrompt = numOptions > 1
        ? `Write ${numOptions} different short product descriptions (1-2 sentences each, Bangla-English mix, Bangladesh-SEO optimized) for: ${ctx}. Include price in BDT and at least one buying intent keyword (কিনুন/buy/সেরা দাম). Number them 1. 2. 3.`
        : `Write a short product description (1-2 sentences, Bangla-English mix, Bangladesh SEO-optimized) for: ${ctx}. Include price in BDT and a buying intent keyword.`;

    } else if (type === "description") {
      maxTokens = 2800;
      systemPrompt = `You are an expert eCommerce SEO content writer for Shahed Store — a certified Digital E-commerce Platform, officially registered under the Ministry of Commerce, People's Republic of Bangladesh (DBID: 586772174).

${bdSeoContext}

Write a professional, high-converting, SEO-optimized product description using Bangla + simple English mix. Mobile-friendly formatting. Use emojis sparingly.

STRICT SEO STRUCTURE — follow exactly in this order:
1. ## 🛍️ [Product Title] — include main keyword in title
2. ### 📦 পণ্য পরিচিতি (Product Overview)
   - 2-3 engaging sentences in Bangla-English mix
   - Include primary keyword + "বাংলাদেশ" naturally
3. ### ✅ মূল বৈশিষ্ট্য (Key Features)
   - 5-7 bullet points — feature-rich, include technical specs
4. ### 💡 কেন কিনবেন? (Why Buy?)
   - 3-5 bullets — benefits + trust signals + Bangladesh context
5. ### 💰 মূল্য ও প্ল্যান (Pricing & Plans)
   - List ALL duration plans with BDT prices clearly
   - Mention Personal/Shared/account type if provided
   - Include "সেরা দাম", "সাশ্রয়ী মূল্য" naturally
6. ### 🔍 SEO কীওয়ার্ড সেকশন (for Google Bangladesh)
   - 2-3 sentences with 4-6 strategic keywords naturally embedded
   - Include: [product name] বাংলাদেশ, [product] কিনুন, [product] price bd, [product] সেরা দাম
   - Mention at least 2 major cities from: ${bdCities}
7. ### 🏪 কেন Shahed Store? (Why Choose Us?)
   - 3-4 trust points: genuine license, instant delivery, 24/7 support, secure payment
8. ### 🚀 এখনই কিনুন (Call To Action)
   - 1-2 action-oriented lines with urgency

--- FOOTER (ALWAYS AT THE VERY END — copy this block EXACTLY, do NOT translate or alter) ---
9. ### ⚠️ Important Notes

❌ Sold Products Are Not Returnable.

🛒 The product will be delivered instantly or within 1 hours (Rare cases: up to 24 hours)

❌ Any of our products are requested to be activated within two days maximum. Otherwise the warranty will be void.

CRITICAL PUNCTUATION RULE: After any English word, number, or alphanumeric content, ALWAYS use English period (.) not Bengali danda (।). Only use । at the end of purely Bengali sentences.

Return ONLY the formatted markdown text. No JSON. No extra commentary.`;

      userPrompt = `Generate the full SEO-optimized product description for Bangladesh Google ranking:
- Product Name: ${productName}${subtitle ? `\n- Subtitle: ${subtitle}` : ""}
- Category: ${category || "Software"}
- Type: ${productType || brand || "Digital"}${accountType ? `\n- Account Type: ${accountType} (Personal / Shared — mention this clearly)` : ""}
- Pricing Plans: ${durationInfo}
- Base Price: ${price ? `৳${price}` : "See plans"}

IMPORTANT: 
1. In the Pricing section, list ALL duration plans with their exact BDT prices.
2. In the SEO section, include these keyword patterns naturally: "${productName} বাংলাদেশ", "${productName} কিনুন", "${productName} price in Bangladesh", "সস্তায় ${productName}".
3. The footer with DBID and Important Notes MUST be the very last section.`;

    } else if (type === "seo") {
      systemPrompt = `You are a Bangladesh Google SEO expert for a digital software store. Return ONLY valid JSON in this exact format: {"seo_title": "...", "seo_description": "..."}.

No markdown, no extra text.
RULES:
- seo_title: max 60 chars. Format: "[Product Name] কিনুন | সেরা দাম | Shahed Store" OR "[Product Name] – Buy at ৳[price] | Shahed Store BD". Include main keyword + Bangladesh/BD signal.
- seo_description: max 160 chars. Bangla-English mix. Must include: price in ৳, one action word (কিনুন/Buy), "Bangladesh" or "বাংলাদেশ", trust signal (genuine/original/100% original).
- Write naturally like a Bangladeshi user would search.`;

      const ctx = [
        productName,
        brand && `Brand: ${brand}`,
        category && `Category: ${category}`,
        productType && `Type: ${productType}`,
        accountType && `Account: ${accountType}`,
        price && `Price: ৳${price}`,
      ].filter(Boolean).join(", ");

      userPrompt = `Generate Bangladesh-SEO-optimized title and meta description for: ${ctx}. Pricing: ${durationInfo}. 
SEO Title must include product name + buying intent + "Shahed Store" (max 60 chars).
Meta Description must include price in ৳, Bangladesh/বাংলাদেশ, and "genuine/original/অরিজিনাল" (max 160 chars).`;

    } else if (type === "all") {
      maxTokens = 2800;
      systemPrompt = `You are a product copywriter and Bangladesh SEO expert for Shahed Store (DBID: 586772174) — Bangladesh's #1 digital software shop.

${bdSeoContext}

Return ONLY valid JSON in this exact format:
{
  "short_description": "1-2 sentences in Bangla-English mix with BDT price and buying intent",
  "description": "full markdown formatted description following the 9-section Bangladesh SEO structure",
  "seo_title": "max 60 chars — product keyword + Bangladesh signal + Shahed Store",
  "seo_description": "max 160 chars — Bangla-English, price in ৳, buying intent, Bangladesh/বাংলাদেশ, trust signal"
}

For the description field, follow this exact structure:
1. ## 🛍️ [Product Title with main keyword]
2. ### 📦 পণ্য পরিচিতি (Product Overview)
3. ### ✅ মূল বৈশিষ্ট্য (Key Features — bullets)
4. ### 💡 কেন কিনবেন? (Benefits — bullets)
5. ### 💰 মূল্য ও প্ল্যান (Pricing — all plans with ৳ prices, Personal/Shared if given)
6. ### 🔍 SEO কীওয়ার্ড সেকশন (2-3 sentences, Bangladesh keywords, 2+ cities)
7. ### 🏪 কেন Shahed Store? (3-4 trust points)
8. ### 🚀 এখনই কিনুন (Call To Action)
9. ### ⚠️ গুরুত্বপূর্ণ তথ্য (Important Notes — ALWAYS LAST — DBID 586772174, non-refundable, activate within 2 days)

CRITICAL PUNCTUATION RULE: After any English word, number, or alphanumeric content, ALWAYS use English period (.) not Bengali danda (।). Only use । at the end of purely Bengali sentences.

No markdown outside the JSON string values. Escape newlines as \\n in the JSON.`;

      userPrompt = `Generate complete Bangladesh-SEO-optimized product content for:
- Product Name: ${productName}${subtitle ? `\n- Subtitle: ${subtitle}` : ""}
- Category: ${category || "Software"}
- Type: ${productType || brand || "Digital"}${accountType ? `\n- Account Type: ${accountType}` : ""}
- Pricing Plans: ${durationInfo}
- Base Price: ${price ? `৳${price}` : "See plans"}

SEO title: include "${productName}" + "বাংলাদেশ" or "BD" + "Shahed Store" within 60 chars.
SEO description: include price in ৳, "বাংলাদেশ", "অরিজিনাল/genuine", buying intent word within 160 chars.
In description's SEO section: include these naturally: "${productName} বাংলাদেশ", "${productName} কিনুন ঢাকা", "${productName} price bd".`;

    } else if (type === "demo_style") {
      if (!demoDescription) {
        return new Response(JSON.stringify({ error: "demoDescription is required for demo_style type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      maxTokens = 3000;
      systemPrompt = `You are an expert eCommerce SEO content writer for Shahed Store (DBID: 586772174) — Bangladesh's #1 digital software shop.

${bdSeoContext}

The user provides a DEMO/SAMPLE description as reference. You MUST:
1. Analyze the demo — tone, language mix (Bangla/English), structure, formatting, emojis, section headers, writing style.
2. Write a brand NEW description for the new product following the EXACT SAME style, format, structure, and tone as the demo.
3. Replace all product-specific details (name, features, pricing, plans, account type) with the new product's details.
4. Maintain Bangladesh SEO optimization: include product keywords + "বাংলাদেশ", BDT prices, buying intent words.
5. Keep the same section count — if demo has 8 sections, new one should also have 8 sections.
6. Always end with the Important Notes footer:
   ### ⚠️ গুরুত্বপূর্ণ তথ্য (Important Notes)
   🔐 আমরা একটি সার্টিফাইড ডিজিটাল ই-কমার্স প্ল্যাটফর্ম, বাণিজ্য মন্ত্রণালয়, গণপ্রজাতন্ত্রী বাংলাদেশ কর্তৃক নিবন্ধিত।
   Our DBID Number: 586772174 — ensuring secure and authentic digital product delivery.
   ❌ বিক্রিত পণ্য ফেরতযোগ্য নয়।
   ❌ কেনার ২ দিনের মধ্যে পণ্য সক্রিয় করুন।
   ⚠️ নির্ধারিত সময়ের মধ্যে সক্রিয় না করলে ওয়ারেন্টি বা সাপোর্ট বাতিল হতে পারে।

CRITICAL PUNCTUATION RULE: After any English word, number, or alphanumeric content, ALWAYS use English period (.) not Bengali danda (।). Only use । at the end of purely Bengali sentences.

Return ONLY the formatted markdown text matching the demo style. No JSON. No extra commentary.`;

      userPrompt = `=== DEMO DESCRIPTION (Reference Style — analyze and follow this format) ===
${demoDescription}

=== NEW PRODUCT DETAILS ===
- Product Name: ${productName}${subtitle ? `\n- Subtitle: ${subtitle}` : ""}
- Category: ${category || "Software"}
- Brand: ${brand || "Unknown"}
- Type: ${productType || "Digital"}${accountType ? `\n- Account Type: ${accountType} (mention Personal/Shared clearly)` : ""}
- Pricing Plans: ${durationInfo}
- Base Price: ${price ? `৳${price}` : "See plans"}

Now write the full description for the NEW PRODUCT following the EXACT SAME style and structure as the demo. Maintain Bangladesh SEO optimization with local keywords.`;

    } else {
      return new Response(JSON.stringify({ error: "Invalid type. Use: short_description, description, seo, all, or demo_style" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isJsonType = type === "seo" || type === "all";

    const requestBody: any = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.65,
      max_tokens: maxTokens,
    };

    if (isJsonType) {
      requestBody.response_format = { type: "json_object" };
    }

    // Try Lovable AI, then fallback to direct Gemini
    let content = "";
    const lovableResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (lovableResp.ok) {
      const data = await lovableResp.json();
      content = data.choices?.[0]?.message?.content || "";
    } else {
      console.warn(`Lovable AI failed (${lovableResp.status}); falling back to Gemini`);
      const { callAIWithFallback } = await import("../_shared/ai-fallback.ts");
      try {
        const { text } = await callAIWithFallback({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt + (isJsonType ? "\n\nReturn ONLY valid JSON, no markdown." : "") },
            { role: "user", content: userPrompt },
          ],
          maxTokens,
        });
        content = text;
      } catch (e) {
        return new Response(JSON.stringify({ error: "AI সাময়িকভাবে অনুপলব্ধ। পরে আবার চেষ্টা করুন।" }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (type === "short_description" || type === "description" || type === "demo_style") {
      return new Response(JSON.stringify({ result: content.trim() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // JSON types — robust multi-stage parsing
    let parsed: any;
    try {
      const cleaned = content
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          try {
            const fixed = match[0]
              .replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, "\\n")
              .replace(/[\x00-\x1F\x7F]/g, (c) => {
                if (c === "\n") return "\\n";
                if (c === "\r") return "\\r";
                if (c === "\t") return "\\t";
                return "";
              });
            parsed = JSON.parse(fixed);
          } catch {
            if (type === "all") {
              parsed = {
                short_description: "",
                description: content,
                seo_title: "",
                seo_description: "",
              };
            } else {
              throw new Error("Failed to parse AI response as JSON");
            }
          }
        }
      } else {
        if (type === "all") {
          parsed = {
            short_description: "",
            description: content,
            seo_title: "",
            seo_description: "",
          };
        } else {
          throw new Error("Failed to parse AI response as JSON");
        }
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
