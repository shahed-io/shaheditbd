import { useState, useEffect, useRef } from 'react';
import { Menu, X, ShoppingCart, User, LogOut, LayoutDashboard, ChevronDown, Star, Shield, Phone, Mail, Sparkles, Search, Download, Share2, PlusSquare } from 'lucide-react';
import AuthModal from './AuthModal';
import BrandLogo from './BrandLogo';
import SearchBar, { DesktopSearchPalette, MobileSearchOverlay } from './SearchBar';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

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
    if (!user) { setAvatarUrl(null); return; }
    // Defer avatar fetch slightly — not critical for initial render
    const t = setTimeout(() => {
      supabase.from('profiles').select('avatar_url, display_name').eq('user_id', user.id).single()
        .then(({ data }) => { if (data?.avatar_url) setAvatarUrl(data.avatar_url); });
    }, 500);
    return () => clearTimeout(t);
  }, [user]);

  useEffect(() => {
    // Defer announcement fetch — below-fold banner
    const t = setTimeout(() => {
      supabase.from('site_settings').select('value').eq('key', 'announcement_text').eq('category', 'marketing').maybeSingle()
        .then(({ data }) => { if (data?.value) setAnnouncement(data.value); });
    }, 1000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    loadNavCategories();
    // Realtime: bust cache and reload when categories change
    const channel = supabase
      .channel('navbar-cats-rt')
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'categories' }, () => {
        _catCache = null;
        loadNavCategories(true);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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

      {/* ── Top Announcement Bar ── */}
      <div className="w-full text-white text-xs font-medium py-2 flex items-center overflow-hidden relative"
        style={{ background: 'linear-gradient(90deg, hsl(258,78%,50%), hsl(200,90%,42%), hsl(258,78%,50%))' }}>
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

        <div className="flex items-center gap-3 text-[11px] pr-4 flex-shrink-0 relative z-10">
          <span className="hidden md:flex items-center gap-1"><Star size={10} fill="currentColor" /> 4.9/5</span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'hsla(0,0%,100%,0.18)' }}>
            <Shield size={10} /> Secured
          </span>
        </div>
      </div>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>

      {/* ── Main Navbar — Glassmorphism Card ── */}
      <div className="sticky top-0 z-50 px-4 py-2 backdrop-blur-xl"
        style={{
          background: 'hsla(0,0%,100%,0.60)',
        }}>
      <nav
        className="transition-all duration-300 rounded-2xl mx-auto max-w-7xl backdrop-blur-2xl"
        style={{
          background: scrolled
            ? 'hsla(0,0%,100%,0.88)'
            : 'hsla(0,0%,100%,0.78)',
          border: '1.5px solid',
          borderColor: scrolled
            ? 'hsla(258,78%,60%,0.30)'
            : 'hsla(258,78%,60%,0.20)',
          boxShadow: scrolled
            ? '0 8px 40px hsla(258,78%,55%,0.18), 0 2px 12px hsla(200,90%,45%,0.10), inset 0 1px 0 hsla(0,0%,100%,0.80)'
            : '0 4px 32px hsla(258,78%,55%,0.12), inset 0 1px 0 hsla(0,0%,100%,0.70)',
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
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'hsl(258,78%,45%)';
                        e.currentTarget.style.border = '1px solid hsla(258,78%,75%,0.35)';
                        e.currentTarget.style.boxShadow = '0 2px 10px hsla(258,78%,55%,0.12)';
                        e.currentTarget.style.background = 'hsla(258,78%,55%,0.07)';
                      }
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
          <MobileSearchOverlay onClose={() => setMobileSearch(false)} />
        )}

        {/* Mobile Menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? 'max-h-screen' : 'max-h-0'}`}>
          <div className="border-t px-4 py-4 space-y-1"
            style={{ background: 'hsla(0,0%,100%,0.92)', borderColor: 'hsla(258,78%,60%,0.15)', backdropFilter: 'blur(20px)', borderRadius: '0 0 16px 16px' }}>
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors"
                style={{ color: 'hsl(226,35%,28%)' }}>
                {link.label}
              </a>
            ))}
            {/* Install App Button */}
            {canInstall && (
              <div className="pb-1">
                <button onClick={handleInstall}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all"
                  style={{ color: 'hsl(258,78%,50%)', background: 'hsla(258,78%,55%,0.08)' }}>
                  <Download size={16} />
                  Install App
                </button>
                {showIOSTip && (
                  <div className="mx-2 mt-1.5 rounded-xl p-3 text-[12px] leading-relaxed"
                    style={{ background: 'hsla(258,78%,55%,0.06)', border: '1px solid hsla(258,78%,55%,0.15)' }}>
                    <p className="font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'hsl(226,35%,20%)' }}>
                      <Share2 size={13} /> Install on iOS:
                    </p>
                    <p className="flex items-center gap-1.5" style={{ color: 'hsl(226,35%,45%)' }}>
                      1. Tap the <Share2 size={12} className="text-blue-500" /> Share button below
                    </p>
                    <p className="flex items-center gap-1.5 mt-1" style={{ color: 'hsl(226,35%,45%)' }}>
                      2. Select <PlusSquare size={12} className="text-blue-500" /> "Add to Home Screen"
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 border-t" style={{ borderColor: 'hsl(220,20%,90%)' }}>
              {user ? (
                <div className="flex gap-2">
                  <button onClick={() => { navigate('/dashboard'); setMobileOpen(false); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))' }}>
                    <LayoutDashboard size={15} /> Dashboard
                  </button>
                  <button onClick={() => supabase.auth.signOut()}
                    className="px-4 py-3 rounded-2xl text-sm font-semibold border transition-all"
                    style={{ color: 'hsl(226,35%,35%)', borderColor: 'hsl(220,20%,88%)' }}>
                    Logout
                  </button>
                </div>
              ) : (
                <button onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))', boxShadow: '0 4px 16px hsla(258,78%,55%,0.30)' }}>
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
      </div>
    </>
  );
};

export default Navbar;
