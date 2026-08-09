import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SITE_KEY = Deno.env.get('TURNSTILE_SITE_KEY') ?? '';
const SECRET_KEY = Deno.env.get('TURNSTILE_SECRET_KEY') ?? '';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // GET → publish the PUBLIC site key so the browser can render the widget.
  if (req.method === 'GET') {
    return json({ siteKey: SITE_KEY, enabled: Boolean(SITE_KEY && SECRET_KEY) });
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    const action = typeof body?.action === 'string' ? body.action.slice(0, 32) : '';

    if (!SECRET_KEY) return json({ success: true, skipped: 'not_configured' });
    if (!token || token.length > 4096) {
      return json({ success: false, error: 'missing_token' }, 400);
    }

    const ip =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      '';

    const form = new FormData();
    form.append('secret', SECRET_KEY);
    form.append('response', token);
    if (ip) form.append('remoteip', ip);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    const out = await res.json();

    if (!out.success) {
      console.log('turnstile failed', action, out['error-codes']);
      return json({ success: false, error: 'verification_failed', codes: out['error-codes'] ?? [] }, 403);
    }

    return json({ success: true });
  } catch (e) {
    console.error('turnstile error', e);
    return json({ success: false, error: 'server_error' }, 500);
  }
});
