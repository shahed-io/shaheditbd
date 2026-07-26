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
    const paid = status === 'COMPLETED' || status === 'PAID' || vJson?.status === 'COMPLETED';

    if (paid && order_id) {
      await supabase.from('orders').update({
        payment_status: 'paid',
        status: 'processing',
        transaction_id: vJson?.transaction_id || invoice_id,
      }).eq('id', order_id);
    }

    return json({ paid, raw: vJson });
  } catch (e: any) {
    console.error('[uddoktapay-verify] error', e);
    return json({ error: e?.message || 'Internal error' }, 500);
  }
});
