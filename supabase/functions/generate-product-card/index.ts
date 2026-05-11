import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
};

// ─── SHARED DESIGN BLUEPRINT ─────────────────────────────────────────────────
// Signature SHAHED STORE house style (matches the reference cards exactly):
//   1. Soft pale-blue / off-white airy background (NOT pastel pink/peach)
//   2. Multiple soft floating 3D BUBBLES around the card — only sky-blue and
//      mint/teal tones (NO pink/lavender/peach)
//   3. A single large WHITE FROSTED GLASS card centered (~80% of image) with
//      crisp rounded corners and a thin white border
//   4. Inside the card top-left: WHITE rounded pill containing a small RED
//      rectangle badge with "SHAHED STORE" in WHITE bold letters (pill itself
//      is white, badge inside is red)
//   5. Inside the card top-right: WHITE rounded pill with brand logo + name
//      in dark charcoal text
//   6. Center of the card: VERY LARGE clean square app icon of the product
//   7. Bottom of the card: a subtle thin separator line, then a contact line
//      🌐 www.shahedstore.com.bd     📞 +880 1840-099853
//      in dark charcoal text — INSIDE the white glass card
// ─────────────────────────────────────────────────────────────────────────────

const sharedBlueprint = (name: string, brand: string) => `
You MUST create a premium square (1:1) product promotional card that EXACTLY matches the Shahed Store signature house style. This layout is NON-NEGOTIABLE — every element must look IDENTICAL to the reference cards previously generated for this store (LinkedIn, Adobe Creative Cloud, Figma Premium, Microsoft Office 365, Windows 11 Pro):

═══ BACKGROUND (full canvas, behind everything) ═══
- A SOFT PALE-BLUE / OFF-WHITE airy gradient covering the ENTIRE canvas:
  • Top: very pale ice-blue (#e8eef5 → #dde6f0)
  • Bottom: slightly cooler pale blue (#d5e0ed → #c8d6e8)
  • Smooth airy gradient — bright, clean, daylight feel
  • NO pink, NO peach, NO lavender, NO purple, NO yellow — ONLY pale blue / white
- Scatter 6–10 soft 3D TRANSLUCENT BUBBLES / SPHERES around the card:
  • Colors: ONLY soft sky blue (#a8c5e8) and mint/teal (#7dd3c8) — NO other colors
  • Sizes vary: small 60–100px and large 150–250px
  • Each bubble is a SOFT 3D glossy sphere with subtle inner highlight (upper-left)
  • Slight blur on bubbles for depth (those farther = more blurred)
  • Place them BEHIND and around the card edges — top corners, mid-left, mid-right, bottom corners
  • Some bubbles partially overlap the card edges to add depth
  • These bubbles are a SIGNATURE element — MUST be clearly visible

═══ MAIN CARD (centered, ~82% of canvas) ═══
- One large rounded rectangle FROSTED GLASS card
- Background: rgba(255,255,255,0.5) with strong backdrop blur (heavy frosted look)
- Border: 1.5px solid rgba(255,255,255,0.85)
- Corner radius: ~28px
- Soft drop shadow: 0 20px 50px rgba(100,130,180,0.15)
- Background bubbles subtly show THROUGH the frosted card

═══ TOP ROW INSIDE CARD (28px padding from card edges) ═══
- LEFT — "SHAHED STORE" PILL:
  • A SOLID WHITE rounded pill (rgba(255,255,255,0.95), subtle soft shadow, ~26px radius, ~52px tall)
  • INSIDE the white pill: a smaller RED rounded rectangle badge (#e63946 / bright red, ~8px radius)
  • The red badge contains the text "SHAHED STORE" in WHITE BOLD uppercase sans-serif, crisp letter-spacing
  • The red badge does NOT fill the entire pill — there is small white padding around the red badge inside the pill
  • CRITICAL: The OUTER container is a WHITE pill, the INNER SHAHED STORE badge is RED with WHITE text
- RIGHT — BRAND PILL:
  • A clean SOLID WHITE rounded pill (rgba(255,255,255,0.95), subtle soft shadow, ~26px radius, ~52px tall)
  • Contains the small square brand/product LOGO ICON on the left (~34px, original colors)
  • Followed by the brand/product name "${brand || name}" in dark charcoal (#1f2937) bold sans-serif (~15px)
  • Logo + text fit snugly inside the pill with comfortable padding

═══ CENTER OF CARD (the hero) ═══
- The product "${name}" displayed as a VERY LARGE clean app-icon / logo
- Either a rounded square app icon (~22% radius) OR the official brand logo if iconic (like LinkedIn's "in", Windows flag, Office 365 hexagon, Figma "F")
- Size: takes ~50–60% of card width
- Vertically centered with generous breathing room above and below
- Subtle soft drop shadow beneath the icon: 0 12px 30px rgba(0,0,0,0.10)
- The icon should look crisp, vibrant, premium — like an Apple App Store hero icon
- NO price, NO discount badge, NO extra marketing text near the icon
- Brand wordmark may appear UNDER the icon ONLY if it is part of the official logo lockup

═══ BOTTOM CONTACT LINE INSIDE CARD ═══
- A thin horizontal SEPARATOR line first (1px, rgba(0,0,0,0.08), spans most of the card width)
- Below the separator (with 16px gap), a single contact row near the bottom edge (28px from bottom)
- Lives INSIDE the frosted glass card — NOT a separate floating bar outside
- Two items aligned left and right with comfortable spacing:
  • LEFT: A small circular outlined GLOBE icon with a tiny cursor arrow on its bottom-right, then "www.shahedstore.com.bd"
  • RIGHT: A small circular outlined PHONE handset icon, then "+880 1840-099853"
- Text: dark charcoal (#1f2937), clean BOLD sans-serif, ~15–16px, very readable
- Icons: thin-outline style (1.5px stroke), dark charcoal, inside small circular outlines

═══ ABSOLUTE RULES (MUST FOLLOW) ═══
- The "SHAHED STORE" element is a WHITE PILL containing a RED BADGE with WHITE TEXT — never just a glass pill
- The brand pill on the right is a SOLID WHITE pill with the brand logo + name in dark charcoal
- The contact info MUST be INSIDE the frosted card (bottom area) with a separator line above it
- The floating 3D bubbles MUST be visible around the card edges (sky blue + mint/teal ONLY)
- Background is PALE BLUE / OFF-WHITE only — NO pink, peach, lavender, or warm tones
- NO price tag, NO discount badge, NO marketing copy, NO promotional text
- Square format exactly (1:1)
- Every element crisp, readable, premium — luxury digital store aesthetic
`.trim();

const STYLES = {
  dark_neon: {
    label: "Dark Neon",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Dark Neon" tone ═══
- Override ONLY the background: deep midnight indigo (#0a0d2e → #1a0d3a) with subtle electric blue glow
- Bubbles glow with neon cyan and deep electric blue (keep the SAME bubble shape and arrangement, just neon-glow versions)
- The frosted card becomes a DARK GLASS card: rgba(20,20,40,0.55) with a thin glowing 2px cyan border and soft outer glow
- "SHAHED STORE" pill: KEEP THE SAME white pill with red SHAHED STORE badge inside (do NOT change)
- Brand pill on right: KEEP white pill with charcoal text (do NOT change)
- Bottom contact line: keep dark charcoal text on the white-pill area (the whole contact strip lives on a subtle white sub-band so text stays dark and readable)
- Vibe: cyberpunk premium with the SAME signature SHAHED STORE pill / brand pill / contact layout — only the canvas background and bubble glow differ
`.trim(),
  },

  light_glass: {
    label: "Light Glass",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Light Glass" tone (PASTEL COLORFUL GRADIENT + FROSTED GLASS — CamScanner colorful card reference) ═══
CRITICAL: This style OVERRIDES the pale-blue-only background rule from the shared blueprint. For THIS style ONLY:

- BACKGROUND: A soft, dreamy, MULTI-COLOR PASTEL GRADIENT covering the entire canvas (CamScanner-style colorful card):
  • Smooth diagonal blend of pastel pink (#fbc2eb), pastel peach (#ffd6a5), pastel lavender (#c3b1e1),
    pastel mint (#bde0c4), pastel sky blue (#a6c8ff), and pastel coral (#ffafcc)
  • Buttery, airy, low-saturation pastel tones — NOT vibrant, NOT neon
  • The colors flow into each other softly like watercolor — no harsh boundaries
  • Bright, milky, daylight feel
- BUBBLES: Replace the sky-blue + mint bubbles with soft 3D translucent pastel bubbles in
  matching pastel pink, peach, lavender, mint, and sky-blue tones — same shape/placement as the
  blueprint, just colorful pastel glossy spheres with subtle inner highlights
- FROSTED GLASS CARD: Same white frosted glass card (rgba(255,255,255,0.55), heavy backdrop blur,
  thin white border, soft shadow) — the pastel rainbow background shows softly through the frost
- PILLS, LOGO, CONTACT LINE: KEEP IDENTICAL to the shared blueprint
  (white SHAHED STORE pill with red badge, white brand pill, large center icon, bottom contact row)
- Vibe: dreamy pastel rainbow glassmorphism — premium, soft, modern, like the CamScanner colorful card
`.trim(),
  },

  clean_light: {
    label: "Clean Light",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Clean Light" tone ═══
- Even cleaner pale-blue / white background — almost pure white at the top fading to very light blue at the bottom
- Bubbles: ONLY soft sky blue and white-glow bubbles (no mint), slightly more spread out
- Vibe: clean, minimal, corporate-premium — like an Apple product page
`.trim(),
  },

  vibrant_promo: {
    label: "Soft Aurora",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Soft Aurora" tone ═══
- Same pale-blue base background but with a subtle mint-seafoam tint at the bottom-right corner
- Bubbles: predominantly mint/teal with a few sky-blue accents (still NO pink/lavender/peach)
- Vibe: bright, airy, fresh aurora aesthetic — keep all card components identical to signature
`.trim(),
  },

  glass_gradient: {
    label: "Glass Gradient Border",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Glass Gradient Border" tone ═══
- Keep the signature pale-blue / off-white background and sky-blue + mint bubbles
- The frosted card border becomes a delicate 2px GRADIENT BORDER flowing: cyan (#67e8f9) → sky blue (#7dd3fc) → mint (#5eead4) — cool tones only, NO warm colors
- Subtle soft outer halo matching the gradient border
- Vibe: signature look with a refined cool-tone rainbow border accent
`.trim(),
  },

  glassmorphism_ui: {
    label: "Glassmorphism UI",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Glassmorphism UI" tone ═══
- Keep the signature pale-blue / off-white background — slightly brighter / whiter overall
- A subtle 3px horizontal accent line in cool gradient (sky blue → cyan → mint) at the very TOP edge of the card
- Bubbles still visible around the card (sky-blue + mint only)
- Vibe: BRIGHT, ultra-clean, premium — Apple/Samsung product launch energy with the signature SHAHED STORE layout intact
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
