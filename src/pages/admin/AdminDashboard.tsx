import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, Package, Users, TrendingUp, DollarSign, Clock, CheckCircle, XCircle, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const revenueData = [
  { month: 'Jan', revenue: 42000, orders: 28 },
  { month: 'Feb', revenue: 58000, orders: 35 },
  { month: 'Mar', revenue: 73000, orders: 52 },
  { month: 'Apr', revenue: 65000, orders: 44 },
  { month: 'May', revenue: 89000, orders: 61 },
  { month: 'Jun', revenue: 112000, orders: 78 },
  { month: 'Jul', revenue: 98000, orders: 69 },
];

const categoryData = [
  { name: 'Windows', value: 35, color: '#00b4d8' },
  { name: 'Office', value: 28, color: '#7c3aed' },
  { name: 'Adobe', value: 18, color: '#ef4444' },
  { name: 'Subscription', value: 12, color: '#f59e0b' },
  { name: 'Others', value: 7, color: '#10b981' },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState({ products: 0, orders: 0, customers: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: products }, { count: orders }, { data: orderData }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('id, order_number, customer_name, customer_email, total, status, created_at').order('created_at', { ascending: false }).limit(8),
      ]);
      setStats(prev => ({ ...prev, products: products || 0, orders: orders || 0 }));
      setRecentOrders(orderData || []);
      setLoading(false);
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Products', value: stats.products, icon: Package, color: 'from-blue-500 to-cyan-500', change: '+12%' },
    { label: 'Total Orders', value: stats.orders, icon: ShoppingCart, color: 'from-purple-500 to-violet-600', change: '+8%' },
    { label: 'Customers', value: stats.customers, icon: Users, color: 'from-green-500 to-emerald-600', change: '+23%' },
    { label: 'Revenue (৳)', value: `${(112000).toLocaleString()}`, icon: DollarSign, color: 'from-orange-500 to-amber-500', change: '+15%' },
  ];

  const statusColor: Record<string, string> = {
    pending: 'text-yellow-400 bg-yellow-400/10',
    processing: 'text-blue-400 bg-blue-400/10',
    completed: 'text-green-400 bg-green-400/10',
    cancelled: 'text-red-400 bg-red-400/10',
    refunded: 'text-purple-400 bg-purple-400/10',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          Dashboard <span className="gradient-text">Overview</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">Welcome back, Admin! Here's what's happening today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-xs mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{loading ? '...' : stat.value}</p>
                <div className="flex items-center gap-1 mt-1 text-green-400 text-xs font-medium">
                  <ArrowUpRight size={12} />
                  {stat.change} this month
                </div>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0`}>
                <stat.icon size={20} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-foreground">Monthly Revenue</h3>
            <span className="text-xs text-muted-foreground glass-card px-3 py-1 rounded-full">Last 7 months</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, color: 'hsl(var(--foreground))' }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-5">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {categoryData.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                  <span className="text-muted-foreground">{c.name}</span>
                </div>
                <span className="font-medium text-foreground">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-foreground">Recent Orders</h3>
          <a href="/admin/orders" className="text-primary text-xs hover:underline">View All →</a>
        </div>
        {loading ? (
          <div className="space-y-3">
            {Array.from({length: 5}).map((_, i) => (
              <div key={i} className="h-12 bg-muted/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
            <p>No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs border-b border-border">
                  <th className="text-left pb-3 font-medium">Order #</th>
                  <th className="text-left pb-3 font-medium">Customer</th>
                  <th className="text-left pb-3 font-medium hidden md:table-cell">Date</th>
                  <th className="text-left pb-3 font-medium">Total</th>
                  <th className="text-left pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 font-medium text-primary">{order.order_number}</td>
                    <td className="py-3">
                      <div className="font-medium text-foreground">{order.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                    </td>
                    <td className="py-3 hidden md:table-cell text-muted-foreground text-xs">
                      {new Date(order.created_at).toLocaleDateString('en-BD')}
                    </td>
                    <td className="py-3 font-bold text-foreground">৳{Number(order.total).toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColor[order.status] || 'text-muted-foreground'}`}>
                        {order.status}
                      </span>
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

export default AdminDashboard;
