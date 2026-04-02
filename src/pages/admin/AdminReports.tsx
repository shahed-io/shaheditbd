import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, TrendingUp, ShoppingCart, Users, DollarSign, Package, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

const AdminReports = () => {
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalCustomers: 0, totalProducts: 0 });
  const [ordersByStatus, setOrdersByStatus] = useState<any[]>([]);
  const [recentRevenue, setRecentRevenue] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAll();
  }, [range]);

  const fetchAll = async () => {
    setLoading(true);
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const [ordersRes, customersRes, productsRes, orderItemsRes] = await Promise.all([
      supabase.from('orders').select('id, total, status, created_at').gte('created_at', since),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id, name, total_sales, price').order('total_sales', { ascending: false }).limit(5),
      supabase.from('order_items').select('product_name, quantity, total').limit(500),
    ]);

    const orders = ordersRes.data || [];
    const revenue = orders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.total || 0), 0);
    setStats({
      totalRevenue: revenue,
      totalOrders: orders.length,
      totalCustomers: (customersRes.data || []).length,
      totalProducts: (productsRes.data || []).length,
    });

    // Orders by status
    const statusMap: Record<string, number> = {};
    orders.forEach(o => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });
    setOrdersByStatus(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

    // Revenue by day
    const dayMap: Record<string, number> = {};
    orders.filter(o => o.status === 'completed').forEach(o => {
      const day = o.created_at.slice(0, 10);
      dayMap[day] = (dayMap[day] || 0) + (o.total || 0);
    });
    const sorted = Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date: date.slice(5), revenue }));
    setRecentRevenue(sorted);

    // Top products from order_items
    const productMap: Record<string, { name: string; sales: number; revenue: number }> = {};
    (orderItemsRes.data || []).forEach(item => {
      if (!productMap[item.product_name]) productMap[item.product_name] = { name: item.product_name, sales: 0, revenue: 0 };
      productMap[item.product_name].sales += item.quantity;
      productMap[item.product_name].revenue += item.total;
    });
    setTopProducts(Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5));

    setLoading(false);
  };

  const statCards = [
    { label: 'মোট রেভিনিউ', value: `৳${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-400/10', trend: '+12%' },
    { label: 'মোট অর্ডার', value: stats.totalOrders, icon: ShoppingCart, color: 'text-primary', bg: 'bg-primary/10', trend: '+8%' },
    { label: 'কাস্টমার', value: stats.totalCustomers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10', trend: '+5%' },
    { label: 'প্রোডাক্ট', value: stats.totalProducts, icon: Package, color: 'text-purple-400', bg: 'bg-purple-400/10', trend: '' },
  ];

  const statusColors: Record<string, string> = {
    completed: '#4ade80', pending: '#facc15', processing: '#60a5fa', cancelled: '#f87171', refunded: '#a78bfa'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Reports & <span className="gradient-text">Analytics</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">স্টোরের পারফরম্যান্স অ্যানালিটিক্স</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${range === r ? 'btn-glow' : 'glass-card text-muted-foreground hover:text-foreground'}`}>
              {r === '7d' ? '৭ দিন' : r === '30d' ? '৩০ দিন' : '৯০ দিন'}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="glass-card-hover rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon size={18} className={s.color} />
              </div>
              {s.trend && (
                <span className="text-xs text-green-400 flex items-center gap-0.5">
                  <ArrowUpRight size={12} />{s.trend}
                </span>
              )}
            </div>
            <div className="text-xl font-bold text-foreground">{loading ? '—' : s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" /> রেভিনিউ ট্রেন্ড
        </h3>
        {loading ? <div className="h-48 animate-pulse bg-muted/20 rounded-xl" /> : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={recentRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, color: 'hsl(var(--foreground))' }} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Orders by Status */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" /> অর্ডার স্ট্যাটাস
          </h3>
          {loading ? <div className="h-40 animate-pulse bg-muted/20 rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ordersByStatus}>
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, color: 'hsl(var(--foreground))' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {ordersByStatus.map((entry, index) => (
                    <rect key={index} fill={statusColors[entry.name] || 'hsl(var(--primary))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Products */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Package size={16} className="text-primary" /> টপ প্রোডাক্ট
          </h3>
          <div className="space-y-3">
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-9 animate-pulse bg-muted/20 rounded-xl" />
            )) : topProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">কোনো ডেটা নেই</p>
            ) : topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.sales} সেল</div>
                </div>
                <div className="text-sm font-semibold text-green-400">৳{p.revenue.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
