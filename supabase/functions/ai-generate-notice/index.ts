// AI Notice generator — admin describes the notice (text/voice), AI returns a structured notice
import { createClient } from 'npm:@supabase/supabase-js@2';
import { callAIWithFallback } from '../_shared/ai-fallback.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Body {
  prompt: string;
  audience?: 'public' | 'customers' | 'both';
  tone?: 'formal' | 'friendly' | 'urgent';
  language?: 'bn' | 'en';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    if (!token) return j({ error: 'Unauthorized' }, 401);
    const { data: u } = await supabase.auth.getUser(token);
    if (!u?.user) return j({ error: 'Unauthorized' }, 401);
    const { data: roleData } = await supabase
      .from('user_roles').select('role')
      .eq('user_id', u.user.id).eq('role', 'admin').maybeSingle();
    if (!roleData) return j({ error: 'Forbidden' }, 403);

    const body = (await req.json()) as Body;
    if (!body.prompt || body.prompt.trim().length < 3) return j({ error: 'Prompt too short' }, 400);

    const tone = body.tone || 'formal';
    const audience = body.audience || 'public';
    const lang = body.language || 'bn';

    const system = `You are a professional notice/announcement writer for "Shahed Store" — a Bangladeshi digital software store.
Write a clean, well-structured notice based on the admin's description.

OUTPUT ONLY VALID JSON in this exact shape:
{
  "title": "string — short, clear notice title (max 100 chars)",
  "summary": "string — 1-line summary for previews (max 180 chars)",
  "reference_no": "string — short reference like NTC-2026-001 (auto generate based on today)",
  "body_markdown": "string — full notice body in markdown. Use headings (##), paragraphs, lists, **bold** where needed. Start with a greeting/salutation. End with a closing line.",
  "signed_by": "string — signatory name (default: 'Shahed Store Authority')",
  "signed_role": "string — signatory role (default: 'Management')",
  "effective_date": "YYYY-MM-DD or empty string"
}

RULES:
- Language: ${lang === 'bn' ? 'Bengali (বাংলা) — natural, polite, professional' : 'English — clear, professional'}
- Tone: ${tone}
- Audience: ${audience === 'customers' ? 'existing customers (use "প্রিয় গ্রাহক" / "Dear Customer")' : audience === 'both' ? 'general audience including customers' : 'general public visitors'}
- Notice format: like an official notice/circular. Start with greeting, then context, then main points (use lists if multiple), then closing.
- Today is ${new Date().toISOString().slice(0, 10)}.
- Be complete and ready-to-publish — admin should be able to publish without editing.
- Do not wrap output in code fences. Output raw JSON only.`;

    const ai = await callAIWithFallback({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: body.prompt },
      ],
    });

    const match = ai.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI did not return JSON');
    let plan: any;
    try { plan = JSON.parse(match[0]); } catch { throw new Error('AI returned invalid JSON'); }

    // sanitize
    const out = {
      title: String(plan.title || '').slice(0, 200),
      summary: String(plan.summary || '').slice(0, 300),
      reference_no: String(plan.reference_no || '').slice(0, 50),
      body_markdown: String(plan.body_markdown || ''),
      signed_by: String(plan.signed_by || 'Shahed Store Authority').slice(0, 120),
      signed_role: String(plan.signed_role || 'Management').slice(0, 120),
      effective_date: typeof plan.effective_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(plan.effective_date)
        ? plan.effective_date : null,
    };

    return j({ success: true, notice: out, provider: ai.provider });
  } catch (e) {
    console.error('ai-generate-notice error:', e);
    return j({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
