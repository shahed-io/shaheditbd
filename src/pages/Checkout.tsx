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
import AuthModal from '@/components/store/AuthModal';
import { z } from 'zod';
import { toast } from 'sonner';
import { usePaymentSettings, DEFAULT_PAYMENT_CONFIGS } from '@/hooks/usePaymentSettings';
import bkashLogo from '@/assets/payment/bkash.png';
import nagadLogo from '@/assets/payment/nagad.png';
import rocketLogo from '@/assets/payment/rocket.png';
import upayLogo from '@/assets/payment/upay.png';
import bkashMerchantLogo from '@/assets/payment/bkash-merchant.png';
import { getStoredAffiliateRef, clearStoredAffiliateRef } from '@/hooks/useAffiliateTracking';
import { gTrackBeginCheckout, gTrackPurchase } from '@/components/store/GoogleTracking';

const ASSET_LOGOS: Record<string, string> = {
  bkash: bkashLogo,
  nagad: nagadLogo,
  rocket: rocketLogo,
  upay: upayLogo,
  bkash_merchant: bkashMerchantLogo,
};

const checkoutSchema = z.object({
  name: z.string().trim().min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে').max(100),
  email: z.string().trim().email('সঠিক ইমেইল দিন').max(255),
  phone: z.string().trim().regex(/^(\+880|0)[0-9]{10}$/, 'সঠিক বাংলাদেশি নম্বর দিন (01XXXXXXXXX)').max(20),
});

type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'upay' | 'bkash_merchant' | 'bank_transfer' | 'wallet';

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
  const { configs: paymentConfigs } = usePaymentSettings();

  // Build dynamic payment methods from DB config
  const paymentMethods = [
    { id: 'wallet' as PaymentMethod, label: 'Wallet', color: 'from-violet-600 to-purple-700', number: '', type: 'Wallet Balance', logo: undefined as string | undefined },
    ...paymentConfigs
      .filter(c => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(c => ({
        id: c.id as PaymentMethod,
        label: c.label,
        color: 'from-gray-600 to-gray-700',
        number: c.number,
        type: c.type,
        logo: c.logoUrl || ASSET_LOGOS[c.id] || undefined,
      })),
  ];

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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const abandonedTimer = useRef<ReturnType<typeof setTimeout>>();
  const [walletBalance, setWalletBalance] = useState(0);
  const [refCreditBalance, setRefCreditBalance] = useState(0);
  const [refCreditApplied, setRefCreditApplied] = useState(0);
  const [refCreditInput, setRefCreditInput] = useState('');
  const [refCreditError, setRefCreditError] = useState('');
  const pendingSubmitRef = useRef(false);

  // Persistent session token for abandoned-checkout tracking
  const sessionTokenRef = useRef<string>('');
  const abandonedSavedRef = useRef(false);
  const abandonedRowIdRef = useRef<string | null>(null);
  if (!sessionTokenRef.current) {
    let tok = '';
    try { tok = localStorage.getItem('checkout_session_token') || ''; } catch {}
    if (!tok) {
      tok = 'cs_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      try { localStorage.setItem('checkout_session_token', tok); } catch {}
    }
    sessionTokenRef.current = tok;
  }

  // If user logs out while wallet is selected, switch to bkash
  useEffect(() => {
    if (!user && paymentMethod === 'wallet') {
      setPaymentMethod('bkash');
    }
  }, [user]);

  // Auto-submit after login if there was a pending submit
  useEffect(() => {
    if (user && pendingSubmitRef.current) {
      pendingSubmitRef.current = false;
      // Small delay to let profile auto-fill complete
      const timer = setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleSubmit(fakeEvent);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Auto-fill from logged-in user profile + fetch wallet balance
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('display_name, email, phone, wallet_balance, referral_credit_balance').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setForm(prev => ({
            name: prev.name || data.display_name || '',
            email: prev.email || data.email || user.email || '',
            phone: prev.phone || data.phone || '',
          }));
          setWalletBalance((data as any).wallet_balance || 0);
          setRefCreditBalance(Number((data as any).referral_credit_balance || 0));
        }
      });
  }, [user?.id]);

  // Load cart from Telegram checkout token
  const { addToCart } = useCart();
  useEffect(() => {
    const tgToken = searchParams.get('tg_token');
    if (!tgToken) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('telegram_checkout_tokens')
          .select('cart_data, is_used')
          .eq('token', tgToken)
          .gt('expires_at', new Date().toISOString())
          .single();
        if (error || !data || data.is_used) return;
        // Mark token as used
        await supabase.from('telegram_checkout_tokens').update({ is_used: true }).eq('token', tgToken);
        // Load cart items
        const cartItems = data.cart_data as any[];
        if (Array.isArray(cartItems)) {
          clearCart();
          for (const item of cartItems) {
            addToCart({
              id: item.product_id,
              name: item.product_name,
              category: '',
              price: item.price,
              image: '',
            }, item.quantity);
          }
          toast.success('টেলিগ্রাম কার্ট লোড হয়েছে!');
        }
      } catch (e) {
        console.error('Telegram token load error:', e);
      }
    })();
  }, []);

  // Auto-apply coupon from URL ?coupon=CODE
  useEffect(() => {
    const urlCoupon = searchParams.get('coupon');
    if (urlCoupon && !coupon.isApplied) {
      setCouponCode(urlCoupon.toUpperCase());
      // Delay to let subtotal compute
      setTimeout(() => handleApplyCoupon(urlCoupon.toUpperCase()), 500);
    }
  }, []);

  // Fire begin_checkout once on mount when there are items
  useEffect(() => {
    if (items.length === 0) return;
    gTrackBeginCheckout({
      value: finalTotal,
      items: items.map(i => ({ item_id: String(i.id), item_name: i.name, price: i.price, quantity: i.quantity })),
    }, { email: form.email, phone: form.phone, name: form.name }).catch(() => { /* silent */ });
    // Fire TikTok / Snap / Pin / LinkedIn / X pixels
    import('@/components/store/MarketingPixels').then(({ mTrackInitiateCheckout, loadMarketingPixels }) => {
      loadMarketingPixels().then(() => {
        mTrackInitiateCheckout({ value: finalTotal });
      }).catch(() => { /* silent */ });
    }).catch(() => { /* silent */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ── Save abandoned checkout (debounced) — fires when user fills any contact info + has items ──
  useEffect(() => {
    const hasContact = !!(form.email || form.phone || form.name);
    if (!hasContact || items.length === 0) return;
    clearTimeout(abandonedTimer.current);
    abandonedTimer.current = setTimeout(async () => {
      try {
        const payload = {
          session_token: sessionTokenRef.current,
          user_id: user?.id || null,
          customer_name: form.name || null,
          customer_email: form.email || null,
          customer_phone: form.phone || null,
          cart_items: items.map(i => ({
            id: i.id, name: i.name, category: i.category,
            price: i.price, quantity: i.quantity, variant: i.variant || null, image: i.image,
          })) as any,
          item_count: items.reduce((s, i) => s + i.quantity, 0),
          subtotal,
          discount_amount: discountAmount,
          total: finalTotal,
          coupon_code: coupon.isApplied ? coupon.code : null,
          payment_method: paymentMethod,
          notes: orderNotes?.trim() || null,
          page_url: typeof window !== 'undefined' ? window.location.href : null,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null,
          updated_at: new Date().toISOString(),
        };
        const { error: upsertErr } = await supabase
          .from('abandoned_checkouts')
          .upsert(payload, { onConflict: 'session_token' });
        if (upsertErr) {
          console.warn('[abandoned] upsert error:', upsertErr.message);
        } else {
          abandonedSavedRef.current = true;
          // Best-effort id lookup (will quietly fail for guests under RLS)
          if (!abandonedRowIdRef.current) {
            const { data: row } = await supabase
              .from('abandoned_checkouts')
              .select('id')
              .eq('session_token', sessionTokenRef.current)
              .maybeSingle();
            if (row?.id) abandonedRowIdRef.current = row.id;
          }
        }
      } catch (e) { console.warn('[abandoned] save failed:', e); }
    }, 1500);
    return () => clearTimeout(abandonedTimer.current);
  }, [form.name, form.email, form.phone, items, subtotal, discountAmount, finalTotal, coupon.isApplied, coupon.code, paymentMethod, orderNotes, user?.id]);

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

    if (!user) {
      pendingSubmitRef.current = true;
      setSubmitError('অর্ডার করতে প্রথমে লগইন করুন');
      setShowAuthModal(true);
      return;
    }

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

      // Attach affiliate ref if present
      const affRef = getStoredAffiliateRef();

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
          affiliate_referral_code: affRef?.code || null,
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

      // Insert payment proof for non-wallet payments so admin sees it in /ceo/payments
      if (paymentMethod !== 'wallet') {
        const { error: proofError } = await supabase.from('payment_proofs').insert({
          order_id: order.id,
          user_id: user?.id || null,
          transaction_id: transactionId.trim(),
          payment_method: paymentMethod,
          amount: finalTotal,
          status: 'pending',
        });
        if (proofError) console.error('[Checkout] payment_proof insert error:', proofError);
      }

      // Record affiliate conversion (non-blocking, server validates)
      if (affRef?.code) {
        (supabase as any).rpc('record_affiliate_conversion', {
          p_order_id: order.id,
          p_referral_code: affRef.code,
        }).then(({ data, error }: any) => {
          if (error) console.error('[Affiliate] conversion error:', error);
          else if (data?.success) {
            console.log('[Affiliate] conversion recorded:', data);
            clearStoredAffiliateRef();
          }
        });
      }

      // Increment coupon uses_count
      if (couponId) {
        try {
          const { data: couponRow } = await supabase.from('coupons').select('uses_count').eq('id', couponId).single();
          await supabase.from('coupons').update({ uses_count: (couponRow?.uses_count || 0) + 1 }).eq('id', couponId);
        } catch { /* silent */ }
      }

      // Send order confirmation email to customer (non-blocking)
      supabase.functions.invoke('send-order-email', {
        body: { type: 'order_confirmation', orderId: order.id },
      }).then(({ error }) => {
        if (error) console.error('[Checkout] order_confirmation email error:', error);
        else console.log('[Checkout] order_confirmation email sent for order:', order.id);
      });

      // Notify all admins via email (non-blocking)
      supabase.functions.invoke('send-order-email', {
        body: { type: 'admin_notify', orderId: order.id },
      }).then(({ error }) => {
        if (error) console.error('[Checkout] admin_notify email error:', error);
      });

      // Notify admin via Telegram + WhatsApp (non-blocking)
      supabase.functions.invoke('notify-new-order', {
        body: { orderId: order.id },
      }).then(({ error }) => {
        if (error) console.error('[Checkout] notify-new-order error:', error);
      });

      // In-app notification: customer
      if (user?.id) {
        supabase.from('notifications').insert({
          user_id: user.id,
          title: '🛒 অর্ডার সফলভাবে সম্পন্ন!',
          message: `আপনার অর্ডার #${orderNum} সফলভাবে গৃহীত হয়েছে। মোট: ৳${finalTotal.toLocaleString()}। পেমেন্ট যাচাইয়ের পর আপনাকে জানানো হবে।`,
          type: 'success',
          link: '/dashboard',
          is_read: false,
        }).then(({ error }) => {
          if (error) console.error('[Checkout] customer notification error:', error);
        });
      }

      // In-app notification: all admins
      supabase.from('user_roles').select('user_id').eq('role', 'admin').then(({ data: adminRoles }) => {
        if (adminRoles && adminRoles.length > 0) {
          const adminNotifs = adminRoles.map((ar: { user_id: string }) => ({
            user_id: ar.user_id,
            title: '🆕 নতুন অর্ডার!',
            message: `নতুন অর্ডার #${orderNum} — ${form.name} (${form.phone}), মোট: ৳${finalTotal.toLocaleString()} [${paymentMethod.toUpperCase()}]`,
            type: 'info',
            link: '/ceo/orders',
            is_read: false,
          }));
          supabase.from('notifications').insert(adminNotifs).then(({ error }) => {
            if (error) console.error('[Checkout] admin notification error:', error);
          });
        }
      });

      // Mark abandoned-checkout row as converted (non-blocking)
      try {
        await supabase
          .from('abandoned_checkouts')
          .update({
            converted: true,
            converted_order_id: order.id,
            converted_at: new Date().toISOString(),
          })
          .eq('session_token', sessionTokenRef.current);
      } catch { /* silent */ }
      // Reset session token for next checkout
      try {
        const newTok = 'cs_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem('checkout_session_token', newTok);
        sessionTokenRef.current = newTok;
      } catch {}

      clearCart();
      setOrderNumber(orderNum);
      setOrderPlaced(true);

      // Fire Google Ads + GA4 Purchase conversion (non-blocking, after success)
      gTrackPurchase({
        transaction_id: orderNum,
        value: finalTotal,
        coupon: coupon.isApplied ? coupon.code : undefined,
        items: items.map(i => ({ item_id: String(i.id), item_name: i.name, price: i.price, quantity: i.quantity })),
      }, { email: form.email, phone: form.phone, name: form.name }).catch(() => { /* silent */ });
      // Fire TikTok (+ CAPI) / Snap / Pin / LinkedIn / X pixels
      import('@/components/store/MarketingPixels').then(({ mTrackPurchase, loadMarketingPixels }) => {
        loadMarketingPixels().then(() => {
          mTrackPurchase({
            transaction_id: orderNum,
            value: finalTotal,
            content_ids: items.map(i => String(i.id)),
          });
        }).catch(() => { /* silent */ });
      }).catch(() => { /* silent */ });
    } catch (err: unknown) {
      console.error('[Checkout] Order error:', err);
      const msg = err instanceof Error ? err.message : (err as any)?.message || String(err);
      if (msg.includes('row-level security') || msg.includes('RLS')) {
        setSubmitError('অনুমতি সমস্যা। দয়া করে লগইন করে আবার চেষ্টা করুন।');
      } else if (msg.includes('duplicate') || msg.includes('unique')) {
        setSubmitError('এই অর্ডার নম্বরটি ইতিমধ্যে ব্যবহৃত হয়েছে। আবার চেষ্টা করুন।');
      } else if (msg.includes('Wallet debit failed')) {
        setSubmitError('ওয়ালেট থেকে টাকা কাটা যায়নি। ব্যালেন্স চেক করুন।');
      } else {
        setSubmitError(`অর্ডার দিতে সমস্যা হয়েছে: ${msg}`);
      }
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
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Login Required Banner for guests */}
      {!user && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/30">
            <LogIn size={20} className="text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">অর্ডার করতে লগইন আবশ্যক</p>
              <p className="text-xs text-muted-foreground mt-0.5">আপনার অ্যাকাউন্টে লগইন করুন অথবা নতুন অ্যাকাউন্ট তৈরি করুন।</p>
            </div>
            <button onClick={() => setShowAuthModal(true)} className="btn-glow px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap flex items-center gap-1.5">
              <LogIn size={14} /> লগইন করুন
            </button>
          </div>
        </div>
      )}
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
                  <label className="text-sm text-muted-foreground mb-1 block font-semibold">
                    {paymentMethod === 'bank_transfer' ? 'Bank Reference / TRN নম্বর *' : 'Transaction ID (TrxID) *'}
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={e => setTransactionId(e.target.value)}
                    placeholder={paymentMethod === 'bank_transfer' ? 'যেমন: TRN123456789' : 'যেমন: 8F3K2P9X'}
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
