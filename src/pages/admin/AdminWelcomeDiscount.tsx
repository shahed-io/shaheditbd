import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Gift, Settings, Trash2, Clock, Percent, Eye, RefreshCw } from 'lucide-react';

interface WelcomeSettings {
  enabled: boolean;
  min_discount: number;
  max_discount: number;
  min_minutes: number;
  max_minutes: number;
  delay_seconds: number;
  popup_title: string;
  popup_subtitle: string;
}

const DEFAULT_SETTINGS: WelcomeSettings = {
  enabled: true,
  min_discount: 5,
  max_discount: 12,
  min_minutes: 30,
  max_minutes: 60,
  delay_seconds: 3,
  popup_title: '🎉 স্বাগতম!',
  popup_subtitle: 'আপনার জন্য বিশেষ ডিসকাউন্ট',
};

const SETTINGS_KEY = 'welcome_discount_config';

export default function AdminWelcomeDiscount() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<WelcomeSettings>(DEFAULT_SETTINGS);

  // Fetch settings
  const { data: savedSettings, isLoading } = useQuery({
    queryKey: ['welcome-discount-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', SETTINGS_KEY)
        .single();
      return data?.value ? JSON.parse(data.value) as WelcomeSettings : DEFAULT_SETTINGS;
    },
  });

  // Fetch coupons
  const { data: coupons, isLoading: couponsLoading } = useQuery({
    queryKey: ['welcome-coupons-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('welcome_coupons')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      return (data || []) as Array<{
        id: string;
        code: string;
        discount_percent: number;
        expires_at: string;
        is_used: boolean;
        visitor_id: string;
        created_at: string;
      }>;
    },
  });

  useEffect(() => {
    if (savedSettings) setSettings(savedSettings);
  }, [savedSettings]);

  // Save settings
  const saveMutation = useMutation({
    mutationFn: async (newSettings: WelcomeSettings) => {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: SETTINGS_KEY,
          value: JSON.stringify(newSettings),
          category: 'store',
        }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['welcome-discount-settings'] });
      toast.success('Settings saved successfully');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  // Delete expired/used coupons
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('welcome_coupons')
        .delete()
        .or(`is_used.eq.true,expires_at.lt.${new Date().toISOString()}`);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['welcome-coupons-list'] });
      toast.success('Expired & used coupons cleaned up');
    },
  });

  // Delete single coupon
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('welcome_coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['welcome-coupons-list'] });
      toast.success('Coupon deleted');
    },
  });

  const stats = {
    total: coupons?.length || 0,
    used: coupons?.filter(c => c.is_used).length || 0,
    active: coupons?.filter(c => !c.is_used && new Date(c.expires_at) > new Date()).length || 0,
    expired: coupons?.filter(c => !c.is_used && new Date(c.expires_at) <= new Date()).length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Gift className="w-6 h-6 text-primary" />
            Welcome Discount System
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Control the auto-popup discount for new visitors
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate(settings)}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

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

      {/* Settings */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="w-5 h-5" />
              System Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Enable Welcome Discount</Label>
                <p className="text-xs text-muted-foreground">Show popup to new visitors</p>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(v) => setSettings(p => ({ ...p, enabled: v }))}
              />
            </div>

            {/* Discount Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Discount Range: {settings.min_discount}% — {settings.max_discount}%
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Min %</Label>
                  <Input
                    type="number"
                    min={1}
                    max={settings.max_discount}
                    value={settings.min_discount}
                    onChange={(e) => setSettings(p => ({ ...p, min_discount: Math.max(1, Math.min(Number(e.target.value), p.max_discount)) }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Max %</Label>
                  <Input
                    type="number"
                    min={settings.min_discount}
                    max={50}
                    value={settings.max_discount}
                    onChange={(e) => setSettings(p => ({ ...p, max_discount: Math.max(p.min_discount, Math.min(Number(e.target.value), 50)) }))}
                  />
                </div>
              </div>
            </div>

            {/* Validity Duration */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Validity: {settings.min_minutes} — {settings.max_minutes} minutes
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Min (minutes)</Label>
                  <Input
                    type="number"
                    min={5}
                    max={settings.max_minutes}
                    value={settings.min_minutes}
                    onChange={(e) => setSettings(p => ({ ...p, min_minutes: Math.max(5, Math.min(Number(e.target.value), p.max_minutes)) }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Max (minutes)</Label>
                  <Input
                    type="number"
                    min={settings.min_minutes}
                    max={1440}
                    value={settings.max_minutes}
                    onChange={(e) => setSettings(p => ({ ...p, max_minutes: Math.max(p.min_minutes, Math.min(Number(e.target.value), 1440)) }))}
                  />
                </div>
              </div>
            </div>

            {/* Popup Delay */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Popup Delay: {settings.delay_seconds}s</Label>
              <Slider
                value={[settings.delay_seconds]}
                onValueChange={([v]) => setSettings(p => ({ ...p, delay_seconds: v }))}
                min={1}
                max={15}
                step={1}
              />
              <p className="text-xs text-muted-foreground">Time before popup appears after page load</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="w-5 h-5" />
              Popup Content
            </CardTitle>
            <CardDescription>Customize popup text (Bengali)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Popup Title</Label>
              <Input
                value={settings.popup_title}
                onChange={(e) => setSettings(p => ({ ...p, popup_title: e.target.value }))}
                placeholder="🎉 স্বাগতম!"
              />
            </div>
            <div>
              <Label className="text-sm">Popup Subtitle</Label>
              <Input
                value={settings.popup_subtitle}
                onChange={(e) => setSettings(p => ({ ...p, popup_subtitle: e.target.value }))}
                placeholder="আপনার জন্য বিশেষ ডিসকাউন্ট"
              />
            </div>

            {/* Preview */}
            <div className="mt-6 rounded-2xl overflow-hidden border border-border">
              <div className="bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--primary)/0.85)] to-[hsl(270,70%,50%)] p-5 text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white/20 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white text-lg font-bold">{settings.popup_title || '🎉 স্বাগতম!'}</h3>
                <p className="text-white/80 text-sm">{settings.popup_subtitle || 'আপনার জন্য বিশেষ ডিসকাউন্ট'}</p>
              </div>
              <div className="bg-background p-4 text-center -mt-3 rounded-t-2xl relative">
                <span className="text-4xl font-extrabold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(270,70%,50%)] bg-clip-text text-transparent">
                  {settings.min_discount}-{settings.max_discount}%
                </span>
                <p className="text-muted-foreground text-xs mt-1">Random discount preview</p>
                <div className="mt-3 px-3 py-2 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 font-mono text-sm font-bold">
                  WELCOME-XXXXX
                </div>
                <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {settings.min_minutes}-{settings.max_minutes} min validity
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Generated Coupons</CardTitle>
            <CardDescription>Last 50 auto-generated welcome coupons</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['welcome-coupons-list'] })}
            >
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => cleanupMutation.mutate()}
              disabled={cleanupMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Cleanup Expired
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {couponsLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : !coupons?.length ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No coupons generated yet</TableCell></TableRow>
                ) : coupons.map(c => {
                  const isExpired = new Date(c.expires_at) <= new Date();
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono font-bold text-sm">{c.code}</TableCell>
                      <TableCell>{c.discount_percent}%</TableCell>
                      <TableCell>
                        {c.is_used ? (
                          <Badge variant="default" className="bg-green-500/20 text-green-600 border-green-500/30">Used</Badge>
                        ) : isExpired ? (
                          <Badge variant="secondary">Expired</Badge>
                        ) : (
                          <Badge variant="outline" className="border-primary/40 text-primary">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(c.expires_at).toLocaleString('en-BD', { dateStyle: 'short', timeStyle: 'short' })}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleString('en-BD', { dateStyle: 'short', timeStyle: 'short' })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(c.id)}
                          className="text-destructive hover:text-destructive"
                        >
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
