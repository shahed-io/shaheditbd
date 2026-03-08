import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ArrowUpRight } from 'lucide-react';

const CATEGORY_META: Record<string, { icon: string; sub: string }> = {
  windows:      { icon: '🪟', sub: 'Home · Pro · Server' },
  office:       { icon: '📊', sub: 'Personal · Family · Business' },
  adobe:        { icon: '🎨', sub: 'Photoshop · Premiere · CC' },
  antivirus:    { icon: '🛡️', sub: 'Norton · Kaspersky · ESET' },
  software:     { icon: '💾', sub: 'IDM · WinRAR · Tools' },
  subscription: { icon: '♻️', sub: 'Spotify · Canva · Zoom' },
  vpn:          { icon: '🔐', sub: 'NordVPN · ExpressVPN' },
  streaming:    { icon: '📺', sub: 'Netflix · YouTube · Disney+' },
};

const Categories = () => {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('categories').select('id,name,slug,sort_order').eq('is_active', true).order('sort_order').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  return (
    <section className="py-20 px-4 sm:px-6"
      style={{ borderTop: '1px solid hsl(var(--border))' }}>
      <div className="max-w-screen-xl mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="section-eyebrow mb-2">// Categories</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ fontFamily: 'Syne, sans-serif' }}>
              Browse by <span style={{ color: 'var(--gold)' }}>Category</span>
            </h2>
            <span className="divider-gold" />
          </div>
          <p className="hidden sm:block text-sm text-muted-foreground">{categories.length} categories available</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map((cat, i) => {
            const meta = CATEGORY_META[cat.slug] ?? { icon: '📦', sub: 'Digital Products' };
            return (
              <a
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="group relative rounded-lg p-5 flex flex-col gap-3 transition-all duration-300 overflow-hidden"
                style={{
                  backgroundColor: 'var(--surface-1)',
                  border: '1px solid hsl(var(--border))',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.borderColor = 'var(--gold)';
                  el.style.boxShadow = '0 0 0 1px var(--gold), inset 0 0 30px hsla(38,90%,52%,0.04)';
                  el.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.borderColor = 'hsl(var(--border))';
                  el.style.boxShadow = 'none';
                  el.style.transform = 'translateY(0)';
                }}
              >
                {/* Index number watermark */}
                <span className="absolute top-3 right-3 text-xs font-bold select-none pointer-events-none"
                  style={{ fontFamily: 'DM Mono, monospace', color: 'hsl(var(--border))' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>

                <span className="text-3xl">{meta.icon}</span>

                <div>
                  <p className="font-bold text-sm text-foreground group-hover:text-[var(--gold)] transition-colors duration-200 leading-tight">
                    {cat.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{meta.sub}</p>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold mt-auto"
                  style={{ color: 'var(--gold)', opacity: 0.6 }}>
                  View all <ArrowUpRight size={12} />
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
