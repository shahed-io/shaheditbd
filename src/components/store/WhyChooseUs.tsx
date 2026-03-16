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

/* ─── Glassmorphism Card ─────────────────────────────────── */
interface GlassCardProps {
  from: string;
  to: string;
  children: React.ReactNode;
  className?: string;
}

const GlassCard = ({ from, to, children, className = '' }: GlassCardProps) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: hov
          ? 'linear-gradient(155deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.90) 100%)'
          : 'linear-gradient(155deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.82) 100%)',
        backdropFilter: 'blur(32px) saturate(200%)',
        WebkitBackdropFilter: 'blur(32px) saturate(200%)',
        borderRadius: 20,
        border: hov
          ? `1.5px solid ${from}70`
          : `1.5px solid ${from}45`,
        boxShadow: hov
          ? `0 20px 60px ${from}35, 0 6px 24px ${from}22, 0 1px 0 rgba(255,255,255,1) inset`
          : `0 6px 32px ${from}20, 0 2px 12px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,1) inset`,
        transition: 'all 0.35s cubic-bezier(0.23,1,0.32,1)',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Top shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${from}80 50%, transparent)` }} />
      {/* Bottom tint */}
      <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
        style={{ background: `linear-gradient(to top, ${from}08, transparent)` }} />
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${from}12, transparent 70%)` }} />
      {children}
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
          style={{ background: 'radial-gradient(circle, hsla(243,75%,62%,0.06), transparent)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-1/3 right-0 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(15,100%,60%,0.05), transparent)', filter: 'blur(80px)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 relative z-10">

        {/* ── Why Choose Us ── */}
        <div className="relative rounded-3xl overflow-hidden p-6 sm:p-10"
          style={{
            background: 'linear-gradient(155deg, rgba(255,255,255,0.70) 0%, rgba(255,255,255,0.48) 100%)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1.5px solid hsla(243,75%,65%,0.22)',
            boxShadow: '0 8px 48px hsla(243,75%,62%,0.10), 0 1px 0 rgba(255,255,255,0.95) inset',
          }}>
          {/* Section top shimmer */}
          <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9) 50%, transparent)' }} />
          {/* Corner glow */}
          <div className="absolute top-0 left-0 w-48 h-48 pointer-events-none"
            style={{ background: 'radial-gradient(circle at top left, hsla(243,75%,65%,0.09), transparent 70%)' }} />

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold mb-5 tracking-widest uppercase"
              style={{
                background: 'rgba(255,255,255,0.85)',
                border: '1px solid hsla(243,75%,65%,0.35)',
                color: 'hsl(243,75%,50%)',
                boxShadow: '0 4px 16px hsla(243,75%,65%,0.18)',
              }}>
              <Sparkles size={12} /> Why Us
            </div>
            <h2 className="section-heading text-3xl sm:text-4xl"
              style={{ color: 'hsl(226,35%,14%)' }}>
              Why{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(243,75%,65%), hsl(263,70%,62%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Choose Us?
              </span>
            </h2>
            <p className="mt-3 max-w-lg mx-auto text-[14px] leading-relaxed"
              style={{ color: 'hsl(226,20%,45%)' }}>
              Bangladesh's most trusted digital software marketplace since 2020.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <GlassCard key={i} from={f.from} to={f.to}>
                <div className="p-5 sm:p-6 flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${f.from}25, ${f.to}18)`,
                      border: `1.5px solid ${f.from}50`,
                      boxShadow: `0 4px 14px ${f.from}25`,
                    }}>
                    {f.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-sora font-bold text-[13.5px] flex items-center gap-1.5"
                      style={{ color: 'hsl(226,35%,16%)' }}>
                      {f.title}
                      <CheckCircle2 size={12} style={{ color: f.from }} className="flex-shrink-0" />
                    </h3>
                    <p className="text-[12px] mt-1.5 leading-relaxed"
                      style={{ color: 'hsl(226,20%,44%)' }}>{f.desc}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* ── How to Order ── */}
        <div className="relative rounded-3xl overflow-hidden p-6 sm:p-10"
          style={{
            background: 'linear-gradient(155deg, rgba(255,255,255,0.70) 0%, rgba(255,255,255,0.48) 100%)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1.5px solid hsla(15,100%,62%,0.20)',
            boxShadow: '0 8px 48px hsla(15,100%,62%,0.08), 0 1px 0 rgba(255,255,255,0.95) inset',
          }}>
          {/* Top shimmer */}
          <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9) 50%, transparent)' }} />
          {/* Corner glow */}
          <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
            style={{ background: 'radial-gradient(circle at top right, hsla(15,100%,62%,0.08), transparent 70%)' }} />

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold mb-5 tracking-widest uppercase"
              style={{
                background: 'rgba(255,255,255,0.85)',
                border: '1px solid hsla(15,100%,62%,0.35)',
                color: 'hsl(15,100%,48%)',
                boxShadow: '0 4px 16px hsla(15,100%,62%,0.18)',
              }}>
              Order Process
            </div>
            <h2 className="section-heading text-3xl sm:text-4xl"
              style={{ color: 'hsl(226,35%,14%)' }}>
              How to{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(15,100%,62%), hsl(38,100%,58%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Order
              </span>
            </h2>
            <p className="mt-3 text-[14px]" style={{ color: 'hsl(226,20%,45%)' }}>
              চার ধাপে আপনার product পান — সহজ, দ্রুত, নিরাপদ।
            </p>
          </div>

          {/* Steps grid — 2-col on mobile, 4-col on lg */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden lg:block absolute top-[3.2rem] left-[calc(12.5%+1.5rem)] right-[calc(12.5%+1.5rem)] h-px z-0"
              style={{ background: 'linear-gradient(90deg, hsl(243,75%,65%), hsl(15,100%,62%), hsl(158,64%,48%), hsl(263,70%,62%))', opacity: 0.25 }} />

            {STEPS.map((step, i) => (
              <div key={i} className="relative z-10 pt-5">
                {/* Step badge */}
                <div className="absolute -top-0 left-1/2 -translate-x-1/2 z-20">
                  <span className="text-[11px] font-fira font-bold px-3.5 py-1.5 rounded-full text-white"
                    style={{
                      background: `linear-gradient(135deg, ${step.from}, ${step.to})`,
                      boxShadow: `0 4px 14px ${step.from}60`,
                    }}>
                    {step.n}
                  </span>
                </div>

                <GlassCard from={step.from} to={step.to} className="w-full h-full">
                  <div className="px-3 sm:px-5 pt-8 pb-5 text-center flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl"
                      style={{
                        background: `linear-gradient(135deg, ${step.from}25, ${step.to}18)`,
                        border: `1.5px solid ${step.from}50`,
                        boxShadow: `0 4px 14px ${step.from}25`,
                      }}>
                      {step.emoji}
                    </div>
                    <div>
                      <h3 className="font-sora font-bold text-[12.5px] sm:text-[13.5px] mb-1.5"
                        style={{ color: 'hsl(226,35%,16%)' }}>
                        {step.title}
                      </h3>
                      <p className="text-[11px] sm:text-[12px] leading-relaxed"
                        style={{ color: 'hsl(226,20%,44%)' }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats Bar ── */}
        <div ref={statsRef} className="relative overflow-hidden rounded-[28px]"
          style={{
            background: 'linear-gradient(155deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.60) 100%)',
            backdropFilter: 'blur(32px) saturate(200%)',
            WebkitBackdropFilter: 'blur(32px) saturate(200%)',
            border: '1px solid hsla(243,75%,65%,0.22)',
            boxShadow: '0 8px 48px hsla(243,75%,62%,0.10), 0 1px 0 rgba(255,255,255,0.95) inset',
          }}>
          {/* Top shimmer */}
          <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.95) 50%, transparent)' }} />
          {/* Corner glow */}
          <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
            style={{ background: 'radial-gradient(circle at top right, hsla(243,75%,65%,0.08), transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 pointer-events-none"
            style={{ background: 'radial-gradient(circle at bottom left, hsla(15,100%,62%,0.06), transparent 70%)' }} />

          <div className="absolute top-5 right-6 pointer-events-none">
            <Sparkles size={28} style={{ color: 'hsla(258,78%,55%,0.20)' }} />
          </div>

          <div className="relative p-8 sm:p-12 lg:p-14">
            <p className="text-center text-[11px] font-semibold mb-10 tracking-[0.28em] uppercase font-fira"
              style={{ color: 'hsl(226,20%,58%)' }}>
              Our Numbers Speak For Themselves
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
              {STATS.map((s, i) => (
                <div key={i}
                  className={`transition-all duration-700 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${i * 0.12}s` }}>
                  {/* Stat card */}
                  <div className="relative inline-block px-4 py-2 rounded-2xl mb-2"
                    style={{
                      background: 'linear-gradient(135deg, hsla(243,75%,65%,0.08), hsla(263,70%,62%,0.05))',
                      border: '1px solid hsla(243,75%,65%,0.15)',
                    }}>
                    <div className="font-sora font-black text-[2.6rem] sm:text-[3.2rem] leading-none"
                      style={{
                        background: 'linear-gradient(135deg, hsl(243,75%,55%), hsl(263,70%,58%))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}>
                      {s.n}
                    </div>
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'hsl(226,20%,50%)' }}>
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default WhyChooseUs;
