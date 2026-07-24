import { useState, useEffect, useRef } from 'react';
import { ArrowRight, ShoppingBag, TrendingUp, Zap, Shield, Clock, Star, ChevronLeft, ChevronRight, Sparkles, CheckCircle2, Package } from 'lucide-react';
import idmLogo from '@/assets/idm.webp';
import ms365Logo from '@/assets/ms365-logo.png';
import winLogo from '@/assets/windows-logo.png';
import bannerWin11 from '@/assets/banner-win11.jpg';
import bannerMs365 from '@/assets/banner-ms365.jpg';
import bannerIdm from '@/assets/banner-idm.jpg';
import { useHeroBanner, type SlideData } from '@/hooks/useHeroBanner';

type Slide = {
  tag: string; tagIcon: string; title: string; titleAccent: string; subtitle: string; desc: string;
  price: string; original: string; off: string; badge: string;
  accentFrom: string; accentTo: string;
  emoji: string; logoImg?: string; bgImage?: string; features: string[]; productSlug?: string;
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

// Pick a full-bleed professional background image per slide. Admin-uploaded bgImage wins.
const pickBannerBg = (s: Slide): string => {
  if (s.bgImage && s.bgImage.trim()) return s.bgImage;
  const t = `${s.title} ${s.titleAccent}`.toLowerCase();
  const slug = (s.productSlug || '').toLowerCase();
  if (t.includes('idm') || slug.includes('idm') || slug.includes('download-manager')) return bannerIdm;
  if (t.includes('365') || t.includes('office') || slug.includes('365') || slug.includes('office')) return bannerMs365;
  if (t.includes('windows') || slug.includes('windows')) return bannerWin11;
  const pool = [bannerWin11, bannerMs365, bannerIdm];
  const idx = Math.abs(t.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % pool.length;
  return pool[idx];
};


// Themed full-background color gradient per slide (mobile banner)
const pickBannerTheme = (s: Slide): { bg: string; accent: string } => {
  const t = `${s.title} ${s.titleAccent}`.toLowerCase();
  const slug = (s.productSlug || '').toLowerCase();
  if (t.includes('idm') || slug.includes('idm') || slug.includes('download-manager'))
    return { bg: 'linear-gradient(120deg, #e0f7fa 0%, #b2ebf2 45%, #80deea 100%)', accent: 'hsl(188,85%,32%)' };
  if (t.includes('365') || t.includes('office') || slug.includes('365') || slug.includes('office'))
    return { bg: 'linear-gradient(120deg, #fff3e0 0%, #ffe0b2 45%, #ffcc80 100%)', accent: 'hsl(22,90%,42%)' };
  if (t.includes('windows') || slug.includes('windows'))
    return { bg: 'linear-gradient(120deg, #ede7f6 0%, #d1c4e9 45%, #b39ddb 100%)', accent: 'hsl(258,78%,45%)' };
  return { bg: 'linear-gradient(120deg, #ede7f6 0%, #d1c4e9 45%, #b39ddb 100%)', accent: 'hsl(258,78%,45%)' };
};


const dbSlideToSlide = (s: SlideData): Slide => ({
  tag: s.tag, tagIcon: s.tagIcon || '', title: s.title, titleAccent: s.titleAccent,
  subtitle: s.subtitle, desc: s.desc, price: s.price,
  original: s.original, off: s.off.startsWith('-') ? s.off : `-${s.off}`, badge: s.badge,
  accentFrom: s.accentFrom || 'hsl(258,78%,55%)', accentTo: s.accentTo || 'hsl(200,90%,48%)',
  emoji: s.emoji, logoImg: LOGO_MAP[s.id] || s.logoImg || undefined,
  bgImage: s.bgImage || undefined,
  features: s.features, productSlug: s.productSlug || '',
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
  const touchStartX = useRef<number | null>(null);
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
    <section className="relative overflow-hidden mt-[64px] lg:mt-[54px] px-0 sm:px-5 lg:px-8 pt-0 pb-3 sm:pt-3 md:pt-4 md:pb-6 lg:pt-4 lg:pb-8" style={{ background: bgStyle }}>
      {/* Preload first-slide backgrounds so mobile banner paints instantly */}
      <link rel="preload" as="image" href={bannerWin11} />
      <link rel="preload" as="image" href={bannerMs365} />
      <link rel="preload" as="image" href={bannerIdm} />



      {/* ── Luminous ambient orbs (desktop only) ── */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        <div className="absolute -top-[10%] -right-[5%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'hsla(258,78%,62%,0.22)', filter: 'blur(120px)' }} />
        <div className="absolute -bottom-[10%] -left-[5%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'hsla(230,80%,70%,0.18)', filter: 'blur(140px)' }} />
        <div className="absolute top-[25%] left-[33%] w-[300px] h-[300px] rounded-full"
          style={{ background: 'hsla(270,70%,72%,0.16)', filter: 'blur(100px)' }} />
      </div>

      {/* ── Glass card frame (desktop only — mobile shows the raw banner) ── */}
      <div className="relative mx-auto w-full max-w-[1800px] lg:rounded-[40px] lg:overflow-hidden isolate lg:bg-[linear-gradient(135deg,rgba(255,255,255,0.72)_0%,rgba(245,243,255,0.55)_50%,rgba(235,240,255,0.6)_100%)] lg:backdrop-blur-[32px] lg:border lg:border-[hsla(258,60%,70%,0.45)]"
        style={{
          boxShadow: undefined,
        }}>
        {/* Soft inner accent — desktop only */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none hidden lg:block"
          style={{ background: 'radial-gradient(circle, hsla(258,78%,60%,0.10), transparent 70%)', transform: 'translate(30%,-30%)' }} />



        {/* ══════════════════════════════════
             MOBILE — Premium Clean White + Soft Bubble carousel
             (< lg only; desktop keeps original layout below)
        ══════════════════════════════════ */}
        <div className="lg:hidden px-2 pt-0 pb-2">
          <div
            className="relative w-full rounded-[24px] overflow-hidden"
            style={{ height: '260px', background: pickBannerTheme(slide).bg }}
            role="region"
            aria-roledescription="carousel"
            aria-label="Featured deals"
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (touchStartX.current == null) return;
              const dx = e.changedTouches[0].clientX - touchStartX.current;
              if (Math.abs(dx) > 40) advance(dx < 0 ? 1 : -1);
              touchStartX.current = null;
            }}
          >
            {/* Full themed color background (already on wrapper). Crisp product image on the right, cleanly cropped into the color. */}
            <img
              key={`bg-${active}`}
              src={pickBannerBg(slide)}
              alt=""
              aria-hidden="true"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="absolute right-0 top-0 h-full w-[62%] object-cover pointer-events-none"
              style={{
                objectPosition: 'right center',
                opacity: dir === 'in' ? 1 : 0.4,
                transform: dir === 'in' ? 'scale(1)' : 'scale(1.03)',
                transition: 'opacity 0.35s ease, transform 0.5s ease',
                maskImage: 'linear-gradient(90deg, transparent 0%, #000 28%)',
                WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 28%)',
              }}
            />

            {/* Luminous glow on the LEFT side — matches the illuminated feel of the product image on the right */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: '-20%',
                top: '-30%',
                width: '75%',
                height: '160%',
                background: `radial-gradient(ellipse at center, ${pickBannerTheme(slide).accent.replace('hsl', 'hsla').replace(')', ',0.28)')} 0%, transparent 65%)`,
                filter: 'blur(30px)',
              }}
            />
            <div
              className="absolute pointer-events-none"
              style={{
                left: '10%',
                top: '20%',
                width: '40%',
                height: '60%',
                background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.55) 0%, transparent 70%)',
                filter: 'blur(24px)',
              }}
            />


            {/* Left content — product info (name, price, CTA). No top tag/badge row — cleaner premium look. */}
            <div
              className="relative z-10 w-[66%] h-full pl-4 pr-2 py-3 flex flex-col justify-center gap-2"
              style={{
                opacity: dir === 'in' ? 1 : 0,
                transform: dir === 'in' ? 'translateX(0)' : 'translateX(-14px)',
                transition: 'opacity 0.32s ease, transform 0.32s ease',
              }}
            >


              {/* Title */}
              <div>
                <h2
                  className="font-sora font-black leading-[1.1] text-gray-900 tracking-tight"
                  style={{ fontSize: '20px' }}
                >
                  {slide.title}{' '}
                  <span
                    style={{
                      color: pickBannerTheme(slide).accent,
                      fontWeight: 900,
                    }}
                  >
                    {slide.titleAccent}
                  </span>
                </h2>
                <p className="text-[11px] text-gray-700 font-medium leading-snug line-clamp-1 mt-0.5">
                  {slide.subtitle}
                </p>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1.5 flex-wrap pt-0.5">
                <span className="text-[20px] font-black text-gray-900 leading-none font-sora tracking-tight">
                  {slide.price}
                </span>
                <span className="text-[10px] text-gray-500 line-through">{slide.original}</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded" style={{ color: 'hsl(0,78%,45%)', background: 'hsla(0,78%,50%,0.10)' }}>
                  {slide.off} OFF
                </span>
              </div>

              {/* CTA */}
              <div className="pt-1.5">
                <a
                  href={slide.productSlug ? `/product/${slide.productSlug}` : '/shop'}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-[11px] font-bold active:scale-95 transition-transform"
                  style={{
                    background: 'linear-gradient(135deg, hsl(258,78%,52%), hsl(215,82%,50%))',
                  }}
                >
                  <ShoppingBag size={11} strokeWidth={2.5} />
                  Buy Now
                  <ArrowRight size={11} strokeWidth={2.5} />
                </a>
              </div>
            </div>
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
               RIGHT — Admin-uploaded banner image (desktop)
          ══════════════════════════════════ */}
          <div
            className="relative hidden lg:flex items-center justify-center flex-shrink-0"
            style={{ width: '560px', xl: '620px' as unknown as string, minHeight: '440px' }}
          >
            {/* Ambient glow behind the image */}
            <div
              className="absolute inset-0 pointer-events-none rounded-[32px]"
              style={{
                background: 'radial-gradient(ellipse at 50% 50%, hsla(258,78%,62%,0.14) 0%, hsla(200,90%,55%,0.07) 55%, transparent 75%)',
                filter: 'blur(24px)',
              }}
            />

            <a
              href={slide.productSlug ? `/product/${slide.productSlug}` : '/shop'}
              className="relative block w-full h-full max-h-[440px] rounded-[28px] overflow-hidden"
              style={{
                boxShadow: '0 24px 64px hsla(226,35%,12%,0.12), 0 8px 24px hsla(258,78%,55%,0.10)',
                border: '1.5px solid rgba(255,255,255,0.9)',
                opacity: dir === 'in' ? 1 : 0,
                transform: dir === 'in' ? 'translateY(0)' : 'translateY(14px)',
                transition: 'opacity 0.32s ease, transform 0.32s ease',
              }}
              aria-label={`${slide.title} ${slide.titleAccent}`}
            >
              <img
                key={`desktop-bg-${active}`}
                src={pickBannerBg(slide)}
                alt={`${slide.title} ${slide.titleAccent}`}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="w-full h-full object-cover"
                style={{ display: 'block' }}
              />
            </a>
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
