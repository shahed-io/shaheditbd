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

    // NEVER trust the client-supplied `status` param. Payment success is only
    // derived from the server-to-server SSLCommerz Validation API response,
    // and the validated amount/currency must match the stored order total.
    let validated = false;
    let validatedAmount: number | null = null;
    let validatedCurrency = '';
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
        const okStatus = vJson?.status === 'VALID' || vJson?.status === 'VALIDATED';
        // The validator must reference the same transaction we were told about
        const sameTran = !tranId || String(vJson?.tran_id || '') === String(tranId);
        validatedAmount = Number(vJson?.currency_amount ?? vJson?.amount ?? NaN);
        validatedCurrency = String(vJson?.currency || 'BDT').toUpperCase();
        validated = okStatus && sameTran && Number.isFinite(validatedAmount);
      }
    }

    // Update order payment status (only if the order exists — safe no-op otherwise)
    if (tranId) {
      const { data: order } = await supabase
        .from('orders')
        .select('id,total')
        .eq('order_number', tranId)
        .maybeSingle();

      // Amount integrity: validated amount must cover the order total (BDT)
      const amountOk = validated && order
        && validatedCurrency === 'BDT'
        && Math.abs(Number(validatedAmount) - Number(order.total)) < 1;

      if (validated && !amountOk) {
        console.error('SSLCommerz amount/currency mismatch', {
          tranId, validatedAmount, validatedCurrency, orderTotal: order?.total,
        });
      }

      const nextStatus = type === 'cancel' ? 'cancelled'
        : type === 'fail' ? 'failed'
        : amountOk ? 'paid' : 'pending';

      if (order) {
        await supabase
          .from('orders')
          .update({
            payment_status: nextStatus,
            payment_gateway: 'sslcommerz',
            gateway_txn_id: amountOk ? (valId || null) : null,
          })
          .eq('id', order.id);
      }
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
