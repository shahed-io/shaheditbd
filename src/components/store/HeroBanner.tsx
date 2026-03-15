import { useState, useEffect } from 'react';
import { ArrowRight, ShoppingBag, Zap, Shield, Clock, Star, ChevronLeft, ChevronRight, TrendingUp, Check } from 'lucide-react';

const SLIDES = [
  /* ── Banner 1: Windows 11 Pro — Deep Royal Blue ── */
  {
    tag: '🔥 Best Seller',
    badge: 'MOST POPULAR',
    title: 'Windows 11',
    titleAccent: 'Pro',
    subtitle: 'Original License Key',
    desc: 'Genuine Microsoft Windows 11 Pro — instant digital delivery to your inbox within minutes.',
    price: '৳599',
    original: '৳9,999',
    off: '94%',
    emoji: '🪟',
    features: ['Lifetime License', 'Instant Delivery', 'All Devices'],
    highlights: ['Activate in 2 min', 'Global Key', 'Free Support'],
    // Deep Royal Blue gradient
    bg: 'linear-gradient(135deg, hsl(228,55%,18%) 0%, hsl(240,62%,22%) 45%, hsl(250,58%,16%) 100%)',
    cardBg: 'linear-gradient(145deg, hsl(240,70%,28%), hsl(255,65%,32%))',
    accentFrom: 'hsl(243,88%,68%)',
    accentTo: 'hsl(210,90%,62%)',
    badgeBg: 'linear-gradient(135deg, hsl(243,88%,68%), hsl(210,90%,62%))',
    pillBg: 'hsla(240,60%,60%,0.18)',
    pillBorder: 'hsla(240,70%,70%,0.25)',
    textMain: 'hsl(220,40%,96%)',
    textSub: 'hsl(225,30%,78%)',
    textMuted: 'hsl(225,25%,62%)',
    dotPattern: 'hsla(240,80%,70%,0.10)',
    glowColor: 'hsla(243,80%,60%,0.35)',
  },
  /* ── Banner 2: Adobe Creative Cloud — Deep Crimson Red ── */
  {
    tag: '🎨 Pro Design',
    badge: 'ALL APPS',
    title: 'Adobe Creative',
    titleAccent: 'Cloud',
    subtitle: 'All Apps — 1 Year Subscription',
    desc: 'Photoshop, Illustrator, Premiere Pro, After Effects and 20+ more. Unlock your creativity.',
    price: '৳599',
    original: '৳2,000',
    off: '70%',
    emoji: '🎨',
    features: ['20+ Apps', '100GB Cloud', '1 Year'],
    highlights: ['Photoshop', 'Premiere Pro', 'Illustrator'],
    // Deep Crimson + Dark gradient
    bg: 'linear-gradient(135deg, hsl(8,60%,15%) 0%, hsl(16,65%,18%) 45%, hsl(340,55%,14%) 100%)',
    cardBg: 'linear-gradient(145deg, hsl(8,72%,25%), hsl(20,68%,28%))',
    accentFrom: 'hsl(10,92%,62%)',
    accentTo: 'hsl(28,95%,58%)',
    badgeBg: 'linear-gradient(135deg, hsl(10,92%,62%), hsl(28,95%,58%))',
    pillBg: 'hsla(10,70%,55%,0.18)',
    pillBorder: 'hsla(15,75%,60%,0.28)',
    textMain: 'hsl(15,40%,96%)',
    textSub: 'hsl(15,25%,78%)',
    textMuted: 'hsl(15,20%,62%)',
    dotPattern: 'hsla(10,80%,60%,0.10)',
    glowColor: 'hsla(10,85%,55%,0.35)',
  },
  /* ── Banner 3: Netflix Premium — Deep Teal/Emerald ── */
  {
    tag: '🎬 Streaming',
    badge: 'PREMIUM 4K',
    title: 'Netflix',
    titleAccent: 'Premium',
    subtitle: '4K UHD — 4 Screens',
    desc: 'Watch unlimited movies, TV series in 4K Ultra HD. Share with up to 4 people simultaneously.',
    price: '৳499',
    original: '৳2,600',
    off: '81%',
    emoji: '🎬',
    features: ['4K Ultra HD', '4 Screens', '1 Month'],
    highlights: ['Dolby Atmos', 'Download & Watch', 'All Devices'],
    // Deep Emerald/Teal gradient
    bg: 'linear-gradient(135deg, hsl(162,60%,12%) 0%, hsl(175,58%,15%) 45%, hsl(150,52%,12%) 100%)',
    cardBg: 'linear-gradient(145deg, hsl(162,65%,20%), hsl(178,60%,23%))',
    accentFrom: 'hsl(162,80%,48%)',
    accentTo: 'hsl(180,78%,44%)',
    badgeBg: 'linear-gradient(135deg, hsl(162,80%,48%), hsl(180,78%,44%))',
    pillBg: 'hsla(162,65%,45%,0.18)',
    pillBorder: 'hsla(165,70%,50%,0.28)',
    textMain: 'hsl(165,40%,96%)',
    textSub: 'hsl(165,25%,78%)',
    textMuted: 'hsl(165,20%,62%)',
    dotPattern: 'hsla(162,75%,55%,0.10)',
    glowColor: 'hsla(162,75%,45%,0.35)',
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
    }, 300);
  };

  const slide = SLIDES[active];

  return (
    <section className="relative overflow-hidden min-h-[560px]" style={{ background: slide.bg, transition: 'background 0.7s ease' }}>

      {/* Dot pattern */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: `radial-gradient(circle, ${slide.dotPattern} 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />

      {/* Radial glow top-right */}
      <div className="absolute top-[-80px] right-[-80px] w-[500px] h-[500px] pointer-events-none rounded-full"
        style={{ background: `radial-gradient(circle, ${slide.glowColor} 0%, transparent 65%)`, transition: 'background 0.7s ease' }} />

      {/* Bottom left glow */}
      <div className="absolute bottom-[-60px] left-[-60px] w-[380px] h-[380px] pointer-events-none rounded-full"
        style={{ background: `radial-gradient(circle, ${slide.glowColor.replace('0.35', '0.18')} 0%, transparent 65%)`, transition: 'background 0.7s ease' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 lg:pt-20 lg:pb-14">
        <div className="grid lg:grid-cols-[1fr_400px] gap-14 lg:gap-12 items-center">

          {/* ── LEFT CONTENT ── */}
          <div className="space-y-6"
            style={{
              opacity:    dir === 'in' ? 1 : 0,
              transform:  dir === 'in' ? 'translateY(0px)' : 'translateY(16px)',
              transition: 'opacity 0.32s ease, transform 0.32s ease',
            }}>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-4 py-1.5 rounded-full text-white"
                style={{ background: slide.badgeBg, boxShadow: `0 4px 16px ${slide.accentFrom}55` }}>
                {slide.tag}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full"
                style={{ background: slide.pillBg, border: `1px solid ${slide.pillBorder}`, color: slide.accentFrom }}>
                {slide.badge}
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="font-sora font-black leading-[1.04] tracking-tight" style={{ fontSize: 'clamp(2.6rem, 5.5vw, 4.2rem)', color: slide.textMain }}>
                {slide.title}{' '}
                <span style={{
                  background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  {slide.titleAccent}
                </span>
              </h1>
              <p className="font-sora font-semibold text-xl mt-2" style={{ color: slide.textSub }}>{slide.subtitle}</p>
            </div>

            <p className="text-[15px] leading-relaxed max-w-lg" style={{ color: slide.textMuted }}>{slide.desc}</p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {slide.features.map(f => (
                <span key={f} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-full"
                  style={{ background: slide.pillBg, border: `1px solid ${slide.pillBorder}`, color: slide.textSub, backdropFilter: 'blur(8px)' }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: slide.accentFrom }} />
                  {f}
                </span>
              ))}
            </div>

            {/* Price block */}
            <div className="flex items-end gap-4">
              <span className="font-sora font-black" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.4rem)', color: slide.textMain }}>{slide.price}</span>
              <div className="mb-1.5 space-y-1">
                <div className="text-sm line-through" style={{ color: slide.textMuted }}>{slide.original}</div>
                <span className="text-[11px] font-bold text-white px-3 py-1 rounded-full"
                  style={{ background: slide.badgeBg }}>
                  Save {slide.off} OFF
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-[14px] font-bold text-white transition-all duration-200 hover:scale-[1.04] active:scale-[0.97]"
                style={{ background: slide.badgeBg, boxShadow: `0 10px 30px ${slide.accentFrom}50` }}>
                <ShoppingBag size={16} /> Order Now <ArrowRight size={15} />
              </button>
              <a href="/shop"
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[14px] font-semibold transition-all duration-200 hover:scale-[1.02]"
                style={{ background: slide.pillBg, border: `1.5px solid ${slide.pillBorder}`, color: slide.textSub, backdropFilter: 'blur(12px)' }}>
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
                <span key={t.text} className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: slide.textMuted }}>
                  <span style={{ color: slide.accentFrom }}>{t.icon}</span>
                  {t.text}
                </span>
              ))}
            </div>
          </div>

          {/* ── RIGHT CARD ── */}
          <div className="relative hidden lg:flex items-center justify-center min-h-[440px]">
            <div className="relative w-[300px] rounded-[2rem] overflow-hidden anim-float"
              style={{
                background: slide.cardBg,
                boxShadow: `0 32px 80px ${slide.accentFrom}35, 0 0 0 1px ${slide.accentFrom}20, inset 0 1px 0 hsla(0,0%,100%,0.15)`,
                opacity:    dir === 'in' ? 1 : 0,
                transform:  dir === 'in' ? 'scale(1) translateY(0px)' : 'scale(0.94) translateY(8px)',
                transition: 'opacity 0.32s, transform 0.32s',
              }}>

              {/* Glass shine */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(ellipse at 20% 12%, rgba(255,255,255,0.22) 0%, transparent 55%)' }} />

              <div className="relative p-8">
                {/* Emoji icon */}
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mb-5"
                  style={{ background: 'hsla(0,0%,100%,0.14)', border: '1px solid hsla(0,0%,100%,0.22)' }}>
                  {slide.emoji}
                </div>

                <div className="text-[10px] font-fira uppercase tracking-[0.18em] mb-1" style={{ color: 'hsla(0,0%,100%,0.5)' }}>Featured Deal</div>
                <div className="text-white font-sora font-black text-[20px] leading-tight">{slide.title} {slide.titleAccent}</div>
                <div className="text-sm mt-1 font-medium" style={{ color: 'hsla(0,0%,100%,0.65)' }}>{slide.subtitle}</div>

                {/* Highlights with checkmarks */}
                <div className="mt-4 space-y-1.5">
                  {slide.highlights.map(h => (
                    <div key={h} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'hsla(0,0%,100%,0.18)' }}>
                        <Check size={9} className="text-white" />
                      </div>
                      <span className="text-[11.5px] font-medium" style={{ color: 'hsla(0,0%,100%,0.80)' }}>{h}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-5 flex items-center justify-between" style={{ borderTop: '1px solid hsla(0,0%,100%,0.14)' }}>
                  <div>
                    <div className="text-xs line-through font-fira" style={{ color: 'hsla(0,0%,100%,0.42)' }}>{slide.original}</div>
                    <div className="text-white font-sora font-black text-[2rem] leading-none mt-0.5">{slide.price}</div>
                  </div>
                  <div className="rounded-2xl px-3.5 py-2.5 text-center"
                    style={{ background: 'hsla(0,0%,100%,0.16)', border: '1px solid hsla(0,0%,100%,0.22)' }}>
                    <div className="font-fira font-black text-[1.15rem] text-white leading-none">-{slide.off}</div>
                    <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: 'hsla(0,0%,100%,0.50)' }}>OFF</div>
                  </div>
                </div>

                <button className="mt-5 w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                  style={{ background: 'hsla(0,0%,100%,0.92)', color: slide.accentFrom }}>
                  Order Now →
                </button>
              </div>
            </div>

            {/* Floating stat cards */}
            {[
              { label: 'Orders Today', value: '248+', icon: '📦', top: '2%',  left: '-20%', right: 'auto', delay: '0s' },
              { label: 'Happy Users',  value: '12K+', icon: '😊', top: '44%', left: 'auto',  right: '-20%', delay: '1.5s' },
              { label: 'Avg Rating',   value: '4.9★', icon: '⭐', top: '84%', left: '-18%', right: 'auto', delay: '3s' },
            ].map(card => (
              <div key={card.label}
                className="absolute rounded-2xl px-4 py-3 anim-float"
                style={{
                  top: card.top, left: card.left, right: card.right, animationDelay: card.delay,
                  background: 'hsla(0,0%,100%,0.10)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid hsla(0,0%,100%,0.18)',
                  boxShadow: '0 8px 24px hsla(0,0%,0%,0.20)',
                }}>
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{card.icon}</span>
                  <div>
                    <div className="text-[15px] font-sora font-black leading-none text-white">{card.value}</div>
                    <div className="text-[10px] leading-none mt-0.5 font-medium" style={{ color: 'hsla(0,0%,100%,0.60)' }}>{card.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Slider Controls ── */}
        <div className="flex items-center justify-center gap-4 mt-14">
          <button onClick={() => advance(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'hsla(0,0%,100%,0.10)', border: `1px solid ${slide.pillBorder}`, color: slide.textSub }}>
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            {SLIDES.map((s, i) => (
              <button key={i}
                onClick={() => { setDir('out'); setTimeout(() => { setActive(i); setDir('in'); }, 300); }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === active ? '30px' : '8px', height: '8px',
                  background: i === active
                    ? `linear-gradient(135deg, ${s.accentFrom}, ${s.accentTo})`
                    : 'hsla(0,0%,100%,0.22)',
                  boxShadow: i === active ? `0 0 10px ${s.accentFrom}90` : 'none',
                }} />
            ))}
          </div>
          <button onClick={() => advance(1)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'hsla(0,0%,100%,0.10)', border: `1px solid ${slide.pillBorder}`, color: slide.textSub }}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-12 pt-12"
          style={{ borderTop: '1px solid hsla(0,0%,100%,0.10)' }}>
          {STATS.map(s => (
            <div key={s.label} className="group text-center cursor-default">
              <div className="text-3xl mb-2 transition-transform duration-300 group-hover:scale-110">{s.icon}</div>
              <div className="text-[1.7rem] font-sora font-black leading-none"
                style={{
                  background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                {s.value}
              </div>
              <div className="text-[11px] font-semibold mt-1.5 uppercase tracking-wider" style={{ color: slide.textMuted }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
