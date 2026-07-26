// Uddoktapay IPN webhook. Receives payment notifications and marks orders paid.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({} as any));
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: cfgRow } = await supabase
      .from('site_settings').select('value').eq('key', 'uddoktapay_pgw_config').maybeSingle();
    if (!cfgRow?.value) return new Response('not configured', { status: 400 });
    const cfg = JSON.parse(cfgRow.value);

    // Verify auth header (Uddoktapay sends the same API key back in RT-UDDOKTAPAY-API-KEY)
    const hdr = req.headers.get('RT-UDDOKTAPAY-API-KEY') || req.headers.get('rt-uddoktapay-api-key');
    if (!hdr || hdr !== cfg.api_key) {
      console.warn('[uddoktapay-webhook] invalid signature header');
      return new Response('invalid signature', { status: 401 });
    }

    const status = String(body?.status || '').toUpperCase();
    const orderId = body?.metadata?.order_id;
    const invoiceId = body?.invoice_id;
    if (!orderId) return new Response('missing order_id in metadata', { status: 400 });

    if (status === 'COMPLETED' || status === 'PAID') {
      await supabase.from('orders').update({
        payment_status: 'paid',
        status: 'processing',
        transaction_id: body?.transaction_id || invoiceId,
      }).eq('id', orderId);
    } else if (status === 'PENDING') {
      await supabase.from('orders').update({ payment_status: 'pending' }).eq('id', orderId);
    }

    return new Response('ok', { status: 200 });
  } catch (e: any) {
    console.error('[uddoktapay-webhook] error', e);
    return new Response('error', { status: 500 });
  }
});
