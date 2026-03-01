import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import { useCart } from '@/context/CartContext';
import {
  ShoppingBag, Tag, Upload, CreditCard, CheckCircle, Copy, AlertCircle,
  ArrowLeft, Trash2, Plus, Minus, Package
} from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'bkash', label: 'bKash', number: '01840-099853', color: 'from-pink-600 to-pink-700', emoji: '🟣' },
  { id: 'nagad', label: 'নগদ', number: '01840-099853', color: 'from-orange-500 to-orange-600', emoji: '🟠' },
  { id: 'rocket', label: 'রকেট', number: '01840-099853', color: 'from-purple-600 to-purple-700', emoji: '🟣' },
];

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productId = searchParams.get('product');
  const { items: cartItems, clearCart, subtotal: cartSubtotal } = useCart();

  const [directProduct, setDirectProduct] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState<'info' | 'payment' | 'proof' | 'done'>('info');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponId, setCouponId] = useState<string | null>(null);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  // Determine if we're in direct product mode or cart mode
  const isCartMode = !productId && cartItems.length > 0;
  const orderItems = directProduct
    ? [{ id: directProduct.id, name: directProduct.name, price: Number(directProduct.price), quantity: 1, image: directProduct.image_url }]
    : cartItems.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image }));

  const rawSubtotal = directProduct ? Number(directProduct.price) : cartSubtotal;
  const finalTotal = Math.max(0, rawSubtotal - couponDiscount);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        setEmail(data.user.email || '');
        setName(data.user.user_metadata?.display_name || '');
      }
    });
    if (productId) {
      supabase.from('products').select('*').eq('id', productId).single()
        .then(({ data }) => setDirectProduct(data));
    }
  }, [productId]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.trim().toUpperCase())
      .eq('is_active', true)
      .single();

    if (!data) { toast.error('অকার্যকর কুপন কোড!'); setCouponLoading(false); return; }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { toast.error('কুপনের মেয়াদ শেষ!'); setCouponLoading(false); return; }
    if (data.max_uses && data.uses_count >= data.max_uses) { toast.error('কুপনের ব্যবহার সীমা শেষ!'); setCouponLoading(false); return; }
    if (data.min_order_amount && rawSubtotal < Number(data.min_order_amount)) {
      toast.error(`ন্যূনতম অর্ডার ৳${data.min_order_amount} হতে হবে`); setCouponLoading(false); return;
    }

    let discount = 0;
    if (data.discount_type === 'percentage') {
      discount = (rawSubtotal * Number(data.discount_value)) / 100;
    } else {
      discount = Number(data.discount_value);
    }
    setCouponDiscount(Math.min(discount, rawSubtotal));
    setCouponId(data.id);
    setCouponApplied(true);
    toast.success(`কুপন প্রয়োগ হয়েছে! ৳${discount.toFixed(0)} ছাড়`);
    setCouponLoading(false);
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const handleSubmitOrder = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) { toast.error('সব তথ্য পূরণ করুন'); return; }
    if (orderItems.length === 0) { toast.error('কোনো product নেই'); return; }
    setLoading(true);
    try {
      const orderNumber = 'SS-' + Date.now().toString().slice(-8);
      const { data: order, error } = await supabase.from('orders').insert({
        order_number: orderNumber,
        customer_name: name.trim(),
        customer_email: email.trim(),
        customer_phone: phone.trim(),
        user_id: user?.id || null,
        payment_method: selectedPayment,
        payment_status: 'pending',
        status: 'pending',
        subtotal: rawSubtotal,
        discount_amount: couponDiscount,
        total: finalTotal,
        coupon_id: couponId,
        coupon_code: couponApplied ? couponCode.trim().toUpperCase() : null,
      }).select().single();

      if (error) throw error;

      // Insert all order items
      const itemInserts = orderItems.map(item => ({
        order_id: order.id,
        product_id: typeof item.id === 'string' && item.id.startsWith('local-') ? null : item.id,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      }));
      await supabase.from('order_items').insert(itemInserts);

      setCreatedOrder(order);
      setStep('payment');
      toast.success('অর্ডার তৈরি হয়েছে! Payment করুন');
    } catch (e: any) {
      toast.error('অর্ডার তৈরিতে সমস্যা হয়েছে');
    }
    setLoading(false);
  };

  const handleSubmitProof = async () => {
    if (!transactionId.trim()) { toast.error('Transaction ID দিন'); return; }
    setLoading(true);
    try {
      let screenshotUrl = null;
      if (screenshot) {
        const userId = user?.id || 'guest';
        const path = `${userId}/${createdOrder.id}/${Date.now()}-${screenshot.name}`;
        const { data: uploadData } = await supabase.storage.from('payment-proofs').upload(path, screenshot);
        if (uploadData) screenshotUrl = path;
      }

      await supabase.from('payment_proofs').insert({
        order_id: createdOrder.id,
        user_id: user?.id || null,
        transaction_id: transactionId.trim(),
        screenshot_url: screenshotUrl,
        payment_method: selectedPayment,
        amount: finalTotal,
        status: 'pending',
      });

      await supabase.from('orders').update({ payment_status: 'proof_submitted', status: 'processing' }).eq('id', createdOrder.id);

      // Clear cart after successful order
      if (isCartMode) clearCart();

      setStep('done');
      toast.success('Payment proof জমা হয়েছে! Admin verify করবে।');
    } catch (e) {
      toast.error('Proof জমা দিতে সমস্যা হয়েছে');
    }
    setLoading(false);
  };

  if (productId && !directProduct) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 text-center animate-pulse">
          <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!productId && cartItems.length === 0 && step === 'info') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="pt-36 pb-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="glass-card rounded-2xl p-12">
              <ShoppingBag size={48} className="text-muted-foreground mx-auto mb-4 opacity-40" />
              <h2 className="text-xl font-bold text-foreground mb-2">Cart খালি!</h2>
              <p className="text-muted-foreground text-sm mb-6">প্রথমে কোনো product cart-এ add করুন।</p>
              <button onClick={() => navigate('/')} className="btn-glow px-6 py-2.5 rounded-xl text-sm">
                Shop করুন
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-36 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate(-1)} className="p-2 text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>Checkout</h1>
              <p className="text-xs text-muted-foreground">নিরাপদ অর্ডার প্রক্রিয়া</p>
            </div>
          </div>

          {/* Steps */}
          <div className="flex items-center gap-2 mb-8">
            {['info', 'payment', 'proof', 'done'].map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s ? 'bg-primary text-background' :
                  ['info','payment','proof','done'].indexOf(step) > i ? 'bg-green-500 text-white' :
                  'bg-muted/40 text-muted-foreground'}`}>{i + 1}</div>
                {i < 3 && <div className={`h-0.5 flex-1 transition-all ${['info','payment','proof','done'].indexOf(step) > i ? 'bg-primary' : 'bg-border'}`} />}
              </div>
            ))}
          </div>

          {/* Order Summary */}
          {step !== 'done' && (
            <div className="glass-card rounded-2xl p-4 mb-5 space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1">
                <Package size={12} />
                Order Summary ({orderItems.length} item{orderItems.length > 1 ? 's' : ''})
              </p>
              {orderItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted/30 flex-shrink-0">
                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center"><ShoppingBag size={14} className="text-muted-foreground" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">৳{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
              <div className="border-t border-border pt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">৳{rawSubtotal.toLocaleString()}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400">Discount ({couponCode})</span>
                    <span className="text-green-400">-৳{couponDiscount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-xl text-primary">৳{finalTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Customer Info */}
          {step === 'info' && (
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <h2 className="font-bold text-foreground text-lg">আপনার তথ্য</h2>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">পুরো নাম *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="আপনার নাম"
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">ইমেইল *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com"
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">ফোন নম্বর *</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXXXXXXXX"
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
              </div>

              {/* Coupon */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">কুপন কোড (ঐচ্ছিক)</label>
                <div className="flex gap-2">
                  <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="COUPON CODE"
                    disabled={couponApplied}
                    className="flex-1 bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50" />
                  <button onClick={applyCoupon} disabled={couponLoading || couponApplied}
                    className={`px-4 rounded-xl text-sm font-medium flex items-center gap-1.5 ${couponApplied ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'btn-glow'}`}>
                    <Tag size={14} />
                    {couponApplied ? 'Applied!' : couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Payment পদ্ধতি</label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.id} onClick={() => setSelectedPayment(m.id)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${selectedPayment === m.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/50'}`}>
                      <div className="text-lg mb-1">{m.emoji}</div>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleSubmitOrder} disabled={loading}
                className="w-full btn-glow py-3 rounded-xl font-semibold text-sm">
                {loading ? 'অর্ডার তৈরি হচ্ছে...' : 'পরের ধাপ →'}
              </button>
            </div>
          )}

          {/* STEP 2: Payment Instructions */}
          {step === 'payment' && createdOrder && (
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard size={20} className="text-primary" />
                  <h2 className="font-bold text-foreground text-lg">Payment করুন</h2>
                </div>
                {(() => {
                  const method = PAYMENT_METHODS.find(m => m.id === selectedPayment)!;
                  return (
                    <div className={`bg-gradient-to-r ${method.color} rounded-xl p-5 text-white mb-4`}>
                      <p className="text-sm opacity-80 mb-1">{method.label} নম্বর:</p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-black tracking-wider">{method.number}</p>
                        <button onClick={() => { navigator.clipboard.writeText(method.number.replace(/-/g,'')); toast.success('নম্বর কপি হয়েছে!'); }}
                          className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors">
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between"><span>পরিমাণ:</span><span className="text-primary font-bold">৳{finalTotal.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>অর্ডার নম্বর:</span><span className="text-foreground font-medium">{createdOrder.order_number}</span></div>
                  <div className="flex justify-between"><span>Payment Type:</span><span className="text-foreground">Send Money</span></div>
                </div>

                <div className="mt-4 flex items-start gap-2 text-xs text-amber-400 bg-amber-400/10 rounded-xl p-3">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <p>Payment করার পর Transaction ID ও Screenshot পরের ধাপে দিন। Admin verify করলে product deliver হবে।</p>
                </div>
              </div>

              <button onClick={() => setStep('proof')} className="w-full btn-glow py-3 rounded-xl font-semibold text-sm">
                Payment করেছি, Proof দিতে যাই →
              </button>
            </div>
          )}

          {/* STEP 3: Payment Proof */}
          {step === 'proof' && (
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Upload size={20} className="text-primary" />
                <h2 className="font-bold text-foreground text-lg">Payment Proof জমা দিন</h2>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Transaction ID *</label>
                <input value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="যেমন: 8N7K2A1Q9P"
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Payment Screenshot (দ্রুত verify হয়)</label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 cursor-pointer transition-colors">
                  {screenshotPreview ? (
                    <img src={screenshotPreview} alt="screenshot" className="max-h-48 rounded-lg object-contain" />
                  ) : (
                    <>
                      <Upload size={28} className="text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Screenshot বেছে নিন</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG (max 5MB)</p>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleScreenshotChange} className="hidden" />
                </label>
              </div>

              <button onClick={handleSubmitProof} disabled={loading}
                className="w-full btn-glow py-3 rounded-xl font-semibold text-sm">
                {loading ? 'জমা হচ্ছে...' : 'Payment Proof জমা দিন ✓'}
              </button>
            </div>
          )}

          {/* STEP 4: Done */}
          {step === 'done' && createdOrder && (
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={40} className="text-green-400" />
              </div>
              <h2 className="text-2xl font-black gradient-text mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>অর্ডার সম্পন্ন!</h2>
              <p className="text-muted-foreground text-sm mb-4">
                আপনার payment proof পাওয়া গেছে। Admin verify করার পর আপনার ইমেইল ও My Orders-এ license key পাঠানো হবে।
              </p>
              <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 font-mono text-primary font-bold text-lg mb-6">
                {createdOrder.order_number}
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => navigate('/my-orders')} className="btn-glow py-3 rounded-xl font-semibold text-sm">
                  My Orders দেখুন
                </button>
                <button onClick={() => navigate('/')} className="glass-card border border-border text-muted-foreground py-3 rounded-xl text-sm hover:border-primary/50 transition-colors">
                  আরো কিনুন
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
