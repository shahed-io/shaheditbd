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
    addToCart({
      id: product.id, name: product.name, category: product.category,
      price: product.price, originalPrice: product.originalPrice, image: product.image,
    });
  };

  const handleWishlist = () => {
    toggleWishlist({
      id: product.id, name: product.name, category: product.category,
      price: product.price, originalPrice: product.originalPrice, image: product.image,
    });
  };

  return (
    <>
      <div
        ref={ref}
        className="product-card group"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(50px) scale(0.92)',
          transition: `opacity 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
        }}
      >
        {/* Glow border on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, hsla(199,100%,50%,0.12), hsla(260,80%,60%,0.06))', zIndex: 0 }} />

        {/* Image */}
        <div className="relative overflow-hidden rounded-t-2xl">
          <div className="aspect-square bg-gradient-to-br from-muted/80 to-muted/40 overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x300/0a1628/00b4d8?text=Product'; }}
            />
          </div>

          {/* Shimmer overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{ background: 'linear-gradient(105deg, transparent 30%, hsla(199,100%,80%,0.08) 50%, transparent 70%)', backgroundSize: '250% 100%', animation: 'shimmer 2s linear infinite' }} />

          {/* Wishlist */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
            <button
              onClick={handleWishlist}
              className={`p-2 rounded-xl backdrop-blur-sm border transition-all hover:scale-110 ${
                wishlisted
                  ? 'bg-red-500/20 border-red-500/40 text-red-400'
                  : 'bg-background/40 border-border/60 text-muted-foreground hover:text-red-400'
              }`}
            >
              <Heart size={14} fill={wishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.discount && (
              <span className="badge-discount text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">
                -{product.discount}%
              </span>
            )}
            {product.isBestseller && (
              <span className="flex items-center gap-1 bg-primary/20 border border-primary/40 text-primary text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                <Zap size={8} fill="currentColor" /> BEST
              </span>
            )}
            {product.isNew && (
              <span className="bg-accent/20 border border-accent/40 text-accent text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">NEW</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-3.5 space-y-2.5 relative z-10">
          <div>
            <span className="text-[10px] text-primary/80 font-semibold uppercase tracking-wider">{product.category}</span>
            <h3 className="text-sm font-bold text-foreground mt-0.5 line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-300">
              {product.name}
            </h3>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={10} className={i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/40'} />
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">({product.reviews})</span>
          </div>

          {/* Price */}
          <div className="flex items-end justify-between">
            <div>
              <span className="text-primary font-black text-xl" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                ৳{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-muted-foreground text-xs line-through ml-1.5">
                  ৳{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            {product.discount && (
              <span className="text-[10px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-1.5 py-0.5 rounded-lg">
                SAVE {product.discount}%
              </span>
            )}
          </div>

          {/* Buttons */}
          <div className="space-y-1.5 pt-0.5">
            <button
              onClick={() => setShowOrderModal(true)}
              className="w-full btn-glow py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5 group/btn"
            >
              <CreditCard size={13} className="group-hover/btn:scale-110 transition-transform" />
              এখনই অর্ডার করুন
            </button>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleWhatsApp}
                className="py-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 hover:scale-105 transition-all"
              >
                <MessageCircle size={11} /> WhatsApp
              </button>
              <button
                onClick={handleAdd}
                className={`py-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all hover:scale-105 border ${
                  inCart
                    ? 'border-primary/50 bg-primary/15 text-primary'
                    : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-primary'
                }`}
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
