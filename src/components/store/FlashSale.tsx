import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Flame, Timer, ArrowRight, ShoppingCart, Zap } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

interface FlashProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  image_url: string | null;
  delivery_time: string | null;
  short_description: string | null;
}

// Flash sale ends at: midnight 7 days from first load — stored in sessionStorage so it's consistent per session
const getSaleEndTime = (): number => {
  const key = 'flash_sale_end';
  const stored = sessionStorage.getItem(key);
  if (stored) return Number(stored);
  const end = Date.now() + 7 * 24 * 60 * 60 * 1000;
  sessionStorage.setItem(key, String(end));
  return end;
};

const useCountdown = (endTime: number) => {
  const calc = () => {
    const diff = Math.max(0, endTime - Date.now());
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [endTime]);
  return time;
};

const pad = (n: number) => String(n).padStart(2, '0');

const FlashSale = () => {
  const [products, setProducts] = useState<FlashProduct[]>([]);
  const [loading,  setLoading]  = useState(true);
  const endTimeRef = useRef(getSaleEndTime());
  const time = useCountdown(endTimeRef.current);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, slug, price, original_price, discount_percent, image_url, delivery_time, short_description')
          .eq('status', 'active')
          .not('discount_percent', 'is', null)
          .order('discount_percent', { ascending: false })
          .limit(8);
        if (cancelled) return;
        if (error) throw error;
        if (data && data.length > 0) setProducts(data as FlashProduct[]);
      } catch (e) {
        console.error('[FlashSale] load error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (!loading && products.length === 0) return null;

  const TIME_UNITS = [
    { v: pad(time.d), l: 'Days' },
    { v: pad(time.h), l: 'Hrs' },
    { v: pad(time.m), l: 'Min' },
    { v: pad(time.s), l: 'Sec' },
  ];

  return (
    <section className="py-20 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, hsl(15,100%,98%) 0%, hsl(38,100%,97%) 50%, hsl(15,100%,98%) 100%)' }}>

      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsla(15,100%,60%,0.1), transparent)', filter: 'blur(50px)' }} />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsla(38,100%,55%,0.1), transparent)', filter: 'blur(50px)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsla(20,100%,58%,0.05), transparent)', filter: 'blur(60px)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-1.5 rounded-full text-white"
                style={{ background: 'linear-gradient(135deg, hsl(15,100%,55%), hsl(38,100%,50%))' }}>
                <Flame size={13} fill="white" /> Flash Sale
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground tracking-widest uppercase px-3 py-1.5 bg-white rounded-full border border-border shadow-sm">
                LIMITED TIME
              </span>
            </div>
            <h2 className="font-sora font-bold text-3xl sm:text-4xl text-foreground leading-tight">
              Biggest{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(15,100%,55%), hsl(38,100%,50%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Discounts
              </span>
              {' '}Today
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">Top deals sorted by highest savings — grab them before time runs out!</p>
          </div>

          {/* Countdown */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Timer size={13} className="text-orange-500" /> Sale ends in
            </div>
            <div className="flex items-center gap-2">
              {TIME_UNITS.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex flex-col items-center min-w-[52px] bg-white border border-orange-200 rounded-xl px-3 py-2 shadow-sm">
                    <span className="text-xl font-black leading-none text-foreground tabular-nums">{item.v}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground mt-0.5 uppercase tracking-wide">{item.l}</span>
                  </div>
                  {i < TIME_UNITS.length - 1 && (
                    <span className="text-lg font-black text-orange-400 animate-pulse leading-none mb-1">:</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[0,1,2,3,4,5,6,7].map(i => (
              <div key={i} className="rounded-2xl bg-white/60 animate-pulse" style={{ height: '22rem', animationDelay: `${i * 0.07}s` }} />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p, i) => (
                <FlashCard key={p.id} product={p} delay={i * 0.06} onAddToCart={addItem} onNavigate={() => navigate(`/product/${p.slug}`)} />
              ))}
            </div>
            <div className="flex justify-center mt-10">
              <button
                onClick={() => navigate('/shop')}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-base font-bold text-white hover:scale-105 transition-transform duration-200"
                style={{ background: 'linear-gradient(135deg, hsl(15,100%,55%), hsl(38,100%,50%))', boxShadow: '0 8px 24px hsla(20,100%,55%,0.3)' }}>
                View All Deals <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

// Individual Flash Sale Card
interface FlashCardProps {
  product: FlashProduct;
  delay: number;
  onAddToCart: (item: any) => void;
  onNavigate: () => void;
}

const FlashCard = ({ product, delay, onAddToCart, onNavigate }: FlashCardProps) => {
  const savings = product.original_price
    ? Math.round(product.original_price - product.price)
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.original_price ?? undefined,
      image: product.image_url || '',
      quantity: 1,
    });
  };

  return (
    <div
      onClick={onNavigate}
      className="group bg-white rounded-2xl border border-border overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        <img
          src={product.image_url || 'https://placehold.co/300x300/fff5f0/f97316?text=Sale'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Discount Badge */}
        {product.discount_percent && (
          <div className="absolute top-2 left-2 text-white text-[11px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1"
            style={{ background: 'linear-gradient(135deg, hsl(15,100%,55%), hsl(38,100%,50%))' }}>
            <Zap size={10} fill="white" />
            -{product.discount_percent}%
          </div>
        )}
        {/* Quick Add */}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 w-8 h-8 rounded-xl text-white flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{ background: 'linear-gradient(135deg, hsl(15,100%,55%), hsl(38,100%,50%))' }}
          title="Add to cart"
        >
          <ShoppingCart size={14} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-semibold text-sm text-foreground line-clamp-2 leading-tight mb-2 group-hover:text-orange-600 transition-colors">
          {product.name}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-black text-foreground">৳{product.price.toLocaleString()}</span>
          {product.original_price && (
            <span className="text-xs text-muted-foreground line-through">৳{product.original_price.toLocaleString()}</span>
          )}
        </div>

        {savings && (
          <div className="mt-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 rounded-lg px-2 py-0.5 inline-block">
            Save ৳{savings.toLocaleString()}
          </div>
        )}

        {product.delivery_time && (
          <p className="mt-1.5 text-[10px] text-muted-foreground flex items-center gap-1">
            <Zap size={9} className="text-green-500" />
            {product.delivery_time}
          </p>
        )}
      </div>
    </div>
  );
};

export default FlashSale;
