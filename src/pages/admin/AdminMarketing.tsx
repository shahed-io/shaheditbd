import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Megaphone, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Tag, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { handleDbError } from '@/lib/errorHandler';

const AdminMarketing = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ key: 'announcement_text', value: '', category: 'marketing' });
  const [saving, setSaving] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data } = await supabase.from('site_settings').select('*').eq('category', 'marketing').order('updated_at', { ascending: false });
    setAnnouncements(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('site_settings').update({ value: form.value }).eq('id', editing.id);
      if (error) toast.error(handleDbError(error)); else { toast.success('আপডেট হয়েছে!'); setShowForm(false); fetchAnnouncements(); }
    } else {
      const { error } = await supabase.from('site_settings').insert({ key: form.key, value: form.value, category: 'marketing' });
      if (error) toast.error(handleDbError(error)); else { toast.success('যোগ করা হয়েছে!'); setShowForm(false); fetchAnnouncements(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('এটি ডিলিট করবেন?')) return;
    await supabase.from('site_settings').delete().eq('id', id);
    toast.success('ডিলিট হয়েছে');
    fetchAnnouncements();
  };

  const quickActions = [
    { label: 'Flash Sale চালু করুন', icon: Tag, desc: 'হোমপেজে ফ্ল্যাশ সেল ব্যানার দেখান', key: 'flash_sale_active' },
    { label: 'Announcement Bar', icon: Bell, desc: 'টপ বারে বিজ্ঞাপন টেক্সট সেট করুন', key: 'announcement_text' },
    { label: 'Promo Banner', icon: Megaphone, desc: 'হিরো সেকশনে প্রমো ব্যানার', key: 'promo_banner' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Marketing & <span className="gradient-text">Promotions</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">স্টোরের মার্কেটিং কন্টেন্ট পরিচালনা করুন</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ key: 'announcement_text', value: '', category: 'marketing' }); setShowForm(true); }}
          className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <Plus size={16} /> নতুন যোগ করুন
        </button>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <div key={action.key} className="glass-card-hover rounded-2xl p-5 cursor-pointer"
            onClick={() => { setEditing(null); setForm({ key: action.key, value: '', category: 'marketing' }); setShowForm(true); }}>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <action.icon size={18} className="text-primary" />
            </div>
            <div className="font-semibold text-foreground text-sm">{action.label}</div>
            <div className="text-xs text-muted-foreground mt-1">{action.desc}</div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">{editing ? 'এডিট করুন' : 'নতুন মার্কেটিং আইটেম'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editing && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Key (identifier)</label>
                  <input value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} required
                    placeholder="যেমন: announcement_text"
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Value / Content *</label>
                <textarea value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} required rows={4}
                  placeholder="মার্কেটিং কন্টেন্ট লিখুন..."
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 glass-card py-2.5 rounded-xl text-sm text-muted-foreground">বাতিল</button>
                <button type="submit" disabled={saving} className="flex-1 btn-glow py-2.5 rounded-xl text-sm font-semibold">
                  {saving ? 'সেভ হচ্ছে...' : editing ? 'আপডেট' : 'সেভ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h3 className="font-semibold text-foreground">সক্রিয় মার্কেটিং কন্টেন্ট</h3>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 animate-pulse bg-muted/20 rounded-xl" />)}
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            <Megaphone size={32} className="mx-auto mb-3 opacity-30" />
            কোনো মার্কেটিং কন্টেন্ট নেই। উপরে "নতুন যোগ করুন" বাটনে ক্লিক করুন।
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {announcements.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-muted/10 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Tag size={15} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{item.key}</div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">{item.value || '(খালি)'}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(item); setForm({ key: item.key, value: item.value || '', category: 'marketing' }); setShowForm(true); }}
                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Edit size={14} /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMarketing;
