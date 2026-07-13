import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Search, Download, Loader2, Save, Check, X, ExternalLink, Package, Link2, CheckCircle2, AlertCircle
} from 'lucide-react';

interface ProductRow {
  id: string;
  name: string;
  image_url: string | null;
  download_link: string | null;
  status: string | null;
}

const AdminSoftwareDownloads = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'with' | 'without'>('all');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, name, image_url, download_link, status')
      .order('name');
    if (error) toast.error('লোড ব্যর্থ: ' + error.message);
    setProducts((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(p => {
      if (filter === 'with' && !p.download_link) return false;
      if (filter === 'without' && p.download_link) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q);
    });
  }, [products, search, filter]);

  const stats = useMemo(() => ({
    total: products.length,
    withLink: products.filter(p => !!p.download_link).length,
    withoutLink: products.filter(p => !p.download_link).length,
  }), [products]);

  const currentValue = (p: ProductRow) =>
    draft[p.id] !== undefined ? draft[p.id] : (p.download_link || '');

  const isDirty = (p: ProductRow) =>
    draft[p.id] !== undefined && draft[p.id] !== (p.download_link || '');

  const save = async (p: ProductRow) => {
    const value = (draft[p.id] ?? '').trim();
    setSavingId(p.id);
    const { error } = await supabase
      .from('products')
      .update({ download_link: value || null })
      .eq('id', p.id);
    setSavingId(null);
    if (error) { toast.error('সেভ ব্যর্থ: ' + error.message); return; }
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, download_link: value || null } : x));
    setDraft(d => { const n = { ...d }; delete n[p.id]; return n; });
    toast.success(value ? '✅ ডাউনলোড লিংক সেভ হয়েছে' : '🗑️ লিংক মুছে ফেলা হয়েছে');
  };

  const cancel = (id: string) =>
    setDraft(d => { const n = { ...d }; delete n[id]; return n; });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: 'Sora, sans-serif' }}>
          Software Downloads
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          প্রতিটি প্রোডাক্টের ডাউনলোড লিংক সেট করুন — অর্ডার সম্পন্ন হওয়ার পর customer এর dashboard এ automatic দেখাবে
        </p>
      </div>

      {/* Info banner */}
      <div className="glass-card rounded-2xl p-4 border border-primary/20 flex items-start gap-3"
        style={{ background: 'linear-gradient(135deg, hsla(258,78%,55%,0.06), hsla(200,90%,45%,0.04))' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))' }}>
          <Link2 size={16} className="text-white" />
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-bold text-foreground">কীভাবে কাজ করে:</span> প্রতিটি প্রোডাক্টের জন্য নিচে ডাউনলোড লিংক দিয়ে সেভ করুন।
          যখন কোনো customer সেই প্রোডাক্ট কিনবে এবং অর্ডার <span className="font-semibold text-emerald-600">completed</span> হবে,
          তখন তার dashboard-এর <span className="font-semibold">Downloads</span> tab-এ automatic লিংকটি চলে আসবে।
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'মোট প্রোডাক্ট', value: stats.total, icon: Package, color: 'hsl(258,78%,55%)' },
          { label: 'লিংক সেট আছে', value: stats.withLink, icon: CheckCircle2, color: 'hsl(160,70%,42%)' },
          { label: 'লিংক নেই', value: stats.withoutLink, icon: AlertCircle, color: 'hsl(20,90%,55%)' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${s.color}15` }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <p className="text-lg font-black text-foreground" style={{ fontFamily: 'Sora, sans-serif' }}>{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & filter */}
      <div className="glass-card rounded-2xl p-3 border border-border flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="প্রোডাক্ট নাম দিয়ে খুঁজুন…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-muted/30 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 bg-muted/30 rounded-xl p-1">
          {[
            { k: 'all', label: 'All' },
            { k: 'with', label: 'With Link' },
            { k: 'without', label: 'No Link' },
          ].map(f => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === f.k ? 'text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
              style={filter === f.k ? { background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))' } : {}}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center border border-border">
          <Download size={40} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const dirty = isDirty(p);
            const value = currentValue(p);
            const hasLink = !!p.download_link;
            return (
              <div key={p.id}
                className="glass-card rounded-2xl border border-border p-3 flex flex-col sm:flex-row sm:items-center gap-3 transition-all hover:border-primary/30">
                {/* Image + name */}
                <div className="flex items-center gap-3 sm:w-72 flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-border flex items-center justify-center"
                    style={{ background: 'hsla(258,78%,55%,0.06)' }}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                      : <Package size={18} className="text-muted-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground truncate">{p.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        hasLink ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
                      }`}>
                        {hasLink ? <><CheckCircle2 size={9} /> Link Set</> : <><AlertCircle size={9} /> No Link</>}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Input + actions */}
                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Link2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="url"
                      placeholder="https://example.com/download.exe"
                      value={value}
                      onChange={e => setDraft(d => ({ ...d, [p.id]: e.target.value }))}
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-muted/30 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-fira"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    {hasLink && !dirty && (
                      <a href={p.download_link!} target="_blank" rel="noopener noreferrer"
                        className="p-2 rounded-xl glass-card border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
                        title="Open link">
                        <ExternalLink size={13} />
                      </a>
                    )}
                    {dirty && (
                      <button onClick={() => cancel(p.id)}
                        className="p-2 rounded-xl glass-card border border-border text-muted-foreground hover:text-foreground"
                        title="Cancel">
                        <X size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => save(p)}
                      disabled={!dirty || savingId === p.id}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                      style={{ background: dirty ? 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))' : 'hsl(var(--muted))' }}
                    >
                      {savingId === p.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : dirty ? <Save size={12} /> : <Check size={12} />}
                      {savingId === p.id ? 'Saving' : dirty ? 'Save' : 'Saved'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminSoftwareDownloads;
