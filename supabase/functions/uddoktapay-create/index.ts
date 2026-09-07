// Uddoktapay: create checkout session
// Called from Checkout.tsx. Loads config from site_settings, POSTs to
// {base_url}/api/checkout-v2 and returns the hosted payment URL.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const { orderId } = await req.json();
    if (!orderId || typeof orderId !== 'string') return json({ error: 'orderId required' }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Load config
    const { data: cfgRow } = await supabase
      .from('site_settings').select('value').eq('key', 'uddoktapay_pgw_config').maybeSingle();
    if (!cfgRow?.value) return json({ error: 'Uddoktapay not configured' }, 400);
    let cfg: any;
    try { cfg = JSON.parse(cfgRow.value); } catch { return json({ error: 'Invalid config' }, 500); }
    if (!cfg.is_active) return json({ error: 'Uddoktapay disabled' }, 400);
    if (!cfg.api_key || !cfg.base_url) return json({ error: 'Uddoktapay credentials missing' }, 400);

    // Load order
    const { data: order, error: oErr } = await supabase
      .from('orders')
      .select('id, order_number, total, customer_name, customer_email, customer_phone, payment_status')
      .eq('id', orderId).maybeSingle();
    if (oErr || !order) return json({ error: 'Order not found' }, 404);
    if (order.payment_status === 'verified' || order.payment_status === 'paid') {
      return json({ error: 'Order already paid' }, 409);
    }

    const origin = req.headers.get('origin') || 'https://shahedit.com';
    const base = String(cfg.base_url).replace(/\/+$/, '');

    const payload = {
      full_name: order.customer_name || 'Customer',
      email: order.customer_email || 'noreply@shahedit.com',
      amount: Number(order.total).toFixed(2),
      metadata: { order_id: order.id, order_number: order.order_number },
      redirect_url: `${origin}/uddoktapay/return?order_id=${order.id}`,
      cancel_url: `${origin}/checkout?uddoktapay=cancelled`,
      webhook_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/uddoktapay-webhook`,
      return_type: 'GET',
    };

    const upRes = await fetch(`${base}/api/checkout-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'RT-UDDOKTAPAY-API-KEY': cfg.api_key,
      },
      body: JSON.stringify(payload),
    });
    const upJson = await upRes.json().catch(() => ({}));
    if (!upRes.ok || !upJson?.payment_url) {
      console.error('[uddoktapay-create] upstream error', upRes.status, upJson);
      return json({ error: upJson?.message || 'Uddoktapay create failed' }, 502);
    }

    return json({ payment_url: upJson.payment_url, invoice_id: upJson.invoice_id ?? null });
  } catch (e: any) {
    console.error('[uddoktapay-create] error', e);
    return json({ error: e?.message || 'Internal error' }, 500);
  }
});
