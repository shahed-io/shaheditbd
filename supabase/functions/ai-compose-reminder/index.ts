import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { callAIWithFallback } from '../_shared/ai-fallback.ts';

interface Body {
  productName: string;
  customerName?: string;
  expiryDate?: string;
  daysLeft?: number | null;
  renewUrl?: string;
  tone?: string;
  language?: 'en' | 'bn';
  extraNotes?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = (await req.json()) as Body;
    if (!body?.productName) {
      return new Response(JSON.stringify({ error: 'productName required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lang = body.language === 'bn' ? 'Bengali' : 'English';
    const tone = body.tone || 'professional, warm, concise';
    const days = body.daysLeft;
    const expiryStatus = days == null
      ? 'Expiry date is approaching'
      : days < 0 ? `Expired ${Math.abs(days)} day(s) ago`
      : days === 0 ? 'Expires today'
      : `Expires in ${days} day(s)`;

    const sys = `You write subscription renewal reminder emails for an online software store (Shahed Store).
Output must be plain text body only — NO subject line, NO greeting like "Dear", NO signature/footer (the email template adds branding, greeting, CTA and footer automatically).
Write 3-5 short paragraphs in ${lang}. Tone: ${tone}.
Mention the product name, the expiry status naturally, the value of renewing, and a soft call to renew.
Do NOT invent prices, discount codes, or features that weren't given. Do NOT include URLs (the template renders the renew button).`;

    const usr = `Product: ${body.productName}
Customer name: ${body.customerName || '(unknown)'}
Expiry date: ${body.expiryDate || '(not specified)'}
Status: ${expiryStatus}
${body.extraNotes ? `Extra notes from admin: ${body.extraNotes}` : ''}

Write the email body now.`;

    const { text, provider } = await callAIWithFallback({
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: usr },
      ],
      maxTokens: 600,
    });

    return new Response(JSON.stringify({ message: text.trim(), provider }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
