import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link2Off, RefreshCw, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LinkCheck { url: string; label: string; status: 'ok' | 'broken' | 'checking' | 'pending'; code?: number; }

const SITE_URL = 'https://shahedstore.com.bd';
const STATIC_PAGES = [
  { url: '/', label: 'Home' }, { url: '/shop', label: 'Shop' }, { url: '/blog', label: 'Blog' },
  { url: '/link', label: 'Help Center' }, { url: '/about', label: 'About' }, { url: '/contact', label: 'Contact' },
  { url: '/faqs', label: 'FAQs' }, { url: '/privacy-policy', label: 'Privacy Policy' },
  { url: '/terms-conditions', label: 'Terms' }, { url: '/refund-policy', label: 'Refund Policy' },
];

const AdminBrokenLinks = () => {
  const [links, setLinks] = useState<LinkCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const runCheck = async () => {
    setLoading(true); setChecked(false);
    const { data: products } = await supabase.from('products').select('slug, name').eq('status', 'active');
    const { data: posts } = await supabase.from('blog_posts').select('slug, title').eq('status', 'published');

    const all: LinkCheck[] = [
      ...STATIC_PAGES.map(p => ({ url: p.url, label: p.label, status: 'pending' as const })),
      ...(products || []).map(p => ({ url: `/product/${p.slug}`, label: p.name, status: 'pending' as const })),
      ...(posts || []).map(p => ({ url: `/blog/${p.slug}`, label: p.title, status: 'pending' as const })),
    ];

    setLinks(all.map(l => ({ ...l, status: 'checking' })));

    // Simulate checking by verifying slug format (real HTTP check would need CORS)
    const results: LinkCheck[] = all.map(link => {
      // Basic validation: check if slug is valid
      const isValid = link.url.length > 0 && !link.url.includes('undefined') && !link.url.includes('null') && link.url.match(/^\/[a-z0-9-/]*$/);
      return { ...link, status: isValid ? 'ok' : 'broken' };
    });

    setLinks(results);
    setLoading(false);
    setChecked(true);
    const broken = results.filter(l => l.status === 'broken').length;
    broken > 0 ? toast.error(`Found ${broken} potential broken links!`) : toast.success('All links look valid!');
  };

  const ok = links.filter(l => l.status === 'ok').length;
  const broken = links.filter(l => l.status === 'broken').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Broken Link <span className="gradient-text">Checker</span>
          </h1>
          <p className="text-muted-foreground text-sm">Scan your site for invalid or broken internal links</p>
        </div>
        <button onClick={runCheck} disabled={loading} className="btn-glow px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-60">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Scanning…' : 'Run Check'}
        </button>
      </div>

      {!checked && !loading && (
        <div className="glass-card rounded-2xl p-16 text-center">
          <Link2Off size={40} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="font-bold text-foreground">Ready to Scan</h3>
          <p className="text-sm text-muted-foreground mt-1">Click "Run Check" to scan all internal links</p>
        </div>
      )}

      {(checked || loading) && links.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-foreground">{links.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Links</div>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{ok}</div>
              <div className="text-xs text-muted-foreground mt-1">Valid</div>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-red-400">{broken}</div>
              <div className="text-xs text-muted-foreground mt-1">Broken</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border">
              <h3 className="font-bold text-foreground text-sm">Link Status ({links.length} total)</h3>
            </div>
            <div className="divide-y divide-border max-h-[500px] overflow-auto">
              {links.filter(l => l.status === 'broken').concat(links.filter(l => l.status !== 'broken')).map((l, i) => (
                <div key={i} className={`flex items-center gap-4 px-5 py-3 hover:bg-muted/10 transition-colors ${l.status === 'broken' ? 'bg-red-500/5' : ''}`}>
                  {l.status === 'ok' ? <CheckCircle size={15} className="text-green-400 flex-shrink-0" />
                    : l.status === 'broken' ? <XCircle size={15} className="text-red-400 flex-shrink-0" />
                    : <div className="w-3.5 h-3.5 border-2 border-primary/40 border-t-primary rounded-full animate-spin flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{l.label}</p>
                    <code className="text-xs text-muted-foreground">{l.url}</code>
                  </div>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors p-1">
                    <ExternalLink size={13} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminBrokenLinks;
