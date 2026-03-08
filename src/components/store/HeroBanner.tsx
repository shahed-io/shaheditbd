import { useState, useEffect } from 'react';
import { ArrowRight, ShoppingBag, Zap, Shield, Clock, Star, ChevronLeft, ChevronRight, Sparkles, TrendingUp } from 'lucide-react';

const SLIDES = [
  {
    tag: '🔥 Best Seller',
    title: 'Windows 11',
    titleAccent: 'Pro',
    subtitle: 'Original License Key',
    desc: 'Genuine Microsoft Windows 11 Pro — instant digital delivery to your inbox within minutes.',
    price: '৳599',
    original: '৳9,999',
    off: '94%',
    badge: 'MOST POPULAR',
    accentFrom: 'hsl(243,75%,59%)',
    accentTo: 'hsl(263,70%,58%)',
    bgFrom: 'hsla(243,75%,59%,0.06)',
    bgTo: 'hsla(263,70%,58%,0.04)',
    emoji: '🪟',
    features: ['Lifetime License', 'Instant Delivery', 'All Devices'],
    tag2color: 'hsl(243,75%,59%)',
  },
  {
    tag: '⚡ Flash Deal',
    title: 'Microsoft',
    titleAccent: '365',
    subtitle: 'Personal — 1 Year',
    desc: 'Full Office suite: Word, Excel, PowerPoint, OneDrive 1TB. Premium productivity tools.',
    price: '৳1,999',
    original: '৳16,500',
    off: '88%',
    badge: 'LIMITED TIME',
    accentFrom: 'hsl(15,100%,60%)',
    accentTo: 'hsl(38,100%,55%)',
    bgFrom: 'hsla(15,100%,60%,0.06)',
    bgTo: 'hsla(38,100%,55%,0.04)',
    emoji: '📦',
    features: ['1TB OneDrive', '5 Devices', '1 Year'],
    tag2color: 'hsl(15,100%,60%)',
  },
  {
    tag: '🎬 Streaming',
    title: 'Netflix',
    titleAccent: 'Premium',
    subtitle: '4K Ultra HD',
    desc: 'Netflix Premium — 4K Ultra HD streaming, download offline, screen sharing supported.',
    price: '৳499',
    original: '৳2,600',
    off: '81%',
    badge: 'HOT DEAL',
    accentFrom: 'hsl(158,64%,42%)',
    accentTo: 'hsl(180,70%,40%)',
    bgFrom: 'hsla(158,64%,42%,0.06)',
    bgTo: 'hsla(180,70%,40%,0.04)',
    emoji: '🎬',
    features: ['4K Quality', 'Offline Mode', '1 Month'],
    tag2color: 'hsl(158,64%,42%)',
  },
];

const STATS = [
  { label: 'Products',          value: '500+',  icon: '🛍️', color: 'hsl(243,75%,59%)' },
  { label: 'Orders Delivered',  value: '25K+',  icon: '✅', color: 'hsl(158,64%,42%)' },
  { label: 'Happy Customers',   value: '12K+',  icon: '😊', color: 'hsl(15,100%,60%)' },
  { label: 'Support Rating',    value: '4.9★',  icon: '⭐', color: 'hsl(38,100%,55%)' },
];

const HeroBanner = () => {
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState<'in' | 'out'>('in');

  useEffect(() => {
    const timer = setInterval(() => advance(1), 5500);
    return () => clearInterval(timer);
  }, [active]);

  const advance = (delta: number) => {
    setDir('out');
    setTimeout(() => {
      setActive(p => (p + delta + SLIDES.length) % SLIDES.length);
      setDir('in');
    }, 280);
  };

  const slide = SLIDES[active];

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 transition-all duration-700"
          style={{ background: `radial-gradient(ellipse at 75% 40%, ${slide.bgFrom} 0%, transparent 55%), radial-gradient(ellipse at 25% 80%, ${slide.bgTo} 0%, transparent 50%)` }} />
        <div className="absolute top-0 right-0 w-[560px] h-[560px] blob opacity-25"
          style={{ background: `radial-gradient(circle, ${slide.accentFrom}22, transparent)` }} />
        <div className="absolute bottom-0 left-[-50px] w-96 h-96 blob opacity-15"
          style={{ background: `radial-gradient(circle, ${slide.accentTo}1a, transparent)`, animationDelay: '4s' }} />
        {/* Subtle grid */}
        <div className="absolute inset-0 dot-grid opacity-40" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 lg:pt-20 lg:pb-14">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

          {/* Left Content */}
          <div className="space-y-7"
            style={{
              opacity:    dir === 'in' ? 1 : 0,
              transform:  dir === 'in' ? 'none' : 'translateY(12px)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-4 py-1.5 rounded-full text-white"
                style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`, boxShadow: `0 4px 16px ${slide.accentFrom}40` }}>
                {slide.tag}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border font-fira text-muted-foreground bg-white/80 border-border/60 shadow-soft">
                {slide.badge}
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="font-sora font-black leading-[1.04] tracking-tight text-foreground" style={{ fontSize: 'clamp(2.8rem, 6vw, 4.5rem)' }}>
                {slide.title}{' '}
                <span style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {slide.titleAccent}
                </span>
              </h1>
              <p className="font-sora font-semibold text-xl lg:text-2xl mt-2 text-muted-foreground">{slide.subtitle}</p>
            </div>

            <p className="text-muted-foreground text-[15px] leading-relaxed max-w-md">{slide.desc}</p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {slide.features.map(f => (
                <span key={f} className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground bg-white/90 border border-border/70 px-4 py-2 rounded-full shadow-soft backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: slide.accentFrom }} />
                  {f}
                </span>
              ))}
            </div>

            {/* Price */}
            <div className="flex items-end gap-4">
              <span className="font-sora font-black text-foreground" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)' }}>{slide.price}</span>
              <div className="mb-1">
                <div className="text-sm text-muted-foreground line-through">{slide.original}</div>
                <span className="text-[11px] font-bold text-white px-2.5 py-1 rounded-full"
                  style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})` }}>
                  Save {slide.off} OFF
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 px-7 py-4 rounded-2xl text-[14px] font-bold text-white transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`, boxShadow: `0 8px 24px ${slide.accentFrom}45` }}>
                <ShoppingBag size={17} /> Order Now <ArrowRight size={15} />
              </button>
              <a href="/shop"
                className="flex items-center gap-2 px-6 py-4 rounded-2xl text-[14px] font-semibold bg-white/90 backdrop-blur-sm border border-border/70 text-foreground hover:border-foreground/25 hover:shadow-medium transition-all">
                <TrendingUp size={15} /> View All Deals
              </a>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap gap-5 pt-1">
              {[
                { icon: <Zap size={13} />, text: 'Instant Delivery' },
                { icon: <Shield size={13} />, text: '100% Genuine' },
                { icon: <Clock size={13} />, text: '24/7 Support' },
                { icon: <Star size={13} />, text: '4.9★ Rating' },
              ].map(t => (
                <span key={t.text} className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground">
                  <span style={{ color: slide.accentFrom }}>{t.icon}</span>
                  {t.text}
                </span>
              ))}
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative hidden lg:flex items-center justify-center min-h-[440px]">
            {/* Main Product Card */}
            <div
              className="relative w-[300px] rounded-[2rem] overflow-hidden anim-float shadow-[0_32px_80px_hsla(230,25%,10%,0.18)]"
              style={{
                background: `linear-gradient(150deg, ${slide.accentFrom}, ${slide.accentTo})`,
                opacity:    dir === 'in' ? 1 : 0,
                transform:  dir === 'in' ? 'scale(1)' : 'scale(0.95)',
                transition: 'opacity 0.3s, transform 0.3s',
              }}>
              {/* Shimmer overlay */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(ellipse at 15% 15%, rgba(255,255,255,0.18) 0%, transparent 55%)' }} />
              {/* Dots pattern */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

              <div className="relative p-8">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl shadow-soft">
                    {slide.emoji}
                  </div>
                  <Sparkles size={18} className="text-white/40 anim-spin-slow mt-1" />
                </div>
                <div className="text-white/60 text-[10px] font-fira uppercase tracking-[0.2em] mb-2">Featured Deal</div>
                <div className="text-white font-sora font-black text-[22px] leading-tight">{slide.title} {slide.titleAccent}</div>
                <div className="text-white/75 text-sm mt-1 font-medium">{slide.subtitle}</div>

                {/* Feature chips */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {slide.features.map(f => (
                    <span key={f} className="text-[10px] font-bold text-white/80 bg-white/12 border border-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">{f}</span>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-white/15 flex items-center justify-between">
                  <div>
                    <div className="text-white/50 text-xs line-through font-fira">{slide.original}</div>
                    <div className="text-white font-sora font-black text-[2rem] leading-none mt-0.5">{slide.price}</div>
                  </div>
                  <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 text-center border border-white/20">
                    <div className="font-fira font-black text-[1.25rem] text-white leading-none">-{slide.off}</div>
                    <div className="text-[9px] text-white/60 uppercase tracking-wider mt-0.5">OFF</div>
                  </div>
                </div>

                <button className="mt-5 w-full py-3.5 rounded-xl bg-white font-bold text-sm hover:bg-white/95 transition-colors"
                  style={{ color: slide.accentFrom }}>
                  Order Now →
                </button>
              </div>
            </div>

            {/* Floating stat cards */}
            {[
              { label: 'Orders Today', value: '248+', icon: '📦', top: '4%',   left: '-18%', right: 'auto', delay: '0s' },
              { label: 'Happy Users',  value: '12K+', icon: '😊', top: '46%',  left: 'auto',  right: '-18%', delay: '1.4s' },
              { label: 'Avg Rating',   value: '4.9★', icon: '⭐', top: '82%',  left: '-16%', right: 'auto', delay: '2.8s' },
            ].map((card) => (
              <div key={card.label}
                className="absolute glass-white rounded-2xl px-4 py-3 anim-float"
                style={{ top: card.top, left: card.left, right: card.right, animationDelay: card.delay }}>
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{card.icon}</span>
                  <div>
                    <div className="text-[15px] font-sora font-black text-foreground leading-none">{card.value}</div>
                    <div className="text-[10px] text-muted-foreground leading-none mt-0.5 font-medium">{card.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slider Controls */}
        <div className="flex items-center justify-center gap-4 mt-14">
          <button onClick={() => advance(-1)}
            className="w-9 h-9 rounded-full bg-white border border-border/70 shadow-soft flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => { setDir('out'); setTimeout(() => { setActive(i); setDir('in'); }, 280); }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === active ? '28px' : '8px',
                  height: '8px',
                  background: i === active ? slide.accentFrom : 'hsl(var(--muted-foreground))',
                  opacity: i === active ? 1 : 0.28,
                }} />
            ))}
          </div>
          <button onClick={() => advance(1)}
            className="w-9 h-9 rounded-full bg-white border border-border/70 shadow-soft flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-12 pt-12 border-t border-border/50">
          {STATS.map((s, i) => (
            <div key={s.label} className="group text-center cursor-default">
              <div className="text-3xl mb-2 transition-transform duration-300 group-hover:scale-110">{s.icon}</div>
              <div className="text-[1.7rem] font-sora font-black leading-none"
                style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {s.value}
              </div>
              <div className="text-[11px] text-muted-foreground font-semibold mt-1.5 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
