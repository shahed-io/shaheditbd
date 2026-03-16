import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

const FEATURES = [
  { icon: '⚡', title: 'Instant Delivery',   desc: 'Payment-এর পরেই ইমেইলে license key পাঠানো হয়।',          from: 'hsl(243,75%,65%)', to: 'hsl(263,70%,62%)' },
  { icon: '🛡️', title: '100% Genuine Keys', desc: 'সব key ১০০% original এবং Microsoft verified।',            from: 'hsl(158,64%,48%)', to: 'hsl(180,70%,44%)' },
  { icon: '🎧', title: '24/7 Support',        desc: 'WhatsApp ও Telegram-এ সার্বক্ষণিক সাপোর্ট।',              from: 'hsl(263,70%,62%)', to: 'hsl(283,65%,58%)' },
  { icon: '🏛️', title: 'Govt. Registered',  desc: 'DBID: 586772174 — সরকার নিবন্ধিত ব্যবসা।',                from: 'hsl(158,64%,48%)', to: 'hsl(180,70%,44%)' },
  { icon: '💰', title: 'Lowest Price BD',    desc: 'বাংলাদেশের সবচেয়ে কম দামে অরিজিনাল সফটওয়্যার।',         from: 'hsl(15,100%,62%)',  to: 'hsl(38,100%,58%)' },
  { icon: '😊', title: '12K+ Customers',     desc: '২০২০ সাল থেকে ১২০০০+ সন্তুষ্ট গ্রাহক সারা বিশ্বে।',     from: 'hsl(38,100%,58%)',  to: 'hsl(50,100%,58%)' },
];

const STEPS = [
  { n: '01', emoji: '🛒', title: 'Choose Product',   desc: 'আমাদের collection থেকে পছন্দের software বেছে নিন।',     from: 'hsl(243,75%,65%)', to: 'hsl(263,70%,62%)' },
  { n: '02', emoji: '💳', title: 'Make Payment',      desc: 'bKash, Nagad বা Rocket-এ নিরাপদে payment করুন।',        from: 'hsl(15,100%,62%)',  to: 'hsl(38,100%,58%)' },
  { n: '03', emoji: '📧', title: 'Get Delivery',      desc: 'মিনিটের মধ্যে ইমেইলে license key পাঠানো হবে।',          from: 'hsl(158,64%,48%)', to: 'hsl(180,70%,44%)' },
  { n: '04', emoji: '✅', title: 'Activate & Enjoy', desc: 'Product activate করুন, সমস্যায় support-এ যোগাযোগ।',    from: 'hsl(263,70%,62%)', to: 'hsl(283,65%,58%)' },
];

const STATS = [
  { n: '12K+', l: 'Happy Customers' },
  { n: '500+', l: 'Products' },
  { n: '25K+', l: 'Orders Delivered' },
  { n: '24/7', l: 'Support Available' },
];

/* ─── Gradient Border Card wrapper ──────────────────────────── */
interface GradBorderProps {
  from: string;
  to: string;
  borderWidth?: number;
  radius?: number;
  children: React.ReactNode;
  className?: string;
  hoverGlow?: boolean;
  style?: React.CSSProperties;
}
const GradBorderCard = ({
  from, to, borderWidth = 1.5, radius = 18, children, className = '', hoverGlow = true, style,
}: GradBorderProps) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      className={`relative ${className}`}
      style={{
        background: hov
          ? `linear-gradient(135deg, ${from}, ${to})`
          : `linear-gradient(135deg, ${from}60, ${to}50)`,
        borderRadius: radius,
        padding: borderWidth,
        transition: 'all 0.35s cubic-bezier(0.23,1,0.32,1)',
        boxShadow: hov && hoverGlow
          ? `0 16px 48px ${from}28, 0 4px 20px ${from}18`
          : `0 2px 16px ${from}14`,
        ...style,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Inner glass surface */}
      <div
        style={{
          background: hov ? 'hsla(0,0%,100%,0.72)' : 'hsla(0,0%,100%,0.58)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderRadius: radius - borderWidth,
          height: '100%',
          width: '100%',
          transition: 'background 0.35s',
        }}
      >
        {children}
      </div>
    </div>
  );
};

/* ─── Step Card ─────────────────────────────────────────────── */
const StepCard = ({ step }: { step: typeof STEPS[number] }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="relative z-10 pt-5"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Number badge */}
      <div className="absolute -top-0 left-1/2 -translate-x-1/2 z-20">
        <span
          className="text-[11px] font-bold px-3.5 py-1.5 rounded-full text-white shadow-lg select-none"
          style={{
            background: `linear-gradient(135deg, ${step.from}, ${step.to})`,
            boxShadow: `0 4px 14px ${step.from}66`,
          }}
        >
          {step.n}
        </span>
      </div>

      {/* Card */}
      <div
        className="rounded-[22px] overflow-hidden transition-all duration-400"
        style={{
          background: `linear-gradient(145deg, ${step.from}cc, ${step.to}bb)`,
          boxShadow: hov
            ? `0 20px 56px ${step.from}44, 0 4px 20px ${step.from}28`
            : `0 4px 24px ${step.from}22`,
          transform: hov ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
          transition: 'all 0.35s cubic-bezier(0.23,1,0.32,1)',
        }}
      >
        {/* Glassmorphism overlay */}
        <div
          className="p-6 pt-8 text-center flex flex-col items-center gap-4 rounded-[22px]"
          style={{
            background: 'linear-gradient(160deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.10) 100%)',
            backdropFilter: 'blur(12px) saturate(160%)',
            WebkitBackdropFilter: 'blur(12px) saturate(160%)',
            borderTop: '1px solid rgba(255,255,255,0.55)',
            borderLeft: '1px solid rgba(255,255,255,0.35)',
          }}
        >
          {/* Emoji icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{
              background: 'rgba(255,255,255,0.30)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.55)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
            }}
          >
            {step.emoji}
          </div>
          <div>
            <h3 className="font-sora font-bold text-[14px] text-white mb-2 drop-shadow-sm">{step.title}</h3>
            <p className="text-[12px] text-white/80 leading-relaxed">{step.desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

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
    <section className="py-24 relative overflow-hidden bg-transparent">
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-0 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(243,75%,62%,0.05), transparent)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-1/3 right-0 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(15,100%,60%,0.04), transparent)', filter: 'blur(80px)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 relative z-10">

        {/* ── Why Choose Us ── */}
        <div>
          <div className="text-center mb-14">
            <span className="section-label">Why Us</span>
            <h2 className="section-heading text-3xl sm:text-4xl mt-4 text-foreground">
              Why{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(243,75%,65%), hsl(263,70%,62%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Choose Us?
              </span>
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-[14px] leading-relaxed">
              Bangladesh's most trusted digital software marketplace since 2020.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <GradBorderCard key={i} from={f.from} to={f.to} borderWidth={1.5} radius={20}>
                <div className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${f.from}18, ${f.to}12)`, border: `1px solid ${f.from}35` }}>
                    {f.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-sora font-bold text-[13.5px] text-foreground flex items-center gap-2">
                      {f.title}
                      <CheckCircle2 size={12} style={{ color: f.from }} className="flex-shrink-0" />
                    </h3>
                    <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </GradBorderCard>
            ))}
          </div>
        </div>

        {/* ── How to Order ── */}
        <div>
          <div className="text-center mb-14">
            <span className="section-label">Order Process</span>
            <h2 className="section-heading text-3xl sm:text-4xl mt-4 text-foreground">
              How to{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(15,100%,62%), hsl(38,100%,58%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Order
              </span>
            </h2>
            <p className="text-muted-foreground mt-3 text-[14px]">চার ধাপে আপনার product পান — সহজ, দ্রুত, নিরাপদ।</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 relative">
            {/* Connecting line desktop */}
            <div className="hidden lg:block absolute top-[3.8rem] left-[calc(12.5%+2rem)] right-[calc(12.5%+2rem)] h-px z-0"
              style={{ background: 'linear-gradient(90deg, hsl(243,75%,65%), hsl(15,100%,62%), hsl(158,64%,48%), hsl(263,70%,62%))', opacity: 0.30 }} />

            {STEPS.map((step, i) => (
              <StepCard key={i} step={step} />
            ))}
          </div>
        </div>

        {/* ── Stats Bar — Gradient Border ── */}
        <div ref={statsRef} className="relative">
          {/* Outer gradient border wrapper */}
          <div style={{
            background: 'linear-gradient(135deg, hsla(243,75%,62%,0.55), hsla(263,70%,58%,0.35), hsla(15,100%,60%,0.35))',
            borderRadius: 28,
            padding: 1.5,
            boxShadow: '0 8px 48px hsla(243,75%,62%,0.12)',
          }}>
            <div style={{
              background: 'hsla(0,0%,100%,0.55)',
              backdropFilter: 'blur(28px) saturate(200%)',
              WebkitBackdropFilter: 'blur(28px) saturate(200%)',
              borderRadius: 27,
              position: 'relative',
              overflow: 'hidden',
            }}
              className="p-10 lg:p-14"
            >
              {/* Decorative sparkle */}
              <div className="absolute top-5 right-6 pointer-events-none">
                <Sparkles size={30} style={{ color: 'hsla(258,78%,55%,0.22)' }} />
              </div>
              {/* Inner top highlight */}
              <div className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent, hsla(0,0%,100%,0.9), transparent)' }} />

              <p className="text-center text-muted-foreground/50 text-[11px] font-semibold mb-10 tracking-[0.28em] uppercase font-fira">
                Our Numbers Speak For Themselves
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {STATS.map((s, i) => (
                  <div key={i}
                    className={`transition-all duration-700 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    style={{ transitionDelay: `${i * 0.12}s` }}>
                    <div className="font-sora font-black text-[3rem] sm:text-[3.5rem] leading-none"
                      style={{
                        background: 'linear-gradient(135deg, hsl(243,75%,55%), hsl(263,70%,58%))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}>
                      {s.n}
                    </div>
                    <div className="text-muted-foreground text-[11px] font-semibold mt-2.5 uppercase tracking-wider">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default WhyChooseUs;
