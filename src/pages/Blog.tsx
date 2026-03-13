import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import {
  Search, Calendar, Clock, Tag, ChevronRight, Star, BookOpen, ArrowRight, User
} from 'lucide-react';
import SEOHead from '@/components/seo/SEOHead';
import { SITE_URL } from '@/components/seo/SEOHead';

const Blog = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedTag, setSelectedTag] = useState('');

  useEffect(() => {
    Promise.all([
      supabase.from('blog_posts').select('*, blog_categories(name, slug, color)').eq('status', 'published').order('published_at', { ascending: false }),
      supabase.from('blog_categories').select('*').eq('is_active', true).order('sort_order'),
    ]).then(([{ data: p }, { data: c }]) => {
      setPosts(p || []);
      setCategories(c || []);
      setLoading(false);
    });
  }, []);

  const allTags = [...new Set(posts.flatMap(p => p.tags || []))];

  const filtered = posts.filter(p => {
    if (selectedCat !== 'all' && p.category_id !== selectedCat) return false;
    if (selectedTag && !(p.tags || []).includes(selectedTag)) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.title?.toLowerCase().includes(q) || p.excerpt?.toLowerCase().includes(q) ||
        (p.tags || []).some((t: string) => t.toLowerCase().includes(q));
    }
    return true;
  });

  const featured = posts.filter(p => p.is_featured).slice(0, 3);

  const formatDate = (d: string) => new Date(d || Date.now()).toLocaleDateString('en-BD', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* SEO Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "Shahed Store Blog",
        "description": "Tips, guides and news about digital products",
        "url": window.location.origin + "/blog",
      })}} />

      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-16">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, hsla(271,91%,65%,0.12) 0%, transparent 70%)' }} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
            style={{ background: 'var(--neon-violet-dim)', color: 'hsl(var(--primary))' }}>
            <BookOpen size={12} /> ব্লগ ও আর্টিকেল
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            <span className="gradient-text">Blog</span> & Guides
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base mb-8">
            ডিজিটাল প্রোডাক্ট, সফটওয়্যার টিপস এবং সর্বশেষ খবর জানুন
          </p>
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="আর্টিকেল খুঁজুন..."
              className="w-full bg-card border border-border rounded-2xl pl-11 pr-5 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">

        {/* Featured Posts */}
        {!loading && featured.length > 0 && selectedCat === 'all' && !search && !selectedTag && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-5">
              <Star size={16} className="text-primary" />
              <h2 className="text-lg font-bold text-foreground">ফিচার্ড আর্টিকেল</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featured.map((post, i) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className={`glass-card rounded-2xl overflow-hidden group hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 ${i === 0 ? 'md:col-span-2' : ''}`}
                >
                  {post.featured_image ? (
                    <div className={`overflow-hidden ${i === 0 ? 'h-52' : 'h-36'}`}>
                      <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className={`${i === 0 ? 'h-52' : 'h-36'} flex items-center justify-center`}
                      style={{ background: 'linear-gradient(135deg, var(--neon-violet-dim), var(--neon-cyan-dim))' }}>
                      <BookOpen size={40} className="text-primary opacity-30" />
                    </div>
                  )}
                  <div className="p-4">
                    {post.blog_categories && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide mb-2 inline-block"
                        style={{ background: `${post.blog_categories.color}20`, color: post.blog_categories.color }}>
                        {post.blog_categories.name}
                      </span>
                    )}
                    <h3 className="font-bold text-foreground text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">{post.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar size={10} />{formatDate(post.published_at)}</span>
                      <span className="flex items-center gap-1"><Clock size={10} />{post.reading_time}m read</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap mb-6">
              <button
                onClick={() => setSelectedCat('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${selectedCat === 'all' ? 'btn-glow border-transparent' : 'glass-card border-border text-muted-foreground hover:text-primary'}`}
              >
                সব পোস্ট {posts.length > 0 && `(${posts.length})`}
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(selectedCat === cat.id ? 'all' : cat.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${selectedCat === cat.id ? 'border-transparent' : 'glass-card border-border text-muted-foreground hover:text-primary'}`}
                  style={selectedCat === cat.id ? { background: `${cat.color}25`, color: cat.color, borderColor: `${cat.color}40` } : {}}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Posts Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-64 bg-muted/20 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium">কোনো পোস্ট পাওয়া যায়নি</p>
                {(search || selectedCat !== 'all' || selectedTag) && (
                  <button onClick={() => { setSearch(''); setSelectedCat('all'); setSelectedTag(''); }}
                    className="mt-3 text-xs text-primary hover:underline">ফিল্টার রিসেট করুন</button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map(post => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="glass-card rounded-2xl overflow-hidden group hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 flex flex-col"
                  >
                    {post.featured_image ? (
                      <div className="h-40 overflow-hidden">
                        <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="h-40 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, var(--neon-violet-dim), var(--neon-cyan-dim))' }}>
                        <BookOpen size={32} className="text-primary opacity-20" />
                      </div>
                    )}
                    <div className="p-4 flex flex-col flex-1">
                      {post.blog_categories && (
                        <span className="text-[10px] font-bold uppercase tracking-wide mb-1.5 inline-block"
                          style={{ color: post.blog_categories.color }}>
                          {post.blog_categories.name}
                        </span>
                      )}
                      <h3 className="font-bold text-foreground text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors flex-1">{post.title}</h3>
                      {post.excerpt && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <User size={9} />
                          <span>{post.author_name}</span>
                          <span>·</span>
                          <Clock size={9} />
                          <span>{post.reading_time}m</span>
                        </div>
                        <ArrowRight size={13} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>

          {/* Sidebar */}
          <aside className="lg:w-72 space-y-5 flex-shrink-0">
            {/* Categories */}
            {categories.length > 0 && (
              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                  <ChevronRight size={14} className="text-primary" /> ক্যাটাগরি
                </h3>
                <div className="space-y-1.5">
                  {categories.map(cat => {
                    const count = posts.filter(p => p.category_id === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCat(selectedCat === cat.id ? 'all' : cat.id)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors hover:bg-muted/30 text-left"
                        style={{ color: selectedCat === cat.id ? cat.color : '' }}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                          {cat.name}
                        </span>
                        <span className="text-muted-foreground">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tags */}
            {allTags.length > 0 && (
              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                  <Tag size={13} className="text-primary" /> ট্যাগ
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border ${
                        selectedTag === tag
                          ? 'btn-glow border-transparent'
                          : 'glass-card border-border text-muted-foreground hover:text-primary'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Help Center CTA */}
            <Link to="/help" className="glass-card rounded-2xl p-5 block hover:border-primary/40 transition-colors group">
              <h3 className="font-bold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">
                🆘 Help Center
              </h3>
              <p className="text-xs text-muted-foreground mb-3">সাধারণ প্রশ্ন ও সমাধান পান</p>
              <span className="text-xs text-primary flex items-center gap-1">Help দেখুন <ArrowRight size={11} /></span>
            </Link>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Blog;
