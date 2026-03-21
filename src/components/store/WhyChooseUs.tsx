import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Sparkles, Zap, Shield, Headphones, Building2, Tag, Users } from 'lucide-react';

const FEATURES = [
  {
    icon: '⚡', lucide: Zap,
    title: 'Fast Delivery',
    desc: 'Payment যাচাইয়ের পর ১–২৪ ঘণ্টার মধ্যে ইমেইলে license key পাঠানো হয়।',
    from: 'hsl(243,75%,59%)', to: 'hsl(263,70%,62%)',
  },
  {
    icon: '🛡️', lucide: Shield,
    title: '100% Genuine Keys',
    desc: 'সব key ১০০% original এবং Microsoft verified।',
    from: 'hsl(158,64%,42%)', to: 'hsl(180,70%,40%)',
  },
  {
    icon: '🎧', lucide: Headphones,
    title: '24/7 Support',
    desc: 'WhatsApp ও Telegram-এ সার্বক্ষণিক সাপোর্ট।',
    from: 'hsl(258,78%,55%)', to: 'hsl(283,65%,55%)',
  },
  {
    icon: '🏛️', lucide: Building2,
    title: 'Govt. Registered',
    desc: 'DBID: 586772174 — সরকার নিবন্ধিত ব্যবসা।',
    from: 'hsl(158,64%,42%)', to: 'hsl(180,70%,40%)',
  },
  {
    icon: '💰', lucide: Tag,
    title: 'Lowest Price BD',
    desc: 'বাংলাদেশের সবচেয়ে কম দামে অরিজিনাল সফটওয়্যার।',
    from: 'hsl(15,100%,58%)', to: 'hsl(38,100%,55%)',
  },
  {
    icon: '😊', lucide: Users,
    title: '12K+ Customers',
    desc: '২০২০ সাল থেকে ১২০০০+ সন্তুষ্ট গ্রাহক সারা বিশ্বে।',
    from: 'hsl(258,78%,55%)', to: 'hsl(38,100%,55%)',
  },
];

const STEPS = [
  { n: '01', emoji: '🛒', title: 'Choose Product',   desc: 'আমাদের collection থেকে পছন্দের software বেছে নিন।',  from: 'hsl(243,75%,59%)', to: 'hsl(258,78%,55%)' },
  { n: '02', emoji: '💳', title: 'Make Payment',      desc: 'bKash, Nagad বা Rocket-এ নিরাপদে payment করুন।',     from: 'hsl(15,100%,58%)',  to: 'hsl(38,100%,55%)' },
  { n: '03', emoji: '📧', title: 'Get Delivery',      desc: '১–২৪ ঘণ্টার মধ্যে ইমেইলে license key পাঠানো হবে।',  from: 'hsl(158,64%,42%)', to: 'hsl(180,70%,40%)' },
  { n: '04', emoji: '✅', title: 'Activate & Enjoy', desc: 'Product activate করুন, সমস্যায় support-এ যোগাযোগ।', from: 'hsl(258,78%,55%)', to: 'hsl(283,65%,55%)' },
];

const STATS = [
  { n: '12K+', l: 'Happy Customers',  from: 'hsl(243,75%,59%)', to: 'hsl(258,78%,55%)' },
  { n: '500+', l: 'Products',          from: 'hsl(158,64%,42%)', to: 'hsl(180,70%,40%)' },
  { n: '25K+', l: 'Orders Delivered',  from: 'hsl(15,100%,58%)',  to: 'hsl(38,100%,55%)' },
  { n: '24/7', l: 'Support Available', from: 'hsl(258,78%,55%)', to: 'hsl(283,65%,55%)' },
];

/* ─── Spinning Gradient Border Wrapper ─────────── */
const GradientBorderCard = ({
  children, from, to, className = '',
}: {
  children: React.ReactNode; from: string; to: string; className?: string;
}) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      className={`relative rounded-[22px] p-[1.5px] ${className}`}
      style={{
        background: hov
          ? `linear-gradient(135deg, ${from}, ${to}, ${from})`
          : `linear-gradient(135deg, ${from}55, ${to}30, transparent 60%)`,
        transition: 'background 0.35s ease',
        boxShadow: hov
          ? `0 0 28px ${from}45, 0 8px 40px rgba(0,0,0,0.10)`
          : `0 4px 20px rgba(0,0,0,0.06)`,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Animated rotating border on hover */}
      {hov && (
        <div
          className="absolute inset-0 rounded-[22px] pointer-events-none"
          style={{
            background: `conic-gradient(from 0deg, ${from}, ${to}, ${from}88, transparent 60%)`,
            animation: 'spin 2.5s linear infinite',
            opacity: 0.6,
          }}
        />
      )}
      {/* Inner glass card */}
      <div
        className="relative rounded-[20px] h-full"
        style={{
          background: hov
            ? 'rgba(255,255,255,0.93)'
            : 'rgba(255,255,255,0.80)',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
          transform: hov ? 'translateY(-3px)' : 'translateY(0)',
          transition: 'all 0.32s cubic-bezier(0.23,1,0.32,1)',
        }}
      >
        {/* Top shimmer line */}
        <div className="absolute top-0 left-0 right-0 h-px rounded-t-[20px]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.95) 50%, transparent)' }} />
        {/* Ambient corner glow */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-tr-[20px] pointer-events-none"
          style={{ background: `radial-gradient(circle at top right, ${from}18, transparent 65%)` }} />
        {children}
      </div>
    </div>
  );
};

/* ─── Section Header ─────────────────────────────── */
const SectionHeader = ({ badge, badgeColor, title, subtitle }: {
  badge: string; badgeColor: string; title: React.ReactNode; subtitle: string;
}) => (
  <div className="text-center mb-10">
    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-bold mb-5 tracking-widest uppercase"
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        border: `1.5px solid ${badgeColor}45`,
        color: badgeColor,
        boxShadow: `0 2px 16px ${badgeColor}20`,
      }}>
      {badge}
    </div>
    <h2 className="font-sora font-black text-3xl sm:text-4xl" style={{ color: 'hsl(226,35%,13%)' }}>
      {title}
    </h2>
    <p className="mt-3 max-w-lg mx-auto text-[14px] leading-relaxed" style={{ color: 'hsl(226,20%,45%)' }}>
      {subtitle}
    </p>
  </div>
);

/* ─── Feature Card ─────────────────────────────── */
const FeatureCard = ({ feature: f }: { feature: typeof FEATURES[0] }) => (
  <GradientBorderCard from={f.from} to={f.to}>
    <div className="pl-6 pr-5 py-5">
      {/* Icon + title */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${f.from}22, ${f.to}14)`,
            border: `1.5px solid ${f.from}40`,
            boxShadow: `0 4px 14px ${f.from}20`,
          }}>
          {f.icon}
        </div>
        <h3 className="font-sora font-bold text-[13.5px] leading-tight flex items-center gap-1.5"
          style={{ color: 'hsl(226,35%,14%)' }}>
          {f.title}
          <CheckCircle2 size={13} style={{ color: f.from }} className="flex-shrink-0 opacity-80" />
        </h3>
      </div>

      {/* Thin gradient divider */}
      <div className="h-px mb-3"
        style={{ background: `linear-gradient(90deg, ${f.from}45, transparent 70%)` }} />

      <p className="text-[12.5px] leading-relaxed" style={{ color: 'hsl(226,20%,46%)' }}>
        {f.desc}
      </p>
    </div>
  </GradientBorderCard>
);

/* ─── Step Card ─────────────────────────────────── */
const StepCard = ({ step }: { step: typeof STEPS[0] }) => (
  <GradientBorderCard from={step.from} to={step.to}>
    <div className="px-4 py-6 flex flex-col items-center text-center gap-3">
      {/* Step pill */}
      <div className="px-3.5 py-1 rounded-full text-[10px] font-extrabold text-white tracking-widest"
        style={{
          background: `linear-gradient(135deg, ${step.from}, ${step.to})`,
          boxShadow: `0 3px 12px ${step.from}50`,
        }}>
        STEP {step.n}
      </div>

      {/* Emoji bubble */}
      <div className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-2xl"
        style={{
          background: `linear-gradient(135deg, ${step.from}22, ${step.to}14)`,
          border: `1.5px solid ${step.from}40`,
          boxShadow: `0 4px 14px ${step.from}22`,
        }}>
        {step.emoji}
      </div>

      {/* Divider */}
      <div className="w-8 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${step.from}60, transparent)` }} />

      <div>
        <h3 className="font-sora font-bold text-[13px] mb-1.5"
          style={{ color: 'hsl(226,35%,14%)' }}>
          {step.title}
        </h3>
        <p className="text-[11.5px] leading-relaxed"
          style={{ color: 'hsl(226,20%,46%)' }}>
          {step.desc}
        </p>
      </div>
    </div>
  </GradientBorderCard>
);

/* ─── Stats Bar ─────────────────────────────────── */
const StatsBar = ({ stats, visible }: { stats: typeof STATS; visible: boolean }) => (
  <div className="relative overflow-hidden rounded-[24px] p-[1.5px]"
    style={{
      background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(15,100%,58%), hsl(158,64%,42%), hsl(258,78%,55%))',
      boxShadow: '0 8px 48px hsla(258,78%,55%,0.18)',
    }}>
    {/* Rotating conic border */}
    <div className="absolute inset-0 rounded-[24px] pointer-events-none"
      style={{
        background: 'conic-gradient(from 0deg, hsl(258,78%,55%), hsl(15,100%,58%), hsl(158,64%,42%), hsl(258,78%,55%))',
        animation: 'spin 6s linear infinite',
        opacity: 0.5,
      }} />

    <div className="relative rounded-[22px] overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(36px) saturate(200%)',
        WebkitBackdropFilter: 'blur(36px) saturate(200%)',
      }}>
      {/* Top shimmer */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,1) 50%, transparent)' }} />

      <div className="absolute top-4 right-6 pointer-events-none">
        <Sparkles size={22} style={{ color: 'hsla(258,78%,55%,0.18)' }} />
      </div>

      <div className="relative px-8 py-10">
        <p className="text-center text-[10.5px] font-semibold mb-8 tracking-[0.30em] uppercase"
          style={{ color: 'hsl(226,20%,55%)' }}>
          Our Numbers Speak For Themselves
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i}
              className={`relative overflow-hidden rounded-2xl p-[1.5px] transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{
                transitionDelay: `${i * 0.13}s`,
                background: `linear-gradient(135deg, ${s.from}, ${s.to})`,
                boxShadow: `0 4px 20px ${s.from}30`,
              }}>
              <div className="rounded-[14px] p-4 text-center h-full"
                style={{
                  background: 'rgba(255,255,255,0.88)',
                  backdropFilter: 'blur(16px)',
                }}>
                <div className="font-sora font-black text-[2.2rem] sm:text-[2.6rem] leading-none"
                  style={{
                    background: `linear-gradient(135deg, ${s.from}, ${s.to})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                  {s.n}
                </div>
                <div className="text-[11px] font-semibold mt-1.5 uppercase tracking-wider"
                  style={{ color: 'hsl(226,20%,52%)' }}>
                  {s.l}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ─── Main Component ─────────────────────────────── */
const WhyChooseUs = () => {
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setStatsVisible(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="py-20 relative overflow-hidden bg-transparent below-fold">
      {/* Soft ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(258,78%,62%,0.07), transparent)', filter: 'blur(100px)' }} />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(15,100%,60%,0.05), transparent)', filter: 'blur(90px)' }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-20 relative z-10">

        {/* ══ WHY CHOOSE US ══ */}
        <div>
          <SectionHeader
            badge="✦ Why Us"
            badgeColor="hsl(258,78%,55%)"
            title={
              <>Why <span style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(258,78%,55%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Choose Us?</span></>
            }
            subtitle="Bangladesh's most trusted digital software marketplace since 2020."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} feature={f} />
            ))}
          </div>
        </div>

        {/* ══ HOW TO ORDER ══ */}
        <div>
          <SectionHeader
            badge="📦 Order Process"
            badgeColor="hsl(15,100%,55%)"
            title={
              <>How to <span style={{ background: 'linear-gradient(135deg, hsl(15,100%,58%), hsl(38,100%,55%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Order</span></>
            }
            subtitle="চার ধাপে আপনার product পান — সহজ, দ্রুত, নিরাপদ।"
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((step, i) => (
              <StepCard key={i} step={step} />
            ))}
          </div>
        </div>

        {/* ══ STATS ══ */}
        <div ref={statsRef}>
          <StatsBar stats={STATS} visible={statsVisible} />
        </div>

      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
};

export default WhyChooseUs;
