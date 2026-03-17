import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOOL_PROMPTS: Record<string, (input: string, extra?: Record<string, string>) => string> = {
  "hashtag": (input, extra) => `Generate 20 trending ${extra?.platform || 'instagram'} hashtags for the topic: "${input}". Return only the hashtags in a single line separated by spaces, starting each with #. Focus on Bangladesh/Bengali context when relevant.`,
  "fb-caption": (input) => `Write an engaging Facebook post caption in Bengali for: "${input}". Make it conversational, include 2-3 emojis, and end with a call-to-action. Keep it under 150 words.`,
  "tiktok-caption": (input) => `Write a viral TikTok caption in Bengali/English mix for: "${input}". Make it trendy, fun, with emojis and 5-8 relevant hashtags. Keep it short and punchy.`,
  "yt-title": (input) => `Generate 5 SEO-optimized YouTube video titles for the topic: "${input}". Mix Bengali and English. Make them click-worthy and curiosity-driven. Number each one.`,
  "blog-writer": (input) => `Write a 600-word SEO-optimized blog post draft in Bengali about: "${input}". Include: H2 headings, key points, practical tips, and a conclusion. Keep it informative and engaging.`,
  "ad-copy": (input) => `Write 3 different ad copy variations in Bengali for: "${input}". Each should have: headline, body text (2-3 sentences), and CTA button text. Format clearly with Variation 1, 2, 3.`,
  "product-desc": (input) => `Write a compelling Bengali product description for: "${input}". Include: key features (bullet points), benefits, who it's for, and a purchase CTA. Keep it persuasive and under 200 words.`,
  "email-writer": (input) => `Write a professional email in Bengali for: "${input}". Include proper greeting, clear body paragraphs, and professional closing. Format it as a complete ready-to-send email.`,
  "resume": (input) => `Create a professional resume outline in Bengali/English for: "${input}". Include sections: Professional Summary, Skills, Experience, Education. Format clearly with proper sections.`,
  "grammar-fix": (input) => `Fix all grammar, spelling, and punctuation errors in this text and return only the corrected version: "${input}"`,
  "paraphrase": (input) => `Rewrite the following text in a different way while keeping the same meaning. Make it more natural and engaging: "${input}"`,
  "summarize": (input) => `Summarize the following text in Bengali in 3-5 bullet points, capturing the key points: "${input}"`,
  "seo-meta": (input) => `Generate SEO meta tags for: "${input}". Provide: 1) SEO Title (under 60 chars) 2) Meta Description (under 160 chars) 3) 5 Focus Keywords. Format clearly.`,
  "business-name": (input) => `Generate 10 creative business name ideas for: "${input}". Include a mix of Bengali and English names. For each, add a brief (5-word) tagline. Number each one.`,
  "keyword-gen": (input) => `Generate 20 SEO keywords (mix of short-tail and long-tail) for: "${input}". Focus on Bangladesh market. Include search intent labels (Informational/Commercial/Transactional). Format as a list.`,
  "bio-gen": (input) => `Write 3 different social media bios (Facebook/Instagram) in Bengali for: "${input}". Each under 150 characters, include relevant emojis. Label them Option 1, 2, 3.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { tool, input, ...extra } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const promptFn = TOOL_PROMPTS[tool];
    if (!promptFn) throw new Error(`Unknown tool: ${tool}`);

    const prompt = promptFn(input || '', extra as Record<string, string>);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a helpful AI assistant for a Bangladeshi e-commerce store. Respond in Bengali when asked, or English/mixed as appropriate. Be concise and practical." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Payment required." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content ?? "কোনো ফলাফল পাওয়া যায়নি।";

    return new Response(JSON.stringify({ result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-free-tools error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
