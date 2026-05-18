// bKash Tokenized Checkout — Create Payment
// Creates a bKash hosted-checkout session for an existing pending order.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface BkashCfg {
  mode: string;
  app_key: string;
  app_secret: string;
  username: string;
  password: string;
  is_active: boolean;
}

async function loadConfig(supabase: ReturnType<typeof createClient>): Promise<BkashCfg> {
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'bkash_pgw_config')
    .maybeSingle();
  let cfg: Partial<BkashCfg> = {};
  if (data?.value) {
    try { cfg = JSON.parse(data.value); } catch { /* ignore */ }
  }
  return {
    mode: (cfg.mode || Deno.env.get('BKASH_MODE') || 'sandbox').toLowerCase(),
    app_key: cfg.app_key || Deno.env.get('BKASH_APP_KEY') || '',
    app_secret: cfg.app_secret || Deno.env.get('BKASH_APP_SECRET') || '',
    username: cfg.username || Deno.env.get('BKASH_USERNAME') || '',
    password: cfg.password || Deno.env.get('BKASH_PASSWORD') || '',
    is_active: cfg.is_active !== false,
  };
}

function baseUrl(mode: string) {
  return mode === 'live'
    ? 'https://tokenized.pay.bka.sh/v1.2.0-beta'
    : 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';
}

async function grantToken(cfg: BkashCfg): Promise<string> {
  const res = await fetch(`${baseUrl(cfg.mode)}/tokenized/checkout/token/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'username': cfg.username,
      'password': cfg.password,
    },
    body: JSON.stringify({ app_key: cfg.app_key, app_secret: cfg.app_secret }),
  });
  const data = await res.json();
  if (!data?.id_token) {
    throw new Error('bKash token grant failed: ' + JSON.stringify(data));
  }
  return data.id_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const cfg = await loadConfig(supabase);

    if (!cfg.is_active) {
      return new Response(JSON.stringify({ error: 'bKash PGW is disabled' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!cfg.app_key || !cfg.app_secret || !cfg.username || !cfg.password) {
      return new Response(JSON.stringify({ error: 'bKash credentials not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { orderId, amount, orderNumber, payerReference, customerPhone } = body;
    const purpose: string = body.purpose === 'wallet_topup' ? 'wallet_topup' : 'order';
    const userId: string | undefined = body.userId;

    if (!amount) {
      return new Response(JSON.stringify({ error: 'amount required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let order: any = null;
    let topupRequestId: string | null = null;
    let merchantInvoiceBase = orderNumber;

    if (purpose === 'order') {
      if (!orderId || !orderNumber) {
        return new Response(JSON.stringify({ error: 'orderId, orderNumber required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: o, error: orderErr } = await supabase
        .from('orders')
        .select('id, order_number, total, payment_status, status, user_id, customer_name, customer_email, customer_phone')
        .eq('id', orderId)
        .single();
      if (orderErr || !o) {
        return new Response(JSON.stringify({ error: 'Order not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (o.payment_status === 'paid') {
        return new Response(JSON.stringify({ error: 'Order already paid' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      order = o;
    } else {
      // wallet_topup
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId required for wallet topup' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // Create a pending top-up request placeholder; TrxID will be updated after bKash success
      const { data: topup, error: topupErr } = await supabase
        .from('wallet_topup_requests')
        .insert({
          user_id: userId,
          amount: Number(amount),
          payment_method: 'bkash_online',
          transaction_id: 'PENDING-BKASH',
          status: 'pending',
        })
        .select('id')
        .single();
      if (topupErr || !topup) {
        return new Response(JSON.stringify({ error: 'Failed to create topup request', details: topupErr?.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      topupRequestId = topup.id;
      merchantInvoiceBase = `TOPUP-${topup.id.slice(0, 8).toUpperCase()}`;
    }

    const token = await grantToken(cfg);

    const callbackURL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/bkash-callback`;
    const merchantInvoiceNumber = String(orderNumber).slice(0, 36);
    const amountStr = Number(amount).toFixed(2);

    const createRes = await fetch(`${baseUrl(cfg.mode)}/tokenized/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token,
        'X-APP-Key': cfg.app_key,
      },
      body: JSON.stringify({
        mode: '0011',
        payerReference: payerReference || customerPhone || merchantInvoiceNumber,
        callbackURL,
        amount: amountStr,
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber,
      }),
    });

    const createData = await createRes.json();

    if (createData?.statusCode !== '0000' || !createData?.bkashURL) {
      console.error('[bkash-create] failed', createData);
      // Log failed initiation
      await supabase.from('bkash_transactions').insert({
        order_id: order.id,
        order_number: order.order_number,
        user_id: order.user_id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        payer_reference: payerReference || customerPhone || merchantInvoiceNumber,
        amount: Number(amount),
        status: 'failed',
        mode: cfg.mode,
        status_code: createData?.statusCode || null,
        status_message: createData?.statusMessage || 'create failed',
        raw_create: createData,
      });
      return new Response(JSON.stringify({ error: 'bKash create failed', details: createData }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save paymentID to order so callback can match
    await supabase
      .from('orders')
      .update({
        transaction_id: createData.paymentID,
        payment_status: 'pending',
      })
      .eq('id', orderId);

    // Log initiated transaction
    await supabase.from('bkash_transactions').insert({
      payment_id: createData.paymentID,
      order_id: order.id,
      order_number: order.order_number,
      user_id: order.user_id,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      payer_reference: payerReference || customerPhone || merchantInvoiceNumber,
      amount: Number(amount),
      status: 'initiated',
      mode: cfg.mode,
      status_code: createData.statusCode,
      status_message: createData.statusMessage || null,
      raw_create: createData,
    });

    return new Response(JSON.stringify({
      paymentID: createData.paymentID,
      bkashURL: createData.bkashURL,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[bkash-create] error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
