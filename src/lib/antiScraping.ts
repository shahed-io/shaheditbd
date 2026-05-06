/**
 * Anti-Scraping & Design Protection System
 * --------------------------------------------------------------
 * GOAL:
 *  - Block automated scrapers / AI cloning bots (Firecrawl,
 *    ScrapingBee, HTTrack, headless Puppeteer, wget, curl, etc.)
 *    so they cannot mass-copy our HTML/CSS/design.
 *  - PRESERVE search-engine + AI-search visibility (Googlebot,
 *    Bingbot, GPTBot, PerplexityBot, ClaudeBot, etc.) so SEO and
 *    AI answer-engine ranking are unaffected.
 *  - PRESERVE all real human users (mobile + desktop) and the
 *    backend/API behaviour.
 *
 * This file runs only on the client. Backend APIs / Supabase /
 * edge functions are intentionally untouched.
 */

// ──────────────────────────────────────────────────────────────
// 1. Bot classification — case-insensitive substring match on UA
// ──────────────────────────────────────────────────────────────

/** Search & social crawlers we WANT to allow for SEO + AI ranking. */
const ALLOWED_BOT_SIGNATURES = [
  // Search engines
  'googlebot', 'google-inspectiontool', 'storebot-google', 'adsbot-google',
  'bingbot', 'bingpreview', 'msnbot',
  'duckduckbot', 'duckduckgo',
  'yandexbot', 'yandeximages',
  'baiduspider',
  'slurp', // Yahoo
  'sogou', 'exabot', 'seznambot',
  // AI search / answer engines (good for ranking in AI results)
  'gptbot', 'oai-searchbot', 'chatgpt-user',
  'perplexitybot', 'perplexity-user',
  'claudebot', 'claude-web', 'anthropic-ai',
  'google-extended', 'googleother',
  'applebot', 'applebot-extended',
  'amazonbot',
  'cohere-ai',
  'youbot',
  // Social preview bots (link unfurl)
  'twitterbot', 'facebookexternalhit', 'facebookbot', 'facebot',
  'linkedinbot', 'whatsapp', 'telegrambot',
  'slackbot', 'discordbot', 'pinterest', 'pinterestbot',
  'redditbot', 'embedly', 'quora link preview', 'tumblr',
  // Monitoring / uptime — harmless
  'uptimerobot', 'pingdom', 'statuscake',
];

/**
 * Known scraper / cloning / mirror tools we want to BLOCK from
 * being able to render our design. Designed to be conservative —
 * we only block tools that are *primarily* used for scraping
 * websites, never generic browsers.
 */
const BLOCKED_SCRAPER_SIGNATURES = [
  // Generic CLI / library scrapers
  'wget', 'curl/', 'libcurl', 'httrack', 'webcopier', 'webzip',
  'offline explorer', 'teleport', 'sitesucker', 'getleft',
  'webreaper', 'website ripper', 'website extractor',
  // HTTP libraries (server-side scraping)
  'python-requests', 'python-urllib', 'aiohttp', 'httpx',
  'go-http-client', 'okhttp', 'java/', 'apache-httpclient',
  'ruby', 'mechanize', 'scrapy', 'colly',
  'node-fetch', 'axios/', 'got (', 'undici',
  // Commercial scraping APIs
  'firecrawl', 'scrapingbee', 'scraperapi', 'scrapfly',
  'apify', 'brightdata', 'oxylabs', 'zyte', 'crawlbase',
  'proxycrawl', 'diffbot', 'webscraping', 'webharvy',
  'octoparse', 'parsehub', 'import.io', 'phantomjscloud',
  // Headless / automation frameworks (when not masked)
  'headlesschrome', 'phantomjs', 'slimerjs', 'electron',
  'puppeteer', 'playwright', 'selenium', 'webdriver',
  'chromedriver', 'geckodriver', 'nightmarejs', 'cypress',
  // Site cloners
  'sitedupe', 'webcloner', 'ai-website-clone', 'cloningbot',
  'designscraper', 'uigrab', 'pagesnap',
];

export type BotClassification = 'allowed' | 'blocked' | 'human';

export function classifyUserAgent(rawUa: string | undefined | null): BotClassification {
  const ua = (rawUa || '').toLowerCase().trim();
  if (!ua) return 'blocked'; // empty UA → almost always a script

  // First check allow-list (so e.g. "ChatGPT-User" is never blocked).
  for (const sig of ALLOWED_BOT_SIGNATURES) {
    if (ua.includes(sig)) return 'allowed';
  }

  // Then check block-list.
  for (const sig of BLOCKED_SCRAPER_SIGNATURES) {
    if (ua.includes(sig)) return 'blocked';
  }

  return 'human';
}

// ──────────────────────────────────────────────────────────────
// 2. Headless / automation runtime detection
// ──────────────────────────────────────────────────────────────

/**
 * Detect headless browsers / automation environments that try to
 * spoof a normal Chrome UA. We look for runtime fingerprints that
 * a real human browser does not expose.
 *
 * Returns true ONLY when at least 2 strong signals match — this
 * prevents false positives (some real users have weird devices).
 */
export function isAutomatedBrowser(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  // Only detect *unambiguous* headless / automation signatures.
  // Runtime fingerprint heuristics (window.chrome, plugins, languages,
  // permissions API) cause false positives on real mobile browsers
  // (Chrome Android, Samsung Internet, in-app webviews, MIUI browsers,
  // privacy browsers, etc.) — so we DO NOT use them anymore.
  try {
    if (/HeadlessChrome|PhantomJS|Electron\/|Puppeteer|Playwright/i.test(navigator.userAgent)) {
      return true;
    }
  } catch { /* ignore */ }

  return false;
}

// ──────────────────────────────────────────────────────────────
// 3. Public guard: "should we block this client from seeing the design?"
// ──────────────────────────────────────────────────────────────

export interface ProtectionDecision {
  classification: BotClassification;
  isAutomation: boolean;
  shouldBlock: boolean;
}

export function evaluateClientProtection(): ProtectionDecision {
  if (typeof navigator === 'undefined') {
    return { classification: 'human', isAutomation: false, shouldBlock: false };
  }
  const classification = classifyUserAgent(navigator.userAgent);
  const isAutomation = isAutomatedBrowser();
  const shouldBlock = classification === 'blocked' || (classification === 'human' && isAutomation);
  return { classification, isAutomation, shouldBlock };
}

// ──────────────────────────────────────────────────────────────
// 4. Soft UX deterrents (only for real humans, never SEO bots)
// ──────────────────────────────────────────────────────────────

/**
 * Install lightweight client-side anti-copy UX:
 *  - block right-click context menu on the page
 *  - block image drag-and-save
 *  - block common DevTools shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U)
 *  - disable text selection on design chrome (but keep product
 *    descriptions / blog body selectable so users can copy info)
 *
 * Search bots never execute this script (they parse HTML), so SEO
 * is unaffected. Form fields, inputs, and `.allow-select` regions
 * stay fully usable for real users.
 */
export function installCopyDeterrents(): () => void {
  if (typeof document === 'undefined') return () => {};

  const isInteractive = (el: EventTarget | null): boolean => {
    if (!(el instanceof HTMLElement)) return false;
    return !!el.closest(
      'input, textarea, select, [contenteditable="true"], .allow-select, .allow-copy, [data-allow-select="true"]'
    );
  };

  const FUN_MESSAGES = [
    { icon: '🕵️‍♂️', title: 'ধরা পড়ে গেছেন!', sub: 'এই ডিজাইন কপিরাইট-সুরক্ষিত — চুরি করার চেষ্টা বৃথা 😉' },
    { icon: '🚫', title: 'উঁহু, এটা করা যাবে না!', sub: 'Shahed Store এর কনটেন্ট কপি করা নিষিদ্ধ।' },
    { icon: '🛡️', title: 'কনটেন্ট লক করা আছে', sub: 'কপি করতে চাইলে আমাদের সাথে যোগাযোগ করুন — আমরা friendly! 💜' },
    { icon: '🎯', title: 'নাইস ট্রাই!', sub: 'কিন্তু এই ওয়েবসাইটের ডিজাইন © Shahed Store এর সম্পত্তি।' },
    { icon: '✨', title: 'কপি না করে কিনে নিন!', sub: 'আসল প্রোডাক্ট পেতে অর্ডার করুন shahedstore.com.bd তে।' },
    { icon: '🔐', title: 'অ্যাক্সেস ডিনাইড', sub: 'এই পেজটি কপিরাইট আইন দ্বারা সুরক্ষিত।' },
  ];

  const warn = () => {
    try {
      const id = '__copy_warn_toast__';
      if (document.getElementById(id)) return;
      const msg = FUN_MESSAGES[Math.floor(Math.random() * FUN_MESSAGES.length)];
      const el = document.createElement('div');
      el.id = id;
      el.setAttribute('role', 'alert');
      el.innerHTML = `
        <div class="__cp_card">
          <div class="__cp_blob __cp_blob_a"></div>
          <div class="__cp_blob __cp_blob_b"></div>
          <div class="__cp_inner">
            <div class="__cp_icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="11" width="16" height="10" rx="2.5"/>
                <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
              </svg>
            </div>
            <div class="__cp_text">
              <div class="__cp_title">${msg.icon} ${msg.title}</div>
              <div class="__cp_sub">${msg.sub}</div>
            </div>
          </div>
          <div class="__cp_bar"></div>
        </div>
        <style>
          #${id}{position:fixed;left:50%;bottom:32px;z-index:99999;transform:translateX(-50%) translateY(24px) scale(.96);opacity:0;transition:transform .45s cubic-bezier(.2,.9,.25,1.15),opacity .35s ease;pointer-events:none;max-width:92vw;font-family:'Hind Siliguri',system-ui,-apple-system,sans-serif;}
          #${id} .__cp_card{position:relative;overflow:hidden;border-radius:22px;padding:14px 18px 16px;min-width:300px;background:linear-gradient(135deg,rgba(255,255,255,.78),rgba(255,255,255,.55));backdrop-filter:blur(28px) saturate(180%);-webkit-backdrop-filter:blur(28px) saturate(180%);border:1px solid rgba(255,255,255,.7);box-shadow:0 24px 60px -18px hsla(var(--brand-h,270),85%,50%,.45),0 8px 24px rgba(0,0,0,.12),inset 0 1px 0 rgba(255,255,255,.9);}
          #${id} .__cp_blob{position:absolute;width:140px;height:140px;border-radius:50%;filter:blur(34px);opacity:.55;pointer-events:none;}
          #${id} .__cp_blob_a{top:-50px;left:-40px;background:hsla(var(--brand-h,270),95%,65%,.7);}
          #${id} .__cp_blob_b{bottom:-60px;right:-30px;background:hsla(calc(var(--brand-h,270) + 40),95%,65%,.55);}
          #${id} .__cp_inner{position:relative;display:flex;align-items:center;gap:12px;}
          #${id} .__cp_icon{flex:none;width:42px;height:42px;border-radius:14px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,hsl(var(--brand-h,270),85%,58%),hsl(calc(var(--brand-h,270) + 35),85%,55%));box-shadow:0 8px 18px -4px hsla(var(--brand-h,270),85%,50%,.55),inset 0 1px 0 rgba(255,255,255,.4);}
          #${id} .__cp_text{display:flex;flex-direction:column;gap:2px;text-align:left;color:#0f172a;}
          #${id} .__cp_title{font-weight:800;font-size:14px;letter-spacing:.1px;line-height:1.25;}
          #${id} .__cp_sub{font-size:12px;line-height:1.35;color:#475569;font-weight:500;}
          #${id} .__cp_bar{position:relative;height:3px;margin-top:12px;border-radius:99px;overflow:hidden;background:rgba(15,23,42,.08);}
          #${id} .__cp_bar::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,hsl(var(--brand-h,270),85%,60%),hsl(calc(var(--brand-h,270) + 40),85%,60%));transform-origin:left;animation:__cp_p 2.6s linear forwards;}
          @keyframes __cp_p{from{transform:scaleX(1);}to{transform:scaleX(0);}}
          @media (prefers-color-scheme: dark){
            #${id} .__cp_card{background:linear-gradient(135deg,rgba(30,30,45,.78),rgba(15,15,25,.6));border-color:rgba(255,255,255,.14);box-shadow:0 24px 60px -18px hsla(var(--brand-h,270),85%,50%,.55),0 8px 24px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.08);}
            #${id} .__cp_text{color:#f8fafc;}
            #${id} .__cp_sub{color:#cbd5e1;}
            #${id} .__cp_bar{background:rgba(255,255,255,.1);}
          }
        </style>`;
      document.body.appendChild(el);
      requestAnimationFrame(() => {
        el.style.transform = 'translateX(-50%) translateY(0) scale(1)';
        el.style.opacity = '1';
      });
      setTimeout(() => {
        el.style.transform = 'translateX(-50%) translateY(24px) scale(.96)';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 400);
      }, 2600);
    } catch { /* ignore */ }
  };

  // Block right-click everywhere except inside form fields / allow zones
  const onContextMenu = (e: MouseEvent) => {
    if (isInteractive(e.target)) return;
    e.preventDefault();
    warn();
  };

  // Block copy / cut on protected zones
  const onCopy = (e: ClipboardEvent) => {
    if (isInteractive(e.target)) return;
    e.preventDefault();
    try { e.clipboardData?.setData('text/plain', '© Shahed Store — Content protected. https://shahedstore.com.bd'); } catch { /* ignore */ }
    warn();
  };

  // Block drag of images, videos, and any element
  const onDragStart = (e: DragEvent) => {
    if (isInteractive(e.target)) return;
    e.preventDefault();
  };

  // Block selectstart on protected zones
  const onSelectStart = (e: Event) => {
    if (isInteractive(e.target)) return;
    e.preventDefault();
  };

  // Block common DevTools shortcuts: F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S
  const onKeyDown = (e: KeyboardEvent) => {
    const k = e.key?.toLowerCase();
    if (e.key === 'F12') { e.preventDefault(); warn(); return; }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(k)) {
      e.preventDefault(); warn(); return;
    }
    if ((e.ctrlKey || e.metaKey) && ['u', 's'].includes(k)) {
      e.preventDefault(); warn(); return;
    }
    // Block PrintScreen
    if (e.key === 'PrintScreen') {
      try { navigator.clipboard?.writeText(''); } catch { /* ignore */ }
      warn();
    }
  };

  document.addEventListener('contextmenu', onContextMenu);
  document.addEventListener('copy', onCopy);
  document.addEventListener('cut', onCopy);
  document.addEventListener('dragstart', onDragStart);
  document.addEventListener('selectstart', onSelectStart);
  document.addEventListener('keydown', onKeyDown);

  return () => {
    document.removeEventListener('contextmenu', onContextMenu);
    document.removeEventListener('copy', onCopy);
    document.removeEventListener('cut', onCopy);
    document.removeEventListener('dragstart', onDragStart);
    document.removeEventListener('selectstart', onSelectStart);
    document.removeEventListener('keydown', onKeyDown);
  };
}
