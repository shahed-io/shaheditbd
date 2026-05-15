import { useState, useEffect } from 'react';
import BrandLoader from '@/components/store/BrandLoader';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, KeyRound, ArrowLeft, MailCheck } from 'lucide-react';
import BrandLogo from '@/components/store/BrandLogo';
import SEOHead from '@/components/seo/SEOHead';
import { useAdmin2FA, setStoredToken, getStoredToken } from '@/hooks/useAdmin2FA';

const AdminLogin = () => {
  const { signIn, signOut, isAdmin, user, loading } = useAuth();
  const navigate = useNavigate();
  const { status: get2faStatus, verifyLogin, validateSession, sendEmailOtp, getConfig } = useAdmin2FA();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 2FA challenge state
  const [stage, setStage] = useState<'password' | '2fa' | 'enroll'>('password');
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSentInfo, setEmailSentInfo] = useState<string>('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [twoFaConfig, setTwoFaConfig] = useState<{ session_ttl_hours: number; remember_device_ttl_days: number; allow_remember_device: boolean } | null>(null);

  // Fetch 2FA config (TTL labels) once admin is identified
  useEffect(() => {
    if (!user || !isAdmin) return;
    getConfig().then(setTwoFaConfig).catch(() => { /* keep defaults */ });
  }, [user, isAdmin, getConfig]);

  // After admin login, decide: needs 2FA challenge / enrollment / proceed
  useEffect(() => {
    if (loading || !user || !isAdmin) return;

    (async () => {
      try {
        const { enabled } = await get2faStatus();
        if (!enabled) {
          // No 2FA yet → force enrollment
          setStage('enroll');
          setSubmitting(false);
          return;
        }
        // 2FA enabled — check existing session
        const existing = getStoredToken();
        if (existing) {
          const r = await validateSession(existing);
          if (r?.valid) {
            navigate('/ceo', { replace: true });
            return;
          }
          setStoredToken(null);
        }
        setStage('2fa');
        setSubmitting(false);
      } catch (e) {
        console.error(e);
        setError('2FA সিস্টেম লোড করতে সমস্যা হয়েছে।');
        setSubmitting(false);
      }
    })();
  }, [user, isAdmin, loading, get2faStatus, validateSession, navigate]);

  // Initial loading spinner
  if (loading && !user && !submitting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <BrandLoader size="md" />
      </div>
    );
  }

  // Non-admin
  if (!loading && user && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-8 w-full max-w-md text-center space-y-4">
          <div className="text-destructive text-lg font-semibold">Access Denied</div>
          <p className="text-muted-foreground text-sm">You do not have admin privileges.</p>
          <button onClick={() => signOut()} className="btn-glow py-2 px-6 rounded-xl text-sm">Sign Out</button>
        </div>
      </div>
    );
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError('ইমেইল বা পাসওয়ার্ড সঠিক নয়');
      setSubmitting(false);
    }
    // On success: onAuthStateChange fires → isAdmin set → useEffect redirects
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerifying(true);
    try {
      const r = await verifyLogin(otp.trim(), rememberDevice);
      if (r?.token) {
        setStoredToken(r.token, !!r.remembered);
        navigate('/ceo', { replace: true });
      } else {
        setError('Invalid code');
      }
    } catch (err) {
      setError((err as Error).message || 'Invalid code');
    } finally {
      setVerifying(false);
    }
  };

  const handleSendEmailOtp = async () => {
    setError('');
    setEmailSentInfo('');
    setEmailSending(true);
    try {
      const r = await sendEmailOtp();
      const n = r?.sentTo ?? 0;
      setEmailSentInfo(`✉ A 6-digit code was sent to ${n} admin email${n === 1 ? '' : 's'}. It expires in 10 minutes.`);
      // If user was on enroll stage, move them to OTP stage so they can log in
      setStage('2fa');
    } catch (err) {
      setError((err as Error).message || 'Could not send email code');
    } finally {
      setEmailSending(false);
    }
  };

  const handleGoEnroll = () => {
    navigate('/ceo/security?force=1', { replace: true });
  };

  const handleCancel = async () => {
    setStoredToken(null);
    await signOut();
    setStage('password');
    setOtp('');
    setError('');
  };

  // Show spinner during transitions
  if (submitting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <BrandLoader size="md" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEOHead title="Admin Login" description="Restricted area." noIndex />
      <div className="orb orb-1 opacity-10 top-20 left-1/4 fixed" />
      <div className="orb orb-2 opacity-10 bottom-20 right-1/4 fixed" />

      <div className="glass-card rounded-3xl p-8 w-full max-w-md space-y-8 animate-slide-up">
        <div className="flex justify-center mb-2">
          <BrandLogo size="md" />
        </div>
        <div className="flex items-center justify-center gap-2 mt-3 text-muted-foreground text-sm">
          <ShieldCheck size={14} className="text-primary" />
          {stage === 'password' && 'Admin Dashboard Login'}
          {stage === '2fa' && 'Two-Factor Verification'}
          {stage === 'enroll' && 'Enable Two-Factor Auth'}
        </div>

        {stage === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@shahedstore.com.bd"
                  required
                  className="w-full bg-muted/40 border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-muted/40 border border-border rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-primary"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-destructive text-sm">{error}</div>
            )}

            <button type="submit" disabled={submitting} className="w-full btn-glow py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2">
              <ShieldCheck size={18} />
              Sign In to Dashboard
            </button>
          </form>
        )}

        {stage === '2fa' && (
          <form onSubmit={handleVerify2FA} className="space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              Enter your <strong>Google Authenticator</strong> 6-digit code, a backup code,
              or request a code by email below.
            </p>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                inputMode="text"
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456 / backup / email code"
                required
                className="w-full bg-muted/40 border border-border rounded-xl pl-10 pr-4 py-3 text-base tracking-[0.3em] text-center font-mono focus:outline-none focus:border-primary"
              />
            </div>
            {emailSentInfo && (
              <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 text-primary text-xs leading-relaxed">{emailSentInfo}</div>
            )}
            {error && <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-destructive text-sm">{error}</div>}

            {(twoFaConfig?.allow_remember_device ?? true) && (
              <label className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <div className="font-semibold text-foreground">Remember this device</div>
                  <div className="text-muted-foreground">
                    Stay signed in for {twoFaConfig?.remember_device_ttl_days ?? 30} days. Otherwise this session lasts {twoFaConfig?.session_ttl_hours ?? 12} hours. Don't enable on shared devices.
                  </div>
                </div>
              </label>
            )}

            <button type="submit" disabled={verifying} className="w-full btn-glow py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2">
              <ShieldCheck size={18} />
              {verifying ? 'Verifying…' : 'Verify & Continue'}
            </button>
            <button
              type="button"
              onClick={handleSendEmailOtp}
              disabled={emailSending}
              className="w-full py-3 rounded-xl font-medium text-sm border border-border bg-muted/30 hover:bg-muted/60 flex items-center justify-center gap-2 transition"
            >
              <MailCheck size={16} />
              {emailSending ? 'Sending…' : 'Email me a code instead'}
            </button>
            <button type="button" onClick={handleCancel} className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5">
              <ArrowLeft size={12} /> Cancel & Sign Out
            </button>
          </form>
        )}

        {stage === 'enroll' && (
          <div className="space-y-4 text-center">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm">
              <p className="font-semibold text-amber-700 dark:text-amber-300 mb-1">⚠ Two-Factor Authentication Recommended</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                For maximum security, set up Google Authenticator. If you can't right now, you can
                also receive a one-time code by email.
              </p>
            </div>
            <button onClick={handleGoEnroll} className="w-full btn-glow py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2">
              <ShieldCheck size={18} /> Set Up Authenticator
            </button>
            <button
              type="button"
              onClick={handleSendEmailOtp}
              disabled={emailSending}
              className="w-full py-3 rounded-xl font-medium text-sm border border-border bg-muted/30 hover:bg-muted/60 flex items-center justify-center gap-2 transition"
            >
              <MailCheck size={16} />
              {emailSending ? 'Sending…' : 'Email me a login code instead'}
            </button>
            <button onClick={handleCancel} className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5">
              <ArrowLeft size={12} /> Sign Out
            </button>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">🔒 Secure Admin Access Only</p>
      </div>
    </div>
  );
};

export default AdminLogin;
