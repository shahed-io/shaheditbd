// POST /paypal-refund  (admin only)
// body: { transactionId: string, amount?: number, note?: string }
// Refunds a captured PayPal payment (full or partial).
import { corsHeaders, jsonResponse, loadPayPalConfig, logPP, paypalAccessToken, paypalBaseUrl, serviceClient } from '../_shared/paypal.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const forbidden = await requireAdmin(req);
  if (forbidden) return forbidden;

  try {
    const { transactionId, amount, note } = await req.json().catch(() => ({}));
    if (!transactionId) return jsonResponse({ error: 'transactionId required' }, 400);

    const supabase = serviceClient();
    const cfg = await loadPayPalConfig(supabase);

    const { data: tx } = await supabase.from('paypal_transactions')
      .select('*').eq('id', transactionId).maybeSingle();
    if (!tx) return jsonResponse({ error: 'Transaction not found' }, 404);
    if (!tx.paypal_capture_id) return jsonResponse({ error: 'Not captured yet' }, 400);

    const token = await paypalAccessToken(cfg);
    const body: any = { note_to_payer: note || 'Refund issued' };
    if (amount && Number(amount) > 0 && Number(amount) < Number(tx.amount)) {
      body.amount = { value: Number(amount).toFixed(2), currency_code: tx.currency };
    }

    const refRes = await fetch(`${paypalBaseUrl(cfg.mode)}/v2/payments/captures/${tx.paypal_capture_id}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'PayPal-Request-Id': `refund-${tx.id}-${Date.now()}`,
      },
      body: JSON.stringify(body),
    });
    const refData = await refRes.json();
    if (!refRes.ok || refData?.status === 'FAILED') {
      logPP('refund failed', refData);
      return jsonResponse({ error: 'Refund failed', details: refData }, 502);
    }

    const refundedAmt = Number(refData?.amount?.value || amount || tx.amount);
    const newRefunded = Number(tx.refunded_amount || 0) + refundedAmt;
    const fullyRefunded = newRefunded >= Number(tx.amount);

    await supabase.from('paypal_transactions').update({
      status: fullyRefunded ? 'refunded' : 'partially_refunded',
      refunded_amount: newRefunded,
      raw_refund: refData,
    }).eq('id', tx.id);

    if (tx.order_id && fullyRefunded) {
      await supabase.from('orders').update({
        payment_status: 'refunded',
        status: 'refunded',
      }).eq('id', tx.order_id);
    }

    return jsonResponse({ success: true, refunded: refundedAmt, fullyRefunded });
  } catch (err) {
    logPP('refund error', err);
    return jsonResponse({ error: (err as Error).message || 'Internal error' }, 500);
  }
});
