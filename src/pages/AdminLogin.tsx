import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Package, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';

const AdminLogin = () => {
  const { signIn, isAdmin, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect once isAdmin is confirmed
  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [user, isAdmin, loading, navigate]);

  // Only show full-screen spinner while we genuinely don't know if user is admin yet
  // (i.e. user is logged in but admin check is pending)
  if (loading && user) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Already confirmed admin — redirect handled by useEffect
  if (!loading && user && isAdmin) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError('Invalid email or password');
      setSubmitting(false);
    }
    // Don't setSubmitting(false) on success — keep spinner until redirect
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Orbs */}
      <div className="orb orb-1 opacity-10 top-20 left-1/4 fixed" />
      <div className="orb orb-2 opacity-10 bottom-20 right-1/4 fixed" />

      <div className="glass-card rounded-3xl p-8 w-full max-w-md space-y-8 animate-slide-up">
        {/* Logo */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <Package size={30} className="text-background" />
          </div>
          <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            SHAHED STORE
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2 text-muted-foreground text-sm">
            <ShieldCheck size={14} className="text-primary" />
            Admin Dashboard Login
          </div>
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
            {submitting ? (
              <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck size={18} />
                Sign In to Dashboard
              </>
            )}
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
