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

const STATUS_LABELS_BN: Record<string, string> = {
  pending: 'পেন্ডিং', processing: 'প্রসেসিং', delivered: 'ডেলিভার্ড',
  completed: 'সম্পন্ন', cancelled: 'বাতিল', refunded: 'রিফান্ড', failed: 'ব্যর্থ',
};
const STATUS_LABELS_EN: Record<string, string> = {
  pending: 'Pending', processing: 'Processing', delivered: 'Delivered',
  completed: 'Completed', cancelled: 'Cancelled', refunded: 'Refunded', failed: 'Failed',
};
const STATUS_EMOJI: Record<string, string> = {
  pending: '⏳', processing: '⚙️', delivered: '🚀',
  completed: '✅', cancelled: '❌', refunded: '💸', failed: '⚠️',
};

// ─── i18n DICTIONARY ──────────────────────────────────────────────────────
type Lang = 'bn' | 'en';
const T = {
  bn: {
    welcome_title: '🛍️ *Shahed Store* এ স্বাগতম!',
    welcome_sub: 'বাংলাদেশের #১ ডিজিটাল প্রোডাক্ট স্টোর। আপনার চাহিদা মতো সাবস্ক্রিপশন, লাইসেন্স কী, সফটওয়্যার — সব এক জায়গায়।',
    quick_actions: '⚡ দ্রুত অ্যাকশন বেছে নিন:',
    btn_shop: '🛍️ শপিং শুরু', btn_deals: '🔥 ডিল ও অফার',
    btn_categories: '📁 ক্যাটাগরি', btn_search: '🔍 সার্চ',
    btn_cart: '🛒 কার্ট', btn_orders: '📋 আমার অর্ডার',
    btn_account: '👤 আমার অ্যাকাউন্ট', btn_help: '❓ সাহায্য',
    btn_website: '🌐 ওয়েবসাইট', btn_menu: '🏠 মূল মেনু',
    btn_back: '◀️ পিছনে', btn_lang: '🌐 ভাষা / Language',
    pick_lang: '🌐 আপনার ভাষা বেছে নিন:\nChoose your language:',
    lang_set_bn: '✅ ভাষা বাংলায় পরিবর্তন করা হয়েছে।',
    lang_set_en: '✅ Language switched to English.',
    pick_category: '📁 ক্যাটাগরি বেছে নিন:',
    no_categories: '😔 কোনো ক্যাটাগরি পাওয়া যায়নি।',
    no_products_cat: '😔 এই ক্যাটাগরিতে কোনো প্রোডাক্ট নেই।',
    product_not_found: '❌ প্রোডাক্ট পাওয়া যায়নি।',
    price: 'মূল্য', discount: 'ছাড়', delivery: 'ডেলিভারি', instant: 'তাৎক্ষণিক',
    btn_add_cart: '🛒 কার্টে যোগ করুন', btn_buy_now: '⚡ এখনই কিনুন',
    added_to_cart: 'কার্টে যোগ হয়েছে',
    btn_view_cart: '🛒 কার্ট দেখুন', btn_more_shop: '📦 আরো শপিং',
    cart_empty: '🛒 আপনার কার্ট খালি!',
    your_cart: '🛒 আপনার কার্ট:',
    total: 'মোট', subtotal: 'সাবটোটাল',
    btn_checkout_tg: '💬 টেলিগ্রামে অর্ডার',
    btn_checkout_web: '🌐 ওয়েবসাইটে চেকআউট',
    btn_clear_cart: '🗑️ কার্ট খালি',
    search_prompt: '🔍 সার্চ করতে লিখুন:\n/search <প্রোডাক্টের নাম>',
    search_no_result: 'কোনো প্রোডাক্ট পাওয়া যায়নি',
    search_results: 'প্রোডাক্ট পাওয়া গেছে',
    track_prompt: '📋 অর্ডার ট্র্যাক করতে লিখুন:\n/track <অর্ডার নম্বর>\n\nউদাহরণ: /track ORD-12345',
    order_not_found: 'অর্ডার পাওয়া যায়নি',
    btn_track_order: '📋 অর্ডার ট্র্যাক',
    deals_title: '🔥 ফ্ল্যাশ সেল ও বিশেষ অফার:',
    no_deals: '😔 এই মুহূর্তে কোনো অফার নেই।',
    new_arrivals: '🆕 নতুন প্রোডাক্ট:',
    no_new: '😔 কোনো নতুন প্রোডাক্ট নেই।',
    my_orders: '📋 আপনার সাম্প্রতিক অর্ডার:',
    no_orders: '😔 এখনো কোনো অর্ডার নেই।\n\n/shop দিয়ে শপিং শুরু করুন!',
    account_title: '👤 আপনার অ্যাকাউন্ট:',
    account_link_prompt: 'অ্যাকাউন্ট তথ্য দেখতে নিচের লিংক ব্যবহার করুন:',
    help_title: '❓ Shahed Store Bot — সাহায্য',
    help_body: 'আপনি নিচের কমান্ডগুলো ব্যবহার করতে পারেন। যেকোনো সময় /menu দিয়ে মূল মেনুতে ফিরতে পারেন।',
    contact_title: '📞 যোগাযোগ',
    contact_body: 'আপনার যেকোনো প্রশ্ন/সমস্যায় আমাদের সাথে যোগাযোগ করুন:',
    btn_contact_web: '🌐 কন্টাক্ট পেজ',
    btn_whatsapp: '💚 হোয়াটসঅ্যাপ',
    btn_support: '🎫 সাপোর্ট টিকেট',
    faq_title: '❓ সচরাচর জিজ্ঞাসা (FAQ)',
    refund_title: '💸 রিফান্ড রিকোয়েস্ট',
    refund_body: 'রিফান্ডের জন্য নিচের লিংকে আবেদন করুন। আমাদের রিফান্ড পলিসি অনুযায়ী ৩-৭ কর্মদিবসের মধ্যে প্রসেস করা হবে।',
    unknown_command: '🤔 কমান্ড বুঝতে পারিনি।',
    suggest_search: 'দিয়ে সার্চ করতে চান?',
    cmd_list: 'কমান্ড তালিকার জন্য /menu চাপুন বা স্ল্যাশ (/) চাপলে সব কমান্ড দেখাবে।',
    bot_disabled: '⏸️ শপিং বট বর্তমানে নিষ্ক্রিয়। পরে আবার চেষ্টা করুন।',
    enter_name: '👤 আপনার সম্পূর্ণ নাম লিখুন:',
    enter_phone: '📱 আপনার ফোন নম্বর লিখুন:',
    enter_email: '📧 আপনার ইমেইল লিখুন:',
    pick_payment: '💳 পেমেন্ট মেথড বেছে নিন:',
    enter_trxid: '✅ পেমেন্ট করে Transaction ID / TrxID লিখুন:',
    order_success: '✅ অর্ডার সফল!',
    order_cancelled: '❌ অর্ডার বাতিল হয়েছে।',
    btn_cancel: '❌ বাতিল',
    web_checkout_msg: '🌐 ওয়েবসাইটে চেকআউট করুন:',
    link_30min: '⏰ এই লিংক ৩০ মিনিট কাজ করবে।',
    you: 'আপনি',
  },
  en: {
    welcome_title: '🛍️ Welcome to *Shahed Store*!',
    welcome_sub: "Bangladesh's #1 digital products store. Subscriptions, license keys, software — all in one place.",
    quick_actions: '⚡ Pick a quick action:',
    btn_shop: '🛍️ Start Shopping', btn_deals: '🔥 Deals & Offers',
    btn_categories: '📁 Categories', btn_search: '🔍 Search',
    btn_cart: '🛒 Cart', btn_orders: '📋 My Orders',
    btn_account: '👤 My Account', btn_help: '❓ Help',
    btn_website: '🌐 Website', btn_menu: '🏠 Main Menu',
    btn_back: '◀️ Back', btn_lang: '🌐 Language / ভাষা',
    pick_lang: '🌐 Choose your language:\nআপনার ভাষা বেছে নিন:',
    lang_set_bn: '✅ ভাষা বাংলায় পরিবর্তন করা হয়েছে।',
    lang_set_en: '✅ Language switched to English.',
    pick_category: '📁 Pick a category:',
    no_categories: '😔 No categories found.',
    no_products_cat: '😔 No products in this category.',
    product_not_found: '❌ Product not found.',
    price: 'Price', discount: 'OFF', delivery: 'Delivery', instant: 'Instant',
    btn_add_cart: '🛒 Add to Cart', btn_buy_now: '⚡ Buy Now',
    added_to_cart: 'Added to cart',
    btn_view_cart: '🛒 View Cart', btn_more_shop: '📦 Continue Shopping',
    cart_empty: '🛒 Your cart is empty!',
    your_cart: '🛒 Your Cart:',
    total: 'Total', subtotal: 'Subtotal',
    btn_checkout_tg: '💬 Checkout in Telegram',
    btn_checkout_web: '🌐 Checkout on Website',
    btn_clear_cart: '🗑️ Clear Cart',
    search_prompt: '🔍 To search, type:\n/search <product name>',
    search_no_result: 'No products found',
    search_results: 'products found',
    track_prompt: '📋 To track an order, type:\n/track <order number>\n\nExample: /track ORD-12345',
    order_not_found: 'Order not found',
    btn_track_order: '📋 Track Order',
    deals_title: '🔥 Flash Sale & Special Offers:',
    no_deals: '😔 No deals right now.',
    new_arrivals: '🆕 New Arrivals:',
    no_new: '😔 No new products.',
    my_orders: '📋 Your recent orders:',
    no_orders: '😔 No orders yet.\n\nUse /shop to start shopping!',
    account_title: '👤 Your Account:',
    account_link_prompt: 'View your full account on the website:',
    help_title: '❓ Shahed Store Bot — Help',
    help_body: 'You can use the commands below. Use /menu anytime to return to the main menu.',
    contact_title: '📞 Contact Us',
    contact_body: 'For any question/issue, get in touch with us:',
    btn_contact_web: '🌐 Contact Page',
    btn_whatsapp: '💚 WhatsApp',
    btn_support: '🎫 Support Ticket',
    faq_title: '❓ Frequently Asked Questions (FAQ)',
    refund_title: '💸 Refund Request',
    refund_body: 'Request a refund via the link below. As per our policy, refunds are processed within 3–7 business days.',
    unknown_command: "🤔 Sorry, I didn't understand that command.",
    suggest_search: 'Want to search for it?',
    cmd_list: 'Tap /menu for the main menu or type / to see all commands.',
    bot_disabled: '⏸️ The shopping bot is currently disabled. Please try later.',
    enter_name: '👤 Please enter your full name:',
    enter_phone: '📱 Please enter your phone number:',
    enter_email: '📧 Please enter your email:',
    pick_payment: '💳 Choose a payment method:',
    enter_trxid: '✅ After payment, please send the Transaction ID / TrxID:',
    order_success: '✅ Order placed successfully!',
    order_cancelled: '❌ Order cancelled.',
    btn_cancel: '❌ Cancel',
    web_checkout_msg: '🌐 Checkout on the website:',
    link_30min: '⏰ This link is valid for 30 minutes.',
    you: 'You',
  },
} as const;

const t = (lang: Lang, key: keyof typeof T['bn']): string => T[lang][key] || T.bn[key];

// ─── TELEGRAM HELPERS ─────────────────────────────────────────────────────
async function sendMsg(botToken: string, chatId: string | number, text: string, keyboard?: any, replyTo?: number, parseMode?: string) {
  const body: Record<string, any> = { chat_id: chatId, text, disable_web_page_preview: true };
  if (keyboard) body.reply_markup = keyboard;
  if (replyTo) body.reply_to_message_id = replyTo;
  if (parseMode) body.parse_mode = parseMode;
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return res.json();
}

async function editMsg(botToken: string, chatId: string | number, messageId: number, text: string, keyboard?: any, parseMode?: string) {
  const body: Record<string, any> = { chat_id: chatId, message_id: messageId, text, disable_web_page_preview: true };
  if (keyboard) body.reply_markup = keyboard;
  if (parseMode) body.parse_mode = parseMode;
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

function inlineKb(buttons: { text: string; callback_data?: string; url?: string }[][]) {
  return { inline_keyboard: buttons };
}

function getSiteUrl(): string {
  return 'https://shahedstore.com.bd';
}

// ─── COMMAND REGISTRATION (setMyCommands) ─────────────────────────────────
async function registerBotCommands(botToken: string) {
  const cmdsBn = [
    { command: 'start', description: '🏠 শুরু করুন / মূল মেনু' },
    { command: 'menu', description: '📋 মূল মেনু দেখুন' },
    { command: 'shop', description: '🛍️ ক্যাটাগরি ও প্রোডাক্ট দেখুন' },
    { command: 'deals', description: '🔥 ফ্ল্যাশ সেল ও অফার' },
    { command: 'new', description: '🆕 নতুন প্রোডাক্ট' },
    { command: 'search', description: '🔍 প্রোডাক্ট সার্চ — /search <নাম>' },
    { command: 'cart', description: '🛒 কার্ট দেখুন' },
    { command: 'orders', description: '📋 আমার অর্ডারসমূহ' },
    { command: 'track', description: '📦 অর্ডার ট্র্যাক — /track <নম্বর>' },
    { command: 'account', description: '👤 অ্যাকাউন্ট ও ওয়ালেট' },
    { command: 'wallet', description: '💰 ওয়ালেট ব্যালেন্স' },
    { command: 'points', description: '⭐ লয়্যালটি পয়েন্ট' },
    { command: 'referral', description: '🎁 রেফারেল কোড' },
    { command: 'support', description: '🎫 সাপোর্ট টিকেট' },
    { command: 'contact', description: '📞 যোগাযোগ ও হোয়াটসঅ্যাপ' },
    { command: 'faq', description: '❓ সচরাচর জিজ্ঞাসা' },
    { command: 'refund', description: '💸 রিফান্ড রিকোয়েস্ট' },
    { command: 'website', description: '🌐 আমাদের ওয়েবসাইট' },
    { command: 'language', description: '🌐 ভাষা পরিবর্তন' },
    { command: 'help', description: '❓ সাহায্য' },
  ];
  const cmdsEn = [
    { command: 'start', description: '🏠 Start / Main menu' },
    { command: 'menu', description: '📋 Show main menu' },
    { command: 'shop', description: '🛍️ Browse categories & products' },
    { command: 'deals', description: '🔥 Flash sale & offers' },
    { command: 'new', description: '🆕 New arrivals' },
    { command: 'search', description: '🔍 Search products — /search <name>' },
    { command: 'cart', description: '🛒 View cart' },
    { command: 'orders', description: '📋 My orders' },
    { command: 'track', description: '📦 Track order — /track <number>' },
    { command: 'account', description: '👤 Account & wallet' },
    { command: 'wallet', description: '💰 Wallet balance' },
    { command: 'points', description: '⭐ Loyalty points' },
    { command: 'referral', description: '🎁 Referral code' },
    { command: 'support', description: '🎫 Support ticket' },
    { command: 'contact', description: '📞 Contact & WhatsApp' },
    { command: 'faq', description: '❓ FAQ' },
    { command: 'refund', description: '💸 Refund request' },
    { command: 'website', description: '🌐 Our website' },
    { command: 'language', description: '🌐 Change language' },
    { command: 'help', description: '❓ Help' },
  ];

  // Default (Bengali first market) + English variant
  await Promise.all([
    fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: cmdsBn, language_code: 'bn' }),
    }),
    fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: cmdsEn, language_code: 'en' }),
    }),
    fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: cmdsBn }),
    }),
    // Set short description & about
    fetch(`https://api.telegram.org/bot${botToken}/setMyDescription`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: '🛍️ Shahed Store — বাংলাদেশের #১ ডিজিটাল প্রোডাক্ট স্টোর। সাবস্ক্রিপশন, লাইসেন্স কী, সফটওয়্যার সরাসরি Telegram থেকেই কিনুন।',
      }),
    }),
    fetch(`https://api.telegram.org/bot${botToken}/setMyShortDescription`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        short_description: '🛍️ Shop digital products instantly. /start দিয়ে শুরু করুন!',
      }),
    }),
    // Show "Menu" button next to chat input
    fetch(`https://api.telegram.org/bot${botToken}/setChatMenuButton`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menu_button: { type: 'commands' } }),
    }),
  ]);
}

// ─── LANGUAGE HELPERS ─────────────────────────────────────────────────────
async function getLang(supabase: any, chatId: number): Promise<Lang> {
  const { data } = await supabase
    .from('telegram_user_prefs')
    .select('language')
    .eq('chat_id', String(chatId))
    .maybeSingle();
  return (data?.language === 'en' ? 'en' : 'bn') as Lang;
}

async function setLang(supabase: any, chatId: number, lang: Lang) {
  await supabase
    .from('telegram_user_prefs')
    .upsert({ chat_id: String(chatId), language: lang, updated_at: new Date().toISOString() }, { onConflict: 'chat_id' });
}

function statusLabel(status: string, lang: Lang): string {
  return (lang === 'en' ? STATUS_LABELS_EN : STATUS_LABELS_BN)[status] || status;
}

// ─── MAIN MENU (Branded Welcome) ──────────────────────────────────────────
async function handleStart(bot: string, chatId: number, supabase: any, lang: Lang) {
  const { data: settingsData } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['telegram_shop_bot_welcome', 'telegram_shop_bot_enabled']);

  const s: Record<string, string> = {};
  settingsData?.forEach((r: any) => { s[r.key] = r.value || ''; });

  if (s['telegram_shop_bot_enabled'] === 'false') {
    await sendMsg(bot, chatId, t(lang, 'bot_disabled'));
    return;
  }

  const text = `${t(lang, 'welcome_title')}\n\n${t(lang, 'welcome_sub')}\n\n${t(lang, 'quick_actions')}`;

  await sendMsg(bot, chatId, text, inlineKb([
    [{ text: t(lang, 'btn_shop'), callback_data: 'shop' }, { text: t(lang, 'btn_deals'), callback_data: 'deals' }],
    [{ text: t(lang, 'btn_search'), callback_data: 'search_hint' }, { text: t(lang, 'btn_cart'), callback_data: 'cart' }],
    [{ text: t(lang, 'btn_orders'), callback_data: 'orders' }, { text: t(lang, 'btn_account'), callback_data: 'account' }],
    [{ text: t(lang, 'btn_help'), callback_data: 'help' }, { text: t(lang, 'btn_lang'), callback_data: 'lang' }],
    [{ text: t(lang, 'btn_website'), url: getSiteUrl() }],
  ]), undefined, 'Markdown');
}

async function handleLanguagePicker(bot: string, chatId: number, lang: Lang) {
  await sendMsg(bot, chatId, t(lang, 'pick_lang'), inlineKb([
    [{ text: '🇧🇩 বাংলা', callback_data: 'setlang:bn' }, { text: '🇺🇸 English', callback_data: 'setlang:en' }],
    [{ text: t(lang, 'btn_menu'), callback_data: 'start' }],
  ]));
}

async function handleShop(bot: string, chatId: number, supabase: any, lang: Lang, messageId?: number) {
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('sort_order');

  if (!categories?.length) {
    const text = t(lang, 'no_categories');
    return messageId ? editMsg(bot, chatId, messageId, text) : sendMsg(bot, chatId, text);
  }

  const buttons = categories.map((c: any) => [{ text: `📁 ${c.name}`, callback_data: `cat:${c.id}` }]);
  buttons.push([{ text: t(lang, 'btn_menu'), callback_data: 'start' }]);

  const text = t(lang, 'pick_category');
  return messageId ? editMsg(bot, chatId, messageId, text, inlineKb(buttons)) : sendMsg(bot, chatId, text, inlineKb(buttons));
}

async function handleCategory(bot: string, chatId: number, categoryId: string, supabase: any, lang: Lang, messageId?: number, page = 0) {
  const PAGE_SIZE = 8;

  const { data: productCats } = await supabase
    .from('product_categories')
    .select('product_id')
    .eq('category_id', categoryId);
  const productIds = productCats?.map((pc: any) => pc.product_id) || [];

  const { data: directProducts } = await supabase
    .from('products')
    .select('id')
    .eq('category_id', categoryId)
    .eq('status', 'active');
  const allIds = [...new Set([...productIds, ...(directProducts?.map((p: any) => p.id) || [])])];

  if (!allIds.length) {
    const text = t(lang, 'no_products_cat');
    const kb = inlineKb([[{ text: t(lang, 'btn_back'), callback_data: 'shop' }]]);
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
    .from('categories').select('name').eq('id', categoryId).single();

  let text = `📁 ${category?.name || (lang === 'en' ? 'Products' : 'প্রোডাক্ট')}\n\n`;
  const buttons: { text: string; callback_data: string }[][] = [];

  for (const p of (products || [])) {
    const priceStr = p.original_price && p.original_price > p.price
      ? `৳${p.price} (~~৳${p.original_price}~~)`
      : `৳${p.price}`;
    text += `${p.badge ? `[${p.badge}] ` : ''}${p.name}\n💰 ${priceStr}\n\n`;
    buttons.push([{ text: `📄 ${p.name}`, callback_data: `prod:${p.slug}` }]);
  }

  const navRow: { text: string; callback_data: string }[] = [];
  if (page > 0) navRow.push({ text: '◀️', callback_data: `cat:${categoryId}:${page - 1}` });
  if ((products?.length || 0) >= PAGE_SIZE) navRow.push({ text: '▶️', callback_data: `cat:${categoryId}:${page + 1}` });
  if (navRow.length) buttons.push(navRow);
  buttons.push([{ text: t(lang, 'btn_back'), callback_data: 'shop' }, { text: t(lang, 'btn_menu'), callback_data: 'start' }]);

  const kb = inlineKb(buttons);
  return messageId ? editMsg(bot, chatId, messageId, text, kb) : sendMsg(bot, chatId, text, kb);
}

async function handleProductDetail(bot: string, chatId: number, slug: string, supabase: any, lang: Lang, messageId?: number) {
  const { data: product } = await supabase
    .from('products')
    .select('id, name, slug, price, original_price, description, short_description, badge, delivery_type, delivery_time, image_url')
    .eq('slug', slug).eq('status', 'active').single();

  if (!product) {
    const text = t(lang, 'product_not_found');
    return messageId ? editMsg(bot, chatId, messageId, text) : sendMsg(bot, chatId, text);
  }

  let text = `🏷️ ${product.name}\n\n`;
  if (product.badge) text += `🎖️ ${product.badge}\n`;

  if (product.original_price && product.original_price > product.price) {
    const discount = Math.round(((product.original_price - product.price) / product.original_price) * 100);
    text += `💰 ${t(lang, 'price')}: ৳${product.price} (${discount}% ${t(lang, 'discount')})\n~~৳${product.original_price}~~\n`;
  } else {
    text += `💰 ${t(lang, 'price')}: ৳${product.price}\n`;
  }

  if (product.delivery_type === 'instant') text += `⚡ ${t(lang, 'delivery')}: ${t(lang, 'instant')}\n`;
  else if (product.delivery_time) text += `🚀 ${t(lang, 'delivery')}: ${product.delivery_time}\n`;

  if (product.short_description) {
    const clean = product.short_description.replace(/<[^>]*>/g, '').substring(0, 300);
    text += `\n📝 ${clean}\n`;
  }

  text += `\n🔗 ${getSiteUrl()}/product/${product.slug}`;

  const buttons = [
    [{ text: t(lang, 'btn_buy_now'), callback_data: `buy:${product.slug}` }],
    [{ text: t(lang, 'btn_add_cart'), callback_data: `add:${product.slug}` }, { text: t(lang, 'btn_view_cart'), callback_data: 'cart' }],
    [{ text: t(lang, 'btn_back'), callback_data: 'shop' }, { text: t(lang, 'btn_menu'), callback_data: 'start' }],
  ];

  return messageId
    ? editMsg(bot, chatId, messageId, text, inlineKb(buttons))
    : sendMsg(bot, chatId, text, inlineKb(buttons));
}

async function handleAddToCart(bot: string, chatId: number, slug: string, supabase: any, lang: Lang) {
  const { data: product } = await supabase
    .from('products').select('id, name, slug, price').eq('slug', slug).eq('status', 'active').single();
  if (!product) return;

  const { data: existing } = await supabase
    .from('telegram_cart').select('id, quantity')
    .eq('chat_id', String(chatId)).eq('product_slug', slug).maybeSingle();

  if (existing) {
    await supabase.from('telegram_cart').update({ quantity: existing.quantity + 1 }).eq('id', existing.id);
  } else {
    await supabase.from('telegram_cart').insert({
      chat_id: String(chatId), product_id: product.id, product_name: product.name,
      product_slug: product.slug, price: product.price, quantity: 1,
    });
  }

  await sendMsg(bot, chatId, `✅ "${product.name}" — ${t(lang, 'added_to_cart')}!`, inlineKb([
    [{ text: t(lang, 'btn_view_cart'), callback_data: 'cart' }],
    [{ text: t(lang, 'btn_more_shop'), callback_data: 'shop' }],
  ]));
}

async function handleBuyNow(bot: string, chatId: number, slug: string, supabase: any, lang: Lang) {
  await supabase.from('telegram_cart').delete().eq('chat_id', String(chatId));

  const { data: product } = await supabase
    .from('products').select('id, name, slug, price').eq('slug', slug).eq('status', 'active').single();
  if (!product) return;

  await supabase.from('telegram_cart').insert({
    chat_id: String(chatId), product_id: product.id, product_name: product.name,
    product_slug: product.slug, price: product.price, quantity: 1,
  });

  await sendMsg(bot, chatId,
    `⚡ "${product.name}" — ৳${product.price}\n\n${lang === 'en' ? 'Choose checkout method:' : 'চেকআউট পদ্ধতি বেছে নিন:'}`,
    inlineKb([
      [{ text: t(lang, 'btn_checkout_tg'), callback_data: 'co_tg' }],
      [{ text: t(lang, 'btn_checkout_web'), callback_data: 'co_web' }],
      [{ text: t(lang, 'btn_view_cart'), callback_data: 'cart' }],
    ])
  );
}

async function handleCart(bot: string, chatId: number, supabase: any, lang: Lang, messageId?: number) {
  const { data: items } = await supabase
    .from('telegram_cart').select('*').eq('chat_id', String(chatId)).order('created_at');

  if (!items?.length) {
    const text = `${t(lang, 'cart_empty')}\n\n📦 /shop`;
    const kb = inlineKb([
      [{ text: t(lang, 'btn_shop'), callback_data: 'shop' }],
      [{ text: t(lang, 'btn_menu'), callback_data: 'start' }],
    ]);
    return messageId ? editMsg(bot, chatId, messageId, text, kb) : sendMsg(bot, chatId, text, kb);
  }

  let text = `${t(lang, 'your_cart')}\n\n`;
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

  text += `━━━━━━━━━━━━\n💵 ${t(lang, 'total')}: ৳${total.toLocaleString()}`;

  buttons.push([{ text: t(lang, 'btn_checkout_tg'), callback_data: 'co_tg' }]);
  buttons.push([{ text: t(lang, 'btn_checkout_web'), callback_data: 'co_web' }]);
  buttons.push([
    { text: t(lang, 'btn_clear_cart'), callback_data: 'clear_cart' },
    { text: t(lang, 'btn_more_shop'), callback_data: 'shop' },
  ]);
  buttons.push([{ text: t(lang, 'btn_menu'), callback_data: 'start' }]);

  const kb = inlineKb(buttons);
  return messageId ? editMsg(bot, chatId, messageId, text, kb) : sendMsg(bot, chatId, text, kb);
}

async function handleQty(bot: string, chatId: number, slug: string, action: string, supabase: any) {
  const { data: item } = await supabase
    .from('telegram_cart').select('id, quantity')
    .eq('chat_id', String(chatId)).eq('product_slug', slug).maybeSingle();
  if (!item) return;

  if (action === '+') {
    await supabase.from('telegram_cart').update({ quantity: item.quantity + 1 }).eq('id', item.id);
  } else {
    if (item.quantity <= 1) await supabase.from('telegram_cart').delete().eq('id', item.id);
    else await supabase.from('telegram_cart').update({ quantity: item.quantity - 1 }).eq('id', item.id);
  }
}

async function handleSearch(bot: string, chatId: number, query: string, supabase: any, lang: Lang) {
  if (!query.trim()) {
    return sendMsg(bot, chatId, t(lang, 'search_prompt'));
  }

  const { data: products } = await supabase
    .from('products').select('id, name, slug, price, original_price, badge')
    .eq('status', 'active')
    .or(`name.ilike.%${query}%,short_description.ilike.%${query}%`)
    .limit(10);

  if (!products?.length) {
    return sendMsg(bot, chatId, `😔 "${query}" — ${t(lang, 'search_no_result')}.\n\n/shop`);
  }

  let text = `🔍 "${query}" — ${products.length} ${t(lang, 'search_results')}:\n\n`;
  const buttons: { text: string; callback_data: string }[][] = [];

  for (const p of products) {
    text += `${p.badge ? `[${p.badge}] ` : ''}${p.name} — ৳${p.price}\n`;
    buttons.push([{ text: `📄 ${p.name}`, callback_data: `prod:${p.slug}` }]);
  }
  buttons.push([{ text: t(lang, 'btn_menu'), callback_data: 'start' }]);
  return sendMsg(bot, chatId, text, inlineKb(buttons));
}

async function handleDeals(bot: string, chatId: number, supabase: any, lang: Lang, messageId?: number) {
  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, price, original_price, badge')
    .eq('status', 'active')
    .not('original_price', 'is', null)
    .gt('original_price', 0)
    .order('discount_percent', { ascending: false, nullsFirst: false })
    .limit(10);

  const deals = (products || []).filter((p: any) => p.original_price && p.original_price > p.price);

  if (!deals.length) {
    const text = t(lang, 'no_deals');
    const kb = inlineKb([[{ text: t(lang, 'btn_menu'), callback_data: 'start' }]]);
    return messageId ? editMsg(bot, chatId, messageId, text, kb) : sendMsg(bot, chatId, text, kb);
  }

  let text = `${t(lang, 'deals_title')}\n\n`;
  const buttons: { text: string; callback_data: string }[][] = [];
  for (const p of deals) {
    const off = Math.round(((p.original_price - p.price) / p.original_price) * 100);
    text += `🔥 [${off}% ${t(lang, 'discount')}] ${p.name}\n💰 ৳${p.price} ~~৳${p.original_price}~~\n\n`;
    buttons.push([{ text: `📄 ${p.name}`, callback_data: `prod:${p.slug}` }]);
  }
  buttons.push([{ text: t(lang, 'btn_menu'), callback_data: 'start' }]);
  const kb = inlineKb(buttons);
  return messageId ? editMsg(bot, chatId, messageId, text, kb) : sendMsg(bot, chatId, text, kb);
}

async function handleNewArrivals(bot: string, chatId: number, supabase: any, lang: Lang, messageId?: number) {
  const { data: products } = await supabase
    .from('products').select('id, name, slug, price, original_price, badge')
    .eq('status', 'active').order('created_at', { ascending: false }).limit(10);

  if (!products?.length) {
    const text = t(lang, 'no_new');
    const kb = inlineKb([[{ text: t(lang, 'btn_menu'), callback_data: 'start' }]]);
    return messageId ? editMsg(bot, chatId, messageId, text, kb) : sendMsg(bot, chatId, text, kb);
  }

  let text = `${t(lang, 'new_arrivals')}\n\n`;
  const buttons: { text: string; callback_data: string }[][] = [];
  for (const p of products) {
    text += `🆕 ${p.name} — ৳${p.price}\n`;
    buttons.push([{ text: `📄 ${p.name}`, callback_data: `prod:${p.slug}` }]);
  }
  buttons.push([{ text: t(lang, 'btn_menu'), callback_data: 'start' }]);
  const kb = inlineKb(buttons);
  return messageId ? editMsg(bot, chatId, messageId, text, kb) : sendMsg(bot, chatId, text, kb);
}

async function handleMyOrders(bot: string, chatId: number, supabase: any, lang: Lang, messageId?: number) {
  // Find orders by chat note marker
  const { data: orders } = await supabase
    .from('orders')
    .select('order_number, status, total, created_at')
    .ilike('notes', `%Chat: ${chatId}%`)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!orders?.length) {
    const text = t(lang, 'no_orders');
    const kb = inlineKb([
      [{ text: t(lang, 'btn_shop'), callback_data: 'shop' }],
      [{ text: t(lang, 'btn_menu'), callback_data: 'start' }],
    ]);
    return messageId ? editMsg(bot, chatId, messageId, text, kb) : sendMsg(bot, chatId, text, kb);
  }

  let text = `${t(lang, 'my_orders')}\n\n`;
  const buttons: { text: string; callback_data: string }[][] = [];
  for (const o of orders) {
    const emoji = STATUS_EMOJI[o.status] || '📦';
    const lbl = statusLabel(o.status, lang);
    text += `${emoji} #${o.order_number} — ৳${Number(o.total).toLocaleString()} — ${lbl}\n`;
    buttons.push([{ text: `📋 #${o.order_number}`, callback_data: `trk:${o.order_number}` }]);
  }
  buttons.push([{ text: t(lang, 'btn_menu'), callback_data: 'start' }]);
  const kb = inlineKb(buttons);
  return messageId ? editMsg(bot, chatId, messageId, text, kb) : sendMsg(bot, chatId, text, kb);
}

async function handleAccount(bot: string, chatId: number, lang: Lang, messageId?: number) {
  const text = `${t(lang, 'account_title')}\n\n${t(lang, 'account_link_prompt')}`;
  const kb = inlineKb([
    [{ text: '👤 ' + (lang === 'en' ? 'Open Dashboard' : 'ড্যাশবোর্ড খুলুন'), url: `${getSiteUrl()}/dashboard` }],
    [{ text: '💰 ' + (lang === 'en' ? 'Wallet' : 'ওয়ালেট'), url: `${getSiteUrl()}/dashboard?tab=wallet` }],
    [{ text: '⭐ ' + (lang === 'en' ? 'Loyalty Points' : 'পয়েন্ট'), url: `${getSiteUrl()}/dashboard?tab=points` }],
    [{ text: '🎁 ' + (lang === 'en' ? 'Referrals' : 'রেফারেল'), url: `${getSiteUrl()}/dashboard?tab=referral` }],
    [{ text: t(lang, 'btn_menu'), callback_data: 'start' }],
  ]);
  return messageId ? editMsg(bot, chatId, messageId, text, kb) : sendMsg(bot, chatId, text, kb);
}

async function handleHelp(bot: string, chatId: number, lang: Lang) {
  const cmds = lang === 'en'
    ? [
        '/start — Start / main menu',
        '/shop — Browse categories & products',
        '/deals — Flash sale & offers',
        '/new — New arrivals',
        '/search <name> — Search products',
        '/cart — View cart',
        '/orders — My orders',
        '/track <number> — Track an order',
        '/account — Account & wallet',
        '/wallet — Wallet balance',
        '/points — Loyalty points',
        '/referral — Referral code',
        '/support — Support ticket',
        '/contact — Contact us',
        '/faq — FAQ',
        '/refund — Refund request',
        '/website — Our website',
        '/language — Change language',
        '/help — This help',
      ]
    : [
        '/start — শুরু / মূল মেনু',
        '/shop — ক্যাটাগরি ও প্রোডাক্ট',
        '/deals — ফ্ল্যাশ সেল ও অফার',
        '/new — নতুন প্রোডাক্ট',
        '/search <নাম> — সার্চ',
        '/cart — কার্ট দেখুন',
        '/orders — আমার অর্ডার',
        '/track <নম্বর> — অর্ডার ট্র্যাক',
        '/account — অ্যাকাউন্ট ও ওয়ালেট',
        '/wallet — ওয়ালেট ব্যালেন্স',
        '/points — লয়্যালটি পয়েন্ট',
        '/referral — রেফারেল কোড',
        '/support — সাপোর্ট টিকেট',
        '/contact — যোগাযোগ',
        '/faq — সচরাচর জিজ্ঞাসা',
        '/refund — রিফান্ড রিকোয়েস্ট',
        '/website — ওয়েবসাইট',
        '/language — ভাষা পরিবর্তন',
        '/help — সাহায্য',
      ];

  const text = `${t(lang, 'help_title')}\n\n${t(lang, 'help_body')}\n\n${cmds.join('\n')}\n\n💡 ${t(lang, 'cmd_list')}`;
  await sendMsg(bot, chatId, text, inlineKb([
    [{ text: t(lang, 'btn_support'), callback_data: 'support' }, { text: t(lang, 'btn_contact_web'), callback_data: 'contact' }],
    [{ text: t(lang, 'btn_menu'), callback_data: 'start' }],
  ]));
}

async function handleContact(bot: string, chatId: number, supabase: any, lang: Lang) {
  const { data: rows } = await supabase
    .from('site_settings').select('key, value')
    .in('key', ['whatsapp_number', 'support_email', 'contact_phone']);
  const s: Record<string, string> = {};
  rows?.forEach((r: any) => { s[r.key] = r.value || ''; });

  const wa = s['whatsapp_number'] || '';
  const waUrl = wa ? `https://wa.me/${wa.replace(/\D/g, '').replace(/^0/, '880')}` : `${getSiteUrl()}/contact-us`;

  let text = `${t(lang, 'contact_title')}\n\n${t(lang, 'contact_body')}\n`;
  if (s['contact_phone']) text += `\n📞 ${s['contact_phone']}`;
  if (s['support_email']) text += `\n📧 ${s['support_email']}`;
  if (wa) text += `\n💚 WhatsApp: ${wa}`;

  await sendMsg(bot, chatId, text, inlineKb([
    [{ text: t(lang, 'btn_whatsapp'), url: waUrl }],
    [{ text: t(lang, 'btn_contact_web'), url: `${getSiteUrl()}/contact-us` }],
    [{ text: t(lang, 'btn_support'), url: `${getSiteUrl()}/help-center` }],
    [{ text: t(lang, 'btn_menu'), callback_data: 'start' }],
  ]));
}

async function handleFaq(bot: string, chatId: number, lang: Lang) {
  const text = `${t(lang, 'faq_title')}\n\n${lang === 'en'
    ? 'Visit our help center for detailed FAQs:'
    : 'বিস্তারিত FAQ দেখতে আমাদের হেল্প সেন্টারে যান:'}`;
  await sendMsg(bot, chatId, text, inlineKb([
    [{ text: '❓ FAQ', url: `${getSiteUrl()}/faqs` }],
    [{ text: '📚 Help Center', url: `${getSiteUrl()}/help-center` }],
    [{ text: t(lang, 'btn_menu'), callback_data: 'start' }],
  ]));
}

async function handleRefund(bot: string, chatId: number, lang: Lang) {
  await sendMsg(bot, chatId, `${t(lang, 'refund_title')}\n\n${t(lang, 'refund_body')}`, inlineKb([
    [{ text: '💸 ' + (lang === 'en' ? 'Request Refund' : 'রিফান্ড রিকোয়েস্ট'), url: `${getSiteUrl()}/refund-request` }],
    [{ text: '📜 ' + (lang === 'en' ? 'Refund Policy' : 'রিফান্ড পলিসি'), url: `${getSiteUrl()}/refund-policy` }],
    [{ text: t(lang, 'btn_menu'), callback_data: 'start' }],
  ]));
}

async function handleTrack(bot: string, chatId: number, orderNum: string, supabase: any, lang: Lang) {
  if (!orderNum.trim()) {
    return sendMsg(bot, chatId, t(lang, 'track_prompt'));
  }

  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, status, total, customer_name, payment_method, payment_status, created_at, order_items(product_name, quantity, price, total)')
    .eq('order_number', orderNum.toUpperCase()).maybeSingle();

  if (!order) {
    return sendMsg(bot, chatId, `❌ #${orderNum} — ${t(lang, 'order_not_found')}.`);
  }

  const lbl = statusLabel(order.status, lang);
  const emoji = STATUS_EMOJI[order.status] || '📦';

  let text = `${emoji} ${lang === 'en' ? 'Order' : 'অর্ডার'} #${order.order_number}\n\n`;
  text += `👤 ${order.customer_name}\n`;
  text += `📋 ${lbl}\n`;
  text += `💳 ${(order.payment_method || 'N/A').toUpperCase()} (${order.payment_status || 'pending'})\n`;
  text += `⏰ ${new Date(order.created_at).toLocaleString(lang === 'en' ? 'en-US' : 'bn-BD')}\n\n`;
  text += `📦 ${lang === 'en' ? 'Items' : 'পণ্যসমূহ'}:\n`;
  for (const item of (order.order_items || [])) {
    text += `  • ${item.product_name} ×${item.quantity} — ৳${Number(item.total).toLocaleString()}\n`;
  }
  text += `\n💵 ${t(lang, 'total')}: ৳${Number(order.total).toLocaleString()}`;

  return sendMsg(bot, chatId, text, inlineKb([
    [{ text: t(lang, 'btn_orders'), callback_data: 'orders' }],
    [{ text: t(lang, 'btn_menu'), callback_data: 'start' }],
  ]));
}

// ─── CHECKOUT FLOW ────────────────────────────────────────────────────────
async function startTgCheckout(bot: string, chatId: number, supabase: any, lang: Lang) {
  const { data: items } = await supabase.from('telegram_cart').select('*').eq('chat_id', String(chatId));
  if (!items?.length) {
    return sendMsg(bot, chatId, t(lang, 'cart_empty'));
  }

  await supabase.from('telegram_checkout_state').upsert({
    chat_id: String(chatId), step: 'name', collected_data: {}, updated_at: new Date().toISOString(),
  }, { onConflict: 'chat_id' });

  await sendMsg(bot, chatId, t(lang, 'enter_name'));
}

async function handleCheckoutStep(bot: string, chatId: number, text: string, supabase: any, lang: Lang) {
  const { data: state } = await supabase
    .from('telegram_checkout_state').select('*').eq('chat_id', String(chatId)).maybeSingle();
  if (!state) return false;

  const data = state.collected_data || {};

  switch (state.step) {
    case 'name':
      data.name = text.trim();
      await supabase.from('telegram_checkout_state')
        .update({ step: 'phone', collected_data: data, updated_at: new Date().toISOString() })
        .eq('chat_id', String(chatId));
      await sendMsg(bot, chatId, t(lang, 'enter_phone'));
      return true;
    case 'phone':
      data.phone = text.trim();
      await supabase.from('telegram_checkout_state')
        .update({ step: 'email', collected_data: data, updated_at: new Date().toISOString() })
        .eq('chat_id', String(chatId));
      await sendMsg(bot, chatId, t(lang, 'enter_email'));
      return true;
    case 'email':
      data.email = text.trim();
      await supabase.from('telegram_checkout_state')
        .update({ step: 'payment', collected_data: data, updated_at: new Date().toISOString() })
        .eq('chat_id', String(chatId));
      await sendMsg(bot, chatId, t(lang, 'pick_payment'), inlineKb([
        [{ text: '💜 বিকাশ', callback_data: 'pay:bkash' }, { text: '🟠 নগদ', callback_data: 'pay:nagad' }],
        [{ text: '🟣 রকেট', callback_data: 'pay:rocket' }, { text: '🔵 উপায়', callback_data: 'pay:upay' }],
        [{ text: '🏦 Bank', callback_data: 'pay:bank' }],
        [{ text: t(lang, 'btn_cancel'), callback_data: 'cancel_co' }],
      ]));
      return true;
    case 'trxid':
      data.trxId = text.trim();
      await confirmOrder(bot, chatId, data, supabase, lang);
      return true;
  }
  return false;
}

async function handlePaymentSelect(bot: string, chatId: number, method: string, supabase: any, lang: Lang) {
  const { data: state } = await supabase
    .from('telegram_checkout_state').select('collected_data').eq('chat_id', String(chatId)).maybeSingle();
  if (!state) return;

  const data = state.collected_data || {};
  data.paymentMethod = method;

  const { data: pmcRow } = await supabase
    .from('site_settings').select('value').eq('key', 'payment_methods_config').maybeSingle();
  let paymentMethods: any[] = [];
  try { paymentMethods = JSON.parse(pmcRow?.value || '[]'); } catch {}
  const pm = paymentMethods.find((m: any) => m.id === method);

  const { data: items } = await supabase
    .from('telegram_cart').select('price, quantity').eq('chat_id', String(chatId));
  const total = items?.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0) || 0;

  let payInfo = '';
  if (method === 'bank') {
    const bankCfg = paymentMethods.find((m: any) => m.id === 'bank' || m.id === 'bank_transfer');
    payInfo = `🏦 Bank: ${bankCfg?.bankName || 'N/A'}\n👤 ${bankCfg?.accountName || 'N/A'}\n🔢 ${bankCfg?.accountNumber || 'N/A'}\n📍 ${bankCfg?.branch || 'N/A'}`;
  } else {
    const number = pm?.number || 'N/A';
    const label = pm?.label || method;
    payInfo = `💳 ${label}: ${number}${pm?.type ? ` (${pm.type})` : ''}`;
  }

  await supabase.from('telegram_checkout_state')
    .update({ step: 'trxid', collected_data: data, updated_at: new Date().toISOString() })
    .eq('chat_id', String(chatId));

  await sendMsg(bot, chatId, `💵 ${t(lang, 'total')}: ৳${total.toLocaleString()}\n\n${payInfo}\n\n${t(lang, 'enter_trxid')}`);
}

async function confirmOrder(bot: string, chatId: number, data: any, supabase: any, lang: Lang) {
  const { data: items } = await supabase.from('telegram_cart').select('*').eq('chat_id', String(chatId));
  if (!items?.length) {
    await sendMsg(bot, chatId, t(lang, 'cart_empty'));
    return;
  }

  const subtotal = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
  const orderNumber = 'ORD-' + Date.now().toString().slice(-8);

  const { data: order, error } = await supabase.from('orders').insert({
    order_number: orderNumber,
    customer_name: data.name || 'Telegram User',
    customer_email: data.email || 'telegram@shahedstore.com',
    customer_phone: data.phone || '',
    payment_method: data.paymentMethod || 'bkash',
    transaction_id: data.trxId || '',
    subtotal, total: subtotal,
    status: 'pending', payment_status: 'pending',
    notes: `টেলিগ্রাম থেকে অর্ডার (Chat: ${chatId})`,
  }).select().single();

  if (error || !order) {
    console.error('Order creation failed:', error);
    await sendMsg(bot, chatId, lang === 'en' ? '❌ Order creation failed. Please try later.' : '❌ অর্ডার তৈরি ব্যর্থ হয়েছে।');
    return;
  }

  const orderItems = items.map((i: any) => ({
    order_id: order.id, product_id: i.product_id, product_name: i.product_name,
    price: i.price, quantity: i.quantity, total: i.price * i.quantity,
  }));
  await supabase.from('order_items').insert(orderItems);

  await supabase.from('telegram_cart').delete().eq('chat_id', String(chatId));
  await supabase.from('telegram_checkout_state').delete().eq('chat_id', String(chatId));

  let text = `${t(lang, 'order_success')}\n\n🔢 #${orderNumber}\n👤 ${data.name}\n📱 ${data.phone}\n💳 ${(data.paymentMethod || '').toUpperCase()}\n`;
  if (data.trxId) text += `🔖 TrxID: ${data.trxId}\n`;
  text += `\n📦 ${lang === 'en' ? 'Items' : 'পণ্য'}:\n`;
  for (const i of items) {
    text += `  • ${i.product_name} ×${i.quantity} — ৳${(i.price * i.quantity).toLocaleString()}\n`;
  }
  text += `\n💵 ${t(lang, 'total')}: ৳${subtotal.toLocaleString()}\n`;
  text += `\n📋 /track ${orderNumber}`;

  await sendMsg(bot, chatId, text, inlineKb([
    [{ text: t(lang, 'btn_track_order'), callback_data: `trk:${orderNumber}` }],
    [{ text: t(lang, 'btn_more_shop'), callback_data: 'shop' }],
    [{ text: t(lang, 'btn_menu'), callback_data: 'start' }],
  ]));
}

async function handleWebCheckout(bot: string, chatId: number, supabase: any, lang: Lang) {
  const { data: items } = await supabase.from('telegram_cart').select('*').eq('chat_id', String(chatId));
  if (!items?.length) return sendMsg(bot, chatId, t(lang, 'cart_empty'));

  const token = crypto.randomUUID();
  const cartData = items.map((i: any) => ({
    product_id: i.product_id, product_name: i.product_name, product_slug: i.product_slug,
    price: i.price, quantity: i.quantity,
  }));

  await supabase.from('telegram_checkout_tokens').insert({
    token, chat_id: String(chatId), cart_data: cartData,
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  });

  const url = `${getSiteUrl()}/checkout?tg_token=${token}`;
  const total = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);

  await sendMsg(bot, chatId,
    `${t(lang, 'web_checkout_msg')}\n\n💵 ${t(lang, 'total')}: ৳${total.toLocaleString()}\n\n${t(lang, 'link_30min')}`,
    inlineKb([
      [{ text: '🌐 ' + (lang === 'en' ? 'Open Checkout' : 'চেকআউট পেজ'), url }],
      [{ text: t(lang, 'btn_menu'), callback_data: 'start' }],
    ])
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN POLLING LOOP
// ═══════════════════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);

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

    // ─── ON-DEMAND COMMAND REGISTRATION ─────────────────────────────────
    // POST /telegram-poll?action=register-commands  → registers slash menu, description, menu button
    if (url.searchParams.get('action') === 'register-commands') {
      await registerBotCommands(BOT_TOKEN);
      return new Response(JSON.stringify({ ok: true, registered: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: state, error: stateErr } = await supabase
      .from('telegram_bot_state').select('update_offset').eq('id', 2).single();

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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offset: currentOffset, timeout, allowed_updates: ['message', 'callback_query'] }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) { console.error('getUpdates failed:', data); break; }

      const updates = data.result ?? [];
      if (updates.length === 0) continue;

      for (const update of updates) {
        try {
          // ─── CALLBACK QUERY ──────────────────────────────────────────
          if (update.callback_query) {
            const cb = update.callback_query;
            const chatId = cb.message.chat.id;
            const msgId = cb.message.message_id;
            const cbData = cb.data;
            const lang = await getLang(supabase, chatId);

            if (cbData === 'start') {
              await answerCb(BOT_TOKEN, cb.id);
              await handleStart(BOT_TOKEN, chatId, supabase, lang);
            } else if (cbData === 'shop') {
              await answerCb(BOT_TOKEN, cb.id);
              await handleShop(BOT_TOKEN, chatId, supabase, lang, msgId);
            } else if (cbData === 'deals') {
              await answerCb(BOT_TOKEN, cb.id);
              await handleDeals(BOT_TOKEN, chatId, supabase, lang, msgId);
            } else if (cbData === 'new') {
              await answerCb(BOT_TOKEN, cb.id);
              await handleNewArrivals(BOT_TOKEN, chatId, supabase, lang, msgId);
            } else if (cbData === 'orders') {
              await answerCb(BOT_TOKEN, cb.id);
              await handleMyOrders(BOT_TOKEN, chatId, supabase, lang, msgId);
            } else if (cbData === 'account') {
              await answerCb(BOT_TOKEN, cb.id);
              await handleAccount(BOT_TOKEN, chatId, lang, msgId);
            } else if (cbData === 'help') {
              await answerCb(BOT_TOKEN, cb.id);
              await handleHelp(BOT_TOKEN, chatId, lang);
            } else if (cbData === 'contact') {
              await answerCb(BOT_TOKEN, cb.id);
              await handleContact(BOT_TOKEN, chatId, supabase, lang);
            } else if (cbData === 'support') {
              await answerCb(BOT_TOKEN, cb.id);
              await handleContact(BOT_TOKEN, chatId, supabase, lang);
            } else if (cbData === 'lang') {
              await answerCb(BOT_TOKEN, cb.id);
              await handleLanguagePicker(BOT_TOKEN, chatId, lang);
            } else if (cbData.startsWith('setlang:')) {
              const newLang = (cbData.substring(8) === 'en' ? 'en' : 'bn') as Lang;
              await setLang(supabase, chatId, newLang);
              await answerCb(BOT_TOKEN, cb.id, t(newLang, newLang === 'en' ? 'lang_set_en' : 'lang_set_bn'));
              await handleStart(BOT_TOKEN, chatId, supabase, newLang);
            } else if (cbData === 'search_hint') {
              await answerCb(BOT_TOKEN, cb.id);
              await sendMsg(BOT_TOKEN, chatId, t(lang, 'search_prompt'));
            } else if (cbData.startsWith('cat:')) {
              await answerCb(BOT_TOKEN, cb.id);
              const parts = cbData.split(':');
              const catId = parts[1];
              const page = parts[2] ? parseInt(parts[2]) : 0;
              await handleCategory(BOT_TOKEN, chatId, catId, supabase, lang, msgId, page);
            } else if (cbData.startsWith('prod:')) {
              await answerCb(BOT_TOKEN, cb.id);
              await handleProductDetail(BOT_TOKEN, chatId, cbData.substring(5), supabase, lang, msgId);
            } else if (cbData.startsWith('add:')) {
              await answerCb(BOT_TOKEN, cb.id, '✅ ' + t(lang, 'added_to_cart'));
              await handleAddToCart(BOT_TOKEN, chatId, cbData.substring(4), supabase, lang);
            } else if (cbData.startsWith('buy:')) {
              await answerCb(BOT_TOKEN, cb.id);
              await handleBuyNow(BOT_TOKEN, chatId, cbData.substring(4), supabase, lang);
            } else if (cbData === 'cart') {
              await answerCb(BOT_TOKEN, cb.id);
              await handleCart(BOT_TOKEN, chatId, supabase, lang, msgId);
            } else if (cbData.startsWith('qty:')) {
              await answerCb(BOT_TOKEN, cb.id);
              const parts = cbData.split(':');
              await handleQty(BOT_TOKEN, chatId, parts[1], parts[2], supabase);
              await handleCart(BOT_TOKEN, chatId, supabase, lang, msgId);
            } else if (cbData.startsWith('rm:')) {
              await answerCb(BOT_TOKEN, cb.id, '🗑️');
              await supabase.from('telegram_cart').delete()
                .eq('chat_id', String(chatId)).eq('product_slug', cbData.substring(3));
              await handleCart(BOT_TOKEN, chatId, supabase, lang, msgId);
            } else if (cbData === 'clear_cart') {
              await answerCb(BOT_TOKEN, cb.id, '🗑️');
              await supabase.from('telegram_cart').delete().eq('chat_id', String(chatId));
              await handleCart(BOT_TOKEN, chatId, supabase, lang, msgId);
            } else if (cbData === 'co_tg') {
              await answerCb(BOT_TOKEN, cb.id);
              await startTgCheckout(BOT_TOKEN, chatId, supabase, lang);
            } else if (cbData === 'co_web') {
              await answerCb(BOT_TOKEN, cb.id);
              await handleWebCheckout(BOT_TOKEN, chatId, supabase, lang);
            } else if (cbData.startsWith('pay:')) {
              await answerCb(BOT_TOKEN, cb.id);
              await handlePaymentSelect(BOT_TOKEN, chatId, cbData.substring(4), supabase, lang);
            } else if (cbData === 'cancel_co') {
              await answerCb(BOT_TOKEN, cb.id);
              await supabase.from('telegram_checkout_state').delete().eq('chat_id', String(chatId));
              await sendMsg(BOT_TOKEN, chatId, t(lang, 'order_cancelled'), inlineKb([
                [{ text: t(lang, 'btn_view_cart'), callback_data: 'cart' }],
                [{ text: t(lang, 'btn_menu'), callback_data: 'start' }],
              ]));
            } else if (cbData.startsWith('trk:')) {
              await answerCb(BOT_TOKEN, cb.id);
              await handleTrack(BOT_TOKEN, chatId, cbData.substring(4), supabase, lang);
            } else if (cbData === 'noop') {
              await answerCb(BOT_TOKEN, cb.id);
            }

            totalProcessed++;
            continue;
          }

          // ─── TEXT MESSAGE ────────────────────────────────────────────
          const msg = update.message;
          if (!msg || !msg.text) continue;

          const chatId = msg.chat.id;
          const text = msg.text.trim();
          const lang = await getLang(supabase, chatId);

          // Auto-detect language preference from Telegram client on first interaction
          if (text === '/start' || text.startsWith('/start ')) {
            const tgLang = msg.from?.language_code;
            const { data: pref } = await supabase
              .from('telegram_user_prefs').select('chat_id').eq('chat_id', String(chatId)).maybeSingle();
            if (!pref && tgLang) {
              const detected: Lang = tgLang.startsWith('bn') ? 'bn' : 'en';
              await setLang(supabase, chatId, detected);
            }
          }

          // Check checkout flow first
          const handled = await handleCheckoutStep(BOT_TOKEN, chatId, text, supabase, lang);
          if (handled) { totalProcessed++; continue; }

          const finalLang = await getLang(supabase, chatId);

          // ─── COMMANDS ──────────────────────────────────────────────
          if (text === '/start' || text.startsWith('/start ') || text === '/menu') {
            await handleStart(BOT_TOKEN, chatId, supabase, finalLang);
          } else if (text === '/shop' || text === '/products' || text === '/categories') {
            await handleShop(BOT_TOKEN, chatId, supabase, finalLang);
          } else if (text === '/deals' || text === '/offers' || text === '/sale') {
            await handleDeals(BOT_TOKEN, chatId, supabase, finalLang);
          } else if (text === '/new' || text === '/latest') {
            await handleNewArrivals(BOT_TOKEN, chatId, supabase, finalLang);
          } else if (text.startsWith('/search')) {
            await handleSearch(BOT_TOKEN, chatId, text.replace(/^\/search\s*/i, ''), supabase, finalLang);
          } else if (text === '/cart') {
            await handleCart(BOT_TOKEN, chatId, supabase, finalLang);
          } else if (text === '/orders' || text === '/myorders') {
            await handleMyOrders(BOT_TOKEN, chatId, supabase, finalLang);
          } else if (text.startsWith('/track')) {
            await handleTrack(BOT_TOKEN, chatId, text.replace(/^\/track\s*/i, ''), supabase, finalLang);
          } else if (text === '/account' || text === '/profile' || text === '/wallet' || text === '/points' || text === '/referral') {
            await handleAccount(BOT_TOKEN, chatId, finalLang);
          } else if (text === '/support' || text === '/contact') {
            await handleContact(BOT_TOKEN, chatId, supabase, finalLang);
          } else if (text === '/faq') {
            await handleFaq(BOT_TOKEN, chatId, finalLang);
          } else if (text === '/refund') {
            await handleRefund(BOT_TOKEN, chatId, finalLang);
          } else if (text === '/website' || text === '/site') {
            await sendMsg(BOT_TOKEN, chatId, `🌐 ${getSiteUrl()}`, inlineKb([
              [{ text: '🌐 ' + (finalLang === 'en' ? 'Open Website' : 'ওয়েবসাইট খুলুন'), url: getSiteUrl() }],
              [{ text: t(finalLang, 'btn_menu'), callback_data: 'start' }],
            ]));
          } else if (text === '/language' || text === '/lang') {
            await handleLanguagePicker(BOT_TOKEN, chatId, finalLang);
          } else if (text === '/help') {
            await handleHelp(BOT_TOKEN, chatId, finalLang);
          } else if (text.startsWith('/')) {
            // Unknown slash command
            await sendMsg(BOT_TOKEN, chatId,
              `${t(finalLang, 'unknown_command')}\n\n💡 ${t(finalLang, 'cmd_list')}`,
              inlineKb([[{ text: t(finalLang, 'btn_menu'), callback_data: 'start' }]])
            );
          } else {
            // Plain text → suggest search
            await sendMsg(BOT_TOKEN, chatId,
              `🤔 ${t(finalLang, 'unknown_command')}\n\n"${text}" — ${t(finalLang, 'suggest_search')}`,
              inlineKb([
                [{ text: `🔍 "${text}"`, callback_data: `noop` }],
                [{ text: t(finalLang, 'btn_search'), callback_data: 'search_hint' }, { text: t(finalLang, 'btn_menu'), callback_data: 'start' }],
              ])
            );
            // Trigger actual search anyway
            await handleSearch(BOT_TOKEN, chatId, text, supabase, finalLang);
          }

          totalProcessed++;
        } catch (handlerErr) {
          console.error('Handler error:', handlerErr);
        }
      }

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
