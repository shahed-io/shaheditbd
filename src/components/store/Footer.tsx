import { Phone, Mail, Globe, Facebook, Instagram, MessageCircle, Shield, ExternalLink, ArrowUpRight } from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';

const NAV_COL = [
  { title: 'Services',    links: ['Confirmation ID', 'Office Activation', 'Windows Keys', 'Top Products', 'Software Keys', 'CID Reseller'] },
  { title: 'Information', links: ['FAQs', 'About Us', 'Download Links', 'My Account', 'Contact Us', 'All Products'] },
  { title: 'Policies',    links: ['Privacy Policy', 'Terms & Conditions', 'Refund Policy', 'Order Policy', 'Delivery Info', 'Return Policy'] },
];

const Footer = () => (
  <footer style={{ borderTop: '1px solid hsl(var(--border))', backgroundColor: 'hsl(0,0%,5%)' }}>

    {/* Main footer */}
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

      {/* Brand col */}
      <div className="lg:col-span-2 space-y-5">
        <a href="/" className="flex items-center gap-2.5">
          <img src={logoIcon} alt="Shahed Store" className="w-9 h-9 rounded object-cover" />
          <div style={{ fontFamily: 'Syne, sans-serif' }}>
            <span className="font-extrabold text-lg" style={{ color: 'var(--gold)' }}>SHAHED</span>
            <span className="font-extrabold text-lg text-foreground"> STORE</span>
          </div>
        </a>

        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
          বাংলাদেশের সবচেয়ে বিশ্বস্ত ডিজিটাল সফটওয়্যার স্টোর। অরিজিনাল সফটওয়্যার, সেরা দামে, ইনস্ট্যান্ট ডেলিভারি।
        </p>

        {/* Contact */}
        <div className="space-y-2.5">
          {[
            { icon: <Phone size={13} />, href: 'tel:01840099853', label: '01840-099853' },
            { icon: <Mail size={13} />,  href: 'mailto:info@shahedstore.com.bd', label: 'info@shahedstore.com.bd' },
            { icon: <Globe size={13} />, href: 'https://www.shahedstore.com.bd', label: 'www.shahedstore.com.bd', external: true },
          ].map((c, i) => (
            <a key={i} href={c.href} target={c.external ? '_blank' : undefined} rel={c.external ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors"
              style={{ width: 'fit-content' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--gold)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = ''; }}>
              <span style={{ color: 'var(--gold)' }}>{c.icon}</span>
              {c.label}
            </a>
          ))}
        </div>

        {/* Social */}
        <div className="flex gap-2">
          {[
            { icon: <Facebook size={15} />, href: '#', label: 'Facebook' },
            { icon: <MessageCircle size={15} />, href: 'https://wa.me/8801840099853', label: 'WhatsApp' },
            { icon: <Instagram size={15} />, href: '#', label: 'Instagram' },
          ].map((s, i) => (
            <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label}
              className="w-9 h-9 rounded flex items-center justify-center text-muted-foreground transition-all"
              style={{ backgroundColor: 'var(--surface-2)', border: '1px solid hsl(var(--border))' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; (e.currentTarget as HTMLElement).style.color = 'var(--gold)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))'; (e.currentTarget as HTMLElement).style.color = ''; }}>
              {s.icon}
            </a>
          ))}
        </div>
      </div>

      {/* Nav columns */}
      {NAV_COL.map((col, ci) => (
        <div key={ci}>
          <h4 className="font-bold text-sm mb-5 flex items-center gap-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            <span className="inline-block w-1 h-4 rounded-sm" style={{ backgroundColor: 'var(--gold)' }} />
            {col.title}
          </h4>
          <ul className="space-y-2.5">
            {col.links.map(link => (
              <li key={link}>
                <a href="#" className="text-sm text-muted-foreground transition-all inline-flex items-center gap-1"
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--gold)'; (e.currentTarget as HTMLElement).style.paddingLeft = '4px'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = ''; (e.currentTarget as HTMLElement).style.paddingLeft = '0'; }}>
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>

    {/* Trust + payment bar */}
    <div style={{ borderTop: '1px solid hsl(var(--border))' }}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* DBID */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center justify-center w-9 h-9 rounded"
            style={{ backgroundColor: 'var(--gold-dim)', border: '1px solid hsla(38,90%,52%,0.3)' }}>
            <Shield size={16} style={{ color: 'var(--gold)' }} />
          </div>
          <div>
            <p className="font-bold text-xs text-foreground">Govt. Certified Business</p>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'DM Mono, monospace' }}>DBID: 586772174</p>
          </div>
        </div>

        {/* Payment methods */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Payment:</span>
          {['bKash', 'নগদ', 'Rocket'].map(pm => (
            <span key={pm} className="px-3 py-1.5 rounded text-xs font-semibold"
              style={{ backgroundColor: 'var(--surface-2)', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
              {pm}
            </span>
          ))}
        </div>
      </div>
    </div>

    {/* Copyright */}
    <div style={{ borderTop: '1px solid hsl(var(--border))', backgroundColor: 'hsl(0,0%,4%)' }}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>© 2026 <strong className="text-foreground">Shahed Store</strong> · সর্বস্বত্ব সংরক্ষিত</span>
        <a href="https://www.shahedstore.com.bd" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 transition-colors"
          style={{ fontFamily: 'DM Mono, monospace' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--gold)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = ''; }}>
          www.shahedstore.com.bd <ExternalLink size={10} />
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;
