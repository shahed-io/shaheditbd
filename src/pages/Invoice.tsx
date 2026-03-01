import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Printer, Download, ArrowLeft, CheckCircle, Package } from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';

const Invoice = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderData) {
        setOrder(orderData);
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId);
        setItems(itemsData || []);
      }
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 text-center animate-pulse">
          <Package size={32} className="text-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-8 text-center max-w-sm">
          <p className="text-muted-foreground mb-4">Invoice পাওয়া যায়নি।</p>
          <Link to="/my-orders" className="btn-glow px-4 py-2 rounded-xl text-sm">My Orders</Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <>
      {/* Screen controls - hidden on print */}
      <div className="no-print min-h-screen bg-background text-foreground pb-8 px-4 pt-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link to="/my-orders" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
              <ArrowLeft size={16} />
              My Orders
            </Link>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 glass-card border border-border px-4 py-2 rounded-xl text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              >
                <Printer size={15} />
                Print / Save PDF
              </button>
            </div>
          </div>

          {/* Invoice Card */}
          <div ref={printRef} className="glass-card rounded-2xl overflow-hidden print-invoice">
            {/* Invoice Header */}
            <div className="bg-gradient-to-r from-primary/20 to-accent/20 border-b border-primary/20 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img src={logoIcon} alt="Shahed Store" className="w-12 h-12 rounded-full" />
                  <div>
                    <h1 className="font-black text-xl tracking-widest gradient-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>SHAHED STORE</h1>
                    <p className="text-muted-foreground text-xs">Bangladesh's Trusted Digital Store</p>
                    <p className="text-muted-foreground text-xs">📞 01840-099853 | shahedstore.com.bd</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black gradient-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>INVOICE</p>
                  <p className="text-foreground font-mono text-sm mt-1">#{order.order_number}</p>
                  <p className="text-muted-foreground text-xs mt-1">{formatDate(order.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Status & Customer Info */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-border">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Customer</p>
                <p className="font-semibold text-foreground">{order.customer_name}</p>
                <p className="text-muted-foreground text-sm">{order.customer_email}</p>
                {order.customer_phone && <p className="text-muted-foreground text-sm">{order.customer_phone}</p>}
              </div>
              <div className="sm:text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Payment</p>
                <p className="font-semibold text-foreground capitalize">{order.payment_method}</p>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                  order.status === 'completed'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : order.status === 'pending'
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-primary/20 text-primary border border-primary/30'
                }`}>
                  {order.status === 'completed' && <CheckCircle size={10} />}
                  {order.status === 'completed' ? 'Completed' : order.status === 'pending' ? 'Pending' : order.status}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-muted-foreground uppercase tracking-widest pb-3">Product</th>
                    <th className="text-center text-xs text-muted-foreground uppercase tracking-widest pb-3">Qty</th>
                    <th className="text-right text-xs text-muted-foreground uppercase tracking-widest pb-3">Price</th>
                    <th className="text-right text-xs text-muted-foreground uppercase tracking-widest pb-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-border/50">
                      <td className="py-3 pr-4">
                        <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                        {item.license_key && (
                          <p className="text-xs text-primary mt-0.5 font-mono">🔑 {item.license_key}</p>
                        )}
                      </td>
                      <td className="py-3 text-center text-sm text-muted-foreground">{item.quantity}</td>
                      <td className="py-3 text-right text-sm text-muted-foreground">৳{Number(item.price).toLocaleString()}</td>
                      <td className="py-3 text-right text-sm font-semibold text-foreground">৳{Number(item.total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="mt-4 flex flex-col items-end gap-1.5">
                <div className="flex justify-between w-48 text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">৳{Number(order.subtotal).toLocaleString()}</span>
                </div>
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between w-48 text-sm">
                    <span className="text-muted-foreground">Discount {order.coupon_code && `(${order.coupon_code})`}</span>
                    <span className="text-green-400">-৳{Number(order.discount_amount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between w-48 border-t border-border pt-2 mt-1">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="font-black text-xl text-primary">৳{Number(order.total).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border px-6 py-4 bg-muted/10 text-center">
              <p className="text-xs text-muted-foreground">
                ধন্যবাদ Shahed Store থেকে কেনার জন্য! সমস্যায় WhatsApp করুন: 01840-099853
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This is a computer-generated invoice. No signature required.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { padding: 0 !important; }
          .no-print > div > div:first-child { display: none !important; }
          .print-invoice {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
            background: white !important;
          }
          .glass-card { background: white !important; border: 1px solid #eee !important; }
          .gradient-text { -webkit-text-fill-color: #0ea5e9 !important; }
          .text-muted-foreground { color: #666 !important; }
          .text-foreground { color: #111 !important; }
          .text-primary { color: #0ea5e9 !important; }
          .border-border { border-color: #eee !important; }
          button { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default Invoice;
