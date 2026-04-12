import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Package, Bell, Settings2, RefreshCw, Check, XCircle, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  stock_quantity: number | null;
  status: string;
  price: number;
  total_sales: number | null;
}

const DEFAULT_THRESHOLD = 5;

const AdminInventoryAlerts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'critical' | 'low' | 'ok'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [tempThreshold, setTempThreshold] = useState(DEFAULT_THRESHOLD);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, image_url, stock_quantity, status, price, total_sales')
      .order('stock_quantity', { ascending: true });
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
    // Load saved threshold
    const saved = localStorage.getItem('inventory_threshold');
    if (saved) {
      const val = parseInt(saved);
      setThreshold(val);
      setTempThreshold(val);
    }
  }, []);

  const saveThreshold = () => {
    setThreshold(tempThreshold);
    localStorage.setItem('inventory_threshold', tempThreshold.toString());
    setShowSettings(false);
    toast.success('থ্রেশহোল্ড সেভ হয়েছে');
  };

  const getStockStatus = (qty: number | null) => {
    if (qty === null || qty === undefined) return 'unknown';
    if (qty <= 0) return 'critical';
    if (qty <= threshold) return 'low';
    return 'ok';
  };

  const statusConfig = {
    critical: { label: 'স্টক আউট', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30', icon: XCircle },
    low: { label: 'স্টক কম', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30', icon: AlertTriangle },
    ok: { label: 'পর্যাপ্ত', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30', icon: Check },
    unknown: { label: 'অজানা', color: 'text-muted-foreground', bg: 'bg-muted/10 border-border', icon: Package },
  };

  const filteredProducts = products.filter(p => {
    const status = getStockStatus(p.stock_quantity);
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || status === filter;
    return matchesSearch && matchesFilter;
  });

  const counts = {
    critical: products.filter(p => getStockStatus(p.stock_quantity) === 'critical').length,
    low: products.filter(p => getStockStatus(p.stock_quantity) === 'low').length,
    ok: products.filter(p => getStockStatus(p.stock_quantity) === 'ok').length,
    total: products.length,
  };

  const handleUpdateStock = async (productId: string, newQty: number) => {
    const { error } = await supabase
      .from('products')
      .update({ stock_quantity: newQty })
      .eq('id', productId);
    if (error) {
      toast.error('আপডেট ব্যর্থ');
    } else {
      toast.success('স্টক আপডেট হয়েছে');
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock_quantity: newQty } : p));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Inventory <span className="gradient-text">Alerts</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">স্টক মনিটরিং ও অ্যালার্ট সিস্টেম</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setTempThreshold(threshold); setShowSettings(true); }}
            className="glass-card px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Settings2 size={15} /> সেটিংস
          </button>
          <button onClick={fetchProducts}
            className="btn-glow px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold">
            <RefreshCw size={15} /> রিফ্রেশ
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'মোট প্রোডাক্ট', value: counts.total, color: 'text-primary', bg: 'bg-primary/10', icon: Package },
          { label: 'স্টক আউট', value: counts.critical, color: 'text-red-400', bg: 'bg-red-400/10', icon: XCircle },
          { label: 'স্টক কম', value: counts.low, color: 'text-amber-400', bg: 'bg-amber-400/10', icon: AlertTriangle },
          { label: 'পর্যাপ্ত স্টক', value: counts.ok, color: 'text-green-400', bg: 'bg-green-400/10', icon: Check },
        ].map(s => (
          <div key={s.label} className="glass-card-hover rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon size={16} className={s.color} />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{loading ? '—' : s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alert Banner */}
      {!loading && counts.critical > 0 && (
        <div className="bg-red-400/10 border border-red-400/30 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-red-400 flex-shrink-0" size={20} />
          <div>
            <p className="text-sm font-semibold text-red-400">⚠️ {counts.critical}টি প্রোডাক্ট স্টক আউট!</p>
            <p className="text-xs text-red-300/70 mt-0.5">এই প্রোডাক্টগুলোর স্টক শেষ হয়ে গেছে। অনুগ্রহ করে রিস্টক করুন।</p>
          </div>
        </div>
      )}

      {/* Filter & Search */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="প্রোডাক্ট সার্চ..."
            className="w-full bg-muted/30 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'critical', 'low', 'ok'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${filter === f ? 'btn-glow' : 'glass-card text-muted-foreground hover:text-foreground'}`}>
              {f === 'all' ? 'সব' : f === 'critical' ? '🔴 আউট' : f === 'low' ? '🟡 কম' : '🟢 পর্যাপ্ত'}
            </button>
          ))}
        </div>
      </div>

      {/* Products List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h3 className="font-semibold text-foreground">ইনভেন্টরি তালিকা ({filteredProducts.length})</h3>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 animate-pulse bg-muted/20 rounded-xl" />)}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            <Package size={32} className="mx-auto mb-3 opacity-30" />
            কোনো প্রোডাক্ট পাওয়া যায়নি
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filteredProducts.map(product => {
              const status = getStockStatus(product.stock_quantity);
              const cfg = statusConfig[status];
              return (
                <div key={product.id} className="flex items-center gap-4 p-4 hover:bg-muted/10 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-muted/20 overflow-hidden flex-shrink-0">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={18} className="text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{product.name}</div>
                    <div className="text-xs text-muted-foreground">৳{product.price} • {product.total_sales || 0} সেল</div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                    <cfg.icon size={12} />
                    {cfg.label}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleUpdateStock(product.id, Math.max(0, (product.stock_quantity || 0) - 1))}
                      className="w-7 h-7 rounded-lg glass-card flex items-center justify-center text-muted-foreground hover:text-foreground text-sm font-bold">−</button>
                    <span className={`text-sm font-bold w-10 text-center ${status === 'critical' ? 'text-red-400' : status === 'low' ? 'text-amber-400' : 'text-foreground'}`}>
                      {product.stock_quantity ?? '—'}
                    </span>
                    <button onClick={() => handleUpdateStock(product.id, (product.stock_quantity || 0) + 1)}
                      className="w-7 h-7 rounded-lg glass-card flex items-center justify-center text-muted-foreground hover:text-foreground text-sm font-bold">+</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">অ্যালার্ট সেটিংস</h2>
              <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">স্টক অ্যালার্ট থ্রেশহোল্ড</label>
                <p className="text-xs text-muted-foreground/70 mb-3">এই সংখ্যার নিচে স্টক হলে "স্টক কম" হিসেবে দেখাবে</p>
                <input type="number" min={1} max={100} value={tempThreshold}
                  onChange={e => setTempThreshold(parseInt(e.target.value) || 1)}
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowSettings(false)} className="flex-1 glass-card py-2.5 rounded-xl text-sm text-muted-foreground">বাতিল</button>
                <button onClick={saveThreshold} className="flex-1 btn-glow py-2.5 rounded-xl text-sm font-semibold">সেভ করুন</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventoryAlerts;
