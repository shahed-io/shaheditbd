import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight } from 'lucide-react';

const CATEGORY_META: Record<string, { icon: string; subtitle: string; color: string }> = {
  windows: { icon: '🪟', subtitle: 'Home · Pro · Server', color: 'hsla(210,100%,60%,0.15)' },
  office: { icon: '📊', subtitle: 'Office 365 · Office 2021', color: 'hsla(25,100%,60%,0.15)' },
  adobe: { icon: '🎨', subtitle: 'Photoshop · Premiere · CC', color: 'hsla(0,90%,60%,0.15)' },
  antivirus: { icon: '🛡️', subtitle: 'Norton · Kaspersky · ESET', color: 'hsla(140,80%,50%,0.15)' },
  software: { icon: '💻', subtitle: 'IDM · WinRAR · Tools', color: 'hsla(180,100%,42%,0.15)' },
  subscription: { icon: '🔄', subtitle: 'Spotify · Canva · Zoom', color: 'hsla(265,85%,65%,0.15)' },
  vpn: { icon: '🔒', subtitle: 'NordVPN · ExpressVPN', color: 'hsla(240,90%,65%,0.15)' },
  streaming: { icon: '📺', subtitle: 'Netflix · YouTube · Disney+', color: 'hsla(340,80%,60%,0.15)' },
};

const SectionHeader = ({ badge, title, highlight }: { badge: string; title: string; highlight: string }) => (
  <div className="text-center mb-12">
    <div className="section-badge">
      <span>◈</span>
      <span>{badge}</span>
    </div>
    <h2 className="text-4xl sm:text-5xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
      {title} <span className="gradient-text">{highlight}</span>
    </h2>
    <div className="w-16 h-1 rounded-full mx-auto mt-4" style={{ background: 'var(--gradient-primary)' }} />
  </div>
);

const Categories = () => {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, sort_order')
        .eq('is_active', true)
        .order('sort_order');
      if (data) setCategories(data);
    };
    fetch();
  }, []);

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="orb orb-1 opacity-[0.07]" style={{ top: '-5%', left: '-5%' }} />
      <div className="max-w-7xl mx-auto relative z-10">
        <SectionHeader badge="Our Products" title="Popular" highlight="Categories" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat, i) => {
            const meta = CATEGORY_META[cat.slug] || { icon: '📦', subtitle: 'Digital Products', color: 'hsla(180,100%,42%,0.1)' };
            return (
              <a
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 animate-slide-up relative overflow-hidden"
                style={{
                  animationDelay: `${i * 0.07}s`,
                  animationFillMode: 'both',
                  background: 'hsla(228,28%,11%,0.6)',
                  border: '1px solid hsla(180,100%,42%,0.12)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'hsla(180,100%,42%,0.4)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px hsla(180,100%,42%,0.12)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'hsla(180,100%,42%,0.12)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                {/* Hover bg glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                  style={{ background: 'linear-gradient(135deg, hsla(180,100%,42%,0.05), transparent)' }} />

                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300 relative z-10"
                  style={{ background: meta.color, border: '1px solid hsla(180,100%,42%,0.15)' }}>
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0 relative z-10">
                  <h3 className="font-bold text-sm group-hover:text-primary transition-colors duration-200" style={{ color: 'hsl(var(--foreground))' }}>
                    {cat.name}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{meta.subtitle}</p>
                </div>
                <ArrowRight size={15} className="flex-shrink-0 transition-all duration-200 group-hover:translate-x-1 relative z-10"
                  style={{ color: 'hsla(215,25%,50%,0.5)' }}
                />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export { SectionHeader };
export default Categories;
