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
      try { document.title = 'Protected Content – Shahed IT'; } catch { /* ignore */ }
      return;
    }

    // Admin panel routes — never install deterrents.
    if (pathname.startsWith('/ceo')) return;
    // Admin users — bypass everywhere.
    if (isAdmin) return;

    if (decision.classification === 'human') {
      const anyDeterrent =
        cp.cp_right_click || cp.cp_copy || cp.cp_selection || cp.cp_drag || cp.cp_devtools ||
        cp.cp_print || cp.cp_devtools_detect || cp.cp_iframe_block || cp.cp_console_warn ||
        cp.cp_blur_on_hide || cp.cp_mobile_longpress;
      if (!anyDeterrent) return;
      const cleanup = installCopyDeterrents({
        rightClick: cp.cp_right_click,
        copyCut: cp.cp_copy,
        textSelection: cp.cp_selection,
        imageDrag: cp.cp_drag,
        devtoolsShortcuts: cp.cp_devtools,
        printBlock: cp.cp_print,
        devtoolsDetect: cp.cp_devtools_detect,
        iframeBlock: cp.cp_iframe_block,
        consoleWarn: cp.cp_console_warn,
        blurOnHide: cp.cp_blur_on_hide,
        mobileLongPress: cp.cp_mobile_longpress,
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
          width: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          overflow: 'hidden',
          background:
            'radial-gradient(1200px 600px at 15% 10%, hsla(258,78%,35%,0.55), transparent 60%),' +
            'radial-gradient(1000px 700px at 90% 90%, hsla(42,96%,50%,0.18), transparent 55%),' +
            'linear-gradient(160deg, #05060d 0%, #0a0b1a 45%, #0f0a24 100%)',
          color: '#f8fafc',
          fontFamily: '"Sora","Inter",system-ui,-apple-system,sans-serif',
          textAlign: 'center',
        }}
      >
        {/* Subtle grid overlay */}
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage:
              'linear-gradient(hsla(0,0%,100%,0.04) 1px, transparent 1px),' +
              'linear-gradient(90deg, hsla(0,0%,100%,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
          }}
        />
        {/* Floating orbs */}
        <div aria-hidden style={{
          position: 'absolute', top: '-120px', left: '-120px', width: 420, height: 420,
          borderRadius: '50%', filter: 'blur(90px)',
          background: 'radial-gradient(circle, hsla(258,78%,55%,0.55), transparent 70%)',
          animation: 'shield-float 12s ease-in-out infinite',
        }} />
        <div aria-hidden style={{
          position: 'absolute', bottom: '-140px', right: '-100px', width: 460, height: 460,
          borderRadius: '50%', filter: 'blur(100px)',
          background: 'radial-gradient(circle, hsla(42,96%,58%,0.28), transparent 70%)',
          animation: 'shield-float 14s ease-in-out infinite reverse',
        }} />

        <div
          style={{
            position: 'relative',
            maxWidth: 580,
            padding: '48px 36px',
            borderRadius: 28,
            background: 'linear-gradient(145deg, hsla(0,0%,100%,0.08), hsla(0,0%,100%,0.02))',
            border: '1px solid hsla(0,0%,100%,0.12)',
            backdropFilter: 'blur(28px) saturate(140%)',
            WebkitBackdropFilter: 'blur(28px) saturate(140%)',
            boxShadow:
              '0 30px 80px -20px hsla(258,80%,10%,0.7),' +
              '0 0 0 1px hsla(0,0%,100%,0.04) inset,' +
              '0 1px 0 hsla(0,0%,100%,0.15) inset',
          }}
        >
          {/* Shield emblem */}
          <div style={{
            position: 'relative', width: 96, height: 96, margin: '0 auto 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              position: 'absolute', inset: -14, borderRadius: '50%',
              background: 'conic-gradient(from 0deg, hsla(258,80%,60%,0.9), hsla(42,96%,58%,0.6), hsla(258,80%,60%,0.9))',
              filter: 'blur(2px)', animation: 'shield-ring 6s linear infinite',
              opacity: 0.75,
            }} />
            <div style={{
              position: 'absolute', inset: -2, borderRadius: '50%',
              background: 'linear-gradient(145deg, #0b0b1e, #14122e)',
            }} />
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
              style={{ position: 'relative', filter: 'drop-shadow(0 6px 20px hsla(258,80%,60%,0.6))' }}>
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f5f3ff" />
                  <stop offset="100%" stopColor="#c4b5fd" />
                </linearGradient>
              </defs>
              <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z"
                fill="url(#sg)" stroke="hsla(258,80%,75%,0.9)" strokeWidth="0.6" />
              <path d="m9 12 2.2 2.2L15.5 10" stroke="#1e1b4b" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 999, marginBottom: 18,
            background: 'hsla(258,80%,60%,0.14)',
            border: '1px solid hsla(258,80%,70%,0.28)',
            fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: '#ddd6fe', fontWeight: 700,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: '#a78bfa',
              boxShadow: '0 0 10px #a78bfa',
            }} />
            Shahed IT · Secure Zone
          </div>

          <h1 style={{
            fontSize: 34, fontWeight: 800, margin: '0 0 14px',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Protected Content
          </h1>

          <p style={{
            fontSize: 15.5, lineHeight: 1.65, margin: '0 0 10px',
            color: 'hsla(0,0%,100%,0.82)',
          }}>
            This website's design, layout, and content are legally protected
            against automated scraping, mirroring, and AI-based cloning tools.
          </p>
          <p style={{
            fontSize: 13.5, lineHeight: 1.75, margin: '0 0 26px',
            color: 'hsla(0,0%,100%,0.6)',
          }}>
            আমাদের ওয়েবসাইটের ডিজাইন ও কনটেন্ট কপিরাইট-সুরক্ষিত। স্বয়ংক্রিয় টুল,
            স্ক্র্যাপার বা AI দিয়ে এই সাইট স্ক্যান, কপি বা ক্লোন করা নিষিদ্ধ।
          </p>

          {/* Feature chips */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
            marginBottom: 28,
          }}>
            {['Anti-Scrape', 'DMCA Enforced', 'AI-Clone Shield', 'Fingerprint Logged'].map((t) => (
              <span key={t} style={{
                fontSize: 11, padding: '6px 12px', borderRadius: 999,
                background: 'hsla(0,0%,100%,0.05)',
                border: '1px solid hsla(0,0%,100%,0.1)',
                color: 'hsla(0,0%,100%,0.75)', fontWeight: 500,
              }}>{t}</span>
            ))}
          </div>

          <a
            href="https://shahedit.com"
            style={{
              position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 32px', borderRadius: 999,
              background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)',
              color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 15,
              letterSpacing: '0.01em',
              boxShadow:
                '0 10px 30px -8px hsla(280,80%,55%,0.7),' +
                '0 0 0 1px hsla(0,0%,100%,0.2) inset',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            Visit Shahed IT
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>

          <p style={{
            marginTop: 28, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'hsla(0,0%,100%,0.35)',
          }}>
            © Shahed IT · All Rights Reserved
          </p>
        </div>

        <style>{`
          @keyframes shield-ring { to { transform: rotate(360deg); } }
          @keyframes shield-float {
            0%,100% { transform: translate(0,0) scale(1); }
            50% { transform: translate(30px,-20px) scale(1.08); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
};
