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

  // ─── Admin Auth Check ────────────────────────────────────────────────────────
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
  // ─────────────────────────────────────────────────────────────────────────────

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

    // Build enriched product context with new fields
    const durationInfo = durationPlans || duration || "Lifetime";
    const accountInfo = accountType ? `Account Type: ${accountType}` : "";
    const subtitleInfo = subtitle ? `Subtitle: ${subtitle}` : "";

    if (type === "short_description") {
      const numOptions = count && count > 1 ? count : 1;
      systemPrompt = `You are a product copywriter for a Bangladeshi digital software store called Shahed Store. Write compelling short product descriptions in Bangla (Bengali). Return ONLY plain text, no JSON, no markdown, max 1–2 sentences per option.${numOptions > 1 ? ` Generate exactly ${numOptions} different options, each on a new line, prefixed with the number like: 1. ... 2. ... 3. ...` : ""}`;
      const ctx = [
        productName,
        subtitleInfo,
        brand && `Brand: ${brand}`,
        category && `Category: ${category}`,
        productType && `Type: ${productType}`,
        accountInfo,
        durationInfo !== "Lifetime" && `Plans: ${durationInfo}`,
      ].filter(Boolean).join(", ");
      userPrompt = numOptions > 1
        ? `Write ${numOptions} different short product descriptions (1-2 sentences each, in Bengali/বাংলা) for: ${ctx}. Each should have a slightly different tone/angle. Number them 1. 2. 3.`
        : `Write a short product description (1-2 sentences, in Bengali/বাংলা) for: ${ctx}`;

    } else if (type === "description") {
      maxTokens = 2400;
      systemPrompt = `You are an expert eCommerce product description writer for Shahed Store — a certified Digital E-commerce Platform, officially registered under the Ministry of Commerce, People's Republic of Bangladesh (DBID: 586772174).

Write a professional, high-converting, SEO-friendly product description using Bangla + simple English mix. Use emojis sparingly. Mobile-friendly formatting.

STRICT STRUCTURE — follow exactly in this order:
1. ## 🛍️ [Product Title]
2. ### 📦 Product Overview  (2-3 engaging sentences in Bangla-English mix)
3. ### ✅ Key Features  (5-7 bullet points)
4. ### 💡 Benefits  (3-5 bullets — why user should buy)
5. ### 💰 Pricing & Plans  (List ALL duration plans with prices clearly. Mention Personal/Shared/account type if provided)
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
- Product Name: ${productName}${subtitle ? `\n- Subtitle: ${subtitle}` : ""}
- Category: ${category || "Software"}
- Type: ${productType || brand || "Digital"}${accountType ? `\n- Account Type: ${accountType} (Personal / Shared — mention this clearly in the description)` : ""}
- Pricing Plans: ${durationInfo}
- Base Price: ${price ? `৳${price}` : "See plans"}

IMPORTANT: In the Pricing section, list ALL duration plans with their exact prices. If account type is Personal or Shared, clearly explain what that means for the user.

Follow the exact structure from the system prompt. The footer with DBID and Important Notes MUST be the last section.`;

    } else if (type === "seo") {
      systemPrompt = "You are an SEO expert for a digital software store in Bangladesh. Return ONLY valid JSON in this exact format: {\"seo_title\": \"...\", \"seo_description\": \"...\"}. No markdown, no extra text. seo_title max 60 chars, seo_description max 160 chars. Write in Bengali/বাংলা mixed with English product names.";
      const ctx = [
        productName,
        brand && `Brand: ${brand}`,
        category && `Category: ${category}`,
        productType && `Type: ${productType}`,
        accountType && `Account: ${accountType}`,
      ].filter(Boolean).join(", ");
      userPrompt = `Generate SEO title and meta description for this digital product: ${ctx}. Pricing plans: ${durationInfo}. Rules: seo_title must be under 60 chars, seo_description must be under 160 chars, include primary keyword naturally.`;

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
5. ### 💰 Pricing & Plans (list all duration plans with prices; mention Personal/Shared account type if given)
6. ### 🔍 SEO Paragraph
7. ### 🏪 Why Choose Shahed Store
8. ### 🚀 Call To Action
9. ### ⚠️ Important Notes (ALWAYS LAST — include DBID 586772174, non-refundable policy, activate within 2 days)

No markdown outside the JSON string values. Escape newlines as \\n in the JSON.`;

      userPrompt = `Generate complete product content for:
- Product Name: ${productName}${subtitle ? `\n- Subtitle: ${subtitle}` : ""}
- Category: ${category || "Software"}
- Type: ${productType || brand || "Digital"}${accountType ? `\n- Account Type: ${accountType}` : ""}
- Pricing Plans: ${durationInfo}
- Base Price: ${price ? `৳${price}` : "See plans"}`;

    } else if (type === "demo_style") {
      // Generate description by following the style/format of a provided demo description
      if (!demoDescription) {
        return new Response(JSON.stringify({ error: "demoDescription is required for demo_style type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      maxTokens = 3000;
      systemPrompt = `You are an expert eCommerce product description writer for Shahed Store — a certified Digital E-commerce Platform, officially registered under the Ministry of Commerce, People's Republic of Bangladesh (DBID: 586772174).

The user will provide a DEMO/SAMPLE description as a reference. You MUST:
1. Analyze the demo description carefully — its tone, language mix (Bangla/English), structure, formatting style, emoji usage, section headers, writing style.
2. Write a brand NEW description for the new product following the EXACT SAME style, format, structure, and tone as the demo.
3. Replace all product-specific details (name, features, pricing, plans, account type) with the new product's details.
4. Keep the same section structure — if demo has 8 sections, new one should also have 8 sections with similar headings.
5. Always end with the Important Notes footer:
   ### ⚠️ Important Notes
   🔐 We are a certified Digital E-commerce Platform, officially registered under the Ministry of Commerce, People's Republic of Bangladesh.
   Our DBID Number: 586772174 — ensuring secure and authentic digital product delivery.
   ❌ Sold products are non-refundable
   ❌ Activate your product within 2 days of purchase
   ⚠️ Delayed activation may void warranty or support

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

Now write the full description for the NEW PRODUCT following the EXACT SAME style and structure as the demo above. Keep the same tone, language mix, emoji style, section structure. Make sure pricing plans and account type are clearly mentioned.`;

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
      temperature: 0.7,
      max_tokens: maxTokens,
    };

    // Force JSON output mode for types that need it
    if (isJsonType) {
      requestBody.response_format = { type: "json_object" };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
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

    // Plain text types — return as-is
    if (type === "short_description" || type === "description" || type === "demo_style") {
      return new Response(JSON.stringify({ result: content.trim() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // JSON types — robust multi-stage parsing
    let parsed: any;

    // Stage 1: strip markdown fences and try direct parse
    try {
      const cleaned = content
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Stage 2: extract first {...} block
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          // Stage 3: try to fix common issues (unescaped newlines inside strings)
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
            // Stage 4: give meaningful fallback for 'all' type
            if (type === "all") {
              parsed = {
                short_description: "",
                description: content,
                seo_title: "",
                seo_description: "",
              };
            } else {
              console.error("Raw AI content that failed to parse:", content.substring(0, 500));
              throw new Error("Failed to parse AI response as JSON");
            }
          }
        }
      } else {
        // No JSON object found at all — fallback for 'all'
        if (type === "all") {
          parsed = {
            short_description: "",
            description: content,
            seo_title: "",
            seo_description: "",
          };
        } else {
          console.error("No JSON found in AI content:", content.substring(0, 500));
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
