import { useState, useEffect } from 'react';
import { ArrowRight, ShoppingBag, Star, Zap, Shield, Clock, Play, Sparkles } from 'lucide-react';

const SLIDES = [
  {
    tag: '🔥 Best Seller',
    title: 'Windows 11 Pro',
    subtitle: 'Original License Key',
    desc: 'Genuine Microsoft Windows 11 Pro — instant digital delivery to your inbox within minutes.',
    price: '৳599',
    original: '৳9,999',
    off: '94%',
    badge: 'MOST POPULAR',
    accentFrom: 'hsl(243,75%,59%)',
    accentTo: 'hsl(263,70%,58%)',
    bgFrom: 'hsla(243,75%,59%,0.05)',
    bgTo: 'hsla(263,70%,58%,0.05)',
    emoji: '🪟',
    features: ['Lifetime License', 'Instant Delivery', 'All Devices'],
  },
  {
    tag: '⚡ Flash Deal',
    title: 'Microsoft 365',
    subtitle: 'Personal — 1 Year',
    desc: 'Full Office suite: Word, Excel, PowerPoint, OneDrive 1TB. Premium productivity tools.',
    price: '৳1,999',
    original: '৳16,500',
    off: '88%',
    badge: 'LIMITED TIME',
    accentFrom: 'hsl(15,100%,60%)',
    accentTo: 'hsl(38,100%,55%)',
    bgFrom: 'hsla(15,100%,60%,0.05)',
    bgTo: 'hsla(38,100%,55%,0.05)',
    emoji: '📦',
    features: ['1TB OneDrive', '5 Devices', '1 Year'],
  },
  {
    tag: '🎬 Streaming',
    title: 'Netflix Premium',
    subtitle: '4K Ultra HD',
    desc: 'Netflix Premium — 4K Ultra HD streaming, download offline, screen sharing supported.',
    price: '৳499',
    original: '৳2,600',
    off: '81%',
    badge: 'HOT DEAL',
    accentFrom: 'hsl(158,64%,42%)',
    accentTo: 'hsl(180,70%,40%)',
    bgFrom: 'hsla(158,64%,42%,0.05)',
    bgTo: 'hsla(180,70%,40%,0.05)',
    emoji: '🎬',
    features: ['4K Quality', 'Offline Mode', '1 Month'],
  },
];

const STATS = [
  { label: 'Products', value: '500+', icon: '🛍️' },
  { label: 'Orders Delivered', value: '25K+', icon: '✅' },
  { label: 'Happy Customers', value: '12K+', icon: '😊' },
  { label: 'Support Rating', value: '4.9/5', icon: '⭐' },
];

const HeroBanner = () => {
  const [active, setActive] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => { setActive(p => (p + 1) % SLIDES.length); setTransitioning(false); }, 300);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (i: number) => {
    setTransitioning(true);
    setTimeout(() => { setActive(i); setTransitioning(false); }, 300);
  };

  const slide = SLIDES[active];

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Animated bg */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 transition-all duration-700"
          style={{ background: `radial-gradient(ellipse at 70% 50%, ${slide.bgFrom} 0%, transparent 60%), radial-gradient(ellipse at 30% 80%, ${slide.bgTo} 0%, transparent 50%)` }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] blob opacity-30"
          style={{ background: `radial-gradient(circle, ${slide.accentFrom}25, transparent)` }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 blob opacity-20"
          style={{ background: `radial-gradient(circle, ${slide.accentTo}20, transparent)`, animationDelay: '4s' }} />
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle, hsl(243,75%,59%) 0.8px, transparent 0.8px)', backgroundSize: '32px 32px', opacity: 0.03 }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left Content */}
          <div className={`space-y-7 transition-all duration-300 ${transitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-1.5 rounded-full text-white"
                style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})` }}>
                {slide.tag}
              </span>
              <span className="text-[11px] font-fira font-semibold text-muted-foreground tracking-widest uppercase px-3 py-1.5 bg-muted rounded-full border border-border">
                {slide.badge}
              </span>
            </div>

            <div>
              <h1 className="font-sora font-black text-5xl lg:text-6xl xl:text-7xl leading-[1.05] tracking-tight text-foreground">
                {slide.title}
              </h1>
              <h2 className="font-sora font-bold text-2xl lg:text-3xl mt-2 leading-tight"
                style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {slide.subtitle}
              </h2>
            </div>

            <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">{slide.desc}</p>

            <div className="flex flex-wrap gap-2">
              {slide.features.map(f => (
                <span key={f} className="flex items-center gap-1.5 text-sm font-semibold text-foreground bg-white border border-border px-4 py-2 rounded-full shadow-soft">
                  <span className="w-2 h-2 rounded-full" style={{ background: slide.accentFrom }} />
                  {f}
                </span>
              ))}
            </div>

            <div className="flex items-end gap-4">
              <span className="text-5xl font-sora font-black text-foreground">{slide.price}</span>
              <div>
                <div className="text-sm text-muted-foreground line-through">{slide.original}</div>
                <span className="text-sm font-bold text-white px-2.5 py-0.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg, hsl(15,100%,60%), hsl(38,100%,55%))' }}>Save {slide.off}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-base font-bold text-white hover:scale-105 transition-transform duration-200 shadow-indigo"
                style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})` }}>
                <ShoppingBag size={18} /> Order Now <ArrowRight size={16} />
              </button>
              <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-base font-semibold bg-white border-2 border-border hover:border-foreground/30 transition-all shadow-soft text-foreground hover:shadow-medium">
                <Play size={16} fill="currentColor" /> How it works
              </button>
            </div>

            <div className="flex flex-wrap gap-6 pt-1">
              {[
                { icon: <Zap size={14} />, text: 'Instant Delivery' },
                { icon: <Shield size={14} />, text: '100% Genuine' },
                { icon: <Clock size={14} />, text: '24/7 Support' },
                { icon: <Star size={14} />, text: '4.9 Rating' },
              ].map(t => (
                <span key={t.text} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <span style={{ color: slide.accentFrom }}>{t.icon}</span>
                  {t.text}
                </span>
              ))}
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative hidden lg:flex items-center justify-center min-h-[420px]">
            <div className={`relative w-80 rounded-3xl shadow-strong overflow-hidden transition-all duration-300 anim-float ${transitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
              style={{ background: `linear-gradient(145deg, ${slide.accentFrom}, ${slide.accentTo})` }}>
              <div className="absolute inset-0"
                style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)' }} />
              <div className="relative p-8">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl mb-6 shadow-soft">
                  {slide.emoji}
                </div>
                <Sparkles size={18} className="absolute top-6 right-6 text-white/50 anim-spin-slow" />
                <div className="text-white/70 text-xs font-fira uppercase tracking-widest mb-2">Featured Deal</div>
                <div className="text-white font-sora font-black text-2xl leading-tight">{slide.title}</div>
                <div className="text-white/80 text-sm mt-1">{slide.subtitle}</div>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <div className="text-white/60 text-xs line-through">{slide.original}</div>
                    <div className="text-white font-sora font-black text-3xl">{slide.price}</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2 text-white text-center">
                    <div className="font-fira font-bold text-lg">-{slide.off}</div>
                    <div className="text-[10px] opacity-70">OFF</div>
                  </div>
                </div>
                <button className="mt-6 w-full py-3 rounded-xl bg-white font-bold text-sm hover:bg-white/90 transition-colors"
                  style={{ color: slide.accentFrom }}>Order Now →</button>
              </div>
            </div>

            {/* Floating badges */}
            {[
              { label: 'Orders Today', value: '248+', icon: '📦', top: '5%',  left: '-15%', right: 'auto' },
              { label: 'Happy Users',  value: '12K+', icon: '😊', top: '45%', left: 'auto',  right: '-15%' },
              { label: 'Avg Rating',   value: '4.9★', icon: '⭐', top: '80%', left: '-15%', right: 'auto' },
            ].map((card, i) => (
              <div key={card.label}
                className="absolute glass-white rounded-2xl px-4 py-3 shadow-medium anim-float"
                style={{ animationDelay: `${i * 1.2}s`, top: card.top, left: card.left, right: card.right }}>
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{card.icon}</span>
                  <div>
                    <div className="text-base font-sora font-black text-foreground leading-none">{card.value}</div>
                    <div className="text-[10px] text-muted-foreground leading-none mt-0.5">{card.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slide Dots */}
        <div className="flex items-center justify-center gap-2 mt-12">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${i === active ? 'w-8 h-2.5' : 'w-2.5 h-2.5 opacity-25 hover:opacity-50'}`}
              style={{ background: i === active ? slide.accentFrom : 'hsl(var(--muted-foreground))' }} />
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-12 pt-12 border-t border-border">
          {STATS.map((s, i) => (
            <div key={s.label} className={`text-center anim-rise d-${(i + 1) * 100}`}>
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-2xl font-sora font-black" style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {s.value}
              </div>
              <div className="text-xs text-muted-foreground font-medium mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;

