import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const CAT_META: Record<string, { icon: string; gradient: string; iconBg: string; borderColor: string }> = {
  'Windows':      { icon: '🪟', gradient: 'from-blue-50 to-sky-50',    iconBg: 'bg-blue-100',    borderColor: 'border-blue-200/80' },
  'Office':       { icon: '📦', gradient: 'from-orange-50 to-amber-50', iconBg: 'bg-orange-100',  borderColor: 'border-orange-200/80' },
  'Software':     { icon: '💻', gradient: 'from-violet-50 to-purple-50',iconBg: 'bg-violet-100',  borderColor: 'border-violet-200/80' },
  'VPN':          { icon: '🔒', gradient: 'from-cyan-50 to-teal-50',    iconBg: 'bg-cyan-100',    borderColor: 'border-cyan-200/80' },
  'Subscription': { icon: '🎬', gradient: 'from-purple-50 to-fuchsia-50',iconBg:'bg-purple-100',  borderColor: 'border-purple-200/80' },
  'Antivirus':    { icon: '🛡️', gradient: 'from-green-50 to-emerald-50',iconBg: 'bg-green-100',  borderColor: 'border-green-200/80' },
  'Streaming':    { icon: '📺', gradient: 'from-red-50 to-rose-50',      iconBg: 'bg-red-100',    borderColor: 'border-red-200/80' },
  'default':      { icon: '🛒', gradient: 'from-gray-50 to-slate-50',    iconBg: 'bg-gray-100',   borderColor: 'border-gray-200/80' },
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
      <section className="py-20 bg-surface-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl shimmer h-44" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20" style={{ background: 'hsl(230, 25%, 97%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <span className="section-label">Browse Store</span>
            <h2 className="section-heading text-3xl sm:text-4xl mt-3">
              Shop by{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Category
              </span>
            </h2>
            <p className="text-muted-foreground mt-2 text-[14px] max-w-md leading-relaxed">
              Premium digital licenses across all major software categories — all at unbeatable prices.
            </p>
          </div>
          <a href="/shop" className="inline-flex items-center gap-2 text-sm font-bold text-brand-indigo hover:gap-3 transition-all flex-shrink-0 group">
            View All
            <span className="w-7 h-7 rounded-full bg-white border border-border/70 flex items-center justify-center shadow-soft group-hover:shadow-medium transition-all">
              <ArrowRight size={13} />
            </span>
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {cats.map((cat, i) => {
            const meta = CAT_META[cat.name] || CAT_META['default'];
            return (
              <a
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className={`cat-card p-5 flex flex-col gap-3.5 bg-gradient-to-br ${meta.gradient} border-2 ${meta.borderColor} anim-rise`}
                style={{ animationDelay: `${i * 0.06}s` }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl cat-icon ${meta.iconBg} shadow-soft border border-white/80`}>
                  {meta.icon}
                </div>
                <div>
                  <h3 className="font-sora font-bold text-[13px] text-foreground leading-tight">{cat.name}</h3>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{cat.description || 'Digital Licenses'}</p>
                </div>
                <div className="flex items-center justify-between mt-auto pt-1">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/80 border border-white/60 text-foreground shadow-soft">
                    {cat.count} items
                  </span>
                  <div className={`w-7 h-7 rounded-full bg-white/80 border border-white/60 flex items-center justify-center shadow-soft transition-all duration-200 ${hovered === i ? 'translate-x-0.5 bg-white' : ''}`}>
                    <ArrowRight size={12} className="text-muted-foreground" />
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
