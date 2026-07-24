// Guest order finalizer:
// - Given an orderId + email, links the order to the matching auth user.
// - If no user exists for that email, creates one (email_confirmed, random password)
//   and sends a password-reset email so the customer can claim access later.
// This is what turns a guest checkout into an account-linked order automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const body = await req.json().catch(() => ({}));
    const orderId = String(body.orderId || '').trim();
    const emailRaw = String(body.email || '').trim().toLowerCase();
    const displayName = String(body.name || '').trim();
    const redirectTo = String(body.redirectTo || '').trim();

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!UUID_RE.test(orderId)) return json(400, { error: 'Invalid orderId' });
    if (!EMAIL_RE.test(emailRaw) || emailRaw.length > 254) return json(400, { error: 'Invalid email' });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch the order — must exist and email must match (defence against replay/spoof).
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, user_id, customer_email, customer_name')
      .eq('id', orderId)
      .maybeSingle();
    if (orderErr || !order) return json(404, { error: 'Order not found' });

    if ((order.customer_email || '').toLowerCase() !== emailRaw) {
      return json(403, { error: 'Email does not match order' });
    }
    if (order.user_id) {
      return json(200, { ok: true, alreadyLinked: true, userExisted: true, accountCreated: false });
    }

    // Look up user by email using the Admin API (paginated search).
    let existingUserId: string | null = null;
    try {
      // listUsers supports up to 200 per page; email lookup via filter is not
      // universally available, so we do a targeted small page search.
      const { data: list } = await (supabase.auth.admin as any).listUsers({
        page: 1,
        perPage: 200,
        // @ts-ignore — filter is accepted by newer supabase-js versions
        filter: `email.eq.${emailRaw}`,
      });
      const match = list?.users?.find((u: any) => (u.email || '').toLowerCase() === emailRaw);
      if (match) existingUserId = match.id;
    } catch (_) { /* fall through to slower path */ }

    // Fallback: check profiles table by email if the filter path failed.
    if (!existingUserId) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('user_id, email')
        .ilike('email', emailRaw)
        .maybeSingle();
      if (prof?.user_id) existingUserId = prof.user_id as string;
    }

    let accountCreated = false;

    if (!existingUserId) {
      // Create the user silently (email pre-confirmed so they can log in
      // via password-reset without a verification step).
      const randomPwd = crypto.randomUUID() + crypto.randomUUID();
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: emailRaw,
        password: randomPwd,
        email_confirm: true,
        user_metadata: {
          display_name: displayName || order.customer_name || undefined,
          created_via: 'guest_checkout',
        },
      });
      if (createErr || !created?.user) {
        // If creation collides (race), try lookup once more.
        const { data: list2 } = await (supabase.auth.admin as any).listUsers({
          page: 1, perPage: 200,
          // @ts-ignore
          filter: `email.eq.${emailRaw}`,
        });
        const match2 = list2?.users?.find((u: any) => (u.email || '').toLowerCase() === emailRaw);
        if (match2) existingUserId = match2.id;
        else return json(500, { error: 'Failed to create account', details: createErr?.message });
      } else {
        existingUserId = created.user.id;
        accountCreated = true;
      }
    }

    // Link order + related rows to the resolved user.
    await supabase.from('orders').update({ user_id: existingUserId }).eq('id', orderId).is('user_id', null);
    await supabase.from('payment_proofs').update({ user_id: existingUserId })
      .eq('order_id', orderId).is('user_id', null);

    // Also link any OTHER guest orders that used the same email.
    await supabase.from('orders').update({ user_id: existingUserId })
      .ilike('customer_email', emailRaw).is('user_id', null);

    // Trigger a password-reset email so the customer can set a password
    // and access their orders. We use generateLink so we get the URL even
    // if inbound email is disabled.
    try {
      const { data: link } = await (supabase.auth.admin as any).generateLink({
        type: 'recovery',
        email: emailRaw,
        options: redirectTo ? { redirectTo } : undefined,
      });
      // Best-effort log; delivery is handled by the auth email hook.
      if (!link) {
        console.warn('[guest-order-finalize] no link returned');
      }
    } catch (e) {
      console.warn('[guest-order-finalize] recovery link error', (e as Error).message);
    }

    return json(200, {
      ok: true,
      alreadyLinked: false,
      userExisted: !accountCreated,
      accountCreated,
      userId: existingUserId,
    });
  } catch (e) {
    console.error('[guest-order-finalize] error', e);
    return json(500, { error: (e as Error).message });
  }
});
