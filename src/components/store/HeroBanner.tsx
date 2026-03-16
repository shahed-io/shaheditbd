import { useState, useEffect } from 'react';
import { ArrowRight, ShoppingBag, Zap, Shield, Clock, Star, ChevronLeft, ChevronRight, Sparkles, TrendingUp, Award } from 'lucide-react';
import idmLogo from '@/assets/idm.webp';
import { useHeroBanner, type SlideData } from '@/hooks/useHeroBanner';

type ComboItem = { icon: string; name: string; tag: string; color: string; highlight?: boolean };
type Slide = {
  tag: string; title: string; titleAccent: string; subtitle: string; desc: string;
  price: string; original: string; off: string; badge: string;
  accentFrom: string; accentTo: string; glowFrom: string; glowTo: string;
  emoji: string; logoImg?: string; features: string[]; comboSlide: boolean; combo?: ComboItem[];
  productSlug?: string;
};

const STATIC_SLIDES: Slide[] = [
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
    accentFrom: 'hsl(243,75%,55%)',
    accentTo: 'hsl(263,70%,52%)',
    glowFrom: 'hsla(243,75%,62%,0.18)',
    glowTo: 'hsla(263,70%,60%,0.10)',
    emoji: '🪟',
    features: ['Lifetime License', 'Instant Delivery', 'All Devices'],
    comboSlide: false,
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
    accentFrom: 'hsl(15,100%,55%)',
    accentTo: 'hsl(38,100%,50%)',
    glowFrom: 'hsla(15,100%,60%,0.18)',
    glowTo: 'hsla(38,100%,55%,0.10)',
    emoji: '📦',
    features: ['1TB OneDrive', '5 Devices', '1 Year'],
    comboSlide: false,
  },
  {
    tag: '🏆 Official Reseller',
    title: 'IDM',
    titleAccent: 'Lifetime',
    subtitle: 'Internet Download Manager — Lifetime License',
    desc: 'আমরা IDM-এর অফিশিয়াল রিসেলার। একবার কিনুন, সারাজীবন ব্যবহার করুন — কোনো বার্ষিক ফি নেই।',
    price: '৳2,650',
    original: '৳6,500',
    off: '59%',
    badge: 'OFFICIAL RESELLER',
    accentFrom: 'hsl(185,80%,38%)',
    accentTo: 'hsl(210,85%,45%)',
    glowFrom: 'hsla(185,80%,45%,0.18)',
    glowTo: 'hsla(210,85%,52%,0.12)',
    emoji: '⚡',
    logoImg: idmLogo,
    features: ['Official Reseller ✓', 'Lifetime License', 'Instant Delivery'],
    comboSlide: false,
  },
];

// Convert DB slide to internal Slide format
const dbSlideToSlide = (s: SlideData): Slide => ({
  tag: s.tag,
  title: s.title,
  titleAccent: s.titleAccent,
  subtitle: s.subtitle,
  desc: s.desc,
  price: s.price,
  original: s.original,
  off: s.off,
  badge: s.badge,
  accentFrom: s.accentFrom,
  accentTo: s.accentTo,
  glowFrom: `${s.accentFrom.replace(')', ',0.18)').replace('hsl(', 'hsla(')}`,
  glowTo: `${s.accentTo.replace(')', ',0.10)').replace('hsl(', 'hsla(')}`,
  emoji: s.emoji,
  features: s.features,
  comboSlide: false,
});

const STATS = [
  { label: 'Products',         value: '500+', icon: '🛍️', color: 'hsl(243,75%,55%)' },
  { label: 'Orders Delivered', value: '25K+', icon: '✅', color: 'hsl(158,64%,38%)' },
  { label: 'Happy Customers',  value: '12K+', icon: '😊', color: 'hsl(15,100%,52%)' },
  { label: 'Support Rating',   value: '4.9★', icon: '⭐', color: 'hsl(38,100%,48%)' },
];

const HeroBanner = () => {
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState<'in' | 'out'>('in');
  const { data: bannerData } = useHeroBanner();

  const SLIDES: Slide[] = bannerData?.slides && bannerData.slides.length > 0
    ? bannerData.slides.filter(s => s.enabled).map(dbSlideToSlide)
    : STATIC_SLIDES;

  const bgStyle = (() => {
    const bg = bannerData?.bg;
    if (!bg || bg.bgType === 'default') return 'hsl(var(--background))';
    if (bg.bgType === 'color') return bg.bgColor;
    if (bg.bgType === 'gradient') return `linear-gradient(135deg, ${bg.bgGradientFrom}, ${bg.bgGradientTo})`;
    return 'hsl(var(--background))';
  })();

  useEffect(() => {
    const timer = setInterval(() => advance(1), 5500);
    return () => clearInterval(timer);
  }, [active, SLIDES.length]);

  const advance = (delta: number) => {
    setDir('out');
    setTimeout(() => {
      setActive(p => (p + delta + SLIDES.length) % SLIDES.length);
      setDir('in');
    }, 280);
  };

  const slide = SLIDES[active] ?? SLIDES[0];

  return (
    <section className="relative overflow-hidden" style={{ background: bgStyle }}>
      {/* Animated bg blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 transition-all duration-700"
          style={{ background: `radial-gradient(ellipse at 70% 40%, ${slide.glowFrom} 0%, transparent 55%), radial-gradient(ellipse at 20% 75%, ${slide.glowTo} 0%, transparent 50%)` }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] blob opacity-20"
          style={{ background: `radial-gradient(circle, ${slide.accentFrom}18, transparent)` }} />
        <div className="absolute bottom-0 left-[-50px] w-80 h-80 blob opacity-15"
          style={{ background: `radial-gradient(circle, ${slide.accentTo}12, transparent)`, animationDelay: '4s' }} />
        {/* Grid */}
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle, hsla(243,75%,62%,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        {/* Top edge glow line */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${slide.accentFrom}40, ${slide.accentTo}40, transparent)` }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 sm:pt-14 sm:pb-10 lg:pt-20 lg:pb-14">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-14 lg:gap-20 items-center">

          {/* Left Content */}
          <div className="space-y-5 sm:space-y-7"
            style={{
              opacity:    dir === 'in' ? 1 : 0,
              transform:  dir === 'in' ? 'none' : 'translateY(12px)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-4 py-1.5 rounded-full text-white"
                style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`, boxShadow: `0 4px 16px ${slide.accentFrom}50` }}>
                {slide.tag}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full font-fira"
                style={{ background: `${slide.accentFrom}10`, border: `1px solid ${slide.accentFrom}30`, color: slide.accentFrom }}>
                {slide.badge}
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="font-sora font-black leading-[1.04] tracking-tight text-foreground hero-mobile-title" style={{ fontSize: 'clamp(2.2rem, 7vw, 4.5rem)' }}>
                {slide.title}{' '}
                <span className="gradient-text-slide" style={{ ['--g-from' as any]: slide.accentFrom, ['--g-to' as any]: slide.accentTo } as React.CSSProperties}>
                  {slide.titleAccent}
                </span>
              </h1>
              <p className="font-sora font-semibold text-xl lg:text-2xl mt-2 text-muted-foreground">{slide.subtitle}</p>
            </div>

            <p className="text-[15px] leading-relaxed max-w-md text-muted-foreground">{slide.desc}</p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {slide.features.map(f => (
                <span key={f} className="flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-full"
                  style={{ background: `${slide.accentFrom}10`, border: `1px solid ${slide.accentFrom}30`, color: slide.accentFrom }}>
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
                style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`, boxShadow: `0 8px 28px ${slide.accentFrom}55` }}>
                <ShoppingBag size={17} /> Order Now <ArrowRight size={15} />
              </button>
              <a href="/shop"
                className="flex items-center gap-2 px-6 py-4 rounded-2xl text-[14px] font-semibold transition-all hover:scale-[1.02]"
                style={{ background: `${slide.accentFrom}08`, border: `1px solid ${slide.accentFrom}25`, color: 'hsl(var(--foreground))' }}>
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

          {/* Right Visual — Light Glassmorphism Card */}
          <div className="relative hidden lg:flex items-center justify-center min-h-[440px]">
            {/* Gradient border wrapper */}
            <div
              className="relative w-[300px] anim-float"
              style={{
                opacity:    dir === 'in' ? 1 : 0,
                transform:  dir === 'in' ? 'scale(1)' : 'scale(0.95)',
                transition: 'opacity 0.3s, transform 0.3s',
                borderRadius: '2rem',
                padding: '2px',
                background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo}, ${slide.accentFrom}88)`,
                boxShadow: `0 32px 80px ${slide.accentFrom}35, 0 8px 32px ${slide.accentTo}25`,
              }}>
              {/* Corner glow dots */}
              <div className="absolute top-0 left-0 w-3 h-3 rounded-full -translate-x-0.5 -translate-y-0.5 z-10"
                style={{ background: slide.accentFrom, boxShadow: `0 0 10px 3px ${slide.accentFrom}` }} />
              <div className="absolute top-0 right-0 w-3 h-3 rounded-full translate-x-0.5 -translate-y-0.5 z-10"
                style={{ background: slide.accentTo, boxShadow: `0 0 10px 3px ${slide.accentTo}` }} />
              <div className="absolute bottom-0 left-0 w-3 h-3 rounded-full -translate-x-0.5 translate-y-0.5 z-10"
                style={{ background: slide.accentTo, boxShadow: `0 0 10px 3px ${slide.accentTo}` }} />
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full translate-x-0.5 translate-y-0.5 z-10"
                style={{ background: slide.accentFrom, boxShadow: `0 0 10px 3px ${slide.accentFrom}` }} />

              {/* Light frosted glass inner card */}
              <div className="relative overflow-hidden"
                style={{
                  borderRadius: 'calc(2rem - 2px)',
                  background: `linear-gradient(155deg, white 0%, ${slide.accentFrom}0d 60%, ${slide.accentTo}08 100%)`,
                  backdropFilter: 'blur(24px) saturate(180%)',
                }}>
                {/* Top shimmer line */}
                <div className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: `linear-gradient(90deg, transparent 5%, ${slide.accentFrom}90 40%, ${slide.accentTo}70 60%, transparent 95%)` }} />
                {/* Bottom accent glow */}
                <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
                  style={{ background: `linear-gradient(to top, ${slide.accentFrom}10, transparent)` }} />
                {/* Subtle dot grid */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ backgroundImage: `radial-gradient(circle, ${slide.accentFrom}0f 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
                {/* Light radial shine */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ backgroundImage: `radial-gradient(ellipse at 15% 8%, rgba(255,255,255,0.85) 0%, transparent 45%)` }} />

                <div className="relative p-8">
                  {slide.comboSlide && slide.combo ? (
                    /* Combo Slide Card */
                    <>
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                          <Award size={18} style={{ color: slide.accentFrom }} />
                          <span className="font-bold text-[11px] uppercase tracking-widest" style={{ color: 'hsl(226,35%,16%)' }}>Official Bundle</span>
                        </div>
                        <Sparkles size={16} className="anim-spin-slow" style={{ color: slide.accentFrom }} />
                      </div>
                      <div className="space-y-2.5 mb-5">
                        {slide.combo.map((item) => (
                          <div key={item.name}
                            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all"
                            style={{
                              background: item.highlight
                                ? `linear-gradient(135deg, ${item.color}18, ${item.color}08)`
                                : 'rgba(255,255,255,0.6)',
                              border: item.highlight
                                ? `1px solid ${item.color}50`
                                : '1px solid rgba(255,255,255,0.8)',
                              boxShadow: item.highlight ? `0 0 14px ${item.color}20` : 'none',
                            }}>
                            <span className="text-2xl">{item.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-[13px] leading-tight truncate" style={{ color: 'hsl(226,35%,16%)' }}>{item.name}</div>
                              <div className="text-[10px] mt-0.5 font-semibold" style={{ color: item.color }}>{item.tag}</div>
                            </div>
                            {item.highlight && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full text-white"
                                style={{ background: item.color }}>
                                OFFICIAL
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="pt-4 flex items-center justify-between" style={{ borderTop: `1px solid ${slide.accentFrom}25` }}>
                        <div>
                          <div className="text-xs line-through font-fira" style={{ color: 'hsl(226,15%,55%)' }}>{slide.original}</div>
                          <div className="font-sora font-black text-[2rem] leading-none mt-0.5" style={{ color: 'hsl(226,35%,14%)' }}>{slide.price}</div>
                        </div>
                        <div className="rounded-2xl px-4 py-3 text-center"
                          style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`, boxShadow: `0 4px 16px ${slide.accentFrom}50` }}>
                          <div className="font-fira font-black text-[1.1rem] text-white leading-none">-{slide.off}</div>
                          <div className="text-[9px] text-white/80 uppercase tracking-wider mt-0.5">OFF</div>
                        </div>
                      </div>
                      <button className="mt-4 w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] hover:brightness-110"
                        style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`, boxShadow: `0 6px 24px ${slide.accentFrom}55` }}>
                        Get Bundle →
                      </button>
                    </>
                  ) : (
                    /* Regular Slide Card */
                    <>
                      {/* Icon / Logo + Sparkles */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
                          style={{
                            background: slide.logoImg ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.9)',
                            border: `1.5px solid ${slide.accentFrom}35`,
                            boxShadow: `0 4px 20px ${slide.accentFrom}25, inset 0 1px 0 rgba(255,255,255,1)`,
                          }}>
                          {slide.logoImg
                            ? <img src={slide.logoImg} alt="product logo" className="w-10 h-10 object-contain" />
                            : <span className="text-3xl">{slide.emoji}</span>
                          }
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Sparkles size={18} className="anim-spin-slow" style={{ color: slide.accentFrom }} />
                          {slide.logoImg && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full text-white"
                              style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})` }}>
                              OFFICIAL
                            </span>
                          )}
                        </div>
                      </div>

                      {/* FEATURED DEAL label */}
                      <div className="text-[10px] font-fira font-bold uppercase tracking-[0.22em] mb-2"
                        style={{ color: slide.accentFrom }}>Featured Deal</div>

                      {/* Title — dark */}
                      <div className="font-sora font-black text-[23px] leading-tight"
                        style={{ color: 'hsl(226,35%,16%)' }}>
                        {slide.title}{' '}
                        <span style={{ color: slide.accentFrom }}>{slide.titleAccent}</span>
                      </div>

                      {/* Subtitle */}
                      <div className="text-[13px] mt-1.5 font-medium leading-snug"
                        style={{ color: 'hsl(226,20%,42%)' }}>{slide.subtitle}</div>

                      {/* Feature pills */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {slide.features.map(f => (
                          <span key={f} className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
                            style={{
                              background: `${slide.accentFrom}12`,
                              border: `1px solid ${slide.accentFrom}30`,
                              color: slide.accentFrom,
                            }}>{f}</span>
                        ))}
                      </div>

                      {/* Price row */}
                      <div className="mt-6 pt-4 flex items-center justify-between"
                        style={{ borderTop: `1px solid ${slide.accentFrom}20` }}>
                        <div>
                          <div className="text-xs line-through font-fira"
                            style={{ color: 'hsl(226,15%,55%)' }}>{slide.original}</div>
                          <div className="font-sora font-black text-[2.1rem] leading-none mt-0.5"
                            style={{ color: 'hsl(226,35%,14%)' }}>{slide.price}</div>
                        </div>
                        {/* OFF badge — solid accent */}
                        <div className="rounded-xl px-4 py-3 text-center"
                          style={{
                            background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`,
                            boxShadow: `0 4px 16px ${slide.accentFrom}50`,
                          }}>
                          <div className="font-fira font-black text-[1.1rem] leading-none text-white">-{slide.off}</div>
                          <div className="text-[9px] uppercase tracking-wider mt-0.5 text-white/80">OFF</div>
                        </div>
                      </div>

                      {/* CTA button — accent gradient */}
                      <button className="mt-5 w-full py-3.5 rounded-2xl font-bold text-[14px] text-white transition-all hover:scale-[1.02] hover:brightness-105 active:scale-[0.98]"
                        style={{
                          background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`,
                          boxShadow: `0 8px 28px ${slide.accentFrom}50`,
                        }}>
                        Order Now →
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Floating stat cards */}
            {[
              { label: 'Orders Today', value: '248+', icon: '📦', top: '4%',  left: '-18%', right: 'auto', delay: '0s' },
              { label: 'Happy Users',  value: '12K+', icon: '😊', top: '46%', left: 'auto',  right: '-18%', delay: '1.4s' },
              { label: 'Avg Rating',   value: '4.9★', icon: '⭐', top: '82%', left: '-16%', right: 'auto', delay: '2.8s' },
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
        <div className="flex items-center justify-center gap-4 mt-8 sm:mt-14">
          <button onClick={() => advance(-1)}
            className="w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: `${slide.accentFrom}10`, border: `1px solid ${slide.accentFrom}25`, color: slide.accentFrom }}>
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => { setDir('out'); setTimeout(() => { setActive(i); setDir('in'); }, 280); }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === active ? '28px' : '8px',
                  height: '8px',
                  background: i === active ? slide.accentFrom : 'hsla(258,60%,60%,0.2)',
                  boxShadow: i === active ? `0 0 10px ${slide.accentFrom}80` : 'none',
                }} />
            ))}
          </div>
          <button onClick={() => advance(1)}
            className="w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: `${slide.accentFrom}10`, border: `1px solid ${slide.accentFrom}25`, color: slide.accentFrom }}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mt-8 sm:mt-12 pt-8 sm:pt-12" style={{ borderTop: '1px solid hsla(258,60%,60%,0.1)' }}>
          {STATS.map((s) => (
            <div key={s.label} className="group text-center cursor-default">
              <div className="text-2xl sm:text-3xl mb-1.5 sm:mb-2 transition-transform duration-300 group-hover:scale-110">{s.icon}</div>
              <div className="text-[1.4rem] sm:text-[1.7rem] font-sora font-black leading-none gradient-text-slide"
                style={{ ['--g-from' as any]: slide.accentFrom, ['--g-to' as any]: slide.accentTo } as React.CSSProperties}>
                {s.value}
              </div>
              <div className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold mt-1 sm:mt-1.5 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
