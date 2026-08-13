import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window { turnstile?: any }
}

let siteKeyCache: string | null | undefined;

/** Reads the Cloudflare Turnstile site key stored in site settings (admin-managed). */
export const useTurnstileSiteKey = () => {
  const [siteKey, setSiteKey] = useState<string | null>(siteKeyCache ?? null);

  useEffect(() => {
    if (siteKeyCache !== undefined) { setSiteKey(siteKeyCache); return; }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'turnstile_site_key')
        .maybeSingle();
      const key = (data?.value || '').trim() || null;
      siteKeyCache = key;
      if (active) setSiteKey(key);
    })();
    return () => { active = false; };
  }, []);

  return siteKey;
};

const SCRIPT_ID = 'cf-turnstile-script';

const loadScript = () => new Promise<void>((resolve, reject) => {
  if (window.turnstile) return resolve();
  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    existing.addEventListener('load', () => resolve());
    existing.addEventListener('error', () => reject(new Error('turnstile load failed')));
    return;
  }
  const s = document.createElement('script');
  s.id = SCRIPT_ID;
  s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  s.async = true;
  s.defer = true;
  s.onload = () => resolve();
  s.onerror = () => reject(new Error('turnstile load failed'));
  document.head.appendChild(s);
});

interface Props {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

/** Renders the Cloudflare Turnstile challenge. Nothing renders when no site key is configured. */
const TurnstileWidget = ({ siteKey, onVerify, onExpire }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          theme: 'light',
          callback: (token: string) => onVerify(token),
          'expired-callback': () => onExpire?.(),
          'error-callback': () => onExpire?.(),
        });
      })
      .catch(() => { /* network blocked — server still enforces other bot checks */ });

    return () => {
      cancelled = true;
      try { if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current); } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  return <div ref={ref} className="flex justify-center my-2" />;
};

export default TurnstileWidget;
