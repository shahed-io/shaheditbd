import { useState, useEffect } from 'react';
import { ArrowRight, Shield, Zap, Star, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import heroBanner from '@/assets/hero-banner.png';

const SLIDES = [
  {
    eyebrow: '// Best Digital Store in Bangladesh',
    title: 'Premium Software\nLicense Keys',
    highlight: 'At Lowest Price',
    sub: 'উইন্ডোজ, অফিস, অ্যাডোবি ও আরও অনেক সফটওয়্যার — বাংলাদেশের সবচেয়ে কম দামে, ১০০% অরিজিনাল।',
    cta1: 'Shop Now',
    cta2: 'Browse Products',
  },
  {
    eyebrow: '// Flash Sale · Limited Time',
    title: 'Office 365\nAll Plans',
    highlight: 'Up to 88% OFF',
    sub: 'মাইক্রোসফটের অফিশিয়াল সাবস্ক্রিপশন — ইনস্ট্যান্ট কি ডেলিভারি, পেমেন্টের পরেই ইমেইলে পাবেন।',
    cta1: 'Grab the Deal',
    cta2: 'All Office Products',
  },
  {
    eyebrow: '// Streaming · Netflix · Spotify',
    title: 'Premium\nSubscriptions',
    highlight: 'Bangladesh Price',
    sub: 'নেটফ্লিক্স, স্পটিফাই, ডিজনি+ — কম খরচে প্রিমিয়াম অ্যাকাউন্ট। ১০০% রিয়েল একাউন্ট।',
    cta1: 'Subscribe Now',
    cta2: 'View All Subs',
  },
];

const TRUST = [
  { icon: <Shield size={14} />, label: '100% Genuine' },
  { icon: <Zap size={14} />,    label: 'Instant Delivery' },
  { icon: <Star size={14} />,   label: '5★ Rated' },
  { icon: <CheckCircle size={14} />, label: 'DBID Certified' },
];

const HeroBanner = () => {
  const [active, setActive] = useState(0);
  const prev = () => setActive(p => (p - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setActive(p => (p + 1) % SLIDES.length);

  useEffect(() => {
    const t = setInterval(next, 5500);
    return () => clearInterval(t);
  }, []);

  const s = SLIDES[active];

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden"
      style={{ paddingTop: '5.5rem' }}>

      {/* Background image */}
      <div className="absolute inset-0">
        <img src={heroBanner} alt="" className="w-full h-full object-cover"
          style={{ opacity: 0.25, filter: 'saturate(0.6) brightness(0.5)' }} />
        {/* strong dark overlay */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(105deg, hsl(0,0%,5%) 45%, hsla(0,0%,5%,0.65) 75%, hsla(0,0%,5%,0.2) 100%)' }} />
        {/* bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-40"
          style={{ background: 'linear-gradient(to top, hsl(0,0%,5%), transparent)' }} />
        {/* decorative grid */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(hsl(38,90%,52%) 1px, transparent 1px), linear-gradient(90deg, hsl(38,90%,52%) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
      </div>

      <div className="relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 w-full py-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left content */}
          <div key={active} className="anim-rise space-y-7">
            <p className="section-eyebrow">{s.eyebrow}</p>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight"
              style={{ fontFamily: 'Syne, sans-serif' }}>
              {s.title.split('\n').map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
              <span className="block" style={{ color: 'var(--gold)' }}>{s.highlight}</span>
            </h1>

            <p className="text-muted-foreground text-lg leading-relaxed max-w-md">{s.sub}</p>

            <div className="flex flex-wrap gap-3">
              <button className="btn-gold flex items-center gap-2 px-8 py-3.5 rounded text-sm">
                {s.cta1} <ArrowRight size={16} />
              </button>
              <button className="btn-outline flex items-center gap-2 px-8 py-3.5 rounded text-sm">
                {s.cta2}
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 pt-1">
              {TRUST.map((t, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm"
                  style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <span style={{ color: 'var(--gold)' }}>{t.icon}</span>
                  {t.label}
                </div>
              ))}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-6 pt-4 border-t"
              style={{ borderColor: 'hsl(var(--border))' }}>
              {[
                { n: '5,000+', l: 'Customers' },
                { n: '500+', l: 'Products' },
                { n: '99.9%', l: 'Satisfaction' },
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-2xl font-extrabold" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--gold)' }}>{s.n}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — floating product showcase */}
          <div className="hidden lg:block relative">
            {/* Big decorative number */}
            <div className="absolute -top-4 -right-4 text-[180px] font-extrabold select-none pointer-events-none"
              style={{ fontFamily: 'Syne, sans-serif', color: 'hsla(38,90%,52%,0.04)', lineHeight: 1 }}>
              {String(active + 1).padStart(2, '0')}
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10">
              {[
                { img: 'https://shahedstore.com.bd/wp-content/uploads/2024/09/generated_image_5998b250-5afb-4d15-bd7a-5202e8a58235-copy-800x800.png', name: 'Windows 11 Pro', price: '৳599', off: '94%' },
                { img: 'https://shahedstore.com.bd/wp-content/uploads/2024/10/Adobe-800x800.jpg', name: 'Adobe CC', price: '৳599', off: '70%' },
                { img: 'https://shahedstore.com.bd/wp-content/uploads/2024/09/NETPLX-2.webp', name: 'Netflix', price: '৳499', off: '81%' },
                { img: 'https://shahedstore.com.bd/wp-content/uploads/2024/09/generated_image_cc7c68b2-1de4-4ea4-9049-45200b0f4174-800x800.webp', name: 'Office 365', price: '৳1,999', off: '88%' },
              ].map((card, i) => (
                <div key={i} className={`rounded-lg overflow-hidden surface-card ${i === 1 ? 'mt-8' : ''} anim-fade-up d-${(i+1)*100}`}
                  style={{ animationFillMode: 'both' }}>
                  <div className="aspect-square overflow-hidden">
                    <img src={card.img} alt={card.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-foreground truncate">{card.name}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="font-bold text-sm" style={{ color: 'var(--gold)', fontFamily: 'Syne, sans-serif' }}>{card.price}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'hsla(358,72%,52%,0.15)', color: 'var(--crimson)', border: '1px solid hsla(358,72%,52%,0.3)' }}>
                        -{card.off}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide controls */}
        <div className="flex items-center gap-4 mt-14">
          <button onClick={prev}
            className="w-10 h-10 rounded flex items-center justify-center border transition-all hover:border-[var(--gold)] hover:text-[var(--gold)]"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => setActive(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  height: '4px',
                  width: i === active ? '2rem' : '0.5rem',
                  backgroundColor: i === active ? 'var(--gold)' : 'hsl(var(--border))',
                }} />
            ))}
          </div>
          <button onClick={next}
            className="w-10 h-10 rounded flex items-center justify-center border transition-all hover:border-[var(--gold)] hover:text-[var(--gold)]"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
            <ChevronRight size={18} />
          </button>
          <span className="ml-auto text-xs text-muted-foreground" style={{ fontFamily: 'DM Mono, monospace' }}>
            {String(active + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
          </span>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
