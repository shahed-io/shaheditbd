import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Sparkles, Zap, Shield, Headphones, Building2, Tag, Users } from 'lucide-react';

const FEATURES = [
  {
    icon: '⚡', lucide: Zap,
    title: 'Instant Delivery',
    desc: 'Payment-এর পরেই ইমেইলে license key পাঠানো হয়।',
    from: 'hsl(243,75%,65%)', to: 'hsl(263,70%,62%)',
    accentBg: 'hsla(243,75%,65%,0.10)',
    borderTop: 'hsl(243,75%,65%)',
  },
  {
    icon: '🛡️', lucide: Shield,
    title: '100% Genuine Keys',
    desc: 'সব key ১০০% original এবং Microsoft verified।',
    from: 'hsl(158,64%,48%)', to: 'hsl(180,70%,44%)',
    accentBg: 'hsla(158,64%,48%,0.10)',
    borderTop: 'hsl(158,64%,48%)',
  },
  {
    icon: '🎧', lucide: Headphones,
    title: '24/7 Support',
    desc: 'WhatsApp ও Telegram-এ সার্বক্ষণিক সাপোর্ট।',
    from: 'hsl(263,70%,62%)', to: 'hsl(283,65%,58%)',
    accentBg: 'hsla(263,70%,62%,0.10)',
    borderTop: 'hsl(263,70%,62%)',
  },
  {
    icon: '🏛️', lucide: Building2,
    title: 'Govt. Registered',
    desc: 'DBID: 586772174 — সরকার নিবন্ধিত ব্যবসা।',
    from: 'hsl(158,64%,48%)', to: 'hsl(180,70%,44%)',
    accentBg: 'hsla(158,64%,48%,0.10)',
    borderTop: 'hsl(158,64%,48%)',
  },
  {
    icon: '💰', lucide: Tag,
    title: 'Lowest Price BD',
    desc: 'বাংলাদেশের সবচেয়ে কম দামে অরিজিনাল সফটওয়্যার।',
    from: 'hsl(15,100%,62%)', to: 'hsl(38,100%,58%)',
    accentBg: 'hsla(15,100%,62%,0.10)',
    borderTop: 'hsl(15,100%,62%)',
  },
  {
    icon: '😊', lucide: Users,
    title: '12K+ Customers',
    desc: '২০২০ সাল থেকে ১২০০০+ সন্তুষ্ট গ্রাহক সারা বিশ্বে।',
    from: 'hsl(38,100%,58%)', to: 'hsl(50,100%,58%)',
    accentBg: 'hsla(38,100%,58%,0.10)',
    borderTop: 'hsl(38,100%,58%)',
  },
];

const STEPS = [
  { n: '01', emoji: '🛒', title: 'Choose Product',   desc: 'আমাদের collection থেকে পছন্দের software বেছে নিন।',  from: 'hsl(243,75%,65%)', to: 'hsl(263,70%,62%)' },
  { n: '02', emoji: '💳', title: 'Make Payment',      desc: 'bKash, Nagad বা Rocket-এ নিরাপদে payment করুন।',     from: 'hsl(15,100%,62%)',  to: 'hsl(38,100%,58%)' },
  { n: '03', emoji: '📧', title: 'Get Delivery',      desc: 'মিনিটের মধ্যে ইমেইলে license key পাঠানো হবে।',       from: 'hsl(158,64%,48%)', to: 'hsl(180,70%,44%)' },
  { n: '04', emoji: '✅', title: 'Activate & Enjoy', desc: 'Product activate করুন, সমস্যায় support-এ যোগাযোগ।', from: 'hsl(263,70%,62%)', to: 'hsl(283,65%,58%)' },
];

const STATS = [
  { n: '12K+', l: 'Happy Customers', from: 'hsl(243,75%,65%)', to: 'hsl(263,70%,62%)' },
  { n: '500+', l: 'Products',        from: 'hsl(158,64%,48%)', to: 'hsl(180,70%,44%)' },
  { n: '25K+', l: 'Orders Delivered',from: 'hsl(15,100%,62%)', to: 'hsl(38,100%,58%)' },
  { n: '24/7', l: 'Support Available',from:'hsl(263,70%,62%)', to: 'hsl(283,65%,58%)' },
];

/* ─── Section Header ─────────────────────────────────── */
const SectionHeader = ({ badge, badgeColor, title, accent, subtitle }: {
  badge: string; badgeColor: string; title: React.ReactNode; accent: string; subtitle: string;
}) => (
  <div className="text-center mb-10">
    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-bold mb-5 tracking-widest uppercase"
      style={{
        background: 'rgba(255,255,255,0.90)',
        backdropFilter: 'blur(12px)',
        border: `1.5px solid ${badgeColor}50`,
        color: badgeColor,
        boxShadow: `0 4px 20px ${badgeColor}25`,
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
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(243,75%,62%,0.07), transparent)', filter: 'blur(100px)' }} />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(15,100%,60%,0.05), transparent)', filter: 'blur(100px)' }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-20 relative z-10">

        {/* ════════════════ WHY CHOOSE US ════════════════ */}
        <div>
          <SectionHeader
            badge="✦ Why Us"
            badgeColor="hsl(243,75%,58%)"
            title={<>Why <span style={{ background: 'linear-gradient(135deg, hsl(243,75%,65%), hsl(263,70%,62%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Choose Us?</span></>}
            accent="hsl(243,75%,65%)"
            subtitle="Bangladesh's most trusted digital software marketplace since 2020."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} feature={f} />
            ))}
          </div>
        </div>

        {/* ════════════════ HOW TO ORDER ════════════════ */}
        <div>
          <SectionHeader
            badge="📦 Order Process"
            badgeColor="hsl(15,100%,55%)"
            title={<>How to <span style={{ background: 'linear-gradient(135deg, hsl(15,100%,62%), hsl(38,100%,58%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Order</span></>}
            accent="hsl(15,100%,62%)"
            subtitle="চার ধাপে আপনার product পান — সহজ, দ্রুত, নিরাপদ।"
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((step, i) => (
              <StepCard key={i} step={step} index={i} />
            ))}
          </div>
        </div>

        {/* ════════════════ STATS ════════════════ */}
        <div ref={statsRef}>
          <StatsBar stats={STATS} visible={statsVisible} />
        </div>

      </div>
    </section>
  );
};

/* ─── Feature Card ─────────────────────────────────── */
const FeatureCard = ({ feature: f }: { feature: typeof FEATURES[0] }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="relative overflow-hidden rounded-[22px] cursor-default"
      style={{
        background: hov
          ? `linear-gradient(160deg, rgba(255,255,255,0.97) 0%, ${f.from}0a 100%)`
          : `linear-gradient(160deg, rgba(255,255,255,0.93) 0%, ${f.from}06 100%)`,
        backdropFilter: 'blur(32px) saturate(200%)',
        WebkitBackdropFilter: 'blur(32px) saturate(200%)',
        border: `1.5px solid ${hov ? f.from + '55' : f.from + '30'}`,
        boxShadow: hov
          ? `0 20px 60px ${f.from}30, 0 4px 20px ${f.from}18, 0 1px 0 rgba(255,255,255,1) inset`
          : `0 4px 28px ${f.from}18, 0 1px 0 rgba(255,255,255,1) inset`,
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.35s cubic-bezier(0.23,1,0.32,1)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Left stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: `linear-gradient(180deg, ${f.from}, ${f.to})` }} />
      {/* Right stripe */}
      <div className="absolute right-0 top-0 bottom-0 w-[3px]"
        style={{ background: `linear-gradient(180deg, ${f.to}, ${f.from})` }} />
      {/* Top stripe */}
      <div className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${f.from}, ${f.to})` }} />
      {/* Bottom stripe */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${f.to}, ${f.from})` }} />
      {/* Corner glow */}
      <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${f.from}14, transparent 70%)` }} />
      <div className="absolute bottom-0 left-0 w-20 h-20 pointer-events-none"
        style={{ background: `radial-gradient(circle at bottom left, ${f.to}10, transparent 70%)` }} />

      <div className="p-5 sm:p-6 pl-6">
        {/* Icon + title row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${f.from}22, ${f.to}14)`,
              border: `1.5px solid ${f.from}45`,
              boxShadow: `0 4px 14px ${f.from}22`,
            }}>
            {f.icon}
          </div>
          <h3 className="font-sora font-bold text-[13.5px] leading-tight flex items-center gap-1.5"
            style={{ color: 'hsl(226,35%,16%)' }}>
            {f.title}
            <CheckCircle2 size={13} style={{ color: f.from }} className="flex-shrink-0" />
          </h3>
        </div>
        {/* Divider */}
        <div className="h-px mb-3" style={{ background: `linear-gradient(90deg, ${f.from}30, transparent)` }} />
        <p className="text-[12.5px] leading-relaxed" style={{ color: 'hsl(226,20%,44%)' }}>
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
      className="relative overflow-hidden rounded-[22px] cursor-default"
      style={{
        background: hov
          ? `linear-gradient(160deg, rgba(255,255,255,0.97) 0%, ${step.from}0a 100%)`
          : `linear-gradient(160deg, rgba(255,255,255,0.93) 0%, ${step.from}06 100%)`,
        backdropFilter: 'blur(32px) saturate(200%)',
        WebkitBackdropFilter: 'blur(32px) saturate(200%)',
        border: `1.5px solid ${hov ? step.from + '55' : step.from + '30'}`,
        boxShadow: hov
          ? `0 20px 60px ${step.from}30, 0 4px 20px ${step.from}18, 0 1px 0 rgba(255,255,255,1) inset`
          : `0 4px 28px ${step.from}18, 0 1px 0 rgba(255,255,255,1) inset`,
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.35s cubic-bezier(0.23,1,0.32,1)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Left stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: `linear-gradient(180deg, ${step.from}, ${step.to})` }} />
      {/* Right stripe */}
      <div className="absolute right-0 top-0 bottom-0 w-[3px]"
        style={{ background: `linear-gradient(180deg, ${step.to}, ${step.from})` }} />
      {/* Top stripe */}
      <div className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${step.from}, ${step.to})` }} />
      {/* Bottom stripe */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${step.to}, ${step.from})` }} />
      {/* Corner glow */}
      <div className="absolute bottom-0 right-0 w-20 h-20 pointer-events-none"
        style={{ background: `radial-gradient(circle at bottom right, ${step.from}12, transparent 70%)` }} />
      <div className="absolute top-0 left-0 w-20 h-20 pointer-events-none"
        style={{ background: `radial-gradient(circle at top left, ${step.to}10, transparent 70%)` }} />

      <div className="px-4 py-5 text-center flex flex-col items-center gap-3">
        {/* Step number pill */}
        <div className="px-3 py-1 rounded-full text-[10px] font-fira font-black text-white"
          style={{
            background: `linear-gradient(135deg, ${step.from}, ${step.to})`,
            boxShadow: `0 4px 14px ${step.from}55`,
          }}>
          STEP {step.n}
        </div>

        {/* Emoji bubble */}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl"
          style={{
            background: `linear-gradient(135deg, ${step.from}22, ${step.to}15)`,
            border: `1.5px solid ${step.from}45`,
            boxShadow: `0 4px 16px ${step.from}22`,
          }}>
          {step.emoji}
        </div>

        {/* Divider */}
        <div className="w-8 h-px" style={{ background: `linear-gradient(90deg, transparent, ${step.from}60, transparent)` }} />

        <div>
          <h3 className="font-sora font-bold text-[12.5px] sm:text-[13px] mb-2"
            style={{ color: 'hsl(226,35%,16%)' }}>
            {step.title}
          </h3>
          <p className="text-[11px] sm:text-[11.5px] leading-relaxed"
            style={{ color: 'hsl(226,20%,44%)' }}>
            {step.desc}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ─── Stats Bar ─────────────────────────────────── */
const StatsBar = ({ stats, visible }: { stats: typeof STATS; visible: boolean }) => (
  <div className="relative overflow-hidden rounded-[28px]"
    style={{
      background: 'linear-gradient(155deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.82) 100%)',
      backdropFilter: 'blur(40px) saturate(200%)',
      WebkitBackdropFilter: 'blur(40px) saturate(200%)',
      border: '1.5px solid hsla(243,75%,65%,0.25)',
      boxShadow: '0 8px 56px hsla(243,75%,62%,0.12), 0 1px 0 rgba(255,255,255,1) inset',
    }}>
    {/* Top rainbow stripe */}
    <div className="absolute top-0 left-0 right-0 h-[3px]"
      style={{ background: 'linear-gradient(90deg, hsl(243,75%,65%), hsl(15,100%,62%), hsl(158,64%,48%), hsl(263,70%,62%))' }} />
    <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
      style={{ background: 'radial-gradient(circle at top right, hsla(243,75%,65%,0.07), transparent 70%)' }} />
    <div className="absolute bottom-0 left-0 w-56 h-56 pointer-events-none"
      style={{ background: 'radial-gradient(circle at bottom left, hsla(15,100%,62%,0.05), transparent 70%)' }} />

    <div className="absolute top-5 right-6 pointer-events-none">
      <Sparkles size={26} style={{ color: 'hsla(258,78%,55%,0.18)' }} />
    </div>

    <div className="relative p-8 sm:p-12 pt-10">
      <p className="text-center text-[10.5px] font-semibold mb-10 tracking-[0.30em] uppercase font-fira"
        style={{ color: 'hsl(226,20%,55%)' }}>
        Our Numbers Speak For Themselves
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-8">
        {stats.map((s, i) => (
          <div key={i}
            className={`relative overflow-hidden rounded-2xl p-4 text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{
              transitionDelay: `${i * 0.12}s`,
              background: `linear-gradient(160deg, ${s.from}0d, ${s.to}07)`,
              border: `1.5px solid ${s.from}28`,
              boxShadow: `0 4px 20px ${s.from}12`,
            }}>
            {/* Tiny top stripe per stat */}
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, ${s.from}, ${s.to})` }} />
            <div className="font-sora font-black text-[2.4rem] sm:text-[3rem] leading-none"
              style={{
                background: `linear-gradient(135deg, ${s.from}, ${s.to})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
              {s.n}
            </div>
            <div className="text-[11px] font-semibold mt-2 uppercase tracking-wider"
              style={{ color: 'hsl(226,20%,50%)' }}>
              {s.l}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default WhyChooseUs;
