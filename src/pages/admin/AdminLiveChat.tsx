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
import { Bot, MessageCircle, Plus, Trash2, Save, Loader2, Smartphone, Globe, History, Search, ChevronDown, ChevronUp, User, Clock, Monitor, ArrowUp, ArrowDown, Facebook, Send as TelegramIcon, Link as LinkIcon, Phone, Mail, Instagram, Twitter, Youtube, Video, Headphones, LifeBuoy, HelpCircle } from 'lucide-react';

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
  icon: string; // lucide icon name
  is_active: boolean;
  sort_order?: number;
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
  { value: 'messenger', label: 'Facebook Messenger', color: '#0084FF', icon: 'Facebook' },
  { value: 'telegram', label: 'Telegram', color: '#0088CC', icon: 'TelegramIcon' },
  { value: 'whatsapp', label: 'WhatsApp (Extra)', color: '#25D366', icon: 'MessageCircle' },
  { value: 'custom_link', label: 'Custom Link', color: '#7c3aed', icon: 'LinkIcon' },
];

// Available icons for picker
const ICON_OPTIONS = [
  { name: 'MessageCircle', Icon: MessageCircle },
  { name: 'Facebook', Icon: Facebook },
  { name: 'TelegramIcon', Icon: TelegramIcon },
  { name: 'LinkIcon', Icon: LinkIcon },
  { name: 'Phone', Icon: Phone },
  { name: 'Mail', Icon: Mail },
  { name: 'Instagram', Icon: Instagram },
  { name: 'Twitter', Icon: Twitter },
  { name: 'Youtube', Icon: Youtube },
  { name: 'Video', Icon: Video },
  { name: 'Headphones', Icon: Headphones },
  { name: 'LifeBuoy', Icon: LifeBuoy },
  { name: 'HelpCircle', Icon: HelpCircle },
  { name: 'Globe', Icon: Globe },
];

const getIconByName = (name: string) => {
  return ICON_OPTIONS.find(i => i.name === name)?.Icon || MessageCircle;
};

// ── Chat History Panel ──
interface ChatConversation {
  id: string;
  session_id: string;
  user_message: string;
  ai_response: string;
  user_agent: string | null;
  page_url: string | null;
  created_at: string;
}

interface GroupedSession {
  session_id: string;
  messages: ChatConversation[];
  first_at: string;
  last_at: string;
  device: string;
}

const getDeviceFromUA = (ua: string | null): string => {
  if (!ua) return 'Unknown';
  if (/mobile|android|iphone/i.test(ua)) return 'Mobile';
  if (/tablet|ipad/i.test(ua)) return 'Tablet';
  return 'Desktop';
};

const ChatHistoryPanel = () => {
  const [sessions, setSessions] = useState<GroupedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_conversations' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      const convos = (data || []) as unknown as ChatConversation[];

      // Group by session_id
      const grouped: Record<string, ChatConversation[]> = {};
      for (const c of convos) {
        if (!grouped[c.session_id]) grouped[c.session_id] = [];
        grouped[c.session_id].push(c);
      }

      const sessionList: GroupedSession[] = Object.entries(grouped).map(([sid, msgs]) => {
        const sorted = msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        return {
          session_id: sid,
          messages: sorted,
          first_at: sorted[0].created_at,
          last_at: sorted[sorted.length - 1].created_at,
          device: getDeviceFromUA(sorted[0].user_agent),
        };
      });

      sessionList.sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());
      setSessions(sessionList);
    } catch (err: any) {
      console.error('Failed to load chat history:', err);
      toast.error('চ্যাট হিস্ট্রি লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    setDeleting(sessionId);
    try {
      const { error } = await supabase
        .from('chat_conversations' as any)
        .delete()
        .eq('session_id', sessionId);
      if (error) throw error;
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      toast.success('সেশন ডিলিট হয়েছে');
    } catch (err: any) {
      toast.error('ডিলিট করতে সমস্যা: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'এইমাত্র';
    if (diffMin < 60) return `${diffMin} মিনিট আগে`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} ঘণ্টা আগে`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay} দিন আগে`;
    return d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const filtered = search.trim()
    ? sessions.filter(s => s.messages.some(m =>
        m.user_message.toLowerCase().includes(search.toLowerCase()) ||
        m.ai_response.toLowerCase().includes(search.toLowerCase())
      ))
    : sessions;

  const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{sessions.length}</p>
              <p className="text-xs text-muted-foreground">মোট সেশন</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalMessages}</p>
              <p className="text-xs text-muted-foreground">মোট প্রশ্ন-উত্তর</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {sessions.length > 0 ? formatTime(sessions[0].last_at) : '—'}
              </p>
              <p className="text-xs text-muted-foreground">সর্বশেষ চ্যাট</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="চ্যাটে সার্চ করুন..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-12"
        />
      </div>

      {/* Session List */}
      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
          <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">কোনো চ্যাট হিস্ট্রি নেই</p>
          <p className="text-xs mt-1">ওয়েবসাইটে কেউ AI চ্যাট ব্যবহার করলে এখানে দেখাবে</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(session => {
          const isExpanded = expandedSession === session.session_id;
          const firstMsg = session.messages[0];
          return (
            <Card key={session.session_id} className="overflow-hidden">
              {/* Session Header */}
              <button
                onClick={() => setExpandedSession(isExpanded ? null : session.session_id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {firstMsg.user_message.length > 60 ? firstMsg.user_message.slice(0, 60) + '...' : firstMsg.user_message}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatTime(session.last_at)}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" /> {session.messages.length} টি প্রশ্ন
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Monitor className="w-3 h-3" /> {session.device}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); deleteSession(session.session_id); }}
                    disabled={deleting === session.session_id}
                    className="text-destructive hover:text-destructive h-8 w-8"
                  >
                    {deleting === session.session_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {/* Expanded Messages */}
              {isExpanded && (
                <div className="border-t border-border px-4 py-3 space-y-3 bg-muted/10 max-h-96 overflow-y-auto">
                  {session.messages.map((msg, idx) => (
                    <div key={msg.id || idx} className="space-y-2">
                      {/* User question */}
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="w-3 h-3 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-blue-600 mb-0.5">ভিজিটর</p>
                          <p className="text-sm text-foreground bg-blue-500/5 rounded-xl px-3 py-2 border border-blue-500/10">
                            {msg.user_message}
                          </p>
                        </div>
                      </div>
                      {/* AI response */}
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot className="w-3 h-3 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-primary mb-0.5">Shahed AI</p>
                          <p className="text-sm text-foreground bg-primary/5 rounded-xl px-3 py-2 border border-primary/10 whitespace-pre-wrap">
                            {msg.ai_response}
                          </p>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground text-right">
                        {new Date(msg.created_at).toLocaleString('bn-BD')}
                        {msg.page_url && msg.page_url !== '/' ? ` · ${msg.page_url}` : ''}
                      </p>
                      {idx < session.messages.length - 1 && <hr className="border-border/50" />}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Refresh */}
      {sessions.length > 0 && (
        <div className="text-center">
          <Button variant="outline" size="sm" onClick={loadHistory}>
            <Loader2 className="w-3.5 h-3.5 mr-1.5" /> রিফ্রেশ করুন
          </Button>
        </div>
      )}
    </div>
  );
};

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
    const messengerType = LIVE_SET_TYPES.find(t => t.value === 'messenger')!;
    const newSet: LiveSet = {
      id: crypto.randomUUID(),
      name: 'New Channel',
      type: 'messenger',
      value: '',
      label: 'Facebook Messenger',
      subtitle: 'মেসেঞ্জারে চ্যাট করুন',
      icon_color: messengerType.color,
      icon: messengerType.icon,
      is_active: true,
      sort_order: settings.live_sets.length,
    };
    setSettings(prev => ({ ...prev, live_sets: [...prev.live_sets, newSet] }));
  };

  const updateLiveSet = (id: string, field: keyof LiveSet, value: any) => {
    setSettings(prev => ({
      ...prev,
      live_sets: prev.live_sets.map(s => {
        if (s.id !== id) return s;
        const updated = { ...s, [field]: value };
        // Auto-set icon color and default icon when type changes
        if (field === 'type') {
          const typeInfo = LIVE_SET_TYPES.find(t => t.value === value);
          if (typeInfo) {
            updated.icon_color = typeInfo.color;
            updated.icon = typeInfo.icon;
          }
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

  const moveLiveSet = (id: string, direction: 'up' | 'down') => {
    setSettings(prev => {
      const idx = prev.live_sets.findIndex(s => s.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.live_sets.length) return prev;
      const next = [...prev.live_sets];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return { ...prev, live_sets: next.map((s, i) => ({ ...s, sort_order: i })) };
    });
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
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="general">সাধারণ</TabsTrigger>
          <TabsTrigger value="ai-chat">AI চ্যাট</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="live-sets">লাইভ সেট</TabsTrigger>
          <TabsTrigger value="chat-history" className="flex items-center gap-1"><History className="w-3.5 h-3.5" /> হিস্ট্রি</TabsTrigger>
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

              {settings.live_sets.map((set, idx) => {
                const SetIcon = getIconByName(set.icon || 'MessageCircle');
                return (
                <div key={set.id} className="border border-border rounded-xl p-4 space-y-4 bg-muted/20">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: set.icon_color }}
                      >
                        <SetIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="font-medium text-foreground">{set.label || 'নতুন চ্যানেল'}</span>
                        <p className="text-xs text-muted-foreground">#{idx + 1} · {LIVE_SET_TYPES.find(t => t.value === set.type)?.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => moveLiveSet(set.id, 'up')} disabled={idx === 0} className="h-8 w-8" title="উপরে">
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => moveLiveSet(set.id, 'down')} disabled={idx === settings.live_sets.length - 1} className="h-8 w-8" title="নিচে">
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Switch
                        checked={set.is_active}
                        onCheckedChange={(v) => updateLiveSet(set.id, 'is_active', v)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeLiveSet(set.id)} className="text-destructive hover:text-destructive h-8 w-8">
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
                      <Label>
                        {set.type === 'custom_link' ? 'URL' :
                         set.type === 'messenger' ? 'Page Username (m.me/...)' :
                         set.type === 'telegram' ? 'Telegram Username (@user)' :
                         'WhatsApp নম্বর (8801...)'}
                      </Label>
                      <Input
                        value={set.value}
                        onChange={e => updateLiveSet(set.id, 'value', e.target.value)}
                        placeholder={
                          set.type === 'custom_link' ? 'https://...' :
                          set.type === 'messenger' ? 'shahedstore' :
                          set.type === 'telegram' ? '@shahedstore' :
                          '8801XXXXXXXXX'
                        }
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

                  {/* Icon Picker */}
                  <div className="space-y-2">
                    <Label>আইকন বাছাই করুন</Label>
                    <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-border bg-background/50">
                      {ICON_OPTIONS.map(({ name, Icon: IconComp }) => {
                        const selected = (set.icon || 'MessageCircle') === name;
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => updateLiveSet(set.id, 'icon', name)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${
                              selected
                                ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                                : 'border-border hover:border-primary/40 bg-muted/40'
                            }`}
                            title={name}
                          >
                            <IconComp className={`w-4 h-4 ${selected ? 'text-primary' : 'text-foreground'}`} style={!selected ? { color: set.icon_color } : undefined} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );})}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat History Tab */}
        <TabsContent value="chat-history">
          <ChatHistoryPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLiveChat;
