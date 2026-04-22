import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Star, Trash2, Eye, EyeOff, Search, Plus, Save, ChevronUp, ChevronDown, X, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: string;
  name: string;
  avatar: string;
  location: string;
  rating: number;
  review: string;
  product: string;
  date: string;
  verified: boolean;
  is_visible: boolean;
}

const EMPTY_REVIEW = (): Review => ({
  id: crypto.randomUUID(),
  name: '',
  avatar: '',
  location: 'Dhaka',
  rating: 5,
  review: '',
  product: '',
  date: new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }),
  verified: true,
  is_visible: true,
});

const Field = ({ label, value, onChange, textarea = false, placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; textarea?: boolean; placeholder?: string;
}) => (
  <div>
    <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
    {textarea ? (
      <textarea value={value} rows={3} placeholder={placeholder} onChange={e => onChange(e.target.value)}
        className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none" />
    ) : (
      <input value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
        className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
    )}
  </div>
);

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReview, setNewReview] = useState<Review>(EMPTY_REVIEW());
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'testimonials_data').maybeSingle().then(({ data }) => {
      try { if (data?.value) setReviews(JSON.parse(data.value)); } catch {}
      setLoading(false);
    });
  }, []);

  const persist = async (list: Review[]) => {
    setSaving(true);
    await supabase.from('site_settings').upsert(
      { key: 'testimonials_data', value: JSON.stringify(list), category: 'seo' },
      { onConflict: 'key' }
    );
    setSaving(false);
    setDirty(false);
    toast.success('পরিবর্তন সেভ হয়েছে!');
  };

  const updateField = (id: string, field: keyof Review, value: unknown) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    setDirty(true);
  };

  const toggle = (id: string) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, is_visible: !r.is_visible } : r));
    setDirty(true);
  };

  const remove = (id: string) => {
    const updated = reviews.filter(r => r.id !== id);
    setReviews(updated);
    if (editing === id) setEditing(null);
    persist(updated);
  };

  const move = (id: string, dir: -1 | 1) => {
    setReviews(prev => {
      const idx = prev.findIndex(r => r.id === id);
      if (idx < 0) return prev;
      const nIdx = idx + dir;
      if (nIdx < 0 || nIdx >= prev.length) return prev;
      const a = [...prev];
      [a[idx], a[nIdx]] = [a[nIdx], a[idx]];
      return a;
    });
    setDirty(true);
  };

  const addReview = () => {
    if (!newReview.name.trim() || !newReview.review.trim()) {
      toast.error('নাম এবং রিভিউ টেক্সট আবশ্যক');
      return;
    }
    // Auto-generate avatar initials if not provided
    const avatar = newReview.avatar.trim() || newReview.name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const updated = [...reviews, { ...newReview, avatar }];
    setReviews(updated);
    persist(updated);
    setNewReview(EMPTY_REVIEW());
    setShowAddForm(false);
  };

  const filtered = reviews.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.review?.toLowerCase().includes(search.toLowerCase()) ||
    r.product?.toLowerCase().includes(search.toLowerCase())
  );

  const visible = reviews.filter(r => r.is_visible !== false).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Review <span className="gradient-text">Manager</span>
          </h1>
          <p className="text-muted-foreground text-sm">হোমপেজের কাস্টমার রিভিউ পরিচালনা করুন</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="glass-card px-4 py-2 rounded-xl text-xs text-muted-foreground">
            {visible} দৃশ্যমান · {reviews.length} মোট
          </div>
          {dirty && (
            <button onClick={() => persist(reviews)} disabled={saving}
              className="btn-glow px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold">
              <Save size={14} /> {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
            </button>
          )}
          <button onClick={() => { setShowAddForm(true); setNewReview(EMPTY_REVIEW()); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold glass-card hover:border-primary/40 text-primary transition-all">
            <Plus size={15} /> নতুন রিভিউ
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border/50">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Plus size={16} className="text-primary" /> নতুন রিভিউ যোগ করুন
            </h3>
            <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground p-1">
              <X size={16} />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="গ্রাহকের নাম *" value={newReview.name} onChange={v => setNewReview(p => ({ ...p, name: v }))} placeholder="যেমন: Rakib Hassan" />
              <Field label="শহর / এলাকা" value={newReview.location} onChange={v => setNewReview(p => ({ ...p, location: v }))} placeholder="যেমন: Dhaka" />
              <Field label="প্রোডাক্ট নাম" value={newReview.product} onChange={v => setNewReview(p => ({ ...p, product: v }))} placeholder="যেমন: Windows 11 Pro" />
              <Field label="তারিখ" value={newReview.date} onChange={v => setNewReview(p => ({ ...p, date: v }))} placeholder="যেমন: ২ দিন আগে" />
              <Field label="অ্যাভাটার ইনিশিয়াল (ঐচ্ছিক)" value={newReview.avatar} onChange={v => setNewReview(p => ({ ...p, avatar: v }))} placeholder="যেমন: RH (খালি রাখলে অটো হবে)" />
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">রেটিং</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setNewReview(p => ({ ...p, rating: n }))}
                      className={`w-9 h-9 rounded-xl text-lg transition-all ${newReview.rating >= n ? 'bg-yellow-400/20 text-yellow-400' : 'glass-card text-muted-foreground'}`}>
                      ★
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Field label="রিভিউ টেক্সট *" value={newReview.review} onChange={v => setNewReview(p => ({ ...p, review: v }))}
              textarea placeholder="গ্রাহকের রিভিউ এখানে লিখুন..." />
            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={newReview.verified} onChange={e => setNewReview(p => ({ ...p, verified: e.target.checked }))}
                  className="rounded" />
                Verified Purchase
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={newReview.is_visible} onChange={e => setNewReview(p => ({ ...p, is_visible: e.target.checked }))}
                  className="rounded" />
                দৃশ্যমান
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-xl text-sm glass-card text-muted-foreground hover:text-foreground">
                বাতিল
              </button>
              <button onClick={addReview} className="btn-glow px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                <Save size={14} /> রিভিউ যোগ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="নাম, রিভিউ বা প্রোডাক্ট দিয়ে খুঁজুন…"
          className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 glass-card rounded-2xl animate-pulse" />)}</div>
      ) : reviews.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Star size={36} className="mx-auto text-muted-foreground mb-3" />
          <h3 className="font-bold text-foreground">কোনো রিভিউ নেই</h3>
          <p className="text-sm text-muted-foreground mt-1">উপরের বোতাম দিয়ে নতুন রিভিউ যোগ করুন।</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r, idx) => (
            <div key={r.id} className={`glass-card rounded-2xl overflow-hidden transition-opacity ${r.is_visible === false ? 'opacity-60' : ''}`}>
              {/* Row header */}
              <div className="flex items-center gap-3 p-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {r.avatar || r.name?.slice(0, 2).toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditing(editing === r.id ? null : r.id)}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground truncate">{r.name || 'Anonymous'}</span>
                    {r.location && <span className="text-xs text-muted-foreground hidden sm:inline">· {r.location}</span>}
                    {r.verified && (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0" title="Verified">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={11} className={i < (r.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'} />
                      ))}
                    </div>
                    {r.product && <span className="text-xs text-muted-foreground truncate">· {r.product}</span>}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setEditing(editing === r.id ? null : r.id)}
                    className={`p-1.5 rounded-lg transition-colors ${editing === r.id ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`} title="এডিট">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => move(r.id, -1)} disabled={idx === 0}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ChevronUp size={13} />
                  </button>
                  <button onClick={() => move(r.id, 1)} disabled={idx === filtered.length - 1}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ChevronDown size={13} />
                  </button>
                  <button onClick={() => toggle(r.id)} title={r.is_visible !== false ? 'লুকান' : 'দেখান'}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors">
                    {r.is_visible !== false ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button onClick={() => remove(r.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Review preview (collapsed) */}
              {editing !== r.id && (
                <div className="px-4 pb-4 -mt-1">
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{r.review}</p>
                </div>
              )}

              {/* Edit form */}
              {editing === r.id && (
                <div className="border-t border-border/50 p-5 space-y-4 bg-muted/10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="গ্রাহকের নাম" value={r.name || ''} onChange={v => updateField(r.id, 'name', v)} />
                    <Field label="শহর / এলাকা" value={r.location || ''} onChange={v => updateField(r.id, 'location', v)} />
                    <Field label="প্রোডাক্ট নাম" value={r.product || ''} onChange={v => updateField(r.id, 'product', v)} />
                    <Field label="তারিখ" value={r.date || ''} onChange={v => updateField(r.id, 'date', v)} />
                    <Field label="অ্যাভাটার ইনিশিয়াল" value={r.avatar || ''} onChange={v => updateField(r.id, 'avatar', v)} placeholder="যেমন: RH" />
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">রেটিং</label>
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map(n => (
                          <button key={n} onClick={() => updateField(r.id, 'rating', n)}
                            className={`w-9 h-9 rounded-xl text-lg transition-all ${(r.rating || 5) >= n ? 'bg-yellow-400/20 text-yellow-400' : 'glass-card text-muted-foreground'}`}>
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Field label="রিভিউ টেক্সট" value={r.review || ''} onChange={v => updateField(r.id, 'review', v)} textarea />
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                      <input type="checkbox" checked={r.verified !== false} onChange={e => updateField(r.id, 'verified', e.target.checked)} className="rounded" />
                      Verified Purchase
                    </label>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                      <input type="checkbox" checked={r.is_visible !== false} onChange={e => updateField(r.id, 'is_visible', e.target.checked)} className="rounded" />
                      দৃশ্যমান
                    </label>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button onClick={() => { persist(reviews); setEditing(null); }}
                      className="btn-glow px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                      <Save size={14} /> সেভ করুন
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && search && (
            <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground text-sm">আপনার খোঁজার সাথে কোনো রিভিউ মেলেনি</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
