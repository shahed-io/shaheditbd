import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Menu, X, ShoppingCart, User, LogOut, LayoutDashboard, ChevronDown, Star, Shield, Phone, Mail, Sparkles, Search, Download, Share2, PlusSquare, Package, Key, Wallet, Award, Heart, MapPin, Bell, Gift, Lock, Globe, ShieldCheck, ChevronRight, Facebook, MessageCircle, Instagram, Send, Moon, Sun, LogIn } from 'lucide-react';
import { useFooterSettings } from '@/hooks/useFooterSettings';
import { useTheme } from '@/hooks/useTheme';
import AuthModal from './AuthModal';
import BrandLogo from './BrandLogo';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { prefetchRoute } from '@/hooks/usePrefetchRoute';

const DesktopSearchPalette = lazy(() => import('./SearchBar').then((mod) => ({ default: mod.DesktopSearchPalette })));
const MobileSearchOverlay = lazy(() => import('./SearchBar').then((mod) => ({ default: mod.MobileSearchOverlay })));

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Module-level cache so categories aren't re-fetched on every mount
let _catCache: NavCategory[] | null = null;
let _catFetchedAt = 0;
const CAT_TTL = 5 * 60 * 1000; // 5 minutes

const NAV_LINKS = [
  { label: 'Home',         href: '/' },
  { label: 'All Products', href: '/shop' },
  { label: 'Blog',         href: '/blog' },
  { label: 'Free Tools',   href: '/free-tools' },
];

const CAT_ICON_MAP: Record<string, { icon: string; color: string }> = {
  'Windows':      { icon: '🪟', color: 'hsla(210,90%,60%,0.12)' },
  'Office':       { icon: '📦', color: 'hsla(25,90%,60%,0.12)' },
  'Microsoft Office': { icon: '📦', color: 'hsla(258,78%,55%,0.12)' },
  'Software':     { icon: '💻', color: 'hsla(263,70%,62%,0.12)' },
  'VPN':          { icon: '🔒', color: 'hsla(200,90%,45%,0.12)' },
  'Subscription': { icon: '🎬', color: 'hsla(283,65%,62%,0.12)' },
  'Antivirus':    { icon: '🛡️', color: 'hsla(162,72%,38%,0.12)' },
  'Streaming':    { icon: '📺', color: 'hsla(0,80%,62%,0.12)' },
  'default':      { icon: '🛒', color: 'hsla(243,75%,62%,0.12)' },
};

interface NavCategory {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  count: number;
}

const Navbar = () => {
  const { settings: footerSettings } = useFooterSettings();
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [authOpen,      setAuthOpen]      = useState(false);
  const [scrolled,      setScrolled]      = useState(false);
  const [catOpen,       setCatOpen]       = useState(false);
  const [avatarUrl,     setAvatarUrl]     = useState<string | null>(null);
  const [announcement,  setAnnouncement]  = useState<string | null>(null);
  const [mobileSearch,  setMobileSearch]  = useState(false);
  const [desktopSearch, setDesktopSearch] = useState(false);
  const [navCategories, setNavCategories] = useState<NavCategory[]>([]);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userStats, setUserStats] = useState<{ wallet: number; points: number; orders: number; wishlist: number } | null>(null);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  
  const { user } = useAuth();
  const { cartCount, setCartOpen } = useCart();
  const { activeTheme, saveTheme } = useTheme();
  const navigate = useNavigate();

  const [imgVersion] = useState(() => Date.now());

  const loadNavCategories = async (force = false) => {
    // Use cache if fresh
    const now = Date.now();
    if (!force && _catCache && now - _catFetchedAt < CAT_TTL) {
      setNavCategories(_catCache);
      return;
    }
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, slug, image_url, products!products_category_id_fkey(id)')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (!categories) return;
    const HIDDEN = ['Adobe', 'Antivirus', 'Streaming'];
    const mapped = categories
      .map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image_url: (c as any).image_url || null,
        count: Array.isArray((c as any).products) ? (c as any).products.length : 0,
      }))
      .filter(c => c.count > 0 && !HIDDEN.includes(c.name));
    _catCache = mapped;
    _catFetchedAt = Date.now();
    setNavCategories(mapped);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setDesktopSearch(true); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!user) { setAvatarUrl(null); setIsAdmin(false); setUserStats(null); return; }
    const t = setTimeout(() => {
      supabase.from('profiles').select('avatar_url, display_name, wallet_balance, points_balance').eq('user_id', user.id).single()
        .then(({ data }) => {
          if (data?.avatar_url) setAvatarUrl(data.avatar_url);
          if (data) {
            setUserStats(prev => ({
              wallet: Number(data.wallet_balance) || 0,
              points: Number(data.points_balance) || 0,
              orders: prev?.orders || 0,
              wishlist: prev?.wishlist || 0,
            }));
          }
        });
      supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle()
        .then(({ data }) => { setIsAdmin(!!data); });
    }, 500);
    return () => clearTimeout(t);
  }, [user]);

  // Fetch order/wishlist counts only when mobile menu opens (lazy)
  useEffect(() => {
    if (!user || !mobileOpen) return;
    let cancelled = false;
    Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('wishlists').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]).then(([o, w]) => {
      if (cancelled) return;
      setUserStats(prev => prev ? { ...prev, orders: o.count || 0, wishlist: w.count || 0 } : prev);
    });
    return () => { cancelled = true; };
  }, [user, mobileOpen]);

  useEffect(() => {
    const run = () => {
      supabase.from('site_settings').select('value').eq('key', 'announcement_text').eq('category', 'marketing').maybeSingle()
        .then(({ data }) => { if (data?.value) setAnnouncement(data.value); });
    };

    const t = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        (window as Window & {
          requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
        }).requestIdleCallback?.(() => run(), { timeout: 3000 });
      } else {
        run();
      }
    }, 2200);

    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!mobileOpen || navCategories.length > 0) return;
    loadNavCategories();
  }, [mobileOpen, navCategories.length]);

  // PWA Install detection
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua);
    setIsIOS(ios);
    if (ios) { setCanInstall(true); return; }
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) { setShowIOSTip(v => !v); return; }
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === 'accepted') setCanInstall(false);
    deferredPrompt.current = null;
  };

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const initials    = displayName[0].toUpperCase();

  return (
    <>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {/* ── Desktop Search Overlay ── */}
      {desktopSearch && (
        <Suspense fallback={null}>
          <div className="fixed inset-0 z-[999] hidden md:flex items-start justify-center pt-20 px-4"
            style={{ background: 'hsla(226,35%,10%,0.55)', backdropFilter: 'blur(6px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setDesktopSearch(false); }}>
            <div className="w-full max-w-2xl xl:max-w-3xl rounded-3xl overflow-hidden shadow-[0_32px_80px_hsla(226,35%,10%,0.40)] flex flex-col"
              style={{ background: 'hsl(var(--card))', border: '1.5px solid hsl(var(--border))', maxHeight: '80vh' }}>
              <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(263,70%,58%))' }} />
              <DesktopSearchPalette onClose={() => setDesktopSearch(false)} />
            </div>
          </div>
        </Suspense>
      )}

      {/* ── Fixed wrapper for announcement + navbar ── */}
      <div className="fixed top-0 left-0 right-0 z-50">

      {/* ── Top Announcement Bar — hides on scroll ── */}
      <div className="w-full text-white text-xs font-medium py-2 flex items-center overflow-hidden relative transition-all duration-300"
        style={{
          background: 'linear-gradient(90deg, hsl(258,78%,50%), hsl(200,90%,42%), hsl(258,78%,50%))',
          maxHeight: scrolled ? '0px' : '40px',
          opacity: scrolled ? 0 : 1,
          padding: scrolled ? '0' : undefined,
        }}>
        <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />

        <div className="flex items-center gap-4 pl-4 flex-shrink-0 relative z-10">
          <a href="tel:01840099853" className="flex items-center gap-1.5 hover:text-white/80 transition-colors">
            <Phone size={11} /> 01840-099853
          </a>
          <a href="mailto:info@shahedstore.com.bd" className="hidden sm:flex items-center gap-1.5 hover:text-white/80 transition-colors">
            <Mail size={11} /> info@shahedstore.com.bd
          </a>
        </div>

        <div className="flex-1 overflow-hidden mx-3 relative z-10">
          <div className="flex items-center gap-1.5 font-bold text-[11px]"
            style={{ animation: 'marquee 28s linear infinite', whiteSpace: 'nowrap', display: 'inline-flex' }}>
            <Sparkles size={11} className="text-yellow-300 flex-shrink-0" />
            <span>
              {announcement || 'FREE instant delivery • সব অর্ডারে ফ্রি ডেলিভারি • ৫০% ছাড় সীমিত সময়ের জন্য'}
            </span>
            <span className="ml-16">
              <Sparkles size={11} className="text-yellow-300 inline mr-1.5" />
              {announcement || 'FREE instant delivery • সব অর্ডারে ফ্রি ডেলিভারি • ৫০% ছাড় সীমিত সময়ের জন্য'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] pr-4 flex-shrink-0 relative z-10">
          <span className="hidden md:flex items-center gap-1"><Star size={10} fill="currentColor" /> 4.9/5</span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'hsla(0,0%,100%,0.18)' }}>
            <Shield size={10} /> Secured
          </span>
          <div className="hidden sm:flex items-center gap-1.5 ml-1 border-l border-white/30 pl-2">
            {footerSettings.facebook_url && (
              <a href={footerSettings.facebook_url} target="_blank" rel="noopener noreferrer" className="hover:text-yellow-300 transition-colors" title="Facebook">
                <Facebook size={13} />
              </a>
            )}
            {footerSettings.whatsapp_url && (
              <a href={footerSettings.whatsapp_url} target="_blank" rel="noopener noreferrer" className="hover:text-yellow-300 transition-colors" title="WhatsApp">
                <MessageCircle size={13} />
              </a>
            )}
            {footerSettings.instagram_url && (
              <a href={footerSettings.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-yellow-300 transition-colors" title="Instagram">
                <Instagram size={13} />
              </a>
            )}
            {footerSettings.telegram_url && (
              <a href={footerSettings.telegram_url} target="_blank" rel="noopener noreferrer" className="hover:text-yellow-300 transition-colors" title="Telegram">
                <Send size={13} />
              </a>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>

      {/* ── Main Navbar — Glassmorphism Card ── */}
      <div className="px-4 py-2" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'var(--glass-bg)' }}>
      <nav
        className="transition-all duration-300 rounded-2xl mx-auto w-full max-w-[1800px]"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(28px) saturate(200%)',
          WebkitBackdropFilter: 'blur(28px) saturate(200%)',
          border: '1.5px solid var(--glass-border)',
          boxShadow: scrolled
            ? '0 8px 40px hsla(var(--brand-h),var(--brand-s),var(--brand-l),0.18), inset 0 1px 0 hsla(0,0%,100%,0.6)'
            : 'var(--glass-shadow)',
        }}>
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-[68px] gap-4">

            {/* Logo */}
            <a href="/" className="flex items-center flex-shrink-0 group select-none">
              <BrandLogo size="md" />
            </a>

            {/* Desktop Search Trigger */}
            <button
              onClick={() => setDesktopSearch(true)}
              className="hidden md:flex flex-1 max-w-[460px] items-center gap-2 rounded-xl border px-3 py-1.5 text-left transition-all hover:border-primary/50 hover:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] group"
              style={{ borderColor: 'hsla(258,78%,60%,0.20)', background: 'hsla(258,78%,55%,0.04)' }}
            >
              <Search size={14} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              <span className="text-sm text-muted-foreground flex-1">প্রোডাক্ট খুঁজুন...</span>
              <kbd className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-border/60 text-[10px] font-mono text-muted-foreground bg-muted/40 flex-shrink-0">
                Ctrl K
              </kbd>
            </button>

            {/* Desktop Links */}
            {/* Desktop Links — footer chip style */}
            <div className="hidden lg:flex items-center gap-2">
              {NAV_LINKS.map(link => {
                const isActive = typeof window !== 'undefined' && window.location.pathname === link.href;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={e => {
                      // SPA navigation — no full page reload
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                      e.preventDefault();
                      navigate(link.href);
                    }}
                    onMouseEnter={e => {
                      // Prefetch route chunk for instant nav
                      prefetchRoute(link.href);
                      if (!isActive) {
                        e.currentTarget.style.color = 'hsl(258,78%,45%)';
                        e.currentTarget.style.border = '1px solid hsla(258,78%,75%,0.35)';
                        e.currentTarget.style.boxShadow = '0 2px 10px hsla(258,78%,55%,0.12)';
                        e.currentTarget.style.background = 'hsla(258,78%,55%,0.07)';
                      }
                    }}
                    onTouchStart={() => prefetchRoute(link.href)}
                    onFocus={() => prefetchRoute(link.href)}
                    className="flex items-center px-4 py-1.5 rounded-lg transition-all duration-200 font-bold text-sm whitespace-nowrap hover:scale-105"
                    style={{
                      background: isActive ? 'linear-gradient(135deg, hsla(258,78%,55%,0.12), hsla(200,90%,45%,0.08))' : 'hsla(0,0%,100%,0.70)',
                      backdropFilter: 'blur(10px)',
                      color: isActive ? 'hsl(258,78%,45%)' : 'hsl(226,35%,30%)',
                      border: isActive ? '1px solid hsla(258,78%,75%,0.35)' : '1px solid hsla(258,78%,75%,0.22)',
                      boxShadow: isActive
                        ? '0 2px 10px hsla(258,78%,55%,0.15)'
                        : '0 1px 4px hsla(226,35%,12%,0.05)',
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'hsl(226,35%,30%)';
                        e.currentTarget.style.border = '1px solid hsla(258,78%,75%,0.22)';
                        e.currentTarget.style.boxShadow = '0 1px 4px hsla(226,35%,12%,0.05)';
                        e.currentTarget.style.background = 'hsla(0,0%,100%,0.70)';
                      }
                    }}>
                    {link.label}
                  </a>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              {user ? (
                <div className="hidden sm:flex items-center gap-1">
                  <button onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{ color: 'hsl(226,35%,28%)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'hsla(258,78%,55%,0.08)'; e.currentTarget.style.color = 'hsl(258,78%,48%)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'hsl(226,35%,28%)'; }}>
                    <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))' }}>
                      {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : initials}
                    </div>
                    <span className="hidden lg:inline">Dashboard</span>
                  </button>
                  <button onClick={() => supabase.auth.signOut()}
                    className="p-2 rounded-xl transition-all"
                    style={{ color: 'hsl(226,35%,45%)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'hsl(0,84%,55%)'; (e.currentTarget as HTMLElement).style.background = 'hsla(0,84%,55%,0.08)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'hsl(226,35%,45%)'; (e.currentTarget as HTMLElement).style.background = ''; }}>
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setAuthOpen(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border"
                  style={{ color: 'hsl(258,78%,50%)', borderColor: 'hsla(258,78%,55%,0.30)', background: 'hsla(258,78%,55%,0.05)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'hsla(258,78%,55%,0.55)'; e.currentTarget.style.background = 'hsla(258,78%,55%,0.10)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsla(258,78%,55%,0.30)'; e.currentTarget.style.background = 'hsla(258,78%,55%,0.05)'; }}>
                  <User size={16} />
                  <span className="hidden lg:inline">Login</span>
                </button>
              )}

              {/* Mobile Search Button — only on xs/sm */}
              <button
                onClick={() => { setMobileSearch(v => !v); setMobileOpen(false); }}
                className="sm:hidden relative p-2.5 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  background: mobileSearch
                    ? 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))'
                    : 'hsla(258,78%,55%,0.10)',
                  color: mobileSearch ? 'hsl(0,0%,100%)' : 'hsl(258,78%,50%)',
                }}
                aria-label="Search">
                <Search size={18} />
              </button>

              {/* Cart Button — hidden on mobile, visible on sm+ */}
              <button onClick={() => setCartOpen(true)}
                className="hidden sm:relative sm:flex items-center gap-2 sm:px-4 sm:py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))',
                  boxShadow: '0 4px 16px hsla(258,78%,55%,0.35)',
                }}>
                <ShoppingCart size={18} />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center border-2"
                    style={{ background: 'hsl(330,85%,55%)', borderColor: 'hsl(0,0%,100%)', boxShadow: '0 0 8px hsla(330,85%,55%,0.5)' }}>
                    {cartCount}
                  </span>
                )}
              </button>

              <button className="lg:hidden p-2.5 rounded-xl transition-colors"
                style={{ color: 'hsl(226,35%,30%)' }}
                onClick={() => { setMobileOpen(!mobileOpen); setMobileSearch(false); }}>
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search — full-screen overlay, xs/sm only */}
        {mobileSearch && (
          <Suspense fallback={null}>
            <MobileSearchOverlay onClose={() => setMobileSearch(false)} />
          </Suspense>
        )}

        {/* Mobile Menu — Glassmorphic Minimal */}
        <div className={`lg:hidden overflow-hidden transition-all duration-500 ease-out ${mobileOpen ? 'max-h-[calc(100vh-100px)] overflow-y-auto' : 'max-h-0'}`}>
          <div className="border-t px-4 py-5 relative"
            style={{
              background: 'linear-gradient(180deg, hsla(0,0%,100%,0.85) 0%, hsla(258,30%,99%,0.82) 100%)',
              borderColor: 'hsla(258,40%,80%,0.20)',
              backdropFilter: 'blur(28px) saturate(180%)',
              WebkitBackdropFilter: 'blur(28px) saturate(180%)',
              borderRadius: '0 0 28px 28px',
              boxShadow: '0 20px 50px -22px hsla(258,50%,30%,0.15)',
            }}>

            {/* Search bar — top */}
            <button
              onClick={() => { setMobileSearch(true); setMobileOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 mb-4 rounded-2xl text-left transition-all active:scale-[0.99]"
              style={{
                background: 'hsla(0,0%,100%,0.70)',
                border: '1px solid hsla(258,40%,80%,0.25)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 2px 8px hsla(258,40%,30%,0.04)',
                animation: mobileOpen ? 'slideInRight 0.35s ease-out both' : undefined,
              }}>
              <Search size={17} style={{ color: 'hsl(226,25%,45%)' }} strokeWidth={2.2} />
              <span className="text-[13.5px] flex-1" style={{ color: 'hsl(226,20%,50%)' }}>প্রোডাক্ট খুঁজুন...</span>
            </button>

            {/* Profile / Sign-In compact card */}
            {user ? (
              <button
                onClick={() => { navigate('/dashboard?tab=profile'); setMobileOpen(false); }}
                className="w-full group flex items-center gap-3 px-3.5 py-3 mb-5 rounded-2xl transition-all active:scale-[0.99]"
                style={{
                  background: 'hsla(0,0%,100%,0.75)',
                  border: '1px solid hsla(258,40%,80%,0.25)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 2px 8px hsla(258,40%,30%,0.05)',
                  animation: mobileOpen ? 'slideInRight 0.35s ease-out 0.05s both' : undefined,
                }}>
                <div className="relative w-11 h-11 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                  style={{ background: 'hsl(258,78%,55%)', color: 'hsl(0,0%,100%)' }}>
                  {avatarUrl ? (
                    <img src={`${avatarUrl}?v=${imgVersion}`} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base font-bold">{initials}</span>
                  )}
                  <span className="absolute -bottom-0 -right-0 w-3 h-3 rounded-full border-2 border-white" style={{ background: 'hsl(150,75%,48%)' }} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.14em]" style={{ color: 'hsl(226,20%,55%)' }}>Welcome back</p>
                  <p className="text-[14px] font-semibold truncate" style={{ color: 'hsl(226,35%,18%)' }}>{displayName}</p>
                </div>
                <ChevronRight size={18} style={{ color: 'hsl(226,20%,55%)' }} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <button
                onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                className="w-full group flex items-center gap-3 px-3.5 py-3 mb-5 rounded-2xl transition-all active:scale-[0.99]"
                style={{
                  background: 'hsla(0,0%,100%,0.75)',
                  border: '1px solid hsla(258,40%,80%,0.25)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 2px 8px hsla(258,40%,30%,0.05)',
                  animation: mobileOpen ? 'slideInRight 0.35s ease-out 0.05s both' : undefined,
                }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'hsla(258,78%,55%,0.10)', color: 'hsl(258,78%,50%)' }}>
                  <LogIn size={20} strokeWidth={2.2} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.14em]" style={{ color: 'hsl(226,20%,55%)' }}>Get started</p>
                  <p className="text-[14px] font-semibold" style={{ color: 'hsl(226,35%,18%)' }}>Sign in / Register</p>
                </div>
                <ChevronRight size={18} style={{ color: 'hsl(226,20%,55%)' }} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* Quick Actions label */}
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] px-1 mb-2.5" style={{ color: 'hsl(226,20%,50%)' }}>Quick Actions</p>

            {/* Quick Actions tile grid (4 monochrome) */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                { label: 'Shop',  icon: ShoppingCart, href: '/shop' },
                { label: 'Tools', icon: Sparkles,     href: '/free-tools' },
                { label: 'Blog',  icon: Star,         href: '/blog' },
                { label: 'Help',  icon: MessageCircle, href: '/contact-us' },
              ].map((q, i) => (
                <button
                  key={q.label}
                  onClick={() => { navigate(q.href); setMobileOpen(false); }}
                  className="group aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95"
                  style={{
                    background: 'hsla(0,0%,100%,0.70)',
                    border: '1px solid hsla(258,40%,80%,0.22)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 2px 8px hsla(258,40%,30%,0.04)',
                    animation: mobileOpen ? `slideInRight 0.35s ease-out ${0.10 + i * 0.03}s both` : undefined,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'hsla(258,78%,55%,0.06)'; e.currentTarget.style.borderColor = 'hsla(258,78%,55%,0.30)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'hsla(0,0%,100%,0.70)'; e.currentTarget.style.borderColor = 'hsla(258,40%,80%,0.22)'; }}>
                  <q.icon size={19} strokeWidth={2.1} style={{ color: 'hsl(226,35%,22%)' }} className="group-hover:scale-110 group-hover:[color:hsl(258,78%,50%)] transition-all" />
                  <span className="text-[10.5px] font-semibold" style={{ color: 'hsl(226,35%,28%)' }}>{q.label}</span>
                </button>
              ))}
            </div>

            {/* Categories — clean list */}
            {navCategories.length > 0 && (
              <div className="mb-5" style={{ animation: mobileOpen ? 'slideInRight 0.35s ease-out 0.22s both' : undefined }}>
                <div className="flex items-center justify-between px-1 mb-2">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'hsl(226,20%,50%)' }}>Categories</p>
                  <button onClick={() => { navigate('/shop'); setMobileOpen(false); }}
                    className="text-[11px] font-semibold flex items-center gap-0.5" style={{ color: 'hsl(258,78%,50%)' }}>
                    See all <ChevronRight size={12} />
                  </button>
                </div>
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: 'hsla(0,0%,100%,0.70)', border: '1px solid hsla(258,40%,80%,0.22)', backdropFilter: 'blur(20px)' }}>
                  {navCategories.slice(0, 6).map((cat, idx) => {
                    const meta = CAT_ICON_MAP[cat.name] || CAT_ICON_MAP.default;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => { navigate(`/shop?category=${cat.slug}`); setMobileOpen(false); }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 transition-colors active:bg-[hsla(258,78%,55%,0.06)]"
                        style={{ borderTop: idx > 0 ? '1px solid hsla(258,40%,80%,0.15)' : 'none' }}>
                        <span className="text-[16px] w-6 text-center">{meta.icon}</span>
                        <span className="flex-1 text-left text-[13.5px] font-medium" style={{ color: 'hsl(226,35%,22%)' }}>{cat.name}</span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums"
                          style={{ background: 'hsla(258,78%,55%,0.08)', color: 'hsl(258,78%,45%)' }}>{cat.count}</span>
                        <ChevronRight size={14} style={{ color: 'hsl(226,20%,55%)' }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Account section */}
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] px-1 mb-2" style={{ color: 'hsl(226,20%,50%)' }}>Account</p>
            <div className="rounded-2xl overflow-hidden mb-5"
              style={{ background: 'hsla(0,0%,100%,0.70)', border: '1px solid hsla(258,40%,80%,0.22)', backdropFilter: 'blur(20px)', animation: mobileOpen ? 'slideInRight 0.35s ease-out 0.28s both' : undefined }}>
              {(user
                ? [
                    { label: 'My Orders',    icon: Package, action: () => navigate('/dashboard?tab=orders'),        meta: userStats?.orders && userStats.orders > 0 ? String(userStats.orders) : undefined },
                    { label: 'My Licenses',  icon: Key,     action: () => navigate('/dashboard?tab=licenses'),      meta: undefined },
                    { label: 'Wallet',       icon: Wallet,  action: () => navigate('/dashboard?tab=wallet'),        meta: userStats ? `৳${userStats.wallet.toFixed(0)}` : undefined },
                    { label: 'Wishlist',     icon: Heart,   action: () => navigate('/dashboard?tab=wishlist'),      meta: userStats?.wishlist && userStats.wishlist > 0 ? String(userStats.wishlist) : undefined },
                    { label: 'Notifications',icon: Bell,    action: () => navigate('/dashboard?tab=notifications'), meta: undefined },
                    { label: 'Referral',     icon: Gift,    action: () => navigate('/dashboard?tab=referral'),      meta: undefined },
                  ]
                : [
                    { label: 'My Orders',    icon: Package, action: () => setAuthOpen(true), meta: undefined, locked: true },
                    { label: 'My Licenses',  icon: Key,     action: () => setAuthOpen(true), meta: undefined, locked: true },
                    { label: 'Wallet',       icon: Wallet,  action: () => setAuthOpen(true), meta: undefined, locked: true },
                    { label: 'Wishlist',     icon: Heart,   action: () => setAuthOpen(true), meta: undefined, locked: true },
                    { label: 'Notifications',icon: Bell,    action: () => setAuthOpen(true), meta: undefined, locked: true },
                    { label: 'Referral',     icon: Gift,    action: () => setAuthOpen(true), meta: undefined, locked: true },
                  ]
              ).map((item, idx) => (
                <button
                  key={item.label}
                  onClick={() => { item.action(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 transition-colors active:bg-[hsla(258,78%,55%,0.06)]"
                  style={{ borderTop: idx > 0 ? '1px solid hsla(258,40%,80%,0.15)' : 'none' }}>
                  <item.icon size={17} strokeWidth={2.1} style={{ color: 'hsl(226,35%,30%)' }} />
                  <span className="flex-1 text-left text-[13.5px] font-medium" style={{ color: 'hsl(226,35%,22%)' }}>{item.label}</span>
                  {item.meta && (
                    <span className="text-[11.5px] font-semibold tabular-nums" style={{ color: 'hsl(258,78%,48%)' }}>{item.meta}</span>
                  )}
                  {(item as { locked?: boolean }).locked
                    ? <Lock size={13} style={{ color: 'hsl(226,20%,55%)' }} />
                    : <ChevronRight size={14} style={{ color: 'hsl(226,20%,55%)' }} />}
                </button>
              ))}
            </div>

            {/* Settings row */}
            <div className="rounded-2xl overflow-hidden mb-5"
              style={{ background: 'hsla(0,0%,100%,0.70)', border: '1px solid hsla(258,40%,80%,0.22)', backdropFilter: 'blur(20px)', animation: mobileOpen ? 'slideInRight 0.35s ease-out 0.32s both' : undefined }}>
              {/* Dark mode toggle */}
              <button
                onClick={() => saveTheme(activeTheme === 'dark-cyber' ? 'clean-white' : 'dark-cyber')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 transition-colors active:bg-[hsla(258,78%,55%,0.06)]">
                {activeTheme === 'dark-cyber'
                  ? <Sun size={17} strokeWidth={2.1} style={{ color: 'hsl(226,35%,30%)' }} />
                  : <Moon size={17} strokeWidth={2.1} style={{ color: 'hsl(226,35%,30%)' }} />}
                <span className="flex-1 text-left text-[13.5px] font-medium" style={{ color: 'hsl(226,35%,22%)' }}>
                  {activeTheme === 'dark-cyber' ? 'Light mode' : 'Dark mode'}
                </span>
                {/* Toggle pill */}
                <span className="relative w-10 h-6 rounded-full transition-colors"
                  style={{ background: activeTheme === 'dark-cyber' ? 'hsl(258,78%,55%)' : 'hsla(226,20%,75%,0.5)' }}>
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                    style={{ left: activeTheme === 'dark-cyber' ? '18px' : '2px' }} />
                </span>
              </button>
              {/* Install app */}
              {canInstall && (
                <button
                  onClick={() => { handleInstall(); if (!isIOS) setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 transition-colors active:bg-[hsla(258,78%,55%,0.06)]"
                  style={{ borderTop: '1px solid hsla(258,40%,80%,0.15)' }}>
                  <Download size={17} strokeWidth={2.1} style={{ color: 'hsl(226,35%,30%)' }} />
                  <span className="flex-1 text-left text-[13.5px] font-medium" style={{ color: 'hsl(226,35%,22%)' }}>Install App</span>
                  <ChevronRight size={14} style={{ color: 'hsl(226,20%,55%)' }} />
                </button>
              )}
              {/* Admin */}
              {user && isAdmin && (
                <button
                  onClick={() => { navigate('/ceo'); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 transition-colors active:bg-[hsla(258,78%,55%,0.06)]"
                  style={{ borderTop: '1px solid hsla(258,40%,80%,0.15)' }}>
                  <ShieldCheck size={17} strokeWidth={2.1} style={{ color: 'hsl(258,78%,50%)' }} />
                  <span className="flex-1 text-left text-[13.5px] font-semibold" style={{ color: 'hsl(258,78%,45%)' }}>Admin Panel</span>
                  <ChevronRight size={14} style={{ color: 'hsl(258,78%,50%)' }} />
                </button>
              )}
              {/* Logout */}
              {user && (
                <button
                  onClick={() => { supabase.auth.signOut(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 transition-colors active:bg-[hsla(0,80%,55%,0.06)]"
                  style={{ borderTop: '1px solid hsla(258,40%,80%,0.15)' }}>
                  <LogOut size={17} strokeWidth={2.1} style={{ color: 'hsl(0,75%,50%)' }} />
                  <span className="flex-1 text-left text-[13.5px] font-medium" style={{ color: 'hsl(0,75%,48%)' }}>Sign out</span>
                </button>
              )}
            </div>

            {/* iOS install tip */}
            {showIOSTip && (
              <div className="mb-4 rounded-2xl p-3 text-[12px] leading-relaxed"
                style={{ background: 'hsla(258,78%,55%,0.06)', border: '1px solid hsla(258,78%,55%,0.16)' }}>
                <p className="font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'hsl(226,35%,22%)' }}>
                  <Share2 size={12} style={{ color: 'hsl(258,78%,55%)' }} /> Install on iOS
                </p>
                <p style={{ color: 'hsl(226,20%,45%)' }}>1. Tap Share button</p>
                <p style={{ color: 'hsl(226,20%,45%)' }}>2. "Add to Home Screen"</p>
              </div>
            )}

            {/* Trust footer */}
            <div className="flex items-center justify-center gap-3 pt-3 border-t" style={{ borderColor: 'hsla(258,40%,80%,0.20)' }}>
              <div className="flex items-center gap-1.5">
                <Shield size={11} style={{ color: 'hsl(150,65%,40%)' }} />
                <span className="text-[10.5px] font-medium" style={{ color: 'hsl(226,20%,48%)' }}>Secure</span>
              </div>
              <span className="w-1 h-1 rounded-full" style={{ background: 'hsl(226,20%,70%)' }} />
              <div className="flex items-center gap-1.5">
                <Star size={11} style={{ color: 'hsl(38,90%,55%)' }} fill="hsl(38,90%,55%)" />
                <span className="text-[10.5px] font-medium" style={{ color: 'hsl(226,20%,48%)' }}>Trusted Store</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
      </div>
      </div>{/* end fixed wrapper */}
      {/* Spacer for fixed navbar (announcement bar ~36px + navbar ~60px) */}
      <div className="h-[96px]" />
    </>
  );
};

export default Navbar;
