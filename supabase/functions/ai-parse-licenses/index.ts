import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getAiKeys(): Promise<string[]> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);
  
  const { data } = await sb
    .from("site_settings")
    .select("key, value")
    .eq("category", "ai_config")
    .like("key", "ai_gemini_key_%");
  
  const dbKeys = (data || []).map(r => r.value).filter(Boolean) as string[];
  
  // Fallback to env vars if no DB keys
  if (dbKeys.length === 0) {
    const envKeys = [
      Deno.env.get("GEMINI_API_KEY"),
      Deno.env.get("GEMINI_API_KEY_2"),
      Deno.env.get("GEMINI_API_KEY_3"),
      Deno.env.get("GEMINI_API_KEY_4"),
      Deno.env.get("GEMINI_API_KEY_5"),
      Deno.env.get("GEMINI_API_KEY_6"),
    ].filter(Boolean) as string[];
    return envKeys;
  }
  
  return dbKeys;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { demoKeyValue, demoExtraInfo, rawLines, keyType } = await req.json();

    const keys = await getAiKeys();
    if (keys.length === 0) throw new Error("কোনো AI API Key কনফিগার করা হয়নি। Settings → AI API কনফিগারেশন থেকে Key সেট করুন।");

    const systemPrompt = `You are a data parser. The user will give you a DEMO example of how license data should be structured, and then raw lines of similar data.

Your job: Parse each raw line into two fields:
- key_value: The primary credential (license key, email, username, etc.)
- extra_info: The secondary info (password, notes, etc.) — can be empty string if not present

Key type context: "${keyType}"

RULES:
- Match the pattern from the demo example
- If the demo has email:password format, split each line similarly
- If lines have separators like : | / tab space, use them intelligently
- If a line has only one value, put it in key_value with empty extra_info
- Return ONLY valid JSON array, no markdown, no explanation
- Each item: {"key_value":"...","extra_info":"..."}`;

    const userPrompt = `DEMO EXAMPLE:
key_value: ${demoKeyValue}
extra_info: ${demoExtraInfo || "(empty)"}

RAW DATA (parse each line):
${rawLines}

Return JSON array of parsed items.`;

    let lastError = "";
    
    // Try each key with rotation
    for (const apiKey of keys) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }],
            generationConfig: { temperature: 0.1 },
          }),
        });

        if (response.status === 429) {
          lastError = "Rate limited";
          continue; // Try next key
        }

        if (!response.ok) {
          lastError = await response.text();
          continue;
        }

        const data = await response.json();
        let content = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        const parsed = JSON.parse(content);

        return new Response(JSON.stringify({ success: true, parsed }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        lastError = e.message;
        continue;
      }
    }

    throw new Error(`সব AI Key ব্যর্থ হয়েছে: ${lastError}`);
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
