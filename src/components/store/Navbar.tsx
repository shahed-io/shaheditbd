import { useState, useEffect } from 'react';
import { Search, Menu, X, ShoppingCart, User, LogOut, LayoutDashboard, ChevronDown, Zap, Star, Shield, Phone, Mail } from 'lucide-react';
import AuthModal from './AuthModal';
import SearchBar from './SearchBar';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const NAV_LINKS = [
  { label: 'Home',       href: '/' },
  { label: 'Shop',       href: '/shop' },
  { label: 'Windows',    href: '#windows' },
  { label: 'Office',     href: '#office' },
  { label: 'Streaming',  href: '#streaming' },
  { label: 'Support',    href: '#support' },
];

const CATEGORY_DROPDOWN = [
  { icon: '🪟', label: 'Windows', count: 12 },
  { icon: '📦', label: 'Microsoft Office', count: 8 },
  { icon: '🎨', label: 'Adobe', count: 6 },
  { icon: '🛡️', label: 'Antivirus', count: 10 },
  { icon: '🎬', label: 'Streaming', count: 9 },
  { icon: '🔒', label: 'VPN', count: 5 },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen,   setAuthOpen]   = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [catOpen,    setCatOpen]    = useState(false);
  const { user } = useAuth();
  const { cartCount, setCartOpen } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';

  return (
    <>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {/* ── Top Announcement Bar ── */}
      <div className="w-full text-white text-xs font-medium py-2 px-4 flex items-center justify-between overflow-hidden"
        style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%), hsl(283,65%,55%))' }}>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><Phone size={11} /> 01840-099853</span>
          <span className="hidden sm:flex items-center gap-1.5"><Mail size={11} /> info@shahedstore.com.bd</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold text-[11px]">
          <Zap size={11} fill="white" />
          <span className="hidden sm:inline">FREE instant delivery • 24/7 support</span>
          <span className="sm:hidden">⚡ Free delivery</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="hidden md:flex items-center gap-1"><Star size={10} fill="white" /> 4.9/5</span>
          <span className="flex items-center gap-1"><Shield size={10} /> Secured</span>
        </div>
      </div>

      {/* ── Main Navbar ── */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-xl shadow-medium border-b border-border' : 'bg-white shadow-soft border-b border-border'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base transition-transform duration-300 group-hover:scale-110"
                  style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>S</div>
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
                  style={{ background: 'hsl(15,100%,60%)' }} />
              </div>
              <div>
                <div className="font-sora font-black text-base text-foreground tracking-tight leading-none">
                  Shahed<span style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Store</span>
                </div>
                <div className="text-[9px] font-fira text-muted-foreground tracking-widest uppercase leading-none">Digital Marketplace</div>
              </div>
            </a>

            {/* Search — Desktop */}
            <div className="hidden md:flex flex-1 max-w-md">
              <SearchBar variant="navbar" className="w-full" />
            </div>

            {/* Desktop Links */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(link => (
                <div key={link.label} className="relative group"
                  onMouseEnter={() => link.label === 'Shop' && setCatOpen(true)}
                  onMouseLeave={() => link.label === 'Shop' && setCatOpen(false)}>
                  <a href={link.href}
                    className="nav-link-new flex items-center gap-1 px-3 py-2 rounded-xl hover:bg-surface-light transition-colors font-medium text-sm">
                    {link.label}
                    {link.label === 'Shop' && <ChevronDown size={12} className={`transition-transform duration-200 ${catOpen ? 'rotate-180' : ''}`} />}
                  </a>
                  {link.label === 'Shop' && (
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-2xl border border-border shadow-strong transition-all duration-200 origin-top ${catOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
                      onMouseEnter={() => setCatOpen(true)} onMouseLeave={() => setCatOpen(false)}>
                      <div className="p-2">
                        {CATEGORY_DROPDOWN.map(cat => (
                          <a key={cat.label} href={`/category/${cat.label.toLowerCase()}`}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-light transition-colors">
                            <span className="text-xl">{cat.icon}</span>
                            <span className="text-sm font-medium text-foreground flex-1">{cat.label}</span>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{cat.count}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="hidden sm:flex items-center gap-1">
                  <button onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-light transition-all">
                    <User size={15} />
                    <span className="hidden lg:inline max-w-[70px] truncate">{displayName}</span>
                  </button>
                  <button onClick={() => supabase.auth.signOut()}
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-surface-light transition-all">
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setAuthOpen(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-light transition-all">
                  <User size={16} />
                  <span className="hidden lg:inline">Login</span>
                </button>
              )}

              <button onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 shadow-indigo"
                style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                <ShoppingCart size={16} />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white"
                    style={{ background: 'hsl(15,100%,60%)' }}>{cartCount}</span>
                )}
              </button>

              <button className="lg:hidden p-2 rounded-xl hover:bg-surface-light transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? 'max-h-screen' : 'max-h-0'}`}>
          <div className="border-t border-border bg-white px-4 py-4 space-y-1">
            <div className="flex items-center gap-2 rounded-2xl border border-border px-4 py-2.5 bg-surface-light mb-3">
              <Search size={16} className="text-muted-foreground" />
              <input type="text" placeholder="Search products…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            </div>
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-foreground hover:bg-surface-light transition-colors">
                {link.label}
              </a>
            ))}
            <div className="pt-2 border-t border-border">
              {user ? (
                <div className="flex gap-2">
                  <button onClick={() => { navigate('/dashboard'); setMobileOpen(false); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                    <LayoutDashboard size={15} /> Dashboard
                  </button>
                  <button onClick={() => supabase.auth.signOut()}
                    className="px-4 py-3 rounded-2xl text-sm font-semibold text-muted-foreground hover:bg-surface-light border border-border transition-all">
                    Logout
                  </button>
                </div>
              ) : (
                <button onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                  className="w-full py-3 rounded-2xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
