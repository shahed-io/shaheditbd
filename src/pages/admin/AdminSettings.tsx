import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Save, Globe, DollarSign, MessageCircle, TestTube, Send, Mail, Brain, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingWA, setTestingWA] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [testingKeys, setTestingKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | null>>({});

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
    const updates = Object.entries(settings).map(([key, value]) => {
      const category = key.startsWith('ai_') ? 'ai_config' : undefined;
      return supabase.from('site_settings').upsert(
        { key, value, ...(category ? { category } : {}) },
        { onConflict: 'key' }
      );
    });
    await Promise.all(updates);
    toast.success('Settings saved!');
    setSaving(false);
  };

  const toggleKeyVisibility = (key: string) => {
    setVisibleKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const testApiKey = async (provider: string, keyField: string) => {
    const apiKey = settings[keyField];
    if (!apiKey) { toast.error('আগে API Key সেভ করুন'); return; }
    
    setTestingKeys(prev => ({ ...prev, [keyField]: true }));
    setTestResults(prev => ({ ...prev, [keyField]: null }));

    try {
      let success = false;
      
      if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Say "OK" only.' }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
        });
        success = res.ok;
      } else if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        success = res.ok;
      }

      setTestResults(prev => ({ ...prev, [keyField]: success ? 'success' : 'error' }));
      if (success) toast.success(`✅ ${provider.toUpperCase()} API Key কাজ করছে!`);
      else toast.error(`❌ ${provider.toUpperCase()} API Key ভুল বা সমস্যা আছে`);
    } catch {
      setTestResults(prev => ({ ...prev, [keyField]: 'error' }));
      toast.error(`❌ ${provider.toUpperCase()} API Key টেস্ট ব্যর্থ`);
    }
    
    setTestingKeys(prev => ({ ...prev, [keyField]: false }));
  };

  // Test WhatsApp notification
  const testWhatsApp = () => {
    const phone = settings['admin_whatsapp'];
    if (!phone) { toast.error('আগে WhatsApp নম্বর সেভ করুন'); return; }
    setTestingWA(true);
    const cleaned = phone.replace(/\D/g, '').replace(/^0/, '880');
    const msg = encodeURIComponent(
      `✅ টেস্ট নোটিফিকেশন!\n\nShahed Store Admin WhatsApp সফলভাবে কনফিগার হয়েছে। নতুন অর্ডার আসলে এখানে নোটিফিকেশন আসবে। 🎉`
    );
    window.open(`https://wa.me/${cleaned}?text=${msg}`, '_blank');
    setTestingWA(false);
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

  // AI API key configs
  const aiProviders = [
    {
      id: 'gemini',
      name: 'Google Gemini',
      icon: '🤖',
      color: '#4285F4',
      keys: [
        { key: 'ai_gemini_key_1', label: 'Gemini API Key 1 (প্রাইমারি)', placeholder: 'AIzaSy...' },
        { key: 'ai_gemini_key_2', label: 'Gemini API Key 2 (ব্যাকআপ)', placeholder: 'AIzaSy...' },
        { key: 'ai_gemini_key_3', label: 'Gemini API Key 3 (ব্যাকআপ)', placeholder: 'AIzaSy...' },
      ],
      description: 'Google AI Studio থেকে API Key নিন: aistudio.google.com/apikey',
      testProvider: 'gemini',
    },
    {
      id: 'openai',
      name: 'OpenAI (ChatGPT)',
      icon: '💬',
      color: '#10A37F',
      keys: [
        { key: 'ai_openai_key', label: 'OpenAI API Key', placeholder: 'sk-...' },
      ],
      description: 'OpenAI Dashboard থেকে API Key নিন: platform.openai.com/api-keys',
      testProvider: 'openai',
    },
  ];

  // Test Telegram notification
  const testTelegram = async () => {
    const chatId = settings['telegram_chat_id'];
    if (!chatId) { toast.error('আগে Telegram Chat ID সেভ করুন'); return; }
    setTestingWA(true);
    try {
      const { error } = await supabase.functions.invoke('notify-new-order', {
        body: { orderId: 'test', _test: true, _chatId: chatId },
      });
      if (error) toast.error('টেস্ট ব্যর্থ: ' + error.message);
      else toast.success('✅ Telegram টেস্ট মেসেজ পাঠানো হয়েছে!');
    } catch(e: any) {
      toast.error('টেস্ট ব্যর্থ: ' + String(e));
    }
    setTestingWA(false);
  };

  const inputCls = "w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors";

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
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* AI API Configuration */}
          <div className="glass-card rounded-2xl p-6 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Brain size={18} className="text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">🧠 AI API কনফিগারেশন</h3>
                <p className="text-xs text-muted-foreground">বিভিন্ন AI সার্ভিসের API Key সেট করুন — কন্টেন্ট জেনারেশন, লাইসেন্স পার্সিং ইত্যাদিতে ব্যবহৃত হবে</p>
              </div>
            </div>

            <div className="space-y-6">
              {aiProviders.map((provider) => (
                <div key={provider.id} className="border border-border/50 rounded-xl p-4" style={{ borderColor: `${provider.color}20` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{provider.icon}</span>
                    <h4 className="font-semibold text-foreground text-sm">{provider.name}</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {provider.keys.map((keyConfig) => (
                      <div key={keyConfig.key}>
                        <label className="text-xs text-muted-foreground mb-1.5 block">{keyConfig.label}</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type={visibleKeys[keyConfig.key] ? 'text' : 'password'}
                              value={settings[keyConfig.key] || ''}
                              onChange={e => setSettings({ ...settings, [keyConfig.key]: e.target.value })}
                              placeholder={keyConfig.placeholder}
                              className={inputCls + ' pr-10'}
                            />
                            <button
                              type="button"
                              onClick={() => toggleKeyVisibility(keyConfig.key)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {visibleKeys[keyConfig.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                          <button
                            onClick={() => testApiKey(provider.testProvider, keyConfig.key)}
                            disabled={testingKeys[keyConfig.key] || !settings[keyConfig.key]}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ 
                              borderColor: `${provider.color}40`, 
                              color: provider.color,
                            }}
                          >
                            {testingKeys[keyConfig.key] ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : testResults[keyConfig.key] === 'success' ? (
                              <CheckCircle size={12} className="text-green-500" />
                            ) : testResults[keyConfig.key] === 'error' ? (
                              <XCircle size={12} className="text-red-500" />
                            ) : (
                              <TestTube size={12} />
                            )}
                            টেস্ট
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-muted-foreground mt-2">
                    💡 {provider.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
              <p className="text-xs text-foreground font-semibold mb-2">🔒 নিরাপত্তা তথ্য:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>✅ API Key গুলো এনক্রিপ্টেড ডাটাবেজে সেভ হয় — শুধু অ্যাডমিন দেখতে পারবে</li>
                <li>✅ একাধিক Key দিলে রেট লিমিট হলে অটো-রোটেশন হবে</li>
                <li>✅ টেস্ট বাটনে ক্লিক করে Key সঠিক কিনা যাচাই করুন</li>
              </ul>
            </div>
          </div>

          {/* Telegram Notification Settings */}
          <div className="glass-card rounded-2xl p-6 border border-[#229ED9]/20">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-[#229ED9]/20 flex items-center justify-center">
                <Send size={18} className="text-[#229ED9]" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">📱 Telegram অর্ডার নোটিফিকেশন</h3>
                <p className="text-xs text-muted-foreground">নতুন অর্ডার আসলে আপনার Telegram-এ তাৎক্ষণিক নোটিফিকেশন আসবে</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Telegram Chat ID</label>
                <input
                  value={settings['telegram_chat_id'] || ''}
                  onChange={e => setSettings({ ...settings, telegram_chat_id: e.target.value })}
                  placeholder="যেমন: 123456789"
                  className={inputCls}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Chat ID পেতে Telegram-এ <strong>@userinfobot</strong> কে মেসেজ করুন
                </p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">টেস্ট করুন</label>
                <button
                  onClick={testTelegram}
                  disabled={testingWA || !settings['telegram_chat_id']}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[#229ED9]/40 text-[#229ED9] hover:bg-[#229ED9]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <TestTube size={14} /> টেস্ট মেসেজ পাঠান
                </button>
                <p className="text-[11px] text-muted-foreground mt-1">প্রথমে Save করুন, তারপর টেস্ট করুন</p>
              </div>
            </div>

            <div className="mt-4 bg-[#229ED9]/5 border border-[#229ED9]/20 rounded-xl p-4">
              <p className="text-xs text-foreground font-semibold mb-2">📲 কীভাবে Chat ID পাবেন:</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Telegram খুলুন এবং <strong className="text-[#229ED9]">@userinfobot</strong> সার্চ করুন</li>
                <li>Bot-কে <code className="bg-muted px-1 rounded">/start</code> মেসেজ পাঠান</li>
                <li>Bot আপনার Chat ID দেখাবে — সেটি এখানে পেস্ট করুন</li>
                <li>Save করুন এবং টেস্ট বাটনে ক্লিক করুন</li>
              </ol>
            </div>
          </div>

          {/* Admin Email Notification Settings */}
          <div className="glass-card rounded-2xl p-6 border border-violet-500/20">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Mail size={18} className="text-violet-500" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">📧 Admin Email নোটিফিকেশন</h3>
                <p className="text-xs text-muted-foreground">নতুন অর্ডার আসলে এই ইমেইলে নোটিফিকেশন আসবে</p>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Admin Notification Email</label>
              <input
                value={settings['admin_notification_email'] || ''}
                onChange={e => setSettings({ ...settings, admin_notification_email: e.target.value })}
                placeholder="admin@example.com"
                className={inputCls}
                type="email"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                নতুন অর্ডার আসলে এই ইমেইলে অর্ডারের সম্পূর্ণ বিস্তারিত পাঠানো হবে
              </p>
            </div>
          </div>

          {/* WhatsApp Notification Settings */}
          <div className="glass-card rounded-2xl p-6 border border-[#25D366]/20">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-[#25D366]/20 flex items-center justify-center">
                <MessageCircle size={18} className="text-[#25D366]" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">WhatsApp অর্ডার নোটিফিকেশন</h3>
                <p className="text-xs text-muted-foreground">নতুন অর্ডার আসলে এই নম্বরে WhatsApp নোটিফিকেশন যাবে</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Admin WhatsApp নম্বর</label>
                <input
                  value={settings['admin_whatsapp'] || ''}
                  onChange={e => setSettings({ ...settings, admin_whatsapp: e.target.value })}
                  placeholder="01XXXXXXXXX বা 880XXXXXXXXXX"
                  className={inputCls}
                />
                <p className="text-[11px] text-muted-foreground mt-1">যেকোনো ফরম্যাটে দিন — 01712345678 বা 8801712345678</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">নোটিফিকেশন টেস্ট করুন</label>
                <button
                  onClick={testWhatsApp}
                  disabled={testingWA || !settings['admin_whatsapp']}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <TestTube size={14} /> টেস্ট মেসেজ পাঠান
                </button>
                <p className="text-[11px] text-muted-foreground mt-1">প্রথমে Save করুন, তারপর টেস্ট করুন</p>
              </div>
            </div>

            <div className="mt-4 bg-[#25D366]/5 border border-[#25D366]/20 rounded-xl p-4">
              <p className="text-xs text-foreground font-semibold mb-2">📱 কীভাবে কাজ করে:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>✅ নতুন অর্ডার প্লেস হলে Admin Orders পেজে <strong className="text-[#25D366]">WhatsApp</strong> বাটন দেখাবে</li>
                <li>✅ বাটনে ক্লিক করলে অর্ডারের সব তথ্য সহ WhatsApp খুলবে</li>
                <li>✅ অর্ডার নম্বর, কাস্টমার, প্রোডাক্ট, মোট টাকা — সব তথ্য থাকবে</li>
                <li>✅ Orders পেজের প্রতিটি অর্ডারেও আলাদা WhatsApp বাটন থাকবে</li>
              </ul>
            </div>
          </div>

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
