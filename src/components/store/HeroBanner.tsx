import { useState, useEffect, useRef } from 'react';
import { ArrowRight, ShoppingBag, TrendingUp, Zap, Shield, Clock, Star, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import idmLogo from '@/assets/idm.webp';
import ms365Logo from '@/assets/ms365-logo.png';
import winLogo from '@/assets/windows-logo.png';
import bannerWin11Asset from '@/assets/banner-win11.webp.asset.json';
import bannerMs365Asset from '@/assets/banner-ms365.webp.asset.json';
import bannerIdmAsset from '@/assets/banner-idm.webp.asset.json';
const bannerWin11 = bannerWin11Asset.url;
const bannerMs365 = bannerMs365Asset.url;
const bannerIdm = bannerIdmAsset.url;
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
    emoji: '🪟', bgImage: bannerWin11, features: ['Lifetime License', 'Instant Delivery', 'All Devices'],
    productSlug: 'windows-11-pro-licence-key-price-in-bd',
  },
  {
    tag: 'Flash Deal', tagIcon: '⚡',
    title: 'Microsoft', titleAccent: '365',
    subtitle: 'Personal — 1 Year',
    desc: 'Full Office suite: Word, Excel, PowerPoint, OneDrive 1TB. Premium productivity tools.',
    price: '৳1,999', original: '৳16,500', off: '-88%', badge: 'LIMITED TIME',
    accentFrom: 'hsl(258,78%,55%)', accentTo: 'hsl(200,90%,48%)',
    emoji: '📦', logoImg: ms365Logo, bgImage: bannerMs365, features: ['1TB OneDrive', '5 Devices', '1 Year'],
    productSlug: 'microsoft-office-365-personal-price-in-bangladesh',
  },
  {
    tag: 'Official Reseller', tagIcon: '🏆',
    title: 'IDM', titleAccent: 'Lifetime',
    subtitle: 'Internet Download Manager',
    desc: 'আমরা IDM-এর অফিশিয়াল রিসেলার। একবার কিনুন, সারাজীবন ব্যবহার করুন।',
    price: '৳2,650', original: '৳6,500', off: '-59%', badge: 'OFFICIAL RESELLER',
    accentFrom: 'hsl(258,78%,55%)', accentTo: 'hsl(200,90%,48%)',
    emoji: '⚡', logoImg: idmLogo, bgImage: bannerIdm, features: ['Official Reseller ✓', 'Lifetime License', 'Instant Delivery'],
    productSlug: 'internet-download-manager-idm-lifetime-key',
  },
];

const LOGO_MAP: Record<string, string> = {
  'slide-win11': winLogo,
  'slide-ms365': ms365Logo,
  'slide-idm': idmLogo,
};

// Admin-uploaded bgImage always wins. Fallback bundled banners by product.
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

const dbSlideToSlide = (s: SlideData): Slide => ({
  tag: s.tag, tagIcon: s.tagIcon || '', title: s.title, titleAccent: s.titleAccent,
  subtitle: s.subtitle, desc: s.desc, price: s.price,
  original: s.original, off: s.off.startsWith('-') ? s.off : `-${s.off}`, badge: s.badge,
  accentFrom: s.accentFrom || 'hsl(258,78%,55%)', accentTo: s.accentTo || 'hsl(200,90%,48%)',
  emoji: s.emoji, logoImg: LOGO_MAP[s.id] || s.logoImg || undefined,
  bgImage: s.bgImage || undefined,
  features: s.features, productSlug: s.productSlug || '',
});

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
  const bgUrl = pickBannerBg(slide);
  const href = slide.productSlug ? `/product/${slide.productSlug}` : '/shop';

  return (
    <section className="relative mt-[64px] lg:mt-[54px] px-2 sm:px-4 lg:px-6 pt-2 pb-3 md:pt-3 md:pb-5">
      <style>{`
        @keyframes hb-ken-burns {
          0%   { transform: scale(1.02) translate(0,0); }
          50%  { transform: scale(1.08) translate(-1.2%, -0.8%); }
          100% { transform: scale(1.02) translate(0,0); }
        }
        @keyframes hb-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes hb-fade-up {
          0%   { opacity: 0; transform: translateY(18px); filter: blur(6px); }
          100% { opacity: 1; transform: translateY(0);    filter: blur(0);   }
        }
        @keyframes hb-pulse-dot {
          0%,100% { transform: scale(1);   opacity: 1;   }
          50%     { transform: scale(1.4); opacity: 0.7; }
        }
        @keyframes hb-cta-glow {
          0%,100% { box-shadow: 0 8px 22px hsla(258,78%,55%,0.35), 0 0 0 0 hsla(200,90%,48%,0.35); }
          50%     { box-shadow: 0 12px 32px hsla(258,78%,55%,0.55), 0 0 26px 6px hsla(200,90%,48%,0.28); }
        }
        @keyframes hb-sweep {
          0%   { transform: translateX(-120%) skewX(-18deg); }
          100% { transform: translateX(260%)  skewX(-18deg); }
        }
        @keyframes hb-float-orb {
          0%,100% { transform: translate(0,0) scale(1);   opacity: 0.55; }
          50%     { transform: translate(14px,-18px) scale(1.08); opacity: 0.85; }
        }
        @keyframes hb-badge-breathe {
          0%,100% { box-shadow: 0 4px 16px hsla(258,78%,55%,0.32); }
          50%     { box-shadow: 0 6px 24px hsla(258,78%,55%,0.55), 0 0 18px hsla(200,90%,48%,0.35); }
        }
        .hb-ken       { animation: hb-ken-burns 18s ease-in-out infinite; }
        .hb-fade-up   { animation: hb-fade-up 0.75s cubic-bezier(.16,1,.3,1) both; }
        .hb-pulse-dot { animation: hb-pulse-dot 1.6s ease-in-out infinite; }
        .hb-cta-glow  { animation: hb-cta-glow 2.8s ease-in-out infinite; }
        .hb-badge-breathe { animation: hb-badge-breathe 3s ease-in-out infinite; }
        .hb-orb       { animation: hb-float-orb 7s ease-in-out infinite; }
        .hb-shimmer-text {
          background-image: linear-gradient(90deg,
            hsl(258,78%,52%) 0%, hsl(215,82%,52%) 25%, hsl(200,90%,46%) 50%,
            hsl(215,82%,52%) 75%, hsl(258,78%,52%) 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: hb-shimmer 4.5s linear infinite;
        }
        .hb-cta-sweep::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%);
          transform: translateX(-120%) skewX(-18deg);
          animation: hb-sweep 3.2s ease-in-out infinite;
          pointer-events: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .hb-ken, .hb-fade-up, .hb-pulse-dot, .hb-cta-glow, .hb-badge-breathe,
          .hb-orb, .hb-shimmer-text, .hb-cta-sweep::after { animation: none !important; }
        }
      `}</style>

      {/* Preload fallback banners so first paint is instant */}
      <link rel="preload" as="image" href={bannerWin11} />
      <link rel="preload" as="image" href={bannerMs365} />
      <link rel="preload" as="image" href={bannerIdm} />

      <div
        className="relative mx-auto w-full max-w-[1800px] rounded-[20px] lg:rounded-[28px] overflow-hidden"
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
        {/* Full-bleed banner image — admin-uploaded design lives here */}
        <div className="relative w-full aspect-[3/2] sm:aspect-[16/9] lg:aspect-[21/9] max-h-[560px]">
          <img
            key={`bg-${active}`}
            src={bgUrl}
            alt={`${slide.title} ${slide.titleAccent}`}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover hb-ken"
            style={{
              opacity: dir === 'in' ? 1 : 0.55,
              transition: 'opacity 0.35s ease',
            }}
          />

          {/* Ambient floating orbs — very subtle */}
          <div
            aria-hidden
            className="absolute -top-16 -right-10 w-64 h-64 rounded-full pointer-events-none hb-orb"
            style={{ background: 'radial-gradient(circle, hsla(258,78%,55%,0.28), transparent 70%)', filter: 'blur(20px)' }}
          />
          <div
            aria-hidden
            className="absolute -bottom-20 left-1/4 w-72 h-72 rounded-full pointer-events-none hb-orb"
            style={{ background: 'radial-gradient(circle, hsla(200,90%,48%,0.22), transparent 70%)', filter: 'blur(24px)', animationDelay: '2s' }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.20) 30%, rgba(255,255,255,0) 55%)',
            }}
          />




          {/* Text overlay — same copy as before, sits on the empty left side of the banner */}
          <div
            className="absolute inset-0 flex items-center"
            style={{
              opacity: dir === 'in' ? 1 : 0,
              transform: dir === 'in' ? 'translateX(0)' : 'translateX(-14px)',
              transition: 'opacity 0.32s ease, transform 0.32s ease',
            }}
          >
            <div className="w-full sm:w-[62%] lg:w-[52%] pl-4 sm:pl-6 md:pl-8 lg:pl-12 pr-3 sm:pr-4 space-y-2 sm:space-y-3 md:space-y-4">
              {/* Tag + badge */}
              <div key={`row1-${active}`} className="flex flex-wrap items-center gap-1.5 sm:gap-2 hb-fade-up" style={{ animationDelay: '0.05s' }}>
                <span
                  className="inline-flex items-center gap-1 text-[8px] sm:text-[9.5px] font-black uppercase tracking-[0.16em] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-white hb-badge-breathe"
                  style={{
                    background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(215,82%,52%))',
                    boxShadow: '0 4px 16px hsla(258,78%,55%,0.32)',
                  }}
                >
                  <span className="text-[10px] sm:text-[11px] inline-block hb-pulse-dot">{slide.tagIcon || '✦'}</span>
                  {slide.tag}
                </span>

                <span
                  className="hidden sm:inline-flex items-center text-[9px] font-bold tracking-widest uppercase px-2.5 py-1.5 rounded-full"
                  style={{
                    background: 'hsla(258,78%,55%,0.10)',
                    border: '1px solid hsla(258,78%,55%,0.20)',
                    color: 'hsl(258,78%,45%)',
                  }}
                >
                  {slide.badge}
                </span>
              </div>

              {/* Headline */}
              <div key={`h-${active}`} className="hb-fade-up" style={{ animationDelay: '0.15s' }}>
                <h1
                  className="font-sora font-black leading-[1.05] tracking-tight"
                  style={{
                    fontSize: 'clamp(1.35rem, 4.2vw, 3.2rem)',
                    color: 'hsl(226,35%,12%)',
                  }}
                >
                  <span className="block">{slide.title}</span>
                  <span className="block hb-shimmer-text">
                    {slide.titleAccent}
                  </span>
                </h1>
                <p
                  className="text-[11px] sm:text-[13px] lg:text-[14px] font-semibold mt-1 sm:mt-2 line-clamp-2"
                  style={{ color: 'hsl(226,22%,40%)' }}
                >
                  {slide.subtitle}
                </p>
              </div>


              {/* Description — hidden on very small screens to keep it clean */}
              <p
                key={`d-${active}`}
                className="hidden md:block text-[12.5px] leading-relaxed max-w-[420px] hb-fade-up"
                style={{ color: 'hsl(226,18%,48%)', animationDelay: '0.25s' }}
              >
                {slide.desc}
              </p>

              <div key={`fp-${active}`} className="hidden lg:flex flex-wrap gap-1.5 hb-fade-up" style={{ animationDelay: '0.35s' }}>

                {slide.features.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
                    style={{
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid hsla(258,78%,55%,0.18)',
                      color: 'hsl(258,78%,48%)',
                      boxShadow: '0 2px 8px hsla(258,78%,55%,0.10)',
                    }}
                  >
                    <CheckCircle2 size={10} style={{ color: 'hsl(200,90%,46%)' }} />
                    {f}
                  </span>
                ))}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  className="font-sora font-black leading-none tracking-tight"
                  style={{
                    fontSize: 'clamp(1.1rem, 2.6vw, 2rem)',
                    color: 'hsl(226,35%,12%)',
                  }}
                >
                  {slide.price}
                </span>
                <span className="text-[10px] sm:text-xs line-through font-medium" style={{ color: 'hsl(226,15%,55%)' }}>
                  {slide.original}
                </span>
                <span
                  className="text-[9px] sm:text-[10.5px] font-black text-white px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,48%))',
                    boxShadow: '0 3px 10px hsla(258,78%,55%,0.32)',
                  }}
                >
                  {slide.off} OFF
                </span>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-2">
                <a
                  href={href}
                  className="inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-white text-[11px] sm:text-[12.5px] font-bold active:scale-95 transition-transform"
                  style={{
                    background: 'linear-gradient(135deg, hsl(258,78%,52%), hsl(215,82%,50%))',
                    boxShadow: '0 8px 22px hsla(258,78%,55%,0.35)',
                  }}
                >
                  <ShoppingBag size={12} strokeWidth={2.5} />
                  Buy Now
                  <ArrowRight size={12} strokeWidth={2.5} />
                </a>
                <a
                  href="/shop"
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[12.5px] font-bold"
                  style={{
                    background: 'rgba(255,255,255,0.9)',
                    border: '1.5px solid hsla(258,78%,55%,0.22)',
                    color: 'hsl(258,78%,45%)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <TrendingUp size={12} /> View All Deals
                </a>
              </div>

              {/* Trust row — desktop */}
              <div className="hidden lg:flex flex-wrap gap-3 pt-1">
                {DEFAULT_TRUST.map((t) => (
                  <span
                    key={t.text}
                    className="flex items-center gap-1.5 text-[10.5px] font-semibold"
                    style={{ color: 'hsl(226,20%,45%)' }}
                  >
                    <span style={{ color: 'hsl(258,78%,55%)' }}>{t.icon}</span>
                    {t.text}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Arrow controls — desktop only */}
          {SLIDES.length > 1 && (
            <>
              <button
                onClick={() => advance(-1)}
                aria-label="Previous hero slide"
                className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full items-center justify-center transition-all hover:scale-110"
                style={{
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(12px)',
                  border: '1.5px solid hsla(258,78%,55%,0.20)',
                  boxShadow: '0 4px 14px hsla(226,35%,12%,0.10)',
                  color: 'hsl(258,78%,50%)',
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => advance(1)}
                aria-label="Next hero slide"
                className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full items-center justify-center transition-all hover:scale-110"
                style={{
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(12px)',
                  border: '1.5px solid hsla(258,78%,55%,0.20)',
                  boxShadow: '0 4px 14px hsla(226,35%,12%,0.10)',
                  color: 'hsl(258,78%,50%)',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Pagination dots */}
      {SLIDES.length > 1 && (
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
                width: i === active ? '24px' : '7px',
                height: '7px',
                background:
                  i === active
                    ? 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,48%))'
                    : 'hsla(220,15%,78%,1)',
                boxShadow: i === active ? '0 0 8px hsla(258,78%,55%,0.55)' : 'none',
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroBanner;
