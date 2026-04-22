import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PackageSearch, Save, Check, Search, ExternalLink, Wand2, Loader2, Zap, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const AdminProductSeo = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [edits, setEdits] = useState<Record<string, { seo_title: string; seo_description: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [aiGenerating, setAiGenerating] = useState<string | null>(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const bulkCancelRef = useRef(false);

  useEffect(() => {
    supabase.from('products')
      .select('id, name, slug, seo_title, seo_description, price, category:category_id(name), status')
      .order('name')
      .then(({ data }) => {
        setProducts(data || []);
        setLoading(false);
      });
  }, []);

  const get = (id: string, field: 'seo_title' | 'seo_description') =>
    edits[id]?.[field] ?? (products.find(p => p.id === id)?.[field] || '');

  const set = (id: string, field: 'seo_title' | 'seo_description', value: string) =>
    setEdits(prev => ({
      ...prev,
      [id]: { ...prev[id], seo_title: get(id, 'seo_title'), seo_description: get(id, 'seo_description'), [field]: value }
    }));

  const save = async (product: any) => {
    setSaving(product.id);
    const seoTitle = get(product.id, 'seo_title');
    const seoDesc = get(product.id, 'seo_description');
    await supabase.from('products').update({ seo_title: seoTitle, seo_description: seoDesc }).eq('id', product.id);
    // update local state too
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, seo_title: seoTitle, seo_description: seoDesc } : p));
    setSaving(null);
    setSaved(product.id);
    setTimeout(() => setSaved(null), 2000);
    toast.success(`"${product.name}" SEO সেভ হয়েছে`);
  };

  const saveAll = async () => {
    const ids = Object.keys(edits);
    if (ids.length === 0) { toast.info('কোনো পরিবর্তন নেই'); return; }
    setSaving('all');
    for (const id of ids) {
      await supabase.from('products').update({ seo_title: get(id, 'seo_title'), seo_description: get(id, 'seo_description') }).eq('id', id);
    }
    setProducts(prev => prev.map(p => edits[p.id] ? { ...p, seo_title: get(p.id, 'seo_title'), seo_description: get(p.id, 'seo_description') } : p));
    setSaving(null);
    setEdits({});
    toast.success(`${ids.length}টি প্রোডাক্টের SEO সেভ হয়েছে`);
  };

  // AI generate SEO for a single product
  const aiGenerate = async (product: any) => {
    setAiGenerating(product.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/generate-product-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: 'seo',
          productName: product.name,
          category: product.category?.name || '',
          price: product.price,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const result = json.result;
      if (result?.seo_title) {
        setEdits(prev => ({
          ...prev,
          [product.id]: {
            seo_title: result.seo_title.substring(0, 60),
            seo_description: (result.seo_description || '').substring(0, 160),
          }
        }));
        toast.success(`"${product.name}" এর AI SEO তৈরি হয়েছে`);
      }
    } catch (err: any) {
      toast.error(`AI error: ${err.message}`);
    }
    setAiGenerating(null);
  };

  // Bulk AI generate for all missing SEO products
  const bulkAiGenerate = async (onlyMissing = true) => {
    const targets = onlyMissing
      ? products.filter(p => !p.seo_title && !p.seo_description && p.status === 'active')
      : products.filter(p => p.status === 'active');

    if (targets.length === 0) {
      toast.info(onlyMissing ? 'সব প্রোডাক্টে SEO আছে!' : 'কোনো active প্রোডাক্ট নেই');
      return;
    }

    bulkCancelRef.current = false;
    setBulkGenerating(true);
    setBulkProgress({ done: 0, total: targets.length });

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

    let done = 0;
    for (const product of targets) {
      if (bulkCancelRef.current) break;
      try {
        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/generate-product-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            type: 'seo',
            productName: product.name,
            category: product.category?.name || '',
            price: product.price,
          }),
        });
        const json = await res.json();
        if (!json.error && json.result?.seo_title) {
          const newTitle = json.result.seo_title.substring(0, 60);
          const newDesc = (json.result.seo_description || '').substring(0, 160);
          // Save to DB immediately
          await supabase.from('products').update({ seo_title: newTitle, seo_description: newDesc }).eq('id', product.id);
          setProducts(prev => prev.map(p => p.id === product.id ? { ...p, seo_title: newTitle, seo_description: newDesc } : p));
        }
      } catch { /* skip failed */ }
      done++;
      setBulkProgress({ done, total: targets.length });
      // Rate limiting — 1s delay between requests
      await new Promise(r => setTimeout(r, 1000));
    }

    setBulkGenerating(false);
    if (!bulkCancelRef.current) {
      toast.success(`${done}টি প্রোডাক্টের AI SEO সম্পন্ন হয়েছে!`);
    } else {
      toast.info(`বন্ধ করা হয়েছে — ${done}টি প্রোডাক্ট সম্পন্ন`);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );
  const withSeo = products.filter(p => p.seo_title || p.seo_description).length;
  const missing = products.length - withSeo;
  const pendingEdits = Object.keys(edits).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Product <span className="gradient-text">SEO</span>
          </h1>
          <p className="text-muted-foreground text-sm">বাংলাদেশ Google-এ #1 র‌্যাংক করার জন্য AI SEO অটো-জেনারেট করুন</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="glass-card px-3 py-2 rounded-xl text-xs flex items-center gap-2">
            <span className="text-green-400 font-bold">{withSeo}</span>
            <span className="text-muted-foreground">configured</span>
            {missing > 0 && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-red-400 font-bold">{missing}</span>
                <span className="text-muted-foreground">missing</span>
              </>
            )}
          </div>
          {pendingEdits > 0 && (
            <button onClick={saveAll} disabled={saving === 'all'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors">
              {saving === 'all' ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              সব সেভ করুন ({pendingEdits})
            </button>
          )}
        </div>
      </div>

      {/* AI Bulk Generation Panel */}
      <div className="glass-card rounded-2xl p-4 border border-primary/20">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wand2 size={16} className="text-primary" />
              <h3 className="font-semibold text-sm text-foreground">AI বাল্ক SEO জেনারেটর</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">Bangladesh Optimized</span>
            </div>
            <p className="text-xs text-muted-foreground">
              AI স্বয়ংক্রিয়ভাবে প্রতিটি প্রোডাক্টের জন্য বাংলাদেশ-কেন্দ্রিক SEO Title ও Meta Description তৈরি করবে।
              Google Bangladesh-এ টপ র‌্যাংকিং-এর জন্য keyword-rich বাংলা+ইংরেজি মিক্স ব্যবহার করা হয়।
            </p>
            {bulkGenerating && (
              <div className="mt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Loader2 size={11} className="animate-spin text-primary" />
                  <span>প্রক্রিয়াকরণ হচ্ছে... {bulkProgress.done}/{bulkProgress.total}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${bulkProgress.total > 0 ? (bulkProgress.done / bulkProgress.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {bulkGenerating ? (
              <button
                onClick={() => { bulkCancelRef.current = true; }}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
              >
                বন্ধ করুন
              </button>
            ) : (
              <>
                {missing > 0 && (
                  <button
                    onClick={() => bulkAiGenerate(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium btn-glow"
                  >
                    <Zap size={12} />
                    Missing ({missing}) জেনারেট
                  </button>
                )}
                <button
                  onClick={() => bulkAiGenerate(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
                >
                  <Wand2 size={12} />
                  সব রিজেনারেট
                </button>
              </>
            )}
          </div>
        </div>
        {/* SEO tips */}
        <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { icon: '🇧🇩', tip: 'বাংলাদেশ + শহর কীওয়ার্ড ব্যবহার (ঢাকা, চট্টগ্রাম)' },
            { icon: '💰', tip: 'BDT মূল্য ও "কিনুন" intent কীওয়ার্ড' },
            { icon: '✅', tip: '"genuine/original/অরিজিনাল" trust signal' },
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <span>{t.icon}</span>
              <span>{t.tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="প্রোডাক্ট নাম বা slug দিয়ে খুঁজুন…"
          className="w-full bg-background border border-border rounded-xl pl-11 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Product list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 glass-card rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const titleVal = get(p.id, 'seo_title');
            const descVal = get(p.id, 'seo_description');
            const titleLen = titleVal.length;
            const descLen = descVal.length;
            const isSaved = saved === p.id;
            const hasSeo = titleVal || descVal;
            const isEdited = !!edits[p.id];
            const isAiGen = aiGenerating === p.id;

            return (
              <div key={p.id} className={`glass-card rounded-2xl p-5 transition-all ${isEdited ? 'border border-primary/30' : ''}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm text-foreground truncate">{p.name}</h3>
                      {!hasSeo && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-medium flex items-center gap-0.5">
                          <AlertCircle size={9} /> Missing SEO
                        </span>
                      )}
                      {isEdited && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">Edited</span>}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${p.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-muted text-muted-foreground'}`}>{p.status}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <a href={`/product/${p.slug}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-mono text-muted-foreground hover:text-primary flex items-center gap-1 w-fit">
                        /product/{p.slug} <ExternalLink size={10} />
                      </a>
                      {p.price > 0 && <span className="text-xs text-muted-foreground">৳{p.price.toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => aiGenerate(p)}
                      disabled={isAiGen || !!aiGenerating || bulkGenerating}
                      title="AI দিয়ে SEO তৈরি করুন"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 disabled:opacity-50 transition-colors"
                    >
                      {isAiGen ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
                      AI
                    </button>
                    <button
                      onClick={() => save(p)}
                      disabled={saving === p.id}
                      className="flex-shrink-0 btn-glow px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {isSaved ? <Check size={12} /> : saving === p.id ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={12} />}
                      {isSaved ? 'Saved!' : 'Save'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs text-muted-foreground">SEO Title (বাংলাদেশ Google)</label>
                      <span className={`text-[10px] font-mono ${titleLen > 60 ? 'text-red-400' : titleLen > 50 ? 'text-yellow-400' : titleLen > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
                        {titleLen}/60
                      </span>
                    </div>
                    <input
                      value={titleVal}
                      onChange={e => set(p.id, 'seo_title', e.target.value)}
                      placeholder={`${p.name} কিনুন | সেরা দাম | Shahed Store`}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                    {titleLen > 0 && titleLen <= 60 && (
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">
                        🔍 Google preview: {titleVal}
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs text-muted-foreground">Meta Description</label>
                      <span className={`text-[10px] font-mono ${descLen > 160 ? 'text-red-400' : descLen > 140 ? 'text-yellow-400' : descLen > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
                        {descLen}/160
                      </span>
                    </div>
                    <textarea
                      value={descVal}
                      onChange={e => set(p.id, 'seo_description', e.target.value)}
                      placeholder="বাংলা-ইংরেজি মিক্স, BDT মূল্য, 'বাংলাদেশ' ও 'genuine' কীওয়ার্ড সহ…"
                      rows={2}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground text-sm">
              কোনো প্রোডাক্ট পাওয়া যায়নি
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminProductSeo;
