import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import bcrypt from "npm:bcryptjs@2.4.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const body = await req.json();
    const { action, token } = body;

    // Verify admin token
    if (!token) return json({ error: 'Unauthorized' }, 401);

    const { data: sessions } = await supabase
      .from('reseller_sessions')
      .select('user_id, expires_at')
      .eq('token', token)
      .limit(1);

    const session = sessions?.[0];
    if (!session || new Date(session.expires_at) < new Date()) return json({ error: 'Invalid session' }, 401);

    const { data: admins } = await supabase
      .from('reseller_users')
      .select('is_admin')
      .eq('id', session.user_id)
      .limit(1);

    if (!admins?.[0]?.is_admin) return json({ error: 'Admin only' }, 403);

    // ── List users ───────────────────────────────────────────────────────────
    if (action === 'list_users') {
      const { data: users } = await supabase
        .from('reseller_users')
        .select('id, username, is_admin, balance_cents, created_at')
        .order('created_at', { ascending: false });
      return json({ users: users ?? [] });
    }

    // ── Create user ──────────────────────────────────────────────────────────
    if (action === 'create_user') {
      const { username, password, is_admin = false, balance_cents = 0 } = body;
      if (!username || !password) return json({ error: 'Username and password required' }, 400);
      if (password.length < 6) return json({ error: 'Password must be at least 6 characters' }, 400);

      const hash = await bcrypt.hash(password, 10);
      const { data, error } = await supabase
        .from('reseller_users')
        .insert({ username: username.trim(), password_hash: hash, is_admin: !!is_admin, balance_cents: parseInt(balance_cents) || 0 })
        .select('id, username, is_admin, balance_cents')
        .single();

      if (error) return json({ error: error.message }, 400);
      return json({ user: data });
    }

    // ── Topup balance ────────────────────────────────────────────────────────
    if (action === 'topup') {
      const { user_id, amount_cents } = body;
      if (!user_id || !amount_cents) return json({ error: 'user_id and amount_cents required' }, 400);

      const { data: users } = await supabase.from('reseller_users').select('balance_cents').eq('id', user_id).limit(1);
      const current = users?.[0]?.balance_cents ?? 0;
      const newBalance = current + parseInt(amount_cents);

      const { data, error } = await supabase
        .from('reseller_users')
        .update({ balance_cents: newBalance, updated_at: new Date().toISOString() })
        .eq('id', user_id)
        .select('id, username, balance_cents')
        .single();

      if (error) return json({ error: error.message }, 400);
      return json({ user: data, new_balance: newBalance });
    }

    // ── Set balance (absolute) ───────────────────────────────────────────────
    if (action === 'set_balance') {
      const { user_id, balance_cents } = body;
      const { data, error } = await supabase
        .from('reseller_users')
        .update({ balance_cents: parseInt(balance_cents), updated_at: new Date().toISOString() })
        .eq('id', user_id)
        .select('id, username, balance_cents')
        .single();

      if (error) return json({ error: error.message }, 400);
      return json({ user: data });
    }

    // ── Delete user ──────────────────────────────────────────────────────────
    if (action === 'delete_user') {
      const { user_id } = body;
      const { error } = await supabase.from('reseller_users').delete().eq('id', user_id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    // ── Change password ──────────────────────────────────────────────────────
    if (action === 'change_password') {
      const { user_id, new_password } = body;
      if (!new_password || new_password.length < 6) return json({ error: 'Password too short' }, 400);
      const hash = await bcrypt.hash(new_password, 10);
      const { error } = await supabase
        .from('reseller_users')
        .update({ password_hash: hash, updated_at: new Date().toISOString() })
        .eq('id', user_id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    // ── List generations ─────────────────────────────────────────────────────
    if (action === 'list_generations') {
      const { user_id, page = 1, limit = 50 } = body;
      const from = (page - 1) * limit;

      let query = supabase
        .from('reseller_generations')
        .select('id, user_id, installation_id, cid, price_cents, created_at, reseller_users!inner(username)')
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1);

      if (user_id) query = query.eq('user_id', user_id);

      const { data: generations, error } = await query;
      if (error) return json({ error: error.message }, 400);

      const { count } = await supabase
        .from('reseller_generations')
        .select('*', { count: 'exact', head: true });

      return json({ generations: generations ?? [], total: count ?? 0 });
    }

    // ── Stats ────────────────────────────────────────────────────────────────
    if (action === 'stats') {
      const [{ count: totalUsers }, { count: totalCIDs }, balanceData] = await Promise.all([
        supabase.from('reseller_users').select('*', { count: 'exact', head: true }).eq('is_admin', false),
        supabase.from('reseller_generations').select('*', { count: 'exact', head: true }),
        supabase.from('reseller_users').select('balance_cents').eq('is_admin', false),
      ]);

      const totalBalance = (balanceData.data ?? []).reduce((s: number, u: { balance_cents: number }) => s + u.balance_cents, 0);

      return json({ total_users: totalUsers ?? 0, total_cids: totalCIDs ?? 0, total_balance_cents: totalBalance });
    }

    return json({ error: 'Invalid action' }, 400);
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
