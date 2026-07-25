// POST /paypal-webhook
// Verifies PayPal webhook signature via /v1/notifications/verify-webhook-signature
// then processes CHECKOUT.ORDER.APPROVED / PAYMENT.CAPTURE.COMPLETED /
// PAYMENT.CAPTURE.REFUNDED / DENIED events.
import { corsHeaders, jsonResponse, loadPayPalConfig, logPP, paypalAccessToken, paypalBaseUrl, serviceClient } from '../_shared/paypal.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const supabase = serviceClient();
    const cfg = await loadPayPalConfig(supabase);
    const rawBody = await req.text();
    let event: any;
    try { event = JSON.parse(rawBody); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }

    // Verify signature
    if (cfg.webhook_id) {
      const token = await paypalAccessToken(cfg);
      const verifyRes = await fetch(`${paypalBaseUrl(cfg.mode)}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          auth_algo: req.headers.get('paypal-auth-algo'),
          cert_url: req.headers.get('paypal-cert-url'),
          transmission_id: req.headers.get('paypal-transmission-id'),
          transmission_sig: req.headers.get('paypal-transmission-sig'),
          transmission_time: req.headers.get('paypal-transmission-time'),
          webhook_id: cfg.webhook_id,
          webhook_event: event,
        }),
      });
      const verify = await verifyRes.json();
      if (verify?.verification_status !== 'SUCCESS') {
        logPP('webhook signature failed', verify);
        return jsonResponse({ error: 'Invalid signature' }, 401);
      }
    } else {
      logPP('WARN: PAYPAL_WEBHOOK_ID not set — skipping verification');
    }

    const type = event?.event_type;
    const resource = event?.resource || {};
    logPP('webhook', type, resource?.id);

    // Find our tx: link via supplementary_data.related_ids.order_id (capture events)
    // or resource.id (order events)
    const linkedOrderId = resource?.supplementary_data?.related_ids?.order_id
      || (type?.startsWith('CHECKOUT.ORDER.') ? resource?.id : null);

    if (type === 'PAYMENT.CAPTURE.COMPLETED' && linkedOrderId) {
      // Idempotent: only update if not yet captured
      const { data: tx } = await supabase.from('paypal_transactions')
        .select('id, status, order_id').eq('paypal_order_id', linkedOrderId).maybeSingle();
      if (tx && tx.status !== 'captured') {
        const paidAt = new Date().toISOString();
        await supabase.from('paypal_transactions').update({
          status: 'captured',
          paypal_capture_id: resource.id,
          transaction_id: resource.id,
          amount: Number(resource?.amount?.value || 0),
          currency: resource?.amount?.currency_code,
          paid_at: paidAt,
          raw_webhook: event,
        }).eq('id', tx.id);
        if (tx.order_id) {
          await supabase.from('orders').update({
            payment_status: 'verified',
            status: 'processing',
            payment_method: 'paypal',
            paypal_capture_id: resource.id,
            paid_at: paidAt,
          }).eq('id', tx.order_id);
        }
      }
    } else if (type === 'PAYMENT.CAPTURE.REFUNDED' || type === 'PAYMENT.CAPTURE.REVERSED') {
      const captureId = resource?.links?.find((l: any) => l.rel === 'up')?.href?.split('/').pop() || resource?.id;
      const { data: tx } = await supabase.from('paypal_transactions')
        .select('id, order_id, amount, refunded_amount')
        .eq('paypal_capture_id', captureId).maybeSingle();
      if (tx) {
        const refundAmt = Number(resource?.amount?.value || 0);
        const newRefunded = Number(tx.refunded_amount || 0) + refundAmt;
        const fullyRefunded = newRefunded >= Number(tx.amount);
        await supabase.from('paypal_transactions').update({
          status: fullyRefunded ? 'refunded' : 'partially_refunded',
          refunded_amount: newRefunded,
          raw_refund: resource,
          raw_webhook: event,
        }).eq('id', tx.id);
        if (tx.order_id && fullyRefunded) {
          await supabase.from('orders').update({
            payment_status: 'refunded',
            status: 'refunded',
          }).eq('id', tx.order_id);
        }
      }
    } else if (type === 'PAYMENT.CAPTURE.DENIED' || type === 'CHECKOUT.ORDER.VOIDED') {
      const target = linkedOrderId || resource?.id;
      await supabase.from('paypal_transactions').update({
        status: 'failed',
        raw_webhook: event,
        error_message: type,
      }).eq('paypal_order_id', target);
    }

    return jsonResponse({ received: true });
  } catch (err) {
    logPP('webhook error', err);
    return jsonResponse({ error: (err as Error).message || 'Internal error' }, 500);
  }
});
