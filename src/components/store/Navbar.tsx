import { useState, useEffect } from 'react';
import { Menu, X, ShoppingCart, User, LogOut, LayoutDashboard, ChevronDown, Clock, Phone } from 'lucide-react';
import AuthModal from './AuthModal';
import BrandLogo from './BrandLogo';
import SearchBar from './SearchBar';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const SOCIAL_LINKS = [
  { label: 'Facebook',  href: 'https://facebook.com/shahedstore', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
  )},
  { label: 'Instagram', href: 'https://instagram.com/shahedstore', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
  )},
  { label: 'YouTube', href: 'https://youtube.com/@shahedstore', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon fill="white" points="9.75,15.02 15.5,12 9.75,8.98 9.75,15.02"/></svg>
  )},
  { label: 'TikTok', href: 'https://tiktok.com/@shahedstore', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.77a4.85 4.85 0 0 1-1.01-.08z"/></svg>
  )},
];

const NAV_LINKS = [
  { label: 'All Products', href: '/shop' },
  { label: 'Streaming',    href: '#streaming' },
  { label: 'Software',     href: '#software' },
  { label: 'VPN & Tools',  href: '#vpn' },
  { label: 'Support',      href: '#support' },
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
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!user) { setAvatarUrl(null); return; }
    supabase.from('profiles').select('avatar_url, display_name').eq('user_id', user.id).single()
      .then(({ data }) => { if (data?.avatar_url) setAvatarUrl(data.avatar_url); });
  }, [user]);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName[0].toUpperCase();

  return (
    <>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {/* ── Top Social Bar (FanFlix style) ── */}
      <div
        className="w-full border-b text-xs"
        style={{ background: 'hsl(222, 22%, 7%)', borderColor: 'hsla(0,0%,100%,0.07)', color: 'hsla(0,0%,100%,0.5)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4">
          {/* Social Icons */}
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                className="transition-colors hover:text-white"
                style={{ color: 'hsla(0,0%,100%,0.45)' }}
                title={s.label}>
                {s.icon}
              </a>
            ))}
          </div>
          {/* Office Hours */}
          <div className="flex items-center gap-1.5 font-medium text-[11px]" style={{ color: 'hsla(0,0%,100%,0.6)' }}>
            <Clock size={11} className="text-yellow-400" />
            Office Hours: 11 AM – 11 PM
          </div>
          {/* Phone */}
          <a href="tel:01840099853" className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium hover:text-white transition-colors" style={{ color: 'hsla(0,0%,100%,0.45)' }}>
            <Phone size={11} />
            01840-099853
          </a>
        </div>
      </div>

      {/* ── Main Navbar ── */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-[0_4px_24px_hsla(220,30%,3%,0.6)]' : ''}`}
        style={{ background: 'hsl(222, 22%, 10%)', borderBottom: '1px solid hsla(0,0%,100%,0.07)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px] gap-4">

            {/* Logo */}
            <a href="/" className="flex items-center flex-shrink-0 group select-none">
              <BrandLogo size="md" />
            </a>

            {/* Nav Links — Desktop */}
            <div className="hidden lg:flex items-center gap-0.5">
              {NAV_LINKS.map(link => (
                <a key={link.label} href={link.href}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ color: 'hsla(0,0%,100%,0.65)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color='white'; (e.currentTarget as HTMLElement).style.background='hsla(0,0%,100%,0.07)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color='hsla(0,0%,100%,0.65)'; (e.currentTarget as HTMLElement).style.background='transparent'; }}>
                  {link.label}
                </a>
              ))}
            </div>

            {/* Search — Desktop */}
            <div className="hidden md:flex flex-1 max-w-[360px]">
              <SearchBar variant="navbar" className="w-full" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="hidden sm:flex items-center gap-1">
                  <button onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ color: 'hsla(0,0%,100%,0.7)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='hsla(0,0%,100%,0.08)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='transparent'; }}>
                    <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                      {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : initials}
                    </div>
                    <span className="hidden lg:inline max-w-[80px] truncate">{displayName}</span>
                  </button>
                  <button onClick={() => supabase.auth.signOut()}
                    className="p-2 rounded-lg transition-all"
                    style={{ color: 'hsla(0,0%,100%,0.4)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color='hsl(0,84%,60%)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color='hsla(0,0%,100%,0.4)'; }}>
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setAuthOpen(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border"
                  style={{ color: 'hsla(0,0%,100%,0.7)', borderColor: 'hsla(0,0%,100%,0.15)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='hsla(0,0%,100%,0.08)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='transparent'; }}>
                  <User size={15} />
                  <span className="hidden lg:inline">Login</span>
                </button>
              )}

              <button onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                <ShoppingCart size={16} />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white border-2"
                    style={{ background: 'hsl(15,100%,60%)', borderColor: 'hsl(222,22%,10%)' }}>
                    {cartCount}
                  </span>
                )}
              </button>

              <button className="lg:hidden p-2.5 rounded-lg transition-colors"
                style={{ color: 'hsla(0,0%,100%,0.7)' }}
                onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? 'max-h-screen' : 'max-h-0'}`}>
          <div className="border-t px-4 py-4 space-y-1" style={{ background: 'hsl(222,22%,9%)', borderColor: 'hsla(0,0%,100%,0.07)' }}>
            <div className="mb-3">
              <SearchBar variant="navbar" className="w-full" onClose={() => setMobileOpen(false)} />
            </div>
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                style={{ color: 'hsla(0,0%,100%,0.7)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='hsla(0,0%,100%,0.07)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='transparent'; }}>
                {link.label}
              </a>
            ))}
            <div className="pt-2 border-t" style={{ borderColor: 'hsla(0,0%,100%,0.08)' }}>
              {user ? (
                <div className="flex gap-2">
                  <button onClick={() => { navigate('/dashboard'); setMobileOpen(false); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                    <LayoutDashboard size={15} /> Dashboard
                  </button>
                  <button onClick={() => supabase.auth.signOut()}
                    className="px-4 py-3 rounded-xl text-sm font-semibold border transition-all"
                    style={{ color: 'hsla(0,0%,100%,0.6)', borderColor: 'hsla(0,0%,100%,0.15)' }}>
                    Logout
                  </button>
                </div>
              ) : (
                <button onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white"
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
