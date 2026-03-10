import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  CreditCard, Search, Filter, CheckCircle2, XCircle, Clock,
  Eye, RefreshCw, ChevronDown, ExternalLink, ImageIcon, BadgeCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type PaymentProof = {
  id: string;
  order_id: string;
  transaction_id: string;
  payment_method: string;
  amount: number | null;
  status: string;
  screenshot_url: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
  user_id: string | null;
  orders?: { order_number: string; customer_name: string; customer_email: string; total: number } | null;
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:  { label: 'Pending',  color: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-500/15 text-green-500 border-green-500/30',   icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-destructive/15 text-destructive border-destructive/30', icon: XCircle },
};

const methodLabels: Record<string, string> = {
  bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket', bank: 'Bank Transfer',
};

export default function AdminPayments() {
  const qc = useQueryClient();
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('all');
  const [selected, setSelected]     = useState<PaymentProof | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [imgOpen, setImgOpen]       = useState(false);

  const { data: payments = [], isLoading, refetch } = useQuery({
    queryKey: ['payment-proofs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_proofs')
        .select(`*, orders(order_number, customer_name, customer_email, total)`)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return data as PaymentProof[];
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const { error } = await supabase
        .from('payment_proofs')
        .update({ status, admin_notes: notes, reviewed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;

      // Also update order payment_status
      if (selected) {
        await supabase
          .from('orders')
          .update({ payment_status: status === 'approved' ? 'paid' : 'failed' })
          .eq('id', selected.order_id);
      }
    },
    onSuccess: (_, vars) => {
      toast.success(`Payment ${vars.status === 'approved' ? 'approved' : 'rejected'} successfully`);
      qc.invalidateQueries({ queryKey: ['payment-proofs'] });
      setSelected(null);
    },
    onError: () => toast.error('Action failed, please try again'),
  });

  const filtered = payments.filter(p => {
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || p.transaction_id.toLowerCase().includes(q)
      || (p.orders?.order_number ?? '').toLowerCase().includes(q)
      || (p.orders?.customer_name ?? '').toLowerCase().includes(q)
      || (p.orders?.customer_email ?? '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    all: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    approved: payments.filter(p => p.status === 'approved').length,
    rejected: payments.filter(p => p.status === 'rejected').length,
  };

  const openReview = (p: PaymentProof) => {
    setSelected(p);
    setAdminNotes(p.admin_notes ?? '');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard size={24} className="text-primary" />
            Payments
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Payment proof verification & management</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(s => {
          const cfg = s === 'all'
            ? { label: 'Total', color: 'text-primary', bg: 'bg-primary/10', icon: CreditCard }
            : statusConfig[s];
          const Icon = cfg.icon;
          return (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`glass-card rounded-xl p-4 text-left transition-all border ${
                statusFilter === s ? 'border-primary/50 bg-primary/5' : 'border-border/50 hover:border-primary/30'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg ${s === 'all' ? 'bg-primary/10' : ''} flex items-center justify-center mb-2`}>
                <Icon size={18} className={s === 'all' ? 'text-primary' : cfg.color.split(' ')[1]} />
              </div>
              <div className="text-2xl font-bold text-foreground">{counts[s]}</div>
              <div className="text-xs text-muted-foreground capitalize mt-0.5">{s === 'all' ? 'All Payments' : cfg.label}</div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by transaction ID, order, customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-muted/30"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatus}>
          <SelectTrigger className="w-40 bg-muted/30">
            <Filter size={14} className="mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl border border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <RefreshCw size={20} className="animate-spin mr-2" /> Loading payments...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <CreditCard size={26} className="text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">No payment proofs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  {['Transaction ID', 'Order', 'Customer', 'Method', 'Amount', 'Submitted', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const cfg = statusConfig[p.status] ?? statusConfig.pending;
                  const Icon = cfg.icon;
                  return (
                    <tr key={p.id} className={`border-b border-border/30 transition-colors hover:bg-muted/20 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                      <td className="px-4 py-3 font-mono text-xs text-primary font-medium">{p.transaction_id}</td>
                      <td className="px-4 py-3 text-xs font-medium">{p.orders?.order_number ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium truncate max-w-[130px]">{p.orders?.customer_name ?? '—'}</div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[130px]">{p.orders?.customer_email ?? ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                          {methodLabels[p.payment_method] ?? p.payment_method}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {p.amount != null ? `৳${p.amount.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(p.submitted_at), 'dd MMM, hh:mm a')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.color}`}>
                          <Icon size={11} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline" onClick={() => openReview(p)} className="h-7 text-xs gap-1">
                          <Eye size={12} /> Review
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgeCheck size={18} className="text-primary" />
              Payment Review
            </DialogTitle>
          </DialogHeader>

          {selected && (() => {
            const cfg = statusConfig[selected.status] ?? statusConfig.pending;
            const Icon = cfg.icon;
            return (
              <div className="space-y-4">
                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="glass-card rounded-lg p-3 border border-border/50">
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Transaction ID</div>
                    <div className="font-mono text-xs text-primary font-bold">{selected.transaction_id}</div>
                  </div>
                  <div className="glass-card rounded-lg p-3 border border-border/50">
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Order</div>
                    <div className="font-semibold text-xs">{selected.orders?.order_number ?? '—'}</div>
                  </div>
                  <div className="glass-card rounded-lg p-3 border border-border/50">
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Customer</div>
                    <div className="font-semibold text-xs truncate">{selected.orders?.customer_name ?? '—'}</div>
                  </div>
                  <div className="glass-card rounded-lg p-3 border border-border/50">
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Amount</div>
                    <div className="font-bold text-sm text-primary">
                      {selected.amount != null ? `৳${selected.amount.toLocaleString()}` : '—'}
                    </div>
                  </div>
                  <div className="glass-card rounded-lg p-3 border border-border/50">
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Method</div>
                    <div className="font-medium text-xs">{methodLabels[selected.payment_method] ?? selected.payment_method}</div>
                  </div>
                  <div className="glass-card rounded-lg p-3 border border-border/50">
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Status</div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.color}`}>
                      <Icon size={11} />{cfg.label}
                    </span>
                  </div>
                </div>

                {/* Screenshot */}
                {selected.screenshot_url ? (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Payment Screenshot</div>
                    <div
                      className="relative rounded-xl border border-border/50 overflow-hidden cursor-pointer group"
                      onClick={() => setImgOpen(true)}
                    >
                      <img
                        src={selected.screenshot_url}
                        alt="Payment proof"
                        className="w-full max-h-48 object-contain bg-muted/30"
                      />
                      <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ExternalLink size={20} className="text-foreground" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50 text-muted-foreground text-xs">
                    <ImageIcon size={14} /> No screenshot uploaded
                  </div>
                )}

                {/* Admin notes */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">Admin Notes</label>
                  <Textarea
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    placeholder="Add notes (optional)..."
                    rows={2}
                    className="bg-muted/30 text-sm resize-none"
                  />
                </div>
              </div>
            );
          })()}

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setSelected(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => reviewMutation.mutate({ id: selected!.id, status: 'rejected', notes: adminNotes })}
              disabled={reviewMutation.isPending || selected?.status === 'rejected'}
              className="flex-1 gap-1"
            >
              <XCircle size={14} /> Reject
            </Button>
            <Button
              onClick={() => reviewMutation.mutate({ id: selected!.id, status: 'approved', notes: adminNotes })}
              disabled={reviewMutation.isPending || selected?.status === 'approved'}
              className="flex-1 gap-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 size={14} /> Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full image viewer */}
      <Dialog open={imgOpen} onOpenChange={setImgOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Payment Screenshot</DialogTitle></DialogHeader>
          {selected?.screenshot_url && (
            <img src={selected.screenshot_url} alt="Payment screenshot" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
