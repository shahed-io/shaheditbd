import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Sparkles, Zap, Shield, Headphones, Building2, Tag, Users } from 'lucide-react';

const FEATURES = [
  {
    icon: '⚡', lucide: Zap,
    title: 'Instant Delivery',
    desc: 'Payment-এর পরেই ইমেইলে license key পাঠানো হয়।',
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
    from: 'hsl(263,70%,58%)', to: 'hsl(283,65%,55%)',
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
    from: 'hsl(38,100%,55%)', to: 'hsl(50,100%,55%)',
  },
];

const STEPS = [
  { n: '01', emoji: '🛒', title: 'Choose Product',   desc: 'আমাদের collection থেকে পছন্দের software বেছে নিন।',  from: 'hsl(243,75%,59%)', to: 'hsl(263,70%,62%)' },
  { n: '02', emoji: '💳', title: 'Make Payment',      desc: 'bKash, Nagad বা Rocket-এ নিরাপদে payment করুন।',     from: 'hsl(15,100%,58%)',  to: 'hsl(38,100%,55%)' },
  { n: '03', emoji: '📧', title: 'Get Delivery',      desc: 'মিনিটের মধ্যে ইমেইলে license key পাঠানো হবে।',       from: 'hsl(158,64%,42%)', to: 'hsl(180,70%,40%)' },
  { n: '04', emoji: '✅', title: 'Activate & Enjoy', desc: 'Product activate করুন, সমস্যায় support-এ যোগাযোগ।', from: 'hsl(263,70%,58%)', to: 'hsl(283,65%,55%)' },
];

const STATS = [
  { n: '12K+', l: 'Happy Customers',  from: 'hsl(243,75%,59%)', to: 'hsl(263,70%,62%)' },
  { n: '500+', l: 'Products',          from: 'hsl(158,64%,42%)', to: 'hsl(180,70%,40%)' },
  { n: '25K+', l: 'Orders Delivered',  from: 'hsl(15,100%,58%)',  to: 'hsl(38,100%,55%)' },
  { n: '24/7', l: 'Support Available', from: 'hsl(263,70%,58%)', to: 'hsl(283,65%,55%)' },
];

/* ─── Section Header ─────────────────────────── */
const SectionHeader = ({ badge, badgeColor, title, subtitle }: {
  badge: string; badgeColor: string; title: React.ReactNode; subtitle: string;
}) => (
  <div className="text-center mb-12">
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

/* ─── Feature Card (Glassmorphism Gradient Border) ─── */
const FeatureCard = ({ feature: f, index }: { feature: typeof FEATURES[0]; index: number }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="relative rounded-3xl p-[2px] transition-all duration-300"
      style={{
        background: hov
          ? `linear-gradient(135deg, ${f.from}, ${f.to}, ${f.from}88)`
          : `linear-gradient(135deg, ${f.from}60, ${f.to}40, rgba(255,255,255,0.6))`,
        boxShadow: hov
          ? `0 20px 50px ${f.from}30, 0 0 0 1px ${f.from}20`
          : `0 4px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.8)`,
        transform: hov ? 'translateY(-5px) scale(1.02)' : 'translateY(0) scale(1)',
        animationDelay: `${index * 0.1}s`,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Inner glass card */}
      <div
        className="relative rounded-[22px] overflow-hidden h-full"
        style={{
          background: hov
            ? 'rgba(255,255,255,0.92)'
            : 'rgba(255,255,255,0.78)',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
        }}
      >
        {/* Shimmer top line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[22px]"
          style={{ background: `linear-gradient(90deg, transparent 10%, ${f.from}, ${f.to}, transparent 90%)`, opacity: hov ? 1 : 0.6, transition: 'opacity 0.3s' }} />

        {/* Corner ambient glow */}
        <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
          style={{ background: `radial-gradient(circle at top right, ${f.from}20, transparent 65%)` }} />
        <div className="absolute bottom-0 left-0 w-24 h-24 pointer-events-none"
          style={{ background: `radial-gradient(circle at bottom left, ${f.to}15, transparent 65%)` }} />

        <div className="pl-7 pr-5 py-5">
          {/* Icon + title */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 transition-transform duration-300"
              style={{
                background: `linear-gradient(135deg, ${f.from}22, ${f.to}14)`,
                border: `1.5px solid ${f.from}45`,
                boxShadow: hov ? `0 6px 20px ${f.from}35` : `0 2px 8px ${f.from}18`,
                transform: hov ? 'rotate(-5deg) scale(1.1)' : 'rotate(0) scale(1)',
              }}>
              {f.icon}
            </div>
            <h3 className="font-sora font-bold text-[13.5px] leading-tight flex items-center gap-1.5"
              style={{ color: 'hsl(226,35%,14%)' }}>
              {f.title}
              <CheckCircle2 size={13} style={{ color: f.from }} className="flex-shrink-0 opacity-80" />
            </h3>
          </div>

          {/* Thin divider */}
          <div className="h-px mb-3"
            style={{ background: `linear-gradient(90deg, ${f.from}45, ${f.to}25, transparent 80%)` }} />

          <p className="text-[12.5px] leading-relaxed" style={{ color: 'hsl(226,20%,46%)' }}>
            {f.desc}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ─── Step Card (Glassmorphism Gradient Border) ─── */
const StepCard = ({ step, index }: { step: typeof STEPS[0]; index: number }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="relative rounded-3xl p-[2px] transition-all duration-300"
      style={{
        background: hov
          ? `linear-gradient(135deg, ${step.from}, ${step.to}, ${step.from}88)`
          : `linear-gradient(135deg, ${step.from}55, ${step.to}35, rgba(255,255,255,0.55))`,
        boxShadow: hov
          ? `0 20px 50px ${step.from}30, 0 0 0 1px ${step.from}20`
          : `0 4px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.8)`,
        transform: hov ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Inner glass */}
      <div
        className="relative rounded-[22px] overflow-hidden"
        style={{
          background: hov ? 'rgba(255,255,255,0.94)' : 'rgba(255,255,255,0.80)',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
        }}
      >
        {/* Shimmer top */}
        <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[22px]"
          style={{ background: `linear-gradient(90deg, transparent 10%, ${step.from}, ${step.to}, transparent 90%)`, opacity: hov ? 1 : 0.55, transition: 'opacity 0.3s' }} />

        {/* Ambient glows */}
        <div className="absolute top-0 right-0 w-28 h-28 pointer-events-none"
          style={{ background: `radial-gradient(circle at top right, ${step.from}18, transparent 65%)` }} />
        <div className="absolute bottom-0 left-0 w-28 h-28 pointer-events-none"
          style={{ background: `radial-gradient(circle at bottom left, ${step.to}15, transparent 65%)` }} />

        <div className="px-4 py-6 flex flex-col items-center text-center gap-3">
          {/* Step pill */}
          <div
            className="px-3.5 py-1 rounded-full text-[10px] font-bold text-white tracking-widest"
            style={{
              background: `linear-gradient(135deg, ${step.from}, ${step.to})`,
              boxShadow: `0 4px 14px ${step.from}50`,
            }}>
            STEP {step.n}
          </div>

          {/* Emoji bubble */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${step.from}22, ${step.to}14)`,
              border: `1.5px solid ${step.from}40`,
              boxShadow: hov ? `0 8px 24px ${step.from}35` : `0 3px 10px ${step.from}18`,
              transform: hov ? 'scale(1.12)' : 'scale(1)',
            }}>
            {step.emoji}
          </div>

          {/* Divider */}
          <div className="w-10 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${step.from}55, transparent)` }} />

          <div>
            <h3 className="font-sora font-bold text-[13px] sm:text-[13.5px] mb-1.5"
              style={{ color: 'hsl(226,35%,14%)' }}>
              {step.title}
            </h3>
            <p className="text-[11.5px] leading-relaxed"
              style={{ color: 'hsl(226,20%,46%)' }}>
              {step.desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Stats Bar (Glassmorphism Gradient Border) ─── */
const StatsBar = ({ stats, visible }: { stats: typeof STATS; visible: boolean }) => (
  <div
    className="relative rounded-3xl p-[2px]"
    style={{
      background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(15,100%,58%), hsl(158,64%,42%), hsl(263,70%,58%))',
      boxShadow: '0 16px 48px rgba(0,0,0,0.10)',
    }}
  >
    <div
      className="relative overflow-hidden rounded-[22px]"
      style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(36px) saturate(200%)',
        WebkitBackdropFilter: 'blur(36px) saturate(200%)',
      }}
    >
      {/* Rainbow shimmer top */}
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[22px]"
        style={{ background: 'linear-gradient(90deg, hsl(243,75%,59%), hsl(15,100%,58%), hsl(158,64%,42%), hsl(263,70%,58%))' }} />

      {/* Ambient blobs */}
      <div className="absolute top-0 left-0 w-48 h-48 pointer-events-none"
        style={{ background: 'radial-gradient(circle at top left, hsla(243,75%,59%,0.10), transparent 65%)' }} />
      <div className="absolute bottom-0 right-0 w-48 h-48 pointer-events-none"
        style={{ background: 'radial-gradient(circle at bottom right, hsla(15,100%,58%,0.08), transparent 65%)' }} />

      <div className="absolute top-5 right-6 pointer-events-none">
        <Sparkles size={22} style={{ color: 'hsla(258,78%,55%,0.18)' }} />
      </div>

      <div className="relative p-8 sm:p-10 pt-9">
        <p className="text-center text-[10.5px] font-semibold mb-8 tracking-[0.28em] uppercase"
          style={{ color: 'hsl(226,20%,55%)' }}>
          Our Numbers Speak For Themselves
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i}
              className={`relative overflow-hidden rounded-2xl p-[2px] transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{
                transitionDelay: `${i * 0.12}s`,
                background: `linear-gradient(135deg, ${s.from}80, ${s.to}55, rgba(255,255,255,0.5))`,
                boxShadow: `0 4px 18px ${s.from}18`,
              }}>
              <div
                className="rounded-[14px] p-4 text-center h-full"
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                {/* top stripe */}
                <div className="absolute top-2 left-2 right-2 h-[2px] rounded-full"
                  style={{ background: `linear-gradient(90deg, ${s.from}, ${s.to})`, opacity: 0.55 }} />
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
        <div className="absolute top-1/4 left-0 w-[480px] h-[480px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(243,75%,62%,0.06), transparent)', filter: 'blur(90px)' }} />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(15,100%,60%,0.05), transparent)', filter: 'blur(90px)' }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-20 relative z-10">

        {/* ══ WHY CHOOSE US ══ */}
        <div>
          <SectionHeader
            badge="✦ Why Us"
            badgeColor="hsl(243,75%,58%)"
            title={
              <>Why <span style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,62%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Choose Us?</span></>
            }
            subtitle="Bangladesh's most trusted digital software marketplace since 2020."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} feature={f} index={i} />
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((step, i) => (
              <StepCard key={i} step={step} index={i} />
            ))}
          </div>
        </div>

        {/* ══ STATS ══ */}
        <div ref={statsRef}>
          <StatsBar stats={STATS} visible={statsVisible} />
        </div>

      </div>
    </section>
  );
};

export default WhyChooseUs;
