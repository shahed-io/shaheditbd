import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product_id, auto_publish = false, bulk = false } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch product(s)
    let products: any[] = [];
    if (bulk) {
      const { data } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("status", "active")
        .order("sort_order");
      products = data || [];
    } else {
      const { data } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("id", product_id)
        .single();
      if (data) products = [data];
    }

    if (products.length === 0) {
      return new Response(JSON.stringify({ error: "কোনো প্রোডাক্ট পাওয়া যায়নি" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (const product of products) {
      // Check if blog already exists for this product
      const { data: existing } = await supabase
        .from("blog_posts")
        .select("id, slug")
        .ilike("slug", `%${product.slug}%`)
        .limit(1);

      if (existing && existing.length > 0) {
        results.push({ product_id: product.id, name: product.name, status: "skipped", message: "ব্লগ ইতিমধ্যে আছে" });
        continue;
      }

      const categoryName = product.categories?.name || "Software";
      const whatYouGet = (product.what_you_get || []).join(", ") || "Digital License Key, Instant Delivery, 24/7 Support";
      const price = product.price;
      const originalPrice = product.original_price;
      const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

      const prompt = `Write a detailed, SEO-optimized blog post in ENGLISH about the digital product "${product.name}" for a Bangladeshi digital software store called "Shahed Store".

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
- excerpt: 2-3 sentence summary (max 160 chars)
- seo_title: max 60 chars
- seo_description: max 160 chars
- tags: 5-8 relevant tags as comma-separated
- reading_time: estimated minutes (number only)

Format your response as JSON:
{
  "title": "...",
  "content": "... (full markdown content) ...",
  "excerpt": "...",
  "seo_title": "...",
  "seo_description": "...",
  "tags": ["tag1", "tag2", ...],
  "reading_time": 5
}`;

      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: "You are an expert SEO blog writer for a digital software store. Always respond with valid JSON only, no markdown code blocks.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.7,
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          if (aiResponse.status === 429) {
            results.push({ product_id: product.id, name: product.name, status: "error", message: "Rate limit exceeded. Please try again later." });
            break;
          }
          if (aiResponse.status === 402) {
            results.push({ product_id: product.id, name: product.name, status: "error", message: "Lovable AI credits exhausted." });
            break;
          }
          throw new Error(`AI error: ${errText}`);
        }

        const aiData = await aiResponse.json();
        const rawContent = aiData.choices?.[0]?.message?.content || "";

        // Parse JSON from AI response
        let blogData: any = {};
        try {
          // Remove markdown code blocks if present
          const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          blogData = JSON.parse(cleaned);
        } catch {
          // Try to extract JSON from the response
          const match = rawContent.match(/\{[\s\S]*\}/);
          if (match) blogData = JSON.parse(match[0]);
          else throw new Error("AI did not return valid JSON");
        }

        // Build blog slug
        const blogSlug = `${product.slug}-review-buy-bangladesh`;

        // Insert blog post
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
            tags: blogData.tags || (product.tags || []),
            reading_time: blogData.reading_time || 5,
            seo_title: blogData.seo_title || blogData.title?.slice(0, 60) || "",
            seo_description: blogData.seo_description || blogData.excerpt?.slice(0, 160) || "",
            is_featured: false,
          })
          .select()
          .single();

        if (insertError) {
          results.push({ product_id: product.id, name: product.name, status: "error", message: insertError.message });
        } else {
          results.push({
            product_id: product.id,
            name: product.name,
            status: "success",
            blog_id: insertedPost?.id,
            blog_slug: blogSlug,
          });
        }
      } catch (err: any) {
        results.push({ product_id: product.id, name: product.name, status: "error", message: err.message });
      }

      // Small delay between requests to avoid rate limiting
      if (bulk && products.length > 1) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const skippedCount = results.filter((r) => r.status === "skipped").length;
    const errorCount = results.filter((r) => r.status === "error").length;

    return new Response(
      JSON.stringify({
        results,
        summary: { total: products.length, success: successCount, skipped: skippedCount, errors: errorCount },
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
