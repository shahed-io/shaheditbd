import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Activity, RefreshCw, ExternalLink, CheckCircle2, AlertTriangle,
  XCircle, FileText, Image as ImageIcon, Rss, Globe, Search,
  Database, Code2, Send, Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface SitemapStat { name: string; url: string; count: number; status: 'ok' | 'fail' | 'loading'; lastFetch?: string; }
interface PingLog { id: string; entity: 'product' | 'blog'; title: string; slug: string; updated_at: string; }
interface SchemaCheck { type: string; present: boolean; valid: boolean; note?: string; }

const SITE = 'https://shahedstore.com.bd';

const Card = ({ children, className = '' }: any) => (
  <div className={`rounded-2xl border border-border bg-card/80 backdrop-blur-md p-5 shadow-sm ${className}`}>
    {children}
  </div>
);

const StatusBadge = ({ status }: { status: 'ok' | 'fail' | 'loading' | 'warn' }) => {
  if (status === 'loading') return <span className="text-xs text-muted-foreground flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" />Checking…</span>;
  if (status === 'ok') return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 w-fit"><CheckCircle2 className="h-3 w-3" />OK</span>;
  if (status === 'warn') return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1 w-fit"><AlertTriangle className="h-3 w-3" />Warning</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 flex items-center gap-1 w-fit"><XCircle className="h-3 w-3" />Failed</span>;
};

const AdminSEOMonitor = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [sitemaps, setSitemaps] = useState<SitemapStat[]>([
    { name: 'sitemap.xml', url: `${SITE}/sitemap.xml`, count: 0, status: 'loading' },
    { name: 'image-sitemap.xml', url: `${SITE}/image-sitemap.xml`, count: 0, status: 'loading' },
    { name: 'rss.xml', url: `${SITE}/rss.xml`, count: 0, status: 'loading' },
    { name: 'robots.txt', url: `${SITE}/robots.txt`, count: 0, status: 'loading' },
  ]);

  const [dbStats, setDbStats] = useState({
    products: 0, productsWithSeo: 0, productsWithSlug: 0,
    blogs: 0, blogsPublished: 0, blogsWithSeo: 0,
  });

  const [recentPings, setRecentPings] = useState<PingLog[]>([]);
  const [schemaChecks, setSchemaChecks] = useState<SchemaCheck[]>([]);
  const [pinging, setPinging] = useState(false);

  /* ───────── fetchers ───────── */
  const fetchSitemaps = useCallback(async () => {
    const updated = await Promise.all(sitemaps.map(async (s) => {
      try {
        const r = await fetch(s.url, { cache: 'no-store' });
        if (!r.ok) return { ...s, status: 'fail' as const, count: 0, lastFetch: new Date().toISOString() };
        const text = await r.text();
        let count = 0;
        if (s.name.endsWith('.xml')) {
          count = (text.match(/<url>|<item>/g) || []).length;
        } else {
          count = text.split('\n').filter(l => l.trim().toLowerCase().startsWith('sitemap:')).length;
        }
        return { ...s, status: 'ok' as const, count, lastFetch: new Date().toISOString() };
      } catch {
        return { ...s, status: 'fail' as const, count: 0, lastFetch: new Date().toISOString() };
      }
    }));
    setSitemaps(updated);
  }, []);

  const fetchDbStats = useCallback(async () => {
    const [{ count: pTotal }, { count: pSeo }, { count: pSlug }, { count: bTotal }, { count: bPub }, { count: bSeo }] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }).not('seo_title', 'is', null),
      supabase.from('products').select('*', { count: 'exact', head: true }).not('slug', 'is', null),
      supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
      supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('blog_posts').select('*', { count: 'exact', head: true }).not('seo_title', 'is', null),
    ]);
    setDbStats({
      products: pTotal || 0, productsWithSeo: pSeo || 0, productsWithSlug: pSlug || 0,
      blogs: bTotal || 0, blogsPublished: bPub || 0, blogsWithSeo: bSeo || 0,
    });
  }, []);

  const fetchRecentPings = useCallback(async () => {
    // Recent product/blog updates = recent ping events (DB triggers fire on these)
    const [{ data: prods }, { data: posts }] = await Promise.all([
      supabase.from('products').select('id,name,slug,updated_at').eq('status', 'active').not('slug', 'is', null).order('updated_at', { ascending: false }).limit(8),
      supabase.from('blog_posts').select('id,title,slug,updated_at').eq('status', 'published').not('slug', 'is', null).order('updated_at', { ascending: false }).limit(8),
    ]);
    const all: PingLog[] = [
      ...(prods || []).map((p: any) => ({ id: p.id, entity: 'product' as const, title: p.name, slug: p.slug, updated_at: p.updated_at })),
      ...(posts || []).map((p: any) => ({ id: p.id, entity: 'blog' as const, title: p.title, slug: p.slug, updated_at: p.updated_at })),
    ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 12);
    setRecentPings(all);
  }, []);

  const validateSchema = useCallback(async () => {
    try {
      const r = await fetch(`https://dpvdavjwqyviredzoorj.supabase.co/functions/v1/prerender-page?path=/`, { cache: 'no-store' });
      const html = await r.text();
      const scripts = Array.from(html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)).map(m => m[1].trim());
      const types = new Set<string>();
      let validCount = 0;
      let totalCount = scripts.length;
      for (const s of scripts) {
        try {
          const obj = JSON.parse(s);
          const arr = Array.isArray(obj) ? obj : [obj];
          for (const o of arr) {
            const t = o['@type'] || (o['@graph'] && o['@graph'][0]?.['@type']);
            if (t) types.add(String(t));
          }
          validCount++;
        } catch { /* invalid json */ }
      }
      const expected = ['Organization', 'WebSite', 'BreadcrumbList'];
      const checks: SchemaCheck[] = expected.map(t => ({
        type: t,
        present: types.has(t),
        valid: types.has(t),
        note: types.has(t) ? 'Detected on homepage' : 'Not detected on homepage',
      }));
      checks.push({ type: 'JSON-LD parse', present: totalCount > 0, valid: validCount === totalCount && totalCount > 0, note: `${validCount}/${totalCount} valid blocks` });
      setSchemaChecks(checks);
    } catch (e) {
      setSchemaChecks([{ type: 'Fetch error', present: false, valid: false, note: String(e) }]);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchSitemaps(), fetchDbStats(), fetchRecentPings(), validateSchema()]);
    setRefreshing(false);
    setLoading(false);
  }, [fetchSitemaps, fetchDbStats, fetchRecentPings, validateSchema]);

  useEffect(() => { refreshAll(); }, []);

  const triggerPing = async (url: string) => {
    setPinging(true);
    try {
      const r = await fetch(`https://dpvdavjwqyviredzoorj.supabase.co/functions/v1/seo-ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: [url] }),
      });
      const data = await r.json();
      if (data.ok) toast.success('Search engines notified', { description: 'IndexNow + Bing + Yandex pinged.' });
      else toast.error('Ping failed', { description: data.error || 'Unknown error' });
    } catch (e: any) {
      toast.error('Ping failed', { description: e.message });
    } finally { setPinging(false); }
  };

  /* ───────── derived ───────── */
  const seoCoverage = dbStats.products > 0 ? Math.round((dbStats.productsWithSeo / dbStats.products) * 100) : 0;
  const slugCoverage = dbStats.products > 0 ? Math.round((dbStats.productsWithSlug / dbStats.products) * 100) : 0;
  const blogSeoCoverage = dbStats.blogsPublished > 0 ? Math.round((dbStats.blogsWithSeo / dbStats.blogsPublished) * 100) : 0;
  const totalIndexableUrls = sitemaps.find(s => s.name === 'sitemap.xml')?.count || 0;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            SEO Monitor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Crawl, indexing, sitemap & structured data health.</p>
        </div>
        <button
          onClick={refreshAll}
          disabled={refreshing}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-xs text-muted-foreground">Indexable URLs</div>
          <div className="text-2xl font-bold mt-1">{loading ? '—' : totalIndexableUrls}</div>
          <div className="text-xs text-muted-foreground mt-1">From sitemap.xml</div>
        </Card>
        <Card>
          <div className="text-xs text-muted-foreground">Product SEO Coverage</div>
          <div className="text-2xl font-bold mt-1">{seoCoverage}%</div>
          <div className="text-xs text-muted-foreground mt-1">{dbStats.productsWithSeo}/{dbStats.products} products</div>
        </Card>
        <Card>
          <div className="text-xs text-muted-foreground">Slug Coverage</div>
          <div className="text-2xl font-bold mt-1">{slugCoverage}%</div>
          <div className="text-xs text-muted-foreground mt-1">SEO-friendly URLs</div>
        </Card>
        <Card>
          <div className="text-xs text-muted-foreground">Blog SEO Coverage</div>
          <div className="text-2xl font-bold mt-1">{blogSeoCoverage}%</div>
          <div className="text-xs text-muted-foreground mt-1">{dbStats.blogsWithSeo}/{dbStats.blogsPublished} posts</div>
        </Card>
      </div>

      {/* Sitemap status */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Sitemap & Feed Status</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="pb-2">File</th>
                <th className="pb-2">URLs</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Open</th>
              </tr>
            </thead>
            <tbody>
              {sitemaps.map(s => (
                <tr key={s.name} className="border-b border-border/50 last:border-0">
                  <td className="py-3 font-mono text-xs">{s.name}</td>
                  <td className="py-3">{s.status === 'loading' ? '—' : s.count}</td>
                  <td className="py-3"><StatusBadge status={s.status} /></td>
                  <td className="py-3 text-right">
                    <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Structured data */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2"><Code2 className="h-4 w-4 text-primary" />Structured Data (Homepage)</h2>
          <a
            href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(SITE)}`}
            target="_blank" rel="noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Validate in Google <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {schemaChecks.length === 0 && <div className="text-sm text-muted-foreground">Loading…</div>}
          {schemaChecks.map((c, i) => (
            <div key={i} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-border/60 bg-background/50">
              <div className="min-w-0">
                <div className="text-sm font-medium">{c.type}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.note}</div>
              </div>
              <StatusBadge status={c.valid ? 'ok' : c.present ? 'warn' : 'fail'} />
            </div>
          ))}
        </div>
      </Card>

      {/* Recent ping log */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2"><Send className="h-4 w-4 text-primary" />Recent IndexNow Ping Activity</h2>
          <span className="text-xs text-muted-foreground">Auto-pinged on publish/update</span>
        </div>
        <div className="space-y-2">
          {recentPings.length === 0 && <div className="text-sm text-muted-foreground">No recent activity.</div>}
          {recentPings.map(p => {
            const url = p.entity === 'product' ? `${SITE}/product/${p.slug}` : `${SITE}/blog/${p.slug}`;
            return (
              <div key={`${p.entity}-${p.id}`} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-background/50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-mono ${p.entity === 'product' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'}`}>{p.entity}</span>
                    <span className="text-sm font-medium truncate">{p.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(p.updated_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
                <button
                  onClick={() => triggerPing(url)}
                  disabled={pinging}
                  className="px-3 py-1.5 rounded-lg text-xs bg-primary/10 text-primary hover:bg-primary/20 transition disabled:opacity-50 flex items-center gap-1 shrink-0"
                  title="Re-ping IndexNow"
                >
                  <Send className="h-3 w-3" /> Re-ping
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      {/* External tools */}
      <Card>
        <h2 className="font-semibold flex items-center gap-2 mb-4"><Search className="h-4 w-4 text-primary" />External Tools (Manual checks)</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'Google Search Console', desc: 'Crawl & index status', url: 'https://search.google.com/search-console', icon: Globe },
            { label: 'Bing Webmaster Tools', desc: 'Bing crawl reports', url: 'https://www.bing.com/webmasters', icon: Globe },
            { label: 'Rich Results Test', desc: 'Schema.org validator', url: `https://search.google.com/test/rich-results?url=${encodeURIComponent(SITE)}`, icon: Code2 },
            { label: 'PageSpeed Insights', desc: 'Core Web Vitals', url: `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(SITE)}`, icon: Activity },
            { label: 'Google site: search', desc: 'See indexed pages', url: `https://www.google.com/search?q=site%3Ashahedstore.com.bd`, icon: Search },
            { label: 'Schema.org Validator', desc: 'Markup validation', url: `https://validator.schema.org/#url=${encodeURIComponent(SITE)}`, icon: Database },
          ].map(t => (
            <a
              key={t.label}
              href={t.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-background/50 hover:bg-accent/50 transition group"
            >
              <t.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium flex items-center gap-1">{t.label} <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition" /></div>
                <div className="text-xs text-muted-foreground">{t.desc}</div>
              </div>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminSEOMonitor;
