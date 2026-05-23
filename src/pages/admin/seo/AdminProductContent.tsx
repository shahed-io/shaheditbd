import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  FileText, Wand2, Loader2, Zap, AlertCircle, Search,
  CheckCircle2, ExternalLink, RefreshCw, Eye, X,
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

// Bengali descriptions are denser than English — 400 words is solid SEO depth
const MIN_WORDS = 400;
const MIN_FAQ = 3;

function wordCount(text: string | null | undefined): number {
  if (!text) return 0;
  // Strip markdown/HTML noise so symbols don't inflate count
  const clean = text.replace(/<[^>]+>/g, ' ').replace(/[#*_`>|\-]+/g, ' ');
  return clean.trim().split(/\s+/).filter(Boolean).length;
}

// Detect FAQs either in the dedicated `faq` JSON column OR embedded in the description
// (Bengali product pages often store Q&A inline as "প্রশ্ন:" / "## FAQ" markdown).
function faqCount(faq: any, description?: string | null): number {
  if (Array.isArray(faq) && faq.length > 0) return faq.length;
  if (!description) return 0;
  const d = description;
  const bnQ = (d.match(/প্রশ্ন\s*[:?]/g) || []).length;
  if (bnQ > 0) return bnQ;
  const enQ = (d.match(/\bQ\s*\d*\s*[:.]/g) || []).length;
  if (enQ > 0) return enQ;
  // FAQ-style heading + bullet questions ending with ?
  if (/##\s*(FAQ|প্রায়শই|Frequently)/i.test(d)) {
    const qs = (d.match(/\?/g) || []).length;
    return qs;
  }
  return 0;
}

const AdminProductContent = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'thin' | 'ok'>('thin');
  const [generating, setGenerating] = useState<string | null>(null);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, failed: 0 });
  const bulkCancelRef = useRef(false);
  const [preview, setPreview] = useState<Product | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, description, faq, status, brand, product_type, category:category_id(name)')
      .order('name');
    setProducts((data as any) || []);
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
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/generate-product-content`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            type: 'rich_content',
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

      const description: string = json.description || json.result?.description || '';
      const faq: any[] = json.faq || json.result?.faq || [];

      if (!description || wordCount(description) < 400) {
        throw new Error('AI returned too-short content; retry shortly.');
      }

      const updatePayload: any = { description };
      if (Array.isArray(faq) && faq.length > 0) updatePayload.faq = faq;

      const { error } = await supabase.from('products').update(updatePayload).eq('id', product.id);
      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, description, faq: updatePayload.faq ?? p.faq } : p)),
      );
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

  const handleBulk = async (onlyThin: boolean) => {
    const targets = products.filter((p) => (onlyThin ? wordCount(p.description) < MIN_WORDS : true));
    if (targets.length === 0) { toast.info('No products to enrich'); return; }
    if (!confirm(`Enrich ${targets.length} product${targets.length === 1 ? '' : 's'} with AI? This may take ${Math.ceil(targets.length * 8 / 60)} minutes.`)) return;

    bulkCancelRef.current = false;
    setBulkRunning(true);
    setBulkProgress({ done: 0, total: targets.length, failed: 0 });

    let failed = 0;
    for (let i = 0; i < targets.length; i++) {
      if (bulkCancelRef.current) break;
      const ok = await generateOne(targets[i]);
      if (!ok) failed++;
      setBulkProgress({ done: i + 1, total: targets.length, failed });
      // Soft rate-limit between calls
      if (i < targets.length - 1) await new Promise((r) => setTimeout(r, 1200));
    }

    setBulkRunning(false);
    toast.success(`Done: ${targets.length - failed} enriched${failed ? `, ${failed} failed` : ''}`);
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
            Bulk-generate {MIN_WORDS}–1500 word SEO-rich descriptions with Features, Benefits, Usage Guide, FAQ, Comparison & Who Should Buy sections.
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
        <StatCard label="Thin Content (<700w)" value={stats.thin} tone="warn" />
        <StatCard label="Missing FAQ (<4)" value={stats.noFaq} tone="warn" />
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
          <span>Each enrichment overwrites the product's <code>description</code> and <code>faq</code> with AI-generated SEO content. Bulk processing pauses 1.2s between calls to respect rate limits.</span>
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
