import { useState, useEffect, useRef } from 'react';
import { Menu, X, ShoppingCart, User, LogOut, LayoutDashboard, ChevronDown, Star, Shield, Phone, Mail, Sparkles, Search, Download, Share2, PlusSquare, Package, Key, Wallet, Award, Heart, MapPin, Bell, Gift, Lock, Globe, ShieldCheck, ChevronRight, Facebook, MessageCircle, Instagram, Send } from 'lucide-react';
import { useFooterSettings } from '@/hooks/useFooterSettings';
import AuthModal from './AuthModal';
import BrandLogo from './BrandLogo';
import SearchBar, { DesktopSearchPalette, MobileSearchOverlay } from './SearchBar';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { prefetchRoute } from '@/hooks/usePrefetchRoute';

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
  const [profileName, setProfileName] = useState<string | null>(null);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  
  const { user } = useAuth();
  const { cartCount, setCartOpen } = useCart();
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
    // Defer announcement fetch — below-fold banner
    const t = setTimeout(() => {
      supabase.from('site_settings').select('value').eq('key', 'announcement_text').eq('category', 'marketing').maybeSingle()
        .then(({ data }) => { if (data?.value) setAnnouncement(data.value); });
    }, 1000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // Defer category load to not block initial render
    const t = setTimeout(() => {
      loadNavCategories();
    }, 500);
    // Realtime: bust cache and reload when categories change
    const channel = supabase
      .channel('navbar-cats-rt')
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'categories' }, () => {
        _catCache = null;
        loadNavCategories(true);
      })
      .subscribe();
    return () => { clearTimeout(t); supabase.removeChannel(channel); };
  }, []);

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
        <div className="fixed inset-0 z-[999] hidden md:flex items-start justify-center pt-20 px-4"
          style={{ background: 'hsla(226,35%,10%,0.55)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setDesktopSearch(false); }}>
          <div className="w-full max-w-2xl xl:max-w-3xl rounded-3xl overflow-hidden shadow-[0_32px_80px_hsla(226,35%,10%,0.40)] flex flex-col"
            style={{ background: 'hsl(var(--card))', border: '1.5px solid hsl(var(--border))', maxHeight: '80vh' }}>
            {/* Top line */}
            <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(263,70%,58%))' }} />
            <DesktopSearchPalette onClose={() => setDesktopSearch(false)} />
          </div>
        </div>
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
            <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
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
                    className="flex items-center px-2.5 lg:px-4 py-1.5 rounded-lg transition-all duration-200 font-bold text-xs lg:text-sm whitespace-nowrap hover:scale-105"
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
                className="hidden sm:relative sm:flex items-center gap-2 px-3 lg:px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))',
                  boxShadow: '0 4px 16px hsla(258,78%,55%,0.35)',
                }}>
                <ShoppingCart size={18} />
                <span className="hidden lg:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center border-2"
                    style={{ background: 'hsl(330,85%,55%)', borderColor: 'hsl(0,0%,100%)', boxShadow: '0 0 8px hsla(330,85%,55%,0.5)' }}>
                    {cartCount}
                  </span>
                )}
              </button>

              <button className="md:hidden p-2.5 rounded-xl transition-colors"
                style={{ color: 'hsl(226,35%,30%)' }}
                onClick={() => { setMobileOpen(!mobileOpen); setMobileSearch(false); }}>
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search — full-screen overlay, xs/sm only */}
        {mobileSearch && (
          <MobileSearchOverlay onClose={() => setMobileSearch(false)} />
        )}

        {/* Mobile Menu — Next-Gen Bento Design */}
        <div className={`md:hidden overflow-hidden transition-all duration-500 ease-out ${mobileOpen ? 'max-h-[calc(100vh-100px)] overflow-y-auto' : 'max-h-0'}`}>
          <div className="border-t px-3 py-4 relative"
            style={{
              background: 'linear-gradient(180deg, hsla(258,60%,99%,0.98) 0%, hsla(220,50%,98%,0.98) 50%, hsla(280,40%,99%,0.98) 100%)',
              borderColor: 'hsla(258,78%,60%,0.15)',
              backdropFilter: 'blur(32px) saturate(180%)',
              WebkitBackdropFilter: 'blur(32px) saturate(180%)',
              borderRadius: '0 0 24px 24px',
              boxShadow: '0 24px 50px -20px hsla(258,78%,40%,0.22), inset 0 1px 0 hsla(0,0%,100%,0.7)',
            }}>
            {/* Decorative orbs */}
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none opacity-40"
              style={{ background: 'radial-gradient(circle, hsla(258,78%,55%,0.18), transparent 70%)', filter: 'blur(28px)' }} />
            <div className="absolute bottom-10 left-0 w-40 h-40 rounded-full pointer-events-none opacity-30"
              style={{ background: 'radial-gradient(circle, hsla(200,90%,50%,0.18), transparent 70%)', filter: 'blur(24px)' }} />

            {user ? (
              <div className="relative">
                {/* User Hero Card — Premium Profile Banner */}
                <button
                  onClick={() => { navigate('/dashboard?tab=profile'); setMobileOpen(false); }}
                  className="w-full group relative rounded-3xl p-4 mb-4 overflow-hidden transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background: 'linear-gradient(135deg, hsl(258,78%,55%) 0%, hsl(225,80%,52%) 45%, hsl(200,90%,50%) 100%)',
                    boxShadow: '0 16px 40px -10px hsla(258,78%,45%,0.45), inset 0 1px 0 hsla(0,0%,100%,0.35)',
                    animation: mobileOpen ? 'slideInRight 0.4s ease-out both' : undefined,
                  }}>
                  {/* Animated mesh overlay */}
                  <div className="absolute inset-0 opacity-50 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at 20% 20%, hsla(0,0%,100%,0.35), transparent 50%), radial-gradient(circle at 80% 80%, hsla(280,90%,70%,0.4), transparent 50%)' }} />
                  <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, hsla(0,0%,100%,0.25), transparent 70%)', filter: 'blur(8px)' }} />

                  <div className="relative flex items-center gap-3.5">
                    {/* Avatar with ring */}
                    <div className="relative shrink-0">
                      <div className="absolute -inset-1 rounded-2xl"
                        style={{ background: 'linear-gradient(135deg, hsla(0,0%,100%,0.6), hsla(280,90%,80%,0.6))', filter: 'blur(4px)' }} />
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center"
                        style={{ background: 'hsla(0,0%,100%,0.25)', backdropFilter: 'blur(12px)', border: '2px solid hsla(0,0%,100%,0.5)' }}>
                        {avatarUrl ? (
                          <img src={`${avatarUrl}?v=${imgVersion}`} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User size={26} className="text-white" strokeWidth={2.5} />
                        )}
                      </div>
                      {/* Online dot */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white"
                        style={{ background: 'hsl(150,80%,50%)', boxShadow: '0 0 8px hsla(150,80%,50%,0.6)' }} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80 mb-0.5">Welcome back 👋</p>
                      <p className="text-base font-bold text-white truncate">{displayName}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="px-1.5 py-0.5 rounded-md flex items-center gap-1" style={{ background: 'hsla(0,0%,100%,0.22)', backdropFilter: 'blur(8px)' }}>
                          <Star size={9} className="text-yellow-300" fill="currentColor" />
                          <span className="text-[10px] font-bold text-white">VIP Member</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-white/80 transition-transform group-hover:translate-x-1" />
                  </div>

                  {/* Live Stats Strip */}
                  <div className="relative mt-3.5 pt-3 grid grid-cols-3 gap-2 border-t" style={{ borderColor: 'hsla(0,0%,100%,0.20)' }}>
                    <div className="text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">Wallet</p>
                      <p className="text-sm font-extrabold text-white tabular-nums">৳{userStats?.wallet?.toFixed(0) ?? '—'}</p>
                    </div>
                    <div className="text-center border-x" style={{ borderColor: 'hsla(0,0%,100%,0.18)' }}>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">Points</p>
                      <p className="text-sm font-extrabold text-white tabular-nums">{userStats?.points ?? '—'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">Orders</p>
                      <p className="text-sm font-extrabold text-white tabular-nums">{userStats?.orders ?? '—'}</p>
                    </div>
                  </div>
                </button>

                {/* Quick Actions — Bento Grid (4 cols) with live counts */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[
                    { label: 'Orders',    icon: Package, tab: 'orders',   grad: 'linear-gradient(135deg, hsl(200,90%,55%), hsl(220,85%,55%))', count: userStats?.orders },
                    { label: 'Wallet',    icon: Wallet,  tab: 'wallet',   grad: 'linear-gradient(135deg, hsl(150,72%,45%), hsl(170,75%,42%))', count: undefined },
                    { label: 'Wishlist',  icon: Heart,   tab: 'wishlist', grad: 'linear-gradient(135deg, hsl(0,82%,60%), hsl(340,82%,55%))', count: userStats?.wishlist },
                    { label: 'Points',    icon: Award,   tab: 'points',   grad: 'linear-gradient(135deg, hsl(38,95%,55%), hsl(20,92%,55%))', count: undefined },
                  ].map((q, i) => (
                    <button
                      key={q.tab}
                      onClick={() => { navigate(`/dashboard?tab=${q.tab}`); setMobileOpen(false); }}
                      className="group relative aspect-square rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-1.5 transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]"
                      style={{
                        background: 'hsla(0,0%,100%,0.85)',
                        border: '1px solid hsla(258,78%,60%,0.12)',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 4px 12px hsla(258,40%,40%,0.06)',
                        animation: mobileOpen ? `slideInRight 0.4s ease-out ${0.05 + i * 0.04}s both` : undefined,
                      }}>
                      <div className="absolute inset-x-0 top-0 h-1/2 opacity-15 pointer-events-none" style={{ background: q.grad }} />
                      {/* Live count badge */}
                      {q.count !== undefined && q.count > 0 && (
                        <div className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white tabular-nums z-10"
                          style={{ background: q.grad, boxShadow: '0 2px 6px hsla(258,40%,40%,0.3)' }}>
                          {q.count > 99 ? '99+' : q.count}
                        </div>
                      )}
                      <div className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
                        style={{ background: q.grad, boxShadow: '0 6px 14px hsla(258,40%,40%,0.22), inset 0 1px 0 hsla(0,0%,100%,0.3)' }}>
                        <q.icon size={17} className="text-white" strokeWidth={2.5} />
                      </div>
                      <span className="text-[10.5px] font-bold tracking-tight" style={{ color: 'hsl(226,35%,22%)' }}>{q.label}</span>
                    </button>
                  ))}
                </div>

                {/* Featured Strip — 2 premium horizontal cards */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => { navigate('/shop?sort=discount'); setMobileOpen(false); }}
                    className="group relative rounded-2xl p-3 overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-left"
                    style={{
                      background: 'linear-gradient(135deg, hsl(0,82%,58%) 0%, hsl(20,90%,55%) 100%)',
                      boxShadow: '0 8px 20px hsla(0,80%,50%,0.30), inset 0 1px 0 hsla(0,0%,100%,0.30)',
                      animation: mobileOpen ? 'slideInRight 0.4s ease-out 0.22s both' : undefined,
                    }}>
                    <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, hsla(0,0%,100%,0.6), transparent 70%)' }} />
                    <div className="relative flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'hsla(0,0%,100%,0.25)', backdropFilter: 'blur(8px)' }}>
                        <span className="text-[14px]">🔥</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-white/95 uppercase tracking-wider">Hot Deals</span>
                    </div>
                    <p className="relative text-[13px] font-extrabold text-white leading-tight">Up to 70% OFF</p>
                    <p className="relative text-[10px] font-semibold text-white/85 mt-0.5">Shop trending →</p>
                  </button>
                  <button
                    onClick={() => { navigate('/contact-us'); setMobileOpen(false); }}
                    className="group relative rounded-2xl p-3 overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-left"
                    style={{
                      background: 'linear-gradient(135deg, hsl(150,72%,42%) 0%, hsl(170,75%,40%) 100%)',
                      boxShadow: '0 8px 20px hsla(150,72%,40%,0.30), inset 0 1px 0 hsla(0,0%,100%,0.30)',
                      animation: mobileOpen ? 'slideInRight 0.4s ease-out 0.26s both' : undefined,
                    }}>
                    <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, hsla(0,0%,100%,0.6), transparent 70%)' }} />
                    <div className="relative flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center relative" style={{ background: 'hsla(0,0%,100%,0.25)', backdropFilter: 'blur(8px)' }}>
                        <MessageCircle size={14} className="text-white" strokeWidth={2.6} />
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: 'hsl(45,95%,55%)', boxShadow: '0 0 6px hsla(45,95%,55%,0.8)', animation: 'pulse 2s infinite' }} />
                      </div>
                      <span className="text-[10px] font-extrabold text-white/95 uppercase tracking-wider">Live 24/7</span>
                    </div>
                    <p className="relative text-[13px] font-extrabold text-white leading-tight">Need Help?</p>
                    <p className="relative text-[10px] font-semibold text-white/85 mt-0.5">Chat with us →</p>
                  </button>
                </div>

                {/* Trending Categories Chips */}
                {navCategories.length > 0 && (
                  <div className="mb-4" style={{ animation: mobileOpen ? 'slideInRight 0.4s ease-out 0.30s both' : undefined }}>
                    <div className="flex items-center gap-2 px-1 pb-2">
                      <span className="text-[10px]">🏷️</span>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'hsl(226,35%,40%)' }}>Trending Categories</p>
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                      {navCategories.slice(0, 8).map(cat => {
                        const meta = CAT_ICON_MAP[cat.name] || CAT_ICON_MAP.default;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => { navigate(`/shop?category=${cat.slug}`); setMobileOpen(false); }}
                            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-[11.5px] font-bold transition-all duration-300 hover:scale-105 active:scale-95"
                            style={{
                              background: 'hsla(0,0%,100%,0.85)',
                              border: '1px solid hsla(258,78%,60%,0.18)',
                              color: 'hsl(226,35%,22%)',
                              backdropFilter: 'blur(10px)',
                              boxShadow: '0 2px 6px hsla(258,40%,40%,0.06)',
                            }}>
                            <span className="text-[13px]">{meta.icon}</span>
                            <span>{cat.name}</span>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full" style={{ background: 'hsla(258,78%,55%,0.12)', color: 'hsl(258,78%,45%)' }}>{cat.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section Label */}
                <div className="flex items-center gap-2 px-1 pb-2.5">
                  <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, hsla(258,78%,55%,0.3), transparent)' }} />
                  <p className="text-[10px] font-bold tracking-[0.22em] uppercase flex items-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg, hsl(258,78%,50%), hsl(200,90%,45%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    <Sparkles size={10} style={{ color: 'hsl(258,78%,55%)' }} />
                    Account
                    <Sparkles size={10} style={{ color: 'hsl(200,90%,50%)' }} />
                  </p>
                  <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, hsla(258,78%,55%,0.3), transparent)' }} />
                </div>

                {/* Detailed list — remaining items */}
                {[
                  { label: 'My Licenses',   icon: Key,    tab: 'licenses',      grad: 'linear-gradient(135deg, hsl(45,95%,55%), hsl(30,90%,55%))' },
                  { label: 'Addresses',     icon: MapPin, tab: 'addresses',     grad: 'linear-gradient(135deg, hsl(190,85%,45%), hsl(210,85%,50%))' },
                  { label: 'Notifications', icon: Bell,   tab: 'notifications', grad: 'linear-gradient(135deg, hsl(38,95%,55%), hsl(20,90%,55%))' },
                  { label: 'Referral',      icon: Gift,   tab: 'referral',      grad: 'linear-gradient(135deg, hsl(280,75%,55%), hsl(310,70%,55%))' },
                  { label: 'Security',      icon: Lock,   tab: 'security',      grad: 'linear-gradient(135deg, hsl(220,30%,40%), hsl(240,35%,45%))' },
                  { label: 'Language',      icon: Globe,  tab: 'language',      grad: 'linear-gradient(135deg, hsl(170,70%,42%), hsl(190,75%,45%))' },
                ].map((item, i) => (
                  <button
                    key={item.tab}
                    onClick={() => { navigate(`/dashboard?tab=${item.tab}`); setMobileOpen(false); }}
                    className="w-full group flex items-center gap-3 px-3 py-2.5 mb-1.5 rounded-2xl text-sm font-semibold transition-all duration-300 hover:scale-[1.015] active:scale-[0.985] relative overflow-hidden"
                    style={{
                      color: 'hsl(226,35%,20%)',
                      background: 'hsla(0,0%,100%,0.75)',
                      border: '1px solid hsla(258,78%,60%,0.10)',
                      backdropFilter: 'blur(10px)',
                      animation: mobileOpen ? `slideInRight 0.4s ease-out ${0.25 + i * 0.04}s both` : undefined,
                      boxShadow: '0 2px 6px hsla(258,40%,40%,0.05)',
                    }}>
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-4deg]"
                      style={{ background: item.grad, boxShadow: '0 5px 12px hsla(258,40%,40%,0.20), inset 0 1px 0 hsla(0,0%,100%,0.25)' }}>
                      <item.icon size={16} className="text-white" strokeWidth={2.4} />
                    </div>
                    <span className="flex-1 text-left tracking-tight">{item.label}</span>
                    <ChevronRight size={15} className="transition-all duration-300 group-hover:translate-x-1 opacity-50 group-hover:opacity-100"
                      style={{ color: 'hsl(258,78%,55%)' }} />
                  </button>
                ))}

                {/* Install App */}
                {canInstall && (
                  <button onClick={() => { handleInstall(); if (!isIOS) setMobileOpen(false); }}
                    className="w-full group flex items-center gap-3 px-3 py-2.5 mb-1.5 rounded-2xl text-sm font-semibold transition-all duration-300 hover:scale-[1.015] active:scale-[0.985]"
                    style={{ color: 'hsl(226,35%,20%)', background: 'hsla(0,0%,100%,0.75)', border: '1px solid hsla(258,78%,60%,0.10)', backdropFilter: 'blur(10px)' }}>
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110"
                      style={{ background: 'linear-gradient(135deg, hsl(160,75%,45%), hsl(180,75%,45%))', boxShadow: '0 5px 12px hsla(160,40%,40%,0.22), inset 0 1px 0 hsla(0,0%,100%,0.25)' }}>
                      <Download size={16} className="text-white" strokeWidth={2.4} />
                    </div>
                    <span className="flex-1 text-left">Install App</span>
                  </button>
                )}
                {showIOSTip && (
                  <div className="mx-1 mt-2 mb-2 rounded-2xl p-3.5 text-[12px] leading-relaxed"
                    style={{ background: 'linear-gradient(135deg, hsla(258,78%,55%,0.08), hsla(200,90%,50%,0.08))', border: '1px solid hsla(258,78%,55%,0.18)', backdropFilter: 'blur(10px)' }}>
                    <p className="font-bold mb-2 flex items-center gap-1.5" style={{ color: 'hsl(226,35%,20%)' }}>
                      <Share2 size={13} style={{ color: 'hsl(258,78%,55%)' }} /> Install on iOS:
                    </p>
                    <p className="flex items-center gap-1.5" style={{ color: 'hsl(226,35%,45%)' }}>
                      1. Tap the <Share2 size={12} className="text-blue-500" /> Share button
                    </p>
                    <p className="flex items-center gap-1.5 mt-1" style={{ color: 'hsl(226,35%,45%)' }}>
                      2. Select <PlusSquare size={12} className="text-blue-500" /> "Add to Home Screen"
                    </p>
                  </div>
                )}

                {/* Admin + Logout — side by side */}
                <div className={`grid ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mt-3`}>
                  {isAdmin && (
                    <button
                      onClick={() => { navigate('/ceo'); setMobileOpen(false); }}
                      className="group relative flex items-center justify-center gap-2 px-3 py-3 rounded-2xl text-[13px] font-bold text-white overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
                      style={{
                        background: 'linear-gradient(135deg, hsl(258,78%,55%) 0%, hsl(280,75%,55%) 50%, hsl(258,78%,55%) 100%)',
                        backgroundSize: '200% 100%',
                        boxShadow: '0 10px 24px hsla(258,78%,55%,0.42), inset 0 1px 0 hsla(0,0%,100%,0.30)',
                        animation: 'shimmer 3s linear infinite',
                      }}>
                      <div className="absolute inset-0 opacity-30 pointer-events-none"
                        style={{ background: 'radial-gradient(circle at 30% 50%, hsla(0,0%,100%,0.4), transparent 60%)' }} />
                      <ShieldCheck size={15} strokeWidth={2.6} className="relative" />
                      <span className="relative tracking-wide">Admin</span>
                    </button>
                  )}
                  <button
                    onClick={() => { supabase.auth.signOut(); setMobileOpen(false); }}
                    className="group flex items-center justify-center gap-2 px-3 py-3 rounded-2xl text-[13px] font-bold transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
                    style={{
                      color: 'hsl(0,75%,48%)',
                      background: 'linear-gradient(135deg, hsla(0,82%,98%,0.95), hsla(15,82%,97%,0.95))',
                      border: '1.5px solid hsla(0,80%,60%,0.25)',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 6px 16px hsla(0,80%,55%,0.10)',
                    }}>
                    <LogOut size={15} strokeWidth={2.6} />
                    <span className="tracking-wide">Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Guest CTA — Editorial, restrained, professional */}
                <button
                  onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                  className="w-full group relative rounded-2xl mb-3 overflow-hidden text-left transition-colors duration-200"
                  style={{
                    background: 'hsl(226,30%,12%)',
                    animation: mobileOpen ? 'slideInRight 0.35s ease-out both' : undefined,
                  }}>
                  <div className="px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-[0.16em] mb-1.5" style={{ color: 'hsla(0,0%,100%,0.55)' }}>Account</p>
                        <p className="text-[15px] font-semibold text-white leading-tight" style={{ letterSpacing: '-0.015em' }}>Sign in or create account</p>
                        <p className="text-[12px] mt-1 leading-snug" style={{ color: 'hsla(0,0%,100%,0.62)' }}>Track orders, save items & earn rewards.</p>
                      </div>
                      <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5"
                        style={{ background: 'hsla(0,0%,100%,0.08)', border: '1px solid hsla(0,0%,100%,0.14)' }}>
                        <ChevronRight size={16} className="text-white" strokeWidth={2.2} />
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between text-[11px]" style={{ background: 'hsla(0,0%,100%,0.04)', borderTop: '1px solid hsla(0,0%,100%,0.08)', color: 'hsla(0,0%,100%,0.7)' }}>
                    <span className="font-medium">New here?</span>
                    <span className="font-semibold text-white">Get welcome offer →</span>
                  </div>
                </button>

                {/* Quick links — minimal list, no color tiles */}
                <nav className="rounded-2xl overflow-hidden mb-3"
                  style={{ background: 'hsl(0,0%,100%)', border: '1px solid hsl(226,18%,90%)' }}>
                  {[
                    { label: 'Shop all products', sub: 'Browse the catalog',  icon: ShoppingCart, href: '/shop' },
                    { label: 'Free tools',        sub: '40+ utilities',       icon: Sparkles,     href: '/free-tools' },
                    { label: 'Blog & guides',     sub: 'Tips and how-tos',    icon: Star,         href: '/blog' },
                    { label: 'Contact support',   sub: 'We reply in minutes', icon: MessageCircle,href: '/contact-us' },
                  ].map((item, i, arr) => (
                    <button
                      key={item.label}
                      onClick={() => { navigate(item.href); setMobileOpen(false); }}
                      onMouseEnter={() => prefetchRoute(item.href)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-[hsl(226,20%,97%)] active:bg-[hsl(226,22%,95%)]"
                      style={{
                        borderBottom: i < arr.length - 1 ? '1px solid hsl(226,18%,93%)' : undefined,
                        animation: mobileOpen ? `slideInRight 0.35s ease-out ${0.04 + i * 0.03}s both` : undefined,
                      }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'hsl(226,22%,96%)', border: '1px solid hsl(226,18%,90%)' }}>
                        <item.icon size={16} strokeWidth={2} style={{ color: 'hsl(226,30%,30%)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] font-semibold leading-tight" style={{ color: 'hsl(226,35%,16%)', letterSpacing: '-0.01em' }}>{item.label}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'hsl(226,15%,48%)' }}>{item.sub}</p>
                      </div>
                      <ChevronRight size={15} strokeWidth={2} style={{ color: 'hsl(226,15%,55%)' }} />
                    </button>
                  ))}
                </nav>

                {/* Single highlight strip — simple, no neon */}
                <button
                  onClick={() => { navigate('/shop?sort=discount'); setMobileOpen(false); }}
                  onMouseEnter={() => prefetchRoute('/shop')}
                  className="w-full group relative rounded-2xl px-4 py-3 mb-3 flex items-center justify-between gap-3 transition-colors duration-200"
                  style={{
                    background: 'hsl(0,0%,100%)',
                    border: '1px solid hsl(226,18%,90%)',
                    animation: mobileOpen ? 'slideInRight 0.35s ease-out 0.20s both' : undefined,
                  }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-10 rounded-full shrink-0" style={{ background: 'hsl(8,75%,55%)' }} />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'hsl(8,70%,42%)' }}>Today's deals</p>
                      <p className="text-[13.5px] font-semibold leading-tight mt-0.5" style={{ color: 'hsl(226,35%,16%)', letterSpacing: '-0.01em' }}>Save up to 70% on selected products</p>
                    </div>
                  </div>
                  <ChevronRight size={16} strokeWidth={2} style={{ color: 'hsl(226,20%,40%)' }} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>

                {/* Trending Categories — clean chips */}
                {navCategories.length > 0 && (
                  <div className="mb-4" style={{ animation: mobileOpen ? 'slideInRight 0.35s ease-out 0.24s both' : undefined }}>
                    <p className="text-[10px] font-medium uppercase tracking-[0.16em] px-1 pb-2" style={{ color: 'hsl(226,15%,48%)' }}>Trending categories</p>
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                      {navCategories.slice(0, 8).map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => { navigate(`/shop?category=${cat.slug}`); setMobileOpen(false); }}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150 hover:bg-[hsl(226,22%,96%)]"
                          style={{
                            background: 'hsl(0,0%,100%)',
                            border: '1px solid hsl(226,18%,88%)',
                            color: 'hsl(226,30%,22%)',
                          }}>
                          <span>{cat.name}</span>
                          <span className="text-[10px] font-medium tabular-nums" style={{ color: 'hsl(226,15%,52%)' }}>{cat.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section Label — minimal divider */}
                <div className="flex items-center gap-3 px-1 pb-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em]" style={{ color: 'hsl(226,15%,48%)' }}>Explore</p>
                  <div className="h-px flex-1" style={{ background: 'hsl(226,18%,88%)' }} />
                </div>

                {/* Guest list — login-required items */}
                {[
                  { label: 'My Orders',     icon: Package, grad: 'linear-gradient(135deg, hsl(200,90%,50%), hsl(220,80%,55%))' },
                  { label: 'My Licenses',   icon: Key,     grad: 'linear-gradient(135deg, hsl(45,95%,55%), hsl(30,90%,55%))' },
                  { label: 'Wallet',        icon: Wallet,  grad: 'linear-gradient(135deg, hsl(150,70%,45%), hsl(170,75%,42%))' },
                  { label: 'Wishlist',      icon: Heart,   grad: 'linear-gradient(135deg, hsl(0,80%,60%), hsl(340,80%,55%))' },
                  { label: 'Notifications', icon: Bell,    grad: 'linear-gradient(135deg, hsl(38,95%,55%), hsl(20,90%,55%))' },
                  { label: 'Referral',      icon: Gift,    grad: 'linear-gradient(135deg, hsl(280,75%,55%), hsl(310,70%,55%))' },
                ].map((item, i) => (
                  <button
                    key={item.label}
                    onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                    className="w-full group flex items-center gap-3 px-3 py-2.5 mb-1.5 rounded-2xl text-sm font-semibold transition-all duration-300 hover:scale-[1.015] active:scale-[0.985]"
                    style={{
                      color: 'hsl(226,35%,20%)',
                      background: 'hsla(0,0%,100%,0.75)',
                      border: '1px solid hsla(258,78%,60%,0.10)',
                      backdropFilter: 'blur(10px)',
                      animation: mobileOpen ? `slideInRight 0.4s ease-out ${0.25 + i * 0.04}s both` : undefined,
                      boxShadow: '0 2px 6px hsla(258,40%,40%,0.05)',
                    }}>
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-4deg]"
                      style={{ background: item.grad, boxShadow: '0 5px 12px hsla(258,40%,40%,0.20), inset 0 1px 0 hsla(0,0%,100%,0.25)' }}>
                      <item.icon size={16} className="text-white" strokeWidth={2.4} />
                    </div>
                    <span className="flex-1 text-left tracking-tight">{item.label}</span>
                    <Lock size={13} className="opacity-50" style={{ color: 'hsl(258,78%,55%)' }} />
                  </button>
                ))}

                {/* Install App */}
                {canInstall && (
                  <button onClick={() => { handleInstall(); if (!isIOS) setMobileOpen(false); }}
                    className="w-full group flex items-center gap-3 px-3 py-2.5 mt-2 rounded-2xl text-sm font-semibold transition-all duration-300 hover:scale-[1.015] active:scale-[0.985]"
                    style={{ color: 'hsl(226,35%,20%)', background: 'hsla(0,0%,100%,0.75)', border: '1px solid hsla(258,78%,60%,0.10)', backdropFilter: 'blur(10px)' }}>
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110"
                      style={{ background: 'linear-gradient(135deg, hsl(160,75%,45%), hsl(180,75%,45%))', boxShadow: '0 5px 12px hsla(160,40%,40%,0.22), inset 0 1px 0 hsla(0,0%,100%,0.25)' }}>
                      <Download size={16} className="text-white" strokeWidth={2.4} />
                    </div>
                    <span className="flex-1 text-left">Install App</span>
                  </button>
                )}
                {showIOSTip && (
                  <div className="mx-1 mt-2 mb-2 rounded-2xl p-3.5 text-[12px] leading-relaxed"
                    style={{ background: 'linear-gradient(135deg, hsla(258,78%,55%,0.08), hsla(200,90%,50%,0.08))', border: '1px solid hsla(258,78%,55%,0.18)', backdropFilter: 'blur(10px)' }}>
                    <p className="font-bold mb-2 flex items-center gap-1.5" style={{ color: 'hsl(226,35%,20%)' }}>
                      <Share2 size={13} style={{ color: 'hsl(258,78%,55%)' }} /> Install on iOS:
                    </p>
                    <p className="flex items-center gap-1.5" style={{ color: 'hsl(226,35%,45%)' }}>
                      1. Tap the <Share2 size={12} className="text-blue-500" /> Share button
                    </p>
                    <p className="flex items-center gap-1.5 mt-1" style={{ color: 'hsl(226,35%,45%)' }}>
                      2. Select <PlusSquare size={12} className="text-blue-500" /> "Add to Home Screen"
                    </p>
                  </div>
                )}

                {/* Trust footer */}
                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'hsla(258,78%,55%,0.12)' }}>
                  <div className="flex items-center gap-1.5">
                    <Shield size={12} style={{ color: 'hsl(150,70%,42%)' }} />
                    <span className="text-[10px] font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>100% Secure</span>
                  </div>
                  <div className="w-1 h-1 rounded-full" style={{ background: 'hsl(258,78%,60%)' }} />
                  <div className="flex items-center gap-1.5">
                    <Star size={12} style={{ color: 'hsl(38,95%,55%)' }} fill="hsl(38,95%,55%)" />
                    <span className="text-[10px] font-semibold" style={{ color: 'hsl(226,35%,40%)' }}>Trusted Store</span>
                  </div>
                </div>
              </div>
            )}
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
