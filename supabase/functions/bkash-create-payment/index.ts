// bKash Tokenized Checkout — Create Payment
// Creates a bKash hosted-checkout session for an existing pending order.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MODE = (Deno.env.get('BKASH_MODE') || 'sandbox').toLowerCase();
const BASE = MODE === 'live'
  ? 'https://tokenized.pay.bka.sh/v1.2.0-beta'
  : 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';

const APP_KEY = Deno.env.get('BKASH_APP_KEY') || '';
const APP_SECRET = Deno.env.get('BKASH_APP_SECRET') || '';
const USERNAME = Deno.env.get('BKASH_USERNAME') || '';
const PASSWORD = Deno.env.get('BKASH_PASSWORD') || '';

async function grantToken(): Promise<string> {
  const res = await fetch(`${BASE}/tokenized/checkout/token/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'username': USERNAME,
      'password': PASSWORD,
    },
    body: JSON.stringify({ app_key: APP_KEY, app_secret: APP_SECRET }),
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
    if (!APP_KEY || !APP_SECRET || !USERNAME || !PASSWORD) {
      return new Response(JSON.stringify({ error: 'bKash credentials not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { orderId, amount, orderNumber, payerReference } = await req.json();
    if (!orderId || !amount || !orderNumber) {
      return new Response(JSON.stringify({ error: 'orderId, amount, orderNumber required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify order exists & is pending
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, order_number, total, payment_status, status')
      .eq('id', orderId)
      .single();
    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (order.payment_status === 'paid') {
      return new Response(JSON.stringify({ error: 'Order already paid' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = await grantToken();

    const callbackURL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/bkash-callback`;
    const merchantInvoiceNumber = String(orderNumber).slice(0, 36);
    const amountStr = Number(amount).toFixed(2);

    const createRes = await fetch(`${BASE}/tokenized/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token,
        'X-APP-Key': APP_KEY,
      },
      body: JSON.stringify({
        mode: '0011',
        payerReference: payerReference || merchantInvoiceNumber,
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
