import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, Loader2, Users, Target } from 'lucide-react';
import { toast } from 'sonner';

export interface CustomAudience {
  id: string;
  name: string;
  enabled: boolean;
  trigger_type: 'url_visit' | 'category_view' | 'min_cart_value' | 'product_view';
  trigger_value: string; // URL pattern, category slug, BDT amount, or product slug
  fb_event_name: string; // e.g. "ViewedHighValue"
  description: string;
}

const newAudience = (): CustomAudience => ({
  id: crypto.randomUUID(),
  name: 'New Audience',
  enabled: true,
  trigger_type: 'url_visit',
  trigger_value: '',
  fb_event_name: '',
  description: '',
});

const TRIGGER_LABELS: Record<CustomAudience['trigger_type'], string> = {
  url_visit: 'URL Visit (path contains)',
  category_view: 'Category Page View',
  min_cart_value: 'Cart Value ≥ BDT',
  product_view: 'Specific Product View',
};

const AdminCustomAudiences = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [audiences, setAudiences] = useState<CustomAudience[]>([]);

  useEffect(() => { (async () => {
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'fb_custom_audiences').maybeSingle();
    try { setAudiences(JSON.parse(data?.value || '[]')); } catch { setAudiences([]); }
    setLoading(false);
  })(); }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('site_settings').upsert({
      key: 'fb_custom_audiences',
      value: JSON.stringify(audiences),
      category: 'facebook_pixel',
    }, { onConflict: 'key' });
    setSaving(false);
    if (error) { toast.error('সেভ ব্যর্থ: ' + error.message); return; }
    toast.success('Custom Audiences সেভ হয়েছে। পেজ রিলোড করলে effective হবে।');
  };

  const update = (id: string, patch: Partial<CustomAudience>) =>
    setAudiences(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  const remove = (id: string) => setAudiences(prev => prev.filter(a => a.id !== id));
  const add = () => setAudiences(prev => [...prev, newAudience()]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="text-primary" /> FB Custom Audiences</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visitor-দের আচরণ অনুযায়ী Facebook Pixel-এ custom event পাঠান। এই custom event-গুলো দিয়ে FB Ads Manager-এ Custom Audience তৈরি করুন।
          </p>
        </div>
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Audiences
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Target size={18} /> Audience Rules</CardTitle>
          <CardDescription>প্রতিটা rule trigger হলে FB Pixel-এ trackCustom event fire হবে। FB Ads Manager → Audiences → Create → Custom Audience → Website → "Event" দিয়ে select করুন।</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {audiences.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              এখনও কোনো audience define করা হয়নি।
            </div>
          )}
          {audiences.map(a => (
            <div key={a.id} className="border rounded-xl p-4 space-y-3 bg-muted/20">
              <div className="flex items-center justify-between gap-2">
                <Input
                  value={a.name}
                  onChange={e => update(a.id, { name: e.target.value })}
                  placeholder="Audience name (e.g. High-value Cart)"
                  className="font-semibold max-w-sm"
                />
                <div className="flex items-center gap-3">
                  <Switch checked={a.enabled} onCheckedChange={v => update(a.id, { enabled: v })} />
                  <Button variant="ghost" size="icon" onClick={() => remove(a.id)}>
                    <Trash2 size={16} className="text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Trigger Type</Label>
                  <select
                    value={a.trigger_type}
                    onChange={e => update(a.id, { trigger_type: e.target.value as CustomAudience['trigger_type'] })}
                    className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                  >
                    {(Object.keys(TRIGGER_LABELS) as Array<CustomAudience['trigger_type']>).map(k => (
                      <option key={k} value={k}>{TRIGGER_LABELS[k]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Trigger Value</Label>
                  <Input
                    value={a.trigger_value}
                    onChange={e => update(a.id, { trigger_value: e.target.value })}
                    placeholder={
                      a.trigger_type === 'url_visit' ? '/shop or /product' :
                      a.trigger_type === 'category_view' ? 'category-slug' :
                      a.trigger_type === 'min_cart_value' ? '5000' : 'product-slug'
                    }
                  />
                </div>
              </div>
              <div>
                <Label>FB Event Name (no spaces)</Label>
                <Input
                  value={a.fb_event_name}
                  onChange={e => update(a.id, { fb_event_name: e.target.value.replace(/\s+/g, '') })}
                  placeholder="ViewedHighValueCart"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  এই নামে FB Ads Manager-এ event দেখাবে। Audience তৈরিতে এই নামটাই ব্যবহার করবেন।
                </p>
              </div>
              <div>
                <Label>Description (admin note)</Label>
                <Textarea
                  value={a.description}
                  onChange={e => update(a.id, { description: e.target.value })}
                  placeholder="কী ধরনের visitor target করছেন এবং campaign-এ কী use করবেন।"
                  rows={2}
                />
              </div>
              <Badge variant="outline" className="text-[10px]">
                {a.enabled ? '🟢 Active' : '⏸ Paused'} · {TRIGGER_LABELS[a.trigger_type]}
              </Badge>
            </div>
          ))}
          <Button variant="outline" onClick={add} className="w-full gap-2"><Plus size={16} /> Add Audience Rule</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCustomAudiences;
