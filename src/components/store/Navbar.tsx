import { useState, useEffect } from 'react';
import { Menu, X, ShoppingCart, User, LogOut, LayoutDashboard, ChevronDown, Star, Shield, Phone, Mail, Sparkles, Sun, Moon } from 'lucide-react';
import AuthModal from './AuthModal';
import BrandLogo from './BrandLogo';
import SearchBar from './SearchBar';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from 'next-themes';

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
  const [announcement, setAnnouncement] = useState<string | null>(null);
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

  // Dynamic announcement from site_settings
  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'announcement_text').eq('category', 'marketing').maybeSingle()
      .then(({ data }) => {
        if (data?.value) setAnnouncement(data.value);
      });
  }, []);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName[0].toUpperCase();

  return (
    <>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {/* ── Top Announcement Bar ── */}
      <div className="w-full text-white text-xs font-medium py-2 flex items-center overflow-hidden relative"
        style={{ background: 'linear-gradient(90deg, hsl(243,75%,52%), hsl(263,70%,52%), hsl(283,65%,50%))' }}>
        <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />

        {/* Left: Contact info — fixed, no shrink */}
        <div className="flex items-center gap-4 pl-4 flex-shrink-0 relative z-10">
          <a href="tel:01840099853" className="flex items-center gap-1.5 hover:text-white/80 transition-colors">
            <Phone size={11} /> 01840-099853
          </a>
          <a href="mailto:info@shahedstore.com.bd" className="hidden sm:flex items-center gap-1.5 hover:text-white/80 transition-colors">
            <Mail size={11} /> info@shahedstore.com.bd
          </a>
        </div>

        {/* Center: Marquee announcement */}
        <div className="flex-1 overflow-hidden mx-3 relative z-10">
          <div className="flex items-center gap-1.5 font-bold text-[11px]"
            style={{ animation: 'marquee 28s linear infinite', whiteSpace: 'nowrap', display: 'inline-flex' }}>
            <Sparkles size={11} className="text-yellow-300 flex-shrink-0" />
            <span>
              {announcement
                ? announcement
                : 'FREE instant delivery on all orders  •  সব অর্ডারে ফ্রি ইনস্ট্যান্ট ডেলিভারি  •  ৫০% পর্যন্ত ছাড়'}
            </span>
            {/* Duplicate for seamless loop */}
            <span className="ml-16">
              <Sparkles size={11} className="text-yellow-300 inline mr-1.5" />
              {announcement
                ? announcement
                : 'FREE instant delivery on all orders  •  সব অর্ডারে ফ্রি ইনস্ট্যান্ট ডেলিভারি  •  ৫০% পর্যন্ত ছাড়'}
            </span>
          </div>
        </div>

        {/* Right: Badges — fixed, no shrink */}
        <div className="flex items-center gap-3 text-[11px] pr-4 flex-shrink-0 relative z-10">
          <span className="hidden md:flex items-center gap-1"><Star size={10} fill="currentColor" /> 4.9/5 Rating</span>
          <span className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full"><Shield size={10} /> Secured</span>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* ── Main Navbar ── */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'backdrop-blur-2xl shadow-[0_8px_32px_hsla(220,30%,3%,0.8)]'
          : ''
      }`} style={{
        background: 'hsl(222,25%,6%)',
        borderBottom: '1.5px solid transparent',
        borderImage: 'linear-gradient(90deg, hsla(340,100%,50%,0.0) 0%, hsla(340,100%,50%,0.7) 15%, hsla(15,100%,52%,0.9) 30%, hsla(35,100%,55%,0.6) 50%, hsla(210,100%,52%,0.9) 70%, hsla(200,100%,60%,0.7) 85%, hsla(200,100%,60%,0.0) 100%) 1',
        boxShadow: '0 2px 30px hsla(15,100%,55%,0.15), 0 4px 60px hsla(210,100%,55%,0.1)',
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[76px] gap-4">

            {/* Logo */}
            <a href="/" className="flex items-center flex-shrink-0 group select-none transition-transform duration-300 group-hover:scale-[1.04]">
              <BrandLogo size="md" />
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
                    className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-white/75 hover:text-white hover:bg-white/10 transition-all font-medium text-sm">
                    {link.label}
                    {link.label === 'Shop' && <ChevronDown size={12} className={`transition-transform duration-200 ${catOpen ? 'rotate-180' : ''}`} />}
                  </a>
                  {link.label === 'Shop' && (
                    <div
                      className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_20px_60px_hsla(220,30%,5%,0.5)] transition-all duration-200 origin-top ${catOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
                      style={{ width: '260px', background: 'hsl(222,22%,13%)' }}
                      onMouseEnter={() => setCatOpen(true)}
                      onMouseLeave={() => setCatOpen(false)}
                    >
                      <div className="p-2">
                        <div className="px-3 py-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40" style={{ fontFamily: 'Fira Code, monospace' }}>Categories</span>
                        </div>
                        {CATEGORY_DROPDOWN.map(cat => (
                          <a key={cat.label} href={`/category/${cat.label.toLowerCase()}`}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/8 transition-colors group/item">
                            <span className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: cat.color }}>{cat.icon}</span>
                            <span className="text-sm font-semibold text-white/80 flex-1 group-hover/item:text-white transition-colors">{cat.label}</span>
                            <span className="text-[11px] font-bold text-white/40 bg-white/10 px-2 py-0.5 rounded-full">{cat.count}</span>
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
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all">
                    <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      ) : initials}
                    </div>
                    <span className="hidden lg:inline max-w-[80px] truncate">{displayName}</span>
                  </button>
                  <button onClick={() => supabase.auth.signOut()}
                    className="p-2 rounded-xl text-white/50 hover:text-red-400 hover:bg-white/10 transition-all">
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setAuthOpen(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all border border-white/15">
                  <User size={16} />
                  <span className="hidden lg:inline">Login</span>
                </button>
              )}

              <button onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))', boxShadow: '0 4px 16px hsla(243,75%,59%,0.4)' }}>
                <ShoppingCart size={16} />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white"
                    style={{ background: 'hsl(15,100%,60%)' }}>{cartCount}</span>
                )}
              </button>

              <button className="lg:hidden p-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? 'max-h-screen' : 'max-h-0'}`}>
          <div className="border-t border-white/10 px-4 py-4 space-y-1" style={{ background: 'hsl(222,22%,12%)' }}>
            <div className="mb-3">
              <SearchBar variant="navbar" className="w-full" onClose={() => setMobileOpen(false)} />
            </div>
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-white/75 hover:text-white hover:bg-white/10 transition-colors">
                {link.label}
              </a>
            ))}
            <div className="pt-2 border-t border-white/10">
              {user ? (
                <div className="flex gap-2">
                  <button onClick={() => { navigate('/dashboard'); setMobileOpen(false); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                    <LayoutDashboard size={15} /> Dashboard
                  </button>
                  <button onClick={() => supabase.auth.signOut()}
                    className="px-4 py-3 rounded-2xl text-sm font-semibold text-white/60 hover:bg-white/10 border border-white/15 transition-all">
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
