import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

interface PixelConfig {
  id: string;
  name: string;
  pixel_id: string;
  capi_token: string;
  capi_test_event_code: string;
  pixel_enabled: boolean;
  capi_enabled: boolean;
  track_pageview: boolean;
  track_purchase: boolean;
  track_add_to_cart: boolean;
  track_view_content: boolean;
  track_lead: boolean;
}

// Reset on each module load so HMR doesn't get stuck
let pixelLoaded = false;
let pixelConfigs: PixelConfig[] | null = null;
let pixelInitialized = false;

const loadPixelSettings = async (): Promise<PixelConfig[]> => {
  if (pixelConfigs !== null) return pixelConfigs;

  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .eq('category', 'facebook_pixel');

  if (!data) return [];
  const map: Record<string, string> = {};
  data.forEach((r) => { map[r.key] = r.value || ''; });

  // Try multi-pixel config first
  if (map['fb_pixels_config']) {
    try {
      const parsed = JSON.parse(map['fb_pixels_config']);
      if (Array.isArray(parsed) && parsed.length > 0) {
        pixelConfigs = parsed.filter((p: PixelConfig) => p.pixel_enabled && p.pixel_id);
        return pixelConfigs;
      }
    } catch {}
  }

  // Fallback to legacy single pixel
  if (map['fb_pixel_enabled'] === 'false' || !map['fb_pixel_id']) {
    pixelConfigs = [];
    return [];
  }

  pixelConfigs = [{
    id: 'legacy',
    name: 'Primary',
    pixel_id: map['fb_pixel_id'],
    capi_token: map['fb_capi_token'] || '',
    capi_test_event_code: map['fb_capi_test_code'] || '',
    pixel_enabled: true,
    capi_enabled: map['fb_capi_enabled'] === 'true',
    track_pageview: map['fb_track_pageview'] !== 'false',
    track_purchase: map['fb_track_purchase'] !== 'false',
    track_add_to_cart: map['fb_track_add_to_cart'] !== 'false',
    track_view_content: map['fb_track_view_content'] !== 'false',
    track_lead: map['fb_track_lead'] === 'true',
  }];
  return pixelConfigs;
};

const injectPixelScript = (configs: PixelConfig[]): Promise<void> => {
  return new Promise((resolve) => {
    if (pixelLoaded || configs.length === 0) { resolve(); return; }

    const enabledIds = configs.filter(c => c.pixel_enabled && c.pixel_id).map(c => c.pixel_id);
    if (enabledIds.length === 0) { resolve(); return; }

    // If fbq already exists (e.g. loaded externally), just init
    if (typeof window.fbq === 'function' && pixelInitialized) { resolve(); return; }

    pixelLoaded = true;

    // Set up fbq stub so init calls queue properly
    const n: any = function (...args: any[]) { (n.q = n.q || []).push(args); };
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    n.q = n.queue;
    window.fbq = n;
    if (!window._fbq) window._fbq = n;

    // Init all pixels BEFORE script loads so they queue
    enabledIds.forEach(id => window.fbq('init', id));
    pixelInitialized = true;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    script.onload = () => resolve();
    script.onerror = () => resolve(); // still resolve so PageView fires
    document.head.appendChild(script);
  });
};

// Send CAPI events to all enabled pixels
const sendCAPI = async (eventName: string, params?: Record<string, any>) => {
  if (!pixelConfigs) return;
  const capiPixels = pixelConfigs.filter(p => p.capi_enabled && p.pixel_id);
  if (capiPixels.length === 0) return;

  try {
    await supabase.functions.invoke('facebook-capi', {
      body: {
        event_name: eventName,
        event_source_url: window.location.href,
        pixels: capiPixels.map(p => ({
          pixel_id: p.pixel_id,
          test_event_code: p.capi_test_event_code || undefined,
        })),
        user_data: {
          client_user_agent: navigator.userAgent,
        },
        custom_data: params || undefined,
      },
    });
  } catch {
    // Silently fail
  }
};

// Track event on pixels that have the corresponding track flag enabled
const shouldTrack = (eventKey: string): string[] => {
  if (!pixelConfigs) return [];
  const key = `track_${eventKey}` as keyof PixelConfig;
  return pixelConfigs.filter(p => p[key] === true && p.pixel_id).map(p => p.pixel_id);
};

export const fbTrack = (event: string, params?: Record<string, any>, trackKey?: string) => {
  if (typeof window !== 'undefined' && window.fbq) {
    if (trackKey) {
      const ids = shouldTrack(trackKey);
      // Use trackSingle per pixel if multiple, else plain track for single pixel
      if (ids.length === 1) {
        window.fbq('trackSingle', ids[0], event, params);
      } else if (ids.length > 1) {
        ids.forEach(id => window.fbq('trackSingle', id, event, params));
      }
    } else {
      window.fbq('track', event, params);
    }
  }
  sendCAPI(event, params);
};

export const fbTrackPageView = () => {
  // For PageView, use standard fbq('track', 'PageView') to avoid "Custom event" label
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView');
  }
  sendCAPI('PageView');
};

export const fbTrackViewContent = (params: { content_name: string; content_ids: string[]; value?: number; currency?: string }) =>
  fbTrack('ViewContent', { ...params, currency: params.currency || 'BDT' }, 'view_content');
export const fbTrackAddToCart = (params: { content_name: string; content_ids: string[]; value: number; currency?: string }) =>
  fbTrack('AddToCart', { ...params, currency: params.currency || 'BDT' }, 'add_to_cart');
export const fbTrackPurchase = (params: { value: number; currency?: string; content_ids?: string[]; num_items?: number }) =>
  fbTrack('Purchase', { ...params, currency: params.currency || 'BDT' }, 'purchase');
export const fbTrackLead = () => fbTrack('Lead', undefined, 'lead');

const FacebookPixel = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Defer pixel loading slightly to not block initial paint
    const timer = setTimeout(async () => {
      const configs = await loadPixelSettings();
      if (configs.length === 0) return;

      // Wait for script to load before firing PageView — prevents "Custom event"
      await injectPixelScript(configs);

      const shouldFirePV = configs.some(c => c.track_pageview && c.pixel_id);
      if (shouldFirePV) fbTrackPageView();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return null;
};

export default FacebookPixel;
