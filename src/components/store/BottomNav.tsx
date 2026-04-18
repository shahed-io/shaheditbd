import { Home, ShoppingBag, Search, Heart, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import AuthModal from './AuthModal';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { wishlistItems } = useWishlist();
  const { user } = useAuth();
  const [hidden, setHidden] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

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

  const items = [
    { label: 'Home',     icon: Home,        path: '/',          onClick: () => navigate('/') },
    { label: 'Shop',     icon: ShoppingBag, path: '/shop',      onClick: () => navigate('/shop') },
    { label: 'Search',   icon: Search,      path: '/shop?focus=search', onClick: () => navigate('/shop?focus=search') },
    { label: 'Wishlist', icon: Heart,       path: '/dashboard?tab=wishlist', onClick: handleWishlistClick, badge: wishlistItems.length },
    { label: 'Account',  icon: User,        path: user ? '/dashboard' : '/account',  onClick: handleAccountClick },
  ];

  return (
    <>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      {/* Spacer so content isn't hidden behind the bar */}
      <div className="md:hidden h-[72px]" aria-hidden="true" />

      <nav
        className={`md:hidden fixed left-2 right-2 z-40 transition-all duration-300 ${hidden ? 'translate-y-[120%] opacity-0' : 'translate-y-0 opacity-100'}`}
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,255,255,0.72))',
          backdropFilter: 'blur(28px) saturate(200%)',
          WebkitBackdropFilter: 'blur(28px) saturate(200%)',
          border: '1px solid hsla(0,0%,100%,0.7)',
          borderRadius: 24,
          boxShadow:
            '0 -2px 0 hsla(0,0%,100%,0.9) inset, 0 12px 32px -8px hsla(258,78%,40%,0.18), 0 4px 14px -4px rgba(0,0,0,0.08)',
        }}
        aria-label="Bottom navigation"
      >
        {/* Top accent gradient line */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-16 rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent, hsla(258,78%,55%,0.5), transparent)',
          }}
        />

        <ul className="grid grid-cols-5 px-2 py-2">
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
                    <span
                      aria-hidden
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full pointer-events-none"
                      style={{
                        background: 'radial-gradient(circle, hsla(258,78%,55%,0.35), transparent 70%)',
                        filter: 'blur(8px)',
                      }}
                    />
                  )}

                  <span
                    className="relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300"
                    style={{
                      background: active
                        ? 'linear-gradient(145deg, hsl(258,78%,58%), hsl(195,90%,55%))'
                        : 'transparent',
                      boxShadow: active
                        ? '0 6px 16px -4px hsla(258,78%,55%,0.5), inset 0 1px 0 hsla(0,0%,100%,0.4)'
                        : 'none',
                      transform: active ? 'translateY(-6px) scale(1.05)' : 'translateY(0) scale(1)',
                      border: active ? '2px solid #fff' : '2px solid transparent',
                    }}
                  >
                    <Icon
                      size={active ? 21 : 20}
                      strokeWidth={active ? 2.6 : 2}
                      style={{
                        color: active ? '#fff' : 'hsl(226,20%,45%)',
                        filter: active ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' : 'none',
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                    />
                    {item.badge && item.badge > 0 ? (
                      <span
                        className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center animate-pulse"
                        style={{
                          background: 'linear-gradient(135deg, hsl(0,90%,58%), hsl(15,95%,55%))',
                          color: '#fff',
                          border: '2px solid #fff',
                          boxShadow: '0 2px 6px hsla(0,90%,55%,0.5)',
                        }}
                      >
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className="text-[10px] font-bold leading-none tracking-wide transition-all duration-300"
                    style={{
                      color: active ? 'hsl(258,78%,52%)' : 'hsl(226,15%,52%)',
                      transform: active ? 'translateY(-2px)' : 'translateY(0)',
                      textShadow: active ? '0 1px 2px hsla(258,78%,55%,0.15)' : 'none',
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
    </>
  );
};

export default BottomNav;
