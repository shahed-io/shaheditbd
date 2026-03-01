import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Search, Eye, CheckCircle, XCircle, Truck, RefreshCw, RotateCcw,
  Filter, ChevronDown, X, Calendar, Phone, Mail, User,
  CreditCard, Package, MessageCircle, Copy, Check, SlidersHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { handleDbError } from '@/lib/errorHandler';

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
  processing: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  completed: 'text-primary bg-primary/10 border-primary/30',
  cancelled: 'text-destructive bg-destructive/10 border-destructive/30',
  refunded: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-500 bg-yellow-500/10',
  verified: 'text-primary bg-primary/10',
  failed: 'text-destructive bg-destructive/10',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'পেন্ডিং',
  processing: 'প্রসেসিং',
  completed: 'ডেলিভার্ড',
  cancelled: 'বাতিল',
  refunded: 'রিফান্ড',
};

const PM_LABELS: Record<string, string> = {
  bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket',
};

const inputClass = "w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors";

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [copiedTrx, setCopiedTrx] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Realtime
  useEffect(() => {
    const channel = supabase.channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  const filtered = orders.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (paymentFilter !== 'all' && o.payment_method !== paymentFilter) return false;
    if (dateFrom && o.created_at < dateFrom) return false;
    if (dateTo && o.created_at > dateTo + 'T23:59:59') return false;
    if (search) {
      const q = search.toLowerCase();
      return o.order_number?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_email?.toLowerCase().includes(q) ||
        o.customer_phone?.includes(q) ||
        o.transaction_id?.toLowerCase().includes(q);
    }
    return true;
  });

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const updateOrder = async (id: string, updates: any, successMsg: string) => {
    setUpdatingId(id);
    const { error } = await supabase.from('orders').update(updates).eq('id', id);
    if (error) { toast.error(handleDbError(error)); }
    else {
      toast.success(successMsg);
      fetchOrders();
      if (selectedOrder?.id === id) setSelectedOrder((prev: any) => ({ ...prev, ...updates }));
    }
    setUpdatingId(null);
  };

  const handleVerifyPayment = (order: any) =>
    updateOrder(order.id, { payment_status: 'verified', status: 'processing' }, '✅ Payment verified!');

  const handleMarkDelivered = (order: any) =>
    updateOrder(order.id, { status: 'completed' }, '🚀 Marked as delivered!');

  const handleCancel = (order: any) => {
    if (!confirm('এই অর্ডার বাতিল করবেন?')) return;
    updateOrder(order.id, { status: 'cancelled' }, '❌ Order cancelled');
  };

  const handleRefund = (order: any) => {
    if (!confirm('রিফান্ড মার্ক করবেন?')) return;
    updateOrder(order.id, { status: 'refunded' }, '↩️ Refund marked');
  };

  const handleSaveNote = (order: any) => {
    if (!adminNote.trim()) return;
    updateOrder(order.id, { admin_notes: adminNote }, '📝 Note saved');
  };

  const sendWhatsApp = (order: any) => {
    const items = order.order_items?.map((i: any) => `• ${i.product_name}`).join('\n') || '';
    const msg = encodeURIComponent(
      `🎉 আপনার অর্ডার সফলভাবে ডেলিভার করা হয়েছে!\n\nঅর্ডার: ${order.order_number}\n${items}\n\n${deliveryNote || 'আপনার লাইসেন্স কি ইমেইলে পাঠানো হয়েছে।'}\n\nধন্যবাদ! 🙏`
    );
    const phone = order.customer_phone?.replace(/\D/g, '').replace(/^0/, '880');
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const copyTrx = (trxId: string, orderId: string) => {
    navigator.clipboard.writeText(trxId);
    setCopiedTrx(orderId);
    setTimeout(() => setCopiedTrx(null), 2000);
    toast.success('Copied!');
  };

  const resetFilters = () => {
    setSearch(''); setStatusFilter('all'); setPaymentFilter('all');
    setDateFrom(''); setDateTo('');
  };
  const hasActiveFilters = search || statusFilter !== 'all' || paymentFilter !== 'all' || dateFrom || dateTo;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Orders <span className="gradient-text">Management</span>
          </h1>
          <p className="text-muted-foreground text-sm">{orders.length} total orders</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchOrders} className="glass-card px-4 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick status tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'processing', 'completed', 'cancelled'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all border ${
              statusFilter === s ? 'btn-glow border-transparent' : 'glass-card border-border text-muted-foreground hover:text-primary'
            }`}
          >
            {s === 'all' ? 'সব অর্ডার' : STATUS_LABELS[s]}
            <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${statusFilter === s ? 'bg-white/20' : 'bg-muted/50'}`}>
              {statusCounts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Search + Advanced Filter toggle */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="অর্ডার ID, কাস্টমার নাম, ইমেইল, TrxID..."
              className="w-full bg-muted/30 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 border transition-all ${showFilters ? 'btn-glow border-transparent' : 'glass-card border-border text-muted-foreground hover:text-foreground'}`}
          >
            <SlidersHorizontal size={14} />
            ফিল্টার
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
          </button>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="px-3 py-2.5 rounded-xl text-xs text-muted-foreground hover:text-destructive glass-card border border-border transition-colors flex items-center gap-1">
              <X size={13} /> Reset
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1 border-t border-border">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Payment Method</label>
              <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className={inputClass}>
                <option value="all">সব</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="rocket">Rocket</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">তারিখ থেকে</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">তারিখ পর্যন্ত</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputClass} />
            </div>
            <div className="flex items-end">
              <div className="glass-card rounded-xl px-4 py-2.5 text-xs text-muted-foreground w-full text-center">
                {filtered.length} ফলাফল পাওয়া গেছে
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-foreground">অর্ডার #{selectedOrder.order_number}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(selectedOrder.created_at).toLocaleString('en-BD')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${STATUS_COLORS[selectedOrder.status] || ''}`}>
                  {STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
                </span>
                <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Customer + Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5"><User size={13} className="text-primary" /> কাস্টমার তথ্য</p>
                  <div className="space-y-1.5 text-sm">
                    <p className="font-medium text-foreground">{selectedOrder.customer_name}</p>
                    <p className="text-muted-foreground flex items-center gap-1.5"><Mail size={12} />{selectedOrder.customer_email}</p>
                    <p className="text-muted-foreground flex items-center gap-1.5"><Phone size={12} />{selectedOrder.customer_phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="glass-card rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5"><CreditCard size={13} className="text-primary" /> পেমেন্ট তথ্য</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Method:</span>
                      <span className="font-medium text-foreground capitalize">{PM_LABELS[selectedOrder.payment_method] || selectedOrder.payment_method}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">TrxID:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-foreground">{selectedOrder.transaction_id || 'N/A'}</span>
                        {selectedOrder.transaction_id && (
                          <button onClick={() => copyTrx(selectedOrder.transaction_id, selectedOrder.id)} className="text-muted-foreground hover:text-primary">
                            {copiedTrx === selectedOrder.id ? <Check size={12} className="text-primary" /> : <Copy size={12} />}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment:</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_STATUS_COLORS[selectedOrder.payment_status] || 'text-muted-foreground'}`}>
                        {selectedOrder.payment_status || 'pending'}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-border pt-1.5 mt-1.5">
                      <span className="text-muted-foreground">মোট:</span>
                      <span className="text-primary text-base">৳{Number(selectedOrder.total).toLocaleString()}</span>
                    </div>
                    {selectedOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-xs text-accent">
                        <span>ডিসকাউন্ট:</span><span>-৳{Number(selectedOrder.discount_amount).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {selectedOrder.order_items?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2"><Package size={13} className="text-primary" /> প্রোডাক্ট</p>
                  <div className="space-y-2">
                    {selectedOrder.order_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center glass-card rounded-xl p-3 text-sm">
                        <div>
                          <span className="text-foreground font-medium">{item.product_name}</span>
                          <span className="text-muted-foreground text-xs ml-2">× {item.quantity}</span>
                          {item.license_key && (
                            <div className="text-xs text-primary font-mono mt-0.5">🔑 {item.license_key}</div>
                          )}
                        </div>
                        <span className="font-bold text-primary">৳{Number(item.total).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Action Buttons ── */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">অর্ডার অ্যাকশন</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedOrder.payment_status !== 'verified' && selectedOrder.status !== 'cancelled' && (
                    <button
                      onClick={() => handleVerifyPayment(selectedOrder)}
                      disabled={updatingId === selectedOrder.id}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold btn-glow disabled:opacity-50"
                    >
                      <CheckCircle size={13} /> পেমেন্ট ভেরিফাই
                    </button>
                  )}
                  {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                    <button
                      onClick={() => handleMarkDelivered(selectedOrder)}
                      disabled={updatingId === selectedOrder.id}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold glass-card border border-primary/30 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                    >
                      <Truck size={13} /> ডেলিভার্ড মার্ক
                    </button>
                  )}
                  {selectedOrder.customer_phone && (
                    <button
                      onClick={() => sendWhatsApp(selectedOrder)}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold glass-card border border-border text-foreground hover:border-[#25D366]/40 hover:text-[#25D366] transition-colors"
                    >
                      <MessageCircle size={13} /> WhatsApp পাঠান
                    </button>
                  )}
                  {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'refunded' && (
                    <button
                      onClick={() => handleCancel(selectedOrder)}
                      disabled={updatingId === selectedOrder.id}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold glass-card border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                      <XCircle size={13} /> বাতিল করুন
                    </button>
                  )}
                  {selectedOrder.status === 'cancelled' && (
                    <button
                      onClick={() => handleRefund(selectedOrder)}
                      disabled={updatingId === selectedOrder.id}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold glass-card border border-secondary/30 text-secondary-foreground hover:bg-secondary/10 transition-colors disabled:opacity-50"
                    >
                      <RotateCcw size={13} /> রিফান্ড মার্ক
                    </button>
                  )}
                </div>
              </div>

              {/* Delivery Note for WhatsApp */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">WhatsApp ডেলিভারি মেসেজ (ঐচ্ছিক)</label>
                <textarea
                  rows={2}
                  value={deliveryNote}
                  onChange={e => setDeliveryNote(e.target.value)}
                  placeholder="আপনার লাইসেন্স কি: XXXX-XXXX-XXXX-XXXX"
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Admin Notes */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Admin Notes</label>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={adminNote || selectedOrder.admin_notes || ''}
                    onChange={e => setAdminNote(e.target.value)}
                    placeholder="Internal notes..."
                    className={`${inputClass} resize-none flex-1`}
                  />
                  <button
                    onClick={() => handleSaveNote(selectedOrder)}
                    className="px-3 rounded-xl glass-card border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors self-stretch"
                  >
                    Save
                  </button>
                </div>
                {selectedOrder.notes && (
                  <p className="text-xs text-muted-foreground mt-1">Customer note: {selectedOrder.notes}</p>
                )}
              </div>

              {/* Manual status update */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Status পরিবর্তন</label>
                <select
                  value={selectedOrder.status}
                  onChange={e => updateOrder(selectedOrder.id, { status: e.target.value }, 'Status updated')}
                  className={inputClass}
                >
                  {['pending', 'processing', 'completed', 'cancelled', 'refunded'].map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-14 bg-muted/30 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">কোনো অর্ডার পাওয়া যায়নি</p>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="mt-3 text-xs text-primary hover:underline">ফিল্টার রিসেট করুন</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Order #</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">কাস্টমার</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">প্রোডাক্ট</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden md:table-cell">পেমেন্ট</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">মোট</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden md:table-cell">তারিখ</th>
                  <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/10 transition-colors group">
                    {/* Order # */}
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-primary text-xs">{order.order_number}</span>
                      {order.payment_status === 'verified' && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <CheckCircle size={10} className="text-primary" />
                          <span className="text-[10px] text-primary">Verified</span>
                        </div>
                      )}
                    </td>
                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground text-xs">{order.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                      {order.customer_phone && <div className="text-xs text-muted-foreground">{order.customer_phone}</div>}
                    </td>
                    {/* Products */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="space-y-0.5">
                        {order.order_items?.slice(0, 2).map((item: any) => (
                          <div key={item.id} className="text-xs text-muted-foreground line-clamp-1">{item.product_name}</div>
                        ))}
                        {order.order_items?.length > 2 && (
                          <div className="text-xs text-primary">+{order.order_items.length - 2} more</div>
                        )}
                      </div>
                    </td>
                    {/* Payment */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="text-xs font-medium text-foreground capitalize">{PM_LABELS[order.payment_method] || order.payment_method}</div>
                      {order.transaction_id && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="font-mono text-[10px] text-muted-foreground">{order.transaction_id.slice(0, 8)}...</span>
                          <button onClick={() => copyTrx(order.transaction_id, order.id)} className="text-muted-foreground hover:text-primary">
                            {copiedTrx === order.id ? <Check size={10} className="text-primary" /> : <Copy size={10} />}
                          </button>
                        </div>
                      )}
                    </td>
                    {/* Total */}
                    <td className="px-4 py-3">
                      <span className="font-bold text-foreground">৳{Number(order.total).toLocaleString()}</span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[order.status] || ''}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('en-BD', { day: '2-digit', month: 'short' })}
                      <div>{new Date(order.created_at).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Quick: Verify */}
                        {order.payment_status !== 'verified' && order.status === 'pending' && (
                          <button
                            onClick={() => handleVerifyPayment(order)}
                            disabled={updatingId === order.id}
                            title="পেমেন্ট ভেরিফাই"
                            className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-primary/10 disabled:opacity-50"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {/* Quick: Deliver */}
                        {order.status === 'processing' && (
                          <button
                            onClick={() => handleMarkDelivered(order)}
                            disabled={updatingId === order.id}
                            title="ডেলিভার্ড মার্ক"
                            className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-primary/10 disabled:opacity-50"
                          >
                            <Truck size={14} />
                          </button>
                        )}
                        {/* View Details */}
                        <button
                          onClick={() => { setSelectedOrder(order); setAdminNote(order.admin_notes || ''); setDeliveryNote(''); }}
                          className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-primary/10"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary footer */}
      {filtered.length > 0 && (
        <div className="glass-card rounded-xl px-5 py-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>মোট দেখাচ্ছে: <strong className="text-foreground">{filtered.length}</strong></span>
          <span>মোট মূল্য: <strong className="text-primary">৳{filtered.reduce((s, o) => s + Number(o.total), 0).toLocaleString()}</strong></span>
          <span>পেমেন্ট ভেরিফাই বাকি: <strong className="text-foreground">{filtered.filter(o => o.payment_status !== 'verified' && o.status !== 'cancelled').length}</strong></span>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
