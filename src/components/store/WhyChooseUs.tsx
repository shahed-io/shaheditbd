import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

const FEATURES = [
  { icon: '⚡', title: 'Instant Delivery',   desc: 'Payment-এর পরেই ইমেইলে license key পাঠানো হয়।',       accent: 'hsl(243,75%,59%)' },
  { icon: '🛡️', title: '100% Genuine Keys', desc: 'সব key ১০০% original এবং Microsoft verified।',          accent: 'hsl(158,64%,42%)' },
  { icon: '🎧', title: '24/7 Support',        desc: 'WhatsApp ও Telegram-এ সার্বক্ষণিক সাপোর্ট।',            accent: 'hsl(263,70%,58%)' },
  { icon: '🏛️', title: 'Govt. Registered',  desc: 'DBID: 586772174 — সরকার নিবন্ধিত ব্যবসা।',              accent: 'hsl(158,64%,42%)' },
  { icon: '💰', title: 'Lowest Price BD',    desc: 'বাংলাদেশের সবচেয়ে কম দামে অরিজিনাল সফটওয়্যার।',       accent: 'hsl(15,100%,60%)' },
  { icon: '😊', title: '12K+ Customers',     desc: '২০২০ সাল থেকে ১২০০০+ সন্তুষ্ট গ্রাহক সারা বিশ্বে।',   accent: 'hsl(38,100%,55%)' },
];

const STEPS = [
  { n: '01', emoji: '🛒', title: 'Choose Product',   desc: 'আমাদের collection থেকে পছন্দের software বেছে নিন।',  accent: 'hsl(243,75%,59%)' },
  { n: '02', emoji: '💳', title: 'Make Payment',      desc: 'bKash, Nagad বা Rocket-এ নিরাপদে payment করুন।',      accent: 'hsl(15,100%,60%)' },
  { n: '03', emoji: '📧', title: 'Get Delivery',      desc: 'মিনিটের মধ্যে ইমেইলে license key পাঠানো হবে।',        accent: 'hsl(158,64%,42%)' },
  { n: '04', emoji: '✅', title: 'Activate & Enjoy', desc: 'Product activate করুন, সমস্যায় support-এ যোগাযোগ।',  accent: 'hsl(263,70%,58%)' },
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
    <section style={{ background: 'hsl(222, 22%, 9%)' }} className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">

        {/* Why Choose Us */}
        <div>
          <div className="text-center mb-12">
            <h2 className="font-sora font-black text-2xl sm:text-3xl text-white">
              Why{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Choose Us?
              </span>
            </h2>
            <p className="mt-2 text-sm" style={{ color: 'hsla(0,0%,100%,0.4)' }}>Bangladesh's most trusted digital software marketplace since 2020.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i}
                className="group relative rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                style={{ background: 'hsl(222,22%,13%)', border: '1px solid hsla(0,0%,100%,0.07)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${f.accent}40`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'hsla(0,0%,100%,0.07)'; }}>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${f.accent}18`, border: `1px solid ${f.accent}25` }}>
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="font-sora font-bold text-[13px] text-white flex items-center gap-2">
                      {f.title}
                      <CheckCircle2 size={11} style={{ color: f.accent }} />
                    </h3>
                    <p className="text-[12px] mt-1 leading-relaxed" style={{ color: 'hsla(0,0%,100%,0.4)' }}>{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How to Order */}
        <div>
          <div className="text-center mb-12">
            <h2 className="font-sora font-black text-2xl sm:text-3xl text-white">
              How to{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(15,100%,60%), hsl(38,100%,55%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Order
              </span>
            </h2>
            <p className="mt-2 text-sm" style={{ color: 'hsla(0,0%,100%,0.4)' }}>চার ধাপে আপনার product পান — সহজ, দ্রুত, নিরাপদ।</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((step, i) => (
              <div key={i}
                className="relative rounded-xl p-6 text-center group transition-all duration-300 hover:-translate-y-1"
                style={{ background: 'hsl(222,22%,13%)', border: '1px solid hsla(0,0%,100%,0.07)' }}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[11px] font-fira font-bold px-3 py-1 rounded-full text-white"
                    style={{ background: step.accent }}>
                    {step.n}
                  </span>
                </div>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4"
                  style={{ background: `${step.accent}18`, border: `1px solid ${step.accent}25` }}>
                  {step.emoji}
                </div>
                <h3 className="font-sora font-bold text-[13px] text-white mb-2">{step.title}</h3>
                <p className="text-[12px] leading-relaxed" style={{ color: 'hsla(0,0%,100%,0.4)' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        <div ref={statsRef}
          className="relative rounded-2xl p-10 lg:p-14 text-white overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsl(243,75%,52%) 0%, hsl(263,70%,50%) 50%, hsl(283,65%,50%) 100%)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="absolute top-5 right-6"><Sparkles size={32} className="text-white/20" /></div>

          <div className="relative z-10">
            <p className="text-center text-white/50 text-[11px] font-semibold mb-10 tracking-[0.25em] uppercase font-fira">
              Our Numbers Speak For Themselves
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {STATS.map((s, i) => (
                <div key={i}
                  className={`transition-all duration-700 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${i * 0.12}s` }}>
                  <div className="font-sora font-black text-[3rem] sm:text-[3.5rem] leading-none">{s.n}</div>
                  <div className="text-white/50 text-[11px] font-semibold mt-2 uppercase tracking-wider">{s.l}</div>
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
