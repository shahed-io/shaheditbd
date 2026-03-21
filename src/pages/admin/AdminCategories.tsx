import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Upload, X, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { handleDbError } from '@/lib/errorHandler';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be ≤ 100 characters'),
  slug: z.string().trim().max(120, 'Slug must be ≤ 120 characters')
    .regex(/^[a-z0-9-]*$/, 'Slug can only contain lowercase letters, numbers and hyphens')
    .optional().or(z.literal('')),
  description: z.string().trim().max(500, 'Description must be ≤ 500 characters').optional().or(z.literal('')),
  sort_order: z.string(),
  is_active: z.boolean(),
});

const AdminCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', image_url: '', is_active: true, sort_order: '0' });
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select(`*, products:products(count)`)
      .order('sort_order');
    if (error) {
      const { data: data2 } = await supabase.from('categories').select('*').order('sort_order');
      setCategories(data2 || []);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();

    // Real-time subscription
    const channel = supabase
      .channel('categories-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchCategories();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be less than 5MB'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return form.image_url || null;
    setUploading(true);
    const ext = imageFile.name.split('.').pop();
    const fileName = `category-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('category-images')
      .upload(fileName, imageFile, { upsert: true });
    setUploading(false);
    if (error) { toast.error('Image upload failed: ' + error.message); return null; }
    const { data: { publicUrl } } = supabase.storage.from('category-images').getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = categorySchema.safeParse(form);
    if (!validation.success) { toast.error(validation.error.errors[0].message); return; }
    setSaving(true);
    const sanitized = validation.data;

    const uploadedUrl = await uploadImage();

    const payload = {
      name: sanitized.name,
      description: sanitized.description || null,
      image_url: uploadedUrl,
      is_active: sanitized.is_active,
      sort_order: parseInt(sanitized.sort_order) || 0,
      slug: sanitized.slug || sanitized.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    };

    if (editing) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editing.id);
      if (error) toast.error(handleDbError(error));
      else { toast.success('Category updated!'); setShowForm(false); }
    } else {
      const { error } = await supabase.from('categories').insert(payload);
      if (error) toast.error(handleDbError(error));
      else { toast.success('Category added!'); setShowForm(false); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    await supabase.from('categories').delete().eq('id', id);
    toast.success('Deleted');
  };

  const handleEdit = (cat: any) => {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', image_url: cat.image_url || '', is_active: cat.is_active, sort_order: String(cat.sort_order) });
    setImagePreview(cat.image_url || '');
    setImageFile(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditing(null);
    setImageFile(null);
    setImagePreview('');
    setForm({ name: '', slug: '', description: '', image_url: '', is_active: true, sort_order: '0' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Categories <span className="gradient-text">Management</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Changes update the website in real-time</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ name:'',slug:'',description:'',image_url:'',is_active:true,sort_order:'0' }); setImagePreview(''); setImageFile(null); setShowForm(true); }}
          className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">{editing ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={handleCloseForm} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Image Upload */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block font-medium">Category Image</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-full h-36 rounded-2xl border-2 border-dashed border-border hover:border-primary/60 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 overflow-hidden bg-muted/20"
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-2xl">
                        <div className="text-white text-center">
                          <Upload size={20} className="mx-auto mb-1" />
                          <span className="text-xs">Change Image</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <ImageIcon size={20} className="text-primary" />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        <span className="text-primary font-medium">Click to upload</span> image<br />
                        PNG, JPG, WEBP up to 5MB
                      </p>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                {imagePreview && (
                  <button type="button" onClick={() => { setImagePreview(''); setImageFile(null); setForm({...form, image_url: ''}); }}
                    className="mt-2 text-xs text-destructive hover:underline flex items-center gap-1">
                    <X size={12} /> Remove image
                  </button>
                )}
              </div>

              {[
                { label: 'Name *', field: 'name', required: true },
                { label: 'Slug', field: 'slug', placeholder: 'auto-generated' },
                { label: 'Description', field: 'description' },
                { label: 'Sort Order', field: 'sort_order', type: 'number' },
              ].map(({ label, field, required, placeholder, type }) => (
                <div key={field}>
                  <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                  <input required={required} type={type || 'text'} value={(form as any)[field]}
                    onChange={e => setForm({...form, [field]: e.target.value})}
                    placeholder={placeholder}
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                </div>
              ))}

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-4 h-4 accent-primary" />
                <span className="text-sm text-foreground">Active (visible on website)</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleCloseForm} className="flex-1 glass-card py-2.5 rounded-xl text-sm text-muted-foreground">Cancel</button>
                <button type="submit" disabled={saving || uploading} className="flex-1 btn-glow py-2.5 rounded-xl text-sm font-semibold">
                  {uploading ? 'Uploading...' : saving ? 'Saving...' : editing ? 'Update' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array.from({length: 6}).map((_, i) => (
          <div key={i} className="h-28 glass-card rounded-2xl animate-pulse" />
        )) : categories.map((cat) => (
          <div key={cat.id} className="glass-card-hover rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                  {cat.image_url
                    ? <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                    : <span className="text-2xl">📁</span>
                  }
                </div>
                <div>
                  <div className="font-bold text-foreground">{cat.name}</div>
                  <div className="text-xs text-muted-foreground">{cat.slug}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(cat)} className="p-1.5 text-muted-foreground hover:text-primary"><Edit size={14} /></button>
                <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full ${cat.is_active ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                {cat.is_active ? 'Active' : 'Inactive'}
              </span>
              <span className="text-xs text-muted-foreground">Order: {cat.sort_order}</span>
              {cat.products && <span className="text-xs text-primary ml-auto">{Array.isArray(cat.products) ? (cat.products[0]?.count ?? 0) : 0} Products</span>}
            </div>
            {cat.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{cat.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCategories;
