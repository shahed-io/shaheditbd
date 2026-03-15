import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useReveal } from '@/hooks/useReveal';

interface Particle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
}


const CAT_META: Record<string, { icon: string; glow: string; accent: string }> = {
  'Windows':      { icon: '🪟', glow: 'hsla(210,90%,60%,0.18)', accent: 'hsl(210,90%,60%)' },
  'Office':       { icon: '📦', glow: 'hsla(25,90%,60%,0.18)',  accent: 'hsl(25,90%,60%)' },
  'Software':     { icon: '💻', glow: 'hsla(263,70%,62%,0.18)', accent: 'hsl(263,70%,62%)' },
  'VPN':          { icon: '🔒', glow: 'hsla(190,70%,48%,0.18)', accent: 'hsl(190,70%,48%)' },
  'Subscription': { icon: '🎬', glow: 'hsla(283,65%,62%,0.18)', accent: 'hsl(283,65%,62%)' },
  'Antivirus':    { icon: '🛡️', glow: 'hsla(158,64%,45%,0.18)', accent: 'hsl(158,64%,45%)' },
  'Streaming':    { icon: '📺', glow: 'hsla(0,80%,62%,0.18)',   accent: 'hsl(0,80%,62%)' },
  'default':      { icon: '🛒', glow: 'hsla(243,75%,62%,0.18)', accent: 'hsl(243,75%,62%)' },
};

interface CatData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  count: number;
}

const Categories = () => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [clicked, setClicked] = useState<number | null>(null);
  const [particles, setParticles] = useState<(Particle & { catIdx: number })[]>([]);
  const [cats, setCats] = useState<CatData[]>([]);
  const [loading, setLoading] = useState(true);

  const handleCatClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, i: number, meta: typeof CAT_META[string]) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const colors = [meta.accent, 'hsl(var(--accent))', 'hsl(var(--primary))', '#fff'];
    const newParticles = Array.from({ length: 10 }, (_, j) => {
      const angle = (j / 10) * Math.PI * 2;
      const speed = 48 + Math.random() * 52;
      return {
        id: Date.now() + j,
        x: cx, y: cy,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        color: colors[j % colors.length],
        catIdx: i,
      };
    });
    setParticles(prev => [...prev, ...newParticles]);
    setClicked(i);
    setTimeout(() => setClicked(null), 400);
    setTimeout(() => setParticles(prev => prev.filter(p => p.catIdx !== i || p.id < Date.now() - 700)), 700);
  }, []);
  const { ref: sectionRef, visible: sectionVisible } = useReveal({ threshold: 0.08 });
  const { ref: headerRef, visible: headerVisible } = useReveal({ threshold: 0.1 });

  useEffect(() => {
    const load = async () => {
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name, slug, description, products!products_category_id_fkey(id)')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!categories?.length) { setLoading(false); return; }

      setCats(
        categories
          .map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description,
            count: Array.isArray(c.products) ? c.products.length : 0,
          }))
          .filter(c => c.count > 0)
      );
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <section className="py-20" style={{ background: 'hsl(var(--background))' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl h-44" style={{ background: 'hsla(222,22%,15%,0.6)', animation: 'pulse 2s ease-in-out infinite' }} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="py-20 relative overflow-hidden"
      style={{ background: 'hsl(var(--background))' }}
    >
      {/* Background blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsla(243,75%,62%,0.06), transparent)', filter: 'blur(80px)' }} />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsla(15,100%,60%,0.05), transparent)', filter: 'blur(80px)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <span className="section-label">Browse Store</span>
            <h2 className="section-heading text-3xl sm:text-4xl mt-3 text-foreground">
              Shop by{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(243,75%,65%), hsl(263,70%,62%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Category
              </span>
            </h2>
            <p className="mt-2 text-[14px] max-w-md leading-relaxed text-muted-foreground">
              Premium digital licenses across all major software categories.
            </p>
          </div>
          <a href="/shop" className="inline-flex items-center gap-2 text-sm font-bold hover:gap-3 transition-all flex-shrink-0 group"
            style={{ color: 'hsl(243,75%,65%)' }}>
            View All
            <span className="w-7 h-7 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
              style={{ background: 'hsla(243,75%,62%,0.15)', border: '1px solid hsla(243,75%,62%,0.25)' }}>
              <ArrowRight size={13} className="text-foreground" />
            </span>
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {cats.map((cat, i) => {
            const meta = CAT_META[cat.name] || CAT_META['default'];
            const isHov = hovered === i;
            const isClicked = clicked === i;
            const catParticles = particles.filter(p => p.catIdx === i);
            return (
              <a
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="cat-card p-5 flex flex-col gap-3.5"
                onClick={(e) => handleCatClick(e, i, meta)}
                style={{
                  animationDelay: `${i * 0.06}s`,
                  opacity: sectionVisible ? 1 : 0,
                  transform: sectionVisible
                    ? isClicked ? 'translateY(0) scale(0.95)' : 'translateY(0) scale(1)'
                    : 'translateY(40px) scale(0.96)',
                  transition: isClicked
                    ? 'transform 0.12s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.12s'
                    : `opacity 0.6s cubic-bezier(0.23,1,0.32,1) ${i * 0.07}s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.07}s, box-shadow 0.3s`,
                  boxShadow: isClicked
                    ? `0 0 0 2px ${meta.accent}, 0 0 60px ${meta.glow.replace('0.18','0.6')}, 0 0 120px ${meta.glow.replace('0.18','0.3')}`
                    : isHov
                      ? `0 20px 50px hsla(220,30%,5%,0.5), 0 0 0 1px ${meta.accent}40, 0 0 32px ${meta.glow}`
                      : undefined,
                }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-[1.5rem] pointer-events-none transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse at 30% 30%, ${meta.glow}, transparent 60%)`, opacity: isHov ? 1 : 0 }} />

                {/* Click ripple */}
                {isClicked && (
                  <div className="absolute inset-0 rounded-[1.5rem] pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at center, ${meta.accent}22, transparent 70%)`,
                      animation: 'cat-ripple 0.45s ease-out forwards',
                    }} />
                )}

                {/* Particles */}
                {catParticles.map(p => (
                  <div
                    key={p.id}
                    className="absolute pointer-events-none rounded-full"
                    style={{
                      left: p.x, top: p.y,
                      width: 6, height: 6,
                      background: p.color,
                      boxShadow: `0 0 8px ${p.color}`,
                      '--dx': `${p.dx}px`,
                      '--dy': `${p.dy}px`,
                      animation: 'cat-particle 0.65s ease-out forwards',
                    } as React.CSSProperties}
                  />
                ))}

                <div
                  className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-3xl cat-icon"
                  style={{
                    background: `linear-gradient(135deg, ${meta.glow.replace('0.18', '0.25')}, hsla(222,22%,20%,0.8))`,
                    border: `1px solid ${meta.accent}30`,
                    boxShadow: isHov ? `0 4px 20px ${meta.glow}` : 'none',
                    transform: isClicked ? 'scale(1.25) rotate(-8deg)' : 'scale(1) rotate(0deg)',
                    transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                  }}>
                  {meta.icon}
                </div>

                <div className="relative">
                  <h3 className="font-sora font-bold text-[13px] leading-tight text-foreground">{cat.name}</h3>
                  <p className="text-[11px] mt-1 leading-relaxed text-muted-foreground">{cat.description || 'Digital Licenses'}</p>
                </div>

                <div className="relative flex items-center justify-between mt-auto pt-1">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{
                      background: `${meta.accent}18`,
                      color: meta.accent,
                      border: `1px solid ${meta.accent}30`,
                    }}>
                    {cat.count} items
                  </span>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
                    style={{
                      background: isHov ? `${meta.accent}20` : 'hsla(0,0%,100%,0.06)',
                      border: `1px solid ${isHov ? meta.accent + '40' : 'hsla(0,0%,100%,0.1)'}`,
                      transform: isClicked ? 'rotate(90deg) scale(1.2)' : 'rotate(0deg) scale(1)',
                      transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                    }}>
                    <ArrowRight size={12} style={{ color: isHov || isClicked ? meta.accent : 'hsl(var(--muted-foreground))' }} />
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;
