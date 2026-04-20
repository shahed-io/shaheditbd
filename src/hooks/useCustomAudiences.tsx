import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { CustomAudience } from '@/pages/admin/AdminCustomAudiences';

let cached: CustomAudience[] | null = null;
const fired = new Set<string>(); // session-only dedupe per page

const loadAudiences = async (): Promise<CustomAudience[]> => {
  if (cached) return cached;
  const { data } = await supabase.from('site_settings').select('value').eq('key', 'fb_custom_audiences').maybeSingle();
  try { cached = JSON.parse(data?.value || '[]'); } catch { cached = []; }
  return cached!;
};

const fireFbCustom = (eventName: string, params?: Record<string, any>) => {
  if (typeof window === 'undefined' || !(window as any).fbq) return;
  try { (window as any).fbq('trackCustom', eventName, params || {}); } catch { /* silent */ }
};

/**
 * Hook into route changes and selectively fire FB Pixel custom events
 * based on admin-defined audience rules.
 */
export const useCustomAudiences = (extra?: { cartValue?: number }) => {
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const audiences = await loadAudiences();
      if (cancelled) return;
      const path = location.pathname;
      const key = `${path}|${extra?.cartValue ?? ''}`;

      audiences.filter(a => a.enabled && a.fb_event_name).forEach(a => {
        const dedupeKey = `${a.id}|${key}`;
        if (fired.has(dedupeKey)) return;
        let match = false;
        switch (a.trigger_type) {
          case 'url_visit':
            match = !!a.trigger_value && path.includes(a.trigger_value);
            break;
          case 'category_view':
            match = path.startsWith('/shop') && location.search.includes(`category=${a.trigger_value}`);
            break;
          case 'product_view':
            match = path === `/product/${a.trigger_value}`;
            break;
          case 'min_cart_value': {
            const min = Number(a.trigger_value || 0);
            match = !!extra?.cartValue && extra.cartValue >= min;
            break;
          }
        }
        if (match) {
          fired.add(dedupeKey);
          fireFbCustom(a.fb_event_name, { path, value: extra?.cartValue });
        }
      });
    })();
    return () => { cancelled = true; };
  }, [location.pathname, location.search, extra?.cartValue]);
};

export const reloadCustomAudiencesCache = () => { cached = null; fired.clear(); };
