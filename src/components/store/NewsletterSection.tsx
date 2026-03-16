import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Send, CheckCircle } from 'lucide-react';

const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const emailRegex = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('সঠিক ইমেইল দিন');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.from('newsletter_subscribers').insert({
      email: trimmedEmail,
      name: name.trim() || null,
      source: 'footer',
    });
    setLoading(false);
    if (err) {
      if (err.code === '23505') setError('এই ইমেইল আগেই সাবস্ক্রাইব করা আছে');
      else setError('কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করুন');
    } else {
      setSuccess(true);
      setEmail('');
      setName('');
    }
  };

  return (
    <div className="relative rounded-3xl overflow-hidden my-8 mx-4 sm:mx-6 lg:mx-8"
      style={{
        background: 'linear-gradient(135deg, hsla(258,78%,55%,0.10) 0%, hsla(200,90%,45%,0.08) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid hsla(258,78%,75%,0.22)',
        boxShadow: '0 8px 40px hsla(258,78%,55%,0.10)',
      }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, hsla(258,78%,55%,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-10 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))', boxShadow: '0 6px 20px hsla(258,78%,55%,0.35)' }}>
          <Mail size={22} className="text-white" />
        </div>
        <h3 className="font-sora font-black text-2xl mb-2" style={{ color: 'hsl(226,35%,12%)' }}>
          নিউজলেটার সাবস্ক্রাইব করুন
        </h3>
        <p className="text-sm mb-6" style={{ color: 'hsl(226,35%,42%)' }}>
          নতুন অফার, ডিসকাউন্ট ও প্রোডাক্ট আপডেট সরাসরি আপনার ইনবক্সে পান
        </p>

        {success ? (
          <div className="flex items-center justify-center gap-3 py-4">
            <CheckCircle size={22} className="text-emerald-500" />
            <p className="font-semibold" style={{ color: 'hsl(162,72%,30%)' }}>সফলভাবে সাবস্ক্রাইব হয়েছেন! 🎉</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="আপনার নাম (ঐচ্ছিক)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: 'hsla(0,0%,100%,0.75)',
                backdropFilter: 'blur(12px)',
                border: '1.5px solid hsla(258,78%,75%,0.25)',
                color: 'hsl(226,35%,18%)',
              }}
            />
            <input
              type="email"
              placeholder="ইমেইল অ্যাড্রেস *"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: 'hsla(0,0%,100%,0.75)',
                backdropFilter: 'blur(12px)',
                border: `1.5px solid ${error ? 'hsla(0,85%,60%,0.60)' : 'hsla(258,78%,75%,0.25)'}`,
                color: 'hsl(226,35%,18%)',
              }}
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-60 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))', boxShadow: '0 4px 16px hsla(258,78%,55%,0.30)' }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <><Send size={15} /> সাবস্ক্রাইব</>
              )}
            </button>
          </form>
        )}
        {error && <p className="text-xs mt-2" style={{ color: 'hsl(0,85%,55%)' }}>{error}</p>}
      </div>
    </div>
  );
};

export default NewsletterSection;
