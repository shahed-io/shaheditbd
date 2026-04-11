import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── STATUS MAPS (for order reply feature) ────────────────────────────────
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

// ─── TELEGRAM HELPERS ─────────────────────────────────────────────────────
async function sendMsg(botToken: string, chatId: string | number, text: string, keyboard?: any, replyTo?: number) {
  const body: Record<string, any> = { chat_id: chatId, text, disable_web_page_preview: true };
  if (keyboard) body.reply_markup = keyboard;
  if (replyTo) body.reply_to_message_id = replyTo;
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return res.json();
}

async function editMsg(botToken: string, chatId: string | number, messageId: number, text: string, keyboard?: any) {
  const body: Record<string, any> = { chat_id: chatId, message_id: messageId, text, disable_web_page_preview: true };
  if (keyboard) body.reply_markup = keyboard;
  const res = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return res.json();
}

async function answerCb(botToken: string, callbackQueryId: string, text?: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

function inlineKb(buttons: { text: string; callback_data: string }[][]) {
  return { inline_keyboard: buttons };
}

// ─── SITE URL HELPER ──────────────────────────────────────────────────────
function getSiteUrl(): string {
  return 'https://shahedstore.com.bd';
}

// ─── COMMAND HANDLERS ─────────────────────────────────────────────────────
async function handleStart(bot: string, chatId: number, supabase: any) {
  // Fetch customizable welcome message from settings
  const { data: settingsData } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['telegram_shop_bot_welcome', 'telegram_shop_bot_footer', 'telegram_shop_bot_enabled']);
  
  const s: Record<string, string> = {};
  settingsData?.forEach((r: any) => { s[r.key] = r.value || ''; });

  // Check if bot is disabled
  if (s['telegram_shop_bot_enabled'] === 'false') {
    await sendMsg(bot, chatId, '⏸️ শপিং বট বর্তমানে নিষ্ক্রিয়। পরে আবার চেষ্টা করুন।');
    return;
  }

  const welcome = s['telegram_shop_bot_welcome'] || '🛍️ *Shahed Store* এ স্বাগতম!\n\nআমাদের টেলিগ্রাম বট দিয়ে সরাসরি শপিং করুন:';
  const text = `${welcome}\n\n` +
    `📦 /shop — প্রোডাক্ট দেখুন\n` +
    `🔍 /search <নাম> — প্রোডাক্ট খুঁজুন\n` +
    `🛒 /cart — কার্ট দেখুন\n` +
    `📋 /track <অর্ডার নম্বর> — অর্ডার ট্র্যাক\n` +
    `❓ /help — সাহায্য`;

  await sendMsg(bot, chatId, text, inlineKb([
    [{ text: '📦 প্রোডাক্ট দেখুন', callback_data: 'shop' }],
    [{ text: '🛒 কার্ট', callback_data: 'cart' }, { text: '🌐 ওয়েবসাইট', callback_data: 'website' }],
  ]));
}

async function handleShop(bot: string, chatId: number, supabase: any, messageId?: number) {
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('sort_order');

  if (!categories?.length) {
    const text = '😔 কোনো ক্যাটাগরি পাওয়া যায়নি।';
    return messageId ? editMsg(bot, chatId, messageId, text) : sendMsg(bot, chatId, text);
  }

  const buttons = categories.map((c: any) => [{ text: `📁 ${c.name}`, callback_data: `cat:${c.id}` }]);
  buttons.push([{ text: '🏠 মেনু', callback_data: 'start' }]);

  const text = '📦 ক্যাটাগরি বেছে নিন:';
  return messageId ? editMsg(bot, chatId, messageId, text, inlineKb(buttons)) : sendMsg(bot, chatId, text, inlineKb(buttons));
}

async function handleCategory(bot: string, chatId: number, categoryId: string, supabase: any, messageId?: number, page = 0) {
  const PAGE_SIZE = 8;
  
  // Get products via junction table
  const { data: productCats } = await supabase
    .from('product_categories')
    .select('product_id')
    .eq('category_id', categoryId);

  const productIds = productCats?.map((pc: any) => pc.product_id) || [];

  // Also get products with direct category_id
  const { data: directProducts } = await supabase
    .from('products')
    .select('id')
    .eq('category_id', categoryId)
    .eq('status', 'active');

  const allIds = [...new Set([...productIds, ...(directProducts?.map((p: any) => p.id) || [])])];

  if (!allIds.length) {
    const text = '😔 এই ক্যাটাগরিতে কোনো প্রোডাক্ট নেই।';
    const kb = inlineKb([[{ text: '◀️ ক্যাটাগরি', callback_data: 'shop' }]]);
    return messageId ? editMsg(bot, chatId, messageId, text, kb) : sendMsg(bot, chatId, text, kb);
  }

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, price, original_price, image_url, badge')
    .in('id', allIds)
    .eq('status', 'active')
    .order('sort_order')
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  const { data: category } = await supabase
    .from('categories')
    .select('name')
    .eq('id', categoryId)
    .single();

  let text = `📁 ${category?.name || 'প্রোডাক্ট'}\n\n`;
  const buttons: { text: string; callback_data: string }[][] = [];

  for (const p of (products || [])) {
    const priceStr = p.original_price && p.original_price > p.price
      ? `৳${p.price} (আগে ৳${p.original_price})`
      : `৳${p.price}`;
    text += `${p.badge ? `[${p.badge}] ` : ''}${p.name}\n💰 ${priceStr}\n\n`;
    buttons.push([
      { text: `📄 ${p.name}`, callback_data: `prod:${p.slug}` },
    ]);
  }

  // Pagination
  const navRow: { text: string; callback_data: string }[] = [];
  if (page > 0) navRow.push({ text: '◀️ আগের', callback_data: `cat:${categoryId}:${page - 1}` });
  if ((products?.length || 0) >= PAGE_SIZE) navRow.push({ text: 'পরের ▶️', callback_data: `cat:${categoryId}:${page + 1}` });
  if (navRow.length) buttons.push(navRow);
  buttons.push([{ text: '◀️ ক্যাটাগরি', callback_data: 'shop' }]);

  const kb = inlineKb(buttons);
  return messageId ? editMsg(bot, chatId, messageId, text, kb) : sendMsg(bot, chatId, text, kb);
}

async function handleProductDetail(bot: string, chatId: number, slug: string, supabase: any, messageId?: number) {
  const { data: product } = await supabase
    .from('products')
    .select('id, name, slug, price, original_price, description, short_description, badge, delivery_type, delivery_time, image_url')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (!product) {
    const text = '❌ প্রোডাক্ট পাওয়া যায়নি।';
    return messageId ? editMsg(bot, chatId, messageId, text) : sendMsg(bot, chatId, text);
  }

  let text = `🏷️ ${product.name}\n\n`;
  if (product.badge) text += `🎖️ ${product.badge}\n`;

  if (product.original_price && product.original_price > product.price) {
    const discount = Math.round(((product.original_price - product.price) / product.original_price) * 100);
    text += `💰 মূল্য: ৳${product.price} (${discount}% ছাড়)\n`;
    text += `~~৳${product.original_price}~~\n`;
  } else {
    text += `💰 মূল্য: ৳${product.price}\n`;
  }

  if (product.delivery_type === 'instant') text += `⚡ ডেলিভারি: তাৎক্ষণিক\n`;
  else if (product.delivery_time) text += `🚀 ডেলিভারি: ${product.delivery_time}\n`;

  if (product.short_description) {
    // Strip HTML tags
    const clean = product.short_description.replace(/<[^>]*>/g, '').substring(0, 300);
    text += `\n📝 ${clean}\n`;
  }

  text += `\n🔗 ${getSiteUrl()}/product/${product.slug}`;

  const buttons = [
    [{ text: `🛒 কার্টে যোগ করুন`, callback_data: `add:${product.slug}` }],
    [{ text: `⚡ এখনই কিনুন`, callback_data: `buy:${product.slug}` }],
    [{ text: '◀️ পিছনে', callback_data: 'shop' }],
  ];

  return messageId
    ? editMsg(bot, chatId, messageId, text, inlineKb(buttons))
    : sendMsg(bot, chatId, text, inlineKb(buttons));
}

async function handleAddToCart(bot: string, chatId: number, slug: string, supabase: any) {
  const { data: product } = await supabase
    .from('products')
    .select('id, name, slug, price')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (!product) return 'প্রোডাক্ট পাওয়া যায়নি';

  // Check if already in cart
  const { data: existing } = await supabase
    .from('telegram_cart')
    .select('id, quantity')
    .eq('chat_id', String(chatId))
    .eq('product_slug', slug)
    .single();

  if (existing) {
    await supabase
      .from('telegram_cart')
      .update({ quantity: existing.quantity + 1 })
      .eq('id', existing.id);
  } else {
    await supabase.from('telegram_cart').insert({
      chat_id: String(chatId),
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      price: product.price,
      quantity: 1,
    });
  }

  await sendMsg(bot, chatId, `✅ "${product.name}" কার্টে যোগ হয়েছে!`, inlineKb([
    [{ text: '🛒 কার্ট দেখুন', callback_data: 'cart' }],
    [{ text: '📦 আরো শপিং', callback_data: 'shop' }],
  ]));

  return 'added';
}

async function handleBuyNow(bot: string, chatId: number, slug: string, supabase: any) {
  // Clear cart, add this item, start checkout
  await supabase.from('telegram_cart').delete().eq('chat_id', String(chatId));

  const { data: product } = await supabase
    .from('products')
    .select('id, name, slug, price')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (!product) return;

  await supabase.from('telegram_cart').insert({
    chat_id: String(chatId),
    product_id: product.id,
    product_name: product.name,
    product_slug: product.slug,
    price: product.price,
    quantity: 1,
  });

  // Ask checkout method
  await sendMsg(bot, chatId,
    `⚡ "${product.name}" — ৳${product.price}\n\nচেকআউট পদ্ধতি বেছে নিন:`,
    inlineKb([
      [{ text: '💬 টেলিগ্রামে অর্ডার', callback_data: 'co_tg' }],
      [{ text: '🌐 ওয়েবসাইটে চেকআউট', callback_data: 'co_web' }],
    ])
  );
}

async function handleCart(bot: string, chatId: number, supabase: any, messageId?: number) {
  const { data: items } = await supabase
    .from('telegram_cart')
    .select('*')
    .eq('chat_id', String(chatId))
    .order('created_at');

  if (!items?.length) {
    const text = '🛒 আপনার কার্ট খালি!\n\n📦 /shop — প্রোডাক্ট দেখুন';
    const kb = inlineKb([[{ text: '📦 শপিং শুরু', callback_data: 'shop' }]]);
    return messageId ? editMsg(bot, chatId, messageId, text, kb) : sendMsg(bot, chatId, text, kb);
  }

  let text = '🛒 আপনার কার্ট:\n\n';
  let total = 0;
  const buttons: { text: string; callback_data: string }[][] = [];

  for (const item of items) {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    text += `📦 ${item.product_name}\n   ${item.quantity}x ৳${item.price} = ৳${itemTotal}\n\n`;
    buttons.push([
      { text: `➖`, callback_data: `qty:${item.product_slug}:-` },
      { text: `${item.quantity}`, callback_data: `noop` },
      { text: `➕`, callback_data: `qty:${item.product_slug}:+` },
      { text: `🗑️`, callback_data: `rm:${item.product_slug}` },
    ]);
  }

  text += `━━━━━━━━━━━━\n💵 মোট: ৳${total.toLocaleString()}`;

  buttons.push([
    { text: '💬 টেলিগ্রামে অর্ডার', callback_data: 'co_tg' },
  ]);
  buttons.push([
    { text: '🌐 ওয়েবসাইটে চেকআউট', callback_data: 'co_web' },
  ]);
  buttons.push([
    { text: '🗑️ কার্ট খালি', callback_data: 'clear_cart' },
    { text: '📦 আরো শপিং', callback_data: 'shop' },
  ]);

  const kb = inlineKb(buttons);
  return messageId ? editMsg(bot, chatId, messageId, text, kb) : sendMsg(bot, chatId, text, kb);
}

async function handleQty(bot: string, chatId: number, slug: string, action: string, supabase: any) {
  const { data: item } = await supabase
    .from('telegram_cart')
    .select('id, quantity')
    .eq('chat_id', String(chatId))
    .eq('product_slug', slug)
    .single();

  if (!item) return;

  if (action === '+') {
    await supabase.from('telegram_cart').update({ quantity: item.quantity + 1 }).eq('id', item.id);
  } else {
    if (item.quantity <= 1) {
      await supabase.from('telegram_cart').delete().eq('id', item.id);
    } else {
      await supabase.from('telegram_cart').update({ quantity: item.quantity - 1 }).eq('id', item.id);
    }
  }
}

async function handleSearch(bot: string, chatId: number, query: string, supabase: any) {
  if (!query.trim()) {
    return sendMsg(bot, chatId, '🔍 সার্চ করতে লিখুন:\n/search <প্রোডাক্টের নাম>');
  }

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, price, original_price, badge')
    .eq('status', 'active')
    .or(`name.ilike.%${query}%,short_description.ilike.%${query}%,tags.cs.{${query}}`)
    .limit(10);

  if (!products?.length) {
    return sendMsg(bot, chatId, `😔 "${query}" — কোনো প্রোডাক্ট পাওয়া যায়নি।\n\n🔍 অন্য কিছু দিয়ে খুঁজুন অথবা /shop দিন।`);
  }

  let text = `🔍 "${query}" — ${products.length}টি প্রোডাক্ট পাওয়া গেছে:\n\n`;
  const buttons: { text: string; callback_data: string }[][] = [];

  for (const p of products) {
    text += `${p.badge ? `[${p.badge}] ` : ''}${p.name} — ৳${p.price}\n`;
    buttons.push([{ text: `📄 ${p.name}`, callback_data: `prod:${p.slug}` }]);
  }

  buttons.push([{ text: '🏠 মেনু', callback_data: 'start' }]);
  return sendMsg(bot, chatId, text, inlineKb(buttons));
}

async function handleTrack(bot: string, chatId: number, orderNum: string, supabase: any) {
  if (!orderNum.trim()) {
    return sendMsg(bot, chatId, '📋 অর্ডার ট্র্যাক করতে লিখুন:\n/track <অর্ডার নম্বর>\n\nউদাহরণ: /track ORD-12345');
  }

  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, status, total, customer_name, payment_method, payment_status, created_at, order_items(product_name, quantity, price, total)')
    .eq('order_number', orderNum.toUpperCase())
    .single();

  if (!order) {
    return sendMsg(bot, chatId, `❌ অর্ডার #${orderNum} পাওয়া যায়নি।\n\nসঠিক অর্ডার নম্বর দিন।`);
  }

  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const emoji = STATUS_EMOJI[order.status] || '📦';

  let text = `${emoji} অর্ডার #${order.order_number}\n\n`;
  text += `👤 গ্রাহক: ${order.customer_name}\n`;
  text += `📋 স্ট্যাটাস: ${statusLabel}\n`;
  text += `💳 পেমেন্ট: ${(order.payment_method || 'N/A').toUpperCase()} (${order.payment_status || 'pending'})\n`;
  text += `⏰ তারিখ: ${new Date(order.created_at).toLocaleString('bn-BD')}\n\n`;

  text += `📦 পণ্যসমূহ:\n`;
  for (const item of (order.order_items || [])) {
    text += `  • ${item.product_name} ×${item.quantity} — ৳${Number(item.total).toLocaleString()}\n`;
  }
  text += `\n💵 মোট: ৳${Number(order.total).toLocaleString()}`;

  return sendMsg(bot, chatId, text, inlineKb([
    [{ text: '🏠 মেনু', callback_data: 'start' }],
  ]));
}

// ─── CHECKOUT FLOW (in Telegram) ──────────────────────────────────────────
async function startTgCheckout(bot: string, chatId: number, supabase: any) {
  const { data: items } = await supabase
    .from('telegram_cart')
    .select('*')
    .eq('chat_id', String(chatId));

  if (!items?.length) {
    return sendMsg(bot, chatId, '🛒 কার্ট খালি! আগে প্রোডাক্ট যোগ করুন।');
  }

  // Start checkout state
  await supabase.from('telegram_checkout_state').upsert({
    chat_id: String(chatId),
    step: 'name',
    collected_data: {},
    updated_at: new Date().toISOString(),
  }, { onConflict: 'chat_id' });

  await sendMsg(bot, chatId, '📝 অর্ডার দিতে আপনার তথ্য দিন:\n\n👤 আপনার সম্পূর্ণ নাম লিখুন:');
}

async function handleCheckoutStep(bot: string, chatId: number, text: string, supabase: any) {
  const { data: state } = await supabase
    .from('telegram_checkout_state')
    .select('*')
    .eq('chat_id', String(chatId))
    .single();

  if (!state) return false; // Not in checkout flow

  const data = state.collected_data || {};

  switch (state.step) {
    case 'name':
      data.name = text.trim();
      await supabase.from('telegram_checkout_state')
        .update({ step: 'phone', collected_data: data, updated_at: new Date().toISOString() })
        .eq('chat_id', String(chatId));
      await sendMsg(bot, chatId, '📱 আপনার ফোন নম্বর লিখুন:');
      return true;

    case 'phone':
      data.phone = text.trim();
      await supabase.from('telegram_checkout_state')
        .update({ step: 'email', collected_data: data, updated_at: new Date().toISOString() })
        .eq('chat_id', String(chatId));
      await sendMsg(bot, chatId, '📧 আপনার ইমেইল লিখুন:');
      return true;

    case 'email':
      data.email = text.trim();
      await supabase.from('telegram_checkout_state')
        .update({ step: 'payment', collected_data: data, updated_at: new Date().toISOString() })
        .eq('chat_id', String(chatId));
      await sendMsg(bot, chatId, '💳 পেমেন্ট মেথড বেছে নিন:', inlineKb([
        [{ text: '💜 বিকাশ', callback_data: 'pay:bkash' }, { text: '🟠 নগদ', callback_data: 'pay:nagad' }],
        [{ text: '🟣 রকেট', callback_data: 'pay:rocket' }, { text: '🔵 উপায়', callback_data: 'pay:upay' }],
        [{ text: '🏦 ব্যাংক ট্রান্সফার', callback_data: 'pay:bank' }],
        [{ text: '❌ বাতিল', callback_data: 'cancel_co' }],
      ]));
      return true;

    case 'trxid':
      data.trxId = text.trim();
      // Confirm order
      await confirmOrder(bot, chatId, data, supabase);
      return true;
  }

  return false;
}

async function handlePaymentSelect(bot: string, chatId: number, method: string, supabase: any) {
  const { data: state } = await supabase
    .from('telegram_checkout_state')
    .select('collected_data')
    .eq('chat_id', String(chatId))
    .single();

  if (!state) return;

  const data = state.collected_data || {};
  data.paymentMethod = method;

  // Get payment config from site_settings (stored as JSON array in payment_methods_config)
  const { data: pmcRow } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'payment_methods_config')
    .single();

  let paymentMethods: any[] = [];
  try { paymentMethods = JSON.parse(pmcRow?.value || '[]'); } catch {}

  const pm = paymentMethods.find((m: any) => m.id === method);

  // Get cart total
  const { data: items } = await supabase
    .from('telegram_cart')
    .select('price, quantity')
    .eq('chat_id', String(chatId));

  const total = items?.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0) || 0;

  let payInfo = '';
  if (method === 'bank') {
    const bankCfg = paymentMethods.find((m: any) => m.id === 'bank' || m.id === 'bank_transfer');
    payInfo = `🏦 ব্যাংক: ${bankCfg?.bankName || 'N/A'}\n` +
      `👤 নাম: ${bankCfg?.accountName || 'N/A'}\n` +
      `🔢 নম্বর: ${bankCfg?.accountNumber || 'N/A'}\n` +
      `📍 ব্রাঞ্চ: ${bankCfg?.branch || 'N/A'}`;
  } else {
    const number = pm?.number || 'N/A';
    const label = pm?.label || (method === 'bkash' ? 'বিকাশ' : method === 'nagad' ? 'নগদ' : method === 'rocket' ? 'রকেট' : 'উপায়');
    const type = pm?.type ? ` (${pm.type})` : '';
    payInfo = `💳 ${label} নম্বর: ${number}${type}`;
  }

  await supabase.from('telegram_checkout_state')
    .update({ step: 'trxid', collected_data: data, updated_at: new Date().toISOString() })
    .eq('chat_id', String(chatId));

  await sendMsg(bot, chatId,
    `💵 মোট: ৳${total.toLocaleString()}\n\n${payInfo}\n\n` +
    `✅ পেমেন্ট করে Transaction ID / TrxID লিখুন:`
  );
}

async function confirmOrder(bot: string, chatId: number, data: any, supabase: any) {
  const { data: items } = await supabase
    .from('telegram_cart')
    .select('*')
    .eq('chat_id', String(chatId));

  if (!items?.length) {
    await sendMsg(bot, chatId, '❌ কার্ট খালি হয়ে গেছে।');
    return;
  }

  const subtotal = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);

  // Generate order number
  const orderNumber = 'ORD-' + Date.now().toString().slice(-8);

  // Create order
  const { data: order, error } = await supabase.from('orders').insert({
    order_number: orderNumber,
    customer_name: data.name || 'Telegram User',
    customer_email: data.email || 'telegram@shahedstore.com',
    customer_phone: data.phone || '',
    payment_method: data.paymentMethod || 'bkash',
    transaction_id: data.trxId || '',
    subtotal,
    total: subtotal,
    status: 'pending',
    payment_status: 'pending',
    notes: `টেলিগ্রাম থেকে অর্ডার (Chat: ${chatId})`,
  }).select().single();

  if (error || !order) {
    console.error('Order creation failed:', error);
    await sendMsg(bot, chatId, '❌ অর্ডার তৈরি ব্যর্থ হয়েছে। পরে আবার চেষ্টা করুন।');
    return;
  }

  // Create order items
  const orderItems = items.map((i: any) => ({
    order_id: order.id,
    product_id: i.product_id,
    product_name: i.product_name,
    price: i.price,
    quantity: i.quantity,
    total: i.price * i.quantity,
  }));

  await supabase.from('order_items').insert(orderItems);

  // Clear cart and checkout state
  await supabase.from('telegram_cart').delete().eq('chat_id', String(chatId));
  await supabase.from('telegram_checkout_state').delete().eq('chat_id', String(chatId));

  let text = `✅ অর্ডার সফল!\n\n`;
  text += `🔢 অর্ডার: #${orderNumber}\n`;
  text += `👤 নাম: ${data.name}\n`;
  text += `📱 ফোন: ${data.phone}\n`;
  text += `💳 পেমেন্ট: ${(data.paymentMethod || '').toUpperCase()}\n`;
  if (data.trxId) text += `🔖 TrxID: ${data.trxId}\n`;
  text += `\n📦 পণ্য:\n`;
  for (const i of items) {
    text += `  • ${i.product_name} ×${i.quantity} — ৳${(i.price * i.quantity).toLocaleString()}\n`;
  }
  text += `\n💵 মোট: ৳${subtotal.toLocaleString()}\n`;
  text += `\n⏰ ${new Date().toLocaleString('bn-BD')}\n`;
  text += `\n📋 অর্ডার ট্র্যাক: /track ${orderNumber}`;

  await sendMsg(bot, chatId, text, inlineKb([
    [{ text: '📋 অর্ডার ট্র্যাক', callback_data: `trk:${orderNumber}` }],
    [{ text: '📦 আরো শপিং', callback_data: 'shop' }],
  ]));
}

async function handleWebCheckout(bot: string, chatId: number, supabase: any) {
  const { data: items } = await supabase
    .from('telegram_cart')
    .select('*')
    .eq('chat_id', String(chatId));

  if (!items?.length) {
    return sendMsg(bot, chatId, '🛒 কার্ট খালি!');
  }

  // Create checkout token
  const token = crypto.randomUUID();
  const cartData = items.map((i: any) => ({
    product_id: i.product_id,
    product_name: i.product_name,
    product_slug: i.product_slug,
    price: i.price,
    quantity: i.quantity,
  }));

  await supabase.from('telegram_checkout_tokens').insert({
    token,
    chat_id: String(chatId),
    cart_data: cartData,
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  });

  const url = `${getSiteUrl()}/checkout?tg_token=${token}`;
  const total = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);

  await sendMsg(bot, chatId,
    `🌐 ওয়েবসাইটে চেকআউট করুন:\n\n💵 মোট: ৳${total.toLocaleString()}\n\n🔗 ${url}\n\n⏰ এই লিংক ৩০ মিনিট কাজ করবে।`,
    inlineKb([[{ text: '🌐 চেকআউট পেজ', callback_data: 'noop' }]])
  );
}

// ─── ORDER STATUS REPLY HANDLER ───────────────────────────────────────────
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
// MAIN POLLING LOOP
// ═══════════════════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const MAX_RUNTIME_MS = 55_000;
  const MIN_REMAINING_MS = 5_000;
  const startTime = Date.now();

  try {
    const BOT_TOKEN = Deno.env.get('TELEGRAM_SHOP_BOT_TOKEN');
    if (!BOT_TOKEN) {
      return new Response(JSON.stringify({ error: 'TELEGRAM_SHOP_BOT_TOKEN not set' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: state, error: stateErr } = await supabase
      .from('telegram_bot_state')
      .select('update_offset')
      .eq('id', 2)
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
          allowed_updates: ['message', 'callback_query'],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) { console.error('getUpdates failed:', data); break; }

      const updates = data.result ?? [];
      if (updates.length === 0) continue;

      for (const update of updates) {
        try {
          // ─── CALLBACK QUERY (Inline button click) ─────────────────────
          if (update.callback_query) {
            const cb = update.callback_query;
            const chatId = cb.message.chat.id;
            const msgId = cb.message.message_id;
            const cbData = cb.data;

            if (cbData === 'start') {
              await answerCb(BOT_TOKEN, cb.id);
              await handleStart(BOT_TOKEN, chatId, supabase);
            } else if (cbData === 'shop') {
              await answerCb(BOT_TOKEN, cb.id);
              await handleShop(BOT_TOKEN, chatId, supabase, msgId);
            } else if (cbData.startsWith('cat:')) {
              await answerCb(BOT_TOKEN, cb.id);
              const parts = cbData.split(':');
              const catId = parts[1];
              const page = parts[2] ? parseInt(parts[2]) : 0;
              await handleCategory(BOT_TOKEN, chatId, catId, supabase, msgId, page);
            } else if (cbData.startsWith('prod:')) {
              await answerCb(BOT_TOKEN, cb.id);
              await handleProductDetail(BOT_TOKEN, chatId, cbData.substring(5), supabase, msgId);
            } else if (cbData.startsWith('add:')) {
              await answerCb(BOT_TOKEN, cb.id, '✅ কার্টে যোগ হয়েছে!');
              await handleAddToCart(BOT_TOKEN, chatId, cbData.substring(4), supabase);
            } else if (cbData.startsWith('buy:')) {
              await answerCb(BOT_TOKEN, cb.id);
              await handleBuyNow(BOT_TOKEN, chatId, cbData.substring(4), supabase);
            } else if (cbData === 'cart') {
              await answerCb(BOT_TOKEN, cb.id);
              await handleCart(BOT_TOKEN, chatId, supabase, msgId);
            } else if (cbData.startsWith('qty:')) {
              await answerCb(BOT_TOKEN, cb.id);
              const parts = cbData.split(':');
              await handleQty(BOT_TOKEN, chatId, parts[1], parts[2], supabase);
              await handleCart(BOT_TOKEN, chatId, supabase, msgId);
            } else if (cbData.startsWith('rm:')) {
              await answerCb(BOT_TOKEN, cb.id, '🗑️ সরানো হয়েছে');
              await supabase.from('telegram_cart').delete()
                .eq('chat_id', String(chatId))
                .eq('product_slug', cbData.substring(3));
              await handleCart(BOT_TOKEN, chatId, supabase, msgId);
            } else if (cbData === 'clear_cart') {
              await answerCb(BOT_TOKEN, cb.id, '🗑️ কার্ট খালি হয়েছে');
              await supabase.from('telegram_cart').delete().eq('chat_id', String(chatId));
              await handleCart(BOT_TOKEN, chatId, supabase, msgId);
            } else if (cbData === 'co_tg') {
              await answerCb(BOT_TOKEN, cb.id);
              await startTgCheckout(BOT_TOKEN, chatId, supabase);
            } else if (cbData === 'co_web') {
              await answerCb(BOT_TOKEN, cb.id);
              await handleWebCheckout(BOT_TOKEN, chatId, supabase);
            } else if (cbData.startsWith('pay:')) {
              await answerCb(BOT_TOKEN, cb.id);
              await handlePaymentSelect(BOT_TOKEN, chatId, cbData.substring(4), supabase);
            } else if (cbData === 'cancel_co') {
              await answerCb(BOT_TOKEN, cb.id);
              await supabase.from('telegram_checkout_state').delete().eq('chat_id', String(chatId));
              await sendMsg(BOT_TOKEN, chatId, '❌ অর্ডার বাতিল হয়েছে।', inlineKb([
                [{ text: '🛒 কার্ট', callback_data: 'cart' }],
                [{ text: '🏠 মেনু', callback_data: 'start' }],
              ]));
            } else if (cbData.startsWith('trk:')) {
              await answerCb(BOT_TOKEN, cb.id);
              await handleTrack(BOT_TOKEN, chatId, cbData.substring(4), supabase);
            } else if (cbData === 'website') {
              await answerCb(BOT_TOKEN, cb.id);
              await sendMsg(BOT_TOKEN, chatId, `🌐 ওয়েবসাইটে যান:\n${getSiteUrl()}`);
            } else if (cbData === 'noop') {
              await answerCb(BOT_TOKEN, cb.id);
            }

            totalProcessed++;
            continue;
          }

          // ─── TEXT MESSAGE ──────────────────────────────────────────────
          const msg = update.message;
          if (!msg || !msg.text) continue;

          const chatId = msg.chat.id;
          const text = msg.text.trim();

          // Check if in checkout flow first
          const handled = await handleCheckoutStep(BOT_TOKEN, chatId, text, supabase);
          if (handled) { totalProcessed++; continue; }

          // Skip order replies — handled by admin bot

          // Commands
          if (text === '/start' || text.startsWith('/start ')) {
            await handleStart(BOT_TOKEN, chatId, supabase);
          } else if (text === '/shop' || text === '/products' || text === '/menu') {
            await handleShop(BOT_TOKEN, chatId, supabase);
          } else if (text.startsWith('/search')) {
            const query = text.replace(/^\/search\s*/i, '');
            await handleSearch(BOT_TOKEN, chatId, query, supabase);
          } else if (text === '/cart') {
            await handleCart(BOT_TOKEN, chatId, supabase);
          } else if (text.startsWith('/track')) {
            const orderNum = text.replace(/^\/track\s*/i, '');
            await handleTrack(BOT_TOKEN, chatId, orderNum, supabase);
          } else if (text === '/help') {
            await sendMsg(BOT_TOKEN, chatId,
              `❓ সাহায্য:\n\n` +
              `/start — মেইন মেনু\n` +
              `/shop — প্রোডাক্ট দেখুন\n` +
              `/search <নাম> — প্রোডাক্ট খুঁজুন\n` +
              `/cart — কার্ট দেখুন\n` +
              `/track <নম্বর> — অর্ডার ট্র্যাক\n\n` +
              `🌐 ওয়েবসাইট: ${getSiteUrl()}\n\n` +
              `📞 সমস্যা? /start দিয়ে শুরু করুন।`
            );
          } else {
            // Unknown — suggest search
            await sendMsg(BOT_TOKEN, chatId,
              `🤔 কমান্ড বুঝতে পারিনি।\n\n"${text}" দিয়ে সার্চ করতে চান?\n\n/search ${text}`,
              inlineKb([
                [{ text: `🔍 "${text}" সার্চ`, callback_data: `noop` }],
                [{ text: '🏠 মেনু', callback_data: 'start' }],
              ])
            );
          }

          totalProcessed++;
        } catch (handlerErr) {
          console.error('Handler error:', handlerErr);
        }
      }

      // Advance offset
      const newOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;
      await supabase
        .from('telegram_bot_state')
        .update({ update_offset: newOffset, updated_at: new Date().toISOString() })
        .eq('id', 2);
      currentOffset = newOffset;
    }

    return new Response(JSON.stringify({ ok: true, processed: totalProcessed, finalOffset: currentOffset }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('telegram-poll error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
