import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  Users, Search, RefreshCw, Eye, ShoppingBag,
  Mail, Phone, Calendar, TrendingUp, UserCheck, Award, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

type Customer = {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  order_count?: number;
  total_spent?: number;
  last_order?: string | null;
  points_balance?: number;
  total_points_earned?: number;
  total_points_redeemed?: number;
};

type Order = {
  id: string;
  order_number: string;
  total: number;
  status: string;
  payment_status: string | null;
  created_at: string;
};

export default function AdminCustomers() {
  const [search, setSearch]       = useState('');
  const [sort, setSort]           = useState('newest');
  const [selected, setSelected]   = useState<Customer | null>(null);
  const [custOrders, setCustOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const { data: customers = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*, points_balance, total_points_earned')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Get order aggregates per user
      const { data: orders } = await supabase
        .from('orders')
        .select('user_id, total, created_at')
        .not('user_id', 'is', null);

      const orderMap: Record<string, { count: number; total: number; last: string }> = {};
      (orders ?? []).forEach(o => {
        if (!o.user_id) return;
        if (!orderMap[o.user_id]) orderMap[o.user_id] = { count: 0, total: 0, last: '' };
        orderMap[o.user_id].count++;
        orderMap[o.user_id].total += Number(o.total);
        if (!orderMap[o.user_id].last || o.created_at > orderMap[o.user_id].last)
          orderMap[o.user_id].last = o.created_at;
      });

      return (profiles ?? []).map(p => ({
        ...p,
        order_count: orderMap[p.user_id]?.count ?? 0,
        total_spent: orderMap[p.user_id]?.total ?? 0,
        last_order:  orderMap[p.user_id]?.last  ?? null,
        points_balance: (p as any).points_balance ?? 0,
        total_points_earned: (p as any).total_points_earned ?? 0,
      })) as Customer[];
    },
  });

  const openDetail = async (c: Customer) => {
    setSelected(c);
    setLoadingOrders(true);
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, total, status, payment_status, created_at')
      .eq('user_id', c.user_id)
      .order('created_at', { ascending: false });
    setCustOrders((data ?? []) as Order[]);
    setLoadingOrders(false);
  };

  const filtered = customers
    .filter(c => {
      const q = search.toLowerCase();
      return !q
        || (c.display_name ?? '').toLowerCase().includes(q)
        || (c.email ?? '').toLowerCase().includes(q)
        || (c.phone ?? '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === 'newest')    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === 'oldest')    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sort === 'top_spend') return (b.total_spent ?? 0) - (a.total_spent ?? 0);
      if (sort === 'top_orders') return (b.order_count ?? 0) - (a.order_count ?? 0);
      return 0;
    });

  const totalRevenue = customers.reduce((s, c) => s + (c.total_spent ?? 0), 0);
  const activeCustomers = customers.filter(c => (c.order_count ?? 0) > 0).length;

  const statusColor: Record<string, string> = {
    pending:    'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
    processing: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    completed:  'bg-green-500/15 text-green-500 border-green-500/30',
    cancelled:  'bg-destructive/15 text-destructive border-destructive/30',
    refunded:   'bg-muted text-muted-foreground border-border',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users size={24} className="text-primary" />
            Customers
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registered customer accounts & order history</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Customers', value: customers.length,     icon: Users,      color: 'text-primary' },
          { label: 'Active Buyers',   value: activeCustomers,      icon: UserCheck,  color: 'text-green-500' },
          { label: 'Total Orders',    value: customers.reduce((s, c) => s + (c.order_count ?? 0), 0), icon: ShoppingBag, color: 'text-blue-500' },
          { label: 'Total Revenue',   value: `৳${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-yellow-500' },
          { label: 'Total Points',    value: customers.reduce((s, c) => s + (c.points_balance ?? 0), 0).toLocaleString() + ' pts', icon: Award, color: 'text-amber-500' },
        ].map(stat => (
          <div key={stat.label} className="glass-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={16} className={stat.color} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-muted/30"
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-44 bg-muted/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="top_spend">Top Spenders</SelectItem>
            <SelectItem value="top_orders">Most Orders</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl border border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <RefreshCw size={20} className="animate-spin mr-2" /> Loading customers...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users size={26} className="text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  {['Customer', 'Contact', 'Joined', 'Orders', 'Total Spent', 'Points', 'Last Order', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} className={`border-b border-border/30 hover:bg-muted/20 transition-colors ${i % 2 ? 'bg-muted/10' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-background text-xs font-bold flex-shrink-0">
                          {(c.display_name ?? c.email ?? '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-foreground text-xs">{c.display_name ?? 'No Name'}</div>
                          <div className="text-[10px] text-muted-foreground">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.phone
                        ? <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone size={11} />{c.phone}</span>
                        : <span className="text-xs text-muted-foreground/50">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(c.created_at), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                        (c.order_count ?? 0) > 0
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        <ShoppingBag size={10} />
                        {c.order_count ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground text-xs">
                      {(c.total_spent ?? 0) > 0 ? `৳${(c.total_spent ?? 0).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {(c.points_balance ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border bg-amber-500/10 text-amber-600 border-amber-400/30">
                          <Award size={10} /> {(c.points_balance ?? 0).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {c.last_order ? format(new Date(c.last_order), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" onClick={() => openDetail(c)} className="h-7 text-xs gap-1">
                        <Eye size={12} /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-background font-bold">
                {(selected?.display_name ?? selected?.email ?? '?')[0]?.toUpperCase()}
              </div>
              {selected?.display_name ?? 'Customer Detail'}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              {/* Info */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Mail,      label: 'Email',    value: selected.email ?? '—' },
                  { icon: Phone,     label: 'Phone',    value: selected.phone ?? '—' },
                  { icon: Calendar,  label: 'Joined',   value: format(new Date(selected.created_at), 'dd MMM yyyy') },
                  { icon: ShoppingBag, label: 'Orders', value: String(selected.order_count ?? 0) },
                  { icon: TrendingUp,  label: 'Total Spent', value: `৳${(selected.total_spent ?? 0).toLocaleString()}` },
                  { icon: Award,       label: 'Points Balance', value: `${(selected.points_balance ?? 0).toLocaleString()} pts` },
                  { icon: Star,        label: 'Total Earned',   value: `${(selected.total_points_earned ?? 0).toLocaleString()} pts` },
                  { icon: Calendar,  label: 'Last Order', value: selected.last_order ? format(new Date(selected.last_order), 'dd MMM yyyy') : '—' },
                ].map(item => (
                  <div key={item.label} className="glass-card rounded-lg p-3 border border-border/50">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-semibold mb-1">
                      <item.icon size={11} />{item.label}
                    </div>
                    <div className="text-sm font-medium text-foreground truncate">{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Order history */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Order History</div>
                {loadingOrders ? (
                  <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                    <RefreshCw size={14} className="animate-spin" /> Loading orders...
                  </div>
                ) : custOrders.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-4 text-center glass-card rounded-lg border border-border/50">
                    No orders yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {custOrders.map(o => (
                      <div key={o.id} className="flex items-center justify-between glass-card rounded-lg px-3 py-2.5 border border-border/50">
                        <div>
                          <div className="text-xs font-semibold text-foreground">{o.order_number}</div>
                          <div className="text-[10px] text-muted-foreground">{format(new Date(o.created_at), 'dd MMM yyyy, hh:mm a')}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColor[o.status] ?? 'bg-muted text-muted-foreground border-border'}`}>
                            {o.status}
                          </span>
                          <span className="text-xs font-bold text-primary">৳{Number(o.total).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
