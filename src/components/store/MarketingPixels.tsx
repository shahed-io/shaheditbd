import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Unified social-media pixel injector + tracker.
 * Supports: TikTok, Snapchat, Pinterest, LinkedIn (Insight Tag), Twitter/X.
 * All settings stored as JSON in site_settings: key='marketing_pixels'.
 *
 * Each platform stores an array of accounts:
 *   { id, name, pixel_id, enabled, capi_token? (TikTok only) }
 */

declare global {
  interface Window {
    ttq: any;
    snaptr: any;
    pintrk: any;
    _linkedin_partner_id: string;
    _linkedin_data_partner_ids: string[];
    lintrk: any;
    twq: any;
  }
}

export type Platform = 'tiktok' | 'snapchat' | 'pinterest' | 'linkedin' | 'twitter';

export interface PixelAccount {
  id: string;
  name: string;
  pixel_id: string;
  enabled: boolean;
  capi_token?: string;       // TikTok Events API token
  capi_test_code?: string;   // TikTok test event code
  user_email?: string;       // Snapchat — required for advanced matching
}

export interface MarketingPixelsConfig {
  tiktok: PixelAccount[];
  snapchat: PixelAccount[];
  pinterest: PixelAccount[];
  linkedin: PixelAccount[];
  twitter: PixelAccount[];
}

const EMPTY_CONFIG: MarketingPixelsConfig = {
  tiktok: [], snapchat: [], pinterest: [], linkedin: [], twitter: [],
};

let cachedConfig: MarketingPixelsConfig | null = null;
let injected = false;

export const loadMarketingPixels = async (): Promise<MarketingPixelsConfig> => {
  if (cachedConfig) return cachedConfig;
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'marketing_pixels')
    .maybeSingle();
  try {
    const parsed = JSON.parse(data?.value || '{}');
    cachedConfig = { ...EMPTY_CONFIG, ...parsed };
  } catch {
    cachedConfig = EMPTY_CONFIG;
  }
  return cachedConfig!;
};

export const reloadMarketingPixelsCache = () => {
  cachedConfig = null;
  injected = false;
};

const enabledOf = (list: PixelAccount[]): PixelAccount[] =>
  (list || []).filter(a => a && a.enabled && a.pixel_id);

// ─────────────────────── Script injectors ────────────────────────

const injectTikTok = (accounts: PixelAccount[]) => {
  if (accounts.length === 0 || typeof window === 'undefined') return;
  // TikTok loader (single script handles multiple pixels via load() calls)
  /* eslint-disable */
  (function (w: any, d: Document, t: string) {
    w.TiktokAnalyticsObject = t;
    const ttq = w[t] = w[t] || [];
    ttq.methods = ['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'];
    ttq.setAndDefer = function (e: any, t: string) { e[t] = function () { e.push([t].concat(Array.prototype.slice.call(arguments, 0))); }; };
    for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (e: string) { const n = ttq._i[e] || []; for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(n, ttq.methods[i]); return n; };
    ttq.load = function (e: string, n?: any) {
      const r = 'https://analytics.tiktok.com/i18n/pixel/events.js';
      ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = r; ttq._t = ttq._t || {}; ttq._t[e] = +new Date();
      ttq._o = ttq._o || {}; ttq._o[e] = n || {};
      const o = d.createElement('script'); o.type = 'text/javascript'; o.async = true; o.src = r + '?sdkid=' + e + '&lib=' + t;
      const a = d.getElementsByTagName('script')[0]; a.parentNode!.insertBefore(o, a);
    };
    accounts.forEach(acc => { ttq.load(acc.pixel_id); });
    ttq.page();
  })(window, document, 'ttq');
  /* eslint-enable */
};

const injectSnapchat = (accounts: PixelAccount[]) => {
  if (accounts.length === 0 || typeof window === 'undefined') return;
  /* eslint-disable */
  (function (e: any, t: Document, n: string) {
    if (e.snaptr) return;
    const a: any = e.snaptr = function () { a.handleRequest ? a.handleRequest.apply(a, arguments) : a.queue.push(arguments); };
    a.queue = [];
    const s = 'script';
    const r = t.createElement(s); r.async = true; r.src = n;
    const u = t.getElementsByTagName(s)[0]; u.parentNode!.insertBefore(r, u);
  })(window, document, 'https://sc-static.net/scevent.min.js');
  accounts.forEach(acc => {
    window.snaptr('init', acc.pixel_id, acc.user_email ? { user_email: acc.user_email } : {});
    window.snaptr('track', 'PAGE_VIEW');
  });
  /* eslint-enable */
};

const injectPinterest = (accounts: PixelAccount[]) => {
  if (accounts.length === 0 || typeof window === 'undefined') return;
  /* eslint-disable */
  (function (e: any) {
    if (!e.pintrk) {
      e.pintrk = function () { (e.pintrk.queue = e.pintrk.queue || []).push(Array.prototype.slice.call(arguments)); };
      const n = e.pintrk;
      n.queue = []; n.version = '3.0';
      const t = document.createElement('script');
      t.async = true; t.src = 'https://s.pinimg.com/ct/core.js';
      const r = document.getElementsByTagName('script')[0];
      r.parentNode!.insertBefore(t, r);
    }
  })(window);
  accounts.forEach(acc => { window.pintrk('load', acc.pixel_id); });
  window.pintrk('page');
  /* eslint-enable */
};

const injectLinkedIn = (accounts: PixelAccount[]) => {
  if (accounts.length === 0 || typeof window === 'undefined') return;
  // LinkedIn supports multiple partner IDs
  window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
  accounts.forEach(acc => {
    if (!window._linkedin_data_partner_ids.includes(acc.pixel_id)) {
      window._linkedin_data_partner_ids.push(acc.pixel_id);
    }
  });
  window._linkedin_partner_id = accounts[0].pixel_id;

  /* eslint-disable */
  (function (l: any) {
    if (!l) {
      window.lintrk = function (a: any, b: any) { window.lintrk.q.push([a, b]); };
      window.lintrk.q = [];
    }
    const s = document.getElementsByTagName('script')[0];
    const b = document.createElement('script');
    b.type = 'text/javascript'; b.async = true;
    b.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
    s.parentNode!.insertBefore(b, s);
  })(window.lintrk);
  /* eslint-enable */
};

const injectTwitter = (accounts: PixelAccount[]) => {
  if (accounts.length === 0 || typeof window === 'undefined') return;
  /* eslint-disable */
  (function (e: any, t: Document, n: string, s: string, u: string, a: any, c: any) {
    e.twq || (s = e.twq = function () { s.exe ? s.exe.apply(s, arguments) : s.queue.push(arguments); },
      s.version = '1.1', s.queue = [], u = t.createElement(n), u.async = !0, u.src = 'https://static.ads-twitter.com/uwt.js',
      a = t.getElementsByTagName(n)[0], a.parentNode.insertBefore(u, a));
  })(window, document, 'script');
  accounts.forEach(acc => { window.twq('config', acc.pixel_id); });
  /* eslint-enable */
};

// ─────────────────────── Public event helpers ────────────────────────

const fireOnAll = (cfg: MarketingPixelsConfig, eventMap: Partial<Record<Platform, () => void>>) => {
  if (typeof window === 'undefined') return;
  if (enabledOf(cfg.tiktok).length && eventMap.tiktok) try { eventMap.tiktok(); } catch {}
  if (enabledOf(cfg.snapchat).length && eventMap.snapchat) try { eventMap.snapchat(); } catch {}
  if (enabledOf(cfg.pinterest).length && eventMap.pinterest) try { eventMap.pinterest(); } catch {}
  if (enabledOf(cfg.linkedin).length && eventMap.linkedin) try { eventMap.linkedin(); } catch {}
  if (enabledOf(cfg.twitter).length && eventMap.twitter) try { eventMap.twitter(); } catch {}
};

// TikTok server-side (Events API) helper
const sendTikTokCAPI = async (eventName: string, params?: Record<string, any>) => {
  if (!cachedConfig) return;
  const accounts = cachedConfig.tiktok.filter(a => a.enabled && a.pixel_id && a.capi_token);
  if (accounts.length === 0) return;
  try {
    await supabase.functions.invoke('tiktok-events-api', {
      body: {
        event_name: eventName,
        event_source_url: window.location.href,
        accounts: accounts.map(a => ({
          pixel_id: a.pixel_id,
          access_token: a.capi_token,
          test_event_code: a.capi_test_code || undefined,
        })),
        custom_data: params || {},
        user_data: { client_user_agent: navigator.userAgent },
      },
    });
  } catch { /* silent */ }
};

export const mTrackPageView = () => {
  if (!cachedConfig) return;
  fireOnAll(cachedConfig, {
    tiktok: () => window.ttq?.page(),
    snapchat: () => window.snaptr?.('track', 'PAGE_VIEW'),
    pinterest: () => window.pintrk?.('page'),
    linkedin: () => window.lintrk?.('track'),
    twitter: () => window.twq?.('event', 'tw-pageview'),
  });
};

export const mTrackViewContent = (params: { content_id: string; content_name?: string; value?: number; currency?: string }) => {
  if (!cachedConfig) return;
  const data = { ...params, currency: params.currency || 'BDT' };
  fireOnAll(cachedConfig, {
    tiktok: () => window.ttq?.track('ViewContent', { contents: [{ content_id: data.content_id, content_name: data.content_name, content_type: 'product' }], value: data.value, currency: data.currency }),
    snapchat: () => window.snaptr?.('track', 'VIEW_CONTENT', { item_ids: [data.content_id], price: data.value, currency: data.currency }),
    pinterest: () => window.pintrk?.('track', 'pagevisit', { product_id: data.content_id, product_name: data.content_name, value: data.value, currency: data.currency }),
    linkedin: () => window.lintrk?.('track', { conversion_id: undefined }),
    twitter: () => window.twq?.('event', 'tw-view-content', { contents: [{ content_id: data.content_id, content_name: data.content_name }], value: data.value, currency: data.currency }),
  });
  sendTikTokCAPI('ViewContent', data);
};

export const mTrackAddToCart = (params: { content_id: string; content_name?: string; value: number; currency?: string }) => {
  if (!cachedConfig) return;
  const data = { ...params, currency: params.currency || 'BDT' };
  fireOnAll(cachedConfig, {
    tiktok: () => window.ttq?.track('AddToCart', { contents: [{ content_id: data.content_id, content_name: data.content_name, content_type: 'product' }], value: data.value, currency: data.currency }),
    snapchat: () => window.snaptr?.('track', 'ADD_CART', { item_ids: [data.content_id], price: data.value, currency: data.currency }),
    pinterest: () => window.pintrk?.('track', 'addtocart', { product_id: data.content_id, value: data.value, currency: data.currency }),
    twitter: () => window.twq?.('event', 'tw-add-to-cart', { value: data.value, currency: data.currency }),
  });
  sendTikTokCAPI('AddToCart', data);
};

export const mTrackInitiateCheckout = (params: { value: number; currency?: string }) => {
  if (!cachedConfig) return;
  const data = { ...params, currency: params.currency || 'BDT' };
  fireOnAll(cachedConfig, {
    tiktok: () => window.ttq?.track('InitiateCheckout', { value: data.value, currency: data.currency }),
    snapchat: () => window.snaptr?.('track', 'START_CHECKOUT', { price: data.value, currency: data.currency }),
    pinterest: () => window.pintrk?.('track', 'checkout', { value: data.value, currency: data.currency }),
    twitter: () => window.twq?.('event', 'tw-checkout', { value: data.value, currency: data.currency }),
  });
  sendTikTokCAPI('InitiateCheckout', data);
};

export const mTrackPurchase = (params: { transaction_id: string; value: number; currency?: string; content_ids?: string[] }) => {
  if (!cachedConfig) return;
  const data = { ...params, currency: params.currency || 'BDT' };
  fireOnAll(cachedConfig, {
    tiktok: () => window.ttq?.track('CompletePayment', { contents: (data.content_ids || []).map(id => ({ content_id: id, content_type: 'product' })), value: data.value, currency: data.currency, order_id: data.transaction_id }),
    snapchat: () => window.snaptr?.('track', 'PURCHASE', { item_ids: data.content_ids, price: data.value, currency: data.currency, transaction_id: data.transaction_id }),
    pinterest: () => window.pintrk?.('track', 'checkout', { value: data.value, currency: data.currency, order_id: data.transaction_id, line_items: (data.content_ids || []).map(id => ({ product_id: id })) }),
    linkedin: () => window.lintrk?.('track', { conversion_id: undefined }),
    twitter: () => window.twq?.('event', 'tw-purchase', { value: data.value, currency: data.currency, conversion_id: data.transaction_id }),
  });
  sendTikTokCAPI('CompletePayment', data);
};

export const mTrackLead = (params: { value?: number; method?: string } = {}) => {
  if (!cachedConfig) return;
  fireOnAll(cachedConfig, {
    tiktok: () => window.ttq?.track('SubmitForm', { value: params.value || 0, currency: 'BDT' }),
    snapchat: () => window.snaptr?.('track', 'SIGN_UP'),
    pinterest: () => window.pintrk?.('track', 'lead', { value: params.value || 0, currency: 'BDT' }),
    linkedin: () => window.lintrk?.('track', { conversion_id: undefined }),
    twitter: () => window.twq?.('event', 'tw-signup', { value: params.value || 0, currency: 'BDT' }),
  });
  sendTikTokCAPI('SubmitForm', { value: params.value || 0 });
};

// ─────────────────────── Component ────────────────────────

const MarketingPixels = () => {
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const t = setTimeout(async () => {
      const cfg = await loadMarketingPixels();
      if (injected) return;
      injected = true;

      injectTikTok(enabledOf(cfg.tiktok));
      injectSnapchat(enabledOf(cfg.snapchat));
      injectPinterest(enabledOf(cfg.pinterest));
      injectLinkedIn(enabledOf(cfg.linkedin));
      injectTwitter(enabledOf(cfg.twitter));
    }, 1800);
    return () => clearTimeout(t);
  }, []);

  return null;
};

export default MarketingPixels;
