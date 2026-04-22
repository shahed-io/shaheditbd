import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart2, Save, Check, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';

const AdminGoogleAnalytics = () => {
  const [gaId, setGaId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'google_analytics').maybeSingle().then(({ data }) => {
      setGaId(data?.value || '');
      setLoading(false);
    });
  }, []);

  const save = async () => {
    if (gaId && !gaId.match(/^G-[A-Z0-9]+$/)) return toast.error('Invalid GA4 ID. Format: G-XXXXXXXXXX');
    setSaving(true);
    await supabase.from('site_settings').upsert({ key: 'google_analytics', value: gaId, category: 'seo' }, { onConflict: 'key' });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    toast.success('Google Analytics ID saved!');
  };

  const snippet = gaId ? `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${gaId}');
</script>` : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Google <span className="gradient-text">Analytics</span>
          </h1>
          <p className="text-muted-foreground text-sm">Connect GA4 for traffic insights and conversion tracking</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            GA4 Measurement ID — <span className="opacity-60">Format: G-XXXXXXXXXX</span>
          </label>
          <div className="flex gap-3">
            <input value={loading ? '' : gaId} onChange={e => setGaId(e.target.value.toUpperCase())}
              placeholder="G-XXXXXXXXXX"
              className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:border-primary transition-colors" />
            <button onClick={save} disabled={saving} className="btn-glow px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-60">
              {saved ? <Check size={14} /> : saving ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
              {saved ? 'Saved!' : 'Save'}
            </button>
          </div>
          {gaId && <p className="text-xs text-green-400 mt-1.5">✓ GA4 ID will be auto-injected into all pages</p>}
        </div>

        {gaId && (
          <div className="bg-muted/20 rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">Generated Script Tag</p>
              <button onClick={() => { navigator.clipboard.writeText(snippet); toast.success('Copied!'); }}
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors">
                <Copy size={11} /> Copy
              </button>
            </div>
            <pre className="text-xs font-mono text-muted-foreground overflow-auto">{snippet}</pre>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { step: '1', title: 'Create GA4 Property', desc: 'Go to analytics.google.com → Admin → Create Property → GA4', url: 'https://analytics.google.com' },
          { step: '2', title: 'Get Measurement ID', desc: 'Admin → Data Streams → Your stream → Measurement ID (G-XXXXXXXX)', url: 'https://analytics.google.com' },
          { step: '3', title: 'Paste & Save', desc: 'Enter the Measurement ID above and click Save. Auto-injected!', url: null },
        ].map(s => (
          <div key={s.step} className="glass-card rounded-2xl p-5">
            <div className="w-8 h-8 rounded-lg btn-glow flex items-center justify-center text-white font-bold text-sm mb-3">{s.step}</div>
            <h4 className="font-semibold text-sm text-foreground mb-1">{s.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-2 mt-2"><ExternalLink size={10} /> Open</a>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminGoogleAnalytics;
