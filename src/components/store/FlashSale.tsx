import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from './ProductCard';
import { Product } from '@/data/products';
import { Flame } from 'lucide-react';

const mapDbProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  category: p.categories?.name || 'Other',
  price: Number(p.price),
  originalPrice: p.original_price ? Number(p.original_price) : undefined,
  discount: p.discount_percent || undefined,
  rating: 4.8,
  reviews: Math.floor(Math.random() * 400) + 80,
  image: p.image_url || 'https://placehold.co/300x300/0a1628/00b4d8?text=Product',
  isBestseller: p.is_featured,
  isNew: new Date(p.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
});

const FlashSale = () => {
  const [timeLeft, setTimeLeft] = useState({ d: 6, h: 22, m: 59, s: 59 });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { ...prev, h: prev.h - 1, m: 59, s: 59 };
        if (prev.d > 0) return { d: prev.d - 1, h: 23, m: 59, s: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchFlashSale = async () => {
      const { data } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('status', 'active')
        .contains('tags', ['flash-sale'])
        .order('sort_order', { ascending: true });

      if (data && data.length > 0) {
        setProducts(data.map(mapDbProduct));
      }
      setLoading(false);
    };
    fetchFlashSale();
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-accent/[0.03] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Header - shahedit countdown style */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-full px-5 py-2 mb-4">
            <Flame size={14} className="text-destructive" />
            <span className="text-destructive text-xs font-semibold tracking-[0.2em] uppercase">Flash Sale</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Special Offer <span className="gradient-text">Ends In</span>
          </h2>

          {/* Countdown - shahedit style */}
          <div className="inline-flex items-center gap-3 bg-card/80 border border-border/50 rounded-2xl px-8 py-5">
            {[
              { value: pad(timeLeft.d), label: 'DAYS' },
              { value: pad(timeLeft.h), label: 'HOURS' },
              { value: pad(timeLeft.m), label: 'MINS' },
              { value: pad(timeLeft.s), label: 'SECS' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold gradient-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {item.value}
                  </div>
                  <div className="text-[10px] text-muted-foreground tracking-widest mt-1">{item.label}</div>
                </div>
                {i < 3 && <span className="text-muted-foreground/30 text-2xl font-light">|</span>}
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 bg-card/50 border border-border/30 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} delay={i * 0.08} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FlashSale;
