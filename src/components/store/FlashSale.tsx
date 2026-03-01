import { useState, useEffect } from 'react';
import { flashSaleProducts } from '@/data/products';
import ProductCard from './ProductCard';
import { Flame } from 'lucide-react';

const FlashSale = () => {
  const [timeLeft, setTimeLeft] = useState({ h: 5, m: 23, s: 47 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section className="py-16 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="orb orb-1 opacity-8" style={{ bottom: '-20%', left: '-5%' }} />

      <div className="max-w-7xl mx-auto">
        {/* Flash Sale header */}
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

          {/* Timer */}
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

        {/* Flash sale products */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {flashSaleProducts.map((product, i) => (
            <ProductCard key={product.id} product={product} delay={i * 0.08} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FlashSale;
