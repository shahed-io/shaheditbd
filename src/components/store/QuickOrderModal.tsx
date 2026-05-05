import { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, CreditCard, CheckCircle, Tag, ChevronDown, Wallet, Loader2, Shield, Package, LogIn } from 'lucide-react';
import AuthModal from '@/components/store/AuthModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import PaymentInstructions from '@/components/store/PaymentInstructions';
import type { PMId } from '@/components/store/PaymentInstructions';
import { usePaymentSettings } from '@/hooks/usePaymentSettings';
import bkashLogo from '@/assets/payment/bkash.png';
import nagadLogo from '@/assets/payment/nagad.png';
import rocketLogo from '@/assets/payment/rocket.png';
import upayLogo from '@/assets/payment/upay.png';
import bkashMerchantLogo from '@/assets/payment/bkash-merchant.png';
import type { CustomField } from '@/pages/admin/AdminProducts';

const ASSET_LOGOS: Record<string, string> = {
  bkash: bkashLogo,
  nagad: nagadLogo,
  rocket: rocketLogo,
  upay: upayLogo,
  bkash_merchant: bkashMerchantLogo,
};

interface Product {
  id: string | number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  customFields?: CustomField[];
}

interface QuickOrderModalProps {
  product: Product;
  onClose: () => void;
  quantity?: number;
}

const schema = z.object({
  name: z.string().trim().min(2, 'নাম কমপক্ষে ২ অক্ষর'),
  email: z.string().trim().email('সঠিক ইমেইল দিন'),
  phone: z.string().trim().regex(/^(\+880|0)[0-9]{10}$/, 'সঠিক বাংলাদেশি নম্বর (01XXXXXXXXX)'),
});

type PaymentMethod = PMId | 'wallet';

interface PaymentOption {
  id: PaymentMethod;
  label: string;
  color: string;
  logo?: string;
  isWallet?: boolean;
}

const inputClass = "w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all";

const QuickOrderModal = ({ product, onClose, quantity: initialQty = 1 }: QuickOrderModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { configs: paymentConfigs } = usePaymentSettings();

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
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const pendingSubmitRef = useRef(false);
  // Custom field values: { fieldId: value }
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [customFieldErrors, setCustomFieldErrors] = useState<Record<string, string>>({});

  const customFields: CustomField[] = product.customFields || [];
  const itemTotal = product.price * initialQty;
  const finalTotal = Math.max(0, itemTotal - couponDiscount);

  // Persistent session token for abandoned-checkout tracking (Quick Order)
  const sessionTokenRef = useRef<string>('');
  const abandonedTimer = useRef<ReturnType<typeof setTimeout>>();
  const orderPlacedRef = useRef(false);
  if (!sessionTokenRef.current) {
    let tok = '';
    try { tok = localStorage.getItem('quickorder_session_token') || ''; } catch {}
    if (!tok) {
      tok = 'qo_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      try { localStorage.setItem('quickorder_session_token', tok); } catch {}
    }
    sessionTokenRef.current = tok;
  }

  // ── Save abandoned checkout (debounced) when user fills info but doesn't complete ──
  useEffect(() => {
    if (orderPlacedRef.current) return;
    const hasContact = !!(form.email || form.phone || form.name);
    if (!hasContact) return;
    clearTimeout(abandonedTimer.current);
    abandonedTimer.current = setTimeout(async () => {
      try {
        const payload = {
          session_token: sessionTokenRef.current,
          user_id: user?.id || null,
          customer_name: form.name || null,
          customer_email: form.email || null,
          customer_phone: form.phone || null,
          cart_items: [{
            id: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            quantity: initialQty,
            image: product.image,
          }] as any,
          item_count: initialQty,
          subtotal: itemTotal,
          discount_amount: couponDiscount,
          total: finalTotal,
          coupon_code: couponCode.trim().toUpperCase() || null,
          payment_method: paymentMethod,
          notes: customFields.length > 0
            ? customFields.map(f => `${f.label}: ${customFieldValues[f.id] || '-'}`).join('\n')
            : null,
          page_url: typeof window !== 'undefined' ? window.location.href : null,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null,
          updated_at: new Date().toISOString(),
        };
        const { error } = await supabase
          .from('abandoned_checkouts')
          .upsert(payload, { onConflict: 'session_token' });
        if (error) console.warn('[quickorder abandoned] upsert error:', error.message);
      } catch (e) { console.warn('[quickorder abandoned] save failed:', e); }
    }, 1500);
    return () => clearTimeout(abandonedTimer.current);
  }, [form.name, form.email, form.phone, couponCode, couponDiscount, paymentMethod, customFieldValues, user?.id, initialQty]);

  // Auto-fill user info and fetch wallet balance
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('display_name, email, phone, wallet_balance')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm(prev => ({
            name: prev.name || (data as any).display_name || '',
            email: prev.email || (data as any).email || user.email || '',
            phone: prev.phone || (data as any).phone || '',
          }));
          setWalletBalance((data as any).wallet_balance || 0);
        }
      });
  }, [user?.id]);

  // Auto-submit after login if there was a pending submit
  useEffect(() => {
    if (user && pendingSubmitRef.current) {
      pendingSubmitRef.current = false;
      const timer = setTimeout(() => {
        handlePlaceOrder();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { code: couponCode.trim().toUpperCase(), orderTotal: itemTotal },
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
    // Validate custom fields
    const cfErrors: Record<string, string> = {};
    customFields.forEach(f => {
      if (f.required && !customFieldValues[f.id]?.trim()) {
        cfErrors[f.id] = `${f.label} আবশ্যিক`;
      }
    });
    if (Object.keys(cfErrors).length > 0) {
      setCustomFieldErrors(cfErrors);
      setErrors({});
      return;
    }
    setErrors({});
    setCustomFieldErrors({});
    setStep('payment');
  };

  const handlePlaceOrder = async () => {
    setSubmitError('');

    if (!user) {
      pendingSubmitRef.current = true;
      setSubmitError('অর্ডার করতে প্রথমে লগইন করুন');
      setShowAuthModal(true);
      return;
    }

    // Wallet checks
    if (paymentMethod === 'wallet') {
      if (!user) { setSubmitError('Wallet পেমেন্টের জন্য লগইন করতে হবে'); return; }
      if (walletBalance < finalTotal) {
        setSubmitError(`ব্যালেন্স অপর্যাপ্ত। বর্তমান: ৳${walletBalance.toLocaleString()}, দরকার: ৳${finalTotal.toLocaleString()}`);
        return;
      }
    } else {
      if (!transactionId.trim()) { setSubmitError('Transaction ID দিন'); return; }
    }

    setLoading(true);
    try {
      const orderNum = 'ORD-' + Array.from(crypto.getRandomValues(new Uint8Array(5)))
        .map(b => b.toString(36)).join('').toUpperCase().slice(0, 8);

      // Build notes with custom field values
      const customFieldNotes = customFields.length > 0
        ? customFields.map(f => `${f.label}: ${customFieldValues[f.id] || '-'}`).join('\n')
        : '';

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNum,
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          subtotal: itemTotal,
          discount_amount: couponDiscount,
          total: finalTotal,
          payment_method: paymentMethod,
          transaction_id: paymentMethod === 'wallet' ? `WALLET-${orderNum}` : transactionId.trim(),
          coupon_code: couponCode.trim().toUpperCase() || null,
          status: paymentMethod === 'wallet' ? 'processing' : 'pending',
          payment_status: paymentMethod === 'wallet' ? 'paid' : 'pending',
          user_id: user?.id || null,
          notes: customFieldNotes || null,
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
        // Refresh balance
        setWalletBalance(prev => prev - finalTotal);
      }

      await supabase.from('order_items').insert({
        order_id: order.id,
        product_name: product.name,
        product_id: typeof product.id === 'string' ? product.id : null,
        price: product.price,
        quantity: initialQty,
        total: itemTotal,
        custom_field_values: customFields.length > 0 ? customFieldValues : {},
      } as any);

      setOrderNumber(orderNum);
      orderPlacedRef.current = true;
      // Mark abandoned row as converted (best-effort)
      try {
        await supabase.from('abandoned_checkouts').update({
          converted: true,
          converted_at: new Date().toISOString(),
        } as any).eq('session_token', sessionTokenRef.current);
      } catch {}
      // Rotate token so next quick order starts fresh
      try {
        const newTok = 'qo_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem('quickorder_session_token', newTok);
        sessionTokenRef.current = newTok;
      } catch {}
      setStep('success');
    } catch (err) {
      console.error(err);
      setSubmitError('অর্ডার দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };
  const dynamicMethods: PaymentOption[] = paymentConfigs
    .filter(c => c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(c => ({
      id: c.id as PaymentMethod,
      label: c.label,
      color: 'from-gray-600 to-gray-700',
      logo: c.logoUrl || ASSET_LOGOS[c.id] || undefined,
      isWallet: false,
    }));

  const allMethods: PaymentOption[] = user
    ? [{ id: 'wallet' as PaymentMethod, label: 'Wallet', color: 'from-violet-600 to-purple-700', isWallet: true }, ...dynamicMethods]
    : dynamicMethods;

  return (
    <>
    <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-2xl">

        {/* ── Header ── */}
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
              <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">অর্ডার সফল! 🎉</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  অর্ডার নম্বর: <span className="text-primary font-mono font-bold">{orderNumber}</span>
                </p>
                {paymentMethod === 'wallet' ? (
                  <div className="mt-3 p-3 rounded-xl bg-violet-500/10 border border-violet-400/30 text-left space-y-1">
                    <p className="text-sm font-bold text-violet-600 flex items-center gap-2"><Wallet size={14}/> ওয়ালেট পেমেন্ট সম্পন্ন</p>
                    <p className="text-xs text-muted-foreground">আপনার ওয়ালেট থেকে ৳{finalTotal.toLocaleString()} কেটে নেওয়া হয়েছে।</p>
                    <p className="text-xs text-muted-foreground">লাইসেন্স কি শীঘ্রই আপনার ড্যাশবোর্ডে দেখা যাবে।</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                    পেমেন্ট যাচাইয়ের পর আপনার ইমেইলে লাইসেন্স কি পাঠানো হবে। সাধারণত ১–২ ঘন্টার মধ্যে।
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm transition-colors">
                  ঠিক আছে
                </button>
                {user && (
                  <button
                    onClick={() => { onClose(); navigate('/dashboard'); }}
                    className="flex-1 btn-glow py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5"
                  >
                    <Package size={14}/> আমার অর্ডার
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ══ STEP 1: Customer Info ══ */}
          {step === 'info' && (
            <>
              {/* Login banner for guests */}
              {!user && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/30 mb-2">
                  <LogIn size={16} className="text-primary shrink-0" />
                  <p className="text-xs text-foreground flex-1">অর্ডার করতে লগইন আবশ্যক</p>
                  <button type="button" onClick={() => setShowAuthModal(true)} className="btn-glow px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap">
                    লগইন
                  </button>
                </div>
              )}
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</span>
                <span className="text-sm font-semibold text-foreground">আপনার তথ্য দিন</span>
                {user && (
                  <span className="ml-auto text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">লগইন আছে ✓</span>
                )}
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

              {/* ── Custom Fields ── */}
              {customFields.length > 0 && (
                <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span>📋</span> প্রোডাক্ট সম্পর্কিত তথ্য দিন
                  </p>
                  {customFields.map(field => (
                    <div key={field.id}>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        {field.label} {field.required && <span className="text-destructive">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          rows={3}
                          value={customFieldValues[field.id] || ''}
                          onChange={e => setCustomFieldValues(p => ({ ...p, [field.id]: e.target.value }))}
                          placeholder={field.placeholder}
                          className={`${inputClass} resize-none`}
                        />
                      ) : (
                        <input
                          type={field.type}
                          value={customFieldValues[field.id] || ''}
                          onChange={e => setCustomFieldValues(p => ({ ...p, [field.id]: e.target.value }))}
                          placeholder={field.placeholder}
                          className={inputClass}
                        />
                      )}
                      {field.hint && <p className="text-[10px] text-muted-foreground mt-1">{field.hint}</p>}
                      {customFieldErrors[field.id] && <p className="text-destructive text-xs mt-1">{customFieldErrors[field.id]}</p>}
                    </div>
                  ))}
                </div>
              )}

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
                    {couponLoading ? <Loader2 size={13} className="animate-spin" /> : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-destructive text-xs mt-1">{couponError}</p>}
                {couponDiscount > 0 && <p className="text-green-500 text-xs mt-1">✅ ৳{couponDiscount.toLocaleString()} ছাড় পেয়েছেন!</p>}
              </div>

              {/* Price Summary */}
              <div className="glass-card rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>মূল্য {initialQty > 1 ? `(${initialQty}×৳${product.price.toLocaleString()})` : ''}</span><span>৳{itemTotal.toLocaleString()}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-500">
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

              {/* Payment method buttons */}
              <div className="grid grid-cols-3 gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(allMethods.length, 3)}, 1fr)` }}>
                {allMethods.map(pm => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => { setPaymentMethod(pm.id); setTransactionId(''); setSubmitError(''); }}
                    className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl text-xs font-semibold transition-all border-2 ${
                      paymentMethod === pm.id
                        ? 'border-primary bg-primary/8 scale-105 shadow-md text-foreground'
                        : 'border-border bg-background/60 hover:border-primary/40 text-muted-foreground'
                    }`}
                  >
                    {pm.isWallet ? (
                      <div className="h-8 w-10 rounded-md flex items-center justify-center bg-gradient-to-br from-violet-600 to-purple-700">
                        <Wallet size={16} className="text-white" />
                      </div>
                    ) : (
                      <img src={pm.logo} alt={pm.label} className="h-8 w-auto object-contain rounded-md" />
                    )}
                    <span className="text-[10px] leading-tight text-center">{pm.label}</span>
                  </button>
                ))}
              </div>

              {/* Wallet payment UI */}
              {paymentMethod === 'wallet' && (
                <div className={`rounded-2xl p-4 space-y-3 border ${walletBalance >= finalTotal ? 'bg-violet-500/8 border-violet-400/30' : 'bg-destructive/8 border-destructive/30'}`}>
                  {/* Balance row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
                        <Wallet size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">আপনার ওয়ালেট</p>
                        <p className={`text-lg font-black ${walletBalance >= finalTotal ? 'text-violet-600' : 'text-destructive'}`}>
                          ৳{walletBalance.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">অর্ডার মোট</p>
                      <p className="text-lg font-black text-primary">৳{finalTotal.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Status */}
                  {walletBalance >= finalTotal ? (
                    <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-400/20 rounded-xl px-3 py-2.5">
                      <CheckCircle size={14} className="text-violet-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-violet-700">পর্যাপ্ত ব্যালেন্স আছে ✓</p>
                        <p className="text-[11px] text-muted-foreground">অর্ডার কনফার্ম করলেই তাৎক্ষণিক পেমেন্ট হবে — কোনো TrxID লাগবে না</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2.5">
                        <p className="text-xs text-destructive font-medium">
                          ❌ ব্যালেন্স কম — আরও ৳{(finalTotal - walletBalance).toLocaleString()} দরকার
                        </p>
                      </div>
                      <button
                        onClick={() => { onClose(); navigate('/dashboard?tab=wallet'); }}
                        className="w-full py-2.5 rounded-xl border border-violet-400/50 text-violet-600 text-xs font-bold hover:bg-violet-500/10 transition-colors flex items-center justify-center gap-2"
                      >
                        <Wallet size={13}/> Dashboard থেকে Wallet টপ-আপ করুন
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* MFS payment instructions */}
              {paymentMethod !== 'wallet' && (
                <>
                  <PaymentInstructions
                    paymentMethodId={paymentMethod as PMId}
                    amount={finalTotal}
                    amountLabel="মোট পাঠান"
                  />

                  {/* Transaction ID */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block font-semibold">
                      Transaction ID (TrxID) *
                    </label>
                    <input
                      value={transactionId}
                      onChange={e => setTransactionId(e.target.value)}
                      placeholder="যেমন: 8F3K2P9X"
                      maxLength={50}
                      className={`${inputClass} font-mono tracking-wider`}
                    />
                  </div>
                </>
              )}

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
                disabled={loading || (paymentMethod === 'wallet' && walletBalance < finalTotal)}
                className="w-full btn-glow py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Processing...</>
                ) : paymentMethod === 'wallet' ? (
                  <><Wallet size={16} /> ওয়ালেট দিয়ে অর্ডার করুন — ৳{finalTotal.toLocaleString()}</>
                ) : (
                  <><CreditCard size={16} /> অর্ডার কনফার্ম করুন</>
                )}
              </button>

              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
                <Shield size={11}/> নিরাপদ পেমেন্ট — আপনার তথ্য সুরক্ষিত
              </p>
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default QuickOrderModal;
