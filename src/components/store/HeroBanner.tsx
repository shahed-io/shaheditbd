import { useState, useEffect } from 'react';
import { ArrowRight, Shield, Zap, Award, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import heroBanner from '@/assets/hero-banner.png';

const slides = [
  {
    badge: '🔥 Best Deals on Software',
    title: 'Premium Software',
    highlight: 'License Keys',
    subtitle: 'Get genuine Windows, Office, Adobe & more at Bangladesh\'s lowest prices!',
    cta: 'Shop Now',
    cta2: 'View All Products',
  },
  {
    badge: '⚡ Flash Sale Live',
    title: 'Office 365',
    highlight: 'Up to 88% OFF',
    subtitle: 'Original Microsoft subscriptions at unbeatable prices. Instant key delivery!',
    cta: 'Grab Deal',
    cta2: 'All Office Products',
  },
  {
    badge: '🎬 Streaming Subscriptions',
    title: 'Netflix, Spotify',
    highlight: '& More Subscriptions',
    subtitle: 'Premium streaming services at affordable Bangladeshi prices. 100% real accounts!',
    cta: 'Subscribe Now',
    cta2: 'View All Subscriptions',
  },
];

const HeroBanner = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((prev) => (prev + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];

  return (
    <section className="relative min-h-[88vh] flex items-center overflow-hidden pt-28 sm:pt-32">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroBanner}
          alt="Hero Banner"
          className="w-full h-full object-cover opacity-40 scale-105"
          style={{ filter: 'saturate(1.2) brightness(0.65)' }}
        />
        {/* Overlay layers */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, hsl(230,30%,5%) 0%, hsla(230,30%,5%,0.75) 50%, hsla(230,30%,5%,0.3) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, hsl(230,30%,5%) 0%, transparent 50%)' }} />
        {/* Orbs */}
        <div className="orb orb-1" style={{ top: '10%', left: '5%' }} />
        <div className="orb orb-2" style={{ bottom: '10%', right: '10%' }} />
        <div className="orb orb-3" style={{ top: '50%', left: '55%' }} />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
          backgroundSize: '70px 70px',
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 w-full">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left */}
          <div className="space-y-6 animate-slide-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
              style={{
                background: 'hsla(180,100%,42%,0.1)',
                border: '1px solid hsla(180,100%,42%,0.25)',
                color: 'hsl(var(--primary))',
              }}>
              <span>{slide.badge}</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold leading-tight" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              <span className="text-foreground">{slide.title}</span>
              <br />
              <span className="gradient-text">{slide.highlight}</span>
            </h1>

            <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
              {slide.subtitle}
            </p>

            <div className="flex flex-wrap gap-4">
              <button className="btn-glow px-8 py-4 rounded-xl text-base flex items-center gap-2 font-bold">
                {slide.cta}
                <ArrowRight size={18} />
              </button>
              <button className="glass-card px-8 py-4 rounded-xl text-base font-medium hover:border-primary/40 transition-all duration-300">
                {slide.cta2}
              </button>
            </div>

            {/* Trust */}
            <div className="flex flex-wrap gap-6 pt-2">
              {[
                { icon: <Shield size={15} />, text: '100% Genuine Keys' },
                { icon: <Zap size={15} />, text: 'Instant Delivery' },
                { icon: <Award size={15} />, text: '5★ Rated Store' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-primary">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-2">
              {[
                { num: '5,000+', label: 'Happy Customers' },
                { num: '98%', label: 'Satisfaction' },
                { num: '24/7', label: 'Support' },
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-2xl font-black gradient-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>{s.num}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Floating product cards */}
          <div className="hidden lg:flex items-center justify-center relative h-[520px]">
            {/* Floating cards */}
            {[
              { img: 'https://shahedstore.com.bd/wp-content/uploads/2024/09/generated_image_5998b250-5afb-4d15-bd7a-5202e8a58235-copy-800x800.png', name: 'Windows 11 Pro', price: '৳599', off: '-94%', pos: 'top-6 left-6', delay: '0.2s' },
              { img: 'https://shahedstore.com.bd/wp-content/uploads/2024/10/Adobe-800x800.jpg', name: 'Adobe Creative Cloud', price: '৳599', off: '-70%', pos: 'top-2 right-10', delay: '0.3s' },
              { img: 'https://shahedstore.com.bd/wp-content/uploads/2024/09/NETPLX-2.webp', name: 'Netflix Subscription', price: '৳499', off: '-81%', pos: 'bottom-14 left-2', delay: '0.4s' },
              { img: 'https://shahedstore.com.bd/wp-content/uploads/2024/09/generated_image_cc7c68b2-1de4-4ea4-9049-45200b0f4174-800x800.webp', name: 'Office 365 Personal', price: '৳1,999', off: '-88%', pos: 'bottom-6 right-6', delay: '0.1s' },
            ].map((card, i) => (
              <div
                key={i}
                className={`absolute ${card.pos} rounded-2xl p-3.5 w-44 animate-slide-up`}
                style={{
                  animationDelay: card.delay,
                  animationFillMode: 'both',
                  background: 'hsla(228,28%,11%,0.85)',
                  border: '1px solid hsla(180,100%,42%,0.2)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 10px 40px hsla(230,30%,5%,0.5)',
                }}
              >
                <img src={card.img} alt={card.name} className="w-full rounded-xl mb-2 aspect-square object-cover" />
                <p className="text-xs font-semibold text-foreground line-clamp-1">{card.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="font-black text-sm" style={{ color: 'hsl(var(--primary))' }}>{card.price}</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ background: 'var(--gradient-gold)', color: 'hsl(var(--background))' }}>
                    {card.off}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 mt-1">
                  {Array.from({ length: 5 }).map((_, s) => <Star key={s} size={8} className="text-yellow-400 fill-yellow-400" />)}
                </div>
              </div>
            ))}

            {/* Center glow circle */}
            <div className="w-28 h-28 rounded-full border-2 flex items-center justify-center animate-pulse-glow"
              style={{ borderColor: 'hsla(180,100%,42%,0.3)' }}>
              <div className="w-18 h-18 rounded-full flex items-center justify-center text-3xl"
                style={{ background: 'hsla(180,100%,42%,0.12)' }}>
                🛒
              </div>
            </div>
          </div>
        </div>

        {/* Slide controls */}
        <div className="flex items-center justify-center gap-3 mt-12">
          <button onClick={() => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)}
            className="p-2 rounded-xl border border-border/40 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all glass-card">
            <ChevronLeft size={18} />
          </button>
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === current ? '2rem' : '0.5rem',
                  height: '0.5rem',
                  background: i === current ? 'hsl(var(--primary))' : 'hsla(215,25%,50%,0.4)',
                }} />
            ))}
          </div>
          <button onClick={() => setCurrent((prev) => (prev + 1) % slides.length)}
            className="p-2 rounded-xl border border-border/40 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all glass-card">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
