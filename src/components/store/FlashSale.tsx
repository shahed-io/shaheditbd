import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from './ProductCard';
import { Product } from '@/data/products';
import { Flame, ArrowRight } from 'lucide-react';

const mapDbProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  category: p.categories?.name || 'Other',
  price: Number(p.price),
  originalPrice: p.original_price ? Number(p.original_price) : undefined,
  discount: p.discount_percent || undefined,
  rating: 4.8,
  reviews: Math.floor(Math.random() * 400) + 80,
  image: p.image_url || 'https://placehold.co/300x300/0d1321/3ddc84?text=Product',
  isBestseller: p.is_featured,
  isNew: new Date(p.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
});

const FlashSale = () => {
  const [timeLeft, setTimeLeft] = useState({ h: 5, m: 23, s: 47 });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 };
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
      if (data && data.length > 0) setProducts(data.map(mapDbProduct));
      setLoading(false);
    };
    fetchFlashSale();
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');
  if (!loading && products.length === 0) return null;

  return (
    <section className="py-16 px-4 relative overflow-hidden">
      {/* bg glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, hsla(43,100%,60%,0.04), transparent)' }} />

      <div className="max-w-7xl mx-auto">
        {/* Header bar */}
        <div className="rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ background: 'linear-gradient(135deg, hsla(43,100%,60%,0.06), hsla(158,64%,52%,0.06))', border: '1px solid hsla(43,100%,60%,0.15)' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, hsl(25,100%,55%), hsl(15,100%,50%))' }}>
              <Flame size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Limited Time Offer</p>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
                <span style={{ color: 'hsl(var(--accent))' }}>Flash</span>{' '}
                <span className="text-foreground">Sale</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">Ends in:</span>
            <div className="flex items-center gap-2">
              {[timeLeft.h, timeLeft.m, timeLeft.s].map((val, i) => (
                <>
                  <div key={i} className="timer-box text-sm w-11 h-11 rounded-xl">
                    {pad(val)}
                  </div>
                  {i < 2 && <span className="text-accent font-black text-lg animate-pulse">:</span>}
                </>
              ))}
            </div>
          </div>

          <a href="#" className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
            View All <ArrowRight size={15} />
          </a>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl animate-pulse" style={{ background: 'hsl(var(--muted))' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
