import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Star, ThumbsUp, Send, User } from 'lucide-react';

interface Review {
  id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  helpful_count: number;
  is_verified: boolean;
  created_at: string;
}

const StarRating = ({ value, onChange, size = 20 }: { value: number; onChange?: (v: number) => void; size?: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <button
        key={i}
        type={onChange ? 'button' : undefined}
        onClick={() => onChange?.(i)}
        className={onChange ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
      >
        <Star
          size={size}
          fill={i <= value ? 'hsl(45,100%,51%)' : 'none'}
          stroke={i <= value ? 'hsl(45,100%,45%)' : 'hsl(226,20%,72%)'}
        />
      </button>
    ))}
  </div>
);

const ProductReviews = ({ productId, productSlug }: { productId: string; productSlug: string }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', title: '', body: '', rating: 5 });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase
      .from('product_reviews')
      .select('id, author_name, rating, title, body, helpful_count, is_verified, created_at')
      .eq('product_id', productId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReviews(data || []);
        setLoading(false);
      });
  }, [productId]);

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.body.trim()) return;
    setSubmitting(true);
    await supabase.from('product_reviews').insert({
      product_id: productId,
      product_slug: productSlug,
      author_name: form.name.trim(),
      author_email: form.email.trim() || null,
      title: form.title.trim() || null,
      body: form.body.trim(),
      rating: form.rating,
    });
    setSubmitting(false);
    setSubmitted(true);
    setShowForm(false);
  };

  const handleHelpful = async (id: string) => {
    await supabase.from('product_reviews').update({ helpful_count: reviews.find(r => r.id === id)!.helpful_count + 1 }).eq('id', id);
    setReviews(prev => prev.map(r => r.id === id ? { ...r, helpful_count: r.helpful_count + 1 } : r));
  };

  return (
    <div className="mt-10">
      <h2 className="font-sora font-bold text-xl text-foreground flex items-center gap-2 mb-6">
        <span className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(180deg, hsl(45,100%,51%), hsl(25,90%,52%))' }} />
        Customer Reviews
        {reviews.length > 0 && <span className="text-sm font-normal text-muted-foreground">({reviews.length})</span>}
      </h2>

      {/* Summary */}
      {reviews.length > 0 && (
        <div className="rounded-2xl p-5 mb-6 flex flex-col sm:flex-row gap-6"
          style={{
            background: 'linear-gradient(155deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.58) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid hsla(258,78%,75%,0.22)',
            boxShadow: '0 4px 24px hsla(258,78%,55%,0.08)',
          }}>
          <div className="flex flex-col items-center justify-center min-w-[100px]">
            <p className="text-5xl font-black" style={{ color: 'hsl(226,35%,14%)' }}>{avgRating.toFixed(1)}</p>
            <StarRating value={Math.round(avgRating)} size={16} />
            <p className="text-xs mt-1 text-muted-foreground">{reviews.length} reviews</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {distribution.map(d => (
              <div key={d.star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-right text-muted-foreground">{d.star}</span>
                <Star size={10} fill="hsl(45,100%,51%)" stroke="hsl(45,100%,45%)" />
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'hsla(258,78%,55%,0.08)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${d.pct}%`, background: 'linear-gradient(90deg, hsl(45,100%,51%), hsl(25,90%,52%))' }} />
                </div>
                <span className="w-5 text-muted-foreground">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review list */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-muted/20 rounded-2xl animate-pulse" />)}</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 rounded-2xl" style={{ background: 'hsla(258,78%,55%,0.04)', border: '1px dashed hsla(258,78%,75%,0.30)' }}>
          <Star size={32} className="mx-auto mb-2 opacity-20" />
          <p className="text-muted-foreground text-sm">এখনো কোনো রিভিউ নেই</p>
          <p className="text-xs text-muted-foreground mt-1">প্রথম রিভিউ দিন!</p>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {reviews.map(r => (
            <div key={r.id} className="rounded-2xl p-5"
              style={{
                background: 'linear-gradient(155deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.58) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid hsla(258,78%,75%,0.18)',
                boxShadow: '0 2px 12px hsla(258,78%,55%,0.06)',
              }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))' }}>
                    <User size={15} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm" style={{ color: 'hsl(226,35%,18%)' }}>{r.author_name}</span>
                      {r.is_verified && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: 'hsla(162,72%,38%,0.12)', color: 'hsl(162,72%,28%)' }}>✓ Verified</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
                <StarRating value={r.rating} size={14} />
              </div>
              {r.title && <p className="font-semibold text-sm mb-1" style={{ color: 'hsl(226,35%,18%)' }}>{r.title}</p>}
              <p className="text-sm leading-relaxed" style={{ color: 'hsl(226,25%,40%)' }}>{r.body}</p>
              <button
                onClick={() => handleHelpful(r.id)}
                className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ThumbsUp size={12} /> Helpful ({r.helpful_count})
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Write review button / form */}
      {submitted ? (
        <div className="text-center py-4 rounded-2xl" style={{ background: 'hsla(162,72%,38%,0.08)', border: '1px solid hsla(162,72%,38%,0.25)' }}>
          <p className="font-semibold text-sm" style={{ color: 'hsl(162,72%,28%)' }}>✓ রিভিউ সাবমিট হয়েছে! অ্যাডমিন অনুমোদনের পর প্রদর্শিত হবে।</p>
        </div>
      ) : showForm ? (
        <form onSubmit={handleSubmit} className="rounded-2xl p-5 space-y-4"
          style={{
            background: 'linear-gradient(155deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.65) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid hsla(258,78%,75%,0.25)',
            boxShadow: '0 4px 24px hsla(258,78%,55%,0.10)',
          }}>
          <h3 className="font-sora font-bold text-base" style={{ color: 'hsl(226,35%,14%)' }}>রিভিউ লিখুন</h3>
          <div>
            <p className="text-xs font-medium mb-1.5 text-muted-foreground">রেটিং</p>
            <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} size={24} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'name', label: 'নাম *', placeholder: 'আপনার নাম', required: true, type: 'text' },
              { key: 'email', label: 'ইমেইল (ঐচ্ছিক)', placeholder: 'your@email.com', required: false, type: 'email' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-medium text-muted-foreground block mb-1">{f.label}</label>
                <input
                  type={f.type}
                  required={f.required}
                  placeholder={f.placeholder}
                  value={(form as any)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'hsla(0,0%,100%,0.80)', border: '1.5px solid hsla(258,78%,75%,0.25)', color: 'hsl(226,35%,14%)' }}
                />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">শিরোনাম (ঐচ্ছিক)</label>
            <input
              type="text"
              placeholder="সংক্ষিপ্ত শিরোনাম"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'hsla(0,0%,100%,0.80)', border: '1.5px solid hsla(258,78%,75%,0.25)', color: 'hsl(226,35%,14%)' }}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">রিভিউ *</label>
            <textarea
              required
              placeholder="আপনার অভিজ্ঞতা শেয়ার করুন..."
              rows={4}
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'hsla(0,0%,100%,0.80)', border: '1.5px solid hsla(258,78%,75%,0.25)', color: 'hsl(226,35%,14%)' }}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))', boxShadow: '0 4px 16px hsla(258,78%,55%,0.28)' }}
            >
              {submitting ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><Send size={14} /> সাবমিট</>}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              style={{ background: 'hsla(258,78%,55%,0.06)', border: '1px solid hsla(258,78%,75%,0.20)' }}>
              বাতিল
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, hsla(258,78%,55%,0.10), hsla(200,90%,45%,0.08))',
            border: '1.5px solid hsla(258,78%,75%,0.30)',
            color: 'hsl(258,78%,45%)',
          }}
        >
          <Star size={15} fill="hsl(45,100%,51%)" stroke="hsl(45,100%,45%)" />
          রিভিউ লিখুন
        </button>
      )}
    </div>
  );
};

export default ProductReviews;
