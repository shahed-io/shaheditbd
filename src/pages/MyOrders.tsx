import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import { Package, Key, Clock, CheckCircle, XCircle, RefreshCw, Eye, EyeOff, Copy, FileText } from 'lucide-react';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30', icon: Clock },
  processing: { label: 'Verifying', color: 'text-blue-400 bg-blue-400/10 border-blue-400/30', icon: RefreshCw },
  completed: { label: 'Delivered', color: 'text-green-400 bg-green-400/10 border-green-400/30', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-red-400 bg-red-400/10 border-red-400/30', icon: XCircle },
  refunded: { label: 'Refunded', color: 'text-purple-400 bg-purple-400/10 border-purple-400/30', icon: RefreshCw },
};

const MyOrders = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [licenseKeys, setLicenseKeys] = useState<any[]>([]);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { navigate('/'); return; }
      setUser(data.user);
      fetchOrders(data.user.id);
    });
  }, []);

  const fetchOrders = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const openOrder = async (order: any) => {
    setSelectedOrder(order);
    if (order.status === 'completed') {
      const itemIds = order.order_items?.map((i: any) => i.id) || [];
      if (itemIds.length > 0) {
        const { data } = await supabase
          .from('license_keys')
          .select('*')
          .in('order_item_id', itemIds);
        setLicenseKeys(data || []);
      }
    }
  };

  const toggleReveal = (keyId: string) => {
    setRevealedKeys(prev => {
      const next = new Set(prev);
      next.has(keyId) ? next.delete(keyId) : next.add(keyId);
      return next;
    });
  };

  const copyKey = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success('Key copied!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="pt-36 pb-16 px-4 max-w-3xl mx-auto">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-36 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>My Orders</h1>
            <p className="text-xs text-muted-foreground">{orders.length}টি অর্ডার পাওয়া গেছে</p>
          </div>

          {orders.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Package size={48} className="text-muted-foreground mx-auto mb-4 opacity-40" />
              <p className="text-foreground font-medium">কোনো অর্ডার নেই</p>
              <p className="text-muted-foreground text-sm mt-1">এখনো কোনো অর্ডার করেননি</p>
              <button onClick={() => navigate('/')} className="btn-glow px-6 py-2.5 rounded-xl text-sm mt-4">
                Shop করুন
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const cfg = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = cfg.icon;
                return (
                  <div key={order.id} className="glass-card rounded-2xl p-5 hover:border-primary/30 transition-all cursor-pointer border border-border"
                    onClick={() => openOrder(order)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-primary text-sm">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(order.created_at).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}

                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
                          <StatusIcon size={11} />
                          {cfg.label}
                        </span>
                        <p className="font-black text-foreground">৳{Number(order.total).toLocaleString()}</p>
                      </div>
                    </div>
                    {order.order_items?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {order.order_items.map((item: any) => (
                          <span key={item.id} className="text-xs bg-muted/30 text-muted-foreground px-3 py-1 rounded-full">
                            {item.product_name}
                          </span>
                        ))}
                      </div>
                    )}
                    {order.status === 'completed' && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-green-400">
                        <Key size={12} />
                        <span>License Key উপলব্ধ — ক্লিক করে দেখুন</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-primary/20">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{selectedOrder.order_number}</h2>
                  <p className="text-xs text-muted-foreground capitalize">{selectedOrder.payment_method} payment</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/invoice/${selectedOrder.id}`}
                    className="flex items-center gap-1.5 glass-card border border-border px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <FileText size={12} />
                    Invoice
                  </Link>
                  <button onClick={() => { setSelectedOrder(null); setLicenseKeys([]); setRevealedKeys(new Set()); }}
                    className="text-muted-foreground hover:text-foreground text-xl">✕</button>
                </div>
              </div>

            <div className="space-y-4">
              {/* Status */}
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${statusConfig[selectedOrder.status]?.color}`}>
                {(() => { const I = statusConfig[selectedOrder.status]?.icon; return I ? <I size={16} /> : null; })()}
                <span>
                  {selectedOrder.status === 'pending' && 'Payment Verification বাকি আছে'}
                  {selectedOrder.status === 'processing' && 'Payment Proof যাচাই হচ্ছে...'}
                  {selectedOrder.status === 'completed' && 'Payment Verified! Product Delivered'}
                  {selectedOrder.status === 'cancelled' && 'অর্ডার বাতিল হয়েছে'}
                  {selectedOrder.status === 'refunded' && 'Refund করা হয়েছে'}
                </span>
              </div>

              {/* Order Items */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">অর্ডার আইটেম</p>
                {selectedOrder.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center glass-card rounded-xl p-3 text-sm mb-2">
                    <span className="text-foreground">{item.product_name} × {item.quantity}</span>
                    <span className="font-bold text-primary">৳{Number(item.total).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between px-3 pt-2 text-sm font-bold">
                  <span className="text-muted-foreground">মোট</span>
                  <span className="text-primary">৳{Number(selectedOrder.total).toLocaleString()}</span>
                </div>
              </div>

              {/* License Keys — only when completed */}
              {selectedOrder.status === 'completed' && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Key size={16} className="text-primary" />
                    <p className="text-sm font-semibold text-foreground">আপনার License Key / Credentials</p>
                  </div>
                  {licenseKeys.length === 0 ? (
                    <p className="text-xs text-muted-foreground bg-muted/20 rounded-xl p-3">Keys এখনো assign করা হয়নি। সমস্যা হলে support-এ যোগাযোগ করুন।</p>
                  ) : (
                    <div className="space-y-2">
                      {licenseKeys.map((k) => (
                        <div key={k.id} className="glass-card rounded-xl p-4 border border-green-500/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground capitalize">{k.key_type}</span>
                            <div className="flex gap-2">
                              <button onClick={() => copyKey(k.key_value)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                                <Copy size={13} />
                              </button>
                              <button onClick={() => toggleReveal(k.id)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                                {revealedKeys.has(k.id) ? <EyeOff size={13} /> : <Eye size={13} />}
                              </button>
                            </div>
                          </div>
                          <p className={`text-sm font-mono text-green-400 break-all ${!revealedKeys.has(k.id) ? 'blur-sm select-none' : ''}`}>
                            {k.key_value}
                          </p>
                          {k.extra_info && revealedKeys.has(k.id) && (
                            <p className="text-xs text-muted-foreground mt-2 border-t border-border/30 pt-2">{k.extra_info}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MyOrders;
