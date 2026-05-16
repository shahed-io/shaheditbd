import { supabase } from '@/integrations/supabase/client';

// ---------- User-Agent parsing ----------

function parseOS(ua: string): string {
  // Windows
  if (/Windows NT 10/.test(ua)) {
    // Windows 11 reports NT 10.0 too — can't reliably distinguish from UA alone
    return 'Windows 10/11';
  }
  if (/Windows NT 6\.3/.test(ua)) return 'Windows 8.1';
  if (/Windows NT 6\.2/.test(ua)) return 'Windows 8';
  if (/Windows NT 6\.1/.test(ua)) return 'Windows 7';

  // iOS / iPadOS
  const iosMatch = ua.match(/(?:iPhone OS|CPU OS|iPad; CPU OS) ([\d_]+)/);
  if (iosMatch) return `iOS ${iosMatch[1].replace(/_/g, '.')}`;
  if (/Mac OS X/.test(ua) && /Mobile/.test(ua)) return 'iPadOS';

  // Android
  const androidMatch = ua.match(/Android ([\d\.]+)/);
  if (androidMatch) return `Android ${androidMatch[1]}`;
  if (/Android/.test(ua)) return 'Android';

  // macOS
  const macMatch = ua.match(/Mac OS X ([\d_\.]+)/);
  if (macMatch) return `macOS ${macMatch[1].replace(/_/g, '.')}`;

  // Linux distros
  if (/Ubuntu/.test(ua)) return 'Ubuntu Linux';
  if (/CrOS/.test(ua)) return 'ChromeOS';
  if (/Linux/.test(ua)) return 'Linux';

  return 'Unknown OS';
}

function parseBrowser(ua: string): string {
  // Order matters — check most specific first
  let m: RegExpMatchArray | null;

  if ((m = ua.match(/Edg(?:e|A|iOS)?\/([\d\.]+)/))) return `Edge ${m[1]}`;
  if ((m = ua.match(/OPR\/([\d\.]+)/)) || (m = ua.match(/Opera\/([\d\.]+)/))) return `Opera ${m[1]}`;
  if ((m = ua.match(/Vivaldi\/([\d\.]+)/))) return `Vivaldi ${m[1]}`;
  if ((m = ua.match(/Brave\/([\d\.]+)/))) return `Brave ${m[1]}`;
  if ((m = ua.match(/SamsungBrowser\/([\d\.]+)/))) return `Samsung Internet ${m[1]}`;
  if ((m = ua.match(/UCBrowser\/([\d\.]+)/))) return `UC Browser ${m[1]}`;
  if ((m = ua.match(/MiuiBrowser\/([\d\.]+)/))) return `Mi Browser ${m[1]}`;
  if ((m = ua.match(/HuaweiBrowser\/([\d\.]+)/))) return `Huawei Browser ${m[1]}`;
  if ((m = ua.match(/YaBrowser\/([\d\.]+)/))) return `Yandex ${m[1]}`;
  if ((m = ua.match(/DuckDuckGo\/([\d\.]+)/))) return `DuckDuckGo ${m[1]}`;
  if (/FBAN|FBAV/.test(ua)) {
    const v = ua.match(/FBAV\/([\d\.]+)/);
    return `Facebook App${v ? ` ${v[1]}` : ''}`;
  }
  if (/Instagram/.test(ua)) return 'Instagram In-App';
  if (/Line\//.test(ua)) return 'LINE In-App';
  if (/FB_IAB|FBAN/.test(ua)) return 'Facebook In-App';

  // iOS WebViews / Chrome on iOS / Firefox on iOS
  if ((m = ua.match(/CriOS\/([\d\.]+)/))) return `Chrome (iOS) ${m[1]}`;
  if ((m = ua.match(/FxiOS\/([\d\.]+)/))) return `Firefox (iOS) ${m[1]}`;
  if ((m = ua.match(/EdgiOS\/([\d\.]+)/))) return `Edge (iOS) ${m[1]}`;

  if ((m = ua.match(/Firefox\/([\d\.]+)/))) return `Firefox ${m[1]}`;
  if ((m = ua.match(/Chrome\/([\d\.]+)/))) return `Chrome ${m[1]}`;
  if ((m = ua.match(/Version\/([\d\.]+).*Safari/))) return `Safari ${m[1]}`;
  if (/Safari/.test(ua)) return 'Safari';

  return 'Unknown browser';
}

/**
 * Parse Android device model out of UA string.
 * Android UA looks like:
 *   Mozilla/5.0 (Linux; Android 13; SM-A536E Build/TP1A.220624.014) ...
 *   Mozilla/5.0 (Linux; Android 14; Pixel 7) ...
 * The model sits between `Android <ver>;` and `)` or `Build/`.
 */
function parseAndroidModel(ua: string): string | null {
  const m = ua.match(/Android\s+[\d\.]+;\s*([^;)]+?)(?:\s+Build\/[^)]*)?\)/i);
  if (!m) return null;
  let model = m[1].trim();
  // Strip locale tokens like `en-us` or `wv` (WebView marker) at start
  model = model.replace(/^[a-z]{2}-[a-z]{2};?\s*/i, '').trim();
  if (model.toLowerCase() === 'wv') return null;
  // Many cheap devices report "K" as model on Chrome 110+ (UA reduction). Treat as unknown.
  if (/^k$/i.test(model)) return null;
  return model || null;
}

function parseDevice(ua: string): string {
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/iPod/.test(ua)) return 'iPod';

  if (/Android/.test(ua)) {
    const model = parseAndroidModel(ua);
    const isMobile = /Mobile/.test(ua);
    if (model) return isMobile ? `Android Phone (${model})` : `Android Tablet (${model})`;
    return isMobile ? 'Android Phone' : 'Android Tablet';
  }

  if (/Windows Phone/.test(ua)) return 'Windows Phone';
  if (/Macintosh/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/CrOS/.test(ua)) return 'Chromebook';
  if (/Linux/.test(ua)) return 'Linux PC';
  if (/Mobile|Tablet/.test(ua)) return 'Mobile';
  return 'Desktop';
}

/**
 * Use modern User-Agent Client Hints API when available (Chromium on Android).
 * Returns enriched device/browser info — falls back gracefully.
 */
async function getClientHints(): Promise<{ model?: string; platform?: string; platformVersion?: string; browserBrand?: string; browserVersion?: string; mobile?: boolean }> {
  try {
    const uaData = (navigator as any).userAgentData;
    if (!uaData?.getHighEntropyValues) return {};
    const high = await uaData.getHighEntropyValues([
      'model',
      'platform',
      'platformVersion',
      'architecture',
      'fullVersionList',
    ]);
    // Pick a meaningful brand (skip "Not.A.Brand" / "Chromium" placeholders)
    const brands = (high.fullVersionList || uaData.brands || []) as Array<{ brand: string; version: string }>;
    const preferred = brands.find(b => !/Not.?A.?Brand|Chromium/i.test(b.brand)) || brands[0];
    return {
      model: high.model || undefined,
      platform: high.platform || undefined,
      platformVersion: high.platformVersion || undefined,
      browserBrand: preferred?.brand,
      browserVersion: preferred?.version,
      mobile: uaData.mobile,
    };
  } catch {
    return {};
  }
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
  try {
    const r = await fetch('https://api.ipify.org?format=json');
    const j = await r.json();
    return { ip: j.ip || 'Unknown', location: 'Unknown location' };
  } catch {
    return { ip: 'Unknown', location: 'Unknown location' };
  }
}

const SENT_KEY = 'login_notify_sent_at';

export async function sendLoginNotification(opts: {
  email: string;
  customerName?: string;
  isAdmin?: boolean;
}) {
  if (!opts?.email) return;
  try {
    const last = Number(sessionStorage.getItem(SENT_KEY) || '0');
    if (Date.now() - last < 60_000) return;
    sessionStorage.setItem(SENT_KEY, String(Date.now()));

    const ua = navigator.userAgent || '';

    // Base UA parse
    let device = parseDevice(ua);
    let browser = parseBrowser(ua);
    let os = parseOS(ua);

    // Enrich with Client Hints (better device model + Windows 11 detection)
    const hints = await getClientHints();
    if (hints.model && /Android/.test(ua)) {
      const isMobile = hints.mobile ?? /Mobile/.test(ua);
      device = isMobile ? `Android Phone (${hints.model})` : `Android Tablet (${hints.model})`;
    }
    if (hints.platform && hints.platformVersion) {
      // Windows 11 → platformVersion major >= 13
      if (hints.platform === 'Windows') {
        const major = parseInt(hints.platformVersion.split('.')[0] || '0', 10);
        os = major >= 13 ? 'Windows 11' : major > 0 ? 'Windows 10' : os;
      } else if (hints.platform === 'Android') {
        os = `Android ${hints.platformVersion}`;
      } else if (hints.platform === 'macOS') {
        os = `macOS ${hints.platformVersion}`;
      } else if (hints.platform === 'Chrome OS' || hints.platform === 'ChromeOS') {
        os = `ChromeOS ${hints.platformVersion}`;
      }
    }
    if (hints.browserBrand && hints.browserVersion) {
      browser = `${hints.browserBrand} ${hints.browserVersion}`;
    }

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
