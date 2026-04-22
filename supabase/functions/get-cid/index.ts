import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PRICE_CENTS = 100; // $1 per CID

// ─── Provider endpoints ────────────────────────────────────────────────
// PRIMARY: GetCID.app (api-v2 — direct CID response)
const GETCID_API_URL     = 'https://panel.getcid.app/user-api/getcid';
const GETCID_BALANCE_URL = 'https://panel.getcid.app/user-api/checkbalance';

// ─── Provider call: GetCID.app ─────────────────────────────────────────
async function callGetCID(token: string, iid: string): Promise<{ ok: boolean; cid?: string; error?: string; raw?: string }> {
  const url = `${GETCID_API_URL}?token=${encodeURIComponent(token)}&iid=${encodeURIComponent(iid)}`;
  try {
    const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try { data = JSON.parse(text); } catch {
      return { ok: false, error: 'Invalid JSON from GetCID', raw: text };
    }
    if (data['cid']) return { ok: true, cid: String(data['cid']) };
    return { ok: false, error: (data['error'] as string) || 'No CID returned', raw: text };
  } catch (e) {
    return { ok: false, error: `GetCID network error: ${String(e)}` };
  }
}

async function callGetCIDBalance(token: string): Promise<{ ok: boolean; balance?: number; raw?: string; error?: string }> {
  const url = `${GETCID_BALANCE_URL}?token=${encodeURIComponent(token)}`;
  try {
    const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json,text/plain' } });
    const text = await res.text();
    // Plain text number expected
    const m = text.match(/([0-9]+(?:\.[0-9]+)?)/);
    if (m) return { ok: true, balance: parseFloat(m[1]), raw: text };
    return { ok: false, error: 'Could not parse balance', raw: text };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ─── Provider call: Grahok.io (BACKUP) ─────────────────────────────────
async function callGrahok(token: string, apiUrl: string, iid: string): Promise<{ ok: boolean; cid?: string; error?: string; raw?: string }> {
  try {
    const formData = new FormData();
    formData.append('token', token);
    formData.append('installation_id', iid);
    const apiUrlWithToken = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
    const res = await fetch(apiUrlWithToken, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'X-API-TOKEN': token },
      body: formData,
    });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try { data = JSON.parse(text); } catch {
      return { ok: false, error: 'Invalid JSON from Grahok', raw: text };
    }
    if (data['cid']) return { ok: true, cid: String(data['cid']) };
    return { ok: false, error: (data['error'] as string) || 'No CID returned', raw: text };
  } catch (e) {
    return { ok: false, error: `Grahok network error: ${String(e)}` };
  }
}

async function callGrahokBalance(token: string, balanceUrl: string): Promise<{ ok: boolean; balance?: number | null; raw?: string; error?: string }> {
  try {
    const url = `${balanceUrl}${balanceUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
    const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json', 'X-API-TOKEN': token } });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text);
      const bal = (data['balance'] ?? data['amount']) as number | undefined;
      return { ok: true, balance: typeof bal === 'number' ? bal : null, raw: text };
    } catch {
      const m = text.match(/([0-9]+(?:\.[0-9]+)?)/);
      return { ok: true, balance: m ? parseFloat(m[1]) : null, raw: text };
    }
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const GETCID_TOKEN = Deno.env.get('GETCID_API_TOKEN');
  const GRAHOK_TOKEN = Deno.env.get('GRAHOK_API_TOKEN');
  const GRAHOK_URL   = Deno.env.get('GRAHOK_API_URL')     || 'https://grahok.io/api/getcid.php';
  const GRAHOK_BAL   = Deno.env.get('GRAHOK_BALANCE_URL') || 'https://grahok.io/api/balance.php';

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (!GETCID_TOKEN && !GRAHOK_TOKEN) {
    return json({ error: 'No CID provider configured' }, 500);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const body = await req.json();
    const { action, installation_id, token } = body;

    // ── Balance check — combined providers ───────────────────────────
    if (action === 'balance') {
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

      const result: Record<string, unknown> = { providers: {} };
      const providers = result.providers as Record<string, unknown>;

      if (GETCID_TOKEN) {
        const r = await callGetCIDBalance(GETCID_TOKEN);
        providers.getcid = r.ok ? { balance: r.balance, status: 'ok' } : { error: r.error, status: 'error' };
        if (r.ok) result.balance = r.balance; // primary balance for back-compat
      }
      if (GRAHOK_TOKEN) {
        const r = await callGrahokBalance(GRAHOK_TOKEN, GRAHOK_BAL);
        providers.grahok = r.ok ? { balance: r.balance, status: 'ok' } : { error: r.error, status: 'error' };
        if (result.balance === undefined && r.ok) result.balance = r.balance;
      }

      return json(result);
    }

    // ── Get CID — Auto-fallback (GetCID primary, Grahok backup) ──────
    if (action === 'getcid') {
      if (!token) return json({ error: 'Authentication required' }, 401);
      if (!installation_id || String(installation_id).trim().length < 4) {
        return json({ error: 'Installation ID too short' }, 400);
      }

      const { data: sessions } = await supabase
        .from('reseller_sessions')
        .select('user_id, expires_at')
        .eq('token', token)
        .limit(1);

      const session = sessions?.[0];
      if (!session || new Date(session.expires_at) < new Date()) {
        return json({ error: 'Invalid or expired session' }, 401);
      }

      const { target_user_id } = body;
      const { data: callerRows } = await supabase
        .from('reseller_users')
        .select('id, is_admin, balance_cents')
        .eq('id', session.user_id)
        .limit(1);
      const caller = callerRows?.[0];
      if (!caller) return json({ error: 'User not found' }, 401);

      let billedUserId = session.user_id;
      let billedUserBalance = caller.balance_cents;

      if (target_user_id && caller.is_admin) {
        const { data: targetRows } = await supabase
          .from('reseller_users')
          .select('id, balance_cents')
          .eq('id', target_user_id)
          .limit(1);
        const targetUser = targetRows?.[0];
        if (!targetUser) return json({ error: 'Target user not found' }, 404);
        billedUserId = targetUser.id;
        billedUserBalance = targetUser.balance_cents;
      } else if (!caller.is_admin && caller.balance_cents < PRICE_CENTS) {
        return json({ error: `Insufficient balance. Need $${(PRICE_CENTS/100).toFixed(2)}, have $${(caller.balance_cents/100).toFixed(2)}` }, 402);
      }

      if (!caller.is_admin && billedUserBalance < PRICE_CENTS) {
        return json({ error: `Insufficient balance. Need $${(PRICE_CENTS/100).toFixed(2)}, have $${(billedUserBalance/100).toFixed(2)}` }, 402);
      }

      const iid = String(installation_id).trim().replace(/\s+/g, ' ');

      // ── Try PRIMARY: GetCID.app ──
      let cidValue: string | null = null;
      let usedProvider = '';
      const errors: Record<string, string> = {};

      if (GETCID_TOKEN) {
        const r = await callGetCID(GETCID_TOKEN, iid);
        if (r.ok && r.cid) {
          cidValue = r.cid;
          usedProvider = 'getcid';
        } else {
          errors.getcid = r.error || 'unknown';
          console.log(`[GetCID] failed: ${r.error} | raw: ${r.raw}`);
        }
      }

      // ── FALLBACK: Grahok.io ──
      if (!cidValue && GRAHOK_TOKEN) {
        const r = await callGrahok(GRAHOK_TOKEN, GRAHOK_URL, iid);
        if (r.ok && r.cid) {
          cidValue = r.cid;
          usedProvider = 'grahok';
        } else {
          errors.grahok = r.error || 'unknown';
          console.log(`[Grahok] failed: ${r.error} | raw: ${r.raw}`);
        }
      }

      if (!cidValue) {
        return json({ error: 'All CID providers failed', details: errors }, 502);
      }

      // Deduct balance & log generation
      const shouldDeductBalance = !caller.is_admin || (caller.is_admin && target_user_id);
      const newBalance = shouldDeductBalance ? billedUserBalance - PRICE_CENTS : billedUserBalance;

      const ops = [
        supabase.from('reseller_generations').insert({
          user_id: billedUserId,
          installation_id: iid,
          cid: cidValue,
          price_cents: shouldDeductBalance ? PRICE_CENTS : 0,
        }),
      ];
      if (shouldDeductBalance) {
        ops.push(supabase.from('reseller_users').update({
          balance_cents: newBalance,
          updated_at: new Date().toISOString(),
        }).eq('id', billedUserId) as never);
      }
      await Promise.all(ops);

      return json({
        cid: cidValue,
        provider: usedProvider,
        balance_after_cents: newBalance,
        billed_user_id: billedUserId,
      });
    }

    // ── User's own generation history ────────────────────────────────
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
