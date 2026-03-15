import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Code2, Save, Check, Eye } from 'lucide-react';
import { toast } from 'sonner';

const AdminSchema = () => {
  const [org, setOrg] = useState({ name: 'Shahed Store', url: 'https://shahedstore.com.bd', logo: '', phone: '', email: '', facebook: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'schema_organization').maybeSingle().then(({ data }) => {
      try { if (data?.value) setOrg(JSON.parse(data.value)); } catch {}
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from('site_settings').upsert({ key: 'schema_organization', value: JSON.stringify(org), category: 'seo' }, { onConflict: 'key' });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    toast.success('Schema saved!');
  };

  const schemaJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": org.name,
    "url": org.url,
    ...(org.logo ? { "logo": org.logo } : {}),
    ...(org.phone ? { "telephone": org.phone } : {}),
    ...(org.email ? { "email": org.email } : {}),
    ...(org.description ? { "description": org.description } : {}),
    ...(org.facebook ? { "sameAs": [org.facebook] } : {}),
  }, null, 2);

  const FIELDS = [
    { key: 'name', label: 'Organization Name', placeholder: 'Shahed Store' },
    { key: 'url', label: 'Website URL', placeholder: 'https://shahedstore.com.bd' },
    { key: 'logo', label: 'Logo URL', placeholder: 'https://shahedstore.com.bd/logo.png' },
    { key: 'phone', label: 'Phone Number', placeholder: '+8801840099853' },
    { key: 'email', label: 'Email Address', placeholder: 'info@shahedstore.com.bd' },
    { key: 'facebook', label: 'Facebook URL', placeholder: 'https://facebook.com/shahedstore' },
    { key: 'description', label: 'Description', placeholder: "Bangladesh's trusted digital software store" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Schema <span className="gradient-text">Generator</span>
          </h1>
          <p className="text-muted-foreground text-sm">JSON-LD structured data for rich search results</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPreview(p => !p)} className="glass-card px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:text-primary transition-colors">
            <Eye size={14} /> {preview ? 'Hide' : 'Preview'} JSON
          </button>
          <button onClick={save} disabled={saving} className="btn-glow px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-60">
            {saved ? <Check size={14} /> : saving ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
            {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Schema'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-foreground flex items-center gap-2"><Code2 size={16} /> Organization Schema</h3>
          {FIELDS.map(f => (
            <div key={f.key}>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
              <input value={(org as any)[f.key]} onChange={e => setOrg(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {/* Enabled schemas */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-bold text-foreground mb-3">Auto-Generated Schemas</h3>
            <div className="space-y-2">
              {[
                { label: 'Organization Schema', page: 'Homepage', active: true },
                { label: 'Website Schema', page: 'Homepage', active: true },
                { label: 'Product Schema', page: 'Product Pages', active: true },
                { label: 'Article Schema', page: 'Blog Posts', active: true },
                { label: 'FAQ Schema', page: 'FAQ Page + Products', active: true },
                { label: 'BreadcrumbList Schema', page: 'All Pages', active: true },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <div><p className="text-sm font-medium text-foreground">{s.label}</p><p className="text-xs text-muted-foreground">{s.page}</p></div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/15 text-green-500">Active</span>
                </div>
              ))}
            </div>
          </div>

          {preview && (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-muted/10">
                <span className="text-xs font-mono text-muted-foreground">organization.json-ld</span>
              </div>
              <pre className="p-4 text-xs font-mono text-muted-foreground overflow-auto max-h-64">{schemaJson}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSchema;
