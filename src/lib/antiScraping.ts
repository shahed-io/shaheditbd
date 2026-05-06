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

  let signals = 0;
  const nav = navigator as Navigator & { webdriver?: boolean; languages?: readonly string[] };
  const w = window as unknown as Record<string, unknown>;

  // Strongest: WebDriver flag (Selenium, Playwright, Puppeteer w/o stealth)
  if (nav.webdriver === true) signals += 3;

  // Phantom / Nightmare globals
  if (w.__nightmare || w._phantom || w.callPhantom) signals += 3;
  if (w.domAutomation || w.domAutomationController) signals += 3;
  if (w.Buffer && typeof w.Buffer === 'function') signals += 2;
  if (w.spawn || w.emit) signals += 1;

  // Headless Chrome explicit UA
  if (/HeadlessChrome|PhantomJS|Electron\//i.test(navigator.userAgent)) signals += 4;

  // Real Chrome exposes window.chrome with a runtime; headless does not
  try {
    const isChromeUa = /chrome|chromium/i.test(navigator.userAgent);
    const hasChromeObj = typeof (w as { chrome?: unknown }).chrome === 'object' && (w as { chrome?: { runtime?: unknown } }).chrome?.runtime !== undefined;
    if (isChromeUa && !hasChromeObj) signals += 1;
  } catch { /* ignore */ }

  try {
    if (Array.isArray(nav.languages) && nav.languages.length === 0) signals += 1;
    if (navigator.plugins && navigator.plugins.length === 0 && /chrome/i.test(navigator.userAgent)) signals += 1;
    if (navigator.mimeTypes && navigator.mimeTypes.length === 0 && /chrome/i.test(navigator.userAgent)) signals += 1;
  } catch { /* ignore */ }

  // Permissions API spoof — headless returns inconsistent values
  try {
    const perm = (navigator as Navigator & { permissions?: { query?: (d: PermissionDescriptor) => Promise<PermissionStatus> } }).permissions;
    if (perm && typeof perm.query !== 'function') signals += 1;
  } catch { /* ignore */ }

  return signals >= 3;
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
      el.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,.4));">${msg.icon}</div>
          <div style="display:flex;flex-direction:column;gap:2px;text-align:left;">
            <div style="font-weight:700;font-size:14px;letter-spacing:.2px;">${msg.title}</div>
            <div style="font-size:12px;opacity:.85;">${msg.sub}</div>
          </div>
        </div>`;
      el.setAttribute(
        'style',
        [
          'position:fixed','z-index:99999','left:50%','bottom:28px',
          'transform:translateX(-50%) translateY(20px)','opacity:0',
          'background:linear-gradient(135deg,rgba(124,58,237,.95),rgba(15,23,42,.95))',
          'backdrop-filter:blur(16px)','-webkit-backdrop-filter:blur(16px)',
          'color:#fff','padding:14px 20px','border-radius:18px',
          'border:1px solid rgba(255,255,255,.18)',
          'font-family:system-ui,-apple-system,sans-serif',
          'box-shadow:0 18px 50px -12px rgba(124,58,237,.55), 0 8px 24px rgba(0,0,0,.35)',
          'max-width:92vw','transition:transform .35s cubic-bezier(.2,.8,.2,1),opacity .35s ease',
          'pointer-events:none',
        ].join(';')
      );
      document.body.appendChild(el);
      requestAnimationFrame(() => {
        el.style.transform = 'translateX(-50%) translateY(0)';
        el.style.opacity = '1';
      });
      setTimeout(() => {
        el.style.transform = 'translateX(-50%) translateY(20px)';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 350);
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
