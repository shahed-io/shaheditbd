// bKash Tokenized Checkout — callback handler (executes payment, updates order, redirects)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  if (!data.id_token) throw new Error('token grant failed');
  return data.id_token as string;
}

function redirect(url: string) {
  return new Response(null, { status: 302, headers: { Location: url } });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const paymentID = url.searchParams.get('paymentID') || '';
  const status = url.searchParams.get('status') || '';
  const siteUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://shahedstore.com.bd';

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    if (!paymentID) return redirect(`${siteUrl}/checkout?bkash=error&reason=missing_payment_id`);

    // Find order by paymentID stored in transaction_id
    const { data: order } = await supabase
      .from('orders').select('id, order_number, total, payment_status')
      .eq('transaction_id', paymentID).maybeSingle();

    if (status !== 'success') {
      if (order) {
        await supabase.from('orders').update({
          payment_status: 'failed', status: 'cancelled',
          notes: (order as any).notes ? `${(order as any).notes}\n[bKash ${status}]` : `[bKash ${status}]`,
        }).eq('id', order.id);
      }
      return redirect(`${siteUrl}/checkout?bkash=${status}`);
    }

    // Execute the payment
    const token = await grantToken();
    const exec = await fetch(`${BASE}/tokenized/checkout/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', Accept: 'application/json',
        Authorization: token,
        'X-APP-Key': Deno.env.get('BKASH_APP_KEY')!,
      },
      body: JSON.stringify({ paymentID }),
    });
    const result = await exec.json();

    if (result.statusCode === '0000' && result.transactionStatus === 'Completed') {
      if (order) {
        await supabase.from('orders').update({
          payment_status: 'paid',
          status: 'processing',
          transaction_id: result.trxID || paymentID,
        }).eq('id', order.id);

        await supabase.from('payment_proofs').insert({
          order_id: order.id,
          transaction_id: result.trxID || paymentID,
          payment_method: 'bkash',
          amount: Number(result.amount || order.total),
          status: 'verified',
        });

        // Trigger downstream notifications (non-blocking)
        supabase.functions.invoke('send-order-email', {
          body: { type: 'order_confirmation', orderId: order.id },
        }).catch(() => {});
        supabase.functions.invoke('notify-new-order', {
          body: { orderId: order.id },
        }).catch(() => {});
      }
      return redirect(`${siteUrl}/checkout?bkash=success&order=${order?.order_number || ''}&trx=${result.trxID || ''}`);
    }

    // Query as fallback
    if (order) {
      await supabase.from('orders').update({
        payment_status: 'failed',
        notes: `[bKash execute failed: ${JSON.stringify(result).slice(0, 300)}]`,
      }).eq('id', order.id);
    }
    return redirect(`${siteUrl}/checkout?bkash=failed&reason=execute`);
  } catch (err) {
    console.error('[bkash-callback]', err);
    return redirect(`${siteUrl}/checkout?bkash=error`);
  }
});
