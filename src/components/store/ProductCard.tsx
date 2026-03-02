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
      { threshold: 0.08 }
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
        className="product-card group"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.94)',
          transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
        }}
      >
        {/* Image area */}
        <div className="relative overflow-hidden">
          <div className="aspect-square overflow-hidden bg-muted/30">
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x300/0d1321/3ddc84?text=Product'; }}
            />
          </div>

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent 50%, hsla(158,64%,52%,0.08) 100%)' }} />

          {/* Wishlist btn */}
          <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
            <button
              onClick={handleWishlist}
              className={`p-2 rounded-xl backdrop-blur-sm border transition-all hover:scale-110 ${
                wishlisted
                  ? 'bg-red-500/20 border-red-400/40 text-red-400'
                  : 'bg-background/50 border-border/60 text-muted-foreground hover:text-red-400'
              }`}
            >
              <Heart size={13} fill={wishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            {product.discount && (
              <span className="badge-discount text-[9px] font-black px-2 py-0.5 rounded-full">
                -{product.discount}%
              </span>
            )}
            {product.isBestseller && (
              <span className="flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm"
                style={{ background: 'hsla(158,64%,52%,0.18)', border: '1px solid hsla(158,64%,52%,0.35)', color: 'hsl(var(--primary))' }}>
                <Zap size={7} fill="currentColor" /> BEST
              </span>
            )}
            {product.isNew && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm"
                style={{ background: 'hsla(43,100%,60%,0.18)', border: '1px solid hsla(43,100%,60%,0.35)', color: 'hsl(var(--accent))' }}>
                NEW
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-3.5 space-y-2.5">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--primary))' }}>
              {product.category}
            </span>
            <h3 className="text-sm font-semibold text-foreground/90 mt-0.5 line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-300">
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
            <div className="flex items-baseline gap-1.5">
              <span className="text-primary font-black text-xl" style={{ fontFamily: 'Syne, sans-serif' }}>
                ৳{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-muted-foreground text-xs line-through">
                  ৳{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            {product.discount && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                style={{ color: 'hsl(158,64%,60%)', background: 'hsla(158,64%,52%,0.1)', border: '1px solid hsla(158,64%,52%,0.2)' }}>
                -{product.discount}%
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-1.5 pt-0.5">
            <button
              onClick={() => setShowOrderModal(true)}
              className="w-full btn-glow py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5"
            >
              <CreditCard size={13} />
              এখনই অর্ডার করুন
            </button>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleWhatsApp}
                className="py-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all hover:scale-105"
                style={{ background: 'hsla(142,69%,40%,0.1)', border: '1px solid hsla(142,69%,40%,0.25)', color: '#25D366' }}
              >
                <MessageCircle size={11} /> WhatsApp
              </button>
              <button
                onClick={handleAdd}
                className={`py-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all hover:scale-105 border ${
                  inCart
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/30 hover:text-primary'
                }`}
              >
                <ShoppingCart size={11} />
                {inCart ? 'Added ✓' : 'কার্ট'}
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
