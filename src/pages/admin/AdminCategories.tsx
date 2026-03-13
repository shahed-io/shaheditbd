import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Edit, Trash2, Grid3X3 } from 'lucide-react';
import { toast } from 'sonner';
import { handleDbError } from '@/lib/errorHandler';

const AdminCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', image_url: '', is_active: true, sort_order: '0' });
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select(`*, products:products(count)`)
      .order('sort_order');
    if (error) {
      console.error('Categories fetch error:', error);
      // fallback without count
      const { data: data2 } = await supabase.from('categories').select('*').order('sort_order');
      setCategories(data2 || []);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, sort_order: parseInt(form.sort_order) || 0, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-') };
    if (editing) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editing.id);
      if (error) toast.error(handleDbError(error)); else { toast.success('Updated!'); setShowForm(false); fetchCategories(); }
    } else {
      const { error } = await supabase.from('categories').insert(payload);
      if (error) toast.error(handleDbError(error)); else { toast.success('Category added!'); setShowForm(false); fetchCategories(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    await supabase.from('categories').delete().eq('id', id);
    toast.success('Deleted'); fetchCategories();
  };

  const handleEdit = (cat: any) => {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', image_url: cat.image_url || '', is_active: cat.is_active, sort_order: String(cat.sort_order) });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Categories <span className="gradient-text">Management</span>
          </h1>
        </div>
        <button onClick={() => { setEditing(null); setForm({ name:'',slug:'',description:'',image_url:'',is_active:true,sort_order:'0' }); setShowForm(true); }}
          className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">{editing ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { label: 'Name *', field: 'name', required: true },
                { label: 'Slug', field: 'slug', placeholder: 'auto-generated' },
                { label: 'Description', field: 'description' },
                { label: 'Image URL', field: 'image_url', placeholder: 'https://...' },
                { label: 'Sort Order', field: 'sort_order', type: 'number' },
              ].map(({ label, field, required, placeholder, type }) => (
                <div key={field}>
                  <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                  <input required={required} type={type || 'text'} value={(form as any)[field]} onChange={e => setForm({...form, [field]: e.target.value})}
                    placeholder={placeholder}
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                </div>
              ))}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-4 h-4 accent-primary" />
                <span className="text-sm text-foreground">Active</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 glass-card py-2.5 rounded-xl text-sm text-muted-foreground">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-glow py-2.5 rounded-xl text-sm font-semibold">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Add Category'}
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-xl">
                  {cat.image_url ? <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover rounded-xl" /> : '📁'}
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
            <div className="mt-3 flex items-center gap-2">
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
