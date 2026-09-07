// AI Offer Builder — natural language → complete offer config + form fields + winner plan
import { createClient } from 'npm:@supabase/supabase-js@2';
import { callAIWithFallback } from '../_shared/ai-fallback.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface BuildRequest {
  offer_id: string;
  prompt: string;
  apply?: boolean; // if true, write to DB; else just preview
}

const FIELD_TYPES = ['text', 'textarea', 'email', 'phone', 'number', 'select', 'radio', 'checkbox', 'date'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', userData.user.id).eq('role', 'admin').maybeSingle();
    if (!roleData) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = (await req.json()) as BuildRequest;
    const { offer_id, prompt, apply = false } = body;

    if (!offer_id || !prompt || prompt.trim().length < 5) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const systemPrompt = `You are an expert giveaway/offer/contest designer for a Bangladeshi digital store (Shahed IT).
The admin will describe an offer in natural language (Bengali or English). You must design a complete contest configuration.

OUTPUT ONLY VALID JSON with this exact shape:
{
  "offer": {
    "title": "string (Bengali allowed, catchy)",
    "slug": "string (lowercase-with-hyphens, url-safe, short)",
    "description": "string (Bengali markdown, 2-4 paragraphs, engaging, explains what offer is)",
    "prize_details": "string (Bengali markdown, list prizes clearly: 1st/2nd/3rd etc.)",
    "terms": "string (Bengali markdown, 3-6 bullet rules)",
    "success_message": "string (Bengali, thank-you message after submit)",
    "require_login": boolean,
    "show_winners": boolean,
    "max_submissions": null or number
  },
  "fields": [
    {
      "field_type": "text|textarea|email|phone|number|select|radio|checkbox|date",
      "label": "string (Bengali, clear question)",
      "placeholder": "string (Bengali)",
      "help_text": "string or empty",
      "required": boolean,
      "options": ["array of strings, ONLY for select/radio/checkbox"]
    }
  ],
  "winner_plan": {
    "count": number (1-100),
    "mode": "random" or "ai",
    "prizes": ["array of prize labels, one per winner rank"],
    "reasoning": "short explanation in Bengali"
  }
}

RULES:
- Always include Name (text) and Phone (phone) fields. Add Email (email) if useful.
- Add 2-6 thoughtful custom fields based on the offer's nature (e.g. for a creativity contest add a textarea for the entry).
- Set require_login to false unless the admin explicitly says participants must log in.
- max_submissions is the total campaign submission cap. Set it to null unless the admin explicitly gives a total maximum number of entries.
- field_type must be one of: ${FIELD_TYPES.join(', ')}.
- options array required for select/radio/checkbox.
- Use AI mode for winners when quality matters (essays, designs); random when fair luck draw.
- Slug must be unique-ish, short, descriptive.
- All public text in Bengali; keep slug and field_type in English.
- Be creative and complete — admin should not need to edit anything.`;

    const ai = await callAIWithFallback({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    });

    // Extract JSON
    const match = ai.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI did not return JSON');
    let plan: any;
    try {
      plan = JSON.parse(match[0]);
    } catch {
      throw new Error('AI returned invalid JSON');
    }

    // Sanitize
    const offerPatch = plan.offer || {};
    if (offerPatch.slug) offerPatch.slug = String(offerPatch.slug).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const fields = Array.isArray(plan.fields) ? plan.fields.filter((f: any) => f.label && FIELD_TYPES.includes(f.field_type)) : [];
    const winnerPlan = plan.winner_plan || { count: 1, mode: 'random', prizes: [] };

    if (apply) {
      // Update offer
      const updatePayload: any = {};
      ['title', 'description', 'prize_details', 'terms', 'success_message', 'require_login', 'show_winners', 'max_submissions'].forEach(k => {
        if (offerPatch[k] !== undefined) updatePayload[k] = offerPatch[k];
      });
      // slug - only update if unique
      if (offerPatch.slug) {
        const { data: existing } = await supabase.from('offers').select('id').eq('slug', offerPatch.slug).neq('id', offer_id).maybeSingle();
        if (!existing) updatePayload.slug = offerPatch.slug;
      }
      if (Object.keys(updatePayload).length > 0) {
        await supabase.from('offers').update(updatePayload).eq('id', offer_id);
      }

      // Replace fields
      await supabase.from('offer_fields').delete().eq('offer_id', offer_id);
      if (fields.length > 0) {
        const rows = fields.map((f: any, i: number) => ({
          offer_id,
          field_type: f.field_type,
          label: String(f.label).slice(0, 200),
          placeholder: f.placeholder ? String(f.placeholder).slice(0, 200) : null,
          help_text: f.help_text ? String(f.help_text).slice(0, 300) : null,
          required: !!f.required,
          options: ['select', 'radio', 'checkbox'].includes(f.field_type) && Array.isArray(f.options) ? f.options : null,
          sort_order: i,
        }));
        await supabase.from('offer_fields').insert(rows);
      }
    }

    return new Response(JSON.stringify({ success: true, plan: { offer: offerPatch, fields, winner_plan: winnerPlan }, applied: apply, provider: ai.provider }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('ai-build-offer error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
