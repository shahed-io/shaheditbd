import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Cloudflare Turnstile — invisible / managed bot verification.
 *
 * The widget stays invisible (appearance: "interaction-only") and only shows a
 * challenge for suspicious traffic. Call `execute()` before submitting a
 * login / signup / password-reset form. It resolves to `true` when the visitor
 * is verified server-side, and also `true` when Turnstile is not configured
 * (so auth never breaks).
 */

export interface TurnstileHandle {
  execute: (action?: string) => Promise<boolean>;
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      execute: (id: string, opts?: Record<string, unknown>) => void;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise: Promise<void> | null = null;
const loadScript = () => {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('turnstile_script_failed'));
    document.head.appendChild(s);
  });
  return scriptPromise;
};

let siteKeyPromise: Promise<string> | null = null;
const getSiteKey = () => {
  if (siteKeyPromise) return siteKeyPromise;
  siteKeyPromise = (async () => {
    try {
      const { data } = await supabase.functions.invoke('turnstile', { method: 'GET' });
      return (data as { siteKey?: string })?.siteKey ?? '';
    } catch {
      return '';
    }
  })();
  return siteKeyPromise;
};

const TurnstileGate = forwardRef<TurnstileHandle>((_props, ref) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const resolverRef = useRef<((t: string | null) => void) | null>(null);
  const [siteKey, setSiteKey] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const key = await getSiteKey();
      if (cancelled || !key) return;
      setSiteKey(key);
      try {
        await loadScript();
      } catch {
        return;
      }
      // api.js needs a tick to attach window.turnstile
      for (let i = 0; i < 40 && !window.turnstile; i++) {
        await new Promise((r) => setTimeout(r, 100));
      }
      if (cancelled || !window.turnstile || !boxRef.current || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(boxRef.current, {
        sitekey: key,
        appearance: 'interaction-only',
        execution: 'execute',
        theme: 'auto',
        callback: (token: string) => {
          resolverRef.current?.(token);
          resolverRef.current = null;
        },
        'error-callback': () => {
          resolverRef.current?.(null);
          resolverRef.current = null;
        },
        'timeout-callback': () => {
          resolverRef.current?.(null);
          resolverRef.current = null;
        },
      });
    })();
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
        widgetIdRef.current = null;
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    async execute(action = 'auth') {
      // Not configured / script blocked → do not block real users.
      if (!siteKey || !window.turnstile || !widgetIdRef.current) return true;

      const token = await new Promise<string | null>((resolve) => {
        resolverRef.current = resolve;
        try {
          window.turnstile!.reset(widgetIdRef.current!);
          window.turnstile!.execute(widgetIdRef.current!, { action });
        } catch {
          resolve(null);
        }
        // Safety timeout so a stuck challenge never freezes the form
        setTimeout(() => {
          if (resolverRef.current === resolve) {
            resolverRef.current = null;
            resolve(null);
          }
        }, 45000);
      });

      if (!token) return false;

      try {
        const { data, error } = await supabase.functions.invoke('turnstile', {
          body: { token, action },
        });
        if (error) return false;
        return Boolean((data as { success?: boolean })?.success);
      } catch {
        return false;
      }
    },
  }), [siteKey]);

  return <div ref={boxRef} className="flex justify-center empty:hidden" />;
});

TurnstileGate.displayName = 'TurnstileGate';

export default TurnstileGate;
