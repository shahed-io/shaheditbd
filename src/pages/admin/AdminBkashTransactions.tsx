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
} from 'lucide-react';

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

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-pink-600" /> Transaction Details
            </DialogTitle>
            <DialogDescription>Full bKash payment record</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <Row label="Status" value={
                <Badge variant="outline" className={(statusBadge[selected.status]?.cls) || ''}>
                  {statusBadge[selected.status]?.label || selected.status}
                </Badge>
              } />
              <Row label="Mode" value={<Badge variant={selected.mode === 'live' ? 'destructive' : 'secondary'}>{selected.mode}</Badge>} />
              <Row label="Order #" value={<span className="font-mono">{selected.order_number || '—'}</span>} />
              <Row label="Payment ID" value={<span className="font-mono text-xs">{selected.payment_id || '—'}</span>} />
              <Row label="TrxID" value={<span className="font-mono text-xs">{selected.trx_id || '—'}</span>} />
              <Row label="Amount" value={<span className="font-semibold">৳{Number(selected.amount).toLocaleString()} {selected.currency}</span>} />
              <Row label="Customer" value={<>
                <div>{selected.customer_name || '—'}</div>
                <div className="text-xs text-muted-foreground">{selected.customer_email}</div>
                <div className="text-xs text-muted-foreground">{selected.customer_phone}</div>
              </>} />
              <Row label="Payer MSISDN" value={<span className="font-mono text-pink-600">{selected.payer_msisdn || '—'}</span>} />
              <Row label="Payer Reference" value={<span className="font-mono text-xs">{selected.payer_reference || '—'}</span>} />
              <Row label="Status Code" value={<span className="font-mono text-xs">{selected.status_code || '—'}</span>} />
              <Row label="Status Message" value={<span className="text-xs">{selected.status_message || '—'}</span>} />
              <Row label="Created" value={format(new Date(selected.created_at), 'dd MMM yyyy, hh:mm:ss a')} />
              <Row label="Paid At" value={selected.paid_at ? format(new Date(selected.paid_at), 'dd MMM yyyy, hh:mm:ss a') : '—'} />

              {selected.raw_execute && (
                <details className="mt-2 border rounded-lg p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">Execute response (raw)</summary>
                  <pre className="mt-2 text-[10px] bg-muted/40 p-2 rounded overflow-x-auto">{JSON.stringify(selected.raw_execute, null, 2)}</pre>
                </details>
              )}
              {selected.raw_create && (
                <details className="border rounded-lg p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">Create response (raw)</summary>
                  <pre className="mt-2 text-[10px] bg-muted/40 p-2 rounded overflow-x-auto">{JSON.stringify(selected.raw_create, null, 2)}</pre>
                </details>
              )}
            </div>
          )}
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2 border-b last:border-0">
      <div className="text-xs uppercase text-muted-foreground font-semibold">{label}</div>
      <div className="col-span-2">{value}</div>
    </div>
  );
}
