import { useState, useEffect, useRef } from 'react';
import { ArrowRight, ShoppingBag, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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

const LOGO_MAP: Record<string, string> = {
  'slide-win11': winLogo,
  'slide-ms365': ms365Logo,
  'slide-idm': idmLogo,
};

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

const HeroBanner = () => {
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState<'in' | 'out'>('in');
  const touchStartX = useRef<number | null>(null);
  const { data: bannerData } = useHeroBanner();

  const SLIDES: Slide[] = bannerData?.slides && bannerData.slides.length > 0
    ? bannerData.slides.filter(s => s.enabled).map(dbSlideToSlide)
    : STATIC_SLIDES;

  useEffect(() => {
    const timer = setInterval(() => advance(1), 6000);
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
  const bgUrl = pickBannerBg(slide);
  const href = slide.productSlug ? `/product/${slide.productSlug}` : '/shop';

  return (
    <section className="relative mt-[64px] lg:mt-[54px] px-2 sm:px-4 lg:px-8 pt-2 pb-3 md:pt-4 md:pb-6">
      <link rel="preload" as="image" href={bannerWin11} />
      <link rel="preload" as="image" href={bannerMs365} />
      <link rel="preload" as="image" href={bannerIdm} />

      {/* Apple-style breathe + halo pulse keyframes (scoped) */}
      <style>{`
        @keyframes hero-breathe {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.025) translateY(-6px); }
        }
        @keyframes hero-halo {
          0%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.85; transform: translate(-50%, -50%) scale(1.08); }
        }
        @keyframes hero-rise {
          from { opacity: 0; transform: translateY(14px); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0);    filter: blur(0); }
        }
        .hero-anim-breathe { animation: hero-breathe 7s ease-in-out infinite; }
        .hero-anim-halo    { animation: hero-halo 6s ease-in-out infinite; }
        .hero-anim-rise > * { animation: hero-rise 0.55s cubic-bezier(.22,.61,.36,1) both; }
        .hero-anim-rise > *:nth-child(1){ animation-delay: 0ms }
        .hero-anim-rise > *:nth-child(2){ animation-delay: 60ms }
        .hero-anim-rise > *:nth-child(3){ animation-delay: 120ms }
        .hero-anim-rise > *:nth-child(4){ animation-delay: 180ms }
        .hero-anim-rise > *:nth-child(5){ animation-delay: 240ms }
        .hero-anim-rise > *:nth-child(6){ animation-delay: 300ms }
      `}</style>

      <div
        className="relative mx-auto w-full max-w-[1400px] rounded-[22px] lg:rounded-[32px] overflow-hidden"
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
        style={{
          background:
            'radial-gradient(1200px 500px at 82% 55%, hsla(258,78%,55%,0.10), transparent 60%),' +
            'radial-gradient(900px 400px at 12% 35%, hsla(200,90%,55%,0.06), transparent 60%),' +
            'linear-gradient(180deg, #ffffff 0%, #fafbff 100%)',
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.9) inset, 0 30px 80px -30px hsla(258,60%,40%,0.18)',
        }}
      >
        <div className="relative w-full aspect-[3/2] sm:aspect-[16/9] lg:aspect-[24/9] max-h-[520px] min-h-[420px] lg:min-h-[460px]">

          {/* ============ ARTWORK SIDE (right on desktop, full on mobile) ============ */}
          <div className="absolute inset-0 lg:left-[46%]">
            {/* Soft violet halo pulsing behind the artwork */}
            <div
              className="hidden lg:block absolute top-1/2 left-1/2 w-[520px] h-[520px] rounded-full pointer-events-none hero-anim-halo"
              style={{
                background:
                  'radial-gradient(circle, hsla(258,80%,60%,0.28) 0%, hsla(215,82%,55%,0.14) 40%, transparent 70%)',
                filter: 'blur(24px)',
              }}
            />
            {/* Second smaller halo for depth */}
            <div
              className="hidden lg:block absolute top-[38%] left-[58%] w-[260px] h-[260px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, hsla(200,95%,58%,0.22) 0%, transparent 70%)',
                filter: 'blur(30px)',
              }}
            />
            <img
              key={`bg-${active}`}
              src={bgUrl}
              alt={`${slide.title} ${slide.titleAccent}`}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="absolute inset-0 w-full h-full object-cover lg:object-contain lg:object-right hero-anim-breathe"
              style={{
                opacity: dir === 'in' ? 1 : 0.35,
                transition: 'opacity 0.45s ease',
              }}
            />
          </div>

          {/* Left→right white wash — guarantees text readability on any admin image (mobile keeps original wash) */}
          <div
            className="absolute inset-0 pointer-events-none lg:hidden"
            style={{
              background:
                'linear-gradient(90deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.25) 30%, rgba(255,255,255,0) 55%)',
            }}
          />
          <div
            className="hidden lg:block absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, #ffffff 0%, #ffffff 30%, rgba(255,255,255,0.85) 45%, rgba(255,255,255,0) 60%)',
            }}
          />

          {/* ============ CONTENT (LEFT) ============ */}
          <div
            className="absolute inset-0 flex items-center"
            style={{
              opacity: dir === 'in' ? 1 : 0,
              transform: dir === 'in' ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.36s ease, transform 0.36s ease',
            }}
          >
            <div
              key={`content-${active}`}
              className="hero-anim-rise w-full sm:w-[64%] lg:w-[50%] pl-4 sm:pl-6 md:pl-10 lg:pl-16 pr-3 sm:pr-4 space-y-3 sm:space-y-4 lg:space-y-5"
            >
              {/* Refined single badge */}
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] lg:text-[11px] font-semibold uppercase tracking-[0.18em] px-3 py-1.5 rounded-full"
                  style={{
                    background: 'hsla(258,78%,55%,0.08)',
                    color: 'hsl(258,78%,42%)',
                    border: '1px solid hsla(258,78%,55%,0.18)',
                  }}
                >
                  <Sparkles size={11} strokeWidth={2.5} />
                  {slide.tag}
                </span>
                <span
                  className="hidden lg:inline-flex items-center text-[10px] font-semibold tracking-[0.22em] uppercase"
                  style={{ color: 'hsl(226,15%,55%)' }}
                >
                  · {slide.badge}
                </span>
              </div>

              {/* Apple-style tight headline */}
              <div>
                <h1
                  className="font-sora leading-[0.98] tracking-[-0.03em]"
                  style={{
                    fontSize: 'clamp(1.6rem, 5vw, 4rem)',
                    fontWeight: 700,
                    color: 'hsl(226,40%,10%)',
                  }}
                >
                  <span className="block">{slide.title}</span>
                  <span
                    className="block"
                    style={{
                      background:
                        'linear-gradient(120deg, hsl(258,82%,54%) 0%, hsl(215,85%,52%) 45%, hsl(200,92%,50%) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontWeight: 800,
                    }}
                  >
                    {slide.titleAccent}
                  </span>
                </h1>
                <p
                  className="text-[12px] sm:text-[14px] lg:text-[16px] mt-2 lg:mt-3 font-medium max-w-[440px]"
                  style={{ color: 'hsl(226,20%,42%)' }}
                >
                  {slide.subtitle}
                </p>
              </div>

              {/* Description — desktop only, thin & airy */}
              <p
                className="hidden lg:block text-[13.5px] leading-[1.6] max-w-[430px] font-normal"
                style={{ color: 'hsl(226,15%,50%)' }}
              >
                {slide.desc}
              </p>

              {/* Price row — Apple-style: original above, huge price below */}
              <div className="flex items-end gap-3 pt-1">
                <div className="flex flex-col">
                  <span
                    className="text-[10px] lg:text-[11px] font-medium line-through"
                    style={{ color: 'hsl(226,15%,60%)' }}
                  >
                    {slide.original}
                  </span>
                  <span
                    className="font-sora leading-none tracking-tight"
                    style={{
                      fontSize: 'clamp(1.4rem, 2.8vw, 2.4rem)',
                      fontWeight: 700,
                      color: 'hsl(226,40%,10%)',
                    }}
                  >
                    {slide.price}
                  </span>
                </div>
                <span
                  className="mb-1.5 text-[10px] lg:text-[11px] font-bold px-2.5 py-1 rounded-md tracking-wide"
                  style={{
                    background: 'hsla(142,72%,45%,0.10)',
                    color: 'hsl(142,72%,32%)',
                    border: '1px solid hsla(142,72%,45%,0.22)',
                  }}
                >
                  SAVE {slide.off.replace('-', '')}
                </span>
              </div>

              {/* CTAs — refined pill buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={href}
                  className="group inline-flex items-center gap-2 px-5 lg:px-7 py-2.5 lg:py-3.5 rounded-full text-white text-[12.5px] lg:text-[14px] font-semibold transition-all active:scale-[0.97] hover:brightness-110"
                  style={{
                    background: 'linear-gradient(135deg, hsl(258,82%,54%) 0%, hsl(215,85%,52%) 100%)',
                    boxShadow: '0 10px 28px -8px hsla(258,80%,50%,0.55), 0 2px 6px hsla(258,80%,40%,0.20)',
                  }}
                >
                  <ShoppingBag size={13} strokeWidth={2.5} />
                  Buy Now
                  <ArrowRight
                    size={13}
                    strokeWidth={2.5}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </a>
                <a
                  href="/shop"
                  className="inline-flex items-center gap-1.5 px-5 lg:px-6 py-2.5 lg:py-3.5 rounded-full text-[12.5px] lg:text-[14px] font-semibold transition-colors hover:bg-black/[0.04]"
                  style={{
                    background: 'transparent',
                    color: 'hsl(226,40%,15%)',
                    border: '1px solid hsla(226,20%,20%,0.14)',
                  }}
                >
                  View All Deals
                  <ArrowRight size={13} strokeWidth={2.5} />
                </a>
              </div>

              {/* Ultra-minimal feature row — Apple dots */}
              <div className="hidden lg:flex items-center gap-6 pt-3">
                {slide.features.slice(0, 3).map((f) => (
                  <span
                    key={f}
                    className="flex items-center gap-2 text-[11.5px] font-medium tracking-wide"
                    style={{ color: 'hsl(226,18%,42%)' }}
                  >
                    <span
                      className="w-1 h-1 rounded-full"
                      style={{
                        background: 'hsl(258,78%,55%)',
                        boxShadow: '0 0 6px hsla(258,78%,55%,0.7)',
                      }}
                    />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Arrow controls — desktop only, thin & minimal */}
          {SLIDES.length > 1 && (
            <>
              <button
                onClick={() => advance(-1)}
                aria-label="Previous hero slide"
                className="hidden lg:flex absolute left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full items-center justify-center transition-all hover:scale-105 hover:bg-white"
                style={{
                  background: 'rgba(255,255,255,0.75)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid hsla(226,20%,20%,0.10)',
                  boxShadow: '0 6px 18px -4px hsla(226,35%,20%,0.10)',
                  color: 'hsl(226,40%,20%)',
                }}
              >
                <ChevronLeft size={17} strokeWidth={2.2} />
              </button>
              <button
                onClick={() => advance(1)}
                aria-label="Next hero slide"
                className="hidden lg:flex absolute right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full items-center justify-center transition-all hover:scale-105 hover:bg-white"
                style={{
                  background: 'rgba(255,255,255,0.75)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid hsla(226,20%,20%,0.10)',
                  boxShadow: '0 6px 18px -4px hsla(226,35%,20%,0.10)',
                  color: 'hsl(226,40%,20%)',
                }}
              >
                <ChevronRight size={17} strokeWidth={2.2} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Pagination — thin bars, Apple-style */}
      {SLIDES.length > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
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
                }, 280);
              }}
              className="rounded-full transition-all duration-500"
              style={{
                width: i === active ? '28px' : '6px',
                height: '4px',
                background:
                  i === active
                    ? 'linear-gradient(90deg, hsl(258,78%,55%), hsl(200,90%,48%))'
                    : 'hsla(226,15%,75%,1)',
                boxShadow: i === active ? '0 0 10px hsla(258,78%,55%,0.55)' : 'none',
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroBanner;
