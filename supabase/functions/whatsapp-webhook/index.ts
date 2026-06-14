import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN")!;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = "https://shahedstore.com.bd";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ---------- WhatsApp Send Helpers ----------
async function sendText(to: string, body: string) {
  const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { preview_url: true, body },
    }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) console.error("WA send error:", res.status, j);
  return { ok: res.ok, data: j };
}

async function sendImage(to: string, imageUrl: string, caption: string) {
  const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "image",
      image: { link: imageUrl, caption },
    }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) console.error("WA image send error:", res.status, j);
  return { ok: res.ok, data: j };
}

async function logMessage(row: Record<string, any>) {
  await supabase.from("whatsapp_messages").insert(row);
}

// ---------- Matching Logic ----------
function normalize(t: string) {
  return (t || "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function isGreeting(text: string) {
  const t = normalize(text);
  return /\b(hi|hello|hey|salam|assalamu|আসসালামু|হাই|হ্যালো|সালাম|start|শুরু)\b/.test(t);
}

function isOrderStatusQuery(text: string) {
  const t = normalize(text);
  return /\b(order|status|track|অর্ডার|স্ট্যাটাস|আমার অর্ডার|tracking)\b/.test(t);
}

async function findMatchingProduct(text: string) {
  const t = normalize(text);
  if (t.length < 2) return null;
  
  const { data: products } = await supabase
    .from("products")
    .select("id,name,slug,price,original_price,image_url,short_description")
    .eq("status", "active");
  
  if (!products?.length) return null;
  
  // Score each product
  let best: any = null;
  let bestScore = 0;
  
  for (const p of products) {
    const name = normalize(p.name);
    if (!name) continue;
    
    let score = 0;
    // exact substring (both directions)
    if (t.includes(name)) score += 100;
    else if (name.includes(t) && t.length >= 3) score += 60;
    
    // word match
    const tWords = t.split(" ").filter(w => w.length >= 2);
    const nWords = name.split(" ").filter(w => w.length >= 2);
    for (const tw of tWords) {
      for (const nw of nWords) {
        if (tw === nw) score += 20;
        else if (nw.includes(tw) && tw.length >= 3) score += 8;
        else if (tw.includes(nw) && nw.length >= 3) score += 5;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  
  return bestScore >= 20 ? best : null;
}

async function lookupRecentOrder(waPhone: string) {
  // normalize phone: take last 11 digits for BD numbers
  const digits = waPhone.replace(/\D/g, "");
  const last11 = digits.slice(-11);
  const last10 = digits.slice(-10);
  
  const { data } = await supabase
    .from("orders")
    .select("order_number,status,payment_status,total,created_at,customer_phone")
    .or(`customer_phone.ilike.%${last10}%,customer_phone.ilike.%${last11}%`)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1);
  
  return data?.[0] ?? null;
}

// ---------- Main Handler ----------
function isWithinBusinessHours(startHour: number, endHour: number) {
  const now = new Date();
  // Asia/Dhaka offset = +6:00
  const dhaka = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const hour = dhaka.getUTCHours();
  if (startHour <= endHour) return hour >= startHour && hour < endHour;
  return hour >= startHour || hour < endHour;
}

async function handleIncomingMessage(msg: any, contactName?: string) {
  const from: string = msg.from;
  const text: string = msg.text?.body || msg.button?.text || msg.interactive?.list_reply?.title || "";
  const wamid: string = msg.id;
  
  // Log inbound
  await logMessage({
    wa_phone: from,
    direction: "inbound",
    message_type: msg.type || "text",
    body: text,
    wa_message_id: wamid,
    raw: msg,
  });
  
  // Upsert contact
  const { data: existing } = await supabase
    .from("whatsapp_contacts")
    .select("id,last_greeted_at,total_messages")
    .eq("wa_phone", from)
    .maybeSingle();
  
  if (existing) {
    await supabase.from("whatsapp_contacts").update({
      wa_name: contactName || undefined,
      last_message_at: new Date().toISOString(),
      total_messages: (existing.total_messages || 0) + 1,
    }).eq("id", existing.id);
  } else {
    await supabase.from("whatsapp_contacts").insert({
      wa_phone: from,
      wa_name: contactName || null,
      total_messages: 1,
    });
  }
  
  // Load config
  const { data: cfg } = await supabase.from("whatsapp_bot_config").select("*").eq("id", 1).maybeSingle();
  if (!cfg || !cfg.enabled) return;
  
  // Skip non-text
  if (!text) return;
  
  // Greeting (first message or stale greeting)
  if (cfg.greeting_enabled) {
    const lastGreeted = existing?.last_greeted_at ? new Date(existing.last_greeted_at).getTime() : 0;
    const cooldownMs = (cfg.greeting_cooldown_hours || 24) * 60 * 60 * 1000;
    const shouldGreet = !existing || (Date.now() - lastGreeted > cooldownMs) || isGreeting(text);
    if (shouldGreet) {
      await sendText(from, cfg.greeting_message);
      await logMessage({ wa_phone: from, direction: "outbound", body: cfg.greeting_message, reply_type: "greeting" });
      await supabase.from("whatsapp_contacts").update({ last_greeted_at: new Date().toISOString() }).eq("wa_phone", from);
      if (isGreeting(text)) return; // pure greeting, stop here
    }
  }
  
  // Order status
  if (cfg.order_status_enabled && isOrderStatusQuery(text)) {
    const order = await lookupRecentOrder(from);
    let reply: string;
    if (order) {
      const dt = new Date(order.created_at).toLocaleDateString("bn-BD");
      reply = `📦 আপনার সর্বশেষ অর্ডার\n\n` +
        `🆔 অর্ডার নম্বর: *${order.order_number}*\n` +
        `📊 স্ট্যাটাস: *${order.status}*\n` +
        `💳 পেমেন্ট: *${order.payment_status}*\n` +
        `💰 মোট: *৳${order.total}*\n` +
        `📅 তারিখ: ${dt}\n\n` +
        `বিস্তারিত দেখতে: ${SITE_URL}/dashboard`;
    } else {
      reply = `আপনার এই WhatsApp নম্বরে কোনো অর্ডার খুঁজে পাইনি 🔍\n\nযদি অন্য নম্বর দিয়ে অর্ডার করে থাকেন, আমাদের সরাসরি বলুন। অথবা ওয়েবসাইট থেকে দেখুন:\n${SITE_URL}/dashboard`;
    }
    await sendText(from, reply);
    await logMessage({ wa_phone: from, direction: "outbound", body: reply, reply_type: "order_status" });
    return;
  }
  
  // Product matching
  if (cfg.product_reply_enabled) {
    const product = await findMatchingProduct(text);
    if (product) {
      const price = product.original_price && Number(product.original_price) > Number(product.price)
        ? `~৳${product.original_price}~  *৳${product.price}* 🎉`
        : `*৳${product.price}*`;
      const link = `${SITE_URL}/product/${product.slug}`;
      const caption =
        `🛒 *${product.name}*\n\n` +
        `💰 দাম: ${price}\n` +
        (product.short_description ? `\n${String(product.short_description).slice(0, 200)}\n` : "") +
        `\n✅ এখনই অর্ডার করুন:\n${link}\n\n` +
        `⏱️ ডেলিভারি: ১-২৪ ঘন্টা\n` +
        `🔒 ১০০% অরিজিনাল প্রোডাক্ট`;
      
      if (product.image_url) {
        await sendImage(from, product.image_url, caption);
      } else {
        await sendText(from, caption);
      }
      await logMessage({
        wa_phone: from,
        direction: "outbound",
        body: caption,
        matched_product_id: product.id,
        reply_type: "product_match",
      });
      return;
    }
  }
  
  // Away message check
  if (cfg.away_enabled && !isWithinBusinessHours(cfg.business_hours_start, cfg.business_hours_end)) {
    await sendText(from, cfg.away_message);
    await logMessage({ wa_phone: from, direction: "outbound", body: cfg.away_message, reply_type: "away" });
    return;
  }
  
  // Fallback
  await sendText(from, cfg.fallback_message);
  await logMessage({ wa_phone: from, direction: "outbound", body: cfg.fallback_message, reply_type: "fallback" });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  
  const url = new URL(req.url);
  
  // ----- Meta Webhook Verification (GET) -----
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge || "", { status: 200, headers: corsHeaders });
    }
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }
  
  // ----- Incoming Messages (POST) -----
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const entries = body.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          const value = change.value || {};
          const messages = value.messages || [];
          const contacts = value.contacts || [];
          for (const msg of messages) {
            const contact = contacts.find((c: any) => c.wa_id === msg.from);
            const name = contact?.profile?.name;
            // Process asynchronously but await for now (Meta gives ~20s)
            try {
              await handleIncomingMessage(msg, name);
            } catch (e) {
              console.error("handleIncomingMessage error:", e);
            }
          }
        }
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("webhook error:", e);
      // Always return 200 to Meta to avoid retries on parse errors
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }
  
  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});
