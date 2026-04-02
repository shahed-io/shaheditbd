import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { demoKeyValue, demoExtraInfo, rawLines, keyType } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "[]";
    
    // Clean markdown code blocks if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    
    const parsed = JSON.parse(content);

    return new Response(JSON.stringify({ success: true, parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
