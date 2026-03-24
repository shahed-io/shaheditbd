import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PRICE_CENTS = 100; // $1 per CID

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const GRAHOK_API_TOKEN = Deno.env.get('GRAHOK_API_TOKEN');
  const API_URL     = Deno.env.get('GRAHOK_API_URL')     || 'https://grahok.io/api/getcid.php';
  const BALANCE_URL = Deno.env.get('GRAHOK_BALANCE_URL') || 'https://grahok.io/api/balance.php';
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (!GRAHOK_API_TOKEN) return json({ error: 'API token not configured' }, 500);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const body = await req.json();
    const { action, installation_id, token } = body;

    // ── Balance check (grahok.io API balance) — any valid reseller session ──────
    if (action === 'balance') {
      // Validate any reseller session (admin OR regular user)
      if (!token) return json({ ok: false, error: 'Authentication required' }, 401);

      const { data: sessions } = await supabase
        .from('reseller_sessions')
        .select('user_id, expires_at')
        .eq('token', token)
        .limit(1);
      const session = sessions?.[0];
      if (!session || new Date(session.expires_at) < new Date()) {
        return json({ ok: false, error: 'Invalid or expired session' }, 401);
      }

      // Try POST with form data (same as getcid pattern)
      const balForm = new FormData();
      balForm.append('token', GRAHOK_API_TOKEN);

      const res = await fetch(BALANCE_URL, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'X-API-TOKEN': GRAHOK_API_TOKEN },
        body: balForm,
      });
      const text = await res.text();
      let data: Record<string, unknown> = {};
      try { data = JSON.parse(text); } catch {
        const m = text.match(/([0-9]+(?:\.[0-9]+)?)/);
        data = { balance: m ? parseFloat(m[1]) : null, raw: text };
      }
      return json(data);
    }

    // ── Get CID (requires reseller session token) ─────────────────────────────
    if (action === 'getcid') {
      if (!token) return json({ error: 'Authentication required' }, 401);
      if (!installation_id || String(installation_id).trim().length < 4) {
        return json({ error: 'Installation ID too short' }, 400);
      }

      // Validate reseller session
      const { data: sessions } = await supabase
        .from('reseller_sessions')
        .select('user_id, expires_at')
        .eq('token', token)
        .limit(1);

      const session = sessions?.[0];
      if (!session || new Date(session.expires_at) < new Date()) {
        return json({ error: 'Invalid or expired session' }, 401);
      }

      // Get user & check balance
      const { data: users } = await supabase
        .from('reseller_users')
        .select('id, username, balance_cents')
        .eq('id', session.user_id)
        .limit(1);

      const user = users?.[0];
      if (!user) return json({ error: 'User not found' }, 401);
      if (user.balance_cents < PRICE_CENTS) {
        return json({ error: `Insufficient balance. You need $${(PRICE_CENTS/100).toFixed(2)} but have $${(user.balance_cents/100).toFixed(2)}` }, 402);
      }

      // Normalize IID
      const iid = String(installation_id).trim().replace(/\s+/g, ' ');

      // Call grahok.io API — token sent as query param, form field, and header for maximum compatibility
      const formData = new FormData();
      formData.append('token', GRAHOK_API_TOKEN);
      formData.append('installation_id', iid);

      const apiUrlWithToken = `${API_URL}${API_URL.includes('?') ? '&' : '?'}token=${encodeURIComponent(GRAHOK_API_TOKEN)}`;

      const res = await fetch(apiUrlWithToken, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'X-API-TOKEN': GRAHOK_API_TOKEN },
        body: formData,
      });

      const text = await res.text();
      let data: Record<string, unknown> = {};
      try { data = JSON.parse(text); } catch {
        return json({ error: 'Upstream did not return JSON', raw: text }, 502);
      }

      if (!data['cid']) {
        return json({ error: (data['error'] as string) || 'No CID in response', raw: text }, 502);
      }

      const cidValue = String(data['cid']);

      // Deduct balance atomically & log generation
      const newBalance = user.balance_cents - PRICE_CENTS;

      await Promise.all([
        supabase.from('reseller_users').update({ balance_cents: newBalance, updated_at: new Date().toISOString() }).eq('id', user.id),
        supabase.from('reseller_generations').insert({ user_id: user.id, installation_id: iid, cid: cidValue, price_cents: PRICE_CENTS }),
      ]);

      return json({ ...data, balance_after_cents: newBalance });
    }

    // ── User's own generation history ─────────────────────────────────────────
    if (action === 'my_history') {
      if (!token) return json({ error: 'Authentication required' }, 401);

      const { data: sessions } = await supabase
        .from('reseller_sessions')
        .select('user_id, expires_at')
        .eq('token', token)
        .limit(1);

      const session = sessions?.[0];
      if (!session || new Date(session.expires_at) < new Date()) return json({ error: 'Invalid session' }, 401);

      const { data: generations } = await supabase
        .from('reseller_generations')
        .select('id, installation_id, cid, price_cents, created_at')
        .eq('user_id', session.user_id)
        .order('created_at', { ascending: false })
        .limit(50);

      return json({ generations: generations ?? [] });
    }

    return json({ error: 'Invalid action' }, 400);
  } catch (err) {
    return json({ error: 'Server error', detail: String(err) }, 500);
  }
});
