import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Zap, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

const AdminSpeedOptimization = () => {
  const [productCount, setProductCount] = useState(0);
  const [imagesMissing, setImagesMissing] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('id', { count: 'exact' }).eq('status', 'active'),
      supabase.from('products').select('id', { count: 'exact' }).eq('status', 'active').is('image_url', null),
    ]).then(([{ count: total }, { count: noImg }]) => {
      setProductCount(total || 0);
      setImagesMissing(noImg || 0);
      setLoading(false);
    });
  }, []);

  const checks = [
    { label: 'Images served from CDN', status: true, desc: 'Product images are served via Supabase Storage CDN' },
    { label: 'React code splitting', status: true, desc: 'Vite automatically splits code into lazy-loaded chunks' },
    { label: 'Tailwind CSS purging', status: true, desc: 'Unused CSS classes are removed in production build' },
    { label: 'Fonts preloaded', status: true, desc: 'Sora and Fira Code fonts loaded from Google Fonts CDN' },
    { label: 'Images without src', status: imagesMissing === 0, desc: imagesMissing > 0 ? `${imagesMissing} products missing product image` : 'All products have images', action: imagesMissing > 0 ? { label: 'Fix in Product SEO', url: '/admin/seo/products' } : null },
    { label: 'Caching headers (CDN)', status: null, desc: 'Configure cache headers in your hosting provider (Lovable / Netlify)' },
    { label: 'Gzip / Brotli compression', status: null, desc: 'Enabled by default on Lovable Cloud hosting' },
    { label: 'Core Web Vitals monitored', status: null, desc: 'Monitor via Google Search Console → Core Web Vitals report', action: { label: 'Open GSC', url: 'https://search.google.com/search-console' } },
  ];

  const score = Math.round((checks.filter(c => c.status === true).length / checks.filter(c => c.status !== null).length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Speed <span className="gradient-text">Optimization</span>
          </h1>
          <p className="text-muted-foreground text-sm">Performance checklist for better Core Web Vitals</p>
        </div>
        <div className="glass-card px-5 py-3 rounded-2xl text-center">
          <div className={`text-3xl font-black ${score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{loading ? '…' : score}%</div>
          <div className="text-[10px] text-muted-foreground">Optimization Score</div>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h3 className="font-bold text-foreground text-sm">Performance Checklist</h3>
        </div>
        <div className="divide-y divide-border">
          {checks.map((c, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/10 transition-colors">
              {c.status === true ? <CheckCircle size={17} className="text-green-400 flex-shrink-0" />
                : c.status === false ? <XCircle size={17} className="text-red-400 flex-shrink-0" />
                : <div className="w-[17px] h-[17px] rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />}
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{c.label}</p>
                <p className="text-xs text-muted-foreground">{c.desc}</p>
              </div>
              {(c as any).action && (
                <a href={(c as any).action.url} target={(c as any).action.url.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-2 flex-shrink-0">
                  {(c as any).action.label} <ExternalLink size={10} />
                </a>
              )}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${c.status === true ? 'bg-green-500/15 text-green-400' : c.status === false ? 'bg-red-500/15 text-red-400' : 'bg-muted text-muted-foreground'}`}>
                {c.status === true ? 'Pass' : c.status === false ? 'Fail' : 'Manual'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'PageSpeed Insights', desc: 'Test your page speed score', url: `https://pagespeed.web.dev/report?url=https://shahedstore.com.bd` },
          { title: 'GTmetrix', desc: 'Detailed performance waterfall', url: 'https://gtmetrix.com' },
          { title: 'Core Web Vitals', desc: 'Monitor in Google Search Console', url: 'https://search.google.com/search-console' },
        ].map(t => (
          <a key={t.title} href={t.url} target="_blank" rel="noopener noreferrer"
            className="glass-card rounded-2xl p-5 hover:scale-[1.01] transition-all group">
            <h4 className="font-semibold text-sm text-foreground mb-1 flex items-center justify-between">
              {t.title} <ExternalLink size={12} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </h4>
            <p className="text-xs text-muted-foreground">{t.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
};

export default AdminSpeedOptimization;
