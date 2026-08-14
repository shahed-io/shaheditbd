// Bot-resistant signup endpoint.
// Layers: Cloudflare Turnstile (optional, enabled when TURNSTILE_SECRET_KEY is set),
// honeypot field, submit-timing check, disposable-email blocklist and IP rate limits.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// Common throwaway / disposable mail providers used by bots
const DISPOSABLE = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.info', 'sharklasers.com',
  '10minutemail.com', 'tempmail.com', 'temp-mail.org', 'yopmail.com', 'trashmail.com',
  'getnada.com', 'dispostable.com', 'fakeinbox.com', 'maildrop.cc', 'mintemail.com',
  'throwawaymail.com', 'moakt.com', 'emailondeck.com', 'mohmal.com', 'tempr.email',
  'spam4.me', 'grr.la', 'inboxbear.com', 'mailnesia.com', 'tempmailo.com',
  'byom.de', 'discard.email', 'einrot.com', 'cuvox.de', 'dayrep.com', 'armyspy.com',
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const ip =
    req.headers.get('cf-connecting-ip') ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    'unknown';
  const userAgent = req.headers.get('user-agent') || '';

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const log = async (email: string, success: boolean, reason?: string) => {
    try {
      await admin.from('signup_attempts').insert({ ip, email, user_agent: userAgent, success, reason: reason ?? null });
    } catch { /* never block signup on logging */ }
  };

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const name = String(body.name ?? '').trim();
    const honeypot = String(body.company ?? '').trim(); // hidden field: humans leave empty
    const elapsedMs = Number(body.elapsedMs ?? 0);
    const captchaToken = String(body.captchaToken ?? '');

    // --- 1. Basic validation ---
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return json({ error: 'সঠিক ইমেইল দিন।' }, 400);
    }
    if (password.length < 8 || password.length > 72) {
      return json({ error: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।' }, 400);
    }
    if (name.length < 2 || name.length > 80) {
      return json({ error: 'সঠিক নাম দিন।' }, 400);
    }

    // --- 2. Honeypot ---
    if (honeypot) {
      await log(email, false, 'honeypot');
      return json({ error: 'অনুরোধটি গ্রহণ করা যায়নি।' }, 400);
    }

    // --- 3. Submit-timing: bots fill forms instantly ---
    if (elapsedMs > 0 && elapsedMs < 2500) {
      await log(email, false, 'too_fast');
      return json({ error: 'একটু ধীরে চেষ্টা করুন — ফর্মটি খুব দ্রুত পূরণ হয়েছে।' }, 429);
    }

    // --- 4. Disposable email blocklist ---
    const domain = email.split('@')[1] ?? '';
    if (DISPOSABLE.has(domain)) {
      await log(email, false, 'disposable_email');
      return json({ error: 'অস্থায়ী (temporary) ইমেইল দিয়ে অ্যাকাউন্ট খোলা যাবে না।' }, 400);
    }

    // --- 5. Cloudflare Turnstile (optional — only verified when the client sends a token) ---
    const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
    if (secret && captchaToken) {
      const form = new URLSearchParams();
      form.set('secret', secret);
      form.set('response', captchaToken);
      if (ip !== 'unknown') form.set('remoteip', ip);
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });
      const verify = await verifyRes.json().catch(() => ({ success: false }));
      if (!verify?.success) {
        await log(email, false, 'captcha_failed');
        return json({ error: 'Human verification ব্যর্থ হয়েছে। আবার চেষ্টা করুন।' }, 403);
      }
    }

    // --- 6. IP rate limits ---
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    if (ip !== 'unknown') {
      const { count: hourCount } = await admin
        .from('signup_attempts').select('id', { count: 'exact', head: true })
        .eq('ip', ip).gte('created_at', hourAgo);
      if ((hourCount ?? 0) >= 5) {
        await log(email, false, 'rate_limit_hour');
        return json({ error: 'অনেকবার চেষ্টা করা হয়েছে। ১ ঘণ্টা পরে আবার চেষ্টা করুন।' }, 429);
      }
      const { count: dayCount } = await admin
        .from('signup_attempts').select('id', { count: 'exact', head: true })
        .eq('ip', ip).gte('created_at', dayAgo);
      if ((dayCount ?? 0) >= 15) {
        await log(email, false, 'rate_limit_day');
        return json({ error: 'আজকের সীমা শেষ। ২৪ ঘণ্টা পরে আবার চেষ্টা করুন।' }, 429);
      }
    }

    // --- 7. Create the account (email pre-confirmed, matching site policy) ---
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: name },
    });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      await log(email, false, `create_failed:${msg.slice(0, 60)}`);
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
        return json({ error: 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট রয়েছে। লগইন করুন।' }, 409);
      }
      if (msg.includes('password')) {
        return json({ error: 'পাসওয়ার্ডটি যথেষ্ট শক্তিশালী নয়। অন্য একটি দিন।' }, 400);
      }
      return json({ error: 'অ্যাকাউন্ট তৈরি করা যায়নি। আবার চেষ্টা করুন।' }, 400);
    }

    await log(email, true, 'ok');
    return json({ success: true, user_id: data.user?.id ?? null });
  } catch (e) {
    console.error('secure-signup error', e);
    return json({ error: 'সার্ভার সমস্যা হয়েছে। আবার চেষ্টা করুন।' }, 500);
  }
});
