import { useState, useEffect } from 'react';
import { Users, ShieldCheck, Zap, Wallet, Copy, Check, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PRICE_PER_CID = 1; // $1 = ৳1 (as per config.php: 100 cents)

const Reseller = () => {
  const [installationId, setInstallationId] = useState('');
  const [confirmationId, setConfirmationId] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<{ installation_id: string; confirmation_id: string; time: string }[]>([]);

  const fetchBalance = async () => {
    setBalanceLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-cid', {
        body: { action: 'balance' },
      });
      if (error) throw error;
      // Normalize common balance keys from grahok.io
      const raw = data?.data ?? data;
      const b = raw?.balance ?? raw?.credits ?? raw?.remaining ?? raw?.Balance;
      if (b !== undefined && b !== null) setBalance(parseFloat(String(b)));
    } catch {
      // Balance fetch failed silently
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    // Load history from localStorage
    const saved = localStorage.getItem('cid_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const handleGetCID = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!installationId.trim()) return;

    setLoading(true);
    setError('');
    setConfirmationId('');

    try {
      const { data, error } = await supabase.functions.invoke('get-cid', {
        body: { action: 'getcid', installation_id: installationId.trim() },
      });

      if (error) throw error;

      // Handle various response formats from grahok.io
      const cid = data?.confirmation_id || data?.cid || data?.result || data?.data;

      if (cid) {
        setConfirmationId(String(cid));
        const entry = {
          installation_id: installationId.trim(),
          confirmation_id: String(cid),
          time: new Date().toLocaleString('bn-BD'),
        };
        const newHistory = [entry, ...history].slice(0, 10);
        setHistory(newHistory);
        localStorage.setItem('cid_history', JSON.stringify(newHistory));
        await fetchBalance();
      } else if (data?.error || data?.message) {
        setError(data.error || data.message);
      } else {
        setError('CID পাওয়া যায়নি। Installation ID চেক করুন।');
      }
    } catch (err: unknown) {
      setError('সার্ভার ত্রুটি। পরে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-background to-primary/5 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase tracking-widest">Reseller Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground" style={{ fontFamily: 'Sora, sans-serif' }}>
            CID For Reseller
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Installation ID দিন এবং সঙ্গে সঙ্গে Confirmation ID পান।
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            {[
              { icon: ShieldCheck, label: 'সিকিউর API' },
              { icon: Zap, label: 'ইনস্ট্যান্ট CID' },
              { icon: Users, label: 'রিসেলার প্যানেল' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                <Icon className="w-3.5 h-3.5" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Form */}
        <div className="lg:col-span-2 space-y-5">

          {/* Balance Card */}
          <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Available Balance</p>
                <p className="text-xl font-bold text-foreground">
                  {balanceLoading ? (
                    <span className="inline-block w-16 h-5 bg-muted animate-pulse rounded" />
                  ) : balance !== null ? (
                    `$${balance.toFixed(2)}`
                  ) : (
                    '—'
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={fetchBalance}
              disabled={balanceLoading}
              className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
              title="Refresh balance"
            >
              <RefreshCw className={`w-4 h-4 ${balanceLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* CID Form */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <h2 className="text-base font-bold text-foreground">CID Generate করুন</h2>

            <form onSubmit={handleGetCID} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Installation ID</label>
                <input
                  type="text"
                  value={installationId}
                  onChange={(e) => setInstallationId(e.target.value)}
                  placeholder="Installation ID এখানে লিখুন..."
                  required
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !installationId.trim()}
                className="w-full btn-glow py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    CID Generate করুন
                  </>
                )}
              </button>
            </form>

            {/* Result */}
            {confirmationId && (
              <div className="border border-primary/30 bg-primary/5 rounded-xl p-4 space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Confirmation ID (CID)</p>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-bold text-primary font-mono tracking-widest break-all">{confirmationId}</p>
                  <button
                    onClick={() => copyToClipboard(confirmationId)}
                    className="shrink-0 p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* History Panel */}
        <div className="rounded-2xl border border-border bg-card p-5 h-fit">
          <h3 className="text-sm font-bold text-foreground mb-4">সাম্প্রতিক CID</h3>
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">এখনো কোনো CID generate করা হয়নি।</p>
          ) : (
            <div className="space-y-3">
              {history.map((h, i) => (
                <div key={i} className="border border-border rounded-xl p-3 space-y-1.5">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Installation ID</p>
                    <p className="text-xs text-foreground font-mono truncate">{h.installation_id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">CID</p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-primary font-mono font-bold truncate flex-1">{h.confirmation_id}</p>
                      <button
                        onClick={() => copyToClipboard(h.confirmation_id)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60">{h.time}</p>
                </div>
              ))}
            </div>
          )}
          {history.length > 0 && (
            <button
              onClick={() => { setHistory([]); localStorage.removeItem('cid_history'); }}
              className="w-full mt-3 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear History
            </button>
          )}
        </div>

      </div>

      <Footer />
    </div>
  );
};

export default Reseller;
