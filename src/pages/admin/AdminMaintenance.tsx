import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Wrench, ToggleLeft, ToggleRight, Eye, AlertTriangle } from 'lucide-react';
import MaintenanceScreen from '@/components/store/MaintenanceScreen';
import {
  MAINTENANCE_KEY,
  MAINTENANCE_DEFAULT,
  parseMaintenance,
  type MaintenanceSettings,
} from '@/hooks/useMaintenanceMode';

const AdminMaintenance = () => {
  const [settings, setSettings] = useState<MaintenanceSettings>(MAINTENANCE_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

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
    toast.success(next.enabled ? 'Maintenance mode is ON' : 'Maintenance mode is OFF');
  };

  const toggle = async () => {
    const next = { ...settings, enabled: !settings.enabled };
    setSettings(next);
    await save(next);
  };

  const inputCls =
    'w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors';

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
          <p className="text-muted-foreground text-sm">Take the storefront offline with a premium maintenance page</p>
        </div>
        <div className="flex gap-2">
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
            Visitors currently see the maintenance page. Admin panel (<span className="font-mono text-xs">/ceo</span>) and logged-in admins are not affected.
          </div>
        </div>
      )}

      {/* Content */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-foreground">Page Content</h3>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Title</label>
          <input value={settings.title} onChange={e => setSettings(p => ({ ...p, title: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Message</label>
          <textarea rows={3} value={settings.message} onChange={e => setSettings(p => ({ ...p, message: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">ETA / Back-online note (optional)</label>
          <input value={settings.eta} onChange={e => setSettings(p => ({ ...p, eta: e.target.value }))} placeholder="আমরা ২ ঘণ্টার মধ্যে ফিরে আসছি" className={inputCls} />
        </div>
      </div>

      {/* Contact */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">Contact Buttons</h3>
          <button
            onClick={() => setSettings(p => ({ ...p, showContact: !p.showContact }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              settings.showContact ? 'bg-primary/20 text-primary border border-primary/30' : 'glass-card text-muted-foreground'
            }`}
          >
            {settings.showContact ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            {settings.showContact ? 'Shown' : 'Hidden'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">WhatsApp number</label>
            <input value={settings.whatsapp} onChange={e => setSettings(p => ({ ...p, whatsapp: e.target.value }))} placeholder="8801XXXXXXXXX" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Support email</label>
            <input value={settings.email} onChange={e => setSettings(p => ({ ...p, email: e.target.value }))} placeholder="support@shahedstore.com.bd" className={inputCls} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMaintenance;
