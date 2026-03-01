import { useState, useEffect, useRef } from 'react';
import { Search, X, Tag, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  image_url: string | null;
  short_description: string | null;
}

const SearchBar = ({ className = '' }: { className?: string }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const search = async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, original_price, discount_percent, image_url, short_description')
      .eq('status', 'active')
      .or(`name.ilike.%${q}%,short_description.ilike.%${q}%,tags.cs.{${q}}`)
      .order('total_sales', { ascending: false })
      .limit(8);
    setResults(data || []);
    setOpen(true);
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const clear = () => { setQuery(''); setResults([]); setOpen(false); };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="w-full flex">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => query && setOpen(true)}
            placeholder="Search for software, licenses, subscriptions..."
            className="w-full bg-muted/50 border border-border rounded-l-xl pl-4 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          {query && (
            <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => search(query)}
          className="btn-glow px-5 rounded-r-xl text-sm flex items-center gap-2 flex-shrink-0"
        >
          <Search size={16} />
          <span className="hidden lg:inline">Search</span>
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-card border border-primary/20 rounded-2xl shadow-2xl overflow-hidden z-[100]">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-xl bg-muted/60 flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-muted/60 rounded w-3/4" />
                    <div className="h-3 bg-muted/60 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="px-4 pt-3 pb-1 flex items-center gap-2 text-xs text-muted-foreground border-b border-border/40">
                <TrendingUp size={12} />
                <span>{results.length} টি প্রোডাক্ট পাওয়া গেছে</span>
              </div>
              <ul className="max-h-80 overflow-y-auto divide-y divide-border/30">
                {results.map((product) => (
                  <li key={product.id}>
                    <a
                      href={`#product-${product.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-primary/10 transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted/50 flex-shrink-0">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Tag size={18} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary truncate transition-colors">
                          {product.name}
                        </p>
                        {product.short_description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{product.short_description}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-sm font-bold text-primary">৳{product.price}</div>
                        {product.original_price && (
                          <div className="text-xs text-muted-foreground line-through">৳{product.original_price}</div>
                        )}
                        {product.discount_percent && (
                          <div className="text-[10px] bg-accent/20 text-accent rounded px-1">{product.discount_percent}% OFF</div>
                        )}
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <Search size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">"{query}" এর জন্য কোনো প্রোডাক্ট পাওয়া যায়নি</p>
              <p className="text-xs mt-1 opacity-70">অন্য কিওয়ার্ড দিয়ে চেষ্টা করুন</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
