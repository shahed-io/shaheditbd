import { useEffect, useState } from 'react';
import { evaluateClientProtection, installCopyDeterrents } from '@/lib/antiScraping';

/**
 * ScraperShield
 * --------------------------------------------------------------
 * Mounts once at the app root. Decides — purely on the client —
 * whether the current visitor is:
 *   • a real human  → render the app + install soft anti-copy UX
 *   • an allowed search/AI bot (Google, Bing, GPT, Claude, …)
 *     → render the app fully, NO deterrents (SEO must stay clean)
 *   • a scraper / cloning tool → swap the page for a polite
 *     "Protected Content" notice so the design cannot be copied
 *
 * IMPORTANT: This never touches API requests, Supabase queries,
 * edge functions, or auth — only the visual layer. Backend keeps
 * working exactly as before.
 */
export const ScraperShield = ({ children }: { children: React.ReactNode }) => {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const decision = evaluateClientProtection();

    if (decision.shouldBlock) {
      setBlocked(true);
      // Also nuke the document so headless scrapers that dump
      // innerHTML after JS executes get the protection notice
      // instead of the real markup.
      try {
        document.title = 'Protected Content – Shahed Store';
      } catch { /* ignore */ }
      return;
    }

    // Only install deterrents for real humans — never run them for
    // allowed search bots (they don't execute JS anyway, but be safe).
    if (decision.classification === 'human') {
      const cleanup = installCopyDeterrents();
      return cleanup;
    }
  }, []);

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
