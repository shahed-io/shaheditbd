import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from './ProductCard';
import { Product } from '@/data/products';
import { Flame, Timer, AlertTriangle } from 'lucide-react';

const mapProduct = (p: any): Product => ({
  id: p.id, name: p.name, category: p.categories?.name || 'Other',
  price: Number(p.price), originalPrice: p.original_price ? Number(p.original_price) : undefined,
  discount: p.discount_percent || undefined, rating: 4.8,
  reviews: Math.floor(Math.random() * 400) + 80,
  image: p.image_url || 'https://placehold.co/300x300/0d1117/00d4ff?text=Product',
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

  const TIME_UNITS = [
    { v: pad(time.d), l: 'DAYS' },
    { v: pad(time.h), l: 'HRS' },
    { v: pad(time.m), l: 'MIN' },
    { v: pad(time.s), l: 'SEC' },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 relative overflow-hidden"
      style={{ borderTop: '1px solid hsl(var(--border))', borderBottom: '1px solid hsl(var(--border))' }}>

      {/* BG effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, hsla(0,100%,55%,0.04) 0%, transparent 70%)' }} />
        <div className="cyber-grid absolute inset-0 opacity-20" />
        {/* Animated scan beam */}
        <div className="absolute inset-x-0 h-px opacity-20"
          style={{
            background: 'linear-gradient(90deg, transparent, hsl(0,100%,60%), transparent)',
            animation: 'scan-y 4s ease-in-out infinite',
            top: '30%',
          }} />
      </div>

      <div className="max-w-screen-xl mx-auto relative z-10">

        {/* Header row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-14">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: 'hsla(0,100%,55%,0.1)', border: '1px solid hsla(0,100%,55%,0.3)' }}>
                <Flame size={12} style={{ color: 'hsl(0,100%,65%)' }} />
                <span className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'hsl(0,100%,65%)', fontFamily: 'JetBrains Mono, monospace' }}>
                  Flash Sale · Limited Time
                </span>
                <AlertTriangle size={10} style={{ color: 'hsl(0,100%,65%)' }} className="animate-pulse" />
              </div>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black section-title">
              <span className="text-foreground">Special</span>
              <span className="gradient-text-warm ml-3">Offer</span>
            </h2>
            <div className="divider-cyber mt-3" />
          </div>

          {/* Countdown */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[10px] mb-1"
              style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--muted-foreground))' }}>
              <Timer size={11} />
              <span>OFFER_EXPIRES_IN</span>
            </div>
            <div className="flex items-center gap-3">
              {TIME_UNITS.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="relative flex flex-col items-center justify-center rounded-xl w-16 h-16"
                    style={{
                      background: 'hsl(220,15%,10%)',
                      border: '1px solid hsla(0,100%,55%,0.3)',
                      boxShadow: `0 0 15px hsla(0,100%,55%,0.1)`,
                    }}>
                    {/* Corner accents */}
                    <div className="absolute top-1 left-1 w-2 h-2"
                      style={{ borderTop: '1px solid hsl(0,100%,60%)', borderLeft: '1px solid hsl(0,100%,60%)' }} />
                    <div className="absolute bottom-1 right-1 w-2 h-2"
                      style={{ borderBottom: '1px solid hsl(0,100%,60%)', borderRight: '1px solid hsl(0,100%,60%)' }} />

                    <span className="font-black text-xl leading-none"
                      style={{ fontFamily: 'Orbitron, sans-serif', color: 'hsl(0,100%,70%)' }}>
                      {item.v}
                    </span>
                    <span className="text-[8px] mt-0.5 uppercase tracking-widest"
                      style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--muted-foreground))' }}>
                      {item.l}
                    </span>
                  </div>
                  {i < TIME_UNITS.length - 1 && (
                    <span className="font-black text-lg animate-pulse" style={{ color: 'hsl(0,100%,60%)' }}>:</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Products */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[0,1,2,3].map(i => (
              <div key={i} className="rounded-xl animate-pulse"
                style={{ height: '22rem', background: 'hsl(220,15%,10%)', border: '1px solid hsl(var(--border))' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p, i) => <ProductCard key={p.id} product={p} delay={i * 0.07} />)}
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan-y {
          0%, 100% { top: 10%; opacity: 0; }
          20% { opacity: 0.3; }
          80% { opacity: 0.3; }
          to { top: 90%; opacity: 0; }
        }
      `}</style>
    </section>
  );
};

export default FlashSale;
