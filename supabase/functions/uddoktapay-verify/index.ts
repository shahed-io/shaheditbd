// Uddoktapay: verify payment by invoice_id and mark order paid.
// Used from the return URL page after the customer is redirected back.
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
    const { invoice_id, order_id } = await req.json();
    if (!invoice_id) return json({ error: 'invoice_id required' }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: cfgRow } = await supabase
      .from('site_settings').select('value').eq('key', 'uddoktapay_pgw_config').maybeSingle();
    if (!cfgRow?.value) return json({ error: 'Uddoktapay not configured' }, 400);
    const cfg = JSON.parse(cfgRow.value);
    const base = String(cfg.base_url).replace(/\/+$/, '');

    const vRes = await fetch(`${base}/api/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'RT-UDDOKTAPAY-API-KEY': cfg.api_key,
      },
      body: JSON.stringify({ invoice_id }),
    });
    const vJson = await vRes.json().catch(() => ({}));
    const status = String(vJson?.status || '').toUpperCase();
    const paid = status === 'COMPLETED' || status === 'PAID';

    if (paid && order_id) {
      // Trust only the invoice's own metadata — never the client-supplied order_id alone
      const invoiceOrderId = vJson?.metadata?.order_id;
      if (!invoiceOrderId || String(invoiceOrderId) !== String(order_id)) {
        console.warn('[uddoktapay-verify] order_id mismatch for invoice');
        return json({ paid: false, error: 'Invoice does not belong to this order' }, 403);
      }

      const { data: order } = await supabase
        .from('orders').select('id, total, payment_status').eq('id', order_id).maybeSingle();
      if (!order) return json({ paid: false, error: 'Order not found' }, 404);

      const verifiedAmount = Number(vJson?.amount ?? NaN);
      if (!Number.isFinite(verifiedAmount) || verifiedAmount + 0.01 < Number(order.total)) {
        console.warn('[uddoktapay-verify] amount mismatch');
        return json({ paid: false, error: 'Paid amount does not match order total' }, 403);
      }

      await supabase.from('orders').update({
        payment_status: 'paid',
        status: 'processing',
        transaction_id: vJson?.transaction_id || invoice_id,
      }).eq('id', order_id);
    }

    return json({ paid });

  } catch (e: any) {
    console.error('[uddoktapay-verify] error', e);
    return json({ error: e?.message || 'Internal error' }, 500);
  }
});
