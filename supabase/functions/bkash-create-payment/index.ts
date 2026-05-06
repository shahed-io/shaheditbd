// bKash Tokenized Checkout — create payment & redirect URL
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SANDBOX = (Deno.env.get('BKASH_SANDBOX') || 'false').toLowerCase() === 'true';
const BASE = SANDBOX
  ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
  : 'https://tokenized.pay.bka.sh/v1.2.0-beta';

async function grantToken() {
  const res = await fetch(`${BASE}/tokenized/checkout/token/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      username: Deno.env.get('BKASH_USERNAME')!,
      password: Deno.env.get('BKASH_PASSWORD')!,
    },
    body: JSON.stringify({
      app_key: Deno.env.get('BKASH_APP_KEY'),
      app_secret: Deno.env.get('BKASH_APP_SECRET'),
    }),
  });
  const data = await res.json();
  if (!data.id_token) throw new Error('bKash token grant failed: ' + JSON.stringify(data));
  return data.id_token as string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { orderId, amount, callbackURL } = await req.json();
    if (!orderId || !amount) throw new Error('orderId & amount required');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify order exists & still pending
    const { data: order, error: oErr } = await supabase
      .from('orders').select('id, order_number, total, payment_status')
      .eq('id', orderId).single();
    if (oErr || !order) throw new Error('Order not found');
    if (order.payment_status === 'paid') throw new Error('Order already paid');

    const token = await grantToken();
    const merchantInvoice = order.order_number;

    const createRes = await fetch(`${BASE}/tokenized/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: token,
        'X-APP-Key': Deno.env.get('BKASH_APP_KEY')!,
      },
      body: JSON.stringify({
        mode: '0011', // checkout (no agreement)
        payerReference: order.order_number,
        callbackURL: callbackURL,
        amount: Number(amount).toFixed(2),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: merchantInvoice,
      }),
    });
    const createData = await createRes.json();
    if (!createData.bkashURL || !createData.paymentID) {
      throw new Error('bKash create failed: ' + JSON.stringify(createData));
    }

    // Save paymentID on order for later reconciliation
    await supabase.from('orders').update({
      transaction_id: createData.paymentID,
      payment_status: 'pending',
    }).eq('id', orderId);

    return new Response(JSON.stringify({
      bkashURL: createData.bkashURL,
      paymentID: createData.paymentID,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[bkash-create-payment]', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
