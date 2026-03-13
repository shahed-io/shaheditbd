import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Plus, Edit3, Trash2, Eye, Search, Save, X, Loader2, RefreshCw,
  Star, StarOff, ThumbsUp, ThumbsDown, BookOpen, Globe, Tag
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'general', label: 'সাধারণ' },
  { value: 'orders', label: 'অর্ডার' },
  { value: 'payment', label: 'পেমেন্ট' },
  { value: 'refund', label: 'রিফান্ড' },
  { value: 'security', label: 'নিরাপত্তা' },
  { value: 'support', label: 'সাপোর্ট' },
];

const inputCls = "w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide";

const EMPTY = {
  title: '', slug: '', excerpt: '', content: '', category: 'general',
  tags: [] as string[], is_featured: false, status: 'published',
  sort_order: 0, seo_title: '', seo_description: '',
};

const renderMarkdown = (c: string) => c
  .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>')
  .replace(/^# (.+)$/gm, '<h1 class="text-xl font-black mt-4 mb-3">$1</h1>')
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/^\- (.+)$/gm, '<li>▸ $1</li>')
  .replace(/^(?!<[h|l])(.+)$/gm, '<p class="mb-2">$1</p>');

const AdminHelp = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [editArt, setEditArt] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [formTab, setFormTab] = useState<'content' | 'seo'>('content');
  const [tagInput, setTagInput] = useState('');
  const [preview, setPreview] = useState(false);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('help_articles').select('*').order('sort_order').order('created_at', { ascending: false });
    setArticles(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, '-');

  const filtered = articles.filter(a => {
    if (catFilter !== 'all' && a.category !== catFilter) return false;
    if (search) return a.title?.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const handleSave = async () => {
    if (!editArt.title) { toast.error('Title আবশ্যক'); return; }
    if (!editArt.slug) { toast.error('Slug আবশ্যক'); return; }
    setSaving(true);
    const { error } = editArt.id
      ? await supabase.from('help_articles').update(editArt).eq('id', editArt.id)
      : await supabase.from('help_articles').insert(editArt);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('✅ আর্টিকেল সেভ হয়েছে!');
    setEditArt(null);
    fetchArticles();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ডিলিট করবেন?')) return;
    await supabase.from('help_articles').delete().eq('id', id);
    toast.success('ডিলিট হয়েছে');
    fetchArticles();
  };

  const toggleFeatured = async (a: any) => {
    await supabase.from('help_articles').update({ is_featured: !a.is_featured }).eq('id', a.id);
    fetchArticles();
  };

  const toggleStatus = async (a: any) => {
    await supabase.from('help_articles').update({ status: a.status === 'published' ? 'draft' : 'published' }).eq('id', a.id);
    fetchArticles();
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (!t || (editArt.tags || []).includes(t)) return;
    setEditArt((p: any) => ({ ...p, tags: [...(p.tags || []), t] }));
    setTagInput('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Help Center <span className="gradient-text">Management</span>
          </h1>
          <p className="text-muted-foreground text-sm">{articles.length} আর্টিকেল</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setEditArt({ ...EMPTY }); setFormTab('content'); setPreview(false); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl btn-glow text-sm font-semibold">
            <Plus size={14} /> নতুন আর্টিকেল
          </button>
          <button onClick={fetchArticles} className="glass-card px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="আর্টিকেল খুঁজুন..."
            className="w-full bg-muted/30 border border-border rounded-xl pl-8 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
        </div>
        {['all', ...CATEGORIES.map(c => c.value)].map(cat => (
          <button key={cat} onClick={() => setCatFilter(cat)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${catFilter === cat ? 'btn-glow border-transparent' : 'glass-card border-border text-muted-foreground hover:text-primary'}`}>
            {cat === 'all' ? 'সব' : CATEGORIES.find(c => c.value === cat)?.label || cat}
          </button>
        ))}
      </div>

      {/* Articles Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-muted/20 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">কোনো আর্টিকেল নেই</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">শিরোনাম</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden md:table-cell">ক্যাটাগরি</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">Helpful</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">স্ট্যাটাস</th>
                <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground text-xs">{a.title}</p>
                    {a.excerpt && <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{a.excerpt}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-muted-foreground">{CATEGORIES.find(c => c.value === a.category)?.label || a.category}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5 text-emerald-500"><ThumbsUp size={10} />{a.helpful_yes || 0}</span>
                      <span className="flex items-center gap-0.5 text-red-500"><ThumbsDown size={10} />{a.helpful_no || 0}</span>
                      <span>{a.views || 0} views</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      a.status === 'published' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' : 'text-amber-500 bg-amber-500/10 border-amber-500/30'
                    }`}>
                      {a.status === 'published' ? '● প্রকাশিত' : '● ড্রাফট'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toggleFeatured(a)} title="Feature"
                        className={`p-1.5 rounded-lg transition-colors ${a.is_featured ? 'text-amber-400 bg-amber-400/10' : 'text-muted-foreground hover:text-amber-400'}`}>
                        {a.is_featured ? <Star size={12} /> : <StarOff size={12} />}
                      </button>
                      <button onClick={() => toggleStatus(a)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors">
                        <Eye size={12} />
                      </button>
                      <button onClick={() => { setEditArt({ ...a }); setFormTab('content'); setPreview(false); }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors">
                        <Edit3 size={12} />
                      </button>
                      <button onClick={() => handleDelete(a.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── EDIT MODAL ── */}
      {editArt && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-3xl max-h-[95vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <h2 className="font-bold text-foreground text-sm">{editArt.id ? 'আর্টিকেল সম্পাদনা' : 'নতুন আর্টিকেল'}</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setPreview(!preview)} className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${preview ? 'btn-glow border-transparent' : 'glass-card border-border text-muted-foreground hover:text-foreground'}`}>
                  {preview ? 'সম্পাদনা' : 'Preview'}
                </button>
                <select value={editArt.status} onChange={e => setEditArt((p: any) => ({ ...p, status: e.target.value }))}
                  className="bg-muted/30 border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary">
                  <option value="published">প্রকাশিত</option>
                  <option value="draft">ড্রাফট</option>
                </select>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl btn-glow text-xs font-semibold disabled:opacity-50">
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} সেভ
                </button>
                <button onClick={() => setEditArt(null)} className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground"><X size={15} /></button>
              </div>
            </div>

            {!preview && (
              <div className="flex border-b border-border flex-shrink-0">
                {(['content', 'seo'] as const).map(t => (
                  <button key={t} onClick={() => setFormTab(t)}
                    className={`px-5 py-2.5 text-xs font-semibold capitalize transition-colors ${formTab === t ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                    {t === 'content' ? '✏️ কন্টেন্ট' : '🌐 SEO'}
                  </button>
                ))}
              </div>
            )}

            <div className="overflow-y-auto flex-1 p-5">
              {preview ? (
                <div>
                  <h1 className="text-2xl font-black text-foreground mb-4">{editArt.title}</h1>
                  {editArt.excerpt && <p className="text-muted-foreground mb-4 border-l-4 pl-3 text-sm" style={{ borderColor: 'hsl(var(--primary))' }}>{editArt.excerpt}</p>}
                  <div className="prose-blog text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(editArt.content || '') }} />
                </div>
              ) : formTab === 'content' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>শিরোনাম *</label>
                      <input value={editArt.title}
                        onChange={e => setEditArt((p: any) => ({ ...p, title: e.target.value, slug: p.id ? p.slug : slugify(e.target.value) }))}
                        placeholder="Article title" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Slug *</label>
                      <input value={editArt.slug} onChange={e => setEditArt((p: any) => ({ ...p, slug: e.target.value }))}
                        placeholder="article-slug" className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>ক্যাটাগরি</label>
                      <select value={editArt.category} onChange={e => setEditArt((p: any) => ({ ...p, category: e.target.value }))} className={inputCls}>
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Sort Order</label>
                      <input type="number" value={editArt.sort_order} onChange={e => setEditArt((p: any) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>সারসংক্ষেপ</label>
                    <textarea rows={2} value={editArt.excerpt} onChange={e => setEditArt((p: any) => ({ ...p, excerpt: e.target.value }))}
                      placeholder="Short description..." className={`${inputCls} resize-none`} />
                  </div>
                  <div>
                    <label className={labelCls}>কন্টেন্ট (Markdown)</label>
                    <textarea rows={16} value={editArt.content} onChange={e => setEditArt((p: any) => ({ ...p, content: e.target.value }))}
                      placeholder="## ধাপ ১&#10;&#10;বিস্তারিত লিখুন..."
                      className={`${inputCls} resize-none font-mono text-xs`} />
                  </div>
                  {/* Tags */}
                  <div>
                    <label className={labelCls}>ট্যাগ</label>
                    <div className="flex gap-2 mb-2">
                      <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        placeholder="ট্যাগ + Enter" className={`${inputCls} flex-1`} />
                      <button onClick={addTag} className="px-3 rounded-xl glass-card border border-border text-xs text-primary hover:bg-primary/10 transition-colors">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(editArt.tags || []).map((t: string) => (
                        <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs glass-card border border-border text-muted-foreground">
                          #{t}
                          <button onClick={() => setEditArt((p: any) => ({ ...p, tags: p.tags.filter((x: string) => x !== t) }))}
                            className="text-muted-foreground hover:text-destructive ml-0.5"><X size={9} /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div onClick={() => setEditArt((p: any) => ({ ...p, is_featured: !p.is_featured }))}
                      className={`w-10 h-5 rounded-full transition-colors relative ${editArt.is_featured ? 'bg-primary' : 'bg-muted'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${editArt.is_featured ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-sm text-foreground">ফিচার্ড আর্টিকেল</span>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="glass-card rounded-xl p-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5"><Globe size={12} /> Google Preview</p>
                    <p className="text-blue-400 text-sm font-medium">{editArt.seo_title || editArt.title}</p>
                    <p className="text-emerald-500 text-[11px]">shahedstore.lovable.app/help/{editArt.slug}</p>
                    <p className="text-muted-foreground text-xs mt-1">{editArt.seo_description || editArt.excerpt}</p>
                  </div>
                  <div>
                    <label className={labelCls}>SEO Title</label>
                    <input value={editArt.seo_title} onChange={e => setEditArt((p: any) => ({ ...p, seo_title: e.target.value }))} maxLength={60} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Meta Description</label>
                    <textarea rows={3} value={editArt.seo_description} onChange={e => setEditArt((p: any) => ({ ...p, seo_description: e.target.value }))}
                      maxLength={160} className={`${inputCls} resize-none`} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHelp;
