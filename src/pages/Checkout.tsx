import { useState, useEffect, useRef } from 'react';
import PaymentInstructions from '@/components/store/PaymentInstructions';
import type { PMId } from '@/components/store/PaymentInstructions';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft, ShoppingCart, Tag, CheckCircle, Smartphone,
  Minus, Plus, Trash2, X, Loader2, Shield, Info, ChevronDown, User, LogIn, FileText, Wallet, Package
} from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import bkashLogo from '@/assets/payment/bkash.png';
import nagadLogo from '@/assets/payment/nagad.png';
import rocketLogo from '@/assets/payment/rocket.png';
import upayLogo from '@/assets/payment/upay.png';
import bkashMerchantLogo from '@/assets/payment/bkash-merchant.png';

const checkoutSchema = z.object({
  name: z.string().trim().min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে').max(100),
  email: z.string().trim().email('সঠিক ইমেইল দিন').max(255),
  phone: z.string().trim().regex(/^(\+880|0)[0-9]{10}$/, 'সঠিক বাংলাদেশি নম্বর দিন (01XXXXXXXXX)').max(20),
});

type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'upay' | 'bkash_merchant' | 'wallet';

const paymentMethods: { id: PaymentMethod; label: string; color: string; number: string; type: string; logo?: string }[] = [
  { id: 'wallet',         label: 'Wallet',        color: 'from-violet-600 to-purple-700',  number: '', type: 'Wallet Balance' },
  { id: 'bkash',          label: 'bKash',         color: 'from-pink-600 to-pink-700',     number: '01820060046', type: 'Send Money',       logo: bkashLogo },
  { id: 'nagad',          label: 'Nagad',          color: 'from-orange-500 to-orange-600', number: '01840099853', type: 'Send Money',       logo: nagadLogo },
  { id: 'rocket',         label: 'Rocket',         color: 'from-purple-600 to-purple-700', number: '01840099853', type: 'Send Money',       logo: rocketLogo },
  { id: 'upay',           label: 'উপায়',           color: 'from-green-600 to-green-700',   number: '01840099853', type: 'Send Money',       logo: upayLogo },
  { id: 'bkash_merchant', label: 'bKash Merchant', color: 'from-pink-700 to-rose-700',     number: '01840099853', type: 'Merchant Payment', logo: bkashMerchantLogo },
];

const Checkout = () => {
  const {
    items, subtotal, discountAmount, taxAmount, serviceFee, finalTotal,
    clearCart, updateQuantity, removeFromCart,
    coupon, setCoupon, resetCoupon,
    orderNotes, setOrderNotes,
    termsAccepted, setTermsAccepted,
    saveAbandonedCart,
  } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Filter payment methods: guests can't use wallet
  const availablePaymentMethods = paymentMethods.filter(pm => pm.id !== 'wallet' || !!user);

  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [couponCode, setCouponCode] = useState(coupon.isApplied ? coupon.code : '');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(true);
  const abandonedTimer = useRef<ReturnType<typeof setTimeout>>();
  const [walletBalance, setWalletBalance] = useState(0);

  // If user logs out while wallet is selected, switch to bkash
  useEffect(() => {
    if (!user && paymentMethod === 'wallet') {
      setPaymentMethod('bkash');
    }
  }, [user]);

  // Auto-fill from logged-in user profile + fetch wallet balance
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('display_name, email, phone, wallet_balance').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setForm(prev => ({
            name: prev.name || data.display_name || '',
            email: prev.email || data.email || user.email || '',
            phone: prev.phone || data.phone || '',
          }));
          setWalletBalance((data as any).wallet_balance || 0);
        }
      });
  }, [user?.id]);

  // Auto-apply coupon from URL ?coupon=CODE
  useEffect(() => {
    const urlCoupon = searchParams.get('coupon');
    if (urlCoupon && !coupon.isApplied) {
      setCouponCode(urlCoupon.toUpperCase());
      // Delay to let subtotal compute
      setTimeout(() => handleApplyCoupon(urlCoupon.toUpperCase()), 500);
    }
  }, []);

  // Abandoned cart: save after 90s if email typed
  useEffect(() => {
    if (form.email && items.length > 0) {
      clearTimeout(abandonedTimer.current);
      abandonedTimer.current = setTimeout(() => saveAbandonedCart(form.email), 90000);
    }
    return () => clearTimeout(abandonedTimer.current);
  }, [form.email, items]);

  const handleApplyCoupon = async (code?: string) => {
    const c = (code || couponCode).trim().toUpperCase();
    if (!c) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { code: c, orderTotal: subtotal },
      });
      if (error || !data?.valid) {
        setCouponError(data?.message || 'কুপন কোড সঠিক নয়');
        resetCoupon();
        return;
      }
      setCoupon({ code: c, discount: data.discount, type: data.type || 'fixed', isApplied: true });
      toast.success(`✅ কুপন প্রয়োগ হয়েছে! ৳${data.discount} ছাড়`);
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

    if (!termsAccepted) {
      setSubmitError('Terms & Conditions মেনে নিতে হবে');
      return;
    }

    const parsed = checkoutSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach(err => { fieldErrors[err.path[0]] = err.message; });
      setErrors(fieldErrors);
      return;
    }

    if (paymentMethod !== 'wallet' && !transactionId.trim()) { setSubmitError('Transaction ID দিন'); return; }
    if (items.length === 0) { setSubmitError('Cart empty'); return; }

    // Wallet: check balance
    if (paymentMethod === 'wallet') {
      if (!user) { setSubmitError('Wallet পেমেন্টের জন্য লগইন করতে হবে'); return; }
      if (walletBalance < finalTotal) {
        setSubmitError(`ওয়ালেট ব্যালেন্স অপর্যাপ্ত। বর্তমান ব্যালেন্স: ৳${walletBalance}`);
        return;
      }
    }

    setLoading(true);
    try {
      const orderNum = 'ORD-' + Array.from(crypto.getRandomValues(new Uint8Array(5))).map(b => b.toString(36)).join('').toUpperCase().slice(0, 8);

      // Get coupon ID if applied
      let couponId: string | null = null;
      if (coupon.isApplied && coupon.code) {
        const { data: couponData } = await supabase
          .from('coupons')
          .select('id')
          .eq('code', coupon.code)
          .single();
        couponId = couponData?.id || null;
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNum,
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          subtotal,
          discount_amount: discountAmount,
          total: finalTotal,
          payment_method: paymentMethod,
          transaction_id: paymentMethod === 'wallet' ? `WALLET-${orderNum}` : transactionId.trim(),
          coupon_code: coupon.isApplied ? coupon.code : null,
          coupon_id: couponId,
          status: paymentMethod === 'wallet' ? 'processing' : 'pending',
          payment_status: paymentMethod === 'wallet' ? 'paid' : 'pending',
          user_id: user?.id || null,
          notes: orderNotes.trim() || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Debit wallet if wallet payment
      if (paymentMethod === 'wallet' && user) {
        const { data: walletResult } = await supabase.rpc('wallet_debit' as any, {
          p_user_id: user.id,
          p_amount: finalTotal,
          p_note: `অর্ডার পেমেন্ট - ${orderNum}`,
          p_reference_id: order.id,
          p_created_by: 'user',
        });
        if (!(walletResult as any)?.success) throw new Error('Wallet debit failed');
      }

      // Insert order items with product_id if available
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_name: item.name + (item.variant ? ` (${item.variant})` : ''),
        product_id: typeof item.id === 'string' && item.id.includes('-') ? item.id : null,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // Increment coupon uses_count
      if (couponId) {
        try {
          const { data: couponRow } = await supabase.from('coupons').select('uses_count').eq('id', couponId).single();
          await supabase.from('coupons').update({ uses_count: (couponRow?.uses_count || 0) + 1 }).eq('id', couponId);
        } catch { /* silent */ }
      }

      clearCart();
      setOrderNumber(orderNum);
      setOrderPlaced(true);
    } catch (err: unknown) {
      console.error(err);
      setSubmitError('অর্ডার দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const selectedPayment = paymentMethods.find(p => p.id === paymentMethod)!;

  // ===== Success Screen =====
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto">
            <CheckCircle size={44} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">অর্ডার সফল! 🎉</h1>
            <p className="text-muted-foreground mt-2">
              অর্ডার নম্বর: <span className="text-primary font-mono font-bold">{orderNumber}</span>
            </p>
            {paymentMethod === 'wallet' ? (
              <div className="mt-3 p-4 rounded-2xl bg-violet-500/10 border border-violet-400/30 text-left space-y-1.5">
                <p className="text-sm font-bold text-violet-700 flex items-center gap-2"><Wallet size={15} /> ওয়ালেট পেমেন্ট সম্পন্ন</p>
                <p className="text-xs text-violet-600">আপনার ওয়ালেট থেকে ৳{finalTotal.toLocaleString()} কেটে নেওয়া হয়েছে।</p>
                <p className="text-xs text-muted-foreground">অর্ডারটি প্রক্রিয়াধীন। লাইসেন্স কি শীঘ্রই আপনার ড্যাশবোর্ডে দেখা যাবে।</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-3">
                পেমেন্ট যাচাইয়ের পর আপনার ইমেইলে লাইসেন্স কি পাঠানো হবে।
                সাধারণত ১–২ ঘন্টার মধ্যে।
              </p>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/')} className="px-6 py-3 rounded-xl font-semibold text-sm border border-border text-muted-foreground hover:text-foreground transition-colors">
              হোমে ফিরে যাও
            </button>
            {user && (
              <button onClick={() => navigate('/dashboard')} className="btn-glow px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2">
                <Package size={15} /> আমার অর্ডার দেখুন
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 glass-card border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-primary" />
              <h1 className="font-bold text-foreground">Checkout</h1>
            </div>
          </div>
          {/* Guest / User badge */}
          <div className="flex items-center gap-2 text-xs">
            {user ? (
              <span className="flex items-center gap-1 text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                <User size={11} /> {user.email?.split('@')[0]}
              </span>
            ) : (
              <button onClick={() => navigate('/?auth=login')} className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                <LogIn size={13} /> লগইন করুন
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 grid md:grid-cols-[1fr_360px] gap-6 items-start">

        {/* ===== LEFT: FORM ===== */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Customer Info */}
          <div className="glass-card p-5 rounded-2xl border border-border space-y-4">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <span>📋</span> আপনার তথ্য
              {!user && <span className="text-xs text-muted-foreground font-normal ml-auto">Guest Checkout</span>}
            </h2>
            {[
              { key: 'name', label: 'পুরো নাম *', type: 'text', placeholder: 'আপনার নাম' },
              { key: 'email', label: 'ইমেইল *', type: 'email', placeholder: 'example@email.com' },
              { key: 'phone', label: 'ফোন নম্বর *', type: 'tel', placeholder: '01XXXXXXXXX' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="text-sm text-muted-foreground mb-1 block">{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className={`w-full bg-muted/30 border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all text-sm ${errors[key] ? 'border-destructive/60' : 'border-border'}`}
                />
                {errors[key] && <p className="text-destructive text-xs mt-1">{errors[key]}</p>}
              </div>
            ))}
          </div>

          {/* Payment Method */}
          <div className="glass-card p-5 rounded-2xl border border-border space-y-4">
            <h2 className="font-bold text-foreground">💳 পেমেন্ট পদ্ধতি</h2>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {availablePaymentMethods.map(pm => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl text-xs font-semibold transition-all border-2 ${
                    paymentMethod === pm.id
                      ? 'border-primary bg-primary/8 scale-105 shadow-md text-foreground'
                      : 'border-border bg-background/60 hover:border-primary/40 text-muted-foreground'
                  }`}
                >
                  {pm.logo ? (
                    <img src={pm.logo} alt={pm.label} className="h-8 w-auto object-contain rounded-md" />
                  ) : (
                    <div className={`h-8 w-10 rounded-md flex items-center justify-center bg-gradient-to-br ${pm.color}`}>
                      <Wallet size={16} className="text-white" />
                    </div>
                  )}
                  <span>{pm.label}</span>
                </button>
              ))}
            </div>

            {/* Wallet balance display */}
            {paymentMethod === 'wallet' && (
              <div className={`rounded-xl p-4 space-y-2 border ${walletBalance >= finalTotal ? 'bg-green-500/10 border-green-500/30' : 'bg-destructive/10 border-destructive/30'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Wallet size={16} className="text-primary" />
                    <span>ওয়ালেট ব্যালেন্স</span>
                  </div>
                  <span className={`font-bold text-lg ${walletBalance >= finalTotal ? 'text-green-500' : 'text-destructive'}`}>
                    ৳{walletBalance.toLocaleString()}
                  </span>
                </div>
                {walletBalance >= finalTotal ? (
                  <p className="text-xs text-green-500">✅ পর্যাপ্ত ব্যালেন্স আছে। কোনো Transaction ID দরকার নেই।</p>
                ) : (
                  <p className="text-xs text-destructive">❌ ব্যালেন্স কম। আরও ৳{(finalTotal - walletBalance).toLocaleString()} দরকার। Dashboard থেকে টপ-আপ করুন।</p>
                )}
                {!user && <p className="text-xs text-destructive">⚠️ Wallet পেমেন্টের জন্য লগইন করতে হবে</p>}
              </div>
            )}

            {/* Payment Instructions (only for non-wallet) */}
            {paymentMethod !== 'wallet' && (
              <>
                <PaymentInstructions
                  paymentMethodId={paymentMethod as PMId}
                  amount={finalTotal}
                  amountLabel="মোট পরিমাণ"
                />

                {/* Transaction ID */}
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block font-semibold">Transaction ID (TrxID) *</label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={e => setTransactionId(e.target.value)}
                    placeholder="যেমন: 8F3K2P9X"
                    maxLength={50}
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-mono text-sm"
                  />
                </div>
              </>
            )}
          </div>

          {/* Order Notes */}
          <div className="glass-card p-5 rounded-2xl border border-border space-y-3">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <FileText size={16} className="text-muted-foreground" /> Order Notes
              <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </h2>
            <textarea
              value={orderNotes}
              onChange={e => setOrderNotes(e.target.value)}
              placeholder="কোনো বিশেষ নির্দেশনা বা মন্তব্য..."
              rows={3}
              maxLength={500}
              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{orderNotes.length}/500</p>
          </div>

          {/* Terms & Conditions */}
          <div className="glass-card p-4 rounded-2xl border border-border">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
              />
              <span className="text-sm text-muted-foreground leading-relaxed">
                আমি{' '}
                <button type="button" onClick={() => navigate('/terms')} className="text-primary hover:underline">Terms & Conditions</button>
                {' '}এবং{' '}
                <button type="button" onClick={() => navigate('/refund-policy')} className="text-primary hover:underline">Refund Policy</button>
                {' '}পড়েছি এবং সম্মত আছি।
              </span>
            </label>
          </div>

          {submitError && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              <X size={14} /> {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !termsAccepted || items.length === 0}
            className="w-full btn-glow py-4 rounded-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Processing...</>
            ) : (
              <>অর্ডার দিন — ৳{finalTotal.toLocaleString()}</>
            )}
          </button>

          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
            <Shield size={12} /> Secure checkout — Your data is protected
          </p>
        </form>

        {/* ===== RIGHT: ORDER SUMMARY ===== */}
        <div className="space-y-4 md:sticky md:top-20">
          <div className="glass-card rounded-2xl border border-border overflow-hidden">
            {/* Collapsible header on mobile */}
            <button
              type="button"
              onClick={() => setSummaryOpen(o => !o)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-border md:cursor-default"
            >
              <h2 className="font-bold text-foreground flex items-center gap-2">
                🛒 অর্ডার সামারি
                <span className="text-xs text-muted-foreground font-normal">({items.length} item{items.length !== 1 ? 's' : ''})</span>
              </h2>
              <ChevronDown size={16} className={`text-muted-foreground md:hidden transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
            </button>

            {summaryOpen && (
              <div className="px-5 py-4 space-y-4">
                {/* Items */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {items.map(item => (
                    <div key={`${item.id}-${item.variant}`} className="flex gap-3 group">
                      <img
                        src={item.image} alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/48x48/0a1628/00b4d8?text=P'; }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground line-clamp-1">{item.name}</p>
                        {item.variant && <p className="text-xs text-muted-foreground">{item.variant}</p>}
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-0 border border-border rounded-md overflow-hidden">
                            <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-1.5 py-0.5 text-muted-foreground hover:bg-muted/40 text-xs">
                              <Minus size={10} />
                            </button>
                            <span className="px-2 text-xs font-bold text-foreground">{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-1.5 py-0.5 text-muted-foreground hover:bg-muted/40 text-xs">
                              <Plus size={10} />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-primary">৳{(item.price * item.quantity).toLocaleString()}</span>
                            <button type="button" onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="pt-2 border-t border-border">
                  {!coupon.isApplied ? (
                    <div className="space-y-1">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="text"
                            value={couponCode}
                            onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                            onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                            placeholder="Coupon code"
                            maxLength={30}
                            className="w-full bg-muted/30 border border-border rounded-xl pl-8 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon()}
                          disabled={couponLoading || !couponCode.trim()}
                          className="px-4 py-2.5 rounded-xl border border-primary/40 text-primary text-sm font-medium hover:bg-primary/10 transition-colors disabled:opacity-50"
                        >
                          {couponLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                        </button>
                      </div>
                      {couponError && <p className="text-destructive text-xs">{couponError}</p>}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-400" />
                        <span className="text-xs text-green-400 font-medium">{coupon.code} — ৳{discountAmount.toLocaleString()} ছাড়</span>
                      </div>
                      <button type="button" onClick={() => { resetCoupon(); setCouponCode(''); }} className="text-muted-foreground hover:text-destructive">
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Pricing Breakdown */}
                <div className="border-t border-border pt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Coupon ({coupon.code})</span><span>-৳{discountAmount.toLocaleString()}</span>
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
                    <span>Total</span>
                    <span className="text-primary text-lg">৳{finalTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Trust badges */}
          <div className="glass-card rounded-2xl border border-border p-4 space-y-2 text-xs text-muted-foreground">
            <p className="flex items-center gap-2"><CheckCircle size={13} className="text-green-400 flex-shrink-0" /> Instant Delivery after payment verification</p>
            <p className="flex items-center gap-2"><CheckCircle size={13} className="text-green-400 flex-shrink-0" /> License key sent via email & dashboard</p>
            <p className="flex items-center gap-2"><Shield size={13} className="text-primary flex-shrink-0" /> Secure & encrypted transaction</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
