import { supabase } from '@/integrations/supabase/client';

// Lightweight UA parser (no extra dependency)
function parseUserAgent(ua: string) {
  let browser = 'Unknown browser';
  let os = 'Unknown OS';
  let device = 'Desktop';

  // OS
  if (/Windows NT 10/.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT 6\.3/.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6\.2/.test(ua)) os = 'Windows 8';
  else if (/Windows NT 6\.1/.test(ua)) os = 'Windows 7';
  else if (/Mac OS X ([\d_\.]+)/.test(ua)) {
    const m = ua.match(/Mac OS X ([\d_\.]+)/);
    os = `macOS ${(m?.[1] || '').replace(/_/g, '.')}`;
  }
  else if (/Android ([\d\.]+)/.test(ua)) {
    const m = ua.match(/Android ([\d\.]+)/);
    os = `Android ${m?.[1] || ''}`;
  }
  else if (/iPhone OS ([\d_]+)|CPU OS ([\d_]+)/.test(ua)) {
    const m = ua.match(/(?:iPhone OS|CPU OS) ([\d_]+)/);
    os = `iOS ${(m?.[1] || '').replace(/_/g, '.')}`;
  }
  else if (/Linux/.test(ua)) os = 'Linux';

  // Browser
  if (/Edg\/([\d\.]+)/.test(ua)) browser = `Edge ${ua.match(/Edg\/([\d\.]+)/)?.[1]}`;
  else if (/OPR\/([\d\.]+)|Opera/.test(ua)) browser = `Opera ${ua.match(/OPR\/([\d\.]+)/)?.[1] || ''}`;
  else if (/Chrome\/([\d\.]+)/.test(ua) && !/Edg|OPR/.test(ua)) browser = `Chrome ${ua.match(/Chrome\/([\d\.]+)/)?.[1]}`;
  else if (/Firefox\/([\d\.]+)/.test(ua)) browser = `Firefox ${ua.match(/Firefox\/([\d\.]+)/)?.[1]}`;
  else if (/Version\/([\d\.]+).*Safari/.test(ua)) browser = `Safari ${ua.match(/Version\/([\d\.]+)/)?.[1]}`;

  // Device
  if (/iPhone/.test(ua)) device = 'iPhone';
  else if (/iPad/.test(ua)) device = 'iPad';
  else if (/Android/.test(ua) && /Mobile/.test(ua)) device = 'Android Phone';
  else if (/Android/.test(ua)) device = 'Android Tablet';
  else if (/Mobile|Tablet/.test(ua)) device = 'Mobile';

  return { browser, os, device };
}

async function fetchIpInfo(): Promise<{ ip: string; location: string }> {
  try {
    const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
    if (res.ok) {
      const j = await res.json();
      const city = j.city || '';
      const region = j.region || '';
      const country = j.country_name || '';
      const loc = [city, region, country].filter(Boolean).join(', ') || 'Unknown location';
      return { ip: j.ip || 'Unknown', location: loc };
    }
  } catch { /* fall through */ }
  // Fallback: ip only
  try {
    const r = await fetch('https://api.ipify.org?format=json');
    const j = await r.json();
    return { ip: j.ip || 'Unknown', location: 'Unknown location' };
  } catch {
    return { ip: 'Unknown', location: 'Unknown location' };
  }
}

const SENT_KEY = 'login_notify_sent_at';

/**
 * Sends a login notification email with device + IP details.
 * Throttled: at most once per 60 seconds per browser to avoid duplicate sends
 * (auth event fires on tab focus / token refresh too).
 */
export async function sendLoginNotification(opts: {
  email: string;
  customerName?: string;
  isAdmin?: boolean;
}) {
  if (!opts?.email) return;
  try {
    // Throttle
    const last = Number(sessionStorage.getItem(SENT_KEY) || '0');
    if (Date.now() - last < 60_000) return;
    sessionStorage.setItem(SENT_KEY, String(Date.now()));

    const ua = navigator.userAgent || '';
    const { browser, os, device } = parseUserAgent(ua);
    const { ip, location } = await fetchIpInfo();

    const loginTime = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'long',
      timeZone: 'Asia/Dhaka',
    });

    await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'login-notification',
        recipientEmail: opts.email,
        idempotencyKey: `login-${opts.email}-${Date.now()}`,
        templateData: {
          customerName: opts.customerName || opts.email.split('@')[0],
          email: opts.email,
          ipAddress: ip,
          location,
          device,
          browser,
          os,
          loginTime,
          isAdmin: !!opts.isAdmin,
        },
      },
    });
  } catch (e) {
    // Silent — never block login on notification failure
    console.warn('Login notification failed:', e);
  }
}

export async function sendWelcomeEmail(email: string, customerName?: string) {
  if (!email) return;
  try {
    await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'welcome',
        recipientEmail: email,
        idempotencyKey: `welcome-${email}`,
        templateData: { customerName: customerName || email.split('@')[0] },
      },
    });
  } catch (e) {
    console.warn('Welcome email failed:', e);
  }
}
