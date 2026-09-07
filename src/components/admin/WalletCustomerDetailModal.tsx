import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  X, TrendingUp, TrendingDown, Wallet, ShoppingBag, Download, Search,
  RefreshCw, Calendar, Hash, FileText, Package, ArrowUpRight, ArrowDownRight,
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
}

interface OrderInfo {
  id: string;
  order_number: string | null;
  total: number | null;
  status: string | null;
  created_at: string;
  items?: Array<{ product_name: string | null; quantity: number; price: number }>;
}

interface Props {
  customer: Customer;
  onClose: () => void;
}

export default function WalletCustomerDetailModal({ customer, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<Record<string, OrderInfo>>({});
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', customer.user_id)
      .order('created_at', { ascending: false })
      .limit(500);
    const list = (data || []) as Transaction[];
    setTxs(list);

    // Fetch related orders (debits with UUID reference_id)
    const orderIds = list
      .filter(t => t.type === 'debit' && t.reference_id && /^[0-9a-f-]{36}$/i.test(t.reference_id))
      .map(t => t.reference_id as string);
    if (orderIds.length > 0) {
      const { data: ords } = await supabase
        .from('orders')
        .select('id, order_number, total, status, created_at')
        .in('id', orderIds);
      const { data: items } = await supabase
        .from('order_items')
        .select('order_id, product_name, quantity, price')
        .in('order_id', orderIds);
      const itemMap: Record<string, OrderInfo['items']> = {};
      (items || []).forEach((it: any) => {
        (itemMap[it.order_id] ||= []).push({
          product_name: it.product_name,
          quantity: it.quantity,
          price: Number(it.price),
        });
      });
      const map: Record<string, OrderInfo> = {};
      (ords || []).forEach((o: any) => {
        map[o.id] = { ...o, total: Number(o.total), items: itemMap[o.id] };
      });
      setOrders(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [customer.user_id]);

  const stats = useMemo(() => {
    const credits = txs.filter(t => t.type === 'credit');
    const debits = txs.filter(t => t.type === 'debit');
    return {
      totalCredit: credits.reduce((s, t) => s + Number(t.amount), 0),
      totalDebit: debits.reduce((s, t) => s + Number(t.amount), 0),
      creditCount: credits.length,
      debitCount: debits.length,
      orderCount: debits.filter(t => t.reference_id && orders[t.reference_id]).length,
    };
  }, [txs, orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return txs.filter(t => {
      if (filter !== 'all' && t.type !== filter) return false;
      if (!q) return true;
      const orderNum = t.reference_id ? orders[t.reference_id]?.order_number || '' : '';
      return (
        t.note?.toLowerCase().includes(q) ||
        t.reference_id?.toLowerCase().includes(q) ||
        orderNum.toLowerCase().includes(q) ||
        t.created_by?.toLowerCase().includes(q)
      );
    });
  }, [txs, filter, search, orders]);

  const exportCSV = () => {
    const rows = [
      ['Date/Time', 'Type', 'Amount', 'Balance After', 'Source', 'Order #', 'Note', 'Reference', 'By'],
      ...filtered.map(t => {
        const ord = t.reference_id ? orders[t.reference_id] : undefined;
        return [
          new Date(t.created_at).toLocaleString(),
          t.type,
          String(t.amount),
          String(t.balance_after),
          ord ? 'Order Purchase' : (t.type === 'credit' ? 'Top-up / Credit' : 'Debit'),
          ord?.order_number || '',
          t.note || '',
          t.reference_id || '',
          t.created_by || '',
        ];
      }),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-${customer.email || customer.user_id}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent px-6 py-5 text-primary-foreground">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-lg font-bold flex-shrink-0">
                {(customer.display_name || customer.email || '?')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold truncate flex items-center gap-2">
                  <Wallet size={18} /> {customer.display_name || 'Unknown'}
                </h2>
                <p className="text-xs opacity-90 truncate">{customer.email}</p>
                <p className="text-[10px] opacity-70 font-mono truncate">UID: {customer.user_id}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/15 transition flex-shrink-0">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 border-b border-border bg-muted/20">
          <Stat icon={Wallet} label="Current" value={`৳${(customer.wallet_balance || 0).toLocaleString()}`} color="text-primary" />
          <Stat icon={TrendingUp} label="Total Credit" value={`৳${stats.totalCredit.toLocaleString()}`} color="text-green-600" sub={`${stats.creditCount} tx`} />
          <Stat icon={TrendingDown} label="Total Debit" value={`৳${stats.totalDebit.toLocaleString()}`} color="text-destructive" sub={`${stats.debitCount} tx`} />
          <Stat icon={ShoppingBag} label="Order Spends" value={String(stats.orderCount)} color="text-cyan-600" />
          <Stat icon={Hash} label="Net Flow" value={`৳${(stats.totalCredit - stats.totalDebit).toLocaleString()}`} color={stats.totalCredit >= stats.totalDebit ? 'text-green-600' : 'text-destructive'} />
        </div>

        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-border flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search note, order #, reference, by..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-muted/40 border border-border focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-1 p-1 rounded-lg bg-muted/30 border border-border">
            {(['all', 'credit', 'debit'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  filter === f ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}>
                {f === 'all' ? 'All' : f === 'credit' ? 'Credits' : 'Debits'}
              </button>
            ))}
          </div>
          <button onClick={load} className="px-3 py-2 rounded-lg border border-border text-xs hover:bg-muted/40 flex items-center gap-1.5">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={exportCSV} disabled={filtered.length === 0}
            className="px-3 py-2 rounded-lg border border-border text-xs hover:bg-muted/40 flex items-center gap-1.5 disabled:opacity-50">
            <Download size={12} /> CSV
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-center text-muted-foreground text-sm py-12">Loading transaction history...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-12">No transactions match the filter.</div>
          ) : (
            filtered.map(tx => {
              const isCredit = tx.type === 'credit';
              const ord = tx.reference_id ? orders[tx.reference_id] : undefined;
              return (
                <div key={tx.id} className="border border-border rounded-xl p-3 hover:border-primary/40 transition bg-card">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isCredit ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'
                    }`}>
                      {isCredit ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {ord ? (
                              <span className="flex items-center gap-1.5 flex-wrap">
                                <ShoppingBag size={13} className="text-cyan-600" />
                                Order Purchase
                                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600">
                                  {ord.order_number}
                                </span>
                              </span>
                            ) : (
                              tx.note || (isCredit ? 'Credit' : 'Debit')
                            )}
                          </p>
                          {ord && tx.note && (
                            <p className="text-xs text-muted-foreground mt-0.5">{tx.note}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(tx.created_at).toLocaleString()}</span>
                            <span className="flex items-center gap-1"><FileText size={11} /> by {tx.created_by || 'system'}</span>
                            {tx.reference_id && (
                              <span className="flex items-center gap-1 font-mono"><Hash size={11} /> {tx.reference_id.slice(0, 12)}…</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-base font-bold ${isCredit ? 'text-green-600' : 'text-destructive'}`}>
                            {isCredit ? '+' : '−'}৳{Number(tx.amount).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Bal: ৳{Number(tx.balance_after).toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Order items breakdown */}
                      {ord?.items && ord.items.length > 0 && (
                        <div className="mt-2 ml-0 p-2 rounded-lg bg-muted/30 border border-border/60">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
                            <Package size={10} /> Purchased Items
                          </p>
                          <div className="space-y-1">
                            {ord.items.map((it, i) => (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <span className="text-foreground truncate">
                                  {it.product_name || 'Item'} <span className="text-muted-foreground">× {it.quantity}</span>
                                </span>
                                <span className="font-medium text-foreground">৳{(it.price * it.quantity).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                          {ord.status && (
                            <div className="mt-1.5 pt-1.5 border-t border-border/60 flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground">Order Status</span>
                              <span className="font-semibold uppercase text-foreground">{ord.status}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 border-t border-border text-[11px] text-muted-foreground text-center">
          Showing {filtered.length} of {txs.length} transactions
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color, sub }: { icon: any; label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        <Icon size={11} /> {label}
      </div>
      <p className={`text-base font-bold mt-0.5 ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
