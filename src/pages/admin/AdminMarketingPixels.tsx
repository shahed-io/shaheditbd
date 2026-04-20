import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Save, Plus, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { reloadMarketingPixelsCache, type Platform, type PixelAccount, type MarketingPixelsConfig } from '@/components/store/MarketingPixels';

const PLATFORMS: { key: Platform; label: string; emoji: string; placeholder: string; supportsCAPI?: boolean; help: string; learn: string }[] = [
  { key: 'tiktok',    label: 'TikTok',      emoji: '🎵', placeholder: 'C12ABC...XYZ',     supportsCAPI: true, help: 'TikTok Pixel ID (Events Manager → Connect Data Source → Web)', learn: 'https://ads.tiktok.com/help/article?aid=10028' },
  { key: 'snapchat',  label: 'Snapchat',    emoji: '👻', placeholder: 'xxxxxxxx-xxxx-xxxx', help: 'Snap Pixel ID (Snap Ads Manager → Events Manager)', learn: 'https://businesshelp.snapchat.com/s/article/snap-pixel-about' },
  { key: 'pinterest', label: 'Pinterest',   emoji: '📌', placeholder: '2612345678901',     help: 'Pinterest Tag ID (Pinterest Ads → Conversions)',  learn: 'https://help.pinterest.com/en/business/article/install-the-pinterest-tag' },
  { key: 'linkedin',  label: 'LinkedIn',    emoji: '💼', placeholder: '1234567',           help: 'LinkedIn Insight Tag Partner ID',                  learn: 'https://www.linkedin.com/help/lms/answer/a418880' },
  { key: 'twitter',   label: 'Twitter / X', emoji: '𝕏',  placeholder: 'oXXXX',              help: 'X Ads Pixel ID (Ads.x.com → Tools → Events Manager)', learn: 'https://business.x.com/en/help/campaign-measurement-and-analytics/conversion-tracking-for-websites.html' },
];

const EMPTY: MarketingPixelsConfig = { tiktok: [], snapchat: [], pinterest: [], linkedin: [], twitter: [] };

const newAccount = (): PixelAccount => ({
  id: crypto.randomUUID(),
  name: '',
  pixel_id: '',
  enabled: true,
});

const AdminMarketingPixels = () => {
  const [cfg, setCfg] = useState<MarketingPixelsConfig>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('site_settings').select('value').eq('key', 'marketing_pixels').maybeSingle();
      try {
        const parsed = JSON.parse(data?.value || '{}');
        setCfg({ ...EMPTY, ...parsed });
      } catch { setCfg(EMPTY); }
      setLoading(false);
    })();
  }, []);

  const update = (platform: Platform, idx: number, patch: Partial<PixelAccount>) => {
    setCfg(prev => ({ ...prev, [platform]: prev[platform].map((a, i) => i === idx ? { ...a, ...patch } : a) }));
  };
  const add = (platform: Platform) => setCfg(prev => ({ ...prev, [platform]: [...prev[platform], newAccount()] }));
  const remove = (platform: Platform, idx: number) => setCfg(prev => ({ ...prev, [platform]: prev[platform].filter((_, i) => i !== idx) }));

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('site_settings').upsert({
      key: 'marketing_pixels',
      value: JSON.stringify(cfg),
      category: 'marketing',
    }, { onConflict: 'key' });
    setSaving(false);
    if (error) { toast.error('Save failed: ' + error.message); return; }
    reloadMarketingPixelsCache();
    toast.success('Marketing Pixels সেভ হয়েছে! Page reload করুন।');
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black">Marketing Pixels</h1>
          <p className="text-sm text-muted-foreground mt-1">TikTok, Snapchat, Pinterest, LinkedIn ও X — সব social pixel একসাথে manage করুন।</p>
        </div>
        <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 disabled:opacity-50">
          <Save size={16} /> {saving ? 'সেভ হচ্ছে…' : 'সব Save করুন'}
        </button>
      </div>

      {PLATFORMS.map(p => (
        <div key={p.key} className="glass-card rounded-2xl p-5 border border-border space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-lg flex items-center gap-2">
                <span className="text-2xl">{p.emoji}</span> {p.label}
                <a href={p.learn} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><ExternalLink size={14} /></a>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">{p.help}</p>
            </div>
            <button onClick={() => add(p.key)} className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs font-semibold flex items-center gap-1.5 flex-shrink-0">
              <Plus size={14} /> Add Account
            </button>
          </div>

          {cfg[p.key].length === 0 && (
            <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
              এখনও কোনো {p.label} pixel যোগ করা হয়নি।
            </div>
          )}

          {cfg[p.key].map((acc, idx) => (
            <div key={acc.id} className="border border-border rounded-xl p-4 space-y-3 bg-muted/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase text-muted-foreground">Account Name</label>
                  <input type="text" value={acc.name} onChange={e => update(p.key, idx, { name: e.target.value })} placeholder="e.g. Main Store" className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase text-muted-foreground">Pixel / Tag ID</label>
                  <input type="text" value={acc.pixel_id} onChange={e => update(p.key, idx, { pixel_id: e.target.value.trim() })} placeholder={p.placeholder} className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono" />
                </div>
              </div>

              {p.supportsCAPI && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                  <div>
                    <label className="text-[11px] font-semibold uppercase text-muted-foreground flex items-center justify-between">
                      Events API Token (optional)
                      <button onClick={() => setShowSecrets(s => ({ ...s, [acc.id]: !s[acc.id] }))} className="text-muted-foreground hover:text-primary">
                        {showSecrets[acc.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </label>
                    <input type={showSecrets[acc.id] ? 'text' : 'password'} value={acc.capi_token || ''} onChange={e => update(p.key, idx, { capi_token: e.target.value.trim() })} placeholder="Server-side conversion token" className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase text-muted-foreground">Test Event Code (optional)</label>
                    <input type="text" value={acc.capi_test_code || ''} onChange={e => update(p.key, idx, { capi_test_code: e.target.value.trim() })} placeholder="TEST12345" className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono" />
                  </div>
                </div>
              )}

              {p.key === 'snapchat' && (
                <div>
                  <label className="text-[11px] font-semibold uppercase text-muted-foreground">User Email (advanced matching)</label>
                  <input type="email" value={acc.user_email || ''} onChange={e => update(p.key, idx, { user_email: e.target.value.trim() })} placeholder="optional" className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={acc.enabled} onChange={e => update(p.key, idx, { enabled: e.target.checked })} className="w-4 h-4" />
                  <span className="text-xs font-semibold">{acc.enabled ? '🟢 Enabled' : '⚫ Disabled'}</span>
                </label>
                <button onClick={() => remove(p.key, idx)} className="text-destructive hover:text-destructive/80 text-xs flex items-center gap-1">
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}

      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-4 text-xs text-blue-900 dark:text-blue-200">
        <strong>📌 Note:</strong> Pixel save করার পর website পেজ reload করুন। সব social pixel-এ <code className="px-1 bg-blue-100 dark:bg-blue-900/50 rounded">PageView, ViewContent, AddToCart, InitiateCheckout, Purchase, Lead</code> events automatic ট্র্যাক হবে।
      </div>
    </div>
  );
};

export default AdminMarketingPixels;
