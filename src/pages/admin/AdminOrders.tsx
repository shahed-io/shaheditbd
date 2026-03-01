import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, Eye, Check, X, Image, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const statusColor: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  processing: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  completed: 'text-green-400 bg-green-400/10 border-green-400/30',
  cancelled: 'text-red-400 bg-red-400/10 border-red-400/30',
  refunded: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [paymentProofs, setPaymentProofs] = useState<any[]>([]);
  const [proofScreenshot, setProofScreenshot] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    let query = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter as any);
    const { data } = await query;
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const filtered = orders.filter(o =>
    o.order_number.includes(search) ||
    o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_email.toLowerCase().includes(search.toLowerCase())
  );

  const openOrder = async (order: any) => {
    setSelectedOrder(order);
    setAdminNotes('');
    setProofScreenshot(null);

    // Fetch payment proofs
    const { data: proofs } = await supabase
      .from('payment_proofs')
      .select('*')
      .eq('order_id', order.id)
      .order('submitted_at', { ascending: false });
    setPaymentProofs(proofs || []);

    // Load screenshot if any
    if (proofs && proofs[0]?.screenshot_url) {
      const { data: urlData } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(proofs[0].screenshot_url, 3600);
      if (urlData?.signedUrl) setProofScreenshot(urlData.signedUrl);
    }
  };

  const handleVerify = async (action: 'approve' | 'reject') => {
    if (!selectedOrder) return;
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { orderId: selectedOrder.id, action, adminNotes },
      });
      if (error) throw error;
      toast.success(action === 'approve' ? '✅ Payment Approved! Product Delivered!' : '❌ Payment Rejected');
      fetchOrders();
      setSelectedOrder(null);
    } catch (e: any) {
      toast.error('সমস্যা হয়েছে: ' + (e.message || 'Unknown error'));
    }
    setVerifying(false);
  };

  const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Orders <span className="gradient-text">Management</span>
          </h1>
          <p className="text-muted-foreground text-sm">{orders.length} total orders</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-4 py-2">
            <AlertCircle size={16} className="text-yellow-400" />
            <span className="text-yellow-400 text-sm font-medium">{pendingCount} টি Verify বাকি</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..."
            className="w-full bg-muted/30 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'processing', 'completed', 'cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all ${statusFilter === s ? 'btn-glow' : 'glass-card text-muted-foreground hover:text-primary'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-xl max-h-[92vh] overflow-y-auto border border-primary/20">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">#{selectedOrder.order_number}</h2>
                <p className="text-xs text-muted-foreground">{selectedOrder.customer_name} — {selectedOrder.customer_email}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
            </div>

            <div className="space-y-4">
              {/* Order info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground block text-xs">Phone</span><span className="text-foreground">{selectedOrder.customer_phone || '-'}</span></div>
                <div><span className="text-muted-foreground block text-xs">Payment</span><span className="text-foreground capitalize">{selectedOrder.payment_method}</span></div>
                <div><span className="text-muted-foreground block text-xs">Total</span><span className="font-bold text-primary text-base">৳{Number(selectedOrder.total).toLocaleString()}</span></div>
                <div><span className="text-muted-foreground block text-xs">Status</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor[selectedOrder.status] || ''}`}>{selectedOrder.status}</span>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Order Items</p>
                {selectedOrder.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center glass-card rounded-xl p-3 text-sm mb-1.5">
                    <span className="text-foreground">{item.product_name} × {item.quantity}</span>
                    <span className="font-bold text-primary">৳{Number(item.total).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Payment Proofs */}
              {paymentProofs.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Payment Proof</p>
                  {paymentProofs.map(proof => (
                    <div key={proof.id} className="glass-card rounded-xl p-4 space-y-2 border border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Transaction ID:</span>
                        <span className="font-mono font-bold text-foreground">{proof.transaction_id}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="text-foreground">৳{Number(proof.amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Submitted:</span>
                        <span className="text-foreground text-xs">{new Date(proof.submitted_at).toLocaleString('en-BD')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Proof Status:</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          proof.status === 'approved' ? 'bg-green-400/10 text-green-400' :
                          proof.status === 'rejected' ? 'bg-red-400/10 text-red-400' :
                          'bg-yellow-400/10 text-yellow-400'
                        }`}>{proof.status}</span>
                      </div>
                      {proofScreenshot && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><Image size={12} /> Screenshot:</p>
                          <img src={proofScreenshot} alt="payment proof" className="w-full rounded-xl max-h-48 object-contain bg-muted/20" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Admin Notes (ঐচ্ছিক)</label>
                <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2}
                  placeholder="Rejection reason or delivery notes..."
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none" />
              </div>

              {/* Verify Buttons */}
              {(selectedOrder.status === 'pending' || selectedOrder.status === 'processing') && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleVerify('approve')}
                    disabled={verifying}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={16} />
                    {verifying ? 'Processing...' : 'Approve ✓'}
                  </button>
                  <button
                    onClick={() => handleVerify('reject')}
                    disabled={verifying}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    {verifying ? 'Processing...' : 'Reject ✗'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({length: 6}).map((_, i) => <div key={i} className="h-14 bg-muted/30 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="font-medium">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Order #</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Customer</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Date</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Total</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">Payment</th>
                  <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 font-medium text-primary">{order.order_number}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{order.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                      {new Date(order.created_at).toLocaleDateString('en-BD')}
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground">৳{Number(order.total).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium border capitalize ${statusColor[order.status] || ''}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs capitalize">{order.payment_method}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {(order.status === 'pending' || order.status === 'processing') && (
                          <>
                            <button onClick={() => { openOrder(order); }} title="Approve/Reject"
                              className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors">
                              <Check size={14} />
                            </button>
                          </>
                        )}
                        <button onClick={() => openOrder(order)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                          <Eye size={15} />
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
    </div>
  );
};

export default AdminOrders;
