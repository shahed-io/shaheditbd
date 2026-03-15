import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

const FEATURES = [
  { icon: '⚡', title: 'Instant Delivery',   desc: 'Payment-এর পরেই ইমেইলে license key পাঠানো হয়।',          from: 'hsla(243,75%,65%,0.7)', to: 'hsla(263,70%,62%,0.5)', glow: 'hsla(243,75%,65%,0.35)', solid: 'hsl(243,75%,65%)' },
  { icon: '🛡️', title: '100% Genuine Keys', desc: 'সব key ১০০% original এবং Microsoft verified।',            from: 'hsla(158,64%,48%,0.7)', to: 'hsla(180,70%,44%,0.5)', glow: 'hsla(158,64%,48%,0.35)', solid: 'hsl(158,64%,48%)' },
  { icon: '🎧', title: '24/7 Support',        desc: 'WhatsApp ও Telegram-এ সার্বক্ষণিক সাপোর্ট।',              from: 'hsla(263,70%,62%,0.7)', to: 'hsla(283,65%,58%,0.5)', glow: 'hsla(263,70%,62%,0.35)', solid: 'hsl(263,70%,62%)' },
  { icon: '🏛️', title: 'Govt. Registered',  desc: 'DBID: 586772174 — সরকার নিবন্ধিত ব্যবসা।',                from: 'hsla(158,64%,48%,0.7)', to: 'hsla(180,70%,44%,0.5)', glow: 'hsla(158,64%,48%,0.35)', solid: 'hsl(158,64%,48%)' },
  { icon: '💰', title: 'Lowest Price BD',    desc: 'বাংলাদেশের সবচেয়ে কম দামে অরিজিনাল সফটওয়্যার।',         from: 'hsla(15,100%,62%,0.7)',  to: 'hsla(38,100%,58%,0.5)', glow: 'hsla(15,100%,62%,0.35)',  solid: 'hsl(15,100%,62%)' },
  { icon: '😊', title: '12K+ Customers',      desc: '২০২০ সাল থেকে ১২০০০+ সন্তুষ্ট গ্রাহক সারা বিশ্বে।',     from: 'hsla(38,100%,58%,0.7)',  to: 'hsla(50,100%,58%,0.5)', glow: 'hsla(38,100%,58%,0.35)',  solid: 'hsl(38,100%,58%)' },
];

const STEPS = [
  { n: '01', emoji: '🛒', title: 'Choose Product',   desc: 'আমাদের collection থেকে পছন্দের software বেছে নিন।',     from: 'hsla(243,75%,65%,0.7)', to: 'hsla(263,70%,62%,0.5)', glow: 'hsla(243,75%,65%,0.4)', solid: 'hsl(243,75%,65%)' },
  { n: '02', emoji: '💳', title: 'Make Payment',      desc: 'bKash, Nagad বা Rocket-এ নিরাপদে payment করুন।',        from: 'hsla(15,100%,62%,0.7)',  to: 'hsla(38,100%,58%,0.5)', glow: 'hsla(15,100%,62%,0.4)',  solid: 'hsl(15,100%,62%)' },
  { n: '03', emoji: '📧', title: 'Get Delivery',      desc: 'মিনিটের মধ্যে ইমেইলে license key পাঠানো হবে।',          from: 'hsla(158,64%,48%,0.7)', to: 'hsla(180,70%,44%,0.5)', glow: 'hsla(158,64%,48%,0.4)', solid: 'hsl(158,64%,48%)' },
  { n: '04', emoji: '✅', title: 'Activate & Enjoy', desc: 'Product activate করুন, সমস্যায় support-এ যোগাযোগ।',    from: 'hsla(263,70%,62%,0.7)', to: 'hsla(283,65%,58%,0.5)', glow: 'hsla(263,70%,62%,0.4)', solid: 'hsl(263,70%,62%)' },
];

const STATS = [
  { n: '12K+', l: 'Happy Customers', solid: 'hsl(243,75%,65%)' },
  { n: '500+', l: 'Products',        solid: 'hsl(158,64%,48%)' },
  { n: '25K+', l: 'Orders Delivered',solid: 'hsl(15,100%,62%)' },
  { n: '24/7', l: 'Support Available',solid: 'hsl(263,70%,62%)' },
];

/* ── True Glassmorphism Card ── */
const GlassCard = ({ children, from, to, glow, className = '' }: {
  children: React.ReactNode;
  from: string;
  to: string;
  glow: string;
  className?: string;
}) => (
  <div className={`relative group ${className}`}>
    {/* Outer ambient glow — blurred behind the card */}
    <div
      className="absolute inset-0 rounded-[22px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10"
      style={{
        background: `radial-gradient(ellipse at center, ${glow}, transparent 70%)`,
        filter: 'blur(20px)',
        transform: 'scale(1.1)',
      }}
    />
    {/* Glass border via gradient */}
    <div
      className="absolute inset-0 rounded-[22px] pointer-events-none"
      style={{
        padding: '1.5px',
        background: `linear-gradient(135deg, ${from}, ${to}, transparent 80%)`,
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
      }}
    />
    {/* Frosted glass surface */}
    <div
      className="relative rounded-[22px] h-full overflow-hidden transition-transform duration-300 group-hover:-translate-y-1"
      style={{
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: `1.5px solid rgba(255,255,255,0.7)`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)`,
      }}
    >
      {/* Inner top highlight */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9) 40%, rgba(255,255,255,0.6) 70%, transparent)' }}
      />
      {/* Color tint on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none rounded-[22px]"
        style={{ background: `linear-gradient(135deg, ${from.replace('0.7)', '0.08)')}, ${to.replace('0.5)', '0.05)')})` }}
      />
      {children}
    </div>
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
    <section className="py-24 relative overflow-hidden">
      {/* Rich ambient background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(243,75%,65%,0.12), transparent 65%)', filter: 'blur(80px)', transform: 'translateY(-30%)' }} />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(15,100%,62%,0.10), transparent 65%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(158,64%,48%,0.09), transparent 65%)', filter: 'blur(90px)', transform: 'translateY(20%)' }} />
        <div className="absolute top-2/3 left-1/2 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(263,70%,62%,0.08), transparent 65%)', filter: 'blur(70px)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-28 relative z-10">

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
              <GlassCard key={i} from={f.from} to={f.to} glow={f.glow}>
                <div className="p-6 h-full">
                  <div className="flex items-start gap-4">
                    {/* Icon — glass pill */}
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${f.from.replace('0.7)', '0.18)')}, ${f.to.replace('0.5)', '0.12)')})`,
                        border: `1px solid ${f.from.replace('0.7)', '0.4)')}`,
                        backdropFilter: 'blur(10px)',
                        boxShadow: `0 4px 16px ${f.glow}`,
                      }}>
                      {f.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-sora font-bold text-[13.5px] text-foreground flex items-center gap-2">
                        {f.title}
                        <CheckCircle2 size={13} style={{ color: f.solid }} className="flex-shrink-0" />
                      </h3>
                      <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </div>
              </GlassCard>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-[3.5rem] left-[12%] right-[12%] h-[1.5px] z-0"
              style={{ background: 'linear-gradient(90deg, hsl(243,75%,65%), hsl(15,100%,62%), hsl(158,64%,48%), hsl(263,70%,62%))', opacity: 0.25 }} />

            {STEPS.map((step, i) => (
              <GlassCard key={i} from={step.from} to={step.to} glow={step.glow}>
                <div className="relative p-7 z-10 text-center h-full">
                  {/* Step badge */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <span
                      className="text-[11px] font-fira font-bold px-3 py-1.5 rounded-full text-white shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${step.solid}, ${step.to.replace('hsla', 'hsl').replace(',0.5)', ')')})`,
                        boxShadow: `0 4px 16px ${step.glow}`,
                      }}>
                      {step.n}
                    </span>
                  </div>

                  {/* Emoji icon */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 mt-2 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${step.from.replace('0.7)', '0.18)')}, ${step.to.replace('0.5)', '0.12)')})`,
                      border: `1px solid ${step.from.replace('0.7)', '0.4)')}`,
                      backdropFilter: 'blur(10px)',
                      boxShadow: `0 4px 20px ${step.glow}`,
                    }}>
                    {step.emoji}
                  </div>
                  <h3 className="font-sora font-bold text-[13.5px] text-foreground mb-2">{step.title}</h3>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* ── Stats Bar — Glassmorphism ── */}
        <div
          ref={statsRef}
          className="relative rounded-3xl p-10 lg:p-14 overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.50)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1.5px solid rgba(255,255,255,0.75)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 2px 10px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.95)',
          }}>
          {/* Top rainbow shimmer */}
          <div className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
            style={{ background: 'linear-gradient(90deg, hsl(243,75%,65%), hsl(15,100%,62%), hsl(158,64%,48%), hsl(263,70%,62%), hsl(243,75%,65%))', opacity: 0.6 }} />
          {/* Ambient tint */}
          <div className="absolute inset-0 pointer-events-none rounded-3xl"
            style={{ background: 'radial-gradient(ellipse at 20% 50%, hsla(243,75%,65%,0.06), transparent 60%)' }} />
          <div className="absolute top-5 right-6 pointer-events-none">
            <Sparkles size={32} style={{ color: 'hsla(258,78%,55%,0.25)' }} />
          </div>

          <div className="relative z-10">
            <p className="text-center text-muted-foreground/60 text-[11px] font-semibold mb-10 tracking-[0.25em] uppercase font-fira">
              Our Numbers Speak For Themselves
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {STATS.map((s, i) => (
                <div
                  key={i}
                  className={`transition-all duration-700 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${i * 0.12}s` }}>
                  {/* Glass stat pill */}
                  <div
                    className="inline-block px-5 py-3 rounded-2xl mb-2"
                    style={{
                      background: 'rgba(255,255,255,0.6)',
                      border: '1px solid rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(12px)',
                      boxShadow: `0 4px 20px rgba(0,0,0,0.05)`,
                    }}>
                    <div
                      className="font-sora font-black text-[2.6rem] sm:text-[3rem] leading-none"
                      style={{ background: `linear-gradient(135deg, ${s.solid}, ${s.solid.replace('hsl(', 'hsl(').replace('%)', '%, 0.7)')})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      {s.n}
                    </div>
                  </div>
                  <div className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">{s.l}</div>
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
