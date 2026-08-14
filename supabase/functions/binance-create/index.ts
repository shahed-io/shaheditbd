// Binance Pay: create a hosted checkout order.
// Loads merchant config from site_settings (admin controlled), converts the
// order total (BDT) into the configured crypto currency and returns checkoutUrl.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

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

    const { data: cfgRow } = await supabase
      .from('site_settings').select('value').eq('key', 'binance_pgw_config').maybeSingle();
    if (!cfgRow?.value) return json({ error: 'Binance Pay not configured' }, 400);
    let cfg: any;
    try { cfg = JSON.parse(cfgRow.value); } catch { return json({ error: 'Invalid config' }, 500); }
    if (!cfg.is_active) return json({ error: 'Binance Pay disabled' }, 400);
    if (!cfg.api_key || !cfg.api_secret) return json({ error: 'Binance Pay credentials missing' }, 400);

    const { data: order, error: oErr } = await supabase
      .from('orders')
      .select('id, order_number, total, customer_name, payment_status')
      .eq('id', orderId).maybeSingle();
    if (oErr || !order) return json({ error: 'Order not found' }, 404);
    if (order.payment_status === 'verified' || order.payment_status === 'paid') {
      return json({ error: 'Order already paid' }, 409);
    }

    const rate = Number(cfg.bdt_rate) > 0 ? Number(cfg.bdt_rate) : 120;
    const currency = String(cfg.currency || 'USDT').toUpperCase();
    const amount = Math.max(0.01, Number((Number(order.total) / rate).toFixed(2)));

    const mtn = `${String(order.order_number).replace(/[^a-zA-Z0-9]/g, '')}${Date.now().toString(36).toUpperCase()}`.slice(0, 32);
    const origin = req.headers.get('origin') || 'https://shahedstore.com.bd';
    const base = String(cfg.base_url || 'https://bpay.binanceapi.com').replace(/\/+$/, '');

    const body = JSON.stringify({
      env: { terminalType: 'WEB' },
      merchantTradeNo: mtn,
      orderAmount: amount,
      currency,
      description: `Order ${order.order_number}`,
      goods: {
        goodsType: '02',
        goodsCategory: 'Z000',
        referenceGoodsId: order.order_number,
        goodsName: `Order ${order.order_number}`,
      },
      returnUrl: `${origin}/binance/return?order_id=${order.id}&mtn=${mtn}`,
      cancelUrl: `${origin}/checkout?binance=cancelled`,
      webhookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/binance-webhook`,
    });

    const timestamp = Date.now().toString();
    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[b % 62]).join('');
    const signature = await sign(`${timestamp}\n${nonce}\n${body}\n`, cfg.api_secret);

    const res = await fetch(`${base}/binancepay/openapi/v3/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'BinancePay-Timestamp': timestamp,
        'BinancePay-Nonce': nonce,
        'BinancePay-Certificate-SN': cfg.api_key,
        'BinancePay-Signature': signature,
      },
      body,
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || out?.status !== 'SUCCESS' || !out?.data?.checkoutUrl) {
      console.error('[binance-create] upstream error', res.status, out?.code, out?.errorMessage);
      return json({ error: out?.errorMessage || 'Binance Pay create failed' }, 502);
    }

    // Keep a reference so webhook/verify can map the trade back to this order.
    await supabase.from('orders').update({ transaction_id: `BINANCE-${mtn}` }).eq('id', order.id);

    return json({
      payment_url: out.data.checkoutUrl,
      merchant_trade_no: mtn,
      prepay_id: out.data.prepayId ?? null,
      amount, currency,
    });
  } catch (e: any) {
    console.error('[binance-create] error', e);
    return json({ error: e?.message || 'Internal error' }, 500);
  }
});
