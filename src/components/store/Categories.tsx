import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight } from 'lucide-react';

const CATEGORY_META: Record<string, { icon: string; gradient: string }> = {
  windows: { icon: '🪟', gradient: 'from-blue-500/80 to-blue-700/80' },
  office: { icon: '📊', gradient: 'from-orange-400/80 to-red-500/80' },
  adobe: { icon: '🎨', gradient: 'from-red-400/80 to-rose-600/80' },
  antivirus: { icon: '🛡️', gradient: 'from-emerald-400/80 to-teal-600/80' },
  software: { icon: '💻', gradient: 'from-sky-400/80 to-blue-600/80' },
  subscription: { icon: '🔄', gradient: 'from-violet-400/80 to-purple-600/80' },
  vpn: { icon: '🔒', gradient: 'from-indigo-400/80 to-purple-600/80' },
  streaming: { icon: '📺', gradient: 'from-pink-400/80 to-rose-500/80' },
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
    <section className="py-14 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="section-label">
              <span className="inline-block w-5 h-0.5 bg-primary rounded-full" />
              Browse Categories
            </p>
            <h2 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Syne, sans-serif' }}>
              Shop by <span className="gradient-text">Category</span>
            </h2>
          </div>
          <a href="/shop" className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
            View All <ArrowRight size={15} />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((cat, i) => {
            const meta = CATEGORY_META[cat.slug] || { icon: '📦', gradient: 'from-slate-400/80 to-slate-600/80' };
            return (
              <a
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="category-card group animate-slide-up"
                style={{ animationDelay: `${i * 0.06}s`, animationFillMode: 'both' }}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {meta.icon}
                </div>
                <span className="text-foreground/90 font-semibold text-xs text-center leading-tight">{cat.name}</span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;
