import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, TrendingUp, ShoppingCart, Users, DollarSign, Package, ArrowUpRight, ArrowDownRight, Calendar, PieChart, Target, Repeat, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart as RePieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const COLORS = ['hsl(var(--primary))', '#4ade80', '#facc15', '#60a5fa', '#f87171', '#a78bfa', '#fb923c'];

const AdminReports = () => {
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalCustomers: 0, totalProducts: 0, avgOrderValue: 0, completionRate: 0, newCustomers: 0, repeatRate: 0 });
  const [ordersByStatus, setOrdersByStatus] = useState<any[]>([]);
  const [recentRevenue, setRecentRevenue] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [hourlyOrders, setHourlyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'7d' | '30d' | '90d' | '365d'>('30d');
  const [prevStats, setPrevStats] = useState({ totalRevenue: 0, totalOrders: 0, totalCustomers: 0 });

  useEffect(() => { fetchAll(); }, [range]);

  const fetchAll = async () => {
    setLoading(true);
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const prevSince = new Date(Date.now() - days * 2 * 86400000).toISOString();

    const [ordersRes, prevOrdersRes, customersRes, productsRes, orderItemsRes] = await Promise.all([
      supabase.from('orders').select('id, total, status, created_at, payment_method, user_id').gte('created_at', since),
      supabase.from('orders').select('id, total, status, created_at').gte('created_at', prevSince).lt('created_at', since),
      supabase.from('profiles').select('id, created_at').gte('created_at', since),
      supabase.from('products').select('id, name, total_sales, price').order('total_sales', { ascending: false }).limit(10),
      supabase.from('order_items').select('product_name, quantity, total'),
    ]);

    const orders = ordersRes.data || [];
    const prevOrders = prevOrdersRes.data || [];
    const completedOrders = orders.filter(o => o.status === 'completed');
    const revenue = completedOrders.reduce((s, o) => s + (o.total || 0), 0);
    const prevRevenue = prevOrders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.total || 0), 0);

    // Repeat customers
    const userOrderCounts: Record<string, number> = {};
    orders.forEach(o => { if (o.user_id) userOrderCounts[o.user_id] = (userOrderCounts[o.user_id] || 0) + 1; });
    const repeatCustomers = Object.values(userOrderCounts).filter(c => c > 1).length;
    const uniqueCustomers = Object.keys(userOrderCounts).length;

    setPrevStats({ totalRevenue: prevRevenue, totalOrders: prevOrders.length, totalCustomers: 0 });
    setStats({
      totalRevenue: revenue,
      totalOrders: orders.length,
      totalCustomers: (customersRes.data || []).length,
      totalProducts: (productsRes.data || []).length,
      avgOrderValue: completedOrders.length > 0 ? Math.round(revenue / completedOrders.length) : 0,
      completionRate: orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 0,
      newCustomers: (customersRes.data || []).length,
      repeatRate: uniqueCustomers > 0 ? Math.round((repeatCustomers / uniqueCustomers) * 100) : 0,
    });

    // Orders by status
    const statusMap: Record<string, number> = {};
    orders.forEach(o => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });
    setOrdersByStatus(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

    // Revenue by day
    const dayMap: Record<string, number> = {};
    completedOrders.forEach(o => {
      const day = o.created_at.slice(0, 10);
      dayMap[day] = (dayMap[day] || 0) + (o.total || 0);
    });
    const sorted = Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date: date.slice(5), revenue }));
    setRecentRevenue(sorted);

    // Payment methods
    const pmMap: Record<string, number> = {};
    orders.forEach(o => { const pm = o.payment_method || 'অজানা'; pmMap[pm] = (pmMap[pm] || 0) + 1; });
    setPaymentMethods(Object.entries(pmMap).map(([name, value]) => ({ name, value })));

    // Hourly distribution
    const hourMap: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourMap[i] = 0;
    orders.forEach(o => { const h = new Date(o.created_at).getHours(); hourMap[h]++; });
    setHourlyOrders(Object.entries(hourMap).map(([hour, count]) => ({ hour: `${hour}:00`, count })));

    // Top products
    const productMap: Record<string, { name: string; sales: number; revenue: number }> = {};
    (orderItemsRes.data || []).forEach(item => {
      if (!productMap[item.product_name]) productMap[item.product_name] = { name: item.product_name, sales: 0, revenue: 0 };
      productMap[item.product_name].sales += item.quantity;
      productMap[item.product_name].revenue += item.total;
    });
    setTopProducts(Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8));

    setLoading(false);
  };

  const calcTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const pct = Math.round(((current - previous) / previous) * 100);
    return pct >= 0 ? `+${pct}%` : `${pct}%`;
  };

  const revTrend = calcTrend(stats.totalRevenue, prevStats.totalRevenue);
  const orderTrend = calcTrend(stats.totalOrders, prevStats.totalOrders);

  const statCards = [
    { label: 'মোট রেভিনিউ', value: `৳${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-400/10', trend: revTrend },
    { label: 'মোট অর্ডার', value: stats.totalOrders, icon: ShoppingCart, color: 'text-primary', bg: 'bg-primary/10', trend: orderTrend },
    { label: 'গড় অর্ডার ভ্যালু', value: `৳${stats.avgOrderValue.toLocaleString()}`, icon: Target, color: 'text-amber-400', bg: 'bg-amber-400/10', trend: '' },
    { label: 'নতুন কাস্টমার', value: stats.newCustomers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10', trend: '' },
    { label: 'কমপ্লিশন রেট', value: `${stats.completionRate}%`, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-400/10', trend: '' },
    { label: 'রিপিট রেট', value: `${stats.repeatRate}%`, icon: Repeat, color: 'text-pink-400', bg: 'bg-pink-400/10', trend: '' },
  ];

  const statusColors: Record<string, string> = {
    completed: '#4ade80', pending: '#facc15', processing: '#60a5fa', cancelled: '#f87171', refunded: '#a78bfa', delivered: '#2dd4bf', failed: '#fb923c'
  };

  const tooltipStyle = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, color: 'hsl(var(--foreground))' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Advanced <span className="gradient-text">Analytics</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">স্টোরের পারফরম্যান্স ও ইনসাইট</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '365d'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${range === r ? 'btn-glow' : 'glass-card text-muted-foreground hover:text-foreground'}`}>
              {r === '7d' ? '৭ দিন' : r === '30d' ? '৩০ দিন' : r === '90d' ? '৯০ দিন' : '১ বছর'}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="glass-card-hover rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon size={16} className={s.color} />
              </div>
              {s.trend && (
                <span className={`text-xs flex items-center gap-0.5 ${s.trend.startsWith('+') ? 'text-green-400' : s.trend.startsWith('-') ? 'text-red-400' : 'text-muted-foreground'}`}>
                  {s.trend.startsWith('+') ? <ArrowUpRight size={11} /> : s.trend.startsWith('-') ? <ArrowDownRight size={11} /> : null}
                  {s.trend}
                </span>
              )}
            </div>
            <div className="text-lg font-bold text-foreground">{loading ? '—' : s.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" /> রেভিনিউ ট্রেন্ড
        </h3>
        {loading ? <div className="h-52 animate-pulse bg-muted/20 rounded-xl" /> : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={recentRevenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Orders by Status */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" /> অর্ডার স্ট্যাটাস
          </h3>
          {loading ? <div className="h-44 animate-pulse bg-muted/20 rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ordersByStatus}>
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {ordersByStatus.map((entry, index) => (
                    <Cell key={index} fill={statusColors[entry.name] || 'hsl(var(--primary))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment Methods Pie */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <PieChart size={16} className="text-primary" /> পেমেন্ট মেথড
          </h3>
          {loading ? <div className="h-44 animate-pulse bg-muted/20 rounded-xl" /> : paymentMethods.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-12">কোনো ডেটা নেই</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <RePieChart>
                  <Pie data={paymentMethods} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {paymentMethods.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </RePieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {paymentMethods.map((pm, i) => (
                  <div key={pm.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-foreground flex-1 truncate">{pm.name}</span>
                    <span className="text-muted-foreground font-medium">{pm.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hourly Distribution */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Clock size={16} className="text-primary" /> ঘণ্টাভিত্তিক অর্ডার
          </h3>
          {loading ? <div className="h-44 animate-pulse bg-muted/20 rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourlyOrders}>
                <XAxis dataKey="hour" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} interval={2} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Products */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Package size={16} className="text-primary" /> টপ প্রোডাক্ট
          </h3>
          <div className="space-y-2.5">
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-9 animate-pulse bg-muted/20 rounded-xl" />
            )) : topProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">কোনো ডেটা নেই</p>
            ) : topProducts.map((p, i) => {
              const maxRev = topProducts[0]?.revenue || 1;
              return (
                <div key={p.name} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="text-xs font-medium text-foreground truncate flex-1">{p.name}</span>
                    <span className="text-xs font-semibold text-green-400">৳{p.revenue.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden ml-7">
                    <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${(p.revenue / maxRev) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
