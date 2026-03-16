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
    product: 'MS Office 2024',
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
  {
    name: 'Riya Das',
    location: 'Barishal',
    avatar: 'RD',
    rating: 5,
    review: 'প্রথমবার online এ software কিনলাম। এত সহজ ছিল না ভেবেছিলাম, কিন্তু সত্যিই মাত্র ২০ মিনিটে সব হয়ে গেল!',
    product: 'Windows 11 Home',
    date: '৩ সপ্তাহ আগে',
    verified: true,
  },
  {
    name: 'Imran Hossain',
    location: 'Narayanganj',
    avatar: 'IH',
    rating: 5,
    review: 'Antivirus subscription নিয়েছি, অনেক সস্তা এবং একদম genuine। Customer service অনেক ভালো, সব প্রশ্নের উত্তর দিয়েছে।',
    product: 'Kaspersky Total Security',
    date: '১ মাস আগে',
    verified: true,
  },
  {
    name: 'Lamiya Khanam',
    location: 'Gazipur',
    avatar: 'LK',
    rating: 5,
    review: 'YouTube Premium family plan নিয়েছি। পুরো পরিবার এখন ads ছাড়া দেখে। অনেক value for money!',
    product: 'YouTube Premium',
    date: '১ মাস আগে',
    verified: true,
  },
  {
    name: 'Nahid Islam',
    location: 'Jessore',
    avatar: 'NI',
    rating: 5,
    review: 'Microsoft Visio কিনেছি office কাজের জন্য। original software এত কম দামে পেয়ে সত্যিই অবাক। বারবার কিনব।',
    product: 'Microsoft Visio',
    date: '৫ সপ্তাহ আগে',
    verified: true,
  },
];

const PALETTES = [
  { from: 'hsl(243,75%,59%)', to: 'hsl(263,70%,62%)' },
  { from: 'hsl(158,64%,40%)', to: 'hsl(180,70%,42%)' },
  { from: 'hsl(15,100%,56%)',  to: 'hsl(38,100%,52%)' },
  { from: 'hsl(263,70%,58%)', to: 'hsl(283,65%,56%)' },
  { from: 'hsl(200,90%,45%)', to: 'hsl(220,85%,56%)' },
  { from: 'hsl(330,82%,55%)', to: 'hsl(358,88%,60%)' },
  { from: 'hsl(38,100%,52%)',  to: 'hsl(50,100%,52%)' },
  { from: 'hsl(158,64%,40%)', to: 'hsl(243,75%,59%)' },
  { from: 'hsl(220,85%,56%)', to: 'hsl(263,70%,58%)' },
  { from: 'hsl(15,100%,56%)',  to: 'hsl(330,82%,55%)' },
  { from: 'hsl(158,64%,40%)', to: 'hsl(200,90%,45%)' },
  { from: 'hsl(243,75%,59%)', to: 'hsl(15,100%,56%)' },
];

const AVATAR_GRADIENTS = [
  ['hsl(258,78%,55%)', 'hsl(200,90%,45%)'],
  ['hsl(158,64%,42%)', 'hsl(180,70%,42%)'],
  ['hsl(330,82%,53%)', 'hsl(15,100%,58%)'],
  ['hsl(38,100%,52%)', 'hsl(50,100%,48%)'],
  ['hsl(200,90%,46%)', 'hsl(220,85%,56%)'],
  ['hsl(263,70%,60%)', 'hsl(283,65%,56%)'],
  ['hsl(158,64%,46%)', 'hsl(180,70%,42%)'],
  ['hsl(15,100%,60%)',  'hsl(38,100%,56%)'],
  ['hsl(243,75%,55%)', 'hsl(263,70%,58%)'],
  ['hsl(330,82%,53%)', 'hsl(200,90%,46%)'],
  ['hsl(38,100%,52%)',  'hsl(158,64%,42%)'],
  ['hsl(263,70%,60%)', 'hsl(15,100%,58%)'],
];

const StarRating = ({ rating, color }: { rating: number; color: string }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={12} fill={i <= rating ? color : 'none'} style={{ color: i <= rating ? color : 'hsl(220,13%,78%)' }} />
    ))}
  </div>
);

const AvatarCircle = ({ initials, index }: { initials: string; index: number }) => {
  const [a, b] = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  return (
    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
      style={{ background: `linear-gradient(135deg, ${a}, ${b})`, boxShadow: `0 4px 12px ${a}45` }}>
      {initials}
    </div>
  );
};

/* ─── Review Card ─────────────────────────────── */
const ReviewCard = ({ review, index }: { review: Review; index: number }) => {
  const [hov, setHov] = useState(false);
  const { from, to } = PALETTES[index % PALETTES.length];

  return (
    <div
      className="flex-shrink-0 w-[290px] sm:w-[320px] cursor-default rounded-3xl overflow-hidden relative"
      style={{
        /* White glassmorphism */
        background: hov ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        border: '1.5px solid rgba(255,255,255,0.90)',
        boxShadow: hov
          ? `0 18px 48px rgba(0,0,0,0.10), 0 4px 18px ${from}28, inset 0 1px 0 rgba(255,255,255,1)`
          : `0 4px 22px rgba(0,0,0,0.06), 0 2px 8px ${from}14, inset 0 1px 0 rgba(255,255,255,1)`,
        transform: hov ? 'translateY(-4px) scale(1.015)' : 'translateY(0) scale(1)',
        transition: 'all 0.32s cubic-bezier(0.23,1,0.32,1)',
        outline: hov ? `1.5px solid ${from}30` : '1.5px solid transparent',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Top colored stripe */}
      <div className="absolute top-0 left-0 right-0 h-[3.5px]"
        style={{ background: `linear-gradient(90deg, ${from}, ${to})` }} />

      {/* Corner glow */}
      <div className="absolute top-0 right-0 w-28 h-28 pointer-events-none opacity-40"
        style={{ background: `radial-gradient(circle at top right, ${from}18, transparent 70%)` }} />

      <div className="p-5 pt-5 space-y-3">
        {/* Quote icon */}
        <Quote size={20} style={{ color: from, opacity: 0.7 }} />

        {/* Review text */}
        <p className="text-[12.5px] leading-relaxed line-clamp-4" style={{ color: 'hsl(226,20%,38%)' }}>
          {review.review}
        </p>

        {/* Rating + Product */}
        <div className="flex items-center justify-between gap-2">
          <StarRating rating={review.rating} color={from} />
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full truncate max-w-[110px]"
            style={{
              background: `${from}14`,
              border: `1px solid ${from}30`,
              color: from,
            }}>
            {review.product}
          </span>
        </div>

        {/* Divider */}
        <div className="h-px" style={{ background: `linear-gradient(90deg, ${from}25, transparent 70%)` }} />

        {/* Author */}
        <div className="flex items-center gap-3">
          <AvatarCircle initials={review.avatar} index={index} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-bold truncate" style={{ color: 'hsl(226,35%,14%)' }}>
                {review.name}
              </p>
              {review.verified && (
                <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'hsl(158,64%,42%)' }} title="Verified Purchase">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </div>
            <p className="text-[11px]" style={{ color: 'hsl(226,20%,58%)' }}>
              {review.location} · {review.date}
            </p>
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
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const half = Math.ceil(REVIEWS.length / 2);
  const row1 = [...REVIEWS.slice(0, half), ...REVIEWS.slice(0, half)];
  const row2 = [...REVIEWS.slice(half), ...REVIEWS.slice(half)];

  const avgRating = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);
  const statsData = [
    { value: avgRating, label: 'গড় রেটিং', suffix: '★', from: 'hsl(38,100%,52%)', to: 'hsl(50,100%,50%)' },
    { value: '2,500+', label: 'সন্তুষ্ট গ্রাহক', suffix: '', from: 'hsl(243,75%,59%)', to: 'hsl(263,70%,62%)' },
    { value: '99%',    label: 'পজিটিভ রিভিউ', suffix: '', from: 'hsl(158,64%,40%)', to: 'hsl(180,70%,42%)' },
  ];

  return (
    <section ref={sectionRef} className="py-16 sm:py-20 overflow-hidden relative bg-transparent below-fold">
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full blur-3xl" style={{ background: 'hsla(243,75%,62%,0.05)' }} />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full blur-3xl" style={{ background: 'hsla(15,100%,58%,0.04)' }} />
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-bold mb-5 tracking-widest uppercase"
            style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(16px)',
              border: '1.5px solid hsla(243,75%,59%,0.38)',
              color: 'hsl(243,75%,55%)',
              boxShadow: '0 2px 14px hsla(243,75%,59%,0.14)',
            }}>
            ⭐ Customer Reviews
          </div>

          <h2 className="font-sora font-black text-3xl sm:text-4xl mb-3" style={{ color: 'hsl(226,35%,13%)' }}>
            হাজারো{' '}
            <span style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              সন্তুষ্ট
            </span>{' '}
            গ্রাহক
          </h2>
          <p className="text-sm sm:text-base max-w-lg mx-auto" style={{ color: 'hsl(226,20%,46%)' }}>
            সারা বাংলাদেশ থেকে গ্রাহকরা আমাদের সার্ভিস নিয়ে যা বলছেন
          </p>

          {/* Stats */}
          <div className={`flex items-center justify-center gap-4 mt-8 flex-wrap transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            {statsData.map((stat, i) => (
              <div key={i}
                className="rounded-3xl overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.78)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  border: '1.5px solid rgba(255,255,255,0.92)',
                  boxShadow: `0 4px 22px ${stat.from}18, inset 0 1px 0 rgba(255,255,255,1)`,
                }}>
                {/* Top stripe */}
                <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${stat.from}, ${stat.to})` }} />
                <div className="text-center px-7 py-3">
                  <p className="font-sora font-black text-2xl sm:text-3xl" style={{ color: 'hsl(226,35%,14%)' }}>
                    {stat.value}
                    <span style={{ color: stat.from }}>{stat.suffix}</span>
                  </p>
                  <p className="text-[11px] font-medium mt-0.5" style={{ color: 'hsl(226,20%,52%)' }}>
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scrolling rows */}
      <div className="space-y-4" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
        {/* Row 1 — left */}
        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, hsl(var(--background)), transparent)' }} />
          <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, hsl(var(--background)), transparent)' }} />
          <div className="flex gap-4 pl-4"
            style={{
              width: 'max-content',
              animation: 'marquee-left 48s linear infinite',
              animationPlayState: isPaused ? 'paused' : 'running',
            }}>
            {row1.map((r, i) => <ReviewCard key={`r1-${i}`} review={r} index={i} />)}
          </div>
        </div>

        {/* Row 2 — right */}
        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, hsl(var(--background)), transparent)' }} />
          <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, hsl(var(--background)), transparent)' }} />
          <div className="flex gap-4 pl-4"
            style={{
              width: 'max-content',
              animation: 'marquee-right 44s linear infinite',
              animationPlayState: isPaused ? 'paused' : 'running',
            }}>
            {row2.map((r, i) => <ReviewCard key={`r2-${i}`} review={r} index={i + half} />)}
          </div>
        </div>
      </div>

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
