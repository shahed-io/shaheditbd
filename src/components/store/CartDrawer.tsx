import { useState, useRef } from 'react';
import { X, ShoppingCart, Plus, Minus, Trash2, ArrowRight, Tag, Loader2, Heart, CheckCircle } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CartDrawer = () => {
  const {
    items, cartOpen, setCartOpen, subtotal, discountAmount, taxAmount, serviceFee, finalTotal,
    cartCount, removeFromCart, updateQuantity, clearCart,
    wishlist, wishlistOpen, setWishlistOpen, toggleWishlist, addToCart,
    coupon, setCoupon, resetCoupon,
  } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [couponInput, setCouponInput] = useState(coupon.isApplied ? coupon.code : '');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: {
          code: couponInput.trim().toUpperCase(),
          orderTotal: subtotal,
          customerEmail: user?.email || '',
          productIds: items.map((it: any) => it.id).filter(Boolean),
        },
      });
      if (error || !data?.valid) {
        setCouponError(data?.message || 'Invalid coupon code');
        resetCoupon();
        return;
      }
      setCoupon({
        code: couponInput.trim().toUpperCase(),
        discount: data.discount,
        type: data.type || 'fixed',
        isApplied: true,
      });
      toast.success(`Coupon applied! ৳${data.discount} off`);
    } catch {
      setCouponError('Could not validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    resetCoupon();
    setCouponInput('');
    setCouponError('');
  };

  // Cart Panel
  const CartPanel = () => (
    <div className={`fixed inset-0 z-[200] ${cartOpen ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${cartOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => setCartOpen(false)}
      />
      <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-background border-l border-border flex flex-col transition-transform duration-300 ease-out ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-primary" />
            <h2 className="font-bold text-lg text-foreground">Cart</h2>
            {cartCount > 0 && (
              <span className="bg-primary text-background text-xs font-bold px-2 py-0.5 rounded-full">{cartCount}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                onClick={() => { if (confirm('Clear all items?')) clearCart(); }}
                className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded-lg transition-colors"
              >
                Clear all
              </button>
            )}
            <button onClick={() => setCartOpen(false)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <ShoppingCart size={60} className="text-muted-foreground/30" />
              <div>
                <p className="text-muted-foreground font-medium">Your cart is empty</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Add products to get started</p>
              </div>
              <button onClick={() => setCartOpen(false)} className="btn-glow px-5 py-2.5 rounded-xl text-sm">
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={`${item.id}-${item.variant}`} className="flex gap-3 p-3 rounded-xl border border-border bg-card hover:border-border/80 transition-colors group">
                <img
                  src={item.image} alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/64x64/0a1628/00b4d8?text=P'; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">{item.name}</p>
                  {item.variant && <p className="text-xs text-muted-foreground mt-0.5">{item.variant}</p>}
                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity */}
                    <div className="flex items-center gap-0 border border-border rounded-lg overflow-hidden bg-muted/20">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="px-2 text-sm font-bold text-foreground min-w-[28px] text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">৳{(item.price * item.quantity).toLocaleString()}</span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-border space-y-3 flex-shrink-0 bg-background">
            {/* Coupon */}
            {!coupon.isApplied ? (
              <div className="space-y-1">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={couponInput}
                      onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                      onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                      placeholder="Coupon code"
                      maxLength={30}
                      className="w-full bg-muted/30 border border-border rounded-xl pl-8 pr-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary text-xs"
                    />
                  </div>
                  <button
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="px-3 py-2 rounded-xl border border-primary/40 text-primary text-xs font-medium hover:bg-primary/10 transition-colors disabled:opacity-50"
                  >
                    {couponLoading ? <Loader2 size={12} className="animate-spin" /> : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-destructive text-xs">{couponError}</p>}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-400" />
                  <span className="text-xs text-green-400 font-medium">{coupon.code} — ৳{discountAmount.toLocaleString()} off</span>
                </div>
                <button onClick={removeCoupon} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Pricing breakdown */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Coupon Discount</span><span>-৳{discountAmount.toLocaleString()}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span><span>৳{taxAmount.toLocaleString()}</span>
                </div>
              )}
              {serviceFee > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Service Fee</span><span>৳{serviceFee.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-foreground text-base border-t border-border pt-2">
                <span>Total</span><span className="text-primary">৳{finalTotal.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => { setCartOpen(false); navigate('/checkout'); }}
              className="w-full btn-glow py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm"
            >
              Proceed to Checkout <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Wishlist Panel
  const WishlistPanel = () => (
    <div className={`fixed inset-0 z-[200] ${wishlistOpen ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${wishlistOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => setWishlistOpen(false)}
      />
      <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-background border-l border-border flex flex-col transition-transform duration-300 ease-out ${wishlistOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Heart size={20} className="text-red-400 fill-red-400" />
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
              <Heart size={60} className="text-muted-foreground/20" />
              <div>
                <p className="text-muted-foreground font-medium">Wishlist empty</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Save products you love</p>
              </div>
            </div>
          ) : (
            wishlist.map(item => (
              <div key={item.id} className="flex gap-3 p-3 rounded-xl border border-border bg-card">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/64x64/0a1628/00b4d8?text=P'; }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">{item.name}</p>
                  <p className="text-xs text-primary mt-0.5">৳{item.price.toLocaleString()}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => { addToCart(item); setWishlistOpen(false); setCartOpen(true); }}
                      className="btn-glow px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <ShoppingCart size={11} /> Add to Cart
                    </button>
                    <button
                      onClick={() => toggleWishlist(item)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
                    >
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
