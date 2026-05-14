import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  FileText, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw,
  Database, Layers, Activity, Clock,
} from 'lucide-react';

interface SitemapEntry {
  path: string;
  lastSubmitted: string | null;
  lastDownloaded: string | null;
  isPending: boolean;
  isSitemapsIndex: boolean;
  type: string;
  errors: number;
  warnings: number;
  submitted: number;
  indexed: number;
}
interface Totals {
  sitemaps: number;
  submitted: number;
  indexed: number;
  errors: number;
  warnings: number;
  indexCoverage: number;
}
interface Data {
  siteUrl: string;
  sitemaps: SitemapEntry[];
  totals: Totals;
  fetchedAt: string;
}

const Stat = ({ icon: Icon, label, value, sub, accent }: any) => (
  <div className="glass-card rounded-2xl p-4 relative overflow-hidden">
    <div
      className="absolute inset-0 opacity-30 pointer-events-none"
      style={{ background: `radial-gradient(circle at 80% 0%, ${accent}, transparent 60%)` }}
    />
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center mb-2 relative"
      style={{ background: `${accent}26`, border: `1px solid ${accent}55` }}
    >
      <Icon size={16} style={{ color: accent }} />
    </div>
    <p className="text-xs text-muted-foreground mb-0.5 relative">{label}</p>
    <p className="text-xl font-bold text-foreground relative">{value}</p>
    {sub && <p className="text-[11px] text-muted-foreground/80 mt-1 relative">{sub}</p>}
  </div>
);

const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const SitemapStatusWidget = () => {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const { data: res, error: err } = await supabase.functions.invoke(
        'search-console-sitemap-status',
        { body: { siteUrl: 'sc-domain:shahedstore.com.bd' } },
      );
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

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--brand-h) 90% 60% / 0.2), hsl(var(--brand-h) 90% 50% / 0.1))',
              border: '1px solid hsl(var(--brand-h) 90% 60% / 0.3)',
            }}
          >
            <Database size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Indexing & Sitemap Status</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              {error ? (
                <><AlertCircle size={12} className="text-amber-500" /> {error.length > 80 ? 'GSC connector error' : error}</>
              ) : data ? (
                <><CheckCircle2 size={12} className="text-green-500" /> {data.siteUrl}</>
              ) : 'Loading…'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock size={11} /> {fmtDate(data.fetchedAt)}
            </span>
          )}
          <button
            onClick={load}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/30 hover:bg-muted/50 border border-border flex items-center gap-1.5 disabled:opacity-60"
          >
            <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[0, 1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-2xl bg-muted/20 animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-foreground">
          <p className="font-medium mb-1">⚠️ Could not fetch sitemap status</p>
          <p className="text-xs text-muted-foreground leading-relaxed break-all">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Make sure the Google Search Console connector is linked and the connected Google account has access to <code className="text-primary">shahedstore.com.bd</code> in Search Console.
          </p>
        </div>
      ) : data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Stat icon={Layers} label="Sitemaps" value={fmt(data.totals.sitemaps)} sub="Submitted to GSC" accent="hsl(220 90% 60%)" />
            <Stat icon={FileText} label="URLs Submitted" value={fmt(data.totals.submitted)} sub="From sitemaps" accent="hsl(260 90% 60%)" />
            <Stat icon={CheckCircle2} label="URLs Indexed" value={fmt(data.totals.indexed)} sub={`${data.totals.indexCoverage}% coverage`} accent="hsl(150 70% 45%)" />
            <Stat icon={AlertTriangle} label="Warnings" value={fmt(data.totals.warnings)} accent="hsl(40 95% 55%)" />
            <Stat icon={AlertCircle} label="Errors" value={fmt(data.totals.errors)} accent="hsl(0 80% 60%)" />
          </div>

          {/* Coverage bar */}
          <div className="bg-muted/10 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={12} /> Index Coverage
              </p>
              <span className="text-xs font-mono text-foreground">
                {fmt(data.totals.indexed)} / {fmt(data.totals.submitted)} ({data.totals.indexCoverage}%)
              </span>
            </div>
            <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${data.totals.indexCoverage}%`,
                  background: 'linear-gradient(90deg, hsl(150 70% 45%), hsl(var(--brand-h) 90% 60%))',
                }}
              />
            </div>
          </div>

          {/* Per-sitemap rows */}
          <div className="bg-muted/10 rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Submitted Sitemaps</h4>
              <span className="text-[11px] text-muted-foreground">{data.sitemaps.length} file{data.sitemaps.length === 1 ? '' : 's'}</span>
            </div>
            {data.sitemaps.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No sitemaps submitted yet. Submit <code className="text-primary">https://shahedstore.com.bd/sitemap.xml</code> in Search Console.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/20 text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Path</th>
                      <th className="text-right px-3 py-2 font-medium">Submitted</th>
                      <th className="text-right px-3 py-2 font-medium">Indexed</th>
                      <th className="text-right px-3 py-2 font-medium">Errors</th>
                      <th className="text-right px-3 py-2 font-medium">Warnings</th>
                      <th className="text-left px-4 py-2 font-medium">Last Submitted</th>
                      <th className="text-left px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sitemaps.map((sm) => {
                      const cov = sm.submitted > 0 ? Math.round((sm.indexed / sm.submitted) * 100) : 0;
                      const ok = sm.errors === 0 && !sm.isPending;
                      return (
                        <tr key={sm.path} className="border-t border-border/40">
                          <td className="px-4 py-2.5">
                            <a
                              href={sm.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-foreground hover:text-primary font-mono break-all"
                            >
                              {sm.path.replace(/^https?:\/\/[^/]+/, '')}
                            </a>
                            {sm.isSitemapsIndex && (
                              <span className="ml-2 text-[10px] uppercase text-muted-foreground">index</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-foreground">{fmt(sm.submitted)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-foreground">
                            {fmt(sm.indexed)}{' '}
                            <span className="text-muted-foreground">({cov}%)</span>
                          </td>
                          <td className={`px-3 py-2.5 text-right font-mono ${sm.errors > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {fmt(sm.errors)}
                          </td>
                          <td className={`px-3 py-2.5 text-right font-mono ${sm.warnings > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                            {fmt(sm.warnings)}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">{fmtDate(sm.lastSubmitted)}</td>
                          <td className="px-3 py-2.5">
                            {sm.isPending ? (
                              <span className="inline-flex items-center gap-1 text-amber-500">
                                <Clock size={11} /> Pending
                              </span>
                            ) : ok ? (
                              <span className="inline-flex items-center gap-1 text-green-500">
                                <CheckCircle2 size={11} /> Success
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-500">
                                <AlertCircle size={11} /> Issues
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SitemapStatusWidget;
