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
You MUST create a premium square (1:1) product promotional card with this EXACT layout — non-negotiable:

═══ BACKGROUND (full canvas, behind everything) ═══
- A SOFT PASTEL GRADIENT covering the entire canvas (NEVER plain white, NEVER plain dark)
- 5–8 large soft 3D-style FLOATING BOKEH ORBS scattered around the card edges:
  • Light sky blue translucent spheres (#bfe3ff, ~20–30% opacity)
  • Soft mint / teal spheres (#9fe7d4, ~25% opacity)
  • A few soft white/silver glow orbs
  • Sizes vary 80–220px, blurred, with gentle inner highlight (3D ball look)
  • Place them BEHIND the card AND peeking around the corners — top-left, top-right, bottom-left, bottom-right, mid-left, mid-right
  • These orbs MUST be clearly visible — they are a hero design element, not optional
- The overall background must feel airy, dreamy, premium — like a luxury Apple-style ad

═══ MAIN CARD (centered, ~75% of canvas) ═══
- One large rounded rectangle WHITE FROSTED GLASS card
- Background: rgba(255,255,255,0.72) with strong backdrop blur
- Border: 1.5px solid rgba(255,255,255,0.9)
- Corner radius: ~28px
- Soft shadow: 0 24px 60px rgba(120,130,180,0.18)

═══ TOP ROW INSIDE CARD (18px padding) ═══
- LEFT: a bright RED rounded rectangle pill (#dc2626 → #ef4444 gradient) with the text "SHAHED STORE" in WHITE BOLD text inside it. Crisp, clean, instantly readable. This is the brand badge.
- RIGHT: a clean white rounded pill (rgba(255,255,255,0.9), subtle 1px border) containing the product/brand name "${brand || name}" in dark charcoal (#374151) bold, with a small product/brand logo icon to the left of the text.

═══ CENTER OF CARD (the hero) ═══
- The product "${name}" displayed as a VERY LARGE clean square app-icon with rounded corners (~16% of card width radius)
- Generous breathing room around the icon
- Subtle soft drop shadow beneath the icon: 0 12px 30px rgba(0,0,0,0.12)
- NO price, NO discount badge, NO extra text near the icon

═══ BOTTOM CONTACT LINE INSIDE CARD ═══
- A single thin horizontal contact line near the bottom edge of the card (NOT a separate floating bar outside the card, NOT a colored gradient strip)
- Lives INSIDE the white glass card itself
- Centered horizontally, two items:
  • 🌐 globe icon + "www.shahedstore.com.bd"
  • 📞 phone icon + "+880 1840-099853"
- Text: dark charcoal (#1f2937), clean sans-serif, ~11–12px, BOLD enough to read clearly
- A subtle hairline divider (1px, rgba(0,0,0,0.06)) above the contact line gives separation

═══ CRITICAL RULES ═══
- The contact info MUST be inside the white glass card (bottom area) — never as a separate detached bar
- The floating bokeh orbs in the background MUST be present and visible
- NO price tag anywhere
- All text crisp and readable
- Square format exactly (1:1)
- Looks like it was designed by a top-tier graphic designer for a luxury digital store
`.trim();

const STYLES = {
  dark_neon: {
    label: "Dark Neon",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Dark Neon" tone ═══
- Background gradient: deep midnight indigo (#0a0d2e) blending with deep purple (#1a0d3a) and a hint of electric blue (#0e2a5c)
- The floating bokeh orbs glow with neon cyan, electric purple, and hot pink tones — luminous against the dark background
- The white glass card now becomes a SEMI-TRANSPARENT DARK GLASS card: rgba(15,15,40,0.55) with a glowing 2px gradient neon border (purple → cyan → pink)
- Card border has a soft outer neon halo
- Top-left "SHAHED STORE" pill stays bright RED (still the signature brand badge — never change this)
- Top-right brand pill: dark glass (rgba(20,20,50,0.6)) with white text instead of charcoal
- Bottom contact line: light gray text (#e5e7eb) instead of charcoal, for readability on dark glass
- Overall vibe: cyberpunk premium, glowing, luxurious
`.trim(),
  },

  light_glass: {
    label: "Light Glass",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Light Glass" tone ═══
- Background gradient: soft warm gold/amber (#f5d7a0) flowing into soft rose (#f0c4d4) flowing into soft sky blue (#b8d4f0) — like a watercolor wash
- Floating bokeh orbs: soft cream, blush pink, sky blue
- Otherwise follow the shared blueprint exactly
- Vibe: warm, luxurious, magazine-quality, bright daylight
`.trim(),
  },

  clean_light: {
    label: "Clean Light",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Clean Light" tone ═══
- Background gradient: very light blue-gray (#e8edf5) to soft off-white (#f2f5fa)
- Floating bokeh orbs: soft sky blue, mint teal, and white glow — clearly visible
- Vibe: clean, minimal, corporate-premium, Apple product page energy
`.trim(),
  },

  vibrant_promo: {
    label: "Soft Aurora",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Soft Aurora" tone ═══
- Background gradient: aurora flow — soft mint/seafoam (#a8edea) blending into soft lavender/lilac (#d4b5fc) blending into soft warm peach (#ffd6b0) diagonally
- Floating bokeh orbs: pastel mint, lavender, peach — varied colors, dreamy
- Vibe: bright, airy, dreamy, premium aurora aesthetic
`.trim(),
  },

  glass_gradient: {
    label: "Glass Gradient Border",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Glass Gradient Border" tone ═══
- Background gradient: very light warm gray (#f5f5f7) to soft off-white (#fafafa) with a faint pastel lavender/mint wash
- Floating bokeh orbs: soft blue, soft mint, soft white — visible behind the card
- Card border becomes a beautiful 2px GRADIENT BORDER flowing: indigo (#818cf8) → purple (#c084fc) → pink (#f9a8d4) → cyan (#67e8f9) → teal (#5eead4)
- The gradient border has a delicate soft outer pastel halo
- Vibe: bright, airy, modern Apple-like glassmorphism with a rainbow accent
`.trim(),
  },

  glassmorphism_ui: {
    label: "Glassmorphism UI",
    prompt: (name: string, brand: string, _price: string, _category: string) => `
${sharedBlueprint(name, brand)}

═══ STYLE OVERRIDE — "Glassmorphism UI" tone ═══
- Background gradient: clean bright white (#ffffff) base with 3 large luminous colorful bokeh glow orbs — golden-amber (top-right), electric cyan (bottom-left), lavender purple (top-left)
- Plus 3–4 additional soft 3D bokeh balls (sky blue, mint) as required by the blueprint
- A bold 3px horizontal gradient accent line (gold → pink → cyan) at the very TOP edge of the card
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
    // We try all 6 user keys FIRST so Lovable AI credits are NOT consumed.
    const USER_GEMINI_KEYS = [
      Deno.env.get("GEMINI_API_KEY"),
      Deno.env.get("GEMINI_API_KEY_2"),
      Deno.env.get("GEMINI_API_KEY_3"),
      Deno.env.get("GEMINI_API_KEY_4"),
      Deno.env.get("GEMINI_API_KEY_5"),
      Deno.env.get("GEMINI_API_KEY_6"),
    ].filter(Boolean) as string[];

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

    outer: for (let ki = 0; ki < USER_GEMINI_KEYS.length; ki++) {
      const apiKey = USER_GEMINI_KEYS[ki];
      for (let mi = 0; mi < DIRECT_IMAGE_MODELS.length; mi++) {
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
                generationConfig: {
                  responseModalities: ["IMAGE", "TEXT"],
                },
              }),
            }
          );

          if (directResp.status === 429) {
            console.warn(`key#${ki + 1} ${model} → 429 rate limited, trying next...`);
            await new Promise(r => setTimeout(r, 600));
            continue;
          }

          if (!directResp.ok) {
            const errText = await directResp.text();
            console.warn(`key#${ki + 1} ${model} → ${directResp.status}: ${errText.substring(0, 200)}`);
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
            // Reuse the standard upload pipeline by populating `data` in gateway-shape
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
    if (!data) {
      return new Response(
        JSON.stringify({ error: "সকল AI কী রেট লিমিটেড বা ব্যর্থ হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।" }),
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
