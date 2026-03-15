import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Save, Check, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface Redirect { id: string; from_path: string; to_path: string; type: '301' | '302'; }

const AdminRedirects = () => {
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [newR, setNewR] = useState<Omit<Redirect,'id'>>({ from_path: '', to_path: '', type: '301' });

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'redirects').maybeSingle().then(({ data }) => {
      try { if (data?.value) setRedirects(JSON.parse(data.value)); } catch {}
      setLoading(false);
    });
  }, []);

  const persist = async (list: Redirect[]) => {
    await supabase.from('site_settings').upsert({ key: 'redirects', value: JSON.stringify(list), category: 'seo' }, { onConflict: 'key' });
    toast.success('Redirects updated!');
  };

  const add = async () => {
    if (!newR.from_path || !newR.to_path) return toast.error('Both paths are required');
    if (!newR.from_path.startsWith('/')) return toast.error('From path must start with /');
    const updated = [...redirects, { ...newR, id: crypto.randomUUID() }];
    setRedirects(updated); await persist(updated);
    setNewR({ from_path: '', to_path: '', type: '301' });
  };

  const remove = async (id: string) => { const updated = redirects.filter(r => r.id !== id); setRedirects(updated); await persist(updated); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Redirect <span className="gradient-text">Manager</span>
          </h1>
          <p className="text-muted-foreground text-sm">Manage 301/302 redirects to preserve SEO equity</p>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl text-xs text-muted-foreground">
          {redirects.length} active redirects
        </div>
      </div>

      {/* Add */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-bold text-foreground mb-4 text-sm">Add New Redirect</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={newR.type} onChange={e => setNewR(p => ({ ...p, type: e.target.value as any }))}
            className="bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary">
            <option value="301">301 — Permanent</option>
            <option value="302">302 — Temporary</option>
          </select>
          <input value={newR.from_path} onChange={e => setNewR(p => ({ ...p, from_path: e.target.value }))}
            placeholder="/old-url" onKeyDown={e => e.key === 'Enter' && add()}
            className="bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:border-primary" />
          <input value={newR.to_path} onChange={e => setNewR(p => ({ ...p, to_path: e.target.value }))}
            placeholder="/new-url or https://…" onKeyDown={e => e.key === 'Enter' && add()}
            className="bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:border-primary" />
          <button onClick={add} className="btn-glow rounded-xl text-sm font-medium flex items-center justify-center gap-2">
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h3 className="font-bold text-foreground text-sm">Active Redirects ({redirects.length})</h3>
        </div>
        {loading ? <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
          : redirects.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">No redirects yet. Add one above.</div>
          : (
            <div className="divide-y divide-border">
              {redirects.map(r => (
                <div key={r.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/10 transition-colors">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ${r.type === '301' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{r.type}</span>
                  <code className="text-sm text-muted-foreground flex-1 truncate">{r.from_path}</code>
                  <ArrowRight size={14} className="text-muted-foreground/40 flex-shrink-0" />
                  <code className="text-sm text-primary flex-1 truncate">{r.to_path}</code>
                  <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-red-400 transition-colors p-1 flex-shrink-0"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )
        }
      </div>
      <p className="text-xs text-muted-foreground glass-card px-4 py-3 rounded-xl">
        💡 Redirects are enforced client-side via React Router. For permanent server-level redirects on production hosting, also configure them in your CDN/server config.
      </p>
    </div>
  );
};

export default AdminRedirects;
