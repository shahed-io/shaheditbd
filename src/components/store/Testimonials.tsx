import { useRef, useEffect, useState } from 'react';
import { Star, Quote, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Review {
  id: string;
  name: string;
  location: string;
  avatar: string;
  rating: number;
  review: string;
  product: string;
  date: string;
  verified: boolean;
  is_visible?: boolean;
}

const HARDCODED_REVIEWS: Review[] = [
  { id: crypto.randomUUID(), name: 'Rakib Hassan',    location: 'Dhaka',       avatar: 'RH', rating: 5, review: 'অসাধারণ সার্ভিস! মাত্র ৩০ মিনিটের মধ্যে Windows 11 Pro এর লাইসেন্স কি পেয়েছি। একদম অরিজিনাল, অ্যাক্টিভেশনে কোনো সমস্যা হয়নি।', product: 'Windows 11 Pro',        date: '২ দিন আগে',    verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'Nusrat Jahan',    location: 'Chittagong',  avatar: 'NJ', rating: 5, review: 'Microsoft Office 2024 কিনেছি, দাম অনেক কম কিন্তু কোয়ালিটি একদম বেস্ট। সাপোর্ট টিম খুব হেল্পফুল ছিল।',                           product: 'MS Office 2024',         date: '৫ দিন আগে',    verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'Arif Billah',     location: 'Sylhet',      avatar: 'AB', rating: 5, review: 'Adobe Photoshop এর subscription নিয়েছি। বাংলাদেশে এত সস্তায় অরিজিনাল Adobe পাওয়া সত্যিই অবিশ্বাস্য!',                          product: 'Adobe Creative Cloud',   date: '১ সপ্তাহ আগে', verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'Farhan Ahmed',    location: 'Rajshahi',    avatar: 'FA', rating: 5, review: 'bKash এ পেমেন্ট করেছি, ১ ঘন্টার মধ্যে ইমেইলে key পেয়ে গেছি। খুবই fast delivery। পরের বার আবার কিনব।',                        product: 'Windows 10 Pro',         date: '১ সপ্তাহ আগে', verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'Sadia Islam',     location: 'Comilla',     avatar: 'SI', rating: 5, review: 'Netflix Premium subscription নিয়েছি, এখন পরিবারের ৪ জন মিলে দেখছি। অনেক সাশ্রয়ী। Shahed Store কে ধন্যবাদ!',                 product: 'Netflix Premium',        date: '১০ দিন আগে',   verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'Tanvir Hossain',  location: 'Khulna',      avatar: 'TH', rating: 4, review: 'দুর্দান্ত অভিজ্ঞতা! Canva Pro নিয়েছি freelancing কাজের জন্য। সরকারি নিবন্ধিত শপ হওয়ায় বিশ্বাস করে কিনলাম, ঠকিনি।',           product: 'Canva Pro',              date: '২ সপ্তাহ আগে', verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'Mim Akter',       location: 'Mymensingh',  avatar: 'MA', rating: 5, review: 'Spotify Premium এর দাম দেখে অবাক হয়ে গেছি। এত কমে? তাও আবার অরিজিনাল! বন্ধুদেরও recommend করেছি।',                         product: 'Spotify Premium',        date: '২ সপ্তাহ আগে', verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'Sumon Mia',       location: 'Bogura',      avatar: 'SM', rating: 5, review: 'WhatsApp Support এ অর্ডার করলাম, একদম সহজ process। মাত্র ১৫ মিনিটে license key পেয়ে গেলাম। অসাধারণ!',                        product: 'MS Office 365',          date: '৩ সপ্তাহ আগে', verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'Riya Das',        location: 'Barishal',    avatar: 'RD', rating: 5, review: 'প্রথমবার online এ software কিনলাম। এত সহজ ছিল না ভেবেছিলাম, কিন্তু সত্যিই মাত্র ২০ মিনিটে সব হয়ে গেল!',                   product: 'Windows 11 Home',        date: '৩ সপ্তাহ আগে', verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'Imran Hossain',   location: 'Narayanganj', avatar: 'IH', rating: 5, review: 'Antivirus subscription নিয়েছি, অনেক সস্তা এবং একদম genuine। Customer service অনেক ভালো, সব প্রশ্নের উত্তর দিয়েছে।',       product: 'Kaspersky Total Security', date: '১ মাস আগে',  verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'Lamiya Khanam',   location: 'Gazipur',     avatar: 'LK', rating: 5, review: 'YouTube Premium family plan নিয়েছি। পুরো পরিবার এখন ads ছাড়া দেখে। অনেক value for money!',                                  product: 'YouTube Premium',        date: '১ মাস আগে',    verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'Nahid Islam',     location: 'Jessore',     avatar: 'NI', rating: 5, review: 'Microsoft Visio কিনেছি office কাজের জন্য। original software এত কম দামে পেয়ে সত্যিই অবাক। বারবার কিনব।',                    product: 'Microsoft Visio',        date: '৫ সপ্তাহ আগে', verified: true, is_visible: true },
];

// Avatar gradient pairs matching product card palette (purple/cyan)
const AVATAR_COLORS = [
  ['hsl(271,91%,65%)', 'hsl(185,90%,52%)'],
  ['hsl(185,90%,52%)', 'hsl(271,91%,65%)'],
  ['hsl(271,91%,55%)', 'hsl(320,90%,62%)'],
  ['hsl(320,90%,62%)', 'hsl(271,91%,75%)'],
  ['hsl(185,90%,45%)', 'hsl(200,90%,55%)'],
  ['hsl(271,91%,70%)', 'hsl(185,90%,60%)'],
];

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={11}
        fill={i <= rating ? 'hsl(40,100%,58%)' : 'none'}
        style={{ color: i <= rating ? 'hsl(40,100%,58%)' : 'hsl(var(--border))' }}
      />
    ))}
  </div>
);

const AvatarCircle = ({ initials, index }: { initials: string; index: number }) => {
  const [a, b] = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
      style={{ background: `linear-gradient(135deg, ${a}, ${b})`, boxShadow: `0 4px 12px ${a}45` }}
    >
      {initials}
    </div>
  );
};

/* ─── Review Card ─────────────────────────────── */
const ReviewCard = ({ review, index }: { review: Review; index: number }) => {
  const [hov, setHov] = useState(false);

  return (
    <div
      className="flex-shrink-0 w-[290px] sm:w-[310px] flex flex-col rounded-[var(--radius)] overflow-hidden cursor-default"
      style={{
        background: 'hsl(215,28%,11%)',
        border: `1.5px solid ${hov ? 'hsla(271,91%,65%,0.45)' : 'hsla(271,91%,65%,0.15)'}`,
        boxShadow: hov
          ? '0 16px 40px hsla(271,91%,65%,0.25), 0 0 0 1px hsla(271,91%,65%,0.2), 0 32px 60px hsla(215,40%,4%,0.5)'
          : '0 4px 20px hsla(215,40%,4%,0.4)',
        transform: hov ? 'translateY(-5px) scale(1.012)' : 'translateY(0) scale(1)',
        transition: 'all 0.32s cubic-bezier(0.23,1,0.32,1)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Quote icon */}
        <Quote size={18} style={{ color: 'hsl(271,91%,75%)', opacity: 0.7 }} />

        {/* Review text */}
        <p className="text-[12.5px] leading-relaxed line-clamp-4 flex-1" style={{ color: 'hsl(220,15%,72%)' }}>
          {review.review}
        </p>

        {/* Stars + product badge */}
        <div className="flex items-center justify-between gap-2">
          <StarRating rating={review.rating} />
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full truncate max-w-[120px]"
            style={{
              background: 'hsla(271,91%,65%,0.12)',
              border: '1px solid hsla(271,91%,65%,0.25)',
              color: 'hsl(271,91%,80%)',
            }}
          >
            {review.product}
          </span>
        </div>

        {/* Divider */}
        <div className="h-px" style={{ background: 'hsla(271,91%,65%,0.15)' }} />

        {/* Author */}
        <div className="flex items-center gap-3">
          <AvatarCircle initials={review.avatar || review.name?.slice(0,2).toUpperCase()} index={index} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-bold truncate text-foreground">{review.name}</p>
              {review.verified && (
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'hsl(158,64%,42%)' }}
                  title="Verified Purchase"
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">{review.location} · {review.date}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Main ─────────────────────────────────────── */
const Testimonials = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loaded, setLoaded] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'testimonials_data').maybeSingle().then(async ({ data }) => {
      if (data?.value) {
        try {
          const parsed: Review[] = JSON.parse(data.value);
          if (parsed.length > 0) {
            setReviews(parsed.filter(r => r.is_visible !== false));
            setLoaded(true);
            return;
          }
        } catch {}
      }
      await supabase.from('site_settings').upsert(
        { key: 'testimonials_data', value: JSON.stringify(HARDCODED_REVIEWS), category: 'seo' },
        { onConflict: 'key' }
      );
      setReviews(HARDCODED_REVIEWS);
      setLoaded(true);
    });
  }, []);

  const visibleReviews = reviews.filter(r => r.is_visible !== false);
  const half = Math.ceil(visibleReviews.length / 2);
  const row1 = visibleReviews.length > 0 ? [...visibleReviews.slice(0, half), ...visibleReviews.slice(0, half)] : [];
  const row2 = visibleReviews.length > 0 ? [...visibleReviews.slice(half), ...visibleReviews.slice(half)] : [];

  const avgRating = visibleReviews.length > 0
    ? (visibleReviews.reduce((s, r) => s + (r.rating || 5), 0) / visibleReviews.length).toFixed(1)
    : '5.0';

  const statsData = [
    { value: avgRating, label: 'গড় রেটিং', suffix: '★' },
    { value: '12K+',   label: 'সন্তুষ্ট গ্রাহক', suffix: '' },
    { value: '99%',    label: 'পজিটিভ রিভিউ', suffix: '' },
  ];

  if (!loaded || visibleReviews.length === 0) return null;

  return (
    <section ref={sectionRef} className="py-16 sm:py-20 overflow-hidden relative bg-transparent below-fold">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-bold mb-5 tracking-widest uppercase"
            style={{
              background: 'hsla(271,91%,65%,0.1)',
              border: '1.5px solid hsla(271,91%,65%,0.35)',
              color: 'hsl(271,91%,75%)',
              boxShadow: '0 2px 14px hsla(271,91%,65%,0.12)',
            }}
          >
            ⭐ Customer Reviews
          </div>

          <h2 className="font-sora font-black text-3xl sm:text-4xl mb-3 text-foreground">
            হাজারো{' '}
            <span style={{
              background: 'linear-gradient(135deg, hsl(271,91%,75%), hsl(185,90%,52%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              সন্তুষ্ট
            </span>{' '}
            গ্রাহক
          </h2>
          <p className="text-sm sm:text-base max-w-lg mx-auto text-muted-foreground">
            সারা বাংলাদেশ থেকে গ্রাহকরা আমাদের সার্ভিস নিয়ে যা বলছেন
          </p>

          {/* Stats */}
          <div className={`flex items-center justify-center gap-4 mt-8 flex-wrap transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            {statsData.map((stat, i) => (
              <div
                key={i}
                className="rounded-xl px-7 py-3 text-center"
                style={{
                  background: 'hsl(215,28%,11%)',
                  border: '1.5px solid hsla(271,91%,65%,0.18)',
                  boxShadow: '0 4px 20px hsla(215,40%,4%,0.35)',
                }}
              >
                <p className="font-sora font-black text-2xl sm:text-3xl text-foreground">
                  {stat.value}
                  <span style={{ color: 'hsl(271,91%,75%)' }}>{stat.suffix}</span>
                </p>
                <p className="text-[11px] font-medium mt-0.5 text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scrolling rows */}
      <div className="space-y-4" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, hsl(var(--background)), transparent)' }} />
          <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, hsl(var(--background)), transparent)' }} />
          <div className="flex gap-4 pl-4"
            style={{ width: 'max-content', animation: 'marquee-left 48s linear infinite', animationPlayState: isPaused ? 'paused' : 'running' }}>
            {row1.map((r, i) => <ReviewCard key={`r1-${i}`} review={r} index={i} />)}
          </div>
        </div>

        {row2.length > 0 && (
          <div className="relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to right, hsl(var(--background)), transparent)' }} />
            <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to left, hsl(var(--background)), transparent)' }} />
            <div className="flex gap-4 pl-4"
              style={{ width: 'max-content', animation: 'marquee-right 44s linear infinite', animationPlayState: isPaused ? 'paused' : 'running' }}>
              {row2.map((r, i) => <ReviewCard key={`r2-${i}`} review={r} index={i + half} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
