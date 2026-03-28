import { useState, useEffect } from 'react';
import BrandLoader from '@/components/store/BrandLoader';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import BrandLogo from '@/components/store/BrandLogo';

const AdminLogin = () => {
  const { signIn, signOut, isAdmin, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect as soon as isAdmin confirmed — regardless of submitting state
  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate('/ceo', { replace: true });
    }
  }, [user, isAdmin, loading, navigate]);

  // Only show spinner during initial auth load (not during admin check after login)
  if (loading && !user) {
    return <div className="min-h-screen bg-background" />;
  }

  // Non-admin logged-in user
  if (!loading && user && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-8 w-full max-w-md text-center space-y-4">
          <div className="text-destructive text-lg font-semibold">Access Denied</div>
          <p className="text-muted-foreground text-sm">You do not have admin privileges.</p>
          <button onClick={() => { signOut(); }} className="btn-glow py-2 px-6 rounded-xl text-sm">Sign Out</button>
        </div>
      </div>
    );
  }

  // Show spinner while admin check is in progress after login
  if (submitting || (user && loading)) {
    return <div className="min-h-screen bg-background" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Orbs */}
      <div className="orb orb-1 opacity-10 top-20 left-1/4 fixed" />
      <div className="orb orb-2 opacity-10 bottom-20 right-1/4 fixed" />

      <div className="glass-card rounded-3xl p-8 w-full max-w-md space-y-8 animate-slide-up">
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <BrandLogo size="md" />
        </div>
        <div className="flex items-center justify-center gap-2 mt-3 text-muted-foreground text-sm">
          <ShieldCheck size={14} className="text-primary" />
          Admin Dashboard Login
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full bg-muted/40 border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
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
                className="w-full bg-muted/40 border border-border rounded-xl pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-destructive text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-glow py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <ShieldCheck size={18} />
            Sign In to Dashboard
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          🔒 Secure Admin Access Only
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
