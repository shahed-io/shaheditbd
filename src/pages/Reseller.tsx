import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Eye, EyeOff, LogOut, Zap, Wallet, Copy, Check, RefreshCw,
  AlertCircle, Loader2, Users, Plus, Trash2, TrendingUp,
  History, KeyRound, DollarSign, ShieldCheck, User, BarChart2,
  Pencil, X, Upload, ImageIcon, Save, ChevronDown
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ResellerUser { id: string; username: string; is_admin: boolean; balance_cents: number; }
interface Generation {
  id: string;
  installation_id: string | null;
  cid: string;
  price_cents: number;
  created_at: string;
  user_id?: string;
  reseller_users?: { username: string };
}
interface AdminUser { id: string; username: string; is_admin: boolean; balance_cents: number; created_at: string; }

// ─── Storage helpers ──────────────────────────────────────────────────────────
const getSession = () => ({ token: localStorage.getItem('rs_token'), user: JSON.parse(localStorage.getItem('rs_user') || 'null') as ResellerUser | null });
const saveSession = (token: string, user: ResellerUser) => { localStorage.setItem('rs_token', token); localStorage.setItem('rs_user', JSON.stringify(user)); };
const clearSession = () => { localStorage.removeItem('rs_token'); localStorage.removeItem('rs_user'); };

// ─── API helpers ──────────────────────────────────────────────────────────────
const callAuth = async (body: object) => {
  const { data, error } = await supabase.functions.invoke('reseller-auth', { body });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
};
const callAdmin = async (body: object) => {
  const { token } = getSession();
  const { data, error } = await supabase.functions.invoke('reseller-admin', { body: { ...body, token } });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
};
const callCID = async (body: object) => {
  const { token } = getSession();
  const { data, error } = await supabase.functions.invoke('get-cid', { body: { ...body, token } });
  if (error) throw new Error(error.message);
  return data;
};

// ─── Shared styles ────────────────────────────────────────────────────────────
const card = "bg-white rounded-2xl border border-primary/10 shadow-[0_2px_16px_rgba(99,77,255,0.06)]";
const inp  = "w-full border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white transition-all";
const btn  = "bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm";
const pillBase = "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border";

// ─── Login ────────────────────────────────────────────────────────────────────
const LoginPanel = ({ onLogin }: { onLogin: (user: ResellerUser, token: string) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await callAuth({ action: 'login', username, password });
      saveSession(res.token, res.user);
      onLogin(res.user, res.token);
    } catch (err: unknown) {
      setError((err as Error).message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(250,60%,98%)' }}>
      <div className={`${card} p-8 w-full max-w-sm`}>
        <div className="flex flex-col items-center mb-7">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-md shadow-primary/25">
            <ShieldCheck size={22} className="text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">CID Reseller Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Username</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="Enter username" required className={inp + " pl-9"} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
            <div className="relative">
              <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required className={inp + " pl-9 pr-10"} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-destructive/8 border border-destructive/25 rounded-xl px-3 py-2.5 text-destructive text-sm">
              <AlertCircle size={14} />{error}
            </div>
          )}

          <button type="submit" disabled={loading} className={`w-full ${btn} disabled:opacity-60`}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Screenshot Upload Modal ──────────────────────────────────────────────────
const ScreenshotModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: (url: string) => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) { toast.error('শুধু ছবি আপলোড করুন'); return; }
    setFile(f);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `reseller-screenshots/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('payment-proofs').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('payment-proofs').getPublicUrl(path);
      toast.success('Screenshot আপলোড সফল!');
      onSuccess(publicUrl);
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'আপলোড ব্যর্থ হয়েছে');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${card} p-6 w-full max-w-md`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-foreground flex items-center gap-2"><Upload size={16} className="text-primary" /> Screenshot আপলোড</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={18} /></button>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            preview ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-primary/5'
          }`}
        >
          {preview ? (
            <div>
              <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-lg object-contain mb-2" />
              <p className="text-xs text-muted-foreground truncate">{file?.name}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <ImageIcon size={18} className="text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">ছবি টেনে এনে ছাড়ুন অথবা ক্লিক করুন</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP সাপোর্টেড</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary transition-colors">
            বাতিল
          </button>
          <button onClick={handleUpload} disabled={!file || uploading} className={`flex-1 ${btn} disabled:opacity-40`}>
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            আপলোড করুন
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── CID Generator ────────────────────────────────────────────────────────────
const CIDGenerator = ({ user, onBalanceUpdate }: { user: ResellerUser; onBalanceUpdate: (c: number) => void }) => {
  const [iid, setIid] = useState('');
  const [cid, setCid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<Generation[]>([]);
  const [histLoading, setHistLoading] = useState(true);
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    try { const res = await callCID({ action: 'my_history' }); setHistory(res?.generations ?? []); }
    catch { /* ignore */ } finally { setHistLoading(false); }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setCid(''); setLoading(true);
    try {
      const res = await callCID({ action: 'getcid', installation_id: iid });
      if (res?.cid) {
        setCid(res.cid);
        onBalanceUpdate(res.balance_after_cents);
        loadHistory();
        toast.success('CID সফলভাবে তৈরি হয়েছে!');
      } else {
        setError(res?.error || 'CID তৈরি ব্যর্থ হয়েছে');
      }
    } catch (err: unknown) { setError((err as Error).message); }
    finally { setLoading(false); }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('কপি হয়েছে!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {showScreenshot && (
        <ScreenshotModal
          onClose={() => setShowScreenshot(false)}
          onSuccess={url => setScreenshotUrl(url)}
        />
      )}

      {user.balance_cents === 0 && (
        <div className="flex items-center gap-2 bg-destructive/8 border border-destructive/25 rounded-xl px-4 py-3 text-destructive text-sm">
          <AlertCircle size={14} className="shrink-0" />
          আপনার ব্যালেন্স শেষ। Admin-এর সাথে যোগাযোগ করুন।
        </div>
      )}

      {/* Balance */}
      <div className={card + " p-5 flex items-center justify-between"}>
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-1">Available Balance</p>
          <p className="text-3xl font-black text-foreground">${(user.balance_cents / 100).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">প্রতি CID এর দাম $1.00</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Wallet size={22} className="text-primary" />
        </div>
      </div>

      {/* Generator */}
      <div className={card + " p-6"}>
        <h2 className="font-bold text-foreground flex items-center gap-2 mb-4">
          <Zap size={16} className="text-primary" /> CID Generate করুন
        </h2>
        <form onSubmit={handleGenerate} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Installation ID</label>
            <input type="text" value={iid} onChange={e => setIid(e.target.value)}
              placeholder="Installation ID লিখুন..." required className={inp + " font-mono"} />
          </div>

          {/* Optional screenshot */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Screenshot (ঐচ্ছিক)
            </label>
            {screenshotUrl ? (
              <div className="flex items-center gap-2 border border-green-200 bg-green-50 rounded-xl px-3 py-2">
                <Check size={14} className="text-green-600 shrink-0" />
                <span className="text-xs text-green-700 truncate flex-1">Screenshot আপলোড সফল</span>
                <button type="button" onClick={() => { setScreenshotUrl(null); }} className="text-muted-foreground hover:text-destructive">
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setShowScreenshot(true)}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all">
                <Upload size={14} /> Screenshot আপলোড করুন
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-destructive/8 border border-destructive/25 rounded-xl px-3 py-2.5 text-destructive text-sm">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />{error}
            </div>
          )}
          <button type="submit" disabled={loading || !iid.trim() || user.balance_cents < 100}
            className={`w-full ${btn} disabled:opacity-40 disabled:cursor-not-allowed`}>
            {loading ? <><Loader2 size={14} className="animate-spin" /> প্রসেস হচ্ছে...</> : <><Zap size={14} /> CID তৈরি করুন — $1.00</>}
          </button>
        </form>

        {cid && (
          <div className="mt-4 bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-xs text-primary/70 font-semibold uppercase tracking-wider mb-2">Confirmation ID (CID)</p>
            <div className="flex items-center justify-between gap-3">
              <p className="text-2xl font-black text-primary font-mono tracking-widest">{cid}</p>
              <button onClick={() => copy(cid)} className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className={card + " overflow-hidden"}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <History size={14} className="text-primary" /> আমার Generations
          </h3>
          <button onClick={loadHistory} className="text-muted-foreground hover:text-primary transition-colors"><RefreshCw size={14} /></button>
        </div>
        {histLoading ? (
          <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">এখনো কোনো generation নেই।</p>
        ) : (
          <div className="divide-y divide-border/40">
            {history.map(h => (
              <div key={h.id} className="px-5 py-3.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs hover:bg-primary/[0.02] transition-colors">
                <div>
                  <p className="text-muted-foreground mb-0.5">Installation ID</p>
                  <p className="font-mono text-foreground truncate">{h.installation_id || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">CID</p>
                  <div className="flex items-center gap-1.5">
                    <p className="font-mono font-bold text-primary truncate">{h.cid}</p>
                    <button onClick={() => copy(h.cid)} className="text-muted-foreground hover:text-primary shrink-0 transition-colors"><Copy size={10} /></button>
                  </div>
                </div>
                <p className="col-span-2 text-muted-foreground/70">{new Date(h.created_at).toLocaleString('bn-BD')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Admin Panel ──────────────────────────────────────────────────────────────
const AdminPanel = () => {
  const [tab, setTab] = useState<'dashboard' | 'generate' | 'users' | 'history'>('dashboard');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [stats, setStats] = useState<{ total_users: number; total_cids: number; total_balance_cents: number } | null>(null);
  const [apiBalance, setApiBalance] = useState<number | null>(null);
  const [apiBalanceLoading, setApiBalanceLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingHist, setLoadingHist] = useState(false);

  // Admin CID generation
  const [adminIid, setAdminIid] = useState('');
  const [adminTargetUserId, setAdminTargetUserId] = useState('');
  const [adminCid, setAdminCid] = useState('');
  const [adminGenLoading, setAdminGenLoading] = useState(false);
  const [adminGenError, setAdminGenError] = useState('');
  const [adminCopied, setAdminCopied] = useState(false);
  const [showAdminScreenshot, setShowAdminScreenshot] = useState(false);
  const [adminScreenshotUrl, setAdminScreenshotUrl] = useState<string | null>(null);

  // Create user
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [creating, setCreating] = useState(false);

  // Topup
  const [topupId, setTopupId] = useState('');
  const [topupAmt, setTopupAmt] = useState('');
  const [topping, setTopping] = useState(false);

  // Balance set (absolute)
  const [setBalId, setSetBalId] = useState('');
  const [setBalAmt, setSetBalAmt] = useState('');
  const [settingBal, setSettingBal] = useState(false);

  // CID Edit
  const [editGenId, setEditGenId] = useState('');
  const [editCid, setEditCid] = useState('');
  const [editIid, setEditIid] = useState('');
  const [saving, setSaving] = useState(false);

  const loadApiBalance = useCallback(async () => {
    setApiBalanceLoading(true);
    try {
      const res = await callCID({ action: 'balance' });
      const b = res?.balance ?? res?.credits ?? res?.data?.balance ?? res?.data?.credits;
      if (b !== undefined && b !== null) setApiBalance(parseFloat(String(b)));
      else setApiBalance(null);
    } catch { setApiBalance(null); }
    finally { setApiBalanceLoading(false); }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const statsRes = await callAdmin({ action: 'stats' });
      setStats(statsRes);
    } catch { /* ignore */ }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try { const res = await callAdmin({ action: 'list_users' }); setUsers(res?.users ?? []); }
    catch (err: unknown) { toast.error((err as Error).message); } finally { setLoadingUsers(false); }
  }, []);

  const loadHistory = useCallback(async () => {
    setLoadingHist(true);
    try { const res = await callAdmin({ action: 'list_generations' }); setGenerations(res?.generations ?? []); }
    catch (err: unknown) { toast.error((err as Error).message); } finally { setLoadingHist(false); }
  }, []);

  useEffect(() => { loadStats(); loadUsers(); loadApiBalance(); }, [loadStats, loadUsers, loadApiBalance]);
  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab, loadHistory]);
  useEffect(() => { if (tab === 'generate') loadUsers(); }, [tab, loadUsers]);

  // Admin generate CID
  const handleAdminGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminGenError(''); setAdminCid(''); setAdminGenLoading(true);
    try {
      // Admin uses their own token to call get-cid on behalf of a user
      const res = await callCID({ action: 'getcid', installation_id: adminIid, target_user_id: adminTargetUserId || undefined });
      if (res?.cid) {
        setAdminCid(res.cid);
        toast.success('CID সফলভাবে তৈরি হয়েছে!');
        loadStats(); loadUsers();
        if (tab === 'history') loadHistory();
      } else {
        setAdminGenError(res?.error || 'CID তৈরি ব্যর্থ হয়েছে');
      }
    } catch (err: unknown) { setAdminGenError((err as Error).message); }
    finally { setAdminGenLoading(false); }
  };

  const copyAdminCid = (text: string) => {
    navigator.clipboard.writeText(text);
    setAdminCopied(true);
    toast.success('CID কপি হয়েছে!');
    setTimeout(() => setAdminCopied(false), 2000);
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true);
    try {
      await callAdmin({ action: 'create_user', username: newUsername, password: newPassword, balance_cents: Math.round(parseFloat(newBalance || '0') * 100) });
      toast.success(`User "${newUsername}" তৈরি হয়েছে!`);
      setNewUsername(''); setNewPassword(''); setNewBalance(''); loadUsers();
    } catch (err: unknown) { toast.error((err as Error).message); } finally { setCreating(false); }
  };

  const handleTopup = async () => {
    if (!topupId || !topupAmt) return;
    const u = users.find(x => x.id === topupId);
    setTopping(true);
    try {
      await callAdmin({ action: 'topup', user_id: topupId, amount_cents: Math.round(parseFloat(topupAmt) * 100) });
      toast.success(`$${topupAmt} যোগ হয়েছে ${u?.username} এর জন্য`);
      setTopupId(''); setTopupAmt(''); loadUsers(); loadStats();
    } catch (err: unknown) { toast.error((err as Error).message); } finally { setTopping(false); }
  };

  const handleSetBalance = async () => {
    if (!setBalId || setBalAmt === '') return;
    const u = users.find(x => x.id === setBalId);
    setSettingBal(true);
    try {
      await callAdmin({ action: 'set_balance', user_id: setBalId, balance_cents: Math.round(parseFloat(setBalAmt) * 100) });
      toast.success(`${u?.username} এর balance $${setBalAmt} সেট হয়েছে`);
      setSetBalId(''); setSetBalAmt(''); loadUsers(); loadStats();
    } catch (err: unknown) { toast.error((err as Error).message); } finally { setSettingBal(false); }
  };

  const deleteUser = async (userId: string, username: string) => {
    if (!confirm(`"${username}" ইউজার মুছে দেবেন?`)) return;
    try { await callAdmin({ action: 'delete_user', user_id: userId }); toast.success('ইউজার মুছে গেছে'); loadUsers(); loadStats(); }
    catch (err: unknown) { toast.error((err as Error).message); }
  };

  const openEdit = (g: Generation) => {
    setEditGenId(g.id); setEditCid(g.cid); setEditIid(g.installation_id || '');
  };

  const saveEdit = async () => {
    if (!editGenId) return;
    setSaving(true);
    try {
      await callAdmin({ action: 'edit_generation', generation_id: editGenId, cid: editCid, installation_id: editIid });
      toast.success('Generation আপডেট হয়েছে');
      setEditGenId(''); loadHistory();
    } catch (err: unknown) { toast.error((err as Error).message); } finally { setSaving(false); }
  };

  const deleteGeneration = async (genId: string) => {
    if (!confirm('এই generation রেকর্ড মুছে দেবেন?')) return;
    try {
      await callAdmin({ action: 'delete_generation', generation_id: genId });
      toast.success('মুছে গেছে'); loadHistory(); loadStats();
    } catch (err: unknown) { toast.error((err as Error).message); }
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success('কপি হয়েছে!'); };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'history', label: 'History', icon: History },
  ] as const;

  const statCards = [
    { label: 'Total Users', value: stats?.total_users ?? '—', icon: Users },
    { label: 'Total CIDs', value: stats?.total_cids ?? '—', icon: Zap },
    { label: 'User Balances', value: stats ? `$${(stats.total_balance_cents / 100).toFixed(2)}` : '—', icon: Wallet },
    {
      label: 'API Balance',
      value: apiBalanceLoading ? '...' : apiBalance !== null ? `$${apiBalance.toFixed(2)}` : '—',
      icon: DollarSign
    },
  ];

  return (
    <div className="space-y-5">
      {/* Edit CID Modal */}
      {editGenId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${card} p-6 w-full max-w-md`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-foreground flex items-center gap-2"><Pencil size={15} className="text-primary" /> Generation Edit করুন</h3>
              <button onClick={() => setEditGenId('')} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Installation ID</label>
                <input type="text" value={editIid} onChange={e => setEditIid(e.target.value)}
                  className={inp + " font-mono text-sm"} placeholder="Installation ID" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">CID (Confirmation ID)</label>
                <input type="text" value={editCid} onChange={e => setEditCid(e.target.value)}
                  className={inp + " font-mono text-sm"} placeholder="CID মান" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditGenId('')} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary transition-colors">
                বাতিল
              </button>
              <button onClick={saveEdit} disabled={saving} className={`flex-1 ${btn} disabled:opacity-40`}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                সেভ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-secondary rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground'
            }`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(s => (
              <div key={s.label} className={card + " p-5"}>
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <s.icon size={17} className="text-primary" />
                </div>
                <p className="text-2xl font-black text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { loadStats(); loadApiBalance(); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <RefreshCw size={13} /> Refresh stats
            </button>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="space-y-5">
          {/* Create user */}
          <div className={card + " p-5"}>
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Plus size={15} className="text-primary" /> নতুন User তৈরি করুন
            </h3>
            <form onSubmit={createUser} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)}
                placeholder="Username" required className={inp} />
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Password (min 6)" required className={inp} />
              <input type="number" value={newBalance} onChange={e => setNewBalance(e.target.value)}
                placeholder="Balance ($)" min="0" step="0.01" className={inp} />
              <button type="submit" disabled={creating} className={`${btn} disabled:opacity-60`}>
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} তৈরি করুন
              </button>
            </form>
          </div>

          {/* User list */}
          <div className={card + " overflow-hidden"}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <h3 className="font-bold text-foreground">সব Users ({users.filter(u => !u.is_admin).length})</h3>
              <button onClick={loadUsers} className="text-muted-foreground hover:text-primary transition-colors"><RefreshCw size={14} /></button>
            </div>
            {loadingUsers ? (
              <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="divide-y divide-border/40">
                {users.filter(u => !u.is_admin).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">কোনো user নেই।</p>
                ) : users.filter(u => !u.is_admin).map(u => (
                  <div key={u.id} className="px-5 py-4 hover:bg-primary/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User size={15} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">{u.username}</p>
                        <p className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString('bn-BD')}</p>
                      </div>
                      <div className="text-right mr-1">
                        <p className={`font-bold text-sm ${u.balance_cents > 0 ? 'text-green-600' : 'text-destructive'}`}>
                          ${(u.balance_cents / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">balance</p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        {/* Topup dropdown */}
                        <button onClick={() => { setTopupId(topupId === u.id ? '' : u.id); setTopupAmt(''); setSetBalId(''); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border hover:border-green-400 hover:text-green-600 text-muted-foreground transition-colors">
                          <Plus size={11} /> Add
                        </button>
                        <button onClick={() => { setSetBalId(setBalId === u.id ? '' : u.id); setSetBalAmt((u.balance_cents/100).toFixed(2)); setTopupId(''); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border hover:border-primary/50 hover:text-primary text-muted-foreground transition-colors">
                          <Pencil size={11} /> Set
                        </button>
                        <button onClick={() => deleteUser(u.id, u.username)}
                          className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/8 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Topup input */}
                    {topupId === u.id && (
                      <div className="mt-3 flex items-center gap-2 ml-12">
                        <div className="relative flex-1 max-w-[160px]">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                          <input type="number" value={topupAmt} onChange={e => setTopupAmt(e.target.value)}
                            placeholder="0.00" min="0.01" step="0.01" autoFocus
                            className="w-full border border-border rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-green-400" />
                        </div>
                        <button onClick={handleTopup} disabled={!topupAmt || topping}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1">
                          {topping ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} যোগ করুন
                        </button>
                        <button onClick={() => setTopupId('')} className="border border-border px-2 py-2 rounded-lg text-xs text-muted-foreground hover:bg-secondary transition-colors">
                          <X size={13} />
                        </button>
                      </div>
                    )}

                    {/* Set balance input */}
                    {setBalId === u.id && (
                      <div className="mt-3 flex items-center gap-2 ml-12">
                        <div className="relative flex-1 max-w-[160px]">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                          <input type="number" value={setBalAmt} onChange={e => setSetBalAmt(e.target.value)}
                            placeholder="0.00" min="0" step="0.01" autoFocus
                            className="w-full border border-border rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-primary" />
                        </div>
                        <button onClick={handleSetBalance} disabled={setBalAmt === '' || settingBal}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1">
                          {settingBal ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} সেট করুন
                        </button>
                        <button onClick={() => setSetBalId('')} className="border border-border px-2 py-2 rounded-lg text-xs text-muted-foreground hover:bg-secondary transition-colors">
                          <X size={13} />
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

      {/* History Tab */}
      {tab === 'history' && (
        <div className={card + " overflow-hidden"}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <h3 className="font-bold text-foreground">সব CID Generations ({generations.length})</h3>
            <button onClick={loadHistory} className="text-muted-foreground hover:text-primary transition-colors"><RefreshCw size={14} /></button>
          </div>
          {loadingHist ? (
            <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
          ) : generations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">কোনো generation নেই।</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/60 border-b border-border/60">
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wide">User</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wide">Installation ID</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wide">CID</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {generations.map(g => (
                    <tr key={g.id} className="hover:bg-primary/[0.02] transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground text-sm">{(g as Generation & { reseller_users?: { username: string } }).reseller_users?.username || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[160px] truncate">{g.installation_id || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-primary text-xs">{g.cid}</span>
                          <button onClick={() => copy(g.cid)} className="text-muted-foreground hover:text-primary transition-colors"><Copy size={10} /></button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(g.created_at).toLocaleString('bn-BD')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(g)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Edit">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => deleteGeneration(g.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors" title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Reseller Page ───────────────────────────────────────────────────────
const Reseller = () => {
  const [authState, setAuthState] = useState<'loading' | 'login' | 'user' | 'admin'>('loading');
  const [currentUser, setCurrentUser] = useState<ResellerUser | null>(null);

  useEffect(() => {
    const { token, user } = getSession();
    if (!token || !user) { setAuthState('login'); return; }
    callAuth({ action: 'validate', token })
      .then(res => { setCurrentUser(res.user); setAuthState(res.user.is_admin ? 'admin' : 'user'); })
      .catch(() => { clearSession(); setAuthState('login'); });
  }, []);

  const handleLogin = (user: ResellerUser) => { setCurrentUser(user); setAuthState(user.is_admin ? 'admin' : 'user'); };

  const handleLogout = async () => {
    const { token } = getSession();
    if (token) await callAuth({ action: 'logout', token }).catch(() => {});
    clearSession(); setCurrentUser(null); setAuthState('login');
  };

  const handleBalanceUpdate = (newCents: number) => {
    setCurrentUser(prev => prev ? { ...prev, balance_cents: newCents } : prev);
  };

  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(250,60%,98%)' }}>
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (authState === 'login') return <LoginPanel onLogin={handleLogin} />;

  return (
    <div className="min-h-screen" style={{ background: 'hsl(250,60%,98%)' }}>
      {/* Top Header */}
      <div className="bg-white border-b border-primary/10 shadow-[0_1px_8px_rgba(99,77,255,0.06)]">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
              <TrendingUp size={11} />
              {currentUser?.is_admin ? 'ADMIN PANEL' : 'RESELLER PORTAL'}
            </p>
            <h1 className="text-lg font-black text-foreground">CID For Reseller</h1>
          </div>

          <div className="flex items-center gap-2">
            {!currentUser?.is_admin && (
              <div className={`${pillBase} ${
                (currentUser?.balance_cents ?? 0) > 0
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-destructive/8 text-destructive border-destructive/25'
              }`}>
                <Wallet size={11} /> ${((currentUser?.balance_cents ?? 0) / 100).toFixed(2)}
              </div>
            )}
            <div className={`${pillBase} bg-secondary text-muted-foreground border-border`}>
              <User size={11} /> {currentUser?.username}
            </div>
            <button onClick={handleLogout}
              className={`${pillBase} text-muted-foreground border-border hover:border-destructive/40 hover:text-destructive hover:bg-destructive/5 transition-colors`}>
              <LogOut size={11} /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-5 py-7">
        {currentUser?.is_admin ? (
          <AdminPanel />
        ) : (
          <CIDGenerator user={currentUser!} onBalanceUpdate={handleBalanceUpdate} />
        )}
      </div>
    </div>
  );
};

export default Reseller;
