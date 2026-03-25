import { useState, useEffect } from 'react';
import { ArrowRight, ShoppingBag, TrendingUp, Zap, Shield, Clock, Star, ChevronLeft, ChevronRight, Sparkles, CheckCircle2, Package } from 'lucide-react';
import idmLogo from '@/assets/idm.webp';
import ms365Logo from '@/assets/ms365-logo.png';
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

const dbSlideToSlide = (s: SlideData): Slide => ({
  tag: s.tag, tagIcon: '', title: s.title, titleAccent: s.titleAccent,
  subtitle: s.subtitle, desc: s.desc, price: s.price,
  original: s.original, off: s.off.startsWith('-') ? s.off : `-${s.off}`, badge: s.badge,
  accentFrom: 'hsl(258,78%,55%)', accentTo: 'hsl(200,90%,48%)',
  emoji: s.emoji, features: s.features, productSlug: s.productSlug || '',
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
    <section className="relative overflow-hidden" style={{ background: bgStyle }}>

      {/* LCP element: gives browser a fast-loading image to track for Core Web Vitals */}
      <img
        src="/favicon.png"
        alt="Shahed Store"
        width={1}
        height={1}
        fetchPriority="high"
        decoding="sync"
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none', top: 0, left: 0 }}
      />


      <div className="absolute inset-0 pointer-events-none">
        {/* Large gradient sphere top-right */}
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsla(258,78%,62%,0.09) 0%, hsla(200,90%,55%,0.05) 40%, transparent 70%)',
            filter: 'blur(1px)',
          }} />
        {/* Bottom-left soft sphere */}
        <div className="absolute bottom-0 -left-32 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsla(200,90%,55%,0.07) 0%, transparent 65%)',
            filter: 'blur(1px)',
          }} />
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle, hsla(258,60%,55%,0.06) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />
        {/* Top shimmer */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 0%, hsla(258,78%,62%,0.4) 40%, hsla(200,90%,55%,0.4) 60%, transparent 100%)' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-0 pt-14 pb-10 lg:pt-20 lg:pb-14">

          {/* ══════════════════════════════════
               LEFT — Bold editorial content
          ══════════════════════════════════ */}
          <div className="flex-1 lg:pr-16 space-y-7 text-center lg:text-left"
            style={{
              opacity: dir === 'in' ? 1 : 0,
              transform: dir === 'in' ? 'none' : 'translateX(-18px)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}>

            {/* Category tag */}
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full text-white"
                style={{
                  background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(215,82%,52%))',
                  boxShadow: '0 4px 16px hsla(258,78%,55%,0.35)',
                }}>
                <span className="text-[13px]">{slide.tagIcon || '✦'}</span>
                {slide.tag}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-2 rounded-full"
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
              <h1 className="font-sora font-black leading-[1.0] tracking-tight"
                style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', color: 'hsl(226,35%,12%)' }}>
                {slide.title}
              </h1>
              <h1 className="font-sora font-black leading-[1.0] tracking-tight"
                style={{
                  fontSize: 'clamp(3rem, 8vw, 5.5rem)',
                  background: 'linear-gradient(135deg, hsl(258,78%,52%) 0%, hsl(215,82%,52%) 50%, hsl(200,90%,46%) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                {slide.titleAccent}
              </h1>
              <p className="text-base lg:text-lg font-semibold mt-3"
                style={{ color: 'hsl(226,22%,44%)' }}>
                {slide.subtitle}
              </p>
            </div>

            {/* Description */}
            <p className="text-[14px] leading-relaxed max-w-[420px] mx-auto lg:mx-0"
              style={{ color: 'hsl(226,18%,52%)' }}>
              {slide.desc}
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {slide.features.map(f => (
                <span key={f}
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-full"
                  style={{
                    background: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid hsla(258,78%,55%,0.18)',
                    color: 'hsl(258,78%,50%)',
                    boxShadow: '0 2px 8px hsla(258,78%,55%,0.08)',
                  }}>
                  <CheckCircle2 size={11} style={{ color: 'hsl(200,90%,46%)' }} />
                  {f}
                </span>
              ))}
            </div>

            {/* Price + CTA */}
            <div className="space-y-4">
              {/* Price row */}
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div>
                  <div className="text-sm line-through font-medium" style={{ color: 'hsl(226,15%,58%)' }}>
                    {slide.original}
                  </div>
                  <div className="font-sora font-black"
                    style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', color: 'hsl(226,35%,12%)', lineHeight: 1 }}>
                    {slide.price}
                  </div>
                </div>
                <span className="self-end mb-1 inline-flex items-center text-[11.5px] font-black text-white px-3.5 py-2 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,48%))',
                    boxShadow: '0 4px 14px hsla(258,78%,55%,0.40)',
                  }}>
                  {slide.off} OFF
                </span>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <a href={slide.productSlug ? `/product/${slide.productSlug}` : '/shop'}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-[14px] font-bold text-white transition-all duration-200 hover:scale-[1.03] hover:brightness-105 active:scale-[0.97]"
                  style={{
                    background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(215,82%,52%), hsl(200,90%,48%))',
                    boxShadow: '0 8px 28px hsla(258,78%,55%,0.40), 0 1px 0 rgba(255,255,255,0.22) inset',
                  }}>
                  <ShoppingBag size={15} /> Buy Now <ArrowRight size={13} />
                </a>
                <a href="/shop"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[14px] font-semibold transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: 'rgba(255,255,255,0.88)',
                    backdropFilter: 'blur(16px)',
                    border: '1.5px solid hsla(258,78%,55%,0.20)',
                    boxShadow: '0 4px 16px hsla(258,78%,55%,0.08)',
                    color: 'hsl(258,78%,50%)',
                  }}>
                  <TrendingUp size={14} /> View All Deals
                </a>
              </div>
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-1">
              {DEFAULT_TRUST.map(t => (
                <span key={t.text}
                  className="flex items-center gap-1.5 text-[11.5px] font-semibold"
                  style={{ color: 'hsl(226,20%,50%)' }}>
                  <span style={{ color: 'hsl(258,78%,55%)' }}>{t.icon}</span>
                  {t.text}
                </span>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════
               RIGHT — Modern floating card
          ══════════════════════════════════ */}
          <div className="relative hidden lg:flex items-center justify-center w-[480px] flex-shrink-0"
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
                        ? <img src={slide.logoImg} alt="product" className="w-9 h-9 object-contain" />
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
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-[13.5px] text-white transition-all duration-200 hover:scale-[1.02] hover:brightness-105 active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, hsl(258,78%,52%), hsl(215,82%,50%), hsl(200,90%,46%))',
                      boxShadow: '0 10px 28px hsla(258,78%,55%,0.40), 0 1px 0 rgba(255,255,255,0.22) inset',
                    }}>
                    <Package size={14} /> Buy Now <ArrowRight size={13} />
                  </a>
                </div>
              </div>
            </div>

            {/* ── Floating stat cards ── */}
            {[
              { label: FLOATING[0]?.label ?? 'Orders Today', value: FLOATING[0]?.value ?? '248+', icon: FLOATING[0]?.icon ?? '📦', style: { top: '8%',  left: '-15%' }, delay: '0s'   },
              { label: FLOATING[1]?.label ?? 'Happy Users',  value: FLOATING[1]?.value ?? '12K+', icon: FLOATING[1]?.icon ?? '😊', style: { top: '45%', right: '-16%' }, delay: '1.8s' },
              { label: FLOATING[2]?.label ?? 'Avg Rating',   value: FLOATING[2]?.value ?? '4.9★', icon: FLOATING[2]?.icon ?? '⭐', style: { bottom: '10%', left: '-14%' }, delay: '3.2s' },
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

        {/* ── Slider Controls ── */}
        <div className="flex items-center justify-center gap-4 pb-8">
          <button onClick={() => advance(-1)}
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

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 py-8 mx-4"
          style={{ borderTop: '1px solid hsla(258,78%,55%,0.08)' }}>
          {STATS.map(s => (
            <div key={s.label} className="group flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 hover:scale-[1.03] cursor-default"
              style={{
                background: 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(12px)',
                border: '1px solid hsla(258,78%,55%,0.09)',
                boxShadow: '0 2px 12px hsla(226,35%,12%,0.05)',
              }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-[1.2rem]"
                style={{
                  background: 'linear-gradient(135deg, hsla(258,78%,55%,0.09), hsla(200,90%,55%,0.06))',
                  border: '1px solid hsla(258,78%,55%,0.12)',
                }}>
                {s.icon}
              </div>
              <div>
                <div className="font-sora font-black text-[1.25rem] leading-none"
                  style={{
                    background: 'linear-gradient(135deg, hsl(258,78%,52%), hsl(200,90%,45%))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                  {s.value}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wide mt-0.5"
                  style={{ color: 'hsl(226,20%,54%)' }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
