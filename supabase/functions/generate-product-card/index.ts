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
You MUST create a premium square (1:1) product promotional card that EXACTLY matches the Shahed Store signature house style. This layout is NON-NEGOTIABLE — every element must look IDENTICAL to the reference cards (Hix.AI, Duolingo, Crunchyroll Premium, ChatGPT Plus, Canva Pro, AutoDesk):

═══ BACKGROUND (full canvas, behind everything) ═══
- A SOFT PASTEL MESH GRADIENT covering the ENTIRE canvas with these blended color zones:
  • Top-left: soft lavender / lilac (#c9b8e8 → #d4c2ec)
  • Top-right: soft warm pink (#f4b8c8 → #f5c4d2)
  • Bottom-left: pale sky blue (#bcd0ec → #c8daf0)
  • Bottom-right: warm peach / coral (#f5c8b0 → #f8d4bc)
  • Smooth diagonal mesh blend — dreamy, airy, premium pastel daylight feel
  • The four colors blend seamlessly through the middle (no hard edges)
- Scatter 6–12 CLEAR TRANSPARENT SOAP BUBBLES around the card:
  • Bubbles are CLEAR / transparent like real soap bubbles — NO color fill
  • Each bubble: thin 1.5px white outline ring + bright crescent highlight on upper-left + small bright dot reflection
  • The bubble interior shows the gradient behind it, very slightly distorted
  • Sizes vary: small 40–80px and large 140–220px
  • Place them all around — top corners, mid-left, mid-right, bottom corners
  • Some bubbles partially overlap the card edges (in front AND behind) for depth
  • These clear glossy bubbles are a SIGNATURE element — MUST be clearly visible

═══ MAIN CARD (centered, ~80% of canvas) ═══
- One large rounded rectangle ULTRA-TRANSPARENT FROSTED GLASS card
- Background: rgba(255,255,255,0.18) with very strong backdrop blur — the pastel gradient clearly shows through
- Border: 1.5px solid rgba(255,255,255,0.7) (crisp white edge)
- Corner radius: ~32px
- Subtle soft drop shadow: 0 24px 60px rgba(80,80,120,0.12)
- The pastel gradient and bubbles are clearly visible THROUGH the glass card

═══ TOP ROW INSIDE CARD (28px padding from card edges) ═══
- LEFT — "SHAHED STORE" PILL:
  • A TRANSLUCENT GRAY-GLASS rounded pill (rgba(180,180,200,0.35) with backdrop blur, thin 1px white inner border, ~28px radius, ~52px tall)
  • Contains the text "SHAHED STORE" in WHITE BOLD uppercase sans-serif (~15px), crisp letter-spacing, comfortable horizontal padding
  • NO red badge inside — just clean glass pill with WHITE text directly on the glass
  • Subtle soft shadow under the pill
- RIGHT — BRAND PILL:
  • A clean SOLID WHITE rounded pill (rgba(255,255,255,0.98), subtle soft shadow, ~28px radius, ~52px tall)
  • Contains the small square brand/product LOGO ICON on the left (~34px, original brand colors)
  • Followed by the brand/product name "${brand || name}" in dark charcoal (#1f2937) bold sans-serif (~16px)
  • Logo + text fit snugly inside the pill with comfortable padding

═══ CENTER OF CARD (the hero) ═══
- The product "${name}" displayed as a VERY LARGE clean app-icon / logo
- Either a rounded square app icon (~22% radius) OR the official brand logo if iconic
- Size: takes ~50–60% of card width
- Vertically centered with generous breathing room above and below
- Subtle soft drop shadow beneath the icon: 0 14px 36px rgba(0,0,0,0.10)
- The icon should look crisp, vibrant, premium — like an Apple App Store hero icon
- NO price, NO discount badge, NO extra marketing text near the icon
- Brand wordmark may appear UNDER the icon ONLY if it is part of the official logo lockup (like Duolingo, Crunchyroll)

═══ BOTTOM CONTACT LINE INSIDE CARD ═══
- A single contact row near the bottom edge (~32px from bottom), INSIDE the frosted card
- Two items aligned left and right with comfortable spacing:
  • LEFT: A small circular outlined GLOBE icon with a tiny cursor arrow on its bottom-right, then "www.shahedstore.com.bd"
  • RIGHT: A small circular outlined PHONE handset icon, then "+880 1840-099853"
- Text: dark charcoal (#1f2937), clean BOLD sans-serif, ~16px, very readable
- Icons: thin-outline style (1.5px stroke), dark charcoal, inside small circular outlines
- NO separator line above — contact line sits cleanly on its own

═══ ABSOLUTE RULES (MUST FOLLOW) ═══
- The "SHAHED STORE" element is a TRANSLUCENT GRAY-GLASS PILL with WHITE TEXT directly on it — NO red badge, NO white solid pill
- The brand pill on the right is a SOLID WHITE pill with the brand logo + name in dark charcoal
- The contact info MUST be INSIDE the frosted card (bottom area), no separator line above it
- The floating CLEAR transparent bubbles MUST be visible around the card edges (no color tint, just glossy outlines)
- Background MUST be the pastel mesh: lavender + pink + peach + sky blue blended diagonally
- NO price tag, NO discount badge, NO marketing copy, NO promotional text
- Square format exactly (1:1)
- Every element crisp, readable, premium — dreamy pastel glassmorphism aesthetic
`.trim();

const STYLES = {
  dark_neon: {
    label: "Dark Neon",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
You MUST create a premium square (1:1) product promotional card in the SHAHED STORE "Dark Neon" signature house style. This layout is NON-NEGOTIABLE — it must look IDENTICAL to the Grok reference card.

═══ BACKGROUND (full canvas) ═══
- Deep midnight navy / indigo gradient: top #0a1438 → bottom #060a22
- Subtle radial violet glow behind the card center (#3a1a6a, very soft, blurred)
- A faint floor reflection at the very bottom — soft violet-cyan light bleed simulating the card glow reflecting off a glossy surface
- NO bubbles, NO pastel colors — pure dark cinematic neon backdrop
- Tiny soft white sparkles / lens flares (2–3) at the top corners of the card for premium feel

═══ MAIN CARD (centered, ~82% of canvas) ═══
- One large rounded rectangle DARK GLASS card
- Background: rgba(20,22,55,0.55) with strong backdrop blur — the violet glow shows softly through
- Corner radius: ~36px
- THICK GLOWING NEON BORDER (signature element — MUST be prominent):
  • A bright 3–4px gradient stroke flowing AROUND the entire card edge
  • Gradient: hot magenta (#ff3da8) → violet (#9d4dff) → electric blue (#3da8ff) → cyan (#3df0ff) → back to magenta
  • Strong outer glow / bloom around the border (~30px soft halo) in matching neon colors — pink-violet on top-left, blue-cyan on bottom-right
  • The border looks like a real glowing LED tube around the card
- Inside the card, a very subtle inner highlight along the top edge (1px white, 30% opacity) for glass realism

═══ TOP ROW INSIDE CARD (32px padding from card edges) ═══
- LEFT — empty (NO SHAHED STORE pill on Dark Neon variant — the glow border is the brand signature)
- RIGHT — BRAND PILL:
  • A clean SOLID WHITE rounded pill (rgba(255,255,255,0.98), soft shadow, ~28px radius, ~52px tall)
  • Wait — OVERRIDE: on Dark Neon, the brand mark sits DIRECTLY on the dark glass (NO white pill background). Just the brand LOGO ICON (~36px, original colors, with soft white glow) followed by the brand/product name "${brand || name}" in CRISP WHITE bold sans-serif (~20px), aligned in the top-right corner of the card with comfortable padding from the edges
  • Subtle white drop-glow under the text for readability

═══ CENTER OF CARD (the hero) ═══
- The product "${name}" displayed as a VERY LARGE 3D rounded-square app icon
- Size: ~45–55% of card width
- The icon sits on a soft glowing pedestal — a subtle violet-cyan halo radiates beneath it (signature glow)
- Strong 3D rendering with realistic highlights, soft top-light, and a dark glossy surface if the icon is dark
- Subtle reflection/shadow beneath the icon: 0 20px 40px rgba(120,80,255,0.35)
- NO price, NO discount badge, NO marketing text near the icon

═══ BOTTOM CONTACT STRIP (signature Dark Neon detail) ═══
- A horizontal sub-band INSIDE the card, near the bottom (~24px from bottom edge)
- Background: very subtle translucent white-violet glow strip (rgba(180,160,255,0.10), ~56px tall, full card width minus padding, ~16px radius)
- Two items aligned left and right with comfortable spacing INSIDE the strip:
  • LEFT: A small CIRCULAR globe icon with cyan-violet GLOWING outline + tiny cursor arrow on its bottom-right, then "www.shahedstore.com.bd" in WHITE bold sans-serif (~16px)
  • RIGHT: A small CIRCULAR phone handset icon with cyan-violet GLOWING outline, then "+880 1840-099853" in WHITE bold sans-serif (~16px)
- Icon outlines glow softly (matching the border colors)
- All text is WHITE — clearly readable against the dark glass

═══ ABSOLUTE RULES (MUST FOLLOW) ═══
- The signature element is the THICK GLOWING NEON GRADIENT BORDER (magenta → violet → blue → cyan) wrapping the card with a soft outer halo
- Background is DEEP MIDNIGHT NAVY — NO bubbles, NO pastel colors
- Brand mark in top-right is the LOGO + WHITE NAME directly on dark glass (no white pill)
- Bottom contact strip is INSIDE the card with a subtle translucent sub-band, WHITE text, glowing icon outlines
- Center hero icon has a soft violet-cyan glow halo beneath it
- Square format exactly (1:1)
- Vibe: cinematic premium cyberpunk — like a high-end product launch poster
`.trim(),
  },

  light_glass: {
    label: "Light Glass",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Light Glass" tone ═══
- Keep the EXACT signature pastel mesh background (lavender + pink + peach + sky blue) and clear soap bubbles from the shared blueprint
- This is THE flagship Shahed Store look — identical to the Hix.AI / Duolingo / Crunchyroll / ChatGPT Plus / Canva Pro reference cards
- Vibe: dreamy, airy, premium pastel daylight glassmorphism
`.trim(),
  },

  clean_light: {
    label: "Clean Light",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Clean Light" tone ═══
- Slightly DESATURATED pastel mesh — softer, brighter, more white-washed (lavender, pink, peach, sky blue all very pale, almost milky)
- Clear bubbles slightly more spread out, very subtle outlines
- Vibe: clean, minimal, corporate-premium pastel — like an Apple product page with a hint of color
`.trim(),
  },

  vibrant_promo: {
    label: "Soft Aurora",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Soft Aurora" tone ═══
- Same pastel mesh base but with stronger aurora flow: an extra ribbon of mint-seafoam (#b8e6d4) blending through the middle alongside lavender + pink + peach
- Clear bubbles with slightly iridescent rainbow edge highlights (still mostly clear)
- Vibe: fresh aurora pastel — keep all card components identical to signature
`.trim(),
  },

  glass_gradient: {
    label: "Glass Gradient Border",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Glass Gradient Border" tone ═══
- Keep the signature pastel mesh background and clear bubbles
- The frosted card border becomes a delicate 2px GRADIENT BORDER flowing: lavender (#c9b8e8) → pink (#f4b8c8) → peach (#f5c8b0) → sky blue (#bcd0ec) — matching the background palette
- Subtle soft outer halo matching the gradient border
- Vibe: signature pastel look with a refined rainbow border accent
`.trim(),
  },

  glassmorphism_ui: {
    label: "Glassmorphism UI",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Glassmorphism UI" tone ═══
- Keep the signature pastel mesh background — slightly brighter / more luminous overall
- A subtle 3px horizontal accent line in pastel gradient (lavender → pink → peach) at the very TOP edge of the card
- Clear bubbles still visible around the card
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
