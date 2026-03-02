import { Shield, Facebook, MessageCircle, Instagram, Phone, Mail, Globe, ExternalLink } from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';

const Footer = () => {
  return (
    <footer className="relative mt-8 border-t border-border/30">
      {/* Main footer */}
      <div className="py-14 px-4 bg-card/30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="space-y-5 lg:col-span-1">
            <a href="#" className="flex items-center gap-2.5 group">
              <img src={logoIcon} alt="Shahed Store" className="w-8 h-8 rounded-full object-cover" />
              <div className="leading-none">
                <div className="font-black text-sm tracking-widest gradient-text" style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.15em' }}>
                  SHAHED
                </div>
                <div className="text-[8px] tracking-[0.35em] text-primary/80 font-semibold uppercase">
                  STORE
                </div>
              </div>
            </a>
            <p className="text-muted-foreground text-sm leading-relaxed">
              অরিজিনাল সফটওয়্যার সেরা দামে — বাংলাদেশের সবচেয়ে বিশ্বস্ত ডিজিটাল স্টোর
            </p>

            <div className="space-y-2 text-sm">
              <a href="tel:01840099853" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Phone size={13} className="text-primary" />
                <span>01840-099853</span>
              </a>
              <a href="mailto:info@shahedstore.com.bd" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Mail size={13} className="text-primary" />
                <span>info@shahedstore.com.bd</span>
              </a>
              <a href="https://www.shahedstore.com.bd" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Globe size={13} className="text-primary" />
                <span>www.shahedstore.com.bd</span>
              </a>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {[
                { icon: <Facebook size={14} />, href: '#', label: 'Facebook' },
                { icon: <MessageCircle size={14} />, href: 'https://wa.me/8801840099853', label: 'WhatsApp' },
                { icon: <Instagram size={14} />, href: '#', label: 'Instagram' },
              ].map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl border border-border/50 bg-card/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
                  title={s.label}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-foreground text-sm mb-5 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-gradient-to-b from-primary to-accent inline-block" />
              Services
            </h4>
            <ul className="space-y-2.5">
              {['Confirmation ID', 'Office', 'Windows', 'Top Selling Products', 'Software', 'CID For Reseller'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-foreground text-sm hover:text-primary hover:translate-x-1 inline-block transition-all">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Information */}
          <div>
            <h4 className="font-bold text-foreground text-sm mb-5 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-gradient-to-b from-primary to-accent inline-block" />
              Information
            </h4>
            <ul className="space-y-2.5">
              {['FAQs', 'About Us', 'Software Download Link', 'My Account', 'Contact Us', 'All Product'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-foreground text-sm hover:text-primary hover:translate-x-1 inline-block transition-all">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-bold text-foreground text-sm mb-5 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-gradient-to-b from-primary to-accent inline-block" />
              Policies
            </h4>
            <ul className="space-y-2.5">
              {['Privacy Policy', 'Terms & Condition', 'Refund & Return Policy', 'Order & Cancellation', 'Delivery System', 'Return Policy'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-foreground text-sm hover:text-primary hover:translate-x-1 inline-block transition-all">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust & Payment */}
          <div>
            <h4 className="font-bold text-foreground text-sm mb-5 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-gradient-to-b from-primary to-accent inline-block" />
              Trust & Payment
            </h4>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={16} className="text-primary" />
                <span className="text-foreground font-bold text-sm">Govt. Certified</span>
              </div>
              <p className="text-muted-foreground text-xs mb-1">Digital Business Provider</p>
              <p className="text-primary text-xs font-semibold">DBID ✓ 586772174</p>
            </div>

            <p className="text-foreground font-semibold text-xs mb-3 uppercase tracking-wider">Payment Methods</p>
            <div className="flex flex-wrap gap-2">
              {['bKash', 'নগদ', 'রকেট'].map((pm) => (
                <span
                  key={pm}
                  className="bg-card border border-border/50 px-3 py-1.5 rounded-lg text-xs text-muted-foreground font-medium hover:border-primary/30 transition-colors"
                >
                  {pm}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-border/30 py-4 px-4 bg-background">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            © 2026 <span className="font-semibold text-foreground">Shahed Store</span> — সর্বস্বত্ব সংরক্ষিত
          </span>
          <a href="https://www.shahedstore.com.bd" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
            www.shahedstore.com.bd <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
