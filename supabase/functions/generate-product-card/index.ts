import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
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
    label: "Soft Aurora",
    prompt: (name: string, brand: string, price: string, category: string) => `
Create a premium square (1:1) product promotional card image with this EXACT design:

BACKGROUND:
- Beautiful soft aurora gradient background flowing diagonally:
  - Top-left: soft mint/seafoam green (#a8edea, #b8f5e8)
  - Center: soft lavender/lilac (#d4b5fc, #c9b1ff)
  - Bottom-right: soft warm peach/apricot (#ffd6b0, #ffe0c2)
- The gradient is smooth, dreamy, organic — like northern lights or watercolor wash
- A few very subtle translucent floating circles/orbs (white, 5-10% opacity) scattered for depth
- Overall feeling: bright, airy, warm, inviting

MAIN CARD:
- A large rounded rectangle card in the CENTER (takes up ~72% of space)
- Card background: WHITE frosted glass — rgba(255,255,255,0.82), heavy backdrop blur
- Border: 1.5px solid rgba(255,255,255,0.9) — crisp white edge
- Very soft colored shadow: 0 20px 60px rgba(180,160,220,0.25) — subtle lavender shadow
- Rounded corners (~26px border-radius)
- The card feels like it's floating on the aurora background

INSIDE THE CARD - TOP ROW:
- Top-left: "SHAHED STORE" in a small rounded pill badge with soft gradient background (mint to lavender), white bold text
- Top-right: "${brand || name}" brand name in a clean white pill with subtle border, dark charcoal text with a small brand icon

INSIDE THE CARD - CENTER:
- The product logo/icon for "${name}" placed LARGE and prominently in the center
- Clean square app icon with rounded corners
- The product icon has a very subtle soft shadow beneath it
- Generous white space around the product icon — let it breathe

${price ? `PRICE BADGE:
- A small elegant rounded pill showing "৳${price}"
- Soft gradient background (mint to lavender), white text
- Positioned subtly below or beside the product icon` : ""}

BOTTOM OF CARD:
- A thin subtle divider line (rgba(0,0,0,0.06))
- Below the line, clean minimal info:
  - Left: globe icon + "www.shahedstore.com.bd" in soft gray text (#6b7280)
  - Right: phone icon + "+880 1840-099853" in soft gray text (#6b7280)
- Small, professional, not distracting

OVERALL AESTHETIC:
- Light, bright, airy, premium — like a luxury skincare or Apple product ad
- Soft aurora/watercolor gradient gives warmth and elegance
- White glass card creates beautiful contrast against the colorful background
- Minimal, clean typography — lots of breathing room
- Professional social media promotional style. Square format exactly.
`.trim(),
  },

  glass_gradient: {
    label: "Glass Gradient Border",
    prompt: (name: string, brand: string, price: string, category: string) => `
Create a premium square (1:1) product promotional card image with this EXACT design:

BACKGROUND:
- Soft, clean, LIGHT background: very light warm gray (#f5f5f7) to soft off-white (#fafafa)
- A very subtle, large soft gradient wash in the background: faint lavender (#ede9fe at 30% opacity) blending with faint mint (#ecfdf5 at 25% opacity) — barely noticeable, just adds warmth
- A few very subtle translucent geometric shapes (circles, soft rectangles) in the background at 3-5% opacity for depth
- Overall: BRIGHT, LIGHT, CLEAN — like Apple's product pages

MAIN GLASSMORPHISM CARD:
- A large rounded rectangle card in the CENTER of the image (takes up ~75% of space)
- Card has rounded corners (~26px border-radius)
- Card background: bright white frosted glass — rgba(255,255,255,0.85), with soft backdrop blur
- THE KEY FEATURE: The card border is a beautiful GRADIENT BORDER:
  - The border is ~2px thick
  - Gradient flows from: soft indigo (#818cf8) → soft purple (#c084fc) → soft pink (#f9a8d4) → soft cyan (#67e8f9) → soft teal (#5eead4) → back to indigo
  - The border has a very soft outer GLOW (subtle pastel halo, like a gentle aura)
  - The glow is delicate — just enough to make the card feel elevated and premium
- Very soft shadow: 0 16px 48px rgba(130,120,180,0.12)

INSIDE THE CARD - TOP ROW:
- Top-left: "SHAHED STORE" in a small rounded pill badge with soft gradient (indigo to purple, pastel), white bold text
- Top-right: "${brand || name}" in a clean pill with subtle light border, dark charcoal text (#374151) with a small brand icon

INSIDE THE CARD - CENTER:
- The product logo/icon for "${name}" placed LARGE and prominently in the center
- Clean square app icon with rounded corners
- The product icon sits on a very subtle inner container with faint gradient border (same pastel gradient but very light)
- Soft subtle shadow beneath the product icon
- Generous white space around — let it breathe

${price ? `PRICE BADGE:
- A small elegant rounded pill showing "৳${price}"
- Soft pastel gradient background (indigo to teal), white text
- Positioned subtly below the product icon` : ""}

BOTTOM OF CARD:
- A thin subtle divider line (rgba(0,0,0,0.05))
- Below the line:
  - Left: globe icon + "www.shahedstore.com.bd" in soft gray text (#9ca3af)
  - Right: phone icon + "+880 1840-099853" in soft gray text (#9ca3af)
- Small, professional, minimal

OVERALL AESTHETIC:
- LIGHT, bright, airy premium glassmorphism
- The pastel gradient border is the HERO ELEMENT — colorful but soft, elegant not flashy
- White/light background with white glass card = clean, modern, Apple-like
- Feels like a high-end product showcase on a luxury e-commerce site
- Professional, minimal, lots of breathing room. Square format exactly.
`.trim(),
  },

  glassmorphism_ui: {
    label: "Glassmorphism UI",
    prompt: (name: string, brand: string, price: string, category: string) => `
Create a clean, premium square (1:1) product card image. Follow these instructions precisely:

LAYOUT: Single white frosted-glass card centered on a soft gradient background. Simple, minimal, no clutter.

BACKGROUND: Smooth diagonal gradient from light lavender (#e8e0f0) top-left to soft peach (#f5e6dc) bottom-right. Clean and simple, no patterns, no dots, no extra shapes.

CARD: Large white rounded rectangle (75% of image, 24px rounded corners). Background: solid white with slight transparency like frosted glass. Border: thin 1.5px white border. Shadow: soft subtle drop shadow below the card. At the very top edge of the card: a thin 2px horizontal accent line, gradient from orange (#f59e0b) on the left to indigo (#6366f1) on the right.

TOP OF CARD: Left side — small rounded orange pill badge with white text "SHAHED STORE". Right side — small rounded light gray pill with dark text "${brand || name}".

CENTER OF CARD: The product "${name}" logo/icon displayed LARGE and centered. The icon should be a clean square with rounded corners (like a mobile app icon). Below the icon, generous empty white space.

${price ? `PRICE: Below the product icon, a small rounded indigo pill badge showing "৳${price}" in white text.` : ""}

BOTTOM OF CARD: A thin light gray horizontal line. Below it: left side "www.shahedstore.com.bd", right side "+880 1840-099853" — both in small gray text.

STYLE: Clean, bright, minimal. White glass card on soft pastel background. Professional e-commerce promotional card. The orange-to-indigo accent line at top is the signature design element. No busy textures, no complex layering — just clean premium simplicity. Square format exactly.
`.trim(),
  },
};

// Extract the short/main product name from a full product title
// e.g. "Microsoft Office 365 Personal Subscription Price in BD" → "Office 365"
function extractShortName(fullName: string): string {
  if (!fullName) return "Product";

  // Remove common Bangladeshi e-commerce suffixes
  let name = fullName
    .replace(/\s*(subscription\s*)?(price\s*)?(in\s*bd|in\s*bangladesh|bangladesh)\s*$/i, "")
    .replace(/\s*(buy\s+online|online|official|genuine|original|authentic|lifetime|yearly|annual|monthly|subscription|plan|license|key|cd|dvd|download)\s*$/i, "")
    .replace(/\s*(personal|family|home|business|professional|enterprise|premium|standard|basic|pro|plus|ultra)\s+subscription\s*$/i, "")
    .trim();

  // Keep only first 3–4 meaningful words (brand + product line)
  const words = name.split(/\s+/);
  if (words.length > 4) {
    // Try to find the product core: brand + product name (usually first 2-3 words)
    name = words.slice(0, 3).join(" ");
  }

  return name || fullName;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // ─── Admin Auth Check ────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: adminRole } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!adminRole) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  // ─────────────────────────────────────────────────────────────────────────────

  try {
    const { imageUrl, productName, category, price, brand, cardStyle } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const fullName = productName || "Product";
    const name = extractShortName(fullName);
    const selectedStyle = STYLES[cardStyle as keyof typeof STYLES] || STYLES.dark_neon;
    const promptText = selectedStyle.prompt(name, brand || name, price || "", category || "");

    const userContent: any[] = [{ type: "text", text: promptText }];
    if (imageUrl) {
      userContent.push({ type: "image_url", image_url: { url: imageUrl } });
    }

    // ── Phase 1: Lovable AI Gateway (best quality models) ─────────────────
    const GATEWAY_MODELS = [
      "google/gemini-3-pro-image-preview",     // highest quality
      "google/gemini-3.1-flash-image-preview", // fast + pro-level
    ];

    let data: any = null;

    for (let attempt = 0; attempt < GATEWAY_MODELS.length; attempt++) {
      const model = GATEWAY_MODELS[attempt];
      console.log(`Gateway attempt ${attempt + 1}: ${model}`);

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
        // credits exhausted — fall through to direct API keys
        console.warn("Gateway credits exhausted, switching to direct Gemini API...");
        break;
      }

      if (response.status === 429) {
        console.warn(`Gateway model ${model} rate limited, trying next...`);
        await new Promise(r => setTimeout(r, 800));
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Gateway error ${response.status}: ${errText}, trying next...`);
        continue;
      }

      const responseData = await response.json();

      if (responseData.error) {
        const code = responseData.error?.code;
        if (code === 429 || responseData.error?.status === 429) {
          console.warn(`Gateway body 429, trying next...`);
          await new Promise(r => setTimeout(r, 800));
          continue;
        }
        if (code === 402) {
          console.warn("Gateway credits exhausted, switching to direct Gemini API...");
          break;
        }
        throw new Error(responseData.error?.message || "AI gateway error");
      }

      // Check if choices[0] itself contains a rate-limit or error (200 OK but error injected)
      const choiceError = responseData.choices?.[0]?.error;
      if (choiceError) {
        const choiceCode = choiceError?.code || choiceError?.metadata?.error_type;
        if (choiceCode === 429 || choiceCode === "rate_limit_exceeded") {
          console.warn(`Gateway choice-level 429 on ${model}, trying next...`);
          await new Promise(r => setTimeout(r, 800));
          continue;
        }
        if (choiceCode === 402) {
          console.warn("Gateway choice-level credits exhausted, switching to direct Gemini API...");
          break;
        }
        console.warn(`Gateway choice-level error on ${model}: ${JSON.stringify(choiceError)}, trying next...`);
        continue;
      }

      // Verify there's actually image data before accepting this response
      const hasImage = !!(
        responseData.choices?.[0]?.message?.images?.[0]?.image_url?.url ||
        responseData.choices?.[0]?.message?.images?.[0]?.data ||
        (Array.isArray(responseData.choices?.[0]?.message?.content) &&
          responseData.choices?.[0]?.message?.content.find((p: any) => p.type === "image_url" || p.inline_data))
      );

      if (!hasImage) {
        console.warn(`Gateway model ${model} returned no image data, trying next...`);
        continue;
      }

      data = responseData;
      break;
    }

    // ── Phase 2: Direct Gemini API with user-provided keys ─────────────────
    if (!data) {
      const GEMINI_KEYS = [
        Deno.env.get("GEMINI_API_KEY"),
        Deno.env.get("GEMINI_API_KEY_2"),
        Deno.env.get("GEMINI_API_KEY_3"),
      ].filter(Boolean) as string[];

      // Use gemini-2.0-flash-preview-image-generation for direct API (high quality)
      const DIRECT_MODEL = "gemini-2.0-flash-preview-image-generation";

      for (let i = 0; i < GEMINI_KEYS.length; i++) {
        const apiKey = GEMINI_KEYS[i];
        console.log(`Direct Gemini attempt ${i + 1} with key ${i + 1}...`);

        // Build parts for direct Gemini API
        const parts: any[] = [{ text: promptText }];
        if (imageUrl) {
          // Fetch the image and convert to base64 for direct API
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

        const directResp = await fetch(
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

        if (directResp.status === 429) {
          console.warn(`Direct key ${i + 1} rate limited, trying next key...`);
          await new Promise(r => setTimeout(r, 800));
          continue;
        }

        if (!directResp.ok) {
          const errText = await directResp.text();
          console.warn(`Direct key ${i + 1} error ${directResp.status}: ${errText}`);
          continue;
        }

        const directData = await directResp.json();
        const inlinePart = directData.candidates?.[0]?.content?.parts?.find(
          (p: any) => p.inlineData?.data
        );

        if (inlinePart?.inlineData?.data) {
          const mime = inlinePart.inlineData.mimeType || "image/jpeg";
          const imageData = `data:${mime};base64,${inlinePart.inlineData.data}`;
          console.log("Direct Gemini image generated successfully");
          return new Response(JSON.stringify({ imageData }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.warn(`Direct key ${i + 1} returned no image data`);
      }

      return new Response(
        JSON.stringify({ error: "সকল AI কী রেট লিমিটেড। কিছুক্ষণ পর আবার চেষ্টা করুন।" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI response keys:", JSON.stringify(Object.keys(data)));
    console.log("choices[0].message keys:", JSON.stringify(Object.keys(data.choices?.[0]?.message || {})));

    // ── Extract image from response (multiple paths) ─────────────────────────
    let rawBase64: string | undefined;
    let mimeType = "image/jpeg";

    // Path 1: images array with image_url (Lovable gateway documented format)
    const img0 = data.choices?.[0]?.message?.images?.[0];
    if (img0?.image_url?.url) {
      const url: string = img0.image_url.url;
      if (url.startsWith("data:")) {
        const [meta, b64] = url.split(",");
        rawBase64 = b64;
        mimeType = meta.replace("data:", "").replace(";base64", "") || mimeType;
      } else {
        // It's a real URL — fetch and convert
        try {
          const fetchResp = await fetch(url);
          if (fetchResp.ok) {
            const buf = await fetchResp.arrayBuffer();
            rawBase64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
            mimeType = fetchResp.headers.get("content-type") || mimeType;
          }
        } catch (_) { /* fall through */ }
      }
    }

    // Path 2: images[0].data (raw base64 without prefix)
    if (!rawBase64 && img0?.data) {
      rawBase64 = img0.data;
      mimeType = img0.mimeType || img0.mime_type || mimeType;
    }

    // Path 3: content array — image_url type
    if (!rawBase64) {
      const content = data.choices?.[0]?.message?.content;
      if (Array.isArray(content)) {
        const imgPart = content.find((p: any) => p.type === "image_url");
        if (imgPart?.image_url?.url) {
          const url: string = imgPart.image_url.url;
          if (url.startsWith("data:")) {
            const [meta, b64] = url.split(",");
            rawBase64 = b64;
            mimeType = meta.replace("data:", "").replace(";base64", "") || mimeType;
          }
        }
      }
    }

    // Path 4: content array — inline_data type (Gemini native)
    if (!rawBase64) {
      const content = data.choices?.[0]?.message?.content;
      if (Array.isArray(content)) {
        const imgPart = content.find((p: any) => p.inline_data?.data || p.type === "image");
        if (imgPart?.inline_data?.data) {
          rawBase64 = imgPart.inline_data.data;
          mimeType = imgPart.inline_data.mime_type || mimeType;
        }
      }
    }

    console.log("rawBase64 extracted:", !!rawBase64, "mime:", mimeType);

    if (!rawBase64) {
      console.error("Full response structure:", JSON.stringify(data).substring(0, 800));
      throw new Error("AI did not return an image. Please try again.");
    }

    // ── Upload to Supabase Storage ─────────────────────────────────────────
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (SUPABASE_URL && SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
        const ext = mimeType.includes("png") ? "png" : "jpg";
        const filename = `ai-card-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

        // Decode base64 to binary
        const binaryStr = atob(rawBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

        console.log(`Uploading image (mime: ${mimeType}) to storage...`);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filename, bytes.buffer, { contentType: mimeType, upsert: false });

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(uploadData.path);
          const uploadedUrl = publicUrlData.publicUrl;
          console.log("Image uploaded:", uploadedUrl);
          return new Response(JSON.stringify({ imageUrl: uploadedUrl }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          console.warn("Storage upload failed:", uploadError?.message, "— returning base64");
        }
      } catch (uploadEx) {
        console.warn("Storage upload exception:", uploadEx, "— returning base64");
      }
    }

    // Fallback: return base64 directly if storage unavailable
    const imageData = `data:${mimeType};base64,${rawBase64}`;
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
