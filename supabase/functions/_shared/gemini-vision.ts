// Shared Gemini Vision helper — direct Gemini API (no Lovable AI Gateway).
// Loads API keys from site_settings (ai_gemini_key_*) with env fallback,
// and rotates across keys on rate-limit / overload errors.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

async function loadGeminiKeys(): Promise<string[]> {
  // Prefer keys stored in site_settings so admins can rotate without redeploy.
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (url && service) {
      const sb = createClient(url, service);
      const { data } = await sb
        .from("site_settings")
        .select("key, value")
        .eq("category", "ai_config")
        .like("key", "ai_gemini_key_%");
      const dbKeys = (data || [])
        .map((r: any) => (typeof r.value === "string" ? r.value : r.value?.value))
        .filter((v: unknown): v is string => typeof v === "string" && v.length > 10);
      if (dbKeys.length > 0) return dbKeys;
    }
  } catch (e) {
    console.warn("[gemini-vision] site_settings key lookup failed:", e);
  }
  // Env fallback
  return [
    Deno.env.get("GEMINI_API_KEY"),
    Deno.env.get("GEMINI_API_KEY_2"),
    Deno.env.get("GEMINI_API_KEY_3"),
    Deno.env.get("GEMINI_API_KEY_4"),
    Deno.env.get("GEMINI_API_KEY_5"),
    Deno.env.get("GEMINI_API_KEY_6"),
  ].filter((k): k is string => typeof k === "string" && k.length > 10);
}

export interface GeminiVisionResult {
  text: string;
  keyIndex: number;
  model: string;
}

/**
 * Send an image + prompt to Gemini's vision API directly.
 * Rotates across all available keys on 429/503; escalates to pro on empty flash output.
 */
export async function geminiVisionExtract(opts: {
  imageBase64: string; // raw base64, no data: prefix
  mimeType: string;    // e.g. image/png, image/jpeg
  systemPrompt: string;
  userPrompt: string;
  models?: string[];   // default: try flash first, then pro
}): Promise<GeminiVisionResult> {
  const keys = await loadGeminiKeys();
  if (keys.length === 0) {
    throw new Error("No Gemini API key configured. Add via Admin → AI Config or GEMINI_API_KEY env.");
  }

  const models = opts.models && opts.models.length > 0
    ? opts.models
    : ["gemini-2.5-flash", "gemini-2.5-pro"];

  const payload = {
    systemInstruction: { parts: [{ text: opts.systemPrompt }] },
    contents: [{
      role: "user",
      parts: [
        { text: opts.userPrompt },
        { inlineData: { mimeType: opts.mimeType, data: opts.imageBase64 } },
      ],
    }],
    generationConfig: { temperature: 0.1 },
  };

  let lastErr = "";
  const shuffled = [...keys].sort(() => Math.random() - 0.5);

  for (const model of models) {
    for (let i = 0; i < shuffled.length; i++) {
      const key = shuffled[i];
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        if (r.status === 429 || r.status === 503) {
          lastErr = `${model} ${r.status}`;
          continue; // try next key
        }
        if (!r.ok) {
          const t = await r.text().catch(() => "");
          lastErr = `${model} ${r.status} ${t.slice(0, 200)}`;
          // Non-retryable on this key — try next key anyway in case it's key-specific
          continue;
        }
        const data = await r.json();
        const text = (data.candidates?.[0]?.content?.parts || [])
          .map((p: any) => p.text || "")
          .join("")
          .trim();
        if (text) return { text, keyIndex: i, model };
        lastErr = `${model} empty response`;
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
      }
    }
  }
  throw new Error(`Gemini vision failed (tried ${models.length} models × ${shuffled.length} keys): ${lastErr}`);
}
