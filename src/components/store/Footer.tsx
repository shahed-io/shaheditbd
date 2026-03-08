import { Phone, Mail, Globe, Facebook, Instagram, MessageCircle, Shield, ExternalLink, Terminal, Cpu } from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';

const NAV_COL = [
  { title: 'Services',    links: ['Confirmation ID', 'Office Activation', 'Windows Keys', 'Top Products', 'Software Keys', 'CID Reseller'] },
  { title: 'Information', links: ['FAQs', 'About Us', 'Download Links', 'My Account', 'Contact Us', 'All Products'] },
  { title: 'Policies',    links: ['Privacy Policy', 'Terms & Conditions', 'Refund Policy', 'Order Policy', 'Delivery Info', 'Return Policy'] },
];

const Footer = () => (
  <footer className="relative overflow-hidden"
    style={{ borderTop: '1px solid hsla(185,100%,50%,0.15)' }}>

    {/* Glow top */}
    <div className="absolute top-0 inset-x-0 h-px"
      style={{ background: 'linear-gradient(90deg, transparent, var(--cyan), var(--purple), var(--cyan), transparent)' }} />

    {/* Background */}
    <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
    <div className="absolute inset-0 pointer-events-none"
      style={{ background: 'linear-gradient(180deg, hsl(220,18%,6%) 0%, hsl(220,20%,4%) 100%)' }} />

    {/* ── Main footer ── */}
    <div className="relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

      {/* Brand */}
      <div className="lg:col-span-2 space-y-6">
        <a href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <img src={logoIcon} alt="Shahed Store" className="w-10 h-10 rounded-xl object-cover"
              style={{ border: '1px solid var(--cyan-border)' }} />
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ boxShadow: 'var(--cyan-glow)' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <span className="font-black text-lg gradient-text-cyber">SHAHED</span>
              <span className="font-black text-lg text-foreground ml-1">STORE</span>
            </div>
            <div className="text-[9px] tracking-[0.18em] uppercase mt-0.5"
              style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--muted-foreground))' }}>
              Digital Marketplace
            </div>
          </div>
        </a>

        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
          বাংলাদেশের সবচেয়ে বিশ্বস্ত ডিজিটাল সফটওয়্যার স্টোর। অরিজিনাল সফটওয়্যার, সেরা দামে, ইনস্ট্যান্ট ডেলিভারি।
        </p>

        {/* Contact */}
        <div className="space-y-3">
          {[
            { icon: <Phone size={12} />, href: 'tel:01840099853', label: '01840-099853' },
            { icon: <Mail size={12} />,  href: 'mailto:info@shahedstore.com.bd', label: 'info@shahedstore.com.bd' },
            { icon: <Globe size={12} />, href: 'https://www.shahedstore.com.bd', label: 'www.shahedstore.com.bd', ext: true },
          ].map((c, i) => (
            <a key={i} href={c.href} target={c.ext ? '_blank' : undefined} rel={c.ext ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-2.5 text-sm text-muted-foreground transition-colors group w-fit"
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--cyan)')}
              onMouseLeave={e => (e.currentTarget.style.color = '')}>
              <span className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-all group-hover:border-[var(--cyan)]"
                style={{ background: 'var(--surface-2)', border: '1px solid hsl(var(--border))', color: 'var(--cyan)' }}>
                {c.icon}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>{c.label}</span>
            </a>
          ))}
        </div>

        {/* Social */}
        <div className="flex gap-2">
          {[
            { icon: <Facebook size={14} />,      href: '#',                         label: 'Facebook', color: 'hsl(220,80%,60%)' },
            { icon: <MessageCircle size={14} />, href: 'https://wa.me/8801840099853', label: 'WhatsApp', color: 'hsl(120,60%,50%)' },
            { icon: <Instagram size={14} />,     href: '#',                         label: 'Instagram', color: 'var(--magenta)' },
          ].map((s, i) => (
            <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground transition-all"
              style={{ background: 'var(--surface-2)', border: '1px solid hsl(var(--border))' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = s.color;
                (e.currentTarget as HTMLElement).style.color = s.color;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 10px ${s.color}40`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))';
                (e.currentTarget as HTMLElement).style.color = '';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}>
              {s.icon}
            </a>
          ))}
        </div>
      </div>

      {/* Nav columns */}
      {NAV_COL.map((col, ci) => (
        <div key={ci}>
          <h4 className="font-bold mb-5 flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'hsl(var(--foreground))' }}>
            <span className="w-1 h-4 rounded-full" style={{ background: 'linear-gradient(180deg, var(--cyan), var(--purple))' }} />
            {col.title.toUpperCase()}
          </h4>
          <ul className="space-y-2.5">
            {col.links.map(link => (
              <li key={link}>
                <a href="#"
                  className="text-sm text-muted-foreground transition-all inline-flex items-center gap-1.5 group"
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--cyan)')}
                  onMouseLeave={e => (e.currentTarget.style.color = '')}>
                  <span className="text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace' }}>›</span>
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>

    {/* ── Trust bar ── */}
    <div className="relative z-10" style={{ borderTop: '1px solid hsl(var(--border))' }}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">

        {/* DBID */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: 'hsla(185,100%,50%,0.1)', border: '1px solid var(--cyan-border)' }}>
            <Shield size={16} style={{ color: 'var(--cyan)' }} />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground" style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.6rem' }}>
              GOVT. CERTIFIED BUSINESS
            </p>
            <p className="text-xs mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--cyan)', fontSize: '10px' }}>
              DBID: 586772174
            </p>
          </div>
        </div>

        {/* Payment methods */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground mr-1"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}>PAYMENT_METHODS:</span>
          {['bKash', 'Nagad', 'Rocket'].map(pm => (
            <span key={pm} className="px-3 py-1.5 rounded-lg text-[10px] font-bold"
              style={{
                background: 'hsl(220,15%,10%)',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--muted-foreground))',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
              {pm}
            </span>
          ))}
        </div>

        {/* System status */}
        <div className="flex items-center gap-2 text-[10px]"
          style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--muted-foreground))' }}>
          <Cpu size={10} style={{ color: 'var(--cyan)' }} />
          <span style={{ color: 'hsl(120,80%,55%)' }}>ALL SYSTEMS OPERATIONAL</span>
          <span className="inline-block w-1.5 h-1.5 rounded-full anim-neon" style={{ background: 'hsl(120,80%,55%)' }} />
        </div>
      </div>
    </div>

    {/* ── Copyright ── */}
    <div className="relative z-10" style={{ borderTop: '1px solid hsl(var(--border))', background: 'hsl(220,20%,4%)' }}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          <Terminal size={10} style={{ color: 'var(--cyan)' }} />
          <span>© 2026 <strong className="text-foreground">Shahed Store</strong> · All rights reserved.</span>
        </div>
        <a href="https://www.shahedstore.com.bd" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs transition-colors"
          style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--muted-foreground))' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--cyan)')}
          onMouseLeave={e => (e.currentTarget.style.color = '')}>
          www.shahedstore.com.bd <ExternalLink size={9} />
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;
