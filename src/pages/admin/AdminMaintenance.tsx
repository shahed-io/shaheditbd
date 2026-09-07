import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Wrench, ToggleLeft, ToggleRight, Eye, AlertTriangle, RotateCcw, Palette, Upload, Code2 } from 'lucide-react';
import MaintenanceScreen from '@/components/store/MaintenanceScreen';
import {
  MAINTENANCE_KEY,
  MAINTENANCE_AREAS,
  MAINTENANCE_DEFAULT,
  parseMaintenance,
  type MaintenanceSettings,
} from '@/hooks/useMaintenanceMode';

const AdminMaintenance = () => {
  const [settings, setSettings] = useState<MaintenanceSettings>(MAINTENANCE_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('site_settings').select('value').eq('key', MAINTENANCE_KEY).maybeSingle();
      setSettings(parseMaintenance(data?.value));
      setLoading(false);
    })();
  }, []);

  const save = async (next: MaintenanceSettings) => {
    setSaving(true);
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: MAINTENANCE_KEY, value: JSON.stringify(next) }, { onConflict: 'key' });
    setSaving(false);
    if (error) { toast.error('Save failed: ' + error.message); return; }
    try { new BroadcastChannel('maintenance-mode').postMessage(next); } catch {}
    toast.success('Maintenance settings saved');
  };

  const toggle = async () => {
    const next = { ...settings, enabled: !settings.enabled };
    setSettings(next);
    await save(next);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `maintenance/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      setSettings(p => ({ ...p, customLogo: data.publicUrl }));
      toast.success('Image uploaded — click Save Changes to apply');
    } catch (e: any) {
      toast.error('Upload failed: ' + (e?.message || 'unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const ColorInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="flex items-center gap-2">
      <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'} onChange={e => onChange(e.target.value)} className="h-10 w-12 rounded-lg border border-border bg-transparent cursor-pointer" />
      <input value={value} onChange={e => onChange(e.target.value)} className={inputCls} />
    </div>
  );

  const set = <K extends keyof MaintenanceSettings>(key: K, value: MaintenanceSettings[K]) =>
    setSettings(p => ({ ...p, [key]: value }));

  const inputCls =
    'w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors';

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
      {children}
    </div>
  );

  const Switch = ({ on, onClick, labels }: { on: boolean; onClick: () => void; labels: [string, string] }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
        on ? 'bg-primary/20 text-primary border border-primary/30' : 'glass-card text-muted-foreground'
      }`}
    >
      {on ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
      {on ? labels[0] : labels[1]}
    </button>
  );

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 glass-card rounded-2xl animate-pulse" />)}</div>;

  if (preview) {
    return (
      <div className="space-y-4">
        <button onClick={() => setPreview(false)} className="btn-glow px-5 py-2.5 rounded-xl text-sm font-semibold">
          ← Back to Settings
        </button>
        <div className="rounded-2xl overflow-hidden border border-border">
          <MaintenanceScreen settings={settings} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Maintenance <span className="gradient-text">Mode</span>
          </h1>
          <p className="text-muted-foreground text-sm">Full control of the maintenance page — content, contact info and visibility</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setSettings(p => ({ ...MAINTENANCE_DEFAULT, enabled: p.enabled })); toast.info('Reset to defaults — click Save to apply'); }}
            className="glass-card px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button onClick={() => setPreview(true)} className="glass-card px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold text-foreground">
            <Eye size={16} /> Preview
          </button>
          <button onClick={() => save(settings)} disabled={saving} className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold">
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Master switch */}
      <div className="glass-card rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${settings.enabled ? 'bg-orange-400/15' : 'bg-muted/40'}`}>
            <Wrench size={18} className={settings.enabled ? 'text-orange-400' : 'text-muted-foreground'} />
          </div>
          <div>
            <div className="font-bold text-foreground">Maintenance Mode</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {settings.enabled ? 'Site is OFFLINE for visitors — admins can still browse' : 'Site is live for everyone'}
            </div>
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            settings.enabled ? 'bg-orange-400/20 text-orange-400 border border-orange-400/30' : 'glass-card text-muted-foreground'
          }`}
        >
          {settings.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          {settings.enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {settings.enabled && (
        <div className="rounded-2xl p-4 flex items-start gap-3 border border-orange-400/30 bg-orange-400/10">
          <AlertTriangle size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-foreground">
            {settings.scope === 'all'
              ? 'The ENTIRE website is offline for visitors.'
              : `Only ${settings.areas.length} selected area(s) are offline for visitors.`}{' '}
            Admin panel (<span className="font-mono text-xs">/ceo</span>) and logged-in admins are not affected.
          </div>
        </div>
      )}

      {/* Scope */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="font-bold text-foreground">Coverage</h3>
          <p className="text-xs text-muted-foreground mt-1">Put the whole website in maintenance, or only selected areas.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(['all', 'selected'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => set('scope', opt)}
              className={`text-left rounded-xl p-4 border transition-all ${
                settings.scope === opt ? 'border-primary bg-primary/10' : 'border-border bg-muted/20'
              }`}
            >
              <div className="font-semibold text-sm text-foreground">
                {opt === 'all' ? 'Entire website' : 'Selected areas only'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {opt === 'all' ? 'Every public page shows the maintenance screen.' : 'Pick exactly which sections go offline.'}
              </div>
            </button>
          ))}
        </div>

        {settings.scope === 'selected' && (
          <div className="space-y-3 pt-2">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => set('areas', MAINTENANCE_AREAS.map(a => a.key))}
                className="glass-card px-4 py-2 rounded-xl text-xs font-semibold text-foreground"
              >
                Select all
              </button>
              <button onClick={() => set('areas', [])} className="glass-card px-4 py-2 rounded-xl text-xs font-semibold text-foreground">
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {MAINTENANCE_AREAS.map(area => {
                const checked = settings.areas.includes(area.key);
                return (
                  <label
                    key={area.key}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      checked ? 'border-primary/50 bg-primary/10' : 'border-border bg-muted/20'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e =>
                        set('areas', e.target.checked ? [...settings.areas, area.key] : settings.areas.filter(k => k !== area.key))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                    />
                    <div>
                      <div className="text-sm font-semibold text-foreground">{area.label}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{area.hint}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>


      {/* Custom design / theme (optional) */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${settings.customEnabled ? 'bg-primary/15' : 'bg-muted/40'}`}>
              <Palette size={18} className={settings.customEnabled ? 'text-primary' : 'text-muted-foreground'} />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Custom Design / Theme</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Optional. When ON, your own design replaces the default maintenance page.
              </p>
            </div>
          </div>
          <Switch on={settings.customEnabled} onClick={() => set('customEnabled', !settings.customEnabled)} labels={['Custom design ON', 'Using default design']} />
        </div>

        {settings.customEnabled && (
          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([['theme', 'Theme builder', 'Pick colors, upload a logo/image and write your text.'], ['html', 'Custom HTML / CSS', 'Paste your own full-page HTML & CSS design.']] as const).map(([opt, title, desc]) => (
                <button
                  key={opt}
                  onClick={() => set('customMode', opt as 'theme' | 'html')}
                  className={`text-left rounded-xl p-4 border transition-all ${settings.customMode === opt ? 'border-primary bg-primary/10' : 'border-border bg-muted/20'}`}
                >
                  <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                    {opt === 'html' ? <Code2 size={14} /> : <Palette size={14} />} {title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{desc}</div>
                </button>
              ))}
            </div>

            {settings.customMode === 'theme' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="Background top"><ColorInput value={settings.customBgFrom} onChange={v => set('customBgFrom', v)} /></Field>
                  <Field label="Background bottom"><ColorInput value={settings.customBgTo} onChange={v => set('customBgTo', v)} /></Field>
                  <Field label="Accent color"><ColorInput value={settings.customAccent} onChange={v => set('customAccent', v)} /></Field>
                  <Field label="Text color"><ColorInput value={settings.customTextColor} onChange={v => set('customTextColor', v)} /></Field>
                  <Field label="Muted text color"><input value={settings.customMutedColor} onChange={e => set('customMutedColor', e.target.value)} className={inputCls} /></Field>
                  <Field label="Card background (CSS color)"><input value={settings.customCardBg} onChange={e => set('customCardBg', e.target.value)} className={inputCls} /></Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Font family (CSS)"><input value={settings.customFont} onChange={e => set('customFont', e.target.value)} className={inputCls} /></Field>
                  <Field label="Card corner radius (px)">
                    <input type="number" value={settings.customRadius} onChange={e => set('customRadius', Number(e.target.value) || 0)} className={inputCls} />
                  </Field>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="text-sm font-semibold text-foreground">Logo / Image</div>
                  <Switch on={settings.customShowLogo} onClick={() => set('customShowLogo', !settings.customShowLogo)} labels={['Shown', 'Hidden']} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                  <Field label="Image URL (or upload)">
                    <input value={settings.customLogo} onChange={e => set('customLogo', e.target.value)} placeholder="https://..." className={inputCls} />
                  </Field>
                  <label className="glass-card px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer">
                    <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload'}
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.currentTarget.value = ''; }} />
                  </label>
                </div>
                {settings.customLogo && (
                  <img src={settings.customLogo} alt="Custom maintenance preview" className="max-h-28 w-auto rounded-xl border border-border bg-muted/20 p-2" />
                )}

                <Field label="Headline"><input value={settings.customHeadline} onChange={e => set('customHeadline', e.target.value)} className={inputCls} /></Field>
                <Field label="Body text (Bangla / English mix supported)">
                  <textarea rows={4} value={settings.customBody} onChange={e => set('customBody', e.target.value)} className={inputCls} />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Button label (leave empty to hide)"><input value={settings.customButtonLabel} onChange={e => set('customButtonLabel', e.target.value)} className={inputCls} /></Field>
                  <Field label="Button link (empty = WhatsApp link above)"><input value={settings.customButtonUrl} onChange={e => set('customButtonUrl', e.target.value)} placeholder="https://..." className={inputCls} /></Field>
                </div>
                <Field label="Footer text"><input value={settings.customFooter} onChange={e => set('customFooter', e.target.value)} className={inputCls} /></Field>
                <Field label="Extra CSS (optional)">
                  <textarea rows={4} value={settings.customCss} onChange={e => set('customCss', e.target.value)} placeholder=".my-class { ... }" className={`${inputCls} font-mono text-xs`} />
                </Field>
              </div>
            ) : (
              <div className="space-y-4">
                <Field label="Full page HTML">
                  <textarea rows={16} value={settings.customHtml} onChange={e => set('customHtml', e.target.value)} className={`${inputCls} font-mono text-xs`} />
                </Field>
                <Field label="Extra CSS (optional)">
                  <textarea rows={6} value={settings.customCss} onChange={e => set('customCss', e.target.value)} className={`${inputCls} font-mono text-xs`} />
                </Field>
                <p className="text-xs text-muted-foreground">
                  Tip: use the <span className="font-semibold">Preview</span> button at the top to see your design before saving.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-foreground">Page Content</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Badge text (top pill)">
            <input value={settings.badge} onChange={e => set('badge', e.target.value)} placeholder="Maintenance" className={inputCls} />
          </Field>
          <Field label="Title">
            <input value={settings.title} onChange={e => set('title', e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Message (Bangla / English mix supported)">
          <textarea rows={4} value={settings.message} onChange={e => set('message', e.target.value)} className={inputCls} />
        </Field>
        <Field label="ETA / Back-online note (optional)">
          <input value={settings.eta} onChange={e => set('eta', e.target.value)} placeholder="Expected back online: ১-২ ঘণ্টার মধ্যে" className={inputCls} />
        </Field>
      </div>

      {/* Progress */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">Progress Bar</h3>
          <Switch on={settings.showProgress} onClick={() => set('showProgress', !settings.showProgress)} labels={['Shown', 'Hidden']} />
        </div>
        <Field label="Progress caption (animated dots are added automatically)">
          <input value={settings.progressText} onChange={e => set('progressText', e.target.value)} placeholder="কাজ চলছে" className={inputCls} />
        </Field>
      </div>

      {/* Contact */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">Contact & Support</h3>
          <Switch on={settings.showContact} onClick={() => set('showContact', !settings.showContact)} labels={['Shown', 'Hidden']} />
        </div>
        <Field label="Contact heading">
          <input value={settings.contactHeading} onChange={e => set('contactHeading', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Contact subtext">
          <input value={settings.contactSubtext} onChange={e => set('contactSubtext', e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="WhatsApp number (with country code)">
            <input value={settings.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="8801820060046" className={inputCls} />
          </Field>
          <Field label="WhatsApp button label">
            <input value={settings.whatsappLabel} onChange={e => set('whatsappLabel', e.target.value)} placeholder="Chat on WhatsApp" className={inputCls} />
          </Field>
        </div>
        <Field label="Pre-filled WhatsApp message">
          <input value={settings.whatsappMessage} onChange={e => set('whatsappMessage', e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Support email">
            <input value={settings.email} onChange={e => set('email', e.target.value)} placeholder="info@shahedit.com" className={inputCls} />
          </Field>
          <Field label="Hotline / phone">
            <input value={settings.phone} onChange={e => set('phone', e.target.value)} placeholder="01820-060046" className={inputCls} />
          </Field>
          <Field label="Website">
            <input value={settings.website} onChange={e => set('website', e.target.value)} placeholder="www.shahedit.com" className={inputCls} />
          </Field>
          <Field label="Address">
            <input value={settings.address} onChange={e => set('address', e.target.value)} placeholder="Dhaka, Bangladesh" className={inputCls} />
          </Field>
        </div>
      </div>

      {/* Social + footer */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">Social & Footer</h3>
          <Switch on={settings.showSocial} onClick={() => set('showSocial', !settings.showSocial)} labels={['Shown', 'Hidden']} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Facebook page URL">
            <input value={settings.facebook} onChange={e => set('facebook', e.target.value)} placeholder="https://facebook.com/..." className={inputCls} />
          </Field>
          <Field label="Footer text">
            <input value={settings.footerText} onChange={e => set('footerText', e.target.value)} className={inputCls} />
          </Field>
        </div>
      </div>
    </div>
  );
};

export default AdminMaintenance;
