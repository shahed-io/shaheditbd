// Guest checkout account creation: given an email (and optional order_id),
// invite the user (sends "set your password" email) or link an existing user,
// then attach any past guest orders to them.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const Schema = z.object({
  email: z.string().trim().email().max(255),
  name: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  order_id: z.string().uuid().optional(),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: parsed.error.flatten().fieldErrors }, 400);
    }
    const { email, name, phone, order_id } = parsed.data;
    const emailLc = email.toLowerCase();

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const siteUrl = Deno.env.get('SITE_URL') || 'https://shahedstore.com.bd';
    const redirectTo = `${siteUrl}/reset-password`;

    let userId: string | null = null;
    let isNew = false;

    const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        display_name: name || undefined,
        phone: phone || undefined,
        source: 'guest_checkout',
      },
    });

    if (invErr) {
      const msg = (invErr.message || '').toLowerCase();
      const exists = msg.includes('already') || msg.includes('registered') || (invErr as any).status === 422;
      if (!exists) {
        return json({ error: invErr.message || 'Invite failed' }, 500);
      }
      // Look up existing user (paginated)
      for (let page = 1; page <= 20 && !userId; page++) {
        const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        const found = list?.users?.find(u => (u.email || '').toLowerCase() === emailLc);
        if (found) userId = found.id;
        if (!list?.users || list.users.length < 200) break;
      }
      if (!userId) return json({ error: 'User exists but could not be located' }, 500);
    } else if (invited?.user) {
      userId = invited.user.id;
      isNew = true;
    }
    if (!userId) return json({ error: 'No user id' }, 500);

    // Best-effort: update profile with name/phone
    try {
      await admin.from('profiles').update({
        display_name: name || undefined,
        phone: phone || undefined,
        email: emailLc,
      }).eq('user_id', userId);
    } catch { /* non-fatal */ }

    // Attach the just-placed order (if provided) — trigger will handle any others.
    if (order_id) {
      try {
        await admin.from('orders').update({ user_id: userId }).eq('id', order_id).is('user_id', null);
      } catch { /* non-fatal */ }
    }

    // Bulk link any other past guest orders by email/phone
    let linkedCount = 0;
    try {
      const { data } = await admin.rpc('_link_guest_orders_for' as any, {
        p_user_id: userId, p_email: emailLc, p_phone: phone || null,
      });
      linkedCount = Number(data || 0);
    } catch { /* non-fatal */ }

    return json({ success: true, is_new: isNew, user_id: userId, linked_orders: linkedCount });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
