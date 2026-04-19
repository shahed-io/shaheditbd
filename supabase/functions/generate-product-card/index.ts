import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
};

// ─── SHARED DESIGN BLUEPRINT ─────────────────────────────────────────────────
// Every style MUST follow this exact "old design" structure (matches the
// reference screenshots from ~15 days ago):
//   1. Pastel gradient background (lavender/pink/peach/mint/blue) — NOT plain
//   2. Multiple soft floating bokeh ORBS / 3D translucent balls scattered
//      around the card (light blue, mint/teal, soft white) — these MUST be
//      clearly visible behind and around the card to give depth
//   3. A single large WHITE FROSTED GLASS card centered (~75% of image)
//   4. Inside the card top-left: red rounded "SHAHED STORE" badge (white text
//      on a bright red rectangle pill)
//   5. Inside the card top-right: white pill containing the product/brand
//      name + tiny brand logo
//   6. Center of the card: VERY LARGE clean square app icon of the product
//   7. Bottom of the card: a subtle thin contact line containing
//      🌐 www.shahedstore.com.bd     📞 +880 1840-099853
//      in dark charcoal text — this line lives INSIDE the white glass card,
//      NOT as a separate floating bar outside
// ─────────────────────────────────────────────────────────────────────────────

const sharedBlueprint = (name: string, brand: string) => `
You MUST create a premium square (1:1) product promotional card that EXACTLY matches the Shahed Store house style. This layout is non-negotiable — every element must be present and look like the reference cards (Canva Pro, AutoDesk, ChatGPT Plus, Duolingo, HIX.AI cards previously made for this store):

═══ BACKGROUND (full canvas, behind everything) ═══
- A SOFT PASTEL DIAGONAL GRADIENT covering the ENTIRE canvas:
  • Top-left: soft lavender / lilac (#c9b6f0 → #d4baf5)
  • Top-right: soft pink / rose (#f5b6c9 → #f4c2d2)
  • Bottom-left: soft sky blue (#b6c9f0 → #b8d4f0)
  • Bottom-right: soft warm peach / coral (#f5c9b6 → #f6cfb5)
  • Smooth painterly blend across the diagonal — NO harsh lines, NO solid colors, NO plain white, NO dark background
- Scatter 8–12 soft TRANSLUCENT 3D BUBBLES / SPHERES around the card edges and corners:
  • Pure soft white / pale blue translucent bubbles (rgba(255,255,255,0.4–0.6))
  • Sizes vary: small 30–60px and large 100–200px
  • Each bubble has a subtle inner highlight on the upper-left to look like a 3D glass ball
  • Place them BEHIND and peeking around the card — top corners, mid-left, mid-right, bottom corners
  • Some bubbles partially overlap the card edges to add depth
  • These bubbles are a SIGNATURE element — they MUST be clearly visible

═══ MAIN CARD (centered, ~78% of canvas) ═══
- One large rounded rectangle FROSTED GLASS card
- Background: rgba(255,255,255,0.35) with strong backdrop blur (heavy frosted look)
- Border: 1.5px solid rgba(255,255,255,0.7)
- Corner radius: ~32px
- Soft shadow: 0 24px 60px rgba(120,130,180,0.18)
- The pastel gradient background should subtly show THROUGH the frosted card

═══ TOP ROW INSIDE CARD (24px padding from card edges) ═══
- LEFT — "SHAHED STORE" BADGE:
  • A frosted TRANSLUCENT GLASS PILL (rgba(255,255,255,0.25), 1px white border, backdrop blur)
  • Rounded fully (pill shape, ~24px radius, ~50px tall)
  • Inside text: "SHAHED STORE" in WHITE BOLD uppercase sans-serif, letter-spaced, crisp
  • This is a glass pill — NOT a red badge, NOT solid color
- RIGHT — BRAND PILL:
  • A clean SOLID WHITE rounded pill (rgba(255,255,255,0.95), subtle shadow, ~24px radius, ~50px tall)
  • Contains a small square brand/product LOGO ICON on the left (~32px, rounded corners)
  • Followed by the brand/product name "${brand || name}" in dark charcoal (#1f2937 / #111827) bold sans-serif
  • Logo + text fit snugly inside the pill with comfortable padding

═══ CENTER OF CARD (the hero) ═══
- The product "${name}" displayed as a VERY LARGE clean app-icon / logo
- Either a rounded square app icon (~22% radius) OR the official brand logo if iconic
- Size: takes ~45–55% of card width
- Generous breathing room above and below
- Subtle soft drop shadow beneath the icon: 0 12px 30px rgba(0,0,0,0.12)
- The icon should look crisp, vibrant, premium — like an Apple App Store hero icon
- NO price, NO discount badge, NO extra text near the icon (brand name may appear UNDER the icon ONLY if it is part of the official logo lockup, like "duolingo" wordmark)

═══ BOTTOM CONTACT LINE INSIDE CARD ═══
- A single thin horizontal contact line near the bottom edge of the card (24px from bottom)
- Lives INSIDE the frosted glass card — NOT a separate floating bar outside
- Two items aligned left and centered/right with comfortable spacing:
  • A small circular outlined GLOBE icon with a tiny cursor arrow on it, then "www.shahedstore.com.bd"
  • A small circular outlined PHONE handset icon, then "+880 1840-099853"
- Text: dark charcoal (#1f2937), clean BOLD sans-serif, ~14–16px, very readable
- Icons are thin-outline style (1.5px stroke), dark charcoal, inside small circular outlines

═══ ABSOLUTE RULES ═══
- The "SHAHED STORE" pill is a FROSTED GLASS pill with WHITE TEXT — NEVER a red badge
- The brand pill on the right is a SOLID WHITE pill with the brand logo + name
- The contact info MUST be INSIDE the frosted card (bottom area) — never detached
- The floating translucent bubbles MUST be visible around the card edges
- Pastel diagonal gradient background — lavender / pink / peach / blue
- NO price tag, NO discount badge, NO marketing text
- Square format exactly (1:1)
- Every element crisp, readable, premium — luxury digital store aesthetic
`.trim();

const STYLES = {
  dark_neon: {
    label: "Dark Neon",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Dark Neon" tone ═══
- Override ONLY the background gradient: deep midnight indigo (#0a0d2e) blending into deep purple (#1a0d3a) with a hint of electric blue (#0e2a5c)
- Translucent bubbles glow with neon cyan, electric purple, hot pink — luminous against the dark background
- The frosted card becomes a SEMI-TRANSPARENT DARK GLASS card: rgba(15,15,40,0.45) with a glowing 2px gradient neon border (purple → cyan → pink) and a soft outer neon halo
- "SHAHED STORE" pill stays a frosted glass pill with WHITE bold text (do not change to red)
- Brand pill on the right: dark glass (rgba(20,20,50,0.6)) with WHITE text instead of charcoal
- Bottom contact line text: light gray (#e5e7eb) for readability
- Vibe: cyberpunk premium, glowing, luxurious
`.trim(),
  },

  light_glass: {
    label: "Light Glass",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Light Glass" tone ═══
- Keep the signature pastel diagonal gradient (lavender → pink → peach → blue) — exactly as in the shared blueprint
- Make the bubbles slightly more prominent and frosted (this is the signature Shahed Store look)
- Vibe: warm, luxurious, magazine-quality, bright daylight pastel
`.trim(),
  },

  clean_light: {
    label: "Clean Light",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Clean Light" tone ═══
- Slightly cooler pastel gradient: more sky blue and lilac, less peach (still smooth diagonal blend)
- Bubbles: soft sky blue and white glow, very visible
- Vibe: clean, minimal, corporate-premium, Apple product page energy
`.trim(),
  },

  vibrant_promo: {
    label: "Soft Aurora",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Soft Aurora" tone ═══
- Slightly more saturated aurora pastel — soft mint/seafoam mixed into the lavender → pink → peach diagonal blend
- Bubbles: pastel mint, lavender, peach — varied colors, dreamy
- Vibe: bright, airy, dreamy, premium aurora aesthetic
`.trim(),
  },

  glass_gradient: {
    label: "Glass Gradient Border",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Glass Gradient Border" tone ═══
- Keep the signature pastel diagonal gradient background (lavender → pink → peach → blue)
- The frosted card border becomes a beautiful 2px GRADIENT BORDER flowing: indigo (#818cf8) → purple (#c084fc) → pink (#f9a8d4) → cyan (#67e8f9) → teal (#5eead4)
- Gradient border has a delicate soft outer pastel halo
- Bubbles still visible around the card
- Vibe: bright, airy, modern Apple-like glassmorphism with a rainbow accent
`.trim(),
  },

  glassmorphism_ui: {
    label: "Glassmorphism UI",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Glassmorphism UI" tone ═══
- Keep the signature pastel diagonal gradient (lavender → pink → peach → blue) — slightly brighter/whiter overall
- A bold 3px horizontal gradient accent line (gold → pink → cyan) at the very TOP edge of the card
- Bubbles still visible around the card
- Vibe: BRIGHT, premium, luxurious — like Apple/Samsung product launch graphics
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

    let data: any = null;

    // ── Phase 1: Direct Gemini API with USER-PROVIDED keys (FREE — no Lovable credits) ──
    // We support both the legacy sequential secret names and indexed names so
    // existing configured keys are all picked up reliably.
    const USER_GEMINI_KEYS = Array.from(new Set([
      Deno.env.get("GEMINI_API_KEY"),
      Deno.env.get("GEMINI_API_KEY_1"),
      Deno.env.get("GEMINI_API_KEY_2"),
      Deno.env.get("GEMINI_API_KEY_3"),
      Deno.env.get("GEMINI_API_KEY_4"),
      Deno.env.get("GEMINI_API_KEY_5"),
      Deno.env.get("GEMINI_API_KEY_6"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY"),
    ].filter(Boolean) as string[]));

    // Only valid image-generation model names for Direct Gemini API (v1beta)
    const DIRECT_IMAGE_MODELS = [
      "gemini-2.5-flash-image",         // primary stable image model
      "gemini-2.5-flash-image-preview", // preview alias (some keys have access)
    ];

    // Pre-fetch reference image once (if provided) and convert to base64
    let refImagePart: any = null;
    if (imageUrl) {
      try {
        const imgResp = await fetch(imageUrl);
        if (imgResp.ok) {
          const imgBuf = await imgResp.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(imgBuf)));
          const mimeType = imgResp.headers.get("content-type") || "image/jpeg";
          refImagePart = { inline_data: { mime_type: mimeType, data: base64 } };
        }
      } catch (_) { /* text-only fallback */ }
    }

    // Shuffle keys to distribute load across all 6 keys (avoids always
    // hitting key#1 first which gets exhausted faster than others).
    const shuffledKeyIndices = USER_GEMINI_KEYS
      .map((_, i) => i)
      .sort(() => Math.random() - 0.5);

    outer: for (const ki of shuffledKeyIndices) {
      const apiKey = USER_GEMINI_KEYS[ki];
      let keyExhausted = false;

      for (let mi = 0; mi < DIRECT_IMAGE_MODELS.length; mi++) {
        if (keyExhausted) break;
        const model = DIRECT_IMAGE_MODELS[mi];
        console.log(`Direct Gemini — key#${ki + 1}, model=${model}`);

        const parts: any[] = [{ text: promptText }];
        if (refImagePart) parts.push(refImagePart);

        try {
          const directResp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
              }),
            }
          );

          // 429 = quota exhausted for THIS key → skip to next key
          // 503 = service overloaded → also try next key
          if (directResp.status === 429 || directResp.status === 503) {
            console.warn(`key#${ki + 1} ${model} → ${directResp.status}, skipping key`);
            await directResp.text().catch(() => {});
            keyExhausted = true;
            continue;
          }

          if (!directResp.ok) {
            const errText = await directResp.text();
            console.warn(`key#${ki + 1} ${model} → ${directResp.status}: ${errText.substring(0, 200)}`);
            // 400/404 = model unsupported on this key → try next model
            // If errText mentions quota/billing, mark key exhausted
            if (/quota|billing|exceeded|limit/i.test(errText)) {
              keyExhausted = true;
            }
            continue;
          }

          const directData = await directResp.json();
          const inlinePart = directData.candidates?.[0]?.content?.parts?.find(
            (p: any) => p.inlineData?.data || p.inline_data?.data
          );
          const inline = inlinePart?.inlineData || inlinePart?.inline_data;

          if (inline?.data) {
            const mime = inline.mimeType || inline.mime_type || "image/png";
            console.log(`✅ Direct Gemini success — key#${ki + 1}, model=${model}`);
            data = {
              choices: [{
                message: {
                  images: [{ image_url: { url: `data:${mime};base64,${inline.data}` } }]
                }
              }]
            };
            break outer;
          }

          console.warn(`key#${ki + 1} ${model} → no image data in response`);
        } catch (e) {
          console.warn(`key#${ki + 1} ${model} → exception: ${e instanceof Error ? e.message : e}`);
        }
      }
    }

    // ── Phase 2: Lovable AI Gateway fallback (uses Lovable credits) ─────────
    const GATEWAY_MODELS = [
      "google/gemini-3-pro-image-preview",
      "google/gemini-3.1-flash-image-preview",
    ];

    if (!data) {
      for (let attempt = 0; attempt < GATEWAY_MODELS.length; attempt++) {
        const model = GATEWAY_MODELS[attempt];
        console.log(`Gateway fallback attempt ${attempt + 1}: ${model}`);

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
          console.warn("Gateway credits exhausted");
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
            await new Promise(r => setTimeout(r, 800));
            continue;
          }
          if (code === 402) break;
          continue;
        }

        const choiceError = responseData.choices?.[0]?.error;
        if (choiceError) {
          const choiceCode = choiceError?.code || choiceError?.metadata?.error_type;
          if (choiceCode === 429 || choiceCode === "rate_limit_exceeded") {
            await new Promise(r => setTimeout(r, 800));
            continue;
          }
          if (choiceCode === 402) break;
          continue;
        }

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
    }

    // ── Final check: if all sources failed ────────────────────────────────────
    // IMPORTANT: return HTTP 200 with structured error so the client can read
    // the body and show a friendly toast (avoids supabase-js throwing on 4xx
    // which causes the global error boundary blank screen).
    if (!data) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "সকল AI মডেল এই মুহূর্তে ব্যস্ত (rate limited)। ১-২ মিনিট পর আবার চেষ্টা করুন।",
          fallback: true,
          code: "RATE_LIMITED",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    // Return 200 with structured error → prevents supabase-js from throwing
    // and prevents the global error boundary blank screen.
    return new Response(
      JSON.stringify({
        ok: false,
        error: e instanceof Error ? e.message : "Unknown error",
        fallback: true,
        code: "INTERNAL_ERROR",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
