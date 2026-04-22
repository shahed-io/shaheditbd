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

    // ═══════════════════════════════════════════════════════════════
    // ADMIN-ONLY ACTIONS (Supabase JWT auth, no reseller billing)
    // ═══════════════════════════════════════════════════════════════
    const isAdminAction = ['admin_balance', 'admin_generate', 'admin_compare', 'admin_batch', 'admin_history'].includes(action);
    if (isAdminAction) {
      // Verify Supabase admin via JWT
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return json({ error: 'Admin auth required' }, 401);
      }
      const jwt = authHeader.replace('Bearer ', '');
      const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
      if (userErr || !userData.user) {
        return json({ error: 'Invalid admin token' }, 401);
      }
      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userData.user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (!roleRow) {
        return json({ error: 'Admin role required' }, 403);
      }

      // ── Admin: Balance check (both providers, no billing) ──
      if (action === 'admin_balance') {
        const result: Record<string, unknown> = { providers: {} };
        const providers = result.providers as Record<string, unknown>;
        if (GETCID_TOKEN) {
          const r = await callGetCIDBalance(GETCID_TOKEN);
          providers.getcid = r.ok
            ? { balance: r.balance, status: 'ok', currency: 'USD', endpoint: GETCID_BALANCE_URL }
            : { error: r.error, status: 'error', raw: r.raw };
        } else {
          providers.getcid = { status: 'not_configured' };
        }
        if (GRAHOK_TOKEN) {
          const r = await callGrahokBalance(GRAHOK_TOKEN, GRAHOK_BAL);
          providers.grahok = r.ok
            ? { balance: r.balance, status: 'ok', endpoint: GRAHOK_BAL }
            : { error: r.error, status: 'error', raw: r.raw };
        } else {
          providers.grahok = { status: 'not_configured' };
        }
        return json(result);
      }

      // ── Admin: Direct CID generation (no balance deduction) ──
      if (action === 'admin_generate') {
        if (!installation_id || String(installation_id).trim().length < 4) {
          return json({ error: 'Installation ID too short' }, 400);
        }
        const provider = (body.provider as string) || 'auto'; // 'getcid' | 'grahok' | 'auto'
        const iid = String(installation_id).trim().replace(/\s+/g, ' ');
        const errors: Record<string, string> = {};
        let cidValue: string | null = null;
        let usedProvider = '';
        const startTime = Date.now();

        const tryGetCID = async () => {
          if (!GETCID_TOKEN) { errors.getcid = 'token not configured'; return; }
          const r = await callGetCID(GETCID_TOKEN, iid);
          if (r.ok && r.cid) { cidValue = r.cid; usedProvider = 'getcid'; }
          else errors.getcid = r.error || 'unknown';
        };
        const tryGrahok = async () => {
          if (!GRAHOK_TOKEN) { errors.grahok = 'token not configured'; return; }
          const r = await callGrahok(GRAHOK_TOKEN, GRAHOK_URL, iid);
          if (r.ok && r.cid) { cidValue = r.cid; usedProvider = 'grahok'; }
          else errors.grahok = r.error || 'unknown';
        };

        if (provider === 'getcid') await tryGetCID();
        else if (provider === 'grahok') await tryGrahok();
        else { await tryGetCID(); if (!cidValue) await tryGrahok(); }

        const elapsed = Date.now() - startTime;
        if (!cidValue) return json({ error: 'CID generation failed', details: errors, elapsed_ms: elapsed }, 502);
        return json({ cid: cidValue, provider: usedProvider, elapsed_ms: elapsed, billed: false });
      }

      // ── Admin: Compare both providers side-by-side ──
      if (action === 'admin_compare') {
        if (!installation_id || String(installation_id).trim().length < 4) {
          return json({ error: 'Installation ID too short' }, 400);
        }
        const iid = String(installation_id).trim().replace(/\s+/g, ' ');
        const t1 = Date.now();
        const [getcidRes, grahokRes] = await Promise.all([
          GETCID_TOKEN ? callGetCID(GETCID_TOKEN, iid) : Promise.resolve({ ok: false, error: 'not configured' }),
          GRAHOK_TOKEN ? callGrahok(GRAHOK_TOKEN, GRAHOK_URL, iid) : Promise.resolve({ ok: false, error: 'not configured' }),
        ]);
        return json({
          installation_id: iid,
          total_elapsed_ms: Date.now() - t1,
          getcid: getcidRes.ok
            ? { status: 'success', cid: getcidRes.cid }
            : { status: 'failed', error: getcidRes.error, raw: getcidRes.raw },
          grahok: grahokRes.ok
            ? { status: 'success', cid: grahokRes.cid }
            : { status: 'failed', error: grahokRes.error, raw: grahokRes.raw },
        });
      }

      // ── Admin: Batch generate (multiple IIDs at once) ──
      if (action === 'admin_batch') {
        const iids = body.installation_ids as unknown;
        if (!Array.isArray(iids) || iids.length === 0) {
          return json({ error: 'installation_ids must be a non-empty array' }, 400);
        }
        if (iids.length > 50) {
          return json({ error: 'Maximum 50 IIDs per batch' }, 400);
        }
        const provider = (body.provider as string) || 'auto';
        const results: Array<Record<string, unknown>> = [];
        for (const raw of iids) {
          const iid = String(raw).trim().replace(/\s+/g, ' ');
          if (iid.length < 4) {
            results.push({ installation_id: iid, status: 'skipped', error: 'too short' });
            continue;
          }
          const errors: Record<string, string> = {};
          let cidValue: string | null = null;
          let usedProvider = '';
          const tryGetCID = async () => {
            if (!GETCID_TOKEN) { errors.getcid = 'no token'; return; }
            const r = await callGetCID(GETCID_TOKEN, iid);
            if (r.ok && r.cid) { cidValue = r.cid; usedProvider = 'getcid'; }
            else errors.getcid = r.error || 'unknown';
          };
          const tryGrahok = async () => {
            if (!GRAHOK_TOKEN) { errors.grahok = 'no token'; return; }
            const r = await callGrahok(GRAHOK_TOKEN, GRAHOK_URL, iid);
            if (r.ok && r.cid) { cidValue = r.cid; usedProvider = 'grahok'; }
            else errors.grahok = r.error || 'unknown';
          };
          if (provider === 'getcid') await tryGetCID();
          else if (provider === 'grahok') await tryGrahok();
          else { await tryGetCID(); if (!cidValue) await tryGrahok(); }

          if (cidValue) results.push({ installation_id: iid, status: 'success', cid: cidValue, provider: usedProvider });
          else results.push({ installation_id: iid, status: 'failed', errors });
        }
        const successCount = results.filter(r => r.status === 'success').length;
        return json({ total: results.length, success: successCount, failed: results.length - successCount, results });
      }

      // ── Admin: All generations history ──
      if (action === 'admin_history') {
        const limit = Math.min(Number(body.limit) || 100, 500);
        const { data: generations } = await supabase
          .from('reseller_generations')
          .select('id, installation_id, cid, price_cents, created_at, user_id, reseller_users(username)')
          .order('created_at', { ascending: false })
          .limit(limit);
        return json({ generations: generations ?? [] });
      }
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
