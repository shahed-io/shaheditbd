import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Clock, TrendingUp, ChevronRight, ArrowUpLeft, Tag, Flame, Zap, Star } from 'lucide-react';
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
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, 8)));
};
const removeRecent = (q: string) => {
  const prev = getRecent().filter(r => r !== q);
  localStorage.setItem(RECENT_KEY, JSON.stringify(prev));
};

// ── Google-style suggestion item ─────────────────────────────────────
const SuggestionItem = ({
  icon,
  text,
  query,
  rightAction,
  onClick,
  onFill,
  isActive,
}: {
  icon: React.ReactNode;
  text: string;
  query: string;
  rightAction?: React.ReactNode;
  onClick: () => void;
  onFill?: () => void;
  isActive?: boolean;
}) => {
  const highlight = (t: string, q: string) => {
    if (!q.trim()) return <span className="font-medium">{t}</span>;
    const idx = t.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return <span className="font-medium">{t}</span>;
    return (
      <>
        <span className="font-normal">{t.slice(0, idx)}</span>
        <span className="font-bold">{t.slice(idx, idx + q.length)}</span>
        <span className="font-normal">{t.slice(idx + q.length)}</span>
      </>
    );
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group ${
        isActive ? 'bg-muted/70' : 'hover:bg-muted/50'
      }`}
    >
      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-muted-foreground">
        {icon}
      </span>
      <span className="flex-1 text-sm text-foreground truncate">
        {highlight(text, query)}
      </span>
      {onFill && (
        <span
          role="button"
          tabIndex={-1}
          onClick={(e) => { e.stopPropagation(); onFill(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onFill(); } }}
          className="flex-shrink-0 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-muted transition-all cursor-pointer"
          title="সার্চ বক্সে বসান"
        >
          <ArrowUpLeft size={14} className="text-muted-foreground" />
        </span>
      )}
      {rightAction}
    </button>
  );
};

// ── Google-style Product Result Card ─────────────────────────────────
const ProductResultItem = ({
  product,
  query,
  categoryName,
  onClick,
  isActive,
}: {
  product: Product;
  query: string;
  categoryName?: string | null;
  onClick: () => void;
  isActive?: boolean;
}) => {
  const highlight = (t: string, q: string) => {
    if (!q.trim()) return t;
    const idx = t.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return t;
    return (
      <>
        {t.slice(0, idx)}
        <mark className="bg-primary/15 text-primary font-semibold rounded-sm px-0.5 not-italic">{t.slice(idx, idx + q.length)}</mark>
        {t.slice(idx + q.length)}
      </>
    );
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors group ${
        isActive ? 'bg-primary/5' : 'hover:bg-muted/40'
      }`}
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border/50">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Tag size={16} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground group-hover:text-primary truncate transition-colors">
          {highlight(product.name, query)}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {categoryName && (
            <span className="text-[10px] bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded-full">{categoryName}</span>
          )}
          {product.short_description && (
            <p className="text-xs text-muted-foreground truncate">{product.short_description.split('\n')[0]}</p>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="text-sm font-bold text-primary">৳{product.price.toLocaleString()}</div>
        {product.original_price && product.original_price > product.price && (
          <div className="text-[11px] text-muted-foreground line-through">৳{product.original_price.toLocaleString()}</div>
        )}
        {product.discount_percent && product.discount_percent > 0 && (
          <div className="text-[10px] bg-accent/15 text-accent font-bold rounded-full px-1.5 py-0.5 mt-0.5">-{product.discount_percent}%</div>
        )}
      </div>
    </button>
  );
};

// ── Shared search logic hook ─────────────────────────────────────────
const useGoogleSearch = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [didYouMean, setDidYouMean] = useState<string>('');
  const [usedAi, setUsedAi] = useState(false);
  const [recent, setRecent] = useState<string[]>(getRecent());
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  // Cache active product catalog (id+name) for AI fuzzy matching
  const catalogRef = useRef<Array<{ id: string; name: string; category?: string | null }>>([]);
  const aiAbortRef = useRef<AbortController | null>(null);
  const aiCacheRef = useRef<Map<string, { ids: string[]; didYouMean: string }>>(new Map());
  const reqIdRef = useRef(0);

  useEffect(() => {
    supabase.from('categories').select('id, name, slug').eq('is_active', true).order('sort_order').limit(50)
      .then(({ data }) => {
        if (data) {
          setCategories(data.slice(0, 8));
          const map: Record<string, string> = {};
          data.forEach((c: Category) => { map[c.id] = c.name; });
          setCategoryMap(map);
        }
      });

    supabase.from('products').select('id, name, slug, price, original_price, discount_percent, image_url, short_description, category_id, total_sales')
      .eq('status', 'active').order('total_sales', { ascending: false }).limit(6)
      .then(({ data }) => { if (data) setTrendingProducts(data); });

    // Build lightweight catalog for AI fuzzy matching (id + name only)
    supabase.from('products').select('id, name, category_id').eq('status', 'active').limit(600)
      .then(({ data }) => {
        if (data) catalogRef.current = data.map((p: any) => ({ id: p.id, name: p.name, category: p.category_id }));
      });
  }, []);

  // Tokenized DB search: handles partial words & multi-word queries better than a single ilike
  const dbSearch = useCallback(async (q: string) => {
    const tokens = q.split(/\s+/).map(t => t.trim()).filter(t => t.length >= 2).slice(0, 5);
    const orParts: string[] = [`name.ilike.%${q}%`, `short_description.ilike.%${q}%`];
    tokens.forEach(t => {
      const safe = t.replace(/[%,()]/g, '');
      if (safe) {
        orParts.push(`name.ilike.%${safe}%`);
        orParts.push(`short_description.ilike.%${safe}%`);
      }
    });
    const { data } = await supabase.from('products')
      .select('id, name, slug, price, original_price, discount_percent, image_url, short_description, category_id, total_sales')
      .eq('status', 'active')
      .or(orParts.join(','))
      .order('total_sales', { ascending: false })
      .limit(12);
    return (data || []) as unknown as Product[];
  }, []);

  // AI fuzzy match — returns matched products + didYouMean hint
  const aiSearch = useCallback(async (q: string): Promise<{ products: Product[]; didYouMean: string }> => {
    if (!catalogRef.current.length) return { products: [], didYouMean: '' };
    const cacheKey = q.toLowerCase().trim();
    const cached = aiCacheRef.current.get(cacheKey);
    let matchedIds: string[] | null = cached?.ids || null;
    let dym = cached?.didYouMean || '';

    if (!matchedIds) {
      try {
        aiAbortRef.current?.abort();
        const ac = new AbortController();
        aiAbortRef.current = ac;
        const { data, error } = await supabase.functions.invoke('ai-search-match', {
          body: { query: q, products: catalogRef.current },
        });
        if (error || !data) return { products: [], didYouMean: '' };
        matchedIds = Array.isArray(data.matchedIds) ? data.matchedIds : [];
        dym = typeof data.didYouMean === 'string' ? data.didYouMean : '';
        aiCacheRef.current.set(cacheKey, { ids: matchedIds, didYouMean: dym });
      } catch {
        return { products: [], didYouMean: '' };
      }
    }

    if (!matchedIds || matchedIds.length === 0) return { products: [], didYouMean: dym };
    const { data: prods } = await supabase.from('products')
      .select('id, name, slug, price, original_price, discount_percent, image_url, short_description, category_id, total_sales')
      .in('id', matchedIds)
      .eq('status', 'active');
    if (!prods) return { products: [], didYouMean: dym };
    const order = new Map(matchedIds.map((id, i) => [id, i]));
    const sorted = [...prods].sort((a: any, b: any) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
    return { products: sorted as Product[], didYouMean: dym };
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) { setSuggestions([]); setProducts([]); setDidYouMean(''); setUsedAi(false); return; }
    const myReq = ++reqIdRef.current;
    setLoading(true);
    setActiveIdx(-1);
    setDidYouMean('');
    setUsedAi(false);
    try {
      let data: Product[] = await dbSearch(q);
      if (myReq !== reqIdRef.current) return;

      // Show DB results immediately
      const initialNames = new Set<string>();
      const initialSuggestions: string[] = [];
      data.forEach((p: any) => {
        const lower = p.name.toLowerCase();
        if (!initialNames.has(lower)) { initialNames.add(lower); initialSuggestions.push(p.name); }
      });
      setSuggestions(initialSuggestions.slice(0, 5));
      setProducts(data as Product[]);
      setLoading(false);

      // Only run AI fallback when DB returned ZERO matches.
      // If the product exists in our catalog, show it directly — don't pollute with AI fuzzy matches.
      const shouldRunAi = q.trim().length >= 2 && data.length === 0;
      if (shouldRunAi) {
        setAiLoading(true);
        const { products: aiResults, didYouMean: dym } = await aiSearch(q);
        if (myReq !== reqIdRef.current) return;
        if (aiResults.length > 0) {
          const nameSet = new Set<string>();
          const textSuggestions: string[] = [];
          aiResults.forEach((p: any) => {
            const lower = p.name.toLowerCase();
            if (!nameSet.has(lower)) { nameSet.add(lower); textSuggestions.push(p.name); }
          });
          setSuggestions(textSuggestions.slice(0, 5));
          setProducts(aiResults.slice(0, 12));
          setUsedAi(true);
        }
        if (dym && dym.toLowerCase() !== q.toLowerCase().trim()) setDidYouMean(dym);
        setAiLoading(false);
      }
    } catch {
      if (myReq === reqIdRef.current) {
        setSuggestions([]);
        setProducts([]);
        setLoading(false);
        setAiLoading(false);
      }
    }
  }, [dbSearch, aiSearch]);

  const handleChange = (val: string) => {
    setQuery(val);
    setActiveIdx(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setSuggestions([]); setProducts([]); setDidYouMean(''); setUsedAi(false); return; }
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 180);
  };

  const handleSelect = (product: Product, closeFn: () => void) => {
    addRecent(product.name);
    setRecent(getRecent());
    closeFn();
    navigate(`/product/${product.slug}`);
  };

  const handleSubmit = (closeFn: () => void) => {
    if (!query.trim()) return;
    addRecent(query);
    setRecent(getRecent());
    closeFn();
    navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSuggestionSelect = (term: string, closeFn: () => void) => {
    addRecent(term);
    setRecent(getRecent());
    closeFn();
    navigate(`/shop?q=${encodeURIComponent(term)}`);
  };

  const refreshRecent = () => setRecent(getRecent());

  return {
    query, setQuery, suggestions, products, trendingProducts,
    categories, categoryMap, loading, aiLoading, didYouMean, usedAi,
    recent, activeIdx, setActiveIdx,
    handleChange, handleSelect, handleSubmit, handleSuggestionSelect, refreshRecent,
  };
};

// ── Popular search terms ─────────────────────────────────────────────
const POPULAR_SEARCHES = ['Windows 11', 'Office 365', 'Netflix', 'Adobe', 'Antivirus', 'VPN', 'Spotify', 'Canva Pro'];

// ══════════════════════════════════════════════════════════════════════
// DESKTOP: Google-style Command Palette
// ══════════════════════════════════════════════════════════════════════
const DesktopSearchPalette = ({ onClose }: { onClose: () => void }) => {
  const s = useGoogleSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const close = () => onClose();

  // Build the list of interactive items for keyboard navigation
  const allItems: Array<{ type: 'suggestion' | 'recent' | 'popular' | 'product'; value: string; product?: Product }> = [];

  if (s.query.trim()) {
    // Text suggestions first
    s.suggestions.forEach(sg => allItems.push({ type: 'suggestion', value: sg }));
    // Then product results
    s.products.forEach(p => allItems.push({ type: 'product', value: p.name, product: p }));
  } else {
    // Recent searches
    s.recent.forEach(r => allItems.push({ type: 'recent', value: r }));
    // Popular
    POPULAR_SEARCHES.forEach(p => allItems.push({ type: 'popular', value: p }));
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      s.setActiveIdx(i => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      s.setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (s.activeIdx >= 0 && allItems[s.activeIdx]) {
        const item = allItems[s.activeIdx];
        if (item.type === 'product' && item.product) {
          s.handleSelect(item.product, close);
        } else {
          s.handleSuggestionSelect(item.value, close);
        }
      } else {
        s.handleSubmit(close);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const hasQuery = s.query.trim().length > 0;

  return (
    <div className="flex flex-col" style={{ maxHeight: '75vh' }}>
      {/* Google-style search input */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-3 flex-1 rounded-full px-5 py-3 border-2 transition-all duration-200"
          style={{
            borderColor: 'hsl(var(--border))',
            background: 'hsl(var(--background))',
            boxShadow: '0 1px 6px hsla(0,0%,0%,0.08)',
          }}>
          {s.loading
            ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
            : <Search size={18} className="text-muted-foreground flex-shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            value={s.query}
            onChange={(e) => s.handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="প্রোডাক্ট সার্চ করুন..."
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground text-foreground"
          />
          {s.query && (
            <button onClick={() => { s.setQuery(''); s.handleChange(''); inputRef.current?.focus(); }}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted/50">
              <X size={16} />
            </button>
          )}
          <div className="w-px h-6 bg-border mx-1" />
          <button onClick={() => s.handleSubmit(close)}
            className="p-1.5 rounded-full transition-colors hover:bg-primary/10">
            <Search size={18} className="text-primary" />
          </button>
        </div>
      </div>

      {/* Dropdown body */}
      <div className="overflow-y-auto flex-1">
        {/* ─── When no query: show recent + popular ─── */}
        {!hasQuery && (
          <>
            {/* Recent Searches */}
            {s.recent.length > 0 && (
              <div className="py-2">
                <div className="px-5 py-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Clock size={12} /> সাম্প্রতিক সার্চ
                  </span>
                  <button onClick={() => { localStorage.removeItem(RECENT_KEY); s.refreshRecent(); }}
                    className="text-[11px] text-primary hover:underline">সব মুছুন</button>
                </div>
                {s.recent.map((term, idx) => (
                  <SuggestionItem
                    key={term}
                    icon={<Clock size={15} />}
                    text={term}
                    query=""
                    isActive={s.activeIdx === idx}
                    onClick={() => s.handleSuggestionSelect(term, close)}
                    onFill={() => { s.setQuery(term); s.handleChange(term); inputRef.current?.focus(); }}
                    rightAction={
                      <button
                        onClick={(e) => { e.stopPropagation(); removeRecent(term); s.refreshRecent(); }}
                        className="flex-shrink-0 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-destructive transition-all"
                      >
                        <X size={12} />
                      </button>
                    }
                  />
                ))}
              </div>
            )}

            {/* Popular / Trending */}
            <div className="py-2 border-t border-border/30">
              <div className="px-5 py-1.5">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Flame size={12} className="text-primary" /> জনপ্রিয় সার্চ
                </span>
              </div>
              {POPULAR_SEARCHES.map((term, idx) => {
                const itemIdx = s.recent.length + idx;
                return (
                  <SuggestionItem
                    key={term}
                    icon={<TrendingUp size={15} className="text-primary/60" />}
                    text={term}
                    query=""
                    isActive={s.activeIdx === itemIdx}
                    onClick={() => s.handleSuggestionSelect(term, close)}
                    onFill={() => { s.setQuery(term); s.handleChange(term); inputRef.current?.focus(); }}
                  />
                );
              })}
            </div>

            {/* Trending products */}
            {s.trendingProducts.length > 0 && (
              <div className="py-2 border-t border-border/30">
                <div className="px-5 py-1.5">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Star size={12} className="text-primary" /> ট্রেন্ডিং প্রোডাক্ট
                  </span>
                </div>
                {s.trendingProducts.slice(0, 4).map(product => (
                  <ProductResultItem
                    key={product.id}
                    product={product}
                    query=""
                    categoryName={product.category_id ? s.categoryMap[product.category_id] : null}
                    onClick={() => s.handleSelect(product, close)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── When query: show suggestions + products ─── */}
        {hasQuery && !s.loading && (
          <>
            {/* Did-you-mean banner */}
            {(s.didYouMean || s.usedAi) && (
              <div className="px-5 py-2 border-b border-border/30 bg-primary/5 flex items-center gap-2 text-xs">
                <Zap size={12} className="text-primary flex-shrink-0" />
                {s.didYouMean ? (
                  <span className="text-foreground">
                    আপনি কি খুঁজছিলেন{' '}
                    <button
                      onClick={() => { s.setQuery(s.didYouMean); s.handleChange(s.didYouMean); }}
                      className="font-bold text-primary hover:underline"
                    >
                      {s.didYouMean}
                    </button>
                    {' '}?
                  </span>
                ) : (
                  <span className="text-muted-foreground">AI দ্বারা সম্পর্কিত প্রোডাক্ট সাজেস্ট করা হয়েছে</span>
                )}
                {s.aiLoading && <span className="ml-auto text-[10px] text-muted-foreground">AI সার্চ চলছে…</span>}
              </div>
            )}
            {/* Text suggestions (Google-style) */}
            {s.suggestions.length > 0 && (
              <div className="py-1">
                {s.suggestions.map((sg, idx) => (
                  <SuggestionItem
                    key={sg}
                    icon={<Search size={15} className="text-muted-foreground/70" />}
                    text={sg}
                    query={s.query}
                    isActive={s.activeIdx === idx}
                    onClick={() => s.handleSuggestionSelect(sg, close)}
                    onFill={() => { s.setQuery(sg); s.handleChange(sg); inputRef.current?.focus(); }}
                  />
                ))}
              </div>
            )}

            {/* Product results */}
            {s.products.length > 0 && (
              <div className="border-t border-border/30 py-1">
                <div className="px-5 py-1.5">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Tag size={11} /> প্রোডাক্ট
                  </span>
                </div>
                {s.products.slice(0, 5).map((product, idx) => (
                  <ProductResultItem
                    key={product.id}
                    product={product}
                    query={s.query}
                    categoryName={product.category_id ? s.categoryMap[product.category_id] : null}
                    onClick={() => s.handleSelect(product, close)}
                    isActive={s.activeIdx === s.suggestions.length + idx}
                  />
                ))}
              </div>
            )}

            {/* "সব ফলাফল দেখুন" */}
            {s.products.length > 0 && (
              <div className="border-t border-border/30">
                <button onClick={() => s.handleSubmit(close)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted/40"
                  style={{ color: 'hsl(var(--primary))' }}>
                  <Search size={14} />
                  &ldquo;{s.query}&rdquo; এর সব ফলাফল দেখুন
                  <ChevronRight size={14} />
                </button>
              </div>
            )}

            {/* Empty state */}
            {s.products.length === 0 && s.suggestions.length === 0 && (
              <div className="px-5 py-12 text-center">
                <Search size={36} className="mx-auto mb-3 text-muted-foreground opacity-25" />
                <p className="text-sm font-medium text-foreground">কোনো ফলাফল পাওয়া যায়নি</p>
                <p className="text-xs text-muted-foreground mt-1">
                  &ldquo;<span className="text-primary">{s.query}</span>&rdquo; এর জন্য প্রোডাক্ট নেই
                </p>
              </div>
            )}
          </>
        )}

        {/* Loading skeleton */}
        {hasQuery && s.loading && (
          <div className="py-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
                <div className="w-5 h-5 rounded bg-muted flex-shrink-0" />
                <div className="flex-1 h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-2 border-t border-border/40 flex items-center justify-between flex-shrink-0"
        style={{ background: 'hsl(var(--muted)/0.25)' }}>
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-border/60 text-[9px] font-mono bg-background">↑↓</kbd> নেভিগেট</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-border/60 text-[9px] font-mono bg-background">↵</kbd> সিলেক্ট</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-border/60 text-[9px] font-mono bg-background">Esc</kbd> বন্ধ</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Zap size={10} className="text-primary" />
          <span>Google-style Search</span>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// MOBILE: Google-style Full-screen Overlay
// ══════════════════════════════════════════════════════════════════════
const MobileSearchOverlay = ({ onClose }: { onClose: () => void }) => {
  const s = useGoogleSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    setTimeout(() => inputRef.current?.focus(), 100);
    return () => { document.body.style.overflow = ''; };
  }, []);

  const close = () => onClose();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      s.handleSubmit(close);
    } else if (e.key === 'Escape') onClose();
  };

  const hasQuery = s.query.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[998] flex flex-col" style={{ background: 'hsl(var(--background))' }}>
      {/* Top accent line */}
      <div className="h-[3px] w-full flex-shrink-0" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(263,70%,58%))' }} />

      {/* Header: Google-style rounded search bar */}
      <div className="flex-shrink-0 px-3 pt-3 pb-2" style={{ background: 'hsl(var(--card))' }}>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-3 rounded-full border-2 px-4 py-3 transition-all"
            style={{
              borderColor: 'hsl(var(--border))',
              background: 'hsl(var(--background))',
              boxShadow: '0 2px 8px hsla(0,0%,0%,0.06)',
            }}>
            {s.loading
              ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
              : <Search size={18} className="text-muted-foreground flex-shrink-0" />
            }
            <input
              ref={inputRef}
              type="search"
              value={s.query}
              onChange={(e) => s.handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="প্রোডাক্ট সার্চ করুন..."
              className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground text-foreground"
              autoComplete="off"
            />
            {s.query && (
              <button onClick={() => { s.setQuery(''); s.handleChange(''); inputRef.current?.focus(); }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
          <button onClick={onClose}
            className="flex-shrink-0 px-3 py-3 rounded-full text-sm font-bold transition-all"
            style={{ color: 'hsl(var(--primary))' }}>
            বাতিল
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* ─── No query: recent + popular + trending ─── */}
        {!hasQuery && (
          <>
            {s.recent.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Clock size={12} /> সাম্প্রতিক সার্চ
                  </span>
                  <button onClick={() => { localStorage.removeItem(RECENT_KEY); s.refreshRecent(); }}
                    className="text-[11px] text-primary hover:underline">মুছুন</button>
                </div>
                {s.recent.map(term => (
                  <SuggestionItem
                    key={term}
                    icon={<Clock size={15} />}
                    text={term}
                    query=""
                    onClick={() => s.handleSuggestionSelect(term, close)}
                    onFill={() => { s.setQuery(term); s.handleChange(term); inputRef.current?.focus(); }}
                    rightAction={
                      <button
                        onClick={(e) => { e.stopPropagation(); removeRecent(term); s.refreshRecent(); }}
                        className="flex-shrink-0 p-1.5 rounded-full hover:bg-muted text-muted-foreground"
                      >
                        <X size={13} />
                      </button>
                    }
                  />
                ))}
              </div>
            )}

            {/* Popular */}
            <div className="py-2 border-t border-border/30">
              <div className="px-4 py-1.5">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Flame size={12} className="text-primary" /> জনপ্রিয় সার্চ
                </span>
              </div>
              {POPULAR_SEARCHES.map(term => (
                <SuggestionItem
                  key={term}
                  icon={<TrendingUp size={15} className="text-primary/60" />}
                  text={term}
                  query=""
                  onClick={() => s.handleSuggestionSelect(term, close)}
                  onFill={() => { s.setQuery(term); s.handleChange(term); inputRef.current?.focus(); }}
                />
              ))}
            </div>

            {/* Trending products */}
            {s.trendingProducts.length > 0 && (
              <div className="py-2 border-t border-border/30">
                <div className="px-4 py-1.5">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Star size={12} className="text-primary" /> ট্রেন্ডিং প্রোডাক্ট
                  </span>
                </div>
                {s.trendingProducts.slice(0, 4).map(product => (
                  <ProductResultItem
                    key={product.id}
                    product={product}
                    query=""
                    categoryName={product.category_id ? s.categoryMap[product.category_id] : null}
                    onClick={() => s.handleSelect(product, close)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── Has query ─── */}
        {hasQuery && !s.loading && (
          <>
            {/* Did-you-mean banner */}
            {(s.didYouMean || s.usedAi) && (
              <div className="px-4 py-2.5 border-b border-border/30 bg-primary/5 flex items-center gap-2 text-xs">
                <Zap size={12} className="text-primary flex-shrink-0" />
                {s.didYouMean ? (
                  <span className="text-foreground">
                    আপনি কি খুঁজছিলেন{' '}
                    <button
                      onClick={() => { s.setQuery(s.didYouMean); s.handleChange(s.didYouMean); }}
                      className="font-bold text-primary"
                    >
                      {s.didYouMean}
                    </button>
                    {' '}?
                  </span>
                ) : (
                  <span className="text-muted-foreground">AI দ্বারা সম্পর্কিত প্রোডাক্ট সাজেস্ট করা হয়েছে</span>
                )}
                {s.aiLoading && <span className="ml-auto text-[10px] text-muted-foreground">AI…</span>}
              </div>
            )}
            {/* Text suggestions */}
            {s.suggestions.length > 0 && (
              <div className="py-1">
                {s.suggestions.map(sg => (
                  <SuggestionItem
                    key={sg}
                    icon={<Search size={15} className="text-muted-foreground/70" />}
                    text={sg}
                    query={s.query}
                    onClick={() => s.handleSuggestionSelect(sg, close)}
                    onFill={() => { s.setQuery(sg); s.handleChange(sg); inputRef.current?.focus(); }}
                  />
                ))}
              </div>
            )}

            {/* Products */}
            {s.products.length > 0 && (
              <div className="border-t border-border/30 py-1">
                <div className="px-4 py-1.5">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Tag size={11} /> প্রোডাক্ট
                  </span>
                </div>
                {s.products.slice(0, 6).map(product => (
                  <ProductResultItem
                    key={product.id}
                    product={product}
                    query={s.query}
                    categoryName={product.category_id ? s.categoryMap[product.category_id] : null}
                    onClick={() => s.handleSelect(product, close)}
                  />
                ))}
              </div>
            )}

            {/* Empty */}
            {s.products.length === 0 && s.suggestions.length === 0 && (
              <div className="px-4 py-16 text-center">
                <Search size={44} className="mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-base font-semibold text-foreground">কোনো ফলাফল পাওয়া যায়নি</p>
                <p className="text-sm text-muted-foreground mt-1">
                  &ldquo;<span className="font-medium" style={{ color: 'hsl(var(--primary))' }}>{s.query}</span>&rdquo; এর জন্য প্রোডাক্ট নেই
                </p>
              </div>
            )}
          </>
        )}

        {/* Loading */}
        {hasQuery && s.loading && (
          <div className="py-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                <div className="w-5 h-5 rounded bg-muted flex-shrink-0" />
                <div className="flex-1 h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom search button */}
      {hasQuery && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-border/50" style={{ background: 'hsl(var(--card))' }}>
          <button onClick={() => s.handleSubmit(close)}
            className="w-full py-3.5 rounded-full text-base font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(263,70%,58%))', boxShadow: '0 4px 16px hsl(var(--primary)/0.3)' }}>
            <Search size={18} />
            &ldquo;{s.query}&rdquo; সার্চ করুন
          </button>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT: Standalone/Navbar inline search bar
// ══════════════════════════════════════════════════════════════════════
interface SearchBarProps {
  className?: string;
  variant?: 'navbar' | 'standalone';
  onClose?: () => void;
}

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
    debounceRef.current = setTimeout(() => search(val), 220);
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
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && results[activeIdx]) {
        handleSelect(results[activeIdx]);
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

  if (variant === 'standalone') {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <div className="w-full flex gap-2">
          <div className={`relative flex-1 flex items-center gap-2 rounded-full border-2 px-4 py-3 transition-all duration-200 ${
            open ? 'border-primary/30 shadow-[0_2px_12px_hsla(0,0%,0%,0.08)] bg-card' : 'border-border bg-muted/30'
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
              placeholder="প্রোডাক্ট সার্চ করুন..."
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
            className="px-6 py-3 rounded-full text-sm font-semibold text-white flex items-center gap-2 flex-shrink-0 transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(263,70%,58%))' }}
          >
            <Search size={16} />
            <span className="hidden lg:inline">সার্চ</span>
          </button>
        </div>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-[0_8px_40px_hsl(var(--foreground)/0.10)] overflow-hidden z-[200]">
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

  // Navbar variant
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className={`flex items-center gap-2 rounded-full border-2 px-4 py-2.5 transition-all duration-300 ${
        open ? 'border-primary/30 shadow-[0_2px_8px_hsla(0,0%,0%,0.06)] bg-card' : 'border-border bg-secondary'
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
          placeholder="সার্চ করুন..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground min-w-0"
        />
        {query && (
          <button onClick={clear} className="text-muted-foreground hover:text-foreground flex-shrink-0">
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-[0_8px_40px_hsl(var(--foreground)/0.10)] overflow-hidden z-[200]">
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

// ── Compact Dropdown (for standalone/navbar inline variants) ──────────
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
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-5 h-5 rounded bg-muted flex-shrink-0" />
            <div className="flex-1 h-4 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (showRecent && !query) {
    return (
      <div className="py-2">
        <div className="px-4 py-1.5 flex items-center gap-2">
          <Clock size={12} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">সাম্প্রতিক সার্চ</span>
        </div>
        {recent.map(term => (
          <SuggestionItem
            key={term}
            icon={<Clock size={14} />}
            text={term}
            query=""
            onClick={() => onRecentSelect(term)}
          />
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
          &ldquo;<span className="text-primary">{query}</span>&rdquo; এর জন্য কোনো প্রোডাক্ট নেই
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
            <span><span className="font-semibold text-foreground">{results.length}</span> <span><span className="font-semibold text-foreground">{results.length}</span> টি প্রোডাক্ট</span></span>
          </div>
        </div>
        <ul className="max-h-[360px] overflow-y-auto">
          {results.map((product, idx) => (
            <li key={product.id}>
              <ProductResultItem
                product={product}
                query={query}
                categoryName={product.category_id ? categories[product.category_id] : null}
                onClick={() => onSelect(product)}
                isActive={idx === activeIdx}
              />
            </li>
          ))}
        </ul>
      </>
    );
  }

  return null;
};

export { DesktopSearchPalette, MobileSearchOverlay };
export default SearchBar;
