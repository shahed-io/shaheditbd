import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    // Fetch products from DB for context
    let productContext = "";
    try {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
      const { data: products } = await supabase
        .from("products")
        .select("name, price, original_price, discount_percent, short_description, delivery_time, categories(name)")
        .eq("status", "active")
        .order("sort_order", { ascending: true })
        .limit(80);

      if (products && products.length > 0) {
        const grouped: Record<string, string[]> = {};
        for (const p of products) {
          const cat = (p as any).categories?.name || "অন্যান্য";
          if (!grouped[cat]) grouped[cat] = [];
          const disc = p.discount_percent ? ` (${p.discount_percent}% ছাড়)` : "";
          grouped[cat].push(`• ${p.name}: ৳${p.price}${disc}${p.short_description ? " - " + p.short_description : ""}${p.delivery_time ? " [ডেলিভারি: " + p.delivery_time + "]" : ""}`);
        }
        productContext = "\n\n📦 বর্তমান প্রোডাক্ট তালিকা:\n";
        for (const [cat, items] of Object.entries(grouped)) {
          productContext += `\n${cat}:\n${items.join("\n")}`;
        }
      }
    } catch (e) {
      console.error("Failed to fetch products:", e);
    }

    // Fetch contact phone number from site_settings
    let supportPhone = "01840099853";
    try {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
      const { data: phoneRow } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "site_phone")
        .maybeSingle();
      if (phoneRow?.value) supportPhone = String(phoneRow.value);
    } catch (e) {
      console.error("Failed to fetch site_phone:", e);
    }

    // Fetch active coupons + welcome offer for discount context
    let couponContext = "";
    try {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
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
          const val = c.discount_type === "percentage"
            ? `${c.discount_value}% ছাড়`
            : `৳${c.discount_value} ছাড়`;
          const minOrd = c.min_order_amount ? ` (ন্যূনতম অর্ডার ৳${c.min_order_amount})` : "";
          const exp = c.expires_at ? ` — মেয়াদ: ${new Date(c.expires_at).toLocaleDateString("bn-BD")}` : "";
          const desc = c.description ? ` — ${c.description}` : "";
          couponContext += `- **${c.code}**: ${val}${minOrd}${exp}${desc}\n`;
        }
        couponContext += "\nচেকআউট পেজে কুপন কোড বসিয়ে \"Apply\" করলে ছাড় পেয়ে যাবেন।";
      } else {
        couponContext = "\n\n🎁 ডিসকাউন্ট: এই মুহূর্তে সাধারণ পাবলিক কুপন সক্রিয় নেই, তবে নতুন ইউজারদের জন্য Welcome Offer (সাইনআপের পর অটো-জেনারেট হওয়া WELCOME-XXXX কোড) এবং রেফারেল কোড ব্যবহার করলে ৫% স্থায়ী ছাড় পাওয়া যায়।";
      }
    } catch (e) {
      console.error("Failed to fetch coupons:", e);
    }

    const systemPrompt = `আপনি Shahed Store-এর AI সহকারী "Shahed AI"। আপনি বাংলা ও ইংরেজি উভয় ভাষায় সাহায্য করতে পারেন। গ্রাহক যে ভাষায় কথা বলবেন, সেই ভাষায় উত্তর দিন।

🏪 Shahed Store সম্পর্কে:
- বাংলাদেশের বিশ্বস্ত ডিজিটাল সফটওয়্যার লাইসেন্স ও সাবস্ক্রিপশন স্টোর
- সম্পূর্ণ অরিজিনাল ও জেনুইন লাইসেন্স প্রদান করা হয়
- পেমেন্ট: BKash, Nagad গ্রহণ করা হয়
- ডেলিভারি: পেমেন্ট কনফার্মেশনের পর ১-২৪ ঘণ্টার মধ্যে ইমেইলে পাঠানো হয়
- WhatsApp: 01840099853
- ওয়েবসাইট: www.shahedstore.com.bd
${productContext}

📋 আপনার দায়িত্ব:
- প্রোডাক্টের দাম, ছাড়, ফিচার সম্পর্কে বিস্তারিত তথ্য দিন
- অর্ডার ও পেমেন্ট প্রক্রিয়া ব্যাখ্যা করুন
- ডেলিভারি সময় জানান
- কোন প্রোডাক্টটি কাস্টমারের জন্য উপযুক্ত তা সাজেস্ট করুন
- সমস্যা সমাধান না হলে WhatsApp (01840099853) এ যোগাযোগ করতে বলুন
- সংক্ষিপ্ত, বন্ধুত্বপূর্ণ ও সহায়ক উত্তর দিন

✍️ উত্তরের ফরম্যাট (অত্যন্ত গুরুত্বপূর্ণ — অবশ্যই মেনে চলুন):
- উত্তর সবসময় **Markdown** ফরম্যাটে দিন যাতে প্রতিটি লাইন আলাদাভাবে স্পষ্ট পড়া যায়
- প্রতিটি আলাদা পয়েন্ট নতুন লাইনে লিখুন — কখনোই সব তথ্য একটানা প্যারাগ্রাফে লিখবেন না
- একাধিক বিষয় থাকলে **bullet list** ব্যবহার করুন (\`-\` বা \`•\` দিয়ে শুরু করে প্রতিটি পয়েন্ট নতুন লাইনে)
- ধাপে ধাপে কিছু বোঝালে **numbered list** (1. 2. 3.) ব্যবহার করুন
- প্রোডাক্টের নাম, দাম, গুরুত্বপূর্ণ শব্দ \`**bold**\` করুন
- প্রতিটি প্যারাগ্রাফের মাঝে একটি **খালি লাইন** রাখুন (\\n\\n)
- ইমোজি ব্যবহার করুন (💰 দাম, 📦 প্রোডাক্ট, 🚚 ডেলিভারি, ✅ সুবিধা, 📞 যোগাযোগ) যাতে দ্রুত স্ক্যান করা যায়
- উত্তর সংক্ষিপ্ত রাখুন (সাধারণত ৩–৭ লাইন), কিন্তু পাঠযোগ্যতা সবার আগে

📌 উদাহরণ ভালো ফরম্যাট:
\`\`\`
🎯 আপনার জন্য সেরা ৩টি প্রোডাক্ট:

- **Microsoft Office 2021** — ৳১,২০০ (অফিসের কাজের জন্য)
- **Adobe Creative Cloud** — ৳২,৫০০ (ডিজাইনের জন্য)
- **Windows 11 Pro** — ৳৮০০ (পিসি অ্যাক্টিভেশন)

🚚 ডেলিভারি: পেমেন্টের ১–২৪ ঘণ্টার মধ্যে ইমেইলে।
\`\`\``;

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
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: true,
        max_tokens: 600,
      }),
    });

    // Lovable AI worked → stream directly
    if (response.ok) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Lovable failed (402/429/5xx) → fallback to direct Gemini (non-streaming, wrap as SSE)
    console.warn(`Lovable AI failed (${response.status}); falling back to Gemini direct`);

    try {
      const { callAIWithFallback } = await import("../_shared/ai-fallback.ts");
      const { text } = await callAIWithFallback({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages as any,
        maxTokens: 600,
      });

      // Wrap response as SSE so frontend stream parser works unchanged
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          // Send the entire response as a single delta chunk
          const chunk = {
            choices: [{ delta: { content: text }, index: 0 }],
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } catch (fallbackErr) {
      console.error("Gemini fallback also failed:", fallbackErr);
      return new Response(JSON.stringify({ 
        error: "AI সাময়িকভাবে অনুপলব্ধ। সরাসরি WhatsApp-এ যোগাযোগ করুন: 01840099853" 
      }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
