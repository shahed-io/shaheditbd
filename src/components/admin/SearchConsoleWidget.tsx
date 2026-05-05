import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, MousePointerClick, Eye, Percent, TrendingUp, RefreshCw, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Totals { clicks: number; impressions: number; ctr: number; position: number }
interface Row { query?: string; page?: string; clicks: number; impressions: number; ctr: number; position: number }
interface Daily { date: string; clicks: number; impressions: number }
interface Data { totals: Totals; daily: Daily[]; topQueries: Row[]; topPages: Row[]; siteUrl: string }

const Stat = ({ icon: Icon, label, value, sub, tint }: any) => (
  <div className="glass-card rounded-2xl p-4 relative overflow-hidden group">
    <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `radial-gradient(circle at 80% 0%, hsl(var(--brand-h) ${tint}), transparent 60%)` }} />
    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2 relative" style={{ background: `hsl(var(--brand-h) 90% 60% / 0.15)`, border: '1px solid hsl(var(--brand-h) 90% 60% / 0.3)' }}>
      <Icon size={16} className="text-primary" />
    </div>
    <p className="text-xs text-muted-foreground mb-0.5 relative">{label}</p>
    <p className="text-xl font-bold text-foreground relative">{value}</p>
    {sub && <p className="text-[11px] text-muted-foreground/80 mt-1 relative">{sub}</p>}
  </div>
);

const Sparkline = ({ daily, field }: { daily: Daily[]; field: 'clicks' | 'impressions' }) => {
  if (!daily.length) return null;
  const max = Math.max(...daily.map(d => d[field])) || 1;
  const w = 100, h = 30;
  const pts = daily.map((d, i) => `${(i / (daily.length - 1 || 1)) * w},${h - (d[field] / max) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8 mt-2" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="hsl(var(--brand-h) 90% 60%)" strokeWidth="1.5" />
    </svg>
  );
};

const SearchConsoleWidget = () => {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const { data: res, error: err } = await supabase.functions.invoke('search-console-performance', {
        body: { siteUrl: 'sc-domain:shahedstore.com.bd', days: 28 },
      });
      if (err) throw err;
      if (res?.error) throw new Error(res.error);
      setData(res);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fmt = (n: number) => n.toLocaleString();
  const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;
  const fmtPos = (n: number) => n.toFixed(1);

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(var(--brand-h) 90% 60% / 0.2), hsl(var(--brand-h) 90% 50% / 0.1))', border: '1px solid hsl(var(--brand-h) 90% 60% / 0.3)' }}>
            <Search size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Search Console — Last 28 Days</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              {error ? <><AlertCircle size={12} className="text-amber-500" /> {error.length > 80 ? 'Configure GSC API access' : error}</>
                     : data ? <><CheckCircle2 size={12} className="text-green-500" /> {data.siteUrl}</>
                     : 'Loading…'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={refreshing} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/30 hover:bg-muted/50 border border-border flex items-center gap-1.5 disabled:opacity-60">
            <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="btn-glow px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
            <ExternalLink size={11} /> Open GSC
          </a>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl bg-muted/20 animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-foreground">
          <p className="font-medium mb-1">⚠️ Search Console API connection required</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            To pull live performance data, add <code className="text-primary">GOOGLE_SERVICE_ACCOUNT_JSON</code> secret and grant the service account email read access in Search Console → Settings → Users and permissions.
          </p>
        </div>
      ) : data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Stat icon={MousePointerClick} label="Total Clicks" value={fmt(data.totals.clicks)} tint="60% / 0.25" />
              <Sparkline daily={data.daily} field="clicks" />
            </div>
            <div>
              <Stat icon={Eye} label="Impressions" value={fmt(data.totals.impressions)} tint="50% / 0.25" />
              <Sparkline daily={data.daily} field="impressions" />
            </div>
            <Stat icon={Percent} label="Average CTR" value={fmtPct(data.totals.ctr)} sub="Click-through rate" tint="55% / 0.2" />
            <Stat icon={TrendingUp} label="Avg Position" value={fmtPos(data.totals.position)} sub="Lower is better" tint="65% / 0.2" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-muted/10 rounded-xl border border-border p-3">
              <h4 className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">Top Queries</h4>
              <div className="space-y-1">
                {data.topQueries.slice(0, 8).map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-0">
                    <span className="truncate flex-1 text-foreground" title={r.query}>{r.query}</span>
                    <span className="text-muted-foreground ml-2 font-mono">{r.clicks}c · {r.impressions}i</span>
                  </div>
                ))}
                {!data.topQueries.length && <p className="text-xs text-muted-foreground">No queries yet</p>}
              </div>
            </div>
            <div className="bg-muted/10 rounded-xl border border-border p-3">
              <h4 className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">Top Pages</h4>
              <div className="space-y-1">
                {data.topPages.slice(0, 8).map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-0">
                    <span className="truncate flex-1 text-foreground" title={r.page}>{r.page?.replace(/^https?:\/\/[^/]+/, '') || '/'}</span>
                    <span className="text-muted-foreground ml-2 font-mono">{r.clicks}c · {r.impressions}i</span>
                  </div>
                ))}
                {!data.topPages.length && <p className="text-xs text-muted-foreground">No pages yet</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SearchConsoleWidget;
