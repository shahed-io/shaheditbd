import { useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHeroBanner, type SlideData } from '@/hooks/useHeroBanner';
import heroWindowsAsset from '@/assets/hero-windows.png.asset.json';
import heroOfficeAsset from '@/assets/hero-office.png.asset.json';
import heroIdmAsset from '@/assets/hero-idm.png.asset.json';

type Slide = {
  tag: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  price: string;
  original: string;
  off: string;
  accentFrom: string;
  accentTo: string;
  heroImage: string;
  productSlug?: string;
};

const STATIC_SLIDES: Slide[] = [
  {
    tag: 'New',
    title: 'Windows 11',
    titleAccent: 'Pro',
    subtitle: 'Reimagine everything you do.',
    price: '৳599',
    original: '৳9,999',
    off: '-94%',
    accentFrom: 'hsl(258,90%,68%)',
    accentTo: 'hsl(210,95%,60%)',
    heroImage: heroWindowsAsset.url,
    productSlug: 'windows-11-pro-licence-key-price-in-bd',
  },
  {
    tag: 'Featured',
    title: 'Microsoft',
    titleAccent: '365',
    subtitle: 'Everywhere you create.',
    price: '৳1,999',
    original: '৳16,500',
    off: '-88%',
    accentFrom: 'hsl(18,95%,58%)',
    accentTo: 'hsl(335,85%,60%)',
    heroImage: heroOfficeAsset.url,
    productSlug: 'microsoft-office-365-personal-subscription-price-in-bd',
  },
  {
    tag: 'Official',
    title: 'IDM',
    titleAccent: 'Lifetime',
    subtitle: 'Speed, refined forever.',
    price: '৳2,650',
    original: '৳6,500',
    off: '-59%',
    accentFrom: 'hsl(280,85%,65%)',
    accentTo: 'hsl(190,95%,55%)',
    heroImage: heroIdmAsset.url,
    productSlug: 'internet-download-manager-idm-lifetime-key',
  },
];

// Legacy default asset lookup by slide id (for previously-saved slides without heroImage)
const HERO_MAP: Record<string, string> = {
  'slide-win11': heroWindowsAsset.url,
  'slide-ms365': heroOfficeAsset.url,
  'slide-idm': heroIdmAsset.url,
};

const dbSlideToSlide = (s: SlideData): Slide => ({
  tag: s.tag || 'Featured',
  title: s.title,
  titleAccent: s.titleAccent,
  subtitle: s.subtitle,
  price: s.price,
  original: s.original,
  off: s.off?.startsWith('-') ? s.off : `-${s.off}`,
  accentFrom: s.accentFrom || 'hsl(258,90%,68%)',
  accentTo: s.accentTo || 'hsl(210,95%,60%)',
  heroImage: s.heroImage || HERO_MAP[s.id] || s.logoImg || '',
  productSlug: s.productSlug || '',
});

const HeroBanner = () => {
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState<'in' | 'out'>('in');
  const { data: bannerData } = useHeroBanner();

  const SLIDES: Slide[] = bannerData?.slides && bannerData.slides.length > 0
    ? bannerData.slides.filter(s => s.enabled).map(dbSlideToSlide)
    : STATIC_SLIDES;

  useEffect(() => {
    const timer = setInterval(() => advance(1), 6500);
    return () => clearInterval(timer);
  }, [active, SLIDES.length]);

  const advance = (delta: number) => {
    setDir('out');
    setTimeout(() => {
      setActive(p => (p + delta + SLIDES.length) % SLIDES.length);
      setDir('in');
    }, 320);
  };

  const slide = SLIDES[active] ?? SLIDES[0];
  if (!slide) return null;

  return (
    <section
      className="relative overflow-hidden mt-[54px] px-3 sm:px-5 lg:px-8 pt-2 pb-6 sm:pt-3 md:pt-4 md:pb-8"
      aria-label="Featured products"
    >
      {/* Cinematic dark frame */}
      <div
        className="relative mx-auto w-full max-w-[1800px] rounded-[28px] lg:rounded-[40px] overflow-hidden isolate"
        style={{
          background: 'radial-gradient(ellipse at 30% 0%, hsl(258,60%,14%) 0%, hsl(240,50%,8%) 45%, hsl(230,45%,5%) 100%)',
          border: '1px solid hsla(258,60%,50%,0.20)',
          boxShadow: '0 30px 80px -20px hsla(258,78%,30%,0.45), inset 0 1px 0 hsla(258,60%,70%,0.10)',
          minHeight: 'clamp(460px, 62vh, 640px)',
        }}
      >
        {/* Aurora glows — dynamic per slide */}
        <div
          key={`aurora-${active}`}
          className="absolute inset-0 pointer-events-none transition-opacity duration-700"
          style={{
            background: `
              radial-gradient(ellipse 60% 50% at 15% 20%, ${slide.accentFrom}55 0%, transparent 60%),
              radial-gradient(ellipse 55% 45% at 85% 80%, ${slide.accentTo}44 0%, transparent 60%),
              radial-gradient(ellipse 40% 40% at 50% 100%, ${slide.accentFrom}33 0%, transparent 70%)
            `,
            filter: 'blur(60px)',
          }}
        />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: `linear-gradient(hsl(0,0%,100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0,0%,100%) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          }}
        />

        {/* Fine top hairline */}
        <div
          className="absolute top-0 left-[10%] right-[10%] h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, hsla(0,0%,100%,0.35), transparent)' }}
        />

        {/* ── Content ── */}
        <div className="relative flex flex-col items-center justify-center text-center px-6 sm:px-10 lg:px-16 py-12 sm:py-14 lg:py-16"
          style={{ minHeight: 'clamp(460px, 62vh, 640px)' }}>

          {/* Eyebrow */}
          <div
            className="mb-4 sm:mb-5"
            style={{
              opacity: dir === 'in' ? 1 : 0,
              transform: dir === 'in' ? 'none' : 'translateY(-8px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              transitionDelay: dir === 'in' ? '0.05s' : '0s',
            }}
          >
            <span
              className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.28em] uppercase"
              style={{
                background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {slide.tag}
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-sora font-semibold text-white leading-[0.98] tracking-[-0.03em] mb-3 sm:mb-4"
            style={{
              fontSize: 'clamp(2.2rem, 6.5vw, 5.25rem)',
              opacity: dir === 'in' ? 1 : 0,
              transform: dir === 'in' ? 'none' : 'translateY(14px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
              transitionDelay: dir === 'in' ? '0.1s' : '0s',
            }}
          >
            {slide.title}{' '}
            <span
              style={{
                background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {slide.titleAccent}
            </span>
          </h1>

          {/* Subtitle — one line, whisper */}
          <p
            className="text-[15px] sm:text-[17px] lg:text-[19px] font-normal mb-6 sm:mb-8 max-w-xl"
            style={{
              color: 'hsla(0,0%,100%,0.62)',
              opacity: dir === 'in' ? 1 : 0,
              transform: dir === 'in' ? 'none' : 'translateY(10px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
              transitionDelay: dir === 'in' ? '0.16s' : '0s',
            }}
          >
            {slide.subtitle}
          </p>

          {/* Hero image — floating */}
          {slide.heroImage && (
            <div
              className="relative mb-7 sm:mb-9"
              style={{
                opacity: dir === 'in' ? 1 : 0,
                transform: dir === 'in' ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.96)',
                transition: 'opacity 0.65s cubic-bezier(0.22,1,0.36,1), transform 0.65s cubic-bezier(0.22,1,0.36,1)',
                transitionDelay: dir === 'in' ? '0.22s' : '0s',
              }}
            >
              {/* Glow */}
              <div
                className="absolute inset-0 -z-10 rounded-full"
                style={{
                  background: `radial-gradient(ellipse at 50% 55%, ${slide.accentFrom}66 0%, ${slide.accentTo}33 40%, transparent 70%)`,
                  filter: 'blur(50px)',
                  transform: 'scale(1.2)',
                }}
              />
              <img
                src={slide.heroImage}
                alt={`${slide.title} ${slide.titleAccent}`}
                width={480}
                height={480}
                fetchPriority="high"
                decoding="async"
                className="anim-float relative object-contain"
                style={{
                  width: 'clamp(200px, 32vw, 340px)',
                  height: 'clamp(200px, 32vw, 340px)',
                  filter: `drop-shadow(0 24px 40px ${slide.accentFrom}44) drop-shadow(0 8px 16px hsla(0,0%,0%,0.4))`,
                }}
              />
              {/* Reflection */}
              <div
                aria-hidden
                className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                style={{
                  bottom: '-14px',
                  width: 'clamp(160px, 24vw, 240px)',
                  height: '14px',
                  background: 'radial-gradient(ellipse, hsla(0,0%,0%,0.55) 0%, transparent 70%)',
                  filter: 'blur(6px)',
                }}
              />
            </div>
          )}

          {/* Price + CTA */}
          <div
            className="flex flex-col items-center gap-4 sm:gap-5"
            style={{
              opacity: dir === 'in' ? 1 : 0,
              transform: dir === 'in' ? 'none' : 'translateY(10px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
              transitionDelay: dir === 'in' ? '0.3s' : '0s',
            }}
          >
            <div className="flex items-baseline gap-3">
              <span
                className="font-sora font-semibold text-white tracking-tight"
                style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}
              >
                From {slide.price}
              </span>
              <span
                className="text-[13px] sm:text-[14px] line-through"
                style={{ color: 'hsla(0,0%,100%,0.35)' }}
              >
                {slide.original}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={slide.productSlug ? `/product/${slide.productSlug}` : '/shop'}
                className="group inline-flex items-center gap-2 px-7 py-3 sm:px-8 sm:py-3.5 rounded-full text-[13.5px] sm:text-[14px] font-semibold text-white transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`,
                  boxShadow: `0 12px 34px -8px ${slide.accentFrom}88, 0 4px 12px -2px ${slide.accentTo}55, inset 0 1px 0 hsla(0,0%,100%,0.35)`,
                }}
              >
                Buy now
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="/shop"
                className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full text-[13.5px] font-medium transition-colors duration-200"
                style={{
                  color: 'hsla(0,0%,100%,0.85)',
                }}
              >
                Learn more
                <ArrowRight size={13} />
              </a>
            </div>
          </div>

          {/* Slide indicators */}
          {SLIDES.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <button
                onClick={() => advance(-1)}
                aria-label="Previous slide"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{
                  background: 'hsla(0,0%,100%,0.06)',
                  border: '1px solid hsla(0,0%,100%,0.12)',
                  color: 'hsla(0,0%,100%,0.75)',
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <div className="flex items-center gap-1.5">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Show slide ${i + 1}`}
                    onClick={() => {
                      setDir('out');
                      setTimeout(() => { setActive(i); setDir('in'); }, 320);
                    }}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === active ? '22px' : '6px',
                      height: '6px',
                      background: i === active
                        ? `linear-gradient(90deg, ${slide.accentFrom}, ${slide.accentTo})`
                        : 'hsla(0,0%,100%,0.22)',
                    }}
                  />
                ))}
              </div>
              <button
                onClick={() => advance(1)}
                aria-label="Next slide"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{
                  background: 'hsla(0,0%,100%,0.06)',
                  border: '1px solid hsla(0,0%,100%,0.12)',
                  color: 'hsla(0,0%,100%,0.75)',
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
