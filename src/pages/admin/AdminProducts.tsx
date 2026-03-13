import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Plus, Search, Edit, Trash2, Package, X, Upload,
  Image as ImageIcon, Loader2, Video, Tag, Star,
  ExternalLink, RefreshCw, Copy, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { handleDbError } from '@/lib/errorHandler';

interface Category { id: string; name: string; parent_id: string | null; }

interface Product {
  id: string; name: string; price: number; original_price: number | null;
  cost_price?: number | null; discount_percent: number | null; status: string;
  image_url: string | null; images?: string[] | null; video_url?: string | null;
  total_sales: number; created_at: string; is_featured: boolean; is_digital: boolean;
  tags: string[] | null; description: string | null; short_description: string | null;
  download_link: string | null; sku: string | null; category_id: string | null;
  subcategory_id?: string | null; brand?: string | null; delivery_time: string | null;
  delivery_type?: string | null; what_you_get: string[] | null;
  faq: { q: string; a: string }[] | null; seo_title: string | null;
  seo_description: string | null; variants: { name: string; options: { label: string; price: string }[] }[] | null;
  badge?: string | null; demo_url?: string | null; warranty_note?: string | null;
  refund_note?: string | null; product_type?: string | null;
  attributes?: { key: string; value: string }[] | null;
  category?: { name: string } | null;
}

const emptyForm = {
  // Basic
  name: '', slug: '', short_description: '', description: '',
  brand: '', badge: '', product_type: 'digital',
  // Pricing
  price: '', original_price: '', discount_percent: '', cost_price: '',
  // Stock
  status: 'active', sku: '', stock_quantity: '',
  // Category
  category_id: '', subcategory_id: '',
  // Flags
  is_featured: false, is_digital: true, is_flash_sale: false,
  // Media
  image_url: '', images: [] as string[], video_url: '',
  // Delivery
  delivery_time: '', delivery_type: 'instant', download_link: '',
  demo_url: '',
  // Notes
  warranty_note: '', refund_note: '',
  // Lists
  what_you_get: [''] as string[],
  variants: [{ name: '', options: [{ label: '', price: '' }] }] as { name: string; options: { label: string; price: string }[] }[],
  attributes: [{ key: '', value: '' }] as { key: string; value: string }[],
  faq: [{ q: '', a: '' }] as { q: string; a: string }[],
  tags: '' as string,
  // SEO
  seo_title: '', seo_description: '',
};

type FormState = typeof emptyForm;
type TabId = 'basic' | 'pricing' | 'media' | 'details' | 'seo';

const ic = "w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground";
const lc = "text-xs text-muted-foreground mb-1 block font-medium";

const PRODUCT_TYPES = [
  { value: 'digital', label: '💾 Digital Download' },
  { value: 'license_key', label: '🔑 License Key' },
  { value: 'account', label: '👤 Account Delivery' },
  { value: 'subscription', label: '🔄 Subscription' },
  { value: 'service', label: '🛠️ Service' },
  { value: 'physical', label: '📦 Physical Product' },
];

const DELIVERY_TYPES = [
  { value: 'instant', label: '⚡ Instant Delivery' },
  { value: 'manual', label: '🕐 Manual (Within hours)' },
  { value: 'scheduled', label: '📅 Scheduled' },
  { value: 'download', label: '⬇️ Download Link' },
];

const BADGES = [
  '', '🔥 Hot', '⭐ Best Seller', '🆕 New', '💎 Premium',
  '🎯 Popular', '✅ Verified', '🚀 Trending', '💥 Sale',
];

const generateSKU = (name: string) => {
  const prefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
};

const generateSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [galleryUploading, setGalleryUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const parentCategories = categories.filter(c => !c.parent_id);
  const subCategories = categories.filter(
    c => c.parent_id && c.parent_id === form.category_id
  );

  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `product-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage.from('product-images').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
      setForm(prev => ({ ...prev, image_url: urlData.publicUrl }));
      setImagePreview(urlData.publicUrl);
      toast.success('Image uploaded!');
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setImageUploading(false);
    }
  };

  const handleGalleryUpload = async (files: FileList) => {
    setGalleryUploading(true);
    const urls: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop();
        const fileName = `gallery-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { data, error } = await supabase.storage.from('product-images').upload(fileName, file, { upsert: true });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
        urls.push(urlData.publicUrl);
      }
      setForm(prev => ({ ...prev, images: [...(prev.images || []), ...urls] }));
      toast.success(`${urls.length} image(s) added to gallery!`);
    } catch (err: any) {
      toast.error('Gallery upload failed: ' + err.message);
    } finally {
      setGalleryUploading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*, category:category_id(name)')
      .order('created_at', { ascending: false });
    setProducts((data as any) || []);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name, parent_id').eq('is_active', true).order('sort_order');
    setCategories(data || []);
  };

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const baseSlug = form.slug || generateSlug(form.name);
    const finalSlug = editingProduct ? (form.slug || editingProduct.id) : `${baseSlug}-${Date.now()}`;

    const cleanVariants = form.variants.filter(v => v.name.trim() && v.options.some(o => o.label.trim()));
    const cleanWYG = form.what_you_get.filter(w => w.trim());
    const cleanFaq = form.faq.filter(f => f.q.trim());
    const cleanAttrs = form.attributes.filter(a => a.key.trim());
    const tagList = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (form.is_flash_sale && !tagList.includes('flash-sale')) tagList.push('flash-sale');

    const payload: any = {
      name: form.name,
      slug: finalSlug,
      short_description: form.short_description || null,
      description: form.description || null,
      brand: form.brand || null,
      badge: form.badge || null,
      product_type: form.product_type,
      price: parseFloat(form.price) || 0,
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      discount_percent: form.discount_percent ? parseInt(form.discount_percent) : null,
      cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
      status: form.status,
      sku: form.sku || null,
      stock_quantity: form.stock_quantity ? parseInt(form.stock_quantity) : null,
      category_id: form.category_id || null,
      subcategory_id: form.subcategory_id || null,
      is_featured: form.is_featured,
      is_digital: form.is_digital,
      image_url: form.image_url || null,
      images: form.images?.filter(Boolean) || [],
      video_url: form.video_url || null,
      delivery_time: form.delivery_time || null,
      delivery_type: form.delivery_type || 'instant',
      download_link: form.download_link || null,
      demo_url: form.demo_url || null,
      warranty_note: form.warranty_note || null,
      refund_note: form.refund_note || null,
      tags: tagList,
      what_you_get: cleanWYG.length ? cleanWYG : null,
      faq: cleanFaq.length ? cleanFaq : [],
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      variants: cleanVariants.length ? cleanVariants : [],
      attributes: cleanAttrs.length ? cleanAttrs : [],
    };

    try {
      if (editingProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
        if (error) throw error;
        toast.success('Product updated!');
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        toast.success('Product added!');
      }
      setShowForm(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(handleDbError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Product deleted'); fetchProducts(); }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setImagePreview(product.image_url || '');
    const tagStr = (product.tags || []).filter(t => t !== 'flash-sale').join(', ');
    setForm({
      name: product.name,
      slug: product.id,
      short_description: product.short_description || '',
      description: product.description || '',
      brand: product.brand || '',
      badge: product.badge || '',
      product_type: product.product_type || 'digital',
      price: String(product.price),
      original_price: product.original_price ? String(product.original_price) : '',
      discount_percent: product.discount_percent ? String(product.discount_percent) : '',
      cost_price: product.cost_price ? String(product.cost_price) : '',
      status: product.status,
      sku: product.sku || '',
      stock_quantity: '',
      category_id: product.category_id || '',
      subcategory_id: product.subcategory_id || '',
      is_featured: product.is_featured ?? false,
      is_digital: product.is_digital ?? true,
      is_flash_sale: product.tags?.includes('flash-sale') ?? false,
      image_url: product.image_url || '',
      images: product.images || [],
      video_url: product.video_url || '',
      delivery_time: product.delivery_time || '',
      delivery_type: product.delivery_type || 'instant',
      download_link: product.download_link || '',
      demo_url: product.demo_url || '',
      warranty_note: product.warranty_note || '',
      refund_note: product.refund_note || '',
      tags: tagStr,
      what_you_get: product.what_you_get?.length ? product.what_you_get : [''],
      variants: (() => {
        const raw = product.variants as any;
        if (!raw?.length) return [{ name: '', options: [{ label: '', price: '' }] }];
        // Migrate old flat format { label, price } → new grouped format
        if (raw[0]?.label !== undefined && raw[0]?.name === undefined) {
          return [{ name: 'Options', options: raw.map((v: any) => ({ label: v.label, price: v.price })) }];
        }
        return raw;
      })(),
      attributes: (product.attributes as any)?.length ? (product.attributes as any) : [{ key: '', value: '' }],
      faq: (product.faq as any)?.length ? (product.faq as any) : [{ q: '', a: '' }],
      seo_title: product.seo_title || '',
      seo_description: product.seo_description || '',
    });
    setActiveTab('basic');
    setShowForm(true);
  };

  // Dynamic list helpers
  const setListItem = (idx: number, val: string) => {
    const arr = [...form.what_you_get]; arr[idx] = val;
    setForm(p => ({ ...p, what_you_get: arr }));
  };
  const addListItem = () => setForm(p => ({ ...p, what_you_get: [...p.what_you_get, ''] }));
  const removeListItem = (idx: number) => {
    const arr = form.what_you_get.filter((_, i) => i !== idx);
    setForm(p => ({ ...p, what_you_get: arr.length ? arr : [''] }));
  };

  const setVariantGroupName = (gi: number, val: string) => {
    const arr = form.variants.map((v, i) => i === gi ? { ...v, name: val } : v);
    setForm(p => ({ ...p, variants: arr }));
  };
  const addVariantGroup = () => setForm(p => ({ ...p, variants: [...p.variants, { name: '', options: [{ label: '', price: '' }] }] }));
  const removeVariantGroup = (gi: number) => {
    const arr = form.variants.filter((_, i) => i !== gi);
    setForm(p => ({ ...p, variants: arr.length ? arr : [{ name: '', options: [{ label: '', price: '' }] }] }));
  };
  const setVariantOption = (gi: number, oi: number, key: 'label' | 'price', val: string) => {
    const arr = form.variants.map((v, i) => i === gi ? { ...v, options: v.options.map((o, j) => j === oi ? { ...o, [key]: val } : o) } : v);
    setForm(p => ({ ...p, variants: arr }));
  };
  const addVariantOption = (gi: number) => {
    const arr = form.variants.map((v, i) => i === gi ? { ...v, options: [...v.options, { label: '', price: '' }] } : v);
    setForm(p => ({ ...p, variants: arr }));
  };
  const removeVariantOption = (gi: number, oi: number) => {
    const arr = form.variants.map((v, i) => i === gi ? { ...v, options: v.options.length > 1 ? v.options.filter((_, j) => j !== oi) : v.options } : v);
    setForm(p => ({ ...p, variants: arr }));
  };

  const setAttr = (idx: number, key: 'key' | 'value', val: string) => {
    const arr = form.attributes.map((a, i) => i === idx ? { ...a, [key]: val } : a);
    setForm(p => ({ ...p, attributes: arr }));
  };
  const addAttr = () => setForm(p => ({ ...p, attributes: [...p.attributes, { key: '', value: '' }] }));
  const removeAttr = (idx: number) => {
    const arr = form.attributes.filter((_, i) => i !== idx);
    setForm(p => ({ ...p, attributes: arr.length ? arr : [{ key: '', value: '' }] }));
  };

  const setFaq = (idx: number, key: 'q' | 'a', val: string) => {
    const arr = form.faq.map((f, i) => i === idx ? { ...f, [key]: val } : f);
    setForm(p => ({ ...p, faq: arr }));
  };
  const addFaq = () => setForm(p => ({ ...p, faq: [...p.faq, { q: '', a: '' }] }));
  const removeFaq = (idx: number) => {
    const arr = form.faq.filter((_, i) => i !== idx);
    setForm(p => ({ ...p, faq: arr.length ? arr : [{ q: '', a: '' }] }));
  };

  const statusColor: Record<string, string> = {
    active: 'text-green-400 bg-green-400/10',
    draft: 'text-yellow-400 bg-yellow-400/10',
    out_of_stock: 'text-red-400 bg-red-400/10',
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'basic', label: '📦 Basic' },
    { id: 'pricing', label: '💰 Pricing' },
    { id: 'media', label: '🖼️ Media' },
    { id: 'details', label: '📋 Details' },
    { id: 'seo', label: '🔍 SEO' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Products <span className="gradient-text">Management</span>
          </h1>
          <p className="text-muted-foreground text-sm">{products.length} products total</p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setForm(emptyForm); setImagePreview(''); setActiveTab('basic'); setShowForm(true); }}
          className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold"
        >
          <Plus size={16} /> Add New Product
        </button>
      </div>

      {/* Search */}
      <div className="glass-card rounded-2xl p-4 flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, SKU, brand..."
            className="w-full bg-muted/30 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* ======= PRODUCT FORM MODAL ======= */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-2xl max-h-[94vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-0 flex-shrink-0">
              <h2 className="text-xl font-bold text-foreground">{editingProduct ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground p-1"><X size={18} /></button>
            </div>

            {/* Tabs */}
            <div className="flex gap-0.5 px-6 pt-4 border-b border-border flex-shrink-0 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-primary/20 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-4">

                {/* ======= BASIC TAB ======= */}
                {activeTab === 'basic' && (
                  <div className="space-y-4">
                    {/* Product Type */}
                    <div>
                      <label className={lc}>Product Type *</label>
                      <div className="grid grid-cols-3 gap-2">
                        {PRODUCT_TYPES.map(pt => (
                          <button
                            key={pt.value} type="button"
                            onClick={() => setForm(p => ({ ...p, product_type: pt.value }))}
                            className={`text-xs py-2 px-2 rounded-xl border transition-colors text-left ${form.product_type === pt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/50'}`}
                          >
                            {pt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className={lc}>Product Title *</label>
                      <input required value={form.name}
                        onChange={e => {
                          const n = e.target.value;
                          setForm(p => ({ ...p, name: n, slug: generateSlug(n), seo_title: p.seo_title || n }));
                        }}
                        placeholder="e.g. Windows 11 Pro License Key" className={ic} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lc}>Slug (URL) *</label>
                        <input value={form.slug}
                          onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                          placeholder="product-slug" className={ic} />
                      </div>
                      <div>
                        <label className={lc}>Brand / Publisher</label>
                        <input value={form.brand}
                          onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
                          placeholder="e.g. Microsoft, Adobe" className={ic} />
                      </div>
                    </div>

                    <div>
                      <label className={lc}>Short Description</label>
                      <input value={form.short_description}
                        onChange={e => setForm(p => ({ ...p, short_description: e.target.value }))}
                        placeholder="One-liner shown in cards..." className={ic} />
                    </div>

                    <div>
                      <label className={lc}>Full Description</label>
                      <textarea rows={4} value={form.description}
                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                        placeholder="Detailed product description..." className={`${ic} resize-none`} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lc}>Category</label>
                        <select value={form.category_id}
                          onChange={e => setForm(p => ({ ...p, category_id: e.target.value, subcategory_id: '' }))}
                          className={ic}>
                          <option value="">Select Category</option>
                          {parentCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={lc}>Subcategory</label>
                        <select value={form.subcategory_id}
                          onChange={e => setForm(p => ({ ...p, subcategory_id: e.target.value }))}
                          className={ic} disabled={!subCategories.length}>
                          <option value="">None</option>
                          {subCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lc}>Status</label>
                        <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={ic}>
                          <option value="draft">Draft</option>
                          <option value="active">Published</option>
                          <option value="out_of_stock">Out of Stock</option>
                        </select>
                      </div>
                      <div>
                        <label className={lc}>Badge Label</label>
                        <select value={form.badge} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))} className={ic}>
                          {BADGES.map(b => <option key={b} value={b}>{b || '— None —'}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={lc}>Product Tags <span className="text-muted-foreground/60">(comma separated)</span></label>
                      <input value={form.tags}
                        onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                        placeholder="windows, license, digital..." className={ic} />
                    </div>

                    <div className="flex items-center gap-5 flex-wrap pt-1">
                      {[
                        { key: 'is_featured', label: '⭐ Featured' },
                        { key: 'is_digital', label: '💻 Digital' },
                        { key: 'is_flash_sale', label: '🔥 Flash Sale' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={(form as any)[key]}
                            onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))}
                            className="w-4 h-4 accent-primary" />
                          <span className="text-sm text-foreground">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* ======= PRICING TAB ======= */}
                {activeTab === 'pricing' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lc}>Selling Price (৳) *</label>
                        <input required type="number" step="0.01" value={form.price}
                          onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className={ic} placeholder="0.00" />
                      </div>
                      <div>
                        <label className={lc}>Original / MRP (৳)</label>
                        <input type="number" step="0.01" value={form.original_price}
                          onChange={e => setForm(p => ({ ...p, original_price: e.target.value }))} className={ic} placeholder="0.00" />
                      </div>
                      <div>
                        <label className={lc}>Discount %</label>
                        <input type="number" value={form.discount_percent}
                          onChange={e => setForm(p => ({ ...p, discount_percent: e.target.value }))} className={ic} placeholder="0" />
                      </div>
                      <div>
                        <label className={lc}>Cost Price (৳) <span className="text-muted-foreground/60">internal</span></label>
                        <input type="number" step="0.01" value={form.cost_price}
                          onChange={e => setForm(p => ({ ...p, cost_price: e.target.value }))} className={ic} placeholder="0.00" />
                      </div>
                    </div>

                    {form.price && form.cost_price && (
                      <div className="glass-card rounded-xl p-3 border border-primary/20">
                        <p className="text-xs text-muted-foreground font-medium mb-1">💹 Profit Margin</p>
                        <p className="text-primary font-bold text-lg">
                          ৳{(parseFloat(form.price) - parseFloat(form.cost_price)).toFixed(2)}
                          <span className="text-sm font-normal text-muted-foreground ml-2">
                            ({((( parseFloat(form.price) - parseFloat(form.cost_price)) / parseFloat(form.price)) * 100).toFixed(1)}%)
                          </span>
                        </p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border">
                      <p className="text-xs font-medium text-foreground mb-3">Stock & SKU</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={lc}>SKU</label>
                          <div className="flex gap-2">
                            <input value={form.sku}
                              onChange={e => setForm(p => ({ ...p, sku: e.target.value }))}
                              placeholder="AUTO-SKU" className={`${ic} flex-1`} />
                            <button type="button"
                              onClick={() => setForm(p => ({ ...p, sku: generateSKU(form.name || 'PRD') }))}
                              className="px-3 py-2 rounded-xl border border-border bg-muted/30 hover:border-primary text-muted-foreground hover:text-primary transition-colors">
                              <RefreshCw size={14} />
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className={lc}>Stock Quantity</label>
                          <input type="number" value={form.stock_quantity}
                            onChange={e => setForm(p => ({ ...p, stock_quantity: e.target.value }))}
                            placeholder="∞" className={ic} />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-foreground">📦 Variant Groups (Duration / Account Type / Plan)</p>
                        <button type="button" onClick={addVariantGroup} className="text-xs text-primary hover:underline flex items-center gap-1">
                          <Plus size={12} /> Add Group
                        </button>
                      </div>
                      <div className="space-y-4">
                        {form.variants.map((group, gi) => (
                          <div key={gi} className="border border-border rounded-xl p-3 space-y-2 bg-muted/20">
                            <div className="flex gap-2 items-center">
                              <input value={group.name}
                                onChange={e => setVariantGroupName(gi, e.target.value)}
                                placeholder="Group name (e.g. Duration, Account Type)"
                                className={`${ic} flex-1 font-medium`} />
                              {form.variants.length > 1 && (
                                <button type="button" onClick={() => removeVariantGroup(gi)} className="text-muted-foreground hover:text-destructive flex-shrink-0"><X size={14} /></button>
                              )}
                            </div>
                            <div className="space-y-1.5 pl-2">
                              {group.options.map((opt, oi) => (
                                <div key={oi} className="flex gap-2 items-center">
                                  <input value={opt.label}
                                    onChange={e => setVariantOption(gi, oi, 'label', e.target.value)}
                                    placeholder="Option label (e.g. 1 Month, Personal)" className={`${ic} flex-1`} />
                                  <input value={opt.price}
                                    onChange={e => setVariantOption(gi, oi, 'price', e.target.value)}
                                    placeholder="Price ৳" type="number" className={`${ic} w-28`} />
                                  <button type="button" onClick={() => removeVariantOption(gi, oi)} className="text-muted-foreground hover:text-destructive"><X size={12} /></button>
                                </div>
                              ))}
                              <button type="button" onClick={() => addVariantOption(gi)} className="text-xs text-primary/80 hover:text-primary flex items-center gap-1 mt-1">
                                <Plus size={11} /> Add Option
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">💡 Customer যখন একটি option select করবে, তখন সেই option-এর price দেখাবে</p>
                    </div>
                  </div>
                )}

                {/* ======= MEDIA TAB ======= */}
                {activeTab === 'media' && (
                  <div className="space-y-5">
                    {/* Featured Image */}
                    <div>
                      <label className={lc}>Featured Image</label>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
                      <div className="flex gap-3 items-start">
                        <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border bg-muted/30 flex-shrink-0 overflow-hidden flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                          onClick={() => fileInputRef.current?.click()}>
                          {imageUploading ? <Loader2 size={22} className="text-primary animate-spin" /> :
                            (imagePreview || form.image_url) ?
                              <img src={imagePreview || form.image_url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as any).style.display = 'none'; }} /> :
                              <ImageIcon size={22} className="text-muted-foreground" />}
                        </div>
                        <div className="flex-1 space-y-2">
                          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={imageUploading}
                            className="w-full flex items-center justify-center gap-2 bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm hover:border-primary transition-colors disabled:opacity-50">
                            {imageUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                            {imageUploading ? 'Uploading...' : 'Upload Image'}
                          </button>
                          <input value={form.image_url}
                            onChange={e => { setForm(p => ({ ...p, image_url: e.target.value })); setImagePreview(e.target.value); }}
                            placeholder="or paste image URL..." className={ic} />
                        </div>
                      </div>
                    </div>

                    {/* Gallery Images */}
                    <div>
                      <label className={lc}>Gallery Images <span className="text-muted-foreground/60">(multiple)</span></label>
                      <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden"
                        onChange={e => { if (e.target.files?.length) handleGalleryUpload(e.target.files); }} />
                      {form.images && form.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {form.images.map((img, i) => (
                            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border group">
                              <img src={img} alt="" className="w-full h-full object-cover" />
                              <button type="button"
                                onClick={() => setForm(p => ({ ...p, images: p.images?.filter((_, idx) => idx !== i) || [] }))}
                                className="absolute top-0.5 right-0.5 bg-destructive/80 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={galleryUploading}
                        className="w-full flex items-center justify-center gap-2 bg-muted/30 border border-dashed border-border rounded-xl px-4 py-3 text-sm hover:border-primary transition-colors disabled:opacity-50">
                        {galleryUploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                        {galleryUploading ? 'Uploading...' : 'Add Gallery Images'}
                      </button>
                    </div>

                    {/* Video */}
                    <div>
                      <label className={lc}>Video Preview URL</label>
                      <div className="flex gap-2 items-center">
                        <Video size={16} className="text-muted-foreground flex-shrink-0" />
                        <input value={form.video_url}
                          onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))}
                          placeholder="YouTube or direct video URL..." className={`${ic} flex-1`} />
                      </div>
                      {form.video_url && (
                        <a href={form.video_url} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline">
                          <ExternalLink size={11} /> Preview video
                        </a>
                      )}
                    </div>

                    {/* Demo Button */}
                    <div>
                      <label className={lc}>Demo / Preview URL</label>
                      <input value={form.demo_url}
                        onChange={e => setForm(p => ({ ...p, demo_url: e.target.value }))}
                        placeholder="https://demo.example.com" className={ic} />
                      <p className="text-xs text-muted-foreground mt-1">Shown as "Try Demo" button on product page</p>
                    </div>
                  </div>
                )}

                {/* ======= DETAILS TAB ======= */}
                {activeTab === 'details' && (
                  <div className="space-y-5">
                    {/* Delivery */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lc}>Delivery Type</label>
                        <select value={form.delivery_type} onChange={e => setForm(p => ({ ...p, delivery_type: e.target.value }))} className={ic}>
                          {DELIVERY_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={lc}>Delivery Time</label>
                        <input value={form.delivery_time}
                          onChange={e => setForm(p => ({ ...p, delivery_time: e.target.value }))}
                          placeholder="Instant / 24 hours..." className={ic} />
                      </div>
                    </div>

                    {form.is_digital && (
                      <div>
                        <label className={lc}>Download Link</label>
                        <input value={form.download_link}
                          onChange={e => setForm(p => ({ ...p, download_link: e.target.value }))}
                          placeholder="https://..." className={ic} />
                      </div>
                    )}

                    {/* Notes */}
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className={lc}>Warranty / Guarantee Note</label>
                        <input value={form.warranty_note}
                          onChange={e => setForm(p => ({ ...p, warranty_note: e.target.value }))}
                          placeholder="e.g. 1 Year Genuine Warranty" className={ic} />
                      </div>
                      <div>
                        <label className={lc}>Refund Policy Note</label>
                        <input value={form.refund_note}
                          onChange={e => setForm(p => ({ ...p, refund_note: e.target.value }))}
                          placeholder="e.g. No refund after activation" className={ic} />
                      </div>
                    </div>

                    {/* Attributes */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-foreground">Product Attributes</label>
                        <button type="button" onClick={addAttr} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus size={12} /> Add</button>
                      </div>
                      <div className="space-y-2">
                        {form.attributes.map((a, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <input value={a.key} onChange={e => setAttr(i, 'key', e.target.value)}
                              placeholder="e.g. Platform" className={`${ic} flex-1`} />
                            <input value={a.value} onChange={e => setAttr(i, 'value', e.target.value)}
                              placeholder="e.g. Windows" className={`${ic} flex-1`} />
                            <button type="button" onClick={() => removeAttr(i)} className="text-muted-foreground hover:text-destructive"><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* What You Get */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-foreground">What You Get</label>
                        <button type="button" onClick={addListItem} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus size={12} /> Add</button>
                      </div>
                      <div className="space-y-2">
                        {form.what_you_get.map((item, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <input value={item} onChange={e => setListItem(i, e.target.value)}
                              placeholder={`Item ${i + 1}`} className={`${ic} flex-1`} />
                            <button type="button" onClick={() => removeListItem(i)} className="text-muted-foreground hover:text-destructive"><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* FAQ */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-foreground">FAQ</label>
                        <button type="button" onClick={addFaq} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus size={12} /> Add</button>
                      </div>
                      <div className="space-y-3">
                        {form.faq.map((item, i) => (
                          <div key={i} className="glass-card rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground font-medium">FAQ #{i + 1}</span>
                              <button type="button" onClick={() => removeFaq(i)} className="text-muted-foreground hover:text-destructive"><X size={13} /></button>
                            </div>
                            <input value={item.q} onChange={e => setFaq(i, 'q', e.target.value)} placeholder="Question" className={ic} />
                            <textarea rows={2} value={item.a} onChange={e => setFaq(i, 'a', e.target.value)} placeholder="Answer" className={`${ic} resize-none`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ======= SEO TAB ======= */}
                {activeTab === 'seo' && (
                  <div className="space-y-4">
                    <div>
                      <label className={lc}>SEO Title <span className="text-muted-foreground/60">(max 60 chars)</span></label>
                      <input value={form.seo_title} onChange={e => setForm(p => ({ ...p, seo_title: e.target.value }))}
                        maxLength={60} placeholder="SEO title..." className={ic} />
                      <p className="text-xs text-muted-foreground mt-1">{form.seo_title.length}/60</p>
                    </div>
                    <div>
                      <label className={lc}>Meta Description <span className="text-muted-foreground/60">(max 160 chars)</span></label>
                      <textarea rows={3} value={form.seo_description}
                        onChange={e => setForm(p => ({ ...p, seo_description: e.target.value }))}
                        maxLength={160} placeholder="Meta description..." className={`${ic} resize-none`} />
                      <p className="text-xs text-muted-foreground mt-1">{form.seo_description.length}/160</p>
                    </div>
                    {(form.seo_title || form.seo_description) && (
                      <div className="glass-card rounded-xl p-4 border border-border">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">🔍 Google Preview</p>
                        <p className="text-primary text-sm font-medium line-clamp-1">{form.seo_title || form.name || 'Product Title'}</p>
                        <p className="text-accent text-xs">shahedstore.lovable.app/product/{form.slug || 'product-slug'}</p>
                        <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{form.seo_description || 'No description.'}</p>
                      </div>
                    )}
                    <div className="glass-card rounded-xl p-4 border border-border space-y-2">
                      <p className="text-xs font-medium text-foreground">SEO Checklist</p>
                      {[
                        { ok: form.seo_title.length >= 10 && form.seo_title.length <= 60, label: 'Title between 10–60 chars' },
                        { ok: form.seo_description.length >= 50 && form.seo_description.length <= 160, label: 'Description 50–160 chars' },
                        { ok: !!form.image_url, label: 'Featured image set' },
                        { ok: !!form.slug, label: 'URL slug defined' },
                        { ok: !!form.description, label: 'Full description added' },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-2 text-xs">
                          <span className={item.ok ? 'text-green-400' : 'text-muted-foreground'}>{item.ok ? '✓' : '○'}</span>
                          <span className={item.ok ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="flex gap-3 p-6 pt-4 border-t border-border flex-shrink-0">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 glass-card py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 btn-glow py-2.5 rounded-xl text-sm font-semibold">
                  {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======= PRODUCTS TABLE ======= */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted/30 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Product</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Price</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">Sales</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {product.image_url ?
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" onError={e => { (e.target as any).style.display = 'none'; }} /> :
                            <Package size={20} className="m-2.5 text-muted-foreground" />}
                        </div>
                        <div>
                          <div className="font-medium text-foreground line-clamp-1">{product.name}</div>
                          <div className="flex items-center gap-1 flex-wrap mt-0.5">
                            {product.brand && <span className="text-xs text-muted-foreground">{product.brand}</span>}
                            {product.is_featured && <span className="text-xs text-primary">⭐</span>}
                            {product.badge && <span className="text-xs bg-primary/10 text-primary px-1.5 rounded">{product.badge}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground capitalize">{product.product_type || 'digital'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-primary">৳{Number(product.price).toLocaleString()}</div>
                      {product.original_price && <div className="text-xs text-muted-foreground line-through">৳{Number(product.original_price).toLocaleString()}</div>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{product.total_sales}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColor[product.status] || ''}`}>
                        {product.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(product)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Edit size={15} /></button>
                        <button onClick={() => handleDelete(product.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
