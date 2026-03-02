import { useState, useEffect } from 'react';
import { ArrowRight, Shield, Zap, Award, Star, TrendingDown } from 'lucide-react';

const slides = [
  {
    badge: '🔥 Bangladesh\'s #1 Software Store',
    title: 'Premium Software',
    highlight: 'License Keys',
    subtitle: 'Get genuine Windows, Office, Adobe & more at Bangladesh\'s lowest prices. Instant delivery guaranteed.',
    cta: 'Shop Now',
    cta2: 'View All Products',
    tag: 'Up to 94% OFF',
  },
  {
    badge: '⚡ Flash Sale Live Now',
    title: 'Microsoft Office 365',
    highlight: 'Up to 88% OFF',
    subtitle: 'Original Microsoft subscriptions at unbeatable prices. Instant key delivery within minutes!',
    cta: 'Grab Deal',
    cta2: 'All Office Products',
    tag: 'Limited Time',
  },
  {
    badge: '🎬 Streaming Subscriptions',
    title: 'Netflix, Spotify',
    highlight: '& More',
    subtitle: 'Premium streaming services at Bangladeshi prices. 100% real accounts with full support.',
    cta: 'Subscribe Now',
    cta2: 'View All',
    tag: 'Instant Access',
  },
];

const featuredProducts = [
  { name: 'Windows 11 Pro', price: '৳599', off: '-94%', img: 'https://shahedstore.com.bd/wp-content/uploads/2024/09/generated_image_5998b250-5afb-4d15-bd7a-5202e8a58235-copy-800x800.png' },
  { name: 'Adobe Creative Cloud', price: '৳599', off: '-70%', img: 'https://shahedstore.com.bd/wp-content/uploads/2024/10/Adobe-800x800.jpg' },
  { name: 'Netflix Premium', price: '৳499', off: '-81%', img: 'https://shahedstore.com.bd/wp-content/uploads/2024/09/NETPLX-2.webp' },
  { name: 'Office 365 Personal', price: '৳1,999', off: '-88%', img: 'https://shahedstore.com.bd/wp-content/uploads/2024/09/generated_image_cc7c68b2-1de4-4ea4-9049-45200b0f4174-800x800.webp' },
];

const HeroBanner = () => {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
        setTransitioning(false);
      }, 300);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];

  const goTo = (i: number) => {
    setTransitioning(true);
    setTimeout(() => { setCurrent(i); setTransitioning(false); }, 200);
  };

  return (
    <section className="relative min-h-[92vh] flex flex-col overflow-hidden pt-32" style={{ background: 'hsl(var(--background))' }}>
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(158,64%,52%,0.07) 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(43,100%,60%,0.05) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[300px]"
          style={{ background: 'radial-gradient(ellipse, hsla(158,64%,52%,0.04) 0%, transparent 70%)' }} />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />
      </div>

      <div className="relative z-10 flex-1 max-w-7xl mx-auto px-4 w-full flex items-center py-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center w-full">

          {/* ─── Left Content ─── */}
          <div
            className="space-y-7"
            style={{
              opacity: transitioning ? 0 : 1,
              transform: transitioning ? 'translateY(12px)' : 'translateY(0)',
              transition: 'all 0.35s ease',
            }}
          >
            {/* Top pill */}
            <div className="pill-badge w-fit animate-slide-up">
              {slide.badge}
            </div>

            {/* Headline */}
            <div className="animate-slide-up delay-100" style={{ animationFillMode: 'both' }}>
              <h1 className="font-bold leading-[1.1]" style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2.8rem, 6vw, 5rem)' }}>
                <span className="text-foreground block">{slide.title}</span>
                <span className="gradient-text block mt-1">{slide.highlight}</span>
              </h1>
            </div>

            <p className="text-muted-foreground text-lg leading-relaxed max-w-md animate-slide-up delay-200" style={{ animationFillMode: 'both' }}>
              {slide.subtitle}
            </p>

            {/* Tag + sale */}
            <div className="flex items-center gap-3 animate-slide-up delay-200" style={{ animationFillMode: 'both' }}>
              <span className="badge-discount text-sm px-4 py-1.5 rounded-full">
                <TrendingDown size={13} className="inline mr-1" />
                {slide.tag}
              </span>
              <span className="text-muted-foreground text-sm">🔒 Secure & Genuine</span>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4 animate-slide-up delay-300" style={{ animationFillMode: 'both' }}>
              <button className="btn-glow px-8 py-4 rounded-2xl text-base flex items-center gap-2 font-bold">
                {slide.cta}
                <ArrowRight size={18} />
              </button>
              <button className="surface-card px-8 py-4 rounded-2xl text-base text-foreground hover:border-primary/40 transition-all duration-300 font-medium">
                {slide.cta2}
              </button>
            </div>

            {/* Trust strip */}
            <div className="flex flex-wrap gap-6 pt-2 animate-slide-up delay-400" style={{ animationFillMode: 'both' }}>
              {[
                { icon: <Shield size={15} />, text: '100% Genuine' },
                { icon: <Zap size={15} />, text: 'Instant Delivery' },
                { icon: <Award size={15} />, text: '5★ Rated' },
                { icon: <Star size={15} />, text: '10,000+ Orders' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span className="text-primary">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            {/* Slide dots */}
            <div className="flex items-center gap-2 pt-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`transition-all duration-400 rounded-full ${
                    i === current
                      ? 'w-10 h-2.5 bg-primary shadow-[0_0_12px_hsla(158,64%,52%,0.5)]'
                      : 'w-2.5 h-2.5 bg-border hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ─── Right: Product Grid ─── */}
          <div className="hidden lg:grid grid-cols-2 gap-4 relative">
            {/* Ambient glow behind cards */}
            <div className="absolute inset-0 -m-8 rounded-3xl"
              style={{ background: 'radial-gradient(ellipse, hsla(158,64%,52%,0.06) 0%, transparent 70%)' }} />

            {featuredProducts.map((p, i) => (
              <div
                key={i}
                className="surface-card rounded-2xl overflow-hidden group cursor-pointer hover:border-primary/40 transition-all duration-400 animate-slide-up"
                style={{
                  animationDelay: `${0.1 + i * 0.1}s`,
                  animationFillMode: 'both',
                  boxShadow: '0 4px 24px hsla(222, 24%, 4%, 0.4)',
                }}
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={p.img}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x300/0d1321/3ddc84?text=Product'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  <span className="absolute top-2.5 left-2.5 badge-discount text-[10px]">{p.off}</span>
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-foreground/90 line-clamp-1">{p.name}</p>
                  <p className="text-primary font-bold text-base mt-0.5" style={{ fontFamily: 'Syne, sans-serif' }}>{p.price}</p>
                </div>
              </div>
            ))}

            {/* Corner decoration */}
            <div className="absolute -bottom-4 -right-4 w-20 h-20 opacity-30">
              <div className="w-full h-full rounded-full border-2 border-primary/40 animate-spin-slow" />
              <div className="absolute inset-2 rounded-full border border-accent/30 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '14s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, hsl(var(--background)))' }} />
    </section>
  );
};

export default HeroBanner;
