import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BinanceReturn() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const isDemo = params.get('demo') === '1';
  const [state, setState] = useState<'demo' | 'verifying' | 'paid' | 'failed'>(isDemo ? 'demo' : 'verifying');

  const mtn = params.get('mtn') || params.get('merchantTradeNo');
  const order_id = params.get('order_id');

  const runVerify = useCallback(() => {
    if (!mtn) { setState('failed'); return () => {}; }
    let attempts = 0;
    let stopped = false;
    setState('verifying');

    const check = async () => {
      attempts++;
      try {
        const { data } = await supabase.functions.invoke('binance-verify', {
          body: { merchant_trade_no: mtn, order_id },
        });
        if (stopped) return;
        if ((data as any)?.paid) {
          setState('paid');
          const target = order_id || (data as any)?.order_id;
          setTimeout(() => navigate(target ? `/order/${target}` : '/dashboard?tab=orders'), 1200);
          return;
        }
      } catch { /* retry below */ }
      // Crypto settlement can lag a few seconds — retry a handful of times.
      if (!stopped && attempts < 6) setTimeout(check, 3000);
      else if (!stopped) setState('failed');
    };
    check();
    return () => { stopped = true; };
  }, [mtn, order_id, navigate]);

  useEffect(() => {
    if (isDemo) return;
    return runVerify();
  }, [isDemo, runVerify]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center space-y-3 max-w-md">
        {state === 'demo' && (
          <>
            <FlaskConical className="w-12 h-12 mx-auto text-amber-500" />
            <h1 className="text-xl font-bold">Binance Sandbox (Test Mode)</h1>
            <p className="text-sm text-muted-foreground">
              এটি একটি ডেমো লেনদেন — কোনো আসল টাকা কাটা হবে না। নিচের বাটনে চাপ দিলে পেমেন্ট সফল হিসেবে ধরে নিয়ে অর্ডারটি paid + processing হবে।
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <Button onClick={() => runVerify()}>Simulate Successful Payment</Button>
              <Button variant="outline" onClick={() => navigate('/checkout?binance=cancelled')}>Cancel</Button>
            </div>
          </>
        )}
        {state === 'verifying' && (<><Loader2 className="w-10 h-10 animate-spin mx-auto" /><p>Binance পেমেন্ট যাচাই হচ্ছে…</p></>)}
        {state === 'paid' && (<><CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" /><p>পেমেন্ট সফল! অর্ডারে redirect হচ্ছে…</p></>)}
        {state === 'failed' && (<><XCircle className="w-12 h-12 text-red-600 mx-auto" /><p>পেমেন্ট এখনো নিশ্চিত হয়নি। কিছুক্ষণ পর অর্ডার স্ট্যাটাস দেখুন বা সাপোর্টে যোগাযোগ করুন।</p></>)}
      </div>
    </div>
  );
}
