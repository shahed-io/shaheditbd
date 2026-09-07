import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import bannerWebDev from '@/assets/banner-web-development.webp';
import bannerGraphics from '@/assets/banner-graphics-design.webp';
import bannerBusiness from '@/assets/banner-business-solution.webp';

import { useHeroBanner, type SlideData } from '@/hooks/useHeroBanner';

type Slide = {
  tag: string; tagIcon: string; title: string; titleAccent: string; subtitle: string; desc: string;
  price: string; original: string; off: string; badge: string;
  accentFrom: string; accentTo: string;
  emoji: string; logoImg?: string; bgImage?: string; features: string[]; productSlug?: string;
};

const STATIC_SLIDES: Slide[] = [
  {
    tag: 'Most Requested', tagIcon: '🔥',
    title: 'Business', titleAccent: 'Website',
    subtitle: 'Design & Development',
    desc: 'আপনার প্রতিষ্ঠানের জন্য আধুনিক, মোবাইল ফ্রেন্ডলি ও SEO-রেডি প্রফেশনাল ওয়েবসাইট।',
    price: '৳15,000', original: '৳20,000', off: '-25%', badge: 'MOST POPULAR',
    accentFrom: 'hsl(258,78%,55%)', accentTo: 'hsl(200,90%,48%)',
    emoji: '💻', features: ['৫–৮ পেজ', 'মোবাইল রেসপনসিভ', '১ মাস ফ্রি সাপোর্ট'],
    productSlug: 'business-website-development',
  },
  {
    tag: 'Growth Package', tagIcon: '⚡',
    title: 'E-Commerce', titleAccent: 'Website',
    subtitle: 'অনলাইন শপ সলিউশন',
    desc: 'কার্ট, চেকআউট, bKash/Nagad পেমেন্ট ও অর্ডার ম্যানেজমেন্ট সহ সম্পূর্ণ অনলাইন শপ।',
    price: '৳35,000', original: '৳45,000', off: '-22%', badge: 'BEST VALUE',
    accentFrom: 'hsl(258,78%,55%)', accentTo: 'hsl(200,90%,48%)',
    emoji: '🛍️', features: ['পেমেন্ট গেটওয়ে', 'অ্যাডমিন ড্যাশবোর্ড', '৩ মাস সাপোর্ট'],
    productSlug: 'ecommerce-website-development',
  },
  {
    tag: 'Marketing', tagIcon: '📈',
    title: 'SEO &', titleAccent: 'Digital Marketing',
    subtitle: 'মাসিক গ্রোথ প্যাকেজ',
    desc: 'গুগলে র‍্যাংক বাড়ান — কীওয়ার্ড রিসার্চ, অন-পেজ SEO, কনটেন্ট প্ল্যান ও মাসিক রিপোর্ট।',
    price: '৳8,000', original: '৳12,000', off: '-33%', badge: 'MONTHLY PLAN',
    accentFrom: 'hsl(258,78%,55%)', accentTo: 'hsl(200,90%,48%)',
    emoji: '🚀', features: ['কীওয়ার্ড রিসার্চ', 'অন-পেজ SEO', 'মাসিক রিপোর্ট'],
    productSlug: 'seo-service-monthly',
  },
];

const LOGO_MAP: Record<string, string> = {};

// Admin-uploaded bgImage always wins. Fallback bundled service banners.
const pickBannerBg = (s: Slide): string => {
  if (s.bgImage && s.bgImage.trim()) return s.bgImage;
  const t = `${s.title} ${s.titleAccent} ${s.subtitle} ${s.productSlug || ''}`.toLowerCase();
  if (t.includes('commerce') || t.includes('shop') || t.includes('অনলাইন শপ')) return bannerEcommerce;
  if (t.includes('seo') || t.includes('marketing') || t.includes('ads') || t.includes('facebook')) return bannerSeo;
  if (t.includes('web') || t.includes('site') || t.includes('design') || t.includes('development')) return bannerWebDev;
  const pool = [bannerWebDev, bannerEcommerce, bannerSeo];
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
      {/* Preload fallback banners so first paint is instant */}
      <link rel="preload" as="image" href={bannerWebDev} />
      <link rel="preload" as="image" href={bannerEcommerce} />
      <link rel="preload" as="image" href={bannerSeo} />

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
