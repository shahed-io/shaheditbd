import { useState, useEffect } from 'react';
import { ArrowRight, ShoppingBag, Zap, Shield, Clock, Star, ChevronLeft, ChevronRight, Sparkles, TrendingUp, Terminal } from 'lucide-react';
import MatrixRain from './MatrixRain';
import CodeFloaters from './CodeFloaters';

const SLIDES = [
  {
    tag: '🔥 Best Seller',
    title: 'Windows 11',
    titleAccent: 'Pro',
    subtitle: 'Original License Key',
    desc: 'Genuine Microsoft Windows 11 Pro — instant digital delivery to your inbox within minutes.',
    price: '৳599',
    original: '৳9,999',
    off: '94%',
    badge: 'MOST POPULAR',
    accentFrom: 'hsl(243,75%,65%)',
    accentTo: 'hsl(263,70%,62%)',
    glowFrom: 'hsla(243,75%,62%,0.2)',
    glowTo: 'hsla(263,70%,60%,0.12)',
    emoji: '🪟',
    features: ['Lifetime License', 'Instant Delivery', 'All Devices'],
    code: `const product = {
  name: "Windows 11 Pro",
  price: 599, // BDT
  type: "OEM_KEY",
  delivery: "instant",
  genuine: true,
};`,
  },
  {
    tag: '⚡ Flash Deal',
    title: 'Microsoft',
    titleAccent: '365',
    subtitle: 'Personal — 1 Year',
    desc: 'Full Office suite: Word, Excel, PowerPoint, OneDrive 1TB. Premium productivity tools.',
    price: '৳1,999',
    original: '৳16,500',
    off: '88%',
    badge: 'LIMITED TIME',
    accentFrom: 'hsl(15,100%,62%)',
    accentTo: 'hsl(38,100%,58%)',
    glowFrom: 'hsla(15,100%,60%,0.2)',
    glowTo: 'hsla(38,100%,55%,0.12)',
    emoji: '📦',
    features: ['1TB OneDrive', '5 Devices', '1 Year'],
    code: `const product = {
  name: "Microsoft 365",
  price: 1999, // BDT
  type: "SUBSCRIPTION",
  duration: "1_YEAR",
  devices: 5,
};`,
  },
];

const STATS = [
  { label: 'Products',         value: '500+', icon: '🛍️', color: 'hsl(243,75%,65%)' },
  { label: 'Orders Delivered', value: '25K+', icon: '✅', color: 'hsl(158,64%,48%)' },
  { label: 'Happy Customers',  value: '12K+', icon: '😊', color: 'hsl(15,100%,62%)' },
  { label: 'Support Rating',   value: '4.9★', icon: '⭐', color: 'hsl(38,100%,58%)' },
];

// Typewriter hook
const useTypewriter = (text: string, speed = 28) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(timer); setDone(true); }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayed, done };
};

const HeroBanner = () => {
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState<'in' | 'out'>('in');
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => advance(1), 5500);
    return () => clearInterval(timer);
  }, [active]);

  useEffect(() => {
    const b = setInterval(() => setBlink(v => !v), 530);
    return () => clearInterval(b);
  }, []);

  const advance = (delta: number) => {
    setDir('out');
    setTimeout(() => {
      setActive(p => (p + delta + SLIDES.length) % SLIDES.length);
      setDir('in');
    }, 280);
  };

  const slide = SLIDES[active];
  const { displayed: typedCode } = useTypewriter(slide.code, 22);

  return (
    <section className="relative overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
      {/* ── Matrix Rain background ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <MatrixRain opacity={0.07} speed={0.7} />
      </div>

      {/* ── Floating code snippets ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <CodeFloaters />
      </div>

      {/* Animated bg blobs */}
      <div className="absolute inset-0 pointer-events-none z-[1]">
        <div className="absolute inset-0 transition-all duration-700"
          style={{ background: `radial-gradient(ellipse at 70% 40%, ${slide.glowFrom} 0%, transparent 55%), radial-gradient(ellipse at 20% 75%, ${slide.glowTo} 0%, transparent 50%)` }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] blob opacity-30"
          style={{ background: `radial-gradient(circle, ${slide.accentFrom}18, transparent)` }} />
        {/* Top edge glow line */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${slide.accentFrom}50, ${slide.accentTo}50, transparent)` }} />
      </div>

      {/* ── Binary hex decorators on sides ── */}
      <div className="absolute left-2 top-1/4 bottom-1/4 flex flex-col justify-around pointer-events-none z-[2] hidden xl:flex">
        {['0xFF', '0x4B', '0xA9', '0x2D', '0x71'].map((h, i) => (
          <span key={i} className="font-fira text-[10px] writing-vertical"
            style={{ color: `hsla(185,90%,62%,${0.08 + i * 0.02})`, letterSpacing: '0.15em' }}>
            {h}
          </span>
        ))}
      </div>
      <div className="absolute right-2 top-1/4 bottom-1/4 flex flex-col justify-around pointer-events-none z-[2] hidden xl:flex">
        {['01', '10', '11', '00', '01'].map((b, i) => (
          <span key={i} className="font-fira text-[10px]"
            style={{ color: `hsla(271,91%,65%,${0.08 + i * 0.02})` }}>
            {b}
          </span>
        ))}
      </div>

      <div className="relative z-[3] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 lg:pt-20 lg:pb-14">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

          {/* Left Content */}
          <div className="space-y-7"
            style={{
              opacity:    dir === 'in' ? 1 : 0,
              transform:  dir === 'in' ? 'none' : 'translateY(12px)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}>

            {/* Terminal prompt badge */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg font-fira"
                style={{ background: 'hsla(215,28%,8%,0.9)', border: '1px solid hsla(185,90%,52%,0.35)', color: 'hsl(185,90%,62%)' }}>
                <Terminal size={10} />
                <span style={{ color: 'hsla(158,80%,58%,0.8)' }}>~/shahed-store</span>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>$</span>
                <span> run deal.sh</span>
                <span className="inline-block w-2 h-3.5 ml-0.5 rounded-sm"
                  style={{ background: blink ? 'hsl(185,90%,62%)' : 'transparent', transition: 'background 0.1s' }} />
              </span>
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-4 py-1.5 rounded-full text-white"
                style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`, boxShadow: `0 4px 16px ${slide.accentFrom}50` }}>
                {slide.tag}
              </span>
            </div>

            {/* Title with glitch */}
            <div>
              <div className="font-fira text-xs mb-2 flex items-center gap-2"
                style={{ color: 'hsla(271,91%,65%,0.5)' }}>
                <span>{'// featured_product.tsx'}</span>
              </div>
              <h1 className="font-sora font-black leading-[1.04] tracking-tight text-foreground hero-glitch-title"
                style={{ fontSize: 'clamp(2.8rem, 6vw, 4.5rem)' }}
                data-text={`${slide.title} ${slide.titleAccent}`}>
                {slide.title}{' '}
                <span className="gradient-text-slide" style={{ ['--g-from' as any]: slide.accentFrom, ['--g-to' as any]: slide.accentTo } as React.CSSProperties}>
                  {slide.titleAccent}
                </span>
              </h1>
              <p className="font-sora font-semibold text-xl lg:text-2xl mt-2 text-muted-foreground">{slide.subtitle}</p>
            </div>

            <p className="text-[15px] leading-relaxed max-w-md text-muted-foreground">{slide.desc}</p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {slide.features.map(f => (
                <span key={f} className="flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-full"
                  style={{ background: 'hsla(0,0%,100%,0.07)', border: '1px solid hsla(0,0%,100%,0.12)', color: 'hsl(var(--foreground))', backdropFilter: 'blur(8px)' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: slide.accentFrom }} />
                  {f}
                </span>
              ))}
            </div>

            {/* Price */}
            <div className="flex items-end gap-4">
              <span className="font-sora font-black text-foreground" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)' }}>{slide.price}</span>
              <div className="mb-1">
                <div className="text-sm text-muted-foreground line-through">{slide.original}</div>
                <span className="text-[11px] font-bold text-white px-2.5 py-1 rounded-full"
                  style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})` }}>
                  Save {slide.off} OFF
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 px-7 py-4 rounded-2xl text-[14px] font-bold text-white transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`, boxShadow: `0 8px 28px ${slide.accentFrom}55` }}>
                <ShoppingBag size={17} /> Order Now <ArrowRight size={15} />
              </button>
              <a href="/shop"
                className="flex items-center gap-2 px-6 py-4 rounded-2xl text-[14px] font-semibold transition-all hover:scale-[1.02]"
                style={{ background: 'hsla(0,0%,100%,0.06)', border: '1px solid hsla(0,0%,100%,0.12)', color: 'hsl(var(--foreground))', backdropFilter: 'blur(12px)' }}>
                <TrendingUp size={15} /> View All Deals
              </a>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap gap-5 pt-1">
              {[
                { icon: <Zap size={13} />, text: 'Instant Delivery' },
                { icon: <Shield size={13} />, text: '100% Genuine' },
                { icon: <Clock size={13} />, text: '24/7 Support' },
                { icon: <Star size={13} />, text: '4.9★ Rating' },
              ].map(t => (
                <span key={t.text} className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground">
                  <span style={{ color: slide.accentFrom }}>{t.icon}</span>
                  {t.text}
                </span>
              ))}
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative hidden lg:flex items-center justify-center min-h-[440px]">

            {/* Terminal / Code window */}
            <div
              className="relative w-[340px] rounded-[1.5rem] overflow-hidden"
              style={{
                background: 'hsla(215,28%,8%,0.97)',
                border: `1px solid ${slide.accentFrom}40`,
                boxShadow: `0 32px 80px ${slide.accentFrom}30, 0 0 0 1px ${slide.accentFrom}20, inset 0 1px 0 hsla(0,0%,100%,0.07)`,
                opacity:    dir === 'in' ? 1 : 0,
                transform:  dir === 'in' ? 'scale(1)' : 'scale(0.95)',
                transition: 'opacity 0.3s, transform 0.3s',
                backdropFilter: 'blur(20px)',
              }}>

              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b"
                style={{ background: 'hsla(215,28%,11%,0.9)', borderColor: 'hsla(0,0%,100%,0.07)' }}>
                <span className="w-3 h-3 rounded-full" style={{ background: 'hsl(0,75%,60%)' }} />
                <span className="w-3 h-3 rounded-full" style={{ background: 'hsl(38,90%,58%)' }} />
                <span className="w-3 h-3 rounded-full" style={{ background: 'hsl(142,70%,50%)' }} />
                <span className="flex-1 text-center font-fira text-[11px]" style={{ color: 'hsla(210,20%,60%,0.7)' }}>
                  product.ts — shahed-store
                </span>
                <Terminal size={12} style={{ color: 'hsla(185,90%,52%,0.6)' }} />
              </div>

              {/* Line numbers + code */}
              <div className="p-5 font-fira text-[12px] leading-6" style={{ minHeight: '220px' }}>
                {/* Line numbers column */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-end select-none" style={{ color: 'hsla(210,20%,50%,0.4)', minWidth: '16px' }}>
                    {slide.code.split('\n').map((_, i) => (
                      <span key={i}>{i + 1}</span>
                    ))}
                  </div>
                  {/* Code column with typewriter */}
                  <pre className="flex-1 overflow-hidden" style={{ color: 'hsl(var(--foreground))' }}>
                    {typedCode.split('\n').map((line, li) => {
                      // Syntax highlight
                      const highlighted = line
                        .replace(/(const|let|var|return|import|export|async|function|await)/g,
                          '<span style="color:hsl(271,91%,75%);font-weight:600">$1</span>')
                        .replace(/(".*?"|'.*?'|`.*?`)/g,
                          '<span style="color:hsl(158,80%,58%)">$1</span>')
                        .replace(/(\/\/.*)/g,
                          '<span style="color:hsla(210,20%,55%,0.7);font-style:italic">$1</span>')
                        .replace(/(\d+)/g,
                          '<span style="color:hsl(38,100%,65%)">$1</span>')
                        .replace(/(true|false|null)/g,
                          '<span style="color:hsl(185,90%,62%)">$1</span>');
                      return (
                        <div key={li} dangerouslySetInnerHTML={{ __html: highlighted || '&nbsp;' }} />
                      );
                    })}
                    {/* Blinking cursor */}
                    <span className="inline-block w-[2px] h-[1.1em] ml-0.5 align-middle rounded-sm"
                      style={{ background: blink ? slide.accentFrom : 'transparent', transition: 'background 0.1s' }} />
                  </pre>
                </div>
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between px-4 py-2 border-t font-fira text-[10px]"
                style={{ background: `linear-gradient(90deg, ${slide.accentFrom}22, ${slide.accentTo}22)`, borderColor: 'hsla(0,0%,100%,0.07)' }}>
                <span style={{ color: slide.accentFrom }}>● TypeScript</span>
                <span style={{ color: 'hsla(158,80%,58%,0.8)' }}>✓ Compiled</span>
                <span style={{ color: 'hsla(210,20%,60%,0.6)' }}>UTF-8</span>
                <span style={{ color: `${slide.accentTo}` }}>Ln 8, Col 1</span>
              </div>

              {/* Neon corner glow */}
              <div className="absolute -top-px left-8 right-8 h-px pointer-events-none"
                style={{ background: `linear-gradient(90deg, transparent, ${slide.accentFrom}, ${slide.accentTo}, transparent)` }} />
            </div>

            {/* Floating stat cards */}
            {[
              { label: 'Orders Today', value: '248+', icon: '📦', top: '4%',  left: '-18%', right: 'auto', delay: '0s' },
              { label: 'Happy Users',  value: '12K+', icon: '😊', top: '46%', left: 'auto',  right: '-18%', delay: '1.4s' },
              { label: 'Avg Rating',   value: '4.9★', icon: '⭐', top: '82%', left: '-16%', right: 'auto', delay: '2.8s' },
            ].map((card) => (
              <div key={card.label}
                className="absolute glass-white rounded-2xl px-4 py-3 anim-float"
                style={{ top: card.top, left: card.left, right: card.right, animationDelay: card.delay }}>
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{card.icon}</span>
                  <div>
                    <div className="text-[15px] font-sora font-black text-foreground leading-none">{card.value}</div>
                    <div className="text-[10px] text-muted-foreground leading-none mt-0.5 font-medium">{card.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slider Controls */}
        <div className="flex items-center justify-center gap-4 mt-14">
          <button onClick={() => advance(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'hsla(0,0%,100%,0.07)', border: '1px solid hsla(0,0%,100%,0.12)', color: 'hsl(var(--muted-foreground))' }}>
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => { setDir('out'); setTimeout(() => { setActive(i); setDir('in'); }, 280); }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === active ? '28px' : '8px',
                  height: '8px',
                  background: i === active ? slide.accentFrom : 'hsla(0,0%,100%,0.2)',
                  boxShadow: i === active ? `0 0 10px ${slide.accentFrom}80` : 'none',
                }} />
            ))}
          </div>
          <button onClick={() => advance(1)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'hsla(0,0%,100%,0.07)', border: '1px solid hsla(0,0%,100%,0.12)', color: 'hsl(var(--muted-foreground))' }}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-12 pt-12" style={{ borderTop: '1px solid hsla(0,0%,100%,0.07)' }}>
          {STATS.map((s, i) => (
            <div key={s.label} className="group text-center cursor-default">
              <div className="text-3xl mb-2 transition-transform duration-300 group-hover:scale-110">{s.icon}</div>
              <div className="text-[1.7rem] font-sora font-black leading-none gradient-text-slide"
                style={{ ['--g-from' as any]: slide.accentFrom, ['--g-to' as any]: slide.accentTo } as React.CSSProperties}>
                {s.value}
              </div>
              <div className="text-[11px] text-muted-foreground font-semibold mt-1.5 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
