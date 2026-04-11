import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'পেন্ডিং', processing: 'প্রসেসিং', delivered: 'ডেলিভার্ড',
  completed: 'সম্পন্ন', cancelled: 'বাতিল', refunded: 'রিফান্ড', failed: 'ব্যর্থ',
};

const STATUS_EMOJI: Record<string, string> = {
  pending: '⏳', processing: '⚙️', delivered: '🚀',
  completed: '✅', cancelled: '❌', refunded: '💸', failed: '⚠️',
};

async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
  const data = await res.json();
  console.log('Telegram response:', JSON.stringify({ ok: res.ok, status: res.status }));
  return { ok: res.ok, data };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { type } = body;

    // ─── STATUS CHANGE (called from DB trigger) ───────────────────────────
    if (type === 'status_change') {
      const { orderId, orderNumber, customerName, customerPhone, total, oldStatus, newStatus, statusLabel, emoji } = body;

      const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

      // Get telegram chat ID from site_settings
      const { data: settingsRows } = await supabase
        .from('site_settings')
        .select('key, value')
        .eq('key', 'telegram_chat_id');

      const telegramChatId = settingsRows?.[0]?.value;
      const results: Record<string, any> = {};

      // Send Telegram notification
      if (BOT_TOKEN && telegramChatId) {
        const oldLabel = STATUS_LABELS[oldStatus] || oldStatus;
        const newLabel = statusLabel || STATUS_LABELS[newStatus] || newStatus;
        const statusEmoji = emoji || STATUS_EMOJI[newStatus] || '🔄';

        let msg = `${statusEmoji} অর্ডার স্ট্যাটাস আপডেট!\n\n`;
        msg += `🔢 অর্ডার: #${orderNumber}\n`;
        msg += `👤 গ্রাহক: ${customerName}\n`;
        if (customerPhone) msg += `📱 ${customerPhone}\n`;
        msg += `💵 মোট: ৳${Number(total).toLocaleString()}\n\n`;
        msg += `📋 স্ট্যাটাস: ${oldLabel} ➜ ${newLabel}\n`;
        msg += `⏰ ${new Date().toLocaleString('bn-BD')}`;

        const { ok, data: tgData } = await sendTelegramMessage(BOT_TOKEN, telegramChatId, msg);
        results.telegram = ok ? { success: true } : { success: false, error: tgData };
      } else {
        results.telegram = { skipped: true, reason: !BOT_TOKEN ? 'No bot token' : 'No chat ID' };
      }

      // In-app notification for the customer
      if (orderId) {
        const { data: order } = await supabase.from('orders').select('user_id').eq('id', orderId).single();
        if (order?.user_id) {
          const newLabel = statusLabel || STATUS_LABELS[newStatus] || newStatus;
          const statusEmoji = emoji || STATUS_EMOJI[newStatus] || '🔄';
          await supabase.from('notifications').insert({
            user_id: order.user_id,
            title: `${statusEmoji} অর্ডার ${newLabel}`,
            message: `আপনার অর্ডার #${orderNumber} এর স্ট্যাটাস "${newLabel}" হয়েছে।`,
            type: ['cancelled', 'failed'].includes(newStatus) ? 'error' : 'success',
            link: '/dashboard',
            is_read: false,
          });
          results.inApp = { success: true };
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── LEGACY: Manual call with orderId ──────────────────────────────────
    const { orderId, channel } = body;
    if (!orderId) return new Response(JSON.stringify({ error: 'orderId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: order, error } = await supabase.from('orders').select('*, order_items(*)').eq('id', orderId).single();
    if (error || !order) return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const statusLabel = STATUS_LABELS[order.status] || order.status;
    const statusEmoji = STATUS_EMOJI[order.status] || '📦';
    const items = order.order_items?.map((i: any) => `• ${i.product_name}`).join('\n') || '';

    if (order.user_id) {
      await supabase.from('notifications').insert({
        user_id: order.user_id,
        title: `${statusEmoji} অর্ডার ${statusLabel}`,
        message: `আপনার অর্ডার #${order.order_number} এর স্ট্যাটাস "${statusLabel}" হয়েছে।`,
        type: ['cancelled', 'failed'].includes(order.status) ? 'error' : 'success',
        link: '/dashboard',
        is_read: false,
      });
    }

    let whatsappLink = null;
    if (order.customer_phone && channel === 'whatsapp') {
      const phone = order.customer_phone.replace(/\D/g, '').replace(/^0/, '880');
      const msg = encodeURIComponent(`${statusEmoji} অর্ডার আপডেট!\n\nঅর্ডার: #${order.order_number}\nস্ট্যাটাস: ${statusLabel}\n\n${items}\n\nমোট: ৳${Number(order.total).toLocaleString()}\n\nধন্যবাদ! 🙏`);
      whatsappLink = `https://wa.me/${phone}?text=${msg}`;
    }

    return new Response(JSON.stringify({ success: true, whatsappLink, notificationSent: !!order.user_id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('order-notification error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
