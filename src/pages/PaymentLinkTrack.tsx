import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Clock, CheckCircle2, XCircle, Package } from 'lucide-react';

export default function PaymentLinkTrack() {
  const { id } = useParams<{ id: string }>();
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.rpc('get_payment_submission_public', { p_id: id });
      const row = Array.isArray(data) ? data[0] : data;
      if (mounted) { setSub(row || null); setLoading(false); }
    };
    load();
    // Poll for status updates every 10s (replaces realtime, which would require public read)
    const iv = setInterval(load, 10000);
    return () => { mounted = false; clearInterval(iv); };
  }, [id]);

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!sub) return <div className="min-h-screen grid place-items-center p-6"><Card className="max-w-md w-full"><CardContent className="p-8 text-center">সাবমিশন পাওয়া যায়নি</CardContent></Card></div>;

  const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string; msg: string }> = {
    pending:  { icon: Clock,        color: 'text-amber-600',  bg: 'bg-amber-100',  label: 'রিভিউতে আছে',  msg: 'অ্যাডমিন আপনার পেমেন্ট যাচাই করছে। অনুমোদিত হলে অর্ডার নিশ্চিত হবে।' },
    approved: { icon: CheckCircle2, color: 'text-green-600',  bg: 'bg-green-100',  label: 'অনুমোদিত',     msg: 'আপনার অর্ডার নিশ্চিত হয়েছে। ডেলিভারি প্রক্রিয়াধীন।' },
    rejected: { icon: XCircle,      color: 'text-red-600',    bg: 'bg-red-100',    label: 'বাতিল',         msg: 'আপনার সাবমিশন গ্রহণ করা হয়নি।' },
    converted:{ icon: Package,      color: 'text-blue-600',   bg: 'bg-blue-100',   label: 'অর্ডার সম্পন্ন', msg: 'অর্ডার সফল।' },
  };
  const s = statusConfig[sub.status] || statusConfig.pending;
  const Icon = s.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 py-6 px-4">
      <div className="max-w-xl mx-auto space-y-4">
        <Card><CardContent className="p-8 text-center space-y-4">
          <div className={`w-20 h-20 mx-auto rounded-full grid place-items-center ${s.bg}`}>
            <Icon className={`w-10 h-10 ${s.color}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{s.label}</h1>
            <p className="text-sm text-muted-foreground mt-2">{s.msg}</p>
            {sub.admin_note && (
              <p className="text-sm mt-3 p-3 bg-muted/40 rounded">অ্যাডমিন নোট: {sub.admin_note}</p>
            )}
          </div>
          {sub.order_number && (
            <div className="p-4 bg-primary/5 rounded-lg">
              <p className="text-xs text-muted-foreground">অর্ডার নাম্বার</p>
              <p className="text-xl font-bold font-mono text-primary">{sub.order_number}</p>
            </div>
          )}
        </CardContent></Card>

        <Card><CardContent className="p-6 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">পণ্য</span><span className="font-medium">{sub.product_name}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">পরিমাণ</span><span>{sub.quantity}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">মোট</span><span className="font-bold text-primary">৳{Number(sub.total).toLocaleString('bn-BD')}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">পেমেন্ট মেথড</span><span>{sub.payment_method}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Transaction ID</span><span className="font-mono">{sub.transaction_id}</span></div>
        </CardContent></Card>

        <div className="text-center">
          <Link to="/" className="text-sm text-primary underline">হোমে ফিরে যান</Link>
        </div>
      </div>
    </div>
  );
}
