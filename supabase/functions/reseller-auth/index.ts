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
    const { action } = body;

    // ── Login ────────────────────────────────────────────────────────────────
    if (action === 'login') {
      const { username, password } = body;
      if (!username || !password) return json({ error: 'Username and password required' });

      const adminPass = Deno.env.get('ADMIN_PASSWORD') || 'Sh@9696';

      // Ensure admin exists
      const { data: existingAdmin } = await supabase
        .from('reseller_users')
        .select('id')
        .eq('username', 'admin')
        .limit(1);

      if (!existingAdmin || existingAdmin.length === 0) {
        const hash = await bcrypt.hash(adminPass, 10);
        await supabase.from('reseller_users').insert({
          username: 'admin',
          password_hash: hash,
          is_admin: true,
          balance_cents: 0,
        });
      }

      // Fetch user
      const { data: users } = await supabase
        .from('reseller_users')
        .select('*')
        .eq('username', username.trim())
        .limit(1);

      const user = users?.[0];
      if (!user) return json({ error: 'Invalid username or password' });

      // For admin user: if password matches ADMIN_PASSWORD but hash doesn't verify,
      // it means the hash is stale — re-hash and update
      let passwordValid = await bcrypt.compare(password, user.password_hash);

      if (!passwordValid && user.username === 'admin' && password === adminPass) {
        // Password matches config but hash is stale — update hash
        const newHash = await bcrypt.hash(adminPass, 10);
        await supabase.from('reseller_users')
          .update({ password_hash: newHash })
          .eq('username', 'admin');
        passwordValid = true;
      }

      if (!passwordValid) {
        return json({ error: 'Invalid username or password' });
      }

      // Clean old sessions for this user (keep last 5)
      const { data: oldSessions } = await supabase
        .from('reseller_sessions')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(5, 999);
      if (oldSessions?.length) {
        await supabase.from('reseller_sessions').delete().in('id', oldSessions.map((s: { id: string }) => s.id));
      }

      const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      await supabase.from('reseller_sessions').insert({ user_id: user.id, token, expires_at: expiresAt });

      return json({
        token,
        user: { id: user.id, username: user.username, is_admin: user.is_admin, balance_cents: user.balance_cents },
      });
    }

    // ── Validate token ───────────────────────────────────────────────────────
    if (action === 'validate') {
      const { token } = body;
      if (!token) return json({ error: 'No token' }, 401);

      const { data: sessions } = await supabase
        .from('reseller_sessions')
        .select('user_id, expires_at')
        .eq('token', token)
        .limit(1);

      const session = sessions?.[0];
      if (!session || new Date(session.expires_at) < new Date()) {
        return json({ error: 'Invalid or expired session' }, 401);
      }

      const { data: users } = await supabase
        .from('reseller_users')
        .select('id, username, is_admin, balance_cents')
        .eq('id', session.user_id)
        .limit(1);

      const user = users?.[0];
      if (!user) return json({ error: 'User not found' }, 401);

      return json({ user });
    }

    // ── Logout ───────────────────────────────────────────────────────────────
    if (action === 'logout') {
      const { token } = body;
      if (token) await supabase.from('reseller_sessions').delete().eq('token', token);
      return json({ ok: true });
    }

    return json({ error: 'Invalid action' }, 400);
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
