import { X, ShoppingCart, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CartDrawer = ({ open, onClose }: Props) => {
  const { items, removeItem, updateQty, totalItems, subtotal, clearCart } = useCart();

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[60]"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm z-[70] transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full glass-card border-l border-primary/20 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} className="text-primary" />
              <h2 className="font-bold text-foreground">Cart ({totalItems})</h2>
            </div>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button onClick={clearCart} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                  Clear all
                </button>
              )}
              <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <ShoppingBag size={48} className="opacity-30" />
                <p className="text-sm">আপনার cart খালি</p>
                <button onClick={onClose} className="btn-glow px-4 py-2 rounded-xl text-sm">
                  Shopping করুন
                </button>
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} className="flex gap-3 glass-card rounded-xl p-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted/30 flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={20} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{item.name}</p>
                    <p className="text-primary font-bold text-sm mt-1">৳{item.price.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-sm font-medium text-foreground w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="px-5 py-4 border-t border-border space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">সাবটোটাল</span>
                <span className="font-black text-xl text-primary">৳{subtotal.toLocaleString()}</span>
              </div>
              <Link
                to="/checkout"
                onClick={onClose}
                className="btn-glow w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              >
                <ShoppingCart size={16} />
                Checkout করুন
              </Link>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl border border-border text-muted-foreground hover:border-primary/50 text-sm transition-colors"
              >
                Shopping চালিয়ে যান
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
