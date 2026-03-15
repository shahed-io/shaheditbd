import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import {
  Search, ChevronRight, ThumbsUp, ThumbsDown, Star, Package,
  CreditCard, RefreshCw, Shield, Headphones, BookOpen, ArrowLeft, ExternalLink, Download
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORY_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  general:   { icon: BookOpen,     color: '#7c3aed', label: 'সাধারণ' },
  orders:    { icon: Package,      color: '#06b6d4', label: 'অর্ডার' },
  payment:   { icon: CreditCard,   color: '#22c55e', label: 'পেমেন্ট' },
  refund:    { icon: RefreshCw,    color: '#f59e0b', label: 'রিফান্ড' },
  security:  { icon: Shield,       color: '#ec4899', label: 'নিরাপত্তা' },
  support:   { icon: Headphones,   color: '#8b5cf6', label: 'সাপোর্ট' },
};

// Reuse the same markdown renderer
const renderMarkdown = (content: string): string => {
  if (!content) return '';
  return content
    .replace(/^### (.+)$/gm, (_, t) => {
      const id = t.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-');
      return `<h3 id="${id}" class="text-lg font-bold text-foreground mt-6 mb-2 scroll-mt-24">${t}</h3>`;
    })
    .replace(/^## (.+)$/gm, (_, t) => {
      const id = t.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-');
      return `<h2 id="${id}" class="text-xl font-bold text-foreground mt-8 mb-3 scroll-mt-24">${t}</h2>`;
    })
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-black text-foreground mt-6 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded text-xs font-mono" style="background:var(--neon-violet-dim);color:hsl(var(--primary))">$1</code>')
    .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre class="glass-card rounded-xl p-4 overflow-x-auto my-4 text-sm font-mono text-foreground/80 border border-border"><code>$1</code></pre>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 pl-4 my-3 italic text-muted-foreground" style="border-color:hsl(var(--primary))">$1</blockquote>')
    .replace(/^\- (.+)$/gm, '<li class="flex items-start gap-2 text-muted-foreground text-sm mb-1"><span class="text-primary mt-1">▸</span><span>$1</span></li>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul class="space-y-1 my-3 ml-2">$&</ul>')
    .replace(/^(?!<[h|b|p|u|o|l|c|i|pre|blockquote])(.+)$/gm, '<p class="text-muted-foreground leading-relaxed mb-3 text-sm">$1</p>');
};

const HelpCenter = () => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<any[]>([]);
  const [softwareDownloads, setSoftwareDownloads] = useState<any[]>([]);
  const [currentArticle, setCurrentArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [helpfulVoted, setHelpfulVoted] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from('help_articles').select('*').eq('status', 'published').order('sort_order').order('created_at', { ascending: false }),
      supabase.from('software_downloads' as any).select('*').eq('is_active', true).order('sort_order'),
    ]).then(([{ data: articles }, { data: software }]) => {
      setArticles(articles || []);
      setSoftwareDownloads((software as any) || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (slug && articles.length > 0) {
      const art = articles.find(a => a.slug === slug);
      if (art) {
        setCurrentArticle(art);
        supabase.from('help_articles').update({ views: (art.views || 0) + 1 }).eq('id', art.id);
      } else {
        navigate('/help', { replace: true });
      }
    } else {
      setCurrentArticle(null);
    }
  }, [slug, articles]);

  const categories = [...new Set(articles.map(a => a.category))];

  const filtered = articles.filter(a => {
    if (selectedCat !== 'all' && a.category !== selectedCat) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.title?.toLowerCase().includes(q) || a.excerpt?.toLowerCase().includes(q) ||
        a.category?.toLowerCase().includes(q);
    }
    return true;
  });

  const featured = articles.filter(a => a.is_featured);

  const handleHelpful = async (type: 'yes' | 'no') => {
    if (!currentArticle || helpfulVoted) return;
    setHelpfulVoted(type);
    const field = type === 'yes' ? 'helpful_yes' : 'helpful_no';
    const newVal = (currentArticle[field] || 0) + 1;
    await supabase.from('help_articles').update({ [field]: newVal }).eq('id', currentArticle.id);
    setCurrentArticle((prev: any) => ({ ...prev, [field]: newVal }));
    toast.success(type === 'yes' ? '😊 ধন্যবাদ!' : '😕 আমরা উন্নত করার চেষ্টা করব!');
  };

  // ── Article Detail View ─────────────────────────────────────────────────
  if (currentArticle) {
    const catCfg = CATEGORY_CONFIG[currentArticle.category] || CATEGORY_CONFIG['general'];
    const relatedArticles = articles.filter(a => a.category === currentArticle.category && a.id !== currentArticle.id).slice(0, 4);
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "name": currentArticle.seo_title || currentArticle.title,
      "description": currentArticle.seo_description || currentArticle.excerpt,
    };

    return (
      <div className="min-h-screen bg-background text-foreground">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary transition-colors">হোম</Link>
            <ChevronRight size={12} />
            <Link to="/help" className="hover:text-primary transition-colors">Help Center</Link>
            <ChevronRight size={12} />
            <span style={{ color: catCfg.color }}>{catCfg.label}</span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Article */}
            <article className="flex-1 min-w-0">
              <div className="glass-card rounded-2xl p-6 sm:p-8">
                {/* Category badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
                    style={{ background: `${catCfg.color}20`, color: catCfg.color }}>
                    <catCfg.icon size={11} /> {catCfg.label}
                  </span>
                  {currentArticle.is_featured && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500">⭐ Featured</span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-6 leading-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {currentArticle.title}
                </h1>

                {currentArticle.excerpt && (
                  <div className="glass-card rounded-xl px-4 py-3 mb-6 border-l-4" style={{ borderColor: catCfg.color }}>
                    <p className="text-sm text-muted-foreground">{currentArticle.excerpt}</p>
                  </div>
                )}

                {/* Content */}
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(currentArticle.content || '') }} />

                {/* Tags */}
                {currentArticle.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-border">
                    {currentArticle.tags.map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 rounded-lg text-[11px] glass-card border border-border text-muted-foreground">#{tag}</span>
                    ))}
                  </div>
                )}

                {/* Was this helpful? */}
                <div className="mt-8 pt-6 border-t border-border">
                  <p className="text-sm font-semibold text-foreground mb-3">এই আর্টিকেলটি কি সহায়ক ছিল?</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleHelpful('yes')}
                      disabled={!!helpfulVoted}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all disabled:opacity-60 ${
                        helpfulVoted === 'yes' ? 'btn-glow border-transparent' : 'glass-card border-border text-muted-foreground hover:text-primary hover:border-primary/40'
                      }`}
                    >
                      <ThumbsUp size={14} /> হ্যাঁ ({currentArticle.helpful_yes || 0})
                    </button>
                    <button
                      onClick={() => handleHelpful('no')}
                      disabled={!!helpfulVoted}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all disabled:opacity-60 ${
                        helpfulVoted === 'no' ? 'bg-destructive/10 border-destructive/40 text-destructive' : 'glass-card border-border text-muted-foreground hover:text-destructive hover:border-destructive/30'
                      }`}
                    >
                      <ThumbsDown size={14} /> না ({currentArticle.helpful_no || 0})
                    </button>
                    <Link to="/dashboard" className="ml-auto text-xs text-primary hover:underline flex items-center gap-1">
                      সাপোর্ট টিকেট খুলুন <ExternalLink size={11} />
                    </Link>
                  </div>
                </div>
              </div>
            </article>

            {/* Sidebar — related */}
            <aside className="lg:w-64 space-y-5 flex-shrink-0">
              <Link to="/help" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft size={12} /> Help Center
              </Link>
              {relatedArticles.length > 0 && (
                <div className="glass-card rounded-2xl p-5">
                  <h4 className="font-bold text-foreground text-sm mb-3">সম্পর্কিত আর্টিকেল</h4>
                  <ul className="space-y-2">
                    {relatedArticles.map(a => {
                      const cfg = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG['general'];
                      return (
                        <li key={a.id}>
                          <Link to={`/help/${a.slug}`}
                            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-start gap-2 py-1">
                            <ChevronRight size={12} className="mt-0.5 flex-shrink-0" style={{ color: cfg.color }} />
                            {a.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Contact Support */}
              <div className="glass-card rounded-2xl p-5">
                <h4 className="font-semibold text-foreground text-sm mb-2">🆘 আরও সাহায্য দরকার?</h4>
                <p className="text-xs text-muted-foreground mb-3">আমাদের সাপোর্ট টিম সবসময় প্রস্তুত</p>
                <Link to="/dashboard" className="block w-full py-2 rounded-xl btn-glow text-xs font-semibold text-center">
                  সাপোর্ট টিকেট
                </Link>
              </div>
            </aside>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Help Center Index ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Shahed Store Help Center",
        "description": "সাধারণ প্রশ্ন ও সমাধান",
        "url": window.location.origin + "/help",
      })}} />
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-16">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, hsla(185,90%,52%,0.1) 0%, transparent 70%)' }} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold mb-5"
            style={{
              background: 'linear-gradient(135deg, hsl(185,90%,42%), hsl(258,78%,55%))',
              color: '#fff',
              boxShadow: '0 4px 18px hsla(185,90%,42%,0.35), 0 1px 0 rgba(255,255,255,0.2) inset',
            }}>
            <Headphones size={14} /> Software Download Link
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            কিভাবে <span className="gradient-text">সাহায্য</span> করতে পারি?
          </h1>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-sm">
            সাধারণ প্রশ্নের উত্তর এখানে খুঁজে নিন বা সাপোর্ট টিকেট খুলুন
          </p>
          {/* Search */}
          <div className="relative max-w-lg mx-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="যা জানতে চান লিখুন..."
              className="w-full bg-card border border-border rounded-2xl pl-11 pr-5 py-3.5 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">

        {/* ── Software Downloads Section ── */}
        {softwareDownloads.length > 0 && (
          <section className="mb-10">
            <h2 className="font-bold text-foreground flex items-center gap-2 mb-4 text-sm">
              <Download size={14} className="text-primary" /> সফটওয়্যার ডাউনলোড
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {softwareDownloads.map((sw: any) => (
                <a
                  key={sw.id}
                  href={sw.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card rounded-2xl p-4 flex flex-col items-center gap-3 hover:border-primary/30 transition-all hover:-translate-y-1 group"
                >
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                    style={{ background: 'hsla(258,78%,55%,0.07)' }}>
                    {sw.image_url ? (
                      <img src={sw.image_url} alt={sw.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <Download size={24} className="text-primary" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">{sw.name}</p>
                    {sw.description && (
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{sw.description}</p>
                    )}
                  </div>
                  <div className="mt-auto w-full">
                    <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))' }}>
                      <Download size={11} /> ডাউনলোড
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
        {/* Category Cards */}
        {!search && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
            {categories.map(cat => {
              const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['general'];
              const count = articles.filter(a => a.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(selectedCat === cat ? 'all' : cat)}
                  className={`glass-card rounded-2xl p-4 flex flex-col items-center gap-2 transition-all hover:-translate-y-0.5 border ${
                    selectedCat === cat ? 'border-transparent' : 'border-border hover:border-primary/30'
                  }`}
                  style={selectedCat === cat ? { background: `${cfg.color}15`, borderColor: `${cfg.color}40` } : {}}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${cfg.color}20` }}>
                    <cfg.icon size={18} style={{ color: cfg.color }} />
                  </div>
                  <span className="text-xs font-semibold text-foreground">{cfg.label}</span>
                  <span className="text-[10px] text-muted-foreground">{count} আর্টিকেল</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Featured Articles */}
        {!search && selectedCat === 'all' && featured.length > 0 && (
          <section className="mb-8">
            <h2 className="font-bold text-foreground flex items-center gap-2 mb-4 text-sm">
              <Star size={14} className="text-amber-400" /> জনপ্রিয় আর্টিকেল
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {featured.map(a => {
                const cfg = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG['general'];
                return (
                  <Link key={a.id} to={`/help/${a.slug}`}
                    className="glass-card rounded-2xl p-4 hover:border-primary/30 transition-all hover:-translate-y-0.5 group">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${cfg.color}20` }}>
                        <cfg.icon size={15} style={{ color: cfg.color }} />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: cfg.color }}>{cfg.label}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">{a.title}</p>
                    {a.excerpt && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{a.excerpt}</p>}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Articles List */}
        <div>
          {selectedCat !== 'all' && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground text-sm flex items-center gap-2">
                {(() => {
                  const cfg = CATEGORY_CONFIG[selectedCat] || CATEGORY_CONFIG['general'];
                  return <><cfg.icon size={14} style={{ color: cfg.color }} /> {cfg.label}</>;
                })()}
              </h2>
              <button onClick={() => setSelectedCat('all')} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                <ArrowLeft size={11} /> সব দেখুন
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 bg-muted/20 rounded-2xl animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium text-sm">কিছু পাওয়া যায়নি</p>
              {(search || selectedCat !== 'all') && (
                <button onClick={() => { setSearch(''); setSelectedCat('all'); }} className="mt-2 text-xs text-primary hover:underline">
                  রিসেট করুন
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(a => {
                const cfg = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG['general'];
                return (
                  <Link
                    key={a.id}
                    to={`/help/${a.slug}`}
                    className="glass-card rounded-xl px-5 py-4 flex items-center gap-4 hover:border-primary/30 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${cfg.color}15` }}>
                      <cfg.icon size={16} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{a.title}</p>
                      {a.excerpt && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.excerpt}</p>}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5"><ThumbsUp size={10} />{a.helpful_yes || 0}</span>
                      <ChevronRight size={13} className="group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 glass-card rounded-2xl p-8 text-center">
          <Headphones size={36} className="text-primary mx-auto mb-3" />
          <h3 className="font-bold text-foreground text-lg mb-2">উত্তর পাননি?</h3>
          <p className="text-muted-foreground text-sm mb-5">আমাদের সাপোর্ট টিম সাহায্য করতে প্রস্তুত</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/dashboard" className="px-5 py-2.5 rounded-xl btn-glow text-sm font-semibold">
              সাপোর্ট টিকেট খুলুন
            </Link>
            <a href="https://wa.me/8801820060046" target="_blank" rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl glass-card border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 transition-colors text-sm font-semibold flex items-center gap-2">
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HelpCenter;
