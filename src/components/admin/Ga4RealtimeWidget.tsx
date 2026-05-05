import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Activity, ShoppingCart, UserPlus, DollarSign, ExternalLink, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface Metrics {
  orders24h: number;
  revenue24h: number;
  paidOrders24h: number;
  signups24h: number;
  lastOrderAt: string | null;
  lastSignupAt: string | null;
}

const Stat = ({ icon: Icon, label, value, sub, tint }: any) => (
  <div className="glass-card rounded-2xl p-4 relative overflow-hidden group">
    <div
      className="absolute inset-0 opacity-30 pointer-events-none transition-opacity group-hover:opacity-50"
      style={{ background: `radial-gradient(circle at 80% 0%, hsl(var(--brand-h) ${tint}), transparent 60%)` }}
    />
    <div className="flex items-center justify-between mb-2 relative">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: `hsl(var(--brand-h) 90% 60% / 0.15)`, border: '1px solid hsl(var(--brand-h) 90% 60% / 0.3)' }}
      >
        <Icon size={16} className="text-primary" />
      </div>
    </div>
    <p className="text-xs text-muted-foreground mb-0.5 relative">{label}</p>
    <p className="text-xl font-bold text-foreground relative">{value}</p>
    {sub && <p className="text-[11px] text-muted-foreground/80 mt-1 relative">{sub}</p>}
  </div>
);

const Ga4RealtimeWidget = ({ gaId }: { gaId: string }) => {
  const [m, setM] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [ordersRes, signupsRes, lastOrderRes, lastSignupRes] = await Promise.all([
      supabase.from('orders').select('total,payment_status,status').gte('created_at', since),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('orders').select('created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('profiles').select('created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    const orders = ordersRes.data || [];
    const paid = orders.filter(o => o.payment_status === 'paid' || o.status === 'completed' || o.status === 'delivered');
    const revenue = paid.reduce((s, o: any) => s + Number(o.total || 0), 0);

    setM({
      orders24h: orders.length,
      revenue24h: revenue,
      paidOrders24h: paid.length,
      signups24h: signupsRes.count || 0,
      lastOrderAt: lastOrderRes.data?.created_at || null,
      lastSignupAt: lastSignupRes.data?.created_at || null,
    });
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  const fmtAgo = (iso: string | null) => {
    if (!iso) return '—';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const connected = !!gaId && /^G-[A-Z0-9]+$/.test(gaId);

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(var(--brand-h) 90% 60% / 0.2), hsl(var(--brand-h) 90% 50% / 0.1))', border: '1px solid hsl(var(--brand-h) 90% 60% / 0.3)' }}
            >
              <Activity size={18} className="text-primary" />
            </div>
            {connected && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 ring-2 ring-background animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              GA4 Realtime & 24h Conversions
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              {connected ? (
                <><CheckCircle2 size={12} className="text-green-500" /> Connected · <span className="font-mono">{gaId}</span></>
              ) : (
                <><AlertCircle size={12} className="text-amber-500" /> GA4 not configured</>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/30 hover:bg-muted/50 border border-border flex items-center gap-1.5 transition-colors disabled:opacity-60"
          >
            <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          {connected && (
            <a
              href={`https://analytics.google.com/analytics/web/#/p/realtime/overview`}
              target="_blank" rel="noopener noreferrer"
              className="btn-glow px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
            >
              <ExternalLink size={11} /> GA4 Realtime
            </a>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-muted/20 animate-pulse" />)}
        </div>
      ) : m && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat icon={ShoppingCart} label="Orders (24h)" value={m.orders24h} sub={`Last: ${fmtAgo(m.lastOrderAt)}`} tint="60% / 0.25" />
            <Stat icon={DollarSign} label="Revenue (24h)" value={`৳${m.revenue24h.toLocaleString()}`} sub={`${m.paidOrders24h} paid`} tint="50% / 0.25" />
            <Stat icon={CheckCircle2} label="Purchases (24h)" value={m.paidOrders24h} sub={m.orders24h ? `${Math.round((m.paidOrders24h / m.orders24h) * 100)}% conversion` : '—'} tint="55% / 0.2" />
            <Stat icon={UserPlus} label="Sign-ups (24h)" value={m.signups24h} sub={`Last: ${fmtAgo(m.lastSignupAt)}`} tint="65% / 0.2" />
          </div>
          <p className="text-[11px] text-muted-foreground/80 text-center pt-1">
            Auto-refreshes every 60s · Data from your store database
          </p>
        </>
      )}
    </div>
  );
};

export default Ga4RealtimeWidget;
