// POST /paypal-create-order
// body: { orderId: string }  → creates a PayPal order on the backend using the
// existing pending order's totals, and returns the PayPal order id for the
// JS SDK to approve on the client.
import { corsHeaders, jsonResponse, loadPayPalConfig, logPP, paypalAccessToken, paypalBaseUrl, serviceClient } from '../_shared/paypal.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const { orderId } = await req.json().catch(() => ({}));
    if (!orderId || typeof orderId !== 'string') {
      return jsonResponse({ error: 'orderId required' }, 400);
    }

    const supabase = serviceClient();
    const cfg = await loadPayPalConfig(supabase);
    if (!cfg.is_active) return jsonResponse({ error: 'PayPal is disabled' }, 403);

    const { data: order, error: oErr } = await supabase
      .from('orders')
      .select('id, order_number, total, currency, user_id, customer_email, payment_status, status')
      .eq('id', orderId)
      .maybeSingle();
    if (oErr || !order) return jsonResponse({ error: 'Order not found' }, 404);
    if (order.payment_status === 'verified' || order.payment_status === 'paid') {
      return jsonResponse({ error: 'Order already paid' }, 409);
    }

    // Convert BDT → USD when needed using currencies table
    let amount = Number(order.total);
    const targetCurrency = cfg.currency; // usually USD
    const srcCurrency = (order.currency || 'BDT').toUpperCase();
    if (srcCurrency !== targetCurrency) {
      const { data: cur, error: curErr } = await supabase
        .from('currencies')
        .select('code, rate_from_bdt')
        .in('code', [srcCurrency, targetCurrency]);
      if (curErr) {
        console.error('[paypal-create-order] currency lookup failed', curErr);
        return jsonResponse({ error: 'Currency conversion unavailable' }, 500);
      }
      const rateSrc = Number(cur?.find((c: any) => c.code === srcCurrency)?.rate_from_bdt || (srcCurrency === 'BDT' ? 1 : 0));
      const rateDst = Number(cur?.find((c: any) => c.code === targetCurrency)?.rate_from_bdt || 0);
      if (!(rateDst > 0) || !(rateSrc > 0)) {
        console.error('[paypal-create-order] missing FX rate', { srcCurrency, targetCurrency, rateSrc, rateDst });
        return jsonResponse({ error: `Missing FX rate for ${targetCurrency}` }, 500);
      }
      // rate_from_bdt = how many BDT equal 1 unit of that currency.
      // src → BDT: multiply by rateSrc. BDT → target: divide by rateDst.
      const bdt = srcCurrency === 'BDT' ? amount : amount * rateSrc;
      amount = targetCurrency === 'BDT' ? bdt : bdt / rateDst;
    }
    amount = Math.round(amount * 100) / 100;
    if (!(amount > 0)) return jsonResponse({ error: 'Invalid order total' }, 400);

    const token = await paypalAccessToken(cfg);
    const origin = req.headers.get('origin') || 'https://shahedstore.com.bd';

    const ppRes = await fetch(`${paypalBaseUrl(cfg.mode)}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'PayPal-Request-Id': `${order.id}-${Date.now()}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: order.id,
          invoice_id: order.order_number,
          amount: { currency_code: targetCurrency, value: amount.toFixed(2) },
          description: `Order ${order.order_number}`,
        }],
        application_context: {
          brand_name: 'Shahed Store',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING',
          return_url: `${origin}/checkout?paypal=success&order=${order.id}`,
          cancel_url: `${origin}/checkout?paypal=cancel&order=${order.id}`,
        },
      }),
    });
    const ppData = await ppRes.json();
    if (!ppRes.ok || !ppData.id) {
      logPP('create failed', ppData);
      return jsonResponse({ error: 'PayPal create failed', details: ppData }, 502);
    }

    // Store transaction
    await supabase.from('paypal_transactions').upsert({
      paypal_order_id: ppData.id,
      order_id: order.id,
      order_number: order.order_number,
      user_id: order.user_id,
      amount,
      currency: targetCurrency,
      status: 'created',
      mode: cfg.mode,
      raw_create: ppData,
    }, { onConflict: 'paypal_order_id' });

    await supabase.from('orders').update({ paypal_order_id: ppData.id }).eq('id', order.id);

    return jsonResponse({ id: ppData.id, mode: cfg.mode, amount, currency: targetCurrency });
  } catch (err) {
    logPP('create error', err);
    return jsonResponse({ error: (err as Error).message || 'Internal error' }, 500);
  }
});
