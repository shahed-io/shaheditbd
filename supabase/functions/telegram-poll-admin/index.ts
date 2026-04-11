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

// ─── ADMIN COMMANDS ───────────────────────────────────────────────────────
async function handleAdminStart(bot: string, chatId: number, supabase: any) {
  // Fetch recent order stats
  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  const { count: pendingOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: todayOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date().toISOString().split('T')[0]);

  let msg = `🔐 Shahed Store — Admin Order Management\n\n`;
  msg += `📊 অর্ডার সামারি:\n`;
  msg += `━━━━━━━━━━━━━━━━━━\n`;
  msg += `📦 মোট অর্ডার: ${totalOrders || 0}\n`;
  msg += `⏳ পেন্ডিং: ${pendingOrders || 0}\n`;
  msg += `📅 আজকের অর্ডার: ${todayOrders || 0}\n`;
  msg += `━━━━━━━━━━━━━━━━━━\n\n`;
  msg += `📌 কমান্ড:\n`;
  msg += `/start — ড্যাশবোর্ড\n`;
  msg += `/pending — পেন্ডিং অর্ডার\n`;
  msg += `/today — আজকের অর্ডার\n`;
  msg += `/recent — সর্বশেষ ১০টি অর্ডার\n`;
  msg += `/order <নম্বর> — অর্ডারের বিবরণ\n\n`;
  msg += `💬 অর্ডার নোটিফিকেশনে রিপ্লাই দিয়ে স্ট্যাটাস পরিবর্তন করুন।\n`;
  msg += `✅ নতুন অর্ডার ও স্ট্যাটাস আপডেটের নোটিফিকেশন স্বয়ংক্রিয়ভাবে আসবে।`;

  await sendMsg(bot, chatId, msg);
}

async function handlePendingOrders(bot: string, chatId: number, supabase: any) {
  const { data: orders } = await supabase
    .from('orders')
    .select('order_number, customer_name, customer_phone, total, payment_method, created_at, order_items(product_name, quantity, price, total)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(15);

  if (!orders?.length) {
    return sendMsg(bot, chatId, '✅ কোনো পেন্ডিং অর্ডার নেই! 🎉');
  }

  let msg = `⏳ পেন্ডিং অর্ডার (${orders.length}টি):\n━━━━━━━━━━━━━━━━━━\n\n`;

  for (const o of orders) {
    const items = (o.order_items || []).map((i: any) => `  • ${i.product_name} ×${i.quantity}`).join('\n');
    const time = new Date(o.created_at).toLocaleString('bn-BD');
    const pm = (o.payment_method || 'N/A').toUpperCase();

    msg += `🔢 #${o.order_number}\n`;
    msg += `👤 ${o.customer_name}`;
    if (o.customer_phone) msg += ` | 📱 ${o.customer_phone}`;
    msg += `\n📦 পণ্য:\n${items}\n`;
    msg += `💵 ৳${Number(o.total).toLocaleString()} | 💳 ${pm}\n`;
    msg += `⏰ ${time}\n\n`;
  }

  return sendMsg(bot, chatId, msg);
}

async function handleTodayOrders(bot: string, chatId: number, supabase: any) {
  const today = new Date().toISOString().split('T')[0];
  const { data: orders } = await supabase
    .from('orders')
    .select('order_number, customer_name, customer_phone, total, status, payment_method, created_at, order_items(product_name, quantity, price, total)')
    .gte('created_at', today)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!orders?.length) {
    return sendMsg(bot, chatId, '📅 আজ কোনো অর্ডার আসেনি।');
  }

  let msg = `📅 আজকের অর্ডার (${orders.length}টি):\n━━━━━━━━━━━━━━━━━━\n\n`;

  for (const o of orders) {
    const items = (o.order_items || []).map((i: any) => `  • ${i.product_name} ×${i.quantity}`).join('\n');
    const statusLabel = STATUS_LABELS[o.status] || o.status;
    const statusEmoji = STATUS_EMOJI[o.status] || '📦';
    const time = new Date(o.created_at).toLocaleTimeString('bn-BD');
    const pm = (o.payment_method || 'N/A').toUpperCase();

    msg += `${statusEmoji} #${o.order_number} — ${statusLabel}\n`;
    msg += `👤 ${o.customer_name}`;
    if (o.customer_phone) msg += ` | 📱 ${o.customer_phone}`;
    msg += `\n📦 পণ্য:\n${items}\n`;
    msg += `💵 ৳${Number(o.total).toLocaleString()} | 💳 ${pm}\n`;
    msg += `⏰ ${time}\n\n`;
  }

  return sendMsg(bot, chatId, msg);
}

async function handleRecentOrders(bot: string, chatId: number, supabase: any) {
  const { data: orders } = await supabase
    .from('orders')
    .select('order_number, customer_name, customer_phone, total, status, payment_method, created_at, order_items(product_name, quantity, price, total)')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!orders?.length) {
    return sendMsg(bot, chatId, '📦 কোনো অর্ডার পাওয়া যায়নি।');
  }

  let msg = `📦 সর্বশেষ ১০টি অর্ডার:\n━━━━━━━━━━━━━━━━━━\n\n`;

  for (const o of orders) {
    const items = (o.order_items || []).map((i: any) => `  • ${i.product_name} ×${i.quantity}`).join('\n');
    const statusLabel = STATUS_LABELS[o.status] || o.status;
    const statusEmoji = STATUS_EMOJI[o.status] || '📦';
    const pm = (o.payment_method || 'N/A').toUpperCase();
    const time = new Date(o.created_at).toLocaleString('bn-BD');

    msg += `${statusEmoji} #${o.order_number} — ${statusLabel}\n`;
    msg += `👤 ${o.customer_name}`;
    if (o.customer_phone) msg += ` | 📱 ${o.customer_phone}`;
    msg += `\n📦 পণ্য:\n${items}\n`;
    msg += `💵 ৳${Number(o.total).toLocaleString()} | 💳 ${pm}\n`;
    msg += `⏰ ${time}\n\n`;
  }

  return sendMsg(bot, chatId, msg);
}

async function handleOrderDetail(bot: string, chatId: number, orderNum: string, supabase: any) {
  if (!orderNum.trim()) {
    return sendMsg(bot, chatId, '📋 অর্ডারের বিবরণ দেখতে:\n/order <অর্ডার নম্বর>\n\nউদাহরণ: /order ORD-12345');
  }

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(product_name, quantity, price, total, license_key)')
    .eq('order_number', orderNum.toUpperCase())
    .single();

  if (!order) {
    return sendMsg(bot, chatId, `❌ অর্ডার #${orderNum} পাওয়া যায়নি।`);
  }

  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const statusEmoji = STATUS_EMOJI[order.status] || '📦';
  const pm = (order.payment_method || 'N/A').toUpperCase();

  let msg = `${statusEmoji} অর্ডার #${order.order_number}\n`;
  msg += `━━━━━━━━━━━━━━━━━━\n\n`;
  msg += `👤 গ্রাহক: ${order.customer_name}\n`;
  msg += `📧 ইমেইল: ${order.customer_email}\n`;
  if (order.customer_phone) msg += `📱 ফোন: ${order.customer_phone}\n`;
  msg += `\n📋 স্ট্যাটাস: ${statusLabel}\n`;
  msg += `💳 পেমেন্ট: ${pm}`;
  if (order.transaction_id) msg += ` | TrxID: ${order.transaction_id}`;
  msg += `\n💰 পেমেন্ট স্ট্যাটাস: ${order.payment_status || 'N/A'}\n`;

  msg += `\n📦 পণ্য:\n`;
  for (const item of (order.order_items || [])) {
    msg += `  • ${item.product_name} ×${item.quantity} — ৳${Number(item.total).toLocaleString()}\n`;
    if (item.license_key) {
      msg += `    🔑 ${item.license_key}\n`;
    }
  }

  if (order.discount_amount && Number(order.discount_amount) > 0) {
    msg += `\n💰 সাবটোটাল: ৳${Number(order.subtotal).toLocaleString()}\n`;
    msg += `🎉 ছাড়: -৳${Number(order.discount_amount).toLocaleString()}`;
    if (order.coupon_code) msg += ` (${order.coupon_code})`;
    msg += `\n`;
  }
  msg += `💵 মোট: ৳${Number(order.total).toLocaleString()}\n`;

  if (order.notes) msg += `\n📝 কাস্টমার নোট: ${order.notes}\n`;
  if (order.admin_notes) msg += `📝 এডমিন নোট: ${order.admin_notes}\n`;

  msg += `\n⏰ তৈরি: ${new Date(order.created_at).toLocaleString('bn-BD')}`;
  msg += `\n🔄 আপডেট: ${new Date(order.updated_at).toLocaleString('bn-BD')}`;

  return sendMsg(bot, chatId, msg);
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN BOT POLLING — Admin-only, handles commands + order reply status
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

    // Fetch admin chat ID from site_settings
    const { data: chatIdSetting } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'telegram_chat_id')
      .single();

    const adminChatId = chatIdSetting?.value?.trim();

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

          // ─── ADMIN ACCESS CHECK ───────────────────────────────────────
          // Only the configured admin chat ID can use this bot
          if (!adminChatId || String(chatId) !== adminChatId) {
            await sendMsg(BOT_TOKEN, chatId,
              `🔒 এই বটটি শুধুমাত্র এডমিনের জন্য।\n\n` +
              `আপনার অ্যাক্সেস নেই।\n\n` +
              `🛍️ শপিংয়ের জন্য @Shahed_Store_bot ব্যবহার করুন।`
            );
            totalProcessed++;
            continue;
          }

          // ─── ADMIN COMMANDS ───────────────────────────────────────────
          const text = msg.text.trim();

          // Check order reply first
          if (msg.reply_to_message) {
            const handled = await handleOrderReply(BOT_TOKEN, chatId, msg, supabase);
            if (handled) { totalProcessed++; continue; }
          }

          if (text === '/start' || text.startsWith('/start ')) {
            await handleAdminStart(BOT_TOKEN, chatId, supabase);
          } else if (text === '/pending') {
            await handlePendingOrders(BOT_TOKEN, chatId, supabase);
          } else if (text === '/today') {
            await handleTodayOrders(BOT_TOKEN, chatId, supabase);
          } else if (text === '/recent') {
            await handleRecentOrders(BOT_TOKEN, chatId, supabase);
          } else if (text.startsWith('/order')) {
            const orderNum = text.replace(/^\/order\s*/i, '');
            await handleOrderDetail(BOT_TOKEN, chatId, orderNum, supabase);
          } else {
            // Unknown command — maybe a status word for general use
            await sendMsg(BOT_TOKEN, chatId,
              `🤔 কমান্ড বুঝতে পারিনি।\n\n` +
              `📌 উপলব্ধ কমান্ড:\n` +
              `/start — ড্যাশবোর্ড\n` +
              `/pending — পেন্ডিং অর্ডার\n` +
              `/today — আজকের অর্ডার\n` +
              `/recent — সর্বশেষ ১০টি অর্ডার\n` +
              `/order <নম্বর> — অর্ডারের বিবরণ\n\n` +
              `💬 অর্ডার নোটিফিকেশনে রিপ্লাই দিয়ে স্ট্যাটাস পরিবর্তন করুন।`
            );
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
