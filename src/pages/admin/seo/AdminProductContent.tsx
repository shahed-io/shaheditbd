import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  FileText, Wand2, Loader2, Zap, AlertCircle, Search,
  CheckCircle2, ExternalLink, RefreshCw, Eye, X, Undo2, HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string | null;
  faq: any;
  status: string;
  category?: { name: string } | null;
  brand?: string | null;
  product_type?: string | null;
};

const MIN_WORDS = 700;
const MIN_FAQ = 4;

function wordCount(text: string | null | undefined): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function faqCount(faq: any, _description?: string | null): number {
  if (Array.isArray(faq)) return faq.length;
  return 0;
}

const AdminProductContent = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'thin' | 'ok'>('thin');
  const [generating, setGenerating] = useState<string | null>(null);
  const [faqGenerating, setFaqGenerating] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkMode, setBulkMode] = useState<'description' | 'faq' | 'restore' | null>(null);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, failed: 0 });
  const bulkCancelRef = useRef(false);
  const [preview, setPreview] = useState<Product | null>(null);
  const [backupMap, setBackupMap] = useState<Record<string, number>>({}); // product_id -> backup count

  const load = async () => {
    setLoading(true);
    const [{ data: prods }, { data: backups }] = await Promise.all([
      supabase
        .from('products')
        .select('id, name, slug, price, description, faq, status, brand, product_type, category:category_id(name)')
        .order('name'),
      supabase.from('product_content_backups').select('product_id'),
    ]);
    setProducts((prods as any) || []);
    const counts: Record<string, number> = {};
    (backups || []).forEach((b: any) => { counts[b.product_id] = (counts[b.product_id] || 0) + 1; });
    setBackupMap(counts);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const wc = wordCount(p.description);
      const isThin = wc < MIN_WORDS;
      if (filter === 'thin' && !isThin) return false;
      if (filter === 'ok' && isThin) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.slug.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, filter, search]);

  const stats = useMemo(() => {
    const total = products.length;
    const thin = products.filter((p) => wordCount(p.description) < MIN_WORDS).length;
    const noFaq = products.filter((p) => faqCount(p.faq, p.description) < MIN_FAQ).length;
    return { total, thin, noFaq, ok: total - thin };
  }, [products]);

  const generateOne = async (product: Product): Promise<boolean> => {
    setGenerating(product.id);
    try {
      // 1) Backup current description + faq FIRST
      const { error: bkErr } = await supabase.from('product_content_backups').insert({
        product_id: product.id,
        description: product.description,
        faq: product.faq,
      });
      if (bkErr) throw new Error('Backup failed: ' + bkErr.message);

      // 2) Call AI with the SAME `type: "description"` that AdminProducts uses
      //    → produces the standard 9-section markdown matching existing products
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/generate-product-content`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            type: 'description',
            productName: product.name,
            category: product.category?.name || '',
            brand: product.brand || '',
            productType: product.product_type || 'Digital',
            price: product.price,
          }),
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      const description: string = (typeof json.result === 'string' ? json.result : json.result?.description) || '';
      if (!description || wordCount(description) < 300) {
        throw new Error('AI returned too-short content; retry shortly.');
      }

      // 3) Update ONLY description (preserve existing FAQ — matches the existing system)
      const { error } = await supabase.from('products').update({ description }).eq('id', product.id);
      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, description } : p)),
      );
      setBackupMap((prev) => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }));
      return true;
    } catch (err: any) {
      toast.error(`"${product.name}": ${err.message || 'AI error'}`);
      return false;
    } finally {
      setGenerating(null);
    }
  };

  const handleSingle = async (product: Product) => {
    const ok = await generateOne(product);
    if (ok) toast.success(`"${product.name}" enriched ✓`);
  };

  const restoreOne = async (product: Product): Promise<boolean> => {
    setRestoring(product.id);
    try {
      const { data: bk, error: bkErr } = await supabase
        .from('product_content_backups')
        .select('id, description, faq')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (bkErr) throw bkErr;
      if (!bk) throw new Error('No backup found');

      const { error } = await supabase
        .from('products')
        .update({ description: bk.description, faq: bk.faq })
        .eq('id', product.id);
      if (error) throw error;

      // consume the backup we just restored
      await supabase.from('product_content_backups').delete().eq('id', bk.id);

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, description: bk.description, faq: bk.faq } : p)),
      );
      setBackupMap((prev) => {
        const next = { ...prev };
        const c = (next[product.id] || 1) - 1;
        if (c <= 0) delete next[product.id]; else next[product.id] = c;
        return next;
      });
      return true;
    } catch (err: any) {
      toast.error(`Restore failed for "${product.name}": ${err.message}`);
      return false;
    } finally {
      setRestoring(null);
    }
  };

  const handleRestoreSingle = async (product: Product) => {
    if (!confirm(`Restore previous description for "${product.name}"? Current AI-generated content will be replaced with the last backup.`)) return;
    const ok = await restoreOne(product);
    if (ok) toast.success(`"${product.name}" restored ✓`);
  };

  const generateFaqOne = async (product: Product): Promise<boolean> => {
    setFaqGenerating(product.id);
    try {
      // 1) Backup current description + faq FIRST (so Restore reverts both)
      const { error: bkErr } = await supabase.from('product_content_backups').insert({
        product_id: product.id,
        description: product.description,
        faq: product.faq,
      });
      if (bkErr) throw new Error('Backup failed: ' + bkErr.message);

      // 2) Call AI with type "faq" — uses the existing description as the source of truth
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/generate-product-content`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            type: 'faq',
            productName: product.name,
            category: product.category?.name || '',
            brand: product.brand || '',
            productType: product.product_type || 'Digital',
            price: product.price,
            demoDescription: product.description || '',
          }),
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      const result = json.result;
      const faqArr: Array<{ q: string; a: string }> = Array.isArray(result?.faq) ? result.faq : [];
      if (faqArr.length < 4) throw new Error('AI returned too few FAQ items; retry shortly.');

      // 3) Update ONLY faq column (preserve description)
      const { error } = await supabase.from('products').update({ faq: faqArr }).eq('id', product.id);
      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, faq: faqArr } : p)),
      );
      setBackupMap((prev) => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }));
      return true;
    } catch (err: any) {
      toast.error(`FAQ "${product.name}": ${err.message || 'AI error'}`);
      return false;
    } finally {
      setFaqGenerating(null);
    }
  };

  const handleSingleFaq = async (product: Product) => {
    const ok = await generateFaqOne(product);
    if (ok) toast.success(`"${product.name}" FAQ generated ✓`);
  };


  const handleBulk = async (onlyThin: boolean) => {
    const targets = products.filter((p) => (onlyThin ? wordCount(p.description) < MIN_WORDS : true));
    if (targets.length === 0) { toast.info('No products to enrich'); return; }
    if (!confirm(`Enrich ${targets.length} product${targets.length === 1 ? '' : 's'} with AI? Previous descriptions will be backed up. ETA ~${Math.ceil(targets.length * 8 / 60)} min.`)) return;

    bulkCancelRef.current = false;
    setBulkRunning(true);
    setBulkProgress({ done: 0, total: targets.length, failed: 0 });

    let failed = 0;
    for (let i = 0; i < targets.length; i++) {
      if (bulkCancelRef.current) break;
      const ok = await generateOne(targets[i]);
      if (!ok) failed++;
      setBulkProgress({ done: i + 1, total: targets.length, failed });
      if (i < targets.length - 1) await new Promise((r) => setTimeout(r, 1200));
    }

    setBulkRunning(false);
    toast.success(`Done: ${targets.length - failed} enriched${failed ? `, ${failed} failed` : ''}`);
  };

  const handleBulkRestore = async () => {
    const targets = products.filter((p) => (backupMap[p.id] || 0) > 0);
    if (targets.length === 0) { toast.info('No backups to restore'); return; }
    if (!confirm(`Restore previous descriptions for ${targets.length} product${targets.length === 1 ? '' : 's'}? Current AI-generated content will be reverted to the last backup.`)) return;

    bulkCancelRef.current = false;
    setBulkRunning(true);
    setBulkProgress({ done: 0, total: targets.length, failed: 0 });
    let failed = 0;
    for (let i = 0; i < targets.length; i++) {
      if (bulkCancelRef.current) break;
      const ok = await restoreOne(targets[i]);
      if (!ok) failed++;
      setBulkProgress({ done: i + 1, total: targets.length, failed });
    }
    setBulkRunning(false);
    toast.success(`Restored: ${targets.length - failed}${failed ? `, ${failed} failed` : ''}`);
  };

  const handleBulkFaq = async (onlyMissing: boolean) => {
    const targets = products.filter((p) => (onlyMissing ? faqCount(p.faq) < MIN_FAQ : true));
    if (targets.length === 0) { toast.info('No products need FAQ generation'); return; }
    if (!confirm(`Generate FAQ for ${targets.length} product${targets.length === 1 ? '' : 's'} using AI? The AI will read each product's existing description and create accurate FAQs. Previous FAQ will be backed up. ETA ~${Math.ceil(targets.length * 6 / 60)} min.`)) return;

    bulkCancelRef.current = false;
    setBulkRunning(true);
    setBulkProgress({ done: 0, total: targets.length, failed: 0 });

    let failed = 0;
    for (let i = 0; i < targets.length; i++) {
      if (bulkCancelRef.current) break;
      const ok = await generateFaqOne(targets[i]);
      if (!ok) failed++;
      setBulkProgress({ done: i + 1, total: targets.length, failed });
      if (i < targets.length - 1) await new Promise((r) => setTimeout(r, 1000));
    }

    setBulkRunning(false);
    toast.success(`FAQ done: ${targets.length - failed} generated${failed ? `, ${failed} failed` : ''}`);
  };



  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <FileText className="text-primary" /> Product Content Enrichment
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generates descriptions using the SAME 9-section format as the main Product editor. Each run backs up the previous description, so you can Restore anytime.
          </p>
        </div>
        <button
          onClick={load}
          className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-accent flex items-center gap-2 text-sm"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Products" value={stats.total} />
        <StatCard label={`Thin Content (<${MIN_WORDS}w)`} value={stats.thin} tone="warn" />
        <StatCard label={`Missing FAQ (<${MIN_FAQ})`} value={stats.noFaq} tone="warn" />
        <StatCard label="SEO-Ready" value={stats.ok} tone="ok" />
      </div>

      {/* Bulk actions */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={bulkRunning || stats.thin === 0}
            onClick={() => handleBulk(true)}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <Zap size={16} /> Enrich All Thin Products ({stats.thin})
          </button>
          <button
            disabled={bulkRunning}
            onClick={() => handleBulk(false)}
            className="px-4 py-2 rounded-lg border border-border hover:bg-accent flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Wand2 size={14} /> Regenerate ALL ({stats.total})
          </button>
          <button
            disabled={bulkRunning || Object.keys(backupMap).length === 0}
            onClick={handleBulkRestore}
            className="px-4 py-2 rounded-lg border border-amber-500/40 text-amber-600 hover:bg-amber-500/10 flex items-center gap-2 text-sm disabled:opacity-50"
            title="Restore previous descriptions from latest backup"
          >
            <Undo2 size={14} /> Restore All ({Object.keys(backupMap).length})
          </button>
          {bulkRunning && (
            <button
              onClick={() => { bulkCancelRef.current = true; }}
              className="px-3 py-2 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 flex items-center gap-2 text-sm"
            >
              <X size={14} /> Cancel
            </button>
          )}
        </div>
        {bulkRunning && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Processing {bulkProgress.done} / {bulkProgress.total}</span>
              {bulkProgress.failed > 0 && <span className="text-destructive">{bulkProgress.failed} failed</span>}
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(bulkProgress.done / Math.max(1, bulkProgress.total)) * 100}%` }}
              />
            </div>
          </div>
        )}
        <div className="text-xs text-muted-foreground flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>Each enrichment automatically <strong>backs up</strong> the product's current <code>description</code> before overwriting. Use the amber <Undo2 className="inline" size={11}/> Restore button to revert. FAQ is preserved untouched.</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name or slug…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
        </div>
        {(['thin', 'ok', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-lg text-sm border ${
              filter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card hover:bg-accent'
            }`}
          >
            {f === 'thin' ? `Thin (${stats.thin})` : f === 'ok' ? `Ready (${stats.ok})` : `All (${stats.total})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3 font-semibold">Product</th>
                <th className="p-3 font-semibold text-right">Words</th>
                <th className="p-3 font-semibold text-right">FAQs</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">
                  <Loader2 className="animate-spin inline mr-2" size={16} /> Loading…
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No products match this filter.</td></tr>
              ) : (
                filtered.map((p) => {
                  const wc = wordCount(p.description);
                  const fc = faqCount(p.faq);
                  const isThin = wc < MIN_WORDS;
                  return (
                    <tr key={p.id} className="border-t border-border hover:bg-accent/30">
                      <td className="p-3">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>৳{p.price}</span>
                          {p.category?.name && <span>• {p.category.name}</span>}
                          <a
                            href={`/product/${p.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-0.5"
                          >
                            View <ExternalLink size={10} />
                          </a>
                        </div>
                      </td>
                      <td className={`p-3 text-right tabular-nums font-medium ${isThin ? 'text-destructive' : 'text-emerald-600'}`}>
                        {wc}
                      </td>
                      <td className={`p-3 text-right tabular-nums ${fc < 4 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {fc}
                      </td>
                      <td className="p-3">
                        {isThin ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                            <AlertCircle size={11} /> Thin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                            <CheckCircle2 size={11} /> Ready
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex gap-1">
                          {p.description && (
                            <button
                              onClick={() => setPreview(p)}
                              className="p-2 rounded-lg border border-border hover:bg-accent"
                              title="Preview"
                            >
                              <Eye size={14} />
                            </button>
                          )}
                          {(backupMap[p.id] || 0) > 0 && (
                            <button
                              disabled={restoring === p.id || bulkRunning}
                              onClick={() => handleRestoreSingle(p)}
                              className="p-2 rounded-lg border border-amber-500/40 text-amber-600 hover:bg-amber-500/10 disabled:opacity-50"
                              title={`Restore previous (${backupMap[p.id]} backup${backupMap[p.id] > 1 ? 's' : ''})`}
                            >
                              {restoring === p.id ? <Loader2 className="animate-spin" size={14} /> : <Undo2 size={14} />}
                            </button>
                          )}
                          <button
                            disabled={generating === p.id || bulkRunning}
                            onClick={() => handleSingle(p)}
                            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                          >
                            {generating === p.id ? <Loader2 className="animate-spin" size={12} /> : <Wand2 size={12} />}
                            {isThin ? 'Enrich' : 'Regenerate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div
            className="bg-card rounded-xl border border-border max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{preview.name}</h3>
                <div className="text-xs text-muted-foreground">
                  {wordCount(preview.description)} words • {faqCount(preview.faq)} FAQs
                </div>
              </div>
              <button onClick={() => setPreview(null)} className="p-1.5 rounded-lg hover:bg-accent">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-xs">{preview.description}</pre>
              {faqCount(preview.faq) > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold">FAQ</h4>
                  <ul className="text-xs">
                    {(preview.faq as any[]).map((f, i) => (
                      <li key={i}><strong>{f.q}</strong><br />{f.a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, tone }: { label: string; value: number; tone?: 'warn' | 'ok' }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className={`text-2xl font-bold mt-1 ${
      tone === 'warn' ? 'text-destructive' : tone === 'ok' ? 'text-emerald-600' : ''
    }`}>{value}</div>
  </div>
);

export default AdminProductContent;
