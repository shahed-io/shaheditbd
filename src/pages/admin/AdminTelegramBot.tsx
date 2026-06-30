import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Send, TestTube, RefreshCw, ShoppingCart, Users, Package, BarChart3, Settings2, Eye, EyeOff, Save, Loader2, CheckCircle, XCircle, MessageCircle, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface BotStats {
  totalCarts: number;
  activeCheckouts: number;
  totalOrders: number;
  uniqueUsers: number;
}

const AdminTelegramBot = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [stats, setStats] = useState<BotStats>({ totalCarts: 0, activeCheckouts: 0, totalOrders: 0, uniqueUsers: 0 });
  const [showToken, setShowToken] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const SETTING_KEYS = [
    'telegram_shop_bot_username',
    'telegram_shop_bot_welcome',
    'telegram_shop_bot_enabled',
    'telegram_shop_bot_footer',
    'telegram_chat_id',
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch settings
    const { data: settingsData } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', SETTING_KEYS);

    const map: Record<string, string> = {};
    settingsData?.forEach(s => { map[s.key] = s.value || ''; });
    
    // Set defaults
    if (!map['telegram_shop_bot_enabled']) map['telegram_shop_bot_enabled'] = 'true';
    if (!map['telegram_shop_bot_username']) map['telegram_shop_bot_username'] = '@Shahed_Store_bot';
    if (!map['telegram_shop_bot_welcome']) map['telegram_shop_bot_welcome'] = '🛍️ Shahed Store এ স্বাগতম! আমাদের টেলিগ্রাম বট দিয়ে সরাসরি শপিং করুন।';
    if (!map['telegram_shop_bot_footer']) map['telegram_shop_bot_footer'] = '📞 সমস্যা? /start দিয়ে শুরু করুন।';
    
    setSettings(map);

    // Fetch stats
    const [cartsRes, checkoutsRes, ordersRes] = await Promise.all([
      supabase.from('telegram_cart').select('chat_id', { count: 'exact' }),
      supabase.from('telegram_checkout_state').select('chat_id', { count: 'exact' }),
      supabase.from('orders').select('id, order_number, customer_name, total, status, created_at')
        .ilike('notes', '%টেলিগ্রাম%')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    // Unique users from carts
    const uniqueChats = new Set(cartsRes.data?.map(c => c.chat_id) || []);
    
    setStats({
      totalCarts: cartsRes.count || 0,
      activeCheckouts: checkoutsRes.count || 0,
      totalOrders: ordersRes.data?.length || 0,
      uniqueUsers: uniqueChats.size,
    });

    setRecentOrders(ordersRes.data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const updates = Object.entries(settings).map(([key, value]) =>
      supabase.from('site_settings').upsert(
        { key, value, category: 'telegram' },
        { onConflict: 'key' }
      )
    );
    await Promise.all(updates);
    toast.success('✅ টেলিগ্রাম বট সেটিংস সেভ হয়েছে!');
    setSaving(false);
  };

  const testBot = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const chatId = settings['telegram_chat_id'];
      if (!chatId) {
        toast.error('আগে Admin Chat ID সেট করুন');
        setTesting(false);
        return;
      }
      
      const { error } = await supabase.functions.invoke('notify-new-order', {
        body: { orderId: 'test', _test: true, _chatId: chatId },
      });
      
      if (error) {
        setTestResult('error');
        toast.error('❌ টেস্ট ব্যর্থ: ' + error.message);
      } else {
        setTestResult('success');
        toast.success('✅ টেলিগ্রামে টেস্ট মেসেজ পাঠানো হয়েছে!');
      }
    } catch (e: any) {
      setTestResult('error');
      toast.error('❌ টেস্ট ব্যর্থ: ' + String(e));
    }
    setTesting(false);
  };

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-500',
    processing: 'text-blue-500',
    completed: 'text-green-500',
    delivered: 'text-emerald-500',
    cancelled: 'text-red-500',
  };
  const statusLabels: Record<string, string> = {
    pending: 'পেন্ডিং',
    processing: 'প্রসেসিং',
    completed: 'সম্পন্ন',
    delivered: 'ডেলিভার্ড',
    cancelled: 'বাতিল',
  };

  const inputCls = "w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors";

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 glass-card rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            <Bot className="inline-block mr-2 text-[#229ED9]" size={28} />
            Telegram <span className="gradient-text">Shop Bot</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            @Shahed_Store_bot — টেলিগ্রাম থেকে সরাসরি শপিং সিস্টেম কন্ট্রোল করুন
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="px-4 py-2.5 rounded-xl text-sm border border-border hover:bg-muted/50 transition-colors flex items-center gap-2">
            <RefreshCw size={14} /> রিফ্রেশ
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold">
            <Save size={16} />
            {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: ShoppingCart, label: 'অ্যাক্টিভ কার্ট', value: stats.totalCarts, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { icon: MessageCircle, label: 'চেকআউট চলছে', value: stats.activeCheckouts, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { icon: Package, label: 'টেলিগ্রাম অর্ডার', value: stats.totalOrders, color: 'text-green-500', bg: 'bg-green-500/10' },
          { icon: Users, label: 'ইউনিক ইউজার', value: stats.uniqueUsers, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-2xl p-4">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Bot Configuration */}
      <div className="glass-card rounded-2xl p-6 border border-[#229ED9]/20">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#229ED9]/20 flex items-center justify-center">
            <Settings2 size={20} className="text-[#229ED9]" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">বট কনফিগারেশন</h3>
            <p className="text-xs text-muted-foreground">শপিং বটের মূল সেটিংস</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bot Enable/Disable */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">বট স্ট্যাটাস</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSettings(s => ({ ...s, telegram_shop_bot_enabled: s.telegram_shop_bot_enabled === 'true' ? 'false' : 'true' }))}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  settings.telegram_shop_bot_enabled === 'true' ? 'bg-green-500' : 'bg-muted'
                }`}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
                  settings.telegram_shop_bot_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
              <span className={`text-sm font-medium ${settings.telegram_shop_bot_enabled === 'true' ? 'text-green-500' : 'text-muted-foreground'}`}>
                {settings.telegram_shop_bot_enabled === 'true' ? '✅ সক্রিয়' : '⏸️ নিষ্ক্রিয়'}
              </span>
            </div>
          </div>

          {/* Bot Username */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">বট ইউজারনেম</label>
            <input
              value={settings.telegram_shop_bot_username || ''}
              onChange={e => setSettings(s => ({ ...s, telegram_shop_bot_username: e.target.value }))}
              placeholder="@Shahed_Store_bot"
              className={inputCls}
            />
          </div>

          {/* Admin Chat ID */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Admin Chat ID (নোটিফিকেশন)</label>
            <input
              value={settings.telegram_chat_id || ''}
              onChange={e => setSettings(s => ({ ...s, telegram_chat_id: e.target.value }))}
              placeholder="123456789"
              className={inputCls}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              @userinfobot কে মেসেজ করে Chat ID পান
            </p>
          </div>

          {/* Test Button */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">কানেকশন টেস্ট</label>
            <button
              onClick={testBot}
              disabled={testing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[#229ED9]/40 text-[#229ED9] hover:bg-[#229ED9]/10 transition-colors disabled:opacity-40"
            >
              {testing ? <Loader2 size={14} className="animate-spin" /> : testResult === 'success' ? <CheckCircle size={14} className="text-green-500" /> : testResult === 'error' ? <XCircle size={14} className="text-red-500" /> : <TestTube size={14} />}
              {testing ? 'টেস্ট হচ্ছে...' : 'টেস্ট মেসেজ পাঠান'}
            </button>
          </div>
        </div>
      </div>

      {/* Welcome & Footer Messages */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <MessageCircle size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">বট মেসেজ কাস্টমাইজ</h3>
            <p className="text-xs text-muted-foreground">বটের ওয়েলকাম ও ফুটার মেসেজ পরিবর্তন করুন</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">ওয়েলকাম মেসেজ (/start কমান্ডে)</label>
            <textarea
              value={settings.telegram_shop_bot_welcome || ''}
              onChange={e => setSettings(s => ({ ...s, telegram_shop_bot_welcome: e.target.value }))}
              rows={3}
              placeholder="🛍️ Shahed Store এ স্বাগতম!"
              className={inputCls + " resize-none"}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">ফুটার মেসেজ (হেল্প টেক্সট)</label>
            <textarea
              value={settings.telegram_shop_bot_footer || ''}
              onChange={e => setSettings(s => ({ ...s, telegram_shop_bot_footer: e.target.value }))}
              rows={2}
              placeholder="📞 সমস্যা? /start দিয়ে শুরু করুন।"
              className={inputCls + " resize-none"}
            />
          </div>
        </div>
      </div>

      {/* Bot Features */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <Globe size={20} className="text-green-500" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">বটের ফিচার সমূহ</h3>
            <p className="text-xs text-muted-foreground">@Shahed_Store_bot এ যা যা কাজ করে</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { cmd: '/start', desc: 'মেইন মেনু ও বট পরিচিতি', icon: '🏠' },
            { cmd: '/shop', desc: 'ক্যাটাগরি অনুযায়ী প্রোডাক্ট ব্রাউজ', icon: '📦' },
            { cmd: '/search <নাম>', desc: 'নাম দিয়ে প্রোডাক্ট সার্চ', icon: '🔍' },
            { cmd: '/cart', desc: 'কার্ট দেখা ও ম্যানেজ', icon: '🛒' },
            { cmd: '/track <নম্বর>', desc: 'অর্ডার ট্র্যাকিং', icon: '📋' },
            { cmd: '/help', desc: 'সাহায্য ও নির্দেশনা', icon: '❓' },
            { cmd: 'ইনলাইন বাটন', desc: 'কার্টে যোগ, পরিমাণ পরিবর্তন, চেকআউট', icon: '🔘' },
            { cmd: 'ডুয়াল চেকআউট', desc: 'টেলিগ্রামে বা ওয়েবসাইটে চেকআউট', icon: '💳' },
          ].map((f) => (
            <div key={f.cmd} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
              <span className="text-lg">{f.icon}</span>
              <div>
                <code className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{f.cmd}</code>
                <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Telegram Orders */}
      {recentOrders.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <BarChart3 size={20} className="text-orange-500" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">সাম্প্রতিক টেলিগ্রাম অর্ডার</h3>
              <p className="text-xs text-muted-foreground">টেলিগ্রাম বট থেকে আসা শেষ অর্ডারগুলো</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border/50">
                  <th className="pb-2 text-muted-foreground font-medium">অর্ডার</th>
                  <th className="pb-2 text-muted-foreground font-medium">গ্রাহক</th>
                  <th className="pb-2 text-muted-foreground font-medium">মোট</th>
                  <th className="pb-2 text-muted-foreground font-medium">স্ট্যাটাস</th>
                  <th className="pb-2 text-muted-foreground font-medium">তারিখ</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border/30 last:border-0">
                    <td className="py-2.5 font-mono text-xs text-primary">#{order.order_number}</td>
                    <td className="py-2.5">{order.customer_name}</td>
                    <td className="py-2.5 font-semibold">৳{Number(order.total).toLocaleString()}</td>
                    <td className="py-2.5">
                      <span className={`text-xs font-medium ${statusColors[order.status] || 'text-muted-foreground'}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('bn-BD')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Link */}
      <div className="glass-card rounded-2xl p-5 border border-[#229ED9]/20 bg-[#229ED9]/5">
        <div className="flex items-center gap-3">
          <Bot size={24} className="text-[#229ED9]" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">বটটি টেস্ট করুন</p>
            <p className="text-xs text-muted-foreground">Telegram-এ {settings.telegram_shop_bot_username || '@Shahed_Store_bot'} সার্চ করে /start দিন</p>
          </div>
          <a
            href={`https://t.me/${(settings.telegram_shop_bot_username || '@Shahed_Store_bot').replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#229ED9] text-white hover:bg-[#229ED9]/80 transition-colors flex items-center gap-2"
          >
            <Send size={14} /> বট ওপেন
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminTelegramBot;
