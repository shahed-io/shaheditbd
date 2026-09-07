import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import bannerGraphics from '@/assets/hero-graphics-photo.webp';

import { useHeroBanner, type SlideData } from '@/hooks/useHeroBanner';

type Slide = {
  tag: string; tagIcon: string; title: string; titleAccent: string; subtitle: string; desc: string;
  price: string; original: string; off: string; badge: string;
  accentFrom: string; accentTo: string;
  emoji: string; logoImg?: string; bgImage?: string; features: string[]; productSlug?: string;
};

const STATIC_SLIDES: Slide[] = [
  {
    tag: 'Creative Studio', tagIcon: '🎨',
    title: 'Graphics', titleAccent: 'Design',
    subtitle: 'Logo, Branding & Social Media Creatives',
    desc: 'লোগো, ব্র্যান্ডিং, সোশ্যাল মিডিয়া ডিজাইন — প্রিমিয়াম কোয়ালিটিতে দ্রুত ডেলিভারি।',
    price: '৳3,000', original: '৳4,500', off: '-33%', badge: 'PREMIUM QUALITY',
    accentFrom: 'hsl(300,78%,55%)', accentTo: 'hsl(258,78%,55%)',
    emoji: '🎨', features: ['ক্রিয়েটিভ কনসেপ্ট', 'আনলিমিটেড রিভিশন', 'সোর্স ফাইল'],
    productSlug: 'logo-design',
  },
];

const LOGO_MAP: Record<string, string> = {};

// Admin-uploaded image wins; the bundled image keeps the banner instant offline.
const pickBannerBg = (s: Slide): string => {
  if (s.bgImage && s.bgImage.trim()) return s.bgImage;
  return bannerGraphics;
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
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: dir === 'in' ? 1 : 0.55,
              transform: dir === 'in' ? 'scale(1)' : 'scale(1.02)',
              transition: 'opacity 0.35s ease, transform 0.5s ease',
            }}
          />

          {/* Premium banners are self-contained designs (headline, subline, CTA are
              baked into the artwork), so the whole banner is one clickable link. */}
          <a
            href={href}
            aria-label={`${slide.title} ${slide.titleAccent} — ${slide.subtitle}`}
            className="absolute inset-0 z-10"
          >
            <span className="sr-only">
              {slide.title} {slide.titleAccent} — {slide.subtitle}
            </span>
          </a>


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
