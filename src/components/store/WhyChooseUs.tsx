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
const FeatureCard = ({ feature: f }: { feature: typeof FEATURES[0] }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="relative rounded-3xl overflow-hidden cursor-default"
      style={{
        /* White frosted glass */
        background: hov
          ? 'rgba(255,255,255,0.88)'
          : 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        border: `1.5px solid rgba(255,255,255,0.90)`,
        boxShadow: hov
          ? `0 16px 48px rgba(0,0,0,0.10), 0 4px 16px ${f.from}22, inset 0 1px 0 rgba(255,255,255,1)`
          : `0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)`,
        transform: hov ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
        transition: 'all 0.32s cubic-bezier(0.23,1,0.32,1)',
        outline: hov ? `1.5px solid ${f.from}35` : '1.5px solid transparent',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Left colored stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-3xl"
        style={{ background: `linear-gradient(180deg, ${f.from}, ${f.to})` }} />

      {/* Subtle corner glow */}
      <div className="absolute top-0 right-0 w-28 h-28 pointer-events-none opacity-40"
        style={{ background: `radial-gradient(circle at top right, ${f.from}18, transparent 70%)` }} />

      <div className="pl-7 pr-5 py-5">
        {/* Icon + title */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${f.from}20, ${f.to}12)`,
              border: `1.5px solid ${f.from}38`,
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
        <div className="h-px mb-3 ml-0"
          style={{ background: `linear-gradient(90deg, ${f.from}35, transparent 70%)` }} />

        <p className="text-[12.5px] leading-relaxed" style={{ color: 'hsl(226,20%,46%)' }}>
          {f.desc}
        </p>
      </div>
    </div>
  );
};

/* ─── Step Card ─────────────────────────────────── */
const StepCard = ({ step, index }: { step: typeof STEPS[0]; index: number }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="relative rounded-3xl overflow-hidden cursor-default"
      style={{
        background: hov
          ? 'rgba(255,255,255,0.88)'
          : 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        border: `1.5px solid rgba(255,255,255,0.90)`,
        boxShadow: hov
          ? `0 16px 48px rgba(0,0,0,0.10), 0 4px 16px ${step.from}22, inset 0 1px 0 rgba(255,255,255,1)`
          : `0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)`,
        transform: hov ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
        transition: 'all 0.32s cubic-bezier(0.23,1,0.32,1)',
        outline: hov ? `1.5px solid ${step.from}35` : '1.5px solid transparent',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Left colored stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-3xl"
        style={{ background: `linear-gradient(180deg, ${step.from}, ${step.to})` }} />

      {/* Corner glow */}
      <div className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none opacity-40"
        style={{ background: `radial-gradient(circle at bottom right, ${step.from}18, transparent 70%)` }} />

      <div className="pl-6 pr-4 py-5 flex flex-col items-center text-center gap-3">
        {/* Step pill */}
        <div className="px-3 py-1 rounded-full text-[10px] font-bold text-white"
          style={{
            background: `linear-gradient(135deg, ${step.from}, ${step.to})`,
            boxShadow: `0 3px 10px ${step.from}45`,
            letterSpacing: '0.08em',
          }}>
          STEP {step.n}
        </div>

        {/* Emoji bubble */}
        <div className="w-13 h-13 rounded-2xl flex items-center justify-center text-2xl"
          style={{
            background: `linear-gradient(135deg, ${step.from}20, ${step.to}12)`,
            border: `1.5px solid ${step.from}38`,
            width: 52, height: 52,
          }}>
          {step.emoji}
        </div>

        {/* Divider */}
        <div className="w-8 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${step.from}55, transparent)` }} />

        <div>
          <h3 className="font-sora font-bold text-[12.5px] sm:text-[13px] mb-1.5"
            style={{ color: 'hsl(226,35%,14%)' }}>
            {step.title}
          </h3>
          <p className="text-[11px] sm:text-[11.5px] leading-relaxed"
            style={{ color: 'hsl(226,20%,46%)' }}>
            {step.desc}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ─── Stats Bar ─────────────────────────────────── */
const StatsBar = ({ stats, visible }: { stats: typeof STATS; visible: boolean }) => (
  <div className="relative overflow-hidden rounded-3xl"
    style={{
      background: 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(32px) saturate(180%)',
      WebkitBackdropFilter: 'blur(32px) saturate(180%)',
      border: '1.5px solid rgba(255,255,255,0.92)',
      boxShadow: '0 8px 48px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,1)',
    }}>
    {/* Rainbow top stripe */}
    <div className="absolute top-0 left-0 right-0 h-[4px] rounded-t-3xl"
      style={{ background: 'linear-gradient(90deg, hsl(243,75%,59%), hsl(15,100%,58%), hsl(158,64%,42%), hsl(263,70%,58%))' }} />

    <div className="absolute top-5 right-6 pointer-events-none">
      <Sparkles size={24} style={{ color: 'hsla(258,78%,55%,0.15)' }} />
    </div>

    <div className="relative p-8 sm:p-10 pt-9">
      <p className="text-center text-[10.5px] font-semibold mb-8 tracking-[0.28em] uppercase"
        style={{ color: 'hsl(226,20%,55%)' }}>
        Our Numbers Speak For Themselves
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i}
            className={`relative overflow-hidden rounded-2xl p-4 text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{
              transitionDelay: `${i * 0.12}s`,
              background: 'rgba(255,255,255,0.60)',
              backdropFilter: 'blur(16px)',
              border: `1.5px solid ${s.from}28`,
              boxShadow: `0 4px 18px ${s.from}12`,
            }}>
            {/* top stripe */}
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
              style={{ background: `linear-gradient(90deg, ${s.from}, ${s.to})` }} />
            <div className="font-sora font-black text-[2.2rem] sm:text-[2.8rem] leading-none"
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
        ))}
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
    <section className="py-20 relative overflow-hidden bg-transparent">
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
