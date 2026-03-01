import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const CATEGORY_ICONS: Record<string, { icon: string; color: string }> = {
  windows: { icon: '🪟', color: 'from-blue-500 to-blue-700' },
  office: { icon: '📊', color: 'from-orange-500 to-red-600' },
  adobe: { icon: '🎨', color: 'from-red-500 to-red-700' },
  antivirus: { icon: '🛡️', color: 'from-green-500 to-emerald-600' },
  software: { icon: '💻', color: 'from-cyan-500 to-blue-600' },
  subscription: { icon: '🔄', color: 'from-purple-500 to-pink-600' },
  vpn: { icon: '🔒', color: 'from-indigo-500 to-purple-600' },
  streaming: { icon: '📺', color: 'from-rose-500 to-pink-600' },
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
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-1">Browse By</p>
            <h2 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Product <span className="gradient-text">Categories</span>
            </h2>
          </div>
          <a href="/shop" className="text-primary text-sm hover:underline flex items-center gap-1">
            View All →
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          {categories.map((cat, i) => {
            const meta = CATEGORY_ICONS[cat.slug] || { icon: '📦', color: 'from-gray-500 to-gray-700' };
            return (
              <a
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="category-card animate-slide-up"
                style={{ animationDelay: `${i * 0.08}s`, animationFillMode: 'both' }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-2xl shadow-lg mb-1`}>
                  {meta.icon}
                </div>
                <span className="text-foreground font-semibold text-sm">{cat.name}</span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;
