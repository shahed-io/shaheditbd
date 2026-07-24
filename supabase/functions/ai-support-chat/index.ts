import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCT_FIELDS = "name, slug, price, original_price, discount_percent, short_description, description, delivery_time, what_you_get, stock_quantity, status, brand, categories:category_id(name)";

const stripHtml = (s: string | null | undefined) =>
  (s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

const formatProductBlock = (p: any, full = false) => {
  const stock =
    p.status === "out_of_stock" || (typeof p.stock_quantity === "number" && p.stock_quantity <= 0)
      ? "❌ Stock Out"
      : "✅ In Stock";
  const disc = p.discount_percent ? ` (${p.discount_percent}% ছাড়, আগে ৳${p.original_price})` : "";
  const cat = p.categories?.name ? ` | ক্যাটাগরি: ${p.categories.name}` : "";
  const brand = p.brand ? ` | ব্র্যান্ড: ${p.brand}` : "";
  const del = p.delivery_time ? ` | 🚚 ${p.delivery_time}` : "";
  const short = stripHtml(p.short_description);
  const desc = stripHtml(p.description);
  const wyg = stripHtml(p.what_you_get);
  const lines = [
    `📦 **${p.name}** — ৳${p.price}${disc} | ${stock}${cat}${brand}${del}`,
    short ? `   সংক্ষিপ্ত: ${truncate(short, 250)}` : "",
  ];
  if (full) {
    if (desc) lines.push(`   বিবরণ: ${truncate(desc, 900)}`);
    if (wyg) lines.push(`   যা পাবেন: ${truncate(wyg, 400)}`);
    lines.push(`   লিংক: https://www.shahedstore.com.bd/product/${p.slug}`);
  }
  return lines.filter(Boolean).join("\n");
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, pageContext } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

    const lastUserMsg: string = (() => {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "user") return String(messages[i].content || "");
      }
      return "";
    })();

    // ============ 1) CURRENTLY VIEWED PRODUCT (from pageContext) ============
    let viewedProductBlock = "";
    const productSlug: string | null = pageContext?.productSlug || null;
    if (productSlug) {
      try {
        const { data: viewed } = await supabase
          .from("products")
          .select(PRODUCT_FIELDS)
          .eq("slug", productSlug)
          .eq("status", "active")
          .maybeSingle();
        if (viewed) {
          viewedProductBlock =
            "\n\n🎯 গ্রাহক এই মুহূর্তে এই প্রোডাক্টের পেজে আছেন (এটাই মূল প্রসঙ্গ — এটার সম্পর্কে বিস্তারিত উত্তর দিন):\n" +
            formatProductBlock(viewed, true);
        }
      } catch (e) {
        console.error("viewed product fetch:", e);
      }
    }

    // ============ 2) KEYWORD-MATCHED PRODUCTS (from last user message) ============
    let matchedBlock = "";
    try {
      const stopwords = new Set([
        "the","a","an","is","are","of","and","or","to","for","in","on","how","what","which","much","cost","price","দাম","কত","কি","কী","আছে","কীভাবে","কিভাবে","একটি","এর","এটা","এটি","আমি","আপনার","আপনি","ok","hi","hello"
      ]);
      const terms = lastUserMsg
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((t) => t.length >= 3 && !stopwords.has(t))
        .slice(0, 6);
      if (terms.length > 0) {
        const orFilter = terms
          .map((t) => `name.ilike.%${t}%,short_description.ilike.%${t}%,brand.ilike.%${t}%,tags.cs.{${t}}`)
          .join(",");
        const { data: matches } = await supabase
          .from("products")
          .select(PRODUCT_FIELDS)
          .eq("status", "active")
          .or(orFilter)
          .limit(6);
        if (matches && matches.length > 0) {
          matchedBlock =
            "\n\n🔍 গ্রাহকের প্রশ্নের সাথে সম্পর্কিত প্রোডাক্ট (সঠিক তথ্য — এখান থেকে উত্তর দিন):\n" +
            matches.map((m: any) => formatProductBlock(m, true)).join("\n\n");
        }
      }
    } catch (e) {
      console.error("keyword search:", e);
    }

    // ============ 3) FULL CATALOG (compact list for general questions) ============
    let productContext = "";
    try {
      const { data: products } = await supabase
        .from("products")
        .select("name, slug, price, discount_percent, short_description, delivery_time, stock_quantity, status, categories:category_id(name)")
        .eq("status", "active")
        .order("sort_order", { ascending: true })
        .limit(80);

      if (products && products.length > 0) {
        const grouped: Record<string, string[]> = {};
        for (const p of products as any[]) {
          const cat = p.categories?.name || "অন্যান্য";
          if (!grouped[cat]) grouped[cat] = [];
          const disc = p.discount_percent ? ` (${p.discount_percent}% ছাড়)` : "";
          const stock =
            p.status === "out_of_stock" || (typeof p.stock_quantity === "number" && p.stock_quantity <= 0)
              ? " [Stock Out]"
              : "";
          grouped[cat].push(
            `• ${p.name} — ৳${p.price}${disc}${stock}${p.delivery_time ? " [🚚 " + p.delivery_time + "]" : ""}`,
          );
        }
        productContext = "\n\n📚 সম্পূর্ণ প্রোডাক্ট তালিকা (রেফারেন্স):\n";
        for (const [cat, items] of Object.entries(grouped)) {
          productContext += `\n${cat}:\n${items.join("\n")}`;
        }
      }
    } catch (e) {
      console.error("catalog fetch:", e);
    }

    // ============ 4) SUPPORT PHONE ============
    let supportPhone = "01840099853";
    try {
      const { data: phoneRow } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "site_phone")
        .maybeSingle();
      if (phoneRow?.value) supportPhone = String(phoneRow.value);
    } catch (e) {
      console.error("phone fetch:", e);
    }

    // ============ 5) ACTIVE COUPONS ============
    let couponContext = "";
    try {
      const nowIso = new Date().toISOString();
      const { data: coupons } = await supabase
        .from("coupons")
        .select("code, description, discount_type, discount_value, min_order_amount, max_uses, uses_count, expires_at")
        .eq("is_active", true);

      const activeCoupons = (coupons || []).filter((c: any) => {
        if (c.expires_at && new Date(c.expires_at) < new Date(nowIso)) return false;
        if (c.max_uses != null && (c.uses_count || 0) >= c.max_uses) return false;
        return true;
      });

      if (activeCoupons.length > 0) {
        couponContext = "\n\n🎁 বর্তমানে সক্রিয় ডিসকাউন্ট কুপন (গ্রাহককে কেবল এগুলোই বলবেন):\n";
        for (const c of activeCoupons) {
          const val =
            c.discount_type === "percentage" ? `${c.discount_value}% ছাড়` : `৳${c.discount_value} ছাড়`;
          const minOrd = c.min_order_amount ? ` (ন্যূনতম অর্ডার ৳${c.min_order_amount})` : "";
          const exp = c.expires_at ? ` — মেয়াদ: ${new Date(c.expires_at).toLocaleDateString("bn-BD")}` : "";
          const desc = c.description ? ` — ${c.description}` : "";
          couponContext += `- **${c.code}**: ${val}${minOrd}${exp}${desc}\n`;
        }
        couponContext += "\nচেকআউট পেজে কুপন কোড বসিয়ে \"Apply\" করলে ছাড় পেয়ে যাবেন।";
      } else {
        couponContext =
          "\n\n🎁 ডিসকাউন্ট: এই মুহূর্তে সাধারণ পাবলিক কুপন সক্রিয় নেই, তবে নতুন ইউজারদের জন্য Welcome Offer (সাইনআপের পর অটো-জেনারেট হওয়া WELCOME-XXXX কোড) এবং রেফারেল কোড ব্যবহার করলে ৫% স্থায়ী ছাড় পাওয়া যায়।";
      }
    } catch (e) {
      console.error("coupons fetch:", e);
    }

    const systemPrompt = `আপনি Shahed Store AI সহকারী "Shahed AI"। বাংলা ও ইংরেজি উভয় ভাষায় গ্রাহকের সাথে কথা বলতে পারেন — গ্রাহক যে ভাষায় লিখবেন সেই ভাষায় উত্তর দিন।

🚨 সবচেয়ে গুরুত্বপূর্ণ নিয়ম (Anti-Hallucination):
- আপনি **শুধুমাত্র** নিচে দেওয়া ডেটা (প্রোডাক্ট তালিকা, কুপন, যোগাযোগ) থেকে উত্তর দিবেন
- **কোনো তথ্য নিজে বানিয়ে বলবেন না** — দাম, ডেলিভারি সময়, ফিচার, স্টক, কুপন কোড কিছুই আন্দাজে বলবেন না
- যদি নিচের ডেটায় কোনো প্রোডাক্ট বা তথ্য না থাকে, স্পষ্টভাবে বলুন: "এই তথ্যটি আমার কাছে এই মুহূর্তে নেই, অনুগ্রহ করে WhatsApp-এ যোগাযোগ করুন: ${supportPhone}"
- গ্রাহক যদি নির্দিষ্ট কোনো প্রোডাক্ট পেজে থাকেন (🎯 চিহ্নিত), সেই প্রোডাক্টকেই মূল প্রসঙ্গ ধরে বিস্তারিত উত্তর দিন
- প্রোডাক্টের দাম বলার সময় শুধু নিচের তালিকার price ব্যবহার করুন — আন্দাজে ৳ পরিবর্তন করবেন না

⚠️ দোকানের নামের সঠিক বানান:
- ইংরেজিতে: **Shahed Store** | বাংলায়: **শাহেদ স্টোর** (শা-হে-দ)
- কখনোই "শাহিদ/সাহিদ/সাহেদ/শাহীদ/শহীদ" লিখবেন না

🏪 শাহেদ স্টোর (Shahed Store) সম্পর্কে:
- বাংলাদেশের বিশ্বস্ত ডিজিটাল সফটওয়্যার লাইসেন্স ও সাবস্ক্রিপশন স্টোর
- সম্পূর্ণ অরিজিনাল ও জেনুইন লাইসেন্স
- পেমেন্ট: bKash, Nagad, DBBL
- ডেলিভারি: পেমেন্ট কনফার্মেশনের পর ১-২৪ ঘণ্টার মধ্যে ইমেইলে
- ওয়েবসাইট: www.shahedstore.com.bd

📞 যোগাযোগ:
- 📱 কল: ${supportPhone} (সকাল ১০টা — রাত ১০টা)
- 💬 WhatsApp: ${supportPhone} — https://wa.me/88${supportPhone}
- ✉️ ইমেইল: support@shahedstore.com.bd
${viewedProductBlock}${matchedBlock}${productContext}${couponContext}

📋 দায়িত্ব:
- প্রোডাক্টের দাম, ছাড়, ফিচার, স্টক, ডেলিভারি সম্পর্কে **উপরের ডেটা থেকে** সঠিক তথ্য দিন
- গ্রাহক যে প্রোডাক্ট দেখছেন (🎯), সেটার সম্পর্কে জিজ্ঞেস করলে সেটার description ও what_you_get থেকে উত্তর দিন
- একই ধরনের বা related প্রোডাক্ট সাজেস্ট করলে 🔍 বা 📚 তালিকা থেকেই সাজেস্ট করুন
- কুপন জিজ্ঞেস করলে শুধু 🎁 তালিকার সক্রিয় কুপন কোডই বলবেন — নিজে বানাবেন না
- Stock Out প্রোডাক্ট জিজ্ঞেস করলে জানান এবং WhatsApp-এ প্রি-অর্ডারের কথা বলুন

✍️ উত্তরের ফরম্যাট (অবশ্যই মেনে চলুন):
- **Markdown** ফরম্যাটে দিন, প্রতিটি পয়েন্ট নতুন লাইনে
- একাধিক বিষয় হলে bullet list (\`-\` দিয়ে)
- প্রোডাক্টের নাম, দাম, কুপন কোড **bold** করুন
- প্যারাগ্রাফের মাঝে খালি লাইন (\\n\\n)
- ইমোজি ব্যবহার করুন (💰 📦 🚚 ✅ 📞 🎁)
- উত্তর সংক্ষিপ্ত (৩–৭ লাইন), কিন্তু সঠিক ও পাঠযোগ্য`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: aiMessages,
        stream: true,
        max_tokens: 700,
      }),
    });

    if (response.ok) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    console.warn(`Lovable AI failed (${response.status}); falling back`);

    try {
      const { callAIWithFallback } = await import("../_shared/ai-fallback.ts");
      const { text } = await callAIWithFallback({
        model: "google/gemini-3.6-flash",
        messages: aiMessages as any,
        maxTokens: 700,
      });

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const chunk = { choices: [{ delta: { content: text }, index: 0 }] };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } catch (fallbackErr) {
      console.error("fallback failed:", fallbackErr);
      return new Response(
        JSON.stringify({
          error: `AI সাময়িকভাবে অনুপলব্ধ। সরাসরি WhatsApp-এ যোগাযোগ করুন: ${supportPhone}`,
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
