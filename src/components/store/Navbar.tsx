import { useState, useEffect } from 'react';
import { Menu, X, ShoppingCart, User, LogOut, LayoutDashboard, ChevronDown, Star, Shield, Phone, Mail, Sparkles, GraduationCap } from 'lucide-react';
import AuthModal from './AuthModal';
import BrandLogo from './BrandLogo';
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
  { label: 'Admission', href: '#admission' },
  { label: 'Support',   href: '#support' },
];

const CATEGORY_DROPDOWN = [
  { icon: '🪟', label: 'Windows',          count: 12, color: 'hsla(185,90%,52%,0.12)' },
  { icon: '📦', label: 'Microsoft Office', count: 8,  color: 'hsla(40,100%,58%,0.12)' },
  { icon: '🎨', label: 'Adobe',            count: 6,  color: 'hsla(271,91%,65%,0.12)' },
  { icon: '🛡️', label: 'Antivirus',       count: 10, color: 'hsla(158,80%,48%,0.12)' },
  { icon: '🎬', label: 'Streaming',        count: 9,  color: 'hsla(320,90%,62%,0.12)' },
  { icon: '🎓', label: 'School Admission', count: 5,  color: 'hsla(40,100%,58%,0.12)' },
  { icon: '🔒', label: 'VPN',              count: 5,  color: 'hsla(185,90%,52%,0.12)' },
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
      .then(({ data }) => { if (data?.avatar_url) setAvatarUrl(data.avatar_url); });
  }, [user]);

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'announcement_text').eq('category', 'marketing').maybeSingle()
      .then(({ data }) => { if (data?.value) setAnnouncement(data.value); });
  }, []);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const initials    = displayName[0].toUpperCase();

  return (
    <>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {/* ── Top Announcement Bar ── */}
      <div className="w-full text-white text-xs font-medium py-2 flex items-center overflow-hidden relative"
        style={{ background: 'linear-gradient(90deg, hsl(271,91%,52%), hsl(185,90%,42%), hsl(271,91%,52%))' }}>
        <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />

        <div className="flex items-center gap-4 pl-4 flex-shrink-0 relative z-10">
          <a href="tel:01840099853" className="flex items-center gap-1.5 hover:text-white/80 transition-colors">
            <Phone size={11} /> 01840-099853
          </a>
          <a href="mailto:info@shahedstore.com.bd" className="hidden sm:flex items-center gap-1.5 hover:text-white/80 transition-colors">
            <Mail size={11} /> info@shahedstore.com.bd
          </a>
        </div>

        <div className="flex-1 overflow-hidden mx-3 relative z-10">
          <div className="flex items-center gap-1.5 font-bold text-[11px]"
            style={{ animation: 'marquee 28s linear infinite', whiteSpace: 'nowrap', display: 'inline-flex' }}>
            <Sparkles size={11} className="text-yellow-300 flex-shrink-0" />
            <span>
              {announcement || 'FREE instant delivery • সব অর্ডারে ফ্রি ডেলিভারি • স্কুল অ্যাডমিশন ফর্ম এখন পাওয়া যাচ্ছে • ৫০% ছাড়'}
            </span>
            <span className="ml-16">
              <Sparkles size={11} className="text-yellow-300 inline mr-1.5" />
              {announcement || 'FREE instant delivery • সব অর্ডারে ফ্রি ডেলিভারি • স্কুল অ্যাডমিশন ফর্ম এখন পাওয়া যাচ্ছে • ৫০% ছাড়'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] pr-4 flex-shrink-0 relative z-10">
          <span className="hidden md:flex items-center gap-1"><Star size={10} fill="currentColor" /> 4.9/5</span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'hsla(0,0%,100%,0.15)' }}>
            <Shield size={10} /> Secured
          </span>
        </div>
      </div>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>

      {/* ── Main Navbar ── */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'backdrop-blur-2xl' : ''}`}
        style={{
          background: scrolled
            ? 'hsla(215,28%,7%,0.95)'
            : 'hsl(215,28%,7%)',
          borderBottom: '1px solid transparent',
          borderImage: 'linear-gradient(90deg, transparent 0%, hsla(271,91%,65%,0.6) 25%, hsla(185,90%,52%,0.6) 75%, transparent 100%) 1',
          boxShadow: scrolled
            ? '0 4px 32px hsla(215,40%,4%,0.7), 0 0 40px hsla(271,91%,65%,0.08)'
            : '0 2px 20px hsla(215,40%,4%,0.5)',
        }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[76px] gap-4">

            {/* Logo */}
            <a href="/" className="flex items-center flex-shrink-0 group select-none">
              <BrandLogo size="md" />
            </a>

            {/* Search */}
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
                    className="flex items-center gap-1 px-3.5 py-2 rounded-xl transition-all font-medium text-sm"
                    style={{ color: link.label === 'Admission' ? 'hsl(40,100%,68%)' : 'hsla(210,30%,95%,0.65)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = link.label === 'Admission' ? 'hsl(40,100%,75%)' : 'hsl(210,30%,95%)')}
                    onMouseLeave={e => (e.currentTarget.style.color = link.label === 'Admission' ? 'hsl(40,100%,68%)' : 'hsla(210,30%,95%,0.65)')}>
                    {link.label === 'Admission' && <GraduationCap size={13} />}
                    {link.label}
                    {link.label === 'Shop' && <ChevronDown size={12} className={`transition-transform duration-200 ${catOpen ? 'rotate-180' : ''}`} />}
                  </a>
                  {link.label === 'Shop' && (
                    <div
                      className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 rounded-2xl border shadow-lg transition-all duration-200 origin-top ${catOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
                      style={{ width: '280px', background: 'hsl(215,28%,10%)', borderColor: 'hsla(271,91%,65%,0.2)', boxShadow: '0 20px 60px hsla(215,40%,4%,0.7), 0 0 30px hsla(271,91%,65%,0.1)' }}
                      onMouseEnter={() => setCatOpen(true)}
                      onMouseLeave={() => setCatOpen(false)}
                    >
                      {/* Neon top line */}
                      <div className="h-[1px] rounded-t-2xl" style={{ background: 'linear-gradient(90deg, hsl(271,91%,65%), hsl(185,90%,52%))' }} />
                      <div className="p-2">
                        <div className="px-3 py-2 mb-1">
                          <span className="text-[10px] font-fira font-bold uppercase tracking-widest" style={{ color: 'hsl(271,91%,75%)' }}>Categories</span>
                        </div>
                        {CATEGORY_DROPDOWN.map(cat => (
                          <a key={cat.label} href={`/category/${cat.label.toLowerCase()}`}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group/item"
                            style={{ color: 'hsla(210,30%,95%,0.7)' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'hsla(271,91%,65%,0.08)'; e.currentTarget.style.color = 'hsl(210,30%,95%)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'hsla(210,30%,95%,0.7)'; }}>
                            <span className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: cat.color }}>{cat.icon}</span>
                            <span className="text-sm font-semibold flex-1">{cat.label}</span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'hsla(271,91%,65%,0.1)', color: 'hsl(271,91%,75%)' }}>{cat.count}</span>
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
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{ color: 'hsla(210,30%,95%,0.7)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'hsla(271,91%,65%,0.1)'; e.currentTarget.style.color = 'hsl(210,30%,95%)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'hsla(210,30%,95%,0.7)'; }}>
                    <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, hsl(271,91%,65%), hsl(185,90%,52%))' }}>
                      {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : initials}
                    </div>
                    <span className="hidden lg:inline max-w-[80px] truncate">{displayName}</span>
                  </button>
                  <button onClick={() => supabase.auth.signOut()}
                    className="p-2 rounded-xl transition-all"
                    style={{ color: 'hsla(210,30%,95%,0.5)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'hsl(0,84%,65%)'; e.currentTarget.style.background = 'hsla(0,84%,60%,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'hsla(210,30%,95%,0.5)'; e.currentTarget.style.background = ''; }}>
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setAuthOpen(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border"
                  style={{ color: 'hsla(210,30%,95%,0.7)', borderColor: 'hsla(271,91%,65%,0.25)', background: 'hsla(271,91%,65%,0.06)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'hsla(271,91%,65%,0.5)'; e.currentTarget.style.background = 'hsla(271,91%,65%,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsla(271,91%,65%,0.25)'; e.currentTarget.style.background = 'hsla(271,91%,65%,0.06)'; }}>
                  <User size={16} />
                  <span className="hidden lg:inline">Login</span>
                </button>
              )}

              {/* Cart Button — Neon */}
              <button onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  background: 'linear-gradient(135deg, hsl(271,91%,65%), hsl(185,90%,52%))',
                  boxShadow: '0 0 20px hsla(271,91%,65%,0.45)',
                }}>
                <ShoppingCart size={16} />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border-2"
                    style={{ background: 'hsl(320,90%,62%)', borderColor: 'hsl(215,28%,7%)', boxShadow: '0 0 10px hsla(320,90%,62%,0.6)' }}>
                    {cartCount}
                  </span>
                )}
              </button>

              <button className="lg:hidden p-2.5 rounded-xl transition-colors"
                style={{ color: 'hsla(210,30%,95%,0.7)' }}
                onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? 'max-h-screen' : 'max-h-0'}`}>
          <div className="border-t px-4 py-4 space-y-1"
            style={{ background: 'hsl(215,28%,9%)', borderColor: 'hsla(271,91%,65%,0.15)' }}>
            <div className="mb-3">
              <SearchBar variant="navbar" className="w-full" onClose={() => setMobileOpen(false)} />
            </div>
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors"
                style={{ color: link.label === 'Admission' ? 'hsl(40,100%,68%)' : 'hsla(210,30%,95%,0.7)' }}>
                {link.label === 'Admission' && <GraduationCap size={14} />}
                {link.label}
              </a>
            ))}
            <div className="pt-2 border-t" style={{ borderColor: 'hsla(271,91%,65%,0.1)' }}>
              {user ? (
                <div className="flex gap-2">
                  <button onClick={() => { navigate('/dashboard'); setMobileOpen(false); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, hsl(271,91%,65%), hsl(185,90%,52%))' }}>
                    <LayoutDashboard size={15} /> Dashboard
                  </button>
                  <button onClick={() => supabase.auth.signOut()}
                    className="px-4 py-3 rounded-2xl text-sm font-semibold border transition-all"
                    style={{ color: 'hsla(210,30%,95%,0.6)', borderColor: 'hsla(271,91%,65%,0.2)' }}>
                    Logout
                  </button>
                </div>
              ) : (
                <button onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, hsl(271,91%,65%), hsl(185,90%,52%))', boxShadow: '0 0 20px hsla(271,91%,65%,0.3)' }}>
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
