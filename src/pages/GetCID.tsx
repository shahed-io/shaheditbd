import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  KeyRound, Upload, Loader2, Copy, CheckCircle2, Clock,
  Sparkles, ShieldCheck, Wallet, History, ChevronLeft, X, ImageIcon, AlertTriangle,
} from 'lucide-react';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import SEOHead from '@/components/seo/SEOHead';
import AuthModal from '@/components/store/AuthModal';

interface Generation {
  id: string;
  number: string | null;
  operator_name: string | null;
  result: { cid?: string; provider?: string } | null;
  status: string;
  cost: number;
  created_at: string;
}

const formatIID = (raw: string) => {
  const digits = raw.replace(/[^0-9]/g, '');
  const groups: string[] = [];
  for (let i = 0; i < digits.length && groups.length < 9; i += 7) {
    groups.push(digits.substr(i, 7));
  }
  return groups.join('-');
};

const formatCID = (raw: string) => {
  const digits = raw.replace(/[^0-9]/g, '');
  const groups: string[] = [];
  for (let i = 0; i < digits.length && groups.length < 8; i += 6) {
    groups.push(digits.substr(i, 6));
  }
  return groups.join('-');
};

const GetCID = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(0);

  const [installationId, setInstallationId] = useState('');
  const [cidResult, setCidResult] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<{ message: string; code?: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [balance, setBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [history, setHistory] = useState<Generation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!user) { setBalanceLoading(false); return; }
    setBalanceLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setBalanceLoading(false); return; }
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-cid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'user_balance' }),
      });
      const data = await resp.json();
      if (data.ok) setBalance(data.balance);
    } catch (e) {
      console.warn('balance fetch error', e);
    } finally {
      setBalanceLoading(false);
    }
  }, [user]);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-cid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'user_history' }),
      });
      const data = await resp.json();
      if (data.ok) setHistory(data.generations || []);
    } catch (e) {
      console.warn('history fetch error', e);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchBalance();
      fetchHistory();
    }
  }, [authLoading, user, fetchBalance, fetchHistory]);

  // Stopwatch while generating
  useEffect(() => {
    if (!generating) return;
    const id = setInterval(() => {
      setElapsed((Date.now() - startTimeRef.current) / 1000);
    }, 50);
    return () => clearInterval(id);
  }, [generating]);

  const handleGenerate = async () => {
    if (!user) { setShowAuth(true); return; }
    const cleanIID = installationId.replace(/\s+/g, '').trim();
    if (cleanIID.replace(/[^0-9]/g, '').length < 50) {
      toast.error('Installation ID খুব ছোট — সম্পূর্ণ ID লিখুন (9 groups × 7 digits)');
      return;
    }
    if (balance < 1) {
      toast.error('পর্যাপ্ত CID credit নেই। শপ থেকে কিনুন।');
      return;
    }

    setGenerating(true);
    setCidResult(null);
    setElapsed(0);
    startTimeRef.current = Date.now();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setGenerating(false); setShowAuth(true); return; }

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-cid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'user_getcid', installation_id: cleanIID }),
      });
      const data = await resp.json();
      if (resp.ok && data.ok && data.cid) {
        setCidResult(data.cid);
        setBalance(data.balance);
        toast.success('Confirmation ID তৈরি হয়েছে! 🎉');
        fetchHistory();
      } else {
        toast.error(data.error || 'CID তৈরি করা যায়নি');
      }
    } catch (e) {
      toast.error(`Network error: ${String(e)}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleScreenshotUpload = async (file: File) => {
    if (!user) { setShowAuth(true); return; }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setParsing(true);
    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setParsing(false); setShowAuth(true); return; }

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-cid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'parse_screenshot', image_base64: base64 }),
      });
      const data = await resp.json();
      if (data.ok && data.installation_id) {
        setInstallationId(data.installation_id);
        toast.success('Installation ID detected from screenshot ✨');
      } else {
        toast.error(data.error || 'Could not read Installation ID');
      }
    } catch (e) {
      toast.error(`OCR error: ${String(e)}`);
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <>
      <SEOHead
        title="Microsoft Confirmation ID Generator — Phone Activation | Shahed Store"
        description="Generate Microsoft Confirmation IDs (CID) instantly for phone activation. Skip the call to Microsoft support. Self-service tool with screenshot upload."
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
                <h1 className="text-2xl md:text-3xl font-black text-foreground">Confirmation ID</h1>
                <p className="text-sm text-muted-foreground">Activate via phone — instantly</p>
              </div>
            </div>
          </div>

          {/* Balance + Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <div className="md:col-span-2 rounded-2xl p-4 flex items-center justify-between" style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,255,255,0.72))',
              backdropFilter: 'blur(28px) saturate(180%)',
              border: '1px solid hsla(258,78%,75%,0.28)',
              boxShadow: '0 8px 32px hsla(258,78%,55%,0.10)',
            }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsla(258,78%,55%,0.1)' }}>
                  <Wallet size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Available CID Credits</p>
                  <p className="text-2xl font-black text-foreground">
                    {balanceLoading ? <Loader2 size={20} className="animate-spin" /> : balance}
                  </p>
                </div>
              </div>
              {user && balance < 1 && !balanceLoading && (
                <Link to="/shop?category=cid-credits" className="px-4 py-2 rounded-lg text-sm font-bold text-white" style={{
                  background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(258,78%,42%))',
                }}>
                  Buy Credits
                </Link>
              )}
            </div>
            <button onClick={() => { setShowHistory(true); fetchHistory(); }}
              className="rounded-2xl p-4 flex items-center gap-3 transition-transform active:scale-[0.98]" style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(24px)',
              border: '1px solid hsla(258,78%,75%,0.22)',
            }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsla(258,78%,55%,0.1)' }}>
                <History size={18} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground">Recent</p>
                <p className="text-sm font-bold text-foreground">View History</p>
              </div>
            </button>
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
              <li className="flex gap-2"><span className="font-bold text-primary">1.</span> Enter your Microsoft Installation ID below (or upload a screenshot).</li>
              <li className="flex gap-2"><span className="font-bold text-primary">2.</span> Click "Get Confirmation ID" — we generate it instantly.</li>
              <li className="flex gap-2"><span className="font-bold text-primary">3.</span> Use the CID in the Microsoft phone activation wizard.</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-emerald-600" /> 1 credit = 1 Confirmation ID. No calls, no waiting.
            </p>
          </div>

          {/* Error Codes legend */}
          <div className="rounded-2xl p-5 mb-6" style={{
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(24px)',
            border: '1px solid hsla(258,78%,75%,0.18)',
          }}>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <ShieldCheck size={14} className="text-primary" /> Error Codes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <code className="font-mono font-bold text-foreground">0xC004C008</code>
                <span className="text-muted-foreground">: Get confirmation on:</span>
                <span className="text-primary font-semibold underline">Confirmation ID</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <code className="font-mono font-bold text-red-600">0xC004C060</code>
                <span className="text-muted-foreground">: Key blocked</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <code className="font-mono font-bold text-blue-600">0xC004C020</code>
                <span className="text-muted-foreground">: Get your IID and set CID using CMD</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <code className="font-mono font-bold text-red-600">0xC004C003</code>
                <span className="text-muted-foreground">: Key blocked</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-foreground">Unsupported</span>
                <span className="text-muted-foreground">: Contact us to add your key type to system</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <code className="font-mono font-bold text-red-600">0xC004C004</code>
                <span className="text-muted-foreground">: Fake or invalid key</span>
              </div>
            </div>
          </div>

          {/* Main form */}

          <div className="rounded-2xl p-5 md:p-6 mb-6" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.78))',
            backdropFilter: 'blur(32px) saturate(200%)',
            border: '1px solid hsla(258,78%,75%,0.28)',
            boxShadow: '0 8px 32px hsla(258,78%,55%,0.12)',
          }}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-foreground">Enter Your Installation ID *</label>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={parsing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-transform active:scale-95 disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, hsl(210,90%,55%), hsl(210,90%,45%))',
                  boxShadow: '0 2px 8px hsla(210,90%,50%,0.3)',
                }}
              >
                {parsing ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                {parsing ? 'Reading...' : 'or Upload Screenshot'}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleScreenshotUpload(f);
              }}
            />

            <textarea
              value={installationId}
              onChange={(e) => setInstallationId(e.target.value)}
              placeholder="1234567-1234567-1234567-1234567-1234567-1234567-1234567-1234567-1234567"
              className="w-full min-h-[120px] rounded-xl px-4 py-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              style={{
                background: 'rgba(255,255,255,0.85)',
                border: '1px solid hsla(258,78%,75%,0.25)',
              }}
            />

            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-muted-foreground">
                {installationId.replace(/[^0-9]/g, '').length} / 63 digits
                {elapsed > 0 && <span className="ml-3"><Clock size={10} className="inline" /> {elapsed.toFixed(2)}s</span>}
              </span>
              {installationId && (
                <button onClick={() => setInstallationId(formatIID(installationId))}
                  className="text-primary font-medium hover:underline">
                  Auto-format
                </button>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || parsing || authLoading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm transition-transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(258,78%,42%))',
                boxShadow: '0 6px 20px hsla(258,78%,55%,0.4)',
              }}
            >
              {generating ? (
                <><Loader2 size={16} className="animate-spin" /> Generating Confirmation ID...</>
              ) : (
                <><KeyRound size={16} /> Get Confirmation ID</>
              )}
            </button>
          </div>

          {/* Result */}
          {cidResult && (
            <div className="rounded-2xl p-5 md:p-6 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(255,255,255,0.92))',
              backdropFilter: 'blur(28px) saturate(180%)',
              border: '1px solid hsla(160,84%,40%,0.35)',
              boxShadow: '0 8px 32px hsla(160,84%,40%,0.15)',
            }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'hsl(160,84%,40%)' }}>
                  <CheckCircle2 size={18} className="text-white" />
                </div>
                <h3 className="text-base font-bold text-foreground">Your Confirmation ID</h3>
              </div>
              <div className="rounded-xl p-4 font-mono text-base md:text-lg font-bold text-foreground break-all tracking-wide" style={{
                background: 'rgba(255,255,255,0.95)',
                border: '1px solid hsla(160,84%,40%,0.25)',
              }}>
                {formatCID(cidResult)}
              </div>
              <button
                onClick={() => handleCopy(formatCID(cidResult))}
                className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-transform active:scale-[0.98]"
                style={{
                  background: copied ? 'hsl(160,84%,40%)' : 'rgba(255,255,255,0.85)',
                  border: '1px solid hsla(160,84%,40%,0.35)',
                  color: copied ? '#fff' : 'hsl(160,84%,30%)',
                }}
              >
                {copied ? <><CheckCircle2 size={14} /> Copied!</> : <><Copy size={14} /> Copy Confirmation ID</>}
              </button>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                💡 Type this CID into the Microsoft activation wizard.
              </p>
            </div>
          )}

          {/* Insufficient balance hint */}
          {user && !balanceLoading && balance < 1 && (
            <div className="rounded-2xl p-4 flex items-start gap-3" style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid hsla(38,92%,50%,0.3)',
            }}>
              <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-foreground">No CID credits remaining</p>
                <p className="text-xs text-muted-foreground mt-1">
                  CID credits are auto-added when you purchase Microsoft activation products from our shop.
                </p>
                <Link to="/shop" className="inline-block mt-2 text-xs font-bold text-primary hover:underline">
                  Browse Shop →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History modal */}
      {showHistory && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowHistory(false)}>
          <div className="w-full max-w-lg max-h-[80vh] rounded-2xl p-5 overflow-y-auto" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))',
            backdropFilter: 'blur(32px)',
            border: '1px solid hsla(258,78%,75%,0.3)',
          }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <History size={18} className="text-primary" /> Recent Generations
              </h3>
              <button onClick={() => setShowHistory(false)} className="p-1 rounded-lg hover:bg-muted">
                <X size={18} />
              </button>
            </div>
            {history.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">No history yet</div>
            ) : (
              <div className="space-y-2">
                {history.map(g => (
                  <div key={g.id} className="rounded-xl p-3" style={{
                    background: 'rgba(255,255,255,0.7)',
                    border: '1px solid hsla(258,78%,75%,0.18)',
                  }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">
                        {new Date(g.created_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                      <span className="text-xs font-bold text-primary">−{g.cost} credit</span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground truncate">IID: {g.number}</p>
                    {g.result?.cid && (
                      <div className="flex items-center justify-between mt-1.5 gap-2">
                        <p className="text-xs font-mono font-bold text-foreground truncate">CID: {formatCID(g.result.cid)}</p>
                        <button onClick={() => handleCopy(formatCID(g.result!.cid!))} className="text-primary p-1 rounded hover:bg-primary/10 flex-shrink-0">
                          <Copy size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showAuth && <AuthModal isOpen={showAuth} onClose={() => { setShowAuth(false); fetchBalance(); }} />}
      <Footer />
    </>
  );
};

export default GetCID;
