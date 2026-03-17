import { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const WalletWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setBalance(data.wallet_balance);
      });
  }, [user]);

  if (!user) return null;

  return (
    <section className="px-4 pb-4 pt-2">
      <div className="max-w-7xl mx-auto">
        <div
          className="relative overflow-hidden rounded-2xl cursor-pointer group"
          style={{
            background: 'linear-gradient(135deg, hsl(258,78%,55%) 0%, hsl(280,70%,45%) 50%, hsl(220,80%,50%) 100%)',
            boxShadow: '0 8px 32px hsl(258,78%,55% / 0.3)',
          }}
          onClick={() => navigate('/dashboard')}
        >
          {/* shimmer top line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          {/* decorative circles */}
          <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10" />
          <div className="absolute -right-4 -bottom-10 w-48 h-48 rounded-full bg-white/5" />

          <div className="relative flex items-center justify-between px-5 py-4">
            {/* Left */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium tracking-wide uppercase">আমার ওয়ালেট</p>
                <p className="text-white text-2xl font-bold mt-0.5">
                  {balance === null ? (
                    <span className="inline-block w-20 h-6 bg-white/20 rounded animate-pulse" />
                  ) : (
                    <>৳&nbsp;{balance.toLocaleString('en-IN')}</>
                  )}
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-white text-sm font-semibold backdrop-blur-sm"
                onClick={e => { e.stopPropagation(); navigate('/dashboard?tab=wallet'); }}
              >
                <TrendingUp className="w-4 h-4" />
                টপ-আপ
              </button>
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 group-hover:bg-white/25 transition-colors">
                <ArrowUpRight className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WalletWidget;
