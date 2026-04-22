import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Save, Globe, Phone, Mail, MapPin, Shield, Share2, CreditCard, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { FOOTER_DEFAULTS, FOOTER_SETTINGS_KEY, type FooterSettings } from '@/hooks/useFooterSettings';

const AdminFooterSettings = () => {
  const [settings, setSettings] = useState<FooterSettings>(FOOTER_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', FOOTER_SETTINGS_KEY)
        .maybeSingle();
      if (data?.value) {
        try {
          setSettings({ ...FOOTER_DEFAULTS, ...JSON.parse(data.value) });
        } catch { /* use defaults */ }
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: FOOTER_SETTINGS_KEY, value: JSON.stringify(settings), category: 'store' }, { onConflict: 'key' });
    if (error) toast.error('সেভ করতে সমস্যা হয়েছে');
    else toast.success('ফুটার সেটিংস সেভ হয়েছে!');
    setSaving(false);
  };

  const update = (key: keyof FooterSettings, value: string) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const inputCls = "w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors";

  const Section = ({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) => (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
          <Icon size={18} className="text-primary" />
        </div>
        <h3 className="font-bold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, k, placeholder, hint }: { label: string; k: keyof FooterSettings; placeholder?: string; hint?: string }) => (
    <div>
      <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
      <input
        value={settings[k]}
        onChange={e => update(k, e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );

  if (loading) return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 glass-card rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Footer <span className="gradient-text">Settings</span>
          </h1>
          <p className="text-muted-foreground text-sm">ফুটারের সকল তথ্য এখান থেকে এডিট করুন</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Store Info */}
      <Section title="স্টোর তথ্য" icon={Globe}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Store Name" k="store_name" placeholder="Shahed Store" />
          <Field label="Website URL" k="website_url" placeholder="https://www.shahedstore.com.bd" />
        </div>
        <div className="mt-4">
          <label className="text-xs text-muted-foreground mb-1.5 block">Tagline / বর্ণনা</label>
          <textarea
            value={settings.tagline}
            onChange={e => update('tagline', e.target.value)}
            rows={2}
            className={inputCls + ' resize-none'}
            placeholder="বাংলাদেশের সবচেয়ে বিশ্বস্ত..."
          />
        </div>
      </Section>

      {/* Contact Info */}
      <Section title="যোগাযোগ তথ্য" icon={Phone}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="ফোন নম্বর" k="phone" placeholder="01840-099853" />
          <Field label="ইমেইল" k="email" placeholder="info@shahedstore.com.bd" />
          <Field label="ঠিকানা" k="address" placeholder="Ishwardi, Pabna" />
        </div>
      </Section>

      {/* Trust Badge */}
      <Section title="Trust Badge / সার্টিফিকেশন" icon={Shield}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="সার্টিফিকেশন টাইটেল" k="cert_title" placeholder="GOVT. CERTIFIED BUSINESS" />
          <Field label="সার্টিফিকেশন আইডি" k="cert_id" placeholder="DBID: 586772174" />
          <Field label="স্ট্যাটাস টেক্সট" k="status_text" placeholder="Trusted Digital Product Store" />
        </div>
      </Section>

      {/* Payment Methods */}
      <Section title="পেমেন্ট মেথড (ফুটারে দেখাবে)" icon={CreditCard}>
        <Field
          label="পেমেন্ট মেথড (কমা দিয়ে আলাদা করুন)"
          k="payment_methods"
          placeholder="bKash,Nagad,Rocket,Upay,bKash Merchant"
          hint="উদাহরণ: bKash,Nagad,Rocket — প্রতিটি নাম কমা দিয়ে আলাদা করুন"
        />
      </Section>

      {/* Social Links */}
      <Section title="সোশ্যাল মিডিয়া লিংক" icon={Share2}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Facebook URL" k="facebook_url" placeholder="https://www.facebook.com/..." />
          <Field label="WhatsApp URL" k="whatsapp_url" placeholder="https://wa.me/..." />
          <Field label="Instagram URL" k="instagram_url" placeholder="https://www.instagram.com/..." />
          <Field label="Telegram URL" k="telegram_url" placeholder="https://t.me/..." />
        </div>
      </Section>
    </div>
  );
};

export default AdminFooterSettings;
