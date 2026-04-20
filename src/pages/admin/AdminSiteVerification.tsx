import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Save, ExternalLink, Shield, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface VerificationConfig {
  google: string;
  bing: string;
  yandex: string;
  pinterest: string;
  facebook: string;
  baidu: string;
  norton: string;
  ahrefs: string;
}

const PLATFORMS: { key: keyof VerificationConfig; label: string; emoji: string; help: string; example: string; metaTag: string; learn: string }[] = [
  { key: 'google',    label: 'Google Search Console', emoji: '🔵', help: 'search.google.com/search-console → Settings → Ownership verification → HTML tag', example: 'abc123XYZ...', metaTag: 'google-site-verification', learn: 'https://search.google.com/search-console' },
  { key: 'bing',      label: 'Bing Webmaster',        emoji: '🔷', help: 'bing.com/webmasters → Site → Ownership verification → Meta tag', example: 'A1B2C3D4E5F6...',  metaTag: 'msvalidate.01', learn: 'https://www.bing.com/webmasters' },
  { key: 'yandex',    label: 'Yandex Webmaster',      emoji: '🟥', help: 'webmaster.yandex.com → Site → Verify → Meta tag', example: '1234567890abcdef',           metaTag: 'yandex-verification', learn: 'https://webmaster.yandex.com' },
  { key: 'pinterest', label: 'Pinterest',             emoji: '📌', help: 'business.pinterest.com → Settings → Claimed accounts → Add HTML tag', example: 'a1b2c3...',                  metaTag: 'p:domain_verify', learn: 'https://business.pinterest.com' },
  { key: 'facebook',  label: 'Facebook Domain',       emoji: '🔵', help: 'business.facebook.com → Brand Safety → Domains → Add → Meta-tag verification', example: 'abc123...',          metaTag: 'facebook-domain-verification', learn: 'https://business.facebook.com' },
  { key: 'baidu',     label: 'Baidu (China SEO)',     emoji: '🐾', help: 'ziyuan.baidu.com → Site verification → HTML tag', example: 'code-XXXX',                    metaTag: 'baidu-site-verification', learn: 'https://ziyuan.baidu.com' },
  { key: 'norton',    label: 'Norton Safe Web',       emoji: '🟡', help: 'safeweb.norton.com → Submit site for review', example: 'XXXXXXX',                          metaTag: 'norton-safeweb-site-verification', learn: 'https://safeweb.norton.com' },
  { key: 'ahrefs',    label: 'Ahrefs Webmaster',      emoji: '📈', help: 'ahrefs.com/webmaster-tools → Verify → Meta tag', example: 'abcdef123...',                  metaTag: 'ahrefs-site-verification', learn: 'https://ahrefs.com/webmaster-tools' },
];

const EMPTY: VerificationConfig = { google: '', bing: '', yandex: '', pinterest: '', facebook: '', baidu: '', norton: '', ahrefs: '' };

const AdminSiteVerification = () => {
  const [cfg, setCfg] = useState<VerificationConfig>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('site_settings').select('value').eq('key', 'seo_verification').maybeSingle();
      try {
        const parsed = JSON.parse(data?.value || '{}');
        setCfg({ ...EMPTY, ...parsed });
      } catch { setCfg(EMPTY); }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('site_settings').upsert({
      key: 'seo_verification',
      value: JSON.stringify(cfg),
      category: 'seo',
    }, { onConflict: 'key' });
    setSaving(false);
    if (error) { toast.error('Save failed: ' + error.message); return; }
    toast.success('Verification meta tags সেভ হয়েছে! Page reload করুন।');
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2"><Shield className="text-primary" size={24} /> Site Verification</h1>
          <p className="text-sm text-muted-foreground mt-1">Search engines, social platforms ও SEO tools-এ ownership verify করতে meta-tag content paste করুন।</p>
        </div>
        <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 disabled:opacity-50">
          <Save size={16} /> {saving ? 'সেভ হচ্ছে…' : 'Save All'}
        </button>
      </div>

      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4 text-xs text-amber-900 dark:text-amber-200">
        <strong>💡 Tip:</strong> শুধু <code className="px-1 bg-amber-100 dark:bg-amber-900/50 rounded">content="..."</code> অংশের value paste করুন, পুরো meta tag নয়। সাইটের <code>{`<head>`}</code>-এ automatic inject হবে।
      </div>

      <div className="grid grid-cols-1 gap-3">
        {PLATFORMS.map(p => (
          <div key={p.key} className="glass-card rounded-xl p-4 border border-border">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{p.emoji}</span>
                  <h3 className="font-bold text-sm">{p.label}</h3>
                  {cfg[p.key] && <CheckCircle2 size={14} className="text-green-500" />}
                  <a href={p.learn} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary ml-auto"><ExternalLink size={12} /></a>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{p.help}</p>
                <code className="text-[10px] text-muted-foreground block mt-1">{`<meta name="${p.metaTag}" content="..."/>`}</code>
              </div>
            </div>
            <input
              type="text"
              value={cfg[p.key]}
              onChange={e => setCfg(prev => ({ ...prev, [p.key]: e.target.value.trim() }))}
              placeholder={p.example}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSiteVerification;
