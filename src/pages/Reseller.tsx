import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import BrandLogo from '@/components/store/BrandLogo';
import { toast } from 'sonner';
import {
  Eye, EyeOff, LogOut, Zap, Wallet, Copy, Check, RefreshCw,
  AlertCircle, Loader2, Users, Plus, Trash2, TrendingUp,
  History, ChevronDown, KeyRound, DollarSign, ShieldCheck, User
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ResellerUser { id: string; username: string; is_admin: boolean; balance_cents: number; }
interface Generation { id: string; installation_id: string; cid: string; price_cents: number; created_at: string; reseller_users?: { username: string }; }
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

// ─── Login Component ──────────────────────────────────────────────────────────
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="orb orb-1 opacity-10 top-20 left-1/4 fixed" />
      <div className="orb orb-2 opacity-10 bottom-20 right-1/4 fixed" />

      <div className="glass-card rounded-3xl p-8 w-full max-w-md space-y-7 animate-slide-up">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandLogo size="md" />
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1">
            <Users size={14} className="text-primary" />
            CID Reseller Portal
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Username</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="your username"
                required
                className="w-full bg-muted/40 border border-border rounded-xl pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Password</label>
            <div className="relative">
              <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-muted/40 border border-border rounded-xl pl-9 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-destructive text-sm">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-glow py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            Sign In
          </button>
        </form>
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

  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const res = await callCID({ action: 'my_history' });
      setHistory(res?.generations ?? []);
    } catch { /* ignore */ } finally { setHistLoading(false); }
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
        toast.success('CID generated successfully!');
      } else {
        setError(res?.error || 'Failed to get CID');
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally { setLoading(false); }
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); toast.success('Copied!'); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="space-y-5">
      {/* Generator Card */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-bold text-foreground flex items-center gap-2"><Zap size={16} className="text-primary" /> Generate CID</h2>
        <form onSubmit={handleGenerate} className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Installation ID</label>
            <input
              type="text"
              value={iid}
              onChange={e => setIid(e.target.value)}
              placeholder="Enter Installation ID here..."
              required
              className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-destructive text-sm">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />{error}
            </div>
          )}
          <button type="submit" disabled={loading || !iid.trim()} className="w-full btn-glow py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <><Loader2 size={15} className="animate-spin" /> Processing...</> : <><Zap size={15} /> Generate CID ($1.00)</>}
          </button>
        </form>

        {cid && (
          <div className="border border-primary/30 bg-primary/5 rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider font-medium">Confirmation ID (CID)</p>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xl font-black text-primary font-mono tracking-widest break-all">{cid}</p>
              <button onClick={() => copy(cid)} className="shrink-0 p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground flex items-center gap-2"><History size={15} className="text-primary" /> Recent Generations</h3>
          <button onClick={loadHistory} className="text-muted-foreground hover:text-primary transition-colors"><RefreshCw size={14} /></button>
        </div>
        {histLoading ? (
          <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No generations yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map(h => (
              <div key={h.id} className="border border-border rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
                <div><p className="text-muted-foreground mb-0.5">Installation ID</p><p className="font-mono text-foreground truncate">{h.installation_id || '—'}</p></div>
                <div><p className="text-muted-foreground mb-0.5">CID</p>
                  <div className="flex items-center gap-1">
                    <p className="font-mono font-bold text-primary truncate flex-1">{h.cid}</p>
                    <button onClick={() => copy(h.cid)} className="text-muted-foreground hover:text-primary shrink-0"><Copy size={10} /></button>
                  </div>
                </div>
                <div className="col-span-2"><p className="text-muted-foreground/60">{new Date(h.created_at).toLocaleString('bn-BD')}</p></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Admin Panel ──────────────────────────────────────────────────────────────
const AdminPanel = ({ adminUser }: { adminUser: ResellerUser }) => {
  const [tab, setTab] = useState<'dashboard' | 'users' | 'history'>('dashboard');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [stats, setStats] = useState<{ total_users: number; total_cids: number; total_balance_cents: number } | null>(null);
  const [apiBalance, setApiBalance] = useState<number | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingHist, setLoadingHist] = useState(false);

  // Create user form
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [creating, setCreating] = useState(false);

  // Topup
  const [topupId, setTopupId] = useState('');
  const [topupAmt, setTopupAmt] = useState('');
  const [topping, setTopping] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const [statsRes, balRes] = await Promise.all([
        callAdmin({ action: 'stats' }),
        callCID({ action: 'balance' }),
      ]);
      setStats(statsRes);
      const b = balRes?.data?.balance ?? balRes?.data?.credits ?? balRes?.balance ?? balRes?.credits;
      if (b !== undefined && b !== null) setApiBalance(parseFloat(String(b)));
    } catch { /* ignore */ }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await callAdmin({ action: 'list_users' });
      setUsers(res?.users ?? []);
    } catch (err: unknown) { toast.error((err as Error).message); } finally { setLoadingUsers(false); }
  }, []);

  const loadHistory = useCallback(async () => {
    setLoadingHist(true);
    try {
      const res = await callAdmin({ action: 'list_generations' });
      setGenerations(res?.generations ?? []);
    } catch (err: unknown) { toast.error((err as Error).message); } finally { setLoadingHist(false); }
  }, []);

  useEffect(() => {
    loadStats();
    loadUsers();
  }, [loadStats, loadUsers]);

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab, loadHistory]);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await callAdmin({ action: 'create_user', username: newUsername, password: newPassword, balance_cents: parseInt(newBalance || '0') * 100 });
      toast.success(`User "${newUsername}" created!`);
      setNewUsername(''); setNewPassword(''); setNewBalance('');
      loadUsers();
    } catch (err: unknown) { toast.error((err as Error).message); } finally { setCreating(false); }
  };

  const handleTopup = async (userId: string, username: string) => {
    if (!topupAmt || topupId !== userId) { setTopupId(userId); return; }
    setTopping(true);
    try {
      const cents = Math.round(parseFloat(topupAmt) * 100);
      await callAdmin({ action: 'topup', user_id: userId, amount_cents: cents });
      toast.success(`Topped up $${topupAmt} for ${username}`);
      setTopupId(''); setTopupAmt('');
      loadUsers();
    } catch (err: unknown) { toast.error((err as Error).message); } finally { setTopping(false); }
  };

  const deleteUser = async (userId: string, username: string) => {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await callAdmin({ action: 'delete_user', user_id: userId });
      toast.success('User deleted');
      loadUsers();
    } catch (err: unknown) { toast.error((err as Error).message); }
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'history', label: 'History', icon: History },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-muted/40 border border-border w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {tab === 'dashboard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Users', value: stats?.total_users ?? '—', icon: Users, color: 'text-blue-500' },
              { label: 'Total CIDs', value: stats?.total_cids ?? '—', icon: Zap, color: 'text-yellow-500' },
              { label: 'User Balances', value: stats ? `$${(stats.total_balance_cents / 100).toFixed(2)}` : '—', icon: Wallet, color: 'text-green-500' },
              { label: 'API Balance', value: apiBalance !== null ? `$${apiBalance.toFixed(2)}` : '—', icon: DollarSign, color: 'text-primary' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
                <s.icon size={18} className={`${s.color} mb-2`} />
                <p className="text-2xl font-black text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <button onClick={loadStats} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
            <RefreshCw size={12} /> Refresh stats
          </button>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="space-y-5">
          {/* Create user */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Plus size={15} className="text-primary" /> Create New User</h3>
            <form onSubmit={createUser} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder="Username"
                required
                className="bg-muted/40 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Password (min 6 chars)"
                required
                className="bg-muted/40 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newBalance}
                  onChange={e => setNewBalance(e.target.value)}
                  placeholder="Initial balance ($)"
                  min="0"
                  step="0.01"
                  className="flex-1 bg-muted/40 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                />
                <button type="submit" disabled={creating} className="btn-glow px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-1.5 shrink-0">
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create
                </button>
              </div>
            </form>
          </div>

          {/* Users list */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-bold text-foreground">All Users ({users.filter(u => !u.is_admin).length})</h3>
              <button onClick={loadUsers} className="text-muted-foreground hover:text-primary transition-colors"><RefreshCw size={14} /></button>
            </div>
            {loadingUsers ? (
              <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="divide-y divide-border">
                {users.filter(u => !u.is_admin).map(u => (
                  <div key={u.id} className="px-5 py-3.5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User size={14} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">{u.username}</p>
                      <p className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString('en-BD')}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${u.balance_cents > 0 ? 'text-green-500' : 'text-destructive'}`}>
                        ${(u.balance_cents / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">balance</p>
                    </div>

                    {/* Topup inline */}
                    {topupId === u.id ? (
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          value={topupAmt}
                          onChange={e => setTopupAmt(e.target.value)}
                          placeholder="$"
                          min="0.01"
                          step="0.01"
                          className="w-20 bg-muted/40 border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary"
                          autoFocus
                        />
                        <button onClick={() => handleTopup(u.id, u.username)} disabled={topping} className="btn-glow px-2.5 py-1.5 rounded-lg text-xs font-semibold">
                          {topping ? <Loader2 size={12} className="animate-spin" /> : '✓'}
                        </button>
                        <button onClick={() => { setTopupId(''); setTopupAmt(''); }} className="px-2 py-1.5 rounded-lg text-xs border border-border hover:bg-muted text-foreground">✕</button>
                      </div>
                    ) : (
                      <button onClick={() => setTopupId(u.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border hover:border-primary hover:text-primary transition-colors">
                        <DollarSign size={11} /> Topup
                      </button>
                    )}

                    <button onClick={() => deleteUser(u.id, u.username)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {users.filter(u => !u.is_admin).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No users yet. Create one above.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-bold text-foreground">All CID Generations ({generations.length})</h3>
            <button onClick={loadHistory} className="text-muted-foreground hover:text-primary transition-colors"><RefreshCw size={14} /></button>
          </div>
          {loadingHist ? (
            <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
          ) : generations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No generations yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">User</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Installation ID</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">CID</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Cost</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {generations.map(g => (
                    <tr key={g.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{g.reseller_users?.username || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[180px] truncate">{g.installation_id || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-primary text-xs">{g.cid}</span>
                          <button onClick={() => copy(g.cid)} className="text-muted-foreground hover:text-primary"><Copy size={10} /></button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">${(g.price_cents / 100).toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(g.created_at).toLocaleString('en-BD')}</td>
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
  const [apiBalance, setApiBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Validate stored session on mount
  useEffect(() => {
    const { token, user } = getSession();
    if (!token || !user) { setAuthState('login'); return; }

    callAuth({ action: 'validate', token })
      .then(res => {
        setCurrentUser(res.user);
        setAuthState(res.user.is_admin ? 'admin' : 'user');
      })
      .catch(() => { clearSession(); setAuthState('login'); });
  }, []);

  // Fetch grahok.io API balance for display
  const fetchApiBalance = useCallback(async () => {
    setBalanceLoading(true);
    try {
      const res = await callCID({ action: 'balance' });
      const b = res?.data?.balance ?? res?.data?.credits ?? res?.balance ?? res?.credits;
      if (b !== undefined && b !== null) setApiBalance(parseFloat(String(b)));
    } catch { /* ignore */ } finally { setBalanceLoading(false); }
  }, []);

  useEffect(() => {
    if (authState !== 'login' && authState !== 'loading') fetchApiBalance();
  }, [authState, fetchApiBalance]);

  const handleLogin = (user: ResellerUser) => {
    setCurrentUser(user);
    setAuthState(user.is_admin ? 'admin' : 'user');
  };

  const handleLogout = async () => {
    const { token } = getSession();
    if (token) await callAuth({ action: 'logout', token }).catch(() => {});
    clearSession();
    setCurrentUser(null);
    setAuthState('login');
  };

  const handleBalanceUpdate = (newCents: number) => {
    setCurrentUser(prev => prev ? { ...prev, balance_cents: newCents } : prev);
  };

  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (authState === 'login') {
    return <LoginPanel onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Header Bar */}
      <div className="bg-gradient-to-r from-primary/10 via-background to-primary/5 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users size={15} className="text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">
                {currentUser?.is_admin ? 'Admin Panel' : 'Reseller Portal'}
              </span>
            </div>
            <h1 className="text-xl font-black text-foreground" style={{ fontFamily: 'Sora, sans-serif' }}>
              CID For Reseller
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* API Balance (admin only) */}
            {currentUser?.is_admin && apiBalance !== null && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                <DollarSign size={11} />
                API: ${apiBalance.toFixed(2)}
                <button onClick={fetchApiBalance} className={balanceLoading ? 'animate-spin' : ''}><RefreshCw size={10} /></button>
              </div>
            )}

            {/* User balance */}
            {!currentUser?.is_admin && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${(currentUser?.balance_cents ?? 0) > 0 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                <Wallet size={11} />
                ${((currentUser?.balance_cents ?? 0) / 100).toFixed(2)}
              </div>
            )}

            {/* Username */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted/60 text-muted-foreground border border-border">
              <User size={11} />
              {currentUser?.username}
            </div>

            {/* Logout */}
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border hover:border-destructive hover:text-destructive transition-colors text-muted-foreground">
              <LogOut size={11} /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {currentUser?.is_admin ? (
          <AdminPanel adminUser={currentUser} />
        ) : (
          <div className="max-w-2xl mx-auto">
            {(currentUser?.balance_cents ?? 0) === 0 && (
              <div className="mb-5 flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-amber-600 text-sm">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                আপনার ব্যালেন্স শেষ। Admin-এর সাথে যোগাযোগ করুন টপআপের জন্য।
              </div>
            )}
            <CIDGenerator user={currentUser!} onBalanceUpdate={handleBalanceUpdate} />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Reseller;
