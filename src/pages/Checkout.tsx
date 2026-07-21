import { useState, useEffect, useRef } from 'react';
import PaymentInstructions from '@/components/store/PaymentInstructions';
import type { PMId } from '@/components/store/PaymentInstructions';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft, ShoppingCart, Tag, CheckCircle, Smartphone,
  Minus, Plus, Trash2, X, Loader2, Shield, Info, ChevronDown, User, LogIn, FileText, Wallet, Package, Upload, Image as ImageIcon
} from 'lucide-react';
import AuthModal from '@/components/store/AuthModal';
import { z } from 'zod';
import { toast } from 'sonner';
import { usePaymentSettings } from '@/hooks/usePaymentSettings';
import { getStoredAffiliateRef, clearStoredAffiliateRef } from '@/hooks/useAffiliateTracking';
import { gTrackBeginCheckout, gTrackPurchase } from '@/components/store/GoogleTracking';
import SEOHead from '@/components/seo/SEOHead';
import { useBkashPgwContent } from '@/hooks/useBkashPgwContent';
import { getPaymentLogo } from '@/lib/paymentLogos';

const checkoutSchema = z.object({
  name: z.string().trim().min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে').max(100),
  email: z.string().trim().email('সঠিক ইমেইল দিন').max(255),
  phone: z.string().trim().regex(/^(\+\d{6,15}|0\d{10})$/, 'সঠিক ফোন নম্বর দিন (উদা: 01XXXXXXXXX অথবা +8801XXXXXXXXX)').max(20),
});

// International dial codes (Bangladesh first as default)
const COUNTRY_CODES: Array<{ code: string; dial: string; flag: string; name: string }> = [
  { code: 'BD', dial: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: 'IN', dial: '+91',  flag: '🇮🇳', name: 'India' },
  { code: 'PK', dial: '+92',  flag: '🇵🇰', name: 'Pakistan' },
  { code: 'US', dial: '+1',   flag: '🇺🇸', name: 'United States' },
  { code: 'GB', dial: '+44',  flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'MY', dial: '+60',  flag: '🇲🇾', name: 'Malaysia' },
  { code: 'SG', dial: '+65',  flag: '🇸🇬', name: 'Singapore' },
  { code: 'AU', dial: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: 'CA', dial: '+1',   flag: '🇨🇦', name: 'Canada' },
  { code: 'DE', dial: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: 'FR', dial: '+33',  flag: '🇫🇷', name: 'France' },
  { code: 'IT', dial: '+39',  flag: '🇮🇹', name: 'Italy' },
  { code: 'JP', dial: '+81',  flag: '🇯🇵', name: 'Japan' },
  { code: 'CN', dial: '+86',  flag: '🇨🇳', name: 'China' },
  { code: 'TR', dial: '+90',  flag: '🇹🇷', name: 'Turkey' },
  { code: 'QA', dial: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: 'KW', dial: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: 'OM', dial: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: 'BH', dial: '+973', flag: '🇧🇭', name: 'Bahrain' },
];

type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'upay' | 'bkash_merchant' | 'bank_transfer' | 'wallet' | 'bkash_online';

const Checkout = () => {
  const {
    items: allItems, subtotal, discountAmount, taxAmount, serviceFee, finalTotal,
    clearCart, updateQuantity, removeFromCart, removeItems,
    coupon, setCoupon, resetCoupon,
    orderNotes, setOrderNotes,
    termsAccepted, setTermsAccepted,
    saveAbandonedCart,
    selectedKeys, selectedItems, itemKey: getItemKey,
  } = useCart();
  // Only checkout the user-selected items; if no selection (e.g. legacy redirect), fall back to all items
  const items = selectedKeys.length > 0 ? selectedItems : allItems;
  const checkoutKeysRef = useRef<string[]>(items.map(getItemKey));
  // Keep ref in sync until order placed
  useEffect(() => { checkoutKeysRef.current = items.map(getItemKey); }, [items, getItemKey]);
  const finishCart = () => {
    const keys = checkoutKeysRef.current;
    if (keys.length > 0 && keys.length < allItems.length) {
      removeItems(keys);
    } else {
      clearCart();
    }
  };
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { configs: paymentConfigs } = usePaymentSettings();
  const bkashContent = useBkashPgwContent();
  const bkashLogoSrc = getPaymentLogo('bkash_online', '', bkashContent.logo_url);

  // Build dynamic payment methods from DB config
  const paymentMethods = [
    { id: 'bkash_online' as PaymentMethod, label: 'bKash (Online)', color: 'from-pink-600 to-rose-700', number: '', type: 'bKash PGW', logo: bkashLogoSrc },
    ...paymentConfigs
      .filter(c => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(c => ({
        id: c.id as PaymentMethod,
        label: c.label,
        color: 'from-gray-600 to-gray-700',
        number: c.number,
        type: c.type,
        logo: getPaymentLogo(c.id, c.logoUrl, bkashContent.logo_url) || undefined,
      })),
    { id: 'wallet' as PaymentMethod, label: 'Wallet', color: 'from-violet-600 to-purple-700', number: '', type: 'Wallet Balance', logo: undefined as string | undefined },
  ];

  // Filter payment methods: guests can't use wallet
  const availablePaymentMethods = paymentMethods.filter(pm => pm.id !== 'wallet' || !!user);

  const CHECKOUT_DRAFT_KEY = 'checkout_form_draft';
  const CHECKOUT_PENDING_SUBMIT_KEY = 'checkout_pending_submit';
  const [form, setForm] = useState(() => {
    // Restore draft on mount so a checkout-page → OAuth login → back-to-checkout
    // round-trip doesn't lose the customer's typed name/email/phone.
    try {
      const raw = localStorage.getItem(CHECKOUT_DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          name: typeof parsed.name === 'string' ? parsed.name : '',
          email: typeof parsed.email === 'string' ? parsed.email : '',
          phone: typeof parsed.phone === 'string' ? parsed.phone : '',
        };
      }
    } catch { /* ignore */ }
    return { name: '', email: '', phone: '' };
  });
  // Persist contact draft as the user types without removing payment/login-pending fields.
  useEffect(() => {
    try {
      const existing = JSON.parse(localStorage.getItem(CHECKOUT_DRAFT_KEY) || '{}');
      localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify({ ...existing, ...form }));
    } catch {}
  }, [form.name, form.email, form.phone]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Selected country dial code (visual + prefix helper). Phone value in form.phone is source of truth.
  const [dialCode, setDialCode] = useState<string>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(CHECKOUT_DRAFT_KEY) || '{}');
      return typeof parsed.dialCode === 'string' ? parsed.dialCode : '+880';
    } catch { return '+880'; }
  });
  const [dialOpen, setDialOpen] = useState(false);
  useEffect(() => {
    try {
      const existing = JSON.parse(localStorage.getItem(CHECKOUT_DRAFT_KEY) || '{}');
      localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify({ ...existing, dialCode }));
    } catch {}
  }, [dialCode]);
  const selectedCountry = COUNTRY_CODES.find(c => c.dial === dialCode) || COUNTRY_CODES[0];
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(CHECKOUT_DRAFT_KEY) || '{}');
      return (typeof parsed.paymentMethod === 'string' ? parsed.paymentMethod : 'bkash') as PaymentMethod;
    } catch { return 'bkash'; }
  });
  const [transactionId, setTransactionId] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(CHECKOUT_DRAFT_KEY) || '{}');
      return typeof parsed.transactionId === 'string' ? parsed.transactionId : '';
    } catch { return ''; }
  });
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('শুধুমাত্র ছবি আপলোড করুন');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ছবির সাইজ ৫MB এর কম হতে হবে');
      return;
    }
    setPaymentScreenshot(file);
    const reader = new FileReader();
    reader.onload = ev => setScreenshotPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setPaymentScreenshot(null);
    setScreenshotPreview(null);
    if (screenshotInputRef.current) screenshotInputRef.current.value = '';
  };
  const [couponCode, setCouponCode] = useState(coupon.isApplied ? coupon.code : '');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [instantDelivered, setInstantDelivered] = useState<boolean | null>(null); // null = checking, true = licenses assigned, false = pending
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
  const submittingRef = useRef(false); // blocks abandoned-checkout upsert during/after submission

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

  const persistCheckoutState = (markPending = false) => {
    try {
      const currentPath = window.location.pathname + window.location.search;
      localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        paymentMethod,
        transactionId,
        orderNotes,
        termsAccepted,
        refCreditApplied,
        refCreditInput,
        savedAt: new Date().toISOString(),
      }));
      if (markPending) {
        pendingSubmitRef.current = true;
        sessionStorage.setItem(CHECKOUT_PENDING_SUBMIT_KEY, 'true');
        localStorage.setItem(CHECKOUT_PENDING_SUBMIT_KEY, 'true');
        sessionStorage.setItem('post_login_redirect', currentPath);
        localStorage.setItem('post_login_redirect', currentPath);
      }
    } catch { /* ignore storage errors */ }
  };

  // If user logs out while wallet is selected, switch to bkash
  useEffect(() => {
    if (!user && paymentMethod === 'wallet') {
      setPaymentMethod('bkash');
    }
  }, [user]);

  // Auto-correct payment method if current one is disabled/unavailable in admin config
  useEffect(() => {
    if (availablePaymentMethods.length === 0) return;
    const isValid = availablePaymentMethods.some(pm => pm.id === paymentMethod);
    if (!isValid) {
      // Prefer bkash_online → first non-wallet → first
      const preferred =
        availablePaymentMethods.find(pm => pm.id === 'bkash_online') ||
        availablePaymentMethods.find(pm => pm.id !== 'wallet') ||
        availablePaymentMethods[0];
      setPaymentMethod(preferred.id);
    }
  }, [availablePaymentMethods, paymentMethod]);

  // Restore the full checkout state after an auth round-trip.
  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(CHECKOUT_DRAFT_KEY) || '{}');
      if (typeof parsed.paymentMethod === 'string') setPaymentMethod(parsed.paymentMethod as PaymentMethod);
      if (typeof parsed.transactionId === 'string') setTransactionId(parsed.transactionId);
      if (typeof parsed.orderNotes === 'string') setOrderNotes(parsed.orderNotes);
      if (typeof parsed.termsAccepted === 'boolean') setTermsAccepted(parsed.termsAccepted);
      if (typeof parsed.refCreditApplied === 'number') setRefCreditApplied(parsed.refCreditApplied);
      if (typeof parsed.refCreditInput === 'string') setRefCreditInput(parsed.refCreditInput);
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist the complete checkout state as the user fills payment details.
  useEffect(() => {
    persistCheckoutState(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.name, form.email, form.phone, paymentMethod, transactionId, orderNotes, termsAccepted, refCreditApplied, refCreditInput]);

  // Auto-submit after login if there was a pending submit, including after OAuth/full-page redirects.
  useEffect(() => {
    if (!user) return;
    let hasPending = pendingSubmitRef.current;
    try {
      hasPending = hasPending || sessionStorage.getItem(CHECKOUT_PENDING_SUBMIT_KEY) === 'true' || localStorage.getItem(CHECKOUT_PENDING_SUBMIT_KEY) === 'true';
    } catch { /* ignore */ }
    if (!hasPending) return;
    pendingSubmitRef.current = false;
    setShowAuthModal(false);
    try {
      sessionStorage.removeItem(CHECKOUT_PENDING_SUBMIT_KEY);
      localStorage.removeItem(CHECKOUT_PENDING_SUBMIT_KEY);
    } catch { /* ignore */ }
    const timer = setTimeout(() => {
      const formEl = document.getElementById('checkout-form') as HTMLFormElement | null;
      if (formEl && !submittingRef.current) formEl.requestSubmit();
    }, 1200);
    return () => clearTimeout(timer);
  }, [user]);

  // Auto-fill from logged-in user profile + fetch wallet balance
  useEffect(() => {
    if (!user) return;
    const metaName =
      (user.user_metadata as any)?.full_name ||
      (user.user_metadata as any)?.name ||
      (user.user_metadata as any)?.display_name ||
      '';
    const metaPhone = (user.user_metadata as any)?.phone || '';
    // Pre-fill immediately from auth metadata so the name appears even before profile fetch
    setForm(prev => ({
      name: prev.name || metaName,
      email: prev.email || user.email || '',
      phone: prev.phone || metaPhone,
    }));
    supabase.from('profiles').select('display_name, email, phone, wallet_balance, referral_credit_balance').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setForm(prev => ({
            name: prev.name || data.display_name || metaName || '',
            email: prev.email || data.email || user.email || '',
            phone: prev.phone || data.phone || metaPhone || '',
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

  // ── Handle bKash PGW callback return (?bkash=success|failure|cancel|error&order=...) ──
  useEffect(() => {
    const bkash = searchParams.get('bkash');
    const ord = searchParams.get('order');
    if (!bkash) return;
    if (bkash === 'success' && ord) {
      finishCart();
      setOrderNumber(ord);
      setPaymentMethod('bkash_online');
      setOrderPlaced(true);
      try {
        localStorage.removeItem(CHECKOUT_DRAFT_KEY);
        sessionStorage.removeItem(CHECKOUT_PENDING_SUBMIT_KEY);
        localStorage.removeItem(CHECKOUT_PENDING_SUBMIT_KEY);
        sessionStorage.removeItem('post_login_redirect');
        localStorage.removeItem('post_login_redirect');
      } catch {}
      setInstantDelivered(null);
      toast.success('✅ bKash পেমেন্ট সফল!');
      // Check if licenses were auto-assigned (License Manager had stock)
      (async () => {
        const checkDelivery = async (): Promise<boolean> => {
          const { data: orderRow } = await supabase
            .from('orders').select('id').eq('order_number', ord).maybeSingle();
          if (!orderRow?.id) return false;
          const { data: items } = await supabase
            .from('order_items').select('license_key').eq('order_id', orderRow.id);
          if (!items || items.length === 0) return false;
          return items.every(i => !!i.license_key && i.license_key.trim() !== '');
        };
        // Retry a few times since trigger runs async
        for (let i = 0; i < 5; i++) {
          const delivered = await checkDelivery();
          if (delivered) { setInstantDelivered(true); return; }
          await new Promise(r => setTimeout(r, 1200));
        }
        setInstantDelivered(false);
      })();
    } else if (bkash === 'cancel') {
      setSubmitError('bKash পেমেন্ট বাতিল করা হয়েছে। আবার চেষ্টা করুন।');
    } else if (bkash === 'failure' || bkash === 'error') {
      setSubmitError('bKash পেমেন্ট ব্যর্থ হয়েছে। অন্য পদ্ধতি ব্যবহার করুন অথবা আবার চেষ্টা করুন।');
    } else if (bkash === 'missing') {
      setSubmitError('bKash পেমেন্ট তথ্য পাওয়া যায়নি।');
    }
    // Clean URL
    const newUrl = window.location.pathname;
    window.history.replaceState({}, '', newUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (submittingRef.current) return; // don't overwrite while placing order
    clearTimeout(abandonedTimer.current);
    abandonedTimer.current = setTimeout(async () => {
      try {
        const payload = {
          customer_name: form.name || null,
          customer_email: form.email || null,
          customer_phone: form.phone || null,
          cart_items: items.map(i => ({
            id: i.id, name: i.name, category: i.category,
            price: i.price, quantity: i.quantity, variant: i.variant || null, image: i.image,
          })),
          item_count: items.reduce((s, i) => s + i.quantity, 0),
          subtotal,
          discount_amount: discountAmount,
          total: finalTotal,
          coupon_code: coupon.isApplied ? coupon.code : null,
          payment_method: paymentMethod,
          notes: orderNotes?.trim() || null,
          page_url: typeof window !== 'undefined' ? window.location.href : null,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null,
        };
        const { data: rowId, error: upsertErr } = await supabase.rpc('upsert_abandoned_checkout', {
          p_session_token: sessionTokenRef.current,
          p_payload: payload as any,
        });
        if (upsertErr) {
          console.warn('[abandoned] upsert error:', upsertErr.message);
        } else {
          abandonedSavedRef.current = true;
          if (rowId) abandonedRowIdRef.current = rowId as string;
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
        body: {
          code: c,
          orderTotal: subtotal,
          customerEmail: form.email || user?.email || '',
          productIds: items.map((it: any) => it.id).filter(Boolean),
        },
      });
      if (error || !data?.valid) {
        setCouponError(data?.message || 'কুপন কোড সঠিক নয়');
        resetCoupon();
        return;
      }
      setCoupon({
        code: c,
        discount: data.discountValue ?? data.discount,
        type: data.discountType || (data.discountValue ? 'percentage' : 'fixed'),
        isApplied: true,
      });
      toast.success(data.message || `✅ কুপন approved! ৳${data.discount} ছাড়`);
    } catch {
      setCouponError('কুপন চেক করতে সমস্যা হয়েছে');
    } finally {
      setCouponLoading(false);
    }
  };

  // Final payable after referral credit
  const payableTotal = Math.max(0, finalTotal - refCreditApplied);

  const handleApplyRefCredit = () => {
    setRefCreditError('');
    const amt = Math.floor(Number(refCreditInput) || 0);
    if (amt <= 0) { setRefCreditError('সঠিক পরিমাণ দিন'); return; }
    if (amt > refCreditBalance) { setRefCreditError(`আপনার ক্রেডিট মাত্র ৳${refCreditBalance}`); return; }
    const maxAllowed = Math.floor(subtotal / 2);
    if (amt > maxAllowed) {
      setRefCreditError(`সর্বোচ্চ ৳${maxAllowed} apply করা যাবে। ৳${amt} apply করতে চাইলে কমপক্ষে ৳${amt * 2} এর product কিনতে হবে।`);
      return;
    }
    setRefCreditApplied(amt);
    toast.success(`✅ ৳${amt} রেফারেল ক্রেডিট প্রয়োগ হয়েছে`);
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

    if (paymentMethod !== 'wallet' && paymentMethod !== 'bkash_online' && !transactionId.trim()) { setSubmitError('Transaction ID দিন'); return; }
    if (items.length === 0) { setSubmitError('Cart empty'); return; }

    if (!user) {
      persistCheckoutState(true);
      setSubmitError('লগইন করুন — লগইনের পর আপনার অর্ডার নিজে থেকেই সাবমিট হবে');
      setShowAuthModal(true);
      return;
    }

    // Wallet: check balance
    if (paymentMethod === 'wallet') {
      if (!user) { setSubmitError('Wallet পেমেন্টের জন্য লগইন করতে হবে'); return; }
      if (walletBalance < payableTotal) {
        setSubmitError(`ওয়ালেট ব্যালেন্স অপর্যাপ্ত। বর্তমান ব্যালেন্স: ৳${walletBalance}`);
        return;
      }
    }

    setLoading(true);
    // Freeze the abandoned-checkout tracker so the debounced upsert cannot
    // re-create/overwrite the row while the order is being placed.
    submittingRef.current = true;
    clearTimeout(abandonedTimer.current);
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
          discount_amount: discountAmount + refCreditApplied,
          total: payableTotal,
          payment_method: paymentMethod,
          transaction_id:
            paymentMethod === 'wallet' ? `WALLET-${orderNum}` :
            paymentMethod === 'bkash_online' ? `BKASH-PENDING-${orderNum}` :
            transactionId.trim(),
          coupon_code: coupon.isApplied ? coupon.code : null,
          coupon_id: couponId,
          status: paymentMethod === 'wallet' ? 'processing' : 'pending',
          payment_status: paymentMethod === 'wallet' ? 'paid' : 'pending',
          user_id: user?.id || null,
          notes: (orderNotes.trim() || '') + (refCreditApplied > 0 ? `\n[Referral credit applied: ৳${refCreditApplied}]` : ''),
          affiliate_referral_code: affRef?.code || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Redeem referral credit (server validates 2× rule)
      if (refCreditApplied > 0 && user) {
        const { data: redeemRes } = await (supabase as any).rpc('redeem_referral_credit', {
          p_user_id: user.id,
          p_amount: refCreditApplied,
          p_order_subtotal: subtotal,
          p_order_id: order.id,
        });
        if (!(redeemRes as any)?.success) {
          throw new Error((redeemRes as any)?.error || 'Referral credit redeem failed');
        }
      }

      // Debit wallet if wallet payment
      if (paymentMethod === 'wallet' && user) {
        const { data: walletResult } = await supabase.rpc('wallet_debit' as any, {
          p_user_id: user.id,
          p_amount: payableTotal,
          p_note: `অর্ডার পেমেন্ট - ${orderNum}`,
          p_reference_id: order.id,
          p_created_by: 'user',
        });
        if (!(walletResult as any)?.success) throw new Error('Wallet debit failed');
      }

      // Insert order items with product_id if available (strict UUID validation)
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_name: item.name + (item.variant ? ` (${item.variant})` : ''),
        product_id: typeof item.id === 'string' && UUID_RE.test(item.id) ? item.id : null,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // ── Wallet payment: try auto-assign licenses → auto-complete if stock available ──
      let walletInstantDelivered: boolean | null = null; // null = not wallet, true = delivered, false = pending
      if (paymentMethod === 'wallet') {
        try {
          const { data: assignRes } = await (supabase as any).rpc('auto_assign_licenses', { p_order_id: order.id });
          const assigned = (assignRes as any)?.assigned || 0;
          const needed = (assignRes as any)?.needed || 0;
          if (needed > 0 && assigned === needed) {
            // All licenses assigned — mark order completed (triggers points, telegram, emails)
            const { error: updErr } = await supabase
              .from('orders')
              .update({ status: 'completed', payment_status: 'paid' })
              .eq('id', order.id);
            if (!updErr) walletInstantDelivered = true;
            else walletInstantDelivered = false;
          } else {
            walletInstantDelivered = false;
          }
        } catch (e) {
          console.error('[Checkout] wallet auto-assign error:', e);
          walletInstantDelivered = false;
        }
      }

      // Upload optional payment screenshot (non-blocking — order succeeds even if upload fails)
      let screenshotUrl: string | null = null;
      if (paymentMethod !== 'wallet' && paymentScreenshot) {
        try {
          const folder = user?.id || 'guest';
          const ext = paymentScreenshot.name.split('.').pop()?.toLowerCase() || 'jpg';
          const path = `${folder}/${order.id}-${Date.now()}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from('payment-proofs')
            .upload(path, paymentScreenshot, {
              contentType: paymentScreenshot.type,
              upsert: false,
            });
          if (uploadErr) {
            console.error('[Checkout] screenshot upload error:', uploadErr);
          } else {
            const { data: signed } = await supabase.storage
              .from('payment-proofs')
              .createSignedUrl(path, 60 * 60 * 24 * 365);
            screenshotUrl = signed?.signedUrl || path;
          }
        } catch (e) {
          console.error('[Checkout] screenshot upload failed:', e);
        }
      }

      // Insert payment proof for manual non-wallet, non-PGW payments so admin sees it in /ceo/payments
      if (paymentMethod !== 'wallet' && paymentMethod !== 'bkash_online') {
        const { error: proofError } = await supabase.from('payment_proofs').insert({
          order_id: order.id,
          user_id: user?.id || null,
          transaction_id: transactionId.trim(),
          payment_method: paymentMethod,
          amount: payableTotal,
          screenshot_url: screenshotUrl,
          status: 'pending',
        });
        if (proofError) console.error('[Checkout] payment_proof insert error:', proofError);
      }

      // ── bKash Online (PGW) — redirect to bKash hosted checkout ──
      if (paymentMethod === 'bkash_online') {
        try {
          // Mark abandoned checkout as converted BEFORE redirect, otherwise
          // the row stays in "Abandoned Checkouts" even after a real order.
          try {
            await supabase.rpc('mark_abandoned_checkout_converted', {
              p_session_token: sessionTokenRef.current,
              p_order_id: order.id,
            });
          } catch { /* silent */ }

          const { data: bkData, error: bkErr } = await supabase.functions.invoke('bkash-create-payment', {
            body: {
              orderId: order.id,
              orderNumber: orderNum,
              amount: payableTotal,
              payerReference: form.phone || orderNum,
            },
          });
          if (bkErr || !bkData?.bkashURL) {
            console.error('[Checkout] bkash-create error:', bkErr, bkData);
            setSubmitError('bKash পেমেন্ট শুরু করা যায়নি। আবার চেষ্টা করুন।');
            setLoading(false);
            submittingRef.current = false;
            return;
          }
          // Rotate session token so next checkout starts a fresh abandoned row
          try {
            const newTok = 'cs_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
            localStorage.setItem('checkout_session_token', newTok);
            sessionTokenRef.current = newTok;
          } catch {}
          // Redirect user to bKash hosted page
          window.location.href = bkData.bkashURL;
          return;
        } catch (e) {
          console.error('[Checkout] bkash invoke failed:', e);
          setSubmitError('bKash পেমেন্ট গেটওয়ে কানেক্ট হয়নি। আবার চেষ্টা করুন।');
          setLoading(false);
          submittingRef.current = false;
          return;
        }
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

      // Send order confirmation email to customer via queue-based system (reliable + logged)
      if (form.email) {
        const PM_LABELS: Record<string, string> = {
          bkash: 'BKash', nagad: 'Nagad', rocket: 'Rocket', upay: 'Upay',
          bkash_merchant: 'BKash Merchant', wallet: 'Wallet',
        };
        supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'order-confirmation',
            recipientEmail: form.email,
            idempotencyKey: `order-confirm-${order.id}`,
            templateData: {
              customerName: form.name || 'Customer',
              orderNumber: orderNum,
              orderTotal: `${finalTotal.toLocaleString()} BDT`,
              orderItems: items.map(it => ({
                name: it.name + (it.variant ? ` (${it.variant})` : ''),
                quantity: it.quantity,
                price: `${(it.price * it.quantity).toLocaleString()} BDT`,
              })),
              paymentMethod: PM_LABELS[paymentMethod] || paymentMethod,
            },
          },
        }).then(({ error }) => {
          if (error) console.error('[Checkout] order confirmation email error:', error);
        });
      }

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
        await supabase.rpc('mark_abandoned_checkout_converted', {
          p_session_token: sessionTokenRef.current,
          p_order_id: order.id,
        });
      } catch { /* silent */ }
      // Reset session token for next checkout
      try {
        const newTok = 'cs_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem('checkout_session_token', newTok);
        sessionTokenRef.current = newTok;
      } catch {}

      finishCart();
      setOrderNumber(orderNum);
      if (paymentMethod === 'wallet') setInstantDelivered(walletInstantDelivered);
      setOrderPlaced(true);
      try {
        localStorage.removeItem(CHECKOUT_DRAFT_KEY);
        sessionStorage.removeItem(CHECKOUT_PENDING_SUBMIT_KEY);
        localStorage.removeItem(CHECKOUT_PENDING_SUBMIT_KEY);
        sessionStorage.removeItem('post_login_redirect');
        localStorage.removeItem('post_login_redirect');
      } catch {}

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
      // Re-enable abandoned tracker only if order didn't succeed
      if (!orderPlaced) submittingRef.current = false;
    }
  };

  const selectedPayment = paymentMethods.find(p => p.id === paymentMethod)!;

  // ===== Success Screen =====
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          {(() => {
            const isInstant = paymentMethod === 'bkash_online' || paymentMethod === 'wallet';
            const isWallet = paymentMethod === 'wallet';
            const isBkash = paymentMethod === 'bkash_online';
            const delivered = isInstant && instantDelivered === true;
            const checking = isInstant && instantDelivered === null;
            const pending = isInstant && instantDelivered === false;
            const accent = isWallet
              ? { ring: 'bg-violet-500/20 border-2 border-violet-500/40', icon: 'text-violet-500', tint: 'from-violet-500/10 to-violet-600/5 border-violet-400/30', label: 'text-violet-700', source: 'ওয়ালেট' }
              : { ring: 'bg-pink-500/20 border-2 border-pink-500/40', icon: 'text-pink-500', tint: 'from-pink-500/10 to-pink-600/5 border-pink-400/30', label: 'text-pink-600', source: 'bKash' };
            const ringClass = delivered ? accent.ring : 'bg-green-500/20 border-2 border-green-500/40';
            const iconClass = delivered ? accent.icon : 'text-green-400';
            return (
              <>
                <div className={`w-24 h-24 rounded-full ${ringClass} flex items-center justify-center mx-auto`}>
                  {checking ? <Loader2 size={44} className="text-muted-foreground animate-spin" /> : <CheckCircle size={44} className={iconClass} />}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {delivered ? '✅ অর্ডার ডেলিভারি সম্পন্ন!' : checking ? 'ডেলিভারি যাচাই করা হচ্ছে…' : 'অর্ডার সফল! 🎉'}
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    অর্ডার নম্বর: <span className="text-primary font-mono font-bold">{orderNumber}</span>
                  </p>
                  {delivered ? (
                    <div className={`mt-3 p-4 rounded-2xl bg-gradient-to-br ${accent.tint} border text-left space-y-1.5`}>
                      <p className={`text-sm font-bold ${accent.label} flex items-center gap-2`}>🚀 ইনস্ট্যান্ট ডেলিভারি সম্পন্ন</p>
                      <p className="text-xs text-foreground/80">{accent.source} পেমেন্ট সফলভাবে গৃহীত হয়েছে এবং আপনার অর্ডার <span className="font-bold text-green-600">কমপ্লিট</span> হয়েছে।</p>
                      <p className="text-xs text-muted-foreground">লাইসেন্স কি এখনই আপনার ড্যাশবোর্ড ও ইমেইলে পাঠানো হয়েছে। দয়া করে "আমার অর্ডার" থেকে দেখে নিন।</p>
                    </div>
                  ) : checking ? (
                    <p className="text-sm text-muted-foreground mt-3">
                      পেমেন্ট গৃহীত হয়েছে। লাইসেন্স স্টক যাচাই করা হচ্ছে, একটু অপেক্ষা করুন…
                    </p>
                  ) : pending ? (
                    <div className={`mt-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-left space-y-1.5`}>
                      <p className="text-sm font-bold text-amber-700 flex items-center gap-2">⏳ পেমেন্ট সম্পন্ন — ডেলিভারি প্রসেসিং</p>
                      <p className="text-xs text-foreground/80">{accent.source} পেমেন্ট সফলভাবে গৃহীত হয়েছে। বর্তমানে লাইসেন্স স্টক না থাকায় ম্যানুয়াল প্রসেসিং চলছে।</p>
                      <p className="text-xs text-muted-foreground">সাধারণত ১–২ ঘন্টার মধ্যে আপনার ইমেইল ও ড্যাশবোর্ডে লাইসেন্স কি পাঠানো হবে।</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-3">
                      পেমেন্ট যাচাইয়ের পর আপনার ইমেইলে লাইসেন্স কি পাঠানো হবে।
                      সাধারণত ১–২ ঘন্টার মধ্যে।
                    </p>
                  )}
                </div>
              </>
            );
          })()}
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
    <div className="min-h-screen bg-slate-50 text-slate-900" style={{ colorScheme: 'light' }}>
      <SEOHead title="Checkout" description="Complete your secure checkout at Shahed Store." noIndex />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} redirectAfterLogin={false} oauthRedirectTo={typeof window !== 'undefined' ? window.location.href : undefined} />

      {/* Minimal top nav */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
          <ArrowLeft size={16} /> ফিরে যান
        </button>
        <div className="flex items-center gap-2 text-xs">
          {user ? (
            <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full font-medium">
              <User size={11} /> {user.email?.split('@')[0]}
            </span>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-colors font-medium">
              <LogIn size={13} /> লগইন করুন
            </button>
          )}
        </div>
      </div>

      {/* Login banner for guests */}
      {!user && (
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-indigo-100 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <LogIn size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">অর্ডার সম্পন্ন করতে লগইন আবশ্যক</p>
              <p className="text-xs text-slate-500 mt-0.5">আপনার অ্যাকাউন্টে লগইন করুন অথবা নতুন অ্যাকাউন্ট তৈরি করুন।</p>
            </div>
            <button onClick={() => setShowAuthModal(true)} className="px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap flex items-center gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm">
              <LogIn size={14} /> লগইন
            </button>
          </div>
        </div>
      )}

      {/* Main editorial card */}
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="w-full bg-white rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden flex flex-col lg:flex-row">

          {/* ===== LEFT: FORM ===== */}
          <form id="checkout-form" onSubmit={handleSubmit} className="flex-1 p-6 md:p-10 lg:p-12 lg:border-r border-slate-100">
            <header className="mb-8 md:mb-10">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-1">অর্ডার সম্পন্ন করুন</h1>
              <p className="text-slate-500 text-sm">অনুগ্রহ করে আপনার সঠিক তথ্য প্রদান করুন</p>
            </header>

            <div className="space-y-10">
              {/* 1. Customer Info */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">১</div>
                  <h2 className="text-lg md:text-xl font-semibold text-slate-800">ব্যক্তিগত তথ্য</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 ml-1 block">আপনার নাম</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="উদা: আরিফ আহমেদ"
                      className={`w-full px-4 py-3.5 rounded-xl border ${errors.name ? 'border-rose-400' : 'border-slate-200'} focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-slate-50/30 text-slate-900 placeholder:text-slate-400`}
                    />
                    {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 ml-1 block">মোবাইল নম্বর</label>
                    <div className="flex relative">
                      <button
                        type="button"
                        onClick={() => setDialOpen(o => !o)}
                        className="flex items-center gap-2 px-3 border border-r-0 border-slate-200 rounded-l-xl bg-slate-50 text-sm text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                      >
                        <span className="text-lg leading-none">{selectedCountry.flag}</span>
                        <span className="font-medium">{selectedCountry.dial}</span>
                        <ChevronDown size={14} className="text-slate-400" />
                      </button>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder={selectedCountry.code === 'BD' ? '01XXXXXXXXX' : 'ফোন নম্বর'}
                        className={`flex-1 min-w-0 px-4 py-3.5 rounded-r-xl border ${errors.phone ? 'border-rose-400' : 'border-slate-200'} focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-slate-50/30 text-slate-900 placeholder:text-slate-400`}
                      />
                      {dialOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setDialOpen(false)} />
                          <div className="absolute top-full left-0 mt-2 w-72 max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1">
                            {COUNTRY_CODES.map(c => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => {
                                  setDialCode(c.dial);
                                  setDialOpen(false);
                                  // If phone currently starts with a + prefix, strip it so user can retype
                                  if (form.phone.startsWith('+')) setForm(prev => ({ ...prev, phone: '' }));
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${c.dial === dialCode ? 'bg-indigo-50/50 text-indigo-700' : 'text-slate-700'}`}
                              >
                                <span className="text-lg leading-none">{c.flag}</span>
                                <span className="flex-1 text-left">{c.name}</span>
                                <span className="text-slate-500 font-mono text-xs">{c.dial}</span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    {errors.phone && <p className="text-rose-500 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-slate-600 ml-1 block">ইমেইল ঠিকানা</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="example@mail.com"
                      className={`w-full px-4 py-3.5 rounded-xl border ${errors.email ? 'border-rose-400' : 'border-slate-200'} focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-slate-50/30 text-slate-900 placeholder:text-slate-400`}
                    />
                    {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>
              </section>

              {/* 2. Payment Method */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">২</div>
                  <h2 className="text-lg md:text-xl font-semibold text-slate-800">পেমেন্ট পদ্ধতি</h2>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                  {availablePaymentMethods.map(pm => {
                    const active = paymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                          active
                            ? 'border-indigo-600 bg-indigo-50/60 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-indigo-300'
                        }`}
                      >
                        {pm.logo ? (
                          <img src={pm.logo} alt={pm.label} className="h-9 w-auto object-contain" />
                        ) : (
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br ${pm.color} text-white shadow-sm`}>
                            <Wallet size={16} />
                          </div>
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'text-indigo-900' : 'text-slate-500'}`}>
                          {pm.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Wallet balance */}
                {paymentMethod === 'wallet' && (
                  <div className={`rounded-2xl p-5 space-y-2 border ${walletBalance >= finalTotal ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Wallet size={16} className="text-indigo-600" />
                        <span>ওয়ালেট ব্যালেন্স</span>
                      </div>
                      <span className={`font-bold text-lg ${walletBalance >= finalTotal ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ৳{walletBalance.toLocaleString()}
                      </span>
                    </div>
                    {walletBalance >= finalTotal ? (
                      <p className="text-xs text-emerald-700">✅ পর্যাপ্ত ব্যালেন্স আছে। কোনো Transaction ID দরকার নেই।</p>
                    ) : (
                      <p className="text-xs text-rose-700">❌ ব্যালেন্স কম। আরও ৳{(finalTotal - walletBalance).toLocaleString()} দরকার।</p>
                    )}
                    {!user && <p className="text-xs text-rose-700">⚠️ Wallet পেমেন্টের জন্য লগইন করতে হবে</p>}
                  </div>
                )}

                {/* bKash Online (PGW) */}
                {paymentMethod === 'bkash_online' && (
                  <div className="rounded-2xl p-5 space-y-2 border bg-pink-50 border-pink-200">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <img src={bkashLogoSrc} alt="bKash" className="h-6 w-auto" />
                      <span>{bkashContent.title}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {bkashContent.description}
                    </p>
                    {bkashContent.bullets.length > 0 && (
                      <ul className="text-[11px] text-slate-600 space-y-1 pl-4 list-disc">
                        {bkashContent.bullets.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    )}
                    <p className="text-xs text-pink-700 font-semibold">
                      {bkashContent.amount_prefix} ৳{payableTotal.toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Manual payment instructions */}
                {paymentMethod !== 'wallet' && paymentMethod !== 'bkash_online' && (
                  <div className="space-y-5">
                    <div className="bg-indigo-50/30 border border-indigo-100 rounded-2xl p-5 md:p-6 space-y-4">
                      <PaymentInstructions
                        paymentMethodId={paymentMethod as PMId}
                        amount={finalTotal}
                        amountLabel="মোট পরিমাণ"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                            {paymentMethod === 'bank_transfer' ? 'Bank Reference / TRN' : 'Transaction ID (TrxID) *'}
                          </label>
                          <input
                            type="text"
                            value={transactionId}
                            onChange={e => setTransactionId(e.target.value)}
                            placeholder={paymentMethod === 'bank_transfer' ? 'যেমন: TRN123456789' : 'যেমন: 8F3K2P9X'}
                            maxLength={50}
                            className="w-full px-4 py-3 rounded-xl border border-indigo-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none bg-white font-mono text-sm text-slate-900 placeholder:text-slate-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                            <ImageIcon size={12} /> স্ক্রিনশট <span className="font-normal normal-case tracking-normal text-slate-500">(optional)</span>
                          </label>
                          {!screenshotPreview ? (
                            <label htmlFor="payment-screenshot-input" className="relative flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-indigo-300 bg-white text-indigo-500 text-sm cursor-pointer hover:bg-indigo-50/50 transition-colors">
                              <Upload size={16} />
                              <span className="truncate">ফাইল সিলেক্ট করুন</span>
                              <input
                                id="payment-screenshot-input"
                                ref={screenshotInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleScreenshotChange}
                                className="hidden"
                              />
                            </label>
                          ) : (
                            <div className="relative rounded-xl overflow-hidden border border-indigo-200 bg-white">
                              <img src={screenshotPreview} alt="Payment screenshot preview" className="w-full max-h-40 object-contain" />
                              <button
                                type="button"
                                onClick={removeScreenshot}
                                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                                aria-label="Remove screenshot"
                              >
                                <X size={12} />
                              </button>
                              <div className="px-3 py-1.5 text-[11px] text-slate-500 flex items-center justify-between bg-slate-50">
                                <span className="truncate">{paymentScreenshot?.name}</span>
                                <span className="flex-shrink-0 ml-2">
                                  {paymentScreenshot && (paymentScreenshot.size / 1024).toFixed(0)} KB
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* 3. Order Notes */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">৩</div>
                  <h2 className="text-lg md:text-xl font-semibold text-slate-800">অর্ডার নোট <span className="text-xs text-slate-400 font-normal ml-1">(ঐচ্ছিক)</span></h2>
                </div>
                <textarea
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  placeholder="কোনো বিশেষ নির্দেশনা বা মন্তব্য..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-slate-50/30 text-sm resize-none text-slate-900 placeholder:text-slate-400"
                />
                <p className="text-xs text-slate-400 text-right mt-1">{orderNotes.length}/500</p>
              </section>

              {/* Terms */}
              <section>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                  />
                  <span className="text-sm text-slate-600 leading-relaxed group-hover:text-slate-900">
                    আমি সাইটের{' '}
                    <a href="https://shahedstore.com.bd/terms-conditions" className="text-indigo-600 underline font-medium">শর্তাবলী</a>
                    {' '}এবং{' '}
                    <button type="button" onClick={() => navigate('/refund-policy')} className="text-indigo-600 underline font-medium">রিফান্ড নীতি</button>
                    {' '}মেনে নিচ্ছি।
                  </span>
                </label>
              </section>

              {submitError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                  <X size={14} /> {submitError}
                </div>
              )}
            </div>
          </form>

          {/* ===== RIGHT: ORDER SUMMARY ===== */}
          <aside className="w-full lg:w-96 bg-slate-50/50 p-6 md:p-10 lg:p-12 flex flex-col border-t lg:border-t-0 border-slate-100">
            <button
              type="button"
              onClick={() => setSummaryOpen(o => !o)}
              className="w-full flex items-center justify-between mb-6 lg:cursor-default"
            >
              <h2 className="text-lg md:text-xl font-bold text-slate-800">
                অর্ডার সামারি
                <span className="text-xs text-slate-400 font-normal ml-2">({items.length} item{items.length !== 1 ? 's' : ''})</span>
              </h2>
              <ChevronDown size={16} className={`text-slate-400 lg:hidden transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`space-y-6 flex-1 ${summaryOpen ? '' : 'hidden lg:block'}`}>
              {/* Items */}
              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {items.map(item => (
                  <div key={`${item.id}-${item.variant}`} className="flex gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0 group">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                      <img
                        src={item.image} alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/64x64/e2e8f0/64748b?text=P'; }}
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</p>
                        {item.variant && <p className="text-xs text-slate-500 mt-0.5">{item.variant}</p>}
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-1.5 py-0.5">
                          <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-slate-400 hover:text-indigo-600 p-1">
                            <Minus size={10} />
                          </button>
                          <span className="text-xs font-bold w-4 text-center text-slate-800">{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-slate-400 hover:text-indigo-600 p-1">
                            <Plus size={10} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">৳{(item.price * item.quantity).toLocaleString()}</span>
                          <button type="button" onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div>
                {!coupon.isApplied ? (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={couponCode}
                          onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                          placeholder="কুপন কোড"
                          maxLength={30}
                          className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white text-sm text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors disabled:opacity-50"
                      >
                        {couponLoading ? <Loader2 size={14} className="animate-spin" /> : 'প্রয়োগ'}
                      </button>
                    </div>
                    {couponError && <p className="text-rose-500 text-xs">{couponError}</p>}
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-emerald-600" />
                      <div className="flex flex-col leading-tight">
                        <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold">Approved</span>
                        <span className="text-xs font-bold text-emerald-800">{coupon.code} · ৳{discountAmount.toLocaleString()} ছাড়</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => { resetCoupon(); setCouponCode(''); }} className="text-slate-400 hover:text-rose-500 p-1">
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>সাব-টোটাল</span>
                  <span>৳{subtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>ডিসকাউন্ট</span>
                    <span>-৳{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>ট্যাক্স</span>
                    <span>৳{taxAmount.toLocaleString()}</span>
                  </div>
                )}
                {serviceFee > 0 && (
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>সার্ভিস ফি</span>
                    <span>৳{serviceFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="h-px bg-slate-200 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-900">সর্বমোট</span>
                  <span className="text-2xl font-black text-indigo-600">৳{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Trust bullets */}
              <div className="pt-4 space-y-3 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle size={12} />
                  </div>
                  <span className="text-xs text-slate-600 font-medium">পেমেন্ট ভেরিফাই হলে ইনস্ট্যান্ট ডেলিভারি</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle size={12} />
                  </div>
                  <span className="text-xs text-slate-600 font-medium">লাইসেন্স ইমেইল ও ড্যাশবোর্ডে পাঠানো হবে</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <Shield size={12} />
                  </div>
                  <span className="text-xs text-slate-600 font-medium">২৪/৭ কাস্টমার সাপোর্ট</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            {(() => {
              const isBkashOnline = paymentMethod === 'bkash_online';
              const isWallet = paymentMethod === 'wallet';
              const gradient = isBkashOnline
                ? 'linear-gradient(135deg, #ff2e87 0%, #e2007a 45%, #b8005f 100%)'
                : isWallet
                  ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 45%, #4c1d95 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 45%, #3730a3 100%)';
              const shadow = isBkashOnline
                ? 'shadow-[0_20px_40px_-12px_rgba(226,0,116,0.4)]'
                : isWallet
                  ? 'shadow-[0_20px_40px_-12px_rgba(139,92,246,0.4)]'
                  : 'shadow-[0_20px_40px_-12px_rgba(79,70,229,0.35)]';
              const amount = isWallet ? finalTotal : payableTotal;
              return (
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={loading || !termsAccepted || items.length === 0}
                  className={`group relative w-full mt-8 lg:mt-10 py-4 md:py-5 text-white rounded-2xl font-bold text-base md:text-lg ${shadow} transition-all transform active:scale-[0.98] hover:-translate-y-0.5 flex items-center justify-center gap-3 overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
                  style={{ background: gradient }}
                >
                  <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                  <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
                  <span className="relative flex items-center justify-center gap-3">
                    {loading ? (
                      <><Loader2 size={18} className="animate-spin" /> Processing…</>
                    ) : (
                      <>
                        {isBkashOnline && (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-white/40">
                            <img src={bkashLogoSrc} alt="bKash" className="h-5 w-5 object-contain" />
                          </span>
                        )}
                        <span className="tracking-wide">
                          {isBkashOnline ? 'bKash দিয়ে পরিশোধ করুন' : isWallet ? 'ওয়ালেট দিয়ে পরিশোধ করুন' : 'অর্ডার কনফার্ম করুন'}
                        </span>
                        <span className="ml-1 rounded-full bg-white/20 px-3 py-1 text-sm font-extrabold backdrop-blur-sm">
                          ৳{amount.toLocaleString()}
                        </span>
                      </>
                    )}
                  </span>
                </button>
              );
            })()}

            <p className="text-center text-[10px] text-slate-400 mt-6 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Shield size={11} /> 100% Secure Encrypted Checkout
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
