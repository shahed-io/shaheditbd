import { useState, useEffect } from 'react';
import { Search, Menu, X, ShoppingCart, Heart, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';
import SearchBar from './SearchBar';
import { supabase } from '@/integrations/supabase/client';
import AuthModal from './AuthModal';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useCart } from '@/hooks/useCart';
import { useNavigate } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Home',         href: '/' },
  { label: 'Windows',      href: '#windows' },
  { label: 'Office',       href: '#office' },
  { label: 'Adobe',        href: '#adobe' },
  { label: 'Subscription', href: '#subscription' },
  { label: 'Streaming',    href: '#streaming' },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen,   setAuthOpen]   = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [user,       setUser]       = useState<SupabaseUser | null>(null);
  const { cartCount, wishlistCount, setCartOpen, setWishlistOpen } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';

  return (
    <>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      <header
        className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? 'hsl(0,0%,5%)' : 'hsl(0,0%,5%)',
          borderBottom: `1px solid ${scrolled ? 'hsl(0,0%,16%)' : 'transparent'}`,
          boxShadow: scrolled ? '0 4px 40px hsla(0,0%,0%,0.6)' : 'none',
        }}
      >
        {/* ── Announcement bar ── */}
        <div className="hidden sm:flex items-center justify-center py-2 text-xs font-medium"
          style={{ backgroundColor: 'var(--gold)', color: 'hsl(0,0%,5%)' }}>
          <span className="font-bold">🎉 ফ্ল্যাশ সেল চলছে!</span>
          <span className="mx-3 opacity-60">|</span>
          সব প্রোডাক্টে বিশেষ ছাড় · ইনস্ট্যান্ট ডেলিভারি · ২৪/৭ সাপোর্ট
          <span className="mx-3 opacity-60">|</span>
          <a href="https://wa.me/8801840099853" target="_blank" rel="noopener noreferrer" className="underline font-bold">এখনই অর্ডার করুন →</a>
        </div>

        {/* ── Main nav ── */}
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-6">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <img src={logoIcon} alt="Shahed Store" className="w-8 h-8 rounded object-cover" />
            <div style={{ fontFamily: 'Syne, sans-serif' }}>
              <span className="font-extrabold text-base tracking-wide" style={{ color: 'var(--gold)' }}>SHAHED</span>
              <span className="font-extrabold text-base tracking-wide text-foreground"> STORE</span>
            </div>
          </a>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-1 flex-1">
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href}
                className="nav-link px-3.5 py-2 rounded hover:bg-muted/40 transition-colors text-[13px]">
                {link.label}
              </a>
            ))}
          </nav>

          {/* Search (desktop) */}
          <div className="hidden md:block w-56 lg:w-64">
            <SearchBar className="w-full" />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-0.5 ml-auto lg:ml-0">
            {/* Mobile search toggle */}
            <button onClick={() => setSearchOpen(p => !p)}
              className="md:hidden p-2.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
              <Search size={18} />
            </button>

            {/* Wishlist */}
            <button onClick={() => setWishlistOpen(true)}
              className="relative p-2.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
              <Heart size={18} fill={wishlistCount > 0 ? 'currentColor' : 'none'}
                style={wishlistCount > 0 ? { color: 'var(--crimson)' } : {}} />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full text-[9px] font-bold flex items-center justify-center"
                  style={{ backgroundColor: 'var(--crimson)', color: '#fff' }}>{wishlistCount}</span>
              )}
            </button>

            {/* Cart */}
            <button onClick={() => setCartOpen(true)}
              className="relative p-2.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full text-[9px] font-bold flex items-center justify-center"
                  style={{ backgroundColor: 'var(--gold)', color: 'hsl(0,0%,5%)' }}>{cartCount}</span>
              )}
            </button>

            {/* Auth */}
            {user ? (
              <div className="hidden sm:flex items-center gap-1 ml-2">
                <button onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded border text-sm font-medium transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
                  style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'var(--surface-1)' }}>
                  <User size={14} />
                  <span className="max-w-[80px] truncate">{displayName}</span>
                </button>
                <button onClick={() => supabase.auth.signOut()}
                  className="p-2.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted/40 transition-colors">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button onClick={() => setAuthOpen(true)}
                className="btn-gold hidden sm:flex items-center gap-1.5 px-5 py-2 rounded text-sm ml-2">
                লগইন
              </button>
            )}

            {/* Hamburger */}
            <button onClick={() => setMobileOpen(p => !p)}
              className="lg:hidden p-2.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors ml-1">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        {searchOpen && (
          <div className="md:hidden px-4 pb-3" style={{ backgroundColor: 'hsl(0,0%,5%)' }}>
            <SearchBar />
          </div>
        )}

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t py-4 px-4 flex flex-col gap-1"
            style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(0,0%,7%)' }}>
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href}
                onClick={() => setMobileOpen(false)}
                className="nav-link py-2.5 px-3 rounded hover:bg-muted/40 transition-colors">
                {link.label}
              </a>
            ))}
            <div className="border-t mt-2 pt-3" style={{ borderColor: 'hsl(var(--border))' }}>
              {user ? (
                <div className="flex flex-col gap-2">
                  <button onClick={() => { navigate('/dashboard'); setMobileOpen(false); }}
                    className="btn-outline flex items-center gap-2 px-4 py-2.5 rounded text-sm w-full">
                    <LayoutDashboard size={15} /> ড্যাশবোর্ড
                  </button>
                  <button onClick={() => supabase.auth.signOut()}
                    className="text-left text-sm text-destructive px-3 py-2">লগআউট</button>
                </div>
              ) : (
                <button onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                  className="btn-gold w-full py-2.5 rounded text-sm font-bold">
                  লগইন / সাইনআপ
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;
