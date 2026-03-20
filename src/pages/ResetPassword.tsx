import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, ShieldCheck, RefreshCw } from 'lucide-react';
import logoIcon from '@/assets/logo-icon.webp';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    // Check if this is a valid recovery session
    const hash = window.location.hash;
    if (hash.includes('type=recovery') || hash.includes('access_token')) {
      setValidSession(true);
    } else {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setValidSession(true);
        else navigate('/');
      });
    }
  }, [navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'); return; }
    if (password !== confirm) { toast.error('পাসওয়ার্ড দুটি মিলছে না'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error('পাসওয়ার্ড পরিবর্তন করা সম্ভব হয়নি');
    } else {
      toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!');
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(160deg, hsl(230,25%,97%) 0%, hsl(243,20%,96%) 100%)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <a href="/" className="flex items-center gap-2.5">
            <img src={logoIcon} alt="Logo" className="w-10 h-10 rounded-xl" />
            <span className="font-black tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif', color: 'hsl(var(--primary))' }}>
              SHAHED STORE
            </span>
          </a>
        </div>

        <div className="bg-card rounded-2xl border p-8 shadow-lg" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'hsl(243,75%,97%)' }}>
              <ShieldCheck size={24} style={{ color: 'hsl(var(--primary))' }} />
            </div>
            <h1 className="text-2xl font-black" style={{ color: 'hsl(var(--foreground))' }}>নতুন পাসওয়ার্ড সেট করুন</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন</p>
          </div>

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>নতুন পাসওয়ার্ড</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="নতুন পাসওয়ার্ড লিখুন"
                  className="w-full rounded-xl pl-10 pr-11 py-3 text-sm outline-none transition-all border bg-muted/30"
                  style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>পাসওয়ার্ড নিশ্চিত করুন</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  placeholder="পাসওয়ার্ড আবার লিখুন"
                  className="w-full rounded-xl pl-10 pr-11 py-3 text-sm outline-none transition-all border bg-muted/30"
                  style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {confirm && password !== confirm && (
                <p className="text-xs mt-1.5" style={{ color: 'hsl(var(--destructive))' }}>পাসওয়ার্ড দুটি মিলছে না</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirm}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}
            >
              {loading ? <><RefreshCw size={15} className="animate-spin" /> পরিবর্তন হচ্ছে...</> : <><ShieldCheck size={15} /> পাসওয়ার্ড পরিবর্তন করুন</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
