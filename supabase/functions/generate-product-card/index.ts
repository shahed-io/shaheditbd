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

MAIN CARD ELEMENT:
- A large frosted glass card in CENTER (takes up ~72% of image)
- Card: frosted glass / glassmorphism — semi-transparent white (rgba(255,255,255,0.35)), blur effect, very soft rounded corners (20-24px)
- Subtle white border (1px, rgba(255,255,255,0.6))
- Delicate drop shadow (soft, not harsh)
- Product image "${name}" prominently in center of card, large, clean with soft drop shadow

TOP AREA:
- Small pill/badge top-center or top-right: "${category || 'Software'}" in a soft colored pill
- Brand name "${brand || name}" in soft dark text

BOTTOM STRIP (inside card, frosted):
- globe icon + "www.shahedstore.com.bd"
- phone icon + "+880 1840-099853"
- Soft gray/dark text

CORNER:
- "SHAHED STORE" top-left in bold semi-transparent dark text

OVERALL: Elegant, airy, pastel glassmorphism aesthetic, premium feel, soft colors. Square format exactly.
`.trim(),
  },

  clean_light: {
    label: "Clean Light",
    prompt: (name: string, brand: string, price: string, category: string) => `
Create a premium square (1:1) product promotional card image with this EXACT design:

BACKGROUND:
- Clean pure white or very light gray (#f8f9fa) background
- Subtle bokeh or soft focus circles in very light pastel (barely visible)

MAIN CARD ELEMENT:
- Clean minimal white card CENTER (takes ~75% space), subtle border-radius
- Very thin light gray border or soft box-shadow (no harsh edges)
- Product image/logo "${name}" large and prominent in card center, with soft drop shadow
- Clean, breathable negative space around the product image

PRICE TAG:
- Bold price display "${price ? '৳' + price : ''}" in prominent text, vivid red or orange accent
- "SHAHED STORE" badge in top corner, red accent color

TOP SECTION:
- Brand "${brand || name}" name in clean bold black text
- Category pill "${category || 'Software'}" in accent color

BOTTOM SECTION (clean strip):
- "www.shahedstore.com.bd" — dark text, globe icon
- "+880 1840-099853" — dark text, phone icon

STYLE: Clean, minimal, white aesthetic. Inspired by CamScanner/clean product card style. Slight red/orange accent. Boke blur + lal Shahed Store badge reference. Square format exactly.
`.trim(),
  },

  vibrant_promo: {
    label: "Vibrant Promo",
    prompt: (name: string, brand: string, price: string, category: string) => `
Create a premium square (1:1) product promotional card image with this EXACT design:

BACKGROUND:
- Rich deep purple to dark magenta gradient (#2d0057 → #6b0099 → #9b00cc)
- Scattered small bright glowing particles/sparkles in the background
- Dynamic diagonal light streaks (subtle)

MAIN CARD ELEMENT:
- Rounded rectangle card CENTER (~70% space)
- Card: dark semi-transparent purple (rgba(20,0,40,0.75)) with vivid gradient border: purple → pink → orange → yellow
- Border glows vibrantly
- Product image "${name}" large, centered, with vibrant glow halo around it

PRICE/OFFER:
- Large bold price "${price ? '৳' + price : ''}" in bright yellow/gold text
- "BUY NOW" or "GET IT NOW" in accent button style at bottom inside card

BRAND SECTION:
- "SHAHED STORE" prominent top-left or top-center in bold white
- Brand "${brand || name}" subtitle

BOTTOM STRIP:
- "www.shahedstore.com.bd" in white
- "+880 1840-099853" in white

OVERALL: Rich dark purple, vibrant glowing borders, energetic promotional style. Deep purple, vibrant. Square format exactly.
`.trim(),
  },
};

// Helper: upload base64 image to Supabase Storage and return public URL
async function uploadImageToStorage(base64Data: string, mimeType: string): Promise<string> {
  // Trim any accidental whitespace/newlines from env vars
  const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") || "").trim();
  const SUPABASE_SERVICE_ROLE_KEY = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").trim();

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Storage credentials not configured");
  }

  // Convert base64 to binary
  const binaryStr = atob(base64Data);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
  const fileName = `ai-card-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const uploadResp = await fetch(
    `${SUPABASE_URL}/storage/v1/object/product-images/${fileName}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": mimeType,
        "x-upsert": "true",
      },
      body: bytes,
    }
  );

  if (!uploadResp.ok) {
    const errText = await uploadResp.text();
    console.error("Storage upload failed:", errText);
    throw new Error(`Storage upload failed: ${errText}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${fileName}`;
}

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

    // ── Phase 1: Lovable AI Gateway (best quality models) ─────────────────
    const GATEWAY_MODELS = [
      "google/gemini-3-pro-image-preview",
      "google/gemini-3.1-flash-image-preview",
    ];

    let imageData: string | undefined;
    let imageMime = "image/png";

    for (let attempt = 0; attempt < GATEWAY_MODELS.length; attempt++) {
      const model = GATEWAY_MODELS[attempt];
      console.log(`Gateway attempt ${attempt + 1}: ${model}`);

      let response: Response;
      try {
        response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
      } catch (fetchErr) {
        console.warn(`Gateway fetch error on ${model}: ${fetchErr}`);
        continue;
      }

      if (response.status === 402) {
        console.warn("Gateway credits exhausted, switching to direct Gemini API...");
        break;
      }

      if (response.status === 429) {
        console.warn(`Gateway model ${model} rate limited, trying next...`);
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      if (!response.ok) {
        let errText = "";
        try { errText = await response.text(); } catch { /* ignore */ }
        console.warn(`Gateway error ${response.status}: ${errText}, trying next...`);
        continue;
      }

      let responseData: any;
      try {
        responseData = await response.json();
      } catch (bodyErr) {
        console.warn(`Body read error on ${model}: ${bodyErr}. Retrying next model...`);
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      if (responseData.error) {
        const code = responseData.error?.code;
        if (code === 429 || responseData.error?.status === 429) {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        if (code === 402) break;
        console.warn(`Gateway error body: ${JSON.stringify(responseData.error)}`);
        continue;
      }

      const choiceError = responseData.choices?.[0]?.error;
      if (choiceError) {
        const choiceCode = choiceError?.code || choiceError?.metadata?.error_type;
        if (choiceCode === 429 || choiceCode === "rate_limit_exceeded") {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        if (choiceCode === 402) break;
        continue;
      }

      // Extract image from response
      const msg = responseData.choices?.[0]?.message;

      // Path 1: images array
      const img1 = msg?.images?.[0];
      if (img1?.image_url?.url) {
        const url: string = img1.image_url.url;
        if (url.startsWith("data:")) {
          const [prefix, b64] = url.split(",");
          imageMime = prefix.split(":")[1].split(";")[0];
          imageData = b64;
        }
      }

      // Path 2: content array
      if (!imageData && Array.isArray(msg?.content)) {
        const imgPart = msg.content.find((p: any) => p.type === "image_url");
        if (imgPart?.image_url?.url?.startsWith("data:")) {
          const [prefix, b64] = imgPart.image_url.url.split(",");
          imageMime = prefix.split(":")[1].split(";")[0];
          imageData = b64;
        }
      }

      // Path 3: inline_data
      if (!imageData && Array.isArray(msg?.content)) {
        const imgPart = msg.content.find((p: any) => p.inline_data?.data);
        if (imgPart) {
          imageMime = imgPart.inline_data.mime_type || "image/png";
          imageData = imgPart.inline_data.data;
        }
      }

      // Path 4: images[0].data
      if (!imageData && img1?.data) {
        imageData = img1.data;
      }

      if (imageData) {
        console.log(`Image extracted from gateway model ${model}`);
        break;
      }

      console.warn(`Gateway model ${model} returned no image, trying next...`);
    }

    // ── Phase 2: Direct Gemini API ──────────────────────────────────────────
    if (!imageData) {
      const GEMINI_KEYS = [
        Deno.env.get("GEMINI_API_KEY"),
        Deno.env.get("GEMINI_API_KEY_2"),
        Deno.env.get("GEMINI_API_KEY_3"),
      ].filter(Boolean) as string[];

      const DIRECT_MODEL = "gemini-2.0-flash-preview-image-generation";

      for (let i = 0; i < GEMINI_KEYS.length; i++) {
        const apiKey = GEMINI_KEYS[i];
        console.log(`Direct Gemini attempt ${i + 1}...`);

        const parts: any[] = [{ text: promptText }];
        if (imageUrl) {
          try {
            const imgResp = await fetch(imageUrl);
            if (imgResp.ok) {
              const imgBuf = await imgResp.arrayBuffer();
              const base64 = btoa(String.fromCharCode(...new Uint8Array(imgBuf)));
              const mimeType = imgResp.headers.get("content-type") || "image/jpeg";
              parts.push({ inline_data: { mime_type: mimeType, data: base64 } });
            }
          } catch (e) {
            console.warn("Could not fetch image for direct API, text-only prompt");
          }
        }

        let directResp: Response;
        try {
          directResp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${DIRECT_MODEL}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: {
                  responseModalities: ["IMAGE", "TEXT"],
                  responseMimeType: "image/jpeg",
                },
              }),
            }
          );
        } catch (fetchErr) {
          console.warn(`Direct API fetch error: ${fetchErr}`);
          continue;
        }

        if (directResp.status === 429) {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }

        if (!directResp.ok) {
          let errText = "";
          try { errText = await directResp.text(); } catch { /* ignore */ }
          console.warn(`Direct key ${i + 1} error: ${errText}`);
          continue;
        }

        let directData: any;
        try {
          directData = await directResp.json();
        } catch (bodyErr) {
          console.warn(`Direct body read error: ${bodyErr}`);
          continue;
        }

        const inlinePart = directData.candidates?.[0]?.content?.parts?.find(
          (p: any) => p.inlineData?.data
        );

        if (inlinePart?.inlineData?.data) {
          imageMime = inlinePart.inlineData.mimeType || "image/jpeg";
          imageData = inlinePart.inlineData.data;
          console.log("Direct Gemini image generated successfully");
          break;
        }

        console.warn(`Direct key ${i + 1} returned no image`);
      }
    }

    if (!imageData) {
      return new Response(
        JSON.stringify({ error: "AI ছবি তৈরি করতে পারেনি। একটু পরে আবার চেষ্টা করুন।" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Upload image to storage server-side ─────────────────────────────────
    console.log(`Uploading image (mime: ${imageMime}) to storage...`);
    const publicUrl = await uploadImageToStorage(imageData, imageMime);
    console.log("Image uploaded:", publicUrl);

    // Return only the URL — no large base64 sent to client
    return new Response(
      JSON.stringify({ imageUrl: publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("generate-product-card error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
