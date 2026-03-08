import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from './ProductCard';
import { Product } from '@/data/products';
import { Flame, Timer, ArrowRight } from 'lucide-react';

const mapProduct = (p: any): Product => ({
  id: p.id, name: p.name, category: p.categories?.name || 'Other',
  price: Number(p.price), originalPrice: p.original_price ? Number(p.original_price) : undefined,
  discount: p.discount_percent || undefined, rating: 4.8,
  reviews: Math.floor(Math.random() * 400) + 80,
  image: p.image_url || 'https://placehold.co/300x300/f8f9ff/6366f1?text=Product',
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
    { v: pad(time.d), l: 'Days' },
    { v: pad(time.h), l: 'Hours' },
    { v: pad(time.m), l: 'Min' },
    { v: pad(time.s), l: 'Sec' },
  ];

  return (
    <section className="py-20 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, hsl(15,100%,98%) 0%, hsl(38,100%,97%) 50%, hsl(15,100%,98%) 100%)' }}>

      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsla(15,100%,60%,0.08), transparent)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsla(38,100%,55%,0.08), transparent)', filter: 'blur(40px)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-1.5 rounded-full text-white"
                style={{ background: 'linear-gradient(135deg, hsl(15,100%,60%), hsl(38,100%,55%))' }}>
                <Flame size={13} fill="white" /> Flash Sale
              </span>
              <span className="text-[11px] font-fira font-semibold text-muted-foreground tracking-widest uppercase px-3 py-1.5 bg-white rounded-full border border-border shadow-soft">
                LIMITED TIME
              </span>
            </div>
            <h2 className="section-heading text-3xl sm:text-4xl">
              Special{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(15,100%,60%), hsl(38,100%,55%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Offers
              </span>
            </h2>
            <p className="text-muted-foreground mt-2">Grab these deals before they expire!</p>
          </div>

          {/* Countdown Timer */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
              <Timer size={13} className="text-brand-coral" /> Offer expires in
            </div>
            <div className="flex items-center gap-2">
              {TIME_UNITS.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="countdown-box">
                    <div className="countdown-num">{item.v}</div>
                    <div className="countdown-label">{item.l}</div>
                  </div>
                  {i < TIME_UNITS.length - 1 && (
                    <span className="text-xl font-black countdown-num animate-pulse">:</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Products */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[0,1,2,3].map(i => <div key={i} className="rounded-2xl shimmer" style={{ height: '22rem' }} />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p, i) => <ProductCard key={p.id} product={p} delay={i * 0.07} />)}
            </div>
            <div className="flex justify-center mt-10">
              <a href="/shop" className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-base font-bold text-white shadow-coral hover:scale-105 transition-transform duration-200"
                style={{ background: 'linear-gradient(135deg, hsl(15,100%,60%), hsl(38,100%,55%))' }}>
                View All Deals <ArrowRight size={16} />
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default FlashSale;

