import { useEffect, useState } from 'react';
import { evaluateClientProtection, installCopyDeterrents } from '@/lib/antiScraping';
import { useAuth } from '@/hooks/useAuth';

/**
 * ScraperShield — mounts once at app root.
 * Admin panel routes (/ceo/*) and admin users always bypass copy deterrents.
 */
export const ScraperShield = ({ children }: { children: React.ReactNode }) => {
  const [blocked, setBlocked] = useState(false);
  const { isAdmin } = useAuth();
  const [pathname, setPathname] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

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
    const decision = evaluateClientProtection();

    if (decision.shouldBlock) {
      setBlocked(true);
      try {
        document.title = 'Protected Content – Shahed Store';
      } catch { /* ignore */ }
      return;
    }

    // Admin panel routes — never install deterrents.
    if (pathname.startsWith('/ceo')) return;

    // Admin users — bypass everywhere.
    if (isAdmin) return;

    if (decision.classification === 'human') {
      const cleanup = installCopyDeterrents();
      return cleanup;
    }
  }, [isAdmin, pathname]);

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
          দিয়ে এই সাইট স্ক্যান বা কপি করার অনুমতি নেই। যদি আপনি একজন
          সাধারণ ভিজিটর হন, দয়া করে স্ট্যান্ডার্ড ব্রাউজার ব্যবহার করে
          আবার চেষ্টা করুন।
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
        <p style={{ marginTop: '24px', fontSize: '12px', opacity: 0.5 }}>
          © Shahed Store · All designs are proprietary.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
