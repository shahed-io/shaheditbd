import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Plus, Edit3, Trash2, Eye, EyeOff, Search, Tag, Star, StarOff,
  RefreshCw, X, Save, Loader2, BookOpen, Globe, Sparkles, Zap, CheckCircle2, AlertCircle, SkipForward
} from 'lucide-react';
import { toast } from 'sonner';

const inputCls = "w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide";

const EMPTY_POST = {
  title: '', slug: '', excerpt: '', content: '', featured_image: '',
  category_id: '', author_name: 'Admin', author_avatar: '', author_bio: '',
  status: 'published', is_featured: false, tags: [] as string[],
  reading_time: 5, seo_title: '', seo_description: '',
};

const AdminBlog = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editPost, setEditPost] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'categories' | 'comments' | 'ai-generator'>('posts');
  const [tagInput, setTagInput] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [catForm, setCatForm] = useState({ name: '', slug: '', description: '', color: '#7c3aed' });
  const [editCat, setEditCat] = useState<any>(null);
  const [formTab, setFormTab] = useState<'content' | 'seo' | 'settings'>('content');

  // AI Generator state
  const [products, setProducts] = useState<any[]>([]);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiProgress, setAiProgress] = useState<any[]>([]);
  const [autoPublish, setAutoPublish] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [aiMode, setAiMode] = useState<'bulk' | 'single'>('bulk');
  const [aiModel, setAiModel] = useState<'openai' | 'gemini'>('openai');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: p }, { data: c }, { data: cm }, { data: prods }] = await Promise.all([
      supabase.from('blog_posts').select('*, blog_categories(name, color)').order('created_at', { ascending: false }),
      supabase.from('blog_categories').select('*').order('sort_order'),
      supabase.from('blog_comments').select('*, blog_posts(title)').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name, slug, image_url, categories(name)').eq('status', 'active').order('sort_order'),
    ]);
    setPosts(p || []);
    setCategories(c || []);
    setComments(cm || []);
    setProducts(prods || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, '-');

  const filtered = posts.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search) return p.title?.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const handleSavePost = async () => {
    if (!editPost.title) { toast.error('Title আবশ্যক'); return; }
    if (!editPost.slug) { toast.error('Slug আবশ্যক'); return; }
    setSaving(true);
    const payload = {
      ...editPost,
      published_at: editPost.status === 'published' && !editPost.published_at ? new Date().toISOString() : editPost.published_at,
    };
    const { error } = editPost.id
      ? await supabase.from('blog_posts').update(payload).eq('id', editPost.id)
      : await supabase.from('blog_posts').insert(payload);
    setSaving(false);
    if (error) { toast.error('সেভ করা সম্ভব হয়নি: ' + error.message); return; }
    toast.success(editPost.id ? '✅ পোস্ট আপডেট হয়েছে!' : '✅ পোস্ট তৈরি হয়েছে!');
    setEditPost(null);
    fetchAll();
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('পোস্ট ডিলিট করবেন?')) return;
    await supabase.from('blog_posts').delete().eq('id', id);
    toast.success('পোস্ট ডিলিট হয়েছে');
    fetchAll();
  };

  const toggleStatus = async (post: any) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    await supabase.from('blog_posts').update({
      status: newStatus,
      published_at: newStatus === 'published' ? new Date().toISOString() : null,
    }).eq('id', post.id);
    fetchAll();
  };

  const toggleFeatured = async (post: any) => {
    await supabase.from('blog_posts').update({ is_featured: !post.is_featured }).eq('id', post.id);
    fetchAll();
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (!t || (editPost.tags || []).includes(t)) return;
    setEditPost((p: any) => ({ ...p, tags: [...(p.tags || []), t] }));
    setTagInput('');
  };

  const removeTag = (t: string) => setEditPost((p: any) => ({ ...p, tags: (p.tags || []).filter((x: string) => x !== t) }));

  const handleSaveCat = async () => {
    if (!catForm.name) { toast.error('নাম আবশ্যক'); return; }
    const payload = { ...catForm, slug: catForm.slug || slugify(catForm.name) };
    const { error } = editCat
      ? await supabase.from('blog_categories').update(payload).eq('id', editCat.id)
      : await supabase.from('blog_categories').insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success('ক্যাটাগরি সেভ হয়েছে!');
    setCatForm({ name: '', slug: '', description: '', color: '#7c3aed' });
    setEditCat(null);
    fetchAll();
  };

  const moderateComment = async (id: string, status: string) => {
    await supabase.from('blog_comments').update({ status }).eq('id', id);
    toast.success(status === 'approved' ? '✅ অনুমোদিত' : '🚫 প্রত্যাখ্যাত');
    fetchAll();
  };

  const pendingComments = comments.filter(c => c.status === 'pending').length;

  // AI Blog Generator
  const handleGenerateBulk = async () => {
    if (!confirm(`সব প্রোডাক্টের জন্য AI ব্লগ তৈরি করবেন? (${products.length}টি প্রোডাক্ট)\nনতুন ব্লগ তৈরি হবে, যেগুলোর ব্লগ আছে সেগুলো skip হবে।`)) return;
    setAiGenerating(true);
    setAiProgress([]);
    setAiMode('bulk');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-product-blog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ bulk: true, auto_publish: autoPublish, ai_model: aiModel }),
      });
      if (!res.ok) {
        const err = await res.json();
        if (res.status === 429) toast.error('Rate limit exceeded. একটু পরে আবার চেষ্টা করুন।');
        else if (res.status === 402) toast.error('AI credits শেষ। Workspace settings-এ credits যোগ করুন।');
        else toast.error('Error: ' + (err.error || 'Unknown error'));
        return;
      }
      const data = await res.json();
      setAiProgress(data.results || []);
      const { summary } = data;
      toast.success(`✅ সম্পন্ন! ${summary.success} নতুন ব্লগ, ${summary.skipped} skip, ${summary.errors} error`);
      fetchAll();
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleGenerateSingle = async (productId: string, productName: string) => {
    setAiGenerating(true);
    setAiProgress([{ product_id: productId, name: productName, status: 'generating' }]);
    setAiMode('single');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-product-blog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ product_id: productId, bulk: false, auto_publish: autoPublish, ai_model: aiModel }),
      });
      if (!res.ok) {
        const err = await res.json();
        if (res.status === 429) toast.error('Rate limit exceeded. একটু পরে আবার চেষ্টা করুন।');
        else if (res.status === 402) toast.error('AI credits শেষ।');
        else toast.error('Error: ' + (err.error || 'Unknown error'));
        setAiProgress([{ product_id: productId, name: productName, status: 'error', message: 'Failed' }]);
        return;
      }
      const data = await res.json();
      setAiProgress(data.results || []);
      const r = data.results?.[0];
      if (r?.status === 'success') toast.success(`✅ "${productName}" এর ব্লগ তৈরি হয়েছে!`);
      else if (r?.status === 'skipped') toast.info(`"${productName}" এর ব্লগ ইতিমধ্যে আছে`);
      else toast.error('ব্লগ তৈরি হয়নি');
      fetchAll();
    } catch (e: any) {
      toast.error('Error: ' + e.message);
      setAiProgress([{ product_id: productId, name: productName, status: 'error', message: e.message }]);
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Blog <span className="gradient-text">Management</span>
          </h1>
          <p className="text-muted-foreground text-sm">{posts.length} posts · {categories.length} categories</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('ai-generator')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl btn-glow text-sm font-semibold hover:opacity-90 transition-opacity">
            <Sparkles size={14} /> AI ব্লগ Generator
          </button>
          <button onClick={() => { setEditPost({ ...EMPTY_POST }); setFormTab('content'); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl btn-glow text-sm font-semibold">
            <Plus size={14} /> নতুন পোস্ট
          </button>
          <button onClick={fetchAll} className="glass-card px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-1 overflow-x-auto">
        {(['posts', 'categories', 'comments', 'ai-generator'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-5 py-2.5 text-xs font-semibold whitespace-nowrap capitalize transition-colors relative ${activeTab === t ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {t === 'posts' ? `পোস্ট (${posts.length})` : t === 'categories' ? `ক্যাটাগরি (${categories.length})` : t === 'comments' ? `মন্তব্য${pendingComments > 0 ? ` (${pendingComments})` : ''}` : <span className="flex items-center gap-1"><Sparkles size={11} /> AI Generator</span>}
            {t === 'comments' && pendingComments > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* ── POSTS TAB ── */}
      {activeTab === 'posts' && (
        <>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="পোস্ট খুঁজুন..."
                className="w-full bg-muted/30 border border-border rounded-xl pl-12 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-foreground" />
            </div>
            {(['all', 'published', 'draft'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${statusFilter === s ? 'btn-glow border-transparent' : 'glass-card border-border text-muted-foreground hover:text-primary'}`}>
                {s === 'all' ? 'সব' : s === 'published' ? 'প্রকাশিত' : 'ড্রাফট'}
              </button>
            ))}
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-muted/20 rounded-xl animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <BookOpen size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">কোনো পোস্ট নেই</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">শিরোনাম</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden md:table-cell">ক্যাটাগরি</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">স্ট্যাটাস</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">Views</th>
                    <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filtered.map(post => (
                    <tr key={post.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          {post.featured_image && (
                            <img src={post.featured_image} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-semibold text-foreground text-xs line-clamp-1">{post.title}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">/blog/{post.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {post.blog_categories && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: `${post.blog_categories.color}20`, color: post.blog_categories.color }}>
                            {post.blog_categories.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          post.status === 'published' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' : 'text-amber-500 bg-amber-500/10 border-amber-500/30'
                        }`}>
                          {post.status === 'published' ? '● প্রকাশিত' : '● ড্রাফট'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">{post.views || 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => toggleFeatured(post)} title={post.is_featured ? 'Unfeature' : 'Feature'}
                            className={`p-1.5 rounded-lg transition-colors ${post.is_featured ? 'text-amber-400 bg-amber-400/10' : 'text-muted-foreground hover:text-amber-400'}`}>
                            {post.is_featured ? <Star size={13} /> : <StarOff size={13} />}
                          </button>
                          <button onClick={() => toggleStatus(post)} title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors">
                            {post.status === 'published' ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <button onClick={() => { setEditPost({ ...post }); setFormTab('content'); }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors">
                            <Edit3 size={13} />
                          </button>
                          <button onClick={() => handleDeletePost(post.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── CATEGORIES TAB ── */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Form */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-foreground text-sm">{editCat ? 'ক্যাটাগরি সম্পাদনা' : 'নতুন ক্যাটাগরি'}</h3>
            <div>
              <label className={labelCls}>নাম</label>
              <input value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value, slug: slugify(e.target.value) }))} placeholder="Category name" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Slug</label>
              <input value={catForm.slug} onChange={e => setCatForm(p => ({ ...p, slug: e.target.value }))} placeholder="category-slug" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>বিবরণ</label>
              <input value={catForm.description} onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>রঙ</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={catForm.color} onChange={e => setCatForm(p => ({ ...p, color: e.target.value }))} className="w-10 h-10 rounded-lg border border-border bg-transparent cursor-pointer" />
                <input value={catForm.color} onChange={e => setCatForm(p => ({ ...p, color: e.target.value }))} className={`${inputCls} flex-1`} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveCat} className="flex-1 py-2 rounded-xl btn-glow text-xs font-semibold flex items-center justify-center gap-1.5">
                <Save size={12} /> সেভ করুন
              </button>
              {editCat && (
                <button onClick={() => { setEditCat(null); setCatForm({ name: '', slug: '', description: '', color: '#7c3aed' }); }}
                  className="px-4 py-2 rounded-xl glass-card border border-border text-xs text-muted-foreground hover:text-foreground">
                  বাতিল
                </button>
              )}
            </div>
          </div>

          {/* Categories List */}
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.id} className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">/blog/category/{cat.slug}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditCat(cat); setCatForm({ name: cat.name, slug: cat.slug, description: cat.description || '', color: cat.color || '#7c3aed' }); }}
                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Edit3 size={12} /></button>
                  <button onClick={async () => { if (confirm('ডিলিট?')) { await supabase.from('blog_categories').delete().eq('id', cat.id); fetchAll(); } }}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── COMMENTS TAB ── */}
      {activeTab === 'comments' && (
        <div className="space-y-2">
          {comments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><p className="text-sm">কোনো মন্তব্য নেই</p></div>
          ) : comments.map(c => (
            <div key={c.id} className={`glass-card rounded-xl p-4 ${c.status === 'pending' ? 'border-amber-500/20' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-foreground">{c.author_name}</span>
                    {c.author_email && <span className="text-[10px] text-muted-foreground">{c.author_email}</span>}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      c.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                      c.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>{c.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.content}</p>
                  {c.blog_posts && <p className="text-[10px] text-primary mt-1">📄 {c.blog_posts.title}</p>}
                </div>
                {c.status === 'pending' && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => moderateComment(c.id, 'approved')}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors">
                      অনুমোদন
                    </button>
                    <button onClick={() => moderateComment(c.id, 'rejected')}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
                      প্রত্যাখ্যান
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── AI GENERATOR TAB ── */}
      {activeTab === 'ai-generator' && (
        <div className="space-y-5">
          {/* Info Banner */}
          <div className="glass-card rounded-2xl p-5 border border-primary/20 bg-primary/5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Sparkles size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">AI Blog Generator</h3>
                <p className="text-sm text-muted-foreground mt-1">Lovable AI ব্যবহার করে প্রতিটি প্রোডাক্টের জন্য SEO-অপ্টিমাইজড ইংরেজি ব্লগ পোস্ট তৈরি করুন। ব্লগে থাকবে: পণ্যের বিস্তারিত, সুবিধা, FAQ এবং বাংলাদেশে কেনার গাইড।</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-foreground text-sm">⚙️ সেটিংস</h3>

            {/* AI Model Selector */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">AI মডেল বেছে নিন</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAiModel('openai')}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${aiModel === 'openai' ? 'border-primary bg-primary/10' : 'border-border glass-card hover:border-primary/40'}`}>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-500">G</div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-foreground">ChatGPT</p>
                    <p className="text-[10px] text-muted-foreground">GPT-4o</p>
                  </div>
                  {aiModel === 'openai' && <div className="ml-auto w-4 h-4 rounded-full bg-primary flex items-center justify-center"><span className="text-[8px] text-primary-foreground font-bold">✓</span></div>}
                </button>
                <button
                  onClick={() => setAiModel('gemini')}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${aiModel === 'gemini' ? 'border-primary bg-primary/10' : 'border-border glass-card hover:border-primary/40'}`}>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-400">✦</div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-foreground">Gemini</p>
                    <p className="text-[10px] text-muted-foreground">Gemini 1.5 Pro</p>
                  </div>
                  {aiModel === 'gemini' && <div className="ml-auto w-4 h-4 rounded-full bg-primary flex items-center justify-center"><span className="text-[8px] text-primary-foreground font-bold">✓</span></div>}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setAutoPublish(p => !p)}
                className={`w-11 h-6 rounded-full transition-colors relative ${autoPublish ? 'bg-primary' : 'bg-muted'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${autoPublish ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm text-foreground">সাথে সাথে Publish করুন <span className="text-muted-foreground">(off রাখলে Draft হবে)</span></span>
            </label>

            {/* Bulk Generate */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/10">
              <div>
                <p className="font-semibold text-foreground text-sm">🚀 সব প্রোডাক্টের জন্য ব্লগ তৈরি করুন</p>
                <p className="text-xs text-muted-foreground mt-0.5">{products.length}টি প্রোডাক্ট · {aiModel === 'openai' ? 'GPT-4o' : 'Gemini 1.5 Pro'} দিয়ে লেখা হবে</p>
              </div>
              <button
                onClick={handleGenerateBulk}
                disabled={aiGenerating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-glow text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap">
                {aiGenerating && aiMode === 'bulk' ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                {aiGenerating && aiMode === 'bulk' ? 'তৈরি হচ্ছে...' : 'সব জেনারেট করুন'}
              </button>
            </div>
          </div>

          {/* Progress / Results */}
          {aiProgress.length > 0 && (
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-foreground text-sm">📊 ফলাফল</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {aiProgress.map((r: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/10 border border-border/50">
                    {r.status === 'success' && <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />}
                    {r.status === 'skipped' && <SkipForward size={14} className="text-amber-500 flex-shrink-0" />}
                    {r.status === 'error' && <AlertCircle size={14} className="text-destructive flex-shrink-0" />}
                    {r.status === 'generating' && <Loader2 size={14} className="text-primary animate-spin flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{r.name}</p>
                      {r.message && <p className="text-[10px] text-muted-foreground">{r.message}</p>}
                      {r.blog_slug && <p className="text-[10px] text-primary font-mono">/blog/{r.blog_slug}</p>}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      r.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                      r.status === 'skipped' ? 'bg-amber-500/10 text-amber-500' :
                      r.status === 'generating' ? 'bg-primary/10 text-primary' :
                      'bg-destructive/10 text-destructive'
                    }`}>{r.status === 'success' ? '✓ তৈরি' : r.status === 'skipped' ? '↷ skip' : r.status === 'generating' ? '⟳ চলছে' : '✗ error'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per-Product List */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/10 flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm">প্রোডাক্ট তালিকা — এককভাবে ব্লগ তৈরি করুন</h3>
              <span className="text-xs text-muted-foreground">{products.length}টি প্রোডাক্ট</span>
            </div>
            <div className="divide-y divide-border/30 max-h-[500px] overflow-y-auto">
              {products.map((prod) => {
                const hasBlog = posts.some(p => p.slug?.includes(prod.slug) || p.slug?.includes(prod.id));
                return (
                  <div key={prod.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/10 transition-colors">
                    {prod.image_url ? (
                      <img src={prod.image_url} alt={prod.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-muted/30 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{prod.name}</p>
                      <p className="text-[10px] text-muted-foreground">{(prod.categories as any)?.name || '—'}</p>
                    </div>
                    {hasBlog ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold whitespace-nowrap">✓ ব্লগ আছে</span>
                    ) : (
                      <button
                        onClick={() => handleGenerateSingle(prod.id, prod.name)}
                        disabled={aiGenerating}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 whitespace-nowrap">
                        {aiGenerating ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                        AI ব্লগ
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── POST EDIT MODAL ── */}
      {editPost && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <h2 className="font-bold text-foreground">{editPost.id ? 'পোস্ট সম্পাদনা' : 'নতুন পোস্ট'}</h2>
              <div className="flex items-center gap-2">
                <select value={editPost.status} onChange={e => setEditPost((p: any) => ({ ...p, status: e.target.value }))}
                  className="bg-muted/30 border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors">
                  <option value="draft">ড্রাফট</option>
                  <option value="published">প্রকাশ করুন</option>
                </select>
                <button onClick={handleSavePost} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl btn-glow text-xs font-semibold disabled:opacity-50">
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} সেভ
                </button>
                <button onClick={() => setEditPost(null)} className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground"><X size={16} /></button>
              </div>
            </div>

            {/* Form Tabs */}
            <div className="flex border-b border-border flex-shrink-0">
              {(['content', 'seo', 'settings'] as const).map(t => (
                <button key={t} onClick={() => setFormTab(t)}
                  className={`px-5 py-2.5 text-xs font-semibold capitalize transition-colors ${formTab === t ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                  {t === 'content' ? '✏️ কন্টেন্ট' : t === 'seo' ? '🌐 SEO' : '⚙️ সেটিংস'}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              {formTab === 'content' && (
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>শিরোনাম *</label>
                    <input value={editPost.title}
                      onChange={e => setEditPost((p: any) => ({ ...p, title: e.target.value, slug: p.id ? p.slug : slugify(e.target.value) }))}
                      placeholder="পোস্টের শিরোনাম" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Slug *</label>
                      <input value={editPost.slug} onChange={e => setEditPost((p: any) => ({ ...p, slug: e.target.value }))}
                        placeholder="post-slug" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>ক্যাটাগরি</label>
                      <select value={editPost.category_id || ''} onChange={e => setEditPost((p: any) => ({ ...p, category_id: e.target.value || null }))} className={inputCls}>
                        <option value="">— ক্যাটাগরি বাছুন —</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>সারসংক্ষেপ</label>
                    <textarea rows={2} value={editPost.excerpt} onChange={e => setEditPost((p: any) => ({ ...p, excerpt: e.target.value }))}
                      placeholder="সংক্ষিপ্ত বিবরণ..." className={`${inputCls} resize-none`} />
                  </div>
                  <div>
                    <label className={labelCls}>কন্টেন্ট (Markdown সাপোর্টেড)</label>
                    <textarea rows={18} value={editPost.content} onChange={e => setEditPost((p: any) => ({ ...p, content: e.target.value }))}
                      placeholder="# শিরোনাম&#10;&#10;কন্টেন্ট লিখুন...&#10;&#10;## সেকশন ২&#10;&#10;**Bold** এবং *italic* সাপোর্টেড।"
                      className={`${inputCls} resize-none font-mono text-xs`} />
                    <p className="text-[10px] text-muted-foreground mt-1">Markdown সাপোর্টেড: # H1, ## H2, **bold**, *italic*, `code`, ```codeblock```, - list, &gt; quote</p>
                  </div>
                  {/* Tags */}
                  <div>
                    <label className={labelCls}>ট্যাগ</label>
                    <div className="flex gap-2 mb-2">
                      <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        placeholder="ট্যাগ লিখুন + Enter" className={`${inputCls} flex-1`} />
                      <button onClick={addTag} className="px-3 py-2 rounded-xl glass-card border border-border text-xs text-primary hover:bg-primary/10 transition-colors">
                        <Tag size={13} /> Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(editPost.tags || []).map((t: string) => (
                        <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs glass-card border border-border text-muted-foreground">
                          #{t}
                          <button onClick={() => removeTag(t)} className="text-muted-foreground hover:text-destructive ml-0.5"><X size={10} /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {formTab === 'seo' && (
                <div className="space-y-4">
                  <div className="glass-card rounded-xl p-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5"><Globe size={12} /> Google Preview</p>
                    <div className="space-y-1">
                      <p className="text-blue-400 text-sm font-medium line-clamp-1">{editPost.seo_title || editPost.title || 'পোস্টের শিরোনাম'}</p>
                      <p className="text-emerald-500 text-[11px]">shahedstore.com.bd/blog/{editPost.slug || 'post-slug'}</p>
                      <p className="text-muted-foreground text-xs line-clamp-2">{editPost.seo_description || editPost.excerpt || 'Meta description এখানে দেখাবে...'}</p>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>SEO Title <span className="text-muted-foreground normal-case font-normal">({(editPost.seo_title || '').length}/60)</span></label>
                    <input value={editPost.seo_title} onChange={e => setEditPost((p: any) => ({ ...p, seo_title: e.target.value }))}
                      placeholder="SEO optimized title..." maxLength={60} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Meta Description <span className="text-muted-foreground normal-case font-normal">({(editPost.seo_description || '').length}/160)</span></label>
                    <textarea rows={3} value={editPost.seo_description} onChange={e => setEditPost((p: any) => ({ ...p, seo_description: e.target.value }))}
                      placeholder="Meta description..." maxLength={160} className={`${inputCls} resize-none`} />
                  </div>
                </div>
              )}

              {formTab === 'settings' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Featured Image URL</label>
                      <input value={editPost.featured_image} onChange={e => setEditPost((p: any) => ({ ...p, featured_image: e.target.value }))}
                        placeholder="https://..." className={inputCls} />
                      {editPost.featured_image && <img src={editPost.featured_image} alt="" className="w-full h-24 object-cover rounded-xl mt-2" />}
                    </div>
                    <div>
                      <label className={labelCls}>Reading Time (মিনিট)</label>
                      <input type="number" min={1} value={editPost.reading_time} onChange={e => setEditPost((p: any) => ({ ...p, reading_time: parseInt(e.target.value) || 5 }))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>লেখকের নাম</label>
                      <input value={editPost.author_name} onChange={e => setEditPost((p: any) => ({ ...p, author_name: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>লেখকের Avatar URL</label>
                      <input value={editPost.author_avatar} onChange={e => setEditPost((p: any) => ({ ...p, author_avatar: e.target.value }))} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>লেখকের পরিচিতি (Bio)</label>
                    <textarea rows={2} value={editPost.author_bio} onChange={e => setEditPost((p: any) => ({ ...p, author_bio: e.target.value }))}
                      placeholder="লেখক সম্পর্কে সংক্ষিপ্ত পরিচিতি..." className={`${inputCls} resize-none`} />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div onClick={() => setEditPost((p: any) => ({ ...p, is_featured: !p.is_featured }))}
                        className={`w-10 h-5 rounded-full transition-colors relative ${editPost.is_featured ? 'bg-primary' : 'bg-muted'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${editPost.is_featured ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                      <span className="text-sm text-foreground">ফিচার্ড পোস্ট</span>
                    </label>
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

export default AdminBlog;
