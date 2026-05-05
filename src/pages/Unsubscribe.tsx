import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MailX, CheckCircle, AlertTriangle } from 'lucide-react';
import SEOHead from '@/components/seo/SEOHead';

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'done' | 'already' | 'error'>('loading');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
      headers: { apikey: anonKey },
    })
      .then(r => r.json())
      .then(data => {
        if (data.valid === false && data.reason === 'already_unsubscribed') setStatus('already');
        else if (data.valid) setStatus('valid');
        else setStatus('invalid');
      })
      .catch(() => setStatus('error'));
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('handle-email-unsubscribe', { body: { token } });
      if (error) throw error;
      if (data?.success) setStatus('done');
      else if (data?.reason === 'already_unsubscribed') setStatus('already');
      else setStatus('error');
    } catch {
      setStatus('error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEOHead title="Unsubscribe" description="Manage your email subscription." noIndex />
      <div className="max-w-md w-full text-center space-y-6">
        {status === 'loading' && (
          <div className="space-y-3">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">যাচাই করা হচ্ছে...</p>
          </div>
        )}

        {status === 'valid' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center mx-auto">
              <MailX size={32} className="text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-foreground">ইমেইল আনসাবস্ক্রাইব</h1>
            <p className="text-sm text-muted-foreground">
              আপনি কি নিশ্চিত যে আমাদের ইমেইল নোটিফিকেশন বন্ধ করতে চান?
            </p>
            <button
              onClick={handleUnsubscribe}
              disabled={processing}
              className="btn-glow px-6 py-3 rounded-xl font-semibold text-sm w-full flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 size={16} className="animate-spin" /> : <MailX size={16} />}
              {processing ? 'প্রক্রিয়াকরণ হচ্ছে...' : 'আনসাবস্ক্রাইব নিশ্চিত করুন'}
            </button>
          </div>
        )}

        {status === 'done' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h1 className="text-xl font-bold text-foreground">সফলভাবে আনসাবস্ক্রাইব হয়েছে</h1>
            <p className="text-sm text-muted-foreground">আপনি আর আমাদের থেকে ইমেইল পাবেন না।</p>
          </div>
        )}

        {status === 'already' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted border-2 border-border flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-muted-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">ইতিমধ্যে আনসাবস্ক্রাইব করা হয়েছে</h1>
            <p className="text-sm text-muted-foreground">আপনি আগেই এই ইমেইল তালিকা থেকে আনসাবস্ক্রাইব করেছেন।</p>
          </div>
        )}

        {(status === 'invalid' || status === 'error') && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center mx-auto">
              <AlertTriangle size={32} className="text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              {status === 'invalid' ? 'অবৈধ লিঙ্ক' : 'সমস্যা হয়েছে'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {status === 'invalid' ? 'এই আনসাবস্ক্রাইব লিঙ্কটি অবৈধ বা মেয়াদোত্তীর্ণ।' : 'দয়া করে পরে আবার চেষ্টা করুন।'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
