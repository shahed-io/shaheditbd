import { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Search, Menu, X, Phone, ChevronDown, Star, LogOut, User, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import logoIcon from '@/assets/logo-icon.png';
import SearchBar from './SearchBar';
import { supabase } from '@/integrations/supabase/client';
import AuthModal from './AuthModal';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartCount] = useState(3);
  const [wishlistCount] = useState(5);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);

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
              {/* Icon */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/30 blur-md group-hover:blur-lg scale-110 transition-all duration-300" />
                <img
                  src={logoIcon}
                  alt="Shahed Store Icon"
                  className="relative w-9 h-9 rounded-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              {/* Text */}
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
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Search size={20} />
              </button>

              <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-accent text-background text-[10px] rounded-full flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </button>

              <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-background text-[10px] rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </button>

              {user ? (
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/my-orders" className="flex items-center gap-1.5 glass-card px-3 py-1.5 rounded-xl border border-border hover:border-primary/40 transition-colors text-muted-foreground hover:text-primary text-sm">
                    <Package size={14} />
                    <span className="hidden lg:inline">My Orders</span>
                  </Link>
                  <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-xl border border-primary/30">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <User size={12} className="text-background" />
                    </div>
                    <span className="text-sm text-foreground font-medium max-w-[100px] truncate">{displayName}</span>
                  </div>
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
                  className="hidden sm:flex btn-glow px-4 py-2 rounded-xl text-sm items-center gap-1"
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
