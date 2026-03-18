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

STYLE: Clean, minimal, white aesthetic. Inspired by CamScanner/clean product card style. Slight red/orange accent. Square format exactly.
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

// ── Upload base64 image to Supabase Storage ──────────────────────────────────
async function uploadImageToStorage(base64Data: string, mimeType: string): Promise<string> {
  const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") || "").trim();
  const SUPABASE_SERVICE_ROLE_KEY = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").trim();

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Storage credentials not configured");
  }

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

// ── Helper ───────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function extractImageFromGatewayResponse(responseData: any): { data: string; mime: string } | null {
  const msg = responseData.choices?.[0]?.message;
  if (!msg) return null;

  const img1 = msg?.images?.[0];
  if (img1?.image_url?.url?.startsWith("data:")) {
    const [prefix, b64] = img1.image_url.url.split(",");
    return { data: b64, mime: prefix.split(":")[1].split(";")[0] };
  }
  if (img1?.data) return { data: img1.data, mime: "image/jpeg" };

  if (Array.isArray(msg?.content)) {
    const imgPart = msg.content.find((p: any) => p.type === "image_url" && p.image_url?.url?.startsWith("data:"));
    if (imgPart) {
      const [prefix, b64] = imgPart.image_url.url.split(",");
      return { data: b64, mime: prefix.split(":")[1].split(";")[0] };
    }
    const inlinePart = msg.content.find((p: any) => p.inline_data?.data);
    if (inlinePart) return { data: inlinePart.inline_data.data, mime: inlinePart.inline_data.mime_type || "image/png" };
  }
  return null;
}

function extractImageFromGeminiResponse(data: any): { data: string; mime: string } | null {
  const inlinePart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
  if (inlinePart) return { data: inlinePart.inlineData.data, mime: inlinePart.inlineData.mimeType || "image/jpeg" };
  return null;
}

// ── Main handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl, productName, category, price, brand, cardStyle } = await req.json();

    const LOVABLE_API_KEY = (Deno.env.get("LOVABLE_API_KEY") || "").trim();

    const name = productName || "Product";
    const selectedStyle = STYLES[cardStyle as keyof typeof STYLES] || STYLES.dark_neon;
    const promptText = selectedStyle.prompt(name, brand || name, price || "", category || "");

    // Collect all 6 Gemini keys (skip empty ones)
    const GEMINI_KEYS = [
      "GEMINI_API_KEY", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3",
      "GEMINI_API_KEY_4", "GEMINI_API_KEY_5", "GEMINI_API_KEY_6",
    ]
      .map(k => (Deno.env.get(k) || "").trim())
      .filter(Boolean);

    console.log(`Available Gemini keys: ${GEMINI_KEYS.length}`);

    // Preload product image as base64 ONCE — reused across all retries
    let productImageBase64: string | null = null;
    let productImageMime = "image/jpeg";
    if (imageUrl) {
      try {
        const imgResp = await fetch(imageUrl, { signal: AbortSignal.timeout(12000) });
        if (imgResp.ok) {
          const buf = await imgResp.arrayBuffer();
          productImageBase64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
          productImageMime = imgResp.headers.get("content-type") || "image/jpeg";
          console.log("Product image preloaded");
        }
      } catch (e) {
        console.warn("Could not preload product image, using text-only prompt");
      }
    }

    let imageData: string | undefined;
    let imageMime = "image/jpeg";

    // ── Phase 1: Lovable AI Gateway ──────────────────────────────────────────
    if (LOVABLE_API_KEY) {
      const userContent: any[] = [{ type: "text", text: promptText }];
      if (imageUrl) userContent.push({ type: "image_url", image_url: { url: imageUrl } });

      const GATEWAY_MODELS = [
        "google/gemini-3-pro-image-preview",
        "google/gemini-3.1-flash-image-preview",
      ];

      for (const model of GATEWAY_MODELS) {
        if (imageData) break;
        console.log(`Gateway: ${model}`);
        try {
          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: userContent }],
              modalities: ["image", "text"],
            }),
            signal: AbortSignal.timeout(55000),
          });

          if (response.status === 402) { console.warn("Gateway credits exhausted"); break; }
          if (response.status === 429) { console.warn(`Gateway ${model} rate limited`); continue; }
          if (!response.ok) { console.warn(`Gateway ${model} error ${response.status}`); continue; }

          let responseData: any;
          try { responseData = await response.json(); } catch { continue; }

          if (responseData.error?.code === 402) break;
          if (responseData.error?.code === 429) continue;
          if (responseData.choices?.[0]?.error?.code === 429) continue;
          if (responseData.error || responseData.choices?.[0]?.error) continue;

          const extracted = extractImageFromGatewayResponse(responseData);
          if (extracted) {
            imageData = extracted.data;
            imageMime = extracted.mime;
            console.log(`✓ Gateway success: ${model}`);
          }
        } catch (err) {
          console.warn(`Gateway ${model} exception: ${err}`);
        }
      }
    }

    // ── Phase 2: Direct Gemini API — rotate all 6 keys × 2 models ───────────
    if (!imageData && GEMINI_KEYS.length > 0) {
      const DIRECT_MODELS = [
        "gemini-2.0-flash-preview-image-generation",
        "gemini-imagen-3.0-generate-002",
      ];

      const baseParts: any[] = [{ text: promptText }];
      if (productImageBase64) {
        baseParts.push({ inline_data: { mime_type: productImageMime, data: productImageBase64 } });
      }

      outerLoop:
      for (const apiKey of GEMINI_KEYS) {
        for (const directModel of DIRECT_MODELS) {
          if (imageData) break outerLoop;
          console.log(`Direct Gemini [key …${apiKey.slice(-4)}] ${directModel}`);
          try {
            const directResp = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${directModel}:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ parts: baseParts }],
                  generationConfig: {
                    responseModalities: ["IMAGE", "TEXT"],
                    responseMimeType: "image/jpeg",
                  },
                }),
                signal: AbortSignal.timeout(55000),
              }
            );

            if (directResp.status === 429) {
              console.warn(`Key …${apiKey.slice(-4)} rate limited, trying next key...`);
              break; // move to next key
            }
            if (!directResp.ok) {
              let et = ""; try { et = await directResp.text(); } catch {}
              console.warn(`Key …${apiKey.slice(-4)} ${directModel} error ${directResp.status}: ${et}`);
              continue;
            }

            let directData: any;
            try { directData = await directResp.json(); } catch { continue; }

            const extracted = extractImageFromGeminiResponse(directData);
            if (extracted) {
              imageData = extracted.data;
              imageMime = extracted.mime;
              console.log(`✓ Direct Gemini success: key …${apiKey.slice(-4)} ${directModel}`);
              break outerLoop;
            }
          } catch (err) {
            console.warn(`Direct Gemini exception: ${err}`);
          }
        }
        if (!imageData) await sleep(300);
      }
    }

    if (!imageData) {
      return new Response(
        JSON.stringify({ error: "AI ছবি তৈরি করতে পারেনি। কিছুক্ষণ পরে আবার চেষ্টা করুন।" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Upload to Storage ────────────────────────────────────────────────────
    console.log(`Uploading image (mime: ${imageMime}) to storage...`);
    const publicUrl = await uploadImageToStorage(imageData, imageMime);
    console.log("Image uploaded:", publicUrl);

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
