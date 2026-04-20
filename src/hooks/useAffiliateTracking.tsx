import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'affiliate_ref';
const VISITOR_KEY = 'affiliate_visitor_id';

interface StoredRef {
  code: string;
  affiliateId: string;
  storedAt: number;
  expiresAt: number;
}

export const getStoredAffiliateRef = (): StoredRef | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredRef;
    if (parsed.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const clearStoredAffiliateRef = () => {
  localStorage.removeItem(STORAGE_KEY);
};

const getVisitorId = (): string => {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
};

/**
 * Captures ?ref=CODE from URL, validates against affiliate_accounts,
 * stores in localStorage, and logs a click in affiliate_clicks.
 * Cookie duration is read from affiliate_settings.
 */
export const useAffiliateTracking = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (!refCode) return;

    const code = refCode.toUpperCase().trim().slice(0, 20);
    if (!/^[A-Z0-9]+$/.test(code)) return;

    // Skip if same code already stored & valid
    const existing = getStoredAffiliateRef();
    if (existing && existing.code === code) return;

    (async () => {
      try {
        // Validate affiliate exists & approved
        const { data: aff } = await supabase
          .from('affiliate_accounts')
          .select('id, referral_code, status')
          .eq('referral_code', code)
          .eq('status', 'approved')
          .maybeSingle();

        if (!aff) return;

        // Read cookie duration from settings
        const { data: settings } = await supabase
          .from('affiliate_settings')
          .select('cookie_duration_days, is_enabled')
          .eq('id', 1)
          .maybeSingle();

        if (!settings?.is_enabled) return;

        const days = settings.cookie_duration_days || 30;
        const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;

        const stored: StoredRef = {
          code: aff.referral_code,
          affiliateId: aff.id,
          storedAt: Date.now(),
          expiresAt,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

        // Log the click (best-effort)
        const visitorId = getVisitorId();
        await supabase.from('affiliate_clicks').insert({
          affiliate_id: aff.id,
          referral_code: aff.referral_code,
          visitor_id: visitorId,
          landing_page: window.location.pathname + window.location.search,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent.slice(0, 500),
        });
      } catch (e) {
        console.warn('[Affiliate] tracking error', e);
      }
    })();
  }, [searchParams]);
};
