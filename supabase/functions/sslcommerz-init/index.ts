// SSLCommerz session init — creates a payment session and returns GatewayPageURL
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

const BodySchema = z.object({
  order_id: z.string().min(1).max(120),
  amount: z.number().positive(),
  currency: z.string().default('BDT'),
  customer_name: z.string().min(1).max(200),
  customer_email: z.string().email(),
  customer_phone: z.string().min(3).max(30),
  customer_address: z.string().max(500).optional().default('N/A'),
  product_name: z.string().max(200).optional().default('Order'),
  return_base_url: z.string().url(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const p = parsed.data;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: cfgRow } = await supabase
      .from('site_settings').select('value').eq('key', 'sslcommerz_pgw_config').maybeSingle();
    const cfg = cfgRow?.value ? JSON.parse(cfgRow.value) : null;
    if (!cfg?.is_active) {
      return new Response(JSON.stringify({ error: 'SSLCommerz is not enabled' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!cfg.store_id || !cfg.store_password) {
      return new Response(JSON.stringify({ error: 'SSLCommerz credentials are not configured' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const base = cfg.mode === 'live'
      ? 'https://securepay.sslcommerz.com'
      : 'https://sandbox.sslcommerz.com';

    const fnUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/sslcommerz-ipn`;

    const body = new URLSearchParams();
    body.set('store_id', cfg.store_id);
    body.set('store_passwd', cfg.store_password);
    body.set('total_amount', String(p.amount));
    body.set('currency', p.currency);
    body.set('tran_id', p.order_id);
    body.set('success_url', `${fnUrl}?type=success&redirect=${encodeURIComponent(p.return_base_url)}`);
    body.set('fail_url', `${fnUrl}?type=fail&redirect=${encodeURIComponent(p.return_base_url)}`);
    body.set('cancel_url', `${fnUrl}?type=cancel&redirect=${encodeURIComponent(p.return_base_url)}`);
    body.set('ipn_url', `${fnUrl}?type=ipn`);
    body.set('cus_name', p.customer_name);
    body.set('cus_email', p.customer_email);
    body.set('cus_add1', p.customer_address);
    body.set('cus_city', 'Dhaka');
    body.set('cus_country', 'Bangladesh');
    body.set('cus_phone', p.customer_phone);
    body.set('shipping_method', 'NO');
    body.set('num_of_item', '1');
    body.set('product_name', p.product_name);
    body.set('product_category', 'Digital');
    body.set('product_profile', 'general');

    const res = await fetch(`${base}/gwprocess/v4/api.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const json = await res.json();
    if (json.status !== 'SUCCESS' || !json.GatewayPageURL) {
      return new Response(JSON.stringify({ error: 'SSLCommerz init failed', details: json }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      gateway_url: json.GatewayPageURL,
      session_key: json.sessionkey,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
