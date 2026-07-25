import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, RefreshCcw, Undo2 } from 'lucide-react';

type Tx = {
  id: string;
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
  order_number: string | null;
  order_id: string | null;
  payer_email: string | null;
  amount: number;
  currency: string;
  status: string;
  mode: string;
  refunded_amount: number;
  paid_at: string | null;
  created_at: string;
};

const statusColor: Record<string, string> = {
  captured: 'bg-emerald-500/20 text-emerald-700',
  created: 'bg-slate-500/20 text-slate-700',
  refunded: 'bg-orange-500/20 text-orange-700',
  partially_refunded: 'bg-amber-500/20 text-amber-700',
  failed: 'bg-rose-500/20 text-rose-700',
};

export default function AdminPayPalTransactions() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [refundTx, setRefundTx] = useState<Tx | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundNote, setRefundNote] = useState('');

  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ['paypal-transactions', search],
    queryFn: async () => {
      let q = supabase.from('paypal_transactions').select('*').order('created_at', { ascending: false }).limit(200);
      if (search.trim()) {
        q = q.or(`order_number.ilike.%${search}%,paypal_order_id.ilike.%${search}%,paypal_capture_id.ilike.%${search}%,payer_email.ilike.%${search}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data as Tx[]) || [];
    },
  });

  const refund = useMutation({
    mutationFn: async () => {
      if (!refundTx) return;
      const body: any = { transactionId: refundTx.id, note: refundNote || undefined };
      if (refundAmount && Number(refundAmount) > 0) body.amount = Number(refundAmount);
      const { data, error } = await supabase.functions.invoke('paypal-refund', { body });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      toast.success('Refund issued');
      setRefundTx(null); setRefundAmount(''); setRefundNote('');
      qc.invalidateQueries({ queryKey: ['paypal-transactions'] });
    },
    onError: (e: any) => toast.error(e.message || 'Refund failed'),
  });

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">PayPal Transactions</h1>
        <div className="flex gap-2">
          <Input placeholder="Search order #, PayPal ID, email…" value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
          <Button variant="outline" size="icon" onClick={() => refetch()}><RefreshCcw className="w-4 h-4" /></Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent transactions ({rows.length})</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left border-b">
                <tr>
                  <th className="p-2">When</th>
                  <th className="p-2">Order</th>
                  <th className="p-2">Payer</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Mode</th>
                  <th className="p-2">PayPal IDs</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(t => (
                  <tr key={t.id} className="border-b hover:bg-muted/40">
                    <td className="p-2 whitespace-nowrap">{new Date(t.created_at).toLocaleString()}</td>
                    <td className="p-2 font-mono text-xs">{t.order_number || '—'}</td>
                    <td className="p-2 text-xs">{t.payer_email || '—'}</td>
                    <td className="p-2 whitespace-nowrap">{Number(t.amount).toFixed(2)} {t.currency}
                      {Number(t.refunded_amount) > 0 && (
                        <div className="text-xs text-orange-600">−{Number(t.refunded_amount).toFixed(2)} refunded</div>
                      )}
                    </td>
                    <td className="p-2"><Badge className={statusColor[t.status] || ''} variant="outline">{t.status}</Badge></td>
                    <td className="p-2 uppercase text-xs">{t.mode}</td>
                    <td className="p-2 text-xs font-mono max-w-[220px] truncate" title={`${t.paypal_order_id}\n${t.paypal_capture_id}`}>
                      {t.paypal_order_id}
                      {t.paypal_capture_id && <div className="text-muted-foreground">C: {t.paypal_capture_id}</div>}
                    </td>
                    <td className="p-2 text-right">
                      {t.status === 'captured' || t.status === 'partially_refunded' ? (
                        <Button size="sm" variant="outline" onClick={() => { setRefundTx(t); setRefundAmount(''); setRefundNote(''); }}>
                          <Undo2 className="w-3.5 h-3.5 mr-1" /> Refund
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!refundTx} onOpenChange={(v) => !v && setRefundTx(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Refund PayPal payment</DialogTitle></DialogHeader>
          {refundTx && (
            <div className="space-y-3">
              <p className="text-sm">Order <b>{refundTx.order_number}</b> — {Number(refundTx.amount).toFixed(2)} {refundTx.currency}</p>
              <div>
                <Label>Amount (leave blank for full refund)</Label>
                <Input value={refundAmount} onChange={e => setRefundAmount(e.target.value)}
                  placeholder={`Max ${(Number(refundTx.amount) - Number(refundTx.refunded_amount)).toFixed(2)}`} />
              </div>
              <div>
                <Label>Note to payer</Label>
                <Input value={refundNote} onChange={e => setRefundNote(e.target.value)} placeholder="Optional" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundTx(null)}>Cancel</Button>
            <Button onClick={() => refund.mutate()} disabled={refund.isPending}>
              {refund.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Confirm Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
