// bKash Tokenized Checkout — Callback
// Public GET endpoint that bKash redirects users to after payment.
// Executes the payment, updates the order, then redirects user back to the site.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SITE_URL = Deno.env.get('SITE_URL') || 'https://shahedstore.com.bd';

interface BkashCfg {
  mode: string;
  app_key: string;
  app_secret: string;
  username: string;
  password: string;
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

  // Look up bkash_transactions for this paymentID to know purpose
  const { data: bkTx } = await supabase
    .from('bkash_transactions')
    .select('id, purpose, topup_request_id, user_id, amount, order_id')
    .eq('payment_id', paymentID)
    .maybeSingle();

  const purpose = (bkTx as any)?.purpose || 'order';
  const topupRequestId = (bkTx as any)?.topup_request_id || null;

  // Find the order by paymentID stored in transaction_id (for order purpose)
  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, total, user_id, payment_status, status')
    .eq('transaction_id', paymentID)
    .maybeSingle();

  const orderNumber = order?.order_number || '';

  const successRedirect = () => purpose === 'wallet_topup'
    ? `${SITE_URL}/dashboard?tab=wallet&bkash=success`
    : `${SITE_URL}/checkout?bkash=success&order=${orderNumber}`;
  const failRedirect = (s: string) => purpose === 'wallet_topup'
    ? `${SITE_URL}/dashboard?tab=wallet&bkash=${s}`
    : `${SITE_URL}/checkout?bkash=${s}&order=${orderNumber}`;

  // Cancelled or failed at bKash UI
  if (status === 'cancel' || status === 'failure') {
    if (order) {
      await supabase.from('orders').update({
        payment_status: 'failed',
        status: 'cancelled',
      }).eq('id', order.id);
    }
    if (purpose === 'wallet_topup' && topupRequestId) {
      await supabase.from('wallet_topup_requests').update({
        status: 'rejected',
        admin_notes: `User ${status} at bKash`,
      }).eq('id', topupRequestId);
    }
    await supabase.from('bkash_transactions')
      .update({ status: status === 'cancel' ? 'cancelled' : 'failed', status_message: `User ${status} at bKash` })
      .eq('payment_id', paymentID);
    return redirect(failRedirect(status));
  }

  try {
    const cfg = await loadConfig(supabase);
    const token = await grantToken(cfg);
    const execRes = await fetch(`${baseUrl(cfg.mode)}/tokenized/checkout/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token,
        'X-APP-Key': cfg.app_key,
      },
      body: JSON.stringify({ paymentID }),
    });
    const execData = await execRes.json();

    const ok = execData?.statusCode === '0000' && execData?.transactionStatus === 'Completed';

    if (ok) {
      // Log success on bkash_transactions
      await supabase.from('bkash_transactions').update({
        trx_id: execData.trxID || null,
        payer_msisdn: execData.customerMsisdn || execData.payerReference || null,
        status: 'completed',
        status_code: execData.statusCode,
        status_message: execData.statusMessage || 'Completed',
        raw_execute: execData,
        paid_at: new Date().toISOString(),
        amount: execData.amount ? Number(execData.amount) : undefined,
      }).eq('payment_id', paymentID);

      if (purpose === 'wallet_topup' && bkTx) {
        // Credit wallet automatically
        const creditAmount = Number(execData.amount || (bkTx as any).amount);
        const userId = (bkTx as any).user_id;
        if (userId && creditAmount > 0) {
          await supabase.rpc('wallet_credit', {
            p_user_id: userId,
            p_amount: creditAmount,
            p_note: `bKash Online Top-up (TrxID: ${execData.trxID || paymentID})`,
            p_reference_id: execData.trxID || paymentID,
            p_created_by: 'bkash_pgw',
          });
        }
        if (topupRequestId) {
          await supabase.from('wallet_topup_requests').update({
            status: 'approved',
            transaction_id: execData.trxID || paymentID,
            admin_notes: 'Auto-approved by bKash PGW',
            reviewed_at: new Date().toISOString(),
          }).eq('id', topupRequestId);
        }
        return redirect(successRedirect());
      }

      if (order) {
        // Auto-complete order: triggers will assign licenses + award points + send notifications
        await supabase.from('orders').update({
          payment_status: 'paid',
          status: 'completed',
          transaction_id: execData.trxID || paymentID,
        }).eq('id', order.id);

        // Mark related payment_proof as approved if any
        await supabase.from('payment_proofs').update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          admin_notes: 'Auto-approved by bKash PGW',
        }).eq('order_id', order.id);
      }

      return redirect(`${SITE_URL}/checkout?bkash=success&order=${orderNumber}&trx=${encodeURIComponent(execData.trxID || '')}`);
    }

    if (order) {
      await supabase.from('orders').update({
        payment_status: 'failed',
        status: 'cancelled',
      }).eq('id', order.id);
    }
    if (purpose === 'wallet_topup' && topupRequestId) {
      await supabase.from('wallet_topup_requests').update({
        status: 'rejected',
        admin_notes: execData?.statusMessage || 'execute failed',
      }).eq('id', topupRequestId);
    }
    await supabase.from('bkash_transactions').update({
      status: 'failed',
      status_code: execData?.statusCode || null,
      status_message: execData?.statusMessage || 'execute failed',
      raw_execute: execData,
    }).eq('payment_id', paymentID);
    console.error('[bkash-callback] execute failed', execData);
    return redirect(failRedirect('failure'));
  } catch (e) {
    console.error('[bkash-callback] error', e);
    if (order) {
      await supabase.from('orders').update({
        payment_status: 'failed',
        status: 'cancelled',
      }).eq('id', order.id);
    }
    if (purpose === 'wallet_topup' && topupRequestId) {
      await supabase.from('wallet_topup_requests').update({
        status: 'rejected',
        admin_notes: (e as Error).message,
      }).eq('id', topupRequestId);
    }
    await supabase.from('bkash_transactions').update({
      status: 'failed',
      status_message: (e as Error).message,
    }).eq('payment_id', paymentID);
    return redirect(failRedirect('error'));
  }
});
