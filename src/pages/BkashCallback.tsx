import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const BkashCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    const paymentID = searchParams.get('paymentID');
    const statusParam = searchParams.get('status');
    const orderID = searchParams.get('orderID') || localStorage.getItem('bkash_pending_order_id') || '';

    if (!paymentID || statusParam === 'cancel' || statusParam === 'failure') {
      setStatus('failed');
      setMessage(statusParam === 'cancel' ? 'পেমেন্ট বাতিল করা হয়েছে।' : 'পেমেন্ট ব্যর্থ হয়েছে।');
      return;
    }

    const execute = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('bkash-payment', {
          body: { paymentID },
          headers: { 'x-action': 'execute' },
        });

        // Use query param to pass action since invoke doesn't support URL params
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bkash-payment?action=execute`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ paymentID }),
          }
        );
        const result = await res.json();

        if (result.statusCode === '0000' && result.transactionStatus === 'Completed') {
          // Update order status in DB
          if (orderID) {
            await supabase
              .from('orders')
              .update({
                status: 'processing',
                payment_status: 'paid',
                transaction_id: result.trxID,
                admin_notes: `bKash Auto-Pay | TrxID: ${result.trxID} | PaymentID: ${paymentID}`,
              })
              .eq('order_number', orderID);
            setOrderNumber(orderID);
          }
          localStorage.removeItem('bkash_pending_order_id');
          setStatus('success');
          setMessage(`পেমেন্ট সফল! TrxID: ${result.trxID}`);
        } else {
          setStatus('failed');
          setMessage(result.statusMessage || 'পেমেন্ট যাচাই ব্যর্থ হয়েছে।');
        }
      } catch (err) {
        setStatus('failed');
        setMessage('সার্ভার সংযোগে সমস্যা হয়েছে।');
      }
    };

    execute();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 glass-card p-8 rounded-2xl border border-border">
        {status === 'loading' && (
          <>
            <Loader2 size={52} className="animate-spin text-primary mx-auto" />
            <p className="text-foreground font-semibold">পেমেন্ট যাচাই করা হচ্ছে...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto">
              <CheckCircle size={40} className="text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">পেমেন্ট সফল! 🎉</h1>
              {orderNumber && (
                <p className="text-muted-foreground mt-1">অর্ডার নম্বর: <span className="text-primary font-mono font-bold">{orderNumber}</span></p>
              )}
              <p className="text-sm text-muted-foreground mt-2">{message}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate('/')} className="px-5 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm transition-colors">
                হোমে যাও
              </button>
              <button onClick={() => navigate('/dashboard')} className="btn-glow px-5 py-2.5 rounded-xl text-sm font-semibold">
                অর্ডার দেখুন
              </button>
            </div>
          </>
        )}
        {status === 'failed' && (
          <>
            <div className="w-20 h-20 rounded-full bg-destructive/20 border-2 border-destructive/40 flex items-center justify-center mx-auto">
              <XCircle size={40} className="text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">পেমেন্ট ব্যর্থ</h1>
              <p className="text-sm text-muted-foreground mt-2">{message}</p>
            </div>
            <button onClick={() => navigate('/checkout')} className="btn-glow px-6 py-3 rounded-xl font-semibold text-sm">
              আবার চেষ্টা করুন
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default BkashCallback;
