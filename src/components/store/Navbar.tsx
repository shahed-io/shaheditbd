import { useState, useEffect } from 'react';
import { Menu, X, ShoppingCart, User, LogOut, LayoutDashboard, ChevronDown, Star, Shield, Phone, Mail, Sparkles } from 'lucide-react';
import AuthModal from './AuthModal';
import SearchBar from './SearchBar';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const NAV_LINKS = [
  { label: 'Home',      href: '/' },
  { label: 'Shop',      href: '/shop' },
  { label: 'Windows',   href: '#windows' },
  { label: 'Office',    href: '#office' },
  { label: 'Streaming', href: '#streaming' },
  { label: 'Support',   href: '#support' },
];

const CATEGORY_DROPDOWN = [
  { icon: '🪟', label: 'Windows',          count: 12, color: 'hsla(210,90%,55%,0.1)' },
  { icon: '📦', label: 'Microsoft Office', count: 8,  color: 'hsla(25,90%,55%,0.1)' },
  { icon: '🎨', label: 'Adobe',            count: 6,  color: 'hsla(263,70%,58%,0.1)' },
  { icon: '🛡️', label: 'Antivirus',       count: 10, color: 'hsla(158,64%,42%,0.1)' },
  { icon: '🎬', label: 'Streaming',        count: 9,  color: 'hsla(0,80%,60%,0.1)' },
  { icon: '🔒', label: 'VPN',              count: 5,  color: 'hsla(190,70%,45%,0.1)' },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen,   setAuthOpen]   = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [catOpen,    setCatOpen]    = useState(false);
  const [avatarUrl,  setAvatarUrl]  = useState<string | null>(null);
  const { user } = useAuth();
  const { cartCount, setCartOpen } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!user) { setAvatarUrl(null); return; }
    supabase.from('profiles').select('avatar_url, display_name').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      });
  }, [user]);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName[0].toUpperCase();

  return (
    <>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {/* ── Top Announcement Bar ── */}
      <div className="w-full text-white text-xs font-medium py-2 px-4 flex items-center justify-between overflow-hidden relative"
        style={{ background: 'linear-gradient(90deg, hsl(243,75%,52%), hsl(263,70%,52%), hsl(283,65%,50%))' }}>
        <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <a href="tel:01840099853" className="flex items-center gap-1.5 hover:text-white/80 transition-colors">
            <Phone size={11} /> 01840-099853
          </a>
          <a href="mailto:info@shahedstore.com.bd" className="hidden sm:flex items-center gap-1.5 hover:text-white/80 transition-colors">
            <Mail size={11} /> info@shahedstore.com.bd
          </a>
        </div>
        <div className="flex items-center gap-1.5 font-bold text-[11px] relative z-10">
          <Sparkles size={11} className="text-yellow-300" />
          <span className="hidden sm:inline">FREE instant delivery on all orders</span>
          <span className="sm:hidden">⚡ Free delivery</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] relative z-10">
          <span className="hidden md:flex items-center gap-1"><Star size={10} fill="currentColor" /> 4.9/5 Rating</span>
          <span className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full"><Shield size={10} /> Secured</span>
        </div>
      </div>

      {/* ── Main Navbar ── */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/96 backdrop-blur-2xl shadow-[0_4px_24px_hsla(230,25%,10%,0.08)] border-b border-border/60'
          : 'bg-white/90 backdrop-blur-xl border-b border-border/40'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[76px] gap-4">

            {/* Logo */}
            <a href="/" className="flex items-center flex-shrink-0 group select-none">
              <div className="relative flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-300 group-hover:scale-[1.03]"
                style={{ background: 'hsl(220,20%,10%)', boxShadow: '0 2px 16px hsla(38,100%,55%,0.15)' }}>
                {/* Crown Icon */}
                <div className="relative flex-shrink-0">
                  <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg"
                    className="relative z-10 transition-all duration-300">
                    <defs>
                      <radialGradient id="circleBg" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="hsl(38,100%,60%)" />
                        <stop offset="100%" stopColor="hsl(30,100%,48%)" />
                      </radialGradient>
                      <filter id="crownGlow">
                        <feGaussianBlur stdDeviation="1" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                    {/* Circle background */}
                    <circle cx="19" cy="19" r="19" fill="url(#circleBg)" />
                    {/* Crown */}
                    <g filter="url(#crownGlow)">
                      <path d="M9 25H29V27H9V25Z" fill="white" />
                      <path d="M9 25L11 14L16 20L19 12L22 20L27 14L29 25H9Z" fill="white" />
                      <circle cx="11" cy="13.5" r="1.8" fill="white" />
                      <circle cx="19" cy="11" r="1.8" fill="white" />
                      <circle cx="27" cy="13.5" r="1.8" fill="white" />
                    </g>
                  </svg>
                </div>
                {/* Brand Text */}
                <div className="flex flex-col leading-none">
                  <span className="text-[19px] font-black tracking-wide uppercase"
                    style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(38,100%,60%)', letterSpacing: '0.04em' }}>
                    SHAHED STORE
                  </span>
                </div>
              </div>
            </a>

            {/* Search — Desktop */}
            <div className="hidden md:flex flex-1 max-w-[420px]">
              <SearchBar variant="navbar" className="w-full" />
            </div>

            {/* Desktop Links */}
            <div className="hidden lg:flex items-center gap-0.5">
              {NAV_LINKS.map(link => (
                <div key={link.label} className="relative group"
                  onMouseEnter={() => link.label === 'Shop' && setCatOpen(true)}
                  onMouseLeave={() => link.label === 'Shop' && setCatOpen(false)}>
                  <a href={link.href}
                    className="nav-link-new flex items-center gap-1 px-3.5 py-2 rounded-xl hover:bg-muted/60 transition-colors font-medium text-sm">
                    {link.label}
                    {link.label === 'Shop' && <ChevronDown size={12} className={`transition-transform duration-200 ${catOpen ? 'rotate-180' : ''}`} />}
                  </a>
                  {link.label === 'Shop' && (
                    <div
                      className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-68 bg-white/98 backdrop-blur-xl rounded-2xl border border-border/60 shadow-[0_20px_60px_hsla(230,25%,10%,0.14)] transition-all duration-200 origin-top ${catOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
                      style={{ width: '260px' }}
                      onMouseEnter={() => setCatOpen(true)}
                      onMouseLeave={() => setCatOpen(false)}
                    >
                      <div className="p-2">
                        <div className="px-3 py-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'Fira Code, monospace' }}>Categories</span>
                        </div>
                        {CATEGORY_DROPDOWN.map(cat => (
                          <a key={cat.label} href={`/category/${cat.label.toLowerCase()}`}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors group/item">
                            <span className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: cat.color }}>{cat.icon}</span>
                            <span className="text-sm font-semibold text-foreground flex-1 group-hover/item:text-brand-indigo transition-colors">{cat.label}</span>
                            <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{cat.count}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              {user ? (
                <div className="hidden sm:flex items-center gap-1">
                  <button onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all">
                    <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      ) : initials}
                    </div>
                    <span className="hidden lg:inline max-w-[80px] truncate">{displayName}</span>
                  </button>
                  <button onClick={() => supabase.auth.signOut()}
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-red-50 transition-all">
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setAuthOpen(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all border border-border/60">
                  <User size={16} />
                  <span className="hidden lg:inline">Login</span>
                </button>
              )}

              <button onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))', boxShadow: '0 4px 16px hsla(243,75%,59%,0.35)' }}>
                <ShoppingCart size={16} />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white"
                    style={{ background: 'hsl(15,100%,60%)' }}>{cartCount}</span>
                )}
              </button>

              <button className="lg:hidden p-2.5 rounded-xl hover:bg-muted/60 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? 'max-h-screen' : 'max-h-0'}`}>
          <div className="border-t border-border/60 bg-white/98 backdrop-blur-xl px-4 py-4 space-y-1">
            <div className="mb-3">
              <SearchBar variant="navbar" className="w-full" onClose={() => setMobileOpen(false)} />
            </div>
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-foreground hover:bg-muted/60 transition-colors">
                {link.label}
              </a>
            ))}
            <div className="pt-2 border-t border-border/60">
              {user ? (
                <div className="flex gap-2">
                  <button onClick={() => { navigate('/dashboard'); setMobileOpen(false); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                    <LayoutDashboard size={15} /> Dashboard
                  </button>
                  <button onClick={() => supabase.auth.signOut()}
                    className="px-4 py-3 rounded-2xl text-sm font-semibold text-muted-foreground hover:bg-muted/60 border border-border/60 transition-all">
                    Logout
                  </button>
                </div>
              ) : (
                <button onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))', boxShadow: '0 4px 16px hsla(243,75%,59%,0.3)' }}>
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
