import { useState, useEffect } from 'react';
import { ArrowRight, ShoppingBag, Zap, Shield, Clock, Star, ChevronLeft, ChevronRight, Sparkles, TrendingUp, CheckCircle2, Package, Download } from 'lucide-react';
import idmLogo from '@/assets/idm.webp';
import { useHeroBanner, type SlideData } from '@/hooks/useHeroBanner';

type Slide = {
  tag: string; tagIcon: string; title: string; titleAccent: string; subtitle: string; desc: string;
  price: string; original: string; off: string; badge: string;
  accentFrom: string; accentTo: string; glowFrom: string; glowTo: string;
  emoji: string; logoImg?: string; features: string[]; productSlug?: string;
  cardBg: string; cardAccent: string;
};

const STATIC_SLIDES: Slide[] = [
  {
    tag: 'Best Seller',
    tagIcon: '🔥',
    title: 'Windows 11',
    titleAccent: 'Pro',
    subtitle: 'Original License Key',
    desc: 'Genuine Microsoft Windows 11 Pro — instant digital delivery to your inbox within minutes.',
    price: '৳599',
    original: '৳9,999',
    off: '94%',
    badge: 'MOST POPULAR',
    accentFrom: 'hsl(258,78%,55%)',
    accentTo: 'hsl(200,90%,48%)',
    glowFrom: 'hsla(258,78%,62%,0.14)',
    glowTo: 'hsla(200,90%,55%,0.08)',
    emoji: '🪟',
    features: ['Lifetime License', 'Instant Delivery', 'All Devices'],
    cardBg: 'linear-gradient(155deg, rgba(255,255,255,0.96) 0%, rgba(246,244,255,0.92) 50%, rgba(238,248,255,0.94) 100%)',
    cardAccent: 'hsl(258,78%,55%)',
  },
  {
    tag: 'Flash Deal',
    tagIcon: '⚡',
    title: 'Microsoft',
    titleAccent: '365',
    subtitle: 'Personal — 1 Year',
    desc: 'Full Office suite: Word, Excel, PowerPoint, OneDrive 1TB. Premium productivity tools.',
    price: '৳1,999',
    original: '৳16,500',
    off: '88%',
    badge: 'LIMITED TIME',
    accentFrom: 'hsl(258,78%,55%)',
    accentTo: 'hsl(200,90%,48%)',
    glowFrom: 'hsla(258,78%,62%,0.14)',
    glowTo: 'hsla(200,90%,55%,0.08)',
    emoji: '📦',
    features: ['1TB OneDrive', '5 Devices', '1 Year'],
    cardBg: 'linear-gradient(155deg, rgba(255,255,255,0.96) 0%, rgba(244,246,255,0.92) 50%, rgba(238,248,255,0.94) 100%)',
    cardAccent: 'hsl(258,78%,55%)',
  },
  {
    tag: 'Official Reseller',
    tagIcon: '🏆',
    title: 'IDM',
    titleAccent: 'Lifetime',
    subtitle: 'Internet Download Manager',
    desc: 'আমরা IDM-এর অফিশিয়াল রিসেলার। একবার কিনুন, সারাজীবন ব্যবহার করুন — কোনো বার্ষিক ফি নেই।',
    price: '৳2,650',
    original: '৳6,500',
    off: '59%',
    badge: 'OFFICIAL RESELLER',
    accentFrom: 'hsl(258,78%,55%)',
    accentTo: 'hsl(200,90%,48%)',
    glowFrom: 'hsla(258,78%,62%,0.14)',
    glowTo: 'hsla(200,90%,55%,0.08)',
    emoji: '⚡',
    logoImg: idmLogo,
    features: ['Official Reseller ✓', 'Lifetime License', 'Instant Delivery'],
    cardBg: 'linear-gradient(155deg, rgba(255,255,255,0.96) 0%, rgba(240,248,255,0.92) 50%, rgba(238,250,255,0.94) 100%)',
    cardAccent: 'hsl(200,90%,42%)',
  },
];

const dbSlideToSlide = (s: SlideData): Slide => ({
  tag: s.tag, tagIcon: '', title: s.title, titleAccent: s.titleAccent,
  subtitle: s.subtitle, desc: s.desc, price: s.price,
  original: s.original, off: s.off, badge: s.badge,
  accentFrom: 'hsl(258,78%,55%)', accentTo: 'hsl(200,90%,48%)',
  glowFrom: 'hsla(258,78%,62%,0.14)', glowTo: 'hsla(200,90%,55%,0.08)',
  emoji: s.emoji, features: s.features, productSlug: s.productSlug || '',
  cardBg: 'linear-gradient(155deg, rgba(255,255,255,0.96), rgba(246,244,255,0.92))',
  cardAccent: 'hsl(258,78%,55%)',
});

const DEFAULT_STATS = [
  { label: 'Products',         value: '500+', icon: '🛍️' },
  { label: 'Orders Delivered', value: '25K+', icon: '✅' },
  { label: 'Happy Customers',  value: '12K+', icon: '😊' },
  { label: 'Support Rating',   value: '4.9★', icon: '⭐' },
];

const DEFAULT_FLOATING = [
  { label: 'Orders Today', value: '248+', icon: '📦' },
  { label: 'Happy Users',  value: '12K+', icon: '😊' },
  { label: 'Avg Rating',   value: '4.9★', icon: '⭐' },
];

const DEFAULT_TRUST = [
  { text: 'Instant Delivery', icon: <Zap size={13} /> },
  { text: '100% Genuine',     icon: <Shield size={13} /> },
  { text: '24/7 Support',     icon: <Clock size={13} /> },
  { text: '4.9★ Rating',      icon: <Star size={13} /> },
];

const HeroBanner = () => {
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState<'in' | 'out'>('in');
  const { data: bannerData } = useHeroBanner();

  const SLIDES: Slide[] = bannerData?.slides && bannerData.slides.length > 0
    ? bannerData.slides.filter(s => s.enabled).map(dbSlideToSlide)
    : STATIC_SLIDES;

  const STATS    = bannerData?.stats    ?? DEFAULT_STATS;
  const FLOATING = bannerData?.floating ?? DEFAULT_FLOATING;

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
    }, 260);
  };

  const slide = SLIDES[active] ?? SLIDES[0];

  return (
    <section className="relative overflow-hidden" style={{ background: bgStyle }}>

      {/* ── Background Layer ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Indigo-cyan gradient blobs */}
        <div className="absolute inset-0 transition-all duration-1000"
          style={{ background: `radial-gradient(ellipse at 65% 35%, hsla(258,78%,62%,0.10) 0%, transparent 52%), radial-gradient(ellipse at 25% 72%, hsla(200,90%,55%,0.07) 0%, transparent 48%)` }} />
        {/* Large soft blob top-right */}
        <div className="absolute -top-32 -right-32 w-[550px] h-[550px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, hsl(258,78%,62%), transparent 70%)', filter: 'blur(60px)' }} />
        {/* Small blob bottom-left */}
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, hsl(200,90%,55%), transparent 70%)', filter: 'blur(50px)' }} />
        {/* Subtle dot grid */}
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle, hsla(258,78%,55%,0.035) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        {/* Top shimmer line */}
        <div className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background: 'linear-gradient(90deg, transparent 0%, hsla(258,78%,62%,0.50) 35%, hsla(200,90%,55%,0.50) 65%, transparent 100%)' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 sm:pt-14 sm:pb-10 lg:pt-18 lg:pb-12">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* ══ LEFT — Content ══ */}
          <div className="space-y-6"
            style={{
              opacity: dir === 'in' ? 1 : 0,
              transform: dir === 'in' ? 'none' : 'translateY(14px)',
              transition: 'opacity 0.28s ease, transform 0.28s ease',
            }}>

            {/* Tag + Badge row */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Pill tag */}
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-4 py-2 rounded-full text-white tracking-wide"
                style={{
                  background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,48%))',
                  boxShadow: '0 4px 18px hsla(258,78%,55%,0.40)',
                }}>
                <span>{slide.tagIcon}</span> {slide.tag}
              </span>
              {/* Badge outline */}
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase px-3 py-1.5 rounded-full font-fira"
                style={{
                  background: 'hsla(258,78%,55%,0.07)',
                  border: '1px solid hsla(258,78%,55%,0.22)',
                  color: 'hsl(258,78%,52%)',
                }}>
                {slide.badge}
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="font-sora font-black leading-[1.05] tracking-tight"
                style={{ fontSize: 'clamp(2.4rem, 7vw, 4.8rem)', color: 'hsl(226,35%,14%)' }}>
                {slide.title}{' '}
                <span style={{
                  background: 'linear-gradient(135deg, hsl(258,78%,52%), hsl(215,82%,52%), hsl(200,90%,46%))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  {slide.titleAccent}
                </span>
              </h1>
              <p className="font-sora font-semibold text-lg lg:text-xl mt-2.5"
                style={{ color: 'hsl(226,22%,44%)' }}>
                {slide.subtitle}
              </p>
            </div>

            {/* Description */}
            <p className="text-[14.5px] leading-relaxed max-w-[440px]"
              style={{ color: 'hsl(226,18%,50%)' }}>
              {slide.desc}
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {slide.features.map(f => (
                <span key={f} className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-full"
                  style={{
                    background: 'hsla(258,78%,55%,0.07)',
                    border: '1px solid hsla(258,78%,55%,0.20)',
                    color: 'hsl(258,78%,50%)',
                  }}>
                  <CheckCircle2 size={11} style={{ color: 'hsl(200,90%,46%)' }} />
                  {f}
                </span>
              ))}
            </div>

            {/* Price block */}
            <div className="flex items-center gap-4">
              {/* Price pill — glassmorphism */}
              <div className="px-5 py-3 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.90), rgba(246,244,255,0.85))',
                  backdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(255,255,255,0.92)',
                  boxShadow: '0 4px 20px hsla(258,78%,55%,0.10), 0 1px 0 rgba(255,255,255,1) inset',
                }}>
                <div className="font-sora font-black leading-none"
                  style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)', color: 'hsl(226,35%,14%)' }}>
                  {slide.price}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm line-through font-fira" style={{ color: 'hsl(226,15%,58%)' }}>{slide.original}</div>
                <span className="inline-flex items-center text-[11px] font-black text-white px-3 py-1.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,48%))', boxShadow: '0 3px 12px hsla(258,78%,55%,0.40)' }}>
                  Save {slide.off} OFF
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
              {/* Primary CTA — gradient */}
              <a href={slide.productSlug ? `/product/${slide.productSlug}` : '/shop'}
                className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl text-[14px] font-bold text-white transition-all duration-200 hover:scale-[1.03] hover:brightness-105 active:scale-[0.97]"
                style={{
                  background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(215,82%,52%), hsl(200,90%,48%))',
                  boxShadow: '0 8px 28px hsla(258,78%,55%,0.42), 0 1px 0 rgba(255,255,255,0.25) inset',
                }}>
                <ShoppingBag size={16} /> Buy Now <ArrowRight size={14} />
              </a>
              {/* Secondary — glass */}
              <a href="/shop"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl text-[14px] font-semibold transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(246,244,255,0.80))',
                  backdropFilter: 'blur(16px)',
                  border: '1.5px solid rgba(255,255,255,0.92)',
                  boxShadow: '0 4px 16px hsla(258,78%,55%,0.10), 0 1px 0 rgba(255,255,255,1) inset',
                  color: 'hsl(258,78%,50%)',
                }}>
                <TrendingUp size={14} /> View All Deals
              </a>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap gap-4 pt-1">
              {DEFAULT_TRUST.map(t => (
                <span key={t.text} className="flex items-center gap-1.5 text-[12px] font-semibold"
                  style={{ color: 'hsl(226,20%,48%)' }}>
                  <span style={{ color: 'hsl(258,78%,55%)' }}>{t.icon}</span>
                  {t.text}
                </span>
              ))}
            </div>
          </div>

          {/* ══ RIGHT — Glassmorphism Card ══ */}
          <div className="relative hidden lg:flex items-center justify-center min-h-[460px]">

            {/* Soft background glow behind card */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 55% 48%, hsla(258,78%,62%,0.10) 0%, hsla(200,90%,55%,0.06) 50%, transparent 72%)' }} />

            {/* Main card — animated gradient border */}
            <div
              className="relative w-[310px] anim-float hero-card-shell"
              style={{
                opacity: dir === 'in' ? 1 : 0,
                transform: dir === 'in' ? 'scale(1) translateY(0)' : 'scale(0.93) translateY(8px)',
                transition: 'opacity 0.30s ease, transform 0.30s ease',
              }}>

              {/* Corner glow dots */}
              <div className="absolute top-0 left-0 w-2.5 h-2.5 rounded-full -translate-x-0.5 -translate-y-0.5 z-10"
                style={{ background: 'hsl(258,78%,60%)', boxShadow: '0 0 10px 3px hsla(258,78%,60%,0.72)' }} />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full translate-x-0.5 -translate-y-0.5 z-10"
                style={{ background: 'hsl(200,90%,52%)', boxShadow: '0 0 10px 3px hsla(200,90%,52%,0.72)' }} />
              <div className="absolute bottom-0 left-0 w-2.5 h-2.5 rounded-full -translate-x-0.5 translate-y-0.5 z-10"
                style={{ background: 'hsl(200,90%,52%)', boxShadow: '0 0 10px 3px hsla(200,90%,52%,0.72)' }} />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full translate-x-0.5 translate-y-0.5 z-10"
                style={{ background: 'hsl(258,78%,60%)', boxShadow: '0 0 10px 3px hsla(258,78%,60%,0.72)' }} />

              {/* Inner glass surface */}
              <div className="hero-card-inner relative overflow-hidden">
                {/* Shimmer top */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px]"
                  style={{ background: 'linear-gradient(90deg, transparent 4%, hsla(258,78%,64%,0.88) 33%, hsla(200,90%,58%,0.78) 67%, transparent 96%)' }} />
                {/* Dot micro-grid */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ backgroundImage: 'radial-gradient(circle, hsla(258,78%,55%,0.045) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                {/* Specular light */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at 14% 8%, rgba(255,255,255,0.92) 0%, transparent 40%)' }} />

                <div className="relative p-7">
                  {/* Product icon + official badge */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
                      style={{
                        background: 'rgba(255,255,255,0.96)',
                        border: '1.5px solid hsla(258,78%,60%,0.22)',
                        boxShadow: '0 4px 18px hsla(258,78%,55%,0.12), inset 0 1px 0 rgba(255,255,255,1)',
                      }}>
                      {slide.logoImg
                        ? <img src={slide.logoImg} alt="product" className="w-9 h-9 object-contain" />
                        : <span className="text-[28px] leading-none">{slide.emoji}</span>
                      }
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Sparkles size={17} className="anim-spin-slow" style={{ color: 'hsl(258,78%,55%)' }} />
                      {slide.logoImg && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full text-white"
                          style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,48%))' }}>
                          OFFICIAL
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Featured Deal label */}
                  <div className="text-[10px] font-fira font-bold uppercase tracking-[0.24em] mb-1.5"
                    style={{ color: 'hsl(258,78%,55%)' }}>
                    ✦ Featured Deal
                  </div>

                  {/* Product name */}
                  <div className="font-sora font-black text-[22px] leading-tight mb-1" style={{ color: 'hsl(226,35%,15%)' }}>
                    {slide.title}{' '}
                    <span style={{
                      background: 'linear-gradient(135deg, hsl(258,78%,52%), hsl(200,90%,46%))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>
                      {slide.titleAccent}
                    </span>
                  </div>
                  <div className="text-[12px] font-medium mb-4" style={{ color: 'hsl(226,20%,46%)' }}>{slide.subtitle}</div>

                  {/* Feature chips */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {slide.features.map(f => (
                      <span key={f}
                        className="text-[10.5px] font-semibold px-2.5 py-1.5 rounded-full"
                        style={{
                          background: 'hsla(258,78%,55%,0.07)',
                          border: '1px solid hsla(258,78%,60%,0.18)',
                          color: 'hsl(258,78%,50%)',
                        }}>
                        {f}
                      </span>
                    ))}
                  </div>

                  {/* Price row */}
                  <div className="flex items-center justify-between pt-4 mb-4"
                    style={{ borderTop: '1px solid hsla(258,78%,55%,0.10)' }}>
                    <div>
                      <div className="text-[11px] line-through font-fira mb-0.5" style={{ color: 'hsl(226,15%,58%)' }}>{slide.original}</div>
                      <div className="font-sora font-black leading-none" style={{ fontSize: '2rem', color: 'hsl(226,35%,14%)' }}>{slide.price}</div>
                    </div>
                    {/* Off badge */}
                    <div className="rounded-2xl px-3.5 py-3 text-center flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,48%))',
                        boxShadow: '0 6px 20px hsla(258,78%,55%,0.38)',
                      }}>
                      <div className="font-fira font-black text-[1rem] text-white leading-none">-{slide.off}</div>
                      <div className="text-[8px] text-white/75 uppercase tracking-wider mt-0.5">OFF</div>
                    </div>
                  </div>

                  {/* Order button */}
                  <a href={slide.productSlug ? `/product/${slide.productSlug}` : '/shop'}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-[13px] text-white transition-all duration-200 hover:scale-[1.02] hover:brightness-106 active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(215,82%,52%), hsl(200,90%,48%))',
                      boxShadow: '0 8px 24px hsla(258,78%,55%,0.38), 0 1px 0 rgba(255,255,255,0.22) inset',
                    }}>
                    <Package size={14} /> Buy Now <ArrowRight size={12} />
                  </a>
                </div>
              </div>
            </div>

            {/* ── Floating stat cards ── */}
            {[
              { label: FLOATING[0]?.label ?? 'Orders Today', value: FLOATING[0]?.value ?? '248+', icon: FLOATING[0]?.icon ?? '📦', top: '6%',  left: '-20%', right: 'auto', delay: '0s'   },
              { label: FLOATING[1]?.label ?? 'Happy Users',  value: FLOATING[1]?.value ?? '12K+', icon: FLOATING[1]?.icon ?? '😊', top: '44%', left: 'auto',  right: '-20%', delay: '1.6s' },
              { label: FLOATING[2]?.label ?? 'Avg Rating',   value: FLOATING[2]?.value ?? '4.9★', icon: FLOATING[2]?.icon ?? '⭐', top: '80%', left: '-18%', right: 'auto',  delay: '3.0s' },
            ].map((card, i) => (
              <div key={i}
                className="absolute anim-float hero-float-card"
                style={{ top: card.top, left: card.left, right: card.right, animationDelay: card.delay }}>
                <div className="flex items-center gap-2.5">
                  {/* Icon box */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, hsla(258,78%,55%,0.10), hsla(200,90%,55%,0.07))',
                      border: '1px solid hsla(258,78%,60%,0.18)',
                    }}>
                    <span className="text-[17px] leading-none">{card.icon}</span>
                  </div>
                  <div>
                    <div className="text-[14px] font-sora font-black leading-none"
                      style={{
                        background: 'linear-gradient(135deg, hsl(258,78%,52%), hsl(200,90%,45%))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}>
                      {card.value}
                    </div>
                    <div className="text-[10px] leading-none mt-0.5 font-medium" style={{ color: 'hsl(226,20%,50%)' }}>{card.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Slider Controls ── */}
        <div className="flex items-center justify-center gap-4 mt-10 sm:mt-12">
          <button onClick={() => advance(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(246,244,255,0.80))',
              backdropFilter: 'blur(12px)',
              border: '1.5px solid rgba(255,255,255,0.90)',
              boxShadow: '0 2px 12px hsla(258,78%,55%,0.12)',
              color: 'hsl(258,78%,52%)',
            }}>
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button key={i}
                onClick={() => { setDir('out'); setTimeout(() => { setActive(i); setDir('in'); }, 260); }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === active ? '28px' : '8px',
                  height: '8px',
                  background: i === active
                    ? 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,48%))'
                    : 'hsla(258,60%,60%,0.18)',
                  boxShadow: i === active ? '0 0 10px hsla(258,78%,55%,0.70)' : 'none',
                }} />
            ))}
          </div>

          <button onClick={() => advance(1)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(246,244,255,0.80))',
              backdropFilter: 'blur(12px)',
              border: '1.5px solid rgba(255,255,255,0.90)',
              boxShadow: '0 2px 12px hsla(258,78%,55%,0.12)',
              color: 'hsl(258,78%,52%)',
            }}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mt-10 sm:mt-12 pt-8 sm:pt-10"
          style={{ borderTop: '1px solid hsla(258,78%,55%,0.09)' }}>
          {STATS.map((s) => (
            <div key={s.label}
              className="group text-center cursor-default transition-transform duration-300 hover:scale-105">
              {/* Icon in glass circle */}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-2 mx-auto"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.90), rgba(246,244,255,0.82))',
                  backdropFilter: 'blur(12px)',
                  border: '1.5px solid rgba(255,255,255,0.92)',
                  boxShadow: '0 2px 12px hsla(258,78%,55%,0.09)',
                  fontSize: '1.4rem',
                }}>
                {s.icon}
              </div>
              <div className="font-sora font-black text-[1.5rem] sm:text-[1.75rem] leading-none mb-1"
                style={{
                  background: 'linear-gradient(135deg, hsl(258,78%,52%), hsl(200,90%,45%))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                {s.value}
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'hsl(226,20%,52%)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
