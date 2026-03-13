import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Call OpenAI GPT-4o ───────────────────────────────────────────────────────
async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert SEO blog writer for a digital software store. Always respond with valid JSON only, no markdown code blocks.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error [${res.status}]: ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ─── Call Google Gemini Pro ───────────────────────────────────────────────────
async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text:
                  "You are an expert SEO blog writer for a digital software store. Always respond with valid JSON only, no markdown code blocks.\n\n" +
                  prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error [${res.status}]: ${err}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ─── Parse JSON from AI response ─────────────────────────────────────────────
function parseAIJson(raw: string): any {
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("AI did not return valid JSON");
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      product_id,
      auto_publish = false,
      bulk = false,
      ai_model = "openai", // "openai" | "gemini"
    } = await req.json();

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Validate API keys based on selected model
    if (ai_model === "openai" && !OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    if (ai_model === "gemini" && !GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // ─── Fetch product(s) ────────────────────────────────────────────
    let products: any[] = [];
    if (bulk) {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories!products_category_id_fkey(name)")
        .eq("status", "active")
        .order("sort_order");
      if (error) throw new Error("Products fetch error: " + error.message);
      products = data || [];
    } else {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories!products_category_id_fkey(name)")
        .eq("id", product_id)
        .maybeSingle();
      if (error) throw new Error("Product fetch error: " + error.message);
      if (data) products = [data];
    }

    if (products.length === 0) {
      return new Response(JSON.stringify({ error: "কোনো প্রোডাক্ট পাওয়া যায়নি" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Generating blogs for ${products.length} products using ${ai_model}`);

    const results: any[] = [];

    for (const product of products) {
      // Check if blog already exists
      const { data: existing } = await supabase
        .from("blog_posts")
        .select("id, slug")
        .ilike("slug", `%${product.slug}%`)
        .limit(1);

      if (existing && existing.length > 0) {
        results.push({
          product_id: product.id,
          name: product.name,
          status: "skipped",
          message: "ব্লগ ইতিমধ্যে আছে",
        });
        continue;
      }

      const categoryName = product.categories?.name || "Software";
      const whatYouGet =
        (product.what_you_get || []).join(", ") ||
        "Digital License Key, Instant Delivery, 24/7 Support";
      const price = product.price;
      const originalPrice = product.original_price;
      const discount = originalPrice
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;

      const prompt = `Write a detailed, SEO-optimized blog post in ENGLISH about the digital product "${product.name}" for a Bangladeshi digital software store called "Shahed Store" (website: shahedstore.com.bd).

Product Details:
- Name: ${product.name}
- Category: ${categoryName}
- Price: ৳${price} BDT${originalPrice ? ` (Original: ৳${originalPrice}, Save ${discount}%)` : ""}
- Description: ${product.description || product.short_description || "Premium digital license key"}
- What you get: ${whatYouGet}
- Tags: ${(product.tags || []).join(", ") || categoryName}

Requirements for the blog post:
1. Title: Engaging, SEO-friendly (include product name + benefit keyword)
2. Length: 800-1200 words
3. Structure with markdown headings (##, ###)
4. Include: Introduction, Features/Benefits, Why Buy From Shahed Store, How to Activate, FAQ section, Conclusion with CTA
5. Mention the affordable price in BDT
6. Include keywords naturally: license key, Bangladesh, genuine, instant delivery, affordable
7. Mention Shahed Store website: shahedstore.com.bd
8. Write in a professional, helpful tone

Also provide:
- excerpt: 2-3 sentence summary
- seo_title: max 60 chars
- seo_description: max 160 chars
- tags: 5-8 relevant tags as array
- reading_time: estimated minutes as a number

Respond ONLY with this JSON (no markdown, no explanation):
{
  "title": "...",
  "content": "... (full markdown blog content) ...",
  "excerpt": "...",
  "seo_title": "...",
  "seo_description": "...",
  "tags": ["tag1", "tag2"],
  "reading_time": 5
}`;

      try {
        let rawContent = "";

        if (ai_model === "gemini") {
          rawContent = await callGemini(prompt, GEMINI_API_KEY!);
        } else {
          rawContent = await callOpenAI(prompt, OPENAI_API_KEY!);
        }

        const blogData = parseAIJson(rawContent);

        const blogSlug = `${product.slug}-review-buy-bangladesh`;

        const { data: insertedPost, error: insertError } = await supabase
          .from("blog_posts")
          .insert({
            title: blogData.title || `Buy ${product.name} - Best Price in Bangladesh`,
            slug: blogSlug,
            excerpt: blogData.excerpt || product.short_description || "",
            content: blogData.content || "",
            status: auto_publish ? "published" : "draft",
            published_at: auto_publish ? new Date().toISOString() : null,
            author_name: "Shahed Store",
            featured_image: product.image_url || null,
            tags: blogData.tags || product.tags || [],
            reading_time: blogData.reading_time || 5,
            seo_title: blogData.seo_title || blogData.title?.slice(0, 60) || "",
            seo_description:
              blogData.seo_description || blogData.excerpt?.slice(0, 160) || "",
            is_featured: false,
          })
          .select()
          .single();

        if (insertError) {
          results.push({
            product_id: product.id,
            name: product.name,
            status: "error",
            message: insertError.message,
          });
        } else {
          results.push({
            product_id: product.id,
            name: product.name,
            status: "success",
            blog_id: insertedPost?.id,
            blog_slug: blogSlug,
            ai_model,
          });
        }
      } catch (err: any) {
        console.error(`Blog generation error for ${product.name}:`, err.message);
        results.push({
          product_id: product.id,
          name: product.name,
          status: "error",
          message: err.message,
        });
      }

      // Delay between requests to respect rate limits
      if (bulk && products.length > 1) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const skippedCount = results.filter((r) => r.status === "skipped").length;
    const errorCount = results.filter((r) => r.status === "error").length;

    return new Response(
      JSON.stringify({
        results,
        summary: {
          total: products.length,
          success: successCount,
          skipped: skippedCount,
          errors: errorCount,
          ai_model,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("generate-product-blog error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
