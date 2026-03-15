import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Wallet, Plus, Minus, Search, RefreshCw, TrendingUp, TrendingDown, History, Users } from 'lucide-react';

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

const AdminWallet = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingTx, setLoadingTx] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<Customer | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [txType, setTxType] = useState<'credit' | 'debit'>('credit');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'customers' | 'transactions'>('customers');

  useEffect(() => { fetchCustomers(); fetchAllTransactions(); }, []);

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
    // Fetch profile info separately
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

  const handleAdjust = async () => {
    if (!selectedUser) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('সঠিক পরিমাণ দিন'); return; }

    setProcessing(true);
    try {
      const fnName = txType === 'credit' ? 'wallet_credit' : 'wallet_debit';
      const { data, error } = await supabase.rpc(fnName as any, {
        p_user_id: selectedUser.user_id,
        p_amount: amt,
        p_note: note || (txType === 'credit' ? 'Admin কর্তৃক টপ-আপ' : 'Admin কর্তৃক কাটা'),
        p_reference_id: null,
        p_created_by: 'admin',
      });

      if (error || !(data as any)?.success) {
        toast.error((data as any)?.error || 'ব্যর্থ হয়েছে');
        return;
      }

      toast.success(`✅ ৳${amt} ${txType === 'credit' ? 'যোগ' : 'কাটা'} হয়েছে`);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="text-primary" size={24} /> Wallet Manager
          </h1>
          <p className="text-muted-foreground text-sm mt-1">কাস্টমারদের ওয়ালেট ব্যালেন্স পরিচালনা করুন</p>
        </div>
        <button onClick={() => { fetchCustomers(); fetchAllTransactions(); }} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted/40 transition-colors text-muted-foreground">
          <RefreshCw size={14} /> রিফ্রেশ
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet size={18} className="text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">মোট ওয়ালেট ব্যালেন্স</span>
          </div>
          <p className="text-2xl font-bold text-foreground">৳{totalWalletBalance.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <TrendingUp size={18} className="text-green-500" />
            </div>
            <span className="text-sm text-muted-foreground">মোট ক্রেডিট</span>
          </div>
          <p className="text-2xl font-bold text-green-500">৳{totalCredits.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <TrendingDown size={18} className="text-destructive" />
            </div>
            <span className="text-sm text-muted-foreground">মোট ডেবিট</span>
          </div>
          <p className="text-2xl font-bold text-destructive">৳{totalDebits.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Left: Customer list + transactions */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-muted/30 border border-border w-fit">
            {[
              { id: 'customers', label: 'কাস্টমার', icon: Users },
              { id: 'transactions', label: 'লেনদেন ইতিহাস', icon: History },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'customers' && (
            <div className="glass-card rounded-2xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-muted/30 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                {loadingCustomers ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">লোড হচ্ছে...</div>
                ) : filtered.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">কোনো কাস্টমার পাওয়া যায়নি</div>
                ) : (
                  filtered.map(c => (
                    <div
                      key={c.user_id}
                      onClick={() => setSelectedUser(c)}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors ${selectedUser?.user_id === c.user_id ? 'bg-primary/10 border-l-2 border-primary' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-xs font-bold text-primary">
                          {(c.display_name || c.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.display_name || 'অজানা'}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${c.wallet_balance > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                          ৳{(c.wallet_balance || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">ব্যালেন্স</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="glass-card rounded-2xl border border-border overflow-hidden">
              <div className="divide-y divide-border max-h-[560px] overflow-y-auto">
                {loadingTx ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">লোড হচ্ছে...</div>
                ) : transactions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">কোনো লেনদেন নেই</div>
                ) : (
                  transactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'credit' ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                          {tx.type === 'credit'
                            ? <TrendingUp size={14} className="text-green-500" />
                            : <TrendingDown size={14} className="text-destructive" />
                          }
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {(tx as any).profiles?.display_name || (tx as any).profiles?.email || tx.user_id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-muted-foreground">{tx.note || '—'} · {new Date(tx.created_at).toLocaleDateString('bn-BD')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${tx.type === 'credit' ? 'text-green-500' : 'text-destructive'}`}>
                          {tx.type === 'credit' ? '+' : '-'}৳{tx.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">ব্যাল: ৳{tx.balance_after.toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Adjust wallet */}
        <div className="glass-card rounded-2xl border border-border p-6 h-fit space-y-5">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Wallet size={16} className="text-primary" /> ওয়ালেট অ্যাডজাস্ট
          </h2>

          {/* Selected user */}
          {selectedUser ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                {(selectedUser.display_name || selectedUser.email || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{selectedUser.display_name || 'অজানা'}</p>
                <p className="text-xs text-muted-foreground truncate">{selectedUser.email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-primary">৳{(selectedUser.wallet_balance || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">ব্যালেন্স</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border text-center text-sm text-muted-foreground">
              বাম দিক থেকে একজন কাস্টমার সিলেক্ট করুন
            </div>
          )}

          {/* Type toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setTxType('credit')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                txType === 'credit'
                  ? 'bg-green-500 text-white shadow'
                  : 'border border-border text-muted-foreground hover:border-green-500/50'
              }`}
            >
              <Plus size={14} /> ক্রেডিট
            </button>
            <button
              onClick={() => setTxType('debit')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                txType === 'debit'
                  ? 'bg-destructive text-white shadow'
                  : 'border border-border text-muted-foreground hover:border-destructive/50'
              }`}
            >
              <Minus size={14} /> ডেবিট
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">পরিমাণ (৳)</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="যেমন: 500"
              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>

          {/* Quick amounts */}
          <div className="flex flex-wrap gap-2">
            {[100, 200, 500, 1000, 2000].map(v => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                className="px-3 py-1.5 rounded-lg text-xs border border-border hover:border-primary/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
              >
                ৳{v}
              </button>
            ))}
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">নোট (ঐচ্ছিক)</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="কারণ লিখুন..."
              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>

          <button
            onClick={handleAdjust}
            disabled={!selectedUser || !amount || processing}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              txType === 'credit'
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-destructive hover:bg-destructive/90 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {processing ? (
              <><RefreshCw size={14} className="animate-spin" /> প্রসেস হচ্ছে...</>
            ) : (
              <>{txType === 'credit' ? <Plus size={14} /> : <Minus size={14} />}
                {txType === 'credit' ? 'ক্রেডিট করুন' : 'ডেবিট করুন'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminWallet;
