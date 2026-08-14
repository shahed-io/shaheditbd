// Binance Pay webhook. Never trusts the payload alone — it re-queries the
// trade with the merchant credentials before marking an order paid.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

async function queryTrade(cfg: any, merchantTradeNo: string) {
  const base = String((cfg.sandbox === true ? (cfg.sandbox_base_url || cfg.base_url) : cfg.base_url) || 'https://bpay.binanceapi.com').replace(/\/+$/, '');
  const body = JSON.stringify({ merchantTradeNo });
  const timestamp = Date.now().toString();
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[b % 62]).join('');
  const signature = await sign(`${timestamp}\n${nonce}\n${body}\n`, cfg.api_secret);
  const res = await fetch(`${base}/binancepay/openapi/v2/order/query`, {
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
  return await res.json().catch(() => ({}));
}

const ack = (msg = 'SUCCESS') =>
  new Response(JSON.stringify({ returnCode: msg, returnMessage: null }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  try {
    const payload = await req.json().catch(() => ({} as any));
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: cfgRow } = await supabase
      .from('site_settings').select('value').eq('key', 'binance_pgw_config').maybeSingle();
    if (!cfgRow?.value) return ack('FAIL');
    const cfg = JSON.parse(cfgRow.value);
    if (!cfg.api_key || !cfg.api_secret) return ack('FAIL');

    let inner: any = {};
    try { inner = typeof payload?.data === 'string' ? JSON.parse(payload.data) : (payload?.data || {}); } catch { /* ignore */ }
    const mtn = inner?.merchantTradeNo || payload?.merchantTradeNo;
    if (!mtn) return ack('FAIL');

    const out = await queryTrade(cfg, String(mtn));
    const status = String(out?.data?.status || '').toUpperCase();

    const { data: order } = await supabase
      .from('orders').select('id, payment_status').eq('transaction_id', `BINANCE-${mtn}`).maybeSingle();
    if (!order) return ack();

    if (out?.status === 'SUCCESS' && status === 'PAID') {
      await supabase.from('orders').update({
        payment_status: 'paid',
        status: 'processing',
        transaction_id: out?.data?.transactionId || `BINANCE-${mtn}`,
      }).eq('id', order.id);
    } else if (status === 'EXPIRED' || status === 'CANCELED' || status === 'ERROR') {
      await supabase.from('orders').update({ payment_status: 'failed' }).eq('id', order.id);
    }

    return ack();
  } catch (e: any) {
    console.error('[binance-webhook] error', e);
    return ack('FAIL');
  }
});
