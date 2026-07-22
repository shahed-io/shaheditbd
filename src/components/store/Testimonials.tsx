import { useRef, useEffect, useState } from 'react';
import { Star, Quote } from 'lucide-react';
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

// Real customer reviews collected from Facebook page recommendations
const HARDCODED_REVIEWS: Review[] = [
  { id: crypto.randomUUID(), name: 'Mohammad Shafiqul Islam Tuhin', location: 'Facebook Review', avatar: 'MT', rating: 5, review: 'ধন্যবাদ Shahed Store এত দ্রুত ও চমৎকার সার্ভিসের জন্য। আমি গভীর রাত পর্যন্ত কিছু সমস্যা ফেস করছিলাম সেটা তারা নিরলসভাবে সমাধান করেছেন। Highly recommended 🌟 go ahead 👍', product: 'Verified Purchase', date: 'Aug 16, 2025', verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'Napal Datta', location: 'Facebook Review', avatar: 'ND', rating: 5, review: 'আমি আজ নিলাম অফিস ২০২৪। আপনাদের সার্ভিস অসাধারণ। অনলাইনে থেকে এই প্রথম এমন সার্ভিস পেলাম।', product: 'MS Office 2024', date: 'Dec 8, 2025', verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'MD Al-Amin', location: 'Facebook Review', avatar: 'AA', rating: 5, review: 'Your service is very helpful and your response is quick. I use Canva Pro and everyone can try Canva Pro from this page. I am happy of your quick service. Thank you so much.', product: 'Canva Pro', date: 'Jun 14, 2025', verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'Kamrul Hasan', location: 'Facebook Review', avatar: 'KH', rating: 5, review: 'If you are new at this service — this is the perfect Site for you. They helped me well. I am very Thankful.', product: 'Verified Purchase', date: 'Jun 30, 2025', verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'Farhan Ahmed', location: 'Facebook Review', avatar: 'FA', rating: 5, review: 'অবিশ্বাস্য, পেমেন্ট দেওয়ার আগেই দিয়ে ফেলল। এরকম সার্ভিস আগে পাইনি। ভাই পেমেন্ট করে ব্যবহার শুরু করলাম, আশাকরি দীর্ঘসময় ব্যবহার করতে পারব।', product: 'Verified Purchase', date: 'Jun 14, 2025', verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'Md Kabir', location: 'Facebook Review', avatar: 'MK', rating: 5, review: 'Best service 🥰🥰🥰🥰 go ahead', product: 'Verified Purchase', date: 'Jul 24, 2025', verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'Rizon Islam', location: 'Facebook Review', avatar: 'RI', rating: 5, review: 'Thank you for your service. I am grateful for the passion and professionalism you continue to bring to your service.', product: 'Verified Purchase', date: 'Jun 14, 2025', verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'Sadiya Akter', location: 'Facebook Review', avatar: 'SA', rating: 5, review: 'Vai sera service, sob somossar solution dey vaiyera khub druto. Tnx vai apnader.', product: 'Verified Purchase', date: 'Jun 14, 2025', verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'বর্ণ ঘরকসী', location: 'Facebook Review', avatar: 'বঘ', rating: 5, review: 'A very good page, reasonable price and good service.', product: 'Verified Purchase', date: 'Jul 2, 2025', verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'LX Mamun', location: 'Facebook Review', avatar: 'LM', rating: 5, review: 'Best page. Thank YOU so much for your service.', product: 'Verified Purchase', date: 'Jun 14, 2025', verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'Md Amirul Islam', location: 'Facebook Review', avatar: 'AI', rating: 5, review: 'Nice Service. Trusted page.', product: 'Verified Purchase', date: 'Nov 13, 2025', verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'Sayed Hasan', location: 'Facebook Review', avatar: 'SH', rating: 5, review: 'Highly recommend Shahed Store to purchase MS Office product. 5★ Satisfaction.', product: 'MS Office', date: 'Recent', verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'Muhammed Mamun', location: 'Facebook Review', avatar: 'MM', rating: 5, review: 'Very good services and support. Recommend all for buying any software from here.', product: 'Verified Purchase', date: 'Recent', verified: true, is_visible: true },
  { id: crypto.randomUUID(), name: 'Farl Rasel', location: 'Facebook Review', avatar: 'FR', rating: 5, review: 'The service is very good and they are helping me.', product: 'Verified Purchase', date: 'Recent', verified: true, is_visible: true },
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

const AvatarCircle = ({ initials, index, seed }: { initials: string; index: number; seed: string }) => {
  const [a, b] = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  const [failed, setFailed] = useState(false);
  // Real human portrait photos, deterministic per customer name/seed
  const url = `https://i.pravatar.cc/160?u=${encodeURIComponent(seed)}`;

  return (
    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${a}, ${b})`, boxShadow: `0 4px 12px ${a}45` }}>
      {failed ? initials : (
        <img
          src={url}
          alt={initials}
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
};

/* ─── Review Card ─────────────────────────────── */
const ReviewCard = ({ review, index }: { review: Review; index: number }) => {
  const [hov, setHov] = useState(false);
  const { from } = PALETTES[index % PALETTES.length];

  return (
    <div
      className="flex-shrink-0 w-[290px] sm:w-[320px] cursor-default rounded-2xl relative"
      style={{
        background: hov
          ? 'var(--glass-bg)'
          : 'var(--glass-bg)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: `1px solid ${from.replace('hsl(','hsla(').replace(')',',0.22)')}`,
        boxShadow: hov
          ? `0 12px 36px ${from.replace('hsl(','hsla(').replace(')',',0.15)')}, inset 0 1px 0 hsla(0,0%,100%,0.6)`
          : `var(--glass-shadow)`,
        transform: hov ? 'translateY(-4px) scale(1.015)' : 'translateY(0) scale(1)',
        transition: 'all 0.32s cubic-bezier(0.23,1,0.32,1)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Ambient glow top-right */}
      <div className="absolute top-0 right-0 w-28 h-28 pointer-events-none rounded-2xl overflow-hidden"
        style={{ background: `radial-gradient(circle at top right, ${from.replace('hsl(','hsla(').replace(')',',0.10)')}, transparent 70%)` }} />

      <div className="p-5 space-y-3 relative z-10">
        {/* Column header style — icon + product label */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: from.replace('hsl(','hsla(').replace(')',',0.12)'),
              border: `1.5px solid ${from.replace('hsl(','hsla(').replace(')',',0.25)')}`,
              color: from,
            }}>
            <Quote size={14} />
          </div>
          <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] truncate max-w-[160px]"
            style={{ color: 'hsl(226,35%,20%)' }}>
            {review.product}
          </span>
          <StarRating rating={review.rating} color={from} />
        </div>

        {/* Divider like footer columns */}
        <div className="h-px rounded-full"
          style={{ background: `linear-gradient(90deg, ${from.replace('hsl(','hsla(').replace(')',',0.40)')}, transparent)` }} />

        <p className="text-[15px] leading-[1.55] line-clamp-5 italic" style={{ color: 'hsl(226,22%,28%)', fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, letterSpacing: '0.005em' }}>
          "{review.review}"
        </p>

        <div className="h-px rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${from.replace('hsl(','hsla(').replace(')',',0.18)')}, transparent)` }} />

        <div className="flex items-center gap-3">
          <AvatarCircle initials={review.avatar || review.name?.slice(0,2).toUpperCase()} index={index} seed={review.name || review.id} />
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

  // Load reviews from DB; if empty, seed the hardcoded ones (v2 key = real FB reviews)
  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'testimonials_data_v2').maybeSingle().then(async ({ data }) => {
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
      // No data in DB → seed real FB reviews
      await supabase.from('site_settings').upsert(
        { key: 'testimonials_data_v2', value: JSON.stringify(HARDCODED_REVIEWS), category: 'seo' },
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
    { value: avgRating, label: 'গড় রেটিং', suffix: '★', from: 'hsl(38,100%,52%)', to: 'hsl(50,100%,50%)' },
    { value: '99,000+', label: 'সন্তুষ্ট গ্রাহক', suffix: '', from: 'hsl(243,75%,59%)', to: 'hsl(263,70%,62%)' },
    { value: '99%',    label: 'পজিটিভ রিভিউ', suffix: '', from: 'hsl(158,64%,40%)', to: 'hsl(180,70%,42%)' },
  ];

  if (!loaded || visibleReviews.length === 0) return null;

  return (
    <section ref={sectionRef} className="py-10 overflow-hidden relative bg-transparent">
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full blur-3xl" style={{ background: 'hsla(243,75%,62%,0.05)' }} />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full blur-3xl" style={{ background: 'hsla(15,100%,58%,0.04)' }} />
      </div>

      {/* Header */}
      <div className="container-fluid">
        <div className="text-center mb-12">
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
          <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
            {statsData.map((stat, i) => (
              <div key={i} className="rounded-3xl overflow-hidden"
                style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  border: '1.5px solid var(--glass-border)',
                  boxShadow: `var(--glass-shadow)`,
                }}>
                
                <div className="text-center px-7 py-3">
                  <p className="font-sora font-black text-2xl sm:text-3xl" style={{ color: 'hsl(226,35%,14%)' }}>
                    {stat.value}<span style={{ color: stat.from }}>{stat.suffix}</span>
                  </p>
                  <p className="text-[11px] font-medium mt-0.5" style={{ color: 'hsl(226,20%,52%)' }}>{stat.label}</p>
                </div>
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
