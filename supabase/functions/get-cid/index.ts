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

// ─── Microsoft / Upstream error code mapper ─────────────────────────────
// Detects Microsoft activation error codes (0xC004C***) and known upstream
// failure patterns from raw provider responses, mapping them to clean
// English user-facing messages (no provider names exposed).
type MappedError = { code: string; message: string };
function mapUpstreamError(rawText: string): MappedError | null {
  if (!rawText) return null;
  const text = String(rawText);
  const lower = text.toLowerCase();

  // 1) Explicit hex code (e.g. 0xC004C003)
  const hexMatch = text.match(/0x[0-9A-Fa-f]{8}/);
  const code = hexMatch ? '0x' + hexMatch[0].slice(2).toUpperCase() : '';

  const codeMap: Record<string, string> = {
    '0xC004C008': 'Get confirmation on: Confirmation ID',
    '0xC004C020': 'Get your IID and set CID using CMD',
    '0xC004C060': 'Key blocked',
    '0xC004C003': 'Key blocked',
    '0xC004C004': 'Fake or invalid key',
  };

  if (code && codeMap[code]) {
    return { code, message: `Upstream error: ${codeMap[code]} (${code})` };
  }

  // 2) Pattern-based detection
  if (/dead key|blocked|cannot be activated/i.test(lower)) {
    return { code: code || '0xC004C003', message: `Upstream error: This product key is blocked (${code || '0xC004C003'})` };
  }
  if (/fake|invalid key/i.test(lower)) {
    return { code: code || '0xC004C004', message: 'Upstream error: Fake or invalid key (0xC004C004)' };
  }
  if (/unsupported|not support/i.test(lower)) {
    return { code: 'Unsupported', message: 'Unsupported: Contact us to add your key type to system' };
  }
  if (/invalid installation|iid invalid|installation id/i.test(lower)) {
    return { code: 'IID_INVALID', message: 'Invalid Installation ID. Please re-check and try again.' };
  }
  if (code) {
    return { code, message: `Upstream error: ${code}` };
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

async function callGrahokBalance(rawToken: string, balanceUrl: string): Promise<{ ok: boolean; balance?: number | null; raw?: string; error?: string; currency?: string }> {
  // Sanitize: strip whitespace, surrounding quotes, and accidental "Bearer " prefix
  const token = rawToken.trim().replace(/^Bearer\s+/i, '').replace(/^['"]|['"]$/g, '').trim();

  // Grahok strictly requires `?token=` — try it first, fall back to other names
  const variants = [
    `${balanceUrl}${balanceUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`,
    `${balanceUrl}${balanceUrl.includes('?') ? '&' : '?'}api_token=${encodeURIComponent(token)}`,
    `${balanceUrl}${balanceUrl.includes('?') ? '&' : '?'}apikey=${encodeURIComponent(token)}`,
  ];

  // Recursively pull a numeric value from any depth using known balance-like keys
  const BAL_KEYS = ['balance', 'amount', 'credit', 'credits', 'available', 'available_balance', 'wallet', 'wallet_balance', 'taka', 'bdt', 'fund', 'funds'];
  const CURRENCY_KEYS = ['currency', 'unit', 'symbol'];

  const findBalance = (obj: unknown): { value: number | null; currency?: string } => {
    if (obj == null) return { value: null };
    if (typeof obj === 'number') return { value: obj };
    if (typeof obj === 'string') {
      const n = parseFloat(obj);
      return { value: isNaN(n) ? null : n };
    }
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const r = findBalance(item);
        if (r.value !== null) return r;
      }
      return { value: null };
    }
    if (typeof obj === 'object') {
      const rec = obj as Record<string, unknown>;
      let currency: string | undefined;
      for (const ck of CURRENCY_KEYS) {
        if (typeof rec[ck] === 'string') { currency = rec[ck] as string; break; }
      }
      // First scan top-level keys
      for (const k of Object.keys(rec)) {
        if (BAL_KEYS.includes(k.toLowerCase())) {
          const v = rec[k];
          if (typeof v === 'number') return { value: v, currency };
          if (typeof v === 'string') {
            const n = parseFloat(v);
            if (!isNaN(n)) return { value: n, currency };
          }
        }
      }
      // Then recurse into nested objects (e.g. data, result, user)
      for (const v of Object.values(rec)) {
        if (v && typeof v === 'object') {
          const r = findBalance(v);
          if (r.value !== null) return { value: r.value, currency: r.currency || currency };
        }
      }
    }
    return { value: null };
  };

  if (!token) {
    return { ok: false, balance: null, error: 'Backup token is empty after sanitization. Please re-enter GRAHOK_API_TOKEN.', raw: '' };
  }

  let lastRaw = '';
  let bestErr = '';
  let bestStatus = 0;
  for (const url of variants) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json,text/plain', 'X-API-TOKEN': token, 'Authorization': `Bearer ${token}` },
      });
      const text = await res.text();
      lastRaw = text;
      console.log(`[grahok-balance] ${url.replace(token, '***')} → status=${res.status} body=${text.slice(0, 200)}`);

      let data: unknown = null;
      try { data = JSON.parse(text); } catch { /* not JSON */ }

      // Detect explicit error responses
      if (data && typeof data === 'object') {
        const rec = data as Record<string, unknown>;
        if (rec.ok === false || rec.success === false || (typeof rec.error === 'string' && rec.error)) {
          const errMsg = String(rec.error || rec.message || `HTTP ${res.status}`);
          // Prefer the more specific auth/format errors (401/403) over generic "missing param" (400)
          if (!bestErr || (res.status > bestStatus && res.status !== 400) || (bestStatus === 400 && res.status !== 400)) {
            bestErr = errMsg;
            bestStatus = res.status;
          }
          continue; // try next variant
        }
        const found = findBalance(data);
        if (found.value !== null) {
          return { ok: true, balance: found.value, currency: found.currency, raw: text };
        }
      }

      // Plain numeric body fallback
      const trimmed = text.trim();
      if (/^[0-9]+(?:\.[0-9]+)?$/.test(trimmed)) {
        return { ok: true, balance: parseFloat(trimmed), raw: text };
      }
      // Last-resort number scrape (only if HTTP ok)
      if (res.ok) {
        const m = text.match(/([0-9]+(?:\.[0-9]+)?)/);
        if (m) return { ok: true, balance: parseFloat(m[1]), raw: text };
      }
      if (!bestErr) bestErr = `Could not parse balance (HTTP ${res.status})`;
    } catch (e) {
      if (!bestErr) bestErr = String(e);
    }
  }
  return { ok: false, balance: null, error: bestErr || 'Unknown error', raw: lastRaw };
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

      if (!installation_id || String(installation_id).trim().length < 4) {
        return json({ ok: false, error: 'Installation ID too short' }, 400);
      }
      const iid = normalizeInstallationId(String(installation_id));

      // Check CID balance — every account (including admin) must have credits
      const { data: bal } = await supabase
        .from('cid_balances')
        .select('balance')
        .eq('user_id', auth.user.id)
        .maybeSingle();
      const currentBalance = bal?.balance ?? 0;
      if (currentBalance < 1) {
        return json({ ok: false, error: 'Insufficient CID credits. Please purchase more from the shop.', balance: currentBalance }, 402);
      }

      // Determine routing: which channel is PRIMARY (admin-configurable via site_settings)
      // value: 'getcid' (default) | 'grahok'
      let primaryChoice: 'getcid' | 'grahok' = 'getcid';
      try {
        const { data: setting } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'getcid_default_provider')
          .maybeSingle();
        const v = (setting?.value || '').toLowerCase().trim();
        if (v === 'grahok') primaryChoice = 'grahok';
      } catch (_) { /* default getcid */ }

      // Try PRIMARY then BACKUP based on admin choice
      let cidValue: string | null = null;
      let usedProvider = '';
      const errs: string[] = [];

      const tryGetcid = async () => {
        if (!GETCID_TOKEN) { errs.push('getcid: not configured'); return; }
        const r = await callGetCID(GETCID_TOKEN, iid);
        if (r.ok && r.cid) { cidValue = r.cid; usedProvider = primaryChoice === 'getcid' ? 'primary' : 'backup'; }
        else if (r.error) errs.push(`${primaryChoice === 'getcid' ? 'primary' : 'backup'} (getcid): ${r.error}`);
      };
      const tryGrahok = async () => {
        if (!GRAHOK_TOKEN) { errs.push('grahok: not configured'); return; }
        const r = await callGrahok(GRAHOK_TOKEN, GRAHOK_URL, iid);
        if (r.ok && r.cid) { cidValue = r.cid; usedProvider = primaryChoice === 'grahok' ? 'primary' : 'backup'; }
        else if (r.error) errs.push(`${primaryChoice === 'grahok' ? 'primary' : 'backup'} (grahok): ${r.error}`);
      };

      if (primaryChoice === 'getcid') {
        await tryGetcid();
        if (!cidValue) await tryGrahok();
      } else {
        await tryGrahok();
        if (!cidValue) await tryGetcid();
      }

      if (!cidValue) {
        const isAdmin = auth.roles?.includes('admin');
        const joined = errs.join(' ');
        // Log full provider details for admin / server logs
        console.log(`[user_getcid] failed for user=${auth.user.id} iid=${iid.slice(0,12)}... errs=${joined}`);

        // Try to detect a Microsoft / upstream error code from any provider response
        const mapped = mapUpstreamError(joined);

        if (isAdmin) {
          const detail = errs.length ? ` (${joined})` : '';
          return json({
            ok: false,
            error: mapped ? mapped.message : `CID generation failed${detail}`,
            code: mapped?.code,
            debug: errs,
          }, 502);
        }

        // Regular users — show clean upstream error if detected, else generic
        // Sanitize: never leak provider names, internal labels, URLs, or tokens
        const sanitize = (s: string) => s
          .replace(/getcid|grahok|primary|backup|provider|api[_-]?token|endpoint/gi, '')
          .replace(/https?:\/\/\S+/gi, '')
          .replace(/\s{2,}/g, ' ')
          .trim();

        if (mapped) {
          return json({ ok: false, error: sanitize(mapped.message), code: mapped.code }, 502);
        }

        const lower = joined.toLowerCase();
        let userMsg = 'এই Installation ID দিয়ে এখন Confirmation ID তৈরি করা যাচ্ছে না। অনুগ্রহ করে ID টি ঠিক আছে কিনা দেখে আবার চেষ্টা করুন।';
        if (lower.includes('timeout') || lower.includes('network')) {
          userMsg = 'সার্ভারে সংযোগ সমস্যা হচ্ছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
        }
        return json({ ok: false, error: userMsg }, 502);
      }

      // Debit 1 credit via RPC (atomic, race-safe)
      let newBalance = currentBalance;
      const { data: debitResult, error: debitErr } = await supabase.rpc('debit_cid_balance', {
        p_user_id: auth.user.id,
        p_amount: 1,
      });
      if (debitErr) {
        console.error('[debit_cid_balance] error', debitErr);
        return json({ ok: false, error: 'Failed to deduct credit. Please try again.' }, 500);
      }
      if (debitResult && typeof debitResult === 'object') {
        const dr = debitResult as Record<string, unknown>;
        if (dr.success === false) {
          return json({ ok: false, error: String(dr.error || 'Insufficient balance'), balance: Number(dr.balance) || 0 }, 402);
        }
        if ('balance' in dr) newBalance = Number(dr.balance) || 0;
      }

      // Log generation
      const { data: genRow } = await supabase.from('cid_generations').insert({
        user_id: auth.user.id,
        operator: 'microsoft',
        operator_name: 'Microsoft Confirmation ID',
        number: iid,
        result: { cid: cidValue, provider: usedProvider },
        status: 'success',
        cost: 1,
      }).select('id').single();

      // 📧 Auto-send Confirmation ID to the user's email
      // IMPORTANT: must await so the Deno edge runtime doesn't terminate
      // the request before send-transactional-email is invoked.
      try {
        const userEmail = auth.user.email;
        if (userEmail) {
          // Fetch display name (best-effort) — profiles uses user_id, not id
          let customerName = userEmail.split('@')[0];
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('user_id', auth.user.id)
              .maybeSingle();
            if (profile?.display_name) customerName = profile.display_name;
          } catch (_) { /* ignore */ }

          const orderId = genRow?.id ? String(genRow.id) : `${auth.user.id}-${Date.now()}`;
          const { error: emailErr } = await supabase.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'cid-delivery',
              recipientEmail: userEmail,
              idempotencyKey: `cid-delivery-${orderId}`,
              templateData: {
                customerName,
                orderId,
                installationId: iid,
                confirmationId: cidValue,
                remainingCredits: newBalance,
                generatedAt: new Date().toISOString(),
              },
            },
          });
          if (emailErr) {
            console.error('[cid-delivery-email] invoke error', emailErr);
          } else {
            console.log(`[cid-delivery-email] enqueued for ${userEmail}`);
          }
        } else {
          console.warn('[cid-delivery-email] no email on auth.user — skipped');
        }
      } catch (e) {
        console.error('[cid-delivery-email] unexpected error', e);
      }

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
          } else {
            providers.getcid = { status: 'error', error: r.error || 'Unknown error', raw: r.raw };
          }
        } else {
          providers.getcid = { status: 'not_configured' };
        }
        if (GRAHOK_TOKEN) {
          const r = await callGrahokBalance(GRAHOK_TOKEN, GRAHOK_BAL);
          if (r.ok && typeof r.balance === 'number') {
            providers.grahok = { balance: r.balance, currency: r.currency || 'BDT', status: 'ok', endpoint: GRAHOK_BAL };
          } else {
            providers.grahok = {
              status: 'error',
              error: r.error || 'Could not parse balance from response',
              raw: (r.raw || '').slice(0, 300),
              endpoint: GRAHOK_BAL,
            };
          }
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
        const iid = normalizeInstallationId(String(installation_id));
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
        const iid = normalizeInstallationId(String(installation_id));
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
          const iid = normalizeInstallationId(String(raw));
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
