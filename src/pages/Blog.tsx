import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import {
  Search, Calendar, Clock, Tag, ChevronRight, Star, BookOpen, ArrowRight, User, Sparkles, TrendingUp, Flame
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

  const fetchPosts = async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('blog_posts').select('*, blog_categories(name, slug, color)').eq('status', 'published').order('published_at', { ascending: false }),
      supabase.from('blog_categories').select('*').eq('is_active', true).order('sort_order'),
    ]);
    setPosts(p || []);
    setCategories(c || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
    const channel = supabase
      .channel('blog_posts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, () => fetchPosts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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

  const formatDate = (d: string) => new Date(d || Date.now()).toLocaleDateString('bn-BD', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  const gradients = [
    'from-violet-600/20 via-purple-600/10 to-blue-600/20',
    'from-pink-600/20 via-rose-600/10 to-orange-600/20',
    'from-cyan-600/20 via-teal-600/10 to-emerald-600/20',
    'from-amber-600/20 via-yellow-600/10 to-orange-600/20',
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Software Tips, Guides & Digital Product News – Blog"
        description="Shahed Store Blog – Read guides, tips and news about Windows, Microsoft Office, Adobe, Antivirus, VPN, streaming subscriptions and all digital software in Bangladesh."
        ogType="website"
        canonical="https://shahedstore.com.bd/blog"
        keywords="software tips bangladesh, windows guide, office 365 tutorial, adobe tips, digital software blog"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'Shahed Store Blog',
          description: 'Tips, guides and news about digital products',
          url: `${SITE_URL}/blog`,
        }}
      />
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-28 pb-20">
        {/* Background layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, hsla(271,91%,65%,0.18) 0%, transparent 65%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 40% at 80% 60%, hsla(200,90%,55%,0.08) 0%, transparent 60%)' }} />
          {/* Animated grid dots */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: 'radial-gradient(circle, hsl(271,91%,65%) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-6 border"
            style={{
              background: 'hsla(271,91%,65%,0.1)',
              borderColor: 'hsla(271,91%,65%,0.3)',
              color: 'hsl(271,91%,65%)'
            }}>
            <Sparkles size={12} className="animate-pulse" />
            ব্লগ ও আর্টিকেল
            <Sparkles size={12} className="animate-pulse" />
          </div>

          <h1 className="text-5xl sm:text-6xl font-black mb-5 leading-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            <span style={{ background: 'linear-gradient(135deg, hsl(271,91%,65%), hsl(200,90%,55%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Blog
            </span>
            <span className="text-foreground"> & Guides</span>
          </h1>

          <p className="text-muted-foreground max-w-lg mx-auto text-base mb-10 leading-relaxed">
            ডিজিটাল প্রোডাক্ট, সফটওয়্যার টিপস এবং সর্বশেষ প্রযুক্তির খবর পড়ুন
          </p>

          {/* Search bar */}
          <div className="relative max-w-lg mx-auto">
            <div className="absolute inset-0 rounded-2xl blur-xl opacity-20" style={{ background: 'linear-gradient(135deg, hsl(271,91%,65%), hsl(200,90%,55%))' }} />
            <div className="relative flex items-center border rounded-2xl overflow-hidden"
              style={{ background: 'hsl(var(--card))', borderColor: 'hsla(271,91%,65%,0.3)' }}>
              <Search size={16} className="absolute left-5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="আর্টিকেল খুঁজুন..."
                className="w-full bg-transparent pl-12 pr-5 py-4 text-sm focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="mr-4 text-xs text-muted-foreground hover:text-primary transition-colors">
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 mt-10 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <BookOpen size={13} className="text-primary" />
              <span><strong className="text-foreground">{posts.length}</strong> আর্টিকেল</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <Tag size={13} className="text-primary" />
              <span><strong className="text-foreground">{categories.length}</strong> ক্যাটাগরি</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <TrendingUp size={13} className="text-primary" />
              <span>সাপ্তাহিক আপডেট</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">

        {/* Featured Posts */}
        {!loading && featured.length > 0 && selectedCat === 'all' && !search && !selectedTag && (
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: 'hsla(42,96%,58%,0.15)', color: 'hsl(42,96%,58%)' }}>
                <Flame size={12} />
                ফিচার্ড আর্টিকেল
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featured.map((post, i) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className={`group relative rounded-3xl overflow-hidden border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${i === 0 ? 'md:col-span-2' : ''}`}
                  style={{
                    background: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    boxShadow: '0 2px 20px hsla(226,35%,12%,0.08)'
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'hsla(271,91%,65%,0.4)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 60px hsla(271,91%,65%,0.15)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 20px hsla(226,35%,12%,0.08)';
                  }}
                >
                  {/* Image */}
                  {post.featured_image ? (
                    <div className={`overflow-hidden ${i === 0 ? 'h-56' : 'h-40'}`}>
                      <img src={post.featured_image} alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                  ) : (
                    <div className={`${i === 0 ? 'h-56' : 'h-40'} relative overflow-hidden flex items-center justify-center bg-gradient-to-br ${gradients[i % gradients.length]}`}>
                      <div className="absolute inset-0 opacity-30"
                        style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, hsla(271,91%,65%,0.3) 0%, transparent 50%)' }} />
                      <BookOpen size={i === 0 ? 56 : 40} className="text-primary opacity-40 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  )}

                  {/* Content */}
                  <div className={`p-5 ${i === 0 ? '' : 'p-4'}`}>
                    {post.blog_categories && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-3 inline-block"
                        style={{ background: `${post.blog_categories.color}18`, color: post.blog_categories.color, border: `1px solid ${post.blog_categories.color}30` }}>
                        {post.blog_categories.name}
                      </span>
                    )}
                    <h3 className={`font-bold text-foreground line-clamp-2 mb-3 group-hover:text-primary transition-colors ${i === 0 ? 'text-base' : 'text-sm'}`}>
                      {post.title}
                    </h3>
                    {i === 0 && post.excerpt && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Calendar size={11} />{formatDate(post.published_at)}</span>
                        <span className="flex items-center gap-1.5"><Clock size={11} />{post.reading_time}m পড়া</span>
                      </div>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-1"
                        style={{ background: 'hsla(271,91%,65%,0.1)' }}>
                        <ArrowRight size={13} style={{ color: 'hsl(271,91%,65%)' }} />
                      </div>
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
            {/* Category Filter Pills */}
            <div className="flex gap-2 flex-wrap mb-7 pb-5 border-b border-border/50">
              <button
                onClick={() => setSelectedCat('all')}
                className="px-5 py-2 rounded-full text-xs font-bold transition-all duration-300"
                style={selectedCat === 'all' ? {
                  background: 'linear-gradient(135deg, hsl(271,91%,65%), hsl(200,90%,55%))',
                  color: 'white',
                  boxShadow: '0 4px 15px hsla(271,91%,65%,0.4)'
                } : {
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--muted-foreground))'
                }}
              >
                সব পোস্ট {posts.length > 0 && `(${posts.length})`}
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(selectedCat === cat.id ? 'all' : cat.id)}
                  className="px-5 py-2 rounded-full text-xs font-bold transition-all duration-300"
                  style={selectedCat === cat.id ? {
                    background: `${cat.color}22`,
                    color: cat.color,
                    border: `1px solid ${cat.color}50`,
                    boxShadow: `0 4px 15px ${cat.color}30`
                  } : {
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--muted-foreground))'
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Posts Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-72 bg-muted/20 rounded-3xl animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24 text-muted-foreground">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'hsla(271,91%,65%,0.08)' }}>
                  <BookOpen size={36} className="opacity-30" />
                </div>
                <p className="font-semibold text-sm">কোনো পোস্ট পাওয়া যায়নি</p>
                {(search || selectedCat !== 'all' || selectedTag) && (
                  <button onClick={() => { setSearch(''); setSelectedCat('all'); setSelectedTag(''); }}
                    className="mt-3 text-xs text-primary hover:underline">ফিল্টার রিসেট করুন</button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {filtered.map((post, idx) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="group relative rounded-3xl overflow-hidden border flex flex-col transition-all duration-500 hover:-translate-y-2"
                    style={{
                      background: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      boxShadow: '0 2px 16px hsla(226,35%,12%,0.06)'
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'hsla(271,91%,65%,0.35)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px hsla(271,91%,65%,0.12)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 16px hsla(226,35%,12%,0.06)';
                    }}
                  >
                    {/* Image */}
                    {post.featured_image ? (
                      <div className="h-44 overflow-hidden">
                        <img src={post.featured_image} alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      </div>
                    ) : (
                      <div className={`h-44 relative overflow-hidden flex items-center justify-center bg-gradient-to-br ${gradients[idx % gradients.length]}`}>
                        <div className="absolute inset-0"
                          style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, hsla(271,91%,65%,0.2) 0%, transparent 60%)' }} />
                        <BookOpen size={44} className="text-primary opacity-25 group-hover:scale-110 group-hover:opacity-40 transition-all duration-500" />
                      </div>
                    )}

                    {/* Shine effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background: 'linear-gradient(135deg, transparent 0%, hsla(271,91%,65%,0.03) 50%, transparent 100%)' }} />

                    <div className="p-5 flex flex-col flex-1">
                      {post.blog_categories && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 inline-block w-fit"
                          style={{
                            background: `${post.blog_categories.color}15`,
                            color: post.blog_categories.color,
                            border: `1px solid ${post.blog_categories.color}30`
                          }}>
                          {post.blog_categories.name}
                        </span>
                      )}
                      <h3 className="font-bold text-foreground text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors leading-snug flex-1">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{post.excerpt}</p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t mt-auto"
                        style={{ borderColor: 'hsla(226,35%,12%,0.06)' }}>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: 'hsla(271,91%,65%,0.1)' }}>
                            <User size={9} style={{ color: 'hsl(271,91%,65%)' }} />
                          </div>
                          <span className="font-medium">{post.author_name || 'Admin'}</span>
                          <span className="text-border">·</span>
                          <Clock size={10} />
                          <span>{post.reading_time}m পড়া</span>
                        </div>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110"
                          style={{ background: 'hsla(271,91%,65%,0.1)' }}>
                          <ArrowRight size={12} style={{ color: 'hsl(271,91%,65%)' }} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>

          {/* Sidebar */}
          <aside className="lg:w-72 space-y-5 flex-shrink-0">

            {/* Categories Widget */}
            {categories.length > 0 && (
              <div className="rounded-3xl p-5 border"
                style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                <h3 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center"
                    style={{ background: 'hsla(271,91%,65%,0.15)' }}>
                    <ChevronRight size={12} style={{ color: 'hsl(271,91%,65%)' }} />
                  </div>
                  ক্যাটাগরি
                </h3>
                <div className="space-y-2">
                  {categories.map(cat => {
                    const count = posts.filter(p => p.category_id === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCat(selectedCat === cat.id ? 'all' : cat.id)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs transition-all duration-200 hover:scale-[1.02]"
                        style={selectedCat === cat.id ? {
                          background: `${cat.color}15`,
                          color: cat.color,
                          border: `1px solid ${cat.color}30`
                        } : {
                          background: 'transparent',
                          border: '1px solid transparent',
                          color: 'hsl(var(--muted-foreground))'
                        }}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color, boxShadow: `0 0 6px ${cat.color}60` }} />
                          <span className="font-medium">{cat.name}</span>
                        </span>
                        <span className="font-bold text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: `${cat.color}15`, color: cat.color }}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tags Widget */}
            {allTags.length > 0 && (
              <div className="rounded-3xl p-5 border"
                style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                <h3 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center"
                    style={{ background: 'hsla(200,90%,55%,0.15)' }}>
                    <Tag size={11} style={{ color: 'hsl(200,90%,55%)' }} />
                  </div>
                  ট্যাগ
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all duration-200 hover:scale-105"
                      style={selectedTag === tag ? {
                        background: 'linear-gradient(135deg, hsl(271,91%,65%), hsl(200,90%,55%))',
                        color: 'white',
                        boxShadow: '0 3px 10px hsla(271,91%,65%,0.35)'
                      } : {
                        background: 'hsl(var(--muted))',
                        color: 'hsl(var(--muted-foreground))',
                        border: '1px solid hsl(var(--border))'
                      }}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Newsletter / Help CTA */}
            <Link to="/help"
              className="group block rounded-3xl p-5 border relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{
                background: 'linear-gradient(135deg, hsla(271,91%,65%,0.08), hsla(200,90%,55%,0.06))',
                borderColor: 'hsla(271,91%,65%,0.2)'
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'hsla(271,91%,65%,0.5)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'hsla(271,91%,65%,0.2)'}
            >
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -translate-y-4 translate-x-4"
                style={{ background: 'radial-gradient(circle, hsl(271,91%,65%), transparent)' }} />
              <div className="relative">
                <div className="text-2xl mb-2">🆘</div>
                <h3 className="font-bold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">
                  Help Center
                </h3>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">সাধারণ প্রশ্ন ও সমাধান পান</p>
                <span className="text-xs font-semibold flex items-center gap-1.5 transition-all group-hover:gap-2.5"
                  style={{ color: 'hsl(271,91%,65%)' }}>
                  Help দেখুন <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Blog;
