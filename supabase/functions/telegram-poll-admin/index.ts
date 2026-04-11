import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── STATUS MAPS ──────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, string> = {
  'completed': 'completed', 'complete': 'completed', 'done': 'completed',
  'delivered': 'delivered', 'deliver': 'delivered',
  'processing': 'processing', 'process': 'processing',
  'cancelled': 'cancelled', 'cancel': 'cancelled',
  'refunded': 'refunded', 'refund': 'refunded',
  'failed': 'failed', 'fail': 'failed',
  'pending': 'pending',
  'সম্পন্ন': 'completed', 'ডেলিভারি': 'delivered', 'ডেলিভার্ড': 'delivered',
  'প্রসেসিং': 'processing', 'বাতিল': 'cancelled', 'রিফান্ড': 'refunded',
  'ব্যর্থ': 'failed', 'পেন্ডিং': 'pending',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'পেন্ডিং', processing: 'প্রসেসিং', delivered: 'ডেলিভার্ড',
  completed: 'সম্পন্ন', cancelled: 'বাতিল', refunded: 'রিফান্ড', failed: 'ব্যর্থ',
};
const STATUS_EMOJI: Record<string, string> = {
  pending: '⏳', processing: '⚙️', delivered: '🚀',
  completed: '✅', cancelled: '❌', refunded: '💸', failed: '⚠️',
};

async function sendMsg(botToken: string, chatId: string | number, text: string, keyboard?: any, replyTo?: number) {
  const body: Record<string, any> = { chat_id: chatId, text, disable_web_page_preview: true };
  if (keyboard) body.reply_markup = keyboard;
  if (replyTo) body.reply_to_message_id = replyTo;
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return res.json();
}

// ─── ORDER REPLY HANDLER ──────────────────────────────────────────────────
async function handleOrderReply(bot: string, chatId: number, msg: any, supabase: any) {
  const replyTo = msg.reply_to_message;
  if (!replyTo) return false;

  const { data: mapping } = await supabase
    .from('telegram_order_messages')
    .select('order_id, order_number')
    .eq('telegram_message_id', replyTo.message_id)
    .eq('telegram_chat_id', String(chatId))
    .single();

  if (!mapping) return false;

  const commandText = msg.text.trim().toLowerCase();
  const newStatus = STATUS_MAP[commandText];

  if (!newStatus) {
    await sendMsg(bot, chatId,
      `❓ স্ট্যাটাস বুঝতে পারিনি: "${msg.text}"\n\nসঠিক কমান্ড:\n• completed / সম্পন্ন\n• delivered / ডেলিভারি\n• processing / প্রসেসিং\n• cancelled / বাতিল\n• refunded / রিফান্ড\n• pending / পেন্ডিং`,
      undefined, msg.message_id
    );
    return true;
  }

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('status, order_number, customer_name, total')
    .eq('id', mapping.order_id)
    .single();

  if (orderErr || !order) {
    await sendMsg(bot, chatId, `❌ অর্ডার #${mapping.order_number} খুঁজে পাওয়া যায়নি।`, undefined, msg.message_id);
    return true;
  }

  if (order.status === newStatus) {
    const label = STATUS_LABELS[newStatus] || newStatus;
    await sendMsg(bot, chatId, `ℹ️ অর্ডার #${mapping.order_number} ইতিমধ্যে "${label}" স্ট্যাটাসে আছে।`, undefined, msg.message_id);
    return true;
  }

  const { error: updateErr } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', mapping.order_id);

  if (updateErr) {
    await sendMsg(bot, chatId, `❌ অর্ডার #${mapping.order_number} আপডেট ব্যর্থ: ${updateErr.message}`, undefined, msg.message_id);
    return true;
  }

  const oldLabel = STATUS_LABELS[order.status] || order.status;
  const newLabel = STATUS_LABELS[newStatus] || newStatus;
  const emoji = STATUS_EMOJI[newStatus] || '🔄';

  await sendMsg(bot, chatId,
    `${emoji} অর্ডার স্ট্যাটাস আপডেট সফল!\n\n🔢 অর্ডার: #${mapping.order_number}\n👤 গ্রাহক: ${order.customer_name}\n💵 মোট: ৳${Number(order.total).toLocaleString()}\n\n📋 ${oldLabel} ➜ ${newLabel}\n⏰ ${new Date().toLocaleString('bn-BD')}`,
    undefined, msg.message_id
  );

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN BOT POLLING — Only handles order reply status changes
// ═══════════════════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const MAX_RUNTIME_MS = 55_000;
  const MIN_REMAINING_MS = 5_000;
  const startTime = Date.now();

  try {
    const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!BOT_TOKEN) {
      return new Response(JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN not set' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Admin bot uses state id=1
    const { data: state, error: stateErr } = await supabase
      .from('telegram_bot_state')
      .select('update_offset')
      .eq('id', 1)
      .single();

    if (stateErr) {
      return new Response(JSON.stringify({ error: stateErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let currentOffset = state.update_offset;
    let totalProcessed = 0;

    while (true) {
      const elapsed = Date.now() - startTime;
      const remainingMs = MAX_RUNTIME_MS - elapsed;
      if (remainingMs < MIN_REMAINING_MS) break;

      const timeout = Math.min(50, Math.floor(remainingMs / 1000) - 5);
      if (timeout < 1) break;

      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offset: currentOffset,
          timeout,
          allowed_updates: ['message'],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) { console.error('getUpdates failed:', data); break; }

      const updates = data.result ?? [];
      if (updates.length === 0) continue;

      for (const update of updates) {
        try {
          const msg = update.message;
          if (!msg || !msg.text) continue;

          const chatId = msg.chat.id;

          // Only handle replies to order notifications
          if (msg.reply_to_message) {
            await handleOrderReply(BOT_TOKEN, chatId, msg, supabase);
          }

          totalProcessed++;
        } catch (handlerErr) {
          console.error('Admin handler error:', handlerErr);
        }
      }

      const newOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;
      await supabase
        .from('telegram_bot_state')
        .update({ update_offset: newOffset, updated_at: new Date().toISOString() })
        .eq('id', 1);
      currentOffset = newOffset;
    }

    return new Response(JSON.stringify({ ok: true, processed: totalProcessed, finalOffset: currentOffset }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('telegram-poll-admin error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
