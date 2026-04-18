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
    if (user) navigate('/dashboard');
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
      <div className="md:hidden h-[64px]" aria-hidden="true" />

      <nav
        className={`md:hidden fixed left-0 right-0 z-40 transition-transform duration-300 ${hidden ? 'translate-y-full' : 'translate-y-0'}`}
        style={{
          bottom: 0,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderTop: '1px solid hsla(var(--border), 0.6)',
          boxShadow: '0 -8px 24px -8px rgba(0,0,0,0.08)',
        }}
        aria-label="Bottom navigation"
      >
        <ul className="grid grid-cols-5 px-1 pt-1.5 pb-1">
          {items.map((item) => {
            const active = isActive(item.path.split('?')[0]) && (item.path === '/' ? location.pathname === '/' : true);
            const Icon = item.icon;
            return (
              <li key={item.label} className="flex">
                <button
                  onClick={item.onClick}
                  className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-all active:scale-95"
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                >
                  <span
                    className="relative flex items-center justify-center w-10 h-7 rounded-xl transition-all"
                    style={{
                      background: active
                        ? 'linear-gradient(145deg, hsl(258,78%,55%), hsl(195,90%,55%))'
                        : 'transparent',
                      boxShadow: active ? '0 4px 12px -2px hsla(258,78%,55%,0.4)' : 'none',
                    }}
                  >
                    <Icon
                      size={20}
                      strokeWidth={active ? 2.4 : 2}
                      style={{ color: active ? '#fff' : 'hsl(var(--muted-foreground))' }}
                    />
                    {item.badge && item.badge > 0 ? (
                      <span
                        className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                        style={{
                          background: 'hsl(0,85%,55%)',
                          color: '#fff',
                          border: '1.5px solid #fff',
                        }}
                      >
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className="text-[10px] font-semibold leading-none"
                    style={{
                      color: active ? 'hsl(258,78%,55%)' : 'hsl(var(--muted-foreground))',
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
