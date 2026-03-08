import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from './ProductCard';
import { Product } from '@/data/products';
import { Flame, Timer } from 'lucide-react';

const mapProduct = (p: any): Product => ({
  id: p.id, name: p.name, category: p.categories?.name || 'Other',
  price: Number(p.price), originalPrice: p.original_price ? Number(p.original_price) : undefined,
  discount: p.discount_percent || undefined, rating: 4.8,
  reviews: Math.floor(Math.random() * 400) + 80,
  image: p.image_url || 'https://placehold.co/300x300/111/D97706?text=Product',
  isBestseller: p.is_featured,
  isNew: new Date(p.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
});

const FlashSale = () => {
  const [time,     setTime]     = useState({ d: 6, h: 22, m: 59, s: 59 });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setTime(p => {
        if (p.s > 0) return { ...p, s: p.s - 1 };
        if (p.m > 0) return { ...p, m: p.m - 1, s: 59 };
        if (p.h > 0) return { ...p, h: p.h - 1, m: 59, s: 59 };
        if (p.d > 0) return { d: p.d - 1, h: 23, m: 59, s: 59 };
        return p;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    supabase.from('products').select('*, categories(name)').eq('status', 'active')
      .contains('tags', ['flash-sale']).order('sort_order', { ascending: true })
      .then(({ data }) => { if (data?.length) setProducts(data.map(mapProduct)); setLoading(false); });
  }, []);

  if (!loading && !products.length) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section className="py-20 px-4 sm:px-6 relative overflow-hidden"
      style={{ backgroundColor: 'hsl(0,0%,7%)', borderTop: '1px solid hsl(var(--border))', borderBottom: '1px solid hsl(var(--border))' }}>

      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, hsla(38,90%,52%,0.05) 0%, transparent 70%)' }} />

      <div className="max-w-screen-xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Flame size={18} style={{ color: 'var(--crimson)' }} />
              <span className="section-eyebrow" style={{ color: 'var(--crimson)' }}>// Flash Sale · Limited Time</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ fontFamily: 'Syne, sans-serif' }}>
              Special Offer <span style={{ color: 'var(--gold)' }}>Ends In</span>
            </h2>
            <span className="divider-gold" />
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-2">
            <Timer size={16} className="text-muted-foreground hidden sm:block" />
            <div className="flex items-center gap-2">
              {[
                { v: pad(time.d), l: 'Days' },
                { v: pad(time.h), l: 'Hrs' },
                { v: pad(time.m), l: 'Min' },
                { v: pad(time.s), l: 'Sec' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex flex-col items-center justify-center rounded w-16 h-16"
                    style={{ backgroundColor: 'var(--surface-1)', border: '1px solid hsl(var(--border))' }}>
                    <span className="font-extrabold text-xl leading-none" style={{ fontFamily: 'DM Mono, monospace', color: 'var(--gold)' }}>
                      {item.v}
                    </span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{item.l}</span>
                  </div>
                  {i < 3 && <span className="text-muted-foreground/50 font-bold text-lg">:</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Products */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[0,1,2,3].map(i => (
              <div key={i} className="rounded-lg animate-pulse"
                style={{ height: '18rem', backgroundColor: 'var(--surface-1)', border: '1px solid hsl(var(--border))' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p, i) => <ProductCard key={p.id} product={p} delay={i * 0.07} />)}
          </div>
        )}
      </div>
    </section>
  );
};

export default FlashSale;
