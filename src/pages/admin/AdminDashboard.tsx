import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  ShoppingCart, Package, Users, TrendingUp, DollarSign, Clock,
  CheckCircle, XCircle, ArrowUpRight, ArrowDownRight, Bell,
  AlertTriangle, Ticket, CreditCard, RefreshCw, Activity, Percent
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell
} from 'recharts';

interface Stats {
  todaySales: number;
  monthRevenue: number;
  yearRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  paymentPending: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  prevMonthRevenue: number;
  prevMonthOrders: number;
}

interface Notification {
  id: string;
  type: 'order' | 'ticket' | 'payment' | 'stock';
  message: string;
  time: string;
  read: boolean;
}

const toastStyle = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, color: 'hsl(var(--foreground))' };

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    todaySales: 0, monthRevenue: 0, yearRevenue: 0,
    totalOrders: 0, pendingOrders: 0, paymentPending: 0,
    deliveredOrders: 0, cancelledOrders: 0, totalCustomers: 0,
    totalRevenue: 0, prevMonthRevenue: 0, prevMonthOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [dailyChart, setDailyChart] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<any[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

    const [
      { data: allOrders },
      { data: profiles },
      { data: paymentProofs },
      { data: tickets },
      { data: products },
      { data: recentOrderData },
    ] = await Promise.all([
      supabase.from('orders').select('id, total, status, payment_status, payment_method, created_at, customer_name, customer_email, order_number'),
      supabase.from('profiles').select('id', { count: 'exact', head: false }),
      supabase.from('payment_proofs').select('id, status, submitted_at, order_id'),
      supabase.from('support_tickets').select('id, status, created_at, subject, ticket_number').order('created_at', { ascending: false }).limit(5),
      supabase.from('products').select('id, name, total_sales, price, stock_quantity, status'),
      supabase.from('orders').select('id, order_number, customer_name, customer_email, total, status, created_at').order('created_at', { ascending: false }).limit(8),
    ]);

    const orders = allOrders || [];

    // Stats calculations
    const todaySales = orders
      .filter(o => o.created_at >= todayStart && o.status !== 'cancelled')
      .reduce((s, o) => s + Number(o.total), 0);

    const monthRevenue = orders
      .filter(o => o.created_at >= monthStart && o.status !== 'cancelled')
      .reduce((s, o) => s + Number(o.total), 0);

    const prevMonthRevenue = orders
      .filter(o => o.created_at >= prevMonthStart && o.created_at < monthStart && o.status !== 'cancelled')
      .reduce((s, o) => s + Number(o.total), 0);

    const prevMonthOrders = orders.filter(o => o.created_at >= prevMonthStart && o.created_at < monthStart).length;

    const yearRevenue = orders
      .filter(o => o.created_at >= yearStart && o.status !== 'cancelled')
      .reduce((s, o) => s + Number(o.total), 0);

    const totalRevenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((s, o) => s + Number(o.total), 0);

    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const deliveredOrders = orders.filter(o => o.status === 'completed').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    const paymentPending = (paymentProofs || []).filter(p => p.status === 'pending').length;

    setStats({
      todaySales, monthRevenue, yearRevenue, totalOrders: orders.length,
      pendingOrders, paymentPending, deliveredOrders, cancelledOrders,
      totalCustomers: (profiles || []).length,
      totalRevenue, prevMonthRevenue, prevMonthOrders,
    });

    setRecentOrders(recentOrderData || []);

    // --- Build chart data ---
    buildChartData(orders, chartRange);

    // --- Best sellers ---
    const sortedProducts = [...(products || [])].sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0)).slice(0, 5);
    const maxSales = sortedProducts[0]?.total_sales || 1;
    setBestSellers(sortedProducts.map(p => ({ ...p, pct: Math.round(((p.total_sales || 0) / maxSales) * 100) })));

    // --- Payment Method Breakdown ---
    const pmCounts: Record<string, number> = {};
    const PM_LABELS: Record<string, string> = { bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket', upay: 'Upay', bkash_merchant: 'bKash Merchant' };
    const PM_COLORS = ['hsl(var(--primary))', '#e91e8a', '#8b5cf6', '#f59e0b', '#06b6d4', '#10b981'];
    orders.filter(o => o.status !== 'cancelled').forEach(o => {
      const pm = o.payment_method || 'other';
      pmCounts[pm] = (pmCounts[pm] || 0) + 1;
    });
    setPaymentBreakdown(Object.entries(pmCounts).map(([key, count], i) => ({
      name: PM_LABELS[key] || key,
      value: count,
      color: PM_COLORS[i % PM_COLORS.length],
    })));

    // --- Recent Customers ---
    const uniqueCustomers = new Map<string, any>();
    [...orders].sort((a, b) => b.created_at.localeCompare(a.created_at)).forEach(o => {
      if (!uniqueCustomers.has(o.customer_email)) {
        uniqueCustomers.set(o.customer_email, {
          name: o.customer_name,
          email: o.customer_email,
          lastOrder: o.created_at,
          totalSpent: orders.filter(x => x.customer_email === o.customer_email && x.status !== 'cancelled').reduce((s, x) => s + Number(x.total), 0),
          orderCount: orders.filter(x => x.customer_email === o.customer_email).length,
        });
      }
    });
    setRecentCustomers(Array.from(uniqueCustomers.values()).slice(0, 5));

    const notifs: Notification[] = [];
    const newOrders = orders.filter(o => o.created_at >= new Date(Date.now() - 24 * 3600 * 1000).toISOString());
    if (newOrders.length > 0) {
      notifs.push({ id: 'orders', type: 'order', message: `${newOrders.length} new order(s) in the last 24 hours`, time: 'Today', read: false });
    }
    if (paymentPending > 0) {
      notifs.push({ id: 'payments', type: 'payment', message: `${paymentPending} payment verification pending`, time: 'Action needed', read: false });
    }
    const newTickets = (tickets || []).filter(t => t.status === 'open');
    if (newTickets.length > 0) {
      notifs.push({ id: 'tickets', type: 'ticket', message: `${newTickets.length} open support ticket(s)`, time: 'Needs reply', read: false });
    }
    const lowStock = (products || []).filter(p => p.stock_quantity !== null && p.stock_quantity <= 5 && p.status === 'active');
    if (lowStock.length > 0) {
      notifs.push({ id: 'stock', type: 'stock', message: `${lowStock.length} product(s) with low stock (≤5)`, time: 'Check inventory', read: false });
    }
    setNotifications(notifs);
    setLastRefresh(new Date());
    setLoading(false);
  }, [chartRange]);

  const buildChartData = (orders: any[], range: 'daily' | 'weekly' | 'monthly') => {
    const now = new Date();
    const data: Record<string, { label: string; revenue: number; orders: number }> = {};

    if (range === 'daily') {
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString('en-BD', { month: 'short', day: 'numeric' });
        data[key] = { label, revenue: 0, orders: 0 };
      }
      orders.forEach(o => {
        const key = o.created_at.slice(0, 10);
        if (data[key] && o.status !== 'cancelled') {
          data[key].revenue += Number(o.total);
          data[key].orders++;
        }
      });
    } else if (range === 'weekly') {
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i * 7);
        const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay());
        const key = weekStart.toISOString().slice(0, 10);
        const label = `W${8 - i}`;
        data[key] = { label, revenue: 0, orders: 0 };
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toISOString().slice(0, 7);
        const label = d.toLocaleDateString('en-BD', { month: 'short', year: '2-digit' });
        data[key] = { label, revenue: 0, orders: 0 };
      }
      orders.forEach(o => {
        const key = o.created_at.slice(0, 7);
        if (data[key] && o.status !== 'cancelled') {
          data[key].revenue += Number(o.total);
          data[key].orders++;
        }
      });
    }
    setDailyChart(Object.values(data));
  };

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime new orders
  useEffect(() => {
    const channel = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        fetchAll();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payment_proofs' }, () => {
        fetchAll();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  const pct = (cur: number, prev: number) => prev === 0 ? null : ((cur - prev) / prev * 100).toFixed(1);
  const revenueGrowth = pct(stats.monthRevenue, stats.prevMonthRevenue);
  const ordersGrowth = pct(stats.totalOrders, stats.prevMonthOrders);

  const statusColor: Record<string, string> = {
    pending: 'text-yellow-500 bg-yellow-500/10',
    processing: 'text-blue-500 bg-blue-500/10',
    completed: 'text-green-500 bg-green-500/10',
    cancelled: 'text-destructive bg-destructive/10',
    refunded: 'text-purple-500 bg-purple-500/10',
  };

  const notifIcon: Record<string, { icon: any; color: string }> = {
    order: { icon: ShoppingCart, color: 'text-primary bg-primary/10' },
    payment: { icon: CreditCard, color: 'text-yellow-500 bg-yellow-500/10' },
    ticket: { icon: Ticket, color: 'text-blue-500 bg-blue-500/10' },
    stock: { icon: AlertTriangle, color: 'text-destructive bg-destructive/10' },
  };

  const StatCard = ({ label, value, icon: Icon, gradient, change, changePct, prefix = '', onClick }: any) => (
    <div
      className={`glass-card rounded-2xl p-5 transition-all duration-200 ${onClick ? 'cursor-pointer hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className="text-white" />
        </div>
        {changePct !== null && changePct !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${parseFloat(changePct) >= 0 ? 'text-green-500' : 'text-destructive'}`}>
            {parseFloat(changePct) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(parseFloat(changePct))}%
          </div>
        )}
      </div>
      <p className="text-muted-foreground text-xs mb-0.5">{label}</p>
      <p className="text-2xl font-bold text-foreground">
        {loading ? <span className="inline-block w-16 h-6 bg-muted/40 rounded animate-pulse" /> : `${prefix}${typeof value === 'number' ? value.toLocaleString() : value}`}
      </p>
      {change && <p className="text-xs text-muted-foreground mt-0.5">{change}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Dashboard <span className="gradient-text">Overview</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Real-time business snapshot · Last updated: {lastRefresh.toLocaleTimeString('en-BD')}
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="glass-card px-4 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Notification Panel ── */}
      {notifications.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={15} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">{notifications.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {notifications.map(n => {
              const { icon: NIcon, color } = notifIcon[n.type];
              return (
                <div key={n.id} className={`flex items-start gap-2.5 rounded-xl p-3 ${color} bg-opacity-10`}>
                  <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                    <NIcon size={13} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground leading-snug">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Row 1: Today + Key Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Sales" value={stats.todaySales} icon={TrendingUp} gradient="from-primary to-primary/60" prefix="৳" onClick={() => navigate('/ceo/orders?filter=today')} />
        <StatCard label="This Month Revenue" value={stats.monthRevenue} icon={DollarSign} gradient="from-purple-500 to-violet-600" prefix="৳" changePct={revenueGrowth} change="vs last month" onClick={() => navigate('/ceo/orders?filter=month')} />
        <StatCard label="This Year Revenue" value={stats.yearRevenue} icon={TrendingUp} gradient="from-green-500 to-emerald-600" prefix="৳" onClick={() => navigate('/ceo/orders?filter=year')} />
        <StatCard label="Total Revenue (All)" value={stats.totalRevenue} icon={DollarSign} gradient="from-orange-500 to-amber-500" prefix="৳" onClick={() => navigate('/ceo/orders')} />
      </div>

      {/* ── Row 2: Order Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, gradient: 'from-primary to-primary/70', changePct: ordersGrowth, onClick: () => navigate('/ceo/orders') },
          { label: 'Pending', value: stats.pendingOrders, icon: Clock, gradient: 'from-yellow-500 to-amber-500', onClick: () => navigate('/ceo/orders?status=pending') },
          { label: 'Payment Pending', value: stats.paymentPending, icon: CreditCard, gradient: 'from-orange-500 to-red-500', onClick: () => navigate('/ceo/orders?status=payment_pending') },
          { label: 'Delivered', value: stats.deliveredOrders, icon: CheckCircle, gradient: 'from-green-500 to-emerald-600', onClick: () => navigate('/ceo/orders?status=completed') },
          { label: 'Cancelled', value: stats.cancelledOrders, icon: XCircle, gradient: 'from-destructive to-red-700', onClick: () => navigate('/ceo/orders?status=cancelled') },
          { label: 'Customers', value: stats.totalCustomers, icon: Users, gradient: 'from-blue-500 to-cyan-500', onClick: () => navigate('/ceo/customers') },
        ].map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-foreground">Sales Overview</h3>
              {revenueGrowth !== null && (
                <p className={`text-xs mt-0.5 flex items-center gap-1 ${parseFloat(revenueGrowth) >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                  {parseFloat(revenueGrowth) >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                  {Math.abs(parseFloat(revenueGrowth))}% revenue growth vs last month
                </p>
              )}
            </div>
            <div className="flex gap-1">
              {(['daily', 'weekly', 'monthly'] as const).map(r => (
                <button key={r} onClick={() => setChartRange(r)}
                  className={`text-xs px-3 py-1 rounded-lg transition-colors capitalize ${chartRange === r ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyChart}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} width={55}
                tickFormatter={v => v >= 1000 ? `৳${(v / 1000).toFixed(0)}k` : `৳${v}`} />
              <Tooltip contentStyle={toastStyle} formatter={(v: any) => [`৳${Number(v).toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
          {/* Orders mini line */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Orders Count</p>
            <ResponsiveContainer width="100%" height={60}>
              <BarChart data={dailyChart}>
                <Bar dataKey="orders" fill="hsl(var(--primary) / 0.4)" radius={[3, 3, 0, 0]} />
                <Tooltip contentStyle={toastStyle} formatter={(v: any) => [v, 'Orders']} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best Sellers */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-4">Best Selling Products</h3>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-muted/30 rounded-xl animate-pulse" />)}</div>
          ) : bestSellers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {bestSellers.map((p, i) => (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-4">#{i + 1}</span>
                      <span className="text-xs text-foreground line-clamp-1 max-w-[140px]">{p.name}</span>
                    </div>
                    <span className="text-xs font-bold text-primary">{p.total_sales || 0}</span>
                  </div>
                  <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-700" style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Conversion Rate */}
          <div className="mt-5 pt-4 border-t border-border">
            <h4 className="text-xs font-semibold text-foreground mb-3">Conversion Stats</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Delivery Rate</span>
                <span className="font-bold text-foreground">
                  {stats.totalOrders ? Math.round((stats.deliveredOrders / stats.totalOrders) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Cancellation Rate</span>
                <span className="font-bold text-destructive">
                  {stats.totalOrders ? Math.round((stats.cancelledOrders / stats.totalOrders) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Avg Order Value</span>
                <span className="font-bold text-foreground">
                  ৳{stats.totalOrders ? Math.round(stats.totalRevenue / stats.totalOrders).toLocaleString() : 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Orders ── */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-foreground">Recent Orders</h3>
          <a href="/admin/orders" className="text-primary text-xs hover:underline">View All →</a>
        </div>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-muted/30 rounded-xl animate-pulse" />)}</div>
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
                    <td className="py-3 font-medium text-primary text-xs">{order.order_number}</td>
                    <td className="py-3">
                      <div className="font-medium text-foreground text-xs">{order.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                    </td>
                    <td className="py-3 hidden md:table-cell text-muted-foreground text-xs">
                      {new Date(order.created_at).toLocaleDateString('en-BD')}
                    </td>
                    <td className="py-3 font-bold text-foreground text-sm">৳{Number(order.total).toLocaleString()}</td>
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
