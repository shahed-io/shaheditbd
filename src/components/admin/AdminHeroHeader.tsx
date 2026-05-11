import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  ShoppingCart, DollarSign, Users, AlertTriangle,
  TrendingUp, Activity, type LucideIcon,
} from 'lucide-react';

interface AdminHeroHeaderProps {
  title: string;
  section: string;
  Icon: LucideIcon;
  /** Optional decorative icons that drift in the background */
  decorIcons?: LucideIcon[];
}

interface LiveStats {
  ordersToday: number;
  revenueToday: number;
  newCustomers: number;
  lowStock: number;
}

const fetchLiveStats = async (): Promise<LiveStats> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const iso = startOfDay.toISOString();

  const [ordersRes, customersRes, lowStockRes] = await Promise.all([
    supabase
      .from('orders')
      .select('total, created_at')
      .gte('created_at', iso),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', iso),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .lte('stock_quantity', 5)
      .not('stock_quantity', 'is', null),
  ]);

  const orders = ordersRes.data || [];
  const revenue = orders.reduce((s, o: any) => s + Number(o.total || 0), 0);

  return {
    ordersToday: orders.length,
    revenueToday: revenue,
    newCustomers: customersRes.count || 0,
    lowStock: lowStockRes.count || 0,
  };
};

const formatBDT = (n: number) => {
  if (n >= 100000) return `৳${(n / 1000).toFixed(0)}k`;
  return `৳${Math.round(n).toLocaleString('en-BD')}`;
};

const StatChip = ({
  Icon, label, value, accent,
}: {
  Icon: LucideIcon;
  label: string;
  value: string | number;
  accent: 'violet' | 'emerald' | 'amber' | 'rose';
}) => {
  const accents: Record<string, string> = {
    violet: 'from-violet-500/15 to-fuchsia-500/10 text-violet-700 dark:text-violet-300 ring-violet-300/40',
    emerald: 'from-emerald-500/15 to-teal-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-300/40',
    amber: 'from-amber-500/15 to-orange-500/10 text-amber-700 dark:text-amber-300 ring-amber-300/40',
    rose: 'from-rose-500/15 to-pink-500/10 text-rose-700 dark:text-rose-300 ring-rose-300/40',
  };
  return (
    <div
      className={`relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gradient-to-br ${accents[accent]} ring-1 backdrop-blur-md min-w-[92px]`}
    >
      <Icon size={14} strokeWidth={2.5} className="flex-shrink-0" />
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-[9px] font-bold uppercase tracking-wider opacity-70 truncate">{label}</span>
        <span className="text-xs font-extrabold tabular-nums truncate">{value}</span>
      </div>
    </div>
  );
};

const AdminHeroHeader = ({ title, section, Icon, decorIcons }: AdminHeroHeaderProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-hero-live-stats'],
    queryFn: fetchLiveStats,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const decor = decorIcons && decorIcons.length > 0 ? decorIcons : [Icon, TrendingUp, Activity];

  return (
    <div className="admin-hero-header">
      {/* Floating animated gradient blobs */}
      <div className="admin-hero-blob admin-hero-blob-1" aria-hidden />
      <div className="admin-hero-blob admin-hero-blob-2" aria-hidden />
      <div className="admin-hero-blob admin-hero-blob-3" aria-hidden />

      {/* Drifting decorative icons (page-specific illustration vibe) */}
      <div className="admin-hero-decor" aria-hidden>
        {decor.map((D, i) => (
          <D key={i} className={`admin-hero-decor-icon admin-hero-decor-${i + 1}`} />
        ))}
      </div>

      {/* Header content */}
      <div className="admin-hero-content">
        <div className="admin-hero-icon">
          <Icon />
        </div>
        <div className="admin-hero-text">
          <h1>{title}</h1>
          <p className="admin-hero-subtitle">
            {section ? `${section} • Manage and configure ${title.toLowerCase()}` : 'Welcome to your admin panel'}
          </p>
        </div>

        {/* Live stat widgets */}
        <div className="admin-hero-stats">
          <StatChip
            Icon={ShoppingCart}
            label="Orders Today"
            value={isLoading ? '…' : data?.ordersToday ?? 0}
            accent="violet"
          />
          <StatChip
            Icon={DollarSign}
            label="Revenue"
            value={isLoading ? '…' : formatBDT(data?.revenueToday ?? 0)}
            accent="emerald"
          />
          <StatChip
            Icon={Users}
            label="New Users"
            value={isLoading ? '…' : data?.newCustomers ?? 0}
            accent="amber"
          />
          <StatChip
            Icon={AlertTriangle}
            label="Low Stock"
            value={isLoading ? '…' : data?.lowStock ?? 0}
            accent="rose"
          />
        </div>
      </div>

      {/* Live pulse indicator */}
      <div className="admin-hero-live">
        <span className="admin-hero-live-dot" />
        LIVE
      </div>
    </div>
  );
};

export default AdminHeroHeader;
