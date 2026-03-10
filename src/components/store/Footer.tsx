import { Phone, Mail, Globe, Facebook, Instagram, MessageCircle, Shield, ExternalLink, ArrowRight, Zap } from 'lucide-react';
import BrandLogo from './BrandLogo';

const NAV_COL = [
  {
    title: 'Products',
    links: [
      { label: 'Windows Keys',     href: '#' },
      { label: 'Office 365',       href: '#' },
      { label: 'Adobe Creative',   href: '#' },
      { label: 'Streaming',        href: '#' },
      { label: 'VPN & Security',   href: '#' },
      { label: 'AI Tools',         href: '#' },
    ]
  },
  {
    title: 'Information',
    links: [
      { label: 'FAQs',             href: '#' },
      { label: 'About Us',         href: '#' },
      { label: 'My Account',       href: '#' },
      { label: 'Contact Us',       href: '#' },
      { label: 'All Products',     href: '#' },
      { label: 'Download Links',   href: '#' },
    ]
  },
  {
    title: 'Policies',
    links: [
      { label: 'Privacy Policy',   href: '#' },
      { label: 'Terms & Conditions',href: '#' },
      { label: 'Refund Policy',    href: '#' },
      { label: 'Order Policy',     href: '#' },
      { label: 'Delivery Info',    href: '#' },
      { label: 'Return Policy',    href: '#' },
    ]
  },
];

const Footer = () => (
  <footer style={{ background: 'hsl(230, 28%, 9%)' }} className="text-white relative overflow-hidden">

    {/* Decorative elements */}
    <div className="absolute top-0 right-0 w-[500px] h-[400px] pointer-events-none"
      style={{ background: 'radial-gradient(ellipse at 80% 0%, hsla(243,75%,59%,0.08), transparent 60%)' }} />
    <div className="absolute bottom-0 left-0 w-[400px] h-[300px] pointer-events-none"
      style={{ background: 'radial-gradient(ellipse at 0% 100%, hsla(15,100%,60%,0.06), transparent 60%)' }} />
    <div className="absolute inset-0 pointer-events-none"
      style={{ backgroundImage: 'radial-gradient(circle, hsla(0,0%,100%,0.025) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

    {/* CTA Strip */}
    <div className="relative z-10 border-b border-white/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div>
          <h3 className="font-sora font-black text-xl text-white">Need help choosing a product?</h3>
          <p className="text-white/50 text-sm mt-1">Our experts are available 24/7 to assist you</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <a href="https://wa.me/8801840099853" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white border border-white/20 hover:bg-white/10 transition-all">
            <MessageCircle size={15} /> WhatsApp
          </a>
          <a href="/shop"
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
            Shop Now <ArrowRight size={15} />
          </a>
        </div>
      </div>
    </div>

    {/* ── Main footer ── */}
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">

      {/* Brand */}
      <div className="lg:col-span-2 space-y-6">
        <a href="/" className="flex items-center group w-fit transition-transform group-hover:scale-[1.03]">
          <BrandLogo size="lg" />
        </a>

        <p className="text-[13px] leading-relaxed max-w-xs" style={{ color: 'hsla(230,20%,100%,0.45)' }}>
          বাংলাদেশের সবচেয়ে বিশ্বস্ত ডিজিটাল সফটওয়্যার স্টোর। অরিজিনাল সফটওয়্যার, সেরা দামে, ইনস্ট্যান্ট ডেলিভারি।
        </p>

        {/* Contact */}
        <div className="space-y-2.5">
          {[
            { icon: <Phone size={12} />, href: 'tel:01840099853', label: '01840-099853' },
            { icon: <Mail size={12} />,  href: 'mailto:info@shahedstore.com.bd', label: 'info@shahedstore.com.bd' },
            { icon: <Globe size={12} />, href: 'https://www.shahedstore.com.bd', label: 'www.shahedstore.com.bd', ext: true },
          ].map((c, i) => (
            <a key={i} href={c.href} target={c.ext ? '_blank' : undefined} rel={c.ext ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-2.5 text-sm hover:text-white transition-colors w-fit group"
              style={{ color: 'hsla(230,20%,100%,0.45)' }}>
              <span className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-105"
                style={{ background: 'hsla(0,0%,100%,0.07)', border: '1px solid hsla(0,0%,100%,0.1)' }}>
                {c.icon}
              </span>
              <span className="font-fira text-[12px]">{c.label}</span>
            </a>
          ))}
        </div>

        {/* Social */}
        <div className="flex gap-2">
          {[
            { icon: <Facebook size={16} />,      href: '#', label: 'Facebook' },
            { icon: <MessageCircle size={16} />, href: 'https://wa.me/8801840099853', label: 'WhatsApp' },
            { icon: <Instagram size={16} />,     href: '#', label: 'Instagram' },
          ].map((s, i) => (
            <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
              style={{ background: 'hsla(0,0%,100%,0.07)', border: '1px solid hsla(0,0%,100%,0.1)', color: 'hsla(230,20%,100%,0.5)' }}
              title={s.label}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'white'; (e.currentTarget as HTMLElement).style.background = 'hsla(0,0%,100%,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'hsla(230,20%,100%,0.5)'; (e.currentTarget as HTMLElement).style.background = 'hsla(0,0%,100%,0.07)'; }}>
              {s.icon}
            </a>
          ))}
        </div>
      </div>

      {/* Nav columns */}
      {NAV_COL.map((col, ci) => (
        <div key={ci}>
          <h4 className="font-sora font-bold text-[11px] uppercase tracking-[0.18em] mb-5 flex items-center gap-2"
            style={{ color: 'hsla(230,20%,100%,0.7)' }}>
            <span className="w-5 h-[2px] rounded-full"
              style={{ background: 'linear-gradient(90deg, hsl(243,75%,59%), hsl(263,70%,58%))' }} />
            {col.title}
          </h4>
          <ul className="space-y-2.5">
            {col.links.map(link => (
              <li key={link.label}>
                <a href={link.href}
                  className="text-[13px] transition-colors hover:text-white flex items-center gap-1.5 group"
                  style={{ color: 'hsla(230,20%,100%,0.4)' }}>
                  <span className="w-0 group-hover:w-3 overflow-hidden transition-all duration-200">
                    <ArrowRight size={11} />
                  </span>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>

    {/* ── Trust bar ── */}
    <div className="relative z-10 border-t" style={{ borderColor: 'hsla(0,0%,100%,0.07)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-white font-sora tracking-wide">GOVT. CERTIFIED BUSINESS</p>
            <p className="text-[10px] font-fira" style={{ color: 'hsla(0,0%,100%,0.35)' }}>DBID: 586772174</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-fira mr-1" style={{ color: 'hsla(0,0%,100%,0.3)' }}>PAYMENTS:</span>
          {[
            { name: 'bKash', num: '01820060046' },
            { name: 'Nagad', num: '01840099853' },
            { name: 'Rocket', num: '01840099853' },
            { name: 'উপায়', num: '01840099853' },
            { name: 'bKash Merchant', num: '01840099853' },
          ].map(pm => (
            <span key={pm.name}
              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold font-fira"
              style={{ background: 'hsla(0,0%,100%,0.07)', color: 'hsla(0,0%,100%,0.6)', border: '1px solid hsla(0,0%,100%,0.1)' }}
              title={pm.num}>
              {pm.name}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[11px] font-fira" style={{ color: 'hsla(0,0%,100%,0.3)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          All systems operational
        </div>
      </div>
    </div>

    {/* ── Copyright ── */}
    <div className="relative z-10 border-t" style={{ background: 'hsla(0,0%,0%,0.25)', borderColor: 'hsla(0,0%,100%,0.06)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-[11px] font-fira" style={{ color: 'hsla(0,0%,100%,0.3)' }}>
          © 2026 <strong style={{ color: 'hsla(0,0%,100%,0.55)' }}>Shahed Store</strong> · All rights reserved.
        </p>
        <a href="https://www.shahedstore.com.bd" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] font-fira transition-colors hover:text-white"
          style={{ color: 'hsla(0,0%,100%,0.3)' }}>
          www.shahedstore.com.bd <ExternalLink size={10} />
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;
