import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export interface GoogleAdsAccount {
  id: string;             // local UUID
  name: string;           // friendly name
  conversion_id: string;  // AW-XXXXXXXXX
  enabled: boolean;
  // Conversion event labels (the part after the slash in AW-XXXX/LABEL)
  label_purchase: string;
  label_begin_checkout: string;
  label_add_to_cart: string;
  label_lead: string;
}

interface GoogleConfig {
  accounts: GoogleAdsAccount[];
  google_ads_enabled: boolean;
  ga4_id: string;
  ga4_enabled: boolean;
  gtm_id: string;
  gtm_enabled: boolean;
  enhanced_conversions_enabled: boolean;
}

let cachedConfig: GoogleConfig | null = null;
let scriptInjected = false;

const loadConfig = async (): Promise<GoogleConfig> => {
  if (cachedConfig) return cachedConfig;
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .eq('category', 'google_ads');
  const map: Record<string, string> = {};
  (data || []).forEach((r: any) => { map[r.key] = r.value || ''; });

  let accounts: GoogleAdsAccount[] = [];
  try { accounts = JSON.parse(map['google_ads_config'] || '[]'); } catch { accounts = []; }

  cachedConfig = {
    accounts: accounts.filter(a => a && a.conversion_id),
    google_ads_enabled: map['google_ads_enabled'] === 'true',
    ga4_id: map['ga4_measurement_id'] || '',
    ga4_enabled: map['ga4_enabled'] === 'true',
    gtm_id: map['gtm_container_id'] || '',
    gtm_enabled: map['gtm_enabled'] === 'true',
    enhanced_conversions_enabled: map['enhanced_conversions_enabled'] === 'true',
  };
  return cachedConfig;
};

const ensureGtagStub = () => {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() { window.dataLayer.push(arguments as any); } as any;
    window.gtag('js', new Date());
  }
};

const injectScripts = async (cfg: GoogleConfig): Promise<void> => {
  if (scriptInjected) return;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const enabledAdsAccounts = cfg.google_ads_enabled ? cfg.accounts.filter(a => a.enabled) : [];
  const adsIds = enabledAdsAccounts.map(a => a.conversion_id);
  const ga4Id = cfg.ga4_enabled && cfg.ga4_id ? cfg.ga4_id : '';
  const gtmId = cfg.gtm_enabled && cfg.gtm_id ? cfg.gtm_id : '';

  if (adsIds.length === 0 && !ga4Id && !gtmId) return;
  scriptInjected = true;

  ensureGtagStub();

  // GTM (loads its own dataLayer; safe to coexist with gtag)
  if (gtmId) {
    const gtmScript = document.createElement('script');
    gtmScript.async = true;
    gtmScript.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`;
    document.head.appendChild(gtmScript);
  }

  // gtag.js (single script tag handles all IDs via separate config calls)
  const primaryId = ga4Id || adsIds[0];
  if (primaryId) {
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${primaryId}`;
    document.head.appendChild(tag);

    // Configure GA4
    if (ga4Id) window.gtag('config', ga4Id, { send_page_view: true });
    // Configure each Google Ads account (allow_enhanced_conversions if enabled)
    adsIds.forEach(id => {
      window.gtag('config', id, {
        allow_enhanced_conversions: cfg.enhanced_conversions_enabled,
      });
    });
  }
};

// Hash helper for Enhanced Conversions (SHA-256 lowercased)
const sha256 = async (input: string): Promise<string> => {
  if (!input) return '';
  const buf = new TextEncoder().encode(input.trim().toLowerCase());
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
};

interface UserData { email?: string; phone?: string; name?: string; }

const setEnhancedUserData = async (userData?: UserData) => {
  if (!cachedConfig?.enhanced_conversions_enabled || !userData) return;
  if (typeof window === 'undefined' || !window.gtag) return;
  const payload: Record<string, string> = {};
  if (userData.email) payload.sha256_email_address = await sha256(userData.email);
  if (userData.phone) {
    // Normalize BD phone to E.164: +880XXXXXXXXXX
    let p = userData.phone.replace(/\D/g, '');
    if (p.startsWith('880')) p = '+' + p;
    else if (p.startsWith('0')) p = '+880' + p.slice(1);
    else if (!p.startsWith('+')) p = '+' + p;
    payload.sha256_phone_number = await sha256(p);
  }
  window.gtag('set', 'user_data', payload);
};

// ───────────────────────── Public event helpers ─────────────────────────

const fireGtagEvent = (eventName: string, params: Record<string, any>) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', eventName, params);
  // Also push to dataLayer for GTM users
  window.dataLayer?.push({ event: eventName, ...params });
};

const fireConversion = (eventLabelKey: keyof GoogleAdsAccount, params: Record<string, any>) => {
  if (!cachedConfig?.google_ads_enabled) return;
  cachedConfig.accounts
    .filter(a => a.enabled && a[eventLabelKey])
    .forEach(a => {
      fireGtagEvent('conversion', {
        send_to: `${a.conversion_id}/${a[eventLabelKey]}`,
        ...params,
      });
    });
};

export const gTrackPageView = (path?: string) => {
  if (!cachedConfig) return;
  const url = path || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '');
  if (cachedConfig.ga4_enabled && cachedConfig.ga4_id) {
    fireGtagEvent('page_view', { page_path: url, page_location: window.location.href });
  }
};

export const gTrackAddToCart = async (
  params: { value: number; currency?: string; items?: any[] },
  userData?: UserData,
) => {
  if (!cachedConfig) await loadConfig();
  await setEnhancedUserData(userData);
  const payload = { currency: params.currency || 'BDT', value: params.value, items: params.items || [] };
  fireGtagEvent('add_to_cart', payload);
  fireConversion('label_add_to_cart', { value: params.value, currency: payload.currency });
};

export const gTrackBeginCheckout = async (
  params: { value: number; currency?: string; items?: any[] },
  userData?: UserData,
) => {
  if (!cachedConfig) await loadConfig();
  await setEnhancedUserData(userData);
  const payload = { currency: params.currency || 'BDT', value: params.value, items: params.items || [] };
  fireGtagEvent('begin_checkout', payload);
  fireConversion('label_begin_checkout', { value: params.value, currency: payload.currency });
};

export const gTrackPurchase = async (
  params: { transaction_id: string; value: number; currency?: string; items?: any[]; coupon?: string },
  userData?: UserData,
) => {
  if (!cachedConfig) await loadConfig();
  await setEnhancedUserData(userData);
  const payload = {
    transaction_id: params.transaction_id,
    value: params.value,
    currency: params.currency || 'BDT',
    items: params.items || [],
    coupon: params.coupon || undefined,
  };
  fireGtagEvent('purchase', payload);
  fireConversion('label_purchase', {
    value: params.value,
    currency: payload.currency,
    transaction_id: params.transaction_id,
  });
};

export const gTrackLead = async (params: { value?: number; method?: string } = {}, userData?: UserData) => {
  if (!cachedConfig) await loadConfig();
  await setEnhancedUserData(userData);
  fireGtagEvent('sign_up', { method: params.method || 'email' });
  fireConversion('label_lead', { value: params.value || 0, currency: 'BDT' });
};

// Manual reload (used by admin save flow)
export const reloadGoogleTrackingConfig = () => {
  cachedConfig = null;
  scriptInjected = false;
};

// ───────────────────────── Component ─────────────────────────

const GoogleTracking = () => {
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const t = setTimeout(async () => {
      const cfg = await loadConfig();
      await injectScripts(cfg);
      gTrackPageView();
    }, 1500);
    return () => clearTimeout(t);
  }, []);
  return null;
};

export default GoogleTracking;
