import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Tag, TrendingUp, Zap, ArrowRight, Clock } from 'lucide-react';
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
}

interface Category {
  id: string;
  name: string;
}

const RECENT_KEY = 'shahed_recent_searches';

const getRecent = (): string[] => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
};
const addRecent = (q: string) => {
  const prev = getRecent().filter(r => r !== q);
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, 5)));
};

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

  // Load categories for badge display
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

  // Keyboard navigation
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

  if (variant === 'navbar') {
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
            <SearchDropdown
              query={query}
              results={results}
              loading={loading}
              activeIdx={activeIdx}
              recent={recent}
              showRecent={showRecent}
              showEmpty={showEmpty}
              showResults={showResults}
              categories={categories}
              onSelect={handleSelect}
              onRecentSelect={handleRecentSelect}
            />
          </div>
        )}
      </div>
    );
  }

  // Standalone variant
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
          <SearchDropdown
            query={query}
            results={results}
            loading={loading}
            activeIdx={activeIdx}
            recent={recent}
            showRecent={showRecent}
            showEmpty={showEmpty}
            showResults={showResults}
            categories={categories}
            onSelect={handleSelect}
            onRecentSelect={handleRecentSelect}
          />
        </div>
      )}
    </div>
  );
};

// ── Shared Dropdown UI ──────────────────────────────────────────────
const SearchDropdown = ({
  query, results, loading, activeIdx, recent,
  showRecent, showEmpty, showResults, categories,
  onSelect, onRecentSelect,
}: {
  query: string;
  results: Product[];
  loading: boolean;
  activeIdx: number;
  recent: string[];
  showRecent: boolean;
  showEmpty: boolean;
  showResults: boolean;
  categories: Record<string, string>;
  onSelect: (p: Product) => void;
  onRecentSelect: (term: string) => void;
}) => {
  // Highlight matching text
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
          <button
            key={term}
            onClick={() => onRecentSelect(term)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted/60 transition-colors text-left group"
          >
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
        <p className="text-xs text-muted-foreground mt-0.5">অন্য কীওয়ার্ড ব্যবহার করুন</p>
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
                <button
                  onClick={() => onSelect(product)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors group text-left ${
                    idx === activeIdx ? 'bg-primary/8' : ''
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border/50">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Tag size={16} />
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
                        <span className="text-[10px] bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded-full">
                          {catName}
                        </span>
                      )}
                      {product.short_description && (
                        <p className="text-xs text-muted-foreground truncate">{product.short_description}</p>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-bold text-primary">৳{product.price}</div>
                    {product.original_price && product.original_price > product.price && (
                      <div className="text-[11px] text-muted-foreground line-through">৳{product.original_price}</div>
                    )}
                    {product.discount_percent && product.discount_percent > 0 && (
                      <div className="text-[10px] bg-accent/15 text-accent font-semibold rounded px-1.5 py-0.5 mt-0.5">
                        -{product.discount_percent}%
                      </div>
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

export default SearchBar;
