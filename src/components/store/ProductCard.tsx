import { useState, useRef, useEffect } from 'react';
import { Star, Heart, ShoppingCart, MessageCircle, CreditCard, Zap } from 'lucide-react';
import { Product } from '@/data/products';
import { useCart } from '@/hooks/useCart';
import QuickOrderModal from './QuickOrderModal';

interface ProductCardProps {
  product: Product;
  delay?: number;
}

const WHATSAPP_NUMBER = '8801840099853';

const ProductCard = ({ product, delay = 0 }: ProductCardProps) => {
  const [visible, setVisible] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { addToCart, toggleWishlist, isWishlisted, isInCart } = useCart();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.06 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const wishlisted = isWishlisted(product.id);
  const inCart = isInCart(product.id);

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `আমি এই প্রোডাক্টটি অর্ডার করতে চাই:\n\n📦 ${product.name}\n💰 মূল্য: ৳${product.price.toLocaleString()}\n\nঅনুগ্রহ করে আমাকে সাহায্য করুন।`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
  };

  const handleAdd = () => {
    addToCart({ id: product.id, name: product.name, category: product.category, price: product.price, originalPrice: product.originalPrice, image: product.image });
  };

  const handleWishlist = () => {
    toggleWishlist({ id: product.id, name: product.name, category: product.category, price: product.price, originalPrice: product.originalPrice, image: product.image });
  };

  return (
    <>
      <div
        ref={ref}
        className="group rounded-2xl overflow-hidden cursor-pointer relative"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(40px)',
          transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s, border-color 0.3s, box-shadow 0.3s`,
          background: 'hsla(228,28%,10%,0.7)',
          border: '1px solid hsla(180,100%,42%,0.12)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = 'hsla(180,100%,42%,0.45)';
          el.style.transform = 'translateY(-8px)';
          el.style.boxShadow = '0 20px 50px hsla(180,100%,42%,0.15), 0 0 30px hsla(265,85%,65%,0.08)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = 'hsla(180,100%,42%,0.12)';
          el.style.transform = visible ? 'translateY(0)' : 'translateY(40px)';
          el.style.boxShadow = 'none';
        }}
      >
        {/* Top glow line on hover */}
        <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-400 z-20"
          style={{ background: 'linear-gradient(90deg, transparent, hsl(180,100%,55%), hsl(265,85%,75%), transparent)' }} />

        {/* Image */}
        <div className="relative overflow-hidden">
          <div className="aspect-square overflow-hidden" style={{ background: 'hsla(228,28%,13%,0.5)' }}>
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x300/0a1020/00d4be?text=Product'; }}
            />
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(to top, hsla(230,30%,5%,0.5) 0%, transparent 60%)' }} />

          {/* Wishlist */}
          <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
            <button
              onClick={handleWishlist}
              className="p-2 rounded-xl backdrop-blur-md transition-all hover:scale-110"
              style={{
                background: wishlisted ? 'hsla(0,80%,60%,0.2)' : 'hsla(230,30%,5%,0.5)',
                border: `1px solid ${wishlisted ? 'hsla(0,80%,60%,0.35)' : 'hsla(228,25%,20%,0.5)'}`,
                color: wishlisted ? 'hsl(0,80%,65%)' : 'hsl(var(--muted-foreground))',
              }}
            >
              <Heart size={13} fill={wishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {product.discount && (
              <span className="text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg"
                style={{ background: 'linear-gradient(135deg, hsl(25,100%,55%), hsl(0,90%,55%))' }}>
                -{product.discount}%
              </span>
            )}
            {product.isBestseller && (
              <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-sm"
                style={{ background: 'hsla(180,100%,42%,0.2)', border: '1px solid hsla(180,100%,42%,0.3)', color: 'hsl(var(--primary))' }}>
                <Zap size={8} fill="currentColor" /> BEST
              </span>
            )}
            {product.isNew && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-sm"
                style={{ background: 'hsla(265,85%,65%,0.2)', border: '1px solid hsla(265,85%,65%,0.3)', color: 'hsl(var(--accent))' }}>
                NEW
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsla(180,100%,55%,0.7)' }}>
              {product.category}
            </span>
            <h3 className="text-sm font-bold mt-0.5 line-clamp-2 leading-snug transition-colors duration-200 group-hover:text-primary"
              style={{ color: 'hsl(var(--foreground))' }}>
              {product.name}
            </h3>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={10} className={i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'} />
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">({product.reviews})</span>
          </div>

          {/* Price */}
          <div className="flex items-end justify-between">
            <div>
              <span className="font-black text-xl" style={{ fontFamily: 'Rajdhani, sans-serif', color: 'hsl(var(--primary))' }}>
                ৳{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-muted-foreground text-xs line-through ml-1.5">
                  ৳{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            {product.discount && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg"
                style={{ color: 'hsl(140,80%,50%)', background: 'hsla(140,80%,50%,0.1)', border: '1px solid hsla(140,80%,50%,0.2)' }}>
                SAVE {product.discount}%
              </span>
            )}
          </div>

          {/* Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => setShowOrderModal(true)}
              className="w-full py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all duration-300 text-background group/btn"
              style={{
                background: 'var(--gradient-primary)',
                boxShadow: '0 4px 15px hsla(180,100%,42%,0.15)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 25px hsla(180,100%,42%,0.3)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 15px hsla(180,100%,42%,0.15)'; }}
            >
              <CreditCard size={13} className="group-hover/btn:scale-110 transition-transform" />
              এখনই অর্ডার করুন
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleWhatsApp}
                className="py-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all"
                style={{ background: 'hsla(142,70%,45%,0.1)', border: '1px solid hsla(142,70%,45%,0.2)', color: 'hsl(142,70%,55%)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'hsla(142,70%,45%,0.2)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'hsla(142,70%,45%,0.1)'; }}
              >
                <MessageCircle size={11} /> WhatsApp
              </button>
              <button
                onClick={handleAdd}
                className="py-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all"
                style={{
                  background: inCart ? 'hsla(180,100%,42%,0.1)' : 'hsla(228,28%,14%,0.8)',
                  border: `1px solid ${inCart ? 'hsla(180,100%,42%,0.4)' : 'hsla(228,25%,22%,0.5)'}`,
                  color: inCart ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                }}
              >
                <ShoppingCart size={11} />
                {inCart ? 'In Cart ✓' : 'কার্ট'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showOrderModal && (
        <QuickOrderModal
          product={{ id: product.id, name: product.name, price: product.price, originalPrice: product.originalPrice, image: product.image, category: product.category }}
          onClose={() => setShowOrderModal(false)}
        />
      )}
    </>
  );
};

export default ProductCard;
