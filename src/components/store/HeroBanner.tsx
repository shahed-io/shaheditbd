import { useState, useEffect, useRef } from 'react';
import { ArrowRight, ShoppingBag, TrendingUp, Zap, Shield, Clock, Star, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import bannerWebDev from '@/assets/banner-web-development.jpg';
import bannerEcommerce from '@/assets/banner-ecommerce.jpg';
import bannerSeo from '@/assets/banner-seo-marketing.jpg';

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
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: dir === 'in' ? 1 : 0.55,
              transform: dir === 'in' ? 'scale(1)' : 'scale(1.02)',
              transition: 'opacity 0.35s ease, transform 0.5s ease',
            }}
          />

          {/* Very light left wash — new AI banners already have clean empty left space, so we only add a whisper of readability */}
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
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span
                  className="inline-flex items-center gap-1 text-[8px] sm:text-[9.5px] font-black uppercase tracking-[0.16em] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-white"
                  style={{
                    background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(215,82%,52%))',
                    boxShadow: '0 4px 16px hsla(258,78%,55%,0.32)',
                  }}
                >
                  <span className="text-[10px] sm:text-[11px]">{slide.tagIcon || '✦'}</span>
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
              <div>
                <h2
                  className="font-sora font-black leading-[1.05] tracking-tight"
                  style={{
                    fontSize: 'clamp(1.35rem, 4.2vw, 3.2rem)',
                    color: 'hsl(226,35%,12%)',
                  }}
                >
                  <span className="block">{slide.title}</span>
                  <span
                    className="block"
                    style={{
                      background: 'linear-gradient(135deg, hsl(258,78%,52%) 0%, hsl(215,82%,52%) 50%, hsl(200,90%,46%) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {slide.titleAccent}
                  </span>
                </h2>
                <p
                  className="text-[11px] sm:text-[13px] lg:text-[14px] font-semibold mt-1 sm:mt-2 line-clamp-2"
                  style={{ color: 'hsl(226,22%,40%)' }}
                >
                  {slide.subtitle}
                </p>
              </div>

              {/* Description — hidden on very small screens to keep it clean */}
              <p
                className="hidden md:block text-[12.5px] leading-relaxed max-w-[420px]"
                style={{ color: 'hsl(226,18%,48%)' }}
              >
                {slide.desc}
              </p>

              {/* Feature pills — desktop only */}
              <div className="hidden lg:flex flex-wrap gap-1.5">
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
