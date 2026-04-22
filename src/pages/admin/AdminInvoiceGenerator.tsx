import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Printer, X, FileText, Save, Send } from 'lucide-react';
import { toast } from 'sonner';
import logoIcon from '@/assets/logo.png';
import { sendInvoiceViaWhatsApp, type InvoiceData } from '@/lib/invoicePdf';

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

const generateInvoiceNumber = () => {
  const now = new Date();
  return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
};

const inputCls = "w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors";

const AdminInvoiceGenerator = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const [logoBase64, setLogoBase64] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber());
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: crypto.randomUUID(), name: '', quantity: 1, price: 0 },
  ]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.drawImage(img, 0, 0); setLogoBase64(canvas.toDataURL('image/png')); }
    };
    img.src = logoIcon;
  }, []);

  const addItem = () => setItems(p => [...p, { id: crypto.randomUUID(), name: '', quantity: 1, price: 0 }]);
  const removeItem = (id: string) => items.length > 1 && setItems(p => p.filter(i => i.id !== id));
  const updateItem = (id: string, field: keyof InvoiceItem, value: any) =>
    setItems(p => p.map(i => i.id === id ? { ...i, [field]: value } : i));

  const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0);
  const total = Math.max(0, subtotal - discount);

  const PM_LABELS: Record<string, string> = {
    bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket', upay: 'উপায়', bank: 'ব্যাংক ট্রান্সফার', cash: 'ক্যাশ', other: 'অন্যান্য',
  };

  const handlePreview = () => {
    if (!customerName.trim()) return toast.error('গ্রাহকের নাম দিন');
    if (items.some(i => !i.name.trim() || i.price <= 0)) return toast.error('সকল আইটেমের নাম ও দাম দিন');
    setShowPreview(true);
  };

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>Invoice ${invoiceNumber}</title><style>* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; } @media print { @page { margin: 15mm; } }</style></head><body>${content}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const handleSendWhatsAppPdf = async () => {
    if (!customerName.trim()) return toast.error('গ্রাহকের নাম দিন');
    if (!customerPhone.trim()) return toast.error('গ্রাহকের ফোন নম্বর দিন');
    if (items.some(i => !i.name.trim() || i.price <= 0)) return toast.error('সকল আইটেমের নাম ও দাম দিন');
    const data: InvoiceData = {
      invoiceNumber, date: invoiceDate,
      customer: { name: customerName, phone: customerPhone, email: customerEmail, address: customerAddress },
      items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price, total: i.quantity * i.price })),
      subtotal, discount, total, paymentMethod, transactionId, status: 'paid', notes,
    };
    const tid = toast.loading('PDF তৈরি হচ্ছে...');
    try {
      await sendInvoiceViaWhatsApp(data, { phone: customerPhone });
      toast.success('PDF ইনভয়েস WhatsApp এ পাঠানো হচ্ছে...', { id: tid });
    } catch (e: any) {
      toast.error('সমস্যা: ' + (e?.message || 'Unknown'), { id: tid });
    }
  };

  const handleReset = () => {
    setInvoiceNumber(generateInvoiceNumber());
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setCustomerName(''); setCustomerEmail(''); setCustomerPhone(''); setCustomerAddress('');
    setPaymentMethod('bkash'); setTransactionId(''); setNotes(''); setDiscount(0);
    setItems([{ id: crypto.randomUUID(), name: '', quantity: 1, price: 0 }]);
    toast.success('ফর্ম রিসেট হয়েছে');
  };

  const brandColor = '#7c3aed';
  const brandLight = '#f3f0ff';
  const dateFormatted = new Date(invoiceDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><FileText size={22} /> ইনভয়েস তৈরি করুন</h1>
          <p className="text-sm text-muted-foreground mt-1">কাস্টম ইনভয়েস তৈরি এবং প্রিন্ট করুন</p>
        </div>
        <button onClick={handleReset} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted/30 transition-colors">রিসেট</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Form */}
        <div className="space-y-5">
          {/* Invoice Info */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-foreground text-sm">📄 ইনভয়েস তথ্য</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">ইনভয়েস নম্বর</label>
                <input className={inputCls} value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">তারিখ</label>
                <input type="date" className={inputCls} value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-foreground text-sm">👤 গ্রাহক তথ্য</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">নাম *</label>
                <input className={inputCls} placeholder="গ্রাহকের নাম" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">ইমেইল</label>
                <input className={inputCls} placeholder="email@example.com" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">ফোন</label>
                <input className={inputCls} placeholder="01XXXXXXXXX" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">ঠিকানা</label>
                <input className={inputCls} placeholder="ঠিকানা (ঐচ্ছিক)" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-foreground text-sm">💳 পেমেন্ট তথ্য</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">পেমেন্ট মেথড</label>
                <select className={inputCls} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  {Object.entries(PM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">ট্রানজেকশন আইডি</label>
                <input className={inputCls} placeholder="TrxID (ঐচ্ছিক)" value={transactionId} onChange={e => setTransactionId(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Right — Items */}
        <div className="space-y-5">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground text-sm">📦 পণ্য / সার্ভিস</h2>
              <button onClick={addItem} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"><Plus size={14} /> আইটেম যোগ</button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={item.id} className="flex items-start gap-2 p-3 rounded-xl bg-muted/20 border border-border/50">
                  <span className="text-xs text-muted-foreground mt-2.5 w-5">{idx + 1}.</span>
                  <div className="flex-1 space-y-2">
                    <input className={inputCls} placeholder="পণ্যের নাম / বিবরণ" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground">পরিমাণ</label>
                        <input type="number" min={1} className={inputCls} value={item.quantity} onChange={e => updateItem(item.id, 'quantity', Math.max(1, Number(e.target.value)))} />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">দাম (৳)</label>
                        <input type="number" min={0} className={inputCls} value={item.price || ''} onChange={e => updateItem(item.id, 'price', Number(e.target.value))} />
                      </div>
                    </div>
                    <div className="text-right text-xs font-medium text-primary">মোট: ৳{(item.quantity * item.price).toLocaleString()}</div>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="mt-2 p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors" disabled={items.length === 1}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Discount & Notes */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">ডিসকাউন্ট (৳)</label>
              <input type="number" min={0} className={inputCls} value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">নোট (ঐচ্ছিক)</label>
              <textarea className={inputCls + ' min-h-[60px]'} value={notes} onChange={e => setNotes(e.target.value)} placeholder="অতিরিক্ত তথ্য..." />
            </div>
          </div>

          {/* Summary */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground"><span>সাবটোটাল:</span><span>৳{subtotal.toLocaleString()}</span></div>
            {discount > 0 && <div className="flex justify-between text-sm text-green-500"><span>ডিসকাউন্ট:</span><span>-৳{discount.toLocaleString()}</span></div>}
            <div className="flex justify-between text-lg font-bold text-primary border-t border-border pt-3"><span>সর্বমোট:</span><span>৳{total.toLocaleString()}</span></div>
            <button onClick={handlePreview} className="w-full mt-2 btn-glow rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2">
              <Printer size={16} /> প্রিভিউ ও প্রিন্ট
            </button>
            <button onClick={handleSendWhatsAppPdf} className="w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 glass-card border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 transition-colors">
              <Send size={16} /> WhatsApp এ PDF পাঠান
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="glass-card rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
              <h3 className="font-bold text-foreground text-sm">Invoice {invoiceNumber}</h3>
              <div className="flex gap-2">
                <button onClick={handleSendWhatsAppPdf} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 text-xs font-semibold"><Send size={13} /> WhatsApp PDF</button>
                <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-glow text-xs font-semibold"><Printer size={13} /> Print / PDF</button>
                <button onClick={() => setShowPreview(false)} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30"><X size={15} /></button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              <div ref={printRef} style={{ background: '#fff', color: '#1a1a2e', padding: '40px', borderRadius: '12px', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', paddingBottom: '20px', borderBottom: `3px solid ${brandColor}` }}>
                  <div>{logoBase64 && <img src={logoBase64} alt="Logo" style={{ height: '48px', width: 'auto' }} />}</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: brandColor, letterSpacing: '2px' }}>INVOICE</div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '4px', fontFamily: 'monospace' }}>#{invoiceNumber}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{dateFormatted}</div>
                  </div>
                </div>

                {/* Customer + Payment */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
                  <div style={{ background: brandLight, borderRadius: '10px', padding: '16px', borderLeft: `4px solid ${brandColor}` }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: brandColor, letterSpacing: '1.5px', marginBottom: '10px' }}>বিলিং তথ্য</div>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e', marginBottom: '4px' }}>{customerName}</p>
                    {customerEmail && <p style={{ fontSize: '12px', color: '#555' }}>✉️ {customerEmail}</p>}
                    {customerPhone && <p style={{ fontSize: '12px', color: '#555', marginTop: '3px' }}>📱 {customerPhone}</p>}
                    {customerAddress && <p style={{ fontSize: '12px', color: '#555', marginTop: '3px' }}>📍 {customerAddress}</p>}
                  </div>
                  <div style={{ background: brandLight, borderRadius: '10px', padding: '16px', borderLeft: `4px solid ${brandColor}` }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: brandColor, letterSpacing: '1.5px', marginBottom: '10px' }}>পেমেন্ট তথ্য</div>
                    <p style={{ fontSize: '12px', color: '#555' }}>Method: <strong style={{ color: '#1a1a2e' }}>{PM_LABELS[paymentMethod] || paymentMethod}</strong></p>
                    {transactionId && <p style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>TrxID: <strong style={{ color: '#1a1a2e', fontFamily: 'monospace', background: '#e8e5f7', padding: '1px 6px', borderRadius: '4px', fontSize: '11px' }}>{transactionId}</strong></p>}
                    <p style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>
                      Status: <span style={{ background: brandColor, color: '#fff', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 }}>Paid</span>
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', borderRadius: '8px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ background: brandColor }}>
                      <th style={{ color: '#fff', fontSize: '11px', textTransform: 'uppercase', padding: '12px 14px', textAlign: 'left' }}>#</th>
                      <th style={{ color: '#fff', fontSize: '11px', textTransform: 'uppercase', padding: '12px 14px', textAlign: 'left' }}>পণ্যের নাম</th>
                      <th style={{ color: '#fff', fontSize: '11px', textTransform: 'uppercase', padding: '12px 14px', textAlign: 'center' }}>পরিমাণ</th>
                      <th style={{ color: '#fff', fontSize: '11px', textTransform: 'uppercase', padding: '12px 14px', textAlign: 'right' }}>দাম</th>
                      <th style={{ color: '#fff', fontSize: '11px', textTransform: 'uppercase', padding: '12px 14px', textAlign: 'right' }}>মোট</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#fff' : '#faf9ff' }}>
                        <td style={{ padding: '11px 14px', fontSize: '12px', color: '#888' }}>{idx + 1}</td>
                        <td style={{ padding: '11px 14px', fontSize: '13px', color: '#1a1a2e', fontWeight: 500 }}>{item.name}</td>
                        <td style={{ padding: '11px 14px', fontSize: '13px', textAlign: 'center', color: '#555' }}>×{item.quantity}</td>
                        <td style={{ padding: '11px 14px', fontSize: '13px', textAlign: 'right', color: '#555' }}>৳{Number(item.price).toLocaleString()}</td>
                        <td style={{ padding: '11px 14px', fontSize: '14px', fontWeight: 700, textAlign: 'right', color: '#1a1a2e' }}>৳{(item.quantity * item.price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ minWidth: '260px', background: brandLight, borderRadius: '10px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#555', marginBottom: '8px' }}><span>সাবটোটাল:</span><span>৳{subtotal.toLocaleString()}</span></div>
                    {discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#059669', marginBottom: '8px' }}><span>ডিসকাউন্ট:</span><span>-৳{discount.toLocaleString()}</span></div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 800, color: brandColor, borderTop: `2px solid ${brandColor}`, paddingTop: '10px', marginTop: '8px' }}><span>সর্বমোট:</span><span>৳{total.toLocaleString()}</span></div>
                  </div>
                </div>

                {/* Notes */}
                {notes && (
                  <div style={{ marginTop: '20px', background: '#fffbeb', borderRadius: '10px', padding: '14px', fontSize: '12px', color: '#555', borderLeft: '4px solid #f59e0b' }}>
                    <strong style={{ color: '#b45309' }}>📝 নোট:</strong> {notes}
                  </div>
                )}

                {/* Footer */}
                <div style={{ marginTop: '28px', textAlign: 'center', borderTop: `2px solid ${brandLight}`, paddingTop: '18px' }}>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>ধন্যবাদ আমাদের সাথে কেনাকাটা করার জন্য!</div>
                  <div style={{ fontSize: '11px', color: '#aaa' }}><div style={{ fontSize: '11px', color: '#aaa' }}>🌐 shahedstore.com.bd &nbsp;•&nbsp; 📧 info@shahedstore.com.bd</div></div>
                  <div style={{ fontSize: '10px', color: '#ccc', marginTop: '8px' }}>This is a computer-generated invoice and does not require a signature.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInvoiceGenerator;
