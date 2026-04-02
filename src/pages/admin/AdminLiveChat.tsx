import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Bot, MessageCircle, Plus, Trash2, Save, Loader2, Smartphone, Globe, History, Search, ChevronDown, ChevronUp, User, Clock, Monitor } from 'lucide-react';

interface LiveChatSettings {
  // General
  chat_enabled: boolean;
  whatsapp_enabled: boolean;
  // WhatsApp
  whatsapp_number: string;
  whatsapp_label: string;
  whatsapp_subtitle: string;
  // AI Chat
  ai_label: string;
  ai_subtitle: string;
  ai_welcome_message: string;
  ai_placeholder: string;
  // Quick Suggestions
  quick_suggestions: string[];
  // FAB
  fab_label: string;
  // Live Chat Sets (multiple support channels)
  live_sets: LiveSet[];
}

interface LiveSet {
  id: string;
  name: string;
  type: 'whatsapp' | 'messenger' | 'telegram' | 'custom_link';
  value: string; // phone number or URL
  label: string;
  subtitle: string;
  icon_color: string;
  is_active: boolean;
}

const DEFAULT_SETTINGS: LiveChatSettings = {
  chat_enabled: true,
  whatsapp_enabled: true,
  whatsapp_number: '8801840099853',
  whatsapp_label: 'WhatsApp',
  whatsapp_subtitle: 'সরাসরি কথা বলুন',
  ai_label: 'AI Support',
  ai_subtitle: 'তাৎক্ষণিক উত্তর পান',
  ai_welcome_message: 'হ্যালো! 👋 আমি Shahed Store-এর AI সহকারী। Windows, Office, Adobe, Netflix, Spotify সহ যেকোনো প্রোডাক্ট সম্পর্কে প্রশ্ন করুন!',
  ai_placeholder: 'আপনার প্রশ্ন লিখুন...',
  quick_suggestions: ['💰 দাম জানতে চাই', '📦 কোন প্রোডাক্ট ভালো?', '🚚 ডেলিভারি কতক্ষণ?'],
  fab_label: 'কোনটি পছন্দ করবেন?',
  live_sets: [],
};

const LIVE_SET_TYPES = [
  { value: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
  { value: 'messenger', label: 'Messenger', color: '#0084FF' },
  { value: 'telegram', label: 'Telegram', color: '#0088CC' },
  { value: 'custom_link', label: 'Custom Link', color: '#7c3aed' },
];

const AdminLiveChat = () => {
  const [settings, setSettings] = useState<LiveChatSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'live_chat_settings')
        .maybeSingle();

      if (data?.value) {
        const parsed = JSON.parse(data.value);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (err) {
      console.error('Failed to load live chat settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'live_chat_settings',
          value: JSON.stringify(settings),
          category: 'store',
        }, { onConflict: 'key' });

      if (error) throw error;
      toast.success('লাইভ চ্যাট সেটিংস সেভ হয়েছে!');
    } catch (err: any) {
      toast.error('সেভ করতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addLiveSet = () => {
    const newSet: LiveSet = {
      id: crypto.randomUUID(),
      name: 'New Channel',
      type: 'whatsapp',
      value: '',
      label: 'নতুন চ্যানেল',
      subtitle: 'যোগাযোগ করুন',
      icon_color: '#25D366',
      is_active: true,
    };
    setSettings(prev => ({ ...prev, live_sets: [...prev.live_sets, newSet] }));
  };

  const updateLiveSet = (id: string, field: keyof LiveSet, value: any) => {
    setSettings(prev => ({
      ...prev,
      live_sets: prev.live_sets.map(s => {
        if (s.id !== id) return s;
        const updated = { ...s, [field]: value };
        // Auto-set icon color when type changes
        if (field === 'type') {
          const typeInfo = LIVE_SET_TYPES.find(t => t.value === value);
          if (typeInfo) updated.icon_color = typeInfo.color;
        }
        return updated;
      }),
    }));
  };

  const removeLiveSet = (id: string) => {
    setSettings(prev => ({
      ...prev,
      live_sets: prev.live_sets.filter(s => s.id !== id),
    }));
  };

  const addSuggestion = () => {
    setSettings(prev => ({
      ...prev,
      quick_suggestions: [...prev.quick_suggestions, ''],
    }));
  };

  const updateSuggestion = (index: number, value: string) => {
    setSettings(prev => ({
      ...prev,
      quick_suggestions: prev.quick_suggestions.map((s, i) => i === index ? value : s),
    }));
  };

  const removeSuggestion = (index: number) => {
    setSettings(prev => ({
      ...prev,
      quick_suggestions: prev.quick_suggestions.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">লাইভ চ্যাট সেটিংস</h1>
          <p className="text-sm text-muted-foreground mt-1">ফ্লোটিং সাপোর্ট বাটন এবং চ্যাট অপশন কাস্টমাইজ করুন</p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          সেভ করুন
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="general">সাধারণ</TabsTrigger>
          <TabsTrigger value="ai-chat">AI চ্যাট</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="live-sets">লাইভ সেট</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">সাধারণ সেটিংস</CardTitle>
              <CardDescription>চ্যাট সিস্টেমের মূল অন/অফ কন্ট্রোল</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">AI চ্যাট সাপোর্ট</p>
                    <p className="text-xs text-muted-foreground">AI সহকারী চালু/বন্ধ করুন</p>
                  </div>
                </div>
                <Switch
                  checked={settings.chat_enabled}
                  onCheckedChange={(v) => setSettings(prev => ({ ...prev, chat_enabled: v }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">WhatsApp সাপোর্ট</p>
                    <p className="text-xs text-muted-foreground">WhatsApp চ্যাট চালু/বন্ধ করুন</p>
                  </div>
                </div>
                <Switch
                  checked={settings.whatsapp_enabled}
                  onCheckedChange={(v) => setSettings(prev => ({ ...prev, whatsapp_enabled: v }))}
                />
              </div>

              <div className="space-y-2">
                <Label>FAB মেনু লেবেল</Label>
                <Input
                  value={settings.fab_label}
                  onChange={e => setSettings(prev => ({ ...prev, fab_label: e.target.value }))}
                  placeholder="কোনটি পছন্দ করবেন?"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Chat Tab */}
        <TabsContent value="ai-chat">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" /> AI চ্যাট কাস্টমাইজেশন
              </CardTitle>
              <CardDescription>AI সহকারীর টেক্সট, ওয়েলকাম মেসেজ এবং কুইক সাজেশন পরিবর্তন করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>চ্যাট হেডার লেবেল</Label>
                  <Input
                    value={settings.ai_label}
                    onChange={e => setSettings(prev => ({ ...prev, ai_label: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>সাবটাইটেল</Label>
                  <Input
                    value={settings.ai_subtitle}
                    onChange={e => setSettings(prev => ({ ...prev, ai_subtitle: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>ওয়েলকাম মেসেজ</Label>
                <Textarea
                  value={settings.ai_welcome_message}
                  onChange={e => setSettings(prev => ({ ...prev, ai_welcome_message: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>ইনপুট প্লেসহোল্ডার</Label>
                <Input
                  value={settings.ai_placeholder}
                  onChange={e => setSettings(prev => ({ ...prev, ai_placeholder: e.target.value }))}
                />
              </div>

              {/* Quick Suggestions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">কুইক সাজেশন বাটন</Label>
                  <Button variant="outline" size="sm" onClick={addSuggestion}>
                    <Plus className="w-4 h-4 mr-1" /> যোগ করুন
                  </Button>
                </div>
                {settings.quick_suggestions.map((suggestion, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={suggestion}
                      onChange={e => updateSuggestion(idx, e.target.value)}
                      placeholder="সাজেশন টেক্সট..."
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeSuggestion(idx)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-green-500" /> WhatsApp সেটিংস
              </CardTitle>
              <CardDescription>WhatsApp নম্বর এবং ডিসপ্লে টেক্সট পরিবর্তন করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>WhatsApp নম্বর (কান্ট্রি কোড সহ)</Label>
                <Input
                  value={settings.whatsapp_number}
                  onChange={e => setSettings(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                  placeholder="8801XXXXXXXXX"
                />
                <p className="text-xs text-muted-foreground">উদাহরণ: 8801840099853 (+ ছাড়া)</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>বাটন লেবেল</Label>
                  <Input
                    value={settings.whatsapp_label}
                    onChange={e => setSettings(prev => ({ ...prev, whatsapp_label: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>সাবটাইটেল</Label>
                  <Input
                    value={settings.whatsapp_subtitle}
                    onChange={e => setSettings(prev => ({ ...prev, whatsapp_subtitle: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Sets Tab */}
        <TabsContent value="live-sets">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" /> লাইভ সেট (অতিরিক্ত চ্যানেল)
              </CardTitle>
              <CardDescription>
                WhatsApp ও AI চ্যাট ছাড়াও অতিরিক্ত সাপোর্ট চ্যানেল যোগ করুন — Messenger, Telegram বা কাস্টম লিংক
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Button onClick={addLiveSet} variant="outline">
                <Plus className="w-4 h-4 mr-2" /> নতুন চ্যানেল যোগ করুন
              </Button>

              {settings.live_sets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl">
                  <Globe className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p>কোনো অতিরিক্ত চ্যানেল নেই</p>
                  <p className="text-xs mt-1">উপরের বাটনে ক্লিক করে নতুন চ্যানেল যোগ করুন</p>
                </div>
              )}

              {settings.live_sets.map((set) => (
                <div key={set.id} className="border border-border rounded-xl p-4 space-y-4 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: set.icon_color }}
                      >
                        <MessageCircle className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-foreground">{set.label || 'নতুন চ্যানেল'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={set.is_active}
                        onCheckedChange={(v) => updateLiveSet(set.id, 'is_active', v)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeLiveSet(set.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>চ্যানেলের ধরন</Label>
                      <select
                        value={set.type}
                        onChange={e => updateLiveSet(set.id, 'type', e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {LIVE_SET_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>{set.type === 'custom_link' ? 'URL' : 'নম্বর / ইউজারনেম'}</Label>
                      <Input
                        value={set.value}
                        onChange={e => updateLiveSet(set.id, 'value', e.target.value)}
                        placeholder={set.type === 'custom_link' ? 'https://...' : set.type === 'telegram' ? '@username' : '8801XXXXXXXXX'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>লেবেল</Label>
                      <Input
                        value={set.label}
                        onChange={e => updateLiveSet(set.id, 'label', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>সাবটাইটেল</Label>
                      <Input
                        value={set.subtitle}
                        onChange={e => updateLiveSet(set.id, 'subtitle', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>আইকন কালার</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={set.icon_color}
                          onChange={e => updateLiveSet(set.id, 'icon_color', e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer border-0"
                        />
                        <Input
                          value={set.icon_color}
                          onChange={e => updateLiveSet(set.id, 'icon_color', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLiveChat;
