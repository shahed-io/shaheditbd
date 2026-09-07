// Universal AI text polisher used across admin editors.
// Given a piece of text (or an instruction to generate one) and a "kind" hint,
// returns an improved/clean version in the same language as the input.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { callAIWithFallback } from '../_shared/ai-fallback.ts';
import { normalizeBrandNameText } from '../_shared/brand-name.ts';
import { sanitizeBengali } from '../_shared/bengali-sanitizer.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Body {
  text?: string;                // current text to improve (optional)
  instruction?: string;         // extra guidance from the admin (optional)
  kind?: string;                // e.g. "offer_title", "offer_description", "prize_title", "prize_description", "terms", "success_message", "notice", "field_label", "field_help", "field_options", "winner_prizes", "generic"
  language?: 'bn' | 'en' | 'auto';
  maxChars?: number;
}

const KIND_GUIDE: Record<string, string> = {
  offer_title: 'A short, catchy giveaway/offer title (max 80 chars). No emojis unless useful. Plain text only.',
  offer_description: 'A clear, engaging 2-5 sentence description of the giveaway. Simple markdown allowed.',
  prize_title: 'A short prize name/rank line (max 60 chars). E.g. "১ম পুরস্কার — iPhone 15" or "1st Prize — iPhone 15". Plain text.',
  prize_description: 'A concise 1-3 sentence description of what the winner gets. Plain text, friendly tone.',
  terms: 'Clear terms & conditions as a short bullet list (use "- " for each). Keep it professional and easy to read.',
  success_message: 'A short, warm thank-you message shown after a user submits the giveaway form (1-3 sentences).',
  notice: 'A short public announcement/notice banner (1-3 sentences). Direct, informative, warm tone.',
  field_label: 'A short giveaway form field label. Keep it clear, user-friendly, and plain text only.',
  field_help: 'Helpful microcopy for a giveaway form field. One short sentence, plain text only.',
  field_options: 'Giveaway form choices/options. Return one option per line only; no bullets, no numbering, no explanations.',
  winner_prizes: 'Winner prize labels for a giveaway winner-picking list. Return one prize per line in rank order only; no bullets, no numbering, no explanations.',
  generic: 'Improve grammar, clarity, and tone. Keep the meaning and length similar.',
};

function detectLang(text: string): 'bn' | 'en' {
  return /[\u0980-\u09FF]/.test(text) ? 'bn' : 'en';
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
    const text = (body.text || '').trim();
    const instruction = (body.instruction || '').trim();
    if (!text && !instruction) return j({ error: 'Provide text or instruction' }, 400);

    const kind = body.kind && KIND_GUIDE[body.kind] ? body.kind : 'generic';
    const guide = KIND_GUIDE[kind];
    const lang = body.language && body.language !== 'auto' ? body.language : detectLang(text || instruction);
    const langInstr =
      lang === 'bn'
        ? 'Write the improved text in natural Bengali (বাংলা). Use "শাহেদ স্টোর" for the brand name; natural case markers (এর/কে/তে) are OK on the Bengali brand name only, never on English "Shahed IT".'
        : 'Write the improved text in clean English. Use exactly "Shahed IT" for the brand name.';

    const maxChars = body.maxChars && body.maxChars > 0 ? body.maxChars : 1500;

    const system = [
      'You are an editor for a Bangladesh e-commerce store admin panel.',
      'Your job: rewrite the admin\'s text so it is polished, clear, and audience-ready.',
      `Kind: ${kind}. Guidance: ${guide}`,
      langInstr,
      'Rules:',
      '- Return ONLY the improved text. No preamble, no quotes, no code fences, no explanations.',
      '- Preserve the original intent and any concrete facts (prices, names, dates).',
      '- Fix typos, spelling, spacing, and punctuation.',
      '- Do NOT invent facts. If information is missing, keep the text short.',
      `- Hard limit: ${maxChars} characters.`,
    ].join('\n');

    const userMsg = [
      instruction ? `Admin instruction: ${instruction}` : '',
      text ? `Current text:\n"""\n${text}\n"""` : 'No current text — please generate a suitable one based on the instruction and kind.',
    ].filter(Boolean).join('\n\n');

    const { text: rawOut } = await callAIWithFallback({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMsg },
      ],
      maxTokens: 900,
    });

    let out = (rawOut || '').trim();
    // Strip possible code fences / surrounding quotes
    out = out.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
    if ((out.startsWith('"') && out.endsWith('"')) || (out.startsWith('\u201C') && out.endsWith('\u201D'))) {
      out = out.slice(1, -1).trim();
    }
    if (kind === 'prize_title') {
      out = out
        .replace(/^[-*•]\s+|^\d+[\.)]\s+/, '')
        .replace(/\*+/g, '')
        .replace(/[\s:：]+$/g, '')
        .trim();
    }
    if (kind === 'prize_description') {
      out = out
        .replace(/^[-*•]\s+|^\d+[\.)]\s+/, '')
        .replace(/^[:：\s]+/g, '')
        .replace(/\*+/g, '')
        .trim();
    }
    if (kind === 'field_options' || kind === 'winner_prizes') {
      out = out
        .split('\n')
        .map((line) => line.replace(/^[-*•]\s+|^\d+[\.)]\s+/, '').trim())
        .filter(Boolean)
        .join('\n');
    }
    if (out.length > maxChars) out = out.slice(0, maxChars).trim();
    out = normalizeBrandNameText(out);
    out = sanitizeBengali(out);

    if (!out) return j({ error: 'AI returned empty text' }, 502);
    return j({ text: out });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return j({ error: msg }, 500);
  }
});

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
