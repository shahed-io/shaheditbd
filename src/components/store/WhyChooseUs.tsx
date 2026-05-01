import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Zap, Shield, Headphones, Building2, Tag, Users, ShoppingCart, CreditCard, Mail, CheckCircle2 } from 'lucide-react';

const FEATURES = [
  {
    Icon: Zap,
    title: 'Fast Delivery',
    desc: 'Payment যাচাইয়ের পর ১–২৪ ঘণ্টার মধ্যে ইমেইলে license key পাঠানো হয়।',
    from: '258, 90%, 66%',
    to:   '199, 89%, 60%',
  },
  {
    Icon: Shield,
    title: '100% Genuine Keys',
    desc: 'সব key ১০০% original এবং Microsoft verified।',
    from: '199, 89%, 60%',
    to:   '158, 76%, 50%',
  },
  {
    Icon: Headphones,
    title: '24/7 Support',
    desc: 'WhatsApp ও Telegram-এ সার্বক্ষণিক সাপোর্ট।',
    from: '280, 85%, 65%',
    to:   '243, 80%, 62%',
  },
  {
    Icon: Building2,
    title: 'Govt. Registered',
    desc: 'DBID: 586772174 — সরকার নিবন্ধিত ব্যবসা।',
    from: '158, 76%, 50%',
    to:   '199, 89%, 60%',
  },
  {
    Icon: Tag,
    title: 'Lowest Price BD',
    desc: 'বাংলাদেশের সবচেয়ে কম দামে অরিজিনাল সফটওয়্যার।',
    from: '15, 95%, 62%',
    to:   '335, 85%, 65%',
  },
  {
    Icon: Users,
    title: '12K+ Customers',
    desc: '২০২০ সাল থেকে ১২০০০+ সন্তুষ্ট গ্রাহক সারা বিশ্বে।',
    from: '38, 95%, 58%',
    to:   '15, 95%, 62%',
  },
];

const STEPS = [
  { n: '01', Icon: ShoppingCart, title: 'Choose Product', desc: 'আমাদের collection থেকে পছন্দের software বেছে নিন।', from: '258, 90%, 66%', to: '199, 89%, 60%' },
  { n: '02', Icon: CreditCard,   title: 'Make Payment',    desc: 'BKash, Nagad বা Rocket-এ নিরাপদে payment করুন।',  from: '15, 95%, 62%',  to: '335, 85%, 65%' },
  { n: '03', Icon: Mail,         title: 'Get Delivery',    desc: '১–২৪ ঘণ্টার মধ্যে ইমেইলে license key পাঠানো হবে।', from: '199, 89%, 60%', to: '158, 76%, 50%' },
  { n: '04', Icon: CheckCircle2, title: 'Activate & Enjoy',desc: 'Product activate করুন, সমস্যায় support-এ যোগাযোগ।',from: '280, 85%, 65%', to: '243, 80%, 62%' },
];

const STATS = [
  { n: '12K+', l: 'Happy Customers',  from: '258, 90%, 66%', to: '199, 89%, 60%' },
  { n: '500+', l: 'Products',          from: '199, 89%, 60%', to: '158, 76%, 50%' },
  { n: '25K+', l: 'Orders Delivered',  from: '15, 95%, 62%',  to: '335, 85%, 65%' },
  { n: '24/7', l: 'Support Available', from: '280, 85%, 65%', to: '243, 80%, 62%' },
];

/* ─── Glass Card Wrapper ─── */
const GlassCard: React.FC<{ from: string; to: string; className?: string; children: React.ReactNode }> = ({ from, to, className = '', children }) => (
  <div
    className={`group relative rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-1 ${className}`}
    style={{
      background: 'linear-gradient(135deg, hsla(0,0%,100%,0.75), hsla(0,0%,100%,0.55))',
      backdropFilter: 'blur(28px) saturate(180%)',
      WebkitBackdropFilter: 'blur(28px) saturate(180%)',
      border: '1px solid hsla(0,0%,100%,0.6)',
      boxShadow: '0 8px 32px hsla(243,60%,40%,0.08), inset 0 1px 0 hsla(0,0%,100%,0.9)',
    }}
  >
    {/* Animated gradient border on hover */}
    <div
      className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      style={{
        padding: '1.5px',
        background: `linear-gradient(135deg, hsl(${from}), hsl(${to}))`,
        WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
      }}
    />
    {/* Inner glow blob on hover */}
    <div
      className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none"
      style={{ background: `radial-gradient(circle, hsla(${from},0.35), transparent 70%)`, filter: 'blur(24px)' }}
    />
    {children}
  </div>
);

/* ─── Section Header ─── */
const SectionHeader = ({ badge, from, to, title, subtitle }: { badge: string; from: string; to: string; title: React.ReactNode; subtitle: string; }) => (
  <div className="text-center mb-12">
    <div
      className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-bold mb-5 tracking-widest uppercase"
      style={{
        background: `linear-gradient(135deg, hsla(${from},0.12), hsla(${to},0.12))`,
        border: `1px solid hsla(${from},0.35)`,
        color: `hsl(${from})`,
        backdropFilter: 'blur(12px)',
      }}
    >
      <Sparkles size={12} />
      {badge}
    </div>
    <h2 className="font-sora font-black text-3xl sm:text-4xl md:text-5xl text-foreground tracking-tight">
      {title}
    </h2>
    <p className="mt-4 max-w-xl mx-auto text-sm sm:text-base leading-relaxed text-muted-foreground">
      {subtitle}
    </p>
  </div>
);

/* ─── Feature Card ─── */
const FeatureCard = ({ feature: f, index }: { feature: typeof FEATURES[0]; index: number }) => (
  <div
    className="rise-up"
    style={{ animationDelay: `${(index % 3) * 80}ms` }}
  >
    <GlassCard from={f.from} to={f.to} className="h-full">
      <div className="relative p-6 sm:p-7">
        {/* Icon with gradient bg */}
        <div className="relative mb-5 inline-flex">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
            style={{
              background: `linear-gradient(135deg, hsl(${f.from}), hsl(${f.to}))`,
              boxShadow: `0 8px 24px hsla(${f.from},0.4), inset 0 1px 0 hsla(0,0%,100%,0.4)`,
            }}
          >
            <f.Icon size={26} strokeWidth={2.2} className="text-white" />
          </div>
          {/* Soft glow */}
          <div
            className="absolute inset-0 rounded-2xl opacity-50 -z-10"
            style={{ background: `linear-gradient(135deg, hsl(${f.from}), hsl(${f.to}))`, filter: 'blur(18px)' }}
          />
        </div>

        <h3 className="font-sora font-bold text-[16px] mb-2 text-foreground tracking-tight">
          {f.title}
        </h3>
        <p className="text-[13.5px] leading-relaxed text-muted-foreground">
          {f.desc}
        </p>

        {/* Bottom gradient line */}
        <div
          className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full opacity-30 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `linear-gradient(90deg, transparent, hsl(${f.from}), hsl(${f.to}), transparent)` }}
        />
      </div>
    </GlassCard>
  </div>
);

/* ─── Step Card ─── */
const StepCard = ({ step, index }: { step: typeof STEPS[0]; index: number }) => (
  <div className="rise-up relative" style={{ animationDelay: `${index * 80}ms` }}>
    <GlassCard from={step.from} to={step.to} className="h-full">
      <div className="relative p-5 sm:p-6 flex flex-col items-center text-center">
        {/* Big gradient number watermark */}
        <div
          className="absolute top-3 right-4 text-5xl sm:text-6xl font-black leading-none opacity-20 select-none pointer-events-none"
          style={{
            background: `linear-gradient(135deg, hsl(${step.from}), hsl(${step.to}))`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {step.n}
        </div>

        <div className="relative mb-4 mt-1">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, hsl(${step.from}), hsl(${step.to}))`,
              boxShadow: `0 8px 24px hsla(${step.from},0.4), inset 0 1px 0 hsla(0,0%,100%,0.4)`,
            }}
          >
            <step.Icon size={24} strokeWidth={2.2} className="text-white" />
          </div>
          <div
            className="absolute inset-0 rounded-2xl opacity-50 -z-10"
            style={{ background: `linear-gradient(135deg, hsl(${step.from}), hsl(${step.to}))`, filter: 'blur(16px)' }}
          />
        </div>

        <h3 className="font-sora font-bold text-[14px] mb-1.5 text-foreground tracking-tight">
          {step.title}
        </h3>
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          {step.desc}
        </p>
      </div>
    </GlassCard>
  </div>
);

/* ─── Stats Bar ─── */
const StatsBar = ({ stats, visible }: { stats: typeof STATS; visible: boolean }) => (
  <div
    className="relative overflow-hidden rounded-3xl"
    style={{
      background: 'linear-gradient(135deg, hsla(0,0%,100%,0.78), hsla(0,0%,100%,0.55))',
      backdropFilter: 'blur(28px) saturate(180%)',
      WebkitBackdropFilter: 'blur(28px) saturate(180%)',
      border: '1px solid hsla(0,0%,100%,0.6)',
      boxShadow: '0 12px 40px hsla(243,60%,40%,0.1), inset 0 1px 0 hsla(0,0%,100%,0.9)',
    }}
  >
    {/* Floating ambient blobs */}
    <div className="absolute -top-20 -left-10 w-72 h-72 rounded-full pointer-events-none"
      style={{ background: 'radial-gradient(circle, hsla(258,90%,66%,0.18), transparent 70%)', filter: 'blur(40px)' }} />
    <div className="absolute -bottom-20 -right-10 w-72 h-72 rounded-full pointer-events-none"
      style={{ background: 'radial-gradient(circle, hsla(199,89%,60%,0.18), transparent 70%)', filter: 'blur(40px)' }} />

    <div className="relative p-8 sm:p-10">
      <p className="text-center text-[10.5px] font-bold mb-8 tracking-[0.28em] uppercase text-muted-foreground">
        Our Numbers Speak For Themselves
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i}
            className={`text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ transitionDelay: `${i * 100}ms` }}>
            <div className="w-12 h-1 rounded-full mx-auto mb-4"
              style={{ background: `linear-gradient(90deg, hsl(${s.from}), hsl(${s.to}))` }} />
            <div className="font-sora font-black text-[2.4rem] sm:text-[2.9rem] leading-none"
              style={{
                background: `linear-gradient(135deg, hsl(${s.from}), hsl(${s.to}))`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}>
              {s.n}
            </div>
            <div className="text-[11px] font-semibold mt-2.5 uppercase tracking-wider text-muted-foreground">
              {s.l}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ─── Main Component ─── */
const WhyChooseUs = () => {
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setStatsVisible(true); obs.disconnect(); }
    }, { threshold: 0.2 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Subtle gradient mesh background */}
      <div className="absolute inset-0 pointer-events-none -z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(258,90%,66%,0.08), transparent 60%)', filter: 'blur(80px)' }} />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(199,89%,60%,0.07), transparent 60%)', filter: 'blur(90px)' }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(335,85%,65%,0.06), transparent 60%)', filter: 'blur(90px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(158,76%,50%,0.05), transparent 60%)', filter: 'blur(80px)' }} />
      </div>

      <div className="container-fluid space-y-20 relative z-10" style={{ maxWidth: '1280px' }}>

        {/* ══ WHY CHOOSE US ══ */}
        <div>
          <SectionHeader
            badge="Why Us"
            from="258, 90%, 66%"
            to="199, 89%, 60%"
            title={
              <>Why{' '}
                <span style={{
                  background: 'linear-gradient(135deg, hsl(258,90%,66%), hsl(199,89%,60%))',
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                }}>Choose Us?</span>
              </>
            }
            subtitle="Bangladesh's most trusted digital software marketplace since 2020."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} feature={f} index={i} />
            ))}
          </div>
        </div>

        {/* ══ HOW TO ORDER ══ */}
        <div>
          <SectionHeader
            badge="Order Process"
            from="15, 95%, 62%"
            to="335, 85%, 65%"
            title={
              <>How to{' '}
                <span style={{
                  background: 'linear-gradient(135deg, hsl(15,95%,62%), hsl(335,85%,65%))',
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                }}>Order</span>
              </>
            }
            subtitle="চার ধাপে আপনার product পান — সহজ, দ্রুত, নিরাপদ।"
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
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
