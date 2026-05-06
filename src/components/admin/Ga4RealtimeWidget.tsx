import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Activity, ShoppingBag, UserPlus, DollarSign, TrendingUp,
  ExternalLink, RefreshCw, CheckCircle2, AlertCircle, Settings2, BarChart3,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts';

interface Order {
  created_at: string;
  total: number | null;
  payment_status: string | null;
  status: string | null;
}

interface Metrics {
  purchases24h: number;
  purchases7d: number;
  revenue24h: number;
  signups24h: number;
  signups7d: number;
  hourly: { label: string; count: number; hour: number }[];
}

const isPaid = (o: { payment_status: string | null; status: string | null }) =>
  o.payment_status === 'paid' || o.status === 'completed' || o.status === 'delivered';

const Stat = ({ icon: Icon, iconBg, label, value, sub }: any) => (
  <div className="glass-card rounded-2xl p-4 relative overflow-hidden">
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
      style={{ background: iconBg }}
    >
      <Icon size={18} className="text-white" />
    </div>
    <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    {sub && <p className="text-[11px] text-muted-foreground/70 mt-1.5">{sub}</p>}
  </div>
);

const Ga4RealtimeWidget = ({ gaId }: { gaId: string }) => {
  const [m, setM] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    const now = Date.now();
    const since24 = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [orders24Res, orders7dRes, signups24Res, signups7dRes] = await Promise.all([
      supabase.from('orders').select('created_at,total,payment_status,status').gte('created_at', since24),
      supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', since7d),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', since24),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', since7d),
    ]);

    const orders24: Order[] = (orders24Res.data as any[]) || [];
    const revenue24h = orders24.reduce((s, o) => s + Number(o.total || 0), 0);

    // Build hourly buckets covering the last 24 hours, ending at the current hour.
    const buckets: { label: string; count: number; hour: number }[] = [];
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now - i * 60 * 60 * 1000);
      const h = d.getHours();
      buckets.push({ label: `${h}h`, hour: h, count: 0 });
    }
    orders24.forEach((o) => {
      const t = new Date(o.created_at).getTime();
      const idx = 23 - Math.floor((now - t) / (60 * 60 * 1000));
      if (idx >= 0 && idx < 24) buckets[idx].count += 1;
    });

    setM({
      purchases24h: orders24.length,
      purchases7d: orders7dRes.count || 0,
      revenue24h,
      signups24h: signups24Res.count || 0,
      signups7d: signups7dRes.count || 0,
      hourly: buckets,
    });
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  const connected = !!gaId && /^G-[A-Z0-9]+$/.test(gaId);

  const convRate = useMemo(() => {
    if (!m) return 0;
    const denom = m.purchases24h + m.signups24h;
    if (!denom) return 0;
    return (m.purchases24h / denom) * 100;
  }, [m]);

  const maxBar = useMemo(() => Math.max(1, ...(m?.hourly.map((b) => b.count) || [1])), [m]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--brand-h) 90% 60% / 0.2), hsl(var(--brand-h) 90% 50% / 0.1))',
              border: '1px solid hsl(var(--brand-h) 90% 60% / 0.3)',
            }}
          >
            <Activity size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">GA4 Realtime &amp; Conversions</h3>
            <p className="text-xs text-muted-foreground">Last 24h purchases, sign-ups &amp; GA4 tracking status</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={refreshing}
          className="px-3 py-2 rounded-lg text-xs font-medium bg-background hover:bg-muted/40 border border-border flex items-center gap-1.5 transition-colors disabled:opacity-60"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Tracking status card */}
      <div className="glass-card rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center ${connected ? 'bg-green-500/15 border-green-500/40' : 'bg-amber-500/15 border-amber-500/40'} border`}
          >
            {connected ? <CheckCircle2 size={20} className="text-green-500" /> : <AlertCircle size={20} className="text-amber-500" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-foreground text-sm">GA4 Tracking</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${connected ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}>
                {connected ? 'Active' : 'Not configured'}
              </span>
            </div>
            {connected && <p className="text-xs font-mono text-muted-foreground mt-0.5">{gaId}</p>}
            <p className="text-[11px] text-muted-foreground/80 mt-0.5">
              Auto-fires <code className="px-1 rounded bg-muted/40">page_view</code>, <code className="px-1 rounded bg-muted/40">purchase</code>, <code className="px-1 rounded bg-muted/40">sign_up</code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {connected && (
            <a
              href="https://analytics.google.com/analytics/web/#/p/realtime/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-glow px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5"
            >
              <ExternalLink size={11} /> Open GA4 Realtime
            </a>
          )}
          <a
            href="https://tagmanager.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-lg text-xs font-medium bg-background hover:bg-muted/40 border border-border flex items-center gap-1.5 transition-colors"
          >
            <Settings2 size={11} /> Manage Tags
          </a>
        </div>
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-muted/20 animate-pulse" />)}
        </div>
      ) : m && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat
            icon={ShoppingBag}
            iconBg="linear-gradient(135deg, #10b981, #059669)"
            label="Purchases (24h)"
            value={m.purchases24h}
            sub={`${m.purchases7d} in last 7 days`}
          />
          <Stat
            icon={DollarSign}
            iconBg="linear-gradient(135deg, #f59e0b, #d97706)"
            label="Revenue (24h)"
            value={`৳${m.revenue24h.toLocaleString()}`}
            sub="Confirmed + pending"
          />
          <Stat
            icon={UserPlus}
            iconBg="linear-gradient(135deg, #6366f1, #4f46e5)"
            label="Sign-ups (24h)"
            value={m.signups24h}
            sub={`${m.signups7d} in last 7 days`}
          />
          <Stat
            icon={TrendingUp}
            iconBg="linear-gradient(135deg, #ec4899, #db2777)"
            label="Conv. Rate (est.)"
            value={`${convRate.toFixed(1)}%`}
            sub="Purchases ÷ Sign-ups"
          />
        </div>
      )}

      {/* Hourly chart */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-primary" />
          <h4 className="text-sm font-bold text-foreground">Purchases — Last 24 hours</h4>
        </div>
        {loading || !m ? (
          <div className="h-48 rounded-xl bg-muted/20 animate-pulse" />
        ) : (
          <div className="h-48 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.hourly} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                  contentStyle={{
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: any) => [`${v} order${v === 1 ? '' : 's'}`, 'Purchases']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {m.hourly.map((b, i) => (
                    <Cell
                      key={i}
                      fill={b.count === 0 ? 'hsl(var(--muted) / 0.4)' : `hsl(var(--brand-h) 90% ${50 + (b.count / maxBar) * 15}%)`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Data sources */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">📊</span>
          <h4 className="text-sm font-bold text-foreground">Data Sources</h4>
        </div>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-primary mt-1">•</span>
            <span><strong className="text-foreground">Purchases &amp; Revenue:</strong> from your <code className="px-1 rounded bg-muted/40">orders</code> table (real-time, all orders incl. unpaid)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary mt-1">•</span>
            <span><strong className="text-foreground">Sign-ups:</strong> new user profiles created in window</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary mt-1">•</span>
            <span><strong className="text-foreground">GA4 Realtime:</strong> events fire client-side via <code className="px-1 rounded bg-muted/40">gtag.js</code> — view live in Google Analytics → Realtime</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary mt-1">•</span>
            <span><strong className="text-foreground">Auto-refresh:</strong> every 60 seconds</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Ga4RealtimeWidget;
