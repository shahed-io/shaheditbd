import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useReveal } from '@/hooks/useReveal';

const CAT_META: Record<string, { icon: string; glow: string; accent: string }> = {
  'Windows':      { icon: '🪟', glow: 'hsla(190,90%,55%,0.22)', accent: 'hsl(190,90%,60%)' },
  'Office':       { icon: '📦', glow: 'hsla(25,90%,60%,0.22)',  accent: 'hsl(25,90%,65%)' },
  'Software':     { icon: '💻', glow: 'hsla(258,78%,62%,0.22)', accent: 'hsl(258,78%,72%)' },
  'VPN':          { icon: '🔒', glow: 'hsla(190,70%,50%,0.22)', accent: 'hsl(190,70%,58%)' },
  'Subscription': { icon: '🎬', glow: 'hsla(283,65%,62%,0.22)', accent: 'hsl(283,65%,72%)' },
  'Antivirus':    { icon: '🛡️', glow: 'hsla(162,72%,48%,0.22)', accent: 'hsl(162,72%,55%)' },
  'Streaming':    { icon: '📺', glow: 'hsla(0,80%,62%,0.22)',   accent: 'hsl(0,80%,68%)' },
  'default':      { icon: '🛒', glow: 'hsla(243,75%,62%,0.22)', accent: 'hsl(243,75%,72%)' },
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
  const [cats, setCats] = useState<CatData[]>([]);
  const [loading, setLoading] = useState(true);
  const { ref: sectionRef, visible: sectionVisible } = useReveal({ threshold: 0.08 });

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
      <section className="py-20" style={{ background: 'transparent' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl h-44 animate-pulse"
                style={{ background: 'hsla(222,30%,14%,0.6)', border: '1px solid hsla(220,60%,80%,0.08)' }} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 relative overflow-hidden bg-transparent">
      {/* Background ambient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsla(258,78%,62%,0.08), transparent)', filter: 'blur(80px)' }} />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsla(190,90%,55%,0.07), transparent)', filter: 'blur(80px)' }} />

      <div ref={sectionRef as React.RefObject<HTMLDivElement>} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <span className="section-label">Browse Store</span>
            <h2 className="section-heading text-3xl sm:text-4xl mt-3">
              Shop by{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(258,78%,72%), hsl(190,90%,60%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Category
              </span>
            </h2>
            <p className="mt-2 text-[14px] max-w-md leading-relaxed text-muted-foreground">
              Premium digital licenses across all major software categories.
            </p>
          </div>
          <a href="/shop" className="inline-flex items-center gap-2 text-sm font-bold hover:gap-3 transition-all flex-shrink-0 group"
            style={{ color: 'hsl(258,78%,72%)' }}>
            View All
            <span className="w-7 h-7 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
              style={{ background: 'hsla(258,78%,62%,0.18)', border: '1px solid hsla(258,78%,62%,0.30)' }}>
              <ArrowRight size={13} style={{ color: 'hsl(258,78%,72%)' }} />
            </span>
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {cats.map((cat, i) => {
            const meta = CAT_META[cat.name] || CAT_META['default'];
            const isHov = hovered === i;
            return (
              <a
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="cat-card p-5 flex flex-col gap-3.5"
                style={{
                  opacity: sectionVisible ? 1 : 0,
                  transform: sectionVisible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.96)',
                  transition: `opacity 0.6s cubic-bezier(0.23,1,0.32,1) ${i * 0.07}s, transform 0.6s cubic-bezier(0.23,1,0.32,1) ${i * 0.07}s`,
                  boxShadow: isHov
                    ? `0 16px 40px hsla(220,30%,3%,0.50), 0 0 0 1px ${meta.accent}45`
                    : undefined,
                }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Glow spot on hover */}
                <div className="absolute inset-0 rounded-[1.5rem] pointer-events-none transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse at 30% 30%, ${meta.glow}, transparent 60%)`, opacity: isHov ? 1 : 0 }} />

                <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-3xl cat-icon"
                  style={{
                    background: `linear-gradient(135deg, ${meta.glow}, transparent)`,
                    border: `1px solid ${meta.accent}45`,
                    backdropFilter: 'blur(8px)',
                  }}>
                  {meta.icon}
                </div>

                <div className="relative">
                  <h3 className="font-sora font-bold text-[13px] leading-tight" style={{ color: 'hsl(220,20%,88%)' }}>{cat.name}</h3>
                  <p className="text-[11px] mt-1 leading-relaxed text-muted-foreground">{cat.description || 'Digital Licenses'}</p>
                </div>

                <div className="relative flex items-center justify-between mt-auto pt-1">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{
                      background: `${meta.accent}18`,
                      color: meta.accent,
                      border: `1px solid ${meta.accent}35`,
                    }}>
                    {cat.count} items
                  </span>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
                    style={{
                      background: isHov ? `${meta.accent}20` : 'hsla(220,25%,18%,0.8)',
                      border: `1px solid ${isHov ? meta.accent + '50' : 'hsla(220,60%,80%,0.10)'}`,
                    }}>
                    <ArrowRight size={12} style={{ color: isHov ? meta.accent : 'hsl(220,20%,52%)' }} />
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
