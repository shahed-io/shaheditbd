import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Edit, Trash2, Package, X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { handleDbError } from '@/lib/errorHandler';

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  status: string;
  image_url: string | null;
  total_sales: number;
  created_at: string;
  is_featured: boolean;
  is_digital: boolean;
  tags: string[] | null;
  description: string | null;
  short_description: string | null;
  download_link: string | null;
  sku: string | null;
  category_id: string | null;
  delivery_time: string | null;
  what_you_get: string[] | null;
  faq: { q: string; a: string }[] | null;
  seo_title: string | null;
  seo_description: string | null;
  variants: { label: string; price: string }[] | null;
  categories?: { name: string } | null;
}

const emptyForm = {
  name: '', price: '', original_price: '', discount_percent: '',
  description: '', short_description: '', image_url: '', category_id: '',
  status: 'active', is_featured: false, is_digital: true, download_link: '', sku: '',
  is_flash_sale: false, delivery_time: '', seo_title: '', seo_description: '',
  what_you_get: [''], variants: [{ label: '', price: '' }],
  faq: [{ q: '', a: '' }],
};

type FormState = typeof emptyForm;

const inputClass = "w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground";
const labelClass = "text-xs text-muted-foreground mb-1 block";

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'seo'>('basic');
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setImageUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `product-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
      setForm(prev => ({ ...prev, image_url: urlData.publicUrl }));
      setImagePreview(urlData.publicUrl);
      toast.success('Image uploaded successfully!');
    } catch (err: any) {
      toast.error('Image upload failed: ' + err.message);
    } finally {
      setImageUploading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });
    setProducts((data as any) || []);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').eq('is_active', true);
    setCategories(data || []);
  };

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    const cleanVariants = form.variants.filter(v => v.label.trim());
    const cleanWYG = form.what_you_get.filter(w => w.trim());
    const cleanFaq = form.faq.filter(f => f.q.trim());

    const payload: any = {
      name: form.name,
      slug: editingProduct ? editingProduct.id : slug,
      price: parseFloat(form.price) || 0,
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      discount_percent: form.discount_percent ? parseInt(form.discount_percent) : null,
      description: form.description,
      short_description: form.short_description,
      image_url: form.image_url,
      category_id: form.category_id || null,
      status: form.status,
      is_featured: form.is_featured,
      is_digital: form.is_digital,
      download_link: form.download_link,
      sku: form.sku || null,
      tags: form.is_flash_sale ? ['flash-sale'] : [],
      delivery_time: form.delivery_time || null,
      what_you_get: cleanWYG.length ? cleanWYG : null,
      faq: cleanFaq.length ? cleanFaq : [],
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      variants: cleanVariants.length ? cleanVariants : [],
    };

    if (editingProduct) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
      if (error) toast.error(handleDbError(error));
      else { toast.success('Product updated!'); setShowForm(false); fetchProducts(); }
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) toast.error(handleDbError(error));
      else { toast.success('Product added!'); setShowForm(false); fetchProducts(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Product deleted'); fetchProducts(); }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setImagePreview(product.image_url || '');
    setForm({
      name: product.name,
      price: String(product.price),
      original_price: product.original_price ? String(product.original_price) : '',
      discount_percent: product.discount_percent ? String(product.discount_percent) : '',
      description: product.description || '',
      short_description: product.short_description || '',
      image_url: product.image_url || '',
      category_id: product.category_id || '',
      status: product.status,
      is_featured: product.is_featured ?? false,
      is_digital: product.is_digital ?? true,
      download_link: product.download_link || '',
      sku: product.sku || '',
      is_flash_sale: product.tags?.includes('flash-sale') ?? false,
      delivery_time: product.delivery_time || '',
      seo_title: product.seo_title || '',
      seo_description: product.seo_description || '',
      what_you_get: product.what_you_get?.length ? product.what_you_get : [''],
      variants: (product.variants as any)?.length ? product.variants as any : [{ label: '', price: '' }],
      faq: (product.faq as any)?.length ? product.faq as any : [{ q: '', a: '' }],
    });
    setActiveTab('basic');
    setShowForm(true);
  };

  const statusColor: Record<string, string> = {
    active: 'text-green-400 bg-green-400/10',
    draft: 'text-yellow-400 bg-yellow-400/10',
    out_of_stock: 'text-red-400 bg-red-400/10',
  };

  // --- Helpers for dynamic list fields ---
  const setListItem = (field: 'what_you_get', idx: number, val: string) => {
    const arr = [...form[field]];
    arr[idx] = val;
    setForm({ ...form, [field]: arr });
  };
  const addListItem = (field: 'what_you_get') => setForm({ ...form, [field]: [...form[field], ''] });
  const removeListItem = (field: 'what_you_get', idx: number) => {
    const arr = form[field].filter((_, i) => i !== idx);
    setForm({ ...form, [field]: arr.length ? arr : [''] });
  };

  const setVariant = (idx: number, key: 'label' | 'price', val: string) => {
    const arr = form.variants.map((v, i) => i === idx ? { ...v, [key]: val } : v);
    setForm({ ...form, variants: arr });
  };
  const addVariant = () => setForm({ ...form, variants: [...form.variants, { label: '', price: '' }] });
  const removeVariant = (idx: number) => {
    const arr = form.variants.filter((_, i) => i !== idx);
    setForm({ ...form, variants: arr.length ? arr : [{ label: '', price: '' }] });
  };

  const setFaq = (idx: number, key: 'q' | 'a', val: string) => {
    const arr = form.faq.map((f, i) => i === idx ? { ...f, [key]: val } : f);
    setForm({ ...form, faq: arr });
  };
  const addFaq = () => setForm({ ...form, faq: [...form.faq, { q: '', a: '' }] });
  const removeFaq = (idx: number) => {
    const arr = form.faq.filter((_, i) => i !== idx);
    setForm({ ...form, faq: arr.length ? arr : [{ q: '', a: '' }] });
  };

  const tabs = [
    { id: 'basic', label: '📦 Basic Info' },
    { id: 'details', label: '📋 Details' },
    { id: 'seo', label: '🔍 SEO' },
  ] as const;

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
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-muted/30 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-0 flex-shrink-0">
              <h2 className="text-xl font-bold text-foreground">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground p-1"><X size={18} /></button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-4 border-b border-border flex-shrink-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors ${activeTab === tab.id ? 'bg-primary/20 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-4">

                {/* ====== BASIC INFO TAB ====== */}
                {activeTab === 'basic' && (
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Product Name *</label>
                      <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Price (৳) *</label>
                        <input required type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Original Price (৳)</label>
                        <input type="number" step="0.01" value={form.original_price} onChange={e => setForm({ ...form, original_price: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Discount %</label>
                        <input type="number" value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>SKU</label>
                        <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className={inputClass} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Category</label>
                        <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className={inputClass}>
                          <option value="">Select Category</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Status</label>
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputClass}>
                          <option value="active">Active</option>
                          <option value="draft">Draft</option>
                          <option value="out_of_stock">Out of Stock</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Image URL</label>
                      <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Short Description</label>
                      <input value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Full Description</label>
                      <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`${inputClass} resize-none`} />
                    </div>
                    <div>
                      <label className={labelClass}>Delivery Time</label>
                      <input value={form.delivery_time} onChange={e => setForm({ ...form, delivery_time: e.target.value })} placeholder="e.g. Instant Delivery, Within 24 hours" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Download Link (Digital Products)</label>
                      <input value={form.download_link} onChange={e => setForm({ ...form, download_link: e.target.value })} placeholder="https://..." className={inputClass} />
                    </div>
                    <div className="flex items-center gap-5 flex-wrap">
                      {[
                        { key: 'is_featured', label: '⭐ Featured' },
                        { key: 'is_digital', label: '💻 Digital' },
                        { key: 'is_flash_sale', label: '🔥 Flash Sale' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.checked })} className="w-4 h-4 accent-primary" />
                          <span className="text-sm text-foreground">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* ====== DETAILS TAB ====== */}
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {/* Variants */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-foreground">Variants (Duration / Device / Plan)</label>
                        <button type="button" onClick={addVariant} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus size={12} /> Add</button>
                      </div>
                      <div className="space-y-2">
                        {form.variants.map((v, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <input value={v.label} onChange={e => setVariant(i, 'label', e.target.value)} placeholder="e.g. 1 Year / 1 Device" className={`${inputClass} flex-1`} />
                            <input value={v.price} onChange={e => setVariant(i, 'price', e.target.value)} placeholder="Price ৳" className={`${inputClass} w-28`} />
                            <button type="button" onClick={() => removeVariant(i)} className="text-muted-foreground hover:text-destructive"><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* What You Get */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-foreground">What You Get</label>
                        <button type="button" onClick={() => addListItem('what_you_get')} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus size={12} /> Add</button>
                      </div>
                      <div className="space-y-2">
                        {form.what_you_get.map((item, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <input value={item} onChange={e => setListItem('what_you_get', i, e.target.value)} placeholder={`Item ${i + 1}`} className={`${inputClass} flex-1`} />
                            <button type="button" onClick={() => removeListItem('what_you_get', i)} className="text-muted-foreground hover:text-destructive"><X size={14} /></button>
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
                            <input value={item.q} onChange={e => setFaq(i, 'q', e.target.value)} placeholder="Question" className={inputClass} />
                            <textarea rows={2} value={item.a} onChange={e => setFaq(i, 'a', e.target.value)} placeholder="Answer" className={`${inputClass} resize-none`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ====== SEO TAB ====== */}
                {activeTab === 'seo' && (
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>SEO Title <span className="text-muted-foreground/60">(max 60 chars)</span></label>
                      <input value={form.seo_title} onChange={e => setForm({ ...form, seo_title: e.target.value })} maxLength={60} placeholder="Product SEO title..." className={inputClass} />
                      <p className="text-xs text-muted-foreground mt-1">{form.seo_title.length}/60</p>
                    </div>
                    <div>
                      <label className={labelClass}>SEO Description <span className="text-muted-foreground/60">(max 160 chars)</span></label>
                      <textarea rows={3} value={form.seo_description} onChange={e => setForm({ ...form, seo_description: e.target.value })} maxLength={160} placeholder="Meta description for search engines..." className={`${inputClass} resize-none`} />
                      <p className="text-xs text-muted-foreground mt-1">{form.seo_description.length}/160</p>
                    </div>
                    {(form.seo_title || form.seo_description) && (
                      <div className="glass-card rounded-xl p-4">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">Google Preview</p>
                        <p className="text-primary text-sm font-medium line-clamp-1">{form.seo_title || form.name || 'Product Title'}</p>
                        <p className="text-accent text-xs">shahedstore.lovable.app/products/...</p>
                        <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{form.seo_description || 'No description provided.'}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-6 pt-4 border-t border-border flex-shrink-0">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 glass-card py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-glow py-2.5 rounded-xl text-sm font-semibold">
                  {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted/30 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No products found</p>
            <p className="text-sm mt-1">Add your first product to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Product</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Category</th>
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
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" onError={e => { (e.target as any).style.display = 'none'; }} />
                          ) : (
                            <Package size={20} className="m-2.5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-foreground line-clamp-1">{product.name}</div>
                          <div className="flex items-center gap-1 flex-wrap mt-0.5">
                            {product.is_featured && <span className="text-xs text-primary">⭐</span>}
                            {product.tags?.includes('flash-sale') && <span className="text-xs text-secondary-foreground">🔥</span>}
                            {product.discount_percent && <span className="text-xs text-muted-foreground">-{product.discount_percent}%</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                      {(product as any).categories?.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-primary">৳{Number(product.price).toLocaleString()}</div>
                      {product.original_price && (
                        <div className="text-xs text-muted-foreground line-through">৳{Number(product.original_price).toLocaleString()}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{product.total_sales}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColor[product.status] || ''}`}>
                        {product.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(product)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                          <Edit size={15} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={15} />
                        </button>
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
