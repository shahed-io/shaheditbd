import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Save, Brain, Eye, EyeOff, CheckCircle, XCircle, Loader2, TestTube, Plus, Trash2, Key, Shield, Settings, Search } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKeyEntry {
  key: string;
  value: string;
  category: string;
  isNew?: boolean;
}

const KNOWN_PROVIDERS: Record<string, { name: string; icon: string; color: string; bgColor: string; borderColor: string; testType?: string; link?: string; description?: string }> = {
  'gemini': { name: 'Google Gemini', icon: '🤖', color: '#4285F4', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', testType: 'gemini', link: 'https://aistudio.google.com/apikey', description: 'Google AI Studio থেকে API Key নিন' },
  'openai': { name: 'OpenAI (ChatGPT)', icon: '💬', color: '#10A37F', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', testType: 'openai', link: 'https://platform.openai.com/api-keys', description: 'OpenAI Dashboard থেকে API Key নিন' },
  'telegram': { name: 'Telegram Bot', icon: '📱', color: '#0088CC', bgColor: 'bg-sky-500/10', borderColor: 'border-sky-500/20', description: 'Telegram Bot Token' },
  'bkash': { name: 'BKash Payment', icon: '💳', color: '#E2136E', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20', description: 'BKash Merchant API Credentials' },
  'grahok': { name: 'Grahok SMS', icon: '📨', color: '#FF6B35', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20', description: 'Grahok SMS API Credentials' },
  'admin': { name: 'Admin Credentials', icon: '🔐', color: '#8B5CF6', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', description: 'Admin login credentials' },
  'supabase': { name: 'Supabase / System', icon: '⚙️', color: '#3ECF8E', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20', description: 'সিস্টেম লেভেল কনফিগারেশন (পরিবর্তন সাবধানে করুন)' },
  'other': { name: 'অন্যান্য API Keys', icon: '🔑', color: '#F59E0B', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', description: 'কাস্টম API Key ও কনফিগারেশন' },
};

function categorizeKey(key: string): string {
  const lk = key.toLowerCase();
  if (lk.includes('gemini')) return 'gemini';
  if (lk.includes('openai')) return 'openai';
  if (lk.includes('telegram')) return 'telegram';
  if (lk.includes('bkash')) return 'bkash';
  if (lk.includes('grahok')) return 'grahok';
  if (lk.includes('admin')) return 'admin';
  if (lk.includes('supabase') || lk.includes('lovable')) return 'supabase';
  return 'other';
}

const AdminAiConfig = () => {
  const [dbSettings, setDbSettings] = useState<ApiKeyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [testingKeys, setTestingKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | null>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newKeyCategory, setNewKeyCategory] = useState('ai_config');
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchSettings = async () => {
    const { data } = await supabase.from('site_settings').select('*').in('category', ['ai_config', 'api_keys', 'integrations', 'credentials']);
    const entries: ApiKeyEntry[] = (data || []).map(s => ({ key: s.key, value: s.value || '', category: s.category || 'ai_config' }));
    setDbSettings(entries);
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const updateValue = (key: string, value: string) => {
    setDbSettings(prev => prev.map(e => e.key === key ? { ...e, value } : e));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = dbSettings.map(entry =>
        supabase.from('site_settings').upsert(
          { key: entry.key, value: entry.value, category: entry.category },
          { onConflict: 'key' }
        )
      );
      await Promise.all(updates);
      toast.success('✅ সকল API কনফিগারেশন সেভ হয়েছে!');
    } catch {
      toast.error('❌ সেভ করতে সমস্যা হয়েছে');
    }
    setSaving(false);
  };

  const addNewKey = async () => {
    if (!newKeyName.trim()) { toast.error('Key এর নাম দিন'); return; }
    const keyName = newKeyName.trim().toLowerCase().replace(/\s+/g, '_');
    if (dbSettings.some(e => e.key === keyName)) { toast.error('এই নামে Key আগে থেকে আছে'); return; }

    const newEntry: ApiKeyEntry = { key: keyName, value: newKeyValue, category: newKeyCategory, isNew: true };
    setDbSettings(prev => [...prev, newEntry]);

    // Save immediately
    await supabase.from('site_settings').upsert(
      { key: keyName, value: newKeyValue, category: newKeyCategory },
      { onConflict: 'key' }
    );

    toast.success(`✅ "${keyName}" যোগ করা হয়েছে`);
    setNewKeyName('');
    setNewKeyValue('');
    setShowAddForm(false);
  };

  const deleteKey = async (key: string) => {
    if (!confirm(`"${key}" মুছে ফেলতে চান?`)) return;
    await supabase.from('site_settings').delete().eq('key', key);
    setDbSettings(prev => prev.filter(e => e.key !== key));
    toast.success(`🗑️ "${key}" মুছে ফেলা হয়েছে`);
  };

  const toggleKeyVisibility = (key: string) => {
    setVisibleKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const testApiKey = async (testType: string, keyField: string) => {
    const entry = dbSettings.find(e => e.key === keyField);
    if (!entry?.value) { toast.error('আগে API Key দিন'); return; }

    setTestingKeys(prev => ({ ...prev, [keyField]: true }));
    setTestResults(prev => ({ ...prev, [keyField]: null }));

    try {
      let success = false;
      if (testType === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${entry.value}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'Say "OK" only.' }] }], generationConfig: { maxOutputTokens: 5 } }),
        });
        success = res.ok;
      } else if (testType === 'openai') {
        const res = await fetch('https://api.openai.com/v1/models', { headers: { 'Authorization': `Bearer ${entry.value}` } });
        success = res.ok;
      }
      setTestResults(prev => ({ ...prev, [keyField]: success ? 'success' : 'error' }));
      if (success) toast.success('✅ API Key সঠিক!');
      else toast.error('❌ API Key ভুল বা সমস্যা আছে');
    } catch {
      setTestResults(prev => ({ ...prev, [keyField]: 'error' }));
      toast.error('❌ টেস্ট ব্যর্থ');
    }
    setTestingKeys(prev => ({ ...prev, [keyField]: false }));
  };

  // Group settings by provider
  const grouped: Record<string, ApiKeyEntry[]> = {};
  dbSettings.forEach(entry => {
    const cat = categorizeKey(entry.key);
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(entry);
  });

  const filteredGroups = Object.entries(grouped).filter(([, entries]) =>
    entries.some(e => e.key.toLowerCase().includes(searchTerm.toLowerCase()) || e.value.toLowerCase().includes(searchTerm.toLowerCase()))
  ).map(([cat, entries]) => [cat, entries.filter(e => e.key.toLowerCase().includes(searchTerm.toLowerCase()) || e.value.toLowerCase().includes(searchTerm.toLowerCase()))] as [string, ApiKeyEntry[]]);

  const totalKeys = dbSettings.length;
  const activeKeys = dbSettings.filter(e => e.value).length;

  const inputCls = "w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            🔑 API Key <span className="gradient-text">ম্যানেজমেন্ট</span>
          </h1>
          <p className="text-muted-foreground text-sm">সকল API Key ও সিক্রেট এখান থেকে ম্যানেজ করুন</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddForm(!showAddForm)} className="px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold border border-primary/30 text-primary hover:bg-primary/10 transition-colors">
            <Plus size={16} />
            নতুন Key যোগ করুন
          </button>
          <button onClick={handleSave} disabled={saving || loading} className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold">
            <Save size={16} />
            {saving ? 'সেভ হচ্ছে...' : 'Save All'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">{totalKeys}</p>
          <p className="text-xs text-muted-foreground">মোট Key</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-green-500">{activeKeys}</p>
          <p className="text-xs text-muted-foreground">সক্রিয় Key</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{Object.keys(grouped).length}</p>
          <p className="text-xs text-muted-foreground">ক্যাটাগরি</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-green-500">{Object.values(testResults).filter(r => r === 'success').length}</p>
          <p className="text-xs text-muted-foreground">ভেরিফাইড</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Key খুঁজুন..."
          className={inputCls + ' pl-16'}
        />
      </div>

      {/* Add New Key Form */}
      {showAddForm && (
        <div className="glass-card rounded-2xl p-6 border border-primary/20">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Plus size={16} className="text-primary" /> নতুন API Key / Secret যোগ করুন
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Key এর নাম</label>
              <input
                type="text"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                placeholder="যেমন: my_custom_api_key"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Value</label>
              <input
                type="password"
                value={newKeyValue}
                onChange={e => setNewKeyValue(e.target.value)}
                placeholder="API Key / Secret value..."
                className={inputCls + ' font-mono text-xs'}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">ক্যাটাগরি</label>
              <select
                value={newKeyCategory}
                onChange={e => setNewKeyCategory(e.target.value)}
                className={inputCls}
              >
                <option value="ai_config">AI Config</option>
                <option value="api_keys">API Keys</option>
                <option value="integrations">Integrations</option>
                <option value="credentials">Credentials</option>
              </select>
            </div>
          </div>
          <button onClick={addNewKey} className="btn-glow px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
            <Plus size={14} /> যোগ করুন
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 glass-card rounded-2xl animate-pulse" />)}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Key size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">কোনো API Key পাওয়া যায়নি</p>
          <p className="text-xs text-muted-foreground mt-1">উপরের "নতুন Key যোগ করুন" বাটনে ক্লিক করুন</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map(([cat, entries]) => {
            const provider = KNOWN_PROVIDERS[cat] || KNOWN_PROVIDERS['other'];
            const testType = provider.testType;

            return (
              <div key={cat} className={`glass-card rounded-2xl p-6 ${provider.borderColor} border`}>
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-10 h-10 rounded-xl ${provider.bgColor} flex items-center justify-center text-xl`}>
                    {provider.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{provider.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {provider.description}
                      {provider.link && (
                        <> → <a href={provider.link} target="_blank" rel="noopener noreferrer" className="text-primary underline">Key নিন</a></>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-lg">{entries.length}টি</span>
                </div>

                <div className="space-y-3">
                  {entries.map((entry) => {
                    const hasValue = !!entry.value;
                    const result = testResults[entry.key];

                    return (
                      <div key={entry.key} className={`p-3 rounded-xl border transition-colors ${
                        result === 'success' ? 'border-green-500/30 bg-green-500/5' :
                        result === 'error' ? 'border-red-500/30 bg-red-500/5' :
                        'border-border/30 bg-muted/5'
                      }`}>
                        <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-2">
                          <Key size={10} />
                          <span className="font-mono">{entry.key}</span>
                          {result === 'success' && <CheckCircle size={12} className="text-green-500" />}
                          {result === 'error' && <XCircle size={12} className="text-red-500" />}
                          {hasValue && <span className="text-green-500 text-[10px]">● সেট আছে</span>}
                          {!hasValue && <span className="text-red-400 text-[10px]">● সেট নেই</span>}
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type={visibleKeys[entry.key] ? 'text' : 'password'}
                              value={entry.value}
                              onChange={e => updateValue(entry.key, e.target.value)}
                              placeholder="Value দিন..."
                              className={inputCls + ' pr-10 font-mono text-xs'}
                            />
                            <button
                              type="button"
                              onClick={() => toggleKeyVisibility(entry.key)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {visibleKeys[entry.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                          {testType && (
                            <button
                              onClick={() => testApiKey(testType, entry.key)}
                              disabled={testingKeys[entry.key] || !hasValue}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
                              style={{ borderColor: `${provider.color}40`, color: provider.color }}
                            >
                              {testingKeys[entry.key] ? <Loader2 size={12} className="animate-spin" /> : <TestTube size={12} />}
                              টেস্ট
                            </button>
                          )}
                          <button
                            onClick={() => deleteKey(entry.key)}
                            className="p-2 rounded-xl text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="মুছুন"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Info */}
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
                <p className="text-xs text-muted-foreground">API Key গুলো শুধু অ্যাডমিনরা দেখতে ও পরিবর্তন করতে পারবে (RLS protected)</p>
              </div>
              <div className="bg-muted/10 rounded-xl p-4">
                <p className="text-xs font-semibold text-foreground mb-2">➕ কাস্টম Key</p>
                <p className="text-xs text-muted-foreground">যেকোনো থার্ড-পার্টি সার্ভিসের API Key এখান থেকে যোগ ও ম্যানেজ করতে পারবেন</p>
              </div>
              <div className="bg-muted/10 rounded-xl p-4">
                <p className="text-xs font-semibold text-foreground mb-2">⚡ Edge Function</p>
                <p className="text-xs text-muted-foreground">এখানে সেভ করা Key গুলো Edge Function থেকে site_settings টেবিল পড়ে ব্যবহার করা হয়</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAiConfig;
