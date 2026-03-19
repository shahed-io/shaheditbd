import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Tag, TrendingUp, Zap, ArrowRight, Clock, Flame, Star, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  image_url: string | null;
  short_description: string | null;
  category_id: string | null;
  total_sales?: number | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const RECENT_KEY = 'shahed_recent_searches';

const getRecent = (): string[] => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
};
const addRecent = (q: string) => {
  const prev = getRecent().filter(r => r !== q);
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, 6)));
};

interface SearchBarProps {
  className?: string;
  variant?: 'navbar' | 'standalone';
  onClose?: () => void;
}

// ── Desktop Command Palette ─────────────────────────────────────────
const DesktopSearchPalette = ({ onClose }: { onClose: () => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>(getRecent());
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();

    // Load categories
    supabase.from('categories').select('id, name, slug').eq('is_active', true).order('sort_order').limit(8)
      .then(({ data }) => {
        if (data) {
          setCategories(data);
          const map: Record<string, string> = {};
          data.forEach((c: Category) => { map[c.id] = c.name; });
          setCategoryMap(map);
        }
      });

    // Load trending products
    supabase.from('products').select('id, name, slug, price, original_price, discount_percent, image_url, short_description, category_id, total_sales')
      .eq('status', 'active').order('total_sales', { ascending: false }).limit(6)
      .then(({ data }) => { if (data) setTrendingProducts(data); });
  }, []);

  const search = useCallback(async (q: string, catId?: string | null) => {
    if (!q.trim() && !catId) { setResults([]); return; }
    setLoading(true);
    setActiveIdx(-1);
    try {
      let qb = supabase.from('products')
        .select('id, name, slug, price, original_price, discount_percent, image_url, short_description, category_id, total_sales')
        .eq('status', 'active');
      if (q.trim()) qb = qb.or(`name.ilike.%${q}%,short_description.ilike.%${q}%`);
      if (catId) qb = qb.eq('category_id', catId);
      const { data } = await qb.order('total_sales', { ascending: false }).limit(8);
      setResults(data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setActiveCategory(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(() => search(val, null), 250);
  };

  const handleCategoryFilter = (cat: Category) => {
    setActiveCategory(cat.id === activeCategory ? null : cat.id);
    const newCat = cat.id === activeCategory ? null : cat.id;
    search(query, newCat);
  };

  const handleSelect = (product: Product) => {
    addRecent(product.name);
    setRecent(getRecent());
    onClose();
    navigate(`/product/${product.slug}`);
  };

  const handleRecentSelect = (term: string) => {
    setQuery(term);
    search(term, null);
  };

  const handleSubmit = () => {
    if (!query.trim()) return;
    addRecent(query);
    onClose();
    navigate(`/shop?q=${encodeURIComponent(query.trim())}${activeCategory ? `&category_id=${activeCategory}` : ''}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = results.length ? results : trendingProducts;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && items[activeIdx]) handleSelect(items[activeIdx]);
      else handleSubmit();
    } else if (e.key === 'Escape') onClose();
  };

  const highlight = (text: string, q: string) => {
    if (!q.trim()) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-primary/20 text-primary font-semibold rounded-sm px-0.5 not-italic">{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  const showRecent = !query.trim() && recent.length > 0;
  const showTrending = !query.trim() && !activeCategory;
  const showResults = results.length > 0 || loading;
  const displayProducts = results.length > 0 ? results : (activeCategory ? [] : trendingProducts);

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60">
        <div className="flex items-center gap-3 flex-1 rounded-2xl px-4 py-3 border-2 transition-all duration-200"
          style={{ borderColor: 'hsl(var(--primary))', background: 'hsl(var(--background))', boxShadow: '0 0 0 4px hsl(var(--primary)/0.08)' }}>
          {loading
            ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
            : <Search size={18} className="text-primary flex-shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="প্রোডাক্ট, সফটওয়্যার, লাইসেন্স খুঁজুন..."
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground text-foreground"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setActiveCategory(null); inputRef.current?.focus(); }}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-lg hover:bg-muted/50">
              <X size={15} />
            </button>
          )}
        </div>
        <button onClick={handleSubmit} disabled={!query.trim()}
          className="px-5 py-3 rounded-2xl text-sm font-bold text-white flex items-center gap-2 flex-shrink-0 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(263,70%,58%))', boxShadow: '0 4px 16px hsl(var(--primary)/0.35)' }}>
          <Search size={16} /> খুঁজুন
        </button>
      </div>

      {/* Category Quick Filters */}
      {categories.length > 0 && (
        <div className="px-5 py-3 border-b border-border/40 flex items-center gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex-shrink-0 mr-1">ক্যাটাগরি:</span>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryFilter(cat)}
              className="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all"
              style={{
                borderColor: activeCategory === cat.id ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                background: activeCategory === cat.id ? 'hsl(var(--primary)/0.12)' : 'hsl(var(--muted)/0.40)',
                color: activeCategory === cat.id ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              }}>
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Recent + Results */}
        <div className="flex-1 overflow-y-auto">
          {/* Recent Searches */}
          {showRecent && !activeCategory && (
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2 px-2 mb-2">
                <Clock size={12} className="text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">সাম্প্রতিক সার্চ</span>
                <button onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]); }}
                  className="ml-auto text-[10px] text-muted-foreground hover:text-destructive transition-colors">মুছুন</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map(term => (
                  <button key={term} onClick={() => handleRecentSelect(term)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all text-sm text-foreground group">
                    <Clock size={11} className="text-muted-foreground" />
                    {term}
                    <ChevronRight size={11} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results Header */}
          {(showResults || activeCategory) && (
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {loading ? (
                  <span className="text-xs text-muted-foreground">খোঁজা হচ্ছে...</span>
                ) : (
                  <>
                    <TrendingUp size={11} />
                    <span><span className="font-semibold text-foreground">{results.length}</span> টি ফলাফল</span>
                  </>
                )}
              </div>
              {query && !loading && (
                <button onClick={handleSubmit}
                  className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
                  সব দেখুন <ChevronRight size={11} />
                </button>
              )}
              {!query && !loading && (
                <div className="flex items-center gap-1 text-xs text-primary font-medium">
                  <Flame size={11} /> Trending
                </div>
              )}
            </div>
          )}

          {/* Product List */}
          {!loading && (
            <ul className="px-2 pb-3 space-y-0.5">
              {displayProducts.map((product, idx) => {
                const catName = product.category_id ? categoryMap[product.category_id] : null;
                const isActive = idx === activeIdx;
                return (
                  <li key={product.id}>
                    <button
                      onClick={() => handleSelect(product)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group text-left ${isActive ? 'bg-primary/8' : 'hover:bg-muted/50'}`}
                      onMouseEnter={() => setActiveIdx(idx)}
                    >
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border/50">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tag size={18} className="text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary truncate transition-colors leading-snug">
                          {highlight(product.name, query)}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {catName && (
                            <span className="text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                              {catName}
                            </span>
                          )}
                          {product.short_description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {product.short_description.split('\n')[0]}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex-shrink-0 text-right space-y-0.5">
                        <div className="text-sm font-bold text-primary">৳{product.price.toLocaleString()}</div>
                        {product.original_price && product.original_price > product.price && (
                          <div className="text-[11px] text-muted-foreground line-through">৳{product.original_price.toLocaleString()}</div>
                        )}
                        {product.discount_percent && product.discount_percent > 0 && (
                          <div className="text-[10px] bg-accent/15 text-accent font-bold rounded-full px-1.5 py-0.5">
                            -{product.discount_percent}%
                          </div>
                        )}
                      </div>

                      <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </button>
                  </li>
                );
              })}

              {/* Empty State */}
              {!loading && query.trim() && results.length === 0 && (
                <li className="px-3 py-10 text-center">
                  <Search size={36} className="mx-auto mb-3 text-muted-foreground opacity-25" />
                  <p className="text-sm font-medium text-foreground">কোনো ফলাফল পাওয়া যায়নি</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    "<span className="text-primary">{query}</span>" এর জন্য প্রোডাক্ট নেই
                  </p>
                </li>
              )}

              {/* Trending Placeholder */}
              {!query.trim() && !activeCategory && trendingProducts.length === 0 && !loading && (
                <li className="px-3 py-8 text-center">
                  <p className="text-xs text-muted-foreground">ট্রেন্ডিং প্রোডাক্ট লোড হচ্ছে...</p>
                </li>
              )}
            </ul>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="px-4 py-3 space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex gap-3 animate-pulse px-2 py-2">
                  <div className="w-12 h-12 rounded-xl bg-muted flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3.5 bg-muted rounded-lg w-3/4" />
                    <div className="h-2.5 bg-muted rounded-lg w-1/2" />
                  </div>
                  <div className="w-16 space-y-2 pt-1">
                    <div className="h-3.5 bg-muted rounded-lg" />
                    <div className="h-2.5 bg-muted rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Trending Tags / Quick Links */}
        <div className="w-52 flex-shrink-0 border-l border-border/50 overflow-y-auto p-4 space-y-5 hidden xl:block">
          {/* Popular Tags */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Flame size={12} className="text-primary" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">জনপ্রিয় সার্চ</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['Windows 11', 'Office 365', 'Netflix', 'Adobe', 'Antivirus', 'VPN', 'Spotify', 'Canva Pro'].map(tag => (
                <button key={tag}
                  onClick={() => { setQuery(tag); search(tag, null); }}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-border/60 hover:border-primary/50 hover:bg-primary/8 hover:text-primary transition-all text-muted-foreground">
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Top Categories */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Star size={12} className="text-primary" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ক্যাটাগরি</span>
            </div>
            <div className="space-y-1">
              {categories.slice(0, 6).map(cat => (
                <button key={cat.id}
                  onClick={() => { navigate(`/shop?category=${cat.slug}`); onClose(); }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left hover:bg-muted/50 transition-colors group">
                  <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">{cat.name}</span>
                  <ChevronRight size={11} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
              <button onClick={() => { navigate('/shop'); onClose(); }}
                className="w-full flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs text-primary font-semibold hover:bg-primary/8 transition-colors">
                সব ক্যাটাগরি <ChevronRight size={11} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-border/40 flex items-center justify-between flex-shrink-0"
        style={{ background: 'hsl(var(--muted)/0.30)' }}>
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-border/60 text-[9px] font-mono bg-background">↑↓</kbd> নেভিগেট</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-border/60 text-[9px] font-mono bg-background">↵</kbd> সিলেক্ট</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-border/60 text-[9px] font-mono bg-background">Esc</kbd> বন্ধ</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Zap size={10} className="text-primary" />
          <span>Live Search</span>
        </div>
      </div>
    </div>
  );
};

const SearchBar = ({ className = '', variant = 'standalone', onClose }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    supabase.from('categories').select('id, name').eq('is_active', true).then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((c: Category) => { map[c.id] = c.name; });
        setCategories(map);
      }
    });
    setRecent(getRecent());
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(true); return; }
    setLoading(true);
    setActiveIdx(-1);
    try {
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, price, original_price, discount_percent, image_url, short_description, category_id')
        .eq('status', 'active')
        .or(`name.ilike.%${q}%,short_description.ilike.%${q}%`)
        .order('total_sales', { ascending: false })
        .limit(7);
      setResults(data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      setOpen(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(() => search(val), 280);
  };

  const handleSelect = (product: Product) => {
    addRecent(product.name);
    setRecent(getRecent());
    setOpen(false);
    setQuery('');
    onClose?.();
    navigate(`/product/${product.slug}`);
  };

  const handleRecentSelect = (term: string) => {
    setQuery(term);
    search(term);
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    const items = results;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && items[activeIdx]) {
        handleSelect(items[activeIdx]);
      } else if (query.trim()) {
        addRecent(query);
        setRecent(getRecent());
        setOpen(false);
        setQuery('');
        onClose?.();
        navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIdx(-1);
      inputRef.current?.blur();
    }
  };

  const showRecent = !query.trim() && recent.length > 0;
  const showEmpty = !loading && query.trim() && results.length === 0;
  const showResults = !loading && results.length > 0;

  // Mobile / standalone variant — compact dropdown
  if (variant === 'standalone') {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <div className="w-full flex gap-2">
          <div className={`relative flex-1 flex items-center gap-2 rounded-xl border-2 px-4 py-3 transition-all duration-200 ${
            open ? 'border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.1)] bg-card' : 'border-border bg-muted/30'
          }`}>
            {loading
              ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
              : <Search size={16} className="text-muted-foreground flex-shrink-0" />
            }
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleChange}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search for software, licenses, subscriptions..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
            />
            {query && (
              <button onClick={clear} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => { if (query.trim()) { addRecent(query); search(query); } }}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2 flex-shrink-0 transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(263,70%,58%))' }}
          >
            <Search size={16} />
            <span className="hidden lg:inline">Search</span>
          </button>
        </div>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-[0_8px_40px_hsl(var(--foreground)/0.12)] overflow-hidden z-[200]">
            <CompactDropdown
              query={query} results={results} loading={loading} activeIdx={activeIdx}
              recent={recent} showRecent={showRecent} showEmpty={showEmpty}
              showResults={showResults} categories={categories}
              onSelect={handleSelect} onRecentSelect={handleRecentSelect}
            />
          </div>
        )}
      </div>
    );
  }

  // Navbar variant (mobile only)
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className={`flex items-center gap-2 rounded-2xl border-2 px-4 py-2.5 transition-all duration-300 ${
        open ? 'border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] bg-card' : 'border-border bg-secondary'
      }`}>
        {loading
          ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
          : <Search size={16} className="text-muted-foreground flex-shrink-0" />
        }
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search software, licenses…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground min-w-0"
        />
        {query && (
          <button onClick={clear} className="text-muted-foreground hover:text-foreground flex-shrink-0">
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-[0_8px_40px_hsl(var(--foreground)/0.12)] overflow-hidden z-[200]">
          <CompactDropdown
            query={query} results={results} loading={loading} activeIdx={activeIdx}
            recent={recent} showRecent={showRecent} showEmpty={showEmpty}
            showResults={showResults} categories={categories}
            onSelect={handleSelect} onRecentSelect={handleRecentSelect}
          />
        </div>
      )}
    </div>
  );
};

// ── Compact Dropdown (mobile/standalone) ──────────────────────────────
const CompactDropdown = ({
  query, results, loading, activeIdx, recent,
  showRecent, showEmpty, showResults, categories,
  onSelect, onRecentSelect,
}: {
  query: string; results: Product[]; loading: boolean; activeIdx: number;
  recent: string[]; showRecent: boolean; showEmpty: boolean;
  showResults: boolean; categories: Record<string, string>;
  onSelect: (p: Product) => void; onRecentSelect: (term: string) => void;
}) => {
  const highlight = (text: string, q: string) => {
    if (!q.trim()) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-primary/15 text-primary font-semibold rounded-sm px-0.5 not-italic">{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-11 h-11 rounded-xl bg-muted flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 bg-muted rounded w-3/4" />
              <div className="h-2.5 bg-muted rounded w-1/2" />
            </div>
            <div className="w-14 space-y-2 pt-1">
              <div className="h-3 bg-muted rounded" />
              <div className="h-2.5 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (showRecent && !query) {
    return (
      <div className="p-3">
        <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
          <Clock size={12} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">সাম্প্রতিক সার্চ</span>
        </div>
        {recent.map(term => (
          <button key={term} onClick={() => onRecentSelect(term)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted/60 transition-colors text-left group">
            <Clock size={14} className="text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-foreground flex-1 truncate">{term}</span>
            <ArrowRight size={13} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    );
  }

  if (showEmpty) {
    return (
      <div className="px-4 py-10 text-center">
        <Search size={32} className="mx-auto mb-3 text-muted-foreground opacity-30" />
        <p className="text-sm font-medium text-foreground">কোনো ফলাফল পাওয়া যায়নি</p>
        <p className="text-xs text-muted-foreground mt-1">
          "<span className="text-primary">{query}</span>" এর জন্য কোনো প্রোডাক্ট নেই
        </p>
      </div>
    );
  }

  if (showResults) {
    return (
      <>
        <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp size={11} />
            <span><span className="font-semibold text-foreground">{results.length}</span> টি প্রোডাক্ট</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-primary font-medium">
            <Zap size={10} />
            <span>Live results</span>
          </div>
        </div>
        <ul className="max-h-[360px] overflow-y-auto">
          {results.map((product, idx) => {
            const catName = product.category_id ? categories[product.category_id] : null;
            return (
              <li key={product.id}>
                <button onClick={() => onSelect(product)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors group text-left ${idx === activeIdx ? 'bg-primary/8' : ''}`}>
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border/50">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Tag size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary truncate transition-colors leading-snug">
                      {highlight(product.name, query)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {catName && <span className="text-[10px] bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded-full">{catName}</span>}
                      {product.short_description && <p className="text-xs text-muted-foreground truncate">{product.short_description}</p>}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-bold text-primary">৳{product.price}</div>
                    {product.original_price && product.original_price > product.price && (
                      <div className="text-[11px] text-muted-foreground line-through">৳{product.original_price}</div>
                    )}
                    {product.discount_percent && product.discount_percent > 0 && (
                      <div className="text-[10px] bg-accent/15 text-accent font-semibold rounded px-1.5 py-0.5 mt-0.5">-{product.discount_percent}%</div>
                    )}
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </button>
              </li>
            );
          })}
        </ul>
      </>
    );
  }

  return null;
};

// ── Mobile Search Overlay (full-screen, touch-optimised) ─────────────
export const MobileSearchOverlay = ({ onClose }: { onClose: () => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>(getRecent());
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    setTimeout(() => inputRef.current?.focus(), 100);
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Load initial data
  useEffect(() => {
    supabase.from('categories').select('id, name, slug').eq('is_active', true).order('sort_order').limit(8)
      .then(({ data }) => {
        if (data) {
          setCategories(data);
          const map: Record<string, string> = {};
          data.forEach((c: Category) => { map[c.id] = c.name; });
          setCategoryMap(map);
        }
      });
    supabase.from('products').select('id, name, slug, price, original_price, discount_percent, image_url, short_description, category_id, total_sales')
      .eq('status', 'active').order('total_sales', { ascending: false }).limit(6)
      .then(({ data }) => { if (data) setTrendingProducts(data); });
  }, []);

  // Fast autocomplete suggestions (name only, lightweight)
  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 1) { setSuggestions([]); setShowSuggestions(false); return; }
    setSuggestionLoading(true);
    try {
      const { data } = await supabase.from('products')
        .select('id, name, slug, price, original_price, discount_percent, image_url, short_description, category_id')
        .eq('status', 'active')
        .ilike('name', `%${q}%`)
        .order('total_sales', { ascending: false })
        .limit(6);
      setSuggestions(data || []);
      setShowSuggestions(true);
    } finally { setSuggestionLoading(false); }
  }, []);

  const search = useCallback(async (q: string, catId?: string | null) => {
    if (!q.trim() && !catId) { setResults([]); return; }
    setLoading(true);
    setShowSuggestions(false);
    try {
      let qb = supabase.from('products')
        .select('id, name, slug, price, original_price, discount_percent, image_url, short_description, category_id, total_sales')
        .eq('status', 'active');
      if (q.trim()) qb = qb.or(`name.ilike.%${q}%,short_description.ilike.%${q}%`);
      if (catId) qb = qb.eq('category_id', catId);
      const { data } = await qb.order('total_sales', { ascending: false }).limit(10);
      setResults(data || []);
    } finally { setLoading(false); }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setActiveCategory(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(() => search(val, null), 250);
  };

  const handleCategoryFilter = (cat: Category) => {
    const newCat = cat.id === activeCategory ? null : cat.id;
    setActiveCategory(newCat);
    // Only filter results — do NOT navigate to category page
    search(query, newCat);
  };

  const handleSelect = (product: Product) => {
    addRecent(product.name);
    onClose();
    // Always go directly to product detail page
    navigate(`/product/${product.slug}`);
  };

  const handleSubmit = () => {
    if (!query.trim() && !activeCategory) return;
    if (query.trim()) addRecent(query);
    onClose();
    navigate(`/shop?q=${encodeURIComponent(query.trim())}${activeCategory ? `&category_id=${activeCategory}` : ''}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') onClose();
  };

  const highlight = (text: string, q: string) => {
    if (!q.trim()) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-primary/20 text-primary font-semibold rounded-sm px-0.5 not-italic">{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  const displayProducts = results.length > 0 ? results : (activeCategory ? [] : trendingProducts);
  const showRecent = !query.trim() && !activeCategory && recent.length > 0;

  return (
    <div className="fixed inset-0 z-[998] flex flex-col sm:hidden" style={{ background: 'hsl(var(--background))' }}>
      {/* Gradient top accent */}
      <div className="h-[3px] w-full flex-shrink-0" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(263,70%,58%))' }} />

      {/* Header with input */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-border/50"
        style={{ background: 'hsl(var(--card))' }}>
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 transition-all"
            style={{ borderColor: 'hsl(var(--primary))', background: 'hsl(var(--background))', boxShadow: '0 0 0 4px hsl(var(--primary)/0.08)' }}>
            {loading
              ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
              : <Search size={18} className="text-primary flex-shrink-0" />
            }
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="প্রোডাক্ট খুঁজুন..."
              className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground text-foreground"
              autoComplete="off"
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
          {/* Cancel button */}
          <button onClick={onClose}
            className="flex-shrink-0 px-4 py-3 rounded-2xl text-sm font-bold transition-all"
            style={{ color: 'hsl(var(--primary))', background: 'hsl(var(--primary)/0.08)' }}>
            বাতিল
          </button>
        </div>

        {/* Category pill filters */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-none pb-1">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => handleCategoryFilter(cat)}
                className="flex-shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all"
                style={{
                  borderColor: activeCategory === cat.id ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  background: activeCategory === cat.id ? 'hsl(var(--primary)/0.12)' : 'hsl(var(--muted)/0.50)',
                  color: activeCategory === cat.id ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                }}>
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto overscroll-contain">

        {/* Recent searches */}
        {showRecent && (
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={13} className="text-muted-foreground" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">সাম্প্রতিক সার্চ</span>
              <button onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]); }}
                className="ml-auto text-xs font-medium transition-colors"
                style={{ color: 'hsl(var(--primary))' }}>
                মুছুন
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recent.map(term => (
                <button key={term}
                  onClick={() => { setQuery(term); search(term, null); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all text-sm text-foreground">
                  <Clock size={12} className="text-muted-foreground" />
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results / Trending section label */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          {query.trim() ? (
            loading ? (
              <span className="text-xs text-muted-foreground">খোঁজা হচ্ছে...</span>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp size={12} />
                <span><span className="font-semibold text-foreground">{results.length}</span> টি ফলাফল</span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <Flame size={12} className="text-primary" /> ট্রেন্ডিং প্রোডাক্ট
            </div>
          )}
          {query.trim() && !loading && results.length > 0 && (
            <button onClick={handleSubmit}
              className="text-xs font-semibold flex items-center gap-1"
              style={{ color: 'hsl(var(--primary))' }}>
              সব দেখুন <ChevronRight size={12} />
            </button>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="px-4 space-y-2 pb-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-16 h-16 rounded-2xl bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-2">
                  <div className="h-4 bg-muted rounded-lg w-3/4" />
                  <div className="h-3 bg-muted rounded-lg w-1/2" />
                  <div className="h-3 bg-muted rounded-lg w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Product list */}
        {!loading && displayProducts.length > 0 && (
          <ul className="px-3 pb-6 space-y-1">
            {displayProducts.map(product => {
              const catName = product.category_id ? categoryMap[product.category_id] : null;
              return (
                <li key={product.id}>
                  {/* Tap → goes directly to product detail page */}
                  <button onClick={() => handleSelect(product)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-primary/5 active:bg-primary/10 transition-colors group text-left">
                    {/* Image */}
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted flex-shrink-0 border border-border/50">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Tag size={20} />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary truncate transition-colors leading-snug">
                        {highlight(product.name, query)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {catName && (
                          <span className="inline-block text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                            {catName}
                          </span>
                        )}
                        {query.trim() && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Zap size={9} className="text-primary" /> লাইভ
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Price */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-base font-bold" style={{ color: 'hsl(var(--primary))' }}>৳{product.price.toLocaleString()}</div>
                      {product.original_price && product.original_price > product.price && (
                        <div className="text-xs text-muted-foreground line-through">৳{product.original_price.toLocaleString()}</div>
                      )}
                      {product.discount_percent && product.discount_percent > 0 && (
                        <div className="text-[10px] bg-accent/15 text-accent font-bold rounded-full px-2 py-0.5 mt-0.5">-{product.discount_percent}%</div>
                      )}
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Empty state */}
        {!loading && query.trim() && results.length === 0 && (
          <div className="px-4 py-16 text-center">
            <Search size={44} className="mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-base font-semibold text-foreground">কোনো ফলাফল পাওয়া যায়নি</p>
            <p className="text-sm text-muted-foreground mt-1">
              "<span className="font-medium" style={{ color: 'hsl(var(--primary))' }}>{query}</span>" এর জন্য প্রোডাক্ট নেই
            </p>
          </div>
        )}
      </div>

      {/* Bottom search button */}
      {query.trim() && (
        <div className="flex-shrink-0 px-4 py-4 border-t border-border/50"
          style={{ background: 'hsl(var(--card))' }}>
          <button onClick={handleSubmit}
            className="w-full py-4 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(263,70%,58%))', boxShadow: '0 6px 20px hsl(var(--primary)/0.35)' }}>
            <Search size={18} />
            "{query}" খুঁজুন
          </button>
        </div>
      )}
    </div>
  );
};

export { DesktopSearchPalette };
export default SearchBar;

