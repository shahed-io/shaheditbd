import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Search, Eye, CheckCircle, XCircle, Truck, RefreshCw, RotateCcw,
  Filter, X, Calendar, Phone, Mail, User, AlertTriangle,
  CreditCard, Package, MessageCircle, Copy, Check, SlidersHorizontal,
  Plus, FileText, Download, Clock, ChevronRight, Send, Printer,
  Ban, CheckCircle2, Loader2, Bell
} from 'lucide-react';
import { toast } from 'sonner';
import { handleDbError } from '@/lib/errorHandler';
import logoIcon from '@/assets/logo.png';
import { downloadInvoicePdf, downloadInvoicePdfFromElement, type InvoiceData } from '@/lib/invoicePdf';

// Build a canonical InvoiceData object from a DB order row
const orderToInvoiceData = (order: any): InvoiceData => ({
  invoiceNumber: order.order_number,
  date: order.created_at,
  customer: {
    name: order.customer_name,
    phone: order.customer_phone,
    email: order.customer_email,
  },
  items: (order.order_items || []).map((i: any) => ({
    name: i.product_name,
    quantity: Number(i.quantity) || 1,
    price: Number(i.price) || 0,
    total: Number(i.total) || 0,
    license_key: i.license_key,
  })),
  subtotal: Number(order.subtotal) || 0,
  discount: Number(order.discount_amount) || 0,
  total: Number(order.total) || 0,
  paymentMethod: order.payment_method,
  transactionId: order.transaction_id,
  status: order.status,
});

const downloadOrderInvoicePdf = async (order: any) => {
  const tid = toast.loading('PDF তৈরি হচ্ছে...');
  try {
    await downloadInvoicePdf(orderToInvoiceData(order));
    toast.success('PDF ডাউনলোড হয়েছে — এখন WhatsApp এ Attach করে পাঠান', { id: tid });
  } catch (e: any) {
    toast.error('PDF তৈরি করতে সমস্যা: ' + (e?.message || 'Unknown'), { id: tid });
  }
};

// ─── Status Config ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; dot: string }> = {
  pending:    { label: 'পেন্ডিং',    color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',         icon: Clock,         dot: 'bg-amber-500' },
  processing: { label: 'প্রসেসিং',   color: 'text-blue-500 bg-blue-500/10 border-blue-500/30',            icon: RefreshCw,     dot: 'bg-blue-500' },
  delivered:  { label: 'ডেলিভার্ড', color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30',             icon: Truck,         dot: 'bg-cyan-500' },
  completed:  { label: 'সম্পন্ন',    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',   icon: CheckCircle2,  dot: 'bg-emerald-500' },
  cancelled:  { label: 'বাতিল',      color: 'text-red-500 bg-red-500/10 border-red-500/30',               icon: XCircle,       dot: 'bg-red-500' },
  refunded:   { label: 'রিফান্ড',    color: 'text-purple-500 bg-purple-500/10 border-purple-500/30',      icon: RotateCcw,     dot: 'bg-purple-500' },
  failed:     { label: 'ব্যর্থ',      color: 'text-rose-600 bg-rose-600/10 border-rose-600/30',            icon: AlertTriangle, dot: 'bg-rose-600' },
};

const ALL_STATUSES = ['pending', 'processing', 'delivered', 'completed', 'cancelled', 'refunded', 'failed'];

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending:  'text-amber-500 bg-amber-500/10',
  verified: 'text-emerald-500 bg-emerald-500/10',
  failed:   'text-red-500 bg-red-500/10',
};

const PM_LABELS: Record<string, string> = {
  bkash: 'BKash', nagad: 'Nagad', rocket: 'Rocket',
  upay: 'উপায়', bkash_merchant: 'BKash Merchant',
};

const inputCls = "w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors";

// ─── Invoice Component (printable) ─────────────────────────────────────────
const OrderInvoice = ({ order, onClose }: { order: any; onClose: () => void }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [logoBase64, setLogoBase64] = useState<string>('');

  // Convert logo to base64 for print compatibility
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        setLogoBase64(canvas.toDataURL('image/png'));
      }
    };
    img.src = logoIcon;
  }, []);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
      <head>
        <title>Invoice #${order.order_number} — Shahed Store</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 0; }
          @media print { body { padding: 0; } @page { margin: 15mm; } }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 400);
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return downloadOrderInvoicePdf(order);
    const tid = toast.loading('PDF তৈরি হচ্ছে...');
    try {
      await downloadInvoicePdfFromElement(printRef.current, `invoice-${order.order_number}.pdf`);
      toast.success('PDF ডাউনলোড হয়েছে — এখন WhatsApp এ Attach করে পাঠান', { id: tid });
    } catch (e: any) {
      toast.error('PDF তৈরি করতে সমস্যা: ' + (e?.message || 'Unknown'), { id: tid });
    }
  };

  const items = order.order_items || [];
  const date = new Date(order.created_at).toLocaleDateString('bn-BD', { day: '2-digit', month: 'long', year: 'numeric' });
  const dateEn = new Date(order.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['pending'];

  const brandColor = '#7c3aed';
  const brandLight = '#f3f0ff';
  const brandDark = '#4c1d95';

  return (
    <div className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-card rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
          <h3 className="font-bold text-foreground text-sm">Invoice #{order.order_number}</h3>
          <div className="flex gap-2">
            <button onClick={handleDownloadPdf} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card border border-primary/30 text-primary hover:bg-primary/10 text-xs font-semibold transition-colors">
              <Download size={13} /> PDF ডাউনলোড
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-glow text-xs font-semibold">
              <Printer size={13} /> Print / PDF
            </button>
            <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Invoice Body */}
        <div className="overflow-y-auto flex-1 p-6">
          <div ref={printRef} style={{ background: '#fff', color: '#1a1a2e', padding: '40px', borderRadius: '12px', fontFamily: "'Segoe UI', Arial, sans-serif" }}>

            {/* ─── Header with Logo ─── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', paddingBottom: '20px', borderBottom: `3px solid ${brandColor}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {logoBase64 && (
                  <img src={logoBase64} alt="Shahed Store" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: brandColor, letterSpacing: '2px' }}>INVOICE</div>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '4px', fontFamily: 'monospace' }}>#{order.order_number}</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{dateEn}</div>
              </div>
            </div>

            {/* ─── Customer + Payment Info ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
              <div style={{ background: brandLight, borderRadius: '10px', padding: '16px', borderLeft: `4px solid ${brandColor}` }}>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: brandColor, letterSpacing: '1.5px', marginBottom: '10px' }}>📋 বিলিং তথ্য</div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e', marginBottom: '4px' }}>{order.customer_name}</p>
                <p style={{ fontSize: '12px', color: '#555', display: 'flex', alignItems: 'center', gap: '4px' }}>✉️ {order.customer_email}</p>
                {order.customer_phone && <p style={{ fontSize: '12px', color: '#555', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>📱 {order.customer_phone}</p>}
              </div>
              <div style={{ background: brandLight, borderRadius: '10px', padding: '16px', borderLeft: `4px solid ${brandColor}` }}>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: brandColor, letterSpacing: '1.5px', marginBottom: '12px' }}>💳 Payment Info</div>
                <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.9 }}><span style={{ display: 'inline-block', minWidth: '62px' }}>Method:</span> <strong style={{ color: '#1a1a2e' }}>{PM_LABELS[order.payment_method] || order.payment_method}</strong></div>
                {order.transaction_id && <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.9, marginTop: '6px' }}><span style={{ display: 'inline-block', minWidth: '62px' }}>TrxID:</span> <span style={{ color: '#1a1a2e', fontFamily: 'monospace', background: '#e8e5f7', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', display: 'inline-block', lineHeight: 1.4 }}>{order.transaction_id}</span></div>}
                <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.9, marginTop: '6px' }}>
                  <span style={{ display: 'inline-block', minWidth: '62px' }}>Status:</span> <span style={{ background: brandColor, color: '#fff', padding: '3px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, display: 'inline-block', lineHeight: 1.4 }}>{statusCfg.label}</span>
                </div>
                {order.coupon_code && <div style={{ fontSize: '12px', color: '#059669', marginTop: '6px' }}>🎟️ Coupon: <strong>{order.coupon_code}</strong></div>}
              </div>
            </div>

            {/* ─── Items Table ─── */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: brandColor }}>
                  <th style={{ color: '#ffffff', fontSize: '13px', fontWeight: 800, padding: '14px', textAlign: 'left', letterSpacing: '0.4px', textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}>#</th>
                  <th style={{ color: '#ffffff', fontSize: '13px', fontWeight: 800, padding: '14px', textAlign: 'left', letterSpacing: '0.4px', textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}>পণ্যের নাম</th>
                  <th style={{ color: '#ffffff', fontSize: '13px', fontWeight: 800, padding: '14px', textAlign: 'center', letterSpacing: '0.4px', textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}>পরিমাণ</th>
                  <th style={{ color: '#ffffff', fontSize: '13px', fontWeight: 800, padding: '14px', textAlign: 'right', letterSpacing: '0.4px', textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}>দাম</th>
                  <th style={{ color: '#ffffff', fontSize: '13px', fontWeight: 800, padding: '14px', textAlign: 'right', letterSpacing: '0.4px', textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}>মোট</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, idx: number) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#fff' : '#faf9ff' }}>
                    <td style={{ padding: '11px 14px', fontSize: '12px', color: '#888' }}>{idx + 1}</td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', color: '#1a1a2e', fontWeight: 500 }}>
                      {item.product_name}
                      {item.license_key && (
                        <div style={{ fontSize: '11px', color: brandColor, fontFamily: 'monospace', marginTop: '3px', background: brandLight, padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>
                          🔑 {item.license_key}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', textAlign: 'center', color: '#555' }}>×{item.quantity}</td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', textAlign: 'right', color: '#555' }}>৳{Number(item.price).toLocaleString()}</td>
                    <td style={{ padding: '11px 14px', fontSize: '14px', fontWeight: 700, textAlign: 'right', color: '#1a1a2e' }}>৳{Number(item.total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ─── Totals ─── */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ minWidth: '260px', background: brandLight, borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#555', marginBottom: '8px' }}>
                  <span>Subtotal:</span><span>৳{Number(order.subtotal).toLocaleString()}</span>
                </div>
                {Number(order.discount_amount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#059669', marginBottom: '8px' }}>
                    <span>🎉 Discount:</span><span>-৳{Number(order.discount_amount).toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 800, color: brandColor, borderTop: `2px solid ${brandColor}`, paddingTop: '10px', marginTop: '8px' }}>
                  <span>Total:</span><span>৳{Number(order.total).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* ─── Notes ─── */}
            {order.notes && (
              <div style={{ marginTop: '20px', background: '#fffbeb', borderRadius: '10px', padding: '14px', fontSize: '12px', color: '#555', borderLeft: '4px solid #f59e0b' }}>
                <strong style={{ color: '#b45309' }}>📝 গ্রাহকের নোট:</strong> {order.notes}
              </div>
            )}

            {/* ─── Footer ─── */}
            <div style={{ marginTop: '28px', textAlign: 'center', borderTop: `2px solid ${brandLight}`, paddingTop: '18px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>ধন্যবাদ আমাদের সাথে কেনাকাটা করার জন্য!</div>
              <div style={{ fontSize: '11px', color: '#aaa' }}>
                🌐 shahedstore.com.bd &nbsp;•&nbsp; 📧 info@shahedstore.com.bd
              </div>
              <div style={{ fontSize: '10px', color: '#ccc', marginTop: '8px' }}>This is a computer-generated invoice and does not require a signature.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Order Timeline Component ───────────────────────────────────────────────
const OrderTimeline = ({ timeline }: { timeline: any[] }) => {
  if (!timeline.length) return <p className="text-xs text-muted-foreground text-center py-4">কোনো ইতিহাস নেই</p>;

  return (
    <div className="space-y-0">
      {timeline.map((event, idx) => {
        const cfg = STATUS_CONFIG[event.status] || STATUS_CONFIG['pending'];
        const Icon = cfg.icon;
        const isLast = idx === timeline.length - 1;
        return (
          <div key={event.id} className="flex gap-3 relative">
            {!isLast && <div className="absolute left-3.5 top-7 w-px bg-border h-full" />}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.dot} bg-opacity-20 border border-current`} style={{ color: `hsl(var(--${cfg.dot.replace('bg-','')}))` }}>
              <Icon size={12} />
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                <span className="text-[10px] text-muted-foreground">{new Date(event.created_at).toLocaleString('en-BD', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {event.note && <p className="text-xs text-muted-foreground mt-1">{event.note}</p>}
              {event.created_by && event.created_by !== 'system' && (
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">by {event.created_by}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Create Order Modal ─────────────────────────────────────────────────────
const CreateOrderModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
  const [form, setForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    payment_method: 'bkash', transaction_id: '',
    notes: '', admin_notes: '', status: 'processing', payment_status: 'verified',
  });
  const [items, setItems] = useState([{ product_name: '', quantity: 1, price: 0 }]);
  const [loading, setLoading] = useState(false);

  const subtotal = items.reduce((s, i) => s + (Number(i.price) * i.quantity), 0);

  const addItem = () => setItems(prev => [...prev, { product_name: '', quantity: 1, price: 0 }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: any) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));

  const handleCreate = async () => {
    if (!form.customer_name || !form.customer_email) { toast.error('নাম ও ইমেইল আবশ্যক'); return; }
    if (items.some(i => !i.product_name)) { toast.error('সব প্রোডাক্টের নাম দিন'); return; }
    setLoading(true);
    try {
      const orderNum = 'ORD-' + Array.from(crypto.getRandomValues(new Uint8Array(5))).map(b => b.toString(36)).join('').toUpperCase().slice(0, 8);
      const { data: order, error } = await supabase.from('orders').insert({
        order_number: orderNum,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone || null,
        subtotal,
        discount_amount: 0,
        total: subtotal,
        payment_method: form.payment_method,
        transaction_id: form.transaction_id || null,
        status: form.status as any,
        payment_status: form.payment_status,
        notes: form.notes || null,
        admin_notes: form.admin_notes || null,
        user_id: null,
      }).select().single();
      if (error) throw error;

      const orderItems = items.map(i => ({
        order_id: order.id,
        product_name: i.product_name,
        price: Number(i.price),
        quantity: i.quantity,
        total: Number(i.price) * i.quantity,
      }));
      await supabase.from('order_items').insert(orderItems);
      toast.success(`✅ অর্ডার তৈরি হয়েছে: ${orderNum}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(handleDbError(err));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors";

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-card rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-bold text-foreground">নতুন অর্ডার তৈরি করুন</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Customer */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">কাস্টমার তথ্য</p>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="নাম *" value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))} className={inputClass} />
              <input placeholder="ইমেইল *" type="email" value={form.customer_email} onChange={e => setForm(p => ({ ...p, customer_email: e.target.value }))} className={inputClass} />
              <input placeholder="ফোন" value={form.customer_phone} onChange={e => setForm(p => ({ ...p, customer_phone: e.target.value }))} className={inputClass} />
              <select value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))} className={inputClass}>
                {Object.entries(PM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input placeholder="Transaction ID" value={form.transaction_id} onChange={e => setForm(p => ({ ...p, transaction_id: e.target.value }))} className={inputClass} />
              <select value={form.payment_status} onChange={e => setForm(p => ({ ...p, payment_status: e.target.value }))} className={inputClass}>
                <option value="pending">Payment Pending</option>
                <option value="verified">Payment Verified</option>
                <option value="failed">Payment Failed</option>
              </select>
            </div>
          </div>

          {/* Products */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">পণ্যসমূহ</p>
              <button onClick={addItem} className="text-xs text-primary hover:underline flex items-center gap-2"><Plus size={11} /> যোগ করুন</button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <input placeholder="পণ্যের নাম *" value={item.product_name} onChange={e => updateItem(idx, 'product_name', e.target.value)} className={`${inputClass} flex-1`} />
                  <input type="number" min={1} value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} className={`${inputClass} w-16 text-center`} />
                  <input type="number" min={0} placeholder="মূল্য" value={item.price || ''} onChange={e => updateItem(idx, 'price', e.target.value)} className={`${inputClass} w-24`} />
                  {items.length > 1 && (
                    <button onClick={() => removeItem(idx)} className="p-2 text-muted-foreground hover:text-destructive mt-0.5"><X size={14} /></button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-2">
              <span className="text-sm font-bold text-primary">সর্বমোট: ৳{subtotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Status & Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">অর্ডার স্ট্যাটাস</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={inputClass}>
                {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Customer Note</label>
              <input placeholder="Customer note..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Admin Note (Internal)</label>
            <textarea rows={2} placeholder="Internal note..." value={form.admin_notes} onChange={e => setForm(p => ({ ...p, admin_notes: e.target.value }))} className={`${inputClass} resize-none`} />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm glass-card border border-border text-muted-foreground hover:text-foreground transition-colors">বাতিল</button>
          <button onClick={handleCreate} disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm btn-glow font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            অর্ডার তৈরি করুন
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Order Detail Modal ─────────────────────────────────────────────────────
const OrderDetailModal = ({
  order, onClose, onUpdate,
}: {
  order: any;
  onClose: () => void;
  onUpdate: (id: string, updates: any, msg: string) => Promise<void>;
}) => {
  const [adminNote, setAdminNote] = useState(order.admin_notes || '');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [timeline, setTimeline] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [showInvoice, setShowInvoice] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline'>('details');
  const [updatingId, setUpdatingId] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(false);

  useEffect(() => {
    fetchTimeline();
  }, [order.id]);

  const fetchTimeline = async () => {
    setTimelineLoading(true);
    const { data } = await supabase
      .from('order_timeline')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false });
    setTimeline(data || []);
    setTimelineLoading(false);
  };

  const doUpdate = async (updates: any, msg: string) => {
    setUpdatingId(true);
    await onUpdate(order.id, updates, msg);
    setUpdatingId(false);
  };

  const sendWhatsApp = (customNote?: string) => {
    const items = order.order_items?.map((i: any) => `- ${i.product_name}`).join('\n') || '';
    const statusLabel = STATUS_CONFIG[order.status]?.label || order.status;
    const msg = encodeURIComponent(
      `Order Update\n\nOrder: ${order.order_number}\nStatus: ${statusLabel}\n\n${items}${customNote ? '\n\n' + customNote : ''}\n\nThank you!\n-- Shahed Store`
    );
    const phone = order.customer_phone?.replace(/\D/g, '').replace(/^0/, '880');
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    await onUpdate(order.id, { admin_notes: adminNote }, '📝 Note saved');
    setSavingNote(false);
  };

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['pending'];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <div className="glass-card rounded-2xl w-full max-w-2xl max-h-[93vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>

          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
            <div>
              <h2 className="text-lg font-bold text-foreground">অর্ডার #{order.order_number}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{new Date(order.created_at).toLocaleString('en-BD')}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>{cfg.label}</span>
              <button onClick={() => setShowInvoice(true)} title="Invoice" className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                <FileText size={15} />
              </button>
              <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border flex-shrink-0">
            {(['details', 'timeline'] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${activeTab === t ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t === 'details' ? '📋 বিবরণ' : '📅 ইতিহাস'}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto flex-1 p-5 space-y-4">
            {activeTab === 'details' ? (
              <>
                {/* Customer + Payment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="glass-card rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5"><User size={12} className="text-primary" /> কাস্টমার</p>
                    <p className="font-semibold text-foreground text-sm">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail size={11} />{order.customer_email}</p>
                    {order.customer_phone && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone size={11} />{order.customer_phone}</p>}
                  </div>
                  <div className="glass-card rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5"><CreditCard size={12} className="text-primary" /> পেমেন্ট</p>
                    <div className="text-xs space-y-1.5">
                      <div className="flex justify-between"><span className="text-muted-foreground">Method:</span><span className="font-medium">{PM_LABELS[order.payment_method] || order.payment_method}</span></div>
                      {order.transaction_id && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">TrxID:</span>
                          <span className="font-mono text-[11px]">{order.transaction_id}</span>
                        </div>
                      )}
                      <div className="flex justify-between"><span className="text-muted-foreground">Payment:</span><span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${PAYMENT_STATUS_COLORS[order.payment_status] || ''}`}>{order.payment_status || 'pending'}</span></div>
                      <div className="flex justify-between font-bold border-t border-border pt-1.5">
                        <span className="text-muted-foreground">মোট:</span>
                        <span className="text-primary">৳{Number(order.total).toLocaleString()}</span>
                      </div>
                      {Number(order.discount_amount) > 0 && (
                        <div className="flex justify-between text-xs text-emerald-500"><span>ছাড়:</span><span>-৳{Number(order.discount_amount).toLocaleString()}</span></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                {order.order_items?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2"><Package size={12} className="text-primary" /> পণ্যসমূহ</p>
                    <div className="space-y-1.5">
                      {order.order_items.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-start glass-card rounded-xl p-3 text-sm">
                          <div>
                            <span className="font-medium text-foreground text-xs">{item.product_name}</span>
                            <span className="text-muted-foreground text-xs ml-1.5">×{item.quantity}</span>
                            {item.license_key && <div className="text-xs text-primary font-mono mt-0.5">🔑 {item.license_key}</div>}
                          </div>
                          <span className="font-bold text-primary text-xs">৳{Number(item.total).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">দ্রুত অ্যাকশন</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {order.payment_status !== 'verified' && !['cancelled', 'failed'].includes(order.status) && (
                      <button onClick={() => doUpdate({ payment_status: 'verified', status: 'processing' }, '✅ পেমেন্ট ভেরিফাই হয়েছে!')}
                        disabled={updatingId} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold btn-glow disabled:opacity-50">
                        <CheckCircle size={12} /> পেমেন্ট ভেরিফাই
                      </button>
                    )}
                    {order.status === 'processing' && (
                      <button onClick={() => doUpdate({ status: 'delivered' }, '🚚 ডেলিভার্ড মার্ক করা হয়েছে!')}
                        disabled={updatingId} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold glass-card border border-cyan-500/40 text-cyan-500 hover:bg-cyan-500/10 transition-colors disabled:opacity-50">
                        <Truck size={12} /> ডেলিভার্ড
                      </button>
                    )}
                    {order.status === 'delivered' && (
                      <button onClick={() => doUpdate({ status: 'completed' }, '✅ অর্ডার সম্পন্ন!')}
                        disabled={updatingId} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold glass-card border border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10 transition-colors disabled:opacity-50">
                        <CheckCircle2 size={12} /> সম্পন্ন
                      </button>
                    )}
                    {order.customer_phone && (
                      <button onClick={() => sendWhatsApp(deliveryNote)}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold glass-card border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 transition-colors">
                        <MessageCircle size={12} /> WhatsApp
                      </button>
                    )}
                    {order.customer_phone && (
                      <button onClick={() => downloadOrderInvoicePdf(order)}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold glass-card border border-primary/30 text-primary hover:bg-primary/10 transition-colors">
                        <Download size={12} /> PDF ডাউনলোড
                      </button>
                    )}
                    {!['cancelled', 'refunded', 'failed'].includes(order.status) && (
                      <button onClick={() => { if (confirm('বাতিল করবেন?')) doUpdate({ status: 'cancelled' }, '❌ বাতিল করা হয়েছে'); }}
                        disabled={updatingId} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold glass-card border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50">
                        <Ban size={12} /> বাতিল
                      </button>
                    )}
                    {order.status === 'cancelled' && (
                      <button onClick={() => { if (confirm('রিফান্ড মার্ক?')) doUpdate({ status: 'refunded' }, '↩️ রিফান্ড মার্ক'); }}
                        disabled={updatingId} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold glass-card border border-purple-500/30 text-purple-500 hover:bg-purple-500/10 transition-colors disabled:opacity-50">
                        <RotateCcw size={12} /> রিফান্ড
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Dropdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Status পরিবর্তন</label>
                    <select
                      value={order.status}
                      onChange={e => doUpdate({ status: e.target.value }, '✅ Status আপডেট')}
                      className={inputCls}
                    >
                      {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Payment Status</label>
                    <select
                      value={order.payment_status || 'pending'}
                      onChange={e => doUpdate({ payment_status: e.target.value }, '✅ Payment status আপডেট')}
                      className={inputCls}
                    >
                      <option value="pending">Pending</option>
                      <option value="verified">Verified</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>

                {/* WhatsApp custom message */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">WhatsApp কাস্টম মেসেজ (ঐচ্ছিক)</label>
                  <textarea rows={2} value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)}
                    placeholder="লাইসেন্স কি, ডেলিভারি নির্দেশনা..."
                    className={`${inputCls} resize-none`} />
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Admin Notes (Internal)</label>
                  <div className="flex gap-2">
                    <textarea rows={2} value={adminNote} onChange={e => setAdminNote(e.target.value)}
                      placeholder="Internal notes..."
                      className={`${inputCls} resize-none flex-1`} />
                    <button onClick={handleSaveNote} disabled={savingNote}
                      className="px-3 rounded-xl glass-card border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors self-stretch disabled:opacity-50">
                      {savingNote ? <Loader2 size={12} className="animate-spin" /> : 'সেভ'}
                    </button>
                  </div>
                  {order.notes && <p className="text-xs text-muted-foreground mt-1">🗒️ Customer: {order.notes}</p>}
                </div>
              </>
            ) : (
              <div>
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-3"><Calendar size={12} className="text-primary" /> অর্ডার ইতিহাস</p>
                {timelineLoading ? (
                  <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-muted/30 rounded-xl animate-pulse" />)}</div>
                ) : (
                  <OrderTimeline timeline={timeline} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && <OrderInvoice order={order} onClose={() => setShowInvoice(false)} />}
    </>
  );
};

// ─── Main AdminOrders Component ─────────────────────────────────────────────
const AdminOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedTrx, setCopiedTrx] = useState<string | null>(null);
  const [adminWhatsapp, setAdminWhatsapp] = useState('');
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Apply query param filters on mount
  useEffect(() => {
    const status = searchParams.get('status');
    const filter = searchParams.get('filter');
    if (status) {
      if (status === 'payment_pending') {
        setPaymentFilter('pending');
      } else {
        setStatusFilter(status);
      }
      // Clear the param so it doesn't persist on manual filter change
      searchParams.delete('status');
      setSearchParams(searchParams, { replace: true });
    }
    if (filter) {
      const now = new Date();
      if (filter === 'today') {
        const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 10);
        setDateFrom(todayStr);
        setDateTo(now.toISOString().slice(0, 10));
      } else if (filter === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        setDateFrom(monthStart);
        setDateTo(now.toISOString().slice(0, 10));
      } else if (filter === 'year') {
        const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
        setDateFrom(yearStart);
        setDateTo(now.toISOString().slice(0, 10));
      }
      searchParams.delete('filter');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  // Load admin WhatsApp from settings
  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'admin_whatsapp').single()
      .then(({ data }) => { if (data?.value) setAdminWhatsapp(data.value); });
  }, []);

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

  // Send WhatsApp to customer's phone number
  const sendCustomerWhatsApp = useCallback((order: any) => {
    const phone = order.customer_phone?.replace(/\D/g, '').replace(/^0/, '880');
    if (!phone) { toast.error('কাস্টমারের ফোন নম্বর নেই'); return; }
    const items = order.order_items?.map((i: any) => `- ${i.product_name} x${i.quantity}`).join('\n') || '';
    const msg = encodeURIComponent(
      `SHAHED STORE\n` +
      `________________________\n\n` +
      `Order Confirmation\n\n` +
      `Order: #${order.order_number}\n` +
      `Name: ${order.customer_name}\n\n` +
      `Products:\n${items}\n\n` +
      `Payment: ${PM_LABELS[order.payment_method] || order.payment_method}\n` +
      (order.transaction_id ? `TrxID: ${order.transaction_id}\n` : '') +
      `Total: ${Number(order.total).toLocaleString()} BDT\n\n` +
      `Thank you for choosing Shahed Store\n` +
      `www.shahedstore.com.bd`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  }, []);

  // Realtime — detect new orders and play sound
  useEffect(() => {
    const channel = supabase.channel('orders-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const newOrder = payload.new as any;
        setNewOrderIds(prev => new Set(prev).add(newOrder.id));
        toast.success(
          `🛍️ নতুন অর্ডার! #${newOrder.order_number}`,
          {
            duration: 10000,
            action: newOrder.customer_phone ? {
              label: 'WhatsApp',
              onClick: () => {
                const phone = newOrder.customer_phone?.replace(/\D/g, '').replace(/^0/, '880');
                const msg = encodeURIComponent(
                  `SHAHED STORE\n\nOrder: #${newOrder.order_number}\nName: ${newOrder.customer_name}\nTotal: ${Number(newOrder.total).toLocaleString()} BDT\nPayment: ${PM_LABELS[newOrder.payment_method] || newOrder.payment_method}${newOrder.transaction_id ? '\nTrxID: ' + newOrder.transaction_id : ''}\n\nThank you!\n-- Shahed Store`
                );
                window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
              }
            } : undefined,
          }
        );
        fetchOrders();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders, adminWhatsapp]);

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

  const statusCounts: Record<string, number> = { all: orders.length };
  ALL_STATUSES.forEach(s => { statusCounts[s] = orders.filter(o => o.status === s).length; });

  const updateOrder = async (id: string, updates: any, successMsg: string) => {
    const { error } = await supabase.from('orders').update(updates).eq('id', id);
    if (error) { toast.error(handleDbError(error)); }
    else {
      toast.success(successMsg);
      // Send status update email if status changed
      if (updates.status) {
        try {
          await supabase.functions.invoke('send-order-email', {
            body: { type: 'status_update', orderId: id, newStatus: updates.status },
          });
        } catch (e) { console.error('Email send failed:', e); }
        // Telegram status notification
        const ord = orders.find((o: any) => o.id === id);
        supabase.functions.invoke('notify-telegram-event', {
          body: {
            title: `🔄 অর্ডার Status Update → ${String(updates.status).toUpperCase()}`,
            lines: [
              ord?.order_number ? `🧾 #${ord.order_number}` : null,
              ord?.customer_name ? `👤 ${ord.customer_name}` : null,
              ord?.total ? `💵 ৳${Number(ord.total).toLocaleString()}` : null,
            ],
          },
        }).catch(() => {});
      }
      // Refresh orders and update selected order if open
      fetchOrders();
      if (selectedOrder?.id === id) {
        setSelectedOrder((prev: any) => prev ? { ...prev, ...updates } : prev);
      }
    }
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

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(o => o.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const executeBulkAction = async () => {
    if (!bulkAction || selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size}টি অর্ডারের স্ট্যাটাস "${bulkAction}" এ পরিবর্তন করবেন?`)) return;
    setBulkLoading(true);
    try {
      const { error } = await supabase.from('orders').update({ status: bulkAction as any }).in('id', Array.from(selectedIds));
      if (error) throw error;
      toast.success(`✅ ${selectedIds.size}টি অর্ডার আপডেট হয়েছে!`);
      setSelectedIds(new Set());
      setBulkAction('');
      fetchOrders();
    } catch (err: any) {
      toast.error(handleDbError(err));
    } finally {
      setBulkLoading(false);
    }
  };

  // Status tabs shown
  const tabStatuses = ['all', 'pending', 'processing', 'delivered', 'completed', 'cancelled', 'refunded', 'failed'];

  // Quick stats for header overview
  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total), 0);
  const pendingCount = statusCounts['pending'] || 0;
  const processingCount = statusCounts['processing'] || 0;
  const completedCount = statusCounts['completed'] || 0;

  return (
    <div className="space-y-5">
      {/* ── Action bar (page title is in top header) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{orders.length}</span> মোট অর্ডার
          </p>
          {adminWhatsapp ? (
            <span className="flex items-center gap-2 text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              <MessageCircle size={10} /> WhatsApp সক্রিয়
            </span>
          ) : (
            <span className="flex items-center gap-2 text-[11px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <Bell size={10} /> WhatsApp নম্বর দিন Settings-এ
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl btn-glow text-sm font-semibold"
          >
            <Plus size={14} /> নতুন অর্ডার
          </button>
          <button onClick={fetchOrders} className="glass-card px-4 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Quick overview cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">মোট রেভিনিউ</span>
            <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center"><CreditCard size={14} /></div>
          </div>
          <p className="text-xl font-bold text-foreground">৳{totalRevenue.toLocaleString()}</p>
        </div>
        <button onClick={() => setStatusFilter('pending')} className="glass-card rounded-2xl p-4 text-left hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">পেন্ডিং</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center"><Clock size={14} /></div>
          </div>
          <p className="text-xl font-bold text-foreground">{pendingCount}</p>
        </button>
        <button onClick={() => setStatusFilter('processing')} className="glass-card rounded-2xl p-4 text-left hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">প্রসেসিং</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center"><RefreshCw size={14} /></div>
          </div>
          <p className="text-xl font-bold text-foreground">{processingCount}</p>
        </button>
        <button onClick={() => setStatusFilter('completed')} className="glass-card rounded-2xl p-4 text-left hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">সম্পন্ন</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center"><CheckCircle2 size={14} /></div>
          </div>
          <p className="text-xl font-bold text-foreground">{completedCount}</p>
        </button>
      </div>

      {/* Status Tabs — scrollable */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabStatuses.map(s => {
          const cfg = s === 'all' ? null : STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border flex-shrink-0 ${
                statusFilter === s ? 'btn-glow border-transparent' : 'glass-card border-border text-muted-foreground hover:text-primary'
              }`}
            >
              {s === 'all' ? 'সব অর্ডার' : cfg?.label}
              <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center ${statusFilter === s ? 'bg-white/20' : 'bg-muted/50'}`}>
                {statusCounts[s] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search + Filters */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="অর্ডার ID, নাম, ইমেইল, TrxID..."
              className="w-full bg-muted/30 border border-border rounded-xl pl-16 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 border transition-all ${showFilters ? 'btn-glow border-transparent' : 'glass-card border-border text-muted-foreground hover:text-foreground'}`}>
            <SlidersHorizontal size={14} /> ফিল্টার
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
          </button>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="px-3 py-2.5 rounded-xl text-xs text-muted-foreground hover:text-destructive glass-card border border-border transition-colors flex items-center gap-2">
              <X size={13} /> Reset
            </button>
          )}
        </div>
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1 border-t border-border">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Payment Method</label>
              <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className={inputCls}>
                <option value="all">সব</option>
                {Object.entries(PM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">তারিখ থেকে</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">তারিখ পর্যন্ত</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputCls} />
            </div>
            <div className="flex items-end">
              <div className="glass-card rounded-xl px-4 py-2.5 text-xs text-muted-foreground w-full text-center">
                {filtered.length} ফলাফল
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="glass-card rounded-2xl p-3 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-primary">{selectedIds.size}টি সিলেক্ট করা হয়েছে</span>
          <select value={bulkAction} onChange={e => setBulkAction(e.target.value)}
            className="bg-muted/30 border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary">
            <option value="">অ্যাকশন নির্বাচন করুন</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>)}
          </select>
          <button onClick={executeBulkAction} disabled={!bulkAction || bulkLoading}
            className="btn-glow px-4 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5">
            {bulkLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
            প্রয়োগ করুন
          </button>
          <button onClick={() => { setSelectedIds(new Set()); setBulkAction(''); }}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors">বাতিল</button>
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
            {hasActiveFilters && <button onClick={resetFilters} className="mt-3 text-xs text-primary hover:underline">ফিল্টার রিসেট করুন</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="px-3 py-3 w-8">
                    <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll} className="w-3.5 h-3.5 accent-primary rounded" />
                  </th>
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
                {filtered.map((order) => {
                  const cfg = STATUS_CONFIG[order.status];
                  return (
                    <tr key={order.id} className={`hover:bg-muted/10 transition-colors group ${selectedIds.has(order.id) ? 'bg-primary/5' : ''}`}>
                      <td className="px-3 py-3">
                        <input type="checkbox" checked={selectedIds.has(order.id)}
                          onChange={() => toggleSelect(order.id)} className="w-3.5 h-3.5 accent-primary rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-primary text-xs">{order.order_number}</span>
                        {order.payment_status === 'verified' && (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            <CheckCircle size={10} className="text-emerald-500" />
                            <span className="text-[10px] text-emerald-500">Verified</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground text-xs">{order.customer_name}</div>
                        <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                        {order.customer_phone && <div className="text-xs text-muted-foreground">{order.customer_phone}</div>}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="space-y-0.5">
                          {order.order_items?.slice(0, 2).map((item: any) => (
                            <div key={item.id} className="text-xs text-muted-foreground line-clamp-1">{item.product_name}</div>
                          ))}
                          {order.order_items?.length > 2 && <div className="text-xs text-primary">+{order.order_items.length - 2} more</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="text-xs font-medium text-foreground">{PM_LABELS[order.payment_method] || order.payment_method}</div>
                        {order.transaction_id && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] text-muted-foreground">{order.transaction_id.slice(0, 8)}...</span>
                            <button onClick={() => copyTrx(order.transaction_id, order.id)} className="text-muted-foreground hover:text-primary">
                              {copiedTrx === order.id ? <Check size={10} className="text-primary" /> : <Copy size={10} />}
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-foreground text-xs">৳{Number(order.total).toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg?.color || ''}`}>
                          {cfg?.label || order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('en-BD', { day: '2-digit', month: 'short' })}
                        <div>{new Date(order.created_at).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {order.payment_status !== 'verified' && order.status === 'pending' && (
                            <button onClick={() => updateOrder(order.id, { payment_status: 'verified', status: 'processing' }, '✅ Verified!')}
                              title="পেমেন্ট ভেরিফাই"
                              className="p-1.5 text-muted-foreground hover:text-emerald-500 transition-colors rounded-lg hover:bg-emerald-500/10">
                              <CheckCircle size={14} />
                            </button>
                          )}
                          {order.status === 'processing' && (
                            <button onClick={() => updateOrder(order.id, { status: 'delivered' }, '🚚 Delivered!')}
                              title="ডেলিভার্ড মার্ক"
                              className="p-1.5 text-muted-foreground hover:text-cyan-500 transition-colors rounded-lg hover:bg-cyan-500/10">
                              <Truck size={14} />
                            </button>
                          )}
                          {/* PDF Invoice Download Button — works for any status */}
                          <button
                            onClick={() => downloadOrderInvoicePdf(order)}
                            title="PDF ইনভয়েস ডাউনলোড করুন"
                            className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-primary/10">
                            <Download size={14} />
                          </button>
                          {/* Customer WhatsApp Button */}
                          <button
                            onClick={() => sendCustomerWhatsApp(order)}
                            title="কাস্টমারকে WhatsApp মেসেজ পাঠান"
                            className={`p-1.5 transition-colors rounded-lg ${newOrderIds.has(order.id) ? 'text-[#25D366] bg-[#25D366]/10 animate-pulse' : 'text-muted-foreground hover:text-[#25D366] hover:bg-[#25D366]/10'}`}>
                            <MessageCircle size={14} />
                          </button>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-primary/10">
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {filtered.length > 0 && (
        <div className="glass-card rounded-xl px-5 py-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>দেখাচ্ছে: <strong className="text-foreground">{filtered.length}</strong></span>
          <span>মোট মূল্য: <strong className="text-primary">৳{filtered.reduce((s, o) => s + Number(o.total), 0).toLocaleString()}</strong></span>
          <span>ভেরিফাই বাকি: <strong className="text-amber-500">{filtered.filter(o => o.payment_status !== 'verified' && !['cancelled', 'failed'].includes(o.status)).length}</strong></span>
          <span>সম্পন্ন: <strong className="text-emerald-500">{filtered.filter(o => o.status === 'completed').length}</strong></span>
        </div>
      )}

      {/* Modals */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={updateOrder}
        />
      )}
      {showCreateModal && (
        <CreateOrderModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchOrders}
        />
      )}
    </div>
  );
};

export default AdminOrders;
