import { useEffect, useState } from 'react';
import { Home, Store, Heart, ShoppingBag, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from './AuthModal';

interface NavItem {
  label: string;
  icon: typeof Home;
  path: string;
  match: (path: string) => boolean;
  badgeCount?: number;
  requireAuth?: boolean;
}

/**
 * Mobile-only bottom navigation bar.
 * Hidden on desktop (md+) and on admin (/ceo) routes.
 * Glassmorphism styling matches the rest of the site.
 */
const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items } = useCart();
  const { wishlist } = useWishlist();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Auto-hide when keyboard is open (mobile) — focused input pushes layout
  useEffect(() => {
    const onFocus = (e: FocusEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
        setHidden(true);
      }
    };
    const onBlur = () => setHidden(false);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', onBlur);
    return () => {
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('focusout', onBlur);
    };
  }, []);

  // Don't render on admin routes
  if (location.pathname.startsWith('/ceo')) return null;

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const wishlistCount = wishlist.length;

  const items_: NavItem[] = [
    { label: 'Home',     icon: Home,        path: '/',          match: (p) => p === '/' },
    { label: 'Shop',     icon: Store,       path: '/shop',      match: (p) => p.startsWith('/shop') || p.startsWith('/product') },
    { label: 'Wishlist', icon: Heart,       path: '/dashboard?tab=wishlist', match: (p) => p === '/wishlist', badgeCount: wishlistCount, requireAuth: true },
    { label: 'Cart',     icon: ShoppingBag, path: '/checkout',  match: (p) => p === '/checkout', badgeCount: cartCount },
    { label: 'Account',  icon: User,        path: '/dashboard', match: (p) => p === '/dashboard', requireAuth: true },
  ];

  const handleClick = (item: NavItem) => {
    if (item.requireAuth && !user) {
      setAuthOpen(true);
      return;
    }
    navigate(item.path);
  };

  return (
    <>
      <nav
        aria-label="Bottom navigation"
        className={`md:hidden fixed left-0 right-0 z-40 transition-transform duration-300 ${
          hidden ? 'translate-y-full' : 'translate-y-0'
        }`}
        style={{
          bottom: 0,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div
          className="mx-2 mb-2 rounded-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
          style={{
            background: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          }}
        >
          <ul className="grid grid-cols-5 px-1 py-1.5">
            {items_.map((item) => {
              const isActive = item.match(location.pathname);
              const Icon = item.icon;
              return (
                <li key={item.label} className="flex">
                  <button
                    onClick={() => handleClick(item)}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-all active:scale-95"
                  >
                    {/* Active gradient pill behind icon */}
                    {isActive && (
                      <span
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full"
                        style={{
                          background: 'linear-gradient(90deg, hsl(258 78% 55%), hsl(185 90% 52%))',
                        }}
                      />
                    )}

                    <span className="relative">
                      <Icon
                        size={22}
                        strokeWidth={isActive ? 2.4 : 2}
                        className={`transition-all ${
                          isActive ? 'text-primary scale-110' : 'text-muted-foreground'
                        }`}
                        style={
                          isActive
                            ? { filter: 'drop-shadow(0 2px 6px hsla(258,78%,55%,0.4))' }
                            : undefined
                        }
                      />
                      {item.badgeCount && item.badgeCount > 0 ? (
                        <span
                          className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                          style={{
                            background: 'linear-gradient(135deg, hsl(0 84% 60%), hsl(15 90% 55%))',
                            boxShadow: '0 2px 6px hsla(0,84%,60%,0.5)',
                          }}
                        >
                          {item.badgeCount > 99 ? '99+' : item.badgeCount}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={`text-[10px] leading-none font-semibold transition-colors ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};

export default MobileBottomNav;
