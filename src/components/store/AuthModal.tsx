import { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, LogIn, KeyRound, ArrowLeft, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'login' | 'signup' | 'forgot';

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Auto-fill referral code from URL (?ref=CODE) and switch to signup
  useEffect(() => {
    if (!isOpen) return;
    const refFromUrl = searchParams.get('ref');
    if (refFromUrl) {
      setMode('signup');
      setReferralCode(refFromUrl.toUpperCase());
    }
  }, [isOpen, searchParams]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setForgotSent(true);
        toast.success('পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে!');
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('সফলভাবে লগইন হয়েছে!');
        onClose();
        navigate('/dashboard');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;

        toast.success('অ্যাকাউন্ট তৈরি হয়েছে! ইমেইল ভেরিফাই করুন।');

        // Process referral after signup — wait for profile trigger to complete (retry up to 5x)
        if (referralCode.trim() && data.user) {
          const code = referralCode.trim().toUpperCase();
          const userId = data.user.id;
          let processed = false;
          for (let attempt = 0; attempt < 5; attempt++) {
            await new Promise(res => setTimeout(res, 1200 * (attempt + 1)));
            try {
              const { data: refResult } = await supabase.rpc('process_referral', {
                p_referral_code: code,
                p_referred_user_id: userId,
              });
              if ((refResult as any)?.success) {
                const referredReward = (refResult as any)?.referred_reward || 10;
                toast.success(`🎉 রেফারেল বোনাস! ৳${referredReward} সরাসরি আপনার ওয়ালেটে যোগ হয়েছে + ১০% স্থায়ী ছাড় সক্রিয়!`);
                processed = true;
                break;
              } else if ((refResult as any)?.error) {
                const err = (refResult as any).error;
                if (err === 'User not found' || err === 'Invalid referral code' && attempt < 4) {
                  // Profile not ready yet or code not found — retry
                  continue;
                }
                if (err !== 'User not found') {
                  toast.warning('রেফারেল কোড সঠিক নয় অথবা আগেই ব্যবহার করা হয়েছে।');
                  break;
                }
              }
              // profile not ready yet — retry
            } catch { /* retry */ }
          }
          if (!processed) {
            // Store code in localStorage so dashboard can retry later
            localStorage.setItem('pending_referral', code);
          }
        }
        onClose();
      }
    } catch (err: any) {
      const msg = err?.message || '';
      let friendlyMsg = 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।';
      if (msg.includes('Invalid login credentials')) friendlyMsg = 'ইমেইল বা পাসওয়ার্ড ভুল';
      else if (msg.includes('already registered') || msg.includes('already been registered')) friendlyMsg = 'এই ইমেইল দিয়ে আগেই একাউন্ট তৈরি করা হয়েছে';
      else if (msg.includes('Email not confirmed')) friendlyMsg = 'অনুগ্রহ করে আপনার ইমেইল ভেরিফাই করুন';
      else if (msg.includes('Password should be')) friendlyMsg = 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে';
      else if (msg.includes('rate limit') || msg.includes('too many')) friendlyMsg = 'অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
      toast.error(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast.error('Google লগইন ব্যর্থ হয়েছে');
      setLoading(false);
    }
  };

  const resetAndSwitch = (m: Mode) => {
    setMode(m);
    setForgotSent(false);
    setPassword('');
    setReferralCode('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative glass-card rounded-2xl p-8 w-full max-w-md animate-scale-in border border-primary/30">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X size={20} />
        </button>

        {/* Back button for forgot mode */}
        {mode === 'forgot' && (
          <button onClick={() => resetAndSwitch('login')} className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> ফিরুন
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {mode === 'login' ? 'লগইন করুন' : mode === 'signup' ? 'অ্যাকাউন্ট তৈরি করুন' : 'পাসওয়ার্ড ভুলে গেছেন?'}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === 'login' ? 'আপনার অ্যাকাউন্টে প্রবেশ করুন'
             : mode === 'signup' ? 'নতুন অ্যাকাউন্ট খুলুন'
             : 'ইমেইলে রিসেট লিংক পাঠানো হবে'}
          </p>
        </div>

        {/* Forgot password sent state */}
        {mode === 'forgot' && forgotSent ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'hsl(243,75%,97%)' }}>
              <Mail size={28} style={{ color: 'hsl(var(--primary))' }} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>ইমেইল পাঠানো হয়েছে!</p>
            <p className="text-xs mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <strong>{email}</strong> এ পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে। ইনবক্স চেক করুন।
            </p>
            <button onClick={() => resetAndSwitch('login')} className="text-primary text-sm font-medium hover:underline">
              লগইন পেজে ফিরুন
            </button>
          </div>
        ) : (
          <>
            {/* Google Button — only for login/signup */}
            {mode !== 'forgot' && (
              <>
                <button
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full glass-card border border-border hover:border-primary/40 rounded-xl py-3 flex items-center justify-center gap-3 text-sm font-medium transition-all hover:bg-muted/30 mb-4"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google দিয়ে {mode === 'login' ? 'লগইন' : 'সাইনআপ'} করুন
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">অথবা</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              </>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" placeholder="আপনার নাম" value={name} onChange={e => setName(e.target.value)} required
                    className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors" />
                </div>
              )}

              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="email" placeholder="ইমেইল অ্যাড্রেস" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>

              {mode !== 'forgot' && (
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type={showPass ? 'text' : 'password'} placeholder="পাসওয়ার্ড" value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-primary transition-colors" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              )}

              {/* Referral code field — signup only */}
              {mode === 'signup' && (
                <div className="relative">
                  <Gift size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="রেফারেল কোড (ঐচ্ছিক)"
                    value={referralCode}
                    onChange={e => setReferralCode(e.target.value.toUpperCase())}
                    className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors uppercase"
                  />
                  {referralCode && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: 'hsl(158,80%,48%)' }}>
                      <span>✓</span> কোড প্রয়োগ হলে ৳10 ক্রেডিট + 10% স্থায়ী ছাড় পাবেন!
                    </div>
                  )}
                </div>
              )}

              {/* Forgot password link */}
              {mode === 'login' && (
                <div className="text-right -mt-2">
                  <button type="button" onClick={() => resetAndSwitch('forgot')} className="text-xs text-primary hover:underline font-medium">
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full btn-glow py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                {mode === 'forgot' ? <KeyRound size={16} /> : <LogIn size={16} />}
                {loading ? 'অপেক্ষা করুন...'
                  : mode === 'login' ? 'লগইন করুন'
                  : mode === 'signup' ? 'অ্যাকাউন্ট তৈরি করুন'
                  : 'রিসেট লিংক পাঠান'}
              </button>
            </form>

            {/* Toggle mode */}
            {mode !== 'forgot' && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                {mode === 'login' ? 'অ্যাকাউন্ট নেই?' : 'ইতিমধ্যে অ্যাকাউন্ট আছে?'}{' '}
                <button onClick={() => resetAndSwitch(mode === 'login' ? 'signup' : 'login')} className="text-primary hover:underline font-medium">
                  {mode === 'login' ? 'সাইনআপ করুন' : 'লগইন করুন'}
                </button>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
