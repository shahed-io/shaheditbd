import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Save, Globe, Phone, Mail, MapPin, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const AdminSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    const { data } = await supabase.from('site_settings').select('*');
    const map: Record<string, string> = {};
    data?.forEach(s => { map[s.key] = s.value || ''; });
    setSettings(map);
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async () => {
    setSaving(true);
    const updates = Object.entries(settings).map(([key, value]) =>
      supabase.from('site_settings').upsert({ key, value }, { onConflict: 'key' })
    );
    await Promise.all(updates);
    toast.success('Settings saved!');
    setSaving(false);
  };

  const settingGroups = [
    {
      title: 'General Information',
      icon: Globe,
      fields: [
        { key: 'site_name', label: 'Store Name', placeholder: 'Shahed Store' },
        { key: 'site_email', label: 'Support Email', placeholder: 'support@example.com' },
        { key: 'site_phone', label: 'Phone Number', placeholder: '01XXXXXXXXX' },
        { key: 'site_address', label: 'Address', placeholder: 'Dhaka, Bangladesh' },
      ]
    },
    {
      title: 'Currency & Payment',
      icon: DollarSign,
      fields: [
        { key: 'currency', label: 'Currency Code', placeholder: 'BDT' },
        { key: 'currency_symbol', label: 'Currency Symbol', placeholder: '৳' },
        { key: 'min_order_amount', label: 'Minimum Order Amount', placeholder: '0' },
      ]
    },
    {
      title: 'Order Settings',
      icon: Globe,
      fields: [
        { key: 'order_prefix', label: 'Order Number Prefix', placeholder: 'SS-' },
      ]
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Site <span className="gradient-text">Settings</span>
          </h1>
          <p className="text-muted-foreground text-sm">Configure your store settings</p>
        </div>
        <button onClick={handleSave} disabled={saving || loading} className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({length: 3}).map((_, i) => <div key={i} className="h-40 glass-card rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {settingGroups.map((group) => (
            <div key={group.title} className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                  <group.icon size={18} className="text-primary" />
                </div>
                <h3 className="font-bold text-foreground">{group.title}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.fields.map((field) => (
                  <div key={field.key}>
                    <label className="text-xs text-muted-foreground mb-1.5 block">{field.label}</label>
                    <input
                      value={settings[field.key] || ''}
                      onChange={e => setSettings({ ...settings, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Admin Setup Section */}
          <div className="glass-card rounded-2xl p-6 border-primary/30">
            <h3 className="font-bold text-foreground mb-1">🔐 Admin Account</h3>
            <p className="text-muted-foreground text-sm mb-4">Manage admin user access from Lovable Cloud dashboard.</p>
            <div className="bg-primary/10 rounded-xl p-4 text-sm text-primary">
              To add admin users: Go to Lovable Cloud → Database → user_roles → Insert row with role = 'admin'
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
