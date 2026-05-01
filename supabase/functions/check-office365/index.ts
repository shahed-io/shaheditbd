import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROVIDER_URL = 'https://getcid.info/api-check-account-office-365';
const MAX_PER_REQUEST = 100;
const CHUNK_SIZE = 50;

const AccountSchema = z.object({
  username: z.string().trim().min(3).max(255),
  password: z.string().min(1).max(255),
});

const BodySchema = z.object({
  accounts: z.array(AccountSchema).min(1).max(MAX_PER_REQUEST),
});

interface CheckResult {
  username: string;
  status_acc: string;
  meaning: string;
  category: 'success' | 'mfa' | 'invalid' | 'unknown';
}

function classify(status: string): { category: CheckResult['category']; meaning: string } {
  const s = (status || '').toLowerCase();
  if (s === 'success' || s === 'valid') {
    return { category: 'success', meaning: 'Valid — login successful' };
  }
  if (s.includes('more_information_required') || s.includes('mfa') || s.includes('interaction_required')) {
    return { category: 'mfa', meaning: 'Valid — MFA / extra verification required' };
  }
  if (
    s.includes('invalid_grant') ||
    s.includes('unauthorized') ||
    s.includes('invalid_user') ||
    s.includes('invalid_password') ||
    s.includes('account_locked') ||
    s.includes('user_not_found')
  ) {
    return { category: 'invalid', meaning: 'Invalid — wrong username or password' };
  }
  return { category: 'unknown', meaning: status || 'Unknown response' };
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function callProvider(chunk: { username: string; password: string }[]): Promise<any[]> {
  const payload = chunk.map((a) => ({ userName: a.username, password: a.password }));
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30_000);
  try {
    const res = await fetch(PROVIDER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    const text = await res.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch {
      throw new Error('Provider returned invalid JSON');
    }
    // Expected: { status: 'Success', res: [{ userName, password, status_acc }, ...] }
    if (parsed?.res && Array.isArray(parsed.res)) return parsed.res;
    if (Array.isArray(parsed)) return parsed;
    throw new Error(parsed?.message || 'Provider returned no results');
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return jsonResponse({ error: 'Authentication required' }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: 'Invalid session' }, 401);
    const userId = userData.user.id;

    const raw = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return jsonResponse({ error: 'Invalid input. Provide 1-100 accounts with username and password.' }, 400);
    }
    const accounts = parsed.data.accounts;

    // Dedupe by username
    const seen = new Set<string>();
    const unique = accounts.filter((a) => {
      const k = a.username.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    const results: CheckResult[] = [];
    for (let i = 0; i < unique.length; i += CHUNK_SIZE) {
      const chunk = unique.slice(i, i + CHUNK_SIZE);
      try {
        const res = await callProvider(chunk);
        for (const item of res) {
          const username = String(item?.userName ?? item?.username ?? '').trim();
          const status_acc = String(item?.status_acc ?? item?.status ?? 'unknown');
          const cls = classify(status_acc);
          results.push({ username, status_acc, ...cls });
        }
        // Small delay between chunks to avoid IP-block
        if (i + CHUNK_SIZE < unique.length) await new Promise((r) => setTimeout(r, 800));
      } catch (e) {
        console.error('[check-office365] chunk failed', e instanceof Error ? e.message : String(e));
        // Mark this chunk as unknown so user sees feedback
        for (const a of chunk) {
          results.push({
            username: a.username,
            status_acc: 'network_error',
            category: 'unknown',
            meaning: 'Provider unreachable or temporarily blocked. Please try again in a moment.',
          });
        }
      }
    }

    if (results.length === 0) {
      return jsonResponse({ error: 'No results returned. Please try again later.', fallback: true, results: [] });
    }

    // Log history (username + status only — never password)
    try {
      const admin = createClient(supabaseUrl, serviceRole);
      await admin.from('office365_check_history').insert(
        results.map((r) => ({
          user_id: userId,
          username: r.username,
          status_acc: r.status_acc,
        }))
      );
    } catch (e) {
      console.log('[check-office365] history log failed', String(e));
    }

    return jsonResponse({ success: true, results });
  } catch (e) {
    console.error('[check-office365] error', e instanceof Error ? e.message : String(e));
    return jsonResponse({ error: 'Office 365 check service failed. Please try again later.', fallback: true }, 200);
  }
});
