import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Component, type ReactNode } from "react";

class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0b0d17', color: '#e2e8f0', fontFamily: 'Inter,system-ui,sans-serif', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>পেজ লোড হতে সমস্যা হচ্ছে</h2>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.875rem' }}>ক্যাশ ক্লিয়ার করে আবার চেষ্টা করুন</p>
          <button
            onClick={() => {
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(regs => {
                  Promise.all(regs.map(r => r.unregister())).then(() => window.location.reload());
                });
              } else {
                window.location.reload();
              }
            }}
            style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.75rem 1.5rem', cursor: 'pointer', fontSize: '1rem' }}
          >
            🔄 রিলোড করুন
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
