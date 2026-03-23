import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Sparkles, Zap, Shield, Headphones, Building2, Tag, Users } from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';

const FEATURES = [
  {
    icon: '⚡', lucide: Zap,
    title: 'Fast Delivery',
    desc: 'Payment যাচাইয়ের পর ১–২৪ ঘণ্টার মধ্যে ইমেইলে license key পাঠানো হয়।',
    accent: 'hsl(243,75%,59%)',
  },
  {
    icon: '🛡️', lucide: Shield,
    title: '100% Genuine Keys',
    desc: 'সব key ১০০% original এবং Microsoft verified।',
    accent: 'hsl(158,64%,42%)',
  },
  {
    icon: '🎧', lucide: Headphones,
    title: '24/7 Support',
    desc: 'WhatsApp ও Telegram-এ সার্বক্ষণিক সাপোর্ট।',
    accent: 'hsl(263,70%,58%)',
  },
  {
    icon: '🏛️', lucide: Building2,
    title: 'Govt. Registered',
    desc: 'DBID: 586772174 — সরকার নিবন্ধিত ব্যবসা।',
    accent: 'hsl(158,64%,42%)',
  },
  {
    icon: '💰', lucide: Tag,
    title: 'Lowest Price BD',
    desc: 'বাংলাদেশের সবচেয়ে কম দামে অরিজিনাল সফটওয়্যার।',
    accent: 'hsl(15,100%,58%)',
  },
  {
    icon: '😊', lucide: Users,
    title: '12K+ Customers',
    desc: '২০২০ সাল থেকে ১২০০০+ সন্তুষ্ট গ্রাহক সারা বিশ্বে।',
    accent: 'hsl(38,100%,50%)',
  },
];

const STEPS = [
  { n: '01', emoji: '🛒', title: 'Choose Product',   desc: 'আমাদের collection থেকে পছন্দের software বেছে নিন।',  accent: 'hsl(243,75%,59%)' },
  { n: '02', emoji: '💳', title: 'Make Payment',      desc: 'bKash, Nagad বা Rocket-এ নিরাপদে payment করুন।',     accent: 'hsl(15,100%,58%)'  },
  { n: '03', emoji: '📧', title: 'Get Delivery',      desc: '১–২৪ ঘণ্টার মধ্যে ইমেইলে license key পাঠানো হবে।',  accent: 'hsl(158,64%,42%)' },
  { n: '04', emoji: '✅', title: 'Activate & Enjoy', desc: 'Product activate করুন, সমস্যায় support-এ যোগাযোগ।', accent: 'hsl(263,70%,58%)' },
];

const STATS = [
  { n: '12K+', l: 'Happy Customers',  accent: 'hsl(243,75%,59%)' },
  { n: '500+', l: 'Products',          accent: 'hsl(158,64%,42%)' },
  { n: '25K+', l: 'Orders Delivered',  accent: 'hsl(15,100%,58%)'  },
  { n: '24/7', l: 'Support Available', accent: 'hsl(263,70%,58%)' },
];

/* ─── Section Header ─────────────────────────── */
const SectionHeader = ({ badge, badgeColor, title, subtitle }: {
  badge: string; badgeColor: string; title: React.ReactNode; subtitle: string;
}) => (
  <div className="text-center mb-10">
    <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full text-[11px] font-bold mb-5 tracking-widest uppercase border"
      style={{ color: badgeColor, borderColor: `${badgeColor}40`, background: `${badgeColor}10` }}>
      {badge}
    </div>
    <h2 className="font-sora font-black text-3xl sm:text-4xl text-foreground">
      {title}
    </h2>
    <p className="mt-3 max-w-lg mx-auto text-sm leading-relaxed text-muted-foreground">
      {subtitle}
    </p>
  </div>
);

/* ─── Feature Card ─────────────────────────────── */
const FeatureCard = ({ feature: f, index }: { feature: typeof FEATURES[0]; index: number }) => {
  const [hov, setHov] = useState(false);
  const { ref, visible } = useReveal({ threshold: 0.1 });
  const delay = (index % 3) * 0.1;
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="relative rounded-2xl overflow-hidden cursor-default transition-all duration-300"
      style={{
        background: '#ffffff',
        border: `1.5px solid ${hov ? f.accent + '55' : 'hsl(220,13%,91%)'}`,
        boxShadow: hov
          ? `0 8px 32px ${f.accent}20, 0 2px 8px rgba(0,0,0,0.06)`
          : '0 2px 12px rgba(0,0,0,0.05)',
        transform: hov
          ? 'translateY(-3px)'
          : visible ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.97)',
        opacity: visible ? 1 : 0,
        filter: visible ? 'blur(0px)' : 'blur(3px)',
        transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s, filter 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s, box-shadow 0.3s, border-color 0.3s`,
        willChange: 'transform, opacity, filter',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div className="pl-5 pr-5 py-5">
        {/* Icon + title */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${f.accent}15`, border: `1.5px solid ${f.accent}30` }}>
            {f.icon}
          </div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-sora font-bold text-[14px] leading-tight text-foreground">
              {f.title}
            </h3>
            <CheckCircle2 size={13} style={{ color: f.accent }} className="flex-shrink-0" />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mb-3" style={{ background: `${f.accent}25` }} />

        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {f.desc}
        </p>
      </div>
    </div>
  );
};

/* ─── Step Card ─────────────────────────────────── */
const StepCard = ({ step, index }: { step: typeof STEPS[0]; index: number }) => {
  const [hov, setHov] = useState(false);
  const { ref, visible } = useReveal({ threshold: 0.1 });
  const delay = index * 0.1;
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="relative rounded-2xl overflow-hidden cursor-default flex flex-col items-center text-center"
      style={{
        background: '#ffffff',
        border: `1.5px solid ${hov ? step.accent + '55' : 'hsl(220,13%,91%)'}`,
        boxShadow: hov
          ? `0 8px 32px ${step.accent}20, 0 2px 8px rgba(0,0,0,0.06)`
          : '0 2px 12px rgba(0,0,0,0.05)',
        opacity: visible ? 1 : 0,
        transform: hov
          ? 'translateY(-3px) scale(1)'
          : visible ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.96)',
        filter: visible ? 'blur(0px)' : 'blur(4px)',
        transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s, filter 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s, box-shadow 0.3s, border-color 0.3s`,
        willChange: 'transform, opacity, filter',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >

      <div className="px-5 pt-7 pb-6 flex flex-col items-center gap-3 w-full">
        {/* Step pill */}
        <div className="px-3 py-1 rounded-full text-[10px] font-black text-white tracking-widest"
          style={{ background: step.accent, boxShadow: `0 3px 10px ${step.accent}50` }}>
          STEP {step.n}
        </div>

        {/* Emoji bubble */}
        <div className="w-13 h-13 rounded-2xl flex items-center justify-center text-2xl"
          style={{
            background: `${step.accent}12`,
            border: `1.5px solid ${step.accent}30`,
            width: 52, height: 52,
          }}>
          {step.emoji}
        </div>

        <div className="w-8 h-px" style={{ background: `${step.accent}40` }} />

        <div>
          <h3 className="font-sora font-bold text-[13.5px] mb-1.5 text-foreground">
            {step.title}
          </h3>
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            {step.desc}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ─── Stats Bar ─────────────────────────────────── */
const StatsBar = ({ stats, visible }: { stats: typeof STATS; visible: boolean }) => (
  <div className="relative overflow-hidden rounded-2xl"
    style={{
      background: '#ffffff',
      border: '1.5px solid hsl(220,13%,90%)',
      boxShadow: '0 4px 32px rgba(0,0,0,0.07)',
    }}>

    <div className="absolute top-5 right-6 pointer-events-none">
      <Sparkles size={20} style={{ color: 'hsla(258,78%,55%,0.18)' }} />
    </div>

    <div className="relative p-8 sm:p-10 pt-9">
      <p className="text-center text-[10.5px] font-bold mb-8 tracking-[0.28em] uppercase text-muted-foreground">
        Our Numbers Speak For Themselves
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-[hsl(220,13%,92%)]">
        {stats.map((s, i) => (
          <div key={i}
            className={`px-6 py-3 text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: `${i * 0.12}s` }}>
            {/* Colored top line */}
            <div className="w-16 h-[3px] rounded-full mx-auto mb-5"
              style={{ background: s.accent }} />
            <div className="font-sora font-black text-[2.6rem] sm:text-[3rem] leading-none"
              style={{ color: s.accent }}>
              {s.n}
            </div>
            <div className="text-[11px] font-semibold mt-2 uppercase tracking-wider"
              style={{ color: 'hsl(258,78%,55%)' }}>
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
          style={{ background: 'radial-gradient(circle, hsla(243,75%,62%,0.05), transparent)', filter: 'blur(90px)' }} />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(15,100%,60%,0.04), transparent)', filter: 'blur(90px)' }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-20 relative z-10">

        {/* ══ WHY CHOOSE US ══ */}
        <div>
          <SectionHeader
            badge="✦ Why Us"
            badgeColor="hsl(243,75%,58%)"
            title={
              <>Why <span style={{ color: 'hsl(243,75%,59%)' }}>Choose Us?</span></>
            }
            subtitle="Bangladesh's most trusted digital software marketplace since 2020."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <>How to <span style={{ color: 'hsl(15,100%,55%)' }}>Order</span></>
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
    </section>
  );
};

export default WhyChooseUs;
