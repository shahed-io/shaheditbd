import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Gift, Settings, Trash2, Clock, Plus, GripVertical, RefreshCw, Eye, Sparkles, PlayCircle, RotateCcw, ExternalLink, TimerReset, Ban, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';

interface SpinPrize {
  id: string;
  label: string;
  type: 'percent' | 'fixed' | 'none';
  value: number;
  weight: number;
  color?: string;
}

interface SpinSettings {
  enabled: boolean;
  popup_title: string;
  popup_subtitle: string;
  spin_button_text: string;
  min_minutes: number;
  max_minutes: number;
  prizes: SpinPrize[];
}

const DEFAULT_PRIZES: SpinPrize[] = [
  { id: 'p1', label: '৳100 OFF', type: 'fixed',   value: 100, weight: 500, color: '258 60% 55%' },
  { id: 'p2', label: '5% OFF',   type: 'percent', value: 5,   weight: 180, color: '42 96% 58%' },
  { id: 'p3', label: '8% OFF',   type: 'percent', value: 8,   weight: 140, color: '200 90% 45%' },
  { id: 'p4', label: '10% OFF',  type: 'percent', value: 10,  weight: 105, color: '162 72% 38%' },
  { id: 'p5', label: '12% OFF',  type: 'percent', value: 12,  weight: 70,  color: '330 85% 55%' },
  { id: 'p6', label: '20% OFF',  type: 'percent', value: 20,  weight: 5,   color: '258 78% 45%' },
];

const DEFAULT_SETTINGS: SpinSettings = {
  enabled: true,
  popup_title: 'আপনার Welcome Savings Voucher প্রস্তুত',
  popup_subtitle: 'নতুন ভিজিটরদের জন্য গ্যারান্টিড checkout saving — অফারটি claim করে অর্ডারে ব্যবহার করুন।',
  spin_button_text: 'CLAIM',
  min_minutes: 30,
  max_minutes: 60,
  prizes: DEFAULT_PRIZES,
};

const SETTINGS_KEY = 'welcome_discount_config';
const COLOR_PRESETS = [
  '258 60% 55%', '42 96% 58%', '200 90% 45%', '162 72% 38%',
  '330 85% 55%', '258 78% 45%', '186 78% 50%', '263 70% 70%',
  '204 70% 45%', '38 100% 50%',
];

const getPrizeBenefit = (prize: SpinPrize) => {
  if (prize.type === 'fixed') return `Checkout total থেকে ৳${prize.value} কমবে`;
  if (prize.type === 'percent') return `${prize.value}% instant saving`;
  return 'No voucher generated';
};

export default function AdminWelcomeDiscount() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<SpinSettings>(DEFAULT_SETTINGS);

  const { data: savedSettings } = useQuery({
    queryKey: ['spin-wheel-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', SETTINGS_KEY)
        .single();
      if (!data?.value) return DEFAULT_SETTINGS;
      try {
        const parsed = JSON.parse(data.value);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          prizes: Array.isArray(parsed.prizes) && parsed.prizes.length > 0 ? parsed.prizes : DEFAULT_PRIZES,
        } as SpinSettings;
      } catch {
        return DEFAULT_SETTINGS;
      }
    },
  });

  const { data: coupons, isLoading: couponsLoading } = useQuery({
    queryKey: ['spin-coupons-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('welcome_coupons')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      return (data || []) as Array<{
        id: string; code: string;
        discount_percent: number; discount_type: string; discount_amount: number;
        prize_label: string | null; expires_at: string; is_used: boolean; created_at: string;
      }>;
    },
  });

  useEffect(() => {
    if (savedSettings) setSettings(savedSettings);
  }, [savedSettings]);

  const saveMutation = useMutation({
    mutationFn: async (newSettings: SpinSettings) => {
      // Validate
      if (newSettings.prizes.length < 2) throw new Error('কমপক্ষে ২টি prize প্রয়োজন');
      if (newSettings.prizes.length > 12) throw new Error('সর্বোচ্চ ১২টি prize রাখা যাবে');
      for (const p of newSettings.prizes) {
        if (!p.label?.trim()) throw new Error('প্রতিটি prize-এর label দিতে হবে');
        if (p.type === 'percent' && (p.value < 1 || p.value > 20)) {
          throw new Error(`Percent discount ১-২০% এর মধ্যে রাখুন (${p.label})`);
        }
        if (p.type === 'fixed' && (p.value < 10 || p.value > 500)) {
          throw new Error(`Fixed discount ৳১০-৳৫০০ এর মধ্যে রাখুন (${p.label})`);
        }
        if (p.weight < 0) throw new Error(`Weight negative হতে পারে না (${p.label})`);
      }
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: SETTINGS_KEY, value: JSON.stringify(newSettings), category: 'store' }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spin-wheel-settings'] });
      toast.success('Spin wheel settings saved');
    },
    onError: (err: Error) => toast.error(err.message || 'Save failed'),
  });

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('welcome_coupons')
        .delete()
        .or(`is_used.eq.true,expires_at.lt.${new Date().toISOString()}`);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spin-coupons-list'] });
      toast.success('Expired & used coupons cleaned up');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('welcome_coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spin-coupons-list'] });
      toast.success('Deleted');
    },
  });

  const extendMutation = useMutation({
    mutationFn: async ({ id, minutes }: { id: string; minutes: number }) => {
      const { data: row, error: fetchErr } = await supabase
        .from('welcome_coupons').select('expires_at').eq('id', id).single();
      if (fetchErr) throw fetchErr;
      const base = new Date(row.expires_at) > new Date() ? new Date(row.expires_at) : new Date();
      const newExpiry = new Date(base.getTime() + minutes * 60 * 1000).toISOString();
      const { error } = await supabase
        .from('welcome_coupons')
        .update({ expires_at: newExpiry, is_used: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spin-coupons-list'] });
      toast.success('Coupon expiry updated');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to extend'),
  });

  const setExpiryMutation = useMutation({
    mutationFn: async ({ id, expiresAt }: { id: string; expiresAt: string }) => {
      const { error } = await supabase
        .from('welcome_coupons')
        .update({ expires_at: expiresAt })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spin-coupons-list'] });
      toast.success('Expiry updated');
    },
    onError: (err: Error) => toast.error(err.message || 'Update failed'),
  });

  const disableMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('welcome_coupons')
        .update({ expires_at: new Date(Date.now() - 60_000).toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spin-coupons-list'] });
      toast.success('Coupon disabled');
    },
    onError: (err: Error) => toast.error(err.message || 'Disable failed'),
  });

  const reactivateMutation = useMutation({
    mutationFn: async ({ id, minutes }: { id: string; minutes: number }) => {
      const newExpiry = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      const { error } = await supabase
        .from('welcome_coupons')
        .update({ expires_at: newExpiry, is_used: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spin-coupons-list'] });
      toast.success('Coupon reactivated');
    },
    onError: (err: Error) => toast.error(err.message || 'Reactivate failed'),
  });

  const updatePrize = (id: string, patch: Partial<SpinPrize>) => {
    setSettings(p => ({
      ...p,
      prizes: p.prizes.map(pr => pr.id === id ? { ...pr, ...patch } : pr),
    }));
  };

  const removePrize = (id: string) => {
    if (settings.prizes.length <= 2) {
      toast.error('কমপক্ষে ২টি prize রাখতে হবে');
      return;
    }
    setSettings(p => ({ ...p, prizes: p.prizes.filter(pr => pr.id !== id) }));
  };

  const addPrize = () => {
    if (settings.prizes.length >= 12) {
      toast.error('সর্বোচ্চ ১২টি prize রাখা যাবে');
      return;
    }
    const colorIdx = settings.prizes.length % COLOR_PRESETS.length;
    setSettings(p => ({
      ...p,
      prizes: [...p.prizes, {
        id: `p${Date.now()}`,
        label: 'New Prize',
        type: 'percent',
        value: 5,
        weight: 10,
        color: COLOR_PRESETS[colorIdx],
      }],
    }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    toast.info('Default values লোড হয়েছে — Save করুন');
  };

  // Probability calculation
  const totalWeight = settings.prizes.reduce((s, p) => s + Math.max(0, p.weight), 0);

  const stats = {
    total: coupons?.length || 0,
    used: coupons?.filter(c => c.is_used).length || 0,
    active: coupons?.filter(c => !c.is_used && new Date(c.expires_at) > new Date()).length || 0,
    expired: coupons?.filter(c => !c.is_used && new Date(c.expires_at) <= new Date()).length || 0,
  };

  const sliceAngle = 360 / Math.max(1, settings.prizes.length);
  const conicStops = settings.prizes.map((p, i) => {
    const start = i * sliceAngle;
    const end = (i + 1) * sliceAngle;
    return `hsl(${p.color || '262 80% 60%'}) ${start}deg ${end}deg`;
  }).join(', ');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Gift className="w-6 h-6 text-primary" />
            Spin Wheel Discount System
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visitor-দের জন্য interactive spin-to-win discount popup
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={resetToDefaults}>Reset Defaults</Button>
          <Button onClick={() => saveMutation.mutate(settings)} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Test & Reset Tools */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <PlayCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Test & Debug Tools</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Live site-এ গিয়ে Spin Wheel test করুন (DB-তে coupon save হবে না)
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Clear all client-side blocks so popup re-shows for this browser
                try {
                  sessionStorage.removeItem('ss_welcome_shown');
                  localStorage.removeItem('ss_welcome_shown');
                  localStorage.removeItem('ss_welcome_claimed');
                  toast.success('Visitor lock reset — homepage refresh করলে popup আবার দেখাবে');
                } catch {
                  toast.error('Reset ব্যর্থ হয়েছে');
                }
              }}
            >
              <RotateCcw className="w-4 h-4 mr-1.5" /> Reset My Lock
            </Button>
            <Button
              size="sm"
              onClick={() => {
                window.open('/?welcome_test=1', '_blank');
                toast.success('নতুন ট্যাবে test mode খুলছে...');
              }}
            >
              <ExternalLink className="w-4 h-4 mr-1.5" /> Test on Live Site
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Coupons', value: stats.total, color: 'text-blue-500' },
          { label: 'Active', value: stats.active, color: 'text-green-500' },
          { label: 'Used', value: stats.used, color: 'text-primary' },
          { label: 'Expired', value: stats.expired, color: 'text-muted-foreground' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="w-5 h-5" /> System Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Enable Spin Wheel</Label>
                  <p className="text-xs text-muted-foreground">Show popup to new visitors</p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(v) => setSettings(p => ({ ...p, enabled: v }))}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  কুপন Validity: {settings.min_minutes} — {settings.max_minutes} minutes
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Min (minutes)</Label>
                    <Input
                      type="number" min={5} max={settings.max_minutes}
                      value={settings.min_minutes}
                      onChange={(e) => setSettings(p => ({ ...p, min_minutes: Math.max(5, Math.min(Number(e.target.value), p.max_minutes)) }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Max (minutes)</Label>
                    <Input
                      type="number" min={settings.min_minutes} max={1440}
                      value={settings.max_minutes}
                      onChange={(e) => setSettings(p => ({ ...p, max_minutes: Math.max(p.min_minutes, Math.min(Number(e.target.value), 1440)) }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Popup Texts (Bengali OK)</Label>
                <div>
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Input
                    value={settings.popup_title}
                    onChange={(e) => setSettings(p => ({ ...p, popup_title: e.target.value }))}
                    placeholder="🎡 Lucky Spin!"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Subtitle</Label>
                  <Input
                    value={settings.popup_subtitle}
                    onChange={(e) => setSettings(p => ({ ...p, popup_subtitle: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Spin Button Text</Label>
                  <Input
                    value={settings.spin_button_text}
                    onChange={(e) => setSettings(p => ({ ...p, spin_button_text: e.target.value }))}
                    placeholder="SPIN"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prizes editor */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5" /> Prize Wheel Slices
                </CardTitle>
                <CardDescription>{settings.prizes.length} / 12 prizes configured</CardDescription>
              </div>
              <Button size="sm" onClick={addPrize} disabled={settings.prizes.length >= 12}>
                <Plus className="w-4 h-4 mr-1" /> Add Prize
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {settings.prizes.map((prize) => {
                const probability = totalWeight > 0 ? (Math.max(0, prize.weight) / totalWeight * 100) : 0;
                return (
                  <div key={prize.id} className="rounded-xl border border-border bg-card/50 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="w-4 h-4 rounded-full border border-border shrink-0" style={{ background: `hsl(${prize.color || '262 80% 60%'})` }} />
                      <Input
                        value={prize.label}
                        onChange={(e) => updatePrize(prize.id, { label: e.target.value })}
                        placeholder="Prize label e.g. 10% OFF"
                        className="flex-1 h-9"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removePrize(prize.id)} className="text-destructive hover:text-destructive shrink-0 h-9 w-9">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Type</Label>
                        <Select
                          value={prize.type}
                          onValueChange={(v: 'percent' | 'fixed' | 'none') => updatePrize(prize.id, { type: v, value: v === 'none' ? 0 : prize.value })}
                        >
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percent">% Percent</SelectItem>
                            <SelectItem value="fixed">৳ Fixed Taka</SelectItem>
                            <SelectItem value="none">No Prize</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">
                          Value {prize.type === 'percent' ? '(1-20%)' : prize.type === 'fixed' ? '(10-500 ৳)' : ''}
                        </Label>
                        <Input
                          type="number"
                          disabled={prize.type === 'none'}
                          min={prize.type === 'percent' ? 1 : 10}
                          max={prize.type === 'percent' ? 20 : 500}
                          value={prize.value}
                          onChange={(e) => updatePrize(prize.id, { value: Number(e.target.value) })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Weight ({probability.toFixed(1)}%)</Label>
                        <Input
                          type="number" min={0} max={1000}
                          value={prize.weight}
                          onChange={(e) => updatePrize(prize.id, { weight: Math.max(0, Number(e.target.value)) })}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PRESETS.map(c => (
                        <button
                          key={c}
                          onClick={() => updatePrize(prize.id, { color: c })}
                          className={`w-5 h-5 rounded-full border-2 transition-all ${prize.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                          style={{ background: `hsl(${c})` }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              <p className="text-[11px] text-muted-foreground">
                <strong>Weight</strong> = জেতার সম্ভাবনা। উচ্চ মানে বেশি দেখা যাবে। সব weight মিলে যত বেশি, percentage ততো ভাগ হয়ে যায়।
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="w-5 h-5" /> Live Wheel Preview
              </CardTitle>
              <CardDescription>Save করার পর users যেমন দেখবে</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl overflow-hidden border border-border bg-background">
                <div className="bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(258,78%,45%)] to-[hsl(var(--accent))] p-4 text-center text-white">
                  <h3 className="text-lg font-bold drop-shadow-md">{settings.popup_title || '🎡 Lucky Spin!'}</h3>
                  <p className="text-white/85 text-xs mt-0.5">{settings.popup_subtitle}</p>
                </div>
                <div className="relative p-5 flex items-center justify-center">
                  <div className="relative w-[260px] h-[260px]">
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20">
                      <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-[hsl(var(--destructive))] drop-shadow-lg" />
                    </div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] p-[6px] shadow-xl">
                      <div className="relative w-full h-full rounded-full bg-background p-[3px] overflow-hidden">
                        <div
                          className="relative w-full h-full rounded-full overflow-hidden"
                          style={{ background: `conic-gradient(from 0deg, ${conicStops})` }}
                        >
                          {settings.prizes.map((p, i) => {
                            const angle = i * sliceAngle + sliceAngle / 2;
                            return (
                              <div
                                key={p.id}
                                className="absolute top-1/2 left-1/2 origin-left pointer-events-none"
                                style={{
                                  transform: `rotate(${angle}deg) translateX(80px) rotate(-${angle}deg) translate(-50%, -50%)`,
                                }}
                              >
                                <span className="inline-flex min-w-[56px] justify-center rounded-full border border-border bg-background/90 px-2 py-1 text-[10px] font-bold leading-none text-foreground shadow-sm">
                                  {p.label}
                                </span>
                              </div>
                            );
                          })}
                          {settings.prizes.map((_, i) => (
                            <div
                              key={`d${i}`}
                              className="absolute top-1/2 left-1/2 w-[130px] h-[1px] bg-white/30 origin-left"
                              style={{ transform: `rotate(${i * sliceAngle}deg)` }}
                            />
                          ))}
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[72px] h-[72px] rounded-full bg-gradient-to-br from-white to-[hsl(var(--accent)/0.1)] border-[3px] border-[hsl(var(--primary))] shadow-lg flex items-center justify-center font-black text-[hsl(var(--primary))] text-sm">
                          {settings.spin_button_text || 'SPIN'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Probability summary */}
                <div className="px-5 pb-5">
                  <div className="mb-3 rounded-xl border border-border bg-card/70 p-3">
                    <p className="text-xs font-bold text-foreground">Customer spend hook</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      Copy shown to visitors: অফারটি শুধু checkout-এ ব্যবহার করা যাবে, তাই cart total কমাতে claim করার পর অর্ডার সম্পন্ন করতে উৎসাহিত করবে।
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Offer clarity & probability</p>
                  <div className="space-y-1.5">
                    {settings.prizes.map(p => {
                      const prob = totalWeight > 0 ? (Math.max(0, p.weight) / totalWeight * 100) : 0;
                      return (
                        <div key={p.id} className="flex items-center gap-2 rounded-lg border border-border/70 bg-card/60 px-2.5 py-2 text-xs">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: `hsl(${p.color || '262 80% 60%'})` }} />
                          <span className="flex-1 min-w-0">
                            <span className="block truncate font-semibold text-foreground">{p.label}</span>
                            <span className="block truncate text-[10px] text-muted-foreground">{getPrizeBenefit(p)}</span>
                          </span>
                          <span className="text-muted-foreground tabular-nums">{prob.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-lg">Generated Spin Coupons</CardTitle>
            <CardDescription>Last 50 spin-to-win coupons</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['spin-coupons-list'] })}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button variant="destructive" size="sm" onClick={() => cleanupMutation.mutate()} disabled={cleanupMutation.isPending}>
              <Trash2 className="w-4 h-4 mr-1" /> Cleanup
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Prize</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {couponsLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : !coupons?.length ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No coupons generated yet</TableCell></TableRow>
                ) : coupons.map(c => {
                  const isExpired = new Date(c.expires_at) <= new Date();
                  const display = c.prize_label
                    ? c.prize_label
                    : c.discount_type === 'fixed'
                      ? `৳${c.discount_amount} OFF`
                      : `${c.discount_percent}% OFF`;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono font-bold text-sm">{c.code}</TableCell>
                      <TableCell><Badge variant="outline">{display}</Badge></TableCell>
                      <TableCell>
                        {c.is_used ? <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Used</Badge>
                          : isExpired ? <Badge variant="secondary">Expired</Badge>
                          : <Badge variant="outline" className="border-primary/40 text-primary">Active</Badge>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(c.expires_at).toLocaleString('en-BD', { dateStyle: 'short', timeStyle: 'short' })}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(c.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
