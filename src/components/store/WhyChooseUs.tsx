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
    <section className="py-24 relative overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
      {/* Background ambient */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i}
                className="group relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                style={{
                  background: 'hsl(var(--card))',
                  border: `1px solid ${f.from}30`,
                  boxShadow: '0 2px 12px hsla(226,35%,12%,0.07)',
                }}>
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                  style={{ background: `radial-gradient(ellipse at 0% 0%, ${f.from}10, transparent 60%)` }} />
                {/* Top border glow on hover */}
                <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, transparent, ${f.from}90, ${f.to}90, transparent)` }} />

                <div className="relative z-10 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `linear-gradient(135deg, ${f.from}18, ${f.to}12)`, border: `1px solid ${f.from}40` }}>
                    {f.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-sora font-bold text-[13px] text-foreground flex items-center gap-2">
                      {f.title}
                      <CheckCircle2 size={12} style={{ color: f.from }} className="flex-shrink-0" />
                    </h3>
                    <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
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
            <div className="hidden lg:block absolute top-12 left-[15%] right-[15%] h-px z-0"
              style={{ background: 'linear-gradient(90deg, hsl(243,75%,65%), hsl(15,100%,62%), hsl(158,64%,48%), hsl(263,70%,62%))', opacity: 0.2 }} />

            {STEPS.map((step, i) => (
              <div key={i}
                className="relative rounded-3xl p-7 z-10 text-center group transition-all duration-300 hover:-translate-y-2"
                style={{
                  background: 'hsl(var(--card))',
                  border: `1px solid ${step.from}35`,
                  boxShadow: '0 2px 12px hsla(226,35%,12%,0.07)',
                }}>
                {/* Hover top glow */}
                <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, transparent, ${step.from}90, ${step.to}90, transparent)` }} />
                {/* Step number */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[11px] font-fira font-bold px-3 py-1 rounded-full text-white"
                    style={{ background: `linear-gradient(135deg, ${step.from}, ${step.to})`, boxShadow: `0 2px 12px ${step.from}50` }}>
                    {step.n}
                  </span>
                </div>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${step.from}18, ${step.to}12)`, border: `1px solid ${step.from}40` }}>
                  {step.emoji}
                </div>
                <h3 className="font-sora font-bold text-[13px] text-foreground mb-2">{step.title}</h3>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats Bar — Glassmorphic ── */}
        <div ref={statsRef}
          className="relative rounded-3xl p-10 lg:p-14 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsla(243,75%,62%,0.08) 0%, hsla(263,70%,58%,0.06) 50%, hsla(15,100%,60%,0.06) 100%)',
            border: '1px solid hsla(243,75%,62%,0.2)',
            boxShadow: '0 4px 32px hsla(226,35%,12%,0.08)',
          }}>
          {/* Decorations */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.07) 0%, transparent 45%)' }} />
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          {/* Top border gradient */}
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, hsla(243,75%,65%,0.6), hsla(263,70%,62%,0.6), transparent)' }} />
          <div className="absolute top-5 right-6 pointer-events-none">
            <Sparkles size={32} className="text-white/15" />
          </div>
          <div className="absolute top-6 right-7 w-24 h-24 rounded-full pointer-events-none"
            style={{ background: 'hsla(0,0%,100%,0.04)' }} />
          <div className="absolute bottom-5 left-5 w-14 h-14 rounded-full pointer-events-none"
            style={{ background: 'hsla(0,0%,100%,0.04)' }} />

          <div className="relative z-10">
            <p className="text-center text-foreground/40 text-[11px] font-semibold mb-10 tracking-[0.25em] uppercase font-fira">
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
