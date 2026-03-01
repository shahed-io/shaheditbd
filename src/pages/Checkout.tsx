import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import { ShoppingBag, Tag, Upload, CreditCard, CheckCircle, Copy, AlertCircle, ArrowLeft } from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'bkash', label: 'bKash', number: '01840-099853', color: 'from-pink-600 to-pink-700', emoji: '🟣' },
  { id: 'nagad', label: 'নগদ', number: '01840-099853', color: 'from-orange-500 to-orange-600', emoji: '🟠' },
  { id: 'rocket', label: 'রকেট', number: '01840-099853', color: 'from-purple-600 to-purple-700', emoji: '🟣' },
];

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productId = searchParams.get('product');

  const [product, setProduct] = useState<any>(null);
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
        .then(({ data }) => setProduct(data));
    }
  }, [productId]);

  const finalPrice = product ? Math.max(0, Number(product.price) - couponDiscount) : 0;

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
    if (data.min_order_amount && Number(product?.price) < Number(data.min_order_amount)) {
      toast.error(`ন্যূনতম অর্ডার ৳${data.min_order_amount} হতে হবে`); setCouponLoading(false); return;
    }

    let discount = 0;
    if (data.discount_type === 'percentage') {
      discount = (Number(product?.price) * Number(data.discount_value)) / 100;
    } else {
      discount = Number(data.discount_value);
    }
    setCouponDiscount(Math.min(discount, Number(product?.price)));
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
    if (!product) return;
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
        subtotal: Number(product.price),
        discount_amount: couponDiscount,
        total: finalPrice,
        coupon_id: couponId,
        coupon_code: couponApplied ? couponCode.trim().toUpperCase() : null,
      }).select().single();

      if (error) throw error;

      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        price: Number(product.price),
        quantity: 1,
        total: finalPrice,
      });

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
      if (screenshot && user) {
        const path = `${user.id}/${createdOrder.id}/${Date.now()}-${screenshot.name}`;
        const { data: uploadData } = await supabase.storage.from('payment-proofs').upload(path, screenshot);
        if (uploadData) screenshotUrl = path;
      }

      await supabase.from('payment_proofs').insert({
        order_id: createdOrder.id,
        user_id: user?.id || null,
        transaction_id: transactionId.trim(),
        screenshot_url: screenshotUrl,
        payment_method: selectedPayment,
        amount: finalPrice,
        status: 'pending',
      });

      await supabase.from('orders').update({ payment_status: 'proof_submitted', status: 'processing' }).eq('id', createdOrder.id);

      if (couponApplied && couponId) {
        await supabase.from('coupons').update({ uses_count: supabase.rpc as any }).eq('id', couponId);
      }

      setStep('done');
      toast.success('Payment proof জমা হয়েছে! Admin verify করবে।');
    } catch (e) {
      toast.error('Proof জমা দিতে সমস্যা হয়েছে');
    }
    setLoading(false);
  };

  if (!product && productId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 text-center animate-pulse">
          <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading product...</p>
        </div>
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

          {/* Product Summary */}
          {product && step !== 'done' && (
            <div className="glass-card rounded-2xl p-4 mb-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted/30 flex-shrink-0">
                {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center"><ShoppingBag size={22} className="text-muted-foreground" /></div>}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{product.name}</p>
                {product.original_price && <p className="text-xs text-muted-foreground line-through">৳{Number(product.original_price).toLocaleString()}</p>}
              </div>
              <div className="text-right">
                {couponApplied && <p className="text-xs text-muted-foreground line-through">৳{Number(product.price).toLocaleString()}</p>}
                <p className="text-xl font-black text-primary">৳{finalPrice.toLocaleString()}</p>
                {couponApplied && <p className="text-xs text-green-400">-৳{couponDiscount.toFixed(0)} ছাড়</p>}
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
                  <div className="flex justify-between"><span>পরিমাণ:</span><span className="text-primary font-bold">৳{finalPrice.toLocaleString()}</span></div>
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
                <label className="text-xs text-muted-foreground mb-1.5 block">Payment Screenshot (ঐচ্ছিক কিন্তু দিলে verify দ্রুত হয়)</label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 cursor-pointer transition-colors">
                  {screenshotPreview ? (
                    <img src={screenshotPreview} alt="screenshot" className="max-h-48 rounded-lg object-contain" />
                  ) : (
                    <>
                      <Upload size={28} className="text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">ছবি আপলোড করুন (JPG/PNG, max 5MB)</p>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleScreenshotChange} className="hidden" />
                </label>
              </div>

              <button onClick={handleSubmitProof} disabled={loading}
                className="w-full btn-glow py-3 rounded-xl font-semibold text-sm">
                {loading ? 'জমা হচ্ছে...' : 'Proof জমা দিন ✓'}
              </button>
            </div>
          )}

          {/* STEP 4: Done */}
          {step === 'done' && (
            <div className="glass-card rounded-2xl p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-foreground">অর্ডার সফলভাবে জমা হয়েছে!</h2>
              <p className="text-muted-foreground text-sm">আপনার Payment Proof আমরা পেয়েছি। Admin verify করলে আপনি ইমেইলে License Key / Credentials পাবেন এবং My Orders-এও দেখতে পাবেন।</p>
              <div className="glass-card rounded-xl p-4 text-sm">
                <div className="flex justify-between mb-1"><span className="text-muted-foreground">অর্ডার নম্বর:</span><span className="text-primary font-bold">{createdOrder?.order_number}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status:</span><span className="text-yellow-400">Verification Pending</span></div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => navigate('/my-orders')} className="flex-1 btn-glow py-2.5 rounded-xl text-sm font-medium">My Orders দেখুন</button>
                <button onClick={() => navigate('/')} className="flex-1 glass-card border border-border py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">হোমে ফিরুন</button>
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
