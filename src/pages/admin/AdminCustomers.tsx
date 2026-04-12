import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Users, Search, RefreshCw, Eye, ShoppingBag,
  Mail, Phone, Calendar, TrendingUp, TrendingDown, UserCheck, Award, Star,
  Key, Package, ChevronDown, ChevronRight, MessageCircle, Copy, Check,
  Edit3, Save, X, ArrowLeft, UserPlus, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

type Customer = {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  wallet_balance: number;
  order_count?: number;
  total_spent?: number;
  last_order?: string | null;
  points_balance?: number;
  total_points_earned?: number;
  total_points_redeemed?: number;
};

type OrderItem = {
  id: string;
  product_name: string;
  product_id: string | null;
  price: number;
  quantity: number;
  total: number;
  license_key: string | null;
};

type Order = {
  id: string;
  order_number: string;
  total: number;
  subtotal: number;
  status: string;
  payment_method: string | null;
  payment_status: string | null;
  transaction_id: string | null;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  order_items: OrderItem[];
};

type LicenseKey = {
  id: string;
  key_value: string;
  extra_info: string | null;
  key_type: string;
  status: string;
  product_id: string | null;
  order_item_id: string | null;
  assigned_at: string | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:    { label: 'পেন্ডিং',    color: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  processing: { label: 'প্রসেসিং',  color: 'bg-blue-500/15 text-blue-500 border-blue-500/30' },
  delivered:  { label: 'ডেলিভার্ড', color: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30' },
  completed:  { label: 'সম্পন্ন',    color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
  cancelled:  { label: 'বাতিল',      color: 'bg-red-500/15 text-red-500 border-red-500/30' },
  refunded:   { label: 'রিফান্ড',    color: 'bg-purple-500/15 text-purple-500 border-purple-500/30' },
  failed:     { label: 'ব্যর্থ',     color: 'bg-rose-500/15 text-rose-500 border-rose-500/30' },
};

const LICENSE_STATUS: Record<string, { label: string; color: string }> = {
  available:            { label: 'Available',           color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  assigned:             { label: 'Assigned',            color: 'bg-blue-500/15 text-blue-500 border-blue-500/30' },
  whatsapp_delivered:   { label: 'WA Delivered',        color: 'bg-green-500/15 text-green-600 border-green-500/30' },
  revoked:              { label: 'Revoked',             color: 'bg-red-500/15 text-red-500 border-red-500/30' },
};

const PM_LABELS: Record<string, string> = {
  bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket',
  upay: 'উপায়', bkash_merchant: 'bKash Merchant', wallet: 'Wallet',
};

export default function AdminCustomers() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [custOrders, setCustOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderLicenses, setOrderLicenses] = useState<Record<string, LicenseKey[]>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Editing states
  const [editingOrderStatus, setEditingOrderStatus] = useState<string | null>(null);
  const [editingLicense, setEditingLicense] = useState<string | null>(null);
  const [editLicenseStatus, setEditLicenseStatus] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editNoteValue, setEditNoteValue] = useState('');

  // Add/Edit/Delete customer states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: '', email: '', phone: '' });
  const [addForm, setAddForm] = useState({ display_name: '', email: '', phone: '' });

  const { data: customers = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const { data: orders } = await supabase
        .from('orders')
        .select('user_id, total, created_at')
        .not('user_id', 'is', null);

      const orderMap: Record<string, { count: number; total: number; last: string }> = {};
      (orders ?? []).forEach(o => {
        if (!o.user_id) return;
        if (!orderMap[o.user_id]) orderMap[o.user_id] = { count: 0, total: 0, last: '' };
        orderMap[o.user_id].count++;
        orderMap[o.user_id].total += Number(o.total);
        if (!orderMap[o.user_id].last || o.created_at > orderMap[o.user_id].last)
          orderMap[o.user_id].last = o.created_at;
      });

      return (profiles ?? []).map(p => ({
        ...p,
        order_count: orderMap[p.user_id]?.count ?? 0,
        total_spent: orderMap[p.user_id]?.total ?? 0,
        last_order: orderMap[p.user_id]?.last ?? null,
      })) as Customer[];
    },
  });

  const openDetail = async (c: Customer) => {
    setSelected(c);
    setLoadingOrders(true);
    setExpandedOrder(null);
    setOrderLicenses({});
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, total, subtotal, status, payment_method, payment_status, transaction_id, notes, admin_notes, created_at, order_items(id, product_name, product_id, price, quantity, total, license_key)')
      .eq('user_id', c.user_id)
      .order('created_at', { ascending: false });
    setCustOrders((data ?? []) as Order[]);
    setLoadingOrders(false);
  };

  const toggleOrder = async (orderId: string, orderItems: OrderItem[]) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }
    setExpandedOrder(orderId);

    // Load licenses for this order's items
    const productIds = orderItems.filter(i => i.product_id).map(i => i.product_id!);
    const itemIds = orderItems.map(i => i.id);
    if (productIds.length > 0 || itemIds.length > 0) {
      const { data } = await supabase
        .from('license_keys')
        .select('id, key_value, extra_info, key_type, status, product_id, order_item_id, assigned_at')
        .or(`order_item_id.in.(${itemIds.join(',')}),and(product_id.in.(${productIds.join(',')}),status.eq.available)`)
        .order('created_at', { ascending: true });
      setOrderLicenses(prev => ({ ...prev, [orderId]: (data ?? []) as LicenseKey[] }));
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus as any }).eq('id', orderId);
    if (error) { toast.error('স্ট্যাটাস আপডেট ব্যর্থ'); return; }
    setCustOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    setEditingOrderStatus(null);
    toast.success('অর্ডার স্ট্যাটাস আপডেট হয়েছে');
  };

  const updateLicenseStatus = async (licId: string, newStatus: string, orderId: string) => {
    const { error } = await supabase.from('license_keys').update({ status: newStatus }).eq('id', licId);
    if (error) { toast.error('লাইসেন্স স্ট্যাটাস আপডেট ব্যর্থ'); return; }
    setOrderLicenses(prev => ({
      ...prev,
      [orderId]: (prev[orderId] || []).map(l => l.id === licId ? { ...l, status: newStatus } : l)
    }));
    setEditingLicense(null);
    toast.success('লাইসেন্স স্ট্যাটাস আপডেট হয়েছে');
  };

  const saveAdminNote = async (orderId: string) => {
    const { error } = await supabase.from('orders').update({ admin_notes: editNoteValue }).eq('id', orderId);
    if (error) { toast.error('নোট সেভ ব্যর্থ'); return; }
    setCustOrders(prev => prev.map(o => o.id === orderId ? { ...o, admin_notes: editNoteValue } : o));
    setEditingNote(null);
    toast.success('নোট সেভ হয়েছে');
  };

  const sendWhatsApp = (phone: string | null, customerName: string, order: Order) => {
    if (!phone) { toast.error('ফোন নম্বর নেই'); return; }
    const p = phone.replace(/\D/g, '').replace(/^0/, '880');
    const items = order.order_items.map(i => `- ${i.product_name} x${i.quantity}`).join('\n');
    const status = STATUS_CONFIG[order.status]?.label || order.status;
    const msg = encodeURIComponent(
      `SHAHED STORE\n________________________\n\nOrder: #${order.order_number}\nCustomer: ${customerName}\nStatus: ${status}\n\nProducts:\n${items}\n\nTotal: ${Number(order.total).toLocaleString()} BDT\n\nThank you!\n-- Shahed Store\nwww.shahedstore.com.bd`
    );
    window.open(`https://wa.me/${p}?text=${msg}`, '_blank');
  };

  // Add new customer
  const addCustomer = async () => {
    if (!addForm.display_name.trim() && !addForm.email.trim()) {
      toast.error('নাম অথবা ইমেইল দিন');
      return;
    }
    const newId = crypto.randomUUID();
    const { error } = await supabase.from('profiles').insert({
      user_id: newId,
      display_name: addForm.display_name.trim() || null,
      email: addForm.email.trim() || null,
      phone: addForm.phone.trim() || null,
    });
    if (error) { toast.error('কাস্টমার যোগ করা যায়নি'); return; }
    toast.success('কাস্টমার যোগ হয়েছে!');
    setShowAddModal(false);
    setAddForm({ display_name: '', email: '', phone: '' });
    refetch();
  };

  // Edit customer profile
  const startEditCustomer = () => {
    if (!selected) return;
    setEditForm({
      display_name: selected.display_name ?? '',
      email: selected.email ?? '',
      phone: selected.phone ?? '',
    });
    setEditingCustomer(true);
  };

  const saveCustomerEdit = async () => {
    if (!selected) return;
    const { error } = await supabase.from('profiles').update({
      display_name: editForm.display_name.trim() || null,
      email: editForm.email.trim() || null,
      phone: editForm.phone.trim() || null,
    }).eq('id', selected.id);
    if (error) { toast.error('আপডেট ব্যর্থ'); return; }
    setSelected({
      ...selected,
      display_name: editForm.display_name.trim() || null,
      email: editForm.email.trim() || null,
      phone: editForm.phone.trim() || null,
    });
    setEditingCustomer(false);
    toast.success('কাস্টমার তথ্য আপডেট হয়েছে!');
    refetch();
  };

  // Delete customer
  const deleteCustomer = async (c: Customer) => {
    if (!confirm(`"${c.display_name ?? c.email ?? 'No Name'}" কাস্টমার ডিলিট করতে চান?`)) return;
    const { error } = await supabase.from('profiles').delete().eq('id', c.id);
    if (error) { toast.error('ডিলিট ব্যর্থ'); return; }
    toast.success('কাস্টমার ডিলিট হয়েছে!');
    if (selected?.id === c.id) setSelected(null);
    refetch();
  };

  const filtered = customers
    .filter(c => {
      const q = search.toLowerCase();
      return !q
        || (c.display_name ?? '').toLowerCase().includes(q)
        || (c.email ?? '').toLowerCase().includes(q)
        || (c.phone ?? '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sort === 'top_spend') return (b.total_spent ?? 0) - (a.total_spent ?? 0);
      if (sort === 'top_orders') return (b.order_count ?? 0) - (a.order_count ?? 0);
      return 0;
    });

  const totalRevenue = customers.reduce((s, c) => s + (c.total_spent ?? 0), 0);
  const activeCustomers = customers.filter(c => (c.order_count ?? 0) > 0).length;

  // ─── Customer Detail View ───
  if (selected) {
    return (
      <div className="space-y-5 max-w-5xl mx-auto">
        {/* Back button + header */}
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelected(null); setEditingCustomer(false); }}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
              {(selected.display_name ?? selected.email ?? '?')[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">{selected.display_name ?? 'No Name'}</h1>
              <p className="text-xs text-muted-foreground truncate">{selected.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={startEditCustomer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20">
              <Edit3 size={13} /> এডিট
            </button>
            <button onClick={() => deleteCustomer(selected)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors border border-destructive/20">
              <Trash2 size={13} /> ডিলিট
            </button>
            {selected.phone && (
              <button onClick={() => sendWhatsApp(selected.phone, selected.display_name ?? '', custOrders[0])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20">
                <MessageCircle size={13} /> WhatsApp
              </button>
            )}
          </div>
        </div>

        {/* Edit Customer Form */}
        {editingCustomer && (
          <div className="bg-card rounded-xl border border-primary/30 p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Edit3 size={14} className="text-primary" /> কাস্টমার তথ্য এডিট করুন
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">নাম</label>
                <Input value={editForm.display_name} onChange={e => setEditForm(p => ({ ...p, display_name: e.target.value }))}
                  placeholder="কাস্টমারের নাম" className="bg-muted/30 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">ইমেইল</label>
                <Input value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="email@example.com" className="bg-muted/30 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">ফোন</label>
                <Input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="01XXXXXXXXX" className="bg-muted/30 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setEditingCustomer(false)} className="h-8 text-xs gap-1">
                <X size={12} /> বাতিল
              </Button>
              <Button size="sm" onClick={saveCustomerEdit} className="h-8 text-xs gap-1">
                <Save size={12} /> সেভ করুন
              </Button>
            </div>
          </div>
        )}

        {/* Customer info cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Mail, label: 'ইমেইল', value: selected.email ?? '—' },
            { icon: Phone, label: 'ফোন', value: selected.phone ?? '—' },
            { icon: Calendar, label: 'যোগদান', value: format(new Date(selected.created_at), 'dd MMM yyyy') },
            { icon: ShoppingBag, label: 'অর্ডার', value: String(selected.order_count ?? 0) },
            { icon: TrendingUp, label: 'মোট খরচ', value: `৳${(selected.total_spent ?? 0).toLocaleString()}` },
            { icon: Award, label: 'পয়েন্ট', value: `${(selected.points_balance ?? 0).toLocaleString()}` },
            { icon: Star, label: 'অর্জিত পয়েন্ট', value: `${(selected.total_points_earned ?? 0).toLocaleString()}` },
            { icon: TrendingDown, label: 'ওয়ালেট', value: `৳${(selected.wallet_balance ?? 0).toLocaleString()}` },
          ].map(item => (
            <div key={item.label} className="bg-card rounded-xl border border-border p-3">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-semibold mb-1">
                <item.icon size={11} />{item.label}
              </div>
              <div className="text-sm font-bold text-foreground truncate">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Orders */}
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <ShoppingBag size={14} className="text-primary" />
            অর্ডার হিস্ট্রি ({custOrders.length})
          </h2>

          {loadingOrders ? (
            <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground text-sm">
              <RefreshCw size={14} className="animate-spin" /> লোড হচ্ছে...
            </div>
          ) : custOrders.length === 0 ? (
            <div className="text-center py-10 bg-card rounded-xl border border-border">
              <ShoppingBag size={28} className="mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">কোনো অর্ডার নেই</p>
            </div>
          ) : (
            <div className="space-y-3">
              {custOrders.map(order => {
                const isExpanded = expandedOrder === order.id;
                const licenses = orderLicenses[order.id] || [];
                const sc = STATUS_CONFIG[order.status] || { label: order.status, color: 'bg-muted text-muted-foreground border-border' };

                return (
                  <div key={order.id} className="bg-card rounded-xl border border-border">
                    {/* Order header */}
                    <button onClick={() => toggleOrder(order.id, order.order_items)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        {isExpanded ? <ChevronDown size={14} className="text-primary shrink-0" /> : <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
                        <div className="text-left min-w-0">
                          <div className="text-xs font-bold text-primary">{order.order_number}</div>
                          <div className="text-[10px] text-muted-foreground">{format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a')}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] text-muted-foreground">{PM_LABELS[order.payment_method ?? ''] ?? order.payment_method}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sc.color}`}>
                          {sc.label}
                        </span>
                        <span className="text-xs font-bold text-foreground">৳{Number(order.total).toLocaleString()}</span>
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="border-t border-border px-4 py-4 space-y-4">
                        {/* Order actions row */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Status change */}
                          {editingOrderStatus === order.id ? (
                            <div className="flex items-center gap-2">
                              <select
                                defaultValue={order.status}
                                onChange={e => updateOrderStatus(order.id, e.target.value)}
                                className="text-xs bg-background border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20">
                                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                  <option key={k} value={k}>{v.label}</option>
                                ))}
                              </select>
                              <button onClick={() => setEditingOrderStatus(null)} className="p-1 text-muted-foreground hover:text-foreground"><X size={12} /></button>
                            </div>
                          ) : (
                            <button onClick={() => setEditingOrderStatus(order.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                              <Edit3 size={10} /> স্ট্যাটাস পরিবর্তন
                            </button>
                          )}

                          {/* WhatsApp */}
                          <button onClick={() => sendWhatsApp(selected.phone, selected.display_name ?? '', order)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors">
                            <MessageCircle size={10} /> WhatsApp
                          </button>

                          {order.transaction_id && (
                            <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
                              TrxID: {order.transaction_id}
                            </span>
                          )}
                        </div>

                        {/* Order items */}
                        <div>
                          <div className="text-[11px] font-bold text-muted-foreground uppercase mb-2">পণ্যসমূহ</div>
                          <div className="space-y-2">
                            {order.order_items.map(item => {
                              const itemLicenses = licenses.filter(l => l.order_item_id === item.id);
                              return (
                                <div key={item.id} className="bg-muted/20 rounded-lg border border-border/60 p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <Package size={12} className="text-primary" />
                                      <span className="text-xs font-semibold text-foreground">{item.product_name}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      ৳{item.price} x {item.quantity} = <span className="font-bold text-foreground">৳{Number(item.total).toLocaleString()}</span>
                                    </span>
                                  </div>

                                  {/* License key from order_items */}
                                  {item.license_key && (
                                    <div className="mt-2 bg-background rounded-lg border border-border/60 p-2">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <Key size={10} className="text-primary" />
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">ডেলিভার্ড কি</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <code className="text-[11px] font-mono text-foreground bg-muted/30 px-2 py-1 rounded flex-1 break-all">
                                          {item.license_key}
                                        </code>
                                        <button onClick={() => copyKey(item.license_key!)}
                                          className="p-1 rounded text-muted-foreground hover:text-primary transition-colors shrink-0">
                                          {copiedKey === item.license_key ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Assigned licenses from license_keys table */}
                                  {itemLicenses.length > 0 && (
                                    <div className="mt-2 space-y-1.5">
                                      {itemLicenses.map(lic => {
                                        const ls = LICENSE_STATUS[lic.status] || { label: lic.status, color: 'bg-muted text-muted-foreground border-border' };
                                        return (
                                          <div key={lic.id} className="bg-background rounded-lg border border-border/60 p-2">
                                            <div className="flex items-center justify-between mb-1">
                                              <div className="flex items-center gap-1.5">
                                                <Key size={10} className="text-primary" />
                                                <span className="text-[10px] font-semibold text-muted-foreground uppercase">{lic.key_type}</span>
                                              </div>
                                              <div className="flex items-center gap-1.5">
                                                {editingLicense === lic.id ? (
                                                  <div className="flex items-center gap-1">
                                                    <select
                                                      value={editLicenseStatus}
                                                      onChange={e => setEditLicenseStatus(e.target.value)}
                                                      className="text-[10px] bg-background border border-border rounded px-1.5 py-0.5 focus:outline-none">
                                                      {Object.entries(LICENSE_STATUS).map(([k, v]) => (
                                                        <option key={k} value={k}>{v.label}</option>
                                                      ))}
                                                    </select>
                                                    <button onClick={() => updateLicenseStatus(lic.id, editLicenseStatus, order.id)}
                                                      className="p-0.5 text-emerald-500 hover:text-emerald-600"><Save size={10} /></button>
                                                    <button onClick={() => setEditingLicense(null)}
                                                      className="p-0.5 text-muted-foreground hover:text-foreground"><X size={10} /></button>
                                                  </div>
                                                ) : (
                                                  <>
                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold border ${ls.color}`}>
                                                      {ls.label}
                                                    </span>
                                                    <button onClick={() => { setEditingLicense(lic.id); setEditLicenseStatus(lic.status); }}
                                                      className="p-0.5 text-muted-foreground hover:text-primary transition-colors">
                                                      <Edit3 size={10} />
                                                    </button>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <code className="text-[11px] font-mono text-foreground bg-muted/30 px-2 py-1 rounded flex-1 break-all">
                                                {lic.key_value}{lic.extra_info ? ` | ${lic.extra_info}` : ''}
                                              </code>
                                              <button onClick={() => copyKey(lic.key_value)}
                                                className="p-1 rounded text-muted-foreground hover:text-primary transition-colors shrink-0">
                                                {copiedKey === lic.key_value ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Admin notes */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase">এডমিন নোট</span>
                            {editingNote !== order.id && (
                              <button onClick={() => { setEditingNote(order.id); setEditNoteValue(order.admin_notes ?? ''); }}
                                className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                                <Edit3 size={9} /> এডিট
                              </button>
                            )}
                          </div>
                          {editingNote === order.id ? (
                            <div className="flex gap-2">
                              <input value={editNoteValue} onChange={e => setEditNoteValue(e.target.value)}
                                placeholder="নোট লিখুন..."
                                className="flex-1 text-xs bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                              <button onClick={() => saveAdminNote(order.id)}
                                className="px-2 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-semibold"><Save size={10} /></button>
                              <button onClick={() => setEditingNote(null)}
                                className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-[10px]"><X size={10} /></button>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground bg-muted/20 rounded-lg px-3 py-2 border border-border/50">
                              {order.admin_notes || 'কোনো নোট নেই'}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Customer List View ───
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users size={24} className="text-primary" />
            Customers
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">রেজিস্টার্ড কাস্টমার ও অর্ডার হিস্ট্রি</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-2">
            <UserPlus size={14} /> কাস্টমার যোগ করুন
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="bg-card rounded-xl border border-primary/30 p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <UserPlus size={14} className="text-primary" /> নতুন কাস্টমার যোগ করুন
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">নাম</label>
              <Input value={addForm.display_name} onChange={e => setAddForm(p => ({ ...p, display_name: e.target.value }))}
                placeholder="কাস্টমারের নাম" className="bg-muted/30 text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">ইমেইল</label>
              <Input value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))}
                placeholder="email@example.com" className="bg-muted/30 text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">ফোন</label>
              <Input value={addForm.phone} onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="01XXXXXXXXX" className="bg-muted/30 text-sm" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowAddModal(false)} className="h-8 text-xs gap-1">
              <X size={12} /> বাতিল
            </Button>
            <Button size="sm" onClick={addCustomer} className="h-8 text-xs gap-1">
              <Save size={12} /> যোগ করুন
            </Button>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'মোট কাস্টমার', value: customers.length, icon: Users, color: 'text-primary' },
          { label: 'সক্রিয় ক্রেতা', value: activeCustomers, icon: UserCheck, color: 'text-emerald-500' },
          { label: 'মোট অর্ডার', value: customers.reduce((s, c) => s + (c.order_count ?? 0), 0), icon: ShoppingBag, color: 'text-blue-500' },
          { label: 'মোট আয়', value: `৳${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-amber-500' },
          { label: 'মোট পয়েন্ট', value: customers.reduce((s, c) => s + (c.points_balance ?? 0), 0).toLocaleString(), icon: Award, color: 'text-orange-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={16} className={stat.color} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="নাম, ইমেইল, ফোন দিয়ে সার্চ করুন..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-muted/30" />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-44 bg-muted/30"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">নতুন আগে</SelectItem>
            <SelectItem value="oldest">পুরাতন আগে</SelectItem>
            <SelectItem value="top_spend">সর্বোচ্চ খরচ</SelectItem>
            <SelectItem value="top_orders">সর্বোচ্চ অর্ডার</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <RefreshCw size={20} className="animate-spin mr-2" /> লোড হচ্ছে...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users size={26} className="text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">কোনো কাস্টমার পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {['কাস্টমার', 'যোগাযোগ', 'যোগদান', 'অর্ডার', 'মোট খরচ', 'পয়েন্ট', 'সর্বশেষ অর্ডার', 'অ্যাকশন'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} className={`border-b border-border/30 hover:bg-muted/20 transition-colors ${i % 2 ? 'bg-muted/10' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                          {(c.display_name ?? c.email ?? '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-foreground text-xs">{c.display_name ?? 'No Name'}</div>
                          <div className="text-[10px] text-muted-foreground">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.phone ? <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone size={11} />{c.phone}</span> : <span className="text-xs text-muted-foreground/50">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{format(new Date(c.created_at), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${(c.order_count ?? 0) > 0 ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-border'}`}>
                        <ShoppingBag size={10} /> {c.order_count ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground text-xs">
                      {(c.total_spent ?? 0) > 0 ? `৳${(c.total_spent ?? 0).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {(c.points_balance ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border bg-amber-500/10 text-amber-600 border-amber-400/30">
                          <Award size={10} /> {(c.points_balance ?? 0).toLocaleString()}
                        </span>
                      ) : <span className="text-xs text-muted-foreground/50">0</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {c.last_order ? format(new Date(c.last_order), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" onClick={() => openDetail(c)} className="h-7 text-xs gap-1">
                        <Eye size={12} /> বিস্তারিত
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
