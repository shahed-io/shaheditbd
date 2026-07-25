// POST /paypal-capture-order
// body: { paypalOrderId: string }
// Captures the PayPal payment on the backend, verifies COMPLETED status,
// updates the linked order + records the capture.
import { corsHeaders, jsonResponse, loadPayPalConfig, logPP, paypalAccessToken, paypalBaseUrl, serviceClient } from '../_shared/paypal.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const { paypalOrderId } = await req.json().catch(() => ({}));
    if (!paypalOrderId || typeof paypalOrderId !== 'string') {
      return jsonResponse({ error: 'paypalOrderId required' }, 400);
    }

    const supabase = serviceClient();
    const cfg = await loadPayPalConfig(supabase);
    const token = await paypalAccessToken(cfg);

    // Look up our tx first
    const { data: tx } = await supabase
      .from('paypal_transactions')
      .select('*')
      .eq('paypal_order_id', paypalOrderId)
      .maybeSingle();
    if (!tx) return jsonResponse({ error: 'Unknown PayPal order' }, 404);
    if (tx.status === 'captured') {
      return jsonResponse({ success: true, alreadyCaptured: true, orderId: tx.order_id });
    }

    const capRes = await fetch(`${paypalBaseUrl(cfg.mode)}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const capData = await capRes.json();
    const capture = capData?.purchase_units?.[0]?.payments?.captures?.[0];
    const status = capture?.status || capData?.status;

    if (!capRes.ok || status !== 'COMPLETED') {
      logPP('capture not completed', capData);
      await supabase.from('paypal_transactions').update({
        status: 'failed',
        raw_capture: capData,
        error_message: capData?.message || 'Capture not completed',
      }).eq('id', tx.id);
      return jsonResponse({ error: 'Capture failed', details: capData }, 502);
    }

    const payer = capData?.payer || {};
    const payerEmail = payer?.email_address || null;
    const payerId = payer?.payer_id || null;
    const payerName = [payer?.name?.given_name, payer?.name?.surname].filter(Boolean).join(' ') || null;
    const captureId = capture.id;
    const amount = Number(capture?.amount?.value || tx.amount);
    const currency = capture?.amount?.currency_code || tx.currency;
    const paidAt = new Date().toISOString();

    await supabase.from('paypal_transactions').update({
      status: 'captured',
      paypal_capture_id: captureId,
      transaction_id: captureId,
      payer_email: payerEmail,
      payer_id: payerId,
      payer_name: payerName,
      amount,
      currency,
      raw_capture: capData,
      paid_at: paidAt,
    }).eq('id', tx.id);

    // Update the order
    if (tx.order_id) {
      await supabase.from('orders').update({
        payment_status: 'verified',
        status: 'processing',
        payment_method: 'paypal',
        paypal_order_id: paypalOrderId,
        paypal_capture_id: captureId,
        paid_at: paidAt,
        updated_at: new Date().toISOString(),
      }).eq('id', tx.order_id);

      // Assign license keys (reuse verify-payment approach)
      try {
        const { data: items } = await supabase
          .from('order_items')
          .select('id, product_id, product_name, quantity')
          .eq('order_id', tx.order_id);
        for (const item of items || []) {
          if (!item.product_id) continue;
          const variantMatch = (item.product_name || '').match(/\(([^()]+)\)\s*$/);
          const variant = variantMatch ? variantMatch[1].trim() : null;
          let keys: any[] = [];
          if (variant) {
            const { data } = await supabase.from('license_keys')
              .select('id, key_value').eq('product_id', item.product_id)
              .eq('variant', variant).eq('status', 'available').limit(item.quantity);
            keys = data || [];
          }
          if (keys.length < item.quantity) {
            const { data } = await supabase.from('license_keys')
              .select('id, key_value').eq('product_id', item.product_id)
              .is('variant', null).eq('status', 'available')
              .limit(item.quantity - keys.length);
            keys = [...keys, ...(data || [])];
          }
          for (const k of keys) {
            await supabase.from('license_keys').update({
              status: 'assigned',
              order_item_id: item.id,
              assigned_at: paidAt,
            }).eq('id', k.id);
            await supabase.from('order_items').update({ license_key: k.key_value }).eq('id', item.id);
          }
        }
      } catch (e) { logPP('license assign error', e); }

      // Fire order confirmation email (existing edge function)
      try {
        await supabase.functions.invoke('send-order-email', {
          body: { orderId: tx.order_id, type: 'payment_success' },
        });
      } catch (e) { logPP('email invoke failed', e); }

      // Send transactional payment-success email
      try {
        const { data: ord } = await supabase.from('orders')
          .select('order_number, customer_email, customer_name')
          .eq('id', tx.order_id).maybeSingle();
        if (ord?.customer_email) {
          await supabase.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'payment-success',
              recipientEmail: ord.customer_email,
              idempotencyKey: `paypal-${captureId}`,
              templateData: {
                customerName: ord.customer_name || 'Customer',
                amount: amount.toFixed(2),
                currency,
                orderNumber: ord.order_number,
                paymentMethod: 'PayPal',
                transactionId: captureId,
                paidAt: new Date(paidAt).toUTCString(),
              },
            },
          });
        }
      } catch (e) { logPP('transactional email failed', e); }
    }

    return jsonResponse({
      success: true,
      captureId,
      orderId: tx.order_id,
      amount,
      currency,
    });
  } catch (err) {
    logPP('capture error', err);
    return jsonResponse({ error: (err as Error).message || 'Internal error' }, 500);
  }
});
