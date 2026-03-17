import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl, productName, category, price, brand } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const name = productName || "Product";
    const promptText = [
      `Transform this product image into a stunning glassmorphism e-commerce card design.`,
      `Design requirements:`,
      `- Background: Deep dark gradient (navy #0a0a1a to purple #1a0a2e to indigo #0d1a3a)`,
      `- Floating frosted glass card in the center with white/transparent borders, subtle glow`,
      `- Product image placed prominently inside the card with soft drop shadow`,
      `- Bold white gradient text showing "${name}" at the bottom of the card`,
      price ? `- Price badge "৳${price}" with neon glow in top-right corner` : "",
      brand ? `- Brand label "${brand}" in small elegant typography` : "",
      category ? `- Subtle category pill "${category}" at the top` : "",
      `- Bokeh particles and light streaks in the background`,
      `- Glass reflection/shimmer effect on card surface`,
      `- Overall: premium, modern, high-end e-commerce aesthetic`,
      `- Square format (1:1). Professional product photography style.`,
      `Keep the product image clearly visible and recognizable.`,
    ]
      .filter(Boolean)
      .join(" ");

    const userContent: any[] = [{ type: "text", text: promptText }];
    if (imageUrl) {
      userContent.push({ type: "image_url", image_url: { url: imageUrl } });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: userContent }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429)
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      if (response.status === 402)
        return new Response(
          JSON.stringify({ error: "Insufficient AI credits. Please top up your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      const errText = await response.text();
      throw new Error(`AI gateway error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const imageData =
      data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) throw new Error("AI did not return an image. Please try again.");

    return new Response(JSON.stringify({ imageData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-product-card error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
