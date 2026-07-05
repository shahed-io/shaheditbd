import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, Search, Loader2, CheckCircle2, RefreshCw, Save, Eye, X, Languages, Hash, HelpCircle } from 'lucide-react';
import { normalizeBrandNameFaqs, normalizeBrandNameText } from '@/lib/brandName';

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  short_description: string | null;
  description: string | null;
  delivery_time: string | null;
  category: { name: string } | null;
  faq: { q: string; a: string }[] | null;
}

interface FaqItem { q: string; a: string }

const sanitizeFaqs = (faqs: FaqItem[], language: 'bn' | 'en') =>
  normalizeBrandNameFaqs(faqs).map((f) => ({ q: normalizeBrandNameText(f.q), a: normalizeBrandNameText(f.a) }));

const AdminAiFaqGenerator = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'missing' | 'has'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [count, setCount] = useState(5);
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const [previewProduct, setPreviewProduct] = useState<ProductRow | null>(null);
  const [previewFaqs, setPreviewFaqs] = useState<FaqItem[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewSaving, setPreviewSaving] = useState(false);
  const [mode, setMode] = useState<'replace' | 'append'>('replace');

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id,name,slug,price,short_description,description,delivery_time,faq,category:category_id(name)')
      .order('created_at', { ascending: false })
      .limit(1000);
    if (error) toast.error(error.message);
    setProducts((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(p => {
      if (q && !p.name.toLowerCase().includes(q) && !p.slug.toLowerCase().includes(q)) return false;
      const hasFaq = Array.isArray(p.faq) && p.faq.length > 0;
      if (filter === 'missing' && hasFaq) return false;
      if (filter === 'has' && !hasFaq) return false;
      return true;
    });
  }, [products, search, filter]);

  const toggle = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(p => p.id)));
  };

  const generateForProduct = async (p: ProductRow): Promise<FaqItem[]> => {
    const { data, error } = await supabase.functions.invoke('generate-product-faqs', {
      body: {
        product: {
          name: p.name,
          category: p.category?.name,
          price: p.price,
          description: p.description,
          short_description: p.short_description,
          delivery_time: p.delivery_time,
        },
        count,
        language,
        storeName: language === 'bn' ? 'Shahed Store' : 'Shahed Store',
      },
    });
    if (error) throw new Error(error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    return sanitizeFaqs(((data as any)?.faqs || []) as FaqItem[], language);
  };

  const saveFaqs = async (productId: string, faqs: FaqItem[], merge: 'replace' | 'append') => {
    let finalFaqs = sanitizeFaqs(faqs, language);
    if (merge === 'append') {
      const existing = products.find(p => p.id === productId)?.faq || [];
      finalFaqs = [...(existing as FaqItem[]), ...faqs];
    }
    const { error } = await supabase.from('products').update({ faq: finalFaqs as any }).eq('id', productId);
    if (error) throw new Error(error.message);
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, faq: finalFaqs } : p));
  };

  const handleSingle = async (p: ProductRow) => {
    setPreviewProduct(p);
    setPreviewFaqs([]);
    setPreviewLoading(true);
    try {
      const faqs = await generateForProduct(p);
      setPreviewFaqs(faqs);
    } catch (e: any) {
      toast.error(e.message || 'Generation failed');
      setPreviewProduct(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePreviewSave = async () => {
    if (!previewProduct) return;
    setPreviewSaving(true);
    try {
      await saveFaqs(previewProduct.id, previewFaqs, mode);
      toast.success('FAQ saved successfully!');
      setPreviewProduct(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPreviewSaving(false);
    }
  };

  const handleBulk = async () => {
    if (selected.size === 0) { toast.error('Select at least one product'); return; }
    if (!confirm(`Generate FAQs for ${selected.size} products? This will ${mode === 'replace' ? 'REPLACE' : 'APPEND TO'} existing FAQs.`)) return;
    setBulkRunning(true);
    setBulkProgress({ done: 0, total: selected.size });
    let success = 0, failed = 0;
    const list = filtered.filter(p => selected.has(p.id));
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      try {
        const faqs = await generateForProduct(p);
        await saveFaqs(p.id, faqs, mode);
        success++;
      } catch (e: any) {
        console.error(p.name, e);
        failed++;
      }
      setBulkProgress({ done: i + 1, total: list.length });
      await new Promise(r => setTimeout(r, 800)); // avoid rate limit
    }
    setBulkRunning(false);
    setSelected(new Set());
    toast.success(`Done! ${success} succeeded, ${failed} failed.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            <Sparkles className="text-primary" size={24} />
            AI <span className="gradient-text">FAQ Generator</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Automatically generate professional, Google-ranking-friendly FAQs for every product using AI.
          </p>
        </div>
      </div>

      {/* Settings */}
      <div className="glass-card rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2"><Hash size={12} /> FAQ Count</label>
          <input type="number" min={3} max={15} value={count} onChange={e => setCount(Math.max(3, Math.min(15, Number(e.target.value) || 8)))}
            className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-border text-foreground text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2"><Languages size={12} /> Language</label>
          <select value={language} onChange={e => setLanguage(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-border text-foreground text-sm">
            <option value="bn">Bengali (বাংলা)</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">Mode</label>
          <div className="flex gap-2">
            <button onClick={() => setMode('replace')} className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold border ${mode === 'replace' ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-muted/30 border-border text-muted-foreground'}`}>Replace</button>
            <button onClick={() => setMode('append')} className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold border ${mode === 'append' ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-muted/30 border-border text-muted-foreground'}`}>Append</button>
          </div>
        </div>
        <div className="flex items-end">
          <button onClick={handleBulk} disabled={bulkRunning || selected.size === 0}
            className="w-full py-2.5 rounded-xl font-bold text-sm btn-glow flex items-center justify-center gap-2 disabled:opacity-50">
            {bulkRunning ? <><Loader2 size={14} className="animate-spin" /> {bulkProgress.done}/{bulkProgress.total}</> : <><Sparkles size={14} /> Generate for {selected.size} Selected</>}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted/30 border border-border text-foreground text-sm" />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'missing', 'has'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${filter === f ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-muted/30 border-border text-muted-foreground'}`}>
              {f === 'all' ? 'All' : f === 'missing' ? 'No FAQ' : 'Has FAQ'}
            </button>
          ))}
        </div>
        <button onClick={fetchProducts} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted/30 border border-border text-muted-foreground flex items-center gap-1.5">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-3 border-b border-border bg-muted/10 flex items-center gap-3">
          <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} />
          <span className="text-xs font-semibold text-muted-foreground">
            {selected.size > 0 ? `${selected.size} selected` : `${filtered.length} products`}
          </span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-muted-foreground"><Loader2 className="animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">No products found</div>
        ) : (
          <div className="divide-y divide-border/30 max-h-[600px] overflow-y-auto">
            {filtered.map(p => {
              const has = Array.isArray(p.faq) && p.faq.length > 0;
              return (
                <div key={p.id} className="p-3 flex items-center gap-3 hover:bg-muted/10">
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.category?.name || 'Uncategorized'} · ৳{p.price}</div>
                  </div>
                  {has ? (
                    <span className="text-xs font-semibold text-green-400 flex items-center gap-1 px-2 py-1 rounded-lg bg-green-400/10">
                      <CheckCircle2 size={11} /> {p.faq!.length} FAQs
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-yellow-400 flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-400/10">
                      <HelpCircle size={11} /> No FAQ
                    </span>
                  )}
                  <button onClick={() => handleSingle(p)} disabled={previewLoading}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 flex items-center gap-1.5 disabled:opacity-50">
                    <Sparkles size={11} /> Generate
                  </button>
                  {has && (
                    <button onClick={() => { setPreviewProduct(p); setPreviewFaqs(p.faq as FaqItem[]); }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-muted/30 text-muted-foreground border border-border flex items-center gap-1.5">
                      <Eye size={11} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => !previewSaving && setPreviewProduct(null)}>
          <div onClick={e => e.stopPropagation()} className="glass-card rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-border flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">FAQs for</div>
                <div className="font-bold text-foreground truncate">{previewProduct.name}</div>
              </div>
              <button onClick={() => !previewSaving && setPreviewProduct(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {previewLoading ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Loader2 className="animate-spin mx-auto mb-2" />
                  <div className="text-sm">AI is generating FAQs...</div>
                </div>
              ) : previewFaqs.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">No FAQs</div>
              ) : (
                previewFaqs.map((f, i) => (
                  <div key={i} className="bg-muted/20 rounded-xl p-3 space-y-2">
                    <div className="flex gap-2 items-start">
                      <span className="text-xs font-bold text-primary mt-1">Q{i + 1}.</span>
                      <input value={f.q} onChange={e => setPreviewFaqs(prev => prev.map((x, j) => j === i ? { ...x, q: e.target.value } : x))}
                        className="flex-1 bg-transparent text-sm font-semibold text-foreground outline-none border-b border-border/50 pb-1" />
                      <button onClick={() => setPreviewFaqs(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><X size={13} /></button>
                    </div>
                    <textarea value={f.a} onChange={e => setPreviewFaqs(prev => prev.map((x, j) => j === i ? { ...x, a: e.target.value } : x))}
                      rows={3} className="w-full bg-transparent text-xs text-muted-foreground outline-none resize-none" />
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-border flex items-center gap-2 flex-wrap">
              <button onClick={() => handleSingle(previewProduct)} disabled={previewLoading || previewSaving}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-muted/30 border border-border text-muted-foreground flex items-center gap-1.5 disabled:opacity-50">
                <RefreshCw size={12} /> Regenerate
              </button>
              <div className="flex-1" />
              <span className="text-xs text-muted-foreground">{previewFaqs.length} FAQs · {mode}</span>
              <button onClick={handlePreviewSave} disabled={previewLoading || previewSaving || previewFaqs.length === 0}
                className="px-4 py-2 rounded-xl text-xs font-bold btn-glow flex items-center gap-1.5 disabled:opacity-50">
                {previewSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Save to Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAiFaqGenerator;
