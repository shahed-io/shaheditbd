import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ArrowUpRight, Layers } from 'lucide-react';

const CATEGORY_META: Record<string, { icon: string; sub: string; color: string }> = {
  windows:      { icon: '🪟', sub: 'Home · Pro · Server',          color: 'var(--cyan)' },
  office:       { icon: '📊', sub: 'Personal · Family · Business', color: 'var(--purple)' },
  adobe:        { icon: '🎨', sub: 'Photoshop · Premiere · CC',    color: 'var(--magenta)' },
  antivirus:    { icon: '🛡️', sub: 'Norton · Kaspersky · ESET',    color: 'hsl(120,80%,50%)' },
  software:     { icon: '💾', sub: 'IDM · WinRAR · Tools',         color: 'var(--orange)' },
  subscription: { icon: '♾️', sub: 'Spotify · Canva · Zoom',       color: 'hsl(280,80%,60%)' },
  vpn:          { icon: '🔐', sub: 'NordVPN · ExpressVPN',         color: 'hsl(200,90%,55%)' },
  streaming:    { icon: '📺', sub: 'Netflix · YouTube · Disney+',  color: 'hsl(0,85%,60%)' },
};

const Categories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('categories').select('id,name,slug,sort_order').eq('is_active', true).order('sort_order')
      .then(({ data }) => { if (data) setCategories(data); });
  }, []);

  return (
    <section className="py-24 px-4 sm:px-6 relative overflow-hidden"
      style={{ borderTop: '1px solid hsl(var(--border))' }}>

      {/* Background grid accent */}
      <div className="absolute inset-0 cyber-grid-dense opacity-40 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, hsla(185,100%,50%,0.03) 0%, transparent 70%)' }} />

      <div className="max-w-screen-xl mx-auto relative z-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Layers size={14} style={{ color: 'var(--cyan)' }} />
              <span className="section-tag">// Product Categories</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black section-title">
              <span className="text-foreground">Browse</span>
              <span className="gradient-text-cyber ml-3">Categories</span>
            </h2>
            <div className="divider-cyber mt-3" />
          </div>
          <div className="text-sm flex items-center gap-2"
            style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--muted-foreground))' }}>
            <span style={{ color: 'var(--cyan)' }}>[</span>
            {categories.length} modules loaded
            <span style={{ color: 'var(--cyan)' }}>]</span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat, i) => {
            const meta = CATEGORY_META[cat.slug] ?? { icon: '📦', sub: 'Digital Products', color: 'var(--cyan)' };
            const isHovered = hovered === cat.id;

            return (
              <a key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="group relative rounded-xl overflow-hidden flex flex-col gap-4 p-5 transition-all duration-400 cursor-pointer"
                style={{
                  background: isHovered ? 'hsl(220,15%,10%)' : 'hsl(220,18%,7%)',
                  border: `1px solid ${isHovered ? meta.color : 'hsl(var(--border))'}`,
                  boxShadow: isHovered ? `0 0 20px ${meta.color}25, inset 0 0 30px ${meta.color}05` : 'none',
                  transform: isHovered ? 'translateY(-4px)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.23,1,0.32,1)',
                }}
                onMouseEnter={() => setHovered(cat.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Top glow line */}
                <div className="absolute top-0 inset-x-0 h-0.5 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)`,
                    opacity: isHovered ? 1 : 0,
                  }} />

                {/* Corner accent */}
                <div className="absolute bottom-0 right-0 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    borderBottom: `2px solid ${meta.color}`,
                    borderRight: `2px solid ${meta.color}`,
                  }} />

                {/* Index watermark */}
                <div className="absolute top-3 right-3 text-xs font-bold select-none pointer-events-none"
                  style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--border))' }}>
                  {String(i + 1).padStart(2, '0')}
                </div>

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-300"
                  style={{
                    background: isHovered ? `${meta.color}15` : 'hsl(220,15%,12%)',
                    border: `1px solid ${isHovered ? meta.color + '40' : 'hsl(var(--border))'}`,
                  }}>
                  {meta.icon}
                </div>

                <div className="flex-1">
                  <p className="font-bold text-sm leading-tight transition-all duration-200"
                    style={{ color: isHovered ? meta.color : 'hsl(var(--foreground))', fontFamily: 'Inter, sans-serif' }}>
                    {cat.name}
                  </p>
                  <p className="text-xs mt-1 leading-relaxed"
                    style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
                    {meta.sub}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-bold transition-all duration-200 mt-auto"
                  style={{ color: meta.color, opacity: isHovered ? 1 : 0.5, fontFamily: 'JetBrains Mono, monospace' }}>
                  ACCESS <ArrowUpRight size={10} />
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
