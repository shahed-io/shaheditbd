import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Shield, Zap, Star, ChevronRight, Cpu, Globe, Lock } from 'lucide-react';
import heroBanner from '@/assets/hero-banner.png';

const SLIDES = [
  {
    tag: '> SYSTEM_BOOT :: DIGITAL_STORE_v2.0',
    title: 'Next-Gen',
    titleHL: 'Software Hub',
    sub: 'বাংলাদেশের সবচেয়ে অ্যাডভান্সড ডিজিটাল সফটওয়্যার স্টোর। অরিজিনাল লাইসেন্স, ইনস্ট্যান্ট ডেলিভারি।',
    cta: 'Explore Products',
    tag2: 'Flash Sale Active',
  },
  {
    tag: '> MODULE :: MICROSOFT_SUITE',
    title: 'Windows &',
    titleHL: 'Office 365',
    sub: 'মাইক্রোসফটের সকল প্রোডাক্ট — সর্বনিম্ন মূল্যে। ৯৪% পর্যন্ত ছাড়! ইনস্ট্যান্ট কি ডেলিভারি।',
    cta: 'View Microsoft',
    tag2: 'Up to 94% OFF',
  },
  {
    tag: '> MODULE :: STREAMING_ACCESS',
    title: 'Premium',
    titleHL: 'Subscriptions',
    sub: 'Netflix, Spotify, Adobe CC, Disney+ — সব একটাই স্টোরে। বাংলাদেশ প্রাইসে।',
    cta: 'Shop Subscriptions',
    tag2: '100% Genuine',
  },
];

const FLOATING_PRODUCTS = [
  { name: 'Windows 11 Pro', price: '৳599', off: '-94%', color: 'var(--cyan)', img: 'https://shahedstore.com.bd/wp-content/uploads/2024/09/generated_image_5998b250-5afb-4d15-bd7a-5202e8a58235-copy-800x800.png' },
  { name: 'Adobe CC', price: '৳599', off: '-70%', color: 'var(--purple)', img: 'https://shahedstore.com.bd/wp-content/uploads/2024/10/Adobe-800x800.jpg' },
  { name: 'Netflix Premium', price: '৳499', off: '-81%', color: 'var(--magenta)', img: 'https://shahedstore.com.bd/wp-content/uploads/2024/09/NETPLX-2.webp' },
  { name: 'Office 365', price: '৳1,999', off: '-88%', color: 'var(--orange)', img: 'https://shahedstore.com.bd/wp-content/uploads/2024/09/generated_image_cc7c68b2-1de4-4ea4-9049-45200b0f4174-800x800.webp' },
];

const STATS = [
  { n: '5,000+', l: 'Customers', icon: <Globe size={14} /> },
  { n: '500+',   l: 'Products',  icon: <Cpu size={14} /> },
  { n: '99.9%',  l: 'Uptime',    icon: <Zap size={14} /> },
  { n: 'DBID',   l: 'Certified', icon: <Lock size={14} /> },
];

const HeroBanner = () => {
  const [active, setActive] = useState(0);
  const [typed, setTyped] = useState('');
  const [typingDone, setTypingDone] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const goNext = () => setActive(p => (p + 1) % SLIDES.length);

  // Auto-advance slides
  useEffect(() => {
    const t = setInterval(goNext, 6000);
    return () => clearInterval(t);
  }, []);

  // Typewriter effect
  useEffect(() => {
    setTyped('');
    setTypingDone(false);
    const text = SLIDES[active].tag;
    let i = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (i < text.length) {
        setTyped(text.slice(0, ++i));
      } else {
        setTypingDone(true);
        clearInterval(intervalRef.current!);
      }
    }, 30);
    return () => clearInterval(intervalRef.current!);
  }, [active]);

  const s = SLIDES[active];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden cyber-grid"
      style={{ paddingTop: '5.5rem' }}>

      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute anim-orb"
          style={{
            width: '600px', height: '600px',
            top: '-200px', left: '-100px',
            background: 'radial-gradient(circle, hsla(185,100%,50%,0.06) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
        <div className="absolute anim-orb d-300"
          style={{
            width: '500px', height: '500px',
            bottom: '-150px', right: '-50px',
            background: 'radial-gradient(circle, hsla(270,80%,60%,0.06) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
        <div className="absolute anim-orb d-150"
          style={{
            width: '300px', height: '300px',
            top: '30%', right: '25%',
            background: 'radial-gradient(circle, hsla(320,90%,60%,0.04) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
      </div>

      {/* Hero background image overlay */}
      <div className="absolute inset-0">
        <img src={heroBanner} alt="" className="w-full h-full object-cover"
          style={{ opacity: 0.08, filter: 'saturate(0) brightness(0.5)' }} />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, hsl(220,20%,4%) 0%, hsla(220,20%,4%,0.8) 60%, hsla(220,20%,4%,0.4) 100%)' }} />
        {/* Scan line overlay */}
        <div className="scan-overlay opacity-30" />
      </div>

      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-48 pointer-events-none"
        style={{ background: 'linear-gradient(to top, hsl(220,20%,4%), transparent)' }} />

      <div className="relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 w-full py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── Left content ── */}
          <div className="space-y-8">

            {/* Typewriter tag */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full anim-neon" style={{ background: 'var(--cyan)' }} />
              <code className="text-xs"
                style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--cyan)', opacity: 0.8 }}>
                {typed}{!typingDone && <span className="opacity-75 animate-pulse">█</span>}
              </code>
            </div>

            {/* Main heading */}
            <div key={active} className="anim-rise space-y-2">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-none section-title">
                <span className="block text-foreground">{s.title}</span>
                <span className="block gradient-text-cyber mt-1">{s.titleHL}</span>
              </h1>

              {/* Decorative line */}
              <div className="flex items-center gap-3 pt-2">
                <div className="h-px flex-1 max-w-[80px]"
                  style={{ background: 'linear-gradient(90deg, var(--cyan), transparent)' }} />
                <div className="badge-cyber">{s.tag2}</div>
                <div className="h-px flex-1 max-w-[80px]"
                  style={{ background: 'linear-gradient(90deg, transparent, var(--purple))' }} />
              </div>
            </div>

            <p className="text-muted-foreground text-base leading-relaxed max-w-lg" key={`sub-${active}`}>
              {s.sub}
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3">
              <button className="btn-cyber flex items-center gap-2 px-8 py-3.5 rounded-xl">
                {s.cta} <ArrowRight size={15} />
              </button>
              <a href="https://wa.me/8801840099853" target="_blank" rel="noopener noreferrer"
                className="btn-cyber-outline flex items-center gap-2 px-8 py-3.5 rounded-xl">
                WhatsApp Order
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3 pt-2">
              {[
                { icon: <Shield size={12} />, l: '100% Genuine' },
                { icon: <Zap size={12} />,    l: 'Instant Delivery' },
                { icon: <Star size={12} />,   l: '5★ Rating' },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: 'var(--surface-2)', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                  <span style={{ color: 'var(--cyan)' }}>{t.icon}</span>
                  {t.l}
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 pt-4 border-t"
              style={{ borderColor: 'hsl(var(--border))' }}>
              {STATS.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1" style={{ color: 'var(--cyan)' }}>
                    {stat.icon}
                  </div>
                  <div className="text-lg font-black gradient-text-cyber" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {stat.n}
                  </div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {stat.l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right — Product Cards ── */}
          <div className="hidden lg:block relative">
            {/* Big watermark */}
            <div className="absolute -top-8 -right-4 select-none pointer-events-none"
              style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '200px', fontWeight: 900, lineHeight: 1, color: 'hsla(185,100%,50%,0.025)' }}>
              {String(active + 1).padStart(2, '0')}
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10">
              {FLOATING_PRODUCTS.map((card, i) => (
                <div key={i}
                  className={`product-card rounded-xl overflow-hidden anim-rise d-${(i + 1) * 100} ${i === 1 ? 'mt-8' : ''}`}
                  style={{ animationFillMode: 'both' }}>
                  {/* Glowing top border */}
                  <div className="h-0.5 w-full"
                    style={{ background: `linear-gradient(90deg, transparent, ${card.color}, transparent)` }} />

                  <div className="relative overflow-hidden aspect-square bg-surface-2">
                    <img src={card.img} alt={card.name}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                    {/* Overlay */}
                    <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `radial-gradient(circle at center, ${card.color}15, transparent)` }} />
                    {/* Discount badge */}
                    <div className="absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-black"
                      style={{ background: card.color, color: 'hsl(220,20%,4%)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {card.off}
                    </div>
                  </div>

                  <div className="p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-foreground truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {card.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm gradient-text-cyber" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        {card.price}
                      </span>
                      <button className="text-[9px] px-2 py-1 rounded"
                        style={{ background: `${card.color}20`, border: `1px solid ${card.color}40`, color: card.color, fontFamily: 'JetBrains Mono, monospace' }}>
                        ORDER →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 anim-float px-4 py-2 rounded-xl text-xs flex items-center gap-2"
              style={{
                background: 'var(--surface-glass)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--cyan-border)',
                color: 'var(--cyan)',
                fontFamily: 'JetBrains Mono, monospace',
                boxShadow: 'var(--cyan-glow)',
              }}>
              <Zap size={12} fill="currentColor" /> Flash Sale · Ends Soon
            </div>
          </div>
        </div>

        {/* ── Slide indicators ── */}
        <div className="flex items-center gap-4 mt-20">
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => setActive(i)}
                className="relative rounded-full transition-all duration-500 overflow-hidden"
                style={{
                  height: '3px',
                  width: i === active ? '3rem' : '0.5rem',
                  background: i === active ? 'linear-gradient(90deg, var(--cyan), var(--purple))' : 'hsl(var(--border))',
                }}>
                {i === active && (
                  <div className="absolute inset-0 rounded-full animate-pulse"
                    style={{ background: 'linear-gradient(90deg, var(--cyan), var(--purple))' }} />
                )}
              </button>
            ))}
          </div>
          <span className="ml-4 text-[10px]"
            style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--muted-foreground))' }}>
            {String(active + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
          </span>
          <button onClick={goNext}
            className="ml-auto flex items-center gap-2 text-xs transition-all hover:gap-3"
            style={{ color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace' }}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
