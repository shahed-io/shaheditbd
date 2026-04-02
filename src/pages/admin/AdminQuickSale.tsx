import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ShoppingBag, Search, ChevronDown, User, Phone, Mail,
  MessageCircle, Send, Save, Plus, Minus, X, Package,
  CreditCard, CheckCircle2, Loader2, Copy, Eye, EyeOff,
  Key, FileText, Tag
} from 'lucide-react';

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  category_id: string | null;
  category_name?: string;
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
  custom_price: number;
  license: LicenseKey | null;
  manual_key: string;
  manual_extra: string;
};

const emptyEntry = (): OrderEntry => ({
  product: null,
  quantity: 1,
  custom_price: 0,
  license: null,
  manual_key: '',
  manual_extra: '',
});

const KEY_TYPES: Record<string, string> = {
  license: '🔑 License Key',
  subscription: '👤 Subscription',
  account: '📧 Account',
  serial: '🔢 Serial',
  custom: '📝 Custom',
};

const AdminQuickSale = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Customer
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Order items
  const [entries, setEntries] = useState<OrderEntry[]>([emptyEntry()]);

  // Product search
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // License picker
  const [licensePickerIdx, setLicensePickerIdx] = useState<number | null>(null);
  const [availableLicenses, setAvailableLicenses] = useState<LicenseKey[]>([]);
  const [licensesLoading, setLicensesLoading] = useState(false);
  const [showLicenseValues, setShowLicenseValues] = useState<Record<string, boolean>>({});

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');

  // Delivery
  const [deliveryMethod, setDeliveryMethod] = useState<'save' | 'whatsapp' | 'both'>('whatsapp');
  const [saving, setSaving] = useState(false);

  // Stats
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [prodRes, catRes, orderCountRes] = await Promise.all([
      supabase.from('products').select('id, name, slug, price, original_price, image_url, category_id').eq('status', 'active').order('name'),
      supabase.from('categories').select('id, name').eq('is_active', true).order('name'),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
    ]);

    if (prodRes.data) {
      const cats = catRes.data || [];
      setProducts(prodRes.data.map((p: any) => ({
        ...p,
        category_name: cats.find((c: any) => c.id === p.category_id)?.name || '',
      })));
    }
    setCategories(catRes.data || []);
    setTotalOrders(orderCountRes.count || 0);
    setLoading(false);
  };

  const filteredProducts = products.filter(p => {
    if (filterCategory !== 'all' && p.category_id !== filterCategory) return false;
    if (productSearch) {
      return p.name.toLowerCase().includes(productSearch.toLowerCase());
    }
    return true;
  });

  const selectProduct = (idx: number, product: Product) => {
    setEntries(prev => prev.map((e, i) =>
      i === idx ? { ...e, product, custom_price: product.price, license: null, manual_key: '', manual_extra: '' } : e
    ));
    setActiveIdx(null);
    setProductSearch('');
  };

  const updateEntry = (idx: number, updates: Partial<OrderEntry>) => {
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, ...updates } : e));
  };

  const removeEntry = (idx: number) => {
    if (entries.length <= 1) return;
    setEntries(prev => prev.filter((_, i) => i !== idx));
  };

  const addEntry = () => setEntries(prev => [...prev, emptyEntry()]);

  // License picker
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

  // Generate order number
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
    const validEntries = entries.filter(e => e.product);
    if (validEntries.length === 0) return toast.error('কমপক্ষে একটি প্রোডাক্ট সিলেক্ট করুন');

    setSaving(true);
    try {
      const orderNumber = genOrderNumber();

      // 1. Create order
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

      // 2. Create order items
      for (const entry of validEntries) {
        const keyDisplay = entry.manual_key
          ? (entry.manual_extra ? `${entry.manual_key}|${entry.manual_extra}` : entry.manual_key)
          : null;

        await supabase.from('order_items').insert({
          order_id: order.id,
          product_id: entry.product!.id,
          product_name: entry.product!.name,
          price: entry.custom_price,
          quantity: entry.quantity,
          total: entry.custom_price * entry.quantity,
          license_key: keyDisplay,
        });

        // 3. Mark license as delivered if selected from DB
        if (entry.license) {
          await supabase.from('license_keys').update({
            status: deliveryMethod === 'save' ? 'assigned' : 'whatsapp_delivered',
            assigned_at: new Date().toISOString(),
          }).eq('id', entry.license.id);
        }
      }

      // 4. Delivery
      if ((deliveryMethod === 'whatsapp' || deliveryMethod === 'both') && customerPhone.trim()) {
        const phone = customerPhone.replace(/\D/g, '').replace(/^0/, '880');
        let msg = `🛒 *Quick Sale — অর্ডার কনফার্ম*\n\n`;
        msg += `📋 *অর্ডার:* #${orderNumber}\n`;
        msg += `👤 *নাম:* ${customerName}\n\n`;
        msg += `━━━━━━━━━━━━━━━\n`;

        for (const entry of validEntries) {
          msg += `📦 *${entry.product!.name}*\n`;
          msg += `💰 মূল্য: ৳${entry.custom_price} × ${entry.quantity}\n`;
          if (entry.manual_key) {
            msg += `🔐 *Key:* ${entry.manual_key}\n`;
            if (entry.manual_extra) msg += `🔒 *Extra:* ${entry.manual_extra}\n`;
          }
          msg += `\n`;
        }

        msg += `━━━━━━━━━━━━━━━\n`;
        msg += `💵 *মোট:* ৳${subtotal}\n`;
        msg += `✅ *পেমেন্ট:* ${paymentStatus === 'paid' ? 'পেইড' : 'পেন্ডিং'}\n\n`;
        msg += `ধন্যবাদ! — *ShahedStore*`;

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
      }

      toast.success(`অর্ডার #${orderNumber} সফলভাবে তৈরি হয়েছে!`);

      // Reset
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
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <ShoppingBag size={24} className="text-primary" /> Quick Sale
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          ম্যানুয়াল অর্ডার তৈরি করুন এবং সরাসরি ডেলিভারি দিন
        </p>
      </div>

      {/* Customer Info */}
      <div className="glass-card rounded-2xl p-5 border border-border">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
          <User size={14} className="text-primary" /> কাস্টমার তথ্য
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">নাম *</label>
            <div className="relative">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                placeholder="কাস্টমারের নাম"
                className="w-full bg-muted/20 border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">ফোন *</label>
            <div className="relative">
              <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full bg-muted/20 border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">ইমেইল</label>
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-muted/20 border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="glass-card rounded-2xl p-5 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Package size={14} className="text-primary" /> প্রোডাক্ট ও লাইসেন্স
          </h3>
          <button onClick={addEntry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(258,78%,55%))' }}>
            <Plus size={12} /> আরেকটি যোগ করুন
          </button>
        </div>

        <div className="space-y-4">
          {entries.map((entry, idx) => (
            <div key={idx} className="border border-border rounded-xl p-4 bg-muted/5 relative">
              {entries.length > 1 && (
                <button onClick={() => removeEntry(idx)}
                  className="absolute top-2 right-2 p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                  <X size={14} />
                </button>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                {/* Product selector */}
                <div className="relative">
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">প্রোডাক্ট *</label>
                  <div
                    onClick={() => setActiveIdx(activeIdx === idx ? null : idx)}
                    className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm cursor-pointer flex items-center justify-between">
                    <span className={entry.product ? 'text-foreground' : 'text-muted-foreground'}>
                      {entry.product ? entry.product.name : '— প্রোডাক্ট বেছে নিন —'}
                    </span>
                    <ChevronDown size={14} className={`text-muted-foreground transition-transform ${activeIdx === idx ? 'rotate-180' : ''}`} />
                  </div>
                  {activeIdx === idx && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl max-h-96 flex flex-col"
                      onClick={e => e.stopPropagation()}>
                      <div className="p-2 border-b border-border space-y-2 shrink-0">
                        <div className="relative">
                          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
                            placeholder="প্রোডাক্ট খুঁজুন..."
                            className="w-full bg-muted/20 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                            autoFocus onClick={e => e.stopPropagation()} />
                        </div>
                        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="w-full bg-muted/20 border border-border rounded-lg px-2 py-1 text-xs focus:outline-none">
                          <option value="all">সকল ক্যাটাগরি</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="overflow-y-auto max-h-48">
                        {filteredProducts.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-3">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
                        ) : filteredProducts.map(p => (
                          <button key={p.id}
                            onClick={(e) => { e.stopPropagation(); selectProduct(idx, p); }}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-primary/10 transition-colors flex items-center justify-between ${entry.product?.id === p.id ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground'}`}>
                            <div>
                              <span className="font-medium">{p.name}</span>
                              {p.category_name && <span className="text-muted-foreground ml-2">({p.category_name})</span>}
                            </div>
                            <span className="text-muted-foreground">৳{p.price}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Price & Quantity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">মূল্য (৳)</label>
                    <input type="number" value={entry.custom_price} onChange={e => updateEntry(idx, { custom_price: Number(e.target.value) })}
                      className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">পরিমাণ</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateEntry(idx, { quantity: Math.max(1, entry.quantity - 1) })}
                        className="p-1.5 rounded-lg border border-border hover:border-primary/40 transition-all">
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-bold w-8 text-center">{entry.quantity}</span>
                      <button onClick={() => updateEntry(idx, { quantity: entry.quantity + 1 })}
                        className="p-1.5 rounded-lg border border-border hover:border-primary/40 transition-all">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* License / Account delivery */}
              {entry.product && (
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Key size={12} className="text-primary" />
                    <span className="text-xs font-bold text-foreground">লাইসেন্স / অ্যাকাউন্ট ডেলিভারি</span>
                    <button onClick={() => openLicensePicker(idx)}
                      className="ml-auto text-xs px-2.5 py-1 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-all font-medium">
                      স্টক থেকে নিন
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Key / Email / ID</label>
                      <input value={entry.manual_key} onChange={e => updateEntry(idx, { manual_key: e.target.value })}
                        placeholder="License key বা Email..."
                        className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Password / Extra Info</label>
                      <input value={entry.manual_extra} onChange={e => updateEntry(idx, { manual_extra: e.target.value })}
                        placeholder="Password বা অতিরিক্ত তথ্য..."
                        className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                    </div>
                  </div>
                  {entry.license && (
                    <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                      <CheckCircle2 size={11} /> স্টক থেকে সিলেক্ট করা হয়েছে (ID: {entry.license.id.slice(0, 8)}...)
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Payment & Delivery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Payment */}
        <div className="glass-card rounded-2xl p-5 border border-border">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <CreditCard size={14} className="text-primary" /> পেমেন্ট
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">পেমেন্ট মেথড</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
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
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">পেমেন্ট স্ট্যাটাস</label>
              <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}
                className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
                <option value="paid">পেইড ✅</option>
                <option value="pending">পেন্ডিং ⏳</option>
                <option value="partial">আংশিক পেমেন্ট</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">ট্রানজেকশন আইডি</label>
              <input value={transactionId} onChange={e => setTransactionId(e.target.value)}
                placeholder="TrxID (optional)"
                className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>
        </div>

        {/* Delivery Method */}
        <div className="glass-card rounded-2xl p-5 border border-border">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Send size={14} className="text-primary" /> ডেলিভারি মেথড
          </h3>
          <div className="space-y-2">
            {[
              { value: 'whatsapp', label: 'WhatsApp এ পাঠান', icon: MessageCircle, color: 'hsl(142,70%,45%)' },
              { value: 'both', label: 'WhatsApp + সিস্টেমে সেভ', icon: Send, color: 'hsl(258,78%,68%)' },
              { value: 'save', label: 'শুধু সিস্টেমে সেভ', icon: Save, color: 'hsl(200,90%,55%)' },
            ].map(opt => (
              <button key={opt.value}
                onClick={() => setDeliveryMethod(opt.value as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                  deliveryMethod === opt.value
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border hover:border-primary/20'
                }`}>
                <opt.icon size={16} style={{ color: opt.color }} />
                <span>{opt.label}</span>
                {deliveryMethod === opt.value && <CheckCircle2 size={14} className="ml-auto text-primary" />}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">নোট</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="অতিরিক্ত নোট (optional)"
              rows={2}
              className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
          </div>
        </div>
      </div>

      {/* Summary & Submit */}
      <div className="glass-card rounded-2xl p-5 border border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">মোট আইটেম: <span className="font-bold text-foreground">{entries.filter(e => e.product).length}</span></p>
            <p className="text-2xl font-black text-primary">৳{subtotal.toLocaleString()}</p>
          </div>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(258,78%,55%))' }}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {saving ? 'প্রসেসিং...' : 'অর্ডার তৈরি ও ডেলিভারি'}
          </button>
        </div>
      </div>

      {/* License Picker Modal */}
      {licensePickerIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setLicensePickerIdx(null)}>
          <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-lg mx-4 max-h-[70vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Key size={14} className="text-primary" /> স্টক থেকে লাইসেন্স নিন
              </h3>
              <button onClick={() => setLicensePickerIdx(null)}
                className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground"><X size={14} /></button>
            </div>

            {licensesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : availableLicenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">এই প্রোডাক্টের জন্য কোনো available লাইসেন্স নেই</p>
            ) : (
              <div className="overflow-y-auto flex-1 space-y-2">
                {availableLicenses.map(lic => (
                  <div key={lic.id}
                    className="border border-border rounded-xl p-3 hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => selectLicense(licensePickerIdx, lic)}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {KEY_TYPES[lic.key_type] || lic.key_type}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowLicenseValues(prev => ({ ...prev, [lic.id]: !prev[lic.id] })); }}
                        className="p-1 rounded text-muted-foreground hover:text-foreground">
                        {showLicenseValues[lic.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                    <p className="text-sm font-mono text-foreground">
                      {showLicenseValues[lic.id] ? lic.key_value : '••••••••••••'}
                    </p>
                    {lic.extra_info && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Extra: {showLicenseValues[lic.id] ? lic.extra_info : '••••••'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuickSale;
