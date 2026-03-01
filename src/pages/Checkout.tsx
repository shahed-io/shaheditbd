import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ShoppingCart, Tag, CheckCircle, Smartphone } from 'lucide-react';
import { z } from 'zod';

const checkoutSchema = z.object({
  name: z.string().trim().min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে').max(100),
  email: z.string().trim().email('সঠিক ইমেইল দিন').max(255),
  phone: z.string().trim().regex(/^(\+880|0)[0-9]{10}$/, 'সঠিক বাংলাদেশি নম্বর দিন (01XXXXXXXXX)').max(20),
});

type PaymentMethod = 'bkash' | 'nagad' | 'rocket';

const paymentMethods: { id: PaymentMethod; label: string; color: string; number: string }[] = [
  { id: 'bkash', label: 'bKash', color: 'from-pink-600 to-pink-700', number: '01840099853' },
  { id: 'nagad', label: 'Nagad', color: 'from-orange-500 to-orange-600', number: '01840099853' },
  { id: 'rocket', label: 'Rocket', color: 'from-purple-600 to-purple-700', number: '018400998538' },
];

const Checkout = () => {
  const { items, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const finalTotal = Math.max(0, cartTotal - couponDiscount);
  const selectedPayment = paymentMethods.find(p => p.id === paymentMethod)!;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      // Use the validate-coupon edge function which uses service role
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { code: couponCode.trim().toUpperCase(), orderTotal: cartTotal },
      });

      if (error || !data?.valid) {
        setCouponError(data?.message || 'কুপন কোড সঠিক নয়');
        setCouponDiscount(0);
        return;
      }
      setCouponDiscount(data.discount);
      setCouponError('');
    } catch {
      setCouponError('কুপন চেক করতে সমস্যা হয়েছে');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setErrors({});

    const parsed = checkoutSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach(err => { fieldErrors[err.path[0]] = err.message; });
      setErrors(fieldErrors);
      return;
    }

    if (!transactionId.trim()) { setSubmitError('Transaction ID দিন'); return; }
    if (items.length === 0) { setSubmitError('Cart empty'); return; }

    setLoading(true);
    try {
      const orderNum = 'ORD-' + Date.now().toString().slice(-8);
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNum,
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          subtotal: cartTotal,
          discount_amount: couponDiscount,
          total: finalTotal,
          payment_method: paymentMethod,
          transaction_id: transactionId.trim(),
          coupon_code: couponCode.trim().toUpperCase() || null,
          status: 'pending',
          payment_status: 'pending',
          user_id: null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      clearCart();
      setOrderNumber(orderNum);
      setOrderPlaced(true);
    } catch (err: unknown) {
      setSubmitError('অর্ডার দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle size={40} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">অর্ডার সফল! 🎉</h1>
            <p className="text-muted-foreground mt-2">আপনার অর্ডার নম্বর: <span className="text-primary font-mono font-bold">{orderNumber}</span></p>
            <p className="text-sm text-muted-foreground mt-3">পেমেন্ট যাচাইয়ের পর আপনার ইমেইলে লাইসেন্স কি পাঠানো হবে। সাধারণত ১–২ ঘন্টার মধ্যে।</p>
          </div>
          <button onClick={() => navigate('/')} className="btn-glow px-8 py-3 rounded-xl font-semibold">
            হোমে ফিরে যাও
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-card border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-primary" />
            <h1 className="font-bold text-foreground">Checkout</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 grid md:grid-cols-[1fr_360px] gap-6">
        {/* Left: Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Info */}
          <div className="glass-card p-5 rounded-2xl border border-border space-y-4">
            <h2 className="font-bold text-foreground">📋 আপনার তথ্য</h2>
            {['name', 'email', 'phone'].map(field => (
              <div key={field}>
                <label className="text-sm text-muted-foreground mb-1 block capitalize">
                  {field === 'name' ? 'পুরো নাম' : field === 'email' ? 'ইমেইল' : 'ফোন নম্বর'}
                </label>
                <input
                  type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                  value={form[field as keyof typeof form]}
                  onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                  placeholder={field === 'name' ? 'আপনার নাম' : field === 'email' ? 'example@email.com' : '01XXXXXXXXX'}
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                />
                {errors[field] && <p className="text-destructive text-xs mt-1">{errors[field]}</p>}
              </div>
            ))}
          </div>

          {/* Payment Method */}
          <div className="glass-card p-5 rounded-2xl border border-border space-y-4">
            <h2 className="font-bold text-foreground">💳 পেমেন্ট পদ্ধতি</h2>
            <div className="grid grid-cols-3 gap-3">
              {paymentMethods.map(pm => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`py-3 rounded-xl font-bold text-white text-sm transition-all bg-gradient-to-r ${pm.color} ${paymentMethod === pm.id ? 'ring-2 ring-offset-2 ring-offset-background scale-105' : 'opacity-70 hover:opacity-90'}`}
                  
                >
                  {pm.label}
                </button>
              ))}
            </div>

            {/* Payment Instructions */}
            <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                <Smartphone size={16} className="text-primary" />
                <span>{selectedPayment.label} নম্বরে পাঠান</span>
              </div>
              <div className="font-mono text-xl font-bold text-primary text-center py-2">
                {selectedPayment.number}
              </div>
              <p className="text-xs text-muted-foreground text-center">মোট: <span className="text-foreground font-bold">৳{finalTotal.toLocaleString()}</span> Send Money করুন</p>
            </div>

            {/* Transaction ID */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Transaction ID (TrxID)</label>
              <input
                type="text"
                value={transactionId}
                onChange={e => setTransactionId(e.target.value)}
                placeholder="যেমন: 8F3K2P9X"
                maxLength={50}
                className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all font-mono"
              />
            </div>
          </div>

          {submitError && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm px-4 py-3 rounded-xl">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-glow py-4 rounded-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Processing...</>
            ) : (
              <>অর্ডার দিন ৳{finalTotal.toLocaleString()}</>
            )}
          </button>
        </form>

        {/* Right: Order Summary */}
        <div className="space-y-4">
          <div className="glass-card p-5 rounded-2xl border border-border space-y-4">
            <h2 className="font-bold text-foreground">🛒 অর্ডার সামারি</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex gap-3">
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/48x48/0a1628/00b4d8?text=P'; }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground line-clamp-2">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">x{item.quantity}</p>
                  </div>
                  <span className="text-xs font-bold text-primary flex-shrink-0">৳{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponDiscount(0); setCouponError(''); }}
                    placeholder="Coupon code"
                    maxLength={30}
                    className="w-full bg-muted/30 border border-border rounded-xl pl-9 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-4 py-2.5 rounded-xl border border-primary/40 text-primary text-sm font-medium hover:bg-primary/10 transition-colors disabled:opacity-50"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
              {couponError && <p className="text-destructive text-xs mt-1">{couponError}</p>}
              {couponDiscount > 0 && <p className="text-green-400 text-xs mt-1">✅ ৳{couponDiscount.toLocaleString()} ছাড় পেয়েছেন!</p>}
            </div>

            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span><span>৳{cartTotal.toLocaleString()}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-400">
                  <span>Discount</span><span>-৳{couponDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-foreground text-base">
                <span>Total</span><span className="text-primary">৳{finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>✅ Instant Delivery after payment verification</p>
            <p>✅ License key via email & dashboard</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
