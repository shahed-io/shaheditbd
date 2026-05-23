import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const Schema = z.object({
  submission_id: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  admin_note: z.string().max(1000).optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub as string;

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: userId, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { submission_id, action, admin_note } = parsed.data;

    const { data: sub, error: subErr } = await admin
      .from('payment_link_submissions').select('*').eq('id', submission_id).maybeSingle();
    if (subErr || !sub) {
      return new Response(JSON.stringify({ error: 'Submission not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (sub.status !== 'pending') {
      return new Response(JSON.stringify({ error: `Already ${sub.status}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'reject') {
      await admin.from('payment_link_submissions').update({
        status: 'rejected', admin_note: admin_note || null,
        reviewed_by: userId, reviewed_at: new Date().toISOString(),
      }).eq('id', submission_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // approve → create real order
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const { count } = await admin.from('orders').select('id', { count: 'exact', head: true });
    const seq = String((count || 0) + 1).padStart(4, '0');
    const orderNumber = `PL-${y}${m}${d}-${seq}`;

    const { data: order, error: orderErr } = await admin.from('orders').insert({
      order_number: orderNumber,
      customer_name: sub.customer_name,
      customer_email: sub.customer_email || `${(sub.customer_phone || 'unknown').replace(/\D/g, '')}@paylink.local`,
      customer_phone: sub.customer_phone,
      payment_method: sub.payment_method,
      payment_status: 'paid',
      transaction_id: sub.transaction_id,
      notes: `Payment Link: ${sub.link_slug}` + (sub.customer_note ? `\nCustomer note: ${sub.customer_note}` : ''),
      admin_notes: admin_note || null,
      subtotal: sub.total,
      total: sub.total,
      status: 'processing',
    }).select('id, order_number').single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: orderErr?.message || 'Order creation failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await admin.from('order_items').insert({
      order_id: order.id,
      product_id: sub.product_id,
      product_name: sub.product_name,
      price: sub.amount,
      quantity: sub.quantity,
      total: sub.total,
      custom_field_values: sub.custom_field_values || {},
    });

    await admin.from('payment_link_submissions').update({
      status: 'approved',
      order_id: order.id,
      order_number: order.order_number,
      admin_note: admin_note || null,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    }).eq('id', submission_id);

    return new Response(JSON.stringify({ success: true, order_id: order.id, order_number: order.order_number }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
