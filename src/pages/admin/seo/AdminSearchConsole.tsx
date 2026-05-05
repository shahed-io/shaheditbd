import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, Save, Check, ExternalLink, Copy, Globe } from 'lucide-react';
import { toast } from 'sonner';
import SearchConsoleWidget from '@/components/admin/SearchConsoleWidget';

const AdminSearchConsole = () => {
  const [verifyCode, setVerifyCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'google_site_verification').maybeSingle().then(({ data }) => {
      setVerifyCode(data?.value || '');
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from('site_settings').upsert({ key: 'google_site_verification', value: verifyCode, category: 'seo' }, { onConflict: 'key' });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    toast.success('Verification code saved!');
  };

  const SITE_URL = 'https://shahedstore.com.bd';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Google <span className="gradient-text">Search Console</span>
          </h1>
          <p className="text-muted-foreground text-sm">Verify your site and submit sitemaps to Google</p>
        </div>
      </div>

      {/* Performance widget — last 28 days */}
      <SearchConsoleWidget />

      {/* Verification */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-foreground">Site Verification</h3>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Google Verification Code — <span className="opacity-60">Paste the content="" value from the meta tag</span>
          </label>
          <div className="flex gap-3">
            <input value={loading ? '' : verifyCode} onChange={e => setVerifyCode(e.target.value)}
              placeholder="google-site-verification=xxxxxxxxxxxxxxxx"
              className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:border-primary transition-colors" />
            <button onClick={save} disabled={saving} className="btn-glow px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-60">
              {saved ? <Check size={14} /> : saving ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
              {saved ? 'Saved!' : 'Save'}
            </button>
          </div>
          {verifyCode && <p className="text-xs text-green-400 mt-1.5">✓ Verification tag will be auto-injected in &lt;head&gt;</p>}
        </div>

        {verifyCode && (
          <div className="bg-muted/20 rounded-xl p-3 border border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">Generated Meta Tag</p>
              <button onClick={() => { navigator.clipboard.writeText(`<meta name="google-site-verification" content="${verifyCode}" />`); toast.success('Copied!'); }}
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors"><Copy size={11} /> Copy</button>
            </div>
            <code className="text-xs font-mono text-muted-foreground">{`<meta name="google-site-verification" content="${verifyCode}" />`}</code>
          </div>
        )}
      </div>

      {/* Sitemap submission guide */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Globe size={16} /> Sitemap Submission</h3>
        <div className="flex items-center gap-3 bg-muted/20 rounded-xl px-4 py-3 border border-border">
          <code className="text-sm font-mono text-primary flex-1">{SITE_URL}/sitemap.xml</code>
          <button onClick={() => { navigator.clipboard.writeText(`${SITE_URL}/sitemap.xml`); toast.success('Copied!'); }}
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors"><Copy size={11} /> Copy</button>
        </div>
        <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer"
          className="btn-glow inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium">
          <ExternalLink size={14} /> Open Search Console
        </a>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { step: '1', title: 'Open GSC', desc: 'Go to search.google.com/search-console' },
          { step: '2', title: 'Add Property', desc: 'Add your domain: shahedstore.com.bd' },
          { step: '3', title: 'Verify Ownership', desc: 'Copy meta tag code and paste above, then click Save' },
          { step: '4', title: 'Submit Sitemap', desc: 'In GSC: Sitemaps → Enter sitemap URL → Submit' },
        ].map(s => (
          <div key={s.step} className="glass-card rounded-2xl p-4">
            <div className="w-7 h-7 rounded-lg btn-glow flex items-center justify-center text-white font-bold text-xs mb-2">{s.step}</div>
            <h4 className="font-semibold text-sm text-foreground mb-1">{s.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSearchConsole;
