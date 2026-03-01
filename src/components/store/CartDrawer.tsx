import { X, ShoppingCart, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useNavigate } from 'react-router-dom';

const CartDrawer = () => {
  const { items, cartOpen, setCartOpen, cartTotal, cartCount, removeFromCart, updateQuantity, wishlist, wishlistOpen, setWishlistOpen, toggleWishlist, addToCart } = useCart();
  const navigate = useNavigate();

  // Cart Drawer
  const CartPanel = () => (
    <div className={`fixed inset-0 z-[200] ${cartOpen ? '' : 'pointer-events-none'}`}>
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${cartOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => setCartOpen(false)}
      />
      {/* Panel */}
      <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-background border-l border-border flex flex-col transition-transform duration-300 ease-out ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-primary" />
            <h2 className="font-bold text-lg text-foreground">Cart</h2>
            {cartCount > 0 && (
              <span className="bg-primary text-background text-xs font-bold px-2 py-0.5 rounded-full">{cartCount}</span>
            )}
          </div>
          <button onClick={() => setCartOpen(false)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <ShoppingCart size={60} className="text-muted-foreground/30" />
              <div>
                <p className="text-muted-foreground font-medium">Cart empty</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Add some products to get started</p>
              </div>
              <button onClick={() => setCartOpen(false)} className="btn-glow px-5 py-2.5 rounded-xl text-sm">
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-3 p-3 rounded-xl border border-border bg-card">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/64x64/0a1628/00b4d8?text=P'; }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">{item.name}</p>
                  <p className="text-xs text-primary mt-0.5">৳{item.price.toLocaleString()}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="px-2 text-sm font-medium text-foreground min-w-[24px] text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Subtotal</span>
              <span className="text-foreground font-bold text-lg">৳{cartTotal.toLocaleString()}</span>
            </div>
            <button
              onClick={() => { setCartOpen(false); navigate('/checkout'); }}
              className="w-full btn-glow py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              Proceed to Checkout
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Wishlist Drawer
  const WishlistPanel = () => (
    <div className={`fixed inset-0 z-[200] ${wishlistOpen ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${wishlistOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => setWishlistOpen(false)}
      />
      <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-background border-l border-border flex flex-col transition-transform duration-300 ease-out ${wishlistOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xl">❤️</span>
            <h2 className="font-bold text-lg text-foreground">Wishlist</h2>
            {wishlist.length > 0 && (
              <span className="bg-accent text-background text-xs font-bold px-2 py-0.5 rounded-full">{wishlist.length}</span>
            )}
          </div>
          <button onClick={() => setWishlistOpen(false)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {wishlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <span className="text-6xl opacity-20">❤️</span>
              <div>
                <p className="text-muted-foreground font-medium">Wishlist empty</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Save products you love</p>
              </div>
            </div>
          ) : (
            wishlist.map(item => (
              <div key={item.id} className="flex gap-3 p-3 rounded-xl border border-border bg-card">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/64x64/0a1628/00b4d8?text=P'; }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">{item.name}</p>
                  <p className="text-xs text-primary mt-0.5">৳{item.price.toLocaleString()}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => { addToCart(item); setWishlistOpen(false); }}
                      className="btn-glow px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <ShoppingCart size={11} /> Add to Cart
                    </button>
                    <button onClick={() => toggleWishlist(item)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <CartPanel />
      <WishlistPanel />
    </>
  );
};

export default CartDrawer;
