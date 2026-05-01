import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// GetCID.xyz PidMS (Check Keys) endpoint — one key per request
const PIDMS_URL = 'https://bs.getcid.xyz/webapi/pidms/';

// Status mapping for known Microsoft activation error codes
const STATUS_MAP: Record<string, { status: 'live' | 'dead'; meaning: string }> = {
  '0X00000000': { status: 'live', meaning: 'Valid — can be activated online' },
  '0XC004C008': { status: 'live', meaning: 'Valid, can be activated' },
  '0XC004C020': { status: 'live', meaning: 'Requires phone/web activation' },
  '0XC004C060': { status: 'dead', meaning: 'Key is blocked' },
  '0XC004C003': { status: 'dead', meaning: 'Invalid / blocked key' },
  '0XC004C004': { status: 'dead', meaning: 'Activation limit reached / fake key' },
  '0XC004C001': { status: 'dead', meaning: 'Invalid product key' },
  '0XC004C017': { status: 'dead', meaning: 'Key blocked' },
  '0XC004C032': { status: 'dead', meaning: 'Key blocked' },
  '0XC004C050': { status: 'dead', meaning: 'Key blocked' },
};

function classify(errorCode: string | null | undefined): { status: 'live' | 'dead' | 'unknown'; meaning: string } {
  if (!errorCode) return { status: 'unknown', meaning: 'Unknown response' };
  // Extract just the hex code if PidMS returns something like "0xC004C008 [Get CID on getcid.xyz]"
  const match = errorCode.match(/0x[0-9A-Fa-f]+/);
  const key = (match ? match[0] : errorCode).toUpperCase();
  const mapped = STATUS_MAP[key];
  if (mapped) return mapped;
  return { status: 'unknown', meaning: `Code ${key}` };
}

function normalizeKey(k: string): string {
  return k.trim().toUpperCase().replace(/\s+/g, '');
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function safeErrorMessage(error: unknown, secrets: Array<string | undefined> = []) {
  let message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  for (const secret of secrets) {
    if (secret) message = message.split(secret).join('[REDACTED]');
  }
  return message;
}

interface PidMSResult {
  key: string;
  status: 'live' | 'dead' | 'unknown';
  meaning: string;
  errorCode: string | null;
  product: string | null;
  subType: string | null;
  actType: string | null;
  remaining: string | null;
  time: string | null;
}

async function checkSingleKey(key: string, token: string): Promise<PidMSResult> {
  const url = `${PIDMS_URL}?token=${encodeURIComponent(token)}&key=${encodeURIComponent(key)}&format=json`;
  try {
    const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    const text = await res.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch {
      return {
        key, status: 'unknown',
        meaning: 'Provider returned invalid JSON',
        errorCode: null, product: null, subType: null, actType: null,
        remaining: null, time: null,
      };
    }
    // PidMS json shape: { key, description, edition, error, time, remaining_count }
    const errorRaw: string | null = parsed?.error ?? null;
    const cls = classify(errorRaw);
    // Sanitize: keep only the hex code, strip provider attribution like "[Get CID on getcid.xyz]"
    let cleanErrorCode: string | null = null;
    if (errorRaw) {
      const m = errorRaw.match(/0x[0-9A-Fa-f]+/);
      cleanErrorCode = m ? m[0].toUpperCase() : errorRaw.replace(/\s*\[.*?\]\s*/g, '').trim();
    }
    return {
      key: parsed?.key || key,
      status: cls.status,
      meaning: cls.meaning,
      errorCode: cleanErrorCode,
      product: parsed?.description ?? null,
      subType: parsed?.edition ?? null,
      actType: null,
      remaining: parsed?.remaining_count != null ? String(parsed.remaining_count) : null,
      time: parsed?.time ?? null,
    };
  } catch (e) {
    console.error('[check-key] single-key fetch failed', safeErrorMessage(e, [token]));
    return {
      key, status: 'unknown',
      meaning: 'Network error contacting key checker',
      errorCode: null, product: null, subType: null, actType: null,
      remaining: null, time: null,
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Auth (require login)
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return jsonResponse({ error: 'Authentication required' }, 401);
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResponse({ error: 'Invalid session' }, 401);
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const rawKeys: string = (body?.keys ?? '').toString();
    if (!rawKeys.trim()) {
      return jsonResponse({ error: 'Please provide at least one product key' }, 400);
    }

    // Parse keys: split by comma, newline, whitespace
    const keys = Array.from(new Set(
      rawKeys.split(/[\s,;]+/).map(normalizeKey).filter(k => k.length >= 5)
    )).slice(0, 50);

    if (keys.length === 0) {
      return jsonResponse({ error: 'No valid keys found' }, 400);
    }

    const pidmsToken = Deno.env.get('GETCID_PIDMS_TOKEN');
    if (!pidmsToken) {
      return jsonResponse({ error: 'Service temporarily unavailable', fallback: true }, 200);
    }

    // PidMS only supports one key per request → run all in parallel with concurrency limit
    const CONCURRENCY = 5;
    const results: PidMSResult[] = [];
    for (let i = 0; i < keys.length; i += CONCURRENCY) {
      const chunk = keys.slice(i, i + CONCURRENCY);
      const chunkResults = await Promise.all(chunk.map(k => checkSingleKey(k, pidmsToken)));
      results.push(...chunkResults);
    }

    if (results.length === 0) {
      return jsonResponse({
        error: 'Service returned no key results. Please try again later.',
        fallback: true,
        results: [],
      }, 200);
    }

    // Log history (best effort, non-blocking)
    try {
      const admin = createClient(supabaseUrl, serviceRole);
      await admin.from('key_check_history').insert(
        results.map((r) => ({
          user_id: userId,
          key_value: r.key,
          status: r.status,
          error_code: r.errorCode,
          product: r.product,
          sub_type: r.subType,
          act_type: r.actType,
          remaining: r.remaining,
        }))
      );
    } catch (e) {
      console.log('[check-key] history log failed', String(e));
    }

    return jsonResponse({ success: true, results });
  } catch (e) {
    console.error('[check-key] error', safeErrorMessage(e, [Deno.env.get('GETCID_PIDMS_TOKEN')]));
    return jsonResponse({ error: 'Check key service failed. Please try again later.', fallback: true }, 200);
  }
});
