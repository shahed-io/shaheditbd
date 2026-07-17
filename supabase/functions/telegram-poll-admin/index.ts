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

const ALL_STATUSES = ['pending', 'processing', 'delivered', 'completed', 'cancelled', 'refunded', 'failed'];

// ─── TELEGRAM HELPERS ─────────────────────────────────────────────────────
async function tgApi(bot: string, method: string, body: any) {
  const res = await fetch(`https://api.telegram.org/bot${bot}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return res.json();
}

async function sendMsg(bot: string, chatId: string | number, text: string, keyboard?: any, replyTo?: number) {
  const body: Record<string, any> = { chat_id: chatId, text, disable_web_page_preview: true, parse_mode: 'HTML' };
  if (keyboard) body.reply_markup = keyboard;
  if (replyTo) body.reply_to_message_id = replyTo;
  return tgApi(bot, 'sendMessage', body);
}

async function editMsg(bot: string, chatId: number, messageId: number, text: string, keyboard?: any) {
  const body: Record<string, any> = { chat_id: chatId, message_id: messageId, text, disable_web_page_preview: true, parse_mode: 'HTML' };
  if (keyboard) body.reply_markup = keyboard;
  return tgApi(bot, 'editMessageText', body);
}

async function answerCallback(bot: string, callbackId: string, text?: string, alert = false) {
  return tgApi(bot, 'answerCallbackQuery', { callback_query_id: callbackId, text: text || '', show_alert: alert });
}

async function setCommands(bot: string) {
  return tgApi(bot, 'setMyCommands', {
    commands: [
      { command: 'menu', description: '🏠 মূল মেনু' },
      { command: 'pending', description: '⏳ পেন্ডিং অর্ডার' },
      { command: 'today', description: '📅 আজকের অর্ডার' },
      { command: 'recent', description: '📦 সর্বশেষ অর্ডার' },
      { command: 'stats', description: '📊 বিক্রয় পরিসংখ্যান' },
      { command: 'sales', description: '💰 আয় রিপোর্ট' },
      { command: 'lowstock', description: '📉 লো-স্টক পণ্য' },
      { command: 'customers', description: '👥 নতুন গ্রাহক' },
      { command: 'find', description: '🔍 অর্ডার খুঁজুন (নাম/ফোন/ইমেইল)' },
      { command: 'order', description: '📋 অর্ডার বিবরণ' },
      { command: 'note', description: '📝 এডমিন নোট যোগ করুন' },
      { command: 'help', description: '❓ সাহায্য' },
    ],
  });
}

// ─── FORMATTERS ───────────────────────────────────────────────────────────
function esc(s: any): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtOrderLine(o: any): string {
  const st = STATUS_EMOJI[o.status] || '📦';
  const stL = STATUS_LABELS[o.status] || o.status;
  return `${st} <b>#${esc(o.order_number)}</b> — ${stL}\n👤 ${esc(o.customer_name)}${o.customer_phone ? ` | 📱 ${esc(o.customer_phone)}` : ''}\n💵 ৳${Number(o.total).toLocaleString()} | ⏰ ${new Date(o.created_at).toLocaleString('bn-BD')}`;
}

// ─── INLINE KEYBOARDS ─────────────────────────────────────────────────────
function mainMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '⏳ পেন্ডিং', callback_data: 'list:pending:0' }, { text: '📅 আজকের', callback_data: 'list:today:0' }],
      [{ text: '📦 সর্বশেষ ১০', callback_data: 'list:recent:0' }, { text: '📊 পরিসংখ্যান', callback_data: 'stats' }],
      [{ text: '💰 আয় রিপোর্ট', callback_data: 'sales' }, { text: '📉 লো-স্টক', callback_data: 'lowstock' }],
      [{ text: '👥 নতুন গ্রাহক', callback_data: 'customers' }, { text: '❓ সাহায্য', callback_data: 'help' }],
    ],
  };
}

function orderStatusKeyboard(orderId: string, currentStatus: string) {
  const rows: any[] = [];
  let row: any[] = [];
  for (const s of ALL_STATUSES) {
    const marker = s === currentStatus ? '● ' : '';
    row.push({ text: `${STATUS_EMOJI[s]} ${marker}${STATUS_LABELS[s]}`, callback_data: `setst:${orderId}:${s}` });
    if (row.length === 2) { rows.push(row); row = []; }
  }
  if (row.length) rows.push(row);
  rows.push([{ text: '🔙 মেনু', callback_data: 'menu' }]);
  return { inline_keyboard: rows };
}

function listKeyboard(kind: string, page: number, hasMore: boolean) {
  const nav: any[] = [];
  if (page > 0) nav.push({ text: '⬅️ আগে', callback_data: `list:${kind}:${page - 1}` });
  if (hasMore) nav.push({ text: 'পরে ➡️', callback_data: `list:${kind}:${page + 1}` });
  const rows: any[] = [];
  if (nav.length) rows.push(nav);
  rows.push([{ text: '🔄 রিফ্রেশ', callback_data: `list:${kind}:${page}` }, { text: '🏠 মেনু', callback_data: 'menu' }]);
  return { inline_keyboard: rows };
}

// ─── COMMAND HANDLERS ─────────────────────────────────────────────────────
async function renderMenu(bot: string, chatId: number, supabase: any, editId?: number) {
  const [tot, pen, tod, todaySales] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
    supabase.from('orders').select('total').gte('created_at', new Date().toISOString().split('T')[0]).in('status', ['completed', 'delivered']),
  ]);
  const todayRev = (todaySales.data || []).reduce((s: number, r: any) => s + Number(r.total || 0), 0);

  const text =
    `🔐 <b>Shahed Store — Admin</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📦 মোট অর্ডার: <b>${tot.count || 0}</b>\n` +
    `⏳ পেন্ডিং: <b>${pen.count || 0}</b>\n` +
    `📅 আজকের অর্ডার: <b>${tod.count || 0}</b>\n` +
    `💰 আজকের আয়: <b>৳${todayRev.toLocaleString()}</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `নিচের বাটন থেকে বেছে নিন 👇`;

  if (editId) return editMsg(bot, chatId, editId, text, mainMenuKeyboard());
  return sendMsg(bot, chatId, text, mainMenuKeyboard());
}

const PAGE_SIZE = 5;

async function renderList(bot: string, chatId: number, supabase: any, kind: string, page: number, editId?: number) {
  let query = supabase.from('orders')
    .select('id, order_number, customer_name, customer_phone, total, status, created_at')
    .order('created_at', { ascending: false });

  let title = '';
  if (kind === 'pending') { query = query.eq('status', 'pending'); title = '⏳ পেন্ডিং অর্ডার'; }
  else if (kind === 'today') { query = query.gte('created_at', new Date().toISOString().split('T')[0]); title = '📅 আজকের অর্ডার'; }
  else { title = '📦 সর্বশেষ অর্ডার'; }

  const from = page * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE);
  const { data: orders } = await query;

  const hasMore = (orders?.length || 0) > PAGE_SIZE;
  const shown = (orders || []).slice(0, PAGE_SIZE);

  if (!shown.length) {
    const text = `${title}\n━━━━━━━━━━━━━━━━━━\n\n✅ কোনো অর্ডার নেই।`;
    if (editId) return editMsg(bot, chatId, editId, text, listKeyboard(kind, page, false));
    return sendMsg(bot, chatId, text, listKeyboard(kind, page, false));
  }

  let text = `${title} — পৃষ্ঠা ${page + 1}\n━━━━━━━━━━━━━━━━━━\n\n`;
  const rows: any[] = [];
  for (const o of shown) {
    text += fmtOrderLine(o) + '\n\n';
    rows.push([{ text: `📋 #${o.order_number} — বিস্তারিত`, callback_data: `view:${o.id}` }]);
  }

  const nav: any[] = [];
  if (page > 0) nav.push({ text: '⬅️ আগে', callback_data: `list:${kind}:${page - 1}` });
  if (hasMore) nav.push({ text: 'পরে ➡️', callback_data: `list:${kind}:${page + 1}` });
  if (nav.length) rows.push(nav);
  rows.push([{ text: '🔄 রিফ্রেশ', callback_data: `list:${kind}:${page}` }, { text: '🏠 মেনু', callback_data: 'menu' }]);

  const kb = { inline_keyboard: rows };
  if (editId) return editMsg(bot, chatId, editId, text, kb);
  return sendMsg(bot, chatId, text, kb);
}

async function renderOrderDetail(bot: string, chatId: number, supabase: any, orderIdOrNum: string, editId?: number) {
  const isUuid = /^[0-9a-f-]{36}$/i.test(orderIdOrNum);
  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(product_name, quantity, price, total, license_key)')
    [isUuid ? 'eq' : 'eq'](isUuid ? 'id' : 'order_number', isUuid ? orderIdOrNum : orderIdOrNum.toUpperCase())
    .single();

  if (!order) {
    const t = `❌ অর্ডার পাওয়া যায়নি: ${esc(orderIdOrNum)}`;
    if (editId) return editMsg(bot, chatId, editId, t, mainMenuKeyboard());
    return sendMsg(bot, chatId, t, mainMenuKeyboard());
  }

  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const statusEmoji = STATUS_EMOJI[order.status] || '📦';
  const pm = (order.payment_method || 'N/A').toUpperCase();

  let msg = `${statusEmoji} <b>অর্ডার #${esc(order.order_number)}</b>\n`;
  msg += `━━━━━━━━━━━━━━━━━━\n\n`;
  msg += `👤 <b>${esc(order.customer_name)}</b>\n`;
  msg += `📧 ${esc(order.customer_email)}\n`;
  if (order.customer_phone) msg += `📱 <code>${esc(order.customer_phone)}</code>\n`;
  msg += `\n📋 স্ট্যাটাস: <b>${statusLabel}</b>\n`;
  msg += `💳 পেমেন্ট: ${pm}`;
  if (order.transaction_id) msg += ` | <code>${esc(order.transaction_id)}</code>`;
  msg += `\n💰 পেমেন্ট স্ট্যাটাস: ${esc(order.payment_status || 'N/A')}\n\n📦 <b>পণ্য:</b>\n`;

  for (const item of (order.order_items || [])) {
    msg += `  • ${esc(item.product_name)} ×${item.quantity} — ৳${Number(item.total).toLocaleString()}\n`;
    if (item.license_key) msg += `    🔑 <code>${esc(item.license_key)}</code>\n`;
  }

  if (order.discount_amount && Number(order.discount_amount) > 0) {
    msg += `\n💰 সাবটোটাল: ৳${Number(order.subtotal).toLocaleString()}\n`;
    msg += `🎉 ছাড়: -৳${Number(order.discount_amount).toLocaleString()}`;
    if (order.coupon_code) msg += ` (${esc(order.coupon_code)})`;
    msg += `\n`;
  }
  msg += `💵 <b>মোট: ৳${Number(order.total).toLocaleString()}</b>\n`;

  if (order.notes) msg += `\n📝 গ্রাহক নোট: ${esc(order.notes)}\n`;
  if (order.admin_notes) msg += `📝 এডমিন নোট: ${esc(order.admin_notes)}\n`;

  msg += `\n⏰ তৈরি: ${new Date(order.created_at).toLocaleString('bn-BD')}`;

  const kb = orderStatusKeyboard(order.id, order.status);
  if (editId) return editMsg(bot, chatId, editId, msg, kb);
  return sendMsg(bot, chatId, msg, kb);
}

async function renderStats(bot: string, chatId: number, supabase: any, editId?: number) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString();

  const [t, w, m, byStatus] = await Promise.all([
    supabase.from('orders').select('total, status').gte('created_at', today),
    supabase.from('orders').select('total, status').gte('created_at', weekAgo),
    supabase.from('orders').select('total, status').gte('created_at', monthAgo),
    supabase.from('orders').select('status'),
  ]);

  const sumOk = (rows: any[]) => (rows || []).filter(r => ['completed', 'delivered'].includes(r.status))
    .reduce((s, r) => s + Number(r.total || 0), 0);

  const counts: Record<string, number> = {};
  (byStatus.data || []).forEach((r: any) => { counts[r.status] = (counts[r.status] || 0) + 1; });

  let text = `📊 <b>বিক্রয় পরিসংখ্যান</b>\n━━━━━━━━━━━━━━━━━━\n\n`;
  text += `📅 আজ: <b>${(t.data || []).length}</b> অর্ডার | ৳${sumOk(t.data || []).toLocaleString()}\n`;
  text += `📆 ৭ দিন: <b>${(w.data || []).length}</b> অর্ডার | ৳${sumOk(w.data || []).toLocaleString()}\n`;
  text += `🗓️ ৩০ দিন: <b>${(m.data || []).length}</b> অর্ডার | ৳${sumOk(m.data || []).toLocaleString()}\n\n`;
  text += `📋 <b>স্ট্যাটাস অনুযায়ী:</b>\n`;
  for (const s of ALL_STATUSES) {
    text += `  ${STATUS_EMOJI[s]} ${STATUS_LABELS[s]}: <b>${counts[s] || 0}</b>\n`;
  }

  const kb = { inline_keyboard: [[{ text: '🔄 রিফ্রেশ', callback_data: 'stats' }, { text: '🏠 মেনু', callback_data: 'menu' }]] };
  if (editId) return editMsg(bot, chatId, editId, text, kb);
  return sendMsg(bot, chatId, text, kb);
}

async function renderSales(bot: string, chatId: number, supabase: any, editId?: number) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const yesterdayStart = new Date(Date.now() - 86400_000);
  yesterdayStart.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString();

  const q = (from: string, to?: string) => {
    let x = supabase.from('orders').select('total, payment_method, status').in('status', ['completed', 'delivered']).gte('created_at', from);
    if (to) x = x.lt('created_at', to);
    return x;
  };

  const [today_, yest, week, month] = await Promise.all([
    q(today), q(yesterdayStart.toISOString(), today), q(weekAgo), q(monthAgo),
  ]);

  const sum = (rows: any[]) => (rows || []).reduce((s, r) => s + Number(r.total || 0), 0);
  const byPm: Record<string, number> = {};
  (month.data || []).forEach((r: any) => {
    const p = (r.payment_method || 'other').toLowerCase();
    byPm[p] = (byPm[p] || 0) + Number(r.total || 0);
  });

  let text = `💰 <b>আয় রিপোর্ট</b>\n━━━━━━━━━━━━━━━━━━\n\n`;
  text += `📅 আজ: <b>৳${sum(today_.data || []).toLocaleString()}</b>\n`;
  text += `⏮️ গতকাল: <b>৳${sum(yest.data || []).toLocaleString()}</b>\n`;
  text += `📆 ৭ দিন: <b>৳${sum(week.data || []).toLocaleString()}</b>\n`;
  text += `🗓️ ৩০ দিন: <b>৳${sum(month.data || []).toLocaleString()}</b>\n\n`;
  text += `💳 <b>৩০ দিনে পেমেন্ট মাধ্যম:</b>\n`;
  for (const [p, v] of Object.entries(byPm).sort((a, b) => b[1] - a[1])) {
    text += `  • ${p.toUpperCase()}: ৳${v.toLocaleString()}\n`;
  }

  const kb = { inline_keyboard: [[{ text: '🔄 রিফ্রেশ', callback_data: 'sales' }, { text: '🏠 মেনু', callback_data: 'menu' }]] };
  if (editId) return editMsg(bot, chatId, editId, text, kb);
  return sendMsg(bot, chatId, text, kb);
}

async function renderLowStock(bot: string, chatId: number, supabase: any, editId?: number) {
  const { data } = await supabase
    .from('products')
    .select('name, stock_quantity, price')
    .lte('stock_quantity', 5)
    .order('stock_quantity', { ascending: true })
    .limit(20);

  let text = `📉 <b>লো-স্টক পণ্য (≤ ৫)</b>\n━━━━━━━━━━━━━━━━━━\n\n`;
  if (!data?.length) text += `✅ সব পণ্যের স্টক ঠিক আছে।`;
  else {
    for (const p of data) {
      const emoji = (p.stock_quantity || 0) === 0 ? '🔴' : '🟡';
      text += `${emoji} <b>${esc(p.name)}</b>\n   স্টক: <b>${p.stock_quantity ?? 0}</b> | ৳${Number(p.price || 0).toLocaleString()}\n\n`;
    }
  }

  const kb = { inline_keyboard: [[{ text: '🔄 রিফ্রেশ', callback_data: 'lowstock' }, { text: '🏠 মেনু', callback_data: 'menu' }]] };
  if (editId) return editMsg(bot, chatId, editId, text, kb);
  return sendMsg(bot, chatId, text, kb);
}

async function renderCustomers(bot: string, chatId: number, supabase: any, editId?: number) {
  const { data } = await supabase
    .from('profiles')
    .select('full_name, email, phone, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  let text = `👥 <b>সর্বশেষ ১০ জন গ্রাহক</b>\n━━━━━━━━━━━━━━━━━━\n\n`;
  if (!data?.length) text += `কোনো গ্রাহক নেই।`;
  else {
    for (const p of data) {
      text += `👤 <b>${esc(p.full_name || 'N/A')}</b>\n`;
      if (p.email) text += `   📧 ${esc(p.email)}\n`;
      if (p.phone) text += `   📱 <code>${esc(p.phone)}</code>\n`;
      text += `   ⏰ ${new Date(p.created_at).toLocaleDateString('bn-BD')}\n\n`;
    }
  }

  const kb = { inline_keyboard: [[{ text: '🔄 রিফ্রেশ', callback_data: 'customers' }, { text: '🏠 মেনু', callback_data: 'menu' }]] };
  if (editId) return editMsg(bot, chatId, editId, text, kb);
  return sendMsg(bot, chatId, text, kb);
}

async function renderFind(bot: string, chatId: number, supabase: any, query: string) {
  if (!query.trim()) {
    return sendMsg(bot, chatId, `🔍 <b>খোঁজার নিয়ম:</b>\n<code>/find রহিম</code>\n<code>/find 01700000000</code>\n<code>/find user@mail.com</code>`);
  }
  const q = query.trim();
  const { data } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, customer_phone, customer_email, total, status, created_at')
    .or(`customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,customer_email.ilike.%${q}%,order_number.ilike.%${q}%`)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!data?.length) return sendMsg(bot, chatId, `❌ "${esc(q)}" — কোনো অর্ডার পাওয়া যায়নি।`);

  let text = `🔍 <b>ফলাফল: "${esc(q)}"</b> (${data.length}টি)\n━━━━━━━━━━━━━━━━━━\n\n`;
  const rows: any[] = [];
  for (const o of data) {
    text += fmtOrderLine(o) + '\n\n';
    rows.push([{ text: `📋 #${o.order_number}`, callback_data: `view:${o.id}` }]);
  }
  rows.push([{ text: '🏠 মেনু', callback_data: 'menu' }]);
  return sendMsg(bot, chatId, text, { inline_keyboard: rows });
}

async function renderHelp(bot: string, chatId: number, editId?: number) {
  const text =
    `❓ <b>সাহায্য — Admin Bot</b>\n━━━━━━━━━━━━━━━━━━\n\n` +
    `<b>📌 কমান্ড:</b>\n` +
    `/menu — মূল মেনু\n` +
    `/pending, /today, /recent — অর্ডার লিস্ট\n` +
    `/stats — পরিসংখ্যান\n` +
    `/sales — আয় রিপোর্ট\n` +
    `/lowstock — কম স্টক পণ্য\n` +
    `/customers — নতুন গ্রাহক\n` +
    `/find &lt;query&gt; — খোঁজ (নাম/ফোন/ইমেইল/অর্ডার নম্বর)\n` +
    `/order &lt;নম্বর&gt; — অর্ডার বিবরণ\n` +
    `/note &lt;নম্বর&gt; &lt;নোট&gt; — এডমিন নোট যুক্ত\n\n` +
    `<b>⚡ দ্রুত পদক্ষেপ:</b>\n` +
    `• অর্ডার বিবরণে বাটন চেপে স্ট্যাটাস পরিবর্তন\n` +
    `• নতুন অর্ডার নোটিফিকেশনে reply করে স্ট্যাটাস (completed/cancelled ইত্যাদি)\n\n` +
    `🌐 <b>Web Admin Panel:</b>\nহ্যাঁ — Admin Panel এ <b>Telegram Bot</b> সেকশনে গিয়ে সেটিংস/টেস্ট/স্ট্যাটস দেখতে পারবেন।`;
  const kb = { inline_keyboard: [[{ text: '🏠 মেনু', callback_data: 'menu' }]] };
  if (editId) return editMsg(bot, chatId, editId, text, kb);
  return sendMsg(bot, chatId, text, kb);
}

async function handleSetStatus(bot: string, chatId: number, messageId: number, callbackId: string, orderId: string, newStatus: string, supabase: any) {
  const { data: order } = await supabase.from('orders').select('status, order_number').eq('id', orderId).single();
  if (!order) return answerCallback(bot, callbackId, '❌ অর্ডার নেই', true);
  if (order.status === newStatus) return answerCallback(bot, callbackId, `ইতিমধ্যে ${STATUS_LABELS[newStatus]}`);

  const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
  if (error) return answerCallback(bot, callbackId, `❌ ${error.message}`, true);

  await answerCallback(bot, callbackId, `✅ ${STATUS_LABELS[newStatus]}`);
  return renderOrderDetail(bot, chatId, supabase, orderId, messageId);
}

async function handleNote(bot: string, chatId: number, supabase: any, args: string) {
  const parts = args.trim().split(/\s+/);
  const num = parts.shift();
  const note = parts.join(' ').trim();
  if (!num || !note) {
    return sendMsg(bot, chatId, `📝 ব্যবহার:\n<code>/note ORD-12345 আজ ডেলিভারি হবে</code>`);
  }
  const { data: order } = await supabase.from('orders').select('id, admin_notes').eq('order_number', num.toUpperCase()).single();
  if (!order) return sendMsg(bot, chatId, `❌ অর্ডার #${esc(num)} পাওয়া যায়নি।`);
  const combined = order.admin_notes ? `${order.admin_notes}\n• ${note}` : `• ${note}`;
  const { error } = await supabase.from('orders').update({ admin_notes: combined }).eq('id', order.id);
  if (error) return sendMsg(bot, chatId, `❌ ${esc(error.message)}`);
  return sendMsg(bot, chatId, `✅ এডমিন নোট যুক্ত হয়েছে অর্ডার #${esc(num)} এ।`);
}

// ─── ORDER REPLY HANDLER (backward-compat) ───────────────────────────────
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

  const commandText = (msg.text || '').trim().toLowerCase();
  const newStatus = STATUS_MAP[commandText];

  if (!newStatus) {
    await sendMsg(bot, chatId,
      `❓ স্ট্যাটাস বুঝতে পারিনি: "${esc(msg.text)}"\n\nসঠিক কমান্ড: completed / delivered / processing / cancelled / refunded / pending`,
      undefined, msg.message_id);
    return true;
  }

  const { data: order } = await supabase.from('orders').select('status, order_number, customer_name, total').eq('id', mapping.order_id).single();
  if (!order) { await sendMsg(bot, chatId, `❌ অর্ডার #${mapping.order_number} নেই।`, undefined, msg.message_id); return true; }

  if (order.status === newStatus) {
    await sendMsg(bot, chatId, `ℹ️ ইতিমধ্যে "${STATUS_LABELS[newStatus]}"`, undefined, msg.message_id);
    return true;
  }

  const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', mapping.order_id);
  if (error) { await sendMsg(bot, chatId, `❌ ${error.message}`, undefined, msg.message_id); return true; }

  await sendMsg(bot, chatId,
    `${STATUS_EMOJI[newStatus]} #${mapping.order_number} → <b>${STATUS_LABELS[newStatus]}</b>\n👤 ${esc(order.customer_name)} | ৳${Number(order.total).toLocaleString()}`,
    undefined, msg.message_id);
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN BOT POLLING
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

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Set command menu (fire-and-forget; harmless if repeated)
    setCommands(BOT_TOKEN).catch(() => {});

    const { data: chatIdSetting } = await supabase
      .from('site_settings').select('value').eq('key', 'telegram_chat_id').single();
    const adminChatId = chatIdSetting?.value?.trim();

    const { data: state, error: stateErr } = await supabase
      .from('telegram_bot_state').select('update_offset').eq('id', 1).single();
    if (stateErr) return new Response(JSON.stringify({ error: stateErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    let currentOffset = state.update_offset;
    let totalProcessed = 0;

    while (true) {
      const elapsed = Date.now() - startTime;
      const remainingMs = MAX_RUNTIME_MS - elapsed;
      if (remainingMs < MIN_REMAINING_MS) break;
      const timeout = Math.min(50, Math.floor(remainingMs / 1000) - 5);
      if (timeout < 1) break;

      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offset: currentOffset, timeout, allowed_updates: ['message', 'callback_query'] }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data?.error_code === 409) {
          return new Response(JSON.stringify({ ok: true, skipped: 'another_poller_active', processed: totalProcessed }), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.error('getUpdates failed:', data); break;
      }

      const updates = data.result ?? [];
      if (updates.length === 0) continue;

      for (const update of updates) {
        try {
          // ─── CALLBACK QUERY (button press) ──────────────────────────
          if (update.callback_query) {
            const cq = update.callback_query;
            const chatId = cq.message?.chat?.id;
            const messageId = cq.message?.message_id;
            const cbId = cq.id;
            const data = String(cq.data || '');

            if (!adminChatId || String(chatId) !== adminChatId) {
              await answerCallback(BOT_TOKEN, cbId, '🔒 এডমিন অ্যাক্সেস নেই', true);
              totalProcessed++; continue;
            }

            if (data === 'menu') { await answerCallback(BOT_TOKEN, cbId); await renderMenu(BOT_TOKEN, chatId, supabase, messageId); }
            else if (data === 'stats') { await answerCallback(BOT_TOKEN, cbId); await renderStats(BOT_TOKEN, chatId, supabase, messageId); }
            else if (data === 'sales') { await answerCallback(BOT_TOKEN, cbId); await renderSales(BOT_TOKEN, chatId, supabase, messageId); }
            else if (data === 'lowstock') { await answerCallback(BOT_TOKEN, cbId); await renderLowStock(BOT_TOKEN, chatId, supabase, messageId); }
            else if (data === 'customers') { await answerCallback(BOT_TOKEN, cbId); await renderCustomers(BOT_TOKEN, chatId, supabase, messageId); }
            else if (data === 'help') { await answerCallback(BOT_TOKEN, cbId); await renderHelp(BOT_TOKEN, chatId, messageId); }
            else if (data.startsWith('list:')) {
              const [, kind, pageStr] = data.split(':');
              await answerCallback(BOT_TOKEN, cbId);
              await renderList(BOT_TOKEN, chatId, supabase, kind, Number(pageStr) || 0, messageId);
            } else if (data.startsWith('view:')) {
              await answerCallback(BOT_TOKEN, cbId);
              await renderOrderDetail(BOT_TOKEN, chatId, supabase, data.slice(5), messageId);
            } else if (data.startsWith('setst:')) {
              const [, orderId, newStatus] = data.split(':');
              await handleSetStatus(BOT_TOKEN, chatId, messageId, cbId, orderId, newStatus, supabase);
            } else {
              await answerCallback(BOT_TOKEN, cbId, 'অজানা অ্যাকশন');
            }
            totalProcessed++; continue;
          }

          // ─── MESSAGE ────────────────────────────────────────────────
          const msg = update.message;
          if (!msg || !msg.text) continue;
          const chatId = msg.chat.id;

          if (!adminChatId || String(chatId) !== adminChatId) {
            await sendMsg(BOT_TOKEN, chatId,
              `🔒 এই বটটি শুধুমাত্র এডমিনের জন্য।\n\n🛍️ শপিংয়ের জন্য @Shahed_Store_bot ব্যবহার করুন।`);
            totalProcessed++; continue;
          }

          const text = msg.text.trim();

          if (msg.reply_to_message) {
            const handled = await handleOrderReply(BOT_TOKEN, chatId, msg, supabase);
            if (handled) { totalProcessed++; continue; }
          }

          if (text === '/start' || text === '/menu' || text.startsWith('/start ') || text.startsWith('/menu ')) {
            await renderMenu(BOT_TOKEN, chatId, supabase);
          } else if (text === '/pending') { await renderList(BOT_TOKEN, chatId, supabase, 'pending', 0); }
          else if (text === '/today') { await renderList(BOT_TOKEN, chatId, supabase, 'today', 0); }
          else if (text === '/recent') { await renderList(BOT_TOKEN, chatId, supabase, 'recent', 0); }
          else if (text === '/stats') { await renderStats(BOT_TOKEN, chatId, supabase); }
          else if (text === '/sales') { await renderSales(BOT_TOKEN, chatId, supabase); }
          else if (text === '/lowstock') { await renderLowStock(BOT_TOKEN, chatId, supabase); }
          else if (text === '/customers') { await renderCustomers(BOT_TOKEN, chatId, supabase); }
          else if (text === '/help') { await renderHelp(BOT_TOKEN, chatId); }
          else if (text.startsWith('/find')) {
            await renderFind(BOT_TOKEN, chatId, supabase, text.replace(/^\/find\s*/i, ''));
          } else if (text.startsWith('/order')) {
            const num = text.replace(/^\/order\s*/i, '').trim();
            if (!num) await sendMsg(BOT_TOKEN, chatId, `📋 <code>/order ORD-12345</code>`);
            else await renderOrderDetail(BOT_TOKEN, chatId, supabase, num);
          } else if (text.startsWith('/note')) {
            await handleNote(BOT_TOKEN, chatId, supabase, text.replace(/^\/note\s*/i, ''));
          } else {
            await sendMsg(BOT_TOKEN, chatId,
              `🤔 কমান্ড বুঝতে পারিনি। /menu চাপুন অথবা /help দেখুন।`,
              mainMenuKeyboard());
          }

          totalProcessed++;
        } catch (handlerErr) {
          console.error('Admin handler error:', handlerErr);
        }
      }

      const newOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;
      await supabase.from('telegram_bot_state').update({ update_offset: newOffset, updated_at: new Date().toISOString() }).eq('id', 1);
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
