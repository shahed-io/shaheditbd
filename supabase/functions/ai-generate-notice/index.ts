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

    const today = new Date().toISOString().slice(0, 10);
    const yearShort = new Date().getFullYear();
    const refSuffix = String(Date.now()).slice(-4);

    const isBn = lang === 'bn';
    const greeting = audience === 'customers'
      ? (isBn ? 'প্রিয় গ্রাহক,' : 'Dear Valued Customer,')
      : audience === 'both'
        ? (isBn ? 'প্রিয় গ্রাহক ও দর্শনার্থীবৃন্দ,' : 'Dear Customers & Visitors,')
        : (isBn ? 'সম্মানিত সকলে,' : 'To Whom It May Concern,');

    const toneGuide = tone === 'urgent'
      ? (isBn ? 'গুরুত্বপূর্ণ ও জরুরি — সরাসরি, স্পষ্ট, দ্রুত পদক্ষেপের আহ্বান।' : 'Urgent, direct, action-oriented.')
      : tone === 'friendly'
        ? (isBn ? 'বন্ধুসুলভ, উষ্ণ, সহজ ভাষা — কিন্তু পেশাদার।' : 'Warm, friendly, easy — but still professional.')
        : (isBn ? 'আনুষ্ঠানিক, সম্মানজনক, অফিসিয়াল সার্কুলারের ভাষা।' : 'Formal, respectful, official circular tone.');

    const system = `You are the official Notice & Circular writer for "Shahed Store" — a Bangladeshi digital software & services store. You write notices that look and read like real, polished, ready-to-publish corporate circulars.

═══ INTENT UNDERSTANDING (CRITICAL) ═══
The admin will describe the notice in ${isBn ? 'Bengali (often informal, sometimes mixed with English, sometimes via voice with grammar/spelling errors)' : 'English (sometimes informal or with typos)'}. Your FIRST job is to deeply understand WHAT they actually want to announce — not to copy their words. Read the WHOLE input. Identify:
  • The CORE event/announcement (maintenance? offer? policy change? holiday? new product? warning? winner declaration? price update? service disruption?)
  • WHO is affected (all customers? resellers? specific product users? everyone?)
  • WHEN (date, time, duration — convert relative time like "আগামী শুক্রবার" to actual date based on today=${today})
  • WHY (the reason, if implied)
  • Any specific NUMBERS, names, products, durations, percentages mentioned
  • What ACTION the reader should take (if any)
If the admin's input is short or vague, INFER a complete professional notice — fill in reasonable, polite, brand-safe details. Never just echo their text.

═══ OUTPUT FORMAT ═══
Return ONLY a single valid JSON object. No code fences, no commentary, no markdown around it.
{
  "title": "Crisp headline (max 90 chars). Should immediately tell the reader what this notice is about. Use a category prefix when helpful, e.g. '${isBn ? 'গুরুত্বপূর্ণ ঘোষণা:' : 'IMPORTANT:'}' / '${isBn ? 'সার্ভিস আপডেট:' : 'Service Update:'}' / '${isBn ? 'ছুটির ঘোষণা:' : 'Holiday Notice:'}'",
  "summary": "1-2 sentence executive summary (max 180 chars). What + when, no fluff.",
  "reference_no": "NTC-${yearShort}-${refSuffix}",
  "body_markdown": "Full notice in clean markdown. See STRUCTURE below.",
  "signed_by": "Shahed Store Authority",
  "signed_role": "Management",
  "effective_date": "${today}"
}

═══ BODY STRUCTURE (body_markdown) ═══
Write the body as a real corporate notice with these sections, in this order:

1. **Greeting line** — exactly: \`${greeting}\`
2. **Opening paragraph** — 1-2 sentences stating the purpose of this notice clearly.
3. **\`## ${isBn ? 'বিস্তারিত' : 'Details'}\`** — full context of what is happening / being announced. Be specific.
4. **\`## ${isBn ? 'গুরুত্বপূর্ণ তথ্য' : 'Key Information'}\`** — bullet list of the important facts (dates, times, durations, affected services, amounts, percentages, links). Use \`- **Label:** value\` format. Always include at least 3 bullets.
5. **\`## ${isBn ? 'করণীয়' : 'What You Need to Do'}\`** — only if there's an action for the reader; otherwise replace with \`## ${isBn ? 'আমাদের প্রতিশ্রুতি' : 'Our Commitment'}\` and a reassuring line.
6. **Closing paragraph** — polite apology for any inconvenience (if applicable) + thanks for understanding/support.
7. **Sign-off line** — exactly: \`${isBn ? 'ধন্যবাদান্তে,' : 'Sincerely,'}\` on its own line, then a blank line, then \`**Shahed Store Authority**\` and \`*Management*\`.

═══ HARD RULES ═══
- Language: ${isBn ? 'বাংলা — স্বাভাবিক, সাবলীল, পেশাদার বাংলা। কোনো অনুবাদ-গন্ধ নয়। শুদ্ধ বানান।' : 'English — clean professional English. No translation feel.'}
- Tone: ${toneGuide}
- The store name MUST always appear in English as exactly \`Shahed Store\` — never in Bengali script, never with Bengali possessive suffix attached (write \`Shahed Store-এর\` only when truly needed, prefer \`Shahed Store এর\` with space).
- Use \`**bold**\` for important keywords (dates, amounts, deadlines).
- Use markdown lists for any enumeration of 2+ items.
- Length: aim for 180-350 words in body_markdown for normal notices, up to 500 for complex ones. Never under 120 words.
- Today's date is ${today}. Resolve all relative dates ("আগামীকাল", "next Friday", "এই সপ্তাহে") to absolute YYYY-MM-DD and use both forms in body.
- effective_date MUST be a real YYYY-MM-DD — the date the notice takes effect (often today, or the future event date).
- NEVER include placeholders like [date], [name], "TBD", "lorem". Always commit to real specifics inferred from context.
- NEVER wrap output in \`\`\`json fences. Output raw JSON only, starting with { and ending with }.`;

    const ai = await callAIWithFallback({
      model: 'google/gemini-2.5-pro',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Today: ${today}\n\nAdmin's description of the notice:\n"""\n${body.prompt.trim()}\n"""\n\nNow produce the JSON notice.` },
      ],
    });


    // Strip code fences if model added them despite instructions
    let raw = ai.text.trim();
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI did not return JSON');
    let plan: any;
    try { plan = JSON.parse(match[0]); } catch { throw new Error('AI returned invalid JSON'); }

    // Normalize store name to English everywhere
    const fixStoreName = (s: string) => String(s || '')
      .replace(/শাহেদ\s*স্টোর|শাহিদ\s*স্টোর|সাহেদ\s*স্টোর|শায়েদ\s*স্টোর|সাহিদ\s*স্টোর|শাহীদ\s*স্টোর/g, 'Shahed Store')
      .replace(/Shahed\s*Store-?(এর|কে|তে|এ)/g, 'Shahed Store $1');

    const out = {
      title: fixStoreName(plan.title).slice(0, 200),
      summary: fixStoreName(plan.summary).slice(0, 300),
      reference_no: String(plan.reference_no || `NTC-${new Date().getFullYear()}-${refSuffix}`).slice(0, 50),
      body_markdown: fixStoreName(plan.body_markdown),
      signed_by: fixStoreName(plan.signed_by || 'Shahed Store Authority').slice(0, 120),
      signed_role: String(plan.signed_role || 'Management').slice(0, 120),
      effective_date: typeof plan.effective_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(plan.effective_date)
        ? plan.effective_date : today,
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
