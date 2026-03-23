import React, { useState, useEffect, useRef } from 'react';
import { useReveal } from '@/hooks/useReveal';
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
  const { ref: headerRef, visible: headerVisible } = useReveal({ threshold: 0.1 });

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
    <section className="py-24 relative overflow-hidden bg-transparent">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(15,100%,60%,0.06), transparent)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, hsla(38,100%,55%,0.05), transparent)', filter: 'blur(80px)' }} />
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, hsla(15,100%,60%,0.2), hsla(38,100%,55%,0.2), transparent)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div
          ref={headerRef as React.RefObject<HTMLDivElement>}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-14 transition-all duration-700"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'translateY(0)' : 'translateY(32px)',
          }}
        >
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-4 py-1.5 rounded-full text-white"
                style={{ background: 'linear-gradient(135deg, hsl(15,100%,62%), hsl(38,100%,55%))', boxShadow: '0 4px 16px hsla(15,100%,60%,0.4)' }}>
                <Flame size={13} fill="white" /> Flash Sale
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full font-fira"
                style={{ background: 'hsla(0,0%,100%,0.55)', backdropFilter: 'blur(16px)', border: '1px solid hsla(258,78%,75%,0.2)', color: 'hsl(var(--muted-foreground))' }}>
                LIMITED TIME
              </span>
            </div>
            <h2 className="font-sora font-black text-foreground leading-tight" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.75rem)' }}>
              Biggest{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(15,100%,62%), hsl(38,100%,55%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Discounts
              </span>{' '}
              Today
            </h2>
            <p className="text-muted-foreground mt-2 text-[14px]">Top deals sorted by highest savings — grab them before time runs out!</p>
          </div>

          {/* Countdown */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-muted-foreground">
              <Timer size={13} style={{ color: 'hsl(15,100%,62%)' }} /> Sale ends in:
            </div>
            <div className="flex items-center gap-3">
              {TIME_UNITS.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center w-[68px] h-[68px] rounded-[18px]"
                    style={{
                      background: 'linear-gradient(145deg, hsl(258,78%,38%), hsl(270,80%,28%))',
                      boxShadow: '0 4px 18px hsla(258,78%,45%,0.45), inset 0 1px 0 hsla(258,100%,85%,0.15)',
                    }}>
                    <span className="text-[1.55rem] font-fira font-black leading-none text-white tabular-nums tracking-tight">{item.v}</span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] mt-1" style={{ color: 'hsl(258,60%,80%)' }}>{item.l}</span>
                  </div>
                  {i < TIME_UNITS.length - 1 && (
                    <div className="flex flex-col gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full block" style={{ background: 'hsl(15,100%,62%)' }} />
                      <span className="w-1.5 h-1.5 rounded-full block" style={{ background: 'hsl(15,100%,62%)' }} />
                    </div>
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
              <div key={i} className="rounded-2xl bg-muted animate-pulse" style={{ height: '22rem', animationDelay: `${i * 0.07}s` }} />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    opacity: 1,
                    transform: 'none',
                    animation: `fadeInUp 0.5s ease ${i * 0.06}s both`,
                  }}
                >
                  <FlashCard product={p} delay={i * 0.06}
                    onAddToCart={addToCart}
                    onNavigate={() => navigate(`/product/${p.slug}`)} />
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-12">
              <button
                onClick={() => navigate('/shop')}
                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl text-[14px] font-bold text-white hover:scale-[1.03] active:scale-[0.97] transition-all"
                style={{ background: 'linear-gradient(135deg, hsl(15,100%,62%), hsl(38,100%,55%))', boxShadow: '0 8px 28px hsla(20,100%,55%,0.35)' }}>
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
      className="group rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
      style={{
        animationDelay: `${delay}s`,
        background: hovered ? 'hsla(0,0%,100%,0.75)' : 'hsla(0,0%,100%,0.55)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: hovered ? '1px solid hsla(15,100%,60%,0.45)' : '1px solid hsla(258,78%,75%,0.18)',
        transform: hovered ? 'translateY(-5px)' : 'none',
        boxShadow: hovered
          ? '0 16px 40px hsla(15,100%,60%,0.18), 0 4px 16px hsla(226,35%,12%,0.08), inset 0 1px 0 hsla(0,0%,100%,0.8)'
          : '0 4px 20px hsla(226,35%,12%,0.07), inset 0 1px 0 hsla(0,0%,100%,0.6)',
        transition: 'all 0.35s cubic-bezier(0.23,1,0.32,1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image_url || 'https://placehold.co/300x300/1a1f2e/f97316?text=Sale'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500"
          style={{ transform: hovered ? 'scale(1.06)' : 'scale(1)' }}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{ background: 'linear-gradient(to top, hsla(226,35%,8%,0.4), transparent)', opacity: hovered ? 1 : 0 }} />
        {product.discount_percent && (
          <div className="absolute top-2.5 left-2.5 text-white text-[11px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1"
            style={{ background: 'linear-gradient(135deg, hsl(15,100%,62%), hsl(38,100%,55%))', boxShadow: '0 2px 10px hsla(15,100%,60%,0.5)' }}>
            <Zap size={10} fill="white" />
            -{product.discount_percent}%
          </div>
        )}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-xl text-white flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{
            background: 'linear-gradient(135deg, hsl(15,100%,62%), hsl(38,100%,55%))',
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0)' : 'translateY(4px)',
            boxShadow: '0 4px 12px hsla(15,100%,60%,0.5)',
          }}
          title="Add to cart"
        >
          <ShoppingCart size={15} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <p className="font-semibold text-[13px] line-clamp-2 leading-snug mb-2.5 transition-colors duration-200"
          style={{ color: hovered ? 'hsl(15,100%,58%)' : 'hsl(var(--foreground))' }}>
          {product.name}
        </p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[17px] font-sora font-black text-foreground">৳{product.price.toLocaleString()}</span>
          {product.original_price && (
            <span className="text-[12px] text-muted-foreground line-through">৳{product.original_price.toLocaleString()}</span>
          )}
        </div>
        {savings && (
          <div className="mt-2 text-[11px] font-bold rounded-lg px-2.5 py-1 inline-flex items-center gap-1"
            style={{ color: 'hsl(15,100%,65%)', background: 'hsla(15,100%,60%,0.10)', border: '1px solid hsla(15,100%,60%,0.2)' }}>
            <TrendingDown size={10} /> Save ৳{savings.toLocaleString()}
          </div>
        )}
        {product.delivery_time && (
          <p className="mt-1.5 text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
            <Zap size={9} style={{ color: 'hsl(158,64%,48%)' }} />
            {product.delivery_time}
          </p>
        )}
      </div>
    </div>
  );
};

export default FlashSale;
