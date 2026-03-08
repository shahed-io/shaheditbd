import { useState, useEffect } from 'react';
import { Search, Menu, X, ShoppingCart, Heart, User, LogOut, LayoutDashboard, Zap } from 'lucide-react';
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
  { label: 'Streaming',    href: '#streaming' },
  { label: 'VPN',          href: '#vpn' },
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
    const onScroll = () => setScrolled(window.scrollY > 20);
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
        className="fixed top-0 inset-x-0 z-50 transition-all duration-500"
        style={{
          background: scrolled
            ? 'hsla(220, 20%, 4%, 0.95)'
            : 'hsla(220, 20%, 4%, 0.6)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${scrolled ? 'hsla(185,100%,50%,0.15)' : 'transparent'}`,
          boxShadow: scrolled ? '0 4px 40px hsla(185,100%,50%,0.05)' : 'none',
        }}
      >
        {/* ── Top bar ── */}
        <div className="hidden md:flex items-center justify-between px-6 py-1.5 text-[11px]"
          style={{ borderBottom: '1px solid hsl(var(--border))', background: 'hsla(220,20%,4%,0.8)' }}>
          <div className="flex items-center gap-6" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--muted-foreground))' }}>
            <span className="flex items-center gap-1.5">
              <span style={{ color: 'var(--cyan)' }}>▸</span>
              📞 01840-099853
            </span>
            <span className="flex items-center gap-1.5">
              <span style={{ color: 'var(--cyan)' }}>▸</span>
              ✉ info@shahedstore.com.bd
            </span>
          </div>
          <div className="flex items-center gap-4" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            <span className="flex items-center gap-1.5 text-[10px]">
              <span className="inline-block w-1.5 h-1.5 rounded-full anim-neon" style={{ backgroundColor: 'hsl(120,100%,50%)' }} />
              <span style={{ color: 'hsl(120,100%,55%)' }}>System Online</span>
            </span>
            <span style={{ color: 'hsl(var(--muted-foreground))' }}>|</span>
            <a href="https://wa.me/8801840099853" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1" style={{ color: 'var(--cyan)' }}>
              <Zap size={10} fill="currentColor" /> Flash Sale Active
            </a>
          </div>
        </div>

        {/* ── Main nav ── */}
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-6">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="relative">
              <img src={logoIcon} alt="Shahed Store" className="w-9 h-9 rounded-lg object-cover transition-all duration-300 group-hover:scale-105"
                style={{ border: '1px solid var(--cyan-border)' }} />
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ boxShadow: 'var(--cyan-glow)' }} />
            </div>
            <div>
              <div className="flex items-center gap-0" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <span className="font-black text-base tracking-wider gradient-text-cyber">SHAHED</span>
                <span className="font-black text-base tracking-wider text-foreground ml-1">STORE</span>
              </div>
              <div className="text-[8px] tracking-[0.2em] uppercase"
                style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--cyan)', opacity: 0.7 }}>
                Digital Marketplace
              </div>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href}
                className="nav-link px-4 py-2 rounded-md hover:bg-surface-2 transition-colors">
                {link.label}
              </a>
            ))}
          </nav>

          {/* Search */}
          <div className="hidden md:block w-52 lg:w-64">
            <SearchBar className="w-full" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 ml-auto lg:ml-0">
            <button onClick={() => setSearchOpen(p => !p)}
              className="md:hidden p-2.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              style={{ border: '1px solid transparent' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--cyan-border)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
              <Search size={17} />
            </button>

            {/* Wishlist */}
            <button onClick={() => setWishlistOpen(true)}
              className="relative p-2.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <Heart size={17} fill={wishlistCount > 0 ? 'currentColor' : 'none'}
                style={wishlistCount > 0 ? { color: 'hsl(320,90%,60%)' } : {}} />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, hsl(320,90%,60%), hsl(270,80%,60%))', color: '#fff' }}>
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart */}
            <button onClick={() => setCartOpen(true)}
              className="relative p-2.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <ShoppingCart size={17} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center anim-neon"
                  style={{ background: 'var(--cyan)', color: 'hsl(220,20%,4%)' }}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* Auth */}
            {user ? (
              <div className="hidden sm:flex items-center gap-1 ml-2">
                <button onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ border: '1px solid var(--cyan-border)', color: 'var(--cyan)', background: 'var(--cyan-dim)' }}>
                  <User size={12} />
                  <span className="max-w-[70px] truncate" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {displayName}
                  </span>
                </button>
                <button onClick={() => supabase.auth.signOut()}
                  className="p-2.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button onClick={() => setAuthOpen(true)}
                className="btn-cyber hidden sm:flex items-center gap-2 px-5 py-2 rounded-lg text-xs ml-2">
                <User size={12} /> Login
              </button>
            )}

            <button onClick={() => setMobileOpen(p => !p)}
              className="lg:hidden p-2.5 rounded-lg transition-colors ml-1"
              style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        {searchOpen && (
          <div className="md:hidden px-4 pb-3 border-t" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--background))' }}>
            <SearchBar />
          </div>
        )}

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t py-4 px-4 flex flex-col gap-1"
            style={{ borderColor: 'hsla(185,100%,50%,0.15)', background: 'hsl(220,18%,6%)' }}>
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href}
                onClick={() => setMobileOpen(false)}
                className="nav-link py-3 px-4 rounded-lg hover:bg-surface-2 transition-colors">
                <span style={{ color: 'var(--cyan)', marginRight: '8px', fontFamily: 'JetBrains Mono, monospace' }}>›</span>
                {link.label}
              </a>
            ))}
            <div className="border-t mt-3 pt-3" style={{ borderColor: 'hsl(var(--border))' }}>
              {user ? (
                <div className="flex flex-col gap-2">
                  <button onClick={() => { navigate('/dashboard'); setMobileOpen(false); }}
                    className="btn-cyber-outline flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs w-full justify-center">
                    <LayoutDashboard size={13} /> Dashboard
                  </button>
                  <button onClick={() => supabase.auth.signOut()}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors px-3 py-2">
                    Sign Out
                  </button>
                </div>
              ) : (
                <button onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                  className="btn-cyber w-full py-3 rounded-lg text-xs">
                  Login / Register
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
