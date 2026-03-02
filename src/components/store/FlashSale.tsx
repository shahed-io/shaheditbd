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
    <section className="py-16 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="orb orb-1 opacity-8" style={{ bottom: '-20%', left: '-5%' }} />

      <div className="max-w-7xl mx-auto">
        <div className="glass-card rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
              <Flame size={28} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Limited Time</p>
              <h2 className="text-3xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                <span className="text-orange-400">Flash</span>{' '}
                <span className="gradient-text">Sale</span>
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">Ends in:</span>
            <div className="flex items-center gap-2">
              <div className="timer-box">{pad(timeLeft.h)}</div>
              <span className="text-primary font-bold text-xl animate-pulse">:</span>
              <div className="timer-box">{pad(timeLeft.m)}</div>
              <span className="text-primary font-bold text-xl animate-pulse">:</span>
              <div className="timer-box">{pad(timeLeft.s)}</div>
            </div>
            <div className="flex flex-col text-[10px] text-muted-foreground">
              <span>HRS</span>
              <span className="ml-[18px]">MIN</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 glass-card rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
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
