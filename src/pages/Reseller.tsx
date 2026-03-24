import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Eye, EyeOff, LogOut, Zap, Wallet, Copy, Check, RefreshCw,
  AlertCircle, Loader2, Users, Plus, Trash2, TrendingUp,
  History, KeyRound, DollarSign, ShieldCheck, User, BarChart2
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

// ─── Input style ─────────────────────────────────────────────────────────────
const inp = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 bg-white transition-all";

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center mb-3 shadow-md shadow-violet-200">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">CID Reseller Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="Enter username" required
                className={inp + " pl-9"} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required className={inp + " pl-9 pr-10"} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-violet-600">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-red-600 text-sm">
              <AlertCircle size={14} />{error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm shadow-violet-200 disabled:opacity-60">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── CID Generator (Reseller) ─────────────────────────────────────────────────
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
    try { const res = await callCID({ action: 'my_history' }); setHistory(res?.generations ?? []); }
    catch { /* ignore */ } finally { setHistLoading(false); }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setCid(''); setLoading(true);
    try {
      const res = await callCID({ action: 'getcid', installation_id: iid });
      if (res?.cid) { setCid(res.cid); onBalanceUpdate(res.balance_after_cents); loadHistory(); toast.success('CID generated!'); }
      else setError(res?.error || 'Failed to get CID');
    } catch (err: unknown) { setError((err as Error).message); }
    finally { setLoading(false); }
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); toast.success('Copied!'); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Low balance warning */}
      {user.balance_cents === 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
          <AlertCircle size={15} className="shrink-0" />
          আপনার ব্যালেন্স শেষ। Admin-এর সাথে যোগাযোগ করুন।
        </div>
      )}

      {/* Balance card */}
      <div className="bg-violet-600 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-violet-200 text-sm font-medium">Available Balance</p>
            <p className="text-3xl font-black mt-1">${(user.balance_cents / 100).toFixed(2)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Wallet size={22} className="text-white" />
          </div>
        </div>
        <p className="text-violet-200 text-xs mt-3">Each CID generation costs $1.00</p>
      </div>

      {/* Generator */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Zap size={16} className="text-violet-600" /> Generate CID
        </h2>
        <form onSubmit={handleGenerate} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Installation ID</label>
            <input type="text" value={iid} onChange={e => setIid(e.target.value)}
              placeholder="Enter Installation ID..." required
              className={inp + " font-mono"} />
          </div>
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-red-600 text-sm">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />{error}
            </div>
          )}
          <button type="submit" disabled={loading || !iid.trim() || user.balance_cents < 100}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
            {loading ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : <><Zap size={14} /> Generate CID — $1.00</>}
          </button>
        </form>

        {cid && (
          <div className="mt-4 bg-violet-50 border border-violet-200 rounded-xl p-4">
            <p className="text-xs text-violet-500 font-medium uppercase tracking-wider mb-2">Confirmation ID (CID)</p>
            <div className="flex items-center justify-between gap-3">
              <p className="text-2xl font-black text-violet-700 font-mono tracking-widest">{cid}</p>
              <button onClick={() => copy(cid)} className="p-2 rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-600 transition-colors">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <History size={15} className="text-violet-600" /> My Generations
          </h3>
          <button onClick={loadHistory} className="text-gray-400 hover:text-violet-600 transition-colors"><RefreshCw size={14} /></button>
        </div>
        {histLoading ? (
          <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No generations yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {history.map(h => (
              <div key={h.id} className="px-5 py-3.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-gray-400 mb-0.5">Installation ID</p>
                  <p className="font-mono text-gray-700 truncate">{h.installation_id || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-0.5">CID</p>
                  <div className="flex items-center gap-1.5">
                    <p className="font-mono font-bold text-violet-600 truncate">{h.cid}</p>
                    <button onClick={() => copy(h.cid)} className="text-gray-400 hover:text-violet-600 shrink-0 transition-colors"><Copy size={10} /></button>
                  </div>
                </div>
                <p className="col-span-2 text-gray-400">{new Date(h.created_at).toLocaleString()}</p>
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
  const [tab, setTab] = useState<'dashboard' | 'users' | 'history'>('dashboard');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [stats, setStats] = useState<{ total_users: number; total_cids: number; total_balance_cents: number } | null>(null);
  const [apiBalance, setApiBalance] = useState<number | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingHist, setLoadingHist] = useState(false);

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [creating, setCreating] = useState(false);

  const [topupId, setTopupId] = useState('');
  const [topupAmt, setTopupAmt] = useState('');
  const [topping, setTopping] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const [statsRes, balRes] = await Promise.all([callAdmin({ action: 'stats' }), callCID({ action: 'balance' })]);
      setStats(statsRes);
      const b = balRes?.data?.balance ?? balRes?.data?.credits ?? balRes?.balance ?? balRes?.credits;
      if (b !== undefined && b !== null) setApiBalance(parseFloat(String(b)));
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

  useEffect(() => { loadStats(); loadUsers(); }, [loadStats, loadUsers]);
  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab, loadHistory]);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true);
    try {
      await callAdmin({ action: 'create_user', username: newUsername, password: newPassword, balance_cents: parseInt(newBalance || '0') * 100 });
      toast.success(`User "${newUsername}" created!`);
      setNewUsername(''); setNewPassword(''); setNewBalance(''); loadUsers();
    } catch (err: unknown) { toast.error((err as Error).message); } finally { setCreating(false); }
  };

  const handleTopup = async (userId: string, username: string) => {
    if (!topupAmt || topupId !== userId) { setTopupId(userId); return; }
    setTopping(true);
    try {
      const cents = Math.round(parseFloat(topupAmt) * 100);
      await callAdmin({ action: 'topup', user_id: userId, amount_cents: cents });
      toast.success(`Topped up $${topupAmt} for ${username}`);
      setTopupId(''); setTopupAmt(''); loadUsers();
    } catch (err: unknown) { toast.error((err as Error).message); } finally { setTopping(false); }
  };

  const deleteUser = async (userId: string, username: string) => {
    if (!confirm(`Delete user "${username}"?`)) return;
    try { await callAdmin({ action: 'delete_user', user_id: userId }); toast.success('User deleted'); loadUsers(); }
    catch (err: unknown) { toast.error((err as Error).message); }
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'history', label: 'History', icon: History },
  ] as const;

  const statCards = [
    { label: 'Total Users', value: stats?.total_users ?? '—', icon: Users },
    { label: 'Total CIDs', value: stats?.total_cids ?? '—', icon: Zap },
    { label: 'User Balances', value: stats ? `$${(stats.total_balance_cents / 100).toFixed(2)}` : '—', icon: Wallet },
    { label: 'API Balance', value: apiBalance !== null ? `$${apiBalance.toFixed(2)}` : '—', icon: DollarSign },
  ];

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
                : 'text-gray-500 hover:text-gray-800'
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
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center mb-3">
                  <s.icon size={17} className="text-violet-600" />
                </div>
                <p className="text-2xl font-black text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <button onClick={loadStats} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-violet-600 transition-colors">
            <RefreshCw size={13} /> Refresh stats
          </button>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="space-y-5">
          {/* Create user */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plus size={15} className="text-violet-600" /> Create New User
            </h3>
            <form onSubmit={createUser} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)}
                placeholder="Username" required className={inp} />
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Password (min 6 chars)" required className={inp} />
              <div className="flex gap-2">
                <input type="number" value={newBalance} onChange={e => setNewBalance(e.target.value)}
                  placeholder="Balance ($)" min="0" step="0.01" className={inp} />
                <button type="submit" disabled={creating}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-60">
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create
                </button>
              </div>
            </form>
          </div>

          {/* Users list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">All Users ({users.filter(u => !u.is_admin).length})</h3>
              <button onClick={loadUsers} className="text-gray-400 hover:text-violet-600 transition-colors"><RefreshCw size={14} /></button>
            </div>
            {loadingUsers ? (
              <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-300" /></div>
            ) : (
              <div className="divide-y divide-gray-50">
                {users.filter(u => !u.is_admin).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No users yet.</p>
                ) : users.filter(u => !u.is_admin).map(u => (
                  <div key={u.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center shrink-0">
                      <User size={14} className="text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800">{u.username}</p>
                      <p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right mr-2">
                      <p className={`font-bold text-sm ${u.balance_cents > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        ${(u.balance_cents / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">balance</p>
                    </div>

                    {topupId === u.id ? (
                      <div className="flex gap-1.5">
                        <input type="number" value={topupAmt} onChange={e => setTopupAmt(e.target.value)}
                          placeholder="$" min="0.01" step="0.01" autoFocus
                          className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-violet-500" />
                        <button onClick={() => handleTopup(u.id, u.username)} disabled={topping}
                          className="bg-violet-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-violet-700 transition-colors">
                          {topping ? <Loader2 size={12} className="animate-spin" /> : '✓'}
                        </button>
                        <button onClick={() => { setTopupId(''); setTopupAmt(''); }}
                          className="border border-gray-200 px-2 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100 transition-colors">✕</button>
                      </div>
                    ) : (
                      <button onClick={() => setTopupId(u.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:border-violet-400 hover:text-violet-600 text-gray-500 transition-colors">
                        <DollarSign size={11} /> Topup
                      </button>
                    )}

                    <button onClick={() => deleteUser(u.id, u.username)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">All CID Generations ({generations.length})</h3>
            <button onClick={loadHistory} className="text-gray-400 hover:text-violet-600 transition-colors"><RefreshCw size={14} /></button>
          </div>
          {loadingHist ? (
            <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-300" /></div>
          ) : generations.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No generations yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">User</th>
                    <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Installation ID</th>
                    <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">CID</th>
                    <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Cost</th>
                    <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {generations.map(g => (
                    <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-gray-800 text-sm">{g.reseller_users?.username || '—'}</td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-500 max-w-[180px] truncate">{g.installation_id || '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-violet-600 text-xs">{g.cid}</span>
                          <button onClick={() => copy(g.cid)} className="text-gray-300 hover:text-violet-600 transition-colors"><Copy size={10} /></button>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">${(g.price_cents / 100).toFixed(2)}</td>
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(g.created_at).toLocaleString()}</td>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-violet-600" />
      </div>
    );
  }

  if (authState === 'login') return <LoginPanel onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
              <TrendingUp size={11} />
              {currentUser?.is_admin ? 'ADMIN PANEL' : 'RESELLER PORTAL'}
            </p>
            <h1 className="text-lg font-black text-gray-900">CID For Reseller</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Balance badge for reseller */}
            {!currentUser?.is_admin && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                (currentUser?.balance_cents ?? 0) > 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-600 border-red-200'
              }`}>
                <Wallet size={11} /> ${((currentUser?.balance_cents ?? 0) / 100).toFixed(2)}
              </div>
            )}

            {/* Username */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
              <User size={11} /> {currentUser?.username}
            </div>

            {/* Logout */}
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors">
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
