import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `আপনি Shahed Store-এর AI সাপোর্ট এজেন্ট। আপনি বাংলা ও ইংরেজি দুই ভাষায় সাহায্য করতে পারেন।

Shahed Store সম্পর্কে তথ্য:
- ডিজিটাল সফটওয়্যার লাইসেন্স বিক্রি করে (Windows, Office, Adobe, Netflix, Spotify ইত্যাদি)
- বাংলাদেশে সেবা প্রদান করে
- পেমেন্ট: bKash, Nagad গ্রহণ করা হয়
- ডেলিভারি: অর্ডার কনফার্মেশনের পর সাথে সাথে ইমেইলে পাঠানো হয়
- WhatsApp: 01840099853

আপনার কাজ:
- গ্রাহকদের প্রশ্নের উত্তর দেওয়া
- অর্ডার সংক্রান্ত সমস্যায় সাহায্য করা
- প্রোডাক্ট সম্পর্কে তথ্য দেওয়া
- যদি সমস্যা সমাধান না হয়, support ticket খুলতে বলুন বা WhatsApp-এ যোগাযোগ করতে বলুন

সংক্ষিপ্ত, বন্ধুত্বপূর্ণ এবং সহায়ক উত্তর দিন।`
          },
          ...messages,
        ],
        stream: true,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("OpenAI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
