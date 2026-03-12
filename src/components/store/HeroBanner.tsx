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
    emoji: '🪟',
    features: ['Lifetime License', 'Instant Delivery', 'All Devices'],
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
    emoji: '📦',
    features: ['1TB OneDrive', '5 Devices', '1 Year'],
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
    accentFrom: 'hsl(0,80%,50%)',
    accentTo: 'hsl(0,70%,45%)',
    emoji: '🎬',
    features: ['4K Quality', 'Offline Mode', '1 Month'],
  },
];

const HeroBanner = () => {
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState<'in' | 'out'>('in');

  useEffect(() => {
    const timer = setInterval(() => advance(1), 6000);
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
    <section className="relative overflow-hidden" style={{ background: 'hsl(222, 22%, 8%)' }}>
      {/* Slide bg image overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{ background: `radial-gradient(ellipse at 80% 50%, ${slide.accentFrom}18 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, ${slide.accentTo}10 0%, transparent 50%)` }}
      />
      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, hsla(0,0%,100%,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 lg:pt-20 lg:pb-16">
        <div className="grid lg:grid-cols-[1fr_420px] gap-10 lg:gap-16 items-center">

          {/* Left Content */}
          <div className="space-y-6"
            style={{
              opacity: dir === 'in' ? 1 : 0,
              transform: dir === 'in' ? 'none' : 'translateY(12px)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-4 py-1.5 rounded-full text-white"
                style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})` }}>
                {slide.tag}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full font-fira"
                style={{ background: 'hsla(0,0%,100%,0.08)', border: '1px solid hsla(0,0%,100%,0.12)', color: 'hsla(0,0%,100%,0.5)' }}>
                {slide.badge}
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="font-sora font-black leading-[1.04] tracking-tight text-white" style={{ fontSize: 'clamp(2.6rem, 6vw, 4.2rem)' }}>
                {slide.title}{' '}
                <span style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {slide.titleAccent}
                </span>
              </h1>
              <p className="font-sora font-semibold text-xl mt-2" style={{ color: 'hsla(0,0%,100%,0.55)' }}>{slide.subtitle}</p>
            </div>

            <p className="text-[15px] leading-relaxed max-w-md" style={{ color: 'hsla(0,0%,100%,0.5)' }}>{slide.desc}</p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {slide.features.map(f => (
                <span key={f} className="flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-full"
                  style={{ background: 'hsla(0,0%,100%,0.07)', border: '1px solid hsla(0,0%,100%,0.1)', color: 'hsla(0,0%,100%,0.75)' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: slide.accentFrom }} />
                  {f}
                </span>
              ))}
            </div>

            {/* Price */}
            <div className="flex items-end gap-4">
              <span className="font-sora font-black text-white" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.5rem)' }}>{slide.price}</span>
              <div className="mb-1">
                <div className="text-sm line-through" style={{ color: 'hsla(0,0%,100%,0.3)' }}>{slide.original}</div>
                <span className="text-[11px] font-bold text-white px-2.5 py-1 rounded-full"
                  style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})` }}>
                  Save {slide.off} OFF
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 px-7 py-4 rounded-xl text-[14px] font-bold text-white transition-all hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})` }}>
                <ShoppingBag size={17} /> Order Now <ArrowRight size={15} />
              </button>
              <a href="/shop"
                className="flex items-center gap-2 px-6 py-4 rounded-xl text-[14px] font-semibold transition-all border"
                style={{ background: 'hsla(0,0%,100%,0.07)', borderColor: 'hsla(0,0%,100%,0.12)', color: 'hsla(0,0%,100%,0.8)' }}>
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
                <span key={t.text} className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: 'hsla(0,0%,100%,0.4)' }}>
                  <span style={{ color: slide.accentFrom }}>{t.icon}</span>
                  {t.text}
                </span>
              ))}
            </div>
          </div>

          {/* Right Visual — Product Card */}
          <div className="relative hidden lg:flex items-center justify-center min-h-[440px]">
            <div
              className="relative w-[340px] rounded-2xl overflow-hidden"
              style={{
                background: `linear-gradient(150deg, ${slide.accentFrom}, ${slide.accentTo})`,
                opacity: dir === 'in' ? 1 : 0,
                transform: dir === 'in' ? 'scale(1)' : 'scale(0.95)',
                transition: 'opacity 0.3s, transform 0.3s',
                boxShadow: `0 32px 80px ${slide.accentFrom}40`,
              }}>
              {/* Shimmer overlay */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(ellipse at 15% 15%, rgba(255,255,255,0.15) 0%, transparent 55%)' }} />
              <div className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

              <div className="relative p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    {slide.emoji}
                  </div>
                  <Sparkles size={18} className="opacity-40 mt-1" style={{ color: 'white' }} />
                </div>
                <div className="text-white/50 text-[10px] font-fira uppercase tracking-[0.2em] mb-2">Featured Deal</div>
                <div className="text-white font-sora font-black text-[22px] leading-tight">{slide.title} {slide.titleAccent}</div>
                <div className="text-white/70 text-sm mt-1 font-medium">{slide.subtitle}</div>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {slide.features.map(f => (
                    <span key={f} className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.2)' }}>
                      {f}
                    </span>
                  ))}
                </div>

                <div className="mt-6 pt-5 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                  <div>
                    <div className="text-white/40 text-xs line-through font-fira">{slide.original}</div>
                    <div className="text-white font-sora font-black text-[2rem] leading-none mt-0.5">{slide.price}</div>
                  </div>
                  <div className="rounded-xl px-4 py-3 text-center" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <div className="font-fira font-black text-[1.25rem] text-white leading-none">-{slide.off}</div>
                    <div className="text-[9px] text-white/60 uppercase tracking-wider mt-0.5">OFF</div>
                  </div>
                </div>

                <button className="mt-5 w-full py-3.5 rounded-xl bg-white font-bold text-sm hover:opacity-95 transition-colors"
                  style={{ color: slide.accentFrom }}>
                  Order Now →
                </button>
              </div>
            </div>

            {/* Floating stat cards */}
            {[
              { label: 'Orders Today', value: '248+', icon: '📦', top: '4%',  left: '-15%', right: 'auto', delay: '0s' },
              { label: 'Happy Users',  value: '12K+', icon: '😊', top: '50%', left: 'auto', right: '-15%', delay: '1.4s' },
              { label: 'Avg Rating',   value: '4.9★', icon: '⭐', top: '84%', left: '-13%', right: 'auto', delay: '2.8s' },
            ].map((card) => (
              <div key={card.label}
                className="absolute rounded-xl px-4 py-3 anim-float"
                style={{ top: card.top, left: card.left, right: card.right, animationDelay: card.delay, background: 'hsla(222,22%,18%,0.95)', border: '1px solid hsla(0,0%,100%,0.1)', backdropFilter: 'blur(12px)' }}>
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{card.icon}</span>
                  <div>
                    <div className="text-[15px] font-sora font-black text-white leading-none">{card.value}</div>
                    <div className="text-[10px] leading-none mt-0.5 font-medium" style={{ color: 'hsla(0,0%,100%,0.45)' }}>{card.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slider Controls */}
        <div className="flex items-center justify-center gap-4 mt-12">
          <button onClick={() => advance(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
            style={{ background: 'hsla(0,0%,100%,0.08)', border: '1px solid hsla(0,0%,100%,0.12)', color: 'hsla(0,0%,100%,0.6)' }}>
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => { setDir('out'); setTimeout(() => { setActive(i); setDir('in'); }, 280); }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === active ? '24px' : '7px',
                  height: '7px',
                  background: i === active ? slide.accentFrom : 'hsla(0,0%,100%,0.2)',
                }} />
            ))}
          </div>
          <button onClick={() => advance(1)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
            style={{ background: 'hsla(0,0%,100%,0.08)', border: '1px solid hsla(0,0%,100%,0.12)', color: 'hsla(0,0%,100%,0.6)' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
