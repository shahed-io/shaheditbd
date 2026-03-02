import { useState, useEffect } from 'react';
import { Search, Menu, X, Phone, ChevronDown, LogOut, User, ShieldCheck } from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';
import SearchBar from './SearchBar';
import { supabase } from '@/integrations/supabase/client';
import AuthModal from './AuthModal';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useCart } from '@/hooks/useCart';

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const { cartCount, wishlistCount, setCartOpen, setWishlistOpen } = useCart();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const navLinks = [
    { label: 'Home', href: '#' },
    { label: 'Windows', href: '#windows', hasDropdown: true },
    { label: 'Office', href: '#office', hasDropdown: true },
    { label: 'Software', href: '#software' },
    { label: 'Subscriptions', href: '#subscription' },
    { label: 'Download Links', href: '#downloads' },
  ];

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';

  return (
    <>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        {/* Announcement bar */}
        <div className="py-2 px-4 text-center text-xs font-medium"
          style={{ background: 'linear-gradient(135deg, hsla(158,64%,52%,0.12), hsla(43,100%,60%,0.08))', borderBottom: '1px solid hsla(158,64%,52%,0.1)' }}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <Phone size={11} />
              <span>Hotline: 01840099853 (10AM–10PM)</span>
            </div>
            <div className="hidden sm:flex items-center gap-5 text-muted-foreground">
              <span className="flex items-center gap-1"><ShieldCheck size={11} className="text-primary" /> 100% Genuine Keys</span>
              <span className="flex items-center gap-1"><span className="text-primary">⚡</span> Instant Delivery</span>
              <span className="flex items-center gap-1"><span className="text-primary">🎧</span> 24/7 Support</span>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <nav
          className="px-4 py-3 transition-all duration-300"
          style={{
            background: scrolled
              ? 'hsla(224,22%,7%,0.96)'
              : 'hsla(224,22%,7%,0.85)',
            backdropFilter: 'blur(24px)',
            borderBottom: scrolled
              ? '1px solid hsl(var(--border))'
              : '1px solid hsla(158,64%,52%,0.1)',
            boxShadow: scrolled ? '0 4px 30px hsla(222,24%,4%,0.5)' : 'none',
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            {/* Logo */}
            <a href="#" className="flex items-center gap-3 flex-shrink-0 group">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                  style={{ background: 'radial-gradient(circle, hsla(158,64%,52%,0.3), transparent)', filter: 'blur(8px)', transform: 'scale(1.3)' }} />
                <img
                  src={logoIcon}
                  alt="Shahed Store"
                  className="relative w-9 h-9 rounded-xl object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="leading-none">
                <div className="font-black text-[15px] tracking-[0.18em] text-foreground" style={{ fontFamily: 'Syne, sans-serif' }}>
                  SHAHED
                </div>
                <div className="text-[9px] tracking-[0.4em] font-semibold uppercase" style={{ color: 'hsl(var(--primary))' }}>
                  STORE
                </div>
              </div>
            </a>

            {/* Search */}
            <div className="flex-1 hidden md:flex max-w-lg mx-auto">
              <SearchBar className="w-full" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 ml-auto">
              <button onClick={() => setSearchOpen(!searchOpen)} className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors">
                <Search size={20} />
              </button>

              {/* Wishlist */}
              <button onClick={() => setWishlistOpen(true)} className="relative p-2.5 text-muted-foreground hover:text-primary transition-colors rounded-xl hover:bg-muted/30" title="Wishlist">
                <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24"
                  fill={wishlistCount > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className={wishlistCount > 0 ? 'text-red-400' : ''}>
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-400 text-background text-[9px] rounded-full flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Cart */}
              <button onClick={() => setCartOpen(true)} className="relative p-2.5 text-muted-foreground hover:text-primary transition-colors rounded-xl hover:bg-muted/30" title="Cart">
                <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
                </svg>
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-primary text-background text-[9px] rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </button>

              {user ? (
                <div className="hidden sm:flex items-center gap-1.5 ml-1">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border"
                    style={{ background: 'hsla(158,64%,52%,0.08)', borderColor: 'hsla(158,64%,52%,0.2)' }}>
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
                      <User size={11} className="text-background" />
                    </div>
                    <span className="text-sm text-foreground font-medium max-w-[90px] truncate">{displayName}</span>
                  </div>
                  <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="লগআউট">
                    <LogOut size={17} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setAuthOpen(true)} className="hidden sm:flex btn-glow px-5 py-2 rounded-xl text-sm items-center gap-1.5 ml-1 font-semibold">
                  লগইন
                </button>
              )}

              <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors">
                {mobileOpen ? <X size={21} /> : <Menu size={21} />}
              </button>
            </div>
          </div>

          {searchOpen && (
            <div className="mt-3 md:hidden">
              <SearchBar />
            </div>
          )}
        </nav>

        {/* Nav links bar */}
        <div className="hidden md:block px-4"
          style={{ background: 'hsla(222,24%,6%,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid hsl(var(--border))' }}>
          <div className="max-w-7xl mx-auto flex items-center">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="nav-link px-4 py-3 flex items-center gap-1">
                {link.label}
                {link.hasDropdown && <ChevronDown size={12} className="opacity-60" />}
              </a>
            ))}
            <a href="#shop" className="ml-auto btn-glow px-5 py-2 rounded-xl text-xs font-bold my-1.5 flex items-center gap-1.5">
              ⚡ Flash Sale
            </a>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-b border-border" style={{ background: 'hsla(224,22%,8%,0.98)', backdropFilter: 'blur(20px)' }}>
            <div className="max-w-7xl mx-auto py-3 px-4 flex flex-col gap-0.5">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)}
                  className="nav-link py-3 px-3 rounded-xl hover:bg-muted/30 flex items-center justify-between">
                  {link.label}
                  {link.hasDropdown && <ChevronDown size={14} className="opacity-50" />}
                </a>
              ))}
              <div className="h-px bg-border my-2" />
              {user ? (
                <button onClick={handleLogout} className="text-left text-destructive py-3 px-3 text-sm rounded-xl hover:bg-destructive/10">লগআউট</button>
              ) : (
                <button onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                  className="btn-glow py-3 px-3 rounded-xl text-sm text-left mt-1 font-semibold">
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
