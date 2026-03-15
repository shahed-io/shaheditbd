import { useRef, useEffect, useState } from 'react';
import { Star, Quote } from 'lucide-react';

interface Review {
  name: string;
  location: string;
  avatar: string;
  rating: number;
  review: string;
  product: string;
  date: string;
  verified: boolean;
}

const REVIEWS: Review[] = [
  {
    name: 'Rakib Hassan',
    location: 'Dhaka',
    avatar: 'RH',
    rating: 5,
    review: 'অসাধারণ সার্ভিস! মাত্র ৩০ মিনিটের মধ্যে Windows 11 Pro এর লাইসেন্স কি পেয়েছি। একদম অরিজিনাল, অ্যাক্টিভেশনে কোনো সমস্যা হয়নি।',
    product: 'Windows 11 Pro',
    date: '২ দিন আগে',
    verified: true,
  },
  {
    name: 'Nusrat Jahan',
    location: 'Chittagong',
    avatar: 'NJ',
    rating: 5,
    review: 'Microsoft Office 2024 কিনেছি, দাম অনেক কম কিন্তু কোয়ালিটি একদম বেস্ট। সাপোর্ট টিম খুব হেল্পফুল ছিল।',
    product: 'MS Office 2024 Pro Plus',
    date: '৫ দিন আগে',
    verified: true,
  },
  {
    name: 'Arif Billah',
    location: 'Sylhet',
    avatar: 'AB',
    rating: 5,
    review: 'Adobe Photoshop এর subscription নিয়েছি। বাংলাদেশে এত সস্তায় অরিজিনাল Adobe পাওয়া সত্যিই অবিশ্বাস্য!',
    product: 'Adobe Creative Cloud',
    date: '১ সপ্তাহ আগে',
    verified: true,
  },
  {
    name: 'Farhan Ahmed',
    location: 'Rajshahi',
    avatar: 'FA',
    rating: 5,
    review: 'bKash এ পেমেন্ট করেছি, ১ ঘন্টার মধ্যে ইমেইলে key পেয়ে গেছি। খুবই fast delivery। পরের বার আবার কিনব।',
    product: 'Windows 10 Pro',
    date: '১ সপ্তাহ আগে',
    verified: true,
  },
  {
    name: 'Sadia Islam',
    location: 'Comilla',
    avatar: 'SI',
    rating: 5,
    review: 'Netflix Premium subscription নিয়েছি, এখন পরিবারের ৪ জন মিলে দেখছি। অনেক সাশ্রয়ী। Shahed Store কে ধন্যবাদ!',
    product: 'Netflix Premium',
    date: '১০ দিন আগে',
    verified: true,
  },
  {
    name: 'Tanvir Hossain',
    location: 'Khulna',
    avatar: 'TH',
    rating: 4,
    review: 'দুর্দান্ত অভিজ্ঞতা! Canva Pro নিয়েছি freelancing কাজের জন্য। সরকারি নিবন্ধিত শপ হওয়ায় বিশ্বাস করে কিনলাম, ঠকিনি।',
    product: 'Canva Pro',
    date: '২ সপ্তাহ আগে',
    verified: true,
  },
  {
    name: 'Mim Akter',
    location: 'Mymensingh',
    avatar: 'MA',
    rating: 5,
    review: 'Spotify Premium এর দাম দেখে অবাক হয়ে গেছি। এত কমে? তাও আবার অরিজিনাল! বন্ধুদেরও recommend করেছি।',
    product: 'Spotify Premium',
    date: '২ সপ্তাহ আগে',
    verified: true,
  },
  {
    name: 'Sumon Mia',
    location: 'Bogura',
    avatar: 'SM',
    rating: 5,
    review: 'WhatsApp Support এ অর্ডার করলাম, একদম সহজ process। মাত্র ১৫ মিনিটে license key পেয়ে গেলাম। অসাধারণ!',
    product: 'MS Office 365',
    date: '৩ সপ্তাহ আগে',
    verified: true,
  },
];

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        size={13}
        className={i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}
      />
    ))}
  </div>
);

const AvatarCircle = ({ initials, index }: { initials: string; index: number }) => {
  const GRADIENTS = [
    'from-violet-500 to-indigo-600',
    'from-pink-500 to-rose-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-600',
    'from-cyan-500 to-blue-600',
    'from-fuchsia-500 to-purple-600',
    'from-green-500 to-emerald-600',
    'from-red-500 to-pink-600',
  ];
  return (
    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${GRADIENTS[index % GRADIENTS.length]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md`}>
      {initials}
    </div>
  );
};

const ReviewCard = ({ review, index }: { review: Review; index: number }) => (
  <div
    className="flex-shrink-0 w-[300px] sm:w-[340px] rounded-2xl p-5 space-y-3 transition-all duration-300 group cursor-default"
    style={{
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      boxShadow: '0 2px 12px hsla(226,35%,12%,0.07)',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLElement).style.border = '1px solid hsla(243,75%,62%,0.35)';
      (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px hsla(243,75%,62%,0.12)';
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLElement).style.border = '1px solid hsl(var(--border))';
      (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px hsla(226,35%,12%,0.07)';
    }}
  >
    {/* Quote icon */}
    <Quote size={18} className="text-primary/40 group-hover:text-primary/60 transition-colors" />

    {/* Review text */}
    <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">{review.review}</p>

    {/* Rating + Product */}
    <div className="flex items-center justify-between">
      <StarRating rating={review.rating} />
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
        style={{ background: 'hsla(243,75%,62%,0.12)', border: '1px solid hsla(243,75%,62%,0.2)', color: 'hsl(243,75%,70%)' }}>
        {review.product}
      </span>
    </div>

    {/* Author */}
    <div className="flex items-center gap-3 pt-1 border-t border-border">
      <AvatarCircle initials={review.avatar} index={index} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-foreground truncate">{review.name}</p>
          {review.verified && (
            <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"
              title="Verified Purchase">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground/60">{review.location} · {review.date}</p>
      </div>
    </div>
  </div>
);

const Testimonials = () => {
  const track1Ref = useRef<HTMLDivElement>(null);
  const track2Ref = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Intersection observer for section entrance
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  // Infinite marquee via CSS animation
  const row1 = [...REVIEWS.slice(0, 4), ...REVIEWS.slice(0, 4)];
  const row2 = [...REVIEWS.slice(4), ...REVIEWS.slice(4)];

  const totalReviews = REVIEWS.length;
  const avgRating = (REVIEWS.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1);

  return (
    <section ref={sectionRef} className="py-16 sm:py-20 overflow-hidden relative" style={{ background: 'hsl(var(--background))' }}>

      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full blur-3xl"
          style={{ background: 'hsla(243,75%,62%,0.06)' }} />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full blur-3xl"
          style={{ background: 'hsla(15,100%,60%,0.05)' }} />
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle, hsla(0,0%,100%,0.02) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className={`text-center mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="section-label mb-3 inline-block">Customer Reviews</span>
          <h2 className="font-sora font-black text-3xl sm:text-4xl text-foreground mb-4">
            হাজারো{' '}
            <span style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>সন্তুষ্ট</span>{' '}
            গ্রাহক
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            সারা বাংলাদেশ থেকে গ্রাহকরা আমাদের সার্ভিস নিয়ে যা বলছেন
          </p>

          {/* Stats row */}
          <div className={`flex items-center justify-center gap-8 mt-8 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {[
              { value: avgRating, label: 'গড় রেটিং', suffix: '★' },
              { value: '2,500+', label: 'সন্তুষ্ট গ্রাহক', suffix: '' },
              { value: '99%', label: 'পজিটিভ রিভিউ', suffix: '' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="font-sora font-black text-2xl sm:text-3xl text-foreground">
                  {stat.value}
                  <span className="text-yellow-400">{stat.suffix}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scrolling rows */}
      <div
        className="space-y-4"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Row 1 — scrolls left */}
        <div className="relative">
          {/* Edge fades */}
          <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, hsl(var(--background)), transparent)' }} />
          <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, hsl(var(--background)), transparent)' }} />
          <div
            ref={track1Ref}
            className="flex gap-4 pl-4"
            style={{
              width: 'max-content',
              animation: `marquee-left 40s linear infinite`,
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          >
            {row1.map((r, i) => <ReviewCard key={`r1-${i}`} review={r} index={i} />)}
          </div>
        </div>

        {/* Row 2 — scrolls right */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, hsl(var(--background)), transparent)' }} />
          <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, hsl(var(--background)), transparent)' }} />
          <div
            ref={track2Ref}
            className="flex gap-4 pl-4"
            style={{
              width: 'max-content',
              animation: `marquee-right 36s linear infinite`,
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          >
            {row2.map((r, i) => <ReviewCard key={`r2-${i}`} review={r} index={i + 4} />)}
          </div>
        </div>
      </div>

      {/* CSS keyframes injected inline */}
      <style>{`
        @keyframes marquee-left {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </section>
  );
};

export default Testimonials;
