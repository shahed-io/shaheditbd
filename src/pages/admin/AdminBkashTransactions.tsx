import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Search, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle,
  Eye, Smartphone, Hash, Receipt, Wallet, Filter, Download,
  Copy, User, Mail, Phone, CreditCard, Calendar, CheckCheck,
} from 'lucide-react';
import { toast } from 'sonner';

type Tx = {
  id: string;
  payment_id: string | null;
  trx_id: string | null;
  order_id: string | null;
  order_number: string | null;
  user_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  payer_msisdn: string | null;
  payer_reference: string | null;
  amount: number;
  currency: string;
  status: 'initiated' | 'completed' | 'failed' | 'cancelled' | string;
  mode: 'sandbox' | 'live' | string;
  status_code: string | null;
  status_message: string | null;
  raw_create: any;
  raw_execute: any;
  paid_at: string | null;
  created_at: string;
};

const statusBadge: Record<string, { label: string; cls: string; icon: any }> = {
  completed: { label: 'Completed', cls: 'bg-green-500/15 text-green-600 border-green-500/30', icon: CheckCircle2 },
  initiated: { label: 'Initiated', cls: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30', icon: Clock },
  failed:    { label: 'Failed',    cls: 'bg-red-500/15 text-red-600 border-red-500/30',         icon: XCircle },
  cancelled: { label: 'Cancelled', cls: 'bg-zinc-500/15 text-zinc-600 border-zinc-500/30',      icon: AlertTriangle },
};

export default function AdminBkashTransactions() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [mode, setMode] = useState<string>('all');
  const [selected, setSelected] = useState<Tx | null>(null);

  const { data: txs = [], isLoading, isFetching } = useQuery({
    queryKey: ['bkash-transactions'],
    queryFn: async (): Promise<Tx[]> => {
      const { data, error } = await supabase
        .from('bkash_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data as Tx[]) || [];
    },
    refetchInterval: 30_000,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return txs.filter(t => {
      if (status !== 'all' && t.status !== status) return false;
      if (mode !== 'all' && t.mode !== mode) return false;
      if (!q) return true;
      return (
        t.payment_id?.toLowerCase().includes(q) ||
        t.trx_id?.toLowerCase().includes(q) ||
        t.order_number?.toLowerCase().includes(q) ||
        t.customer_name?.toLowerCase().includes(q) ||
        t.customer_email?.toLowerCase().includes(q) ||
        t.customer_phone?.toLowerCase().includes(q) ||
        t.payer_msisdn?.toLowerCase().includes(q) ||
        t.payer_reference?.toLowerCase().includes(q)
      );
    });
  }, [txs, search, status, mode]);

  const stats = useMemo(() => {
    const completed = txs.filter(t => t.status === 'completed');
    return {
      total: txs.length,
      completed: completed.length,
      failed: txs.filter(t => t.status === 'failed').length,
      revenue: completed.reduce((s, t) => s + Number(t.amount || 0), 0),
    };
  }, [txs]);

  const exportCSV = () => {
    const rows = [
      ['Date', 'Payment ID', 'TrxID', 'Order #', 'Customer', 'Phone', 'Payer MSISDN', 'Amount', 'Status', 'Mode'],
      ...filtered.map(t => [
        format(new Date(t.created_at), 'yyyy-MM-dd HH:mm'),
        t.payment_id || '',
        t.trx_id || '',
        t.order_number || '',
        t.customer_name || '',
        t.customer_phone || '',
        t.payer_msisdn || '',
        String(t.amount),
        t.status,
        t.mode,
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bkash-transactions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-pink-600" />
            bKash Transactions
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete history of every bKash Online payment (initiated, completed, failed).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => qc.invalidateQueries({ queryKey: ['bkash-transactions'] })}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} cls="text-foreground" />
        <StatCard label="Completed" value={stats.completed} cls="text-green-600" />
        <StatCard label="Failed" value={stats.failed} cls="text-red-600" />
        <StatCard label="Revenue (৳)" value={stats.revenue.toLocaleString()} cls="text-pink-600" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by TrxID, Payment ID, order #, name, email, phone, payer number…"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-44"><Filter className="h-4 w-4 mr-1" /><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="initiated">Initiated</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Mode" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="sandbox">Sandbox</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment History</CardTitle>
          <CardDescription>{filtered.length} of {txs.length} transactions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No bKash transactions yet. They will appear here automatically after the first customer pays online.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Order</th>
                    <th className="text-left p-3">Customer</th>
                    <th className="text-left p-3">Payer Number</th>
                    <th className="text-left p-3">TrxID</th>
                    <th className="text-right p-3">Amount</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Mode</th>
                    <th className="text-right p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => {
                    const s = statusBadge[t.status] || { label: t.status, cls: 'bg-muted text-foreground', icon: Clock };
                    const SIcon = s.icon;
                    return (
                      <tr key={t.id} className="border-t hover:bg-muted/30">
                        <td className="p-3 whitespace-nowrap text-xs">
                          {format(new Date(t.created_at), 'dd MMM yyyy')}
                          <div className="text-muted-foreground">{format(new Date(t.created_at), 'hh:mm a')}</div>
                        </td>
                        <td className="p-3 font-mono text-xs">
                          {t.order_number || <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{t.customer_name || '—'}</div>
                          <div className="text-xs text-muted-foreground">{t.customer_phone || t.customer_email || ''}</div>
                        </td>
                        <td className="p-3 font-mono text-xs">
                          {t.payer_msisdn ? (
                            <span className="inline-flex items-center gap-1 text-pink-600">
                              <Smartphone className="h-3 w-3" /> {t.payer_msisdn}
                            </span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="p-3 font-mono text-xs">
                          {t.trx_id || <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="p-3 text-right font-semibold">৳{Number(t.amount).toLocaleString()}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={`${s.cls} gap-1`}>
                            <SIcon className="h-3 w-3" /> {s.label}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs uppercase">
                          <Badge variant={t.mode === 'live' ? 'destructive' : 'secondary'}>{t.mode}</Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="icon" onClick={() => setSelected(t)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog — premium redesign */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-gradient-to-br from-white via-pink-50/30 to-rose-50/40 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border-pink-200/50 dark:border-pink-900/30">
          {selected && (() => {
            const st = statusBadge[selected.status];
            const StatusIcon = st?.icon || Clock;
            const isSuccess = selected.status === 'completed';
            return (
              <>
                {/* Premium gradient header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 px-6 pt-6 pb-20 text-white">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 0%, transparent 40%), radial-gradient(circle at 80% 80%, white 0%, transparent 40%)' }} />
                  <DialogHeader className="relative space-y-1">
                    <DialogTitle className="flex items-center gap-2 text-white text-lg">
                      <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                        <Receipt className="h-5 w-5" />
                      </div>
                      bKash Transaction
                    </DialogTitle>
                    <DialogDescription className="text-pink-100/90 text-xs">
                      {selected.order_number || 'Payment record'} • {format(new Date(selected.created_at), 'dd MMM yyyy, hh:mm a')}
                    </DialogDescription>
                  </DialogHeader>
                </div>

                {/* Floating amount card */}
                <div className="px-6 -mt-14 relative">
                  <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-pink-200/60 dark:border-zinc-800 shadow-xl p-5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Amount Paid</div>
                      <div className="text-3xl font-bold text-pink-600 mt-1">৳{Number(selected.amount).toLocaleString()}<span className="text-sm font-normal text-muted-foreground ml-1">{selected.currency}</span></div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className={`${st?.cls || ''} font-semibold gap-1 px-3 py-1`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {st?.label || selected.status}
                      </Badge>
                      <Badge variant={selected.mode === 'live' ? 'destructive' : 'secondary'} className="text-[10px] uppercase">
                        {selected.mode} mode
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-5 space-y-4">
                  {/* Transaction IDs */}
                  <SectionCard icon={Hash} title="Transaction IDs" tint="pink">
                    <CopyRow label="TrxID" value={selected.trx_id} highlight />
                    <CopyRow label="Payment ID" value={selected.payment_id} mono />
                    <CopyRow label="Order #" value={selected.order_number} mono />
                  </SectionCard>

                  {/* Payer */}
                  <SectionCard icon={Smartphone} title="Payer Information" tint="rose">
                    <CopyRow label="Payer Number" value={selected.payer_msisdn} highlight />
                    <CopyRow label="Payer Reference" value={selected.payer_reference} mono />
                  </SectionCard>

                  {/* Customer */}
                  <SectionCard icon={User} title="Customer" tint="violet">
                    <InfoRow icon={User} label="Name" value={selected.customer_name} />
                    <InfoRow icon={Mail} label="Email" value={selected.customer_email} />
                    <InfoRow icon={Phone} label="Phone" value={selected.customer_phone} />
                  </SectionCard>

                  {/* Gateway response */}
                  <SectionCard icon={CreditCard} title="Gateway Response" tint="slate">
                    <InfoRow label="Status Code" value={selected.status_code} mono />
                    <InfoRow label="Status Message" value={selected.status_message} />
                    <InfoRow icon={Calendar} label="Created" value={format(new Date(selected.created_at), 'dd MMM yyyy, hh:mm:ss a')} />
                    {selected.paid_at && <InfoRow icon={CheckCheck} label="Paid At" value={format(new Date(selected.paid_at), 'dd MMM yyyy, hh:mm:ss a')} />}
                  </SectionCard>

                  {/* Raw responses */}
                  {(selected.raw_execute || selected.raw_create) && (
                    <div className="space-y-2">
                      {selected.raw_execute && (
                        <details className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur p-3">
                          <summary className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground">Execute response (raw JSON)</summary>
                          <pre className="mt-2 text-[10px] bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg overflow-x-auto border border-zinc-200 dark:border-zinc-800">{JSON.stringify(selected.raw_execute, null, 2)}</pre>
                        </details>
                      )}
                      {selected.raw_create && (
                        <details className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur p-3">
                          <summary className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground">Create response (raw JSON)</summary>
                          <pre className="mt-2 text-[10px] bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg overflow-x-auto border border-zinc-200 dark:border-zinc-800">{JSON.stringify(selected.raw_create, null, 2)}</pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, cls }: { label: string; value: string | number; cls: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs uppercase text-muted-foreground font-semibold">{label}</div>
        <div className={`text-2xl font-bold mt-1 ${cls}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

const tintMap: Record<string, string> = {
  pink: 'from-pink-500/10 to-rose-500/5 border-pink-200/60 dark:border-pink-900/40 text-pink-600',
  rose: 'from-rose-500/10 to-pink-500/5 border-rose-200/60 dark:border-rose-900/40 text-rose-600',
  violet: 'from-violet-500/10 to-purple-500/5 border-violet-200/60 dark:border-violet-900/40 text-violet-600',
  slate: 'from-slate-500/10 to-zinc-500/5 border-slate-200/60 dark:border-slate-800/60 text-slate-600 dark:text-slate-300',
};

function SectionCard({ icon: Icon, title, tint, children }: { icon: any; title: string; tint: string; children: React.ReactNode }) {
  const cls = tintMap[tint] || tintMap.pink;
  const [grad, border, text] = [cls, cls, cls];
  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${cls} backdrop-blur-sm overflow-hidden`}>
      <div className={`flex items-center gap-2 px-4 py-2.5 border-b border-current/10 ${text.split(' ').filter(c=>c.startsWith('text-')).join(' ')}`}>
        <Icon className="h-4 w-4" />
        <span className="text-xs font-bold uppercase tracking-wide">{title}</span>
      </div>
      <div className="bg-white/70 dark:bg-zinc-900/70 divide-y divide-zinc-100 dark:divide-zinc-800">
        {children}
      </div>
    </div>
  );
}

function CopyRow({ label, value, mono, highlight }: { label: string; value: string | null; mono?: boolean; highlight?: boolean }) {
  const copy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 group">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`truncate ${mono ? 'font-mono text-xs' : 'text-sm'} ${highlight ? 'text-pink-600 font-semibold' : 'text-foreground'}`}>
          {value || '—'}
        </span>
        {value && (
          <button onClick={copy} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-pink-500/10 text-muted-foreground hover:text-pink-600">
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: { icon?: any; label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold shrink-0">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      <span className={`${mono ? 'font-mono text-xs' : 'text-sm'} text-foreground text-right truncate`}>{value || '—'}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2 border-b last:border-0">
      <div className="text-xs uppercase text-muted-foreground font-semibold">{label}</div>
      <div className="col-span-2">{value}</div>
    </div>
  );
}
