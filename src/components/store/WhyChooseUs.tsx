import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

const FEATURES = [
  { icon: '⚡', title: 'Instant Delivery',   desc: 'Payment-এর পরেই ইমেইলে license key পাঠানো হয়।',          from: 'hsl(243,75%,59%)', to: 'hsl(263,70%,58%)', bg: 'from-indigo-50 to-violet-50', border: 'border-indigo-100' },
  { icon: '🛡️', title: '100% Genuine Keys', desc: 'সব key ১০০% original এবং Microsoft verified।',            from: 'hsl(158,64%,42%)', to: 'hsl(180,70%,40%)', bg: 'from-emerald-50 to-teal-50',  border: 'border-emerald-100' },
  { icon: '🎧', title: '24/7 Support',        desc: 'WhatsApp ও Telegram-এ সার্বক্ষণিক সাপোর্ট।',              from: 'hsl(263,70%,58%)', to: 'hsl(283,65%,55%)', bg: 'from-purple-50 to-fuchsia-50', border: 'border-purple-100' },
  { icon: '🏛️', title: 'Govt. Registered',  desc: 'DBID: 586772174 — সরকার নিবন্ধিত ব্যবসা।',                from: 'hsl(158,64%,42%)', to: 'hsl(180,70%,40%)', bg: 'from-green-50 to-emerald-50',  border: 'border-green-100' },
  { icon: '💰', title: 'Lowest Price BD',    desc: 'বাংলাদেশের সবচেয়ে কম দামে অরিজিনাল সফটওয়্যার।',         from: 'hsl(15,100%,60%)', to: 'hsl(38,100%,55%)', bg: 'from-orange-50 to-amber-50',   border: 'border-orange-100' },
  { icon: '😊', title: '12K+ Customers',      desc: '২০২০ সাল থেকে ১২০০০+ সন্তুষ্ট গ্রাহক সারা বিশ্বে।',     from: 'hsl(38,100%,55%)', to: 'hsl(50,100%,55%)', bg: 'from-yellow-50 to-amber-50',   border: 'border-yellow-100' },
];

const STEPS = [
  { n: '01', emoji: '🛒', title: 'Choose Product',   desc: 'আমাদের collection থেকে পছন্দের software বেছে নিন।',     from: 'hsl(243,75%,59%)', to: 'hsl(263,70%,58%)' },
  { n: '02', emoji: '💳', title: 'Make Payment',      desc: 'bKash, Nagad বা Rocket-এ নিরাপদে payment করুন।',        from: 'hsl(15,100%,60%)', to: 'hsl(38,100%,55%)' },
  { n: '03', emoji: '📧', title: 'Get Delivery',      desc: 'মিনিটের মধ্যে ইমেইলে license key পাঠানো হবে।',          from: 'hsl(158,64%,42%)', to: 'hsl(180,70%,40%)' },
  { n: '04', emoji: '✅', title: 'Activate & Enjoy', desc: 'Product activate করুন, সমস্যায় support-এ যোগাযোগ।',    from: 'hsl(263,70%,58%)', to: 'hsl(283,65%,55%)' },
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
    <section style={{ background: 'hsl(230, 25%, 97%)' }} className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">

        {/* ── Why Choose Us ── */}
        <div>
          <div className="text-center mb-14">
            <span className="section-label">Why Us</span>
            <h2 className="section-heading text-3xl sm:text-4xl mt-4">
              Why{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
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
                className={`group relative bg-gradient-to-br ${f.bg} border ${f.border} rounded-2xl p-6 hover:shadow-[0_16px_40px_hsla(230,25%,10%,0.10)] transition-all duration-300 hover:-translate-y-1 overflow-hidden`}>
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                  style={{ background: `radial-gradient(ellipse at 0% 0%, ${f.from}10, transparent 60%)` }} />
                <div className="relative z-10 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-soft flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
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
            <h2 className="section-heading text-3xl sm:text-4xl mt-4">
              How to{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(15,100%,60%), hsl(38,100%,55%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Order
              </span>
            </h2>
            <p className="text-muted-foreground mt-3 text-[14px]">চার ধাপে আপনার product পান — সহজ, দ্রুত, নিরাপদ।</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-12 left-[15%] right-[15%] h-px z-0"
              style={{ background: 'linear-gradient(90deg, hsl(243,75%,59%), hsl(15,100%,60%), hsl(158,64%,42%), hsl(263,70%,58%))', opacity: 0.25 }} />

            {STEPS.map((step, i) => (
              <div key={i}
                className="relative bg-white border border-border/70 rounded-3xl p-7 shadow-soft hover:shadow-[0_16px_40px_hsla(230,25%,10%,0.1)] transition-all duration-300 hover:-translate-y-2 z-10 text-center group">
                {/* Step number */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[11px] font-fira font-bold px-3 py-1 rounded-full text-white"
                    style={{ background: `linear-gradient(135deg, ${step.from}, ${step.to})` }}>
                    {step.n}
                  </span>
                </div>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${step.from}14, ${step.to}10)`, border: `1.5px solid ${step.from}25` }}>
                  {step.emoji}
                </div>
                <h3 className="font-sora font-bold text-[13px] text-foreground mb-2">{step.title}</h3>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats Bar ── */}
        <div ref={statsRef}
          className="relative rounded-3xl p-10 lg:p-14 text-white overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsl(243,75%,52%) 0%, hsl(253,72%,50%) 30%, hsl(263,70%,50%) 65%, hsl(283,65%,50%) 100%)' }}>

          {/* Decorations */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.12) 0%, transparent 45%)' }} />
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="absolute top-5 right-6 pointer-events-none">
            <Sparkles size={32} className="text-white/20" />
          </div>
          <div className="absolute top-6 right-7 w-24 h-24 rounded-full bg-white/8 pointer-events-none" />
          <div className="absolute bottom-5 left-5 w-14 h-14 rounded-full bg-white/8 pointer-events-none" />

          <div className="relative z-10">
            <p className="text-center text-white/60 text-[11px] font-semibold mb-10 tracking-[0.25em] uppercase font-fira">
              Our Numbers Speak For Themselves
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {STATS.map((s, i) => (
                <div key={i}
                  className={`transition-all duration-700 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${i * 0.12}s` }}>
                  <div className="font-sora font-black text-[3rem] sm:text-[3.5rem] leading-none">{s.n}</div>
                  <div className="text-white/60 text-[11px] font-semibold mt-2.5 uppercase tracking-wider">{s.l}</div>
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
