import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { affiliateId } = await req.json();
    if (!affiliateId || typeof affiliateId !== 'string') {
      return new Response(JSON.stringify({ error: 'affiliateId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Supabase env not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch affiliate application
    const { data: aff, error: affErr } = await supabase
      .from('affiliate_accounts')
      .select('*')
      .eq('id', affiliateId)
      .maybeSingle();

    if (affErr || !aff) {
      return new Response(JSON.stringify({ error: 'Affiliate not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch admin telegram chat id
    const { data: settings } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['telegram_chat_id', 'site_name']);
    const settingMap: Record<string, string> = {};
    (settings || []).forEach(s => { if (s.value) settingMap[s.key] = s.value; });

    const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const telegramChatId = settingMap['telegram_chat_id'];
    const siteName = settingMap['site_name'] || 'Shahed Store';

    const result: Record<string, any> = {};

    // Telegram notification
    if (BOT_TOKEN && telegramChatId) {
      const message = [
        `🎯 নতুন Affiliate Application!`,
        ``,
        `👤 ${aff.applicant_name || '—'}`,
        `📧 ${aff.applicant_email || '—'}`,
        `📱 ${aff.applicant_phone || '—'}`,
        ``,
        `🎯 Niche: ${aff.niche || '—'}`,
        `👥 Audience: ${aff.audience_size || '—'}`,
        ``,
        aff.website_url ? `🌐 Website: ${aff.website_url}` : '',
        aff.facebook_url ? `📘 Facebook: ${aff.facebook_url}` : '',
        aff.youtube_url ? `📺 YouTube: ${aff.youtube_url}` : '',
        aff.other_social_url ? `🔗 Social: ${aff.other_social_url}` : '',
        ``,
        aff.why_join ? `💡 কেন যোগ দিতে চান:\n${aff.why_join}` : '',
        ``,
        aff.promotion_strategy ? `🚀 প্রমোশন স্ট্র্যাটেজি:\n${aff.promotion_strategy}` : '',
        ``,
        `⏰ ${new Date(aff.created_at).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })}`,
        ``,
        `👉 অ্যাডমিন প্যানেলে গিয়ে রিভিউ করুন।`,
      ].filter(Boolean).join('\n');

      const tgRes = await sendTelegramMessage(BOT_TOKEN, telegramChatId, message);
      result.telegram = tgRes.ok ? { sent: true } : { sent: false, error: tgRes.data };
    } else {
      result.telegram = { skipped: true, reason: !BOT_TOKEN ? 'no bot token' : 'no chat id' };
    }

    // In-app notification for admins
    try {
      const { data: admins } = await supabase
        .from('user_roles').select('user_id').eq('role', 'admin');
      if (admins && admins.length > 0) {
        const rows = admins.map((a: any) => ({
          user_id: a.user_id,
          title: 'New Affiliate Application',
          message: `${aff.applicant_name || 'Someone'} applied to join the affiliate program.`,
          type: 'info',
          link: '/ceo/affiliates',
        }));
        await supabase.from('notifications').insert(rows);
        result.inAppNotifications = { sent: rows.length };
      }
    } catch (e: any) {
      result.inAppNotifications = { error: e?.message || 'failed' };
    }

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('notify-affiliate-application error:', e);
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
