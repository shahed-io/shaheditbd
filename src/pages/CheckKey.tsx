import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  KeyRound, Loader2, CheckCircle2, XCircle, AlertCircle,
  Sparkles, ShieldCheck, ChevronLeft, Copy, Search, History, Trash2,
  Mail, ShieldAlert,
} from 'lucide-react';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import SEOHead from '@/components/seo/SEOHead';
import AuthModal from '@/components/store/AuthModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

interface OfficeResult {
  username: string;
  status_acc: string;
  meaning: string;
  category: 'success' | 'mfa' | 'invalid' | 'unknown';
}

const CheckKey = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'key' | 'office365'>('key');

  // ─── Product Key state ───
  const [keysInput, setKeysInput] = useState('');
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // ─── Office 365 state ───
  const [accountsInput, setAccountsInput] = useState('');
  const [checkingOffice, setCheckingOffice] = useState(false);
  const [officeResults, setOfficeResults] = useState<OfficeResult[]>([]);
  const [officeHistory, setOfficeHistory] = useState<any[]>([]);
  const [officeHistoryLoading, setOfficeHistoryLoading] = useState(false);
  const [showOfficeHistory, setShowOfficeHistory] = useState(false);

  const [showAuth, setShowAuth] = useState(false);

  // ─── Load histories ───
  const loadHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('key_check_history')
        .select('id, key_value, status, error_code, product, sub_type, remaining, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      const cleaned = (data ?? []).map((r: any) => ({
        ...r,
        error_code: r.error_code ? String(r.error_code).replace(/\s*\[.*?\]\s*/g, '').trim() : r.error_code,
      }));
      setHistory(cleaned);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  const loadOfficeHistory = useCallback(async () => {
    if (!user) return;
    setOfficeHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('office365_check_history')
        .select('id, username, status_acc, checked_at')
        .eq('user_id', user.id)
        .order('checked_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setOfficeHistory(data ?? []);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load history');
    } finally {
      setOfficeHistoryLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadHistory();
      loadOfficeHistory();
    }
  }, [user, loadHistory, loadOfficeHistory]);

  const clearHistory = async () => {
    if (!user) return;
    if (!confirm('Clear all key check history?')) return;
    try {
      const { error } = await supabase.from('key_check_history').delete().eq('user_id', user.id);
      if (error) throw error;
      setHistory([]);
      toast.success('History cleared');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to clear history');
    }
  };

  const clearOfficeHistory = async () => {
    if (!user) return;
    if (!confirm('Clear all Office 365 check history?')) return;
    try {
      const { error } = await supabase.from('office365_check_history').delete().eq('user_id', user.id);
      if (error) throw error;
      setOfficeHistory([]);
      toast.success('History cleared');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to clear history');
    }
  };

  // ─── Check Product Key ───
  const handleCheck = async () => {
    if (!keysInput.trim()) {
      toast.error('Please enter at least one product key');
      return;
    }
    if (!user) { setShowAuth(true); return; }
    setChecking(true);
    setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke('check-key', { body: { keys: keysInput } });
      if (error) { toast.error(error.message || 'Check failed. Please try again.'); return; }
      if (data?.error) { toast.error(data.error); return; }
      const out: CheckResult[] = data?.results ?? [];
      setResults(out);
      const live = out.filter(r => r.status === 'live').length;
      const dead = out.filter(r => r.status === 'dead').length;
      toast.success(`Checked ${out.length} key${out.length !== 1 ? 's' : ''} — ${live} live, ${dead} dead`);
      loadHistory();
    } catch (e: any) {
      toast.error(e?.message || 'Check failed. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  // ─── Check Office 365 ───
  const parseAccounts = (raw: string) => {
    const lines = raw.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
    const list: { username: string; password: string }[] = [];
    for (const line of lines) {
      // Support: user:pass | user|pass | user,pass | user<TAB>pass | user pass
      const m = line.match(/^(\S+?)[\s:|,\t]+(.+)$/);
      if (m) {
        const username = m[1].trim();
        const password = m[2].trim();
        if (username && password) list.push({ username, password });
      }
    }
    return list;
  };

  const handleCheckOffice = async () => {
    const parsed = parseAccounts(accountsInput);
    if (parsed.length === 0) {
      toast.error('Please enter accounts in format: email:password (one per line)');
      return;
    }
    if (parsed.length > 100) {
      toast.error('Maximum 100 accounts per check');
      return;
    }
    if (!user) { setShowAuth(true); return; }
    setCheckingOffice(true);
    setOfficeResults([]);
    try {
      const { data, error } = await supabase.functions.invoke('check-office365', { body: { accounts: parsed } });
      if (error) { toast.error(error.message || 'Check failed. Please try again.'); return; }
      if (data?.error) { toast.error(data.error); return; }
      const out: OfficeResult[] = data?.results ?? [];
      setOfficeResults(out);
      const valid = out.filter(r => r.category === 'success').length;
      const mfa = out.filter(r => r.category === 'mfa').length;
      const invalid = out.filter(r => r.category === 'invalid').length;
      toast.success(`Checked ${out.length} — ${valid} valid, ${mfa} MFA, ${invalid} invalid`);
      loadOfficeHistory();
    } catch (e: any) {
      toast.error(e?.message || 'Check failed. Please try again.');
    } finally {
      setCheckingOffice(false);
    }
  };

  const copyResult = async (key: string, status: string) => {
    await navigator.clipboard.writeText(`${key} — ${status.toUpperCase()}`);
    toast.success('Copied');
  };

  const copyValidAccounts = async () => {
    const valid = officeResults.filter((r) => r.category === 'success' || r.category === 'mfa');
    if (valid.length === 0) { toast.error('No valid accounts to copy'); return; }
    const text = valid.map((r) => `${r.username} — ${r.status_acc.toUpperCase()}`).join('\n');
    await navigator.clipboard.writeText(text);
    toast.success(`Copied ${valid.length} valid account${valid.length !== 1 ? 's' : ''}`);
  };

  const statusBadge = (status: string) => {
    if (status === 'live') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'hsl(142,71%,40%)' }}><CheckCircle2 size={12} /> LIVE</span>;
    }
    if (status === 'dead') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'hsl(0,72%,51%)' }}><XCircle size={12} /> DEAD</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'hsl(38,92%,50%)' }}><AlertCircle size={12} /> UNKNOWN</span>;
  };

  const officeBadge = (cat: OfficeResult['category']) => {
    if (cat === 'success') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'hsl(142,71%,40%)' }}><CheckCircle2 size={12} /> VALID</span>;
    if (cat === 'mfa') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'hsl(38,92%,50%)' }}><ShieldAlert size={12} /> MFA</span>;
    if (cat === 'invalid') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'hsl(0,72%,51%)' }}><XCircle size={12} /> INVALID</span>;
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'hsl(220,9%,46%)' }}><AlertCircle size={12} /> UNKNOWN</span>;
  };

  const officeStatusBadgeFromText = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'success' || s === 'valid') return officeBadge('success');
    if (s.includes('more_information') || s.includes('mfa') || s.includes('interaction_required')) return officeBadge('mfa');
    if (s.includes('invalid') || s.includes('unauthorized') || s.includes('locked') || s.includes('not_found')) return officeBadge('invalid');
    return officeBadge('unknown');
  };

  // mask username for display: keep first 2 chars + domain
  const maskUsername = (u: string) => {
    if (!u.includes('@')) return u;
    const [name, domain] = u.split('@');
    if (name.length <= 2) return `${name}***@${domain}`;
    return `${name.slice(0, 2)}${'*'.repeat(Math.max(3, name.length - 2))}@${domain}`;
  };

  return (
    <>
      <SEOHead
        title="Product Key & Office 365 Account Checker | Shahed Store"
        description="Verify Microsoft product keys and check Office 365 account login status instantly. Free for logged-in users."
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
                <h1 className="text-2xl md:text-3xl font-black text-foreground">Account & Key Checker</h1>
                <p className="text-sm text-muted-foreground">Verify product keys or Office 365 accounts — instantly</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'key' | 'office365')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-auto p-1.5 rounded-2xl" style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(24px)',
              border: '1px solid hsla(258,78%,75%,0.22)',
            }}>
              <TabsTrigger value="key" className="rounded-xl py-2.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-lg gap-2">
                <KeyRound size={16} /> Product Key
              </TabsTrigger>
              <TabsTrigger value="office365" className="rounded-xl py-2.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-lg gap-2">
                <Mail size={16} /> Office 365 Account
              </TabsTrigger>
            </TabsList>

            {/* ─────── PRODUCT KEY TAB ─────── */}
            <TabsContent value="key" className="space-y-6 mt-0">
              {/* How it works */}
              <div className="rounded-2xl p-5" style={{
                background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(24px)',
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
              <div className="rounded-2xl p-5" style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,255,255,0.72))',
                backdropFilter: 'blur(28px) saturate(180%)',
                border: '1px solid hsla(258,78%,75%,0.28)',
                boxShadow: '0 8px 32px hsla(258,78%,55%,0.10)',
              }}>
                <label className="block text-sm font-semibold text-foreground mb-2">Product Key(s)</label>
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
                  {checking ? <><Loader2 size={18} className="animate-spin" /> Checking…</> : <><Search size={18} /> Check Key</>}
                </button>
              </div>

              {/* Error Codes Legend */}
              <div className="rounded-2xl p-5" style={{
                background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(24px)',
                border: '1px solid hsla(258,78%,75%,0.18)',
              }}>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <AlertCircle size={14} className="text-primary" /> Error Codes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div><span className="font-mono font-bold text-emerald-600">0xC004C008</span><span className="text-muted-foreground">: Get confirmation on:{' '}<a href="/get-cid" className="text-primary font-semibold underline underline-offset-2 hover:text-primary/80">Confirmation ID</a></span></div>
                  <div><span className="font-mono font-bold text-red-600">0xC004C060</span><span className="text-muted-foreground">: Key blocked</span></div>
                  <div><span className="font-mono font-bold text-sky-600">0xC004C020</span><span className="text-muted-foreground">: Get your IID and set CID using CMD</span></div>
                  <div><span className="font-mono font-bold text-red-600">0xC004C003</span><span className="text-muted-foreground">: Key blocked</span></div>
                  <div><span className="font-bold text-foreground">Unsupported</span><span className="text-muted-foreground">: Contact us to add your key type to system</span></div>
                  <div><span className="font-mono font-bold text-red-600">0xC004C004</span><span className="text-muted-foreground">: Fake or invalid key</span></div>
                </div>
              </div>

              {/* Results */}
              {results.length > 0 && (
                <div className="rounded-2xl p-5" style={{
                  background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(28px)',
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

              {/* Key History */}
              {user && (
                <div className="rounded-2xl p-5" style={{
                  background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(24px)',
                  border: '1px solid hsla(258,78%,75%,0.18)',
                }}>
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setShowHistory(s => !s)} className="text-sm font-bold text-foreground flex items-center gap-2">
                      <History size={14} className="text-primary" />
                      Check History {history.length > 0 && <span className="text-xs text-muted-foreground font-normal">({history.length})</span>}
                    </button>
                    <div className="flex items-center gap-2">
                      {showHistory && history.length > 0 && (
                        <button onClick={clearHistory} className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-red-50" title="Clear history">
                          <Trash2 size={12} /> Clear
                        </button>
                      )}
                      <button onClick={() => setShowHistory(s => !s)} className="text-xs text-primary font-semibold">
                        {showHistory ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  {showHistory && (
                    <>
                      {historyLoading ? (
                        <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
                          <Loader2 size={16} className="animate-spin mr-2" /> Loading…
                        </div>
                      ) : history.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No checks yet. Your past key checks will appear here.</p>
                      ) : (
                        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                          {history.map((h) => (
                            <div key={h.id} className="rounded-xl p-3 border border-border/60 bg-white/60">
                              <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="min-w-0 flex-1">
                                  <p className="font-mono text-xs md:text-sm font-bold text-foreground break-all">{h.key_value}</p>
                                  <div className="flex flex-wrap gap-2 mt-1.5 text-[11px]">
                                    {h.product && <span className="px-2 py-0.5 rounded-md bg-muted/60 text-foreground">{h.product}</span>}
                                    {h.sub_type && <span className="px-2 py-0.5 rounded-md bg-muted/60 text-foreground">{h.sub_type}</span>}
                                    {h.remaining && <span className="px-2 py-0.5 rounded-md bg-muted/60 text-foreground">Remaining: {h.remaining}</span>}
                                    {h.error_code && <span className="px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground font-mono">{h.error_code}</span>}
                                  </div>
                                  <p className="text-[10px] text-muted-foreground mt-1.5">
                                    {new Date(h.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {statusBadge(h.status)}
                                  <button onClick={() => copyResult(h.key_value, h.status)} className="p-1.5 rounded-md hover:bg-muted/60" title="Copy">
                                    <Copy size={14} className="text-muted-foreground" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </TabsContent>

            {/* ─────── OFFICE 365 TAB ─────── */}
            <TabsContent value="office365" className="space-y-6 mt-0">
              {/* How it works */}
              <div className="rounded-2xl p-5" style={{
                background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(24px)',
                border: '1px solid hsla(258,78%,75%,0.18)',
              }}>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-primary" /> How It Works
                </h3>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2"><span className="font-bold text-primary">1.</span> Paste accounts in the format <code className="text-foreground bg-muted/50 px-1 rounded">email:password</code> — one per line.</li>
                  <li className="flex gap-2"><span className="font-bold text-primary">2.</span> You can also use <code className="text-foreground bg-muted/50 px-1 rounded">|</code>, comma, or tab as separator. Max 100 per check.</li>
                  <li className="flex gap-2"><span className="font-bold text-primary">3.</span> Click "Check Accounts" — we'll verify each one and report status.</li>
                </ol>
                <div className="mt-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-800 flex items-start gap-2">
                  <ShieldCheck size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Privacy:</strong> Passwords are sent only to the checking service and are <strong>never stored</strong> in our database. Only the username and result status are saved to your private history.</span>
                </div>
              </div>

              {/* Input */}
              <div className="rounded-2xl p-5" style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,255,255,0.72))',
                backdropFilter: 'blur(28px) saturate(180%)',
                border: '1px solid hsla(258,78%,75%,0.28)',
                boxShadow: '0 8px 32px hsla(258,78%,55%,0.10)',
              }}>
                <label className="block text-sm font-semibold text-foreground mb-2">Office 365 Accounts</label>
                <textarea
                  value={accountsInput}
                  onChange={(e) => setAccountsInput(e.target.value)}
                  rows={6}
                  placeholder={'user1@domain.com:Password123\nuser2@domain.com:Password456'}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-white/70 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  spellCheck={false}
                />
                <button
                  onClick={handleCheckOffice}
                  disabled={checkingOffice || authLoading}
                  className="w-full mt-4 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(258,78%,42%))',
                    boxShadow: '0 6px 20px hsla(258,78%,55%,0.35)',
                  }}
                >
                  {checkingOffice ? <><Loader2 size={18} className="animate-spin" /> Checking accounts…</> : <><Search size={18} /> Check Accounts</>}
                </button>
              </div>

              {/* Status Legend */}
              <div className="rounded-2xl p-5" style={{
                background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(24px)',
                border: '1px solid hsla(258,78%,75%,0.18)',
              }}>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <AlertCircle size={14} className="text-primary" /> Status Meanings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div><span className="font-bold text-emerald-600">success</span><span className="text-muted-foreground">: Login successful — credentials valid</span></div>
                  <div><span className="font-bold text-amber-600">more_information_required</span><span className="text-muted-foreground">: Valid, but MFA enabled</span></div>
                  <div><span className="font-bold text-red-600">invalid_grant</span><span className="text-muted-foreground">: Wrong password</span></div>
                  <div><span className="font-bold text-red-600">unauthorized</span><span className="text-muted-foreground">: Account locked or disabled</span></div>
                </div>
              </div>

              {/* Office Results */}
              {officeResults.length > 0 && (
                <div className="rounded-2xl p-5" style={{
                  background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(28px)',
                  border: '1px solid hsla(258,78%,75%,0.22)',
                }}>
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="text-sm font-bold text-foreground">Results ({officeResults.length})</h3>
                    <div className="flex gap-2 text-xs items-center">
                      <span className="text-emerald-600">{officeResults.filter(r => r.category === 'success').length} valid</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-amber-600">{officeResults.filter(r => r.category === 'mfa').length} MFA</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-red-600">{officeResults.filter(r => r.category === 'invalid').length} invalid</span>
                      <button onClick={copyValidAccounts} className="ml-2 px-2.5 py-1 rounded-md bg-primary/10 text-primary font-semibold hover:bg-primary/20 flex items-center gap-1">
                        <Copy size={12} /> Copy valid
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {officeResults.map((r, idx) => (
                      <div key={idx} className="rounded-xl p-3 border border-border/60 bg-white/60">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-sm font-bold text-foreground break-all">{r.username}</p>
                            <p className="text-xs text-muted-foreground mt-1">{r.meaning}</p>
                            <p className="text-[11px] text-muted-foreground/80 mt-1 font-mono">{r.status_acc}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {officeBadge(r.category)}
                            <button onClick={() => copyResult(r.username, r.status_acc)} className="p-1.5 rounded-md hover:bg-muted/60" title="Copy">
                              <Copy size={14} className="text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Office History */}
              {user && (
                <div className="rounded-2xl p-5" style={{
                  background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(24px)',
                  border: '1px solid hsla(258,78%,75%,0.18)',
                }}>
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setShowOfficeHistory(s => !s)} className="text-sm font-bold text-foreground flex items-center gap-2">
                      <History size={14} className="text-primary" />
                      Check History {officeHistory.length > 0 && <span className="text-xs text-muted-foreground font-normal">({officeHistory.length})</span>}
                    </button>
                    <div className="flex items-center gap-2">
                      {showOfficeHistory && officeHistory.length > 0 && (
                        <button onClick={clearOfficeHistory} className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-red-50" title="Clear history">
                          <Trash2 size={12} /> Clear
                        </button>
                      )}
                      <button onClick={() => setShowOfficeHistory(s => !s)} className="text-xs text-primary font-semibold">
                        {showOfficeHistory ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  {showOfficeHistory && (
                    <>
                      {officeHistoryLoading ? (
                        <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
                          <Loader2 size={16} className="animate-spin mr-2" /> Loading…
                        </div>
                      ) : officeHistory.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No checks yet. Your past account checks will appear here.</p>
                      ) : (
                        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                          {officeHistory.map((h) => (
                            <div key={h.id} className="rounded-xl p-3 border border-border/60 bg-white/60">
                              <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="min-w-0 flex-1">
                                  <p className="font-mono text-xs md:text-sm font-bold text-foreground break-all">{maskUsername(h.username)}</p>
                                  <p className="text-[11px] text-muted-foreground mt-1 font-mono">{h.status_acc}</p>
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    {new Date(h.checked_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {officeStatusBadgeFromText(h.status_acc)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
      {showAuth && <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />}
    </>
  );
};

export default CheckKey;
