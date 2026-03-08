import { useState, useEffect } from 'react';
import { Search, Menu, X, Phone, Mail, ChevronRight, LogOut, User, LayoutDashboard, ShoppingCart, Heart } from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';
import SearchBar from './SearchBar';
import { supabase } from '@/integrations/supabase/client';
import AuthModal from './AuthModal';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useCart } from '@/hooks/useCart';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const { cartCount, wishlistCount, setCartOpen, setWishlistOpen } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const navLinks = [
    { label: 'Home', href: '#' },
    { label: 'Windows', href: '#windows' },
    { label: 'Office', href: '#office' },
    { label: 'Software', href: '#software' },
    { label: 'Subscription', href: '#subscription' },
    { label: 'Download Links', href: '#downloads' },
  ];

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';

  return (
    <>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Top info bar */}
        <div className="hidden sm:block border-b border-border/40" style={{ background: 'hsla(228,28%,7%,0.95)' }}>
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-6">
              <a href="tel:01840099853" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                <Phone size={11} className="text-primary" />
                01840-099853
              </a>
              <a href="mailto:info@shahedstore.com.bd" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                <Mail size={11} className="text-primary" />
                info@shahedstore.com.bd
              </a>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                </span>
                24/7 Support
              </span>
              <a
                href="https://wa.me/8801840099853"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all"
                style={{
                  background: 'hsla(180,100%,42%,0.12)',
                  border: '1px solid hsla(180,100%,42%,0.25)',
                  color: 'hsl(var(--primary))',
                }}
              >
                Free Consultation →
              </a>
            </div>
          </div>
        </div>

        {/* Main navbar */}
        <nav
          className="border-b border-border/30 px-4 py-3 transition-all duration-300"
          style={{
            background: scrolled
              ? 'hsla(230,30%,5%,0.97)'
              : 'hsla(230,30%,6%,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: scrolled ? '0 4px 30px hsla(180,100%,42%,0.08)' : 'none',
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center gap-5">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-md scale-110 transition-all duration-300 group-hover:blur-lg"
                  style={{ background: 'hsla(180,100%,42%,0.3)' }} />
                <img src={logoIcon} alt="Shahed Store" className="relative w-9 h-9 rounded-full object-cover group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="leading-none">
                <div className="font-black text-base tracking-widest gradient-text" style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.15em' }}>
                  SHAHED
                </div>
                <div className="text-[9px] tracking-[0.35em] font-semibold uppercase" style={{ color: 'hsl(var(--primary))' }}>
                  STORE
                </div>
              </div>
            </a>

            {/* Nav links - center */}
            <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} className="nav-link px-4 py-2 text-[13px]">
                  {link.label}
                </a>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 lg:flex-none hidden md:flex lg:w-auto md:max-w-xs">
              <SearchBar className="w-full" />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 ml-auto lg:ml-0">
              <button onClick={() => setSearchOpen(!searchOpen)} className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors">
                <Search size={20} />
              </button>

              {/* Wishlist */}
              <button onClick={() => setWishlistOpen(true)} className="relative p-2 text-muted-foreground hover:text-primary transition-colors" title="Wishlist">
                <Heart size={19} fill={wishlistCount > 0 ? 'currentColor' : 'none'} className={wishlistCount > 0 ? 'text-rose-400' : ''} />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 text-background text-[10px] rounded-full flex items-center justify-center font-bold"
                    style={{ background: 'hsl(var(--accent))' }}>
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Cart */}
              <button onClick={() => setCartOpen(true)} className="relative p-2 text-muted-foreground hover:text-primary transition-colors" title="Cart">
                <ShoppingCart size={19} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 text-background text-[10px] rounded-full flex items-center justify-center font-bold"
                    style={{ background: 'hsl(var(--primary))' }}>
                    {cartCount}
                  </span>
                )}
              </button>

              {user ? (
                <div className="hidden sm:flex items-center gap-1 ml-1">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/50 transition-all hover:border-primary/40"
                    style={{ background: 'hsla(228,28%,11%,0.8)' }}
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--gradient-primary)' }}>
                      <User size={12} className="text-background" />
                    </div>
                    <span className="text-sm font-medium max-w-[90px] truncate">{displayName}</span>
                  </button>
                  <button onClick={() => navigate('/dashboard')} className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Dashboard">
                    <LayoutDashboard size={18} />
                  </button>
                  <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="Logout">
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold text-background ml-2 transition-all hover:scale-105 hover:shadow-lg"
                  style={{
                    background: 'var(--gradient-primary)',
                    boxShadow: '0 0 20px hsla(180,100%,42%,0.2)',
                  }}
                >
                  Get Started
                  <ChevronRight size={14} />
                </button>
              )}

              <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-muted-foreground hover:text-primary transition-colors">
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Mobile search */}
          {searchOpen && (
            <div className="mt-3 md:hidden">
              <SearchBar />
            </div>
          )}
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-b border-border/40 backdrop-blur-xl" style={{ background: 'hsla(228,28%,8%,0.98)' }}>
            <div className="max-w-7xl mx-auto py-3 px-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)}
                  className="nav-link py-3 px-3 rounded-lg hover:bg-muted/30 text-sm">
                  {link.label}
                </a>
              ))}
              <div className="border-t border-border/30 mt-2 pt-2">
                {user ? (
                  <button onClick={handleLogout} className="text-left text-destructive py-2.5 px-3 text-sm w-full">লগআউট</button>
                ) : (
                  <button
                    onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                    className="w-full text-background py-2.5 px-4 rounded-xl text-sm font-bold mt-1"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    লগইন / সাইনআপ
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;
