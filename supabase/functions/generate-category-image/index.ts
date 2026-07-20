import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateReplicateImage } from "../_shared/replicate-image.ts";
import { requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const authFail = await requireAdmin(req);
  if (authFail) return authFail;

  try {
    const { categoryName, style } = await req.json();
    if (!categoryName) {
      return new Response(JSON.stringify({ error: "categoryName is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const styleGuide = style || "modern, clean, professional, digital software product, tech icon style";
    const prompt = `Create a beautiful, professional category icon/thumbnail image for a digital software store category called "${categoryName}". Style: ${styleGuide}. The image should be square, vibrant, visually striking with a clean gradient background. No text in the image. High quality, modern design suitable for an e-commerce website category card.`;

    // Generate via Replicate (Flux)
    const { base64, mimeType } = await generateReplicateImage({
      prompt,
      aspectRatio: "1:1",
    });

    const imageType = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
    const imageBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    // Upload to Supabase storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    const fileName = `ai-cat-${Date.now()}-${Math.random().toString(36).slice(2)}.${imageType}`;
    const { error: uploadError } = await supabaseClient.storage
      .from("category-images")
      .upload(fileName, imageBytes, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: { publicUrl } } = supabaseClient.storage
      .from("category-images")
      .getPublicUrl(fileName);

    return new Response(JSON.stringify({ success: true, url: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-category-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
