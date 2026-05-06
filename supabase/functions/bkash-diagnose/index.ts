// Diagnostic: tests bKash grant_token + create payment in current env
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SANDBOX = (Deno.env.get('BKASH_SANDBOX') || 'false').toLowerCase() === 'true';
  const BASE = SANDBOX
    ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
    : 'https://tokenized.pay.bka.sh/v1.2.0-beta';

  const out: any = {
    sandbox: SANDBOX,
    base: BASE,
    has_username: !!Deno.env.get('BKASH_USERNAME'),
    has_password: !!Deno.env.get('BKASH_PASSWORD'),
    has_app_key: !!Deno.env.get('BKASH_APP_KEY'),
    has_app_secret: !!Deno.env.get('BKASH_APP_SECRET'),
    app_key_len: (Deno.env.get('BKASH_APP_KEY') || '').length,
  };

  try {
    const r = await fetch(`${BASE}/tokenized/checkout/token/grant`, {
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
    const data = await r.json();
    out.grant_status = r.status;
    out.grant_response = data;
    out.has_token = !!data.id_token;

    if (data.id_token) {
      // Try to create a tiny test payment
      const cb = `${Deno.env.get('SUPABASE_URL')}/functions/v1/bkash-callback`;
      const c = await fetch(`${BASE}/tokenized/checkout/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: data.id_token,
          'X-APP-Key': Deno.env.get('BKASH_APP_KEY')!,
        },
        body: JSON.stringify({
          mode: '0011',
          payerReference: 'DIAG-' + Date.now(),
          callbackURL: cb,
          amount: '10.00',
          currency: 'BDT',
          intent: 'sale',
          merchantInvoiceNumber: 'DIAG-' + Date.now(),
        }),
      });
      out.create_status = c.status;
      out.create_response = await c.json();
    }
  } catch (e) {
    out.error = e instanceof Error ? e.message : String(e);
  }

  return new Response(JSON.stringify(out, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
