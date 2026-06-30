import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STORE_NAME_BN = "Shahed Store";

function sanitizeStoreName(value: string): string {
  return value
    .replace(/Shahed\s+Store(?:'|’)s/gi, "Shahed Store")
    .replace(/Shahed\s+Store\s+Bangladesh/gi, "Shahed Store Bangladesh")
    .replace(/Shahed\s+Store\s+BD/gi, "Shahed Store BD")
    .replace(/Shahed\s+Store/gi, STORE_NAME_BN)
    .replace(/ShahedStore/g, STORE_NAME_BN)
    .replace(/Shahid\s*Store/gi, STORE_NAME_BN)
    .replace(/Sahed\s*Store/gi, STORE_NAME_BN)
    .replace(/Shawon\s*Store/gi, STORE_NAME_BN)
    .replace(/শাহিদ স্টোর|শাওন স্টোর|শায়েদ স্টোর|শায়েদ স্টোর|সাহেদ স্টোর|সাহিদ স্টোর|শাহীদ স্টোর|শহীদ স্টোর|শাহেদ ষ্টোর|শাহেদ ইস্টোর/g, STORE_NAME_BN);
}

function sanitizeDeep<T>(value: T): T {
  if (typeof value === "string") return sanitizeStoreName(value) as T;
  if (Array.isArray(value)) return value.map((item) => sanitizeDeep(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeDeep(item)])) as T;
  }
  return value;
}

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
TRUST SIGNALS: "১০০% genuine", "instant delivery", "official license", "নিরাপদ পেমেন্ট"
STORE NAME RULE: Public Bengali/product content must write the store name exactly as "Shahed Store". Never output "Shahed Store", "ShahedStore", "Shahid Store", "শাহিদ স্টোর", "সাহেদ স্টোর", or any other variant.`;

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

CRITICAL — Bangladeshi users actually search Google in ENGLISH using patterns like:
  - "idm price in bd"
  - "windows 11 pro price in bangladesh"
  - "office 365 price bd"
  - "[product] price in bd" / "[product] price in bangladesh" / "[product] buy bd"
So the SEO title MUST contain one of these EXACT English patterns to rank.

RULES:
- seo_title: max 60 chars. MUST start with the short common product name (e.g. "IDM", "Windows 11 Pro", "Office 365") followed by "Price in BD" or "Price in Bangladesh". Then trust phrase. Example formats (pick best fit):
    * "IDM Price in BD ৳[price] | Lifetime Key | Shahed Store"
    * "Windows 11 Pro Price in Bangladesh – Buy Genuine Key"
    * "Office 365 Price in BD | Original License | Shahed Store"
  Use the SHORT common name (IDM, not "Internet Download Manager Lifetime Key").
- seo_description: max 160 chars. Bangla-English mix. MUST include: exact price in ৳, the phrase "price in BD" or "in Bangladesh", action word (কিনুন/Buy), trust signal (100% genuine/original/অরিজিনাল), instant delivery.
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

SEO Title MUST contain the SHORT product name + "Price in BD" or "Price in Bangladesh" (this is how BD users search Google). Max 60 chars.
Meta Description MUST include exact ৳ price, "price in BD"/"in Bangladesh", "100% genuine" or "অরিজিনাল", and "instant delivery". Max 160 chars.`;

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
9. ### ⚠️ Important Notes (ALWAYS LAST — copy this footer EXACTLY as below, do NOT translate)\n\n❌ Sold Products Are Not Returnable.\n\n🛒 The product will be delivered instantly or within 1 hours (Rare cases: up to 24 hours)\n\n❌ Any of our products are requested to be activated within two days maximum. Otherwise the warranty will be void.

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
6. Always end with this Important Notes footer (copy EXACTLY, do NOT translate or modify):
   ### ⚠️ Important Notes

   ❌ Sold Products Are Not Returnable.

   🛒 The product will be delivered instantly or within 1 hours (Rare cases: up to 24 hours)

   ❌ Any of our products are requested to be activated within two days maximum. Otherwise the warranty will be void.

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

    } else if (type === "rich_content") {
      // Long-form SEO-rich product body (700-1500 words) + structured FAQ array.
      // Used by the bulk Product Content Enrichment admin tool.
      maxTokens = 4500;
      systemPrompt = `You are a senior eCommerce SEO content strategist for Shahed Store (DBID: 586772174) — Bangladesh's #1 digital software shop.

${bdSeoContext}

GOAL: Produce a comprehensive, deeply SEO-optimized product page body (700–1500 words) plus 6–8 FAQ items, designed to rank #1 on Google Bangladesh and satisfy ChatGPT / Perplexity / Google AI Overview.

Return ONLY valid JSON in this EXACT shape (no markdown fences, no extra prose):
{
  "description": "FULL MARKDOWN BODY 700-1500 words — see structure below",
  "faq": [ { "q": "Question?", "a": "Detailed answer 2-4 sentences." }, ... 6 to 8 items ]
}

=== MANDATORY MARKDOWN STRUCTURE for the "description" field (in this exact order) ===

## 🛍️ [Product Title with primary keyword]

### 📦 পণ্য পরিচিতি (Product Overview)
3-4 engaging sentences in Bangla-English mix. Include primary keyword + "বাংলাদেশ" naturally. Establish what the product is and the core promise.

### ✅ মূল বৈশিষ্ট্য (Key Features)
8-12 bullet points covering technical specs, capabilities, supported platforms, account type, validity, security features, etc. Each bullet 1-2 sentences.

### 💡 কেন কিনবেন? (Benefits — Why You'll Love It)
6-8 bullet points focusing on USER OUTCOMES (time saved, money saved, productivity, learning, entertainment, peace of mind). NOT features — actual benefits.

### 🧭 ব্যবহার গাইড (Usage Guide / How To Use)
Step-by-step numbered list (5-8 steps) of how to purchase, receive, activate, and start using the product. Be specific to digital delivery on Shahed Store (order → instant license delivery → activation steps).

### ⚖️ তুলনা (Comparison — Why This Over Alternatives)
A short markdown table comparing this product against 2 common alternatives or the pirated/free version. Columns: Feature | This Product | Alternative 1 | Alternative 2. 5-7 rows covering price, genuineness, support, updates, security, warranty.

### 👥 কাদের জন্য (Who Should Buy This)
4-6 bullet points describing ideal buyer personas — students, freelancers, businesses, content creators, gamers, etc. — and the specific scenario each persona benefits from.

### 💰 মূল্য ও প্ল্যান (Pricing & Plans)
List ALL duration plans with exact BDT prices clearly. Mention Personal/Shared/account type. Use "সেরা দাম", "সাশ্রয়ী মূল্য" naturally.

### 🔍 SEO কীওয়ার্ড সেকশন (Search Intent Coverage)
3-4 sentences naturally weaving 6-8 strategic keywords: "[product] বাংলাদেশ", "[product] কিনুন", "[product] price in bd", "[product] সেরা দাম", "[product] online shop bangladesh", and at least 2 city names from: ${bdCities}.

### 🏪 কেন Shahed Store? (Trust & Authority)
4-5 trust points: genuine license, instant delivery, 24/7 support, secure bKash/Nagad/Rocket payment, official DBID 586772174 registration.

### 🚀 এখনই কিনুন (Call To Action)
2-3 action-oriented lines with urgency and the price.

### ⚠️ Important Notes
(Copy this footer EXACTLY — do NOT translate or alter)

❌ Sold Products Are Not Returnable.

🛒 The product will be delivered instantly or within 1 hours (Rare cases: up to 24 hours)

❌ Any of our products are requested to be activated within two days maximum. Otherwise the warranty will be void.

=== FAQ REQUIREMENTS ===
- 6 to 8 items, each genuinely useful for a Bangladeshi buyer.
- Cover: legitimacy, delivery time, payment methods (bKash/Nagad/Rocket/Wallet), device limits, warranty/refund, activation help, comparison with alternatives, after-sales support.
- Answers 2-4 sentences, Bangla-English mix, factual, include trust phrases.

=== HARD RULES ===
- Total word count of "description": 700–1500 words. NEVER less than 700.
- Use the primary keyword naturally 6-10 times throughout — never keyword-stuffed.
- After any English word/number, use English period (.) — never the Bengali danda (।). Only use । at the end of purely Bengali sentences.
- Escape all newlines in JSON strings as \\n. Escape internal quotes as \\".
- Return ONLY the JSON object. No markdown fences. No commentary.`;

      userPrompt = `Generate the rich product content JSON for:
- Product Name: ${productName}${subtitle ? `\n- Subtitle: ${subtitle}` : ""}
- Category: ${category || "Software"}
- Brand: ${brand || ""}
- Type: ${productType || "Digital"}${accountType ? `\n- Account Type: ${accountType} (Personal/Shared — clarify)` : ""}
- Pricing Plans: ${durationInfo}
- Base Price: ${price ? `৳${price}` : "See plans"}

The description MUST be 700–1500 words and contain ALL 11 sections in the exact order specified. The faq array MUST contain 6–8 items. Return ONLY valid JSON.`;

    } else if (type === "faq") {
      // Generate FAQ ONLY — grounded in the existing product description + metadata
      maxTokens = 2500;
      systemPrompt = `You are a senior eCommerce SEO content strategist for Shahed Store (DBID: 586772174) — Bangladesh's #1 digital software shop.

${bdSeoContext}

GOAL: Produce a high-quality FAQ array (6–8 items) for the product. Use the EXISTING product description provided as the primary source of truth — do NOT invent features, specs, durations, or facts that contradict it. Every answer must be factually accurate and grounded in the product details.

Return ONLY valid JSON in this EXACT shape (no markdown fences, no extra prose):
{
  "faq": [ { "q": "Question?", "a": "Detailed accurate answer 2-4 sentences." }, ... 6 to 8 items ]
}

=== FAQ REQUIREMENTS ===
- 6 to 8 items, every one genuinely useful for a Bangladeshi buyer.
- Cover these intents (mix and adapt to product type): legitimacy/genuineness, how to receive/delivery time, payment methods (bKash/Nagad/Rocket/Wallet/Card), device limits, account type (Personal vs Shared) if applicable, warranty/refund policy, activation help, comparison with pirated/free alternatives, after-sales support, can existing account/email be used.
- Questions in Bangla-English mix, exactly how a Bangladeshi customer would ask.
- Answers 2–4 sentences, factual, grounded in the supplied product details, Bangla-English mix, include trust phrases like "১০০% genuine", "instant delivery", "official license" where truthful.
- After any English word/number use English period (.) — never the Bengali danda (।). Only use । at the end of purely Bengali sentences.
- Do NOT contradict pricing, duration plans, or features stated in the existing description.
- Escape all newlines as \\n and internal quotes as \\". Return ONLY the JSON object.`;

      userPrompt = `Generate the FAQ JSON for this product:

- Product Name: ${productName}${subtitle ? `\n- Subtitle: ${subtitle}` : ""}
- Category: ${category || "Software"}
- Brand: ${brand || ""}
- Type: ${productType || "Digital"}${accountType ? `\n- Account Type: ${accountType}` : ""}
- Pricing Plans: ${durationInfo}
- Base Price: ${price ? `৳${price}` : "See plans"}

=== EXISTING PRODUCT DESCRIPTION (source of truth — do not contradict) ===
${(demoDescription || "").slice(0, 8000) || "(no existing description — base answers on the metadata above and standard Shahed Store policies)"}

Return ONLY the JSON object with 6–8 FAQ items.`;

    } else {
      return new Response(JSON.stringify({ error: "Invalid type. Use: short_description, description, seo, all, demo_style, rich_content, or faq" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isJsonType = type === "seo" || type === "all" || type === "rich_content" || type === "faq";


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
      return new Response(JSON.stringify({ result: sanitizeStoreName(content.trim()) }), {
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

    return new Response(JSON.stringify({ result: sanitizeDeep(parsed) }), {
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
