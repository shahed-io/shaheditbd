import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function UddoktapayReturn() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<'verifying' | 'paid' | 'failed'>('verifying');

  useEffect(() => {
    const invoice_id = params.get('invoice_id') || params.get('invoiceId');
    const order_id = params.get('order_id');
    if (!invoice_id || !order_id) { setState('failed'); return; }

    (async () => {
      try {
        const { data } = await supabase.functions.invoke('uddoktapay-verify', {
          body: { invoice_id, order_id },
        });
        if ((data as any)?.paid) {
          setState('paid');
          setTimeout(() => navigate(`/order/${order_id}`), 1200);
        } else {
          setState('failed');
        }
      } catch { setState('failed'); }
    })();
  }, [params, navigate]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        {state === 'verifying' && (<><Loader2 className="w-10 h-10 animate-spin mx-auto" /><p>পেমেন্ট যাচাই হচ্ছে…</p></>)}
        {state === 'paid' && (<><CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" /><p>পেমেন্ট সফল! অর্ডারে redirect হচ্ছে…</p></>)}
        {state === 'failed' && (<><XCircle className="w-12 h-12 text-red-600 mx-auto" /><p>পেমেন্ট যাচাই ব্যর্থ হয়েছে। সাপোর্টে যোগাযোগ করুন।</p></>)}
      </div>
    </div>
  );
}
