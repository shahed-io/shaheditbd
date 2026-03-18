import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BKASH_USERNAME = Deno.env.get('BKASH_USERNAME')!;
const BKASH_PASSWORD = Deno.env.get('BKASH_PASSWORD')!;
const BKASH_APP_KEY = Deno.env.get('BKASH_APP_KEY')!;
const BKASH_APP_SECRET = Deno.env.get('BKASH_APP_SECRET')!;

// Production base URL
const BASE_URL = 'https://tokenized.pay.bka.sh/v1.2.0-beta';

// ---- Grant Token ----
async function grantToken(): Promise<string> {
  const res = await fetch(`${BASE_URL}/tokenized/checkout/token/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      username: BKASH_USERNAME,
      password: BKASH_PASSWORD,
    },
    body: JSON.stringify({ app_key: BKASH_APP_KEY, app_secret: BKASH_APP_SECRET }),
  });
  const data = await res.json();
  if (!data.id_token) throw new Error(`Token grant failed: ${JSON.stringify(data)}`);
  return data.id_token;
}

// ---- Create Payment ----
async function createPayment(token: string, amount: string, orderID: string, callbackURL: string) {
  const res = await fetch(`${BASE_URL}/tokenized/checkout/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
      'X-APP-Key': BKASH_APP_KEY,
    },
    body: JSON.stringify({
      mode: '0011',
      payerReference: orderID,
      callbackURL,
      amount,
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: orderID,
    }),
  });
  return await res.json();
}

// ---- Execute Payment ----
async function executePayment(token: string, paymentID: string) {
  const res = await fetch(`${BASE_URL}/tokenized/checkout/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
      'X-APP-Key': BKASH_APP_KEY,
    },
    body: JSON.stringify({ paymentID }),
  });
  return await res.json();
}

// ---- Query Payment ----
async function queryPayment(token: string, paymentID: string) {
  const res = await fetch(`${BASE_URL}/tokenized/checkout/payment/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
      'X-APP-Key': BKASH_APP_KEY,
    },
    body: JSON.stringify({ paymentID }),
  });
  return await res.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // ---- CREATE: initiate bKash payment ----
    if (action === 'create' && req.method === 'POST') {
      const { amount, orderID, callbackURL } = await req.json();
      if (!amount || !orderID || !callbackURL) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const token = await grantToken();
      const payment = await createPayment(token, String(amount), orderID, callbackURL);
      return new Response(JSON.stringify(payment), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---- EXECUTE: called after redirect callback ----
    if (action === 'execute' && req.method === 'POST') {
      const { paymentID } = await req.json();
      if (!paymentID) {
        return new Response(JSON.stringify({ error: 'paymentID required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const token = await grantToken();
      const result = await executePayment(token, paymentID);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---- QUERY: verify transaction by paymentID ----
    if (action === 'query' && req.method === 'POST') {
      const { paymentID } = await req.json();
      if (!paymentID) {
        return new Response(JSON.stringify({ error: 'paymentID required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const token = await grantToken();
      const result = await queryPayment(token, paymentID);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---- VERIFY by TrxID (manual) ----
    if (action === 'verify-trxid' && req.method === 'POST') {
      const { trxID } = await req.json();
      if (!trxID) {
        return new Response(JSON.stringify({ error: 'trxID required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const token = await grantToken();
      const res = await fetch(`${BASE_URL}/tokenized/checkout/general/searchTransaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
          'X-APP-Key': BKASH_APP_KEY,
        },
        body: JSON.stringify({ trxID }),
      });
      const result = await res.json();
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('bKash error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
