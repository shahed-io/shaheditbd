import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

const FEATURES = [
  { icon: '⚡', title: 'Instant Delivery',   desc: 'Payment-এর পরেই ইমেইলে license key পাঠানো হয়।',          from: 'hsl(258,78%,65%)', to: 'hsl(190,90%,55%)' },
  { icon: '🛡️', title: '100% Genuine Keys', desc: 'সব key ১০০% original এবং Microsoft verified।',            from: 'hsl(162,72%,52%)', to: 'hsl(190,70%,50%)' },
  { icon: '🎧', title: '24/7 Support',        desc: 'WhatsApp ও Telegram-এ সার্বক্ষণিক সাপোর্ট।',              from: 'hsl(258,78%,65%)', to: 'hsl(283,65%,60%)' },
  { icon: '🏛️', title: 'Govt. Registered',  desc: 'DBID: 586772174 — সরকার নিবন্ধিত ব্যবসা।',                from: 'hsl(162,72%,52%)', to: 'hsl(190,70%,50%)' },
  { icon: '💰', title: 'Lowest Price BD',    desc: 'বাংলাদেশের সবচেয়ে কম দামে অরিজিনাল সফটওয়্যার।',         from: 'hsl(15,100%,65%)',  to: 'hsl(38,100%,60%)' },
  { icon: '😊', title: '12K+ Customers',      desc: '২০২০ সাল থেকে ১২০০০+ সন্তুষ্ট গ্রাহক সারা বিশ্বে।',     from: 'hsl(42,96%,62%)',   to: 'hsl(50,100%,60%)' },
];

const STEPS = [
  { n: '01', emoji: '🛒', title: 'Choose Product',   desc: 'আমাদের collection থেকে পছন্দের software বেছে নিন।',     from: 'hsl(258,78%,65%)', to: 'hsl(190,90%,55%)' },
  { n: '02', emoji: '💳', title: 'Make Payment',      desc: 'bKash, Nagad বা Rocket-এ নিরাপদে payment করুন।',        from: 'hsl(15,100%,65%)',  to: 'hsl(38,100%,60%)' },
  { n: '03', emoji: '📧', title: 'Get Delivery',      desc: 'মিনিটের মধ্যে ইমেইলে license key পাঠানো হবে।',          from: 'hsl(162,72%,52%)', to: 'hsl(190,70%,50%)' },
  { n: '04', emoji: '✅', title: 'Activate & Enjoy', desc: 'Product activate করুন, সমস্যায় support-এ যোগাযোগ।',    from: 'hsl(258,78%,65%)', to: 'hsl(283,65%,60%)' },
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
    <section className="py-24 relative overflow-hidden bg-transparent">
      {/* Background ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-0 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(258,78%,62%,0.08), transparent)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-1/3 right-0 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(15,100%,60%,0.07), transparent)', filter: 'blur(80px)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 relative z-10">

        {/* ── Why Choose Us ── */}
        <div>
          <div className="text-center mb-14">
            <span className="section-label">Why Us</span>
            <h2 className="section-heading text-3xl sm:text-4xl mt-4">
              Why{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(258,78%,72%), hsl(190,90%,60%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
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
                className="group relative glass-section-card p-6 transition-all duration-300 hover:-translate-y-1">
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                  style={{ background: `radial-gradient(ellipse at 0% 0%, ${f.from}12, transparent 60%)` }} />
                {/* Top border glow on hover */}
                <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl"
                  style={{ background: `linear-gradient(90deg, transparent, ${f.from}90, ${f.to}90, transparent)` }} />

                <div className="relative z-10 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${f.from}20, ${f.to}14)`,
                      border: `1px solid ${f.from}45`,
                      backdropFilter: 'blur(8px)',
                    }}>
                    {f.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-sora font-bold text-[13px] flex items-center gap-2" style={{ color: 'hsl(220,20%,88%)' }}>
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
              <span style={{ background: 'linear-gradient(135deg, hsl(15,100%,65%), hsl(38,100%,60%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Order
              </span>
            </h2>
            <p className="text-muted-foreground mt-3 text-[14px]">চার ধাপে আপনার product পান — সহজ, দ্রুত, নিরাপদ।</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-12 left-[15%] right-[15%] h-px z-0"
              style={{ background: 'linear-gradient(90deg, hsl(258,78%,62%), hsl(15,100%,62%), hsl(162,72%,48%), hsl(258,78%,62%))', opacity: 0.25 }} />

            {STEPS.map((step, i) => (
              <div key={i}
                className="relative glass-section-card p-7 z-10 text-center group transition-all duration-300 hover:-translate-y-2">
                {/* Hover top glow */}
                <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-3xl"
                  style={{ background: `linear-gradient(90deg, transparent, ${step.from}90, ${step.to}90, transparent)` }} />
                {/* Step number */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[11px] font-fira font-bold px-3 py-1 rounded-full text-white"
                    style={{ background: `linear-gradient(135deg, ${step.from}, ${step.to})`, boxShadow: `0 2px 14px ${step.from}60` }}>
                    {step.n}
                  </span>
                </div>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${step.from}20, ${step.to}14)`,
                    border: `1px solid ${step.from}45`,
                    backdropFilter: 'blur(8px)',
                  }}>
                  {step.emoji}
                </div>
                <h3 className="font-sora font-bold text-[13px] mb-2" style={{ color: 'hsl(220,20%,88%)' }}>{step.title}</h3>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats Bar — Glassmorphism ── */}
        <div ref={statsRef}
          className="relative glass-section-card p-10 lg:p-14 overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, hsla(258,78%,62%,0.12), transparent)', filter: 'blur(50px)', transform: 'translate(-30%, -30%)' }} />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, hsla(15,100%,60%,0.10), transparent)', filter: 'blur(50px)', transform: 'translate(30%, 30%)' }} />
          <div className="absolute top-5 right-6 pointer-events-none">
            <Sparkles size={32} style={{ color: 'hsla(258,78%,62%,0.35)' }} />
          </div>
          <div className="relative z-10">
            <p className="text-center text-[11px] font-semibold mb-10 tracking-[0.25em] uppercase font-fira"
              style={{ color: 'hsl(220,20%,40%)' }}>
              Our Numbers Speak For Themselves
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {STATS.map((s, i) => (
                <div key={i}
                  className={`transition-all duration-700 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${i * 0.12}s` }}>
                  <div className="font-sora font-black leading-none"
                    style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', background: 'linear-gradient(135deg, hsl(258,78%,72%), hsl(190,90%,60%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    {s.n}
                  </div>
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
