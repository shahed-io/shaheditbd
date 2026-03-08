import { Phone, Mail, Globe, Facebook, Instagram, MessageCircle, Shield, ExternalLink } from 'lucide-react';

const NAV_COL = [
  { title: 'Services',    links: ['Windows Keys', 'Office 365', 'Adobe Creative', 'Streaming', 'VPN & Security', 'AI Tools'] },
  { title: 'Information', links: ['FAQs', 'About Us', 'My Account', 'Contact Us', 'All Products', 'Download Links'] },
  { title: 'Policies',    links: ['Privacy Policy', 'Terms & Conditions', 'Refund Policy', 'Order Policy', 'Delivery Info', 'Return Policy'] },
];

const Footer = () => (
  <footer className="bg-foreground text-white">

    {/* ── Main footer ── */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

      {/* Brand */}
      <div className="lg:col-span-2 space-y-6">
        <a href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base"
            style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>S</div>
          <div>
            <div className="font-sora font-black text-lg text-white">ShahedStore</div>
            <div className="text-[9px] tracking-widest uppercase text-white/50 font-fira">Digital Marketplace</div>
          </div>
        </a>

        <p className="text-sm text-white/60 leading-relaxed max-w-xs">
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
              className="flex items-center gap-2.5 text-sm text-white/60 hover:text-white transition-colors w-fit">
              <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">{c.icon}</span>
              <span className="font-fira text-[12px]">{c.label}</span>
            </a>
          ))}
        </div>

        {/* Social */}
        <div className="flex gap-2">
          {[
            { icon: <Facebook size={15} />,      href: '#', label: 'Facebook' },
            { icon: <MessageCircle size={15} />, href: 'https://wa.me/8801840099853', label: 'WhatsApp' },
            { icon: <Instagram size={15} />,     href: '#', label: 'Instagram' },
          ].map((s, i) => (
            <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-all" title={s.label}>
              {s.icon}
            </a>
          ))}
        </div>
      </div>

      {/* Nav columns */}
      {NAV_COL.map((col, ci) => (
        <div key={ci}>
          <h4 className="font-sora font-bold text-xs uppercase tracking-widest text-white mb-5 flex items-center gap-2">
            <span className="w-4 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, hsl(243,75%,59%), hsl(263,70%,58%))' }} />
            {col.title}
          </h4>
          <ul className="space-y-2.5">
            {col.links.map(link => (
              <li key={link}>
                <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">{link}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>

    {/* ── Trust bar ── */}
    <div className="border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
            <Shield size={15} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white font-sora">GOVT. CERTIFIED BUSINESS</p>
            <p className="text-[10px] text-white/50 font-fira">DBID: 586772174</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40 font-fira mr-1">PAYMENTS:</span>
          {['bKash', 'Nagad', 'Rocket'].map(pm => (
            <span key={pm} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-white/10 text-white/70 border border-white/15 font-fira">{pm}</span>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/40 font-fira">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          All systems operational
        </div>
      </div>
    </div>

    {/* ── Copyright ── */}
    <div className="border-t border-white/10 bg-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-white/40 font-fira">© 2026 <strong className="text-white/60">Shahed Store</strong> · All rights reserved.</p>
        <a href="https://www.shahedstore.com.bd" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors font-fira">
          www.shahedstore.com.bd <ExternalLink size={10} />
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;

