import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const CAT_META: Record<string, { icon: string; accent: string }> = {
  'Windows':       { icon: '🪟', accent: 'hsl(210,90%,55%)' },
  'Office':        { icon: '📦', accent: 'hsl(25,90%,55%)' },
  'Software':      { icon: '💻', accent: 'hsl(263,70%,58%)' },
  'VPN':           { icon: '🔒', accent: 'hsl(190,70%,45%)' },
  'Subscription':  { icon: '🎬', accent: 'hsl(283,65%,55%)' },
  'Antivirus':     { icon: '🛡️', accent: 'hsl(158,64%,42%)' },
  'Streaming':     { icon: '📺', accent: 'hsl(0,80%,55%)' },
  'default':       { icon: '🛒', accent: 'hsl(243,75%,59%)' },
};

interface CatData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  count: number;
}

const Categories = () => {
  const [cats, setCats] = useState<CatData[]>([]);
  const [loading, setLoading] = useState(true);

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
      <section className="py-16" style={{ background: 'hsl(222, 22%, 9%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl shimmer h-36" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16" style={{ background: 'hsl(222, 22%, 9%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <h2 className="font-sora font-black text-2xl sm:text-3xl text-white">
              ⭐ Shop by{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Category
              </span>
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: 'hsla(0,0%,100%,0.4)' }}>
              Premium digital licenses — all at unbeatable prices.
            </p>
          </div>
          <a href="/shop" className="inline-flex items-center gap-2 text-sm font-bold transition-all flex-shrink-0"
            style={{ color: 'hsl(243,75%,70%)' }}>
            View All <ArrowRight size={14} />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {cats.map((cat) => {
            const meta = CAT_META[cat.name] || CAT_META['default'];
            return (
              <a
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="cat-card group p-5 flex flex-col gap-3"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl cat-icon flex-shrink-0"
                  style={{ background: `${meta.accent}20`, border: `1px solid ${meta.accent}30` }}>
                  {meta.icon}
                </div>
                <div>
                  <h3 className="font-sora font-bold text-[13px] text-white leading-tight">{cat.name}</h3>
                  <p className="text-[11px] mt-0.5 leading-relaxed line-clamp-1" style={{ color: 'hsla(0,0%,100%,0.4)' }}>
                    {cat.description || 'Digital Licenses'}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: `${meta.accent}20`, color: meta.accent, border: `1px solid ${meta.accent}25` }}>
                    {cat.count} items
                  </span>
                  <ArrowRight size={13} style={{ color: 'hsla(0,0%,100%,0.3)' }} className="group-hover:translate-x-0.5 transition-transform" />
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
