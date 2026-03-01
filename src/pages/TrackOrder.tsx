import { useState } from 'react';
import { Search, Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import { supabase } from '@/integrations/supabase/client';

type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';

interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  customer_name: string;
  customer_email: string;
  total: number;
  created_at: string;
  payment_status: string | null;
  order_items: { product_name: string; quantity: number; price: number }[];
}

const STATUS_INFO: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'পেন্ডিং', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30', icon: <Clock size={16} /> },
  processing: { label: 'প্রসেসিং', color: 'text-blue-400 bg-blue-400/10 border-blue-400/30', icon: <Package size={16} /> },
  completed: { label: 'ডেলিভারড', color: 'text-green-400 bg-green-400/10 border-green-400/30', icon: <CheckCircle size={16} /> },
  cancelled: { label: 'বাতিল', color: 'text-red-400 bg-red-400/10 border-red-400/30', icon: <XCircle size={16} /> },
  refunded: { label: 'রিফান্ড', color: 'text-purple-400 bg-purple-400/10 border-purple-400/30', icon: <Truck size={16} /> },
};

const STEPS = [
  { key: 'pending', label: 'অর্ডার প্রাপ্ত' },
  { key: 'processing', label: 'পেমেন্ট যাচাই' },
  { key: 'completed', label: 'ডেলিভারি সম্পন্ন' },
];

const TrackOrder = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);

    const { data, error: err } = await supabase
      .from('orders')
      .select('*, order_items(product_name, quantity, price)')
      .eq('order_number', orderNumber.trim())
      .eq('customer_email', email.trim().toLowerCase())
      .single();

    if (err || !data) {
      setError('অর্ডার পাওয়া যায়নি। অর্ডার নম্বর ও ইমেইল সঠিক কিনা পরীক্ষা করুন।');
    } else {
      setOrder(data as Order);
    }
    setLoading(false);
  };

  const getStepIndex = (status: OrderStatus) => {
    if (status === 'completed') return 2;
    if (status === 'processing') return 1;
    return 0;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-36 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10 animate-slide-up">
            <h1 className="text-4xl font-bold gradient-text mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              অর্ডার ট্র্যাক করুন
            </h1>
            <p className="text-muted-foreground">আপনার অর্ডার নম্বর ও ইমেইল দিয়ে অর্ডারের বর্তমান অবস্থা জানুন</p>
          </div>

          <div className="glass-card rounded-2xl p-6 mb-6">
            <form onSubmit={handleTrack} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">অর্ডার নম্বর</label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="যেমন: SS-20260301-001"
                  className="w-full bg-transparent border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary/50 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">ইমেইল ঠিকানা</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="আপনার ইমেইল লিখুন"
                  className="w-full bg-transparent border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary/50 outline-none transition-all"
                  required
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-glow py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-background/50 border-t-background rounded-full animate-spin" />
                ) : (
                  <>
                    <Search size={18} />
                    অর্ডার খুঁজুন
                  </>
                )}
              </button>
            </form>
          </div>

          {order && (
            <div className="space-y-4 animate-fade-in">
              {/* Order info */}
              <div className="glass-card rounded-2xl p-6 border border-primary/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-foreground text-lg">#{order.order_number}</h2>
                    <p className="text-muted-foreground text-sm">{new Date(order.created_at).toLocaleDateString('bn-BD')}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border ${STATUS_INFO[order.status]?.color}`}>
                    {STATUS_INFO[order.status]?.icon}
                    {STATUS_INFO[order.status]?.label}
                  </span>
                </div>

                {/* Progress steps */}
                {order.status !== 'cancelled' && order.status !== 'refunded' && (
                  <div className="flex items-center gap-0 mb-6">
                    {STEPS.map((step, i) => {
                      const stepIdx = getStepIndex(order.status);
                      const isActive = i <= stepIdx;
                      return (
                        <div key={step.key} className="flex items-center flex-1">
                          <div className={`flex flex-col items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'}`}>
                              {i + 1}
                            </div>
                            <p className={`text-[10px] mt-1 text-center ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{step.label}</p>
                          </div>
                          {i < STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mb-4 transition-all ${i < stepIdx ? 'bg-primary' : 'bg-border'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Items */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground mb-2">পণ্য সমূহ</h3>
                  {order.order_items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-2 border-b border-border/50">
                      <span className="text-foreground">{item.product_name} ×{item.quantity}</span>
                      <span className="text-primary font-medium">৳{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-foreground pt-2">
                    <span>মোট</span>
                    <span className="text-primary text-lg">৳{order.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {order.status === 'completed' && (
                <div className="glass-card rounded-2xl p-4 border border-green-400/30 bg-green-400/5 text-sm text-green-400">
                  ✅ আপনার অর্ডার সম্পন্ন হয়েছে। লাইসেন্স কি / একাউন্ট ডিটেইল ইমেইলে পাঠানো হয়েছে।
                </div>
              )}
              {order.status === 'pending' && (
                <div className="glass-card rounded-2xl p-4 border border-yellow-400/30 bg-yellow-400/5 text-sm text-yellow-400">
                  ⏳ আপনার পেমেন্ট যাচাই করা হচ্ছে। সাধারণত ১-৬ ঘণ্টার মধ্যে ডেলিভারি দেওয়া হয়।
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackOrder;
