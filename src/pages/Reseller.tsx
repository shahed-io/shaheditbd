import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Zap, Wallet, Copy, Check, RefreshCw, AlertCircle, Loader2,
  History, KeyRound, ShieldCheck, Lock, ArrowLeft,
} from 'lucide-react';

interface Generation {
  id: string;
  installation_id: string | null;
  cid: string;
  price_cents: number;
  created_at: string;
}

// ─── Glassmorphism design tokens ─────────────────────────────────────────────
const gradientBorderCard = `
  relative rounded-2xl p-[1.5px]
  bg-gradient-to-br from-violet-500/70 via-cyan-400/50 to-indigo-500/70
  shadow-[0_8px_32px_rgba(99,77,255,0.15),0_2px_8px_rgba(99,77,255,0.08)]
`.replace(/\s+/g, ' ').trim();

const inp = "w-full border border-violet-200/60 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 bg-white/60 backdrop-blur-sm transition-all";
const btn = "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_rgba(99,77,255,0.35)] hover:shadow-[0_6px_20px_rgba(99,77,255,0.45)] hover:-translate-y-0.5";

// ─── Page background wrapper ────────────────────────────────────────────────
const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen p-4 md:p-8"
    style={{ background: 'linear-gradient(135deg, hsl(258,60%,97%) 0%, hsl(200,60%,97%) 50%, hsl(258,50%,96%) 100%)' }}>
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, hsl(258,78%,55%), transparent)' }} />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, hsl(200,90%,45%), transparent)' }} />
    </div>
    <div className="relative z-10 max-w-3xl mx-auto">
      {children}
    </div>
  </div>
);

// ─── CID Generator ──────────────────────────────────────────────────────────
const CIDGenerator = ({
  balanceCents,
  onBalanceUpdate,
}: {
  balanceCents: number;
  onBalanceUpdate: (c: number) => void;
}) => {
  const [iid, setIid] = useState('');
  const [cid, setCid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<Generation[]>([]);
  const [histLoading, setHistLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const { data, error: e } = await supabase.functions.invoke('get-cid', { body: { action: 'my_history' } });
      if (e) throw new Error(e.message);
      setHistory(data?.generations ?? []);
    } catch { /* ignore */ }
    finally { setHistLoading(false); }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setCid(''); setLoading(true);
    try {
      const { data, error: e2 } = await supabase.functions.invoke('get-cid', {
        body: { action: 'getcid', installation_id: iid },
      });
      if (e2) throw new Error(e2.message);
      if (data?.cid) {
        setCid(data.cid);
        onBalanceUpdate(data.balance_after_cents);
        loadHistory();
        toast.success('CID generated successfully!');
      } else {
        setError(data?.error || 'CID generation failed');
      }
    } catch (err: unknown) { setError((err as Error).message); }
    finally { setLoading(false); }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      {balanceCents === 0 && (
        <div className="flex items-center gap-2 bg-red-50/80 border border-red-200/60 rounded-xl px-4 py-3 text-red-600 text-sm backdrop-blur-sm">
          <AlertCircle size={14} className="shrink-0" />
          আপনার ব্যালেন্স শেষ। Admin-এর সাথে যোগাযোগ করুন।
        </div>
      )}

      {/* Balance Card */}
      <div className={gradientBorderCard}>
        <div className="rounded-[calc(1rem-1.5px)] bg-white/75 backdrop-blur-[28px] p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase tracking-wide">Available Balance</p>
            <p className="text-3xl font-black bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
              ${(balanceCents / 100).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">প্রতি CID এর দাম $1.00</p>
          </div>
          <div className="w-13 h-13 rounded-2xl flex items-center justify-center shadow-[0_4px_14px_rgba(99,77,255,0.25)]"
            style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))' }}>
            <Wallet size={22} className="text-white" />
          </div>
        </div>
      </div>

      {/* Generator Card */}
      <div className={gradientBorderCard}>
        <div className="rounded-[calc(1rem-1.5px)] bg-white/75 backdrop-blur-[28px] p-6">
          <h2 className="font-bold text-foreground flex items-center gap-2 mb-5">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))' }}>
              <Zap size={14} className="text-white" />
            </span>
            CID Generate করুন
          </h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Installation ID</label>
              <input type="text" value={iid} onChange={e => setIid(e.target.value)}
                placeholder="Installation ID লিখুন..." required className={inp + " font-mono"} />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50/80 border border-red-200/60 rounded-xl px-3 py-2.5 text-red-600 text-sm backdrop-blur-sm">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />{error}
              </div>
            )}

            <button type="submit" disabled={loading || !iid.trim() || balanceCents < 100}
              className={`w-full ${btn} disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0`}>
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> প্রসেস হচ্ছে...</>
                : <><Zap size={14} /> CID তৈরি করুন — $1.00</>}
            </button>
          </form>

          {cid && (
            <div className="mt-5 rounded-xl p-4 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, hsla(258,78%,55%,0.08), hsla(200,90%,45%,0.08))', border: '1px solid hsla(258,78%,55%,0.20)' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: 'hsl(258,78%,55%)' }}>Confirmation ID (CID)</p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-2xl font-black font-mono tracking-widest bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">{cid}</p>
                <button onClick={() => copy(cid)}
                  className="p-2 rounded-xl transition-all shadow-sm"
                  style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))' }}>
                  {copied ? <Check size={16} className="text-white" /> : <Copy size={16} className="text-white" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Card */}
      <div className={gradientBorderCard}>
        <div className="rounded-[calc(1rem-1.5px)] bg-white/75 backdrop-blur-[28px] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid hsla(258,78%,55%,0.12)' }}>
            <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
              <History size={14} className="text-violet-500" /> আমার Generations
            </h3>
            <button onClick={loadHistory} className="text-muted-foreground hover:text-violet-500 transition-colors p-1 rounded-lg hover:bg-violet-50">
              <RefreshCw size={14} />
            </button>
          </div>
          {histLoading ? (
            <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-violet-400" /></div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">এখনো কোনো generation নেই।</p>
          ) : (
            <div className="divide-y divide-violet-100/60 max-h-80 overflow-y-auto">
              {history.map(h => (
                <div key={h.id} className="px-5 py-3.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs hover:bg-violet-50/30 transition-colors">
                  <div>
                    <p className="text-muted-foreground mb-0.5">Installation ID</p>
                    <p className="font-mono text-foreground truncate">{h.installation_id || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">CID</p>
                    <div className="flex items-center gap-1.5">
                      <p className="font-mono font-bold bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent truncate">{h.cid}</p>
                      <button onClick={() => copy(h.cid)} className="text-muted-foreground hover:text-violet-500 shrink-0 transition-colors"><Copy size={10} /></button>
                    </div>
                  </div>
                  <p className="col-span-2 text-muted-foreground/70">{new Date(h.created_at).toLocaleString('bn-BD')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────
const Reseller = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isReseller, setIsReseller] = useState(false);
  const [balanceCents, setBalanceCents] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setChecking(false); return; }
    (async () => {
      try {
        // Check role
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        const roleList = (roles ?? []).map(r => r.role);
        const hasResellerAccess = roleList.includes('reseller') || roleList.includes('admin');
        setIsReseller(hasResellerAccess);

        if (hasResellerAccess) {
          const { data } = await supabase.functions.invoke('get-cid', { body: { action: 'balance' } });
          if (data?.ok) {
            setBalanceCents(data.balance_cents ?? 0);
            setIsActive(data.is_active ?? true);
          }
        }
      } finally { setChecking(false); }
    })();
  }, [user, authLoading]);

  if (authLoading || checking) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      </PageShell>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <PageShell>
        <div className={gradientBorderCard + " mt-12"}>
          <div className="rounded-[calc(1rem-1.5px)] bg-white/85 backdrop-blur-[28px] p-8 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-[0_8px_24px_rgba(99,77,255,0.35)]"
              style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))' }}>
              <Lock size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-foreground mb-2">Sign in required</h1>
            <p className="text-sm text-muted-foreground mb-6">CID Reseller Portal-এ প্রবেশ করতে আগে আপনার অ্যাকাউন্টে লগইন করুন।</p>
            <button onClick={() => navigate('/dashboard')} className={btn + " mx-auto px-6"}>
              <KeyRound size={14} /> লগইন / সাইনআপ
            </button>
            <button onClick={() => navigate('/')} className="mt-3 text-xs text-muted-foreground hover:text-violet-500 transition-colors flex items-center gap-1 mx-auto">
              <ArrowLeft size={12} /> হোমে ফিরে যান
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  // Logged in but not a reseller
  if (!isReseller) {
    return (
      <PageShell>
        <div className={gradientBorderCard + " mt-12"}>
          <div className="rounded-[calc(1rem-1.5px)] bg-white/85 backdrop-blur-[28px] p-8 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-[0_8px_24px_rgba(99,77,255,0.35)]"
              style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))' }}>
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-foreground mb-2">Reseller অ্যাক্সেস নেই</h1>
            <p className="text-sm text-muted-foreground mb-1">আপনার অ্যাকাউন্টে এখনো Reseller রোল assign করা হয়নি।</p>
            <p className="text-xs text-muted-foreground mb-6">Reseller হতে চাইলে Admin-এর সাথে যোগাযোগ করুন।</p>
            <div className="bg-violet-50/60 border border-violet-200/60 rounded-xl p-3 mb-5 text-xs text-foreground/80">
              <p className="mb-1"><span className="font-semibold">Logged in as:</span> {user.email}</p>
              <p className="font-mono text-[10px] break-all text-muted-foreground">UID: {user.id}</p>
            </div>
            <button onClick={() => navigate('/contact')} className={btn + " mx-auto px-6"}>
              <KeyRound size={14} /> Admin-কে যোগাযোগ করুন
            </button>
            <button onClick={() => navigate('/dashboard')} className="mt-3 text-xs text-muted-foreground hover:text-violet-500 transition-colors flex items-center gap-1 mx-auto">
              <ArrowLeft size={12} /> Dashboard-এ ফিরে যান
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  // Reseller, but suspended
  if (!isActive) {
    return (
      <PageShell>
        <div className={gradientBorderCard + " mt-12"}>
          <div className="rounded-[calc(1rem-1.5px)] bg-white/85 backdrop-blur-[28px] p-8 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5 bg-red-500">
              <AlertCircle size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-foreground mb-2">অ্যাকাউন্ট সাময়িকভাবে স্থগিত</h1>
            <p className="text-sm text-muted-foreground mb-6">আপনার Reseller অ্যাকাউন্টটি আপাতত নিষ্ক্রিয়। বিস্তারিত জানতে Admin-এর সাথে যোগাযোগ করুন।</p>
            <button onClick={() => navigate('/contact')} className={btn + " mx-auto px-6"}>Admin-কে যোগাযোগ</button>
          </div>
        </div>
      </PageShell>
    );
  }

  // All good — show generator
  return (
    <PageShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <ShieldCheck size={22} className="text-violet-500" /> CID Reseller Portal
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
        </div>
        <button onClick={() => navigate('/dashboard')}
          className="px-3 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-violet-500 hover:bg-white/60 backdrop-blur-sm border border-white/60 transition-all flex items-center gap-1.5">
          <ArrowLeft size={14} /> Dashboard
        </button>
      </div>
      <CIDGenerator balanceCents={balanceCents} onBalanceUpdate={setBalanceCents} />
    </PageShell>
  );
};

export default Reseller;
