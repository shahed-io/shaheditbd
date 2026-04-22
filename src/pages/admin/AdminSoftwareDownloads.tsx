import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash2, Download, Image as ImageIcon,
  GripVertical, Eye, EyeOff, X, Save, Loader2, ExternalLink
} from 'lucide-react';

interface SoftwareItem {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  download_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

const emptyForm = {
  name: '',
  description: '',
  download_url: '',
  image_url: '',
  is_active: true,
  sort_order: 0,
};

const AdminSoftwareDownloads = () => {
  const [items, setItems] = useState<SoftwareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<SoftwareItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('software_downloads' as any)
      .select('*')
      .order('sort_order')
      .order('created_at');
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const openNew = () => {
    setEditing(null);
    setIsNew(true);
    setForm({ ...emptyForm, sort_order: items.length });
  };

  const openEdit = (item: SoftwareItem) => {
    setIsNew(false);
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description || '',
      download_url: item.download_url,
      image_url: item.image_url || '',
      is_active: item.is_active,
      sort_order: item.sort_order,
    });
  };

  const closeForm = () => {
    setEditing(null);
    setIsNew(false);
    setForm({ ...emptyForm });
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from('software-images')
        .upload(fileName, file, { upsert: false });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from('software-images')
        .getPublicUrl(fileName);
      setForm(f => ({ ...f, image_url: urlData.publicUrl }));
      toast.success('ছবি আপলোড হয়েছে!');
    } catch (err: any) {
      toast.error('আপলোড ব্যর্থ: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('নাম দিন'); return; }
    if (!form.download_url.trim()) { toast.error('ডাউনলোড লিংক দিন'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        download_url: form.download_url.trim(),
        image_url: form.image_url.trim() || null,
        is_active: form.is_active,
        sort_order: Number(form.sort_order),
      };
      if (isNew) {
        const { error } = await supabase.from('software_downloads' as any).insert(payload);
        if (error) throw error;
        toast.success('যোগ করা হয়েছে!');
      } else if (editing) {
        const { error } = await supabase.from('software_downloads' as any)
          .update(payload).eq('id', editing.id);
        if (error) throw error;
        toast.success('আপডেট হয়েছে!');
      }
      closeForm();
      fetchItems();
    } catch (err: any) {
      toast.error('সমস্যা হয়েছে: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: SoftwareItem) => {
    const { error } = await supabase.from('software_downloads' as any)
      .update({ is_active: !item.is_active }).eq('id', item.id);
    if (!error) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
      toast.success(item.is_active ? 'হাইড করা হয়েছে' : 'দেখানো হচ্ছে');
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('software_downloads' as any).delete().eq('id', id);
    if (!error) {
      setItems(prev => prev.filter(i => i.id !== id));
      setDeleteConfirm(null);
      toast.success('মুছে ফেলা হয়েছে');
    }
  };

  const isFormOpen = isNew || !!editing;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: 'Sora, sans-serif' }}>
            Software Downloads
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            সফটওয়্যার ডাউনলোড লিংক ম্যানেজ করুন
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))', boxShadow: '0 4px 16px hsla(258,78%,55%,0.30)' }}
        >
          <Plus size={16} /> নতুন যোগ করুন
        </button>
      </div>

      {/* Add/Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg glass-card rounded-3xl p-6 border border-border shadow-strong">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-black text-lg text-foreground" style={{ fontFamily: 'Sora, sans-serif' }}>
                {isNew ? '➕ নতুন সফটওয়্যার যোগ' : '✏️ এডিট করুন'}
              </h2>
              <button onClick={closeForm} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  সফটওয়্যারের ছবি
                </label>
                <div className="flex items-start gap-3">
                  {/* Preview */}
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-border"
                    style={{ background: 'hsla(258,78%,55%,0.06)' }}
                  >
                    {form.image_url ? (
                      <img src={form.image_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <ImageIcon size={24} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-border glass-card hover:border-primary/40 transition-all w-full justify-center"
                    >
                      {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
                      {uploading ? 'আপলোড হচ্ছে...' : 'ছবি আপলোড করুন'}
                    </button>
                    <input
                      type="text"
                      placeholder="অথবা ছবির URL দিন"
                      value={form.image_url}
                      onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                      className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  সফটওয়্যারের নাম *
                </label>
                <input
                  type="text"
                  placeholder="যেমন: Adobe Photoshop 2024"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  সংক্ষিপ্ত বিবরণ
                </label>
                <input
                  type="text"
                  placeholder="যেমন: Windows 10/11 Compatible"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Download URL */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  ডাউনলোড লিংক *
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/download/software.exe"
                  value={form.download_url}
                  onChange={e => setForm(f => ({ ...f, download_url: e.target.value }))}
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-fira"
                />
              </div>

              {/* Sort order & active */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    ক্রম নম্বর
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.sort_order}
                    onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                      className={`w-10 h-6 rounded-full transition-all flex items-center px-1 cursor-pointer ${form.is_active ? '' : 'bg-muted'}`}
                      style={form.is_active ? { background: 'hsl(258,78%,55%)' } : {}}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-all ${form.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-sm font-medium text-foreground">সক্রিয়</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeForm}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold glass-card border border-border text-muted-foreground hover:text-foreground transition-all"
              >
                বাতিল
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))' }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Items Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center">
          <Download size={40} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">এখনো কোনো সফটওয়্যার যোগ করা হয়নি</p>
          <button onClick={openNew}
            className="mt-4 px-5 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))' }}>
            প্রথম সফটওয়্যার যোগ করুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item.id}
              className={`glass-card rounded-2xl overflow-hidden border transition-all ${!item.is_active ? 'opacity-50' : 'hover:border-primary/30'}`}>
              {/* Image */}
              <div className="h-36 relative flex items-center justify-center"
                style={{ background: 'hsla(258,78%,55%,0.05)' }}>
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-contain p-3" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Download size={32} className="text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">No Image</span>
                  </div>
                )}
                {/* Active badge */}
                <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${item.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                  {item.is_active ? 'Active' : 'Hidden'}
                </div>
              </div>

              {/* Info */}
              <div className="p-3 space-y-1">
                <p className="font-bold text-foreground text-sm line-clamp-1">{item.name}</p>
                {item.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-1">{item.description}</p>
                )}
                <a href={item.download_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[10px] text-primary hover:underline font-fira line-clamp-1">
                  <ExternalLink size={10} /> {item.download_url.replace(/^https?:\/\//, '').slice(0, 30)}...
                </a>
              </div>

              {/* Actions */}
              <div className="border-t border-border px-3 py-2 flex items-center gap-1.5">
                <button
                  onClick={() => openEdit(item)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold glass-card hover:border-primary/30 transition-all text-muted-foreground hover:text-primary"
                >
                  <Pencil size={11} /> এডিট
                </button>
                <button
                  onClick={() => handleToggleActive(item)}
                  className="p-1.5 rounded-lg glass-card hover:border-primary/30 transition-all text-muted-foreground hover:text-foreground"
                  title={item.is_active ? 'হাইড করুন' : 'দেখান'}
                >
                  {item.is_active ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
                {deleteConfirm === item.id ? (
                  <>
                    <button onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-[10px] font-bold transition-all">
                      হ্যাঁ
                    </button>
                    <button onClick={() => setDeleteConfirm(null)}
                      className="p-1.5 rounded-lg glass-card text-muted-foreground text-[10px] font-bold transition-all">
                      না
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(item.id)}
                    className="p-1.5 rounded-lg glass-card hover:border-destructive/30 transition-all text-muted-foreground hover:text-destructive"
                    title="মুছুন"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSoftwareDownloads;
