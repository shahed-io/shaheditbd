import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Map, Download, RefreshCw, Globe, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const SITE_URL = 'https://shahedstore.com.bd';

const AdminSitemap = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [xml, setXml] = useState('');

  const STATIC_PAGES = [
    { loc: SITE_URL, changefreq: 'daily', priority: '1.0' },
    { loc: `${SITE_URL}/shop`, changefreq: 'daily', priority: '0.9' },
    { loc: `${SITE_URL}/blog`, changefreq: 'daily', priority: '0.8' },
    { loc: `${SITE_URL}/help`, changefreq: 'weekly', priority: '0.7' },
    { loc: `${SITE_URL}/about`, changefreq: 'monthly', priority: '0.6' },
    { loc: `${SITE_URL}/contact`, changefreq: 'monthly', priority: '0.6' },
    { loc: `${SITE_URL}/faqs`, changefreq: 'monthly', priority: '0.5' },
    { loc: `${SITE_URL}/privacy-policy`, changefreq: 'yearly', priority: '0.3' },
    { loc: `${SITE_URL}/terms-conditions`, changefreq: 'yearly', priority: '0.3' },
  ];

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('slug, updated_at').eq('status', 'active'),
      supabase.from('blog_posts').select('slug, updated_at').eq('status', 'published'),
      supabase.from('categories').select('slug, updated_at').eq('is_active', true),
    ]).then(([{ data: p }, { data: b }, { data: c }]) => {
      setProducts(p || []); setPosts(b || []); setCategories(c || []);
      setLoading(false);
    });
  }, []);

  const generateXml = (p = products, b = posts) => {
    const now = new Date().toISOString().split('T')[0];
    const all = [
      ...STATIC_PAGES.map(s => ({ ...s, lastmod: now })),
      ...p.map(x => ({ loc: `${SITE_URL}/product/${x.slug}`, changefreq: 'weekly', priority: '0.9', lastmod: x.updated_at?.split('T')[0] || now })),
      ...b.map(x => ({ loc: `${SITE_URL}/blog/${x.slug}`, changefreq: 'monthly', priority: '0.7', lastmod: x.updated_at?.split('T')[0] || now })),
    ];
    const result = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${all.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n')}\n</urlset>`;
    setXml(result);
    return result;
  };

  useEffect(() => { if (!loading) generateXml(); }, [loading]);

  const download = () => {
    const content = generateXml();
    const blob = new Blob([content], { type: 'application/xml' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sitemap.xml'; a.click();
    toast.success('sitemap.xml downloaded!');
  };

  const stats = [
    { label: 'Static Pages', count: STATIC_PAGES.length, color: 'text-blue-400' },
    { label: 'Products', count: products.length, color: 'text-primary' },
    { label: 'Blog Posts', count: posts.length, color: 'text-green-400' },
    { label: 'Total URLs', count: STATIC_PAGES.length + products.length + posts.length, color: 'text-yellow-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Sitemap <span className="gradient-text">Generator</span>
          </h1>
          <p className="text-muted-foreground text-sm">Generate and download XML sitemaps for Google & Bing</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { generateXml(); toast.success('Regenerated!'); }} className="glass-card px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:text-primary transition-colors">
            <RefreshCw size={14} /> Regenerate
          </button>
          <button onClick={download} className="btn-glow px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
            <Download size={14} /> Download sitemap.xml
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-4 text-center">
            <div className={`text-3xl font-bold ${s.color}`}>{loading ? '…' : s.count}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2"><Map size={16} /> Sitemap Preview</h3>
        <pre className="bg-muted/20 rounded-xl p-4 text-xs text-muted-foreground overflow-auto max-h-80 font-mono border border-border">
          {loading ? 'Loading…' : xml.slice(0, 3000) + (xml.length > 3000 ? '\n  …' : '')}
        </pre>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2"><Globe size={15} /> Submit Your Sitemap</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: 'Google Search Console', url: 'https://search.google.com/search-console', color: 'hsl(25,90%,55%)' },
            { name: 'Bing Webmaster Tools', url: 'https://www.bing.com/webmasters', color: 'hsl(200,90%,45%)' },
          ].map(s => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between glass-card px-4 py-3 rounded-xl hover:scale-[1.01] transition-all group">
              <span className="text-sm font-medium text-foreground">{s.name}</span>
              <ExternalLink size={14} style={{ color: s.color }} />
            </a>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">Submit URL: <code className="bg-muted/40 px-1.5 py-0.5 rounded">{SITE_URL}/sitemap.xml</code></p>
      </div>
    </div>
  );
};

export default AdminSitemap;
