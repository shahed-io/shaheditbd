import { forwardRef, useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  ShoppingBag, Search, ChevronDown, User, Phone, Mail,
  MessageCircle, Send, Save, Plus, Minus, X, Package,
  CreditCard, CheckCircle2, Loader2, Eye, EyeOff,
  Key, Zap, ArrowRight, Sparkles, Hash, FileText,
  DollarSign, Truck, ClipboardList, PenLine, Tag, Percent
} from 'lucide-react';
import { sendInvoiceEmail } from '@/lib/emailInvoice';

// Inline price + discount editor
type PriceDiscountFieldsProps = {
  entry: { original_price: number; discount_amount: number; discount_percent: number; custom_price: number };
  onOriginalChange: (v: number) => void;
  onDiscountAmountChange: (v: number) => void;
  onDiscountPercentChange: (v: number) => void;
};

const PriceDiscountFields = forwardRef<HTMLDivElement, PriceDiscountFieldsProps>(({ entry, onOriginalChange, onDiscountAmountChange, onDiscountPercentChange }, ref) => (
  <div ref={ref} className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-lg bg-muted/20 border border-border/60">
    <div>
      <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">মূল মূল্য (৳)</label>
      <input type="number" min={0} value={entry.original_price || ''}
        onChange={e => onOriginalChange(Number(e.target.value))}
        placeholder="0"
        className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
    </div>
    <div>
      <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">ডিসকাউন্ট (৳)</label>
      <input type="number" min={0} value={entry.discount_amount || ''}
        onChange={e => onDiscountAmountChange(Number(e.target.value))}
        placeholder="0"
        className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
    </div>
    <div>
      <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">ডিসকাউন্ট (%)</label>
      <div className="relative">
        <input type="number" min={0} max={100} value={entry.discount_percent || ''}
          onChange={e => onDiscountPercentChange(Number(e.target.value))}
          placeholder="0"
          className="w-full bg-background border border-border rounded-lg px-2.5 pr-7 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
        <Percent size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
    <div>
      <label className="text-[10px] font-semibold text-primary mb-1 block">ফাইনাল মূল্য (৳)</label>
      <div className="bg-primary/10 border border-primary/30 rounded-lg px-2.5 py-2 text-sm font-bold text-primary tabular-nums">
        ৳{(entry.custom_price || 0).toLocaleString()}
      </div>
    </div>
  </div>
));

PriceDiscountFields.displayName = 'PriceDiscountFields';


type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  category_ids: string[];
  category_names: string[];
};

type Category = { id: string; name: string };

type LicenseKey = {
  id: string;
  key_value: string;
  extra_info: string | null;
  key_type: string;
  status: string;
};

type OrderEntry = {
  product: Product | null;
  quantity: number;
  original_price: number;
  discount_amount: number;
  discount_percent: number;
  custom_price: number;
  license: LicenseKey | null;
  manual_key: string;
  manual_extra: string;
  is_custom: boolean;
  custom_name: string;
};

const emptyEntry = (): OrderEntry => ({
  product: null,
  quantity: 1,
  original_price: 0,
  discount_amount: 0,
  discount_percent: 0,
  custom_price: 0,
  license: null,
  manual_key: '',
  manual_extra: '',
  is_custom: false,
  custom_name: '',
});

const KEY_TYPES: Record<string, string> = {
  license: '🔑 License Key',
  subscription: '👤 Subscription',
  account: '📧 Account',
  serial: '🔢 Serial',
  custom: '📝 Custom',
};

const iconInputClass = 'w-full bg-background border border-border rounded-lg pl-12 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';
const iconSlotClass = 'pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground transition-colors group-focus-within:text-primary';

const AdminQuickSale = forwardRef<HTMLDivElement>((_props, ref) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const [entries, setEntries] = useState<OrderEntry[]>([emptyEntry()]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const [licensePickerIdx, setLicensePickerIdx] = useState<number | null>(null);
  const [availableLicenses, setAvailableLicenses] = useState<LicenseKey[]>([]);
  const [licensesLoading, setLicensesLoading] = useState(false);
  const [showLicenseValues, setShowLicenseValues] = useState<Record<string, boolean>>({});

  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'save' | 'whatsapp' | 'both'>('whatsapp');
  const [saving, setSaving] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);

  const dropdownRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (activeIdx !== null) {
        const ref = dropdownRefs.current[activeIdx];
        if (ref && !ref.contains(e.target as Node)) {
          setActiveIdx(null);
          setProductSearch('');
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activeIdx]);

  const fetchData = async () => {
    setLoading(true);
    const [prodRes, catRes, pcRes, orderCountRes] = await Promise.all([
      supabase.from('products').select('id, name, slug, price, original_price, image_url').eq('status', 'active').order('name'),
      supabase.from('categories').select('id, name').eq('is_active', true).order('name'),
      supabase.from('product_categories').select('product_id, category_id'),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
    ]);

    const cats = catRes.data || [];
    const pcData = pcRes.data || [];
    const catMap = new Map(cats.map(c => [c.id, c.name]));

    if (prodRes.data) {
      setProducts(prodRes.data.map((p: any) => {
        const pCatIds = pcData.filter(pc => pc.product_id === p.id).map(pc => pc.category_id);
        return {
          ...p,
          category_ids: pCatIds,
          category_names: pCatIds.map(id => catMap.get(id) || '').filter(Boolean),
        };
      }));
    }
    setCategories(cats);
    setTotalOrders(orderCountRes.count || 0);
    setLoading(false);
  };

  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();
    if (!search) return products;
    return products.filter(p => p.name.toLowerCase().includes(search));
  }, [products, productSearch]);

  const selectProduct = (idx: number, product: Product) => {
    const orig = product.original_price || product.price;
    const sell = product.price;
    const disc = Math.max(0, orig - sell);
    setEntries(prev => prev.map((e, i) =>
      i === idx ? {
        ...e, product,
        original_price: orig,
        discount_amount: disc,
        discount_percent: orig > 0 ? Math.round((disc / orig) * 100) : 0,
        custom_price: sell,
        license: null, manual_key: '', manual_extra: '', is_custom: false, custom_name: '',
      } : e
    ));
    setActiveIdx(null);
    setProductSearch('');
  };

  const toggleCustomProduct = (idx: number) => {
    setEntries(prev => prev.map((e, i) =>
      i === idx ? { ...e, is_custom: !e.is_custom, product: null, custom_name: '', original_price: 0, discount_amount: 0, discount_percent: 0, custom_price: 0, license: null, manual_key: '', manual_extra: '' } : e
    ));
    setActiveIdx(null);
  };

  // Auto-recalculate final price when original_price or discount changes
  const updateOriginalPrice = (idx: number, value: number) => {
    setEntries(prev => prev.map((e, i) => {
      if (i !== idx) return e;
      const newOrig = value;
      const newDisc = Math.min(e.discount_amount, newOrig);
      return { ...e, original_price: newOrig, discount_amount: newDisc, custom_price: Math.max(0, newOrig - newDisc), discount_percent: newOrig > 0 ? Math.round((newDisc / newOrig) * 100) : 0 };
    }));
  };
  const updateDiscountAmount = (idx: number, value: number) => {
    setEntries(prev => prev.map((e, i) => {
      if (i !== idx) return e;
      const disc = Math.min(Math.max(0, value), e.original_price);
      return { ...e, discount_amount: disc, custom_price: Math.max(0, e.original_price - disc), discount_percent: e.original_price > 0 ? Math.round((disc / e.original_price) * 100) : 0 };
    }));
  };
  const updateDiscountPercent = (idx: number, value: number) => {
    setEntries(prev => prev.map((e, i) => {
      if (i !== idx) return e;
      const pct = Math.min(Math.max(0, value), 100);
      const disc = Math.round((e.original_price * pct) / 100);
      return { ...e, discount_percent: pct, discount_amount: disc, custom_price: Math.max(0, e.original_price - disc) };
    }));
  };

  const updateEntry = (idx: number, updates: Partial<OrderEntry>) => {
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, ...updates } : e));
  };

  const removeEntry = (idx: number) => {
    if (entries.length <= 1) return;
    setEntries(prev => prev.filter((_, i) => i !== idx));
  };

  const addEntry = () => setEntries(prev => [...prev, emptyEntry()]);

  const openLicensePicker = async (idx: number) => {
    const product = entries[idx].product;
    if (!product) return toast.error('আগে প্রোডাক্ট সিলেক্ট করুন');
    setLicensePickerIdx(idx);
    setLicensesLoading(true);
    const { data } = await supabase
      .from('license_keys')
      .select('id, key_value, extra_info, key_type, status')
      .eq('product_id', product.id)
      .eq('status', 'available')
      .order('created_at', { ascending: true });
    setAvailableLicenses(data || []);
    setLicensesLoading(false);
  };

  const selectLicense = (idx: number, lic: LicenseKey) => {
    updateEntry(idx, { license: lic, manual_key: lic.key_value, manual_extra: lic.extra_info || '' });
    setLicensePickerIdx(null);
  };

  const subtotal = entries.reduce((sum, e) => sum + (e.custom_price * e.quantity), 0);

  const genOrderNumber = () => {
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const seq = String(totalOrders + 1).padStart(4, '0');
    return `QS-${y}${m}${d}-${seq}`;
  };

  const handleSubmit = async () => {
    if (!customerName.trim()) return toast.error('কাস্টমার নাম দিন');
    if (!customerPhone.trim() && !customerEmail.trim()) return toast.error('ফোন বা ইমেইল দিন');
    const validEntries = entries.filter(e => e.product || (e.is_custom && e.custom_name.trim()));
    if (validEntries.length === 0) return toast.error('কমপক্ষে একটি প্রোডাক্ট সিলেক্ট বা তৈরি করুন');

    setSaving(true);
    try {
      const orderNumber = genOrderNumber();

      const { data: order, error: orderErr } = await supabase.from('orders').insert({
        order_number: orderNumber,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim() || `${customerPhone.trim()}@quicksale.local`,
        customer_phone: customerPhone.trim() || null,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        transaction_id: transactionId.trim() || null,
        notes: notes.trim() || `Quick Sale — ${deliveryMethod}`,
        subtotal,
        total: subtotal,
        status: 'completed',
      }).select('id').single();

      if (orderErr || !order) throw orderErr || new Error('Order creation failed');

      for (const entry of validEntries) {
        const itemName = entry.is_custom ? entry.custom_name : entry.product!.name;
        const keyDisplay = entry.manual_key
          ? (entry.manual_extra ? `${entry.manual_key}|${entry.manual_extra}` : entry.manual_key)
          : null;

        await supabase.from('order_items').insert({
          order_id: order.id,
          product_id: entry.is_custom ? null : entry.product!.id,
          product_name: itemName,
          price: entry.custom_price,
          quantity: entry.quantity,
          total: entry.custom_price * entry.quantity,
          license_key: keyDisplay,
        });

        if (entry.license) {
          const deliveryPhone = (deliveryMethod === 'whatsapp' || deliveryMethod === 'both') && customerPhone.trim()
            ? customerPhone.replace(/\D/g, '').replace(/^0/, '880')
            : null;
          await supabase.from('license_keys').update({
            status: deliveryMethod === 'save' ? 'assigned' : 'whatsapp_delivered',
            assigned_at: new Date().toISOString(),
            ...(deliveryPhone ? { delivered_to_phone: deliveryPhone } : {}),
          } as any).eq('id', entry.license.id);
        }
      }

      if ((deliveryMethod === 'whatsapp' || deliveryMethod === 'both') && customerPhone.trim()) {
        const phone = customerPhone.replace(/\D/g, '').replace(/^0/, '880');
        let msg = `SHAHED STORE\n`;
        msg += `________________________\n\n`;
        msg += `Order Confirmation\n\n`;
        msg += `Order: #${orderNumber}\n`;
        msg += `Customer: ${customerName}\n`;
        msg += `\n________________________\n\n`;

        for (const entry of validEntries) {
          const itemName = entry.is_custom ? entry.custom_name : entry.product!.name;
          msg += `${itemName}\n`;
          msg += `Price: ${entry.custom_price} BDT x ${entry.quantity}\n`;
          if (entry.manual_key) {
            msg += `\nEmail:\n${entry.manual_key}\n`;
            if (entry.manual_extra) msg += `Temporary Password:\n${entry.manual_extra}\n`;
          }
          msg += `\n`;
        }

        msg += `________________________\n\n`;
        msg += `Total: ${subtotal} BDT\n`;
        msg += `Payment: ${paymentStatus === 'paid' ? 'Paid' : 'Pending'}\n\n`;
        msg += `Thank you for choosing Shahed Store\n`;
        msg += `www.shahedstore.com.bd`;

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
      }

      toast.success(`অর্ডার #${orderNumber} সফলভাবে তৈরি হয়েছে!`);

      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setEntries([emptyEntry()]);
      setTransactionId('');
      setNotes('');
      setTotalOrders(prev => prev + 1);
    } catch (err: any) {
      toast.error('ত্রুটি: ' + (err?.message || 'Unknown'));
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="relative mx-auto w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  const validItemCount = entries.filter(e => e.product || (e.is_custom && e.custom_name.trim())).length;

  return (
    <div ref={ref} className="space-y-5 max-w-5xl mx-auto pb-8">
      {/* Inline header — auto-hidden left side via global CSS guard (.admin-page-header is rendered by AdminLayout) */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight">Quick Sale</h1>
            <p className="text-xs text-muted-foreground">দ্রুত অর্ডার তৈরি ও ডেলিভারি</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border">
          <Hash size={12} />
          <span>মোট অর্ডার: <span className="font-bold text-foreground">{totalOrders}</span></span>
        </div>
      </div>

      {/* STEP 1: Customer */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-black">1</div>
          <h2 className="text-sm font-bold text-foreground">কাস্টমার তথ্য</h2>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">নাম <span className="text-destructive">*</span></label>
              <div className="relative group">
                <span className={iconSlotClass}><User size={16} /></span>
                <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                  placeholder="কাস্টমারের নাম"
                  className={iconInputClass} />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">ফোন <span className="text-destructive">*</span></label>
              <div className="relative group">
                <span className={iconSlotClass}><Phone size={16} /></span>
                <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className={iconInputClass} />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">ইমেইল</label>
              <div className="relative group">
                <span className={iconSlotClass}><Mail size={16} /></span>
                <input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="email@example.com"
                  className={iconInputClass} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STEP 2: Products */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-black">2</div>
            <h2 className="text-sm font-bold text-foreground">প্রোডাক্ট ও লাইসেন্স</h2>
          </div>
          <button onClick={addEntry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-all shadow-sm">
            <Plus size={12} /> আইটেম যোগ
          </button>
        </div>

        <div className="space-y-3">
          {entries.map((entry, idx) => (
            <div key={idx} className="bg-card rounded-xl border border-border shadow-sm">
              {/* Item header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border">
                <div className="flex items-center gap-2">
                  <Package size={13} className="text-primary" />
                  <span className="text-xs font-bold text-foreground">আইটেম #{idx + 1}</span>
                  {entry.product && <span className="text-xs text-muted-foreground">— {entry.product.name}</span>}
                  {entry.is_custom && entry.custom_name && <span className="text-xs text-muted-foreground">— {entry.custom_name} (কাস্টম)</span>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleCustomProduct(idx)}
                    title={entry.is_custom ? 'স্টোর প্রোডাক্ট ব্যবহার করুন' : 'কাস্টম প্রোডাক্ট তৈরি করুন'}
                    className={`p-1.5 rounded-md text-xs transition-all ${entry.is_custom ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}>
                    <PenLine size={13} />
                  </button>
                  {entries.length > 1 && (
                    <button onClick={() => removeEntry(idx)}
                      className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-3">
                {entry.is_custom ? (
                  /* Custom product inputs */
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-9">
                        <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">কাস্টম প্রোডাক্ট নাম <span className="text-destructive">*</span></label>
                        <div className="relative group">
                          <span className={cn(iconSlotClass, 'w-11')}><PenLine size={13} /></span>
                          <input value={entry.custom_name} onChange={e => updateEntry(idx, { custom_name: e.target.value })}
                            placeholder="প্রোডাক্টের নাম লিখুন"
                            className={cn(iconInputClass, 'pl-14')} />
                        </div>
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">পরিমাণ</label>
                        <div className="flex items-center bg-background border border-border rounded-lg overflow-hidden">
                          <button onClick={() => updateEntry(idx, { quantity: Math.max(1, entry.quantity - 1) })}
                            className="px-3 py-2.5 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all border-r border-border">
                            <Minus size={13} />
                          </button>
                          <span className="flex-1 text-center text-sm font-bold tabular-nums">{entry.quantity}</span>
                          <button onClick={() => updateEntry(idx, { quantity: entry.quantity + 1 })}
                            className="px-3 py-2.5 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all border-l border-border">
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <PriceDiscountFields
                      entry={entry}
                      onOriginalChange={(v) => updateOriginalPrice(idx, v)}
                      onDiscountAmountChange={(v) => updateDiscountAmount(idx, v)}
                      onDiscountPercentChange={(v) => updateDiscountPercent(idx, v)}
                    />
                  </div>
                ) : (
                  /* Store product selector */
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6 relative" ref={el => { dropdownRefs.current[idx] = el; }}>
                      <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">প্রোডাক্ট <span className="text-destructive">*</span></label>
                      {entry.product ? (
                        <div className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            {entry.product.image_url ? (
                              <img src={entry.product.image_url} alt="" className="w-6 h-6 rounded object-cover shrink-0 border border-border" />
                            ) : (
                              <div className="w-6 h-6 rounded bg-muted/50 flex items-center justify-center shrink-0"><Package size={10} className="text-muted-foreground" /></div>
                            )}
                            <span className="font-medium truncate text-foreground">{entry.product.name}</span>
                          </div>
                          <button onClick={() => updateEntry(idx, { product: null, custom_price: 0, license: null, manual_key: '', manual_extra: '' })}
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0 ml-2">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="relative group">
                            <span className={cn(iconSlotClass, 'w-11')}><Search size={13} /></span>
                            <input
                              value={activeIdx === idx ? productSearch : ''}
                              onChange={e => { setProductSearch(e.target.value); setActiveIdx(idx); }}
                              onFocus={() => { setActiveIdx(idx); }}
                              placeholder="প্রোডাক্ট নাম লিখে সার্চ করুন..."
                              className={cn(iconInputClass, 'pl-14')}
                            />
                          </div>
                          {activeIdx === idx && (
                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-2xl max-h-72 flex flex-col overflow-hidden">
                              <div className="overflow-y-auto flex-1 min-h-0">
                                {filteredProducts.length === 0 ? (
                                  <p className="text-xs text-muted-foreground text-center py-6">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
                                ) : filteredProducts.slice(0, 20).map(p => (
                                  <button key={p.id}
                                    onMouseDown={(e) => { e.preventDefault(); selectProduct(idx, p); }}
                                    className="w-full text-left px-3 py-2.5 text-xs hover:bg-primary/5 transition-colors flex items-center justify-between border-b border-border/50 last:border-0 text-foreground">
                                    <div className="flex items-center gap-2 min-w-0">
                                      {p.image_url ? (
                                        <img src={p.image_url} alt="" className="w-7 h-7 rounded-md object-cover shrink-0 border border-border" />
                                      ) : (
                                        <div className="w-7 h-7 rounded-md bg-muted/50 flex items-center justify-center shrink-0">
                                          <Package size={12} className="text-muted-foreground" />
                                        </div>
                                      )}
                                      <span className="font-medium block truncate">{p.name}</span>
                                    </div>
                                    <span className="text-muted-foreground font-mono shrink-0 ml-2">৳{p.price}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">পরিমাণ</label>
                      <div className="flex items-center bg-background border border-border rounded-lg overflow-hidden">
                        <button onClick={() => updateEntry(idx, { quantity: Math.max(1, entry.quantity - 1) })}
                          className="px-3 py-2.5 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all border-r border-border">
                          <Minus size={13} />
                        </button>
                        <span className="flex-1 text-center text-sm font-bold tabular-nums">{entry.quantity}</span>
                        <button onClick={() => updateEntry(idx, { quantity: entry.quantity + 1 })}
                          className="px-3 py-2.5 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all border-l border-border">
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="sm:col-span-3 hidden">{/* spacer */}</div>
                    <div className="sm:col-span-12">
                      <PriceDiscountFields
                        entry={entry}
                        onOriginalChange={(v) => updateOriginalPrice(idx, v)}
                        onDiscountAmountChange={(v) => updateDiscountAmount(idx, v)}
                        onDiscountPercentChange={(v) => updateDiscountPercent(idx, v)}
                      />
                    </div>
                  </div>
                )}

                {/* License section */}
                {(entry.product || (entry.is_custom && entry.custom_name.trim())) && (
                  <div className="bg-muted/20 rounded-lg border border-border/60 p-3">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <Key size={12} className="text-primary" />
                        <span className="text-[11px] font-bold text-foreground">লাইসেন্স / অ্যাকাউন্ট</span>
                      </div>
                      {entry.product && !entry.is_custom && (
                        <button onClick={() => openLicensePicker(idx)}
                          className="text-[11px] px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-all font-semibold flex items-center gap-1">
                          <Package size={10} /> স্টক থেকে নিন
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] text-muted-foreground mb-0.5 block">Key / Email / ID</label>
                        <input value={entry.manual_key} onChange={e => updateEntry(idx, { manual_key: e.target.value })}
                          placeholder="License key বা Email"
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground mb-0.5 block">Password / Extra Info</label>
                        <input value={entry.manual_extra} onChange={e => updateEntry(idx, { manual_extra: e.target.value })}
                          placeholder="Password বা অতিরিক্ত তথ্য"
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono" />
                      </div>
                    </div>
                    {entry.license && (
                      <p className="text-[11px] text-primary mt-2 flex items-center gap-1 font-medium">
                        <CheckCircle2 size={11} /> স্টক থেকে সিলেক্ট করা হয়েছে
                      </p>
                    )}
                  </div>
                )}

                {/* Subtotal per item */}
                {(entry.product || (entry.is_custom && entry.custom_name.trim())) && entry.custom_price > 0 && (
                  <div className="flex justify-end">
                    <span className="text-xs text-muted-foreground">
                      সাবটোটাল: <span className="font-bold text-foreground">৳{(entry.custom_price * entry.quantity).toLocaleString()}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STEP 3: Payment & Delivery */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-black">3</div>
          <h2 className="text-sm font-bold text-foreground">পেমেন্ট ও ডেলিভারি</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <CreditCard size={14} className="text-primary" />
              <span className="text-xs font-bold text-foreground">পেমেন্ট</span>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">মেথড</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                <option value="bkash">বিকাশ</option>
                <option value="nagad">নগদ</option>
                <option value="rocket">রকেট</option>
                <option value="upay">উপায়</option>
                <option value="bank">ব্যাংক ট্রান্সফার</option>
                <option value="cash">ক্যাশ</option>
                <option value="wallet">ওয়ালেট</option>
                <option value="free">ফ্রি</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">স্ট্যাটাস</label>
              <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                <option value="paid">পেইড ✅</option>
                <option value="pending">পেন্ডিং ⏳</option>
                <option value="partial">আংশিক</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">ট্রানজেকশন আইডি</label>
              <input value={transactionId} onChange={e => setTransactionId(e.target.value)}
                placeholder="TrxID (optional)"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Truck size={14} className="text-primary" />
              <span className="text-xs font-bold text-foreground">ডেলিভারি মেথড</span>
            </div>
            <div className="space-y-1.5">
              {([
                { value: 'whatsapp' as const, label: 'WhatsApp এ পাঠান', icon: MessageCircle, desc: 'সরাসরি WhatsApp মেসেজ' },
                { value: 'both' as const, label: 'WhatsApp + সিস্টেম', icon: Send, desc: 'WhatsApp ও ডাটাবেজে সেভ' },
                { value: 'save' as const, label: 'শুধু সিস্টেমে সেভ', icon: Save, desc: 'শুধু ডাটাবেজে রেকর্ড' },
              ] as const).map(opt => (
                <button key={opt.value}
                  onClick={() => setDeliveryMethod(opt.value)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                    deliveryMethod === opt.value
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/30 hover:bg-muted/20'
                  }`}>
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                    deliveryMethod === opt.value ? 'bg-primary/15' : 'bg-muted/40'
                  }`}>
                    <opt.icon size={14} className={deliveryMethod === opt.value ? 'text-primary' : 'text-muted-foreground'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-semibold block ${deliveryMethod === opt.value ? 'text-primary' : 'text-foreground'}`}>{opt.label}</span>
                    <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                  </div>
                  {deliveryMethod === opt.value && <CheckCircle2 size={14} className="text-primary shrink-0" />}
                </button>
              ))}
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">নোট</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="অতিরিক্ত নোট (optional)"
                rows={2}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" />
            </div>
          </div>
        </div>
      </section>

      {/* SUBMIT */}
      <div className="bg-card rounded-xl border-2 border-primary/20 p-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ClipboardList size={12} />
              <span>আইটেম: <span className="font-bold text-foreground">{validItemCount}</span></span>
              <span className="text-border">|</span>
              <span>ডেলিভারি: <span className="font-medium text-foreground capitalize">{deliveryMethod}</span></span>
            </div>
            <p className="text-2xl font-black text-primary tracking-tight">৳{subtotal.toLocaleString()}</p>
          </div>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20 hover:shadow-primary/30">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {saving ? 'প্রসেসিং...' : 'অর্ডার তৈরি ও ডেলিভারি'}
            {!saving && <ArrowRight size={14} />}
          </button>
        </div>
      </div>

      {/* License Picker Modal */}
      {licensePickerIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setLicensePickerIdx(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg mx-4 max-h-[70vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Key size={14} className="text-primary" /> স্টক থেকে লাইসেন্স নিন
              </h3>
              <button onClick={() => setLicensePickerIdx(null)}
                className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-all"><X size={14} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {licensesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              ) : availableLicenses.length === 0 ? (
                <div className="text-center py-12">
                  <Package size={32} className="mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">কোনো available লাইসেন্স নেই</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground px-1 mb-2">{availableLicenses.length}টি লাইসেন্স পাওয়া গেছে</p>
                  {availableLicenses.map(lic => (
                    <div key={lic.id}
                      className="border border-border rounded-lg p-3 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group"
                      onClick={() => selectLicense(licensePickerIdx, lic)}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                          {KEY_TYPES[lic.key_type] || lic.key_type}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowLicenseValues(prev => ({ ...prev, [lic.id]: !prev[lic.id] })); }}
                          className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
                          {showLicenseValues[lic.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      </div>
                      <p className="text-sm font-mono text-foreground">
                        {showLicenseValues[lic.id] ? lic.key_value : '••••••••••••••••'}
                      </p>
                      {lic.extra_info && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          {showLicenseValues[lic.id] ? lic.extra_info : '••••••••'}
                        </p>
                      )}
                      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-primary font-semibold flex items-center gap-1">
                          <CheckCircle2 size={10} /> ক্লিক করে সিলেক্ট করুন
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

AdminQuickSale.displayName = 'AdminQuickSale';

export default AdminQuickSale;
