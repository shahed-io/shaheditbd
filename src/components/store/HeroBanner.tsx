import { useState, useEffect } from 'react';
import { ArrowRight, ShoppingBag, Zap, Shield, Clock, Star, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';

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
    // Purple/Indigo theme
    bgFrom:      'hsla(243,60%,88%,1)',
    bgMid:       'hsla(252,55%,84%,1)',
    bgTo:        'hsla(225,50%,91%,1)',
    accentFrom:  'hsl(243,75%,52%)',
    accentTo:    'hsl(263,72%,48%)',
    badgeBg:     'hsl(243,75%,52%)',
    dotColor:    'hsl(243,75%,52%)',
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
    // Orange/Peach theme
    bgFrom:      'hsla(28,100%,97%,1)',
    bgMid:       'hsla(20,90%,95%,1)',
    bgTo:        'hsla(40,80%,98%,1)',
    accentFrom:  'hsl(20,100%,55%)',
    accentTo:    'hsl(38,100%,52%)',
    badgeBg:     'hsl(20,100%,55%)',
    dotColor:    'hsl(20,100%,55%)',
    emoji: '📦',
    features: ['1TB OneDrive', '5 Devices', '1 Year'],
  },
];

const STATS = [
  { label: 'Products',         value: '500+', icon: '🛍️' },
  { label: 'Orders Delivered', value: '25K+', icon: '✅' },
  { label: 'Happy Customers',  value: '12K+', icon: '😊' },
  { label: 'Support Rating',   value: '4.9★', icon: '⭐' },
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
    <section className="relative overflow-hidden" style={{
      background: `linear-gradient(135deg, ${slide.bgFrom} 0%, ${slide.bgMid} 50%, ${slide.bgTo} 100%)`,
      transition: 'background 0.6s ease',
    }}>
      {/* Subtle dot pattern overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-40"
        style={{ backgroundImage: `radial-gradient(circle, ${slide.accentFrom}18 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 lg:pt-20 lg:pb-14">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

          {/* ── Left Content ── */}
          <div className="space-y-6"
            style={{
              opacity:    dir === 'in' ? 1 : 0,
              transform:  dir === 'in' ? 'none' : 'translateY(14px)',
              transition: 'opacity 0.32s ease, transform 0.32s ease',
            }}>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-4 py-1.5 rounded-full text-white"
                style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`, boxShadow: `0 4px 14px ${slide.accentFrom}50` }}>
                {slide.tag}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full"
                style={{ background: `${slide.accentFrom}15`, border: `1px solid ${slide.accentFrom}30`, color: slide.accentFrom }}>
                {slide.badge}
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="font-sora font-black leading-[1.05] tracking-tight" style={{ fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', color: 'hsl(226,35%,12%)' }}>
                {slide.title}{' '}
                <span style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {slide.titleAccent}
                </span>
              </h1>
              <p className="font-sora font-semibold text-xl mt-2" style={{ color: 'hsl(226,20%,40%)' }}>{slide.subtitle}</p>
            </div>

            <p className="text-[15px] leading-relaxed max-w-md" style={{ color: 'hsl(226,15%,50%)' }}>{slide.desc}</p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {slide.features.map(f => (
                <span key={f} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-full"
                  style={{ background: 'hsl(0,0%,100%)', border: `1.5px solid ${slide.accentFrom}25`, color: 'hsl(226,25%,30%)', boxShadow: '0 2px 8px hsla(226,20%,50%,0.08)' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: slide.dotColor }} />
                  {f}
                </span>
              ))}
            </div>

            {/* Price */}
            <div className="flex items-end gap-4">
              <span className="font-sora font-black" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', color: 'hsl(226,35%,12%)' }}>{slide.price}</span>
              <div className="mb-1.5">
                <div className="text-sm line-through" style={{ color: 'hsl(226,15%,55%)' }}>{slide.original}</div>
                <span className="text-[11px] font-bold text-white px-3 py-1 rounded-full"
                  style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})` }}>
                  Save {slide.off} OFF
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-[14px] font-bold text-white transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`, boxShadow: `0 8px 24px ${slide.accentFrom}45` }}>
                <ShoppingBag size={16} /> Order Now <ArrowRight size={15} />
              </button>
              <a href="/shop"
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[14px] font-semibold transition-all hover:scale-[1.02]"
                style={{ background: 'hsl(0,0%,100%)', border: `1.5px solid ${slide.accentFrom}30`, color: 'hsl(226,25%,30%)', boxShadow: '0 4px 12px hsla(226,20%,50%,0.10)' }}>
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
                <span key={t.text} className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: 'hsl(226,15%,50%)' }}>
                  <span style={{ color: slide.accentFrom }}>{t.icon}</span>
                  {t.text}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right Visual Card ── */}
          <div className="relative hidden lg:flex items-center justify-center min-h-[440px]">
            <div
              className="relative w-[300px] rounded-[2rem] overflow-hidden anim-float"
              style={{
                background: `linear-gradient(150deg, ${slide.accentFrom}ee, ${slide.accentTo}dd)`,
                boxShadow: `0 32px 80px ${slide.accentFrom}35, 0 0 0 1px ${slide.accentFrom}20`,
                opacity:    dir === 'in' ? 1 : 0,
                transform:  dir === 'in' ? 'scale(1)' : 'scale(0.95)',
                transition: 'opacity 0.32s, transform 0.32s',
              }}>
              <div className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(ellipse at 15% 15%, rgba(255,255,255,0.25) 0%, transparent 55%)' }} />

              <div className="relative p-8">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mb-6"
                  style={{ background: 'hsla(0,0%,100%,0.22)', border: '1px solid hsla(0,0%,100%,0.3)' }}>
                  {slide.emoji}
                </div>

                <div className="text-white/60 text-[10px] font-fira uppercase tracking-[0.2em] mb-1">Featured Deal</div>
                <div className="text-white font-sora font-black text-[22px] leading-tight">{slide.title} {slide.titleAccent}</div>
                <div className="text-white/75 text-sm mt-1 font-medium">{slide.subtitle}</div>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {slide.features.map(f => (
                    <span key={f} className="text-[10px] font-bold text-white/85 px-2.5 py-1 rounded-full"
                      style={{ background: 'hsla(0,0%,100%,0.18)', border: '1px solid hsla(0,0%,100%,0.25)' }}>{f}</span>
                  ))}
                </div>

                <div className="mt-6 pt-5 flex items-center justify-between" style={{ borderTop: '1px solid hsla(0,0%,100%,0.18)' }}>
                  <div>
                    <div className="text-white/50 text-xs line-through font-fira">{slide.original}</div>
                    <div className="text-white font-sora font-black text-[2rem] leading-none mt-0.5">{slide.price}</div>
                  </div>
                  <div className="rounded-2xl px-4 py-3 text-center"
                    style={{ background: 'hsla(0,0%,100%,0.18)', border: '1px solid hsla(0,0%,100%,0.25)' }}>
                    <div className="font-fira font-black text-[1.2rem] text-white leading-none">-{slide.off}</div>
                    <div className="text-[9px] text-white/55 uppercase tracking-wider mt-0.5">OFF</div>
                  </div>
                </div>

                <button className="mt-5 w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
                  style={{ background: 'hsla(0,0%,100%,0.95)', color: slide.accentFrom }}>
                  Order Now →
                </button>
              </div>
            </div>

            {/* Floating stat cards */}
            {[
              { label: 'Orders Today', value: '248+', icon: '📦', top: '4%',  left: '-18%', right: 'auto', delay: '0s' },
              { label: 'Happy Users',  value: '12K+', icon: '😊', top: '46%', left: 'auto',  right: '-18%', delay: '1.4s' },
              { label: 'Avg Rating',   value: '4.9★', icon: '⭐', top: '82%', left: '-16%', right: 'auto', delay: '2.8s' },
            ].map((card) => (
              <div key={card.label}
                className="absolute rounded-2xl px-4 py-3 anim-float"
                style={{
                  top: card.top, left: card.left, right: card.right, animationDelay: card.delay,
                  background: 'hsl(0,0%,100%)',
                  boxShadow: '0 8px 24px hsla(226,30%,50%,0.14)',
                  border: '1px solid hsla(226,20%,85%,0.6)',
                }}>
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{card.icon}</span>
                  <div>
                    <div className="text-[15px] font-sora font-black leading-none" style={{ color: 'hsl(226,35%,12%)' }}>{card.value}</div>
                    <div className="text-[10px] leading-none mt-0.5 font-medium" style={{ color: 'hsl(226,15%,50%)' }}>{card.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slider Controls */}
        <div className="flex items-center justify-center gap-4 mt-14">
          <button onClick={() => advance(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'hsl(0,0%,100%)', border: `1.5px solid ${slide.accentFrom}30`, color: 'hsl(226,25%,40%)', boxShadow: '0 2px 8px hsla(226,20%,50%,0.10)' }}>
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => { setDir('out'); setTimeout(() => { setActive(i); setDir('in'); }, 280); }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === active ? '28px' : '8px',
                  height: '8px',
                  background: i === active ? slide.accentFrom : 'hsla(226,20%,70%,0.4)',
                  boxShadow: i === active ? `0 0 8px ${slide.accentFrom}70` : 'none',
                }} />
            ))}
          </div>
          <button onClick={() => advance(1)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'hsl(0,0%,100%)', border: `1.5px solid ${slide.accentFrom}30`, color: 'hsl(226,25%,40%)', boxShadow: '0 2px 8px hsla(226,20%,50%,0.10)' }}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-12 pt-12" style={{ borderTop: `1px solid ${slide.accentFrom}20` }}>
          {STATS.map((s) => (
            <div key={s.label} className="group text-center cursor-default">
              <div className="text-3xl mb-2 transition-transform duration-300 group-hover:scale-110">{s.icon}</div>
              <div className="text-[1.7rem] font-sora font-black leading-none"
                style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {s.value}
              </div>
              <div className="text-[11px] font-semibold mt-1.5 uppercase tracking-wider" style={{ color: 'hsl(226,15%,50%)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
