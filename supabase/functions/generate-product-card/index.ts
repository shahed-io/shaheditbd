import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateReplicateImage } from "../_shared/replicate-image.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
};

// ─── SHARED DESIGN BLUEPRINT (LOCKED SIGNATURE — DO NOT CHANGE) ─────────────
// Signature SHAHED STORE house style:
//   1. Soft pale-blue / off-white airy background
//   2. Floating 3D bubbles (sky-blue + mint ONLY) around the card
//   3. Large white frosted glass card centered (~82% of canvas)
//   4. Top-left: WHITE OUTER PILL containing an INNER RED rectangle badge (#e63946)
//      with "SHAHED STORE" in WHITE bold uppercase
//   5. Top-right: white pill with brand logo + name in dark charcoal
//   6. Center: very large clean app icon / official brand logo
//   7. Bottom: thin separator + contact row (globe + phone) inside the card
// ─────────────────────────────────────────────────────────────────────────────

const sharedBlueprint = (name: string, brand: string) => {
  return `
You MUST create a PREMIUM, GLOSSY, square (1:1) product promotional card in the EXACT Shahed Store signature house style. The layout below is NON-NEGOTIABLE — only the BACKGROUND changes between styles.

═══ MAIN CARD (centered, ~80% of canvas) ═══
- One large rounded-rectangle FROSTED GLASS card (glassmorphism)
- Fill: rgba(255,255,255,0.45–0.6) with STRONG backdrop blur
- Border: 1.5px solid rgba(255,255,255,0.9), corner radius ~40px
- Glossy specular highlight along the top edge, soft drop shadow: 0 24px 60px rgba(70,110,170,0.18)
- The background (gradient + spheres) must show THROUGH the frosted card

═══ TOP ROW INSIDE CARD (32px padding) ═══
- LEFT — "SHAHED STORE" badge pill: a rounded pill containing the words "SHAHED STORE" in bold uppercase sans-serif. Use SOLID RED (#e63946) pill with WHITE text when the background is light/cool; use a frosted translucent white-glass pill with white bold text when the background is a saturated pastel gradient. Glossy, premium, crisp.
- RIGHT — BRAND PILL: solid WHITE rounded pill (rgba(255,255,255,0.96), ~26px radius) containing the official small square brand logo (original colors) + the product name "${brand || name}" in dark charcoal (#1f2937) bold sans-serif (~15px)

═══ CENTER OF CARD (the hero) ═══
- The product "${name}" as a VERY LARGE, crisp, official brand logo or app icon (rounded-square app icon if that is the official lockup)
- Takes ~50–60% of the card width, vertically centered, glossy and vibrant with a soft drop shadow (0 14px 34px rgba(0,0,0,0.12))
- Optionally the official brand wordmark directly under the icon, in the brand's own colors and typeface — nothing else
- NO price, NO discount badge, NO marketing copy

═══ BOTTOM CONTACT LINE INSIDE CARD ═══
- Thin 1px separator (rgba(0,0,0,0.08)) spanning most of the card width
- Below it a single row: LEFT = small circular outlined globe icon + "www.shahedstore.com.bd"; RIGHT = small circular outlined phone icon + "+880 1840-099853"
- Dark charcoal (#1f2937), bold sans-serif ~15px, thin 1.5px outline icons

═══ ABSOLUTE RULES ═══
- Square 1:1, everything inside the frosted card, nothing cropped
- Premium glossy finish — real glass, real 3D spheres, soft realistic light
- NO price, NO discount, NO promotional text, NO random extra shapes
- Text must be perfectly spelled and razor sharp
`.trim();
};

// ─── THE THREE APPROVED BACKGROUNDS ─────────────────────────────────────────
const BG_ICE_BOKEH = `
═══ BACKGROUND — "Ice Bokeh" ═══
- Very pale ice-white / soft blue background (#eef3f9 → #e2ebf6), bright daylight feel
- 5–8 LARGE OUT-OF-FOCUS bokeh spheres heavily blurred behind and around the card:
  • deep royal blue (#2f6fd0), soft sky blue (#9dc2ea) and teal/aqua (#4fc3c0)
  • big soft orbs bleeding off the canvas edges (top-left, right, bottom-left), strongly gaussian-blurred
- Dreamy depth-of-field look — the card stays perfectly sharp, the spheres stay soft
- NO pink, NO purple, NO orange`;

const BG_SKY_SPHERES = `
═══ BACKGROUND — "Sky Spheres" ═══
- Clean light periwinkle-blue background (#dce8f7 → #cfe0f5), even and airy
- 8–12 CRISP GLOSSY 3D SPHERES scattered around the card (small 40px to large 240px):
  • periwinkle blue (#8ab0e8) and mint green (#7fd3bd) ONLY
  • each sphere is a shiny 3D ball with a bright specular highlight upper-left and soft contact shadow
  • a few large spheres partially tuck behind the card corners for depth, small ones float in open space
- Crisp, playful, premium — spheres mostly in focus
- NO pink, NO purple, NO orange`;

const BG_PASTEL_AURORA = `
═══ BACKGROUND — "Pastel Aurora" ═══
- Full-canvas smooth pastel gradient: lavender-purple (#b48be0) top-left → soft pink (#f3a8c4) top-right → peach (#f7b98f) bottom-right → sky blue (#a8c8ee) bottom-left
- Faint translucent glass bubbles of varying sizes floating over the gradient (barely visible outlines, glossy rims)
- Rich, saturated but soft — dreamy aurora glow
- Because the background is colorful, the SHAHED STORE badge is a frosted translucent glass pill with WHITE bold text`;

const bg = (background: string) => (name: string, brand: string) =>
  `${sharedBlueprint(name, brand)}\n\n${background}`;

const STYLES = {
  ice_bokeh: {
    label: "Ice Bokeh",
    prompt: bg(BG_ICE_BOKEH),
  },
  sky_spheres: {
    label: "Sky Spheres",
    prompt: bg(BG_SKY_SPHERES),
  },
  pastel_aurora: {
    label: "Pastel Aurora",
    prompt: bg(BG_PASTEL_AURORA),
  },
  auto_smart: {
    label: "Auto (Best Match)",
    prompt: (name: string, brand: string) => `
${sharedBlueprint(name, brand)}

═══ BACKGROUND — CHOOSE THE BEST MATCH FOR "${name}" ═══
Pick EXACTLY ONE of the three approved Shahed Store backgrounds below — the one that makes this product's brand colors look best, and render it fully. Do not blend them.

1) ${BG_ICE_BOKEH}

2) ${BG_SKY_SPHERES}

3) ${BG_PASTEL_AURORA}

SELECTION GUIDE:
- Blue / cyan brands (Windows, Dropbox, Telegram, VPN apps) → "Ice Bokeh"
- Dark, black, white, green or minimal monochrome brands (Notion, Cursor, ChatGPT, Spotify) → "Sky Spheres"
- Multi-color, purple, pink, orange or creative brands (Office 365, Adobe, Canva, Figma) → "Pastel Aurora"
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

    // ── Phase 0: Replicate (PRIMARY — user-connected Replicate account) ──────
    try {
      console.log("Replicate primary — flux", imageUrl ? "kontext-pro (img2img)" : "schnell (txt2img)");
      const { base64, mimeType } = await generateReplicateImage({
        prompt: promptText,
        imageUrl: imageUrl || undefined,
        aspectRatio: "1:1",
      });
      data = {
        choices: [{
          message: {
            images: [{ image_url: { url: `data:${mimeType};base64,${base64}` } }]
          }
        }]
      };
      console.log("✅ Replicate success");
    } catch (e) {
      console.warn(`Replicate failed, falling back to Gemini/OpenAI: ${e instanceof Error ? e.message : e}`);
    }

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

    outer: for (const ki of (data ? [] : shuffledKeyIndices)) {
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
      "google/gemini-2.5-flash-image",
      "google/gemini-3.1-flash-image-preview",
      "google/gemini-3-pro-image-preview",
    ];

    if (!data) {
      for (let attempt = 0; attempt < GATEWAY_MODELS.length; attempt++) {
        const model = GATEWAY_MODELS[attempt];
        console.log(`Gateway fallback attempt ${attempt + 1}: ${model}`);

        // Build content: if reference image exists, send multi-part; else plain string.
        // Some image-preview models reject the multi-part array shape, so we
        // also retry with a plain text string on 400.
        const buildBody = (useMultipart: boolean) => ({
          model,
          messages: [{
            role: "user" as const,
            content: useMultipart && imageUrl ? userContent : promptText,
          }],
          modalities: ["image", "text"],
        });

        let response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildBody(true)),
        });

        // Retry once with plain-text content if multipart was rejected
        if (response.status === 400 && imageUrl) {
          const errPreview = await response.text().catch(() => "");
          console.warn(`Gateway 400 with multipart, retrying text-only: ${errPreview.substring(0, 120)}`);
          response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(buildBody(false)),
          });
        }

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
