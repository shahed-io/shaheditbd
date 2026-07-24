import { useState, useEffect } from 'react';
import { ArrowRight, ShoppingBag, TrendingUp, Zap, Shield, Clock, Star, ChevronLeft, ChevronRight, Sparkles, CheckCircle2, Package } from 'lucide-react';
import idmLogo from '@/assets/idm.webp';
import ms365Logo from '@/assets/ms365-logo.png';
import winLogo from '@/assets/windows-logo.png';
import { useHeroBanner, type SlideData } from '@/hooks/useHeroBanner';

type Slide = {
  tag: string; tagIcon: string; title: string; titleAccent: string; subtitle: string; desc: string;
  price: string; original: string; off: string; badge: string;
  accentFrom: string; accentTo: string;
  emoji: string; logoImg?: string; features: string[]; productSlug?: string;
};

const STATIC_SLIDES: Slide[] = [
  {
    tag: 'Best Seller', tagIcon: '🔥',
    title: 'Windows 11', titleAccent: 'Pro',
    subtitle: 'Original License Key',
    desc: 'Genuine Microsoft Windows 11 Pro — instant digital delivery to your inbox within minutes.',
    price: '৳599', original: '৳9,999', off: '-94%', badge: 'MOST POPULAR',
    accentFrom: 'hsl(258,78%,55%)', accentTo: 'hsl(200,90%,48%)',
    emoji: '🪟', features: ['Lifetime License', 'Instant Delivery', 'All Devices'],
    productSlug: 'windows-11-pro-licence-key-price-in-bd',
  },
  {
    tag: 'Flash Deal', tagIcon: '⚡',
    title: 'Microsoft', titleAccent: '365',
    subtitle: 'Personal — 1 Year',
    desc: 'Full Office suite: Word, Excel, PowerPoint, OneDrive 1TB. Premium productivity tools.',
    price: '৳1,999', original: '৳16,500', off: '-88%', badge: 'LIMITED TIME',
    accentFrom: 'hsl(258,78%,55%)', accentTo: 'hsl(200,90%,48%)',
    emoji: '📦', logoImg: ms365Logo, features: ['1TB OneDrive', '5 Devices', '1 Year'],
    productSlug: 'microsoft-office-365-personal-subscription-price-in-bd',
  },
  {
    tag: 'Official Reseller', tagIcon: '🏆',
    title: 'IDM', titleAccent: 'Lifetime',
    subtitle: 'Internet Download Manager',
    desc: 'আমরা IDM-এর অফিশিয়াল রিসেলার। একবার কিনুন, সারাজীবন ব্যবহার করুন।',
    price: '৳2,650', original: '৳6,500', off: '-59%', badge: 'OFFICIAL RESELLER',
    accentFrom: 'hsl(258,78%,55%)', accentTo: 'hsl(200,90%,48%)',
    emoji: '⚡', logoImg: idmLogo, features: ['Official Reseller ✓', 'Lifetime License', 'Instant Delivery'],
    productSlug: 'internet-download-manager-idm-lifetime-key',
  },
];

// Map known slide IDs to their bundled logo assets
const LOGO_MAP: Record<string, string> = {
  'slide-win11': winLogo,
  'slide-ms365': ms365Logo,
  'slide-idm': idmLogo,
};

const dbSlideToSlide = (s: SlideData): Slide => ({
  tag: s.tag, tagIcon: s.tagIcon || '', title: s.title, titleAccent: s.titleAccent,
  subtitle: s.subtitle, desc: s.desc, price: s.price,
  original: s.original, off: s.off.startsWith('-') ? s.off : `-${s.off}`, badge: s.badge,
  accentFrom: s.accentFrom || 'hsl(258,78%,55%)', accentTo: s.accentTo || 'hsl(200,90%,48%)',
  emoji: s.emoji, logoImg: LOGO_MAP[s.id] || s.logoImg || undefined, features: s.features, productSlug: s.productSlug || '',
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
  { text: 'Instant Delivery', icon: <Zap size={12} /> },
  { text: '100% Genuine',     icon: <Shield size={12} /> },
  { text: '24/7 Support',     icon: <Clock size={12} /> },
  { text: '4.9★ Rating',      icon: <Star size={12} /> },
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
    <section className="relative overflow-hidden mt-[54px] px-3 sm:px-5 lg:px-8 pt-2 pb-5 sm:pt-3 md:pt-4 md:pb-6 lg:pt-4 lg:pb-8" style={{ background: bgStyle }}>

      {/* ── Luminous ambient orbs (page-level) ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -right-[5%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'hsla(258,78%,62%,0.22)', filter: 'blur(120px)' }} />
        <div className="absolute -bottom-[10%] -left-[5%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'hsla(230,80%,70%,0.18)', filter: 'blur(140px)' }} />
        <div className="absolute top-[25%] left-[33%] w-[300px] h-[300px] rounded-full"
          style={{ background: 'hsla(270,70%,72%,0.16)', filter: 'blur(100px)' }} />
      </div>

      {/* ── Glass card frame around hero content ── */}
      <div className="relative mx-auto w-full max-w-[1800px] rounded-[28px] lg:rounded-[40px] overflow-hidden isolate"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(245,243,255,0.55) 50%, rgba(235,240,255,0.6) 100%)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1.5px solid hsla(258,60%,70%,0.45)',
          boxShadow: '0 24px 60px -18px hsla(258,78%,55%,0.28), 0 4px 16px -4px hsla(258,60%,60%,0.18), inset 0 1.5px 0 rgba(255,255,255,1), inset 1.5px 0 0 rgba(255,255,255,0.9)',
        }}>
        {/* Soft inner accent (kept inside so it doesn't break the top curve) */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsla(258,78%,60%,0.10), transparent 70%)', transform: 'translate(30%,-30%)' }} />


        {/* ══════════════════════════════════
             MOBILE — Premium Clean White + Soft Bubble carousel
             (< lg only; desktop keeps original layout below)
        ══════════════════════════════════ */}
        <div className="lg:hidden px-3 pt-3 pb-4">
          <div
            className="relative w-full rounded-[24px] bg-white border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden flex items-stretch"
            style={{ height: '210px' }}
            role="region"
            aria-roledescription="carousel"
            aria-label="Featured deals"
          >
            {/* Left content ~62% */}
            <div
              className="w-[62%] pl-4 pr-2 py-3 flex flex-col justify-center gap-1.5 relative z-10"
              style={{
                opacity: dir === 'in' ? 1 : 0,
                transform: dir === 'in' ? 'translateX(0)' : 'translateX(-14px)',
                transition: 'opacity 0.32s ease, transform 0.32s ease',
              }}
            >
              {/* Tag row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border"
                  style={{
                    background: 'hsla(258,78%,55%,0.08)',
                    borderColor: 'hsla(258,78%,55%,0.20)',
                    color: 'hsl(258,78%,50%)',
                  }}
                >
                  {slide.tagIcon} {slide.tag}
                </span>
                <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">
                  {slide.badge}
                </span>
              </div>

              {/* Title */}
              <div>
                <h2
                  className="font-sora font-black leading-tight text-gray-900"
                  style={{ fontSize: '19px' }}
                >
                  {slide.title}{' '}
                  <span
                    style={{
                      background: 'linear-gradient(135deg, hsl(258,78%,52%), hsl(200,90%,46%))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {slide.titleAccent}
                  </span>
                </h2>
                <p className="text-[11px] text-gray-500 font-medium leading-snug line-clamp-1">
                  {slide.subtitle}
                </p>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1.5 flex-wrap pt-0.5">
                <span className="text-[17px] font-black text-gray-900 leading-none font-sora">
                  {slide.price}
                </span>
                <span className="text-[10px] text-gray-400 line-through">{slide.original}</span>
                <span className="text-[10px] font-bold" style={{ color: 'hsl(0,78%,55%)' }}>
                  {slide.off} OFF
                </span>
              </div>

              {/* CTA */}
              <div className="pt-1">
                <a
                  href={slide.productSlug ? `/product/${slide.productSlug}` : '/shop'}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-[11px] font-bold active:scale-95 transition-transform"
                  style={{
                    background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(215,82%,52%))',
                    boxShadow: '0 6px 18px hsla(258,78%,55%,0.35)',
                  }}
                >
                  <ShoppingBag size={11} strokeWidth={2.5} />
                  Buy Now
                  <ArrowRight size={11} strokeWidth={2.5} />
                </a>
              </div>
            </div>

            {/* Right visual ~38% */}
            <div className="w-[38%] relative flex items-center justify-center overflow-hidden">
              {/* Soft tinted panel */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(135deg, hsla(200,90%,55%,0.08) 0%, hsla(258,78%,60%,0.06) 100%)',
                }}
              />
              {/* Decorative ambient blobs */}
              <div
                className="absolute top-4 right-2 w-16 h-16 rounded-full"
                style={{ background: 'hsla(200,90%,55%,0.18)', filter: 'blur(20px)' }}
              />
              <div
                className="absolute bottom-4 right-6 w-20 h-20 rounded-full"
                style={{ background: 'hsla(258,78%,60%,0.18)', filter: 'blur(22px)' }}
              />

              {/* Glass bubble with product logo */}
              <div
                className="relative z-10 w-[86px] h-[86px] rounded-[22px] flex items-center justify-center anim-float"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.85), rgba(255,255,255,0.45))',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1.5px solid rgba(255,255,255,0.95)',
                  boxShadow:
                    '0 10px 24px -6px hsla(258,60%,50%,0.25), inset 0 1.5px 0 rgba(255,255,255,1)',
                  opacity: dir === 'in' ? 1 : 0,
                  transform:
                    dir === 'in' ? 'translateX(0) scale(1)' : 'translateX(14px) scale(0.94)',
                  transition: 'opacity 0.32s ease, transform 0.32s ease',
                }}
              >
                {slide.logoImg ? (
                  <img
                    src={slide.logoImg}
                    alt={`${slide.title} ${slide.titleAccent}`}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    className="w-12 h-12 object-contain drop-shadow-md"
                  />
                ) : (
                  <span className="text-4xl leading-none">{slide.emoji}</span>
                )}
              </div>
            </div>

            {/* Swipe handlers overlay */}
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => advance(-1)}
              className="absolute top-1/2 -translate-y-1/2 left-1 w-7 h-7 rounded-full bg-white/70 backdrop-blur border border-white/80 flex items-center justify-center z-20 active:scale-90 transition-transform"
              style={{ color: 'hsl(258,78%,52%)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <ChevronLeft size={14} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => advance(1)}
              className="absolute top-1/2 -translate-y-1/2 right-1 w-7 h-7 rounded-full bg-white/70 backdrop-blur border border-white/80 flex items-center justify-center z-20 active:scale-90 transition-transform"
              style={{ color: 'hsl(258,78%,52%)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>

          {/* Pagination dots */}
          <div className="flex justify-center items-center gap-1.5 pt-3">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show slide ${i + 1}`}
                onClick={() => {
                  setDir('out');
                  setTimeout(() => {
                    setActive(i);
                    setDir('in');
                  }, 260);
                }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === active ? '22px' : '6px',
                  height: '6px',
                  background:
                    i === active
                      ? 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,48%))'
                      : 'hsla(220,15%,80%,1)',
                  boxShadow: i === active ? '0 0 8px hsla(258,78%,55%,0.55)' : 'none',
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative container-fluid hidden lg:block">
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-0 pt-3 pb-5 md:pt-4 md:pb-6 lg:pt-5 lg:pb-6">

          {/* ══════════════════════════════════
               LEFT — Bold editorial content
          ══════════════════════════════════ */}
          <div className="flex-1 lg:pr-6 space-y-4 text-center lg:text-left"
            style={{
              opacity: dir === 'in' ? 1 : 0,
              transform: dir === 'in' ? 'none' : 'translateX(-18px)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}>

            {/* Category tag */}
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full text-white"
                style={{
                  background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(215,82%,52%))',
                  boxShadow: '0 4px 16px hsla(258,78%,55%,0.35)',
                }}>
                <span className="text-[11px]">{slide.tagIcon || '✦'}</span>
                {slide.tag}
              </span>
              <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1.5 rounded-full"
                style={{
                  background: 'hsla(258,78%,55%,0.07)',
                  border: '1px solid hsla(258,78%,55%,0.18)',
                  color: 'hsl(258,78%,50%)',
                }}>
                {slide.badge}
              </span>
            </div>


            {/* Headline */}
            <div>
              <h1 className="font-sora font-black leading-[1.05] tracking-tight"
                style={{ fontSize: 'clamp(1.9rem, 5vw, 3.4rem)', color: 'hsl(226,35%,12%)' }}>
                <span className="block">{slide.title}</span>
                <span className="block"
                style={{
                  fontSize: 'clamp(1.9rem, 5vw, 3.4rem)',
                  background: 'linear-gradient(135deg, hsl(258,78%,52%) 0%, hsl(215,82%,52%) 50%, hsl(200,90%,46%) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                {slide.titleAccent}
                </span>
              </h1>
              <p className="text-[13px] lg:text-[14px] font-semibold mt-2"
                style={{ color: 'hsl(226,22%,44%)' }}>
                {slide.subtitle}
              </p>
            </div>

            {/* Description */}
            <p className="text-[12.5px] leading-relaxed max-w-[420px] mx-auto lg:mx-0"
              style={{ color: 'hsl(226,18%,52%)' }}>
              {slide.desc}
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-1.5 justify-center lg:justify-start">
              {slide.features.map(f => (
                <span key={f}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
                  style={{
                    background: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid hsla(258,78%,55%,0.18)',
                    color: 'hsl(258,78%,50%)',
                    boxShadow: '0 2px 8px hsla(258,78%,55%,0.08)',
                  }}>
                  <CheckCircle2 size={10} style={{ color: 'hsl(200,90%,46%)' }} />
                  {f}
                </span>
              ))}
            </div>

            {/* Price + CTA */}
            <div className="space-y-3">
              {/* Price row */}
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div>
                  <div className="text-xs line-through font-medium" style={{ color: 'hsl(226,15%,58%)' }}>
                    {slide.original}
                  </div>
                  <div className="font-sora font-black"
                    style={{ fontSize: 'clamp(1.6rem, 3vw, 2.25rem)', color: 'hsl(226,35%,12%)', lineHeight: 1 }}>
                    {slide.price}
                  </div>
                </div>
                <span className="self-end mb-1 inline-flex items-center text-[10.5px] font-black text-white px-3 py-1.5 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,48%))',
                    boxShadow: '0 4px 14px hsla(258,78%,55%,0.40)',
                  }}>
                  {slide.off} OFF
                </span>
              </div>


              {/* CTAs */}
              <div className="flex flex-wrap gap-2.5 justify-center lg:justify-start">
                <a href={slide.productSlug ? `/product/${slide.productSlug}` : '/shop'}
                  className="btn-vision-primary inline-flex items-center gap-2 px-5 py-2.5 text-[12.5px]">
                  <ShoppingBag size={13} /> Buy Now <ArrowRight size={12} />
                </a>
                <a href="/shop"
                  className="btn-vision-glass inline-flex items-center gap-2 px-4 py-2.5 text-[12.5px]"
                  style={{ color: 'hsl(258,78%,45%)' }}>
                  <TrendingUp size={12} /> View All Deals
                </a>

              </div>
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-0.5">
              {DEFAULT_TRUST.map(t => (
                <span key={t.text}
                  className="flex items-center gap-1.5 text-[10.5px] font-semibold"
                  style={{ color: 'hsl(226,20%,50%)' }}>
                  <span style={{ color: 'hsl(258,78%,55%)' }}>{t.icon}</span>
                  {t.text}
                </span>
              ))}
            </div>

          </div>

          {/* ══════════════════════════════════
               MIDDLE — Premium light bridge
          ══════════════════════════════════ */}
          <div className="hidden lg:flex relative items-center justify-center flex-shrink-0 overflow-visible"
            style={{ width: '260px', minHeight: '520px' }}
            aria-hidden="true">

            {/* Iridescent ambient orbs */}
            <div className="absolute -top-6 -right-4 pointer-events-none rounded-full"
              style={{
                width: '340px', height: '340px',
                background: 'radial-gradient(circle, hsla(258,78%,70%,0.28) 0%, hsla(300,80%,72%,0.22) 40%, transparent 70%)',
                filter: 'blur(60px)',
              }} />
            <div className="absolute -bottom-4 -left-8 pointer-events-none rounded-full"
              style={{
                width: '280px', height: '280px',
                background: 'radial-gradient(circle, hsla(200,90%,72%,0.28) 0%, hsla(170,85%,68%,0.18) 45%, transparent 72%)',
                filter: 'blur(70px)',
              }} />

            {/* Top-right small glassy card — high-reflectivity crystal border */}
            <div className="absolute top-4 right-2 anim-float-slow"
              style={{
                width: '128px', height: '128px',
                borderRadius: '22px',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.18) 100%)',
                backdropFilter: 'blur(22px)',
                WebkitBackdropFilter: 'blur(22px)',
                border: '1.5px solid rgba(255,255,255,0.9)',
                boxShadow: '0 20px 40px -12px hsla(258,60%,50%,0.28), inset 0 1.5px 0 rgba(255,255,255,1), inset -1px -1px 0 rgba(255,255,255,0.5), 0 0 0 1px hsla(258,80%,70%,0.4)',
                transform: 'rotate(10deg)',
              }}>
              <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-2">
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, hsl(258,78%,58%), hsl(285,75%,60%))',
                  boxShadow: '0 8px 18px hsla(258,78%,55%,0.45), inset 0 1px 0 rgba(255,255,255,0.5)',
                }} />
                <div style={{ height: '6px', width: '56px', borderRadius: '3px', background: 'hsla(258,30%,60%,0.28)' }} />
                <div style={{ height: '6px', width: '36px', borderRadius: '3px', background: 'hsla(258,30%,60%,0.18)' }} />
              </div>
            </div>

            {/* Central large glassy shape with shield icon */}
            <div className="relative anim-float"
              style={{
                width: '210px', height: '210px',
                borderRadius: '54px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.60) 0%, rgba(255,255,255,0.20) 100%)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                border: '1.5px solid rgba(255,255,255,0.95)',
                boxShadow: '0 30px 60px -18px hsla(258,60%,50%,0.35), inset 0 2px 0 rgba(255,255,255,1), inset -1.5px -1.5px 0 rgba(255,255,255,0.5), 0 0 0 1.5px hsla(258,80%,68%,0.45)',
              }}>
              {/* Inner iridescent glow */}
              <div className="absolute inset-0 rounded-[54px] pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 30% 25%, hsla(200,90%,70%,0.35), transparent 55%), radial-gradient(circle at 75% 80%, hsla(285,80%,72%,0.30), transparent 55%)',
                }} />
              {/* Circle center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative flex items-center justify-center"
                  style={{
                    width: '132px', height: '132px', borderRadius: '50%',
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.75), rgba(255,255,255,0.30))',
                    border: '1.5px solid rgba(255,255,255,0.95)',
                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.9), 0 8px 20px hsla(258,60%,55%,0.20)',
                  }}>
                  <div className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at 35% 30%, hsla(200,90%,65%,0.35), transparent 60%)',
                      filter: 'blur(6px)',
                    }} />
                  <Shield size={54} strokeWidth={1.6}
                    style={{ color: 'hsl(258,78%,52%)', filter: 'drop-shadow(0 4px 8px hsla(258,78%,55%,0.35))' }} />
                </div>
              </div>
            </div>

            {/* Bottom-left ৳ glass bubble */}
            <div className="absolute bottom-4 left-0 anim-float-delay"
              style={{
                width: '92px', height: '92px', borderRadius: '50%',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.25) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(255,255,255,0.95)',
                boxShadow: '0 16px 32px -10px hsla(258,60%,50%,0.30), inset 0 1.5px 0 rgba(255,255,255,1), 0 0 0 1px hsla(285,80%,70%,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <span style={{
                fontSize: '30px', fontWeight: 900,
                background: 'linear-gradient(135deg, hsl(258,78%,52%), hsl(200,90%,50%))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>৳</span>
            </div>

            <style>{`
              @keyframes hb-float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
              }
              @keyframes hb-float-slow {
                0%, 100% { transform: translateY(0) rotate(10deg); }
                50% { transform: translateY(-8px) rotate(10deg); }
              }
              @keyframes hb-float-delay {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-12px); }
              }
              .anim-float { animation: hb-float 5s ease-in-out infinite; }
              .anim-float-slow { animation: hb-float-slow 6s ease-in-out infinite; }
              .anim-float-delay { animation: hb-float-delay 5.5s ease-in-out infinite 0.6s; }
            `}</style>
          </div>




          {/* ══════════════════════════════════
               RIGHT — Modern floating card
          ══════════════════════════════════ */}
          <div className="relative hidden lg:flex items-center justify-center w-[420px] xl:w-[460px] flex-shrink-0"
            style={{ minHeight: '580px' }}>



            {/* Ambient glow behind card */}
            <div className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 50% 50%, hsla(258,78%,62%,0.12) 0%, hsla(200,90%,55%,0.06) 50%, transparent 72%)',
                filter: 'blur(20px)',
              }} />

            {/* ── Main product card ── */}
            <div
              className="relative anim-float"
              style={{
                width: '300px',
                opacity: dir === 'in' ? 1 : 0,
                transform: dir === 'in' ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 0.32s ease, transform 0.32s ease',
              }}>

              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-[28px]"
                style={{
                  background: 'linear-gradient(145deg, hsla(258,78%,62%,0.22), hsla(200,90%,55%,0.14))',
                  filter: 'blur(18px)',
                  transform: 'scale(1.08)',
                }} />

              {/* Corner accent dots */}
              {[
                { top: '-4px', left: '-4px', bg: 'hsl(258,78%,58%)' },
                { top: '-4px', right: '-4px', bg: 'hsl(200,90%,52%)' },
                { bottom: '-4px', left: '-4px', bg: 'hsl(200,90%,52%)' },
                { bottom: '-4px', right: '-4px', bg: 'hsl(258,78%,58%)' },
              ].map((dot, i) => (
                <div key={i} className="absolute w-2.5 h-2.5 rounded-full z-20"
                  style={{
                    ...dot,
                    boxShadow: `0 0 10px 4px ${dot.bg}88`,
                  }} />
              ))}

              {/* Card surface */}
              <div className="relative rounded-[24px] overflow-hidden z-10"
                style={{
                  background: 'linear-gradient(160deg, rgba(255,255,255,0.97) 0%, rgba(248,246,255,0.95) 55%, rgba(240,250,255,0.96) 100%)',
                  border: '1.5px solid rgba(255,255,255,0.95)',
                  boxShadow: '0 24px 64px hsla(226,35%,12%,0.10), 0 8px 24px hsla(258,78%,55%,0.09), inset 0 1px 0 rgba(255,255,255,1)',
                }}>

                {/* Shimmer top line */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px]"
                  style={{ background: 'linear-gradient(90deg, transparent 5%, hsla(258,78%,64%,0.9) 35%, hsla(200,90%,58%,0.8) 65%, transparent 95%)' }} />

                {/* Specular light */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at 15% 10%, rgba(255,255,255,0.95) 0%, transparent 45%)' }} />

                <div className="relative p-7">

                  {/* Top row: logo + sparkle */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-14 h-14 rounded-[18px] flex items-center justify-center overflow-hidden"
                      style={{
                        background: 'linear-gradient(145deg, hsl(220,30%,98%), hsl(220,20%,95%))',
                        border: '1.5px solid hsla(258,78%,60%,0.16)',
                        boxShadow: '0 4px 16px hsla(258,78%,55%,0.10), inset 0 1px 0 rgba(255,255,255,1)',
                      }}>
                      {slide.logoImg
                        ? <img src={slide.logoImg} alt={`${slide.title || 'Featured Product'} — Buy Genuine License in Bangladesh`} title={slide.title} loading="eager" decoding="async" fetchPriority="high" className="w-9 h-9 object-contain" />
                        : <span className="text-3xl leading-none">{slide.emoji}</span>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Sparkles size={16} className="anim-spin-slow" style={{ color: 'hsl(258,78%,55%)' }} />
                      {slide.logoImg && (
                        <span className="text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                          style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,48%))' }}>
                          OFFICIAL
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Featured label */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-1 h-1 rounded-full" style={{ background: 'hsl(258,78%,55%)' }} />
                    <span className="text-[9.5px] font-black uppercase tracking-[0.22em]"
                      style={{ color: 'hsl(258,78%,55%)' }}>
                      Featured Deal
                    </span>
                  </div>

                  {/* Product name */}
                  <div className="font-sora font-black text-[21px] leading-tight mb-0.5"
                    style={{ color: 'hsl(226,35%,14%)' }}>
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
                  <div className="text-[11.5px] font-medium mb-4" style={{ color: 'hsl(226,20%,48%)' }}>
                    {slide.subtitle}
                  </div>

                  {/* Feature chips */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {slide.features.map(f => (
                      <span key={f}
                        className="text-[10px] font-semibold px-2.5 py-1.5 rounded-full"
                        style={{
                          background: 'hsla(258,78%,55%,0.07)',
                          border: '1px solid hsla(258,78%,60%,0.16)',
                          color: 'hsl(258,78%,50%)',
                        }}>
                        {f}
                      </span>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="mb-4" style={{ borderTop: '1px solid hsla(258,78%,55%,0.09)' }} />

                  {/* Price row */}
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="text-[10.5px] line-through mb-0.5" style={{ color: 'hsl(226,15%,60%)' }}>
                        {slide.original}
                      </div>
                      <div className="font-sora font-black leading-none"
                        style={{ fontSize: '2.1rem', color: 'hsl(226,35%,12%)' }}>
                        {slide.price}
                      </div>
                    </div>
                    {/* Circular off badge */}
                    <div className="w-16 h-16 rounded-full flex flex-col items-center justify-center flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, hsl(258,78%,52%), hsl(215,82%,50%), hsl(200,90%,46%))',
                        boxShadow: '0 8px 22px hsla(258,78%,55%,0.42)',
                      }}>
                      <span className="font-fira font-black text-[13px] text-white leading-none">{slide.off}</span>
                      <span className="text-[7.5px] text-white/80 uppercase tracking-wider mt-0.5">OFF</span>
                    </div>
                  </div>

                  {/* Buy Now button */}
                  <a href={slide.productSlug ? `/product/${slide.productSlug}` : '/shop'}
                    className="btn-vision-primary flex items-center justify-center gap-2 w-full py-4 text-[13.5px]">
                    <Package size={14} /> Buy Now <ArrowRight size={13} />
                  </a>

                </div>
              </div>
            </div>

            {/* ── Floating stat cards ── */}
            {[
              { label: FLOATING[0]?.label ?? 'Orders Today', value: FLOATING[0]?.value ?? '248+', icon: FLOATING[0]?.icon ?? '📦', style: { top: '6%',  left: '-4%' }, delay: '0s'   },
              { label: FLOATING[1]?.label ?? 'Happy Users',  value: FLOATING[1]?.value ?? '12K+', icon: FLOATING[1]?.icon ?? '😊', style: { top: '45%', right: '-6%' }, delay: '1.8s' },
              { label: FLOATING[2]?.label ?? 'Avg Rating',   value: FLOATING[2]?.value ?? '4.9★', icon: FLOATING[2]?.icon ?? '⭐', style: { bottom: '8%', left: '-4%' }, delay: '3.2s' },
            ].map((card, i) => (
              <div key={i}
                className="absolute anim-float"
                style={{ ...card.style, animationDelay: card.delay }}>
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.90)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.96)',
                    boxShadow: '0 6px 22px hsla(226,35%,12%,0.09), 0 1px 0 rgba(255,255,255,1) inset',
                    minWidth: '130px',
                  }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, hsla(258,78%,55%,0.10), hsla(200,90%,55%,0.07))',
                      border: '1px solid hsla(258,78%,60%,0.15)',
                    }}>
                    <span className="text-[18px] leading-none">{card.icon}</span>
                  </div>
                  <div>
                    <div className="font-sora font-black text-[14px] leading-none"
                      style={{
                        background: 'linear-gradient(135deg, hsl(258,78%,52%), hsl(200,90%,45%))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}>
                      {card.value}
                    </div>
                    <div className="text-[10px] mt-0.5 font-medium" style={{ color: 'hsl(226,20%,52%)' }}>
                      {card.label}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Slider Controls (desktop only — mobile has its own) ── */}
        <div className="hidden lg:flex items-center justify-center gap-4 pb-8">
          <button onClick={() => advance(-1)}
            aria-label="Previous hero slide"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(12px)',
              border: '1.5px solid hsla(258,78%,55%,0.18)',
              boxShadow: '0 2px 10px hsla(258,78%,55%,0.10)',
              color: 'hsl(258,78%,52%)',
            }}>
            <ChevronLeft size={15} />
          </button>

          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button key={i}
                aria-label={`Show hero slide ${i + 1}`}
                onClick={() => { setDir('out'); setTimeout(() => { setActive(i); setDir('in'); }, 260); }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === active ? '26px' : '7px',
                  height: '7px',
                  background: i === active
                    ? 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,48%))'
                    : 'hsla(258,60%,60%,0.18)',
                  boxShadow: i === active ? '0 0 8px hsla(258,78%,55%,0.65)' : 'none',
                }} />
            ))}
          </div>

          <button onClick={() => advance(1)}
            aria-label="Next hero slide"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(12px)',
              border: '1.5px solid hsla(258,78%,55%,0.18)',
              boxShadow: '0 2px 10px hsla(258,78%,55%,0.10)',
              color: 'hsl(258,78%,52%)',
            }}>
            <ChevronRight size={15} />
          </button>
        </div>

      </div>
      </div>
    </section>
  );
};

export default HeroBanner;
