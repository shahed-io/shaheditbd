import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Direct Telegram Bot API — no gateway needed
async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', disable_web_page_preview: true }),
  });
  return { ok: res.ok, data: await res.json() };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { orderId, _test, _chatId } = body;

    const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

    // ─── TEST MODE ────────────────────────────────────────────────────────────
    if (_test && _chatId) {
      if (!BOT_TOKEN) {
        return new Response(JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN secret not set' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const testMsg = `✅ *Telegram নোটিফিকেশন সফলভাবে কাজ করছে\\!*\n\n🛒 Shahed Store\\-এ নতুন অর্ডার আসলে এখানে তাৎক্ষণিক নোটিফিকেশন পাবেন। 🎉\n\n👤 কাস্টমার: Test User\n💵 মোট: ৳৫০০\n⏰ এইমাত্র`;
      const { ok, data } = await sendTelegramMessage(BOT_TOKEN, _chatId, testMsg);
      if (!ok) {
        return new Response(JSON.stringify({ error: 'Telegram failed', detail: data }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true, test: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch order + items
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch admin notification settings
    const { data: settingsRows } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['telegram_chat_id', 'admin_notification_email', 'admin_whatsapp', 'site_name']);

    const settings: Record<string, string> = {};
    settingsRows?.forEach(s => { settings[s.key] = s.value || ''; });

    const results: Record<string, any> = {};

    // ─── TELEGRAM ───────────────────────────────────────────────────────────
    const telegramChatId = settings['telegram_chat_id'];

    if (telegramChatId && BOT_TOKEN) {
      const items = order.order_items || [];
      const itemLines = items.map((i: any) =>
        `  • ${i.product_name} ×${i.quantity} — ৳${Number(i.total).toLocaleString()}`
      ).join('\n');

      const paymentEmoji: Record<string, string> = {
        bkash: '💜', nagad: '🟠', rocket: '🟣', upay: '🔵', wallet: '💰',
      };
      const pmEmoji = paymentEmoji[order.payment_method] || '💳';
      const pmLabel = (order.payment_method || 'N/A').toUpperCase();

      const waPhone = settings['admin_whatsapp']
        ? settings['admin_whatsapp'].replace(/\D/g, '').replace(/^0/, '880')
        : '';
      const waLine = waPhone
        ? `\n📞 [WhatsApp](https://wa.me/${waPhone}?text=অর্ডার+%23${order.order_number})`
        : '';

      const msg = `🛒 *নতুন অর্ডার! #${order.order_number}*\n\n👤 *গ্রাহক:* ${order.customer_name}\n📧 ${order.customer_email}${order.customer_phone ? `\n📱 ${order.customer_phone}` : ''}\n\n📦 *পণ্য:*\n${itemLines}\n\n${order.discount_amount && Number(order.discount_amount) > 0 ? `💰 সাবটোটাল: ৳${Number(order.subtotal).toLocaleString()}\n🎉 ছাড়: -৳${Number(order.discount_amount).toLocaleString()}\n` : ''}💵 *মোট: ৳${Number(order.total).toLocaleString()}*\n\n${pmEmoji} পেমেন্ট: *${pmLabel}*${order.transaction_id ? `\n🔖 TrxID: \`${order.transaction_id}\`` : ''}\n⏰ ${new Date(order.created_at).toLocaleString('bn-BD')}${waLine}`;

      const { ok, data: tgData } = await sendTelegramMessage(BOT_TOKEN, telegramChatId, msg);
      results.telegram = ok ? { success: true } : { success: false, error: tgData };
    } else {
      results.telegram = { skipped: true, reason: !telegramChatId ? 'telegram_chat_id not set' : 'TELEGRAM_BOT_TOKEN not set' };
    }

    // ─── ADMIN EMAIL ─────────────────────────────────────────────────────────
    const adminEmail = settings['admin_notification_email'];
    if (adminEmail) {
      try {
        const emailRes = await supabase.functions.invoke('send-order-email', {
          body: { type: 'admin_new_order', orderId: order.id, adminEmail },
        });
        results.email = emailRes.error
          ? { success: false, error: emailRes.error }
          : { success: true };
      } catch (e) {
        results.email = { success: false, error: String(e) };
      }
    } else {
      results.email = { skipped: true, reason: 'admin_notification_email not set' };
    }

    // ─── WhatsApp link ────────────────────────────────────────────────────────
    let whatsappLink: string | null = null;
    const waNum = settings['admin_whatsapp'];
    if (waNum) {
      const phone = waNum.replace(/\D/g, '').replace(/^0/, '880');
      const items = order.order_items || [];
      const itemSummary = items.map((i: any) => `• ${i.product_name}`).join('\n');
      const msg = encodeURIComponent(
        `🛒 নতুন অর্ডার!\n\nঅর্ডার: #${order.order_number}\nগ্রাহক: ${order.customer_name}\n\n${itemSummary}\n\nমোট: ৳${Number(order.total).toLocaleString()}`
      );
      whatsappLink = `https://wa.me/${phone}?text=${msg}`;
    }
    results.whatsappLink = whatsappLink;

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
