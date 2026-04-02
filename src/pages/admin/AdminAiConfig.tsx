import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Save, Brain, Eye, EyeOff, CheckCircle, XCircle, Loader2, TestTube, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminAiConfig = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    const aiKeys = Object.entries(settings).filter(([k]) => k.startsWith('ai_'));
    const updates = aiKeys.map(([key, value]) =>
      supabase.from('site_settings').upsert(
        { key, value, category: 'ai_config' },
        { onConflict: 'key' }
      )
    );
    await Promise.all(updates);
    toast.success('✅ AI API কনফিগারেশন সেভ হয়েছে!');
    setSaving(false);
  };

  const toggleKeyVisibility = (key: string) => {
    setVisibleKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const testApiKey = async (provider: string, keyField: string) => {
    const apiKey = settings[keyField];
    if (!apiKey) { toast.error('আগে API Key দিন'); return; }

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
      if (success) toast.success(`✅ API Key সঠিক — কাজ করছে!`);
      else toast.error(`❌ API Key ভুল বা সমস্যা আছে`);
    } catch {
      setTestResults(prev => ({ ...prev, [keyField]: 'error' }));
      toast.error(`❌ API Key টেস্ট ব্যর্থ`);
    }

    setTestingKeys(prev => ({ ...prev, [keyField]: false }));
  };

  const clearKey = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: '' }));
    setTestResults(prev => ({ ...prev, [key]: null }));
  };

  const aiProviders = [
    {
      id: 'gemini',
      name: 'Google Gemini',
      icon: '🤖',
      color: '#4285F4',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      keys: [
        { key: 'ai_gemini_key_1', label: 'Gemini API Key 1 (প্রাইমারি)', placeholder: 'AIzaSy...' },
        { key: 'ai_gemini_key_2', label: 'Gemini API Key 2 (ব্যাকআপ)', placeholder: 'AIzaSy...' },
        { key: 'ai_gemini_key_3', label: 'Gemini API Key 3 (ব্যাকআপ)', placeholder: 'AIzaSy...' },
      ],
      description: 'Google AI Studio থেকে API Key নিন',
      link: 'https://aistudio.google.com/apikey',
      testProvider: 'gemini',
    },
    {
      id: 'openai',
      name: 'OpenAI (ChatGPT)',
      icon: '💬',
      color: '#10A37F',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      keys: [
        { key: 'ai_openai_key', label: 'OpenAI API Key', placeholder: 'sk-...' },
      ],
      description: 'OpenAI Dashboard থেকে API Key নিন',
      link: 'https://platform.openai.com/api-keys',
      testProvider: 'openai',
    },
  ];

  const inputCls = "w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors";

  const activeKeysCount = Object.entries(settings).filter(([k, v]) => k.startsWith('ai_') && v).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            🧠 AI API <span className="gradient-text">কনফিগারেশন</span>
          </h1>
          <p className="text-muted-foreground text-sm">AI সার্ভিসের API Key সেট করুন — কন্টেন্ট জেনারেশন, লাইসেন্স পার্সিং ইত্যাদিতে ব্যবহৃত হবে</p>
        </div>
        <button onClick={handleSave} disabled={saving || loading} className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <Save size={16} />
          {saving ? 'সেভ হচ্ছে...' : 'Save Changes'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">{activeKeysCount}</p>
          <p className="text-xs text-muted-foreground">সক্রিয় API Key</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{aiProviders.length}</p>
          <p className="text-xs text-muted-foreground">সাপোর্টেড প্রোভাইডার</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-green-500">
            {Object.values(testResults).filter(r => r === 'success').length}
          </p>
          <p className="text-xs text-muted-foreground">ভেরিফাইড Key</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-52 glass-card rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {aiProviders.map((provider) => (
            <div key={provider.id} className={`glass-card rounded-2xl p-6 ${provider.borderColor} border`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl ${provider.bgColor} flex items-center justify-center text-xl`}>
                  {provider.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">{provider.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {provider.description} →{' '}
                    <a href={provider.link} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      Key নিন
                    </a>
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {provider.keys.map((keyConfig) => {
                  const hasValue = !!settings[keyConfig.key];
                  const result = testResults[keyConfig.key];

                  return (
                    <div key={keyConfig.key} className={`p-3 rounded-xl border transition-colors ${
                      result === 'success' ? 'border-green-500/30 bg-green-500/5' :
                      result === 'error' ? 'border-red-500/30 bg-red-500/5' :
                      'border-border/30 bg-muted/5'
                    }`}>
                      <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-2">
                        {keyConfig.label}
                        {result === 'success' && <CheckCircle size={12} className="text-green-500" />}
                        {result === 'error' && <XCircle size={12} className="text-red-500" />}
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={visibleKeys[keyConfig.key] ? 'text' : 'password'}
                            value={settings[keyConfig.key] || ''}
                            onChange={e => setSettings({ ...settings, [keyConfig.key]: e.target.value })}
                            placeholder={keyConfig.placeholder}
                            className={inputCls + ' pr-10 font-mono text-xs'}
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
                          disabled={testingKeys[keyConfig.key] || !hasValue}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
                          style={{ borderColor: `${provider.color}40`, color: provider.color }}
                        >
                          {testingKeys[keyConfig.key] ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <TestTube size={12} />
                          )}
                          টেস্ট
                        </button>
                        {hasValue && (
                          <button
                            onClick={() => clearKey(keyConfig.key)}
                            className="p-2 rounded-xl text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Key মুছুন"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Info Box */}
          <div className="glass-card rounded-2xl p-6 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-4">
              <Brain size={18} className="text-purple-400" />
              <h3 className="font-bold text-foreground">কীভাবে কাজ করে?</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/10 rounded-xl p-4">
                <p className="text-xs font-semibold text-foreground mb-2">🔄 অটো-রোটেশন</p>
                <p className="text-xs text-muted-foreground">একাধিক Gemini Key দিলে রেট লিমিট হলে স্বয়ংক্রিয়ভাবে পরবর্তী Key ব্যবহার হবে</p>
              </div>
              <div className="bg-muted/10 rounded-xl p-4">
                <p className="text-xs font-semibold text-foreground mb-2">🔒 নিরাপদ স্টোরেজ</p>
                <p className="text-xs text-muted-foreground">API Key গুলো শুধু অ্যাডমিনরা দেখতে ও পরিবর্তন করতে পারবে</p>
              </div>
              <div className="bg-muted/10 rounded-xl p-4">
                <p className="text-xs font-semibold text-foreground mb-2">⚡ যেখানে ব্যবহৃত হয়</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• AI Smart Import (লাইসেন্স পার্সিং)</li>
                  <li>• প্রোডাক্ট কন্টেন্ট জেনারেশন</li>
                  <li>• ক্যাটাগরি ইমেজ জেনারেশন</li>
                  <li>• ব্লগ পোস্ট জেনারেশন</li>
                </ul>
              </div>
              <div className="bg-muted/10 rounded-xl p-4">
                <p className="text-xs font-semibold text-foreground mb-2">📋 Key পাওয়ার ধাপ</p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Google AI Studio / OpenAI ড্যাশবোর্ডে যান</li>
                  <li>নতুন API Key তৈরি করুন</li>
                  <li>এখানে পেস্ট করে Save করুন</li>
                  <li>টেস্ট বাটনে ক্লিক করে যাচাই করুন</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAiConfig;
