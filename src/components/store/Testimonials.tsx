import { useRef, useEffect, useState } from 'react';
import { Star, Quote } from 'lucide-react';

interface Review {
  name: string; location: string; avatar: string; rating: number;
  review: string; product: string; date: string; verified: boolean;
}

const REVIEWS: Review[] = [
  { name: 'Rakib Hassan',   location: 'Dhaka',      avatar: 'RH', rating: 5, review: 'অসাধারণ সার্ভিস! মাত্র ৩০ মিনিটের মধ্যে Windows 11 Pro এর লাইসেন্স কি পেয়েছি। একদম অরিজিনাল, অ্যাক্টিভেশনে কোনো সমস্যা হয়নি।', product: 'Windows 11 Pro', date: '২ দিন আগে', verified: true },
  { name: 'Nusrat Jahan',   location: 'Chittagong', avatar: 'NJ', rating: 5, review: 'Microsoft Office 2024 কিনেছি, দাম অনেক কম কিন্তু কোয়ালিটি একদম বেস্ট। সাপোর্ট টিম খুব হেল্পফুল ছিল।', product: 'MS Office 2024', date: '৫ দিন আগে', verified: true },
  { name: 'Arif Billah',    location: 'Sylhet',     avatar: 'AB', rating: 5, review: 'Adobe Photoshop এর subscription নিয়েছি। বাংলাদেশে এত সস্তায় অরিজিনাল Adobe পাওয়া সত্যিই অবিশ্বাস্য!', product: 'Adobe Creative Cloud', date: '১ সপ্তাহ আগে', verified: true },
  { name: 'Farhan Ahmed',   location: 'Rajshahi',   avatar: 'FA', rating: 5, review: 'bKash এ পেমেন্ট করেছি, ১ ঘন্টার মধ্যে ইমেইলে key পেয়ে গেছি। খুবই fast delivery। পরের বার আবার কিনব।', product: 'Windows 10 Pro', date: '১ সপ্তাহ আগে', verified: true },
  { name: 'Sadia Islam',    location: 'Comilla',    avatar: 'SI', rating: 5, review: 'Netflix Premium subscription নিয়েছি, এখন পরিবারের ৪ জন মিলে দেখছি। অনেক সাশ্রয়ী। Shahed Store কে ধন্যবাদ!', product: 'Netflix Premium', date: '১০ দিন আগে', verified: true },
  { name: 'Tanvir Hossain', location: 'Khulna',     avatar: 'TH', rating: 4, review: 'দুর্দান্ত অভিজ্ঞতা! Canva Pro নিয়েছি freelancing কাজের জন্য। সরকারি নিবন্ধিত শপ হওয়ায় বিশ্বাস করে কিনলাম।', product: 'Canva Pro', date: '২ সপ্তাহ আগে', verified: true },
  { name: 'Mim Akter',      location: 'Mymensingh', avatar: 'MA', rating: 5, review: 'Spotify Premium এর দাম দেখে অবাক হয়ে গেছি। এত কমে? তাও আবার অরিজিনাল! বন্ধুদেরও recommend করেছি।', product: 'Spotify Premium', date: '২ সপ্তাহ আগে', verified: true },
  { name: 'Sumon Mia',      location: 'Bogura',     avatar: 'SM', rating: 5, review: 'WhatsApp Support এ অর্ডার করলাম, একদম সহজ process। মাত্র ১৫ মিনিটে license key পেয়ে গেলাম। অসাধারণ!', product: 'MS Office 365', date: '৩ সপ্তাহ আগে', verified: true },
];

const ACCENTS = ['hsl(263,70%,58%)', 'hsl(15,100%,60%)', 'hsl(158,64%,42%)', 'hsl(38,100%,55%)', 'hsl(190,70%,45%)', 'hsl(283,65%,55%)', 'hsl(243,75%,59%)', 'hsl(0,70%,55%)'];

const ReviewCard = ({ review, index }: { review: Review; index: number }) => {
  const accent = ACCENTS[index % ACCENTS.length];
  return (
    <div className="flex-shrink-0 w-[300px] sm:w-[330px] rounded-xl p-5 space-y-3 cursor-default"
      style={{ background: 'hsl(222,22%,13%)', border: '1px solid hsla(0,0%,100%,0.07)' }}>
      <Quote size={16} style={{ color: `${accent}60` }} />
      <p className="text-sm leading-relaxed line-clamp-4" style={{ color: 'hsla(0,0%,100%,0.55)' }}>{review.review}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-0.5">
          {[1,2,3,4,5].map(i => <Star key={i} size={11} fill={i <= review.rating ? 'hsl(38,100%,55%)' : 'none'} color={i <= review.rating ? 'hsl(38,100%,55%)' : 'hsla(0,0%,100%,0.1)'} />)}
        </div>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}25` }}>
          {review.product}
        </span>
      </div>
      <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid hsla(0,0%,100%,0.06)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: accent }}>
          {review.avatar}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-white">{review.name}</p>
            {review.verified && <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"><svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>}
          </div>
          <p className="text-xs" style={{ color: 'hsla(0,0%,100%,0.3)' }}>{review.location} · {review.date}</p>
        </div>
      </div>
    </div>
  );
};

const Testimonials = () => {
  const [isPaused, setIsPaused] = useState(false);
  const row1 = [...REVIEWS.slice(0, 4), ...REVIEWS.slice(0, 4)];
  const row2 = [...REVIEWS.slice(4), ...REVIEWS.slice(4)];
  const avgRating = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);

  return (
    <section className="py-16 overflow-hidden" style={{ background: 'hsl(222, 22%, 8%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
        <h2 className="font-sora font-black text-2xl sm:text-3xl text-white mb-3">
          হাজারো{' '}
          <span style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            সন্তুষ্ট
          </span>{' '}
          গ্রাহক
        </h2>
        <p className="text-sm" style={{ color: 'hsla(0,0%,100%,0.4)' }}>সারা বাংলাদেশ থেকে গ্রাহকরা আমাদের সার্ভিস নিয়ে যা বলছেন</p>
        <div className="flex items-center justify-center gap-8 mt-6">
          {[{ value: avgRating, label: 'গড় রেটিং', suffix: '★' }, { value: '2,500+', label: 'সন্তুষ্ট গ্রাহক', suffix: '' }, { value: '99%', label: 'পজিটিভ রিভিউ', suffix: '' }].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="font-sora font-black text-2xl text-white">{stat.value}<span className="text-yellow-400">{stat.suffix}</span></p>
              <p className="text-xs mt-0.5" style={{ color: 'hsla(0,0%,100%,0.35)' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
        {[{ items: row1, dir: 'marquee-left', speed: '40s' }, { items: row2, dir: 'marquee-right', speed: '36s' }].map((row, ri) => (
          <div key={ri} className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to right, hsl(222,22%,8%), transparent)' }} />
            <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to left, hsl(222,22%,8%), transparent)' }} />
            <div className="flex gap-4 pl-4"
              style={{ width: 'max-content', animation: `${row.dir} ${row.speed} linear infinite`, animationPlayState: isPaused ? 'paused' : 'running' }}>
              {row.items.map((r, i) => <ReviewCard key={`${ri}-${i}`} review={r} index={i} />)}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes marquee-right { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
      `}</style>
    </section>
  );
};

export default Testimonials;
