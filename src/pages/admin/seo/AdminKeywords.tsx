import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KeyRound, Plus, Trash2, Save, Check, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Keyword { id: string; keyword: string; volume: string; difficulty: 'low' | 'medium' | 'high'; target_page: string; }

const AdminKeywords = () => {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newKw, setNewKw] = useState({ keyword: '', volume: '', difficulty: 'medium' as const, target_page: '' });

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'seo_keywords').maybeSingle().then(({ data }) => {
      try { if (data?.value) setKeywords(JSON.parse(data.value)); } catch {}
      setLoading(false);
    });
  }, []);

  const saveAll = async (list: Keyword[]) => {
    setSaving(true);
    await supabase.from('site_settings').upsert({ key: 'seo_keywords', value: JSON.stringify(list), category: 'seo' }, { onConflict: 'key' });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
    toast.success('Keywords saved!');
  };

  const add = () => {
    if (!newKw.keyword.trim()) return toast.error('Enter a keyword');
    const updated = [...keywords, { ...newKw, id: crypto.randomUUID() }];
    setKeywords(updated); saveAll(updated);
    setNewKw({ keyword: '', volume: '', difficulty: 'medium', target_page: '' });
  };

  const remove = (id: string) => { const updated = keywords.filter(k => k.id !== id); setKeywords(updated); saveAll(updated); };

  const diffColor = { low: 'text-green-400 bg-green-500/15', medium: 'text-yellow-400 bg-yellow-500/15', high: 'text-red-400 bg-red-500/15' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Keyword <span className="gradient-text">Manager</span>
          </h1>
          <p className="text-muted-foreground text-sm">Track target keywords for your pages and products</p>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl text-xs text-muted-foreground flex items-center gap-2">
          <TrendingUp size={14} className="text-primary" /> {keywords.length} keywords tracked
        </div>
      </div>

      {/* Add new */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-bold text-foreground mb-4 text-sm">Add Keyword</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input value={newKw.keyword} onChange={e => setNewKw(p => ({ ...p, keyword: e.target.value }))}
            placeholder="e.g. Windows 11 key Bangladesh" onKeyDown={e => e.key === 'Enter' && add()}
            className="md:col-span-2 bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
          <input value={newKw.volume} onChange={e => setNewKw(p => ({ ...p, volume: e.target.value }))}
            placeholder="Search volume (e.g. 1200/mo)"
            className="bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
          <select value={newKw.difficulty} onChange={e => setNewKw(p => ({ ...p, difficulty: e.target.value as any }))}
            className="bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary">
            <option value="low">Low Difficulty</option>
            <option value="medium">Medium Difficulty</option>
            <option value="high">High Difficulty</option>
          </select>
          <button onClick={add} className="btn-glow rounded-xl text-sm font-medium flex items-center justify-center gap-2">
            <Plus size={14} /> Add
          </button>
        </div>
        <div className="mt-3">
          <input value={newKw.target_page} onChange={e => setNewKw(p => ({ ...p, target_page: e.target.value }))}
            placeholder="Target page URL (e.g. /shop or /product/windows-11-pro)"
            className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
        </div>
      </div>

      {/* Keyword list */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-foreground text-sm">All Keywords ({keywords.length})</h3>
          <button onClick={() => saveAll(keywords)} disabled={saving} className="btn-glow px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5">
            {saved ? <Check size={12} /> : <Save size={12} />} {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
        {loading ? <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
          : keywords.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">No keywords yet. Add some above!</div>
          : (
            <div className="divide-y divide-border">
              {keywords.map(k => (
                <div key={k.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/10 transition-colors">
                  <KeyRound size={14} className="text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{k.keyword}</p>
                    {k.target_page && <p className="text-xs text-muted-foreground font-mono">{k.target_page}</p>}
                  </div>
                  {k.volume && <span className="text-xs text-muted-foreground">{k.volume}</span>}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${diffColor[k.difficulty]}`}>{k.difficulty}</span>
                  <button onClick={() => remove(k.id)} className="text-muted-foreground hover:text-red-400 transition-colors p-1">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
};

export default AdminKeywords;
