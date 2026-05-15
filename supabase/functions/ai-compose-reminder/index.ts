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
  couponCode?: string;
  discountPercent?: number;
  couponValidUntil?: string;
  specialOffer?: string;
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

    const lang = body.language === 'bn' ? 'Bengali (বাংলা)' : 'English';
    const tone = body.tone || 'professional, warm, friendly';
    const days = body.daysLeft;
    const expiryStatus = days == null
      ? 'Expiry date is approaching'
      : days < 0 ? `Expired ${Math.abs(days)} day(s) ago`
      : days === 0 ? 'Expires today'
      : `Expires in ${days} day(s)`;

    const couponBlock = body.couponCode
      ? `\nA personal one-time discount coupon has been generated specifically for this customer:
- Coupon code: ${body.couponCode}
- Discount: ${body.discountPercent || 0}% off on ${body.productName}
- Valid until: ${body.couponValidUntil || 'a limited time'}
- One-time use, only for this customer's email and only on this product.`
      : '';

    const offerBlock = body.specialOffer ? `\nSpecial offer to highlight: ${body.specialOffer}` : '';

    const sys = `You write subscription renewal reminder emails for an online software store (Shahed Store / শাহেদ স্টোর).

Output rules:
- Plain text body only — NO subject line, NO "Dear" greeting, NO signature/footer (the email template adds the brand header, greeting, CTA button, coupon block and footer).
- Write in ${lang}. Tone: ${tone}.
- 4–6 short, scannable paragraphs. Use line breaks generously.
- Sprinkle tasteful emojis throughout (✨ 🎁 ⏰ 🔔 💎 ⭐ 🚀 🎉 🛡️ 💳 🙏) — about one per paragraph, placed naturally, never spammy. Do NOT start every line with an emoji.
- Mention the product name, the expiry status naturally, and the value of renewing on time.
${body.couponCode ? `- IMPORTANT: Mention the personal discount coupon clearly. State the discount percent and that it is a one-time, personal coupon just for this customer on this specific product. Mention the validity. Do NOT print the coupon code in the body — the template renders the coupon code in a styled box.` : ''}
${body.specialOffer ? '- Weave the special offer naturally into the message.' : ''}
- End with a soft, professional call to renew.
- Do NOT invent prices or features that were not given. Do NOT include URLs (the template renders the renew button).
- Bengali output must use the spelling "শাহেদ স্টোর" (never "শাহিদ" / "সাহেদ" / "শাহীদ").`;

    const usr = `Product: ${body.productName}
Customer name: ${body.customerName || '(unknown)'}
Expiry date: ${body.expiryDate || '(not specified)'}
Status: ${expiryStatus}${couponBlock}${offerBlock}
${body.extraNotes ? `Extra notes from admin: ${body.extraNotes}` : ''}

Write the email body now.`;

    const { text, provider } = await callAIWithFallback({
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: usr },
      ],
      maxTokens: 800,
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
