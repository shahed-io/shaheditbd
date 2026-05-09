import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, LogIn, KeyRound, ArrowLeft, Gift, Sparkles, ShieldCheck, CheckCircle2, AlertCircle, Zap, Lock as LockIcon, Award, Headphones } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BrandLogo from '@/components/store/BrandLogo';

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
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean; name?: boolean }>({});
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Validations
  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()), [email]);
  const nameValid = name.trim().length >= 2;
  const pwLen = password.length;
  const pwHasLetter = /[A-Za-z]/.test(password);
  const pwHasNumber = /\d/.test(password);
  const pwScore = (pwLen >= 8 ? 1 : 0) + (pwHasLetter ? 1 : 0) + (pwHasNumber ? 1 : 0) + (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
  const passwordValid = pwLen >= 8 && pwHasLetter && pwHasNumber;

  const canSubmit = !loading && (
    mode === 'forgot' ? emailValid :
    mode === 'login' ? emailValid && pwLen >= 1 :
    emailValid && passwordValid && nameValid && agreeTerms
  );

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
    setTouched({ email: true, password: true, name: true });
    if (!canSubmit) return;
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

        toast.success('অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!');

        // Email signup referral: referred user gets 5% discount only (no wallet credit)
        // Referrer gets ৳20 ONLY when referred user signs up via Google OAuth
        if (referralCode.trim() && data.user) {
          const code = referralCode.trim().toUpperCase();
          const userId = data.user.id;
          // Capture client IP for same-IP abuse detection
          let clientIp: string | null = null;
          try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const ipJson = await ipRes.json();
            clientIp = ipJson?.ip || null;
          } catch { /* ignore */ }
          let processed = false;
          for (let attempt = 0; attempt < 5; attempt++) {
            await new Promise(res => setTimeout(res, 1200 * (attempt + 1)));
            try {
              const { data: refResult } = await supabase.rpc('process_referral' as any, {
                p_referral_code: code,
                p_referred_user_id: userId,
                p_ip: clientIp,
              });
              if ((refResult as any)?.success) {
                toast.success(`🎁 রেফারেল কোড প্রয়োগ হয়েছে! ৫% স্থায়ী ছাড় সক্রিয় হয়েছে।`);
                processed = true;
                break;
              } else if ((refResult as any)?.error) {
                const err = (refResult as any).error;
                if (err === 'User not found' && attempt < 4) continue;
                if (err === 'Same IP detected, referral blocked') {
                  toast.warning('একই IP থেকে রেফারেল ব্যবহার করা যাবে না।');
                  break;
                }
                if (err !== 'User not found') {
                  toast.warning('রেফারেল কোড সঠিক নয় অথবা আগেই ব্যবহার করা হয়েছে।');
                  break;
                }
              }
            } catch { /* retry */ }
          }
          if (!processed) {
            localStorage.setItem('pending_referral', code);
            if (clientIp) localStorage.setItem('pending_referral_ip', clientIp);
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
    // If there's a referral code, store it before redirecting so we can process after Google OAuth
    if (referralCode.trim()) {
      localStorage.setItem('pending_google_referral', referralCode.trim().toUpperCase());
    }
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast.error('Google লগইন ব্যর্থ হয়েছে');
      setLoading(false);
    }
  };

  const handleApple = async () => {
    setLoading(true);
    if (referralCode.trim()) {
      localStorage.setItem('pending_google_referral', referralCode.trim().toUpperCase());
    }
    const { error } = await lovable.auth.signInWithOAuth('apple', {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast.error('Apple লগইন ব্যর্থ হয়েছে');
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
      <div
        className="absolute inset-0 backdrop-blur-md"
        style={{
          background:
            'radial-gradient(ellipse at top left, hsla(258,78%,55%,0.35), transparent 55%), radial-gradient(ellipse at bottom right, hsla(190,75%,55%,0.30), transparent 55%), hsla(226,40%,8%,0.55)',
        }}
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md animate-scale-in rounded-3xl overflow-hidden"
        style={{
          background:
            'linear-gradient(160deg, hsla(0,0%,100%,0.92) 0%, hsla(258,78%,98%,0.88) 100%)',
          border: '1px solid hsla(258,78%,75%,0.35)',
          boxShadow:
            '0 30px 80px -20px hsla(258,78%,40%,0.45), 0 8px 24px -8px hsla(190,75%,45%,0.25), inset 0 1px 0 hsla(0,0%,100%,0.9)',
          backdropFilter: 'blur(28px)',
        }}
      >
        {/* Decorative blobs */}
        <div
          className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-60 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(258,85%,70%) 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-16 w-60 h-60 rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(190,80%,65%) 0%, transparent 70%)' }}
        />

        {/* Gradient header band with logo */}
        <div
          className="relative px-8 pt-8 pb-6 overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, hsla(258,78%,55%,0.14) 0%, hsla(290,70%,60%,0.12) 50%, hsla(190,75%,55%,0.14) 100%)',
            borderBottom: '1px solid hsla(258,78%,75%,0.20)',
          }}
        >
          {/* Animated shimmer overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                'linear-gradient(110deg, transparent 30%, hsla(0,0%,100%,0.45) 50%, transparent 70%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 4s ease-in-out infinite',
            }}
          />
          {/* Floating sparkle particles */}
          <div className="pointer-events-none absolute inset-0">
            {[
              { top: '15%', left: '12%', delay: '0s', size: 4 },
              { top: '70%', left: '8%', delay: '1.2s', size: 3 },
              { top: '25%', right: '18%', delay: '0.6s', size: 5 },
              { top: '60%', right: '12%', delay: '1.8s', size: 3 },
              { top: '40%', left: '50%', delay: '2.4s', size: 4 },
            ].map((p, i) => (
              <span
                key={i}
                className="absolute rounded-full"
                style={{
                  ...p,
                  width: p.size, height: p.size,
                  background: 'linear-gradient(135deg, hsl(258,85%,70%), hsl(190,80%,65%))',
                  boxShadow: '0 0 8px hsla(258,85%,70%,0.7)',
                  animation: `floatParticle 3.5s ease-in-out ${p.delay} infinite`,
                }}
              />
            ))}
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 hover:rotate-90 z-10"
            style={{
              background: 'hsla(0,0%,100%,0.7)',
              border: '1px solid hsla(258,78%,75%,0.30)',
              color: 'hsl(258,78%,40%)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <X size={18} />
          </button>

          {mode === 'forgot' && (
            <button
              onClick={() => resetAndSwitch('login')}
              className="absolute top-5 left-5 flex items-center gap-1.5 text-xs font-semibold transition-colors z-10"
              style={{ color: 'hsl(258,78%,45%)' }}
            >
              <ArrowLeft size={14} /> ফিরুন
            </button>
          )}

          {/* Logo with glow ring */}
          <div className="flex justify-center mb-4 mt-1 relative">
            <div
              className="relative p-3 rounded-2xl transition-transform hover:scale-105"
              style={{
                background: 'hsla(0,0%,100%,0.85)',
                border: '1px solid hsla(258,78%,75%,0.35)',
                boxShadow:
                  '0 10px 30px -8px hsla(258,78%,50%,0.35), inset 0 1px 0 hsla(0,0%,100%,0.95)',
              }}
            >
              <div
                className="absolute inset-0 rounded-2xl opacity-70 blur-md -z-10"
                style={{
                  background:
                    'linear-gradient(135deg, hsl(258,85%,70%), hsl(190,80%,65%))',
                  animation: 'pulseGlow 3s ease-in-out infinite',
                }}
              />
              <BrandLogo size="md" />
            </div>
          </div>

          <div className="text-center relative">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-2 text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: 'hsla(0,0%,100%,0.75)',
                border: '1px solid hsla(258,78%,75%,0.30)',
                color: 'hsl(258,78%,45%)',
              }}
            >
              <Sparkles size={10} className="animate-pulse" /> Secure Access
            </div>
            <h2
              className="text-2xl font-bold"
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                background:
                  'linear-gradient(135deg, hsl(258,78%,40%) 0%, hsl(290,70%,45%) 50%, hsl(190,75%,40%) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {mode === 'login' ? 'লগইন করুন' : mode === 'signup' ? 'অ্যাকাউন্ট তৈরি করুন' : 'পাসওয়ার্ড ভুলে গেছেন?'}
            </h2>
            <p className="text-xs mt-1.5" style={{ color: 'hsl(226,30%,40%)' }}>
              {mode === 'login' ? 'আপনার অ্যাকাউন্টে প্রবেশ করুন'
               : mode === 'signup' ? 'নতুন অ্যাকাউন্ট খুলুন'
               : 'ইমেইলে রিসেট লিংক পাঠানো হবে'}
            </p>
          </div>
        </div>

        {/* Signup benefits strip */}
        {mode === 'signup' && (
          <div
            className="relative px-8 py-3 grid grid-cols-3 gap-2 text-center border-b"
            style={{
              background: 'linear-gradient(90deg, hsla(258,78%,98%,0.6), hsla(190,75%,97%,0.6))',
              borderColor: 'hsla(258,78%,75%,0.15)',
            }}
          >
            {[
              { icon: <Gift size={14} />, label: '৫% ছাড়' },
              { icon: <Award size={14} />, label: 'লয়ালটি পয়েন্ট' },
              { icon: <Headphones size={14} />, label: '২৪/৭ সাপোর্ট' },
            ].map((b, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span style={{ color: 'hsl(258,78%,50%)' }}>{b.icon}</span>
                <span className="text-[10px] font-semibold" style={{ color: 'hsl(258,78%,35%)' }}>{b.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="relative px-8 py-6">

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
                <button
                  onClick={handleApple}
                  disabled={loading}
                  className="w-full glass-card border border-border hover:border-primary/40 rounded-xl py-3 flex items-center justify-center gap-3 text-sm font-medium transition-all hover:bg-muted/30 mb-4"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Apple দিয়ে {mode === 'login' ? 'লগইন' : 'সাইনআপ'} করুন
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
                <GlassField
                  icon={<User size={16} />}
                  type="text"
                  placeholder="আপনার নাম"
                  value={name}
                  onChange={(v) => setName(v)}
                  onBlur={() => setTouched(t => ({ ...t, name: true }))}
                  valid={nameValid}
                  invalid={touched.name && !nameValid && name.length > 0}
                  errorMsg="নাম কমপক্ষে ২ অক্ষরের হতে হবে"
                  required
                />
              )}

              <GlassField
                icon={<Mail size={16} />}
                type="email"
                placeholder="ইমেইল অ্যাড্রেস"
                value={email}
                onChange={(v) => setEmail(v)}
                onBlur={() => setTouched(t => ({ ...t, email: true }))}
                valid={emailValid}
                invalid={touched.email && !emailValid && email.length > 0}
                errorMsg="সঠিক ইমেইল অ্যাড্রেস দিন"
                required
              />

              {mode !== 'forgot' && (
                <div>
                  <GlassField
                    icon={<Lock size={16} />}
                    type={showPass ? 'text' : 'password'}
                    placeholder="পাসওয়ার্ড"
                    value={password}
                    onChange={(v) => setPassword(v)}
                    onBlur={() => setTouched(t => ({ ...t, password: true }))}
                    onKeyDown={(e) => setCapsLockOn(e.getModifierState && e.getModifierState('CapsLock'))}
                    onKeyUp={(e) => setCapsLockOn(e.getModifierState && e.getModifierState('CapsLock'))}
                    valid={mode === 'signup' ? passwordValid : pwLen >= 1}
                    invalid={mode === 'signup' && touched.password && !passwordValid && pwLen > 0}
                    errorMsg="পাসওয়ার্ড কমপক্ষে ৮ অক্ষর, অক্ষর ও সংখ্যা থাকতে হবে"
                    required
                    rightSlot={
                      <button type="button" onClick={() => setShowPass(!showPass)} className="text-muted-foreground hover:text-primary transition-colors">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                  {capsLockOn && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold animate-fade-in" style={{ color: 'hsl(30,90%,45%)' }}>
                      <AlertCircle size={12} /> Caps Lock চালু আছে
                    </div>
                  )}
                  {mode === 'signup' && password.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5">
                      {[0,1,2,3].map(i => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{
                            background: i < pwScore
                              ? `linear-gradient(90deg, hsl(${pwScore <= 1 ? 0 : pwScore === 2 ? 30 : pwScore === 3 ? 45 : 158}, 80%, 55%), hsl(${pwScore <= 1 ? 0 : pwScore === 2 ? 30 : pwScore === 3 ? 45 : 158}, 80%, 65%))`
                              : 'hsla(258,30%,85%,0.5)',
                          }}
                        />
                      ))}
                      <span className="text-[10px] font-semibold ml-1" style={{
                        color: pwScore <= 1 ? 'hsl(0,70%,50%)' : pwScore === 2 ? 'hsl(30,80%,45%)' : pwScore === 3 ? 'hsl(45,85%,40%)' : 'hsl(158,75%,40%)'
                      }}>
                        {pwScore <= 1 ? 'দুর্বল' : pwScore === 2 ? 'মাঝারি' : pwScore === 3 ? 'ভালো' : 'শক্তিশালী'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Referral code field — signup only */}
              {mode === 'signup' && (
                <div>
                  <GlassField
                    icon={<Gift size={16} />}
                    type="text"
                    placeholder="রেফারেল কোড (ঐচ্ছিক)"
                    value={referralCode}
                    onChange={(v) => setReferralCode(v.toUpperCase())}
                    valid={referralCode.length > 0}
                    uppercase
                  />
                  {referralCode && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: 'hsl(158,80%,42%)' }}>
                      <CheckCircle2 size={12} /> কোড প্রয়োগ হলে ৫% স্থায়ী ছাড় পাবেন! Google দিয়ে সাইনআপ করলে রেফারারও ৳২০ পাবে।
                    </div>
                  )}
                </div>
              )}

              {/* Remember me + Forgot password row */}
              {mode === 'login' && (
                <div className="flex items-center justify-between -mt-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <span className="relative inline-flex">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="peer sr-only"
                      />
                      <span
                        className="w-4 h-4 rounded-md border flex items-center justify-center transition-all"
                        style={{
                          background: rememberMe
                            ? 'linear-gradient(135deg, hsl(258,78%,55%), hsl(190,75%,50%))'
                            : 'hsla(0,0%,100%,0.7)',
                          borderColor: rememberMe ? 'hsl(258,78%,55%)' : 'hsla(258,40%,75%,0.5)',
                          boxShadow: rememberMe ? '0 0 0 3px hsla(258,78%,60%,0.18)' : 'none',
                        }}
                      >
                        {rememberMe && <CheckCircle2 size={10} className="text-white" />}
                      </span>
                    </span>
                    <span className="text-xs font-medium" style={{ color: 'hsl(226,30%,40%)' }}>মনে রাখুন</span>
                  </label>
                  <button type="button" onClick={() => resetAndSwitch('forgot')} className="text-xs font-semibold hover:underline" style={{ color: 'hsl(258,78%,45%)' }}>
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>
              )}

              {/* Terms checkbox - signup only */}
              {mode === 'signup' && (
                <label className="flex items-start gap-2 cursor-pointer">
                  <span className="relative inline-flex mt-0.5">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="peer sr-only"
                    />
                    <span
                      className="w-4 h-4 rounded-md border flex items-center justify-center transition-all"
                      style={{
                        background: agreeTerms
                          ? 'linear-gradient(135deg, hsl(258,78%,55%), hsl(190,75%,50%))'
                          : 'hsla(0,0%,100%,0.7)',
                        borderColor: agreeTerms ? 'hsl(258,78%,55%)' : 'hsla(258,40%,75%,0.5)',
                        boxShadow: agreeTerms ? '0 0 0 3px hsla(258,78%,60%,0.18)' : 'none',
                      }}
                    >
                      {agreeTerms && <CheckCircle2 size={10} className="text-white" />}
                    </span>
                  </span>
                  <span className="text-[11px] leading-relaxed" style={{ color: 'hsl(226,30%,40%)' }}>
                    আমি{' '}
                    <a href="/terms-conditions" target="_blank" className="font-semibold hover:underline" style={{ color: 'hsl(258,78%,45%)' }}>শর্তাবলী</a>
                    {' '}এবং{' '}
                    <a href="/privacy-policy" target="_blank" className="font-semibold hover:underline" style={{ color: 'hsl(258,78%,45%)' }}>প্রাইভেসি পলিসি</a>
                    {' '}মেনে নিচ্ছি
                  </span>
                </label>
              )}

              <button type="submit" disabled={!canSubmit}
                className="relative w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, hsl(258,78%,55%) 0%, hsl(290,70%,55%) 50%, hsl(190,75%,50%) 100%)',
                  color: 'white',
                  boxShadow: '0 10px 30px -8px hsla(258,78%,50%,0.55), inset 0 1px 0 hsla(0,0%,100%,0.35)',
                }}
              >
                {/* Shimmer effect on hover */}
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    background: 'linear-gradient(110deg, transparent 30%, hsla(0,0%,100%,0.35) 50%, transparent 70%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s linear infinite',
                  }}
                />
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  mode === 'forgot' ? <KeyRound size={16} /> : <LogIn size={16} />
                )}
                <span className="relative">
                  {loading ? 'অপেক্ষা করুন...'
                    : mode === 'login' ? 'লগইন করুন'
                    : mode === 'signup' ? 'অ্যাকাউন্ট তৈরি করুন'
                    : 'রিসেট লিংক পাঠান'}
                </span>
              </button>
            </form>

            {/* Toggle mode */}
            {mode !== 'forgot' && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                {mode === 'login' ? 'অ্যাকাউন্ট নেই?' : 'ইতিমধ্যে অ্যাকাউন্ট আছে?'}{' '}
                <button onClick={() => resetAndSwitch(mode === 'login' ? 'signup' : 'login')} className="text-primary hover:underline font-semibold story-link">
                  {mode === 'login' ? 'সাইনআপ করুন' : 'লগইন করুন'}
                </button>
              </p>
            )}

            {/* Trust badges footer */}
            <div className="mt-5 pt-4 border-t flex items-center justify-around" style={{ borderColor: 'hsla(258,78%,75%,0.15)' }}>
              {[
                { icon: <ShieldCheck size={12} />, label: 'SSL সুরক্ষিত' },
                { icon: <LockIcon size={12} />, label: 'এনক্রিপ্টেড' },
                { icon: <Zap size={12} />, label: 'দ্রুত লগইন' },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: 'hsl(226,30%,45%)' }}>
                  <span style={{ color: 'hsl(158,70%,42%)' }}>{t.icon}</span>
                  {t.label}
                </div>
              ))}
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
};

interface GlassFieldProps {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  valid?: boolean;
  invalid?: boolean;
  errorMsg?: string;
  required?: boolean;
  uppercase?: boolean;
  rightSlot?: React.ReactNode;
}

const GlassField = ({ icon, type, placeholder, value, onChange, onBlur, valid, invalid, errorMsg, required, uppercase, rightSlot }: GlassFieldProps) => {
  const [focused, setFocused] = useState(false);
  const showCheck = valid && value.length > 0 && !invalid;
  const borderColor = invalid
    ? 'hsl(0,75%,60%)'
    : focused
    ? 'hsl(258,78%,60%)'
    : showCheck
    ? 'hsla(158,75%,55%,0.55)'
    : 'hsla(258,40%,80%,0.45)';
  const glow = invalid
    ? '0 0 0 4px hsla(0,75%,60%,0.12)'
    : focused
    ? '0 0 0 4px hsla(258,78%,60%,0.18), 0 8px 22px -8px hsla(258,78%,55%,0.35)'
    : 'inset 0 1px 0 hsla(0,0%,100%,0.7)';
  return (
    <div>
      <div
        className="relative flex items-center rounded-xl transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, hsla(0,0%,100%,0.85) 0%, hsla(258,78%,98%,0.75) 100%)',
          border: `1px solid ${borderColor}`,
          boxShadow: glow,
          backdropFilter: 'blur(12px)',
          transform: focused ? 'translateY(-1px)' : 'translateY(0)',
        }}
      >
        <span
          className="pl-3.5 transition-all duration-300"
          style={{
            color: invalid ? 'hsl(0,75%,55%)' : focused ? 'hsl(258,78%,55%)' : 'hsl(226,30%,55%)',
            transform: focused ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {icon}
        </span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          className={`flex-1 bg-transparent border-0 outline-none px-3 py-3 text-sm placeholder:text-muted-foreground ${uppercase ? 'uppercase tracking-wider' : ''}`}
          style={{ color: 'hsl(226,40%,18%)' }}
        />
        <span className="pr-3.5 flex items-center gap-2">
          {showCheck && (
            <CheckCircle2 size={16} className="animate-scale-in" style={{ color: 'hsl(158,75%,45%)' }} />
          )}
          {invalid && !rightSlot && (
            <AlertCircle size={16} className="animate-scale-in" style={{ color: 'hsl(0,75%,55%)' }} />
          )}
          {rightSlot}
        </span>
        {/* Animated bottom underline */}
        <span
          className="absolute left-3 right-3 bottom-0 h-[2px] rounded-full pointer-events-none transition-all duration-300"
          style={{
            background: invalid
              ? 'linear-gradient(90deg, hsl(0,75%,60%), hsl(20,80%,60%))'
              : 'linear-gradient(90deg, hsl(258,78%,60%), hsl(290,70%,60%), hsl(190,75%,55%))',
            transform: focused ? 'scaleX(1)' : 'scaleX(0)',
            transformOrigin: 'left',
            opacity: focused ? 1 : 0,
          }}
        />
      </div>
      {invalid && errorMsg && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold animate-fade-in" style={{ color: 'hsl(0,75%,50%)' }}>
          <AlertCircle size={12} /> {errorMsg}
        </div>
      )}
    </div>
  );
};

export default AuthModal;
