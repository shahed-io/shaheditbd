import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TEXT_REGISTRY, TEXT_CATEGORIES, type TextRegistryEntry } from '@/lib/textRegistry';
import { Save, RotateCcw, Search, Plus, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Row {
  key: string;
  value: string;
  default_value: string;
  category: string;
  description: string | null;
  registered: boolean; // exists in TEXT_REGISTRY
}

const AdminTextManager = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<string>('All');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Load DB rows
  const { data: dbRows = [], isLoading } = useQuery({
    queryKey: ['text-overrides-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('text_overrides')
        .select('*')
        .order('category', { ascending: true })
        .order('key', { ascending: true });
      if (error) throw error;
      return data as { key: string; value: string; default_value: string; category: string; description: string | null }[];
    },
    staleTime: 0,
  });

  // Merge registry defaults with DB rows so admin sees everything (registered + custom).
  const rows: Row[] = useMemo(() => {
    const dbMap = new Map(dbRows.map(r => [r.key, r]));
    const merged: Row[] = TEXT_REGISTRY.map((entry: TextRegistryEntry) => {
      const db = dbMap.get(entry.key);
      return {
        key: entry.key,
        value: db?.value ?? '',
        default_value: entry.defaultValue,
        category: entry.category,
        description: entry.description ?? db?.description ?? null,
        registered: true,
      };
    });
    // Add custom (non-registry) keys admins added manually
    dbRows.forEach(db => {
      if (!TEXT_REGISTRY.find(e => e.key === db.key)) {
        merged.push({ ...db, registered: false });
      }
    });
    return merged;
  }, [dbRows]);

  const categories = useMemo(() => ['All', ...Array.from(new Set([...TEXT_CATEGORIES, ...rows.map(r => r.category)]))], [rows]);

  const filtered = rows.filter(r => {
    if (activeCat !== 'All' && r.category !== activeCat) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.key.toLowerCase().includes(q) || r.value.toLowerCase().includes(q) || r.default_value.toLowerCase().includes(q);
  });

  const draftFor = (r: Row) => drafts[r.key] ?? r.value ?? r.default_value;

  const setDraft = (key: string, v: string) => setDrafts(prev => ({ ...prev, [key]: v }));

  const saveOne = async (r: Row) => {
    const value = draftFor(r);
    setSavingKey(r.key);
    const { error } = await supabase
      .from('text_overrides')
      .upsert({
        key: r.key,
        value,
        default_value: r.default_value,
        category: r.category,
        description: r.description,
      }, { onConflict: 'key' });
    setSavingKey(null);
    if (error) {
      toast.error('Save failed: ' + error.message);
      return;
    }
    toast.success('Saved');
    setDrafts(prev => { const { [r.key]: _, ...rest } = prev; return rest; });
    qc.invalidateQueries({ queryKey: ['text-overrides-admin'] });
    qc.invalidateQueries({ queryKey: ['text-overrides'] });
  };

  const resetOne = async (r: Row) => {
    if (!confirm(`Reset "${r.key}" to default?`)) return;
    const { error } = await supabase.from('text_overrides').delete().eq('key', r.key);
    if (error) { toast.error(error.message); return; }
    toast.success('Reset to default');
    setDrafts(prev => { const { [r.key]: _, ...rest } = prev; return rest; });
    qc.invalidateQueries({ queryKey: ['text-overrides-admin'] });
    qc.invalidateQueries({ queryKey: ['text-overrides'] });
  };

  const deleteCustom = async (r: Row) => {
    if (!confirm(`Delete custom key "${r.key}" permanently?`)) return;
    const { error } = await supabase.from('text_overrides').delete().eq('key', r.key);
    if (error) { toast.error(error.message); return; }
    toast.success('Deleted');
    qc.invalidateQueries({ queryKey: ['text-overrides-admin'] });
    qc.invalidateQueries({ queryKey: ['text-overrides'] });
  };

  // Add custom key
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState('General');

  const addCustom = async () => {
    if (!newKey.trim() || !newValue.trim()) { toast.error('Key and value required'); return; }
    const { error } = await supabase.from('text_overrides').upsert({
      key: newKey.trim(),
      value: newValue,
      default_value: newValue,
      category: newCategory.trim() || 'General',
    }, { onConflict: 'key' });
    if (error) { toast.error(error.message); return; }
    toast.success('Added');
    setNewKey(''); setNewValue(''); setShowAdd(false);
    qc.invalidateQueries({ queryKey: ['text-overrides-admin'] });
    qc.invalidateQueries({ queryKey: ['text-overrides'] });
  };

  const inputCls = "w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors";

  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 glass-card rounded-2xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Text <span className="gradient-text">Manager</span>
          </h1>
          <p className="text-muted-foreground text-sm">Edit any registered text on the website. Changes appear instantly.</p>
        </div>
        <button onClick={() => setShowAdd(s => !s)} className="btn-glow px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <Plus size={16} /> Add Custom Key
        </button>
      </div>

      {showAdd && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><FileText size={16} /> Add custom text key</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="key (e.g. promo.banner.text)" className={inputCls} />
            <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Category" className={inputCls} />
            <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Value" className={inputCls} />
          </div>
          <div className="flex gap-2">
            <button onClick={addCustom} className="btn-glow px-4 py-2 rounded-lg text-sm font-semibold">Save Key</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted/30">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by key or text..."
            className={inputCls + ' pl-10'}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${activeCat === cat ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-3">
        {filtered.length === 0 && <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground text-sm">No text entries match your filters.</div>}
        {filtered.map(r => {
          const draft = draftFor(r);
          const customised = !!r.value && r.value !== r.default_value;
          const dirty = (drafts[r.key] !== undefined) && drafts[r.key] !== (r.value || r.default_value);
          const isLong = (draft || '').length > 80 || draft.includes('\n');
          return (
            <div key={r.key} className="glass-card rounded-2xl p-4 md:p-5">
              <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs px-2 py-0.5 rounded bg-muted/50 text-foreground font-mono break-all">{r.key}</code>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-primary/15 text-primary font-bold">{r.category}</span>
                    {customised && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-bold">Customised</span>}
                    {!r.registered && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 font-bold">Custom</span>}
                  </div>
                  {r.description && <p className="text-xs text-muted-foreground mt-1.5">{r.description}</p>}
                  <p className="text-[11px] text-muted-foreground mt-1">Default: <span className="text-foreground/70">{r.default_value}</span></p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => saveOne(r)}
                    disabled={!dirty || savingKey === r.key}
                    className="btn-glow px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Save size={14} /> {savingKey === r.key ? 'Saving...' : 'Save'}
                  </button>
                  {customised && (
                    <button onClick={() => resetOne(r)} className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs border border-border hover:bg-muted/30" title="Reset to default">
                      <RotateCcw size={14} />
                    </button>
                  )}
                  {!r.registered && (
                    <button onClick={() => deleteCustom(r)} className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs border border-destructive/40 text-destructive hover:bg-destructive/10">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              {isLong ? (
                <textarea
                  value={draft}
                  onChange={e => setDraft(r.key, e.target.value)}
                  rows={Math.min(8, Math.max(2, draft.split('\n').length))}
                  className={inputCls + ' resize-y font-medium'}
                />
              ) : (
                <input
                  value={draft}
                  onChange={e => setDraft(r.key, e.target.value)}
                  className={inputCls + ' font-medium'}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminTextManager;
