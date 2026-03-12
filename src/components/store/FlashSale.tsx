import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Flame, Timer, ArrowRight, ShoppingCart, Zap, TrendingDown } from 'lucide-react';
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
    <section className="py-16 relative overflow-hidden" style={{ background: 'hsl(222, 22%, 8%)' }}>
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(15,100%,60%,0.08), transparent)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(38,100%,55%,0.06), transparent)', filter: 'blur(60px)' }} />
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle, hsla(0,0%,100%,0.025) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-4 py-1.5 rounded-full text-white"
                style={{ background: 'linear-gradient(135deg, hsl(15,100%,55%), hsl(38,100%,50%))' }}>
                <Flame size={13} fill="white" /> Flash Sale
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full font-fira"
                style={{ background: 'hsla(0,0%,100%,0.08)', border: '1px solid hsla(0,0%,100%,0.12)', color: 'hsla(0,0%,100%,0.45)' }}>
                LIMITED TIME
              </span>
            </div>
            <h2 className="font-sora font-black text-white leading-tight" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}>
              Biggest{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(15,100%,55%), hsl(38,100%,50%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Discounts
              </span>{' '}
              Today
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: 'hsla(0,0%,100%,0.4)' }}>Top deals sorted by highest savings — grab them before time runs out!</p>
          </div>

          {/* Countdown */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: 'hsla(0,0%,100%,0.4)' }}>
              <Timer size={13} className="text-orange-400" /> Sale ends in:
            </div>
            <div className="flex items-center gap-2">
              {TIME_UNITS.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex flex-col items-center min-w-[50px] rounded-xl px-3 py-2"
                    style={{ background: 'hsla(0,0%,100%,0.07)', border: '1px solid hsla(15,100%,60%,0.25)' }}>
                    <span className="text-[1.4rem] font-fira font-black leading-none text-white tabular-nums">{item.v}</span>
                    <span className="text-[9px] font-bold mt-1 uppercase tracking-wider" style={{ color: 'hsla(0,0%,100%,0.4)' }}>{item.l}</span>
                  </div>
                  {i < TIME_UNITS.length - 1 && (
                    <span className="text-xl font-black animate-pulse leading-none mb-1" style={{ color: 'hsl(15,100%,60%)' }}>:</span>
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
              <div key={i} className="rounded-xl shimmer" style={{ height: '22rem', animationDelay: `${i * 0.07}s` }} />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p, i) => (
                <FlashCard key={p.id} product={p} delay={i * 0.06}
                  onAddToCart={addToCart}
                  onNavigate={() => navigate(`/product/${p.slug}`)} />
              ))}
            </div>
            <div className="flex justify-center mt-10">
              <button
                onClick={() => navigate('/shop')}
                className="flex items-center gap-2.5 px-8 py-4 rounded-xl text-[14px] font-bold text-white hover:opacity-90 transition-all"
                style={{ background: 'linear-gradient(135deg, hsl(15,100%,55%), hsl(38,100%,50%)', boxShadow: '0 8px 24px hsla(20,100%,55%,0.3)' }}>
                <TrendingDown size={16} /> View All Deals <ArrowRight size={15} />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

interface FlashCardProps {
  product: FlashProduct;
  delay: number;
  onAddToCart: (item: any) => void;
  onNavigate: () => void;
}

const FlashCard = ({ product, delay, onAddToCart, onNavigate }: FlashCardProps) => {
  const [hovered, setHovered] = useState(false);
  const savings = product.original_price ? Math.round(product.original_price - product.price) : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.original_price ?? undefined,
      image: product.image_url || '',
      category: 'Flash Sale',
    });
  };

  return (
    <div
      onClick={onNavigate}
      className="rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
      style={{
        background: 'hsl(222,22%,13%)',
        border: hovered ? '1px solid hsla(15,100%,60%,0.3)' : '1px solid hsla(0,0%,100%,0.07)',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? '0 16px 40px hsla(220,30%,3%,0.4)' : '0 2px 12px hsla(220,30%,3%,0.2)',
        transition: 'all 0.3s cubic-bezier(0.23,1,0.32,1)',
        animationDelay: `${delay}s`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden" style={{ background: 'hsl(222,22%,11%)' }}>
        <img
          src={product.image_url || 'https://placehold.co/300x300/1e2030/f97316?text=Sale'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500"
          style={{ transform: hovered ? 'scale(1.06)' : 'scale(1)' }}
          loading="lazy"
        />
        {/* Discount Badge */}
        {product.discount_percent && (
          <div className="absolute top-2.5 left-2.5 text-white text-[11px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1"
            style={{ background: 'linear-gradient(135deg, hsl(15,100%,55%), hsl(38,100%,50%))' }}>
            <Zap size={10} fill="white" />
            -{product.discount_percent}%
          </div>
        )}
        {/* Quick Add */}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-lg text-white flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{
            background: 'linear-gradient(135deg, hsl(15,100%,55%), hsl(38,100%,50%))',
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0)' : 'translateY(4px)',
          }}
        >
          <ShoppingCart size={15} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <p className="font-semibold text-[13px] line-clamp-2 leading-snug mb-2"
          style={{ color: hovered ? 'hsl(15,100%,65%)' : 'hsla(0,0%,100%,0.82)' }}>
          {product.name}
        </p>

        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[17px] font-sora font-black text-white">৳{product.price.toLocaleString()}</span>
          {product.original_price && (
            <span className="text-[12px] line-through" style={{ color: 'hsla(0,0%,100%,0.3)' }}>৳{product.original_price.toLocaleString()}</span>
          )}
        </div>

        {savings && (
          <div className="mt-2 text-[11px] font-bold rounded-lg px-2.5 py-1 inline-flex items-center gap-1"
            style={{ color: 'hsl(15,100%,65%)', background: 'hsla(15,100%,60%,0.12)', border: '1px solid hsla(15,100%,60%,0.2)' }}>
            <TrendingDown size={10} /> Save ৳{savings.toLocaleString()}
          </div>
        )}

        {product.delivery_time && (
          <p className="mt-1.5 text-[10px] flex items-center gap-1 font-medium" style={{ color: 'hsla(0,0%,100%,0.35)' }}>
            <Zap size={9} className="text-emerald-400" />
            {product.delivery_time}
          </p>
        )}
      </div>
    </div>
  );
};

export default FlashSale;
