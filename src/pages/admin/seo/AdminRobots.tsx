import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Save, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_ROBOTS = `User-agent: *
Allow: /

# Disallow admin and private pages
Disallow: /admin
Disallow: /checkout
Disallow: /dashboard
Disallow: /reset-password

# Allow CSS & JS
Allow: /*.css$
Allow: /*.js$

# Sitemap
Sitemap: https://shahedstore.com.bd/sitemap.xml`;

const AdminRobots = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'robots_txt').maybeSingle().then(({ data }) => {
      setContent(data?.value || DEFAULT_ROBOTS);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from('site_settings').upsert({ key: 'robots_txt', value: content, category: 'seo' }, { onConflict: 'key' });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    toast.success('robots.txt saved!');
  };

  const lines = content.split('\n').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Robots.txt <span className="gradient-text">Editor</span>
          </h1>
          <p className="text-muted-foreground text-sm">Control which pages search engine crawlers can access</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setContent(DEFAULT_ROBOTS); toast.success('Reset to default'); }}
            className="glass-card px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:text-primary transition-colors">
            <RefreshCw size={14} /> Reset Default
          </button>
          <button onClick={save} disabled={saving} className="btn-glow px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-60">
            {saved ? <Check size={14} /> : saving ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
            {saved ? 'Saved!' : saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/10">
          <span className="text-xs font-mono text-muted-foreground">robots.txt</span>
          <span className="text-xs text-muted-foreground">{lines} lines</span>
        </div>
        <div className="flex">
          {/* Line numbers */}
          <div className="py-4 px-3 bg-muted/10 border-r border-border select-none">
            {content.split('\n').map((_, i) => (
              <div key={i} className="text-xs font-mono text-muted-foreground/40 leading-6 text-right min-w-[2rem]">{i + 1}</div>
            ))}
          </div>
          <textarea
            value={loading ? 'Loading…' : content}
            onChange={e => setContent(e.target.value)}
            disabled={loading}
            className="flex-1 bg-background font-mono text-sm text-foreground px-4 py-4 focus:outline-none resize-none leading-6 min-h-[400px]"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { rule: 'User-agent: *', desc: 'Applies rule to all crawlers' },
          { rule: 'Disallow: /admin', desc: 'Blocks crawlers from /admin' },
          { rule: 'Allow: /', desc: 'Allows access to root and all sub-paths' },
        ].map(t => (
          <div key={t.rule} className="glass-card rounded-xl p-3">
            <code className="text-xs font-mono text-primary block mb-1">{t.rule}</code>
            <p className="text-xs text-muted-foreground">{t.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminRobots;
