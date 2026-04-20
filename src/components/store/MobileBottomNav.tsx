import { useEffect, useState } from 'react';
import { Home, Store, Wallet, Package, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AuthModal from './AuthModal';

interface NavItem {
  label: string;
  icon: typeof Home;
  path: string;
  match: (path: string) => boolean;
  badgeCount?: number;
  requireAuth?: boolean;
  gradient: string;
}

/**
 * Modern Mobile Bottom Navigation — 2025 trend.
 * Floating pill, animated active indicator, gradient glow per tab.
 * Hidden on desktop (md+) and admin (/ceo) routes.
 */
const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { wishlistCount } = useWishlist();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [drag, setDrag] = useState<{
    startX: number;
    currentX: number;
    active: boolean;
    pillWidth: number;
  } | null>(null);

  // Auto-hide when keyboard opens on mobile
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

  // Fetch active orders count for the badge (pending / processing)
  useEffect(() => {
    if (!user) {
      setOrderCount(0);
      return;
    }

    const fetchCount = async () => {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing']);
      setOrderCount(count || 0);
    };

    fetchCount();

    // Realtime updates
    const channel = supabase
      .channel('mobile-nav-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        () => fetchCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (location.pathname.startsWith('/ceo')) return null;

  const navItems: NavItem[] = [
    {
      label: 'Home',
      icon: Home,
      path: '/',
      match: (p) => p === '/',
      gradient: 'linear-gradient(135deg, hsl(258 78% 55%), hsl(280 80% 60%))',
    },
    {
      label: 'Shop',
      icon: Store,
      path: '/shop',
      match: (p) => p.startsWith('/shop') || p.startsWith('/product'),
      gradient: 'linear-gradient(135deg, hsl(185 90% 52%), hsl(200 92% 55%))',
    },
    {
      label: 'Wallet',
      icon: Wallet,
      path: '/dashboard?tab=wallet',
      match: (p) => p.startsWith('/dashboard') && location.search.includes('tab=wallet'),
      requireAuth: true,
      gradient: 'linear-gradient(135deg, hsl(160 75% 42%), hsl(175 85% 45%))',
    },
    {
      label: 'Orders',
      icon: Package,
      path: '/dashboard?tab=orders',
      match: (p) => p.startsWith('/dashboard') && location.search.includes('tab=orders'),
      badgeCount: orderCount,
      requireAuth: true,
      gradient: 'linear-gradient(135deg, hsl(25 95% 55%), hsl(15 90% 55%))',
    },
    {
      label: 'Account',
      icon: User,
      path: '/dashboard',
      match: (p) => p === '/dashboard' && !location.search.includes('tab=orders') && !location.search.includes('tab=wallet'),
      requireAuth: true,
      gradient: 'linear-gradient(135deg, hsl(160 75% 45%), hsl(185 90% 52%))',
    },
  ];

  // Find active index for sliding indicator
  const activeIndex = navItems.findIndex((i) => i.match(location.pathname));

  const handleClick = (item: NavItem) => {
    if (item.requireAuth && !user) {
      setAuthOpen(true);
      return;
    }
    navigate(item.path);
  };

  // Apple-style swipe gesture on the indicator pill — drag left/right to switch tabs

  const navigateToIndex = (idx: number) => {
    const target = navItems[idx];
    if (!target) return;
    if (target.requireAuth && !user) {
      setAuthOpen(true);
      return;
    }
    navigate(target.path);
    // Haptic feedback on supported devices
    if ('vibrate' in navigator) {
      try { navigator.vibrate(10); } catch {}
    }
  };

  const onIndicatorPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeIndex < 0) return;
    const parent = e.currentTarget.parentElement;
    if (!parent) return;
    const pillWidth = (parent.clientWidth - 12) / navItems.length;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ startX: e.clientX, currentX: e.clientX, active: true, pillWidth });
  };

  const onIndicatorPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag?.active) return;
    setDrag({ ...drag, currentX: e.clientX });
  };

  const onIndicatorPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag?.active) return;
    const delta = drag.currentX - drag.startX;
    const threshold = drag.pillWidth * 0.4;
    let nextIdx = activeIndex;
    if (delta > threshold) nextIdx = Math.min(navItems.length - 1, activeIndex + 1);
    else if (delta < -threshold) nextIdx = Math.max(0, activeIndex - 1);
    setDrag(null);
    if (nextIdx !== activeIndex) navigateToIndex(nextIdx);
  };

  // Live offset while dragging (clamped within rail)
  const dragOffset = drag?.active
    ? Math.max(
        -activeIndex * drag.pillWidth,
        Math.min((navItems.length - 1 - activeIndex) * drag.pillWidth, drag.currentX - drag.startX)
      )
    : 0;

  return (
    <>
      <nav
        aria-label="Bottom navigation"
        className={`md:hidden fixed left-0 right-0 z-40 transition-all duration-500 ease-out ${
          hidden ? 'translate-y-[150%] opacity-0' : 'translate-y-0 opacity-100'
        }`}
        style={{
          bottom: 0,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="px-3 pb-2 pt-1">
          {/* Floating pill container */}
          <div
            className="relative rounded-[28px] border overflow-hidden"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.75) 100%)',
              backdropFilter: 'blur(28px) saturate(200%)',
              WebkitBackdropFilter: 'blur(28px) saturate(200%)',
              borderColor: 'rgba(255,255,255,0.6)',
              boxShadow:
                '0 12px 40px -8px rgba(88, 28, 200, 0.18), 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
            }}
          >
            {/* Subtle gradient sheen on top */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(120, 80, 230, 0.4), rgba(80, 200, 230, 0.4), transparent)',
              }}
            />

            {/* Sliding active indicator (gradient blob) */}
            {activeIndex >= 0 && (
              <div
                className="absolute top-1.5 bottom-1.5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
                style={{
                  width: `calc((100% - 12px) / ${navItems.length})`,
                  left: `calc(6px + ${activeIndex} * ((100% - 12px) / ${navItems.length}))`,
                }}
              >
                <div
                  className="w-full h-full rounded-2xl"
                  style={{
                    background: navItems[activeIndex].gradient,
                    boxShadow: `0 8px 24px -4px ${
                      navItems[activeIndex].gradient
                        .match(/hsl\([^)]+\)/)?.[0] || 'hsla(258,78%,55%,0.5)'
                    }`,
                    opacity: 0.95,
                  }}
                />
              </div>
            )}

            <ul className="relative grid grid-cols-5 px-1.5 py-1.5">
              {navItems.map((item, idx) => {
                const isActive = idx === activeIndex;
                const Icon = item.icon;
                return (
                  <li key={item.label} className="flex">
                    <button
                      onClick={() => handleClick(item)}
                      aria-label={item.label}
                      aria-current={isActive ? 'page' : undefined}
                      className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-2xl transition-all duration-300 active:scale-90"
                    >
                      <span className="relative">
                        <Icon
                          size={22}
                          strokeWidth={isActive ? 2.6 : 2}
                          className={`transition-all duration-300 ${
                            isActive
                              ? 'text-white scale-110'
                              : 'text-foreground/60'
                          }`}
                          style={
                            isActive
                              ? {
                                  filter:
                                    'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
                                }
                              : undefined
                          }
                        />
                        {item.badgeCount && item.badgeCount > 0 ? (
                          <span
                            className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white border-2 border-white/90 animate-scale-in"
                            style={{
                              background:
                                'linear-gradient(135deg, hsl(0 90% 58%), hsl(15 95% 55%))',
                              boxShadow:
                                '0 2px 8px hsla(0,84%,60%,0.6), 0 0 0 1px rgba(255,255,255,0.4)',
                            }}
                          >
                            {item.badgeCount > 99 ? '99+' : item.badgeCount}
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={`text-[10px] leading-none font-semibold transition-all duration-300 ${
                          isActive
                            ? 'text-white opacity-100 scale-100'
                            : 'text-foreground/55 opacity-90'
                        }`}
                        style={
                          isActive
                            ? { textShadow: '0 1px 2px rgba(0,0,0,0.2)' }
                            : undefined
                        }
                      >
                        {item.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </nav>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};

export default MobileBottomNav;
