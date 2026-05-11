import { useState, useEffect, useRef } from 'react';
import { Menu, X, ShoppingCart, User, LogOut, LayoutDashboard, ChevronDown, Star, Shield, Phone, Mail, Sparkles, Search, Download, Share2, PlusSquare, Package, Key, Wallet, Award, Heart, MapPin, Bell, Gift, Lock, Globe, ShieldCheck, ChevronRight, Facebook, MessageCircle, Instagram, Send } from 'lucide-react';
import { useFooterSettings } from '@/hooks/useFooterSettings';
import AuthModal from './AuthModal';
import BrandLogo from './BrandLogo';
import VerifiedBadge from './VerifiedBadge';
import SearchBar, { DesktopSearchPalette, MobileSearchOverlay } from './SearchBar';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  
  const { user } = useAuth();
  const { cartCount, setCartOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-open mobile menu when ?openMenu=1 (from dashboard back button etc.)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('openMenu') === '1') {
      setMobileOpen(true);
      // Clean URL
      const cleaned = location.pathname + (Array.from(params.entries()).filter(([k]) => k !== 'openMenu').length
        ? '?' + new URLSearchParams(Array.from(params.entries()).filter(([k]) => k !== 'openMenu')).toString()
        : '');
      window.history.replaceState(null, '', cleaned);
    }
  }, [location.search, location.pathname]);

  const [imgVersion, setImgVersion] = useState(() => Date.now());
  const [avatarFailed, setAvatarFailed] = useState(false);

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
    if (!user) {
      setAvatarUrl(null);
      setIsAdmin(false);
      setUserStats(null);
      setProfileName(null);
      setProfileUsername(null);
      setAvatarFailed(false);
      return;
    }

    // Immediately seed avatar from Google OAuth metadata so it shows up even
    // before the profiles row finishes loading.
    const oauthAvatar =
      (user.user_metadata as any)?.avatar_url ||
      (user.user_metadata as any)?.picture ||
      null;
    if (oauthAvatar) {
      setAvatarUrl(oauthAvatar);
      setAvatarFailed(false);
    }

    const loadProfile = () => {
      supabase.from('profiles').select('avatar_url, display_name, username, wallet_balance, points_balance').eq('user_id', user.id).single()
        .then(({ data }) => {
          if (!data) return;
          // Prefer the saved profile avatar; fall back to the Google OAuth
          // avatar so the photo is always visible for social-sign-in users.
          const nextAvatar = data.avatar_url || oauthAvatar || null;
          setAvatarUrl(nextAvatar);
          setAvatarFailed(false);
          setImgVersion(Date.now()); // bust cache when avatar changes
          setProfileName(data.display_name || null);
          setProfileUsername(data.username || null);
          setUserStats(prev => ({
            wallet: Number(data.wallet_balance) || 0,
            points: Number(data.points_balance) || 0,
            orders: prev?.orders || 0,
            wishlist: prev?.wishlist || 0,
          }));
        });
    };

    // Load immediately (no 500ms delay) so the photo doesn't flash blank.
    loadProfile();
    supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle()
      .then(({ data }) => { setIsAdmin(!!data); });

    // Realtime: refresh profile name/username/avatar when user updates from dashboard
    const channel = supabase
      .channel(`navbar-profile-${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` },
        () => loadProfile())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Lock body scroll when mobile menu is open to prevent background scrolling
  useEffect(() => {
    if (!mobileOpen) return;
    const scrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      window.scrollTo(0, scrollY);
    };
  }, [mobileOpen]);

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

  const displayName = profileName || profileUsername || user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
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

      {/* ── Top Announcement Bar — White Glass Minimal ── */}
      <div
        className="w-full transition-all duration-300 px-2 sm:px-3"
        style={{
          maxHeight: scrolled ? '0px' : '56px',
          opacity: scrolled ? 0 : 1,
          paddingTop: scrolled ? 0 : '8px',
          paddingBottom: scrolled ? 0 : '0',
        }}
      >
        <div
          className="relative w-full flex items-center overflow-hidden rounded-2xl text-[11px] font-medium"
          style={{
            background:
              'linear-gradient(120deg, hsla(0,0%,100%,0.78) 0%, hsla(0,0%,100%,0.62) 50%, hsla(0,0%,100%,0.78) 100%)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            border: '1px solid hsla(0,0%,100%,0.85)',
            boxShadow:
              '0 8px 32px -12px hsla(var(--brand-h),40%,40%,0.18), inset 0 1px 0 hsla(0,0%,100%,0.95), inset 0 -1px 0 hsla(var(--brand-h),30%,80%,0.20)',
            color: 'hsl(var(--foreground))',
            padding: '7px 10px',
          }}
        >
          {/* soft tint blob — brand accent */}
          <span
            className="absolute -left-16 -top-16 w-40 h-40 rounded-full pointer-events-none aurora-blob-1"
            style={{ background: 'radial-gradient(circle, hsla(var(--brand-h),85%,70%,0.18), transparent 70%)' }}
          />
          <span
            className="absolute -right-16 -bottom-16 w-40 h-40 rounded-full pointer-events-none aurora-blob-2"
            style={{ background: 'radial-gradient(circle, hsla(calc(var(--brand-h) + 40),85%,70%,0.16), transparent 70%)' }}
          />
          {/* subtle sheen */}
          <span
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(110deg, transparent 40%, hsla(0,0%,100%,0.45) 50%, transparent 60%)',
              backgroundSize: '220% 100%',
              animation: 'shimmer 9s linear infinite',
            }}
          />

          {/* Left — contact chips */}
          <div className="flex items-center gap-1.5 flex-shrink-0 relative z-10">
            <a
              href="tel:01840099853"
              aria-label="Call us"
              className="group flex items-center gap-1.5 px-2.5 py-[5px] rounded-full transition-all hover:scale-[1.04] active:scale-95"
              style={{
                background: 'hsla(0,0%,100%,0.85)',
                border: '1px solid hsla(var(--brand-h),40%,80%,0.45)',
                boxShadow: '0 1px 4px hsla(var(--brand-h),30%,40%,0.10)',
                color: 'hsl(var(--foreground))',
              }}
            >
              <Phone size={11} className="text-emerald-600" strokeWidth={2.5} />
              <span className="font-semibold tracking-wide tabular-nums">01840-099853</span>
            </a>
            <a
              href="mailto:info@shahedstore.com.bd"
              aria-label="Email us"
              className="hidden md:flex group items-center gap-1.5 px-2.5 py-[5px] rounded-full transition-all hover:scale-[1.04] active:scale-95"
              style={{
                background: 'hsla(0,0%,100%,0.85)',
                border: '1px solid hsla(var(--brand-h),40%,80%,0.45)',
                boxShadow: '0 1px 4px hsla(var(--brand-h),30%,40%,0.10)',
                color: 'hsl(var(--foreground))',
              }}
            >
              <Mail size={11} style={{ color: 'hsl(var(--primary))' }} strokeWidth={2.5} />
              <span className="font-semibold tracking-wide">info@shahedstore.com.bd</span>
            </a>
          </div>

          {/* Middle — marquee */}
          <div className="flex-1 overflow-hidden mx-3 relative z-10 mask-fade">
            <div
              className="flex items-center gap-10 whitespace-nowrap"
              style={{ animation: 'marquee 34s linear infinite', display: 'inline-flex' }}
            >
              {[0, 1].map((k) => (
                <span key={k} className="flex items-center gap-7">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={11} style={{ color: 'hsl(var(--primary))' }} />
                    <span className="font-bold tracking-wide" style={{ color: 'hsl(var(--foreground))' }}>
                      {announcement || 'বিশেষ অফার! সব অর্ডারে ফ্রি ইনস্ট্যান্ট ডেলিভারি — ১০% পর্যন্ত ছাড় পান'}
                    </span>
                  </span>
                  <span className="w-1 h-1 rounded-full" style={{ background: 'hsla(var(--foreground),0.30)' }} />
                  <span className="flex items-center gap-1.5 font-semibold" style={{ color: 'hsl(35,85%,40%)' }}>
                    <Star size={10} fill="currentColor" /> Trusted by 50,000+ customers
                  </span>
                  <span className="w-1 h-1 rounded-full" style={{ background: 'hsla(var(--foreground),0.30)' }} />
                  <span className="flex items-center gap-1.5 font-semibold" style={{ color: 'hsl(150,70%,32%)' }}>
                    <Shield size={10} /> 100% Secure Payment
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Right — minimal chips + social */}
          <div className="flex items-center gap-1.5 flex-shrink-0 relative z-10">
            <span
              className="hidden md:flex items-center gap-1 px-2 py-[4px] rounded-full text-[10px] font-bold"
              style={{
                background: 'hsla(45,100%,96%,0.95)',
                border: '1px solid hsla(40,90%,70%,0.55)',
                color: 'hsl(35,85%,35%)',
              }}
            >
              <Star size={9} fill="currentColor" /> 4.9
            </span>
            <span
              className="flex items-center gap-1 px-2 py-[4px] rounded-full text-[10px] font-bold"
              style={{
                background: 'hsla(150,70%,95%,0.95)',
                border: '1px solid hsla(150,60%,65%,0.55)',
                color: 'hsl(150,70%,28%)',
              }}
            >
              <Shield size={9} /> Secured
            </span>
            <div
              className="hidden sm:flex items-center gap-1 ml-1 pl-2"
              style={{ borderLeft: '1px solid hsla(var(--foreground),0.12)' }}
            >
              {footerSettings.facebook_url && (
                <a href={footerSettings.facebook_url} target="_blank" rel="noopener noreferrer"
                  className="social-soft w-6 h-6 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
                  style={{ background: 'hsla(0,0%,100%,0.85)', border: '1px solid hsla(214,90%,80%,0.6)', color: 'hsl(214,85%,50%)' }}
                  title="Facebook">
                  <Facebook size={11} fill="currentColor" />
                </a>
              )}
              {footerSettings.whatsapp_url && (
                <a href={footerSettings.whatsapp_url} target="_blank" rel="noopener noreferrer"
                  className="social-soft w-6 h-6 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
                  style={{ background: 'hsla(0,0%,100%,0.85)', border: '1px solid hsla(142,70%,75%,0.6)', color: 'hsl(142,70%,38%)' }}
                  title="WhatsApp">
                  <MessageCircle size={11} />
                </a>
              )}
              {footerSettings.instagram_url && (
                <a href={footerSettings.instagram_url} target="_blank" rel="noopener noreferrer"
                  className="social-soft w-6 h-6 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
                  style={{ background: 'hsla(0,0%,100%,0.85)', border: '1px solid hsla(340,80%,80%,0.6)', color: 'hsl(340,80%,50%)' }}
                  title="Instagram">
                  <Instagram size={11} />
                </a>
              )}
              {footerSettings.telegram_url && (
                <a href={footerSettings.telegram_url} target="_blank" rel="noopener noreferrer"
                  className="social-soft w-6 h-6 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
                  style={{ background: 'hsla(0,0%,100%,0.85)', border: '1px solid hsla(200,90%,80%,0.6)', color: 'hsl(200,85%,45%)' }}
                  title="Telegram">
                  <Send size={11} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes shimmer { 0% { background-position: 220% 0; } 100% { background-position: -220% 0; } }
        @keyframes blobFloat1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(22px,12px) scale(1.12); } }
        @keyframes blobFloat2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-18px,-14px) scale(1.14); } }
        .aurora-blob-1 { animation: blobFloat1 11s ease-in-out infinite; }
        .aurora-blob-2 { animation: blobFloat2 13s ease-in-out infinite; }
        .social-soft:hover { filter: brightness(1.05); box-shadow: 0 4px 12px hsla(var(--brand-h),40%,50%,0.18); }
        .mask-fade {
          mask-image: linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%);
          -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%);
        }
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
              <span className="text-sm text-muted-foreground flex-1">Search products...</span>
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
        <div
          className={`md:hidden overflow-hidden transition-all duration-500 ease-out ${mobileOpen ? 'overflow-y-auto overscroll-contain' : ''}`}
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: mobileOpen ? 'pan-y' : 'auto',
            // Subtract: announcement bar (~40px) + navbar (68px) + wrapper padding (16px) + safety (12px)
            // Subtract: announcement bar (~40px) + navbar (68px) + wrapper padding (16px) + bottom nav (~64px) + safety
            maxHeight: mobileOpen ? `calc(100dvh - ${scrolled ? 160 : 200}px)` : '0px',
            transition: 'max-height 500ms ease-out',
          }}
        >
          <div className="border-t px-3 py-4 pb-[calc(env(safe-area-inset-bottom)+24px)] relative"
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
                    {/* Avatar with premium ring — circular for clearer face */}
                    <div className="relative shrink-0">
                      <div className="absolute -inset-[3px] rounded-full"
                        style={{ background: 'conic-gradient(from 180deg, hsla(0,0%,100%,0.95), hsla(280,90%,80%,0.85), hsla(200,90%,75%,0.85), hsla(0,0%,100%,0.95))', filter: 'blur(2px)' }} />
                      <div className="relative w-16 h-16 rounded-full overflow-hidden flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, hsla(258,78%,55%,0.85), hsla(200,90%,50%,0.85))', border: '2.5px solid hsla(0,0%,100%,0.95)', boxShadow: '0 6px 18px hsla(258,60%,30%,0.35), inset 0 1px 0 hsla(0,0%,100%,0.5)' }}>
                        {avatarUrl && !avatarFailed ? (
                          <img
                            src={`${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}v=${imgVersion}`}
                            alt={displayName}
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            onError={() => setAvatarFailed(true)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-extrabold text-xl uppercase select-none" style={{ textShadow: '0 1px 3px hsla(0,0%,0%,0.25)' }}>
                            {(displayName?.[0] || 'U').toUpperCase()}
                          </span>
                        )}
                      </div>
                      {/* Online dot */}
                      <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white"
                        style={{ background: 'hsl(150,80%,50%)', boxShadow: '0 0 8px hsla(150,80%,50%,0.6)' }} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80 mb-0.5">Welcome back 👋</p>
                      <p className="text-base font-bold text-white truncate flex items-center gap-1">
                        <span className="truncate">{displayName}</span>
                        <VerifiedBadge size={15} />
                      </p>
                      {profileUsername && profileUsername !== displayName && (
                        <p className="text-[11px] font-medium text-white/85 truncate -mt-0.5">@{profileUsername}</p>
                      )}
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
                {/* Guest Hero Card — Same dashboard-style banner as logged-in users */}
                <button
                  onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                  className="w-full group relative rounded-3xl p-4 mb-4 overflow-hidden transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background: 'linear-gradient(135deg, hsl(258,78%,55%) 0%, hsl(225,80%,52%) 45%, hsl(200,90%,50%) 100%)',
                    boxShadow: '0 16px 40px -10px hsla(258,78%,45%,0.45), inset 0 1px 0 hsla(0,0%,100%,0.35)',
                    animation: mobileOpen ? 'slideInRight 0.4s ease-out both' : undefined,
                  }}>
                  <div className="absolute inset-0 opacity-50 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at 20% 20%, hsla(0,0%,100%,0.35), transparent 50%), radial-gradient(circle at 80% 80%, hsla(280,90%,70%,0.4), transparent 50%)' }} />
                  <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, hsla(0,0%,100%,0.25), transparent 70%)', filter: 'blur(8px)' }} />

                  <div className="relative flex items-center gap-3.5">
                    <div className="relative shrink-0">
                      <div className="absolute -inset-1 rounded-2xl"
                        style={{ background: 'linear-gradient(135deg, hsla(0,0%,100%,0.6), hsla(280,90%,80%,0.6))', filter: 'blur(4px)' }} />
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center"
                        style={{ background: 'hsla(0,0%,100%,0.25)', backdropFilter: 'blur(12px)', border: '2px solid hsla(0,0%,100%,0.5)' }}>
                        <User size={26} className="text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80 mb-0.5">Welcome 👋</p>
                      <p className="text-base font-bold text-white truncate">Sign in to continue</p>
                      <p className="text-[11px] font-medium text-white/85 truncate -mt-0.5">Track orders & earn rewards</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="px-1.5 py-0.5 rounded-md flex items-center gap-1" style={{ background: 'hsla(0,0%,100%,0.22)', backdropFilter: 'blur(8px)' }}>
                          <Sparkles size={9} className="text-yellow-300" />
                          <span className="text-[10px] font-bold text-white">Get Welcome Offer</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-white/80 transition-transform group-hover:translate-x-1" />
                  </div>

                  {/* Stats Strip — placeholders for guests */}
                  <div className="relative mt-3.5 pt-3 grid grid-cols-3 gap-2 border-t" style={{ borderColor: 'hsla(0,0%,100%,0.20)' }}>
                    <div className="text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">Wallet</p>
                      <p className="text-sm font-extrabold text-white tabular-nums">৳—</p>
                    </div>
                    <div className="text-center border-x" style={{ borderColor: 'hsla(0,0%,100%,0.18)' }}>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">Points</p>
                      <p className="text-sm font-extrabold text-white tabular-nums">—</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">Orders</p>
                      <p className="text-sm font-extrabold text-white tabular-nums">—</p>
                    </div>
                  </div>
                </button>

                {/* Quick Actions — Bento Grid (4 cols) — login required */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[
                    { label: 'Orders',    icon: Package, grad: 'linear-gradient(135deg, hsl(200,90%,55%), hsl(220,85%,55%))' },
                    { label: 'Wallet',    icon: Wallet,  grad: 'linear-gradient(135deg, hsl(150,72%,45%), hsl(170,75%,42%))' },
                    { label: 'Wishlist',  icon: Heart,   grad: 'linear-gradient(135deg, hsl(0,82%,60%), hsl(340,82%,55%))' },
                    { label: 'Points',    icon: Award,   grad: 'linear-gradient(135deg, hsl(38,95%,55%), hsl(20,92%,55%))' },
                  ].map((q, i) => (
                    <button
                      key={q.label}
                      onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                      className="group relative aspect-square rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-1.5 transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]"
                      style={{
                        background: 'hsla(0,0%,100%,0.85)',
                        border: '1px solid hsla(258,78%,60%,0.12)',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 4px 12px hsla(258,40%,40%,0.06)',
                        animation: mobileOpen ? `slideInRight 0.4s ease-out ${0.05 + i * 0.04}s both` : undefined,
                      }}>
                      <div className="absolute inset-x-0 top-0 h-1/2 opacity-15 pointer-events-none" style={{ background: q.grad }} />
                      <div className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
                        style={{ background: q.grad, boxShadow: '0 6px 14px hsla(258,40%,40%,0.22), inset 0 1px 0 hsla(0,0%,100%,0.3)' }}>
                        <q.icon size={17} className="text-white" strokeWidth={2.5} />
                      </div>
                      <span className="text-[10.5px] font-bold tracking-tight" style={{ color: 'hsl(226,35%,22%)' }}>{q.label}</span>
                    </button>
                  ))}
                </div>

                {/* Featured Strip — Hot Deals + Live Help */}
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

                {/* Detailed account list — same as logged-in, opens auth modal */}
                {[
                  { label: 'My Licenses',   icon: Key,    grad: 'linear-gradient(135deg, hsl(45,95%,55%), hsl(30,90%,55%))' },
                  { label: 'Addresses',     icon: MapPin, grad: 'linear-gradient(135deg, hsl(190,85%,45%), hsl(210,85%,50%))' },
                  { label: 'Notifications', icon: Bell,   grad: 'linear-gradient(135deg, hsl(38,95%,55%), hsl(20,90%,55%))' },
                  { label: 'Referral',      icon: Gift,   grad: 'linear-gradient(135deg, hsl(280,75%,55%), hsl(310,70%,55%))' },
                  { label: 'Security',      icon: Lock,   grad: 'linear-gradient(135deg, hsl(220,30%,40%), hsl(240,35%,45%))' },
                  { label: 'Language',      icon: Globe,  grad: 'linear-gradient(135deg, hsl(170,70%,42%), hsl(190,75%,45%))' },
                ].map((item, i) => (
                  <button
                    key={item.label}
                    onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
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

                {/* Sign In CTA — bottom button */}
                <button
                  onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                  className="w-full group relative flex items-center justify-center gap-2 px-3 py-3 mt-3 rounded-2xl text-[13px] font-bold text-white overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
                  style={{
                    background: 'linear-gradient(135deg, hsl(258,78%,55%) 0%, hsl(280,75%,55%) 50%, hsl(258,78%,55%) 100%)',
                    backgroundSize: '200% 100%',
                    boxShadow: '0 10px 24px hsla(258,78%,55%,0.42), inset 0 1px 0 hsla(0,0%,100%,0.30)',
                    animation: 'shimmer 3s linear infinite',
                  }}>
                  <User size={15} strokeWidth={2.6} className="relative" />
                  <span className="relative tracking-wide">Sign In / Sign Up</span>
                </button>

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
