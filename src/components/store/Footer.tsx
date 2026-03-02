import { Shield, Facebook, Twitter, MessageCircle, Instagram, Linkedin, Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative mt-12" style={{ borderTop: '1px solid hsl(var(--border))' }}>
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), hsl(var(--accent)), transparent)' }} />

      <div className="py-14 px-4" style={{ background: 'hsl(var(--background))' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="space-y-5 lg:col-span-1">
            <div>
              <div className="text-2xl font-black" style={{ fontFamily: 'Syne, sans-serif' }}>
                <span style={{ color: 'hsl(var(--primary))' }}>SHAHED</span>{' '}
                <span className="text-foreground">STORE</span>
              </div>
              <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                অরিজিনাল সফটওয়্যার সেরা দামে — বিশ্বস্ত প্রতিষ্ঠান
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Phone size={13} className="text-primary flex-shrink-0" />
                <span>Hotline: 01840-099853</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Mail size={13} className="text-primary flex-shrink-0" />
                <span>info@shahedstore.com.bd</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield size={13} className="text-primary flex-shrink-0" />
                <span>DBID: 586772174</span>
              </div>
            </div>

            {/* Social */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Follow Us</p>
              <div className="flex items-center gap-2">
                {[
                  { icon: <Facebook size={14} />, href: '#' },
                  { icon: <Twitter size={14} />, href: '#' },
                  { icon: <MessageCircle size={14} />, href: '#' },
                  { icon: <Instagram size={14} />, href: '#' },
                  { icon: <Linkedin size={14} />, href: '#' },
                ].map((s, i) => (
                  <a key={i} href={s.href}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300 hover:-translate-y-0.5"
                    style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-xs tracking-widest uppercase mb-5" style={{ color: 'hsl(var(--primary))' }}>Services</h4>
            <ul className="space-y-2.5">
              {['Confirmation ID', 'Microsoft Office', 'Windows OS', 'Top Selling Products', 'Software & Tools', 'CID For Reseller'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-foreground text-sm hover:text-foreground transition-colors hover:translate-x-0.5 inline-block">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Information */}
          <div>
            <h4 className="font-bold text-xs tracking-widest uppercase mb-5" style={{ color: 'hsl(var(--primary))' }}>Information</h4>
            <ul className="space-y-2.5">
              {['FAQs', 'About Us', 'Software Downloads', 'My Account', 'Contact Us', 'All Products'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-foreground text-sm hover:text-foreground transition-colors hover:translate-x-0.5 inline-block">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-bold text-xs tracking-widest uppercase mb-5" style={{ color: 'hsl(var(--primary))' }}>Policies</h4>
            <ul className="space-y-2.5">
              {['Privacy Policy', 'Terms & Conditions', 'Refund & Return', 'Order & Cancellation', 'Delivery System', 'Return Policy'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-foreground text-sm hover:text-foreground transition-colors hover:translate-x-0.5 inline-block">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust & Payment */}
          <div>
            <h4 className="font-bold text-xs tracking-widest uppercase mb-5" style={{ color: 'hsl(var(--primary))' }}>Trust & Payment</h4>

            <div className="rounded-2xl p-4 mb-5"
              style={{ background: 'hsla(158,64%,52%,0.06)', border: '1px solid hsla(158,64%,52%,0.15)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <Shield size={16} className="text-primary" />
                <span className="text-foreground font-bold text-sm">Govt. Certified</span>
              </div>
              <p className="text-muted-foreground text-xs mb-1">Digital Business Provider</p>
              <p className="text-xs font-semibold" style={{ color: 'hsl(var(--primary))' }}>DBID ✓ 586772174</p>
            </div>

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Payment Methods</p>
            <div className="flex flex-wrap gap-2">
              {['bKash', 'নগদ', 'রকেট'].map((pm) => (
                <span key={pm}
                  className="px-3 py-1.5 rounded-xl text-xs text-foreground font-semibold transition-all duration-300 hover:border-primary/30"
                  style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                  {pm}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="py-4 px-4 text-center text-xs text-muted-foreground"
        style={{ borderTop: '1px solid hsl(var(--border))' }}>
        সর্বস্ব সংরক্ষিত{' '}
        <span className="font-bold">
          <span style={{ color: 'hsl(var(--primary))' }}>শাহেদ</span>{' '}
          <span className="text-foreground">স্টোর</span>
        </span>{' '}
        কপিরাইট © 2026
      </div>
    </footer>
  );
};

export default Footer;
