// Binance Pay: query a trade and mark the order paid when confirmed.
// Used by the return page and by the webhook (server-side re-check).
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

export async function queryTrade(cfg: any, merchantTradeNo: string) {
  const base = String(cfg.base_url || 'https://bpay.binanceapi.com').replace(/\/+$/, '');
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const { merchant_trade_no, order_id } = await req.json();
    if (!merchant_trade_no) return json({ error: 'merchant_trade_no required' }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: cfgRow } = await supabase
      .from('site_settings').select('value').eq('key', 'binance_pgw_config').maybeSingle();
    if (!cfgRow?.value) return json({ error: 'Binance Pay not configured' }, 400);
    const cfg = JSON.parse(cfgRow.value);

    // Sandbox demo trade: no upstream call, treat an explicit approval as paid.
    if (cfg.sandbox === true && String(merchant_trade_no).startsWith('DEMO')) {
      let targetDemo: string | null = order_id ?? null;
      if (!targetDemo) {
        const { data: row } = await supabase
          .from('orders').select('id').eq('transaction_id', `BINANCE-${merchant_trade_no}`).maybeSingle();
        targetDemo = row?.id ?? null;
      }
      if (targetDemo) {
        await supabase.from('orders').update({
          payment_status: 'paid',
          status: 'processing',
          transaction_id: `BINANCE-SANDBOX-${merchant_trade_no}`,
        }).eq('id', targetDemo);
      }
      return json({ paid: true, status: 'PAID', sandbox: true, order_id: targetDemo });
    }

    const out = await queryTrade(cfg, String(merchant_trade_no));
    const status = String(out?.data?.status || '').toUpperCase();
    const paid = out?.status === 'SUCCESS' && status === 'PAID';

    // Resolve the order: explicit id, else via the stored transaction reference.
    let targetId: string | null = order_id ?? null;
    if (!targetId) {
      const { data: row } = await supabase
        .from('orders').select('id').eq('transaction_id', `BINANCE-${merchant_trade_no}`).maybeSingle();
      targetId = row?.id ?? null;
    }

    if (paid && targetId) {
      await supabase.from('orders').update({
        payment_status: 'paid',
        status: 'processing',
        transaction_id: out?.data?.transactionId || `BINANCE-${merchant_trade_no}`,
      }).eq('id', targetId);
    }

    return json({ paid, status, order_id: targetId });
  } catch (e: any) {
    console.error('[binance-verify] error', e);
    return json({ error: e?.message || 'Internal error' }, 500);
  }
});
