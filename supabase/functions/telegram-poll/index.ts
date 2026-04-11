import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Status Maps ─────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, string> = {
  completed: 'completed', complete: 'completed', done: 'completed',
  delivered: 'delivered', deliver: 'delivered',
  processing: 'processing', process: 'processing',
  cancelled: 'cancelled', cancel: 'cancelled',
  refunded: 'refunded', refund: 'refunded',
  failed: 'failed', fail: 'failed',
  pending: 'pending',
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

const SITE_URL = 'https://shahedstore.lovable.app';

// ─── Telegram Helper ─────────────────────────────────────────────────────
async function tgSend(botToken: string, chatId: string | number, text: string, replyTo?: number) {
  const body: Record<string, any> = { chat_id: chatId, text, disable_web_page_preview: true };
  if (replyTo) body.reply_to_message_id = replyTo;
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ─── Command Handlers ────────────────────────────────────────────────────
async function handleStart(botToken: string, chatId: number) {
  const msg = `🛍️ Shahed Store-এ স্বাগতম!\n\n` +
    `আমাদের সকল প্রোডাক্ট এখানে দেখুন ও কিনুন।\n\n` +
    `📋 কমান্ড তালিকা:\n` +
    `/products — সকল ক্যাটাগরি দেখুন\n` +
    `/cat_<name> — নির্দিষ্ট ক্যাটাগরির পণ্য\n` +
    `/p_<slug> — পণ্যের বিস্তারিত\n` +
    `/buy_<slug> — কার্টে যোগ করুন\n` +
    `/cart — কার্ট দেখুন\n` +
    `/remove_<নম্বর> — কার্ট থেকে মুছুন\n` +
    `/clear — কার্ট খালি করুন\n` +
    `/checkout — অর্ডার দিন (ওয়েবসাইটে)\n` +
    `/orders — সাম্প্রতিক অর্ডার\n` +
    `/help — সাহায্য\n\n` +
    `🌐 ওয়েবসাইট: ${SITE_URL}`;
  await tgSend(botToken, chatId, msg);
}

async function handleProducts(botToken: string, chatId: number, supabase: any) {
  const { data: categories } = await supabase
    .from('categories')
    .select('name, slug')
    .eq('is_active', true)
    .order('sort_order');

  if (!categories?.length) {
    await tgSend(botToken, chatId, '❌ কোনো ক্যাটাগরি পাওয়া যায়নি।');
    return;
  }

  let msg = '📂 প্রোডাক্ট ক্যাটাগরি:\n\n';
  categories.forEach((c: any, i: number) => {
    msg += `${i + 1}. ${c.name}\n   👉 /cat_${c.slug}\n\n`;
  });
  msg += `\n🔍 সরাসরি সার্চ: /search_<নাম>`;
  await tgSend(botToken, chatId, msg);
}

async function handleCategory(botToken: string, chatId: number, slug: string, supabase: any) {
  // Find category
  const { data: cat } = await supabase
    .from('categories')
    .select('id, name')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!cat) {
    await tgSend(botToken, chatId, `❌ "${slug}" ক্যাটাগরি পাওয়া যায়নি।\n/products দিয়ে তালিকা দেখুন।`);
    return;
  }

  // Get products via junction table
  const { data: pcRows } = await supabase
    .from('product_categories')
    .select('product_id')
    .eq('category_id', cat.id);

  const productIds = pcRows?.map((r: any) => r.product_id) || [];

  if (!productIds.length) {
    await tgSend(botToken, chatId, `📁 ${cat.name} ক্যাটাগরিতে কোনো পণ্য নেই।`);
    return;
  }

  const { data: products } = await supabase
    .from('products')
    .select('name, slug, price, original_price, short_description')
    .in('id', productIds)
    .eq('status', 'active')
    .order('sort_order')
    .limit(20);

  if (!products?.length) {
    await tgSend(botToken, chatId, `📁 ${cat.name} ক্যাটাগরিতে কোনো সক্রিয় পণ্য নেই।`);
    return;
  }

  let msg = `📁 ${cat.name} (${products.length}টি পণ্য):\n\n`;
  products.forEach((p: any, i: number) => {
    const priceStr = p.original_price && p.original_price > p.price
      ? `৳${p.price} (আগে ৳${p.original_price})`
      : `৳${p.price}`;
    msg += `${i + 1}. ${p.name}\n   💰 ${priceStr}\n   👉 /p_${p.slug}  |  🛒 /buy_${p.slug}\n\n`;
  });
  await tgSend(botToken, chatId, msg);
}

async function handleSearch(botToken: string, chatId: number, query: string, supabase: any) {
  if (!query || query.length < 2) {
    await tgSend(botToken, chatId, '🔍 কমপক্ষে ২ অক্ষর দিয়ে সার্চ করুন।\nউদাহরণ: /search_netflix');
    return;
  }

  const { data: products } = await supabase
    .from('products')
    .select('name, slug, price, original_price')
    .eq('status', 'active')
    .ilike('name', `%${query}%`)
    .limit(10);

  if (!products?.length) {
    await tgSend(botToken, chatId, `🔍 "${query}" দিয়ে কোনো পণ্য পাওয়া যায়নি।`);
    return;
  }

  let msg = `🔍 "${query}" সার্চ ফলাফল:\n\n`;
  products.forEach((p: any, i: number) => {
    msg += `${i + 1}. ${p.name} — ৳${p.price}\n   👉 /p_${p.slug}  |  🛒 /buy_${p.slug}\n\n`;
  });
  await tgSend(botToken, chatId, msg);
}

async function handleProductDetail(botToken: string, chatId: number, slug: string, supabase: any) {
  const { data: product } = await supabase
    .from('products')
    .select('name, slug, price, original_price, short_description, description, delivery_time, delivery_type, what_you_get, discount_percent')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (!product) {
    await tgSend(botToken, chatId, `❌ "${slug}" পণ্য পাওয়া যায়নি।`);
    return;
  }

  let msg = `📦 ${product.name}\n\n`;

  if (product.original_price && product.original_price > product.price) {
    const discount = product.discount_percent || Math.round((1 - product.price / product.original_price) * 100);
    msg += `💰 মূল্য: ৳${product.price} (আগে ৳${product.original_price} — ${discount}% ছাড়)\n`;
  } else {
    msg += `💰 মূল্য: ৳${product.price}\n`;
  }

  if (product.delivery_time) msg += `⏱️ ডেলিভারি: ${product.delivery_time}\n`;
  if (product.delivery_type) msg += `📦 ধরন: ${product.delivery_type === 'instant' ? 'ইনস্ট্যান্ট' : product.delivery_type}\n`;

  if (product.short_description) {
    msg += `\n📝 বিবরণ:\n${product.short_description}\n`;
  }

  if (product.what_you_get?.length) {
    msg += `\n✅ যা পাবেন:\n`;
    product.what_you_get.forEach((item: string) => {
      msg += `  • ${item}\n`;
    });
  }

  msg += `\n🛒 কিনতে: /buy_${product.slug}`;
  msg += `\n🌐 ওয়েবসাইটে দেখুন: ${SITE_URL}/product/${product.slug}`;

  await tgSend(botToken, chatId, msg);
}

async function handleBuy(botToken: string, chatId: number, slug: string, supabase: any) {
  const { data: product } = await supabase
    .from('products')
    .select('id, name, slug, price')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (!product) {
    await tgSend(botToken, chatId, `❌ "${slug}" পণ্য পাওয়া যায়নি।`);
    return;
  }

  // Check if already in cart
  const { data: existing } = await supabase
    .from('telegram_cart')
    .select('id, quantity')
    .eq('chat_id', String(chatId))
    .eq('product_id', product.id)
    .single();

  if (existing) {
    await supabase.from('telegram_cart')
      .update({ quantity: existing.quantity + 1 })
      .eq('id', existing.id);
    await tgSend(botToken, chatId,
      `🛒 ${product.name} কার্টে আপডেট হয়েছে (${existing.quantity + 1}টি)\n\n/cart — কার্ট দেখুন\n/checkout — অর্ডার দিন`);
  } else {
    await supabase.from('telegram_cart').insert({
      chat_id: String(chatId),
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      price: product.price,
      quantity: 1,
    });
    await tgSend(botToken, chatId,
      `✅ ${product.name} — ৳${product.price} কার্টে যোগ হয়েছে!\n\n/cart — কার্ট দেখুন\n/checkout — অর্ডার দিন\n/products — আরো পণ্য দেখুন`);
  }
}

async function handleCart(botToken: string, chatId: number, supabase: any) {
  const { data: items } = await supabase
    .from('telegram_cart')
    .select('*')
    .eq('chat_id', String(chatId))
    .order('created_at');

  if (!items?.length) {
    await tgSend(botToken, chatId, '🛒 আপনার কার্ট খালি।\n\n/products দিয়ে পণ্য দেখুন।');
    return;
  }

  let total = 0;
  let msg = '🛒 আপনার কার্ট:\n\n';
  items.forEach((item: any, i: number) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    msg += `${i + 1}. ${item.product_name}\n`;
    msg += `   ৳${item.price} × ${item.quantity} = ৳${itemTotal}\n`;
    msg += `   ❌ /remove_${i + 1}\n\n`;
  });

  msg += `━━━━━━━━━━━━━\n`;
  msg += `💵 মোট: ৳${total.toLocaleString()}\n\n`;
  msg += `/checkout — অর্ডার দিন\n`;
  msg += `/clear — কার্ট খালি করুন`;

  await tgSend(botToken, chatId, msg);
}

async function handleRemove(botToken: string, chatId: number, index: number, supabase: any) {
  const { data: items } = await supabase
    .from('telegram_cart')
    .select('id, product_name')
    .eq('chat_id', String(chatId))
    .order('created_at');

  if (!items || index < 1 || index > items.length) {
    await tgSend(botToken, chatId, `❌ ভুল নম্বর। /cart দিয়ে কার্ট দেখুন।`);
    return;
  }

  const item = items[index - 1];
  await supabase.from('telegram_cart').delete().eq('id', item.id);
  await tgSend(botToken, chatId, `🗑️ "${item.product_name}" কার্ট থেকে মুছে ফেলা হয়েছে।\n\n/cart — কার্ট দেখুন`);
}

async function handleClear(botToken: string, chatId: number, supabase: any) {
  await supabase.from('telegram_cart').delete().eq('chat_id', String(chatId));
  await tgSend(botToken, chatId, '🗑️ কার্ট খালি করা হয়েছে।\n\n/products দিয়ে পণ্য দেখুন।');
}

async function handleCheckout(botToken: string, chatId: number, supabase: any) {
  const { data: items } = await supabase
    .from('telegram_cart')
    .select('product_id, product_name, product_slug, price, quantity')
    .eq('chat_id', String(chatId))
    .order('created_at');

  if (!items?.length) {
    await tgSend(botToken, chatId, '🛒 কার্ট খালি! আগে পণ্য যোগ করুন।\n/products — পণ্য দেখুন');
    return;
  }

  // Generate unique token
  const token = crypto.randomUUID().replace(/-/g, '').substring(0, 16);

  // Build cart data
  const cartData = items.map((i: any) => ({
    id: i.product_id,
    name: i.product_name,
    slug: i.product_slug,
    price: i.price,
    quantity: i.quantity,
  }));

  const total = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);

  // Save checkout token
  await supabase.from('telegram_checkout_tokens').insert({
    token,
    chat_id: String(chatId),
    cart_data: cartData,
  });

  let msg = `🛒 অর্ডার সামারি:\n\n`;
  items.forEach((i: any, idx: number) => {
    msg += `${idx + 1}. ${i.product_name} × ${i.quantity} — ৳${(i.price * i.quantity).toLocaleString()}\n`;
  });
  msg += `\n💵 মোট: ৳${total.toLocaleString()}\n\n`;
  msg += `🔗 নিচের লিংকে ক্লিক করে পেমেন্ট সম্পন্ন করুন:\n`;
  msg += `${SITE_URL}/checkout?tg_token=${token}\n\n`;
  msg += `⏰ এই লিংক ১ ঘণ্টা পর্যন্ত কার্যকর থাকবে।`;

  await tgSend(botToken, chatId, msg);
}

async function handleOrders(botToken: string, chatId: number, supabase: any) {
  // We can't directly link telegram chat to user, so show instruction
  await tgSend(botToken, chatId,
    `📋 অর্ডার ইতিহাস দেখতে ওয়েবসাইটে লগইন করুন:\n\n` +
    `🌐 ${SITE_URL}/dashboard?tab=orders\n\n` +
    `অথবা অর্ডার নম্বর দিয়ে ট্র্যাক করুন:\n/track_<অর্ডার_নম্বর>`
  );
}

async function handleTrack(botToken: string, chatId: number, orderNum: string, supabase: any) {
  const { data: order } = await supabase
    .from('orders')
    .select('order_number, status, total, customer_name, created_at, payment_method')
    .eq('order_number', orderNum.toUpperCase())
    .single();

  if (!order) {
    await tgSend(botToken, chatId, `❌ অর্ডার #${orderNum} পাওয়া যায়নি।`);
    return;
  }

  const emoji = STATUS_EMOJI[order.status] || '📦';
  const label = STATUS_LABELS[order.status] || order.status;

  let msg = `${emoji} অর্ডার #${order.order_number}\n\n`;
  msg += `👤 গ্রাহক: ${order.customer_name}\n`;
  msg += `💵 মোট: ৳${Number(order.total).toLocaleString()}\n`;
  msg += `📋 স্ট্যাটাস: ${label}\n`;
  msg += `💳 পেমেন্ট: ${(order.payment_method || 'N/A').toUpperCase()}\n`;
  msg += `📅 তারিখ: ${new Date(order.created_at).toLocaleString('bn-BD')}`;

  await tgSend(botToken, chatId, msg);
}

async function handleHelp(botToken: string, chatId: number) {
  const msg = `ℹ️ সাহায্য — Shahed Store Bot\n\n` +
    `🛍️ শপিং:\n` +
    `/products — সকল ক্যাটাগরি\n` +
    `/cat_<slug> — ক্যাটাগরির পণ্য\n` +
    `/search_<নাম> — পণ্য খুঁজুন\n` +
    `/p_<slug> — পণ্যের বিস্তারিত\n` +
    `/buy_<slug> — কার্টে যোগ\n\n` +
    `🛒 কার্ট:\n` +
    `/cart — কার্ট দেখুন\n` +
    `/remove_<নম্বর> — আইটেম মুছুন\n` +
    `/clear — কার্ট খালি করুন\n\n` +
    `💳 অর্ডার:\n` +
    `/checkout — অর্ডার দিন\n` +
    `/orders — অর্ডার ইতিহাস\n` +
    `/track_<নম্বর> — অর্ডার ট্র্যাক\n\n` +
    `🌐 ওয়েবসাইট: ${SITE_URL}\n` +
    `📞 সাপোর্ট: ${SITE_URL}/contact`;
  await tgSend(botToken, chatId, msg);
}

// ─── Main Handler ────────────────────────────────────────────────────────
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

    const { data: state } = await supabase
      .from('telegram_bot_state')
      .select('update_offset')
      .eq('id', 1)
      .single();

    let currentOffset = state?.update_offset || 0;
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
        body: JSON.stringify({ offset: currentOffset, timeout, allowed_updates: ['message'] }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) { console.error('getUpdates failed:', data); break; }

      const updates = data.result ?? [];
      if (updates.length === 0) continue;

      for (const update of updates) {
        const msg = update.message;
        if (!msg) continue;
        const chatId = msg.chat.id;
        const text = (msg.text || '').trim();

        try {
          // ── Reply-based order status change ──
          if (msg.reply_to_message) {
            const replyMsgId = msg.reply_to_message.message_id;
            const { data: mapping } = await supabase
              .from('telegram_order_messages')
              .select('order_id, order_number')
              .eq('telegram_message_id', replyMsgId)
              .eq('telegram_chat_id', String(chatId))
              .single();

            if (mapping) {
              const cmdText = text.toLowerCase();
              const newStatus = STATUS_MAP[cmdText];

              if (!newStatus) {
                await tgSend(BOT_TOKEN, chatId,
                  `❓ স্ট্যাটাস বুঝতে পারিনি: "${text}"\n\nসঠিক: completed, delivered, processing, cancelled, refunded, pending`,
                  msg.message_id);
              } else {
                const { data: order } = await supabase.from('orders')
                  .select('status, customer_name, total')
                  .eq('id', mapping.order_id).single();

                if (!order) {
                  await tgSend(BOT_TOKEN, chatId, `❌ অর্ডার পাওয়া যায়নি।`, msg.message_id);
                } else if (order.status === newStatus) {
                  await tgSend(BOT_TOKEN, chatId,
                    `ℹ️ অর্ডার #${mapping.order_number} ইতিমধ্যে "${STATUS_LABELS[newStatus] || newStatus}" স্ট্যাটাসে আছে।`,
                    msg.message_id);
                } else {
                  const { error: upErr } = await supabase.from('orders')
                    .update({ status: newStatus }).eq('id', mapping.order_id);
                  if (upErr) {
                    await tgSend(BOT_TOKEN, chatId, `❌ আপডেট ব্যর্থ: ${upErr.message}`, msg.message_id);
                  } else {
                    const emoji = STATUS_EMOJI[newStatus] || '🔄';
                    await tgSend(BOT_TOKEN, chatId,
                      `${emoji} অর্ডার #${mapping.order_number} → ${STATUS_LABELS[newStatus] || newStatus}\n👤 ${order.customer_name} | 💵 ৳${Number(order.total).toLocaleString()}`,
                      msg.message_id);
                  }
                }
              }
              totalProcessed++;
              continue;
            }
          }

          // ── Command routing ──
          if (text === '/start' || text.startsWith('/start ')) {
            await handleStart(BOT_TOKEN, chatId);
          } else if (text === '/products' || text === '/shop') {
            await handleProducts(BOT_TOKEN, chatId, supabase);
          } else if (text.startsWith('/cat_')) {
            await handleCategory(BOT_TOKEN, chatId, text.slice(5), supabase);
          } else if (text.startsWith('/search_')) {
            await handleSearch(BOT_TOKEN, chatId, text.slice(8), supabase);
          } else if (text.startsWith('/p_')) {
            await handleProductDetail(BOT_TOKEN, chatId, text.slice(3), supabase);
          } else if (text.startsWith('/buy_')) {
            await handleBuy(BOT_TOKEN, chatId, text.slice(5), supabase);
          } else if (text === '/cart') {
            await handleCart(BOT_TOKEN, chatId, supabase);
          } else if (text.startsWith('/remove_')) {
            const idx = parseInt(text.slice(8), 10);
            await handleRemove(BOT_TOKEN, chatId, idx, supabase);
          } else if (text === '/clear') {
            await handleClear(BOT_TOKEN, chatId, supabase);
          } else if (text === '/checkout') {
            await handleCheckout(BOT_TOKEN, chatId, supabase);
          } else if (text === '/orders') {
            await handleOrders(BOT_TOKEN, chatId, supabase);
          } else if (text.startsWith('/track_')) {
            await handleTrack(BOT_TOKEN, chatId, text.slice(7), supabase);
          } else if (text === '/help') {
            await handleHelp(BOT_TOKEN, chatId);
          }
          // Ignore unrecognized messages (not a command)

          totalProcessed++;
        } catch (cmdErr) {
          console.error('Command error:', cmdErr);
        }
      }

      // Advance offset
      const newOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;
      await supabase.from('telegram_bot_state')
        .update({ update_offset: newOffset, updated_at: new Date().toISOString() })
        .eq('id', 1);
      currentOffset = newOffset;
    }

    return new Response(JSON.stringify({ ok: true, processed: totalProcessed }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('telegram-poll error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
