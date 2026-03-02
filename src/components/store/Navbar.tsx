import { useState, useEffect } from 'react';
import { Search, Menu, X, Phone, ChevronDown, Star, LogOut, User, LayoutDashboard } from 'lucide-react';
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
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const { cartCount, wishlistCount, setCartOpen, setWishlistOpen } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

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
        {/* Top bar */}
        <div className="bg-primary/10 backdrop-blur-sm border-b border-primary/20 py-1.5 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-primary">
              <Phone size={12} />
              <span className="font-medium">Hotline: 01840099853 (10AM–10PM)</span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-muted-foreground">
              <span>✅ Instant Delivery</span>
              <span>✅ 100% Genuine Keys</span>
              <span>✅ 24/7 Support</span>
            </div>
          </div>
        </div>

        {/* Main navbar */}
        <nav className="glass-card border-b border-primary/20 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/30 blur-md group-hover:blur-lg scale-110 transition-all duration-300" />
                <img
                  src={logoIcon}
                  alt="Shahed Store Icon"
                  className="relative w-9 h-9 rounded-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="leading-none">
                <div className="font-black text-base tracking-widest gradient-text" style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.15em' }}>
                  SHAHED
                </div>
                <div className="text-[9px] tracking-[0.35em] text-primary/80 font-semibold uppercase">
                  STORE
                </div>
              </div>
            </a>

            {/* Search bar */}
            <div className="flex-1 hidden md:flex max-w-xl">
              <SearchBar className="w-full" />
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Search size={20} />
              </button>

              {/* Wishlist */}
              <button
                onClick={() => setWishlistOpen(true)}
                className="relative p-2 text-muted-foreground hover:text-primary transition-colors"
                title="Wishlist"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={wishlistCount > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={wishlistCount > 0 ? 'text-red-400' : ''}>
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-accent text-background text-[10px] rounded-full flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-muted-foreground hover:text-primary transition-colors"
                title="Cart"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
                </svg>
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-background text-[10px] rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </button>

              {user ? (
                <div className="hidden sm:flex items-center gap-1 ml-1">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-xl border border-primary/30 hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <User size={12} className="text-background" />
                    </div>
                    <span className="text-sm text-foreground font-medium max-w-[100px] truncate">{displayName}</span>
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                    title="ড্যাশবোর্ড"
                  >
                    <LayoutDashboard size={18} />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    title="লগআউট"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="hidden sm:flex btn-glow px-4 py-2 rounded-xl text-sm items-center gap-1 ml-1"
                >
                  লগইন
                </button>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors"
              >
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

        {/* Nav links bar */}
        <div className="hidden md:block bg-background/80 backdrop-blur-sm border-b border-border/50 px-4">
          <div className="max-w-7xl mx-auto flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="nav-link px-4 py-3 flex items-center gap-1"
              >
                {link.label}
                {(link.label === 'Windows' || link.label === 'Office') && (
                  <ChevronDown size={12} />
                )}
              </a>
            ))}
            <a
              href="#shop"
              className="ml-auto btn-glow px-5 py-2 rounded-lg text-sm my-1.5 flex items-center gap-2"
            >
              <Star size={14} />
              Shop Now
            </a>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden glass-card border-b border-border">
            <div className="max-w-7xl mx-auto py-3 px-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="nav-link py-2.5 px-3 rounded-lg hover:bg-muted/40"
                >
                  {link.label}
                </a>
              ))}
              {user ? (
                <button
                  onClick={handleLogout}
                  className="text-left text-destructive py-2.5 px-3 text-sm"
                >
                  লগআউট
                </button>
              ) : (
                <button
                  onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                  className="btn-glow py-2.5 px-3 rounded-xl text-sm text-left mt-1"
                >
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
