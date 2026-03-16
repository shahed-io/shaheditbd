import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import SEOHead from '@/components/seo/SEOHead';
import { Search, Package, Clock, CheckCircle, XCircle, Truck, RefreshCw, ShoppingBag } from 'lucide-react';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
  license_key: string | null;
}

interface TimelineEvent {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
}

interface OrderData {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  payment_status: string | null;
  payment_method: string | null;
  total: number;
  subtotal: number;
  discount_amount: number | null;
  created_at: string;
  notes: string | null;
  items: OrderItem[];
  timeline: TimelineEvent[];
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending:    { label: 'অপেক্ষমান',   icon: Clock,        color: 'hsl(45,100%,45%)',  bg: 'hsla(45,100%,51%,0.10)' },
  processing: { label: 'প্রক্রিয়াধীন', icon: RefreshCw,    color: 'hsl(215,85%,50%)',  bg: 'hsla(215,85%,50%,0.10)' },
  completed:  { label: 'সম্পন্ন',      icon: CheckCircle,  color: 'hsl(162,72%,38%)',  bg: 'hsla(162,72%,38%,0.10)' },
  delivered:  { label: 'ডেলিভার হয়েছে', icon: Truck,       color: 'hsl(162,72%,38%)',  bg: 'hsla(162,72%,38%,0.10)' },
  cancelled:  { label: 'বাতিল',        icon: XCircle,      color: 'hsl(0,85%,55%)',    bg: 'hsla(0,85%,55%,0.10)'   },
  refunded:   { label: 'ফেরত',         icon: RefreshCw,    color: 'hsl(280,80%,55%)',  bg: 'hsla(280,80%,55%,0.10)' },
  failed:     { label: 'ব্যর্থ',       icon: XCircle,      color: 'hsl(0,85%,55%)',    bg: 'hsla(0,85%,55%,0.10)'   },
};

const OrderTracking = () => {
  const [query, setQuery] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);

    const { data, error: err } = await supabase
      .from('orders')
      .select(`
        id, order_number, customer_name, customer_email, status,
        payment_status, payment_method, total, subtotal, discount_amount,
        created_at, notes,
        order_items (id, product_name, quantity, price, total, license_key),
        order_timeline (id, status, note, created_at)
      `)
      .eq('order_number', query.trim().toUpperCase())
      .maybeSingle();

    setLoading(false);

    if (err || !data) {
      setError('অর্ডার খুঁজে পাওয়া যায়নি। অর্ডার নম্বর চেক করুন।');
      return;
    }

    // verify email if provided
    if (email.trim() && data.customer_email.toLowerCase() !== email.trim().toLowerCase()) {
      setError('ইমেইল মিলছে না। সঠিক ইমেইল দিন।');
      return;
    }

    setOrder({
      ...data,
      items: (data.order_items || []) as OrderItem[],
      timeline: ((data.order_timeline || []) as TimelineEvent[]).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    });
  };

  const cfg = order ? (STATUS_CONFIG[order.status] || STATUS_CONFIG.pending) : null;

  return (
    <>
      <SEOHead title="অর্ডার ট্র্যাকিং" description="আপনার অর্ডারের বর্তমান অবস্থা জানুন।" />
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))', boxShadow: '0 8px 32px hsla(258,78%,55%,0.35)' }}>
              <Package size={26} className="text-white" />
            </div>
            <h1 className="font-sora font-black text-3xl mb-2 text-foreground">অর্ডার ট্র্যাক করুন</h1>
            <p className="text-muted-foreground text-sm">অর্ডার নম্বর দিয়ে আপনার অর্ডারের সর্বশেষ অবস্থা জানুন</p>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch} className="rounded-2xl p-6 mb-6"
            style={{
              background: 'linear-gradient(155deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.65) 100%)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid hsla(258,78%,75%,0.22)',
              boxShadow: '0 4px 32px hsla(258,78%,55%,0.10)',
            }}>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">অর্ডার নম্বর *</label>
                <input
                  type="text"
                  placeholder="যেমন: ORD-ABC123"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none uppercase"
                  style={{
                    background: 'hsla(0,0%,100%,0.80)',
                    border: '1.5px solid hsla(258,78%,75%,0.25)',
                    color: 'hsl(226,35%,14%)',
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">ইমেইল (ঐচ্ছিক — যাচাইয়ের জন্য)</label>
                <input
                  type="email"
                  placeholder="order@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    background: 'hsla(0,0%,100%,0.80)',
                    border: '1.5px solid hsla(258,78%,75%,0.25)',
                    color: 'hsl(226,35%,14%)',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))', boxShadow: '0 4px 16px hsla(258,78%,55%,0.28)' }}
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><Search size={15} /> অর্ডার খুঁজুন</>}
              </button>
            </div>
            {error && <p className="text-xs mt-3 text-center" style={{ color: 'hsl(0,85%,55%)' }}>{error}</p>}
          </form>

          {/* Order Result */}
          {order && cfg && (
            <div className="space-y-5">
              {/* Status card */}
              <div className="rounded-2xl p-5"
                style={{
                  background: cfg.bg,
                  border: `1.5px solid ${cfg.color.replace('hsl(','hsla(').replace(')',',0.25)')}`,
                }}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: cfg.color.replace('hsl(','hsla(').replace(')',',0.15)'), border: `1.5px solid ${cfg.color.replace('hsl(','hsla(').replace(')',',0.30)')}` }}>
                    <cfg.icon size={20} style={{ color: cfg.color }} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">বর্তমান স্ট্যাটাস</p>
                    <p className="font-bold text-lg" style={{ color: cfg.color }}>{cfg.label}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-muted-foreground">অর্ডার নম্বর</p>
                    <p className="font-bold font-mono text-sm text-foreground">{order.order_number}</p>
                  </div>
                </div>
              </div>

              {/* Order info */}
              <div className="rounded-2xl p-5"
                style={{
                  background: 'linear-gradient(155deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.65) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid hsla(258,78%,75%,0.18)',
                  boxShadow: '0 4px 24px hsla(258,78%,55%,0.08)',
                }}>
                <h3 className="font-sora font-bold text-base mb-4 text-foreground flex items-center gap-2">
                  <ShoppingBag size={16} style={{ color: 'hsl(258,78%,55%)' }} /> অর্ডার বিবরণ
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  {[
                    { label: 'গ্রাহক', value: order.customer_name },
                    { label: 'পেমেন্ট মেথড', value: order.payment_method || '—' },
                    { label: 'পেমেন্ট স্ট্যাটাস', value: order.payment_status || '—' },
                    { label: 'তারিখ', value: new Date(order.created_at).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                  ].map((r, i) => (
                    <div key={i} className="rounded-xl p-3" style={{ background: 'hsla(258,78%,55%,0.04)', border: '1px solid hsla(258,78%,75%,0.12)' }}>
                      <p className="text-[10px] text-muted-foreground mb-0.5">{r.label}</p>
                      <p className="font-semibold text-foreground">{r.value}</p>
                    </div>
                  ))}
                </div>

                {/* Items */}
                <div className="border-t pt-4" style={{ borderColor: 'hsla(258,78%,75%,0.18)' }}>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">অর্ডার আইটেম</p>
                  <div className="space-y-2">
                    {order.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                        style={{ borderColor: 'hsla(258,78%,75%,0.12)' }}>
                        <div>
                          <p className="font-medium text-foreground">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ৳{item.price.toLocaleString()}</p>
                          {item.license_key && (
                            <div className="mt-1 px-2 py-1 rounded-lg text-xs font-mono"
                              style={{ background: 'hsla(162,72%,38%,0.08)', border: '1px solid hsla(162,72%,38%,0.22)', color: 'hsl(162,72%,28%)' }}>
                              🔑 {item.license_key}
                            </div>
                          )}
                        </div>
                        <p className="font-bold" style={{ color: 'hsl(258,78%,50%)' }}>৳{item.total.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t font-bold"
                    style={{ borderColor: 'hsla(258,78%,75%,0.18)' }}>
                    <span className="text-foreground">মোট</span>
                    <span style={{ color: 'hsl(258,78%,50%)' }}>৳{order.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {order.timeline.length > 0 && (
                <div className="rounded-2xl p-5"
                  style={{
                    background: 'linear-gradient(155deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.65) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid hsla(258,78%,75%,0.18)',
                    boxShadow: '0 4px 24px hsla(258,78%,55%,0.08)',
                  }}>
                  <h3 className="font-sora font-bold text-base mb-4 text-foreground flex items-center gap-2">
                    <Clock size={16} style={{ color: 'hsl(258,78%,55%)' }} /> অর্ডার ট্র্যাকিং
                  </h3>
                  <div className="relative pl-6">
                    <div className="absolute left-2 top-2 bottom-2 w-px" style={{ background: 'hsla(258,78%,75%,0.25)' }} />
                    <div className="space-y-4">
                      {order.timeline.map((ev, idx) => {
                        const evCfg = STATUS_CONFIG[ev.status] || STATUS_CONFIG.pending;
                        const isLast = idx === order.timeline.length - 1;
                        return (
                          <div key={ev.id} className="relative">
                            <div className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                              style={{
                                background: isLast ? evCfg.color : 'hsl(var(--background))',
                                borderColor: evCfg.color,
                                boxShadow: isLast ? `0 0 0 3px ${evCfg.color.replace('hsl(','hsla(').replace(')',',0.20)')}` : 'none',
                              }}>
                              {isLast && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                  style={{ background: evCfg.bg, color: evCfg.color }}>
                                  {evCfg.label}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(ev.created_at).toLocaleDateString('en-BD', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              {ev.note && <p className="text-xs text-muted-foreground mt-0.5">{ev.note}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
};

export default OrderTracking;
