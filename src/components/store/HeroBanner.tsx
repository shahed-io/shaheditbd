import { useState, useEffect } from 'react';
import { ArrowRight, ShoppingBag, Zap, Shield, Clock, Star, ChevronLeft, ChevronRight, Sparkles, TrendingUp, Award } from 'lucide-react';

type ComboItem = { icon: string; name: string; tag: string; color: string; highlight?: boolean };
type Slide = {
  tag: string; title: string; titleAccent: string; subtitle: string; desc: string;
  price: string; original: string; off: string; badge: string;
  accentFrom: string; accentTo: string; glowFrom: string; glowTo: string;
  emoji: string; features: string[]; comboSlide: boolean; combo?: ComboItem[];
};

const SLIDES: Slide[] = [
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
    comboSlide: false,
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
    comboSlide: false,
  },
  {
    tag: '🏆 Official Reseller',
    title: 'IDM',
    titleAccent: 'Lifetime',
    subtitle: 'Internet Download Manager — Lifetime License',
    desc: 'আমরা IDM-এর অফিশিয়াল রিসেলার। একবার কিনুন, সারাজীবন ব্যবহার করুন — কোনো বার্ষিক ফি নেই।',
    price: '৳2,650',
    original: '৳6,500',
    off: '59%',
    badge: 'OFFICIAL RESELLER',
    accentFrom: 'hsl(185,80%,45%)',
    accentTo: 'hsl(210,85%,52%)',
    glowFrom: 'hsla(185,80%,45%,0.22)',
    glowTo: 'hsla(210,85%,52%,0.14)',
    emoji: '⚡',
    features: ['Official Reseller ✓', 'Lifetime License', 'Instant Delivery'],
    comboSlide: false,
  },
];

const STATS = [
  { label: 'Products',         value: '500+', icon: '🛍️', color: 'hsl(243,75%,65%)' },
  { label: 'Orders Delivered', value: '25K+', icon: '✅', color: 'hsl(158,64%,48%)' },
  { label: 'Happy Customers',  value: '12K+', icon: '😊', color: 'hsl(15,100%,62%)' },
  { label: 'Support Rating',   value: '4.9★', icon: '⭐', color: 'hsl(38,100%,58%)' },
];

const HeroBanner = () => {
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState<'in' | 'out'>('in');

  useEffect(() => {
    const timer = setInterval(() => advance(1), 5500);
    return () => clearInterval(timer);
  }, [active]);

  const advance = (delta: number) => {
    setDir('out');
    setTimeout(() => {
      setActive(p => (p + delta + SLIDES.length) % SLIDES.length);
      setDir('in');
    }, 280);
  };

  const slide = SLIDES[active] ?? SLIDES[0];

  return (
    <section className="relative overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
      {/* Animated bg blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 transition-all duration-700"
          style={{ background: `radial-gradient(ellipse at 70% 40%, ${slide.glowFrom} 0%, transparent 55%), radial-gradient(ellipse at 20% 75%, ${slide.glowTo} 0%, transparent 50%)` }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] blob opacity-30"
          style={{ background: `radial-gradient(circle, ${slide.accentFrom}18, transparent)` }} />
        <div className="absolute bottom-0 left-[-50px] w-80 h-80 blob opacity-20"
          style={{ background: `radial-gradient(circle, ${slide.accentTo}12, transparent)`, animationDelay: '4s' }} />
        {/* Grid */}
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle, hsla(243,75%,62%,0.06) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        {/* Top edge glow line */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${slide.accentFrom}50, ${slide.accentTo}50, transparent)` }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 lg:pt-20 lg:pb-14">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

          {/* Left Content */}
          <div className="space-y-7"
            style={{
              opacity:    dir === 'in' ? 1 : 0,
              transform:  dir === 'in' ? 'none' : 'translateY(12px)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-4 py-1.5 rounded-full text-white"
                style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`, boxShadow: `0 4px 16px ${slide.accentFrom}50` }}>
                {slide.tag}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full font-fira"
                style={{ background: 'hsla(0,0%,100%,0.07)', border: '1px solid hsla(0,0%,100%,0.12)', color: 'hsl(var(--muted-foreground))' }}>
                {slide.badge}
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="font-sora font-black leading-[1.04] tracking-tight text-foreground" style={{ fontSize: 'clamp(2.8rem, 6vw, 4.5rem)' }}>
                {slide.title}{' '}
                <span className="gradient-text-slide" style={{ ['--g-from' as any]: slide.accentFrom, ['--g-to' as any]: slide.accentTo } as React.CSSProperties}>
                  {slide.titleAccent}
                </span>
              </h1>
              <p className="font-sora font-semibold text-xl lg:text-2xl mt-2 text-muted-foreground">{slide.subtitle}</p>
            </div>

            <p className="text-[15px] leading-relaxed max-w-md text-muted-foreground">{slide.desc}</p>

            {/* Feature pills — glassmorphic */}
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

          {/* Right Visual — Glassmorphism Gradient Border Card */}
          <div className="relative hidden lg:flex items-center justify-center min-h-[440px]">
            {/* Gradient border wrapper */}
            <div
              className="relative w-[300px] anim-float"
              style={{
                opacity:    dir === 'in' ? 1 : 0,
                transform:  dir === 'in' ? 'scale(1)' : 'scale(0.95)',
                transition: 'opacity 0.3s, transform 0.3s',
                borderRadius: '2rem',
                padding: '2px',
                background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo}, ${slide.accentFrom}88)`,
                boxShadow: `0 32px 80px ${slide.accentFrom}40, 0 8px 32px ${slide.accentTo}30`,
              }}>
              {/* Corner glow dots */}
              <div className="absolute top-0 left-0 w-3 h-3 rounded-full -translate-x-0.5 -translate-y-0.5 z-10"
                style={{ background: slide.accentFrom, boxShadow: `0 0 10px 3px ${slide.accentFrom}` }} />
              <div className="absolute top-0 right-0 w-3 h-3 rounded-full translate-x-0.5 -translate-y-0.5 z-10"
                style={{ background: slide.accentTo, boxShadow: `0 0 10px 3px ${slide.accentTo}` }} />
              <div className="absolute bottom-0 left-0 w-3 h-3 rounded-full -translate-x-0.5 translate-y-0.5 z-10"
                style={{ background: slide.accentTo, boxShadow: `0 0 10px 3px ${slide.accentTo}` }} />
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full translate-x-0.5 translate-y-0.5 z-10"
                style={{ background: slide.accentFrom, boxShadow: `0 0 10px 3px ${slide.accentFrom}` }} />

              {/* Frosted glass inner card — accent-tinted */}
              <div className="relative overflow-hidden"
                style={{
                  borderRadius: 'calc(2rem - 2px)',
                  background: `linear-gradient(150deg, ${slide.accentFrom}28 0%, ${slide.accentTo}18 50%, hsla(230,30%,10%,0.88) 100%)`,
                  backdropFilter: 'blur(28px) saturate(200%)',
                }}>
                {/* Strong inner radial glow top-left */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ backgroundImage: `radial-gradient(ellipse at 20% 15%, ${slide.accentFrom}45 0%, transparent 60%)` }} />
                {/* Bottom-right secondary glow */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ backgroundImage: `radial-gradient(ellipse at 85% 90%, ${slide.accentTo}30 0%, transparent 50%)` }} />
                {/* Shimmer line */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px]"
                  style={{ background: `linear-gradient(90deg, transparent, ${slide.accentFrom}cc, ${slide.accentTo}cc, transparent)` }} />
                {/* Bottom shimmer line */}
                <div className="absolute bottom-0 left-0 right-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${slide.accentTo}50, transparent)` }} />
                {/* Dot grid */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ backgroundImage: `radial-gradient(circle, ${slide.accentFrom}12 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />

                <div className="relative p-8">
                  {slide.comboSlide && slide.combo ? (
                    /* Combo Slide Card */
                    <>
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                          <Award size={18} className="text-white" />
                          <span className="text-white font-bold text-[11px] uppercase tracking-widest">Official Bundle</span>
                        </div>
                        <Sparkles size={16} className="anim-spin-slow" style={{ color: `${slide.accentFrom}99` }} />
                      </div>
                      <div className="space-y-2.5 mb-5">
                        {slide.combo.map((item) => (
                          <div key={item.name}
                            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all"
                            style={{
                              background: item.highlight
                                ? `linear-gradient(135deg, ${item.color}25, ${item.color}12)`
                                : 'hsla(0,0%,100%,0.06)',
                              border: item.highlight
                                ? `1px solid ${item.color}60`
                                : '1px solid hsla(0,0%,100%,0.1)',
                              boxShadow: item.highlight ? `0 0 14px ${item.color}25` : 'none',
                            }}>
                            <span className="text-2xl">{item.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-bold text-[13px] leading-tight truncate">{item.name}</div>
                              <div className="text-[10px] mt-0.5 font-semibold" style={{ color: item.color }}>{item.tag}</div>
                            </div>
                            {item.highlight && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full text-white"
                                style={{ background: item.color }}>
                                OFFICIAL
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="pt-4 flex items-center justify-between" style={{ borderTop: `1px solid ${slide.accentFrom}30` }}>
                        <div>
                          <div className="text-white/40 text-xs line-through font-fira">{slide.original}</div>
                          <div className="text-white font-sora font-black text-[2rem] leading-none mt-0.5">{slide.price}</div>
                        </div>
                        <div className="rounded-2xl px-4 py-3 text-center"
                          style={{ background: `linear-gradient(135deg, ${slide.accentFrom}25, ${slide.accentTo}18)`, border: `1px solid ${slide.accentFrom}40` }}>
                          <div className="font-fira font-black text-[1.25rem] leading-none"
                            style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            -{slide.off}
                          </div>
                          <div className="text-[9px] text-white/50 uppercase tracking-wider mt-0.5">OFF</div>
                        </div>
                      </div>
                      <button className="mt-4 w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] hover:brightness-110"
                        style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`, boxShadow: `0 6px 20px ${slide.accentFrom}50` }}>
                        Get Bundle →
                      </button>
                    </>
                  ) : (
                    /* Regular Slide Card */
                    <>
                      <div className="flex items-start justify-between mb-8">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
                          style={{ background: `linear-gradient(135deg, ${slide.accentFrom}30, ${slide.accentTo}20)`, border: `1px solid ${slide.accentFrom}50`, boxShadow: `0 4px 16px ${slide.accentFrom}30` }}>
                          {slide.emoji}
                        </div>
                        <Sparkles size={18} className="anim-spin-slow mt-1" style={{ color: `${slide.accentFrom}80` }} />
                      </div>
                      <div className="text-[10px] font-fira uppercase tracking-[0.2em] mb-2"
                        style={{ color: `${slide.accentFrom}cc` }}>Featured Deal</div>
                      <div className="text-white font-sora font-black text-[22px] leading-tight">{slide.title} {slide.titleAccent}</div>
                      <div className="text-white/70 text-sm mt-1 font-medium">{slide.subtitle}</div>
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {slide.features.map(f => (
                          <span key={f} className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                            style={{ background: `${slide.accentFrom}18`, border: `1px solid ${slide.accentFrom}40`, color: 'rgba(255,255,255,0.85)' }}>{f}</span>
                        ))}
                      </div>
                      <div className="mt-6 pt-5 flex items-center justify-between" style={{ borderTop: `1px solid ${slide.accentFrom}25` }}>
                        <div>
                          <div className="text-white/40 text-xs line-through font-fira">{slide.original}</div>
                          <div className="text-white font-sora font-black text-[2rem] leading-none mt-0.5">{slide.price}</div>
                        </div>
                        <div className="rounded-2xl px-4 py-3 text-center"
                          style={{ background: `linear-gradient(135deg, ${slide.accentFrom}25, ${slide.accentTo}18)`, border: `1px solid ${slide.accentFrom}40` }}>
                          <div className="font-fira font-black text-[1.25rem] leading-none"
                            style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            -{slide.off}
                          </div>
                          <div className="text-[9px] text-white/50 uppercase tracking-wider mt-0.5">OFF</div>
                        </div>
                      </div>
                      <button className="mt-5 w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] hover:brightness-110"
                        style={{ background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`, boxShadow: `0 6px 20px ${slide.accentFrom}50` }}>
                        Order Now →
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Floating stat cards — glassmorphic */}
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
