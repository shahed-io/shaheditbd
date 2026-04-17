import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import {
  Calendar, Clock, User, Tag, ArrowLeft, ArrowRight,
  MessageCircle, ThumbsUp, Send, BookOpen, ChevronRight, Share2, Copy, Check, List
} from 'lucide-react';
import { toast } from 'sonner';
import SEOHead from '@/components/seo/SEOHead';
import { articleSchema, breadcrumbSchema } from '@/components/seo/schemas';
import VerifiedBadge from '@/components/store/VerifiedBadge';

// ── Table of Contents Generator ──────────────────────────────────────────────
const generateTOC = (content: string) => {
  const headings: { id: string; text: string; level: number }[] = [];
  const regex = /^(#{1,3})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].replace(/[*_`]/g, '');
    const id = text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-');
    headings.push({ id, text, level });
  }
  return headings;
};

// ── Simple Markdown Renderer ──────────────────────────────────────────────────
const renderMarkdown = (content: string): string => {
  if (!content) return '';
  let html = content
    // Headers with anchor IDs
    .replace(/^### (.+)$/gm, (_, t) => {
      const id = t.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-');
      return `<h3 id="${id}" class="text-xl font-bold text-foreground mt-8 mb-3 scroll-mt-24">${t}</h3>`;
    })
    .replace(/^## (.+)$/gm, (_, t) => {
      const id = t.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-');
      return `<h2 id="${id}" class="text-2xl font-bold text-foreground mt-10 mb-4 scroll-mt-24">${t}</h2>`;
    })
    .replace(/^# (.+)$/gm, (_, t) => {
      const id = t.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-');
      return `<h1 id="${id}" class="text-3xl font-black text-foreground mt-8 mb-4 scroll-mt-24">${t}</h1>`;
    })
    // Bold & Italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded text-xs font-mono" style="background:var(--neon-violet-dim);color:hsl(var(--primary))">$1</code>')
    // Code blocks
    .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre class="glass-card rounded-xl p-4 overflow-x-auto my-4 text-sm font-mono text-foreground/80 border border-border"><code>$1</code></pre>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 pl-4 my-4 italic text-muted-foreground" style="border-color:hsl(var(--primary))">$1</blockquote>')
    // Unordered lists
    .replace(/^\- (.+)$/gm, '<li class="flex items-start gap-2 text-muted-foreground text-sm mb-1"><span class="text-primary mt-1">▸</span><span>$1</span></li>')
    // Ordered lists  
    .replace(/^\d+\. (.+)$/gm, '<li class="text-muted-foreground text-sm mb-1 ml-4 list-decimal">$1</li>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-2xl my-5 w-full object-cover max-h-96" loading="lazy" />')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="border-border my-8" />')
    // Paragraphs
    .replace(/^(?!<[h|b|p|u|o|l|c|i|pre|blockquote])(.+)$/gm, '<p class="text-muted-foreground leading-7 mb-4 text-sm sm:text-base">$1</p>')
    // Wrap list items
    .replace(/(<li.*<\/li>\n?)+/g, '<ul class="space-y-1 my-4 ml-2">$&</ul>');
  return html;
};

// ── Comment Component ─────────────────────────────────────────────────────────
const CommentSection = ({ postId }: { postId: string }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [form, setForm] = useState({ author_name: '', author_email: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase.from('blog_comments').select('*').eq('post_id', postId).eq('status', 'approved')
      .order('created_at', { ascending: true })
      .then(({ data }) => setComments(data || []));
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.author_name.trim() || !form.content.trim()) {
      toast.error('নাম ও মন্তব্য দিন'); return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('blog_comments').insert({
      post_id: postId, ...form, status: 'pending',
    });
    setSubmitting(false);
    if (error) { toast.error('মন্তব্য পাঠানো সম্ভব হয়নি'); return; }
    setSubmitted(true);
    setForm({ author_name: '', author_email: '', content: '' });
    toast.success('✅ মন্তব্য পাঠানো হয়েছে! অনুমোদনের পর দেখা যাবে।');
  };

  const inputCls = "w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors";

  return (
    <div className="mt-12 space-y-6">
      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
        <MessageCircle size={18} className="text-primary" /> মন্তব্য ({comments.length})
      </h3>

      {/* Comments list */}
      {comments.length > 0 && (
        <div className="space-y-4">
          {comments.map(c => (
            <div key={c.id} className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}>
                  {c.author_name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground inline-flex items-center gap-1">
                    {c.author_name}
                    <VerifiedBadge size={12} />
                  </p>
                  <p className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString('en-BD')}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Comment Form */}
      <div className="glass-card rounded-2xl p-5">
        <h4 className="font-semibold text-foreground text-sm mb-4">মন্তব্য করুন</h4>
        {submitted ? (
          <div className="text-center py-4">
            <ThumbsUp size={32} className="text-primary mx-auto mb-2" />
            <p className="text-sm text-foreground font-medium">ধন্যবাদ!</p>
            <p className="text-xs text-muted-foreground mt-1">আপনার মন্তব্য অনুমোদনের অপেক্ষায় আছে।</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="আপনার নাম *" value={form.author_name} onChange={e => setForm(p => ({ ...p, author_name: e.target.value }))} className={inputCls} />
              <input placeholder="ইমেইল (ঐচ্ছিক)" type="email" value={form.author_email} onChange={e => setForm(p => ({ ...p, author_email: e.target.value }))} className={inputCls} />
            </div>
            <textarea rows={4} placeholder="আপনার মন্তব্য লিখুন..." value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} className={`${inputCls} resize-none`} />
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-glow text-sm font-semibold disabled:opacity-50">
              <Send size={13} /> {submitting ? 'পাঠানো হচ্ছে...' : 'মন্তব্য পাঠান'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ── Main BlogPost Page ────────────────────────────────────────────────────────
const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeHeading, setActiveHeading] = useState('');
  const [copied, setCopied] = useState(false);
  const [showTOC, setShowTOC] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    supabase.from('blog_posts').select('*, blog_categories(name, slug, color)').eq('slug', slug).eq('status', 'published').single()
      .then(async ({ data }) => {
        setPost(data);
        setLoading(false);
        if (data) {
          // Increment views
          await supabase.from('blog_posts').update({ views: (data.views || 0) + 1 }).eq('id', data.id);
          // Fetch related posts
          const { data: rel } = await supabase.from('blog_posts')
            .select('id, title, slug, featured_image, published_at, reading_time, blog_categories(name, color)')
            .eq('status', 'published')
            .eq('category_id', data.category_id || '')
            .neq('id', data.id)
            .limit(3);
          setRelated(rel || []);
        }
      });
  }, [slug]);

  // Active heading tracking
  useEffect(() => {
    const handleScroll = () => {
      const headings = document.querySelectorAll('h1[id], h2[id], h3[id]');
      let active = '';
      headings.forEach(h => {
        const rect = h.getBoundingClientRect();
        if (rect.top <= 120) active = h.id;
      });
      setActiveHeading(active);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [post]);

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('লিংক কপি হয়েছে!');
  };

  const formatDate = (d: string) => new Date(d || Date.now()).toLocaleDateString('en-BD', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16 space-y-4">
        <div className="h-10 w-1/3 bg-muted/30 rounded-xl animate-pulse" />
        <div className="h-64 bg-muted/20 rounded-2xl animate-pulse" />
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-4 bg-muted/20 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />)}</div>
      </div>
      <Footer />
    </div>
  );

  if (!post) return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center text-center px-4">
        <div>
          <BookOpen size={64} className="text-muted-foreground mx-auto mb-4 opacity-30" />
          <h2 className="text-xl font-bold text-foreground mb-2">পোস্ট পাওয়া যায়নি</h2>
          <Link to="/blog" className="text-primary text-sm hover:underline">← ব্লগে ফিরুন</Link>
        </div>
      </div>
      <Footer />
    </div>
  );

  const toc = generateTOC(post.content || '');
  const htmlContent = renderMarkdown(post.content || '');

  const seoSchemas = [
    articleSchema({
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      image: post.featured_image,
      slug: post.slug,
      publishedAt: post.published_at || post.created_at,
      updatedAt: post.updated_at,
      authorName: post.author_name,
    }),
    breadcrumbSchema([
      { name: 'হোম', url: '/' },
      { name: 'ব্লগ', url: '/blog' },
      ...(post.blog_categories ? [{ name: post.blog_categories.name, url: `/blog?cat=${post.category_id}` }] : []),
      { name: post.title, url: `/blog/${post.slug}` },
    ]),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title={post.seo_title || post.title}
        description={post.seo_description || post.excerpt || ''}
        ogImage={post.featured_image || undefined}
        ogType="article"
        schema={seoSchemas}
      />
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">হোম</Link>
          <ChevronRight size={12} />
          <Link to="/blog" className="hover:text-primary transition-colors">ব্লগ</Link>
          {post.blog_categories && (<>
            <ChevronRight size={12} />
            <span style={{ color: post.blog_categories.color }}>{post.blog_categories.name}</span>
          </>)}
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Article */}
          <article className="flex-1 min-w-0">
            {/* Featured Image */}
            {post.featured_image && (
              <div className="rounded-2xl overflow-hidden mb-8 h-64 sm:h-80">
                <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Category */}
            {post.blog_categories && (
              <Link to={`/blog`}
                className="text-xs font-bold uppercase tracking-widest mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
                style={{ background: `${post.blog_categories.color}20`, color: post.blog_categories.color }}>
                {post.blog_categories.name}
              </Link>
            )}

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-4 leading-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-border">
              {/* Author */}
              <div className="flex items-center gap-2.5">
                {post.author_avatar ? (
                  <img src={post.author_avatar} alt={post.author_name} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}>
                    {post.author_name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-foreground">{post.author_name}</p>
                  {post.author_bio && <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-[180px]">{post.author_bio}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground ml-auto">
                <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(post.published_at)}</span>
                <span className="flex items-center gap-1"><Clock size={11} />{post.reading_time} min read</span>
                <button onClick={copyUrl} title="শেয়ার করুন"
                  className="flex items-center gap-1 hover:text-primary transition-colors">
                  {copied ? <Check size={11} className="text-primary" /> : <Share2 size={11} />}
                  {copied ? 'Copied!' : 'Share'}
                </button>
              </div>
            </div>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-base text-muted-foreground leading-relaxed mb-8 px-4 py-3 rounded-xl border-l-4 glass-card"
                style={{ borderColor: 'hsl(var(--primary))' }}>
                {post.excerpt}
              </p>
            )}

            {/* TOC (mobile) */}
            {toc.length > 2 && (
              <div className="lg:hidden glass-card rounded-2xl p-4 mb-6">
                <button onClick={() => setShowTOC(!showTOC)} className="w-full flex items-center justify-between text-sm font-semibold text-foreground">
                  <span className="flex items-center gap-2"><List size={14} /> সূচিপত্র</span>
                  <ChevronRight size={14} className={`transition-transform ${showTOC ? 'rotate-90' : ''}`} />
                </button>
                {showTOC && (
                  <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
                    {toc.map(h => (
                      <li key={h.id} style={{ paddingLeft: `${(h.level - 1) * 12}px` }}>
                        <a href={`#${h.id}`} className={`text-xs hover:text-primary transition-colors ${activeHeading === h.id ? 'text-primary' : 'text-muted-foreground'}`}>
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Content */}
            <div ref={contentRef}
              className="prose-blog"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {/* Tags */}
            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-border">
                <Tag size={13} className="text-muted-foreground mt-0.5" />
                {post.tags.map((tag: string) => (
                  <Link key={tag} to={`/blog`}
                    className="px-3 py-1 rounded-lg text-xs glass-card border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors">
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Author Box */}
            {post.author_bio && (
              <div className="glass-card rounded-2xl p-5 mt-8 flex items-start gap-4">
                {post.author_avatar ? (
                  <img src={post.author_avatar} alt={post.author_name} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}>
                    {post.author_name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-bold text-foreground text-sm">{post.author_name}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{post.author_bio}</p>
                </div>
              </div>
            )}

            {/* Comments */}
            <CommentSection postId={post.id} />
          </article>

          {/* Sidebar — TOC + Related */}
          <aside className="hidden lg:block lg:w-64 xl:w-72 flex-shrink-0 space-y-5">
            {/* Table of Contents */}
            {toc.length > 2 && (
              <div className="glass-card rounded-2xl p-5 sticky top-24">
                <h4 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                  <List size={13} className="text-primary" /> সূচিপত্র
                </h4>
                <ul className="space-y-1.5">
                  {toc.map(h => (
                    <li key={h.id} style={{ paddingLeft: `${(h.level - 1) * 10}px` }}>
                      <a
                        href={`#${h.id}`}
                        className={`text-xs leading-relaxed block py-0.5 transition-colors hover:text-primary ${
                          activeHeading === h.id ? 'text-primary font-semibold' : 'text-muted-foreground'
                        }`}
                      >
                        {activeHeading === h.id && <span className="mr-1">▸</span>}{h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Posts */}
            {related.length > 0 && (
              <div className="glass-card rounded-2xl p-5">
                <h4 className="font-bold text-foreground text-sm mb-3">সম্পর্কিত পোস্ট</h4>
                <div className="space-y-3">
                  {related.map(r => (
                    <Link key={r.id} to={`/blog/${r.slug}`} className="flex gap-3 group">
                      {r.featured_image ? (
                        <img src={r.featured_image} alt={r.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center"
                          style={{ background: 'var(--neon-violet-dim)' }}>
                          <BookOpen size={18} className="text-primary opacity-40" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">{r.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{r.reading_time}m read</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Back to blog */}
            <Link to="/blog" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft size={12} /> ব্লগে ফিরুন
            </Link>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BlogPost;
