import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Escape special characters for Telegram MarkdownV2
function escMd(text: string): string {
  return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

// Send via plain text (no parse_mode) for reliability
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
  console.log('Telegram API response:', JSON.stringify({ ok: res.ok, status: res.status, data }));
  return { ok: res.ok, data };
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
      const testMsg = `✅ Telegram নোটিফিকেশন সফলভাবে কাজ করছে!\n\n🛒 Shahed Store-এ নতুন অর্ডার আসলে এখানে তাৎক্ষণিক নোটিফিকেশন পাবেন। 🎉\n\n👤 কাস্টমার: Test User\n💵 মোট: ৳৫০০\n⏰ এইমাত্র`;
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

    // Fetch order + items (with retry — items may not be inserted yet when triggered)
    let order: any = null;
    let orderErr: any = null;
    const MAX_RETRIES = 5;
    const RETRY_DELAY_MS = 1500;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();

      orderErr = error;
      order = data;

      if (orderErr || !order) {
        console.error(`Order fetch error (attempt ${attempt + 1}):`, orderErr);
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
          continue;
        }
        return new Response(JSON.stringify({ error: 'Order not found', detail: orderErr }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // If order found but no items yet, wait and retry
      if (!order.order_items || order.order_items.length === 0) {
        console.log(`Order items empty (attempt ${attempt + 1}/${MAX_RETRIES}), retrying...`);
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
          continue;
        }
        console.warn('Order items still empty after all retries, proceeding anyway');
      } else {
        console.log(`Order fetched with ${order.order_items.length} items on attempt ${attempt + 1}`);
        break;
      }
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
    console.log('Telegram config:', { hasBotToken: !!BOT_TOKEN, chatId: telegramChatId });

    if (telegramChatId && BOT_TOKEN) {
      const items = order.order_items || [];
      const itemLines = items.length > 0
        ? items.map((i: any) =>
            `  • ${i.product_name} ×${i.quantity} — ৳${Number(i.total).toLocaleString()}`
          ).join('\n')
        : '  • (পণ্যের তথ্য লোড হচ্ছে — অর্ডার ডিটেইলস দেখুন)';

      const paymentEmoji: Record<string, string> = {
        bkash: '💜', nagad: '🟠', rocket: '🟣', upay: '🔵', wallet: '💰',
      };
      const pmEmoji = paymentEmoji[order.payment_method] || '💳';
      const pmLabel = (order.payment_method || 'N/A').toUpperCase();

      // Build plain text message (no Markdown — avoids parse errors)
      let msg = `🛒 নতুন অর্ডার! #${order.order_number}\n\n`;
      msg += `👤 গ্রাহক: ${order.customer_name}\n`;
      msg += `📧 ${order.customer_email}\n`;
      if (order.customer_phone) msg += `📱 ${order.customer_phone}\n`;
      msg += `\n📦 পণ্য:\n${itemLines}\n\n`;
      
      if (order.discount_amount && Number(order.discount_amount) > 0) {
        msg += `💰 সাবটোটাল: ৳${Number(order.subtotal).toLocaleString()}\n`;
        msg += `🎉 ছাড়: -৳${Number(order.discount_amount).toLocaleString()}\n`;
      }
      
      msg += `💵 মোট: ৳${Number(order.total).toLocaleString()}\n\n`;
      msg += `${pmEmoji} পেমেন্ট: ${pmLabel}`;
      if (order.transaction_id) msg += `\n🔖 TrxID: ${order.transaction_id}`;
      msg += `\n⏰ ${new Date(order.created_at).toLocaleString('bn-BD')}`;

      // Add reply instructions to the message
      msg += `\n\n💬 রিপ্লাই দিয়ে স্ট্যাটাস পরিবর্তন করুন:`;
      msg += `\n• completed / সম্পন্ন`;
      msg += `\n• delivered / ডেলিভারি`;
      msg += `\n• processing / প্রসেসিং`;
      msg += `\n• cancelled / বাতিল`;

      console.log('Sending Telegram message to:', telegramChatId);
      const { ok, data: tgData } = await sendTelegramMessage(BOT_TOKEN, telegramChatId, msg);
      
      // Store message_id → order mapping for reply-based status changes
      if (ok && tgData?.result?.message_id) {
        await supabase.from('telegram_order_messages').upsert({
          telegram_message_id: tgData.result.message_id,
          telegram_chat_id: telegramChatId,
          order_id: order.id,
          order_number: order.order_number,
        }, { onConflict: 'telegram_message_id,telegram_chat_id' });
        console.log('Stored telegram message mapping:', tgData.result.message_id, '->', order.order_number);
      }
      
      results.telegram = ok ? { success: true } : { success: false, error: tgData };
      console.log('Telegram result:', JSON.stringify(results.telegram));
    } else {
      const reason = !telegramChatId ? 'telegram_chat_id not set in site_settings' : 'TELEGRAM_BOT_TOKEN secret not set';
      console.warn('Telegram skipped:', reason);
      results.telegram = { skipped: true, reason };
    }

    // ─── ADMIN EMAIL ─────────────────────────────────────────────────────────
    try {
      const emailRes = await supabase.functions.invoke('send-order-email', {
        body: { type: 'admin_notify', orderId: order.id },
      });
      results.email = emailRes.error
        ? { success: false, error: emailRes.error }
        : { success: true };
    } catch (e) {
      results.email = { success: false, error: String(e) };
    }

    // ─── WhatsApp link ────────────────────────────────────────────────────────
    let whatsappLink: string | null = null;
    const waNum = settings['admin_whatsapp'];
    if (waNum) {
      const phone = waNum.replace(/\D/g, '').replace(/^0/, '880');
      const items = order.order_items || [];
      const itemSummary = items.map((i: any) => `• ${i.product_name}`).join('\n');
      const waMsg = encodeURIComponent(
        `🛒 নতুন অর্ডার!\n\nঅর্ডার: #${order.order_number}\nগ্রাহক: ${order.customer_name}\n\n${itemSummary}\n\nমোট: ৳${Number(order.total).toLocaleString()}`
      );
      whatsappLink = `https://wa.me/${phone}?text=${waMsg}`;
    }
    results.whatsappLink = whatsappLink;

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('notify-new-order error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
