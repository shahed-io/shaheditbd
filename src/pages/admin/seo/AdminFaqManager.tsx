import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HelpCircle, Save, Check, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const AdminFaqManager = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, any[]>>({});

  useEffect(() => {
    supabase.from('products').select('id, name, slug, faq').order('name').then(({ data }) => {
      setProducts(data || []);
      setLoading(false);
    });
  }, []);

  const getFaqs = (p: any): any[] => {
    if (edits[p.id]) return edits[p.id];
    try { return Array.isArray(p.faq) ? p.faq : (p.faq ? JSON.parse(p.faq) : []); } catch { return []; }
  };

  const setFaqs = (id: string, faqs: any[]) => setEdits(prev => ({ ...prev, [id]: faqs }));

  const addFaq = (id: string) => setFaqs(id, [...getFaqs({ id, faq: null }), { q: '', a: '' }]);
  const removeFaq = (id: string, i: number) => setFaqs(id, getFaqs({ id, faq: null }).filter((_, j) => j !== i));
  const updateFaq = (id: string, i: number, field: 'q' | 'a', val: string) => {
    const f = [...getFaqs({ id, faq: null })]; f[i] = { ...f[i], [field]: val }; setFaqs(id, f);
  };

  const save = async (product: any) => {
    setSaving(product.id);
    const faqs = getFaqs(product).filter(f => f.q && f.a);
    await supabase.from('products').update({ faq: faqs }).eq('id', product.id);
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, faq: faqs } : p));
    setSaving(null); setSaved(product.id);
    setTimeout(() => setSaved(null), 2000);
    toast.success(`FAQs saved for "${product.name}"`);
  };

  const totalFaqs = products.reduce((acc, p) => acc + getFaqs(p).length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            FAQ <span className="gradient-text">Manager</span>
          </h1>
          <p className="text-muted-foreground text-sm">Manage FAQs for products — shown as JSON-LD schema in search results</p>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl text-xs text-muted-foreground">{totalFaqs} total FAQs</div>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 glass-card rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {products.map(p => {
            const faqs = getFaqs(p);
            const isOpen = expanded === p.id;
            return (
              <div key={p.id} className="glass-card rounded-2xl overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : p.id)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/10 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <HelpCircle size={15} className="text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-sm text-foreground">{p.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${faqs.length > 0 ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {faqs.length} FAQ{faqs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {isOpen ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
                </button>

                {isOpen && (
                  <div className="border-t border-border px-5 py-4 space-y-3 bg-muted/5">
                    {faqs.map((faq, i) => (
                      <div key={i} className="bg-background border border-border rounded-xl p-4 space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-bold text-primary mt-2.5 flex-shrink-0">Q</span>
                          <input value={faq.q} onChange={e => updateFaq(p.id, i, 'q', e.target.value)}
                            placeholder="Enter question…"
                            className="flex-1 bg-transparent border-b border-border py-1.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                          <button onClick={() => removeFaq(p.id, i)} className="text-muted-foreground hover:text-red-400 transition-colors p-1 flex-shrink-0"><Trash2 size={13} /></button>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-bold text-muted-foreground mt-2.5 flex-shrink-0">A</span>
                          <textarea value={faq.a} onChange={e => updateFaq(p.id, i, 'a', e.target.value)}
                            placeholder="Enter answer…" rows={2}
                            className="flex-1 bg-transparent border-b border-border py-1.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none" />
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between pt-1">
                      <button onClick={() => addFaq(p.id)} className="glass-card px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 hover:text-primary transition-colors">
                        <Plus size={13} /> Add FAQ
                      </button>
                      <button onClick={() => save(p)} disabled={saving === p.id}
                        className="btn-glow px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 disabled:opacity-60">
                        {saved === p.id ? <Check size={12} /> : saving === p.id ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={12} />}
                        {saved === p.id ? 'Saved!' : 'Save FAQs'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminFaqManager;
