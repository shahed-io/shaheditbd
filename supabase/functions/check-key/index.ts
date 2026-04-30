import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// GetCIDinfo.com documented Bulk License Key Checker endpoint
// GET https://api.getcidinfo.com/v1/check_keys?api_key=[API_KEY]&keys=[KEY1,KEY2]
const CHECK_KEY_URL = 'https://api.getcidinfo.com/v1/check_keys';

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
  const key = errorCode.toUpperCase();
  const mapped = STATUS_MAP[key];
  if (mapped) return mapped;
  return { status: 'unknown', meaning: `Code ${errorCode}` };
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

function getProviderData(parsed: any): { ok: boolean; data: any[]; message?: string } {
  if (parsed?.status === 'success') {
    const results = Array.isArray(parsed?.results) ? parsed.results : [];
    return { ok: true, data: results };
  }

  if (parsed?.success === true) {
    const rawData = parsed?.data;
    const data = Array.isArray(rawData)
      ? (Array.isArray(rawData[0]) ? rawData.flat() : rawData)
      : [];
    return { ok: true, data };
  }

  return {
    ok: false,
    data: [],
    message: parsed?.error || parsed?.message || parsed?.code || 'Provider returned an error',
  };
}

function safeErrorMessage(error: unknown, secrets: Array<string | undefined> = []) {
  let message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  for (const secret of secrets) {
    if (secret) message = message.split(secret).join('[REDACTED]');
  }
  return message;
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
    )).slice(0, 50); // max 50 per request

    if (keys.length === 0) {
      return jsonResponse({ error: 'No valid keys found' }, 400);
    }

    const apiKey = Deno.env.get('GETCIDINFO_API_KEY');
    if (!apiKey) {
      return jsonResponse({ error: 'Service temporarily unavailable', fallback: true }, 200);
    }

    // Call upstream — comma-separated keys
    const url = `${CHECK_KEY_URL}?api_key=${encodeURIComponent(apiKey)}&keys=${encodeURIComponent(keys.join(','))}`;
    let upstream: Response;
    try {
      upstream = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    } catch (fetchError) {
      console.error('[check-key] upstream fetch failed', safeErrorMessage(fetchError, [apiKey]));
      return jsonResponse({ error: 'Key checking service is unreachable right now. Please try again later.', fallback: true }, 200);
    }
    const text = await upstream.text();
    console.log('[check-key] upstream status', upstream.status, 'body', text.slice(0, 500));

    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch {
      return jsonResponse({
        error: 'Key checking service is not returning JSON right now. Please try again later.',
        fallback: true,
      }, 200);
    }

    const provider = getProviderData(parsed);
    if (!provider.ok) {
      return jsonResponse({
        error: typeof provider.message === 'string' ? provider.message : 'Service error',
        fallback: true,
      }, 200);
    }

    // Supported response shapes:
    // GetCIDinfo: { status: 'success', results: [{ key, description, sub_type, error_code }] }
    // GetCID.app fallback: { success: true, data: [{ key, errorCode, prd, subType, actType, remaining, time }] }
    const dataArr = provider.data;
    const results = dataArr.map((item: any) => {
      const errorCode = item?.errorCode || item?.error_code || null;
      const cls = classify(errorCode);
      return {
        key: item?.key ?? '',
        status: cls.status,
        meaning: cls.meaning,
        errorCode: errorCode,
        product: item?.prd || item?.product || item?.description || null,
        subType: item?.subType || item?.sub_type || null,
        actType: item?.actType || item?.act_type || null,
        remaining: item?.remaining ?? null,
        time: item?.time ?? null,
      };
    });

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
          remaining: r.remaining ? String(r.remaining) : null,
        }))
      );
    } catch (e) {
      console.log('[check-key] history log failed', String(e));
    }

    return jsonResponse({ success: true, results });
  } catch (e) {
    console.error('[check-key] error', safeErrorMessage(e, [Deno.env.get('GETCIDINFO_API_KEY'), Deno.env.get('GETCID_API_TOKEN')]));
    return jsonResponse({ error: 'Check key service failed. Please try again later.', fallback: true }, 200);
  }
});
