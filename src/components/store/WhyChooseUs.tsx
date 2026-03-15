import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

const FEATURES = [
  { icon: '⚡', title: 'Instant Delivery',   desc: 'Payment-এর পরেই ইমেইলে license key পাঠানো হয়।',          from: 'hsl(243,75%,65%)', to: 'hsl(263,70%,62%)' },
  { icon: '🛡️', title: '100% Genuine Keys', desc: 'সব key ১০০% original এবং Microsoft verified।',            from: 'hsl(158,64%,48%)', to: 'hsl(180,70%,44%)' },
  { icon: '🎧', title: '24/7 Support',        desc: 'WhatsApp ও Telegram-এ সার্বক্ষণিক সাপোর্ট।',              from: 'hsl(263,70%,62%)', to: 'hsl(283,65%,58%)' },
  { icon: '🏛️', title: 'Govt. Registered',  desc: 'DBID: 586772174 — সরকার নিবন্ধিত ব্যবসা।',                from: 'hsl(158,64%,48%)', to: 'hsl(180,70%,44%)' },
  { icon: '💰', title: 'Lowest Price BD',    desc: 'বাংলাদেশের সবচেয়ে কম দামে অরিজিনাল সফটওয়্যার।',         from: 'hsl(15,100%,62%)',  to: 'hsl(38,100%,58%)' },
  { icon: '😊', title: '12K+ Customers',      desc: '২০২০ সাল থেকে ১২০০০+ সন্তুষ্ট গ্রাহক সারা বিশ্বে।',     from: 'hsl(38,100%,58%)',  to: 'hsl(50,100%,58%)' },
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

/* Reusable edge-glow wrapper */
const GlowCard = ({ children, from, to, className = '' }: {
  children: React.ReactNode;
  from: string;
  to: string;
  className?: string;
}) => (
  <div className={`relative group ${className}`}
    style={{ padding: '1.5px', borderRadius: '20px', background: `linear-gradient(135deg, ${from}60, ${to}40, transparent 70%)` }}>
    {/* Animated corner sparkle */}
    <div className="absolute -top-px -left-px w-6 h-6 rounded-tl-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      style={{ background: `radial-gradient(circle at 0% 0%, ${from}80, transparent 70%)` }} />
    <div className="absolute -bottom-px -right-px w-6 h-6 rounded-br-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      style={{ background: `radial-gradient(circle at 100% 100%, ${to}60, transparent 70%)` }} />
    <div style={{ borderRadius: '19px', background: 'hsl(var(--card))', overflow: 'hidden', height: '100%' }}>
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
    <section className="py-24 relative overflow-hidden bg-transparent">
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(243,75%,62%,0.06), transparent)', filter: 'blur(100px)' }} />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(15,100%,60%,0.05), transparent)', filter: 'blur(90px)' }} />
        <div className="absolute top-3/4 left-1/3 w-[350px] h-[350px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(158,64%,48%,0.04), transparent)', filter: 'blur(80px)' }} />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <GlowCard key={i} from={f.from} to={f.to}>
                <div
                  className="group relative p-6 transition-all duration-300 hover:-translate-y-0.5 h-full"
                  style={{
                    background: 'hsl(var(--card))',
                  }}>
                  {/* Inner glow on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at 0% 0%, ${f.from}10, transparent 60%)` }} />
                  {/* Top shimmer bar */}
                  <div className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ background: `linear-gradient(90deg, transparent 0%, ${f.from}80 30%, ${f.to}80 70%, transparent 100%)`, opacity: 0.7 }} />

                  <div className="relative z-10 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${f.from}22, ${f.to}14)`,
                        border: `1px solid ${f.from}50`,
                        boxShadow: `0 4px 16px ${f.from}25`,
                      }}>
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
                </div>
              </GlowCard>
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
            <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-[1.5px] z-0"
              style={{ background: 'linear-gradient(90deg, hsl(243,75%,65%), hsl(15,100%,62%), hsl(158,64%,48%), hsl(263,70%,62%))', opacity: 0.3 }} />

            {STEPS.map((step, i) => (
              <GlowCard key={i} from={step.from} to={step.to}>
                <div
                  className="relative p-7 z-10 text-center group transition-all duration-300 hover:-translate-y-0.5 h-full"
                  style={{ background: 'hsl(var(--card))' }}>
                  {/* Top shimmer */}
                  <div className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ background: `linear-gradient(90deg, transparent, ${step.from}80, ${step.to}80, transparent)`, opacity: 0.8 }} />
                  {/* Bottom shimmer */}
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] opacity-30"
                    style={{ background: `linear-gradient(90deg, transparent, ${step.from}50, transparent)` }} />

                  {/* Step number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <span className="text-[11px] font-fira font-bold px-3 py-1.5 rounded-full text-white shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${step.from}, ${step.to})`,
                        boxShadow: `0 4px 16px ${step.from}60`,
                      }}>
                      {step.n}
                    </span>
                  </div>

                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 mt-2 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${step.from}20, ${step.to}14)`,
                      border: `1px solid ${step.from}45`,
                      boxShadow: `0 4px 20px ${step.from}28`,
                    }}>
                    {step.emoji}
                  </div>
                  <h3 className="font-sora font-bold text-[13.5px] text-foreground mb-2">{step.title}</h3>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </GlowCard>
            ))}
          </div>
        </div>

        {/* ── Stats Bar ── */}
        <div ref={statsRef}
          className="relative rounded-3xl p-10 lg:p-14 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsla(243,75%,62%,0.07) 0%, hsla(263,70%,58%,0.05) 50%, hsla(15,100%,60%,0.06) 100%)',
            border: '1.5px solid hsla(243,75%,62%,0.22)',
            boxShadow: '0 4px 40px hsla(226,35%,12%,0.07), inset 0 1px 0 hsla(243,75%,62%,0.15)',
          }}>
          {/* Edge glows inside stats bar */}
          <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, hsla(243,75%,65%,0.6), hsla(15,100%,62%,0.5), transparent)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, hsla(243,75%,65%,0.3), transparent)' }} />
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 15% 20%, hsla(258,78%,55%,0.05) 0%, transparent 45%)' }} />
          <div className="absolute top-5 right-6 pointer-events-none">
            <Sparkles size={32} style={{ color: 'hsla(258,78%,55%,0.25)' }} />
          </div>
          <div className="relative z-10">
            <p className="text-center text-muted-foreground/60 text-[11px] font-semibold mb-10 tracking-[0.25em] uppercase font-fira">
              Our Numbers Speak For Themselves
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {STATS.map((s, i) => (
                <div key={i}
                  className={`transition-all duration-700 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${i * 0.12}s` }}>
                  <div className="font-sora font-black text-[3rem] sm:text-[3.5rem] leading-none text-foreground">{s.n}</div>
                  <div className="text-muted-foreground text-[11px] font-semibold mt-2.5 uppercase tracking-wider">{s.l}</div>
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
