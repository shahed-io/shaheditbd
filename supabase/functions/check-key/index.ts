import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CHECK_KEY_URL = 'https://panel.getcid.app/user-api/check-key';

// Status mapping for known error codes
const STATUS_MAP: Record<string, { status: 'live' | 'dead'; meaning: string }> = {
  '0xC004C008': { status: 'live', meaning: 'Valid, can be activated' },
  '0xC004C020': { status: 'live', meaning: 'Requires phone/web activation' },
  '0xC004C060': { status: 'dead', meaning: 'Key is blocked' },
  '0xC004C003': { status: 'dead', meaning: 'Invalid key' },
  '0xC004C004': { status: 'dead', meaning: 'Activation limit reached' },
};

function classify(errorCode: string | null | undefined): { status: 'live' | 'dead' | 'unknown'; meaning: string } {
  if (!errorCode) return { status: 'unknown', meaning: 'Unknown response' };
  const mapped = STATUS_MAP[errorCode.toUpperCase()];
  if (mapped) return mapped;
  // Heuristic fallback
  return { status: 'unknown', meaning: `Code ${errorCode}` };
}

function normalizeKey(k: string): string {
  return k.trim().toUpperCase().replace(/\s+/g, '');
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
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const rawKeys: string = (body?.keys ?? '').toString();
    if (!rawKeys.trim()) {
      return new Response(JSON.stringify({ error: 'Please provide at least one product key' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse keys: split by comma, newline, whitespace
    const keys = Array.from(new Set(
      rawKeys.split(/[\s,;]+/).map(normalizeKey).filter(k => k.length >= 5)
    )).slice(0, 50); // max 50 per request

    if (keys.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid keys found' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiToken = Deno.env.get('GETCID_API_TOKEN');
    if (!apiToken) {
      return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call upstream — supports comma-separated keys
    const url = `${CHECK_KEY_URL}?keys=${encodeURIComponent(keys.join(','))}&token=${encodeURIComponent(apiToken)}`;
    const upstream = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    const text = await upstream.text();

    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch {
      return new Response(JSON.stringify({ error: 'Service returned invalid response. Please try again.' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!parsed?.success) {
      const errMsg = parsed?.error || parsed?.message || 'Service error';
      return new Response(JSON.stringify({ error: typeof errMsg === 'string' ? errMsg : 'Service error' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize results
    const dataArr: any[] = Array.isArray(parsed.data) ? parsed.data.flat() : [];
    const results = dataArr.map((item: any) => {
      const errorCode = item?.errorCode || item?.error_code || null;
      const cls = classify(errorCode);
      return {
        key: item?.key ?? '',
        status: cls.status,
        meaning: cls.meaning,
        errorCode: errorCode,
        product: item?.prd || item?.product || null,
        subType: item?.subType || item?.sub_type || null,
        actType: item?.actType || item?.act_type || null,
        remaining: item?.remaining ?? null,
        time: item?.time ?? null,
      };
    });

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

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[check-key] error', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
