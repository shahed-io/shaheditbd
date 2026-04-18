import { Home, ShoppingBag, Package, Heart, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AuthModal from './AuthModal';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { wishlistItems } = useWishlist();
  const { user } = useAuth();
  
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  // Fetch profile (avatar + name) for logged-in user
  useEffect(() => {
    if (!user) { setAvatarUrl(null); setDisplayName(''); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, display_name, username')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      setAvatarUrl(data?.avatar_url || (user.user_metadata as any)?.avatar_url || null);
      setDisplayName(data?.display_name || data?.username || (user.user_metadata as any)?.full_name || user.email?.split('@')[0] || '');
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Fetch active orders count for logged-in user
  useEffect(() => {
    if (!user) { setPendingOrders(0); return; }
    let cancelled = false;
    const fetchCount = async () => {
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing']);
      if (!cancelled) setPendingOrders(count || 0);
    };
    fetchCount();
    const channel = supabase
      .channel('bottomnav-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, fetchCount)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [user]);

  // Hide on admin / checkout routes
  const hideOnRoutes = ['/ceo', '/checkout', '/reset-password'];
  const shouldHide = hideOnRoutes.some(r => location.pathname.startsWith(r));

  // Auto-hide on scroll down (mobile UX)
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastY && y > 80) setHidden(true);
      else setHidden(false);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (shouldHide) return null;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleAccountClick = () => {
    if (user) navigate('/dashboard?tab=profile');
    else setAuthOpen(true);
  };

  const handleWishlistClick = () => {
    if (user) navigate('/dashboard?tab=wishlist');
    else setAuthOpen(true);
  };

  const handleOrdersClick = () => {
    if (user) navigate('/dashboard?tab=orders');
    else setAuthOpen(true);
  };

  const items = [
    { label: 'Home',     icon: Home,        path: '/',          onClick: () => navigate('/') },
    { label: 'Shop',     icon: ShoppingBag, path: '/shop',      onClick: () => navigate('/shop') },
    { label: 'Orders',   icon: Package,     path: '/dashboard?tab=orders', onClick: handleOrdersClick, badge: pendingOrders },
    { label: 'Wishlist', icon: Heart,       path: '/dashboard?tab=wishlist', onClick: handleWishlistClick, badge: wishlistItems.length },
    { label: 'Account',  icon: User,        path: user ? '/dashboard' : '/account',  onClick: handleAccountClick },
  ];

  return (
    <>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      {/* Spacer so content isn't hidden behind the bar */}
      <div className="md:hidden h-[84px]" aria-hidden="true" />

      {/* Outer wrapper for floating gradient halo */}
      <div
        className={`md:hidden fixed left-3 right-3 z-40 transition-all duration-500 ${hidden ? 'translate-y-[140%] opacity-0' : 'translate-y-0 opacity-100'}`}
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)',
        }}
      >
        {/* Ambient glow halo behind the bar */}
        <div
          aria-hidden
          className="absolute inset-x-6 -bottom-2 h-8 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, hsla(258,78%,55%,0.35), transparent 70%)',
            filter: 'blur(16px)',
          }}
        />

        <nav
          className="relative"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,255,255,0.78))',
            backdropFilter: 'blur(32px) saturate(220%)',
            WebkitBackdropFilter: 'blur(32px) saturate(220%)',
            border: '1.5px solid hsla(0,0%,100%,0.85)',
            borderRadius: 28,
            boxShadow:
              '0 -2px 0 hsla(0,0%,100%,0.95) inset, 0 1px 0 hsla(258,78%,55%,0.12) inset, 0 18px 40px -10px hsla(258,78%,40%,0.28), 0 6px 18px -4px rgba(0,0,0,0.1)',
            overflow: 'visible',
          }}
          aria-label="Bottom navigation"
        >
          {/* Gradient border accent (top) */}
          <div
            aria-hidden
            className="absolute -top-px left-4 right-4 h-px rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, hsla(258,78%,55%,0.6), hsla(195,90%,55%,0.6), transparent)',
            }}
          />
          {/* Centered indicator dot */}
          <div
            className="absolute top-1.5 left-1/2 -translate-x-1/2 h-[3px] w-10 rounded-full"
            style={{
              background: 'linear-gradient(90deg, hsl(258,78%,55%), hsl(195,90%,55%))',
              opacity: 0.5,
            }}
          />

          <ul className="grid grid-cols-5 px-2 pt-3 pb-2">
            {items.map((item) => {
              const active = isActive(item.path.split('?')[0]) && (item.path === '/' ? location.pathname === '/' : true);
              const Icon = item.icon;
              return (
                <li key={item.label} className="flex">
                  <button
                    onClick={item.onClick}
                    className="relative flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-2xl transition-all active:scale-90"
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                  >
                    {/* Active glow underneath */}
                    {active && (
                      <>
                        <span
                          aria-hidden
                          className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full pointer-events-none"
                          style={{
                            background: 'radial-gradient(circle, hsla(258,78%,55%,0.45), transparent 70%)',
                            filter: 'blur(10px)',
                          }}
                        />
                        {/* Sparkle accents */}
                        <span
                          aria-hidden
                          className="absolute -top-2 left-[30%] w-1 h-1 rounded-full animate-pulse"
                          style={{ background: 'hsl(195,90%,65%)', boxShadow: '0 0 6px hsl(195,90%,65%)' }}
                        />
                        <span
                          aria-hidden
                          className="absolute -top-1 right-[28%] w-1 h-1 rounded-full animate-pulse"
                          style={{ background: 'hsl(258,78%,65%)', boxShadow: '0 0 6px hsl(258,78%,65%)', animationDelay: '0.3s' }}
                        />
                      </>
                    )}

                    {/* Outer ring for active */}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute -top-2 left-1/2 -translate-x-1/2 w-[52px] h-[52px] rounded-full pointer-events-none"
                        style={{
                          background: 'conic-gradient(from 0deg, hsl(258,78%,55%), hsl(195,90%,55%), hsl(258,78%,55%))',
                          padding: 2,
                          opacity: 0.6,
                          mask: 'radial-gradient(circle, transparent 60%, black 62%)',
                          WebkitMask: 'radial-gradient(circle, transparent 60%, black 62%)',
                        }}
                      />
                    )}

                    <span
                      className="relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-500"
                      style={{
                        background: active
                          ? 'linear-gradient(145deg, hsl(258,78%,60%), hsl(220,85%,58%) 50%, hsl(195,90%,55%))'
                          : 'linear-gradient(145deg, hsla(258,40%,96%,0.6), hsla(195,40%,96%,0.4))',
                        boxShadow: active
                          ? '0 10px 24px -6px hsla(258,78%,55%,0.6), 0 4px 10px -2px hsla(195,90%,55%,0.4), inset 0 1px 0 hsla(0,0%,100%,0.5), inset 0 -2px 4px hsla(258,78%,30%,0.2)'
                          : 'inset 0 1px 0 hsla(0,0%,100%,0.6), 0 1px 2px hsla(258,30%,40%,0.05)',
                        transform: active ? 'translateY(-10px) scale(1.1)' : 'translateY(0) scale(1)',
                        border: active ? '2.5px solid #fff' : '1.5px solid hsla(0,0%,100%,0.5)',
                      }}
                    >
                      {item.label === 'Account' && user && avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={displayName || 'Account'}
                          className="w-full h-full object-cover rounded-2xl"
                          style={{
                            filter: active ? 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))' : 'none',
                          }}
                        />
                      ) : item.label === 'Account' && user && displayName ? (
                        <span
                          className="font-black text-base uppercase"
                          style={{
                            color: active ? '#fff' : 'hsl(258,78%,55%)',
                            filter: active ? 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))' : 'none',
                          }}
                        >
                          {displayName.charAt(0)}
                        </span>
                      ) : (
                        <Icon
                          size={active ? 22 : 20}
                          strokeWidth={active ? 2.8 : 2}
                          style={{
                            color: active ? '#fff' : 'hsl(226,25%,42%)',
                            filter: active ? 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))' : 'none',
                            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          }}
                        />
                      )}
                      {item.badge && item.badge > 0 ? (
                        <span
                          className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full text-[10px] font-black flex items-center justify-center"
                          style={{
                            background: 'linear-gradient(135deg, hsl(0,90%,60%), hsl(15,95%,55%))',
                            color: '#fff',
                            border: '2.5px solid #fff',
                            boxShadow: '0 3px 8px hsla(0,90%,55%,0.6), 0 0 0 1px hsla(0,90%,40%,0.3)',
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                          }}
                        >
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className="text-[10px] font-extrabold leading-none tracking-wide transition-all duration-500 mt-0.5"
                      style={{
                        background: active
                          ? 'linear-gradient(90deg, hsl(258,78%,52%), hsl(195,90%,48%))'
                          : 'none',
                        WebkitBackgroundClip: active ? 'text' : 'unset',
                        backgroundClip: active ? 'text' : 'unset',
                        WebkitTextFillColor: active ? 'transparent' : 'hsl(226,18%,48%)',
                        color: active ? 'transparent' : 'hsl(226,18%,48%)',
                        transform: active ? 'translateY(-4px) scale(1.05)' : 'translateY(0) scale(1)',
                      }}
                    >
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default BottomNav;
