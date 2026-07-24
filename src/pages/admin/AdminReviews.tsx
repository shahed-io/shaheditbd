import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Star, Eye, EyeOff, Upload, ArrowUp, ArrowDown, Search } from 'lucide-react';

const SETTINGS_KEY = 'testimonials_data_v3';

interface Review {
  id: string;
  name: string;
  location: string;
  avatar: string; // initials OR URL
  rating: number;
  review: string;
  product: string;
  date: string;
  verified: boolean;
  is_visible?: boolean;
}

const emptyReview = (): Review => ({
  id: crypto.randomUUID(),
  name: '',
  location: 'Facebook Review',
  avatar: '',
  rating: 5,
  review: '',
  product: 'Verified Purchase',
  date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  verified: true,
  is_visible: true,
});

const isUrl = (s: string) => /^https?:\/\//i.test(s || '');

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();
    if (data?.value) {
      try {
        const parsed: Review[] = JSON.parse(data.value);
        setReviews(Array.isArray(parsed) ? parsed : []);
      } catch {
        setReviews([]);
      }
    } else {
      setReviews([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const persist = async (next: Review[]) => {
    setSaving(true);
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: SETTINGS_KEY, value: JSON.stringify(next), category: 'seo' }, { onConflict: 'key' });
    setSaving(false);
    if (error) { toast.error('Save failed: ' + error.message); return false; }
    setReviews(next);
    return true;
  };

  const openNew = () => { setEditing(emptyReview()); setOpen(true); };
  const openEdit = (r: Review) => { setEditing({ ...r }); setOpen(true); };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim() || !editing.review.trim()) {
      toast.error('Name and review are required');
      return;
    }
    const exists = reviews.some(r => r.id === editing.id);
    const next = exists
      ? reviews.map(r => r.id === editing.id ? editing : r)
      : [editing, ...reviews];
    if (await persist(next)) {
      toast.success(exists ? 'Review updated' : 'Review added');
      setOpen(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    if (await persist(reviews.filter(r => r.id !== id))) toast.success('Deleted');
  };

  const toggleVisible = async (id: string) => {
    const next = reviews.map(r => r.id === id ? { ...r, is_visible: !(r.is_visible !== false) } : r);
    await persist(next);
  };

  const move = async (id: string, dir: -1 | 1) => {
    const i = reviews.findIndex(r => r.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= reviews.length) return;
    const next = [...reviews];
    [next[i], next[j]] = [next[j], next[i]];
    await persist(next);
  };

  const handleUpload = async (file: File) => {
    if (!editing) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `reviews/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file, {
        cacheControl: '3600', upsert: false, contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      setEditing({ ...editing, avatar: data.publicUrl });
      toast.success('Photo uploaded');
    } catch (e: any) {
      toast.error('Upload failed: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const filtered = reviews.filter(r =>
    !search.trim() ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.review.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Customer Reviews</h1>
          <p className="text-sm text-muted-foreground">
            Manage homepage testimonials. Add one review at a time — each will appear in the storefront review carousel.
          </p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus size={16} /> Add Review</Button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name or content..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="text-xs text-muted-foreground">
        Total: <b>{reviews.length}</b> · Visible: <b>{reviews.filter(r => r.is_visible !== false).length}</b>
        {saving && <span className="ml-2">· Saving…</span>}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No reviews yet. Click <b>Add Review</b> to create your first one.
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r, idx) => {
            const visible = r.is_visible !== false;
            return (
              <Card key={r.id} className={`p-4 flex flex-wrap items-start gap-4 ${!visible ? 'opacity-60' : ''}`}>
                <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-sm">
                  {isUrl(r.avatar) ? (
                    <img src={r.avatar} alt={r.name} className="w-full h-full object-cover" />
                  ) : (
                    r.avatar || r.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{r.name}</span>
                    {r.verified && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Verified</span>}
                    <span className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {r.location} · {r.date} · {r.product}
                  </div>
                  <p className="text-sm line-clamp-2">{r.review}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => move(r.id, -1)} disabled={idx === 0} title="Move up"><ArrowUp size={16} /></Button>
                  <Button variant="ghost" size="icon" onClick={() => move(r.id, 1)} disabled={idx === filtered.length - 1} title="Move down"><ArrowDown size={16} /></Button>
                  <Button variant="ghost" size="icon" onClick={() => toggleVisible(r.id)} title={visible ? 'Hide' : 'Show'}>
                    {visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil size={16} /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(r.id)} className="text-red-600 hover:text-red-700"><Trash2 size={16} /></Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing && reviews.some(r => r.id === editing.id) ? 'Edit Review' : 'New Review'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Customer Name *</Label>
                  <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Rafit Hasan" />
                </div>
                <div>
                  <Label>Location / Source</Label>
                  <Input value={editing.location} onChange={e => setEditing({ ...editing, location: e.target.value })} placeholder="Facebook Review" />
                </div>
              </div>

              <div>
                <Label>Avatar / Profile Photo</Label>
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold flex-shrink-0">
                    {isUrl(editing.avatar) ? (
                      <img src={editing.avatar} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      editing.avatar || editing.name.slice(0, 2).toUpperCase() || '?'
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      value={editing.avatar}
                      onChange={e => setEditing({ ...editing, avatar: e.target.value })}
                      placeholder="Paste image URL or upload — otherwise initials will show"
                    />
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer text-primary hover:underline">
                      <Upload size={14} />
                      {uploading ? 'Uploading…' : 'Upload photo'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <Label>Review Text *</Label>
                <Textarea
                  rows={5}
                  value={editing.review}
                  onChange={e => setEditing({ ...editing, review: e.target.value })}
                  placeholder="Write the customer's review here…"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Rating</Label>
                  <select
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                    value={editing.rating}
                    onChange={e => setEditing({ ...editing, rating: Number(e.target.value) })}
                  >
                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ★</option>)}
                  </select>
                </div>
                <div>
                  <Label>Product / Tag</Label>
                  <Input value={editing.product} onChange={e => setEditing({ ...editing, product: e.target.value })} placeholder="Verified Purchase" />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })} placeholder="Jan 15, 2026" />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Switch checked={editing.verified} onCheckedChange={v => setEditing({ ...editing, verified: v })} />
                  <Label className="cursor-pointer">Verified badge</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editing.is_visible !== false} onCheckedChange={v => setEditing({ ...editing, is_visible: v })} />
                  <Label className="cursor-pointer">Visible on site</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Review'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReviews;
