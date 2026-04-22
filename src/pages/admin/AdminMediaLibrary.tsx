import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ImageIcon, Download, Search, Grid, List, ExternalLink, Copy, Check, CheckSquare, Square, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

interface ImageEntry {
  url: string;
  productName: string;
  productId: string;
  isMain: boolean; // whether it's image_url (main) or from images[]
}

const AdminMediaLibrary = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    supabase
      .from('products')
      .select('id, name, slug, image_url, images')
      .order('name')
      .then(({ data }) => {
        setProducts(data || []);
        setLoading(false);
      });
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Collect all images
  const allImages: ImageEntry[] = products.flatMap(p => {
    const imgs: ImageEntry[] = [];
    if (p.image_url) {
      imgs.push({ url: p.image_url, productName: p.name, productId: p.id, isMain: true });
    }
    if (p.images && Array.isArray(p.images)) {
      p.images.forEach((img: string) => {
        if (img && img !== p.image_url) {
          imgs.push({ url: img, productName: p.name, productId: p.id, isMain: false });
        }
      });
    }
    return imgs;
  });

  const filtered = allImages.filter(img =>
    img.productName.toLowerCase().includes(search.toLowerCase())
  );

  const isSelectMode = selectedUrls.size > 0;

  const toggleSelect = (url: string) => {
    setSelectedUrls(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedUrls.size === filtered.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(filtered.map(i => i.url)));
    }
  };

  const clearSelection = () => setSelectedUrls(new Set());

  const handleDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const ext = url.split('.').pop()?.split('?')[0] || 'png';
      a.download = `${name.replace(/[^a-zA-Z0-9-_ ]/g, '')}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      // silent
    }
  };

  const handleBulkDownload = async () => {
    if (selectedUrls.size === 0) return;
    setBulkDownloading(true);
    const urls = Array.from(selectedUrls);
    let done = 0;
    for (const url of urls) {
      const entry = allImages.find(i => i.url === url);
      await handleDownload(url, entry?.productName || 'image');
      done++;
      // small delay to avoid browser blocking
      if (done < urls.length) await new Promise(r => setTimeout(r, 500));
    }
    setBulkDownloading(false);
    toast.success(`${urls.length}টি ছবি ডাউনলোড হয়েছে!`);
    clearSelection();
  };

  const handleBulkDelete = async () => {
    if (selectedUrls.size === 0) return;
    const confirmed = window.confirm(`আপনি কি ${selectedUrls.size}টি ছবি ডিলিট করতে চান? এটি প্রোডাক্ট থেকে ছবিটি সরিয়ে দেবে।`);
    if (!confirmed) return;

    setBulkDeleting(true);
    const urlsToDelete = Array.from(selectedUrls);

    // Group by product
    const productUpdates = new Map<string, { removeUrls: Set<string>; product: any }>();
    for (const url of urlsToDelete) {
      const entry = allImages.find(i => i.url === url);
      if (!entry) continue;
      if (!productUpdates.has(entry.productId)) {
        const product = products.find(p => p.id === entry.productId);
        productUpdates.set(entry.productId, { removeUrls: new Set(), product });
      }
      productUpdates.get(entry.productId)!.removeUrls.add(url);
    }

    // Update each product
    for (const [productId, { removeUrls, product }] of productUpdates) {
      const updates: any = {};
      if (product.image_url && removeUrls.has(product.image_url)) {
        updates.image_url = null;
      }
      if (product.images && Array.isArray(product.images)) {
        const newImages = product.images.filter((img: string) => !removeUrls.has(img));
        updates.images = newImages.length > 0 ? newImages : null;
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from('products').update(updates).eq('id', productId);
      }

      // Try to delete from storage
      for (const url of removeUrls) {
        try {
          const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
          if (match) {
            await supabase.storage.from(match[1]).remove([match[2]]);
          }
        } catch { /* ignore */ }
      }
    }

    setBulkDeleting(false);
    toast.success(`${urlsToDelete.length}টি ছবি ডিলিট হয়েছে!`);
    clearSelection();
    fetchProducts();
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success('URL কপি হয়েছে!');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleImageClick = (url: string) => {
    if (isSelectMode) {
      toggleSelect(url);
    } else {
      setSelectedImage(url);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            মিডিয়া <span className="gradient-text">লাইব্রেরি</span>
          </h1>
          <p className="text-muted-foreground text-sm">সকল প্রোডাক্টের ছবি ব্রাউজ, ডাউনলোড ও ডিলিট করুন</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card px-3 py-2 rounded-xl text-xs flex items-center gap-2">
            <ImageIcon size={14} className="text-primary" />
            <span className="font-bold text-foreground">{filtered.length}</span>
            <span className="text-muted-foreground">টি ছবি</span>
          </div>
        </div>
      </div>

      {/* Selection Bar */}
      {isSelectMode && (
        <div className="glass-card rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap border border-primary/30">
          <div className="flex items-center gap-3">
            <button onClick={clearSelection} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X size={14} />
            </button>
            <span className="text-sm font-medium text-foreground">{selectedUrls.size}টি সিলেক্টেড</span>
            <button onClick={selectAll} className="text-xs text-primary hover:underline">
              {selectedUrls.size === filtered.length ? 'সব অনির্বাচন' : 'সব সিলেক্ট'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDownload}
              disabled={bulkDownloading}
              className="btn-glow px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 disabled:opacity-60"
            >
              {bulkDownloading ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Download size={13} />}
              {bulkDownloading ? 'ডাউনলোড হচ্ছে...' : 'ডাউনলোড করুন'}
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-60"
            >
              {bulkDeleting ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Trash2 size={13} />}
              {bulkDeleting ? 'ডিলিট হচ্ছে...' : 'ডিলিট করুন'}
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="প্রোডাক্ট নাম দিয়ে খুঁজুন…"
            className="w-full bg-background border border-border rounded-xl pl-16 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          {!isSelectMode && (
            <button
              onClick={() => toggleSelect(filtered[0]?.url || '')}
              className="px-3 py-2.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
              title="সিলেক্ট মোড"
            >
              <CheckSquare size={14} /> সিলেক্ট
            </button>
          )}
          <div className="flex glass-card rounded-xl overflow-hidden border border-border">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${viewMode === 'grid' ? 'btn-glow text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Grid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${viewMode === 'list' ? 'btn-glow text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4' : 'space-y-3'}>
          {[...Array(10)].map((_, i) => (
            <div key={i} className={`glass-card rounded-2xl animate-pulse ${viewMode === 'grid' ? 'aspect-square' : 'h-20'}`} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <ImageIcon size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">কোনো ছবি পাওয়া যায়নি</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filtered.map((img, idx) => {
            const isSelected = selectedUrls.has(img.url);
            return (
              <div
                key={idx}
                className={`glass-card rounded-2xl overflow-hidden group cursor-pointer hover:shadow-lg transition-all relative ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                onClick={() => handleImageClick(img.url)}
              >
                {/* Selection checkbox */}
                <div
                  className={`absolute top-2 left-2 z-10 transition-opacity ${isSelectMode || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  onClick={e => { e.stopPropagation(); toggleSelect(img.url); }}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-background/80 border border-border text-muted-foreground hover:text-foreground'}`}>
                    {isSelected ? <Check size={14} /> : <Square size={14} />}
                  </div>
                </div>

                <div className="aspect-square relative bg-muted">
                  <img
                    src={img.url}
                    alt={img.productName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                  {!isSelectMode && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(img.url, img.productName); }}
                        className="w-9 h-9 rounded-xl bg-background/90 text-foreground flex items-center justify-center hover:bg-background transition-colors"
                        title="ডাউনলোড"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopyUrl(img.url); }}
                        className="w-9 h-9 rounded-xl bg-background/90 text-foreground flex items-center justify-center hover:bg-background transition-colors"
                        title="URL কপি"
                      >
                        {copiedUrl === img.url ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-medium text-foreground truncate">{img.productName}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((img, idx) => {
            const isSelected = selectedUrls.has(img.url);
            return (
              <div key={idx} className={`glass-card rounded-xl p-3 flex items-center gap-3 ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                {/* Checkbox */}
                <div
                  className="flex-shrink-0 cursor-pointer"
                  onClick={() => toggleSelect(img.url)}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${isSelected ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:text-foreground'}`}>
                    {isSelected ? <Check size={14} /> : <Square size={14} />}
                  </div>
                </div>
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0 cursor-pointer" onClick={() => handleImageClick(img.url)}>
                  <img
                    src={img.url}
                    alt={img.productName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{img.productName}</p>
                  <p className="text-xs text-muted-foreground truncate">{img.url}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleCopyUrl(img.url)}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="URL কপি"
                  >
                    {copiedUrl === img.url ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                  </button>
                  <button
                    onClick={() => window.open(img.url, '_blank')}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="নতুন ট্যাবে খুলুন"
                  >
                    <ExternalLink size={13} />
                  </button>
                  <button
                    onClick={() => handleDownload(img.url, img.productName)}
                    className="btn-glow px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2"
                  >
                    <Download size={12} /> ডাউনলোড
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <img
              src={selectedImage}
              alt="Preview"
              className="w-full h-auto max-h-[75vh] object-contain rounded-2xl"
            />
            <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
              <button
                onClick={() => handleDownload(selectedImage, 'product-image')}
                className="btn-glow px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
              >
                <Download size={16} /> ডাউনলোড করুন
              </button>
              <button
                onClick={() => handleCopyUrl(selectedImage)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors flex items-center gap-2"
              >
                {copiedUrl === selectedImage ? <Check size={16} /> : <Copy size={16} />} URL কপি
              </button>
              <button
                onClick={() => setSelectedImage(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMediaLibrary;
