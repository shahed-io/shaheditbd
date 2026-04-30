import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
};

// ─── SHARED DESIGN BLUEPRINT (NEW PASTEL GLASSMORPHISM) ─────────────────────
// Signature SHAHED STORE house style — matches the new 6 reference cards
// (Hix.AI, Duolingo, Crunchyroll Premium, ChatGPT Plus, Canva Pro, AutoDesk):
//   1. Soft PASTEL MESH gradient background (lavender → pink → peach → sky blue)
//   2. Clear/transparent SOAP BUBBLES floating around the card (no color tint)
//   3. Large ULTRA-TRANSPARENT frosted glass card centered (~80% of image)
//   4. Top-left: TRANSLUCENT GRAY-GLASS pill with "SHAHED STORE" in WHITE
//      bold letters (NO red badge — just clean glass pill, white text)
//   5. Top-right: SOLID WHITE pill with brand logo + brand name in dark text
//   6. Center: VERY LARGE clean app icon / logo of the product
//   7. Bottom: globe + phone contact line in dark charcoal — INSIDE the card
// ─────────────────────────────────────────────────────────────────────────────

const sharedBlueprint = (name: string, brand: string) => `
You MUST create a premium square (1:1) product promotional card that EXACTLY matches the Shahed Store SIGNATURE house style shown in the reference screenshots (SQL Server, NordVPN, Figma, Chegg cards). This layout is NON-NEGOTIABLE — every element must look IDENTICAL across ALL style variants.

═══ BACKGROUND (full canvas, behind everything) ═══
- A SOFT, BRIGHT, AIRY PASTEL SKY background covering the ENTIRE canvas:
  • Dominant tone: very pale sky blue / icy lavender (#e6eef9 → #eef1fa)
  • Subtle warm hints in corners: pale peach top-right, faint pink bottom-left, hint of mint bottom-right
  • Smooth seamless mesh blend — dreamy daylight, NEVER washed-out gray, NEVER dark
- Scatter 8–14 LARGE FLOATING SOFT GLOSSY ORB BUBBLES around the canvas (signature element, MUST be very prominent):
  • Each orb is a smoothly-shaded translucent SPHERE (NOT just outlines) with a glossy 3D look
  • Tints: pale sky-blue, soft mint-teal, very pale lilac — multiple sizes
  • Each orb has: a soft bright HIGHLIGHT on the upper-left (white glossy reflection), a darker tonal shadow on the lower-right, and a subtle ground shadow
  • Sizes vary widely: small 60–110px AND large 180–280px
  • Some orbs are HEAVILY BLURRED (gaussian ~25–40px) — sitting in the far background, looking out of focus
  • Other orbs are CRISP and in front, partially overlapping the card edges for depth
  • Place orbs all around: top corners, mid-left, mid-right, bottom corners — generously, never sparse
  • This floating-orb-bubble look is the SIGNATURE — must clearly dominate the background

═══ MAIN CARD (centered, ~78–82% of canvas) ═══
- One large rounded rectangle FROSTED GLASS card
- Background: rgba(255,255,255,0.30) with strong backdrop blur — the orbs visibly bloom THROUGH the glass
- Border: 1.5px solid rgba(255,255,255,0.85) — crisp clean white glass edge
- Corner radius: ~30px
- Subtle drop shadow: 0 24px 60px rgba(80,90,140,0.12)
- A faint inner top highlight (1px white, 50% opacity) for glass realism

═══ TOP ROW INSIDE CARD (28px padding from card edges) ═══
- LEFT — "SHAHED STORE" PILL (signature — exactly like the reference cards):
  • A SOLID WHITE rounded pill (rgba(255,255,255,0.98), subtle soft shadow, ~28px radius, ~58px tall)
  • Inside the pill, on the LEFT side: a SMALL ROUNDED RED RECTANGLE BADGE (background #e63946, ~22px radius, padding around the word) containing the word "SHAHED" in BOLD WHITE uppercase sans-serif (~16px)
  • Immediately to the right of the red "SHAHED" badge, INSIDE the same white pill: the word "STORE" in BOLD DARK CHARCOAL (#1f2937) uppercase sans-serif (~16px)
  • The full pill therefore reads: [red badge: SHAHED][ STORE in dark text] — all inside one clean white pill
- RIGHT — BRAND PILL:
  • A clean SOLID WHITE rounded pill (rgba(255,255,255,0.98), subtle soft shadow, ~28px radius, ~58px tall)
  • Contains: the brand/product name "${brand || name}" in DARK CHARCOAL (#1f2937) bold sans-serif (~15–16px) on the LEFT, and the small square brand LOGO ICON on the RIGHT (~34px, original brand colors)
  • If brand name is short, logo+name fit snugly side-by-side; if name is two lines, render it stacked vertically
  • Comfortable padding inside the pill

═══ CENTER OF CARD (the hero) ═══
- The product "${name}" displayed as a VERY LARGE clean app-icon / official logo
- Either a rounded square app icon (~22% radius, with subtle white inner glow if icon is dark) OR the official brand logo/wordmark if the brand is iconic (like SQL Server logo, Figma logo)
- Size: takes ~52–62% of card width
- Vertically centered with generous breathing room above and below
- Soft drop shadow: 0 16px 40px rgba(60,80,140,0.14)
- Crisp, vibrant, premium — Apple App Store hero quality
- NO price, NO discount badge, NO extra marketing text

═══ BOTTOM CONTACT LINE INSIDE CARD ═══
- A SUBTLE thin horizontal divider line (1px, rgba(180,190,210,0.4)) about ~80px from the bottom of the card, spanning most of the card width with small side margins
- BELOW the divider, a single contact row (~32px from the very bottom of the card), INSIDE the frosted card:
  • LEFT: a small circular outlined GLOBE icon (1.5px dark charcoal stroke) with a tiny cursor arrow accent on its bottom-right, followed by "www.shahedstore.com.bd"
  • RIGHT: a small circular outlined PHONE handset icon (1.5px dark charcoal stroke), followed by "+880 1840-099853"
- Text: DARK CHARCOAL (#1f2937), bold sans-serif, ~16px, crisp and readable

═══ ABSOLUTE RULES (MUST FOLLOW EXACTLY) ═══
- The "SHAHED STORE" pill MUST be a SOLID WHITE pill containing a RED ROUNDED BADGE with white "SHAHED" text + dark "STORE" text right next to it (exactly like the SQL Server / NordVPN / Figma / Chegg reference cards)
- The brand pill on the right is a SOLID WHITE pill with brand name (dark charcoal) + brand logo (original colors)
- The contact line MUST be INSIDE the card with a thin divider line above it
- The floating GLOSSY ORB BUBBLES (pale blue/mint/lilac, with highlights and some blurred) MUST clearly dominate the background — generously placed
- Background MUST be the bright pale-blue / pale-lavender airy sky (NOT dark, NOT heavily saturated)
- NO price tag, NO discount badge, NO marketing copy, NO promotional text
- Square format exactly (1:1)
- Vibe: premium glassmorphism — bright, dreamy, airy, signature SHAHED STORE house style
`.trim();

const STYLES = {
  dark_neon: {
    label: "Dark Neon",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Dark Neon" tone ═══
- Keep EVERY signature element exactly as defined above (white "SHAHED STORE" pill with red SHAHED badge, white brand pill, glossy orb bubbles, contact line inside card)
- Subtle tone shift only: orbs lean slightly cooler (pale ice-blue + soft violet tint instead of mint), background still bright airy sky but with a hint more lilac in the top corners
- Vibe: signature SHAHED STORE house style with a cool-cinematic accent
`.trim(),
  },

  light_glass: {
    label: "Light Glass",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Light Glass" tone ═══
- Keep EVERY signature element exactly as defined above (white "SHAHED STORE" pill with red SHAHED badge, white brand pill, glossy orb bubbles, contact line inside card)
- Subtle tone shift only: background slightly brighter and more pearl-white, orbs lean toward pale sky-blue and soft white with crisper highlights
- Vibe: the FLAGSHIP signature look — bright, airy, premium glassmorphism
`.trim(),
  },

  clean_light: {
    label: "Clean Light",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Clean Light" tone ═══
- Keep EVERY signature element exactly as defined above (white "SHAHED STORE" pill with red SHAHED badge, white brand pill, glossy orb bubbles, contact line inside card)
- Subtle tone shift only: background a touch more white-washed and minimal, orb bubbles slightly more spread out and softer
- Vibe: clean, minimal, corporate-premium — same signature SHAHED STORE layout
`.trim(),
  },

  vibrant_promo: {
    label: "Soft Aurora",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Soft Aurora" tone ═══
- Keep EVERY signature element exactly as defined above (white "SHAHED STORE" pill with red SHAHED badge, white brand pill, glossy orb bubbles, contact line inside card)
- Subtle tone shift only: orbs include slightly warmer accents (a few pale-pink and pale-mint orbs mixed in with the blue ones); background gains a very faint warm bottom glow
- Vibe: signature SHAHED STORE style with a soft aurora-pastel warmth
`.trim(),
  },

  glass_gradient: {
    label: "Glass Gradient Border",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Glass Gradient Border" tone ═══
- Keep EVERY signature element exactly as defined above (white "SHAHED STORE" pill with red SHAHED badge, white brand pill, glossy orb bubbles, contact line inside card)
- The frosted card border becomes a delicate 2px GRADIENT BORDER flowing: pale lavender → pale pink → pale peach → pale sky blue (soft, low-saturation, matches the airy background)
- Subtle soft outer halo matching the gradient border
- Vibe: signature SHAHED STORE look with a refined pastel rainbow border accent
`.trim(),
  },

  glassmorphism_ui: {
    label: "Glassmorphism UI",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Glassmorphism UI" tone ═══
- Keep EVERY signature element exactly as defined above (white "SHAHED STORE" pill with red SHAHED badge, white brand pill, glossy orb bubbles, contact line inside card)
- Add a subtle 3px horizontal accent line in pastel gradient (lavender → pink → peach) at the very TOP edge of the card (just inside the border)
- Background slightly brighter and more luminous overall
- Vibe: BRIGHT, ultra-clean, premium pastel — Apple/Samsung product launch energy with the signature SHAHED STORE layout intact
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

    // ── Phase 2: OpenAI Image API fallback (uses user's OpenAI credits) ─────
    // Try OpenAI gpt-image-1 if all Gemini keys exhausted.
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!data && OPENAI_API_KEY) {
      try {
        console.log("OpenAI fallback — gpt-image-1");
        const openaiResp = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt: promptText,
            size: "1024x1024",
            n: 1,
          }),
        });

        if (openaiResp.status === 429 || openaiResp.status === 503) {
          console.warn(`OpenAI → ${openaiResp.status}, falling through to Lovable gateway`);
        } else if (!openaiResp.ok) {
          const errText = await openaiResp.text();
          console.warn(`OpenAI error ${openaiResp.status}: ${errText.substring(0, 200)}`);
        } else {
          const openaiData = await openaiResp.json();
          const b64 = openaiData?.data?.[0]?.b64_json;
          const url = openaiData?.data?.[0]?.url;
          if (b64) {
            console.log("✅ OpenAI success (b64)");
            data = {
              choices: [{
                message: {
                  images: [{ image_url: { url: `data:image/png;base64,${b64}` } }]
                }
              }]
            };
          } else if (url) {
            console.log("✅ OpenAI success (url)");
            data = {
              choices: [{
                message: {
                  images: [{ image_url: { url } }]
                }
              }]
            };
          } else {
            console.warn("OpenAI returned no image data");
          }
        }
      } catch (e) {
        console.warn(`OpenAI exception: ${e instanceof Error ? e.message : e}`);
      }
    }

    // ── Phase 3: Lovable AI Gateway fallback (uses Lovable credits) ─────────
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
