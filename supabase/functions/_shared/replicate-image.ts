// Shared Replicate image generation helper.
// Routes all calls through the Lovable connector gateway so token rotation
// is handled automatically. Requires LOVABLE_API_KEY and REPLICATE_API_KEY
// (the latter is provided by the Replicate connector linkage).

const GATEWAY = "https://connector-gateway.lovable.dev/replicate/v1";

function authHeaders() {
  const lovable = Deno.env.get("LOVABLE_API_KEY");
  const replicate = Deno.env.get("REPLICATE_API_KEY");
  if (!lovable) throw new Error("LOVABLE_API_KEY is not configured");
  if (!replicate) throw new Error("REPLICATE_API_KEY is not configured (link Replicate connector)");
  return {
    Authorization: `Bearer ${lovable}`,
    "X-Connection-Api-Key": replicate,
  };
}

export interface GenerateImageOptions {
  prompt: string;
  /** Optional reference image URL — when provided we switch to flux-kontext-pro for image editing. */
  imageUrl?: string;
  /** Aspect ratio, default "1:1" */
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  /** Override model slug if needed. */
  model?: string;
  /** Max minutes to poll (default 5) */
  maxMinutes?: number;
}

export interface GenerateImageResult {
  /** Final image as raw base64 (no data: prefix). */
  base64: string;
  /** MIME type, typically image/png or image/webp. */
  mimeType: string;
}

/**
 * Generate an image via Replicate. Returns base64 + mime so caller can upload
 * to Supabase Storage or return inline.
 */
export async function generateReplicateImage(
  opts: GenerateImageOptions
): Promise<GenerateImageResult> {
  const headers = authHeaders();
  const aspect_ratio = opts.aspectRatio || "1:1";

  // Pick model: kontext for img2img/editing, flux-schnell for text-to-image.
  const model =
    opts.model ||
    (opts.imageUrl
      ? "black-forest-labs/flux-kontext-pro"
      : "black-forest-labs/flux-schnell");

  const input: Record<string, unknown> = {
    prompt: opts.prompt,
    aspect_ratio,
    output_format: "png",
  };
  if (opts.imageUrl) input.input_image = opts.imageUrl;
  if (model.endsWith("flux-schnell")) {
    input.num_outputs = 1;
    input.num_inference_steps = 4;
  }

  // 1) Create prediction
  const createResp = await fetch(`${GATEWAY}/models/${model}/predictions`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "wait=60" },
    body: JSON.stringify({ input }),
  });

  if (!createResp.ok) {
    const t = await createResp.text();
    throw new Error(`Replicate create failed ${createResp.status}: ${t.substring(0, 300)}`);
  }

  let pred = await createResp.json();
  const id: string = pred.id;
  const maxMs = (opts.maxMinutes || 5) * 60 * 1000;
  const start = Date.now();
  let delay = 1500;

  while (pred.status !== "succeeded" && pred.status !== "failed" && pred.status !== "canceled") {
    if (Date.now() - start > maxMs) {
      throw new Error(`Replicate prediction ${id} timed out after ${opts.maxMinutes || 5} min`);
    }
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay + 1000, 6000);
    const pollResp = await fetch(`${GATEWAY}/predictions/${id}`, { headers });
    if (!pollResp.ok) {
      const t = await pollResp.text();
      throw new Error(`Replicate poll failed ${pollResp.status}: ${t.substring(0, 200)}`);
    }
    pred = await pollResp.json();
  }

  if (pred.status !== "succeeded") {
    throw new Error(`Replicate prediction ${pred.status}: ${pred.error || "unknown"}`);
  }

  // output is either a URL string or an array of URLs
  const out = pred.output;
  const url: string | undefined = Array.isArray(out) ? out[0] : typeof out === "string" ? out : undefined;
  if (!url) throw new Error("Replicate returned no output URL");

  const imgResp = await fetch(url);
  if (!imgResp.ok) throw new Error(`Failed to download generated image: ${imgResp.status}`);
  const buf = await imgResp.arrayBuffer();
  const bytes = new Uint8Array(buf);
  // base64 encode
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  const base64 = btoa(binary);
  const mimeType = imgResp.headers.get("content-type") || "image/png";
  return { base64, mimeType };
}
