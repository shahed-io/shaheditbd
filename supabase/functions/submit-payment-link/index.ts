import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const Schema = z.object({
  slug: z.string().min(1).max(120),
  customer_name: z.string().trim().min(1).max(120),
  customer_phone: z.string().trim().min(3).max(40),
  customer_email: z.string().trim().email().max(255).optional().or(z.literal('')),
  customer_address: z.string().trim().max(500).optional(),
  quantity: z.number().int().positive().max(100).optional(),
  payment_method: z.string().min(1).max(60),
  transaction_id: z.string().trim().min(2).max(120),
  sender_number: z.string().trim().max(60).optional(),
  payment_screenshot_url: z.string().url().max(800).optional().or(z.literal('')),
  custom_field_values: z.record(z.string(), z.any()).optional(),
  customer_note: z.string().max(2000).optional(),
  open_product_name: z.string().trim().max(200).optional(),
  open_amount: z.number().positive().max(10_000_000).optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const d = parsed.data;

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Require a logged-in user
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    const authClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData } = await authClient.auth.getUser(token);
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'অর্ডার সাবমিটের জন্য লগইন প্রয়োজন', auth_required: true }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Fetch link
    const { data: link, error: linkErr } = await supabase
      .from('payment_links').select('*').eq('slug', d.slug).maybeSingle();
    if (linkErr || !link) {
      return new Response(JSON.stringify({ error: 'Link not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (link.status !== 'active') {
      return new Response(JSON.stringify({ error: 'এই লিংকটি বর্তমানে সক্রিয় নয়' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'এই লিংকের মেয়াদ শেষ হয়েছে' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (link.max_uses && link.current_uses >= link.max_uses) {
      return new Response(JSON.stringify({ error: 'এই লিংক সর্বোচ্চ সংখ্যক বার ব্যবহার হয়ে গেছে' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const qty = link.allow_qty_change && d.quantity ? d.quantity : (link.quantity || 1);

    let effectiveProductName = link.product_name;
    let effectiveProductImage = link.product_image;
    let effectiveAmount = Number(link.amount || 0);

    if (link.is_open_form) {
      if (!d.open_product_name || !d.open_amount) {
        return new Response(JSON.stringify({ error: 'পণ্যের নাম ও পরিমাণ দিন' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      effectiveProductName = d.open_product_name;
      effectiveAmount = d.open_amount;
      effectiveProductImage = null;
    }

    const total = effectiveAmount * qty;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const ua = req.headers.get('user-agent')?.slice(0, 500) || null;

    // Rate limit per user: 5 submissions / 5 min
    const { count } = await supabase.from('payment_link_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());
    if ((count ?? 0) >= 5) {
      return new Response(JSON.stringify({ error: 'অনেকবার চেষ্টা করেছেন, কিছুক্ষণ পর আবার চেষ্টা করুন' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate order number and create an Order row so it appears in the user's dashboard
    const now = new Date();
    const y = String(now.getUTCFullYear()).slice(2);
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const rand = Array.from(crypto.getRandomValues(new Uint8Array(3)))
      .map(b => b.toString(36)).join('').toUpperCase().slice(0, 5);
    const orderNumber = `PL-${y}${m}${dd}-${rand}`;

    const customerEmail = d.customer_email || user.email || '';

    const { data: order, error: orderErr } = await supabase.from('orders').insert({
      order_number: orderNumber,
      user_id: user.id,
      customer_name: d.customer_name,
      customer_email: customerEmail,
      customer_phone: d.customer_phone,
      status: 'pending',
      payment_status: 'pending',
      payment_method: (d.payment_method || '').toLowerCase(),
      transaction_id: d.transaction_id,
      subtotal: total,
      total,
      notes: [
        `Payment Link: ${link.slug}`,
        `Product: ${effectiveProductName} x ${qty}`,
        d.sender_number ? `Sender: ${d.sender_number}` : '',
        d.customer_address ? `Address: ${d.customer_address}` : '',
        d.customer_note ? `Note: ${d.customer_note}` : '',
        Object.keys(d.custom_field_values || {}).length
          ? `Fields: ${Object.entries(d.custom_field_values!).map(([k, v]) => `${k}=${v}`).join(', ')}`
          : '',
        d.payment_screenshot_url ? `Screenshot: ${d.payment_screenshot_url}` : '',
      ].filter(Boolean).join('\n'),
    }).select('id, order_number').single();

    if (orderErr) {
      return new Response(JSON.stringify({ error: orderErr.message || 'Order creation failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: sub, error: insErr } = await supabase
      .from('payment_link_submissions').insert({
        payment_link_id: link.id,
        link_slug: link.slug,
        user_id: user.id,
        order_id: order.id,
        order_number: order.order_number,
        customer_name: d.customer_name,
        customer_phone: d.customer_phone,
        customer_email: customerEmail || null,
        customer_address: d.customer_address || null,
        product_id: link.product_id,
        product_name: effectiveProductName,
        product_image: effectiveProductImage,
        amount: effectiveAmount,
        quantity: qty,
        total,
        payment_method: d.payment_method,
        transaction_id: d.transaction_id,
        sender_number: d.sender_number || null,
        payment_screenshot_url: d.payment_screenshot_url || null,
        custom_field_values: d.custom_field_values || {},
        customer_note: d.customer_note || null,
        ip_address: ip,
        user_agent: ua,
      }).select('id').single();

    if (insErr || !sub) {
      return new Response(JSON.stringify({ error: insErr?.message || 'Submission failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // bump current_uses; quick-generate (open form) links expire after first submission
    const updates: Record<string, unknown> = { current_uses: (link.current_uses || 0) + 1 };
    if (link.is_open_form) updates.status = 'expired';
    await supabase.from('payment_links').update(updates).eq('id', link.id);

    // Fire Telegram alert (best-effort)
    try {
      await supabase.functions.invoke('notify-telegram-event', {
        body: {
          type: 'payment_link_submission',
          title: '💳 New Payment Link Submission',
          message: `${d.customer_name} (${d.customer_phone})\n${effectiveProductName}\n৳${total}\nTxn: ${d.transaction_id}\nOrder: ${order.order_number}`,
        },
      });
    } catch (_) {}

    return new Response(JSON.stringify({ success: true, id: sub.id, order_number: order.order_number }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
