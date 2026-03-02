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
        className="group rounded-2xl border border-border/40 bg-card/40 overflow-hidden cursor-pointer relative hover:border-primary/30 transition-all duration-500 hover:-translate-y-2"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(40px)',
          transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
        }}
      >
        {/* Image */}
        <div className="relative overflow-hidden">
          <div className="aspect-square bg-muted/20 overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x300/0a1628/00b4d8?text=Product'; }}
            />
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Wishlist */}
          <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
            <button
              onClick={handleWishlist}
              className={`p-2 rounded-xl backdrop-blur-md border transition-all hover:scale-110 ${
                wishlisted
                  ? 'bg-red-500/20 border-red-500/30 text-red-400'
                  : 'bg-background/50 border-border/50 text-muted-foreground hover:text-red-400'
              }`}
            >
              <Heart size={14} fill={wishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {product.discount && (
              <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg">
                -{product.discount}%
              </span>
            )}
            {product.isBestseller && (
              <span className="flex items-center gap-1 bg-primary/20 border border-primary/30 text-primary text-[9px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-sm">
                <Zap size={8} fill="currentColor" /> BEST
              </span>
            )}
            {product.isNew && (
              <span className="bg-accent/20 border border-accent/30 text-accent text-[9px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-sm">NEW</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <span className="text-[10px] text-primary/70 font-semibold uppercase tracking-wider">{product.category}</span>
            <h3 className="text-sm font-bold text-foreground mt-0.5 line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-300">
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
          <div className="space-y-2 pt-1">
            <button
              onClick={() => setShowOrderModal(true)}
              className="w-full bg-gradient-to-r from-primary to-accent text-background py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 group/btn"
            >
              <CreditCard size={13} className="group-hover/btn:scale-110 transition-transform" />
              এখনই অর্ডার করুন
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleWhatsApp}
                className="py-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/20 transition-all"
              >
                <MessageCircle size={11} /> WhatsApp
              </button>
              <button
                onClick={handleAdd}
                className={`py-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all border ${
                  inCart
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border/50 bg-card text-muted-foreground hover:border-primary/30 hover:text-primary'
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
