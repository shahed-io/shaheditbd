import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabase as sb } from '@/integrations/supabase/client';
import { Tag, Save, Check, Eye } from 'lucide-react';
import { toast } from 'sonner';

const FIELDS = [
  { key: 'meta_title_template', label: 'Title Template', placeholder: '%s | Shahed Store', hint: 'Use %s for the page title. Max 60 chars.' },
  { key: 'meta_title_separator', label: 'Title Separator', placeholder: '|', hint: 'Character between page title and site name.' },
  { key: 'site_name', label: 'Site Name', placeholder: 'Shahed Store', hint: 'Used in OG and Twitter meta tags.' },
  { key: 'og_image', label: 'Default OG Image URL', placeholder: 'https://shahedstore.com.bd/og-image.png', hint: 'Recommended: 1200×630px. Shown on social shares.' },
  { key: 'twitter_site', label: 'Twitter / X Handle', placeholder: '@shahedstore', hint: 'Your Twitter handle for Twitter Cards.' },
  { key: 'twitter_card_type', label: 'Twitter Card Type', placeholder: 'summary_large_image', hint: 'summary | summary_large_image | app' },
  { key: 'meta_author', label: 'Meta Author', placeholder: 'Shahed Store', hint: 'Default author meta tag value.' },
  { key: 'meta_robots_default', label: 'Default Robots Directive', placeholder: 'index, follow', hint: 'Applied to all pages without custom robots settings.' },
  { key: 'canonical_base_url', label: 'Canonical Base URL', placeholder: 'https://shahedstore.com.bd', hint: 'Your primary domain for canonical URLs.' },
];

const AdminMetaTags = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const keys = FIELDS.map(f => f.key);
    supabase.from('site_settings').select('key,value').in('key', keys).then(({ data }) => {
      const map: Record<string, string> = {};
      data?.forEach(r => { map[r.key] = r.value || ''; });
      setSettings(map);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    await Promise.all(FIELDS.map(f =>
      supabase.from('site_settings').upsert({ key: f.key, value: settings[f.key] || '', category: 'seo' }, { onConflict: 'key' })
    ));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    toast.success('Meta tag settings saved!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Meta <span className="gradient-text">Tag Manager</span>
          </h1>
          <p className="text-muted-foreground text-sm">Global meta tags used across all pages</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-glow px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-60">
          {saved ? <Check size={14} /> : saving ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
          {saved ? 'Saved!' : saving ? 'Saving…' : 'Save All'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-16 glass-card rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FIELDS.map(f => (
              <div key={f.key}>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  {f.label} <span className="opacity-60">— {f.hint}</span>
                </label>
                <input
                  value={settings[f.key] || ''}
                  onChange={e => setSettings(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            ))}
          </div>

          {/* Preview card */}
          <div className="bg-muted/20 border border-border rounded-xl p-4 mt-2">
            <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-wider">Generated Title Preview</p>
            <p className="text-sm font-semibold text-foreground">
              {settings['meta_title_template']?.replace('%s', 'Windows 11 Pro') || 'Windows 11 Pro | Shahed Store'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMetaTags;
