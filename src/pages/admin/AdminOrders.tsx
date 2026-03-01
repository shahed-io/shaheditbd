import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, Eye, Edit, Check, X, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { handleDbError } from '@/lib/errorHandler';

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
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

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

  const updateStatus = async (id: string, status: string) => {
    setUpdatingStatus(id);
    const { error } = await supabase.from('orders').update({ status: status as any }).eq('id', id);
    if (error) toast.error(handleDbError(error));
    else { toast.success('Order status updated!'); fetchOrders(); if (selectedOrder?.id === id) setSelectedOrder({...selectedOrder, status}); }
    setUpdatingStatus(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          Orders <span className="gradient-text">Management</span>
        </h1>
        <p className="text-muted-foreground text-sm">{orders.length} total orders</p>
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
          <div className="glass-card rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">Order #{selectedOrder.order_number}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Customer:</span><div className="font-medium text-foreground">{selectedOrder.customer_name}</div></div>
                <div><span className="text-muted-foreground">Email:</span><div className="font-medium text-foreground">{selectedOrder.customer_email}</div></div>
                <div><span className="text-muted-foreground">Phone:</span><div className="font-medium text-foreground">{selectedOrder.customer_phone || '-'}</div></div>
                <div><span className="text-muted-foreground">Payment:</span><div className="font-medium text-foreground capitalize">{selectedOrder.payment_method}</div></div>
                <div><span className="text-muted-foreground">Total:</span><div className="font-bold text-primary">৳{Number(selectedOrder.total).toLocaleString()}</div></div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <select value={selectedOrder.status} onChange={e => updateStatus(selectedOrder.id, e.target.value)}
                    className="mt-1 bg-muted/30 border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary w-full">
                    {['pending', 'processing', 'completed', 'cancelled', 'refunded'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              {selectedOrder.notes && (
                <div className="glass-card rounded-xl p-3 text-sm text-muted-foreground">{selectedOrder.notes}</div>
              )}
              {selectedOrder.order_items?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Order Items</p>
                  <div className="space-y-2">
                    {selectedOrder.order_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center glass-card rounded-xl p-3 text-sm">
                        <span className="text-foreground">{item.product_name} × {item.quantity}</span>
                        <span className="font-bold text-primary">৳{Number(item.total).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
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
                      <select
                        value={order.status}
                        onChange={e => updateStatus(order.id, e.target.value)}
                        disabled={updatingStatus === order.id}
                        className={`px-2 py-1 rounded-lg text-xs font-medium border capitalize bg-transparent cursor-pointer ${statusColor[order.status] || ''}`}
                      >
                        {['pending', 'processing', 'completed', 'cancelled', 'refunded'].map(s => (
                          <option key={s} value={s} className="bg-card text-foreground">{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs capitalize">{order.payment_method}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button onClick={() => setSelectedOrder(order)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
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
