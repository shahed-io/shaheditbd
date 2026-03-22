import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Global fbq function type
declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

// Singleton to avoid double-loading
let pixelLoaded = false;
let pixelConfig: { id: string; tracks: Record<string, boolean>; capiEnabled: boolean; testCode: string } | null = null;

const loadPixelSettings = async () => {
  if (pixelConfig !== null) return pixelConfig;
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .eq('category', 'facebook_pixel');

  if (!data) return null;
  const map: Record<string, string> = {};
  data.forEach((r) => { map[r.key] = r.value || ''; });

  if (map['fb_pixel_enabled'] === 'false' || !map['fb_pixel_id']) return null;

  pixelConfig = {
    id: map['fb_pixel_id'],
    capiEnabled: map['fb_capi_enabled'] === 'true',
    testCode: map['fb_capi_test_code'] || '',
    tracks: {
      pageview:     map['fb_track_pageview'] !== 'false',
      view_content: map['fb_track_view_content'] !== 'false',
      add_to_cart:  map['fb_track_add_to_cart'] !== 'false',
      purchase:     map['fb_track_purchase'] !== 'false',
      lead:         map['fb_track_lead'] === 'true',
    },
  };
  return pixelConfig;
};

const injectPixelScript = (pixelId: string) => {
  if (pixelLoaded) return;
  pixelLoaded = true;

  // Facebook Pixel base code
  const n: any = function (...args: any[]) { (n.q = n.q || []).push(args); };
  n.push = n;
  n.loaded = true;
  n.version = '2.0';
  n.q = [];
  window.fbq = n;
  if (!window._fbq) window._fbq = n;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  window.fbq('init', pixelId);
};

// ─── Server-side CAPI helper ──────────────────────────────
const sendCAPI = async (eventName: string, params?: Record<string, any>) => {
  if (!pixelConfig?.capiEnabled) return;
  try {
    await supabase.functions.invoke('facebook-capi', {
      body: {
        event_name: eventName,
        event_source_url: window.location.href,
        test_event_code: pixelConfig.testCode || undefined,
        user_data: {
          client_user_agent: navigator.userAgent,
        },
        custom_data: params || undefined,
      },
    });
  } catch {
    // Silently fail - don't block UX
  }
};

// ─── Public helpers ────────────────────────────────────────
export const fbTrack = (event: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, params);
  }
  // Also send server-side CAPI event
  sendCAPI(event, params);
};

export const fbTrackPageView = () => fbTrack('PageView');
export const fbTrackViewContent = (params: { content_name: string; content_ids: string[]; value?: number; currency?: string }) =>
  fbTrack('ViewContent', { ...params, currency: params.currency || 'BDT' });
export const fbTrackAddToCart = (params: { content_name: string; content_ids: string[]; value: number; currency?: string }) =>
  fbTrack('AddToCart', { ...params, currency: params.currency || 'BDT' });
export const fbTrackPurchase = (params: { value: number; currency?: string; content_ids?: string[]; num_items?: number }) =>
  fbTrack('Purchase', { ...params, currency: params.currency || 'BDT' });
export const fbTrackLead = () => fbTrack('Lead');

// ─── Component ─────────────────────────────────────────────
const FacebookPixel = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    loadPixelSettings().then((cfg) => {
      if (!cfg) return;
      injectPixelScript(cfg.id);
      if (cfg.tracks.pageview) fbTrackPageView();
    });
  }, []);

  return null;
};

export default FacebookPixel;
