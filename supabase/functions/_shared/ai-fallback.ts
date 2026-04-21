// Shared AI helper: tries Lovable AI Gateway first, then falls back to direct Gemini API
// Use this whenever Lovable AI credits may be exhausted (402) so features keep working.

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResult {
  text: string;
  provider: "lovable" | "gemini";
}

/** Map Lovable model id → Gemini direct model id */
function mapToGeminiModel(model: string): string {
  if (model.includes("gemini-3") || model.includes("2.5-pro")) return "gemini-2.5-flash";
  if (model.includes("flash-lite")) return "gemini-2.5-flash-lite";
  return "gemini-2.5-flash";
}

/** Pick first available Gemini key (rotate through pool) */
function getGeminiKey(): string | null {
  const keys = [
    Deno.env.get("GEMINI_API_KEY"),
    Deno.env.get("GEMINI_API_KEY_2"),
    Deno.env.get("GEMINI_API_KEY_3"),
    Deno.env.get("GEMINI_API_KEY_4"),
    Deno.env.get("GEMINI_API_KEY_5"),
    Deno.env.get("GEMINI_API_KEY_6"),
  ].filter(Boolean) as string[];
  if (keys.length === 0) return null;
  return keys[Math.floor(Math.random() * keys.length)];
}

/** Convert OpenAI-style messages → Gemini format */
function messagesToGemini(messages: AIMessage[]) {
  const systemTexts: string[] = [];
  const contents: any[] = [];
  for (const m of messages) {
    if (m.role === "system") {
      systemTexts.push(m.content);
    } else {
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      });
    }
  }
  const payload: any = { contents };
  if (systemTexts.length > 0) {
    payload.systemInstruction = { parts: [{ text: systemTexts.join("\n\n") }] };
  }
  return payload;
}

/**
 * Call AI with automatic fallback.
 * Tries Lovable AI Gateway first; on 402/429/5xx falls back to direct Gemini.
 */
export async function callAIWithFallback(opts: {
  model?: string;
  messages: AIMessage[];
  maxTokens?: number;
}): Promise<AIResult> {
  const model = opts.model || "google/gemini-3-flash-preview";
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  // Try Lovable AI Gateway first
  if (LOVABLE_API_KEY) {
    try {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: opts.messages,
          ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
        }),
      });

      if (r.ok) {
        const data = await r.json();
        const text = data.choices?.[0]?.message?.content ?? "";
        if (text) return { text, provider: "lovable" };
      } else {
        console.warn(`Lovable AI failed (${r.status}); falling back to Gemini`);
      }
    } catch (e) {
      console.warn("Lovable AI exception, falling back to Gemini:", e);
    }
  }

  // Fallback: direct Gemini API
  const geminiKey = getGeminiKey();
  if (!geminiKey) throw new Error("No AI provider available (Lovable credits exhausted and no GEMINI_API_KEY)");

  const geminiModel = mapToGeminiModel(model);
  const payload = messagesToGemini(opts.messages);

  const gr = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!gr.ok) {
    const errText = await gr.text().catch(() => "");
    throw new Error(`Gemini fallback failed: ${gr.status} ${errText.slice(0, 200)}`);
  }

  const gdata = await gr.json();
  const text = gdata.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
  if (!text) throw new Error("Gemini returned empty response");
  return { text, provider: "gemini" };
}
