import { useEffect, useState } from 'react';
import { evaluateClientProtection, installCopyDeterrents } from '@/lib/antiScraping';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const CP_KEYS = [
  'copy_protection_enabled',
  'cp_right_click',
  'cp_copy',
  'cp_selection',
  'cp_drag',
  'cp_devtools',
  'cp_scraper_block',
  'cp_print',
  'cp_devtools_detect',
  'cp_iframe_block',
  'cp_console_warn',
  'cp_blur_on_hide',
  'cp_mobile_longpress',
] as const;

type CpSettings = Record<(typeof CP_KEYS)[number], boolean>;

const DEFAULTS: CpSettings = {
  copy_protection_enabled: true,
  cp_right_click: true,
  cp_copy: true,
  cp_selection: true,
  cp_drag: true,
  cp_devtools: true,
  cp_scraper_block: true,
  cp_print: false,
  cp_devtools_detect: false,
  cp_iframe_block: false,
  cp_console_warn: false,
  cp_blur_on_hide: false,
  cp_mobile_longpress: false,
};

/**
 * ScraperShield — mounts once at app root.
 * Admin panel routes (/ceo/*) and admin users always bypass deterrents.
 */
export const ScraperShield = ({ children }: { children: React.ReactNode }) => {
  const [blocked, setBlocked] = useState(false);
  const [cp, setCp] = useState<CpSettings | null>(null);
  const { isAdmin } = useAuth();
  const [pathname, setPathname] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  // Load all toggles from site_settings.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('key, value')
          .in('key', CP_KEYS as unknown as string[]);
        if (cancelled) return;
        const map: CpSettings = { ...DEFAULTS };
        (data || []).forEach((r: any) => {
          if (r.key in map) (map as any)[r.key] = r.value !== 'false';
        });
        setCp(map);
      } catch {
        if (!cancelled) setCp(DEFAULTS);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Track SPA route changes (pushState/replaceState don't fire popstate).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setPathname(window.location.pathname);
    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;
    window.history.pushState = function (...args) {
      const r = origPush.apply(this, args as any);
      window.dispatchEvent(new Event('locationchange'));
      return r;
    };
    window.history.replaceState = function (...args) {
      const r = origReplace.apply(this, args as any);
      window.dispatchEvent(new Event('locationchange'));
      return r;
    };
    window.addEventListener('popstate', update);
    window.addEventListener('locationchange', update);
    return () => {
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
      window.removeEventListener('popstate', update);
      window.removeEventListener('locationchange', update);
    };
  }, []);

  useEffect(() => {
    if (!cp) return;
    // Master switch off → no deterrents, no scraper block.
    if (!cp.copy_protection_enabled) {
      setBlocked(false);
      return;
    }

    const decision = evaluateClientProtection();

    if (cp.cp_scraper_block && decision.shouldBlock) {
      setBlocked(true);
      try { document.title = 'Protected Content – Shahed Store'; } catch { /* ignore */ }
      return;
    }

    // Admin panel routes — never install deterrents.
    if (pathname.startsWith('/ceo')) return;
    // Admin users — bypass everywhere.
    if (isAdmin) return;

    if (decision.classification === 'human') {
      const anyDeterrent = cp.cp_right_click || cp.cp_copy || cp.cp_selection || cp.cp_drag || cp.cp_devtools;
      if (!anyDeterrent) return;
      const cleanup = installCopyDeterrents({
        rightClick: cp.cp_right_click,
        copyCut: cp.cp_copy,
        textSelection: cp.cp_selection,
        imageDrag: cp.cp_drag,
        devtoolsShortcuts: cp.cp_devtools,
      });
      return cleanup;
    }
  }, [isAdmin, pathname, cp]);

  if (blocked) {
    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
          background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)',
          color: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛡️</div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px', maxWidth: 560 }}>
          Protected Content
        </h1>
        <p style={{ fontSize: '16px', opacity: 0.85, maxWidth: 560, lineHeight: 1.6, marginBottom: '8px' }}>
          This website's design and content are protected against automated
          scraping and AI-based cloning tools.
        </p>
        <p style={{ fontSize: '14px', opacity: 0.7, maxWidth: 560, lineHeight: 1.6 }}>
          আমাদের ওয়েবসাইটের ডিজাইন কপিরাইট-সুরক্ষিত। স্বয়ংক্রিয় টুল
          দিয়ে এই সাইট স্ক্যান বা কপি করার অনুমতি নেই।
        </p>
        <a
          href="https://shahedstore.com.bd"
          style={{
            marginTop: '28px',
            display: 'inline-block',
            padding: '12px 28px',
            background: '#7c3aed',
            color: '#fff',
            borderRadius: '999px',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Visit Shahed Store
        </a>
      </div>
    );
  }

  return <>{children}</>;
};
