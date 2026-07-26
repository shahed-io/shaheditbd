import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@fontsource/arvo/400.css";
import "@fontsource/arvo/700.css";
import "@fontsource/hind-siliguri/400.css";
import "@fontsource/hind-siliguri/600.css";
import "@fontsource/hind-siliguri/700.css";
import React from "react";
import { ScraperShield } from "./components/ScraperShield";
import { HelmetProvider } from "react-helmet-async";

// Global error boundary to prevent blank screens
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error?.message || "Unknown error" };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[RootErrorBoundary]", error, info);
    // Prevent search engines from indexing error-state pages
    try {
      const existing = document.querySelector('meta[name="robots"]');
      if (existing) existing.setAttribute("content", "noindex, nofollow");
      else {
        const m = document.createElement("meta");
        m.name = "robots";
        m.content = "noindex, nofollow";
        document.head.appendChild(m);
      }
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      // Detect crawlers / SSR-like environments — render brand content instead of error UI
      const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
      const isBot = /bot|crawler|spider|crawling|googlebot|bingbot|yandex|baiduspider|duckduckbot|facebookexternalhit|twitterbot|slurp|lighthouse|headlesschrome/i.test(ua);

      if (isBot) {
        // Serve brand-aligned static content to crawlers so search snippets stay clean
        return (
          <div style={{ maxWidth: 900, margin: "40px auto", padding: 24, fontFamily: "system-ui, sans-serif", lineHeight: 1.6, color: "#111" }}>
            <h1 style={{ fontSize: "2rem", marginBottom: 8 }}>Shahed Store – Bangladesh's #1 Trusted Digital Software Shop</h1>
            <p><strong>বাংলাদেশের সবচেয়ে বিশ্বস্ত ডিজিটাল সফটওয়্যার শপ।</strong> Windows 11, Microsoft Office 365, Adobe Creative Cloud, Netflix, Spotify, NordVPN, Antivirus সর্বনিম্ন মূল্যে। ১০০% অরিজিনাল লাইসেন্স, ইনস্ট্যান্ট ডেলিভারি ২৪/৭।</p>
            <p>Buy genuine Windows 11 Pro keys, Microsoft Office 365, Adobe Creative Cloud, Netflix Premium, Spotify Premium, NordVPN, ESET, Bitdefender at the lowest price in Bangladesh — instant email delivery, bKash / Nagad / Bank payment supported.</p>
          </div>
        );
      }

      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#f8fafc",
          fontFamily: "sans-serif",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }} aria-hidden="true">⚠️</div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
            কিছু একটা সমস্যা হয়েছে
          </h2>
          <p style={{ color: "#64748b", marginBottom: "24px", fontSize: "14px" }}>
            পেজটি লোড করতে সমস্যা হচ্ছে। দয়া করে রিলোড করুন।
          </p>
          <button
            onClick={() => {
              // Unregister SW and hard reload
              if ("serviceWorker" in navigator) {
                navigator.serviceWorker.getRegistrations().then(regs => {
                  regs.forEach(r => r.unregister());
                }).finally(() => window.location.reload());
              } else {
                window.location.reload();
              }
            }}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "12px 28px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            রিলোড করুন
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ══════════════════════════════════════════════════════════════
// Scroll performance: toggle html.is-scrolling during scroll so
// heavy backdrop-filter/blur effects can be temporarily neutralized
// (see index.css). Prevents laggy scrolling on desktop.
// ══════════════════════════════════════════════════════════════
if (typeof window !== 'undefined') {
  let scrollTimer: number | undefined;
  let ticking = false;
  const root = document.documentElement;
  const onScroll = () => {
    if (!ticking) {
      root.classList.add('is-scrolling');
      ticking = true;
    }
    if (scrollTimer) window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      root.classList.remove('is-scrolling');
      ticking = false;
    }, 140);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}

createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <HelmetProvider>
      <ScraperShield>
        <App />
      </ScraperShield>
    </HelmetProvider>
  </RootErrorBoundary>
);

