import { useState } from 'react';
import { X, MessageCircle, CreditCard, Smartphone, CheckCircle, Tag, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

interface Product {
  id: string | number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
}

interface QuickOrderModalProps {
  product: Product;
  onClose: () => void;
}

const schema = z.object({
  name: z.string().trim().min(2, 'নাম কমপক্ষে ২ অক্ষর'),
  email: z.string().trim().email('সঠিক ইমেইল দিন'),
  phone: z.string().trim().regex(/^(\+880|0)[0-9]{10}$/, 'সঠিক বাংলাদেশি নম্বর (01XXXXXXXXX)'),
});

type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'upay' | 'bkash_merchant';

const paymentMethods: { id: PaymentMethod; label: string; color: string; number: string; type: string }[] = [
  { id: 'bkash',          label: 'bKash',          color: 'from-pink-600 to-pink-700',     number: '01820060046', type: 'Send Money' },
  { id: 'nagad',          label: 'Nagad',          color: 'from-orange-500 to-orange-600', number: '01840099853', type: 'Send Money' },
  { id: 'rocket',         label: 'Rocket',         color: 'from-purple-600 to-purple-700', number: '01840099853', type: 'Send Money' },
  { id: 'upay',           label: 'উপায়',           color: 'from-green-600 to-green-700',   number: '01840099853', type: 'Send Money' },
  { id: 'bkash_merchant', label: 'bKash Merchant', color: 'from-pink-700 to-rose-700',     number: '01840099853', type: 'Merchant Payment' },
];

const inputClass = "w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all";

const QuickOrderModal = ({ product, onClose }: QuickOrderModalProps) => {
  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [submitError, setSubmitError] = useState('');

  const finalTotal = Math.max(0, product.price - couponDiscount);
  const selectedPayment = paymentMethods.find(p => p.id === paymentMethod)!;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { code: couponCode.trim().toUpperCase(), orderTotal: product.price },
      });
      if (error || !data?.valid) {
        setCouponError(data?.message || 'কুপন কোড সঠিক নয়');
        setCouponDiscount(0);
      } else {
        setCouponDiscount(data.discount);
      }
    } catch {
      setCouponError('কুপন চেক করতে সমস্যা হয়েছে');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleInfoNext = () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.errors.forEach(e => { errs[String(e.path[0])] = e.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep('payment');
  };

  const handlePlaceOrder = async () => {
    if (!transactionId.trim()) { setSubmitError('Transaction ID দিন'); return; }
    setSubmitError('');
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
          subtotal: product.price,
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

      await supabase.from('order_items').insert({
        order_id: order.id,
        product_name: product.name,
        product_id: typeof product.id === 'string' ? product.id : null,
        price: product.price,
        quantity: 1,
        total: product.price,
      });

      setOrderNumber(orderNum);
      setStep('success');
    } catch {
      setSubmitError('অর্ডার দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-5 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover"
              onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40/0a1628/00b4d8?text=P'; }} />
            <div>
              <p className="text-xs text-muted-foreground">{product.category}</p>
              <p className="text-sm font-bold text-foreground line-clamp-1">{product.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* ══ SUCCESS ══ */}
          {step === 'success' && (
            <div className="text-center space-y-4 py-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle size={32} className="text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">অর্ডার সফল! 🎉</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  অর্ডার নম্বর: <span className="text-primary font-mono font-bold">{orderNumber}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  পেমেন্ট যাচাইয়ের পর আপনার ইমেইলে লাইসেন্স কি পাঠানো হবে। সাধারণত ১–২ ঘন্টার মধ্যে।
                </p>
              </div>
              <button onClick={onClose} className="btn-glow px-8 py-2.5 rounded-xl font-semibold text-sm w-full">
                ঠিক আছে
              </button>
            </div>
          )}

          {/* ══ STEP 1: Customer Info ══ */}
          {step === 'info' && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</span>
                <span className="text-sm font-semibold text-foreground">আপনার তথ্য দিন</span>
              </div>

              <div className="space-y-3">
                {[
                  { field: 'name', label: 'পুরো নাম', type: 'text', placeholder: 'আপনার নাম' },
                  { field: 'email', label: 'ইমেইল', type: 'email', placeholder: 'example@email.com' },
                  { field: 'phone', label: 'ফোন নম্বর', type: 'tel', placeholder: '01XXXXXXXXX' },
                ].map(({ field, label, type, placeholder }) => (
                  <div key={field}>
                    <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                    <input
                      type={type}
                      value={form[field as keyof typeof form]}
                      onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                      placeholder={placeholder}
                      className={inputClass}
                    />
                    {errors[field] && <p className="text-destructive text-xs mt-1">{errors[field]}</p>}
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">কুপন কোড (ঐচ্ছিক)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={couponCode}
                      onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponDiscount(0); setCouponError(''); }}
                      placeholder="SAVE20"
                      maxLength={30}
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                  <button type="button" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2.5 rounded-xl border border-primary/40 text-primary text-xs font-medium hover:bg-primary/10 transition-colors disabled:opacity-50">
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-destructive text-xs mt-1">{couponError}</p>}
                {couponDiscount > 0 && <p className="text-accent text-xs mt-1">✅ ৳{couponDiscount.toLocaleString()} ছাড় পেয়েছেন!</p>}
              </div>

              {/* Price Summary */}
              <div className="glass-card rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>মূল্য</span><span>৳{product.price.toLocaleString()}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-accent">
                    <span>ছাড়</span><span>-৳{couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-foreground border-t border-border pt-1.5 mt-1.5">
                  <span>মোট</span><span className="text-primary text-lg">৳{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              <button onClick={handleInfoNext} className="w-full btn-glow py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                পেমেন্টে যান <ChevronDown size={16} className="-rotate-90" />
              </button>
            </>
          )}

          {/* ══ STEP 2: Payment ══ */}
          {step === 'payment' && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">2</span>
                <span className="text-sm font-semibold text-foreground">পেমেন্ট করুন</span>
                <button onClick={() => setStep('info')} className="ml-auto text-xs text-muted-foreground hover:text-foreground">← পিছনে</button>
              </div>

              {/* Payment method selector */}
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map(pm => (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`py-2.5 rounded-xl font-bold text-white text-sm bg-gradient-to-r ${pm.color} transition-all ${paymentMethod === pm.id ? 'ring-2 ring-offset-2 ring-offset-background scale-105 shadow-lg' : 'opacity-60 hover:opacity-90'}`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>

              {/* Payment instruction box */}
              <div className="bg-muted/20 border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                  <Smartphone size={15} className="text-primary" />
                  {selectedPayment.label} নম্বরে Send Money করুন
                </div>
                <div className="text-center">
                  <p className="font-mono text-2xl font-bold text-primary tracking-wider">{selectedPayment.number}</p>
                  <p className="text-xs text-muted-foreground mt-1">মোট পাঠান: <span className="text-foreground font-bold">৳{finalTotal.toLocaleString()}</span></p>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 text-xs text-muted-foreground leading-relaxed">
                  ১. উপরের নম্বরে {selectedPayment.label} থেকে Send Money করুন<br/>
                  ২. Transaction ID কপি করুন<br/>
                  ৩. নিচে TrxID বক্সে পেস্ট করুন
                </div>
              </div>

              {/* Transaction ID */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Transaction ID (TrxID) *</label>
                <input
                  value={transactionId}
                  onChange={e => setTransactionId(e.target.value)}
                  placeholder="যেমন: 8F3K2P9X"
                  maxLength={50}
                  className={`${inputClass} font-mono tracking-wider`}
                />
              </div>

              {/* Total reminder */}
              <div className="flex justify-between items-center glass-card rounded-xl p-3">
                <span className="text-sm text-muted-foreground">পেমেন্ট মোট</span>
                <span className="text-xl font-bold text-primary">৳{finalTotal.toLocaleString()}</span>
              </div>

              {submitError && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm px-4 py-3 rounded-xl">
                  {submitError}
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full btn-glow py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Processing...</>
                ) : (
                  <><CreditCard size={16} /> অর্ডার কনফার্ম করুন</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickOrderModal;
