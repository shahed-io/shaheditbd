import { useEffect, useRef, useState } from 'react';
import { Shield, Zap, Headphones, BadgeCheck, Award, Globe, ArrowRight } from 'lucide-react';

const FEATURES = [
  { icon: '⚡', title: 'Instant Delivery',  desc: 'Payment-এর পরেই ইমেইলে license key পাঠানো হয়।',        color: 'hsl(243,75%,59%)',  bg: 'bg-indigo-50 border-indigo-200' },
  { icon: '🛡️', title: '100% Genuine Keys', desc: 'সব key ১০০% original এবং Microsoft verified।',          color: 'hsl(158,64%,42%)',  bg: 'bg-green-50 border-green-200' },
  { icon: '🎧', title: '24/7 Support',       desc: 'WhatsApp ও Telegram-এ সার্বক্ষণিক সাপোর্ট।',            color: 'hsl(263,70%,58%)',  bg: 'bg-purple-50 border-purple-200' },
  { icon: '🏛️', title: 'Govt. Registered',  desc: 'DBID: 586772174 — সরকার নিবন্ধিত ব্যবসা।',              color: 'hsl(158,64%,42%)',  bg: 'bg-emerald-50 border-emerald-200' },
  { icon: '💰', title: 'Lowest Price BD',    desc: 'বাংলাদেশের সবচেয়ে কম দামে অরিজিনাল সফটওয়্যার।',       color: 'hsl(15,100%,60%)',  bg: 'bg-orange-50 border-orange-200' },
  { icon: '😊', title: '12K+ Customers',     desc: '২০২০ সাল থেকে ১২০০০+ সন্তুষ্ট গ্রাহক সারা বিশ্বে।',   color: 'hsl(38,100%,55%)',  bg: 'bg-amber-50 border-amber-200' },
];

const STEPS = [
  { n: '01', emoji: '🛒', title: 'Choose Product',   desc: 'আমাদের collection থেকে পছন্দের software বেছে নিন।',    color: 'hsl(243,75%,59%)' },
  { n: '02', emoji: '💳', title: 'Make Payment',      desc: 'bKash, Nagad বা Rocket-এ নিরাপদে payment করুন।',       color: 'hsl(15,100%,60%)' },
  { n: '03', emoji: '📧', title: 'Get Delivery',      desc: 'মিনিটের মধ্যে ইমেইলে license key পাঠানো হবে।',         color: 'hsl(158,64%,42%)' },
  { n: '04', emoji: '✅', title: 'Activate & Enjoy',  desc: 'Product activate করুন, সমস্যায় support-এ যোগাযোগ করুন।', color: 'hsl(263,70%,58%)' },
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
    <section className="py-20 bg-surface-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">

        {/* ── Why Choose Us ── */}
        <div>
          <div className="text-center mb-12">
            <span className="section-label">Why Us</span>
            <h2 className="section-heading text-3xl sm:text-4xl mt-3 mx-auto">
              Why{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Choose Us?
              </span>
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              Bangladesh's most trusted digital software marketplace since 2020.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i}
                className={`trust-badge flex-col items-start gap-3 p-5 rounded-2xl border-2 ${f.bg} hover:shadow-medium transition-all duration-300 hover:-translate-y-1`}>
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-soft">{f.emoji}</div>
                <div>
                  <h3 className="font-sora font-bold text-sm text-foreground">{f.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── How to Order ── */}
        <div>
          <div className="text-center mb-12">
            <span className="section-label">Order Process</span>
            <h2 className="section-heading text-3xl sm:text-4xl mt-3">
              How to{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(15,100%,60%), hsl(38,100%,55%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Order
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 z-0"
              style={{ background: 'linear-gradient(90deg, hsl(243,75%,59%), hsl(15,100%,60%), hsl(158,64%,42%), hsl(263,70%,58%))', opacity: 0.2 }} />

            {STEPS.map((step, i) => (
              <div key={i} className="relative bg-white border-2 border-border rounded-3xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-2 z-10 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-soft"
                  style={{ background: `${step.color}12`, border: `2px solid ${step.color}30` }}>
                  {step.emoji}
                </div>
                <div className="text-xs font-fira font-bold mb-2" style={{ color: step.color }}>{step.n}</div>
                <h3 className="font-sora font-bold text-sm text-foreground mb-2">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats Bar ── */}
        <div ref={statsRef}
          className="relative rounded-3xl p-8 lg:p-12 text-white overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%) 0%, hsl(253,72%,55%) 35%, hsl(263,70%,53%) 70%, hsl(283,65%,52%) 100%)' }}>

          {/* Decorations */}
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)', pointerEvents: 'none' }} />
          <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-white/10 pointer-events-none" />

          <div className="relative z-10">
            <p className="text-center text-white/70 text-sm font-semibold mb-8 tracking-widest uppercase font-fira">Our Numbers Speak</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {STATS.map((s, i) => (
                <div key={i} className={`transition-all duration-700 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  style={{ transitionDelay: `${i * 0.12}s` }}>
                  <div className="text-4xl sm:text-5xl font-sora font-black">{s.n}</div>
                  <div className="text-white/70 text-xs font-medium mt-2 uppercase tracking-wider">{s.l}</div>
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

