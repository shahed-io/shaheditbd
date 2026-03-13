import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Globe, Download, RefreshCw, Plus, Trash2, ArrowRight, Save, ExternalLink, FileText, Search } from 'lucide-react';
import { toast } from 'sonner';
import { SITE_URL } from '@/components/seo/SEOHead';

interface Redirect {
  id?: string;
  from_path: string;
  to_path: string;
  type: '301' | '302';
}

const AdminSEO = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sitemap' | 'redirects' | 'settings'>('sitemap');
  const [sitemapXml, setSitemapXml] = useState('');
  const [newRedirect, setNewRedirect] = useState<Redirect>({ from_path: '', to_path: '', type: '301' });
  const [seoSettings, setSeoSettings] = useState<Record<string, string>>({});
  const [savingSeo, setSavingSeo] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('slug, updated_at, name').eq('status', 'active'),
      supabase.from('blog_posts').select('slug, updated_at, title').eq('status', 'published'),
      supabase.from('categories').select('slug, updated_at, name').eq('is_active', true),
      supabase.from('site_settings').select('*').in('key', ['meta_title', 'meta_description', 'og_image', 'google_analytics', 'google_site_verification', 'robots_extra']),
    ]).then(([{ data: p }, { data: b }, { data: c }, { data: s }]) => {
      setProducts(p || []);
      setPosts(b || []);
      setCategories(c || []);
      const map: Record<string, string> = {};
      s?.forEach(row => { map[row.key] = row.value || ''; });
      setSeoSettings(map);
      setLoading(false);
    });
    // Load redirects from site_settings
    supabase.from('site_settings').select('value').eq('key', 'redirects').single().then(({ data }) => {
      try { if (data?.value) setRedirects(JSON.parse(data.value)); } catch {}
    });
  }, []);

  const generateSitemap = () => {
    const now = new Date().toISOString().split('T')[0];
    const staticPages = [
      { loc: SITE_URL, changefreq: 'daily', priority: '1.0', lastmod: now },
      { loc: `${SITE_URL}/blog`, changefreq: 'daily', priority: '0.8', lastmod: now },
      { loc: `${SITE_URL}/help`, changefreq: 'weekly', priority: '0.6', lastmod: now },
      { loc: `${SITE_URL}/checkout`, changefreq: 'monthly', priority: '0.3', lastmod: now },
    ];

    const productUrls = products.map(p => ({
      loc: `${SITE_URL}/product/${p.slug}`,
      changefreq: 'weekly',
      priority: '0.9',
      lastmod: p.updated_at?.split('T')[0] || now,
    }));

    const blogUrls = posts.map(p => ({
      loc: `${SITE_URL}/blog/${p.slug}`,
      changefreq: 'monthly',
      priority: '0.7',
      lastmod: p.updated_at?.split('T')[0] || now,
    }));

    const helpUrls = categories.map(c => ({
      loc: `${SITE_URL}/help/${c.slug}`,
      changefreq: 'monthly',
      priority: '0.5',
      lastmod: c.updated_at?.split('T')[0] || now,
    }));

    const allUrls = [...staticPages, ...productUrls, ...blogUrls, ...helpUrls];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
    setSitemapXml(xml);
    return xml;
  };

  useEffect(() => {
    if (!loading) generateSitemap();
  }, [loading]);

  const downloadSitemap = () => {
    const xml = generateSitemap();
    const blob = new Blob([xml], { type: 'application/xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sitemap.xml';
    a.click();
    toast.success('sitemap.xml downloaded!');
  };

  const saveRedirects = async (list: Redirect[]) => {
    await supabase.from('site_settings').upsert({ key: 'redirects', value: JSON.stringify(list) }, { onConflict: 'key' });
  };

  const addRedirect = async () => {
    if (!newRedirect.from_path || !newRedirect.to_path) {
      toast.error('Both paths required');
      return;
    }
    const updated = [...redirects, { ...newRedirect, id: crypto.randomUUID() }];
    setRedirects(updated);
    await saveRedirects(updated);
    setNewRedirect({ from_path: '', to_path: '', type: '301' });
    toast.success('Redirect added!');
  };

  const removeRedirect = async (id: string) => {
    const updated = redirects.filter(r => r.id !== id);
    setRedirects(updated);
    await saveRedirects(updated);
    toast.success('Redirect removed');
  };

  const saveSeoSettings = async () => {
    setSavingSeo(true);
    const updates = Object.entries(seoSettings).map(([key, value]) =>
      supabase.from('site_settings').upsert({ key, value }, { onConflict: 'key' })
    );
    await Promise.all(updates);
    toast.success('SEO settings saved!');
    setSavingSeo(false);
  };

  const tabs = [
    { id: 'sitemap', label: 'XML Sitemap', icon: Globe },
    { id: 'redirects', label: 'Redirects', icon: ArrowRight },
    { id: 'settings', label: 'Meta Settings', icon: Search },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            SEO <span className="gradient-text">Manager</span>
          </h1>
          <p className="text-muted-foreground text-sm">Manage meta tags, sitemap, redirects & schema</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground glass-card px-4 py-2 rounded-xl">
          <Globe size={14} className="text-primary" />
          <span>{products.length} products · {posts.length} posts indexed</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === t.id ? 'btn-glow text-white' : 'glass-card text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 glass-card rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* ── SITEMAP TAB ── */}
          {activeTab === 'sitemap' && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Static Pages', count: 4, color: 'text-blue-400' },
                  { label: 'Product URLs', count: products.length, color: 'text-primary' },
                  { label: 'Blog Posts', count: posts.length, color: 'text-green-400' },
                  { label: 'Help Articles', count: categories.length, color: 'text-yellow-400' },
                ].map(s => (
                  <div key={s.label} className="glass-card rounded-2xl p-4 text-center">
                    <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
                    <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-foreground">XML Sitemap Preview</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total: {4 + products.length + posts.length + categories.length} URLs
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { generateSitemap(); toast.success('Regenerated!'); }}
                      className="glass-card px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 hover:text-primary transition-colors">
                      <RefreshCw size={13} /> Regenerate
                    </button>
                    <button onClick={downloadSitemap}
                      className="btn-glow px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 font-medium">
                      <Download size={13} /> Download sitemap.xml
                    </button>
                  </div>
                </div>
                <pre className="bg-muted/20 rounded-xl p-4 text-xs text-muted-foreground overflow-auto max-h-80 font-mono border border-border">
                  {sitemapXml.slice(0, 2000)}{sitemapXml.length > 2000 ? '\n  ...' : ''}
                </pre>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText size={12} />
                  Submit to: 
                  <a href="https://search.google.com/search-console" target="_blank" rel="noopener" className="text-primary hover:underline flex items-center gap-1">
                    Google Search Console <ExternalLink size={10} />
                  </a>
                  ·
                  <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener" className="text-primary hover:underline flex items-center gap-1">
                    Bing Webmaster <ExternalLink size={10} />
                  </a>
                </div>
              </div>

              {/* Robots.txt */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-bold text-foreground mb-3">robots.txt Preview</h3>
                <pre className="bg-muted/20 rounded-xl p-4 text-xs text-muted-foreground font-mono border border-border">{`User-agent: *
Allow: /
Disallow: /admin
Disallow: /checkout
Disallow: /dashboard
Disallow: /reset-password

Sitemap: ${SITE_URL}/sitemap.xml`}</pre>
              </div>
            </div>
          )}

          {/* ── REDIRECTS TAB ── */}
          {activeTab === 'redirects' && (
            <div className="space-y-4">
              {/* Add new */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-bold text-foreground mb-4">Add Redirect</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                    <select
                      value={newRedirect.type}
                      onChange={e => setNewRedirect({ ...newRedirect, type: e.target.value as '301' | '302' })}
                      className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="301">301 Permanent</option>
                      <option value="302">302 Temporary</option>
                    </select>
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-xs text-muted-foreground mb-1 block">From Path</label>
                    <input
                      value={newRedirect.from_path}
                      onChange={e => setNewRedirect({ ...newRedirect, from_path: e.target.value })}
                      placeholder="/old-page"
                      className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-xs text-muted-foreground mb-1 block">To Path</label>
                    <input
                      value={newRedirect.to_path}
                      onChange={e => setNewRedirect({ ...newRedirect, to_path: e.target.value })}
                      placeholder="/new-page"
                      className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex items-end">
                    <button onClick={addRedirect} className="btn-glow w-full px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                      <Plus size={15} /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* List */}
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-bold text-foreground">Active Redirects ({redirects.length})</h3>
                </div>
                {redirects.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No redirects configured yet
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {redirects.map(r => (
                      <div key={r.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/10 transition-colors">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${r.type === '301' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {r.type}
                        </span>
                        <code className="text-sm text-muted-foreground flex-1">{r.from_path}</code>
                        <ArrowRight size={14} className="text-muted-foreground/40" />
                        <code className="text-sm text-primary flex-1">{r.to_path}</code>
                        <button onClick={() => removeRedirect(r.id!)} className="text-muted-foreground hover:text-red-400 transition-colors p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="glass-card rounded-xl p-4 text-xs text-muted-foreground">
                💡 Redirects are enforced client-side via React Router. For server-level 301/302 redirects, configure them in your hosting (e.g., Netlify _redirects file).
              </div>
            </div>
          )}

          {/* ── META SETTINGS TAB ── */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-foreground">Global SEO Settings</h3>
                  <button onClick={saveSeoSettings} disabled={savingSeo} className="btn-glow px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                    <Save size={14} /> {savingSeo ? 'Saving...' : 'Save'}
                  </button>
                </div>
                {[
                  { key: 'meta_title', label: 'Default Meta Title', placeholder: 'Shahed Store - Digital Products', hint: 'Max 60 characters' },
                  { key: 'meta_description', label: 'Default Meta Description', placeholder: 'Your trusted digital product store...', hint: 'Max 160 characters', textarea: true },
                  { key: 'og_image', label: 'Default OG Image URL', placeholder: 'https://...', hint: 'Recommended: 1200×630px' },
                  { key: 'google_analytics', label: 'Google Analytics ID', placeholder: 'G-XXXXXXXXXX', hint: 'GA4 measurement ID' },
                  { key: 'google_site_verification', label: 'Google Search Console Verification', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', hint: 'Content value from meta verification tag' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-muted-foreground mb-1 block">{f.label}
                      <span className="ml-1 opacity-60">— {f.hint}</span>
                    </label>
                    {f.textarea ? (
                      <textarea
                        value={seoSettings[f.key] || ''}
                        onChange={e => setSeoSettings({ ...seoSettings, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        rows={3}
                        className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                      />
                    ) : (
                      <input
                        value={seoSettings[f.key] || ''}
                        onChange={e => setSeoSettings({ ...seoSettings, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Schema checklist */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-bold text-foreground mb-4">Schema Markup Status</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Organization Schema', page: 'Homepage', status: true },
                    { label: 'WebSite + SearchAction Schema', page: 'Homepage', status: true },
                    { label: 'Product Schema', page: 'Product Detail', status: true },
                    { label: 'Breadcrumb Schema', page: 'Product + Blog', status: true },
                    { label: 'Article Schema', page: 'Blog Post', status: true },
                    { label: 'FAQPage Schema', page: 'Product Detail', status: true },
                    { label: 'Blog Schema', page: 'Blog Index', status: true },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                      <div className={`w-2 h-2 rounded-full ${s.status ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-sm text-foreground flex-1">{s.label}</span>
                      <span className="text-xs text-muted-foreground">{s.page}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminSEO;
