import { useState, useEffect } from 'react';
import { ArrowRight, Shield, Zap, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import heroBanner from '@/assets/hero-banner.png';

const slides = [
  {
    badge: '🔥 Best Deals on Software',
    title: 'Premium Software',
    highlight: 'License Keys',
    subtitle: 'Get genuine Windows, Office, Adobe & more at Bangladesh\'s lowest prices!',
    cta: 'Shop Now',
    cta2: 'View All Products',
    bg: 'from-blue-900/40 via-transparent to-purple-900/30',
  },
  {
    badge: '⚡ Flash Sale Live',
    title: 'Office 365',
    highlight: 'Up to 88% OFF',
    subtitle: 'Original Microsoft subscriptions at unbeatable prices. Instant key delivery!',
    cta: 'Grab Deal',
    cta2: 'All Office Products',
    bg: 'from-orange-900/30 via-transparent to-blue-900/30',
  },
  {
    badge: '🎬 Streaming Subscriptions',
    title: 'Netflix, Spotify',
    highlight: '& More Subscriptions',
    subtitle: 'Premium streaming services at affordable Bangladeshi prices. 100% real accounts!',
    cta: 'Subscribe Now',
    cta2: 'View All Subscriptions',
    bg: 'from-red-900/30 via-transparent to-cyan-900/30',
  },
];

const HeroBanner = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden pt-32">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroBanner}
          alt="Hero Banner"
          className="w-full h-full object-cover opacity-55 scale-105"
          style={{ filter: 'saturate(1.3) brightness(0.75)' }}
        />
        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className={`absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent`} />
        {/* Slide color tint */}
        <div className={`absolute inset-0 bg-gradient-to-r ${slide.bg} transition-all duration-1000`} />
        {/* Animated orbs */}
        <div className="orb orb-1 top-20 left-1/4" />
        <div className="orb orb-2 bottom-20 right-1/4" />
        <div className="orb orb-3 top-1/2 left-2/3" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-6 animate-slide-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 text-sm text-primary border-primary/30">
              <span>{slide.badge}</span>
            </div>

            {/* Title */}
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              <span className="text-foreground">{slide.title}</span>
              <br />
              <span className="gradient-text">{slide.highlight}</span>
            </h1>

            <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
              {slide.subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <button className="btn-glow px-8 py-4 rounded-xl text-base flex items-center gap-2 font-semibold">
                {slide.cta}
                <ArrowRight size={18} />
              </button>
              <button className="glass-card px-8 py-4 rounded-xl text-base text-foreground hover:border-primary/50 transition-all duration-300 font-medium">
                {slide.cta2}
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 pt-4">
              {[
                { icon: <Shield size={16} />, text: '100% Genuine Keys' },
                { icon: <Zap size={16} />, text: 'Instant Delivery' },
                { icon: <Award size={16} />, text: '5★ Rated Store' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-primary">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Floating product cards */}
          <div className="hidden lg:flex items-center justify-center relative h-[500px]">
            {/* Floating cards */}
            <div className="absolute top-8 left-8 glass-card rounded-2xl p-4 w-44 animate-slide-up delay-200" style={{ animationFillMode: 'both' }}>
              <img
                src="https://shahedstore.com.bd/wp-content/uploads/2024/09/generated_image_5998b250-5afb-4d15-bd7a-5202e8a58235-copy-800x800.png"
                alt="Windows 11"
                className="w-full rounded-xl mb-2 aspect-square object-cover"
              />
              <p className="text-xs font-semibold text-foreground">Windows 11 Pro</p>
              <p className="text-primary font-bold text-sm">৳599</p>
              <span className="badge-discount text-[10px]">-94%</span>
            </div>

            <div className="absolute top-4 right-12 glass-card rounded-2xl p-4 w-44 animate-slide-up delay-300" style={{ animationFillMode: 'both' }}>
              <img
                src="https://shahedstore.com.bd/wp-content/uploads/2024/10/Adobe-800x800.jpg"
                alt="Adobe"
                className="w-full rounded-xl mb-2 aspect-square object-cover"
              />
              <p className="text-xs font-semibold text-foreground">Adobe Creative Cloud</p>
              <p className="text-primary font-bold text-sm">৳599</p>
              <span className="badge-discount text-[10px]">-70%</span>
            </div>

            <div className="absolute bottom-12 left-4 glass-card rounded-2xl p-4 w-44 animate-slide-up delay-400" style={{ animationFillMode: 'both' }}>
              <img
                src="https://shahedstore.com.bd/wp-content/uploads/2024/09/NETPLX-2.webp"
                alt="Netflix"
                className="w-full rounded-xl mb-2 aspect-square object-cover"
              />
              <p className="text-xs font-semibold text-foreground">Netflix Subscription</p>
              <p className="text-primary font-bold text-sm">৳499</p>
              <span className="badge-discount text-[10px]">-81%</span>
            </div>

            <div className="absolute bottom-8 right-8 glass-card rounded-2xl p-4 w-44 animate-slide-up delay-100" style={{ animationFillMode: 'both' }}>
              <img
                src="https://shahedstore.com.bd/wp-content/uploads/2024/09/generated_image_cc7c68b2-1de4-4ea4-9049-45200b0f4174-800x800.webp"
                alt="Office 365"
                className="w-full rounded-xl mb-2 aspect-square object-cover"
              />
              <p className="text-xs font-semibold text-foreground">Office 365 Personal</p>
              <p className="text-primary font-bold text-sm">৳1,999</p>
              <span className="badge-discount text-[10px]">-88%</span>
            </div>

            {/* Center glowing circle */}
            <div className="w-32 h-32 rounded-full border-2 border-primary/30 flex items-center justify-center animate-pulse-glow">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-3xl">
                🛒
              </div>
            </div>
          </div>
        </div>

        {/* Slide dots */}
        <div className="flex items-center justify-center gap-2 mt-12">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? 'w-8 h-2 bg-primary'
                  : 'w-2 h-2 bg-muted-foreground/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Slide controls */}
      <button
        onClick={() => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 glass-card p-2 rounded-xl hover:border-primary/50 transition-all z-20"
      >
        <ChevronLeft size={20} className="text-primary" />
      </button>
      <button
        onClick={() => setCurrent((prev) => (prev + 1) % slides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 glass-card p-2 rounded-xl hover:border-primary/50 transition-all z-20"
      >
        <ChevronRight size={20} className="text-primary" />
      </button>
    </section>
  );
};

export default HeroBanner;
