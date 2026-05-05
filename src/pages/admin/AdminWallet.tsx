import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Wallet, Plus, Minus, Search, RefreshCw, TrendingUp, TrendingDown,
  History, Users, CheckCircle, X, Clock, Eye
} from 'lucide-react';

interface Customer {
  user_id: string;
  display_name: string | null;
  email: string | null;
  wallet_balance: number;
}

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  balance_after: number;
  note: string | null;
  reference_id: string | null;
  created_by: string;
  created_at: string;
  profiles?: { display_name: string | null; email: string | null };
}

interface TopupRequest {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  screenshot_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  profiles?: { display_name: string | null; email: string | null };
}

const AdminWallet = () => {
  const { session } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [topupRequests, setTopupRequests] = useState<TopupRequest[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingTx, setLoadingTx] = useState(false);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<Customer | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [txType, setTxType] = useState<'credit' | 'debit'>('credit');
  const [processing, setProcessing] = useState(false);
  const [processingReqId, setProcessingReqId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'requests' | 'customers' | 'transactions'>('requests');

  useEffect(() => { fetchCustomers(); fetchAllTransactions(); fetchTopupRequests(); }, []);

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    const { data } = await supabase
      .from('profiles')
      .select('user_id, display_name, email, wallet_balance')
      .order('wallet_balance', { ascending: false });
    setCustomers((data || []) as Customer[]);
    setLoadingCustomers(false);
  };

  const fetchAllTransactions = async () => {
    setLoadingTx(true);
    const { data } = await supabase
      .from('wallet_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', userIds);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p]));
      setTransactions(data.map(t => ({ ...t, profiles: profileMap[t.user_id] })));
    } else {
      setTransactions([]);
    }
    setLoadingTx(false);
  };

  const fetchTopupRequests = async () => {
    setLoadingReqs(true);
    const { data } = await (supabase.from('wallet_topup_requests' as any) as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((r: any) => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', userIds as string[]);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p]));
      setTopupRequests(data.map((r: any) => ({ ...r, profiles: profileMap[r.user_id] })));
    } else {
      setTopupRequests([]);
    }
    setLoadingReqs(false);
  };

  const handleApproveRequest = async (req: TopupRequest) => {
    if (!session?.access_token) return;
    setProcessingReqId(req.id);
    try {
      // 1. Credit wallet via RPC
      const { data, error } = await supabase.rpc('wallet_credit' as any, {
        p_user_id: req.user_id,
        p_amount: req.amount,
        p_note: `Wallet top-up via ${req.payment_method} — TrxID: ${req.transaction_id}`,
        p_reference_id: req.id,
        p_created_by: 'admin',
      });
      if (error || !(data as any)?.success) throw new Error((data as any)?.error || 'Failed to credit wallet');

      // 2. Update request status
      await (supabase.from('wallet_topup_requests' as any) as any)
        .update({ status: 'approved', admin_notes: adminNote[req.id] || null, reviewed_at: new Date().toISOString() })
        .eq('id', req.id);

      // 3. Send notification to user
      await supabase.from('notifications').insert({
        user_id: req.user_id,
        title: 'Wallet Top-up Approved ✅',
        message: `৳${req.amount} has been added to your wallet via ${req.payment_method}.`,
        type: 'info',
      });

      supabase.functions.invoke('notify-telegram-event', {
        body: {
          title: '✅ Wallet Top-up Approved',
          lines: [
            `👤 ${req.profiles?.display_name || req.profiles?.email || req.user_id}`,
            `💵 ৳${Number(req.amount).toLocaleString()} credited`,
            `💳 ${(req.payment_method || '').toUpperCase()} — TrxID: ${req.transaction_id}`,
          ],
        },
      }).catch(() => {});

      toast.success(`✅ ৳${req.amount} credited to wallet!`);
      fetchTopupRequests();
      fetchCustomers();
    } catch (e: any) {
      toast.error(e.message || 'Failed to approve');
    }
    setProcessingReqId(null);
  };

  const handleRejectRequest = async (req: TopupRequest) => {
    setProcessingReqId(req.id);
    try {
      await (supabase.from('wallet_topup_requests' as any) as any)
        .update({ status: 'rejected', admin_notes: adminNote[req.id] || null, reviewed_at: new Date().toISOString() })
        .eq('id', req.id);

      await supabase.from('notifications').insert({
        user_id: req.user_id,
        title: 'Wallet Top-up Rejected ❌',
        message: `Your top-up request of ৳${req.amount} was rejected.${adminNote[req.id] ? ` Reason: ${adminNote[req.id]}` : ''}`,
        type: 'info',
      });

      toast.success('Request rejected');
      fetchTopupRequests();
    } catch {
      toast.error('Failed to reject');
    }
    setProcessingReqId(null);
  };

  const handleAdjust = async () => {
    if (!selectedUser) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter valid amount'); return; }

    setProcessing(true);
    try {
      const fnName = txType === 'credit' ? 'wallet_credit' : 'wallet_debit';
      const { data, error } = await supabase.rpc(fnName as any, {
        p_user_id: selectedUser.user_id,
        p_amount: amt,
        p_note: note || (txType === 'credit' ? 'Admin top-up' : 'Admin debit'),
        p_reference_id: null,
        p_created_by: 'admin',
      });

      if (error || !(data as any)?.success) {
        toast.error((data as any)?.error || 'Failed');
        return;
      }

      toast.success(`✅ ৳${amt} ${txType === 'credit' ? 'credited' : 'debited'}`);
      setAmount('');
      setNote('');
      setSelectedUser(null);
      fetchCustomers();
      fetchAllTransactions();
    } finally {
      setProcessing(false);
    }
  };

  const filtered = customers.filter(c =>
    !search ||
    c.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalWalletBalance = customers.reduce((s, c) => s + (c.wallet_balance || 0), 0);
  const totalCredits = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalDebits = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  const pendingCount = topupRequests.filter(r => r.status === 'pending').length;

  const statusColor: Record<string, string> = {
    pending: 'text-amber-600 bg-amber-500/10 border-amber-500/30',
    approved: 'text-green-600 bg-green-500/10 border-green-500/30',
    rejected: 'text-destructive bg-destructive/10 border-destructive/30',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="text-primary" size={24} /> Wallet Manager
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage customer wallets and top-up requests</p>
        </div>
        <button onClick={() => { fetchCustomers(); fetchAllTransactions(); fetchTopupRequests(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted/40 transition-colors text-muted-foreground">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={15} className="text-primary" />
            <span className="text-xs text-muted-foreground">Total Wallet</span>
          </div>
          <p className="text-xl font-bold text-foreground">৳{totalWalletBalance.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={15} className="text-green-500" />
            <span className="text-xs text-muted-foreground">Total Credits</span>
          </div>
          <p className="text-xl font-bold text-green-500">৳{totalCredits.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={15} className="text-destructive" />
            <span className="text-xs text-muted-foreground">Total Debits</span>
          </div>
          <p className="text-xl font-bold text-destructive">৳{totalDebits.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={15} className="text-amber-500" />
            <span className="text-xs text-muted-foreground">Pending</span>
          </div>
          <p className="text-xl font-bold text-amber-500">{pendingCount}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Left: Tabs */}
        <div className="space-y-4">
          <div className="flex gap-2 p-1 rounded-xl bg-muted/30 border border-border w-fit">
            {[
              { id: 'requests', label: `Requests${pendingCount > 0 ? ` (${pendingCount})` : ''}`, icon: Clock },
              { id: 'customers', label: 'Customers', icon: Users },
              { id: 'transactions', label: 'Transactions', icon: History },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}>
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>

          {/* ── Top-up Requests Tab ── */}
          {activeTab === 'requests' && (
            <div className="glass-card rounded-2xl border border-border overflow-hidden">
              {loadingReqs ? (
                <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
              ) : topupRequests.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No top-up requests yet</div>
              ) : (
                <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                  {topupRequests.map(req => (
                    <div key={req.id} className={`p-4 ${req.status === 'pending' ? 'bg-amber-500/3' : ''}`}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                            {((req as any).profiles?.display_name || (req as any).profiles?.email || '?')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">{(req as any).profiles?.display_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground truncate">{(req as any).profiles?.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-foreground">৳{req.amount.toLocaleString()}</p>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusColor[req.status] || ''}`}>
                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div><span className="font-semibold text-foreground">Method:</span> {req.payment_method}</div>
                        <div><span className="font-semibold text-foreground">TrxID:</span> {req.transaction_id}</div>
                        <div className="col-span-2"><span className="font-semibold text-foreground">Date:</span> {new Date(req.created_at).toLocaleString()}</div>
                        {req.admin_notes && <div className="col-span-2"><span className="font-semibold text-foreground">Admin Note:</span> {req.admin_notes}</div>}
                      </div>

                      {req.status === 'pending' && (
                        <div className="mt-3 space-y-2">
                          <input
                            value={adminNote[req.id] || ''}
                            onChange={e => setAdminNote(prev => ({ ...prev, [req.id]: e.target.value }))}
                            placeholder="Admin note (optional)..."
                            className="w-full rounded-xl px-3 py-2 text-xs border border-border bg-muted/30 text-foreground focus:outline-none focus:border-primary"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveRequest(req)}
                              disabled={processingReqId === req.id}
                              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-50">
                              {processingReqId === req.id
                                ? <RefreshCw size={13} className="animate-spin" />
                                : <CheckCircle size={13} />}
                              Approve & Credit
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req)}
                              disabled={processingReqId === req.id}
                              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold border border-destructive/50 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50">
                              <X size={13} /> Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Customers Tab ── */}
          {activeTab === 'customers' && (
            <div className="glass-card rounded-2xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-16 pr-4 py-2.5 text-sm rounded-xl bg-muted/30 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
                </div>
              </div>
              <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                {loadingCustomers ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
                ) : filtered.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">No customers found</div>
                ) : (
                  filtered.map(c => (
                    <div key={c.user_id} onClick={() => setSelectedUser(c)}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors ${selectedUser?.user_id === c.user_id ? 'bg-primary/10 border-l-2 border-primary' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-xs font-bold text-primary">
                          {(c.display_name || c.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.display_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${c.wallet_balance > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                          ৳{(c.wallet_balance || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Balance</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── Transactions Tab ── */}
          {activeTab === 'transactions' && (
            <div className="glass-card rounded-2xl border border-border overflow-hidden">
              <div className="divide-y divide-border max-h-[560px] overflow-y-auto">
                {loadingTx ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
                ) : transactions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">No transactions</div>
                ) : (
                  transactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'credit' ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                          {tx.type === 'credit'
                            ? <TrendingUp size={14} className="text-green-500" />
                            : <TrendingDown size={14} className="text-destructive" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {(tx as any).profiles?.display_name || (tx as any).profiles?.email || tx.user_id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-muted-foreground">{tx.note || '—'} · {new Date(tx.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${tx.type === 'credit' ? 'text-green-500' : 'text-destructive'}`}>
                          {tx.type === 'credit' ? '+' : '-'}৳{tx.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Bal: ৳{tx.balance_after.toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Manual Adjust */}
        <div className="glass-card rounded-2xl border border-border p-6 h-fit space-y-5">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Wallet size={16} className="text-primary" /> Manual Wallet Adjust
          </h2>

          {selectedUser ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                {(selectedUser.display_name || selectedUser.email || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{selectedUser.display_name || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground truncate">{selectedUser.email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-primary">৳{(selectedUser.wallet_balance || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Balance</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border text-center text-sm text-muted-foreground">
              Select a customer from the list
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setTxType('credit')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                txType === 'credit' ? 'bg-green-500 text-white shadow' : 'border border-border text-muted-foreground hover:border-green-500/50'
              }`}>
              <Plus size={14} /> Credit
            </button>
            <button onClick={() => setTxType('debit')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                txType === 'debit' ? 'bg-destructive text-white shadow' : 'border border-border text-muted-foreground hover:border-destructive/50'
              }`}>
              <Minus size={14} /> Debit
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Amount (৳)</label>
            <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 500"
              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors text-sm" />
          </div>

          <div className="flex flex-wrap gap-2">
            {[100, 200, 500, 1000, 2000].map(v => (
              <button key={v} onClick={() => setAmount(String(v))}
                className="px-3 py-1.5 rounded-lg text-xs border border-border hover:border-primary/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all">
                ৳{v}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Note (optional)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Reason..."
              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors text-sm" />
          </div>

          <button onClick={handleAdjust} disabled={!selectedUser || !amount || processing}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              txType === 'credit' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-destructive hover:bg-destructive/90 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}>
            {processing
              ? <><RefreshCw size={14} className="animate-spin" /> Processing...</>
              : <>{txType === 'credit' ? <Plus size={14} /> : <Minus size={14} />} {txType === 'credit' ? 'Credit Wallet' : 'Debit Wallet'}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminWallet;
