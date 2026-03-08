import { Shield, Facebook, MessageCircle, Instagram, Phone, Mail, Globe, ExternalLink, ArrowRight } from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';

const Footer = () => {
  return (
    <footer className="relative mt-8" style={{ borderTop: '1px solid hsla(180,100%,42%,0.1)' }}>
      {/* Top accent line */}
      <div className="h-px w-full" style={{ background: 'var(--gradient-primary)', opacity: 0.4 }} />

      {/* Main footer */}
      <div className="py-14 px-4" style={{ background: 'hsla(228,28%,7%,0.95)' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="space-y-5 lg:col-span-1">
            <a href="/" className="flex items-center gap-2.5 group">
              <img src={logoIcon} alt="Shahed Store" className="w-8 h-8 rounded-full object-cover" />
              <div className="leading-none">
                <div className="font-black text-sm tracking-widest gradient-text" style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.15em' }}>
                  SHAHED
                </div>
                <div className="text-[8px] tracking-[0.35em] font-semibold uppercase" style={{ color: 'hsl(var(--primary))' }}>
                  STORE
                </div>
              </div>
            </a>
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
              অরিজিনাল সফটওয়্যার সেরা দামে — বাংলাদেশের সবচেয়ে বিশ্বস্ত ডিজিটাল স্টোর
            </p>

            <div className="space-y-2 text-sm">
              {[
                { icon: <Phone size={12} />, href: 'tel:01840099853', text: '01840-099853' },
                { icon: <Mail size={12} />, href: 'mailto:info@shahedstore.com.bd', text: 'info@shahedstore.com.bd' },
                { icon: <Globe size={12} />, href: 'https://www.shahedstore.com.bd', text: 'www.shahedstore.com.bd' },
              ].map((item, i) => (
                <a key={i} href={item.href} target={i === 2 ? '_blank' : undefined} rel={i === 2 ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-2 transition-colors"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'hsl(var(--primary))'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground))'; }}
                >
                  <span style={{ color: 'hsl(var(--primary))' }}>{item.icon}</span>
                  {item.text}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {[
                { icon: <Facebook size={14} />, href: '#', label: 'Facebook' },
                { icon: <MessageCircle size={14} />, href: 'https://wa.me/8801840099853', label: 'WhatsApp' },
                { icon: <Instagram size={14} />, href: '#', label: 'Instagram' },
              ].map((s, i) => (
                <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: 'hsla(228,28%,13%,0.7)', border: '1px solid hsla(180,100%,42%,0.12)', color: 'hsl(var(--muted-foreground))' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'hsla(180,100%,42%,0.4)'; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--primary))'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'hsla(180,100%,42%,0.12)'; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground))'; }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <FooterColumn title="Services" links={['Confirmation ID', 'Office', 'Windows', 'Top Selling Products', 'Software', 'CID For Reseller']} />

          {/* Information */}
          <FooterColumn title="Information" links={['FAQs', 'About Us', 'Software Download Link', 'My Account', 'Contact Us', 'All Product']} />

          {/* Policies */}
          <FooterColumn title="Policies" links={['Privacy Policy', 'Terms & Condition', 'Refund & Return Policy', 'Order & Cancellation', 'Delivery System', 'Return Policy']} />

          {/* Trust & Payment */}
          <div>
            <h4 className="font-bold text-sm mb-5 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <span className="w-1 h-4 rounded-full inline-block" style={{ background: 'var(--gradient-primary)' }} />
              Trust & Payment
            </h4>

            <div className="rounded-xl p-4 mb-5"
              style={{ background: 'hsla(180,100%,42%,0.06)', border: '1px solid hsla(180,100%,42%,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Shield size={15} style={{ color: 'hsl(var(--primary))' }} />
                <span className="font-bold text-sm" style={{ color: 'hsl(var(--foreground))' }}>Govt. Certified</span>
              </div>
              <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Digital Business Provider</p>
              <p className="text-xs font-semibold" style={{ color: 'hsl(var(--primary))' }}>DBID ✓ 586772174</p>
            </div>

            <p className="font-semibold text-xs mb-3 uppercase tracking-wider" style={{ color: 'hsl(var(--foreground))' }}>Payment Methods</p>
            <div className="flex flex-wrap gap-2">
              {['bKash', 'নগদ', 'রকেট'].map((pm) => (
                <span key={pm} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-default"
                  style={{ background: 'hsla(228,28%,13%,0.7)', border: '1px solid hsla(228,25%,20%,0.5)', color: 'hsl(var(--muted-foreground))' }}>
                  {pm}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="py-4 px-4" style={{ borderTop: '1px solid hsla(180,100%,42%,0.08)', background: 'hsla(230,30%,5%,0.98)' }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <span>
            © 2026 <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Shahed Store</span> — সর্বস্বত্ব সংরক্ষিত
          </span>
          <a href="https://www.shahedstore.com.bd" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 hover:underline transition-colors"
            style={{ color: 'hsl(var(--primary))' }}>
            www.shahedstore.com.bd <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </footer>
  );
};

const FooterColumn = ({ title, links }: { title: string; links: string[] }) => (
  <div>
    <h4 className="font-bold text-sm mb-5 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
      <span className="w-1 h-4 rounded-full inline-block" style={{ background: 'var(--gradient-primary)' }} />
      {title}
    </h4>
    <ul className="space-y-2.5">
      {links.map((link) => (
        <li key={link}>
          <a href="#"
            className="text-sm inline-flex items-center gap-1 group transition-all"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'hsl(var(--primary))'; (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground))'; (e.currentTarget as HTMLElement).style.transform = 'translateX(0)'; }}
          >
            {link}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

export default Footer;
