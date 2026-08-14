// Multi-engine OCR for Microsoft Installation IDs.
// Tries: direct Gemini Vision → Lovable AI Gateway (Gemini) → OpenAI vision.
// Returns the first result whose digit count is plausible (54 or 63 digits).

import { geminiVisionExtract } from "./gemini-vision.ts";

const SYSTEM_PROMPT =
  'You are a precise OCR engine for Microsoft phone-activation screens. ' +
  'Extract the Installation ID (IID) from the screenshot. ' +
  'It appears under labels like "Installation ID", "ইনস্টলেশন আইডি", "ID d\'installation", "インストール ID" and is a long number split into 9 blocks labelled 1-9 or A-I (rows or columns). ' +
  'Each block contains 6 OR 7 digits (so the full ID is 54 or 63 digits). ' +
  'Read every visible digit carefully, including faint, blurry or low-contrast ones. Never invent digits. ' +
  'Output ONLY the digits joined by dashes in 9 groups. If no Installation ID is visible, output exactly: NONE';

const USER_PROMPT = 'Extract the Installation ID. Output only the 9 dash-separated numeric groups, or NONE.';

export interface IidOcrResult {
  digits: string;      // raw digits only
  engine: string;      // which engine produced it
  attempts: string[];  // debug info
}

function digitsOf(text: string): string {
  return (text || "").replace(/[^0-9]/g, "");
}

function plausible(d: string): boolean {
  return d.length >= 53 && d.length <= 64;
}

async function tryLovableGateway(b64: string, mime: string): Promise<string> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("no LOVABLE_API_KEY");
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: USER_PROMPT },
            { type: "image_url", image_url: { url: `data:${mime};base64,${b64}` } },
          ],
        },
      ],
    }),
  });
  if (!r.ok) throw new Error(`gateway ${r.status} ${(await r.text()).slice(0, 160)}`);
  const data = await r.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function tryOpenAI(b64: string, mime: string): Promise<string> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("no OPENAI_API_KEY");
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: USER_PROMPT },
            { type: "image_url", image_url: { url: `data:${mime};base64,${b64}`, detail: "high" } },
          ],
        },
      ],
    }),
  });
  if (!r.ok) throw new Error(`openai ${r.status} ${(await r.text()).slice(0, 160)}`);
  const data = await r.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function extractInstallationId(opts: {
  imageBase64: string;
  mimeType: string;
}): Promise<IidOcrResult> {
  const attempts: string[] = [];
  let best = "";

  const engines: Array<{ name: string; run: () => Promise<string> }> = [
    {
      name: "gemini-direct",
      run: async () => {
        const r = await geminiVisionExtract({
          imageBase64: opts.imageBase64,
          mimeType: opts.mimeType,
          systemPrompt: SYSTEM_PROMPT,
          userPrompt: USER_PROMPT,
          models: ["gemini-2.5-flash", "gemini-2.5-pro"],
        });
        return r.text;
      },
    },
    { name: "lovable-gateway", run: () => tryLovableGateway(opts.imageBase64, opts.mimeType) },
    { name: "openai", run: () => tryOpenAI(opts.imageBase64, opts.mimeType) },
  ];

  for (const eng of engines) {
    try {
      const text = (await eng.run()).trim();
      if (/^none$/i.test(text)) {
        attempts.push(`${eng.name}: NONE`);
        continue;
      }
      const d = digitsOf(text);
      attempts.push(`${eng.name}: ${d.length} digits`);
      if (plausible(d)) return { digits: d, engine: eng.name, attempts };
      if (d.length > best.length) best = d;
    } catch (e) {
      attempts.push(`${eng.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { digits: best, engine: "none", attempts };
}
