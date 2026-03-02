import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight } from 'lucide-react';

const CATEGORY_META: Record<string, { icon: string; subtitle: string; gradient: string }> = {
  windows: { icon: '🪟', subtitle: 'Home · Pro · Server', gradient: 'from-blue-500/20 to-blue-600/5' },
  office: { icon: '📊', subtitle: 'Office 365 · Office 2021', gradient: 'from-orange-500/20 to-orange-600/5' },
  adobe: { icon: '🎨', subtitle: 'Photoshop · Premiere · CC', gradient: 'from-red-500/20 to-red-600/5' },
  antivirus: { icon: '🛡️', subtitle: 'Norton · Kaspersky · ESET', gradient: 'from-green-500/20 to-green-600/5' },
  software: { icon: '💻', subtitle: 'IDM · WinRAR · Tools', gradient: 'from-cyan-500/20 to-cyan-600/5' },
  subscription: { icon: '🔄', subtitle: 'Spotify · Canva · Zoom', gradient: 'from-purple-500/20 to-purple-600/5' },
  vpn: { icon: '🔒', subtitle: 'NordVPN · ExpressVPN', gradient: 'from-indigo-500/20 to-indigo-600/5' },
  streaming: { icon: '📺', subtitle: 'Netflix · YouTube · Disney+', gradient: 'from-rose-500/20 to-rose-600/5' },
};

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
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section header - shahedit style */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-4">
            <span className="text-primary text-sm">◈</span>
            <span className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">Our Products</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Popular <span className="gradient-text">Categories</span>
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-4" />
        </div>

        {/* Category grid - shahedit style horizontal cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat, i) => {
            const meta = CATEGORY_META[cat.slug] || { icon: '📦', subtitle: 'Digital Products', gradient: 'from-gray-500/20 to-gray-600/5' };
            return (
              <a
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="group flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card/50 hover:border-primary/40 hover:bg-card/80 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${i * 0.08}s`, animationFillMode: 'both' }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.gradient} border border-border/40 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{cat.name}</h3>
                  <p className="text-muted-foreground text-xs mt-0.5">{meta.subtitle}</p>
                </div>
                <ArrowRight size={16} className="text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;
