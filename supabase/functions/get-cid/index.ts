import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PRICE_CENTS = 100; // $1 per CID

// ─── Provider endpoints ────────────────────────────────────────────────
const GETCID_API_URL     = 'https://panel.getcid.app/user-api/getcid';
const GETCID_BALANCE_URL = 'https://panel.getcid.app/user-api/checkbalance';

function normalizeInstallationId(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 63) {
    return Array.from({ length: 9 }, (_, i) => digits.slice(i * 7, i * 7 + 7)).join('-');
  }
  return trimmed.replace(/[\s_]+/g, '-').replace(/-+/g, '-');
}

function readStringField(data: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return null;
}

// ─── Provider call: GetCID.app ─────────────────────────────────────────
async function callGetCID(token: string, iid: string): Promise<{ ok: boolean; cid?: string; error?: string; raw?: string }> {
  const normalizedIid = normalizeInstallationId(iid);
  const url = `${GETCID_API_URL}?token=${encodeURIComponent(token)}&iid=${encodeURIComponent(normalizedIid)}`;
  try {
    const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try { data = JSON.parse(text); } catch {
      return { ok: false, error: 'Invalid JSON from GetCID', raw: text };
    }
    // Provider docs show { cid: "..." }; some responses use confirmationid/confirmation_id.
    const cidVal = readStringField(data, ['cid', 'confirmationid', 'confirmation_id', 'confirmationId', 'confirmationID']);
    if (cidVal) return { ok: true, cid: cidVal };

    const errMsg = readStringField(data, ['error', 'message', 'result']) || 'No CID returned';
    console.log(`[getcid] iid=${normalizedIid.slice(0,12)}... result=${errMsg} raw=${text.slice(0,200)}`);
    return { ok: false, error: errMsg, raw: text };
  } catch (e) {
    return { ok: false, error: `GetCID network error: ${String(e)}` };
  }
}

async function tryGetCIDBalanceVariant(url: string): Promise<{ ok: boolean; balance?: number; raw?: string; error?: string; status?: number }> {
  try {
    const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json,text/plain' } });
    const text = await res.text();
    const trimmed = text.trim();
    // Reject known error strings
    if (/user id is required/i.test(trimmed) || /invalid token/i.test(trimmed) || /unauthor/i.test(trimmed)) {
      return { ok: false, error: trimmed.slice(0, 120), raw: text, status: res.status };
    }
    // Try JSON first
    try {
      const data = JSON.parse(text);
      const bal = data.balance ?? data.amount ?? data.credits ?? data.user_balance ?? data.data?.balance;
      if (typeof bal === 'number') return { ok: true, balance: bal, raw: text, status: res.status };
      if (typeof bal === 'string') {
        const n = parseFloat(bal);
        if (!isNaN(n)) return { ok: true, balance: n, raw: text, status: res.status };
      }
    } catch { /* not JSON, fall through */ }
    // Plain numeric body (e.g. "12.50")
    if (/^[0-9]+(?:\.[0-9]+)?$/.test(trimmed)) {
      return { ok: true, balance: parseFloat(trimmed), raw: text, status: res.status };
    }
    // Find a number anywhere
    const m = text.match(/([0-9]+(?:\.[0-9]+)?)/);
    if (m) return { ok: true, balance: parseFloat(m[1]), raw: text, status: res.status };
    return { ok: false, error: 'Could not parse balance', raw: text.slice(0, 200), status: res.status };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function callGetCIDBalance(token: string, userId?: string): Promise<{ ok: boolean; balance?: number; raw?: string; error?: string }> {
  // Provider docs: /checkbalance?uye_rand=YOUR_TOKEN. Keep legacy variants as fallback.
  const variants: string[] = [];
  const t = encodeURIComponent(token);
  variants.push(`${GETCID_BALANCE_URL}?uye_rand=${t}`);
  if (userId) {
    const u = encodeURIComponent(userId);
    variants.push(`${GETCID_BALANCE_URL}?uye_rand=${t}&user_id=${u}`);
    variants.push(`${GETCID_BALANCE_URL}?token=${t}&user_id=${u}`);
    variants.push(`${GETCID_BALANCE_URL}?token=${t}&userid=${u}`);
    variants.push(`${GETCID_BALANCE_URL}?token=${t}&userId=${u}`);
    variants.push(`${GETCID_BALANCE_URL}?token=${t}&id=${u}`);
  }
  variants.push(`${GETCID_BALANCE_URL}?token=${t}`);

  let lastErr: { ok: boolean; error?: string; raw?: string } = { ok: false, error: 'No variant succeeded' };
  for (const url of variants) {
    const r = await tryGetCIDBalanceVariant(url);
    console.log(`[getcid-balance] ${url.replace(token, '***')} → status=${r.status} ok=${r.ok} raw=${(r.raw || '').slice(0, 80)}`);
    if (r.ok) return r;
    lastErr = r;
  }
  return lastErr;
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

  // ── Helper: validate Supabase JWT and return user + roles ────────────
  const authenticate = async () => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return { error: 'Authentication required', status: 401 as const };
    const jwt = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !userData.user) return { error: 'Invalid session', status: 401 as const };
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id);
    const roleList = (roles ?? []).map((r: { role: string }) => r.role);
    return { user: userData.user, roles: roleList };
  };

  try {
    const body = await req.json().catch(() => ({}));
    const { action, installation_id } = body;

    // ═══════════════════════════════════════════════════════════════
    // USER ACTIONS — any authenticated user (uses cid_balances credits)
    // ═══════════════════════════════════════════════════════════════

    if (action === 'user_balance') {
      const auth = await authenticate();
      if ('error' in auth) return json({ ok: false, error: auth.error }, auth.status);
      const { data: bal } = await supabase
        .from('cid_balances')
        .select('balance, total_added, total_used')
        .eq('user_id', auth.user.id)
        .maybeSingle();
      return json({
        ok: true,
        balance: bal?.balance ?? 0,
        total_added: bal?.total_added ?? 0,
        total_used: bal?.total_used ?? 0,
      });
    }

    if (action === 'user_history') {
      const auth = await authenticate();
      if ('error' in auth) return json({ ok: false, error: auth.error }, auth.status);
      const { data: gens } = await supabase
        .from('cid_generations')
        .select('id, number, operator, operator_name, result, status, cost, created_at')
        .eq('user_id', auth.user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      return json({ ok: true, generations: gens ?? [] });
    }

    if (action === 'parse_screenshot') {
      const auth = await authenticate();
      if ('error' in auth) return json({ ok: false, error: auth.error }, auth.status);
      const imageBase64 = body.image_base64 as string | undefined;
      if (!imageBase64 || imageBase64.length < 100) {
        return json({ ok: false, error: 'image_base64 required' }, 400);
      }
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) return json({ ok: false, error: 'AI not configured' }, 500);
      try {
        const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'You extract Microsoft Installation IDs from screenshots. The format is 9 groups of 7 digits separated by dashes or spaces (e.g., 1234567-1234567-...). Return ONLY the digits in 9 groups separated by single dashes. No explanation.',
              },
              {
                role: 'user',
                content: [
                  { type: 'text', text: 'Extract the Installation ID from this screenshot. Return only the 9 groups of 7 digits separated by dashes.' },
                  { type: 'image_url', image_url: { url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}` } },
                ],
              },
            ],
          }),
        });
        if (!aiResp.ok) {
          if (aiResp.status === 429) return json({ ok: false, error: 'Too many requests, try again shortly.' }, 429);
          if (aiResp.status === 402) return json({ ok: false, error: 'AI credits exhausted.' }, 402);
          return json({ ok: false, error: 'AI vision failed' }, 500);
        }
        const aiData = await aiResp.json();
        const raw = String(aiData.choices?.[0]?.message?.content ?? '').trim();
        // Extract numeric groups
        const digits = raw.replace(/[^0-9]/g, '');
        if (digits.length < 50) {
          return json({ ok: false, error: 'Could not detect a valid Installation ID. Try a clearer screenshot.' }, 422);
        }
        // Reformat into 9 groups of 7
        const groups: string[] = [];
        for (let i = 0; i < digits.length && groups.length < 9; i += 7) {
          groups.push(digits.substr(i, 7));
        }
        return json({ ok: true, installation_id: groups.join('-') });
      } catch (e) {
        return json({ ok: false, error: `Vision error: ${String(e)}` }, 500);
      }
    }

    if (action === 'user_getcid') {
      const auth = await authenticate();
      if ('error' in auth) return json({ ok: false, error: auth.error }, auth.status);
      const isAdmin = auth.roles.includes('admin');

      if (!installation_id || String(installation_id).trim().length < 4) {
        return json({ ok: false, error: 'Installation ID too short' }, 400);
      }
      const iid = String(installation_id).trim().replace(/\s+/g, ' ');

      // Check CID balance (admins skip)
      let currentBalance = 0;
      if (!isAdmin) {
        const { data: bal } = await supabase
          .from('cid_balances')
          .select('balance')
          .eq('user_id', auth.user.id)
          .maybeSingle();
        currentBalance = bal?.balance ?? 0;
        if (currentBalance < 1) {
          return json({ ok: false, error: 'Insufficient CID credits. Please purchase more from the shop.', balance: currentBalance }, 402);
        }
      }

      // Try PRIMARY then BACKUP
      let cidValue: string | null = null;
      let usedProvider = '';
      const errs: string[] = [];
      if (GETCID_TOKEN) {
        const r = await callGetCID(GETCID_TOKEN, iid);
        if (r.ok && r.cid) { cidValue = r.cid; usedProvider = 'primary'; }
        else if (r.error) errs.push(`primary: ${r.error}`);
      }
      if (!cidValue && GRAHOK_TOKEN) {
        const r = await callGrahok(GRAHOK_TOKEN, GRAHOK_URL, iid);
        if (r.ok && r.cid) { cidValue = r.cid; usedProvider = 'backup'; }
        else if (r.error) errs.push(`backup: ${r.error}`);
      }
      if (!cidValue) {
        const detail = errs.length ? ` (${errs.join(' | ')})` : '';
        return json({ ok: false, error: `CID generation failed${detail}` }, 502);
      }

      // Debit 1 credit (admins skip) using RPC
      let newBalance = currentBalance;
      if (!isAdmin) {
        const { data: debitResult } = await supabase.rpc('debit_cid_balance', {
          p_user_id: auth.user.id,
          p_amount: 1,
        });
        if (debitResult && typeof debitResult === 'object' && 'balance' in debitResult) {
          newBalance = Number((debitResult as Record<string, unknown>).balance) || 0;
        }
      }

      // Log generation
      await supabase.from('cid_generations').insert({
        user_id: auth.user.id,
        operator: 'microsoft',
        operator_name: 'Microsoft Confirmation ID',
        number: iid,
        result: { cid: cidValue, provider: usedProvider },
        status: 'success',
        cost: isAdmin ? 0 : 1,
      });

      return json({ ok: true, cid: cidValue, balance: newBalance });
    }

    // ═══════════════════════════════════════════════════════════════
    // ADMIN-ONLY ACTIONS
    // ═══════════════════════════════════════════════════════════════
    const isAdminAction = ['admin_balance', 'admin_generate', 'admin_compare', 'admin_batch'].includes(action);
    if (isAdminAction) {
      const auth = await authenticate();
      if ('error' in auth) return json({ error: auth.error }, auth.status);
      if (!auth.roles.includes('admin')) return json({ error: 'Admin role required' }, 403);

      if (action === 'admin_balance') {
        const result: Record<string, unknown> = { providers: {} };
        const providers = result.providers as Record<string, unknown>;
        const GETCID_USER_ID = Deno.env.get('GETCID_USER_ID');
        if (GETCID_TOKEN) {
          const r = await callGetCIDBalance(GETCID_TOKEN, GETCID_USER_ID);
          if (r.ok) {
            providers.getcid = { balance: r.balance, status: 'ok', currency: 'USD', endpoint: GETCID_BALANCE_URL };
          } else if (!GETCID_USER_ID) {
            providers.getcid = { status: 'unavailable', message: 'Set GETCID_USER_ID secret to enable balance', endpoint: GETCID_BALANCE_URL };
          } else {
            providers.getcid = { status: 'error', error: r.error || 'Unknown error', raw: r.raw };
          }
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

      if (action === 'admin_generate') {
        if (!installation_id || String(installation_id).trim().length < 4) {
          return json({ error: 'Installation ID too short' }, 400);
        }
        const provider = (body.provider as string) || 'auto';
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
    }

    return json({ error: 'Invalid action' }, 400);
  } catch (err) {
    return json({ error: 'Server error', detail: String(err) }, 500);
  }
});
