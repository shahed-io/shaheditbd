import { Package, Facebook, Twitter, MessageCircle, Mail, Phone, MapPin, Send } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative mt-8 border-t border-border">
      {/* Newsletter bar */}
      <div className="glass-card py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Subscribe for <span className="gradient-text">Exclusive Deals</span>
            </h3>
            <p className="text-muted-foreground text-sm mt-1">Get notified about flash sales & new products</p>
          </div>
          <div className="flex w-full max-w-md">
            <input
              type="email"
              placeholder="Enter your email address..."
              className="flex-1 bg-muted/50 border border-border rounded-l-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            <button className="btn-glow px-5 rounded-r-xl flex items-center gap-2">
              <Send size={16} />
              <span className="hidden sm:inline">Subscribe</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="py-12 px-4 bg-card/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Package size={20} className="text-background" />
              </div>
              <div>
                <div className="font-bold text-xl gradient-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>SHAHED</div>
                <div className="text-[10px] text-muted-foreground tracking-widest">STORE</div>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Bangladesh's most trusted digital software store. Genuine license keys at the best prices since 2020.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: <Facebook size={16} />, href: '#' },
                { icon: <Twitter size={16} />, href: '#' },
                { icon: <MessageCircle size={16} />, href: '#' },
                { icon: <Send size={16} />, href: '#' },
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

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {['Home', 'Windows', 'Office', 'Software', 'Subscription', 'Download Links', 'Terms & Conditions'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-foreground text-sm hover:text-primary transition-colors flex items-center gap-1">
                    → {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Top Products */}
          <div>
            <h4 className="font-bold text-foreground mb-4">Top Products</h4>
            <ul className="space-y-2">
              {[
                'Windows 11 Pro Key',
                'Office 365 Personal',
                'Adobe Creative Cloud',
                'Netflix Subscription',
                'Spotify Premium',
                'IDM Lifetime Key',
                'ElevenLabs AI',
              ].map((p) => (
                <li key={p}>
                  <a href="#" className="text-muted-foreground text-sm hover:text-primary transition-colors flex items-center gap-1">
                    → {p}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-foreground mb-4">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <Phone size={16} className="text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-foreground">01840099853</div>
                  <div className="text-xs">10AM – 10PM (Daily)</div>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <Mail size={16} className="text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-foreground">support@shahedstore.com.bd</div>
                  <div className="text-xs">Reply within 1 hour</div>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin size={16} className="text-primary flex-shrink-0 mt-0.5" />
                <div className="font-medium text-foreground">Bangladesh</div>
              </div>
            </div>

            <div className="mt-4 glass-card rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-2">Payment Methods</p>
              <div className="flex flex-wrap gap-2 text-xs font-medium">
                {['bKash', 'Nagad', 'Rocket', 'VISA', 'MasterCard'].map((pm) => (
                  <span key={pm} className="bg-muted px-2 py-1 rounded text-foreground">{pm}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-border py-5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© 2024 Shahed Store. All rights reserved. | shahedstore.com.bd</span>
          <span>Designed with ❤️ for Bangladesh</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
