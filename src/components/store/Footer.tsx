import { Shield, Facebook, Twitter, MessageCircle, Instagram, Linkedin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative mt-8 border-t border-border bg-background">
      {/* Main footer */}
      <div className="py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">

          {/* Brand */}
          <div className="space-y-4 lg:col-span-1">
            <div>
              <span className="text-2xl font-extrabold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                <span className="text-primary">SHAHED</span>{' '}
                <span className="text-foreground">STORE</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              অরিজিনাল সফটওয়্যার সেরা দামে বিশ্বস্ত প্রতিষ্ঠান
            </p>

            <div>
              <p className="text-foreground font-semibold text-sm mb-2">Contact Us</p>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-primary" />
                  <span>Hotline: 01840-099853</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield size={13} className="text-primary" />
                  <span>DBID NO:- 586772174</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-primary" />
                  <span>info@shahedstore.com.bd</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-foreground font-semibold text-sm mb-2">Follow Us:</p>
              <div className="flex items-center gap-2">
                {[
                  { icon: <Facebook size={15} />, href: '#' },
                  { icon: <Twitter size={15} />, href: '#' },
                  { icon: <MessageCircle size={15} />, href: '#' },
                  { icon: <Instagram size={15} />, href: '#' },
                  { icon: <Linkedin size={15} />, href: '#' },
                ].map((s, i) => (
                  <a
                    key={i}
                    href={s.href}
                    className="w-9 h-9 glass-card rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-primary text-xs tracking-widest uppercase mb-4">Services</h4>
            <ul className="space-y-2">
              {['Confirmation ID', 'Office', 'Windows', 'Top Selling Products', 'Software', 'CID For Reseller'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Information */}
          <div>
            <h4 className="font-bold text-primary text-xs tracking-widest uppercase mb-4">Information</h4>
            <ul className="space-y-2">
              {['FAQs', 'About Us', 'Software Download Link', 'My Account', 'Contact Us', 'All Product'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-bold text-primary text-xs tracking-widest uppercase mb-4">Policies</h4>
            <ul className="space-y-2">
              {['Privacy Policy', 'Terms & Condition', 'Refund & Return Policy', 'Order & Cancellation', 'Delivery System', 'Return Policy'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust & Payment */}
          <div>
            <h4 className="font-bold text-primary text-xs tracking-widest uppercase mb-4">Trust & Payment</h4>

            {/* Govt Certified badge */}
            <div className="glass-card rounded-xl p-4 mb-5 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Shield size={18} className="text-primary" />
                <span className="text-foreground font-bold text-sm">Govt. Certified</span>
              </div>
              <p className="text-muted-foreground text-xs mb-1">Digital Business Provider</p>
              <p className="text-primary text-xs font-semibold">DBID ✓ 586772174</p>
            </div>

            <p className="text-foreground font-semibold text-sm mb-3">Payment Methods:</p>
            <div className="flex flex-wrap gap-2">
              {['bKash', 'নগদ', 'রকেট'].map((pm) => (
                <span
                  key={pm}
                  className="glass-card px-3 py-1.5 rounded-lg text-xs text-foreground font-medium border border-border hover:border-primary/40 transition-colors"
                >
                  {pm}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-border py-4 px-4 text-center text-xs text-muted-foreground">
        সর্বস্ব সংরক্ষিত{' '}
        <span className="font-bold">
          <span className="text-primary">শাহেদ</span>{' '}
          <span className="text-foreground">স্টোর</span>
        </span>{' '}
        কিপারাইট © 2026
      </div>
    </footer>
  );
};

export default Footer;
