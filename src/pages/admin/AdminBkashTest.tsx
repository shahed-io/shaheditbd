import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminBkashTest() {
  const [amount, setAmount] = useState('10');
  const [name, setName] = useState('bKash Test');
  const [email, setEmail] = useState('test@shahedstore.com.bd');
  const [phone, setPhone] = useState('01700000000');
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const append = (m: string) => setLog((p) => [...p, `${new Date().toLocaleTimeString()} — ${m}`]);

  const runTest = async () => {
    setError(null);
    setLog([]);
    setLoading(true);
    try {
      const amt = Number(amount);
      if (!amt || amt < 1) throw new Error('Amount must be ≥ 1');

      const orderNum = 'TEST-' + Array.from(crypto.getRandomValues(new Uint8Array(5)))
        .map((b) => b.toString(36)).join('').toUpperCase().slice(0, 8);
      append(`Creating test order ${orderNum}…`);

      const { data: { user } } = await supabase.auth.getUser();

      const { data: order, error: oErr } = await supabase.from('orders').insert({
        order_number: orderNum,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        subtotal: amt,
        discount_amount: 0,
        total: amt,
        payment_method: 'bkash_online',
        transaction_id: `BKASH-PENDING-${orderNum}`,
        status: 'pending',
        payment_status: 'pending',
        user_id: user?.id || null,
        notes: '[bKash Auto Pay TEST ORDER — admin]',
      } as any).select().single();
      if (oErr) throw oErr;
      append(`Order created: ${order.id}`);

      append('Calling bkash-create-payment…');
      const callbackURL = `${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/bkash-callback`;
      const { data: bk, error: bkErr } = await supabase.functions.invoke('bkash-create-payment', {
        body: { orderId: order.id, amount: amt, callbackURL },
      });
      if (bkErr || !bk?.bkashURL) throw new Error(bk?.error || bkErr?.message || 'bKash gateway init failed');
      append(`paymentID: ${bk.paymentID}`);
      append('Redirecting to bKash gateway in 1s…');
      setTimeout(() => { window.location.href = bk.bkashURL; }, 1000);
    } catch (e: any) {
      const msg = e?.message || String(e);
      setError(msg);
      append(`ERROR: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="text-pink-600" /> bKash Auto Pay — Test
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          One-click test: creates a minimal order and redirects to the live bKash gateway.
          Use a small amount (e.g. ৳10) to verify redirect + auto-delivery callback.
        </p>
      </div>

      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Amount (BDT)</Label>
            <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <Button onClick={runTest} disabled={loading} className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white">
          {loading ? <Loader2 className="animate-spin mr-2" /> : <Zap className="mr-2" />}
          {loading ? 'Processing…' : 'Run Test Payment'}
        </Button>

        {error && (
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded">
            <AlertCircle className="w-4 h-4 mt-0.5" /> <span>{error}</span>
          </div>
        )}

        {log.length > 0 && (
          <div className="bg-muted rounded p-3 text-xs font-mono space-y-1 max-h-64 overflow-auto">
            {log.map((l, i) => (
              <div key={i} className="flex gap-2">
                <CheckCircle2 className="w-3 h-3 mt-0.5 text-green-600 shrink-0" />
                <span>{l}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 text-xs text-muted-foreground space-y-1">
        <p><strong>Flow:</strong> create order → invoke <code>bkash-create-payment</code> → redirect to bKash → on success, <code>bkash-callback</code> executes payment, marks order paid, triggers email + telegram.</p>
        <p>After payment, you'll be redirected back to <code>/checkout?bkash=success&order=…</code>. Check <code>/ceo/orders</code> to confirm status = processing & payment = paid.</p>
      </Card>
    </div>
  );
}
