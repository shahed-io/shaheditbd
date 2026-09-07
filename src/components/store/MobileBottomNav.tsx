import { useEffect, useState } from 'react';
import { Home, Store, Globe, Package, User, Check } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import AuthModal from './AuthModal';

interface NavItem {
  label: string;
  icon: typeof Home;
  path: string;
  match: (path: string) => boolean;
  badgeCount?: number;
  requireAuth?: boolean;
  gradient: string;
  srText?: string;
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
  const { currencies, active: activeCurrency, setActive: setActiveCurrency } = useCurrency();
  const [authOpen, setAuthOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [orderCount, setOrderCount] = useState(0);

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

  // Show on scroll-up, hide on scroll-down. Always show near the top of the page.
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const SCROLL_THRESHOLD = 8; // ignore tiny wobbles
    const TOP_ZONE = 80; // always show near the top

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastY;

        if (currentY < TOP_ZONE) {
          setHidden(false);
        } else if (Math.abs(delta) > SCROLL_THRESHOLD) {
          // Scrolling down → hide; scrolling up → show
          setHidden(delta > 0);
        }

        lastY = currentY;
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
      gradient: 'linear-gradient(135deg, hsl(192 78% 55%), hsl(216 80% 60%))',
    },
    {
      label: 'Shop',
      icon: Store,
      path: '/shop',
      match: (p) => p.startsWith('/shop') || p.startsWith('/product'),
      gradient: 'linear-gradient(135deg, hsl(185 90% 52%), hsl(200 92% 55%))',
    },
    {
      label: activeCurrency?.code || 'BDT',
      icon: Globe, // replaced by custom coin badge in render
      path: '__currency__',
      match: () => currencyOpen,
      gradient: 'linear-gradient(135deg, hsl(38 95% 55%), hsl(28 90% 50%))',
      isCurrency: true,
      currencySymbol: activeCurrency?.symbol || '৳',
    } as NavItem & { isCurrency?: boolean; currencySymbol?: string },
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
      path: '/dashboard?tab=profile',
      match: (p) => p === '/dashboard' && (!location.search || location.search.includes('tab=profile')),
      requireAuth: true,
      gradient: 'linear-gradient(135deg, hsl(160 75% 45%), hsl(185 90% 52%))',
    },
  ];

  // Find active index for sliding indicator
  const activeIndex = navItems.findIndex((i) => i.match(location.pathname));

  const handleClick = (item: NavItem) => {
    if (item.path === '__currency__') {
      setCurrencyOpen(true);
      return;
    }
    if (item.requireAuth && !user) {
      setAuthOpen(true);
      return;
    }
    setHidden(false);
    navigate(item.path, {
      replace: location.pathname === '/dashboard',
      state: { mobileNavTap: Date.now() },
    });
  };


  return (
    <>
      <nav
        aria-label="Bottom navigation"
        className={`md:hidden fixed left-0 right-0 z-40 transition-all duration-500 ease-out ${
          hidden ? 'translate-y-[150%] opacity-0' : 'translate-y-0 opacity-100'
        }`}
        data-nav-placement="bottom"
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

            {/* Sliding active indicator (gradient blob) — purely visual, never blocks taps */}
            {activeIndex >= 0 && (
              <div
                className="absolute top-1.5 bottom-1.5 z-0 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{
                  width: `calc((100% - 12px) / ${navItems.length})`,
                  left: `calc(6px + ${activeIndex} * ((100% - 12px) / ${navItems.length}))`,
                }}
              >
                <div
                  className="w-full h-full rounded-2xl"
                  style={{
                    background: navItems[activeIndex].gradient,
                    boxShadow: `0 10px 28px -6px ${
                      navItems[activeIndex].gradient
                        .match(/hsl\([^)]+\)/)?.[0] || 'hsla(192,78%,55%,0.55)'
                    }, 0 4px 12px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.12)`,
                    opacity: 1,
                    transform: 'scale(1)',
                    transition: 'transform 0.2s',
                    border: '1.5px solid rgba(255,255,255,0.55)',
                  }}
                />
              </div>
            )}

            <ul
              className="relative z-10 grid grid-cols-5 px-1.5 py-1.5 touch-pan-y"
            >
              {navItems.map((item, idx) => {
                const isActive = idx === activeIndex;
                const Icon = item.icon;
                return (
                  <li key={item.label} className="flex">
                    <button
                      onClick={() => handleClick(item)}
                      aria-label={item.label}
                      aria-current={isActive ? 'page' : undefined}
                      className="relative z-10 flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-2xl transition-all duration-300 active:scale-90"
                    >
                      {item.srText && <span className="sr-only">{item.srText}</span>}
                      <span className="relative">
                        {(item as any).isCurrency ? (
                          <span
                            aria-hidden
                            className={`flex items-center justify-center rounded-full leading-none font-extrabold text-primary-foreground transition-all duration-300 ${
                              isActive ? 'w-7 h-7 text-[17px] scale-110' : 'w-[22px] h-[22px] text-[14px]'
                            }`}
                            style={{
                              background:
                                'linear-gradient(135deg, hsl(var(--primary)/0.85) 0%, hsl(var(--primary)) 55%, hsl(var(--primary)/0.75) 100%)',
                              boxShadow: isActive
                                ? 'inset 0 1px 0 hsl(var(--primary-foreground)/0.35), 0 0 0 1.5px rgba(255,255,255,0.9), 0 2px 8px hsl(var(--primary)/0.55)'
                                : 'inset 0 1px 0 hsl(var(--primary-foreground)/0.35), 0 0 10px hsl(var(--primary)/0.35)',
                              fontFamily:
                                "'Noto Sans Bengali', 'Hind Siliguri', system-ui, sans-serif",
                            }}
                          >
                            <span className="translate-y-[-1px]">
                              {(item as any).currencySymbol || '৳'}
                            </span>
                          </span>
                        ) : (
                          <Icon
                            size={22}
                            strokeWidth={isActive ? 2.6 : 2}
                            className={`transition-all duration-300 ${
                              isActive ? 'text-white scale-110' : 'text-foreground/60'
                            }`}
                            style={
                              isActive
                                ? { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }
                                : undefined
                            }
                          />
                        )}
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

      <Sheet open={currencyOpen} onOpenChange={setCurrencyOpen}>
        <SheetContent
          side="bottom"
          className="md:hidden rounded-t-3xl border-t p-0 max-h-[75vh] overflow-hidden"
        >
          <SheetHeader className="px-5 pt-5 pb-3 text-left">
            <SheetTitle className="text-base font-bold">Select Currency</SheetTitle>
            <p className="text-xs text-muted-foreground">
              Payment is always settled in BDT
            </p>
          </SheetHeader>
          <div className="px-3 pb-6 overflow-y-auto max-h-[60vh]">
            <ul className="grid gap-1.5">
              {currencies.map((c) => {
                const isActive = activeCurrency?.code === c.code;
                return (
                  <li key={c.code}>
                    <button
                      onClick={() => {
                        setActiveCurrency(c.code);
                        setCurrencyOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all active:scale-[0.98] ${
                        isActive
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-muted/60 border border-transparent'
                      }`}
                    >
                      <span className="text-2xl leading-none">{c.flag_emoji || '🌐'}</span>
                      <span className="flex-1 text-left">
                        <span className="block text-sm font-semibold">
                          {c.code} <span className="opacity-60 font-normal">— {c.name}</span>
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          {c.symbol} · 1 {c.code} = {c.rate_from_bdt} BDT
                        </span>
                      </span>
                      {isActive && <Check className="w-5 h-5 text-primary" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MobileBottomNav;
