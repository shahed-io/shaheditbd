// bKash Tokenized Checkout — Callback
// Public GET endpoint that bKash redirects users to after payment.
// Executes the payment, updates the order, then redirects user back to the site.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MODE = (Deno.env.get('BKASH_MODE') || 'sandbox').toLowerCase();
const BASE = MODE === 'live'
  ? 'https://tokenized.pay.bka.sh/v1.2.0-beta'
  : 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';

const APP_KEY = Deno.env.get('BKASH_APP_KEY') || '';
const APP_SECRET = Deno.env.get('BKASH_APP_SECRET') || '';
const USERNAME = Deno.env.get('BKASH_USERNAME') || '';
const PASSWORD = Deno.env.get('BKASH_PASSWORD') || '';

const SITE_URL = Deno.env.get('SITE_URL') || 'https://shahedstore.com.bd';

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
  if (!data?.id_token) throw new Error('token grant failed');
  return data.id_token;
}

function redirect(url: string) {
  return new Response(null, { status: 302, headers: { Location: url } });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const paymentID = url.searchParams.get('paymentID') || '';
  const status = (url.searchParams.get('status') || '').toLowerCase();

  if (!paymentID) {
    return redirect(`${SITE_URL}/checkout?bkash=missing`);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Find the order by paymentID stored in transaction_id
  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, total, user_id, payment_status, status')
    .eq('transaction_id', paymentID)
    .maybeSingle();

  const orderNumber = order?.order_number || '';

  // Cancelled or failed at bKash UI
  if (status === 'cancel' || status === 'failure') {
    if (order) {
      await supabase.from('orders').update({
        payment_status: 'failed',
        status: 'cancelled',
      }).eq('id', order.id);
    }
    return redirect(`${SITE_URL}/checkout?bkash=${status}&order=${orderNumber}`);
  }

  try {
    const token = await grantToken();
    const execRes = await fetch(`${BASE}/tokenized/checkout/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token,
        'X-APP-Key': APP_KEY,
      },
      body: JSON.stringify({ paymentID }),
    });
    const execData = await execRes.json();

    const ok = execData?.statusCode === '0000' && execData?.transactionStatus === 'Completed';

    if (ok && order) {
      await supabase.from('orders').update({
        payment_status: 'paid',
        status: 'processing',
        transaction_id: execData.trxID || paymentID,
      }).eq('id', order.id);

      // Mark related payment_proof as approved if any
      await supabase.from('payment_proofs').update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        admin_notes: 'Auto-approved by bKash PGW',
      }).eq('order_id', order.id);

      return redirect(`${SITE_URL}/checkout?bkash=success&order=${orderNumber}&trx=${encodeURIComponent(execData.trxID || '')}`);
    }

    if (order) {
      await supabase.from('orders').update({
        payment_status: 'failed',
        status: 'cancelled',
      }).eq('id', order.id);
    }
    console.error('[bkash-callback] execute failed', execData);
    return redirect(`${SITE_URL}/checkout?bkash=failure&order=${orderNumber}`);
  } catch (e) {
    console.error('[bkash-callback] error', e);
    return redirect(`${SITE_URL}/checkout?bkash=error&order=${orderNumber}`);
  }
});
