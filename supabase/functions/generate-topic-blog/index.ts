// Generate informational SEO blog posts from any topic (not tied to a single product).
// Target: 1500-2500 words, deeply optimized for Google Bangladesh + AI search (ChatGPT/Perplexity/AI Overview).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { normalizeBrandNameDeep } from "../_shared/brand-name.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0980-\u09FF]+/g, (m) => transliterateBn(m))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// minimal Bangla → latin transliteration for slugs
function transliterateBn(s: string): string {
  const map: Record<string, string> = {
    'অ':'a','আ':'a','ই':'i','ঈ':'i','উ':'u','ঊ':'u','এ':'e','ঐ':'oi','ও':'o','ঔ':'ou',
    'ক':'k','খ':'kh','গ':'g','ঘ':'gh','চ':'ch','ছ':'chh','জ':'j','ঝ':'jh',
    'ট':'t','ঠ':'th','ড':'d','ঢ':'dh','ণ':'n','ত':'t','থ':'th','দ':'d','ধ':'dh','ন':'n',
    'প':'p','ফ':'f','ব':'b','ভ':'v','ম':'m','য':'y','র':'r','ল':'l','শ':'sh','ষ':'sh','স':'s','হ':'h',
    'া':'a','ি':'i','ী':'i','ু':'u','ূ':'u','ে':'e','ৈ':'oi','ো':'o','ৌ':'ou','ং':'ng','ঃ':'h','্':'',
  };
  let out = "";
  for (const ch of s) out += map[ch] ?? "";
  return out;
}

async function callAI(systemPrompt: string, userPrompt: string, maxTokens = 5000): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const body = {
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
  };

  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (r.ok) {
    const j = await r.json();
    return j.choices?.[0]?.message?.content || "";
  }

  // Fallback
  const { callAIWithFallback } = await import("../_shared/ai-fallback.ts");
  const { text } = await callAIWithFallback({
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: systemPrompt + "\n\nReturn ONLY valid JSON." },
      { role: "user", content: userPrompt },
    ],
    maxTokens,
  });
  return text;
}

function parseJson(raw: string): any {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (m) return JSON.parse(m[0]);
  throw new Error("AI returned invalid JSON");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // ── Admin auth ───────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const { data: role } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  if (!role) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { topic, intent, category_id, auto_publish = false, featured_image } = await req.json();
    if (!topic || typeof topic !== "string" || topic.trim().length < 5) {
      return new Response(JSON.stringify({ error: "topic (min 5 chars) is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const cleanTopic = topic.trim();
    const baseSlug = slugify(cleanTopic) || `blog-${Date.now()}`;

    // Skip if a post with this slug already exists
    const { data: existing } = await admin.from("blog_posts").select("id, slug").eq("slug", baseSlug).maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ status: "skipped", message: "Blog with this slug already exists", existing }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const bdCities = "ঢাকা, চট্টগ্রাম, সিলেট, রাজশাহী, খুলনা, বরিশাল, ময়মনসিংহ, কুমিল্লা";

    const systemPrompt = `You are a senior SEO content strategist for Shahed Store (DBID: 586772174) — Bangladesh's #1 digital software & subscription store (shahedstore.com.bd).

GOAL: Write a comprehensive, deeply informational blog post in Bangla-English mix that ranks #1 on Google Bangladesh AND gets cited by ChatGPT, Perplexity, and Google AI Overview.

TARGET MARKET: Bangladesh (বাংলাদেশ)
CITIES: ${bdCities}
INTENT: ${intent || "informational"}
LANGUAGE: Bangla + English mix — exactly how Bangladeshi users search Google.
PRICE FORMAT: ৳[amount] (Taka symbol)
STORE NAME RULE: Use the correct spelling based on language. In English text write exactly "Shahed Store". In Bengali text write exactly "শাহেদ স্টোর" (শা-হে-দ, "হে"-তে এ-কার) — this is the correct Bengali spelling. NEVER use misspelled Bengali variants like "শাহিদ স্টোর", "সাহেদ স্টোর", "শায়েদ স্টোর", "শাহীদ স্টোর", "শহীদ স্টোর", "শাওন স্টোর", "শাহেদ ষ্টোর", "শাহেদ ইস্টোর". NEVER use English variants like "ShahedStore", "Shahid Store", "Sahed Store", "Shawon Store". In Bengali sentences use Bengali case markers naturally (শাহেদ স্টোরের, শাহেদ স্টোরে, শাহেদ স্টোরকে) — do not mix English name with Bengali suffix ("Shahed Store-এর" is wrong).

Return ONLY valid JSON in this EXACT shape:
{
  "title": "Engaging clickable title with primary keyword (max 70 chars)",
  "slug": "kebab-case-english-slug",
  "excerpt": "2-3 sentence summary that hooks the reader (160-220 chars)",
  "content": "FULL MARKDOWN BLOG BODY — 1500 to 2500 words — see structure below",
  "seo_title": "max 60 chars — primary keyword + Bangladesh signal + Shahed Store",
  "seo_description": "max 160 chars — Bangla-English, includes 'bangladesh' or 'BD', a buying intent word, and a unique angle",
  "tags": ["8-12 relevant tags"],
  "reading_time": 8,
  "faq": [ { "q": "Question?", "a": "Detailed 2-4 sentence answer." }, ... 6-10 items ]
}

=== MANDATORY MARKDOWN STRUCTURE for "content" ===

# [Title with primary keyword]

> **TL;DR:** 2-3 sentence quick answer for AI Overview / featured snippet.

## ভূমিকা (Introduction)
3-4 paragraphs. Establish the problem, who's reading, and what they'll learn. Include primary keyword + "বাংলাদেশ" naturally.

## [Topic-specific H2 #1 — main concept explanation]
3-5 paragraphs with sub-headings (###) as needed. Include real numbers, prices in ৳, dates, version numbers.

## [Topic-specific H2 #2 — detailed breakdown / comparison / steps]
For "vs" topics: include a markdown comparison table.
For "how to" topics: numbered step-by-step list with sub-explanations.
For "best" topics: numbered list with pros/cons for each item.
For "price" topics: pricing table with BDT + USD + payment methods.

## [Topic-specific H2 #3 — Bangladesh-specific considerations]
Cover: how to buy in BD, bKash/Nagad/Rocket payment, instant delivery, common scams to avoid, support availability.

## [Topic-specific H2 #4 — recommendations / verdict / next steps]
Clear recommendation with reasoning. Mention Shahed Store products naturally where relevant — link as [product name](https://shahedstore.com.bd/shop).

## সাধারণ ভুল (Common Mistakes to Avoid)
4-6 bullet points of pitfalls.

## কেন Shahed Store থেকে কিনবেন? (Why Buy From Shahed Store)
3-5 bullets: genuine license, instant delivery, bKash/Nagad/Rocket, 24/7 support, DBID 586772174 official registration.

## উপসংহার (Conclusion)
2-3 paragraph wrap-up + a clear call to action linking to https://shahedstore.com.bd/shop.

=== HARD RULES ===
- Word count of "content": 1500–2500 words. NEVER less than 1500.
- Use primary keyword 8-15 times naturally — never stuffed.
- Include at least 2 BD city names from: ${bdCities}.
- Include real product/service names, version numbers, and current prices where applicable.
- All external links use real, working URLs (shahedstore.com.bd, official vendor sites).
- After any English word/number, use English period (.) — never Bengali danda (।). Only use । at the end of purely Bengali sentences.
- "slug" must be lowercase ASCII kebab-case (a-z, 0-9, hyphens only).
- FAQ items must directly answer questions Bangladeshi readers would ask about this exact topic.
- Escape newlines as \\n in JSON strings.

Return ONLY the JSON object.`;

    const userPrompt = `Write a comprehensive informational SEO blog post about:

TOPIC: "${cleanTopic}"

Make it the BEST result on Google Bangladesh for anyone searching this topic. Include real Bangladesh prices in ৳, real product names, and link relevant items to https://shahedstore.com.bd/shop.

Return ONLY the JSON object specified.`;

    const raw = await callAI(systemPrompt, userPrompt, 6000);
    const blog = normalizeBrandNameDeep(parseJson(raw));

    if (!blog.content || blog.content.trim().split(/\s+/).length < 800) {
      throw new Error("AI returned blog content shorter than 800 words; retry shortly.");
    }

    // Use AI's slug if valid, else our generated one
    const finalSlug = (typeof blog.slug === "string" && /^[a-z0-9-]{4,80}$/.test(blog.slug)) ? blog.slug : baseSlug;

    // Ensure slug uniqueness with a numeric suffix if needed
    let uniqueSlug = finalSlug;
    for (let i = 2; i < 50; i++) {
      const { data: exists } = await admin.from("blog_posts").select("id").eq("slug", uniqueSlug).maybeSingle();
      if (!exists) break;
      uniqueSlug = `${finalSlug}-${i}`;
    }

    const tags: string[] = Array.isArray(blog.tags) ? blog.tags.slice(0, 12).map((t: any) => String(t).trim()).filter(Boolean) : [];

    const { data: inserted, error: insErr } = await admin
      .from("blog_posts")
      .insert({
        title: blog.title || cleanTopic,
        slug: uniqueSlug,
        excerpt: blog.excerpt || "",
        content: blog.content,
        status: auto_publish ? "published" : "draft",
        published_at: auto_publish ? new Date().toISOString() : null,
        author_name: "Shahed Store",
        featured_image: featured_image || null,
        category_id: category_id || null,
        tags,
        reading_time: Number(blog.reading_time) || Math.max(5, Math.round(blog.content.split(/\s+/).length / 200)),
        seo_title: (blog.seo_title || blog.title || cleanTopic).slice(0, 70),
        seo_description: (blog.seo_description || blog.excerpt || "").slice(0, 170),
        is_featured: false,
      })
      .select()
      .single();

    if (insErr) throw insErr;

    // Persist FAQ in tags-like extension? blog_posts has no faq column.
    // Embed FAQ inside content as a final Markdown FAQ section (also gives AI/Google FAQ schema candidate).
    if (Array.isArray(blog.faq) && blog.faq.length > 0) {
      const faqMd = "\n\n## প্রায়শই জিজ্ঞাসিত প্রশ্ন (FAQ)\n\n" +
        blog.faq.map((f: any) => `### ${f.q}\n${f.a}`).join("\n\n");
      // Only append if not already in content
      if (!/প্রায়শই জিজ্ঞাসিত|## FAQ/i.test(blog.content)) {
        await admin.from("blog_posts").update({ content: blog.content + faqMd }).eq("id", inserted.id);
      }
    }

    return new Response(JSON.stringify({
      status: "success",
      blog_id: inserted.id,
      slug: inserted.slug,
      title: inserted.title,
      word_count: blog.content.split(/\s+/).length,
      faq_count: Array.isArray(blog.faq) ? blog.faq.length : 0,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("generate-topic-blog error:", err);
    return new Response(JSON.stringify({ error: err.message || "Generation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
