import { Phone, Mail, Globe, Facebook, Instagram, MessageCircle, Shield, ExternalLink, ArrowUpRight, Download, Zap, Package, Info, FileText, Send } from 'lucide-react';
import BrandLogo from './BrandLogo';
import dbidLogo from '@/assets/dbid-logo.png';

const NAV_COL = [
  {
    title: 'Products',
    icon: <Package size={14} />,
    accent: 'hsl(258,78%,55%)',
    links: [
      { label: 'Windows Keys',   href: '#' },
      { label: 'Office 365',     href: '#' },
      { label: 'Adobe Creative', href: '#' },
      { label: 'CID For Reseller', href: 'https://shahedstore.com.bd/getcid/login.php', external: true },
      { label: 'VPN & Security', href: '#' },
      { label: 'Free Tools',      href: '/free-tools' },
    ]
  },
  {
    title: 'Information',
    icon: <Info size={14} />,
    accent: 'hsl(200,90%,45%)',
    links: [
      { label: 'FAQs',           href: '/faqs' },
      { label: 'About Us',       href: '/about' },
      { label: 'My Account',     href: '/dashboard' },
      { label: 'Contact Us',     href: '/contact' },
      { label: 'All Products',   href: '/shop' },
      { label: 'Software Download Link', href: '/help' },
    ]
  },
  {
    title: 'Policies',
    icon: <FileText size={14} />,
    accent: 'hsl(162,72%,38%)',
    links: [
      { label: 'Privacy Policy',         href: '/privacy-policy' },
      { label: 'Terms & Conditions',     href: '/terms-conditions' },
      { label: 'Refund & Return Policy', href: '/refund-policy' },
      { label: 'Order & Cancellation',   href: '/order-policy' },
      { label: 'Delivery Info',          href: '/delivery-info' },
      { label: 'Blog',                      href: '/blog' },
    ]
  },
];

const Footer = () => (
  <footer className="relative overflow-hidden" style={{ background: 'hsl(var(--background))' }}>

    {/* Decorative background */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[500px]"
        style={{ background: 'radial-gradient(ellipse at 80% 0%, hsla(258,78%,55%,0.07), transparent 65%)' }} />
      <div className="absolute bottom-0 left-0 w-[500px] h-[400px]"
        style={{ background: 'radial-gradient(ellipse at 0% 100%, hsla(200,90%,45%,0.06), transparent 65%)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px]"
        style={{ background: 'radial-gradient(ellipse, hsla(162,72%,38%,0.03), transparent 70%)' }} />
      <div className="absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, hsla(258,78%,55%,0.035) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
    </div>

    {/* CTA Strip */}
    <div className="relative z-10 border-b" style={{ borderColor: 'hsla(258,78%,75%,0.15)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7"
        style={{
          background: 'hsla(0,0%,100%,0.50)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        }}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))', boxShadow: '0 4px 16px hsla(258,78%,55%,0.30)' }}>
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-sora font-black text-xl" style={{ color: 'hsl(226,35%,12%)' }}>Need help choosing a product?</h3>
              <p className="text-sm mt-0.5" style={{ color: 'hsl(226,35%,45%)' }}>Our experts are available 24/7 to assist you</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <a href="https://wa.me/8801840099853" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all hover:scale-105"
              style={{
                color: 'hsl(226,35%,28%)',
                background: 'hsla(0,0%,100%,0.75)',
                backdropFilter: 'blur(12px)',
                border: '1.5px solid hsla(258,78%,75%,0.25)',
                boxShadow: '0 2px 12px hsla(226,35%,12%,0.06)',
              }}>
              <MessageCircle size={15} /> WhatsApp
            </a>
            <a href="/shop"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))', boxShadow: '0 4px 16px hsla(258,78%,55%,0.30)' }}>
              Shop Now <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </div>
    </div>

    {/* ── Main footer ── */}
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">

      {/* Brand section — always centered */}
      <div className="flex flex-col items-center text-center mb-10 space-y-5"
        style={{
          background: 'linear-gradient(135deg, hsla(0,0%,100%,0.72) 0%, hsla(0,0%,100%,0.50) 100%)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid hsla(258,78%,75%,0.20)',
          borderRadius: '20px',
          boxShadow: '0 4px 24px hsla(258,78%,55%,0.07), 0 1px 0 rgba(255,255,255,0.9) inset',
          padding: '24px 20px',
        }}>
        <a href="/" className="flex items-center justify-center">
          <BrandLogo size="lg" />
        </a>
        <p className="text-[13px] leading-relaxed md:whitespace-nowrap" style={{ color: 'hsl(226,35%,42%)' }}>
          বাংলাদেশের সবচেয়ে বিশ্বস্ত ডিজিটাল সফটওয়্যার স্টোর। অরিজিনাল সফটওয়্যার, সেরা দামে, ইনস্ট্যান্ট ডেলিভারি।
        </p>

        {/* Contact pills — centered */}
        <div className="flex flex-col items-center gap-2 w-full">
          {[
            { icon: <Phone size={13} />, href: 'tel:01840099853',                   label: '01840-099853',            color: 'hsl(258,78%,55%)' },
            { icon: <Mail size={13} />,  href: 'mailto:info@shahedstore.com.bd',     label: 'info@shahedstore.com.bd', color: 'hsl(200,90%,45%)' },
            { icon: <Globe size={13} />, href: 'https://www.shahedstore.com.bd',     label: 'www.shahedstore.com.bd',  color: 'hsl(162,72%,38%)', ext: true },
          ].map((c, i) => (
            <a key={i} href={c.href} target={c.ext ? '_blank' : undefined} rel={c.ext ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-3 text-sm transition-all group hover:translate-x-1"
              style={{ color: 'hsl(226,35%,42%)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = c.color; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'hsl(226,35%,42%)'; }}>
              <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${c.color.replace('hsl(','hsla(').replace(')',',0.10)')}`,
                  border: `1.5px solid ${c.color.replace('hsl(','hsla(').replace(')',',0.22)')}`,
                  color: c.color,
                }}>
                {c.icon}
              </span>
              <span className="font-fira text-[12px]">{c.label}</span>
            </a>
          ))}
        </div>

        {/* Social icons — centered */}
        <div className="flex gap-3 justify-center">
          {[
            { icon: <Facebook size={17} />,      href: 'https://www.facebook.com/Shahed.Store365',       label: 'Facebook',  color: 'hsl(258,78%,55%)' },
            { icon: <MessageCircle size={17} />, href: 'https://wa.me/shahedstore',                        label: 'WhatsApp',  color: 'hsl(162,72%,38%)' },
            { icon: <Instagram size={17} />,     href: 'https://www.instagram.com/shahedstore.com.bd/',    label: 'Instagram', color: 'hsl(330,85%,55%)' },
            { icon: <Send size={17} />,          href: 'https://t.me/Shahed_Store',                        label: 'Telegram',  color: 'hsl(200,80%,50%)' },
          ].map((s, i) => (
            <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-110 hover:-translate-y-0.5"
              style={{
                background: 'hsla(0,0%,100%,0.65)',
                backdropFilter: 'blur(12px)',
                border: '1.5px solid hsla(258,78%,75%,0.22)',
                color: 'hsl(226,35%,42%)',
                boxShadow: '0 2px 8px hsla(226,35%,12%,0.06)',
              }}
              title={s.label}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = s.color;
                el.style.borderColor = s.color.replace('hsl(','hsla(').replace(')',',0.45)');
                el.style.boxShadow = `0 4px 16px ${s.color.replace('hsl(','hsla(').replace(')',',0.20)')}`;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = 'hsl(226,35%,42%)';
                el.style.borderColor = 'hsla(258,78%,75%,0.22)';
                el.style.boxShadow = '0 2px 8px hsla(226,35%,12%,0.06)';
              }}>
              {s.icon}
            </a>
          ))}
        </div>
      </div>

      {/* Nav columns — 1 col on mobile (glassmorphism cards), 3 cols on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {NAV_COL.map((col, ci) => (
          <div key={ci} className="rounded-2xl p-5 space-y-4"
            style={{
              background: 'linear-gradient(135deg, hsla(0,0%,100%,0.72) 0%, hsla(0,0%,100%,0.50) 100%)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: `1px solid ${col.accent.replace('hsl(','hsla(').replace(')',',0.18)')}`,
              boxShadow: `0 4px 20px ${col.accent.replace('hsl(','hsla(').replace(')',',0.07)')}, 0 1px 0 rgba(255,255,255,0.9) inset`,
            }}>
            {/* Column header */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: col.accent.replace('hsl(','hsla(').replace(')',',0.12)'),
                  border: `1.5px solid ${col.accent.replace('hsl(','hsla(').replace(')',',0.25)')}`,
                  color: col.accent,
                }}>
                {col.icon}
              </div>
              <h4 className="font-sora font-bold text-[11px] uppercase tracking-[0.18em]"
                style={{ color: 'hsl(226,35%,20%)' }}>
                {col.title}
              </h4>
            </div>

            {/* Divider */}
            <div className="h-px rounded-full"
              style={{ background: `linear-gradient(90deg, ${col.accent.replace('hsl(','hsla(').replace(')',',0.40)')}, transparent)` }} />

            {/* Links — 2-column grid on mobile for compact look */}
            <ul className="grid grid-cols-2 md:grid-cols-1 gap-x-2 gap-y-0.5">
              {col.links.map((link: any) => (
                <li key={link.label}>
                  <a href={link.href} target={(link as any).external ? '_blank' : undefined}
                    rel={(link as any).external ? 'noopener noreferrer' : undefined}
                    className="group flex items-center gap-2 px-2.5 py-2 rounded-xl text-[12.5px] transition-all"
                    style={{
                      color: link.highlight ? col.accent : 'hsl(226,35%,45%)',
                      background: link.highlight ? col.accent.replace('hsl(','hsla(').replace(')',',0.06)') : 'transparent',
                      border: link.highlight ? `1px solid ${col.accent.replace('hsl(','hsla(').replace(')',',0.18)')}` : '1px solid transparent',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.color = col.accent;
                      el.style.background = col.accent.replace('hsl(','hsla(').replace(')',',0.08)');
                      el.style.borderColor = col.accent.replace('hsl(','hsla(').replace(')',',0.22)');
                      el.style.transform = 'translateX(2px)';
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.color = link.highlight ? col.accent : 'hsl(226,35%,45%)';
                      el.style.background = link.highlight ? col.accent.replace('hsl(','hsla(').replace(')',',0.06)') : 'transparent';
                      el.style.borderColor = link.highlight ? col.accent.replace('hsl(','hsla(').replace(')',',0.18)') : 'transparent';
                      el.style.transform = 'translateX(0)';
                    }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all group-hover:scale-125"
                      style={{ background: col.accent.replace('hsl(','hsla(').replace(')',',0.45)') }} />
                    <span className="truncate">{link.label}</span>
                    
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>

    {/* ── Trust bar ── */}
    <div className="relative z-10 mx-4 sm:mx-6 lg:mx-8 mb-6 rounded-2xl overflow-hidden"
      style={{
        background: 'hsla(0,0%,100%,0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid hsla(258,78%,75%,0.18)',
        boxShadow: '0 4px 24px hsla(258,78%,55%,0.06)',
      }}>
      <div className="max-w-7xl mx-auto px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Cert badge */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ background: 'hsl(0,0%,100%)', boxShadow: '0 4px 12px hsla(258,78%,55%,0.18)', border: '1px solid hsla(258,78%,65%,0.20)' }}>
            <img src={dbidLogo} alt="DBID Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <p className="text-[11px] font-black font-sora tracking-widest" style={{ color: 'hsl(226,35%,15%)' }}>GOVT. CERTIFIED BUSINESS</p>
            <p className="text-[10px] font-fira mt-0.5" style={{ color: 'hsl(226,35%,48%)' }}>DBID: 586772174</p>
          </div>
        </div>

        {/* Payments */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="text-[10px] font-fira font-bold tracking-widest mr-1" style={{ color: 'hsl(226,35%,50%)' }}>PAYMENTS:</span>
          {[
            { name: 'bKash', num: '01820060046' },
            { name: 'Nagad', num: '01840099853' },
            { name: 'Rocket', num: '01840099853' },
            { name: 'Upay', num: '01840099853' },
            { name: 'bKash Merchant', num: '01840099853' },
          ].map(pm => (
            <span key={pm.name}
              className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold font-fira cursor-default transition-all hover:scale-105"
              style={{
                background: 'hsla(0,0%,100%,0.70)',
                backdropFilter: 'blur(10px)',
                color: 'hsl(258,78%,45%)',
                border: '1px solid hsla(258,78%,75%,0.22)',
                boxShadow: '0 1px 4px hsla(226,35%,12%,0.05)',
              }}
              title={pm.num}>
              {pm.name}
            </span>
          ))}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: 'hsla(162,72%,38%,0.08)', border: '1px solid hsla(162,72%,38%,0.20)' }}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-fira font-medium" style={{ color: 'hsl(162,72%,30%)' }}>All systems operational</span>
        </div>
      </div>
    </div>

    {/* ── Copyright ── */}
    <div className="relative z-10 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, hsl(258,78%,55%) 0%, hsl(230,70%,48%) 40%, hsl(200,90%,42%) 100%)',
      }}>
      {/* Shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, hsla(0,0%,100%,0.40), transparent)' }} />
      {/* Subtle dot pattern */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, hsla(0,0%,100%,0.07) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white opacity-60 animate-pulse" />
          <p className="text-[11.5px] font-fira text-white/80">
            © 2026 <strong className="text-white font-bold">Shahed Store</strong>
            <span className="mx-1.5 opacity-50">·</span>
            <span className="opacity-70">All rights reserved.</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{ background: 'hsla(0,0%,100%,0.15)', border: '1px solid hsla(0,0%,100%,0.20)', backdropFilter: 'blur(8px)' }}>
            <Shield size={10} className="text-white/70" />
            <span className="text-[10px] font-fira text-white/70 tracking-wide">100% Secure</span>
          </div>

          <a href="https://www.shahedstore.com.bd" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-fira font-semibold text-white transition-all hover:scale-105"
            style={{ background: 'hsla(0,0%,100%,0.18)', border: '1px solid hsla(0,0%,100%,0.28)', backdropFilter: 'blur(8px)' }}>
            <Globe size={10} />
            www.shahedstore.com.bd
            <ExternalLink size={9} className="opacity-60" />
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
