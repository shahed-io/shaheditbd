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
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { title, lines, footer } = await req.json() as {
      title?: string; lines?: Array<string | null | undefined>; footer?: string;
    };

    if (!title) {
      return new Response(JSON.stringify({ error: 'title required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!BOT_TOKEN) {
      return new Response(JSON.stringify({ skipped: true, reason: 'TELEGRAM_BOT_TOKEN not set' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: settingsRows } = await supabase
      .from('site_settings')
      .select('key, value')
      .eq('key', 'telegram_chat_id');

    const chatId = settingsRows?.[0]?.value;
    if (!chatId) {
      return new Response(JSON.stringify({ skipped: true, reason: 'telegram_chat_id not set' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (lines || []).filter(Boolean).join('\n');
    const ts = `\n⏰ ${new Date().toLocaleString('bn-BD')}`;
    const msg = `${title}\n\n${body}${footer ? `\n\n${footer}` : ''}${ts}`;

    const { ok, data } = await sendTelegramMessage(BOT_TOKEN, chatId, msg);
    return new Response(JSON.stringify({ success: ok, data }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('notify-telegram-event error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
