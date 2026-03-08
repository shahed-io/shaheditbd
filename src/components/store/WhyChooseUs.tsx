import { useEffect, useRef, useState } from 'react';
import { Shield, Zap, Headphones, BadgeCheck, Award, Globe, ChevronRight } from 'lucide-react';

const FEATURES = [
  { icon: <Zap size={18} />,        title: 'Instant Delivery',   desc: 'পেমেন্টের পরেই ইমেইলে কি পাঠানো হয়।',              color: 'var(--cyan)',    n: '01' },
  { icon: <Shield size={18} />,     title: '100% Genuine Keys',  desc: 'সব কি ১০০% অরিজিনাল এবং ভেরিফাইড।',             color: 'var(--purple)',  n: '02' },
  { icon: <Headphones size={18} />, title: '24/7 Support',       desc: 'WhatsApp ও Telegram-এ সার্বক্ষণিক সাপোর্ট।',     color: 'var(--magenta)', n: '03' },
  { icon: <BadgeCheck size={18} />, title: 'Govt. Registered',   desc: 'DBID: 586772174 — সরকার নিবন্ধিত ব্যবসা।',        color: 'hsl(120,80%,50%)', n: '04' },
  { icon: <Award size={18} />,      title: 'Lowest Price BD',    desc: 'বাংলাদেশের সবচেয়ে কম দামে অরিজিনাল সফটওয়্যার।', color: 'var(--orange)',  n: '05' },
  { icon: <Globe size={18} />,      title: '5,000+ Customers',   desc: '২০২০ সাল থেকে ৫০০০+ সন্তুষ্ট গ্রাহক।',           color: 'var(--cyan)',    n: '06' },
];

const STEPS = [
  { n: '01', title: 'প্রোডাক্ট বেছে নিন',   desc: 'আমাদের কালেকশন থেকে পছন্দের সফটওয়্যার বা সাবস্ক্রিপশন সিলেক্ট করুন।', color: 'var(--cyan)' },
  { n: '02', title: 'পেমেন্ট করুন',         desc: 'বিকাশ, নগদ বা রকেটে নিরাপদে পেমেন্ট করুন।', color: 'var(--purple)' },
  { n: '03', title: 'ডেলিভারি পান',         desc: 'মিনিটের মধ্যে ইমেইলে লাইসেন্স কি বা সাবস্ক্রিপশন পাঠানো হবে।', color: 'var(--magenta)' },
  { n: '04', title: 'Activate করুন',        desc: 'প্রোডাক্ট অ্যাক্টিভেট করুন এবং সমস্যায় সাপোর্টে যোগাযোগ করুন।', color: 'var(--orange)' },
];

const STATS = [
  { n: '5,000+', l: 'Customers', suffix: '' },
  { n: '500+',   l: 'Products',  suffix: '' },
  { n: '99.9',   l: 'Uptime',    suffix: '%' },
  { n: '24/7',   l: 'Support',   suffix: '' },
];

const FeatureCard = ({ f, i }: { f: typeof FEATURES[0]; i: number }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="relative rounded-xl p-5 flex gap-4 transition-all duration-300 cursor-default overflow-hidden"
      style={{
        background: hov ? 'hsl(220,15%,10%)' : 'hsl(220,18%,7%)',
        border: `1px solid ${hov ? f.color : 'hsl(var(--border))'}`,
        boxShadow: hov ? `0 0 20px ${f.color}20` : 'none',
        transform: hov ? 'translateY(-2px)' : 'none',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Top glow */}
      <div className="absolute top-0 inset-x-0 h-px transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${f.color}, transparent)`, opacity: hov ? 1 : 0 }} />

      {/* Watermark number */}
      <div className="absolute bottom-1 right-2 text-5xl font-black select-none pointer-events-none leading-none"
        style={{ fontFamily: 'Orbitron, sans-serif', color: `${f.color}08` }}>
        {f.n}
      </div>

      <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300"
        style={{
          background: hov ? `${f.color}20` : 'hsl(220,15%,12%)',
          border: `1px solid ${hov ? f.color + '60' : 'hsl(var(--border))'}`,
          color: f.color,
          boxShadow: hov ? `0 0 15px ${f.color}30` : 'none',
        }}>
        {f.icon}
      </div>

      <div className="relative z-10">
        <h3 className="font-bold text-sm transition-colors duration-200"
          style={{ color: hov ? f.color : 'hsl(var(--foreground))', fontFamily: 'Orbitron, sans-serif', fontSize: '0.7rem' }}>
          {f.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
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
    <section className="py-24 px-4 sm:px-6 relative overflow-hidden"
      style={{ borderTop: '1px solid hsl(var(--border))' }}>

      <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, hsla(185,100%,50%,0.03) 0%, transparent 70%)' }} />

      <div className="max-w-screen-xl mx-auto relative z-10 space-y-24">

        {/* ── Features ── */}
        <div>
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-3">
              <Shield size={14} style={{ color: 'var(--cyan)' }} />
              <span className="section-tag">// System Advantages</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black section-title">
              <span className="text-foreground">Why</span>
              <span className="gradient-text-cyber ml-3">Choose Us?</span>
            </h2>
            <div className="divider-cyber mt-3" />
            <p className="text-muted-foreground mt-4 max-w-lg text-sm leading-relaxed">
              Bangladesh's most trusted digital software marketplace since 2020.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => <FeatureCard key={i} f={f} i={i} />)}
          </div>
        </div>

        {/* ── How to Order ── */}
        <div>
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-3">
              <ChevronRight size={14} style={{ color: 'var(--purple)' }} />
              <span className="section-tag" style={{ color: 'var(--purple)' }}>// Order_Process</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black section-title">
              <span className="text-foreground">অর্ডার</span>
              <span className="gradient-text-cyber ml-3">Process</span>
            </h2>
            <div className="divider-cyber mt-3" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px"
              style={{ background: 'linear-gradient(90deg, var(--cyan), var(--purple), var(--magenta), var(--orange))', opacity: 0.25, zIndex: 0 }} />

            {STEPS.map((step, i) => (
              <div key={i} className="relative rounded-xl p-6 overflow-hidden cyber-card group z-10">
                {/* Top line */}
                <div className="absolute top-0 inset-x-0 h-0.5"
                  style={{ background: `linear-gradient(90deg, transparent, ${step.color}, transparent)` }} />

                {/* Large watermark */}
                <div className="absolute -bottom-4 -right-2 text-8xl font-black select-none pointer-events-none leading-none"
                  style={{ fontFamily: 'Orbitron, sans-serif', color: `${step.color}06` }}>
                  {step.n}
                </div>

                {/* Step number */}
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 font-black text-sm"
                  style={{
                    background: `${step.color}15`,
                    border: `1px solid ${step.color}40`,
                    color: step.color,
                    fontFamily: 'Orbitron, sans-serif',
                  }}>
                  {step.n}
                </div>

                <h3 className="font-bold text-sm mb-2 relative z-10"
                  style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.7rem', color: 'hsl(var(--foreground))' }}>
                  {step.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed relative z-10">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats ── */}
        <div ref={statsRef}
          className="rounded-2xl p-8 lg:p-12 relative overflow-hidden"
          style={{
            background: 'hsl(220,15%,8%)',
            border: '1px solid hsla(185,100%,50%,0.2)',
            boxShadow: '0 0 60px hsla(185,100%,50%,0.05), inset 0 0 60px hsla(270,80%,60%,0.03)',
          }}>

          {/* BG lines */}
          <div className="absolute inset-0 cyber-grid-dense opacity-30 pointer-events-none" />

          {/* Corner ornaments */}
          {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-6 h-6`}
              style={{
                borderTop:    i < 2 ? '1px solid var(--cyan)' : 'none',
                borderBottom: i >= 2 ? '1px solid var(--cyan)' : 'none',
                borderLeft:   i % 2 === 0 ? '1px solid var(--cyan)' : 'none',
                borderRight:  i % 2 === 1 ? '1px solid var(--cyan)' : 'none',
                opacity: 0.5,
              }} />
          ))}

          <div className="relative z-10">
            <p className="text-center section-tag mb-8">// Live Statistics</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {STATS.map((s, i) => (
                <div key={i} className={`transition-all duration-700 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: `${i * 0.1}s` }}>
                  <div className="text-4xl sm:text-5xl font-black gradient-text-cyber"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {s.n}{s.suffix}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {s.l}
                  </div>
                  <div className="progress-cyber mt-3 mx-auto w-16">
                    <div className="progress-cyber-fill" style={{ width: '100%' }} />
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
