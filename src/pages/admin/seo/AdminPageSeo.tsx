import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FileSearch, Save, Eye, Globe, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PageSeoData {
  title: string;
  description: string;
  canonical: string;
  og_title: string;
  og_description: string;
  noindex: boolean;
}

const SITE_PAGES = [
  { key: 'home', label: 'Home Page', path: '/', icon: '🏠' },
  { key: 'shop', label: 'Shop Page', path: '/shop', icon: '🛒' },
  { key: 'blog', label: 'Blog Page', path: '/blog', icon: '📝' },
  { key: 'help', label: 'Software Downloads', path: '/help', icon: '💾' },
  { key: 'about', label: 'About Us', path: '/about', icon: 'ℹ️' },
  { key: 'contact', label: 'Contact Us', path: '/contact', icon: '📞' },
  { key: 'faqs', label: 'FAQs', path: '/faqs', icon: '❓' },
  { key: 'privacy-policy', label: 'Privacy Policy', path: '/privacy-policy', icon: '🔒' },
  { key: 'terms-conditions', label: 'Terms & Conditions', path: '/terms-conditions', icon: '📄' },
  { key: 'refund-policy', label: 'Refund Policy', path: '/refund-policy', icon: '↩️' },
  { key: 'order-policy', label: 'Order Policy', path: '/order-policy', icon: '📦' },
  { key: 'delivery-info', label: 'Delivery Info', path: '/delivery-info', icon: '🚚' },
  { key: 'return-policy', label: 'Return Policy', path: '/return-policy', icon: '🔄' },
  { key: 'checkout', label: 'Checkout', path: '/checkout', icon: '💳' },
  { key: 'dashboard', label: 'User Dashboard', path: '/dashboard', icon: '👤' },
];

const defaultSeo = (): PageSeoData => ({
  title: '',
  description: '',
  canonical: '',
  og_title: '',
  og_description: '',
  noindex: false,
});

const SITE_URL = 'https://shahedstore.com.bd';

const AdminPageSeo = () => {
  const [seoData, setSeoData] = useState<Record<string, PageSeoData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>('home');
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    const keys = SITE_PAGES.map(p => `page_seo_${p.key}`);
    supabase.from('site_settings').select('key, value').in('key', keys).then(({ data }) => {
      const map: Record<string, PageSeoData> = {};
      data?.forEach(row => {
        const pageKey = row.key.replace('page_seo_', '');
        try { map[pageKey] = row.value ? JSON.parse(row.value) : defaultSeo(); } catch { map[pageKey] = defaultSeo(); }
      });
      setSeoData(map);
      setLoading(false);
    });
  }, []);

  const get = (key: string): PageSeoData => seoData[key] || defaultSeo();

  const set = (key: string, field: keyof PageSeoData, value: string | boolean) => {
    setSeoData(prev => ({ ...prev, [key]: { ...get(key), [field]: value } }));
  };

  const save = async (pageKey: string) => {
    setSaving(pageKey);
    const value = JSON.stringify(seoData[pageKey] || defaultSeo());
    await supabase.from('site_settings').upsert(
      { key: `page_seo_${pageKey}`, value, category: 'seo' },
      { onConflict: 'key' }
    );
    setSaving(null);
    setSaved(pageKey);
    setTimeout(() => setSaved(null), 2000);
    toast.success('SEO settings saved!');
  };

  const getTitleLength = (key: string) => get(key).title.length;
  const getDescLength = (key: string) => get(key).description.length;

  if (loading) return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => <div key={i} className="h-16 glass-card rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Page <span className="gradient-text">SEO Control</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Set custom SEO title, description, and meta tags for each page
          </p>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl flex items-center gap-2 text-xs text-muted-foreground">
          <Globe size={14} className="text-primary" />
          {SITE_PAGES.length} pages configured
        </div>
      </div>

      {/* Pages list */}
      <div className="space-y-3">
        {SITE_PAGES.map(page => {
          const data = get(page.key);
          const isOpen = expanded === page.key;
          const titleLen = getTitleLength(page.key);
          const descLen = getDescLength(page.key);
          const isSaved = saved === page.key;
          const hasData = data.title || data.description;

          return (
            <div key={page.key} className="glass-card rounded-2xl overflow-hidden border border-border/50">
              {/* Row header */}
              <button
                onClick={() => setExpanded(isOpen ? null : page.key)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/10 transition-colors text-left"
              >
                <span className="text-xl flex-shrink-0">{page.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{page.label}</span>
                    {hasData && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/15 text-green-500">Configured</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{SITE_URL}{page.path}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {data.noindex && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400">NOINDEX</span>
                  )}
                  <a
                    href={page.path} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-muted-foreground hover:text-primary transition-colors p-1"
                    title="Preview page"
                  >
                    <Eye size={14} />
                  </a>
                  {isOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                </div>
              </button>

              {/* Expanded fields */}
              {isOpen && (
                <div className="border-t border-border/50 px-5 py-5 space-y-4 bg-muted/5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* SEO Title */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-muted-foreground">SEO Title</label>
                        <span className={`text-[10px] font-mono ${titleLen > 60 ? 'text-red-400' : titleLen > 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {titleLen}/60
                        </span>
                      </div>
                      <input
                        value={data.title}
                        onChange={e => set(page.key, 'title', e.target.value)}
                        placeholder={`${page.label} | Shahed Store`}
                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    {/* OG Title */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">OG Title (Social Share)</label>
                      <input
                        value={data.og_title}
                        onChange={e => set(page.key, 'og_title', e.target.value)}
                        placeholder="Leave blank to use SEO title"
                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  {/* Meta Description */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-muted-foreground">Meta Description</label>
                      <span className={`text-[10px] font-mono ${descLen > 160 ? 'text-red-400' : descLen > 140 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {descLen}/160
                      </span>
                    </div>
                    <textarea
                      value={data.description}
                      onChange={e => set(page.key, 'description', e.target.value)}
                      placeholder="Brief description shown in Google search results..."
                      rows={2}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                    />
                  </div>

                  {/* OG Description */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">OG Description (Social Share)</label>
                    <textarea
                      value={data.og_description}
                      onChange={e => set(page.key, 'og_description', e.target.value)}
                      placeholder="Leave blank to use meta description"
                      rows={2}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Canonical URL */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Canonical URL</label>
                      <input
                        value={data.canonical}
                        onChange={e => set(page.key, 'canonical', e.target.value)}
                        placeholder={`${SITE_URL}${page.path}`}
                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    {/* noindex toggle */}
                    <div className="flex items-end">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div
                          onClick={() => set(page.key, 'noindex', !data.noindex)}
                          className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${data.noindex ? 'bg-red-500' : 'bg-muted'}`}
                        >
                          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${data.noindex ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">No Index</div>
                          <div className="text-[11px] text-muted-foreground">Hide from search engines</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Google Preview */}
                  {(data.title || data.description) && (
                    <div className="bg-muted/20 rounded-xl p-4 border border-border/50">
                      <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-wider">Google Preview</p>
                      <div className="text-xs text-muted-foreground font-mono mb-0.5">{SITE_URL}{page.path}</div>
                      <div className="text-[15px] font-medium leading-tight" style={{ color: 'hsl(210,90%,52%)' }}>
                        {data.title || `${page.label} | Shahed Store`}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                        {data.description || 'No description set — add a meta description for better click-through rate.'}
                      </div>
                    </div>
                  )}

                  {/* Save button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => save(page.key)}
                      disabled={saving === page.key}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium btn-glow transition-all disabled:opacity-60"
                    >
                      {isSaved ? <Check size={14} /> : saving === page.key ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                      {isSaved ? 'Saved!' : saving === page.key ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPageSeo;
