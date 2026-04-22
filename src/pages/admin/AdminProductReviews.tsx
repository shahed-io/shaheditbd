import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Star, Check, X, Search, ExternalLink, Trash2, CheckCircle2, Clock, XCircle } from 'lucide-react';

const AdminProductReviews = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => { fetchData(); }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    let q = (supabase as any).from('product_reviews').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setReviews(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await (supabase as any).from('product_reviews').update({ status }).eq('id', id);
    setReviews(p => p.map(r => r.id === id ? { ...r, status } : r));
    toast.success(`রিভিউ ${status === 'approved' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'} হয়েছে!`);
  };

  const remove = async (id: string) => {
    if (!confirm('এই রিভিউ মুছে ফেলবেন?')) return;
    await (supabase as any).from('product_reviews').delete().eq('id', id);
    setReviews(p => p.filter(r => r.id !== id));
    toast.success('রিভিউ মুছে ফেলা হয়েছে!');
  };

  const filtered = reviews.filter(r =>
    r.author_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.product_slug?.toLowerCase().includes(search.toLowerCase()) ||
    r.body?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = { pending: reviews.filter(r => r.status === 'pending').length, approved: reviews.filter(r => r.status === 'approved').length, rejected: reviews.filter(r => r.status === 'rejected').length };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          Product <span className="gradient-text">Reviews</span>
        </h1>
        <p className="text-muted-foreground text-sm">গ্রাহকদের পণ্য রিভিউ মডারেশন</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'অপেক্ষায়', value: stats.pending, icon: Clock, color: 'text-yellow-400' },
          { label: 'অনুমোদিত', value: stats.approved, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'প্রত্যাখ্যাত', value: stats.rejected, icon: XCircle, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-4 text-center">
            <s.icon size={20} className={`${s.color} mx-auto mb-1.5`} />
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="রিভিউ বা প্রোডাক্ট খুঁজুন..."
            className="w-full bg-muted/30 border border-border rounded-xl pl-11 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
        </div>
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${filter === f ? 'btn-glow' : 'glass-card text-muted-foreground hover:text-foreground'}`}>
            {f === 'all' ? 'সব' : f === 'pending' ? 'অপেক্ষায়' : f === 'approved' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? Array.from({length:3}).map((_,i) => <div key={i} className="h-28 glass-card rounded-2xl animate-pulse" />) :
         filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Star size={36} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">কোনো রিভিউ নেই</p>
          </div>
        ) : filtered.map(r => (
          <div key={r.id} className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-foreground">{r.author_name}</span>
                  {r.is_verified && <span className="text-[10px] bg-green-400/15 text-green-400 px-2 py-0.5 rounded-full font-bold">✓ Verified</span>}
                  <span className="text-yellow-400 text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${r.status === 'approved' ? 'bg-green-400/15 text-green-400' : r.status === 'rejected' ? 'bg-red-400/15 text-red-400' : 'bg-yellow-400/15 text-yellow-400'}`}>
                    {r.status === 'approved' ? 'অনুমোদিত' : r.status === 'rejected' ? 'প্রত্যাখ্যাত' : 'অপেক্ষায়'}
                  </span>
                </div>
                <a href={`/product/${r.product_slug}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1">
                  {r.product_slug} <ExternalLink size={10} />
                </a>
                {r.title && <div className="text-sm font-semibold text-foreground">{r.title}</div>}
                <p className="text-sm text-muted-foreground line-clamp-3">{r.body}</p>
                <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('bn-BD')}</div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {r.status !== 'approved' && (
                  <button onClick={() => updateStatus(r.id, 'approved')}
                    className="p-2 rounded-xl bg-green-400/15 text-green-400 hover:bg-green-400/25 transition-colors" title="অনুমোদন করুন">
                    <Check size={15} />
                  </button>
                )}
                {r.status !== 'rejected' && (
                  <button onClick={() => updateStatus(r.id, 'rejected')}
                    className="p-2 rounded-xl bg-red-400/15 text-red-400 hover:bg-red-400/25 transition-colors" title="প্রত্যাখ্যান করুন">
                    <X size={15} />
                  </button>
                )}
                <button onClick={() => remove(r.id)} className="p-2 rounded-xl text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminProductReviews;
