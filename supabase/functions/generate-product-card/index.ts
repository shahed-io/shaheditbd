import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STYLES = {
  dark_neon: {
    label: "Dark Neon",
    prompt: (name: string, brand: string, price: string, category: string) => `
Create a premium square (1:1) product promotional card image with this EXACT design:

BACKGROUND:
- Deep dark navy/indigo background: dark gradient from #050510 to #0d0825 to #0a0d2e
- Subtle dark blue bokeh glow spots in the background corners (very subtle, not distracting)
- Overall very dark, almost black with deep blue tones

MAIN CARD ELEMENT:
- A large rounded rectangle card in the CENTER of the image (takes up ~70% of space)
- Card has a vivid NEON GLOWING BORDER: electric gradient border going from purple (#a855f7) to cyan/blue (#22d3ee) to pink (#f472b6), glowing brightly
- The border has a strong luminous neon glow/bloom effect (like a neon sign)
- Inside the card: very dark semi-transparent background (rgba(5,5,20,0.85))
- The product image/logo: "${name}" should be placed prominently in the CENTER of this card as a large clean square app icon with rounded corners

TOP OF CARD:
- Top-right corner inside the card: brand name "${brand || name}" in clean white text with a small logo/icon pill

BOTTOM SECTION:
- At the very bottom of the card (inside the glowing border, in a frosted glass strip):
  - Left side: globe icon + "www.shahedstore.com.bd" in white text
  - Right side: phone icon + "+880 1840-099853" in white text
  - This bottom strip should be slightly lighter/frosted compared to the card body

TOP-LEFT CORNER (outside or at edge of card):
- "SHAHED STORE" text in white, bold, clean font

OVERALL: Ultra-premium, cyberpunk/neon aesthetic, very dark background with electric glowing border, professional product promotional style. Square format exactly.
`.trim(),
  },

  light_glass: {
    label: "Light Glass",
    prompt: (name: string, brand: string, price: string, category: string) => `
Create a premium square (1:1) product promotional card image with this EXACT design:

BACKGROUND:
- Beautiful soft colorful gradient background: flowing from soft lavender/purple (#c8b4f0) top-left, to soft pink (#f0b4d8) top-right, to soft blue (#a0c4f0) bottom-left, to soft peach/coral (#f0c8b4) bottom-right
- The gradient is smooth, dreamy, pastel aesthetic
- A few small translucent floating bubble/circle decorations scattered subtly

MAIN FROSTED GLASS CARD:
- A large frosted glass rounded rectangle card covering most of the image
- Frosted glass effect: white semi-transparent (rgba(255,255,255,0.55)), heavy blur backdrop, soft white border (1.5px rgba(255,255,255,0.8))
- Rounded corners (border-radius ~30px)
- Very subtle box shadow: soft purple/pink shadow

INSIDE THE CARD - TOP ROW:
- Top-left: A small frosted glass pill/badge containing "SHAHED STORE" in bold white text (this pill has a slightly darker frosted background)
- Top-right: A small frosted glass pill/badge containing "${brand || name}" brand name with a small icon, on clean white background

INSIDE THE CARD - CENTER:
- The product logo/icon for "${name}" placed in the CENTER of the card, large and prominent
- The product icon itself should be a clean square with rounded corners (like an app icon)
- Subtle drop shadow on the product icon

BOTTOM OF CARD:
- At the bottom inside the frosted card: 
  - globe icon + "www.shahedstore.com.bd"
  - phone icon + "+880 1840-099853"
  - Both in dark/charcoal text, clean readable font

OVERALL: Dreamy pastel glassmorphism, soft colors, elegant frosted glass, professional social media promotional style. Square format exactly.
`.trim(),
  },

  clean_light: {
    label: "Clean Light",
    prompt: (name: string, brand: string, price: string, category: string) => `
Create a premium square (1:1) product promotional card image with this EXACT design:

BACKGROUND:
- Clean light gray/white background: very light blue-gray (#e8edf5 to #f2f5fa)
- Several large soft bokeh blur circles/orbs scattered: some are soft blue-white, some soft teal-cyan - they look like out-of-focus light orbs, giving depth
- The background feels airy, clean, professional, minimal

MAIN CARD:
- A large rounded rectangle card covering most of the image
- White/very light semi-transparent background (rgba(255,255,255,0.75))
- Subtle light border (rgba(255,255,255,0.9), 1.5px)
- Soft box shadow: light blue-gray shadow
- Very rounded corners (~28px)

INSIDE THE CARD - TOP ROW:
- Top-left: "SHAHED STORE" brand badge — white pill/badge with a RED filled background rectangle containing "SHAHED STORE" in white bold text (this is a distinctive red brand badge, very clean)
- Top-right: "${brand || name}" brand name with its actual logo/icon, on a clean white pill background, dark text

INSIDE THE CARD - CENTER:
- The product icon/logo for "${name}" in the CENTER, large and prominent
- Clean square app icon with rounded corners
- The product image should be the focal point

BOTTOM OF CARD:
- At the bottom, separated by a subtle line:
  - Left: globe icon + "www.shahedstore.com.bd" in dark gray text
  - Right: phone icon + "+880 1840-099853" in dark gray text
  - Clean, professional typography

OVERALL: Clean, minimal, professional look with soft light backgrounds and bokeh orbs. White card aesthetic. Corporate/premium promotional style. Square format exactly.
`.trim(),
  },

  vibrant_promo: {
    label: "Vibrant Promo",
    prompt: (name: string, brand: string, price: string, category: string) => `
Create a premium square (1:1) product promotional card image with this EXACT design:

BACKGROUND:
- Deep rich gradient: from dark indigo (#1a0533) to deep purple (#2d0a5c) to dark blue (#051a40)
- Subtle bokeh light orbs: some purple, some cyan, very blurred and soft, adding depth

DESIGN LAYOUT:
- A bold frosted glass card in the CENTER with rounded corners (~24px)
- Card border: gradient from purple to cyan, glowing slightly
- Card background: rgba(255,255,255,0.08) - very dark frosted glass

TOP OF CARD:
- Top-left inside card: "SHAHED STORE" in white bold uppercase letters, with a small white star or sparkle icon
- Top-right: "${brand || name}" in white text with brand icon

CENTER OF CARD:
- Large product image/logo for "${name}" centered and prominent
- Product icon is in a separate slightly lighter rounded square container with subtle inner glow

${price ? `PRICE BADGE:
- A vibrant price badge showing "৳${price}" 
- The badge uses a bright gradient (from orange-red to pink) with white text
- Positioned at top-right or bottom-right of product icon` : ""}

BOTTOM OF CARD:
- Frosted glass bottom strip (slightly lighter than card body)
- globe icon + "www.shahedstore.com.bd" — white text
- phone icon + "+880 1840-099853" — white text
- Both centered or side by side

OVERALL: Rich dark premium promotional style, vibrant colors, glassmorphism, suitable for social media posts. Square format exactly.
`.trim(),
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl, productName, category, price, brand, cardStyle } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const name = productName || "Product";
    const selectedStyle = STYLES[cardStyle as keyof typeof STYLES] || STYLES.dark_neon;
    const promptText = selectedStyle.prompt(name, brand || name, price || "", category || "");

    const userContent: any[] = [{ type: "text", text: promptText }];
    if (imageUrl) {
      userContent.push({ type: "image_url", image_url: { url: imageUrl } });
    }

    // Try primary model first, fallback to secondary on 429
    const MODELS = [
      "google/gemini-2.5-flash-image",
      "google/gemini-3.1-flash-image-preview",
    ];

    let data: any = null;

    for (let attempt = 0; attempt < MODELS.length; attempt++) {
      const model = MODELS[attempt];
      console.log(`Attempt ${attempt + 1} with model: ${model}`);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: userContent }],
          modalities: ["image", "text"],
        }),
      });

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Insufficient AI credits. Please top up your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 429) {
        console.warn(`Model ${model} rate limited, trying next...`);
        if (attempt === MODELS.length - 1) {
          return new Response(
            JSON.stringify({ error: "সার্ভার এখন ব্যস্ত। ১-২ মিনিট পর আবার চেষ্টা করুন।" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // Small delay before trying next model
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`AI gateway error ${response.status}: ${errText}`);
      }

      const responseData = await response.json();

      // Check for API-level errors in body (e.g. rate limit returned as 200)
      if (responseData.error) {
        const errCode = responseData.error?.code;
        console.error(`Model ${model} body error:`, JSON.stringify(responseData.error));
        if (errCode === 429 || responseData.error?.status === 429) {
          if (attempt === MODELS.length - 1) {
            return new Response(
              JSON.stringify({ error: "সার্ভার এখন ব্যস্ত। ১-২ মিনিট পর আবার চেষ্টা করুন।" }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }
        if (errCode === 402) {
          return new Response(
            JSON.stringify({ error: "Insufficient AI credits. Please top up your workspace." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(responseData.error?.message || "AI gateway error");
      }

      data = responseData;
      break;
    }

    if (!data) {
      throw new Error("সকল AI মডেল রেট লিমিটেড। একটু পর আবার চেষ্টা করুন।");
    }

    console.log("AI response keys:", JSON.stringify(Object.keys(data)));
    console.log("choices[0].message keys:", JSON.stringify(Object.keys(data.choices?.[0]?.message || {})));

    // Try multiple extraction paths
    let imageData: string | undefined;

    // Path 1: images array (documented format)
    imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    // Path 2: content as array with image parts
    if (!imageData) {
      const content = data.choices?.[0]?.message?.content;
      if (Array.isArray(content)) {
        const imgPart = content.find((p: any) => p.type === "image_url");
        imageData = imgPart?.image_url?.url;
      }
    }

    // Path 3: content as array with inline_data (Gemini native format)
    if (!imageData) {
      const content = data.choices?.[0]?.message?.content;
      if (Array.isArray(content)) {
        const imgPart = content.find((p: any) => p.type === "image" || p.inline_data);
        if (imgPart?.inline_data?.data) {
          imageData = `data:${imgPart.inline_data.mime_type || "image/png"};base64,${imgPart.inline_data.data}`;
        }
      }
    }

    // Path 4: direct base64 in images array with data field
    if (!imageData) {
      const img = data.choices?.[0]?.message?.images?.[0];
      if (img?.data) {
        imageData = `data:image/png;base64,${img.data}`;
      }
    }

    console.log("imageData found:", !!imageData, "prefix:", imageData?.substring(0, 30));

    if (!imageData) {
      console.error("Full response structure:", JSON.stringify(data).substring(0, 500));
      throw new Error("AI did not return an image. Please try again.");
    }

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
