import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ImageIcon, Download, Search, Grid, List, ExternalLink, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface MediaItem {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  images: string[] | null;
}

const AdminMediaLibrary = () => {
  const [products, setProducts] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('products')
      .select('id, name, slug, image_url, images')
      .order('name')
      .then(({ data }) => {
        setProducts(data || []);
        setLoading(false);
      });
  }, []);

  // Collect all images from all products
  const allImages = products.flatMap(p => {
    const imgs: { url: string; productName: string; productSlug: string }[] = [];
    if (p.image_url) {
      imgs.push({ url: p.image_url, productName: p.name, productSlug: p.slug });
    }
    if (p.images && Array.isArray(p.images)) {
      p.images.forEach(img => {
        if (img && img !== p.image_url) {
          imgs.push({ url: img, productName: p.name, productSlug: p.slug });
        }
      });
    }
    return imgs;
  });

  const filtered = allImages.filter(img =>
    img.productName.toLowerCase().includes(search.toLowerCase())
  );

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
      toast.success('ডাউনলোড শুরু হয়েছে!');
    } catch {
      toast.error('ডাউনলোড ব্যর্থ হয়েছে');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success('URL কপি হয়েছে!');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            মিডিয়া <span className="gradient-text">লাইব্রেরি</span>
          </h1>
          <p className="text-muted-foreground text-sm">সকল প্রোডাক্টের ছবি ব্রাউজ ও ডাউনলোড করুন</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card px-3 py-2 rounded-xl text-xs flex items-center gap-2">
            <ImageIcon size={14} className="text-primary" />
            <span className="font-bold text-foreground">{filtered.length}</span>
            <span className="text-muted-foreground">টি ছবি</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="প্রোডাক্ট নাম দিয়ে খুঁজুন…"
            className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
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

      {/* Loading */}
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
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filtered.map((img, idx) => (
            <div
              key={idx}
              className="glass-card rounded-2xl overflow-hidden group cursor-pointer hover:shadow-lg transition-all"
              onClick={() => setSelectedImage(img.url)}
            >
              <div className="aspect-square relative bg-muted">
                <img
                  src={img.url}
                  alt={img.productName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownload(img.url, img.productName); }}
                    className="w-9 h-9 rounded-xl bg-white/90 text-foreground flex items-center justify-center hover:bg-white transition-colors"
                    title="ডাউনলোড"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCopyUrl(img.url); }}
                    className="w-9 h-9 rounded-xl bg-white/90 text-foreground flex items-center justify-center hover:bg-white transition-colors"
                    title="URL কপি"
                  >
                    {copiedUrl === img.url ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-xs font-medium text-foreground truncate">{img.productName}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {filtered.map((img, idx) => (
            <div key={idx} className="glass-card rounded-xl p-3 flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
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
                  className="btn-glow px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
                >
                  <Download size={12} /> ডাউনলোড
                </button>
              </div>
            </div>
          ))}
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
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => handleDownload(selectedImage, 'product-image')}
                className="btn-glow px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
              >
                <Download size={16} /> ডাউনলোড করুন
              </button>
              <button
                onClick={() => handleCopyUrl(selectedImage)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium border border-white/20 text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                {copiedUrl === selectedImage ? <Check size={16} /> : <Copy size={16} />} URL কপি
              </button>
              <button
                onClick={() => setSelectedImage(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium border border-white/20 text-white hover:bg-white/10 transition-colors"
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
