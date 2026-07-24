// SSLCommerz IPN + Success/Fail/Cancel handler
// Called by SSLCommerz server (IPN) and by browser redirects (success/fail/cancel).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'ipn';
  const redirectBase = url.searchParams.get('redirect') || '/';

  // SSLCommerz posts application/x-www-form-urlencoded
  let params: Record<string, string> = {};
  if (req.method === 'POST') {
    const ct = req.headers.get('content-type') || '';
    if (ct.includes('application/x-www-form-urlencoded')) {
      const raw = await req.text();
      params = Object.fromEntries(new URLSearchParams(raw).entries());
    } else if (ct.includes('application/json')) {
      params = await req.json().catch(() => ({}));
    }
  } else {
    params = Object.fromEntries(url.searchParams.entries());
  }

  const tranId = params.tran_id || params.value_a || '';
  const status = (params.status || '').toUpperCase();
  const valId = params.val_id || '';
  const amount = params.amount || '';

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // For IPN and success, validate against SSLCommerz Validation API
    let validated = false;
    if ((type === 'ipn' || type === 'success') && valId) {
      const { data: cfgRow } = await supabase
        .from('site_settings').select('value').eq('key', 'sslcommerz_pgw_config').maybeSingle();
      const cfg = cfgRow?.value ? JSON.parse(cfgRow.value) : null;
      if (cfg?.store_id && cfg?.store_password) {
        const vBase = cfg.mode === 'live'
          ? 'https://securepay.sslcommerz.com'
          : 'https://sandbox.sslcommerz.com';
        const vUrl = `${vBase}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(valId)}&store_id=${encodeURIComponent(cfg.store_id)}&store_passwd=${encodeURIComponent(cfg.store_password)}&v=1&format=json`;
        const vRes = await fetch(vUrl);
        const vJson = await vRes.json().catch(() => ({}));
        validated = vJson?.status === 'VALID' || vJson?.status === 'VALIDATED';
      }
    }

    // Update order payment status (only if the order exists — safe no-op otherwise)
    if (tranId) {
      const paid = validated || status === 'VALID' || status === 'VALIDATED';
      const nextStatus = type === 'cancel' ? 'cancelled'
        : type === 'fail' ? 'failed'
        : paid ? 'paid' : 'pending';

      await supabase
        .from('orders')
        .update({
          payment_status: nextStatus,
          payment_gateway: 'sslcommerz',
          gateway_txn_id: valId || null,
        })
        .eq('order_number', tranId);
    }
  } catch (err) {
    console.error('SSLCommerz IPN error', err);
  }

  // IPN response = plain 200 to acknowledge
  if (type === 'ipn') {
    return new Response('OK', { status: 200, headers: corsHeaders });
  }

  // Browser flows: 302 redirect back to the storefront
  const dest = new URL(redirectBase);
  dest.searchParams.set('sslc', type);
  if (tranId) dest.searchParams.set('order', tranId);
  if (amount) dest.searchParams.set('amount', amount);
  return new Response(null, {
    status: 302,
    headers: { ...corsHeaders, Location: dest.toString() },
  });
});
