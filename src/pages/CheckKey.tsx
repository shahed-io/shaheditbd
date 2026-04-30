import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  KeyRound, Loader2, CheckCircle2, XCircle, AlertCircle,
  Sparkles, ShieldCheck, ChevronLeft, Copy, Search,
} from 'lucide-react';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import SEOHead from '@/components/seo/SEOHead';
import AuthModal from '@/components/store/AuthModal';

interface CheckResult {
  key: string;
  status: 'live' | 'dead' | 'unknown';
  meaning: string;
  errorCode: string | null;
  product: string | null;
  subType: string | null;
  actType: string | null;
  remaining: string | null;
  time: string | null;
}

const CheckKey = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [keysInput, setKeysInput] = useState('');
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);
  const [showAuth, setShowAuth] = useState(false);

  const handleCheck = async () => {
    if (!keysInput.trim()) {
      toast.error('Please enter at least one product key');
      return;
    }
    if (!user) {
      setShowAuth(true);
      return;
    }
    setChecking(true);
    setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke('check-key', {
        body: { keys: keysInput },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const out: CheckResult[] = data?.results ?? [];
      setResults(out);
      const live = out.filter(r => r.status === 'live').length;
      const dead = out.filter(r => r.status === 'dead').length;
      toast.success(`Checked ${out.length} key${out.length !== 1 ? 's' : ''} — ${live} live, ${dead} dead`);
    } catch (e: any) {
      toast.error(e?.message || 'Check failed. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const copyResult = async (key: string, status: string) => {
    await navigator.clipboard.writeText(`${key} — ${status.toUpperCase()}`);
    toast.success('Copied');
  };

  const statusBadge = (status: string) => {
    if (status === 'live') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'hsl(142,71%,40%)' }}>
          <CheckCircle2 size={12} /> LIVE
        </span>
      );
    }
    if (status === 'dead') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'hsl(0,72%,51%)' }}>
          <XCircle size={12} /> DEAD
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'hsl(38,92%,50%)' }}>
        <AlertCircle size={12} /> UNKNOWN
      </span>
    );
  };

  return (
    <>
      <SEOHead
        title="Product Key Checker — Verify Live or Dead Instantly | Shahed Store"
        description="Check if your product key is live or dead instantly. Verify multiple keys at once — no waiting, no calls."
      />
      <Navbar />
      <div className="min-h-screen pt-24 pb-16 px-4" style={{
        background: 'linear-gradient(180deg, hsl(258,40%,97%) 0%, hsl(0,0%,100%) 50%)',
      }}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
              <ChevronLeft size={16} /> Back
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(258,78%,42%))',
                boxShadow: '0 4px 16px hsla(258,78%,55%,0.3)',
              }}>
                <KeyRound size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-foreground">Check Key</h1>
                <p className="text-sm text-muted-foreground">Verify if a product key is live or dead — instantly</p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="rounded-2xl p-5 mb-6" style={{
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(24px)',
            border: '1px solid hsla(258,78%,75%,0.18)',
          }}>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Sparkles size={14} className="text-primary" /> How It Works
            </h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="font-bold text-primary">1.</span> Paste your product key(s) in the format <code className="text-foreground bg-muted/50 px-1 rounded">XXXXX-XXXXX-XXXXX-XXXXX-XXXXX</code>.</li>
              <li className="flex gap-2"><span className="font-bold text-primary">2.</span> Separate multiple keys with commas or new lines (max 50 per check).</li>
              <li className="flex gap-2"><span className="font-bold text-primary">3.</span> Click "Check Key" — we instantly verify each one.</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-emerald-600" /> 100% free for logged-in users. No credits required.
            </p>
          </div>

          {/* Input form */}
          <div className="rounded-2xl p-5 mb-6" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,255,255,0.72))',
            backdropFilter: 'blur(28px) saturate(180%)',
            border: '1px solid hsla(258,78%,75%,0.28)',
            boxShadow: '0 8px 32px hsla(258,78%,55%,0.10)',
          }}>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Product Key(s)
            </label>
            <textarea
              value={keysInput}
              onChange={(e) => setKeysInput(e.target.value)}
              rows={5}
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX&#10;XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
              className="w-full px-4 py-3 rounded-xl border border-border bg-white/70 text-sm font-mono tracking-wide focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              spellCheck={false}
              autoCapitalize="characters"
            />
            <button
              onClick={handleCheck}
              disabled={checking || authLoading}
              className="w-full mt-4 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(258,78%,42%))',
                boxShadow: '0 6px 20px hsla(258,78%,55%,0.35)',
              }}
            >
              {checking ? (
                <><Loader2 size={18} className="animate-spin" /> Checking…</>
              ) : (
                <><Search size={18} /> Check Key</>
              )}
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="rounded-2xl p-5" style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(28px)',
              border: '1px solid hsla(258,78%,75%,0.22)',
            }}>
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center justify-between">
                <span>Results ({results.length})</span>
                <span className="flex gap-2 text-xs">
                  <span className="text-emerald-600">{results.filter(r => r.status === 'live').length} live</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-red-600">{results.filter(r => r.status === 'dead').length} dead</span>
                </span>
              </h3>
              <div className="space-y-3">
                {results.map((r, idx) => (
                  <div key={idx} className="rounded-xl p-3 border border-border/60 bg-white/60">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm font-bold text-foreground break-all">{r.key}</p>
                        <p className="text-xs text-muted-foreground mt-1">{r.meaning}</p>
                        {(r.product || r.actType || r.remaining) && (
                          <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
                            {r.product && <span className="px-2 py-0.5 rounded-md bg-muted/60 text-foreground">{r.product}</span>}
                            {r.actType && <span className="px-2 py-0.5 rounded-md bg-muted/60 text-foreground">{r.actType}</span>}
                            {r.remaining && <span className="px-2 py-0.5 rounded-md bg-muted/60 text-foreground">Remaining: {r.remaining}</span>}
                            {r.errorCode && <span className="px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground font-mono">{r.errorCode}</span>}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {statusBadge(r.status)}
                        <button onClick={() => copyResult(r.key, r.status)} className="p-1.5 rounded-md hover:bg-muted/60" title="Copy">
                          <Copy size={14} className="text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
      {showAuth && <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />}
    </>
  );
};

export default CheckKey;
