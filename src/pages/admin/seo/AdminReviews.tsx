import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Star, Check, Trash2, Eye, EyeOff, Search } from 'lucide-react';
import { toast } from 'sonner';

const AdminReviews = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // We use testimonials from site_settings as a JSON store
  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'testimonials_data').maybeSingle().then(({ data }) => {
      try { if (data?.value) setReviews(JSON.parse(data.value)); } catch {}
      setLoading(false);
    });
  }, []);

  const persist = async (list: any[]) => {
    await supabase.from('site_settings').upsert({ key: 'testimonials_data', value: JSON.stringify(list), category: 'seo' }, { onConflict: 'key' });
  };

  const toggle = async (id: string, field: 'is_visible') => {
    const updated = reviews.map(r => r.id === id ? { ...r, [field]: !r[field] } : r);
    setReviews(updated); await persist(updated);
    toast.success('Updated!');
  };

  const remove = async (id: string) => {
    const updated = reviews.filter(r => r.id !== id);
    setReviews(updated); await persist(updated);
    toast.success('Review removed');
  };

  const filtered = reviews.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.review?.toLowerCase().includes(search.toLowerCase())
  );

  const visible = reviews.filter(r => r.is_visible !== false).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Review <span className="gradient-text">System</span>
          </h1>
          <p className="text-muted-foreground text-sm">Manage customer reviews and star ratings displayed on the homepage</p>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl text-xs text-muted-foreground">
          {visible} visible · {reviews.length} total
        </div>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reviews…"
          className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 glass-card rounded-2xl animate-pulse" />)}</div>
      ) : reviews.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Star size={36} className="mx-auto text-muted-foreground mb-3" />
          <h3 className="font-bold text-foreground">No reviews yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Reviews from the Testimonials section will appear here for management.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className={`glass-card rounded-2xl p-5 ${r.is_visible === false ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-foreground">{r.name || 'Anonymous'}</span>
                    {r.role && <span className="text-xs text-muted-foreground">· {r.role}</span>}
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className={i < (r.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.review || r.text}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggle(r.id, 'is_visible')} title={r.is_visible !== false ? 'Hide' : 'Show'}
                    className="text-muted-foreground hover:text-primary transition-colors p-1.5">
                    {r.is_visible !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-red-400 transition-colors p-1.5">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground text-sm">No reviews match your search</div>}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
