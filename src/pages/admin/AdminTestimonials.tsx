import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Star, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';

type Testimonial = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
  product: string;
  date: string;
  enabled: boolean;
  color: string;
};

const COLORS = ['hsl(258,78%,55%)', 'hsl(15,100%,58%)', 'hsl(158,64%,40%)', 'hsl(38,100%,50%)', 'hsl(200,90%,50%)', 'hsl(330,85%,55%)'];
const EMPTY = (): Testimonial => ({
  id: crypto.randomUUID(),
  name: 'নতুন গ্রাহক',
  role: 'Verified Buyer',
  avatar: '😊',
  rating: 5,
  text: 'এখানে রিভিউ লিখুন...',
  product: 'Windows 11 Pro',
  date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  enabled: true,
  color: COLORS[0],
});

const AdminTestimonials = () => {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'testimonials_data').maybeSingle();
    if (data?.value) { try { setItems(JSON.parse(data.value)); } catch {} }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('site_settings').upsert({ key: 'testimonials_data', value: JSON.stringify(items) }, { onConflict: 'key' });
    toast.success('রিভিউ সেভ হয়েছে!');
    setSaving(false);
  };

  const add = () => {
    const t = EMPTY();
    setItems(p => [...p, t]);
    setEditing(t.id);
  };

  const remove = (id: string) => {
    setItems(p => p.filter(x => x.id !== id));
    if (editing === id) setEditing(null);
  };

  const update = (id: string, field: keyof Testimonial, value: unknown) =>
    setItems(p => p.map(x => x.id === id ? { ...x, [field]: value } : x));

  const move = (id: string, dir: -1 | 1) => {
    setItems(prev => {
      const idx = prev.findIndex(x => x.id === id);
      if (idx < 0) return prev;
      const nIdx = idx + dir;
      if (nIdx < 0 || nIdx >= prev.length) return prev;
      const a = [...prev];
      [a[idx], a[nIdx]] = [a[nIdx], a[idx]];
      return a;
    });
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 glass-card rounded-2xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Testimonials <span className="gradient-text">Manager</span>
          </h1>
          <p className="text-muted-foreground text-sm">হোমপেজের রিভিউ সেকশন পরিচালনা করুন</p>
        </div>
        <div className="flex gap-2">
          <button onClick={add} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold glass-card hover:border-primary/40 text-primary transition-all">
            <Plus size={15} /> নতুন রিভিউ
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold">
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground glass-card rounded-2xl p-4">
        <div>মোট রিভিউ: <span className="font-bold text-foreground">{items.length}</span></div>
        <div>চালু রিভিউ: <span className="font-bold text-primary">{items.filter(x => x.enabled).length}</span></div>
      </div>

      {items.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Star size={40} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">কোনো রিভিউ নেই। নতুন রিভিউ যোগ করুন।</p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={item.id} className="glass-card rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setEditing(editing === item.id ? null : item.id)}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: `${item.color}15`, border: `1.5px solid ${item.color}40` }}>
                {item.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-foreground truncate">{item.name}</div>
                <div className="text-xs text-muted-foreground truncate">{item.product} · {'★'.repeat(item.rating)}</div>
              </div>
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <button onClick={() => update(item.id, 'enabled', !item.enabled)}
                  className={`p-1.5 rounded-lg ${item.enabled ? 'text-primary' : 'text-muted-foreground'} transition-colors`}>
                  {item.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => move(item.id, -1)} disabled={idx === 0} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30">
                  <ChevronUp size={14} />
                </button>
                <button onClick={() => move(item.id, 1)} disabled={idx === items.length - 1} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30">
                  <ChevronDown size={14} />
                </button>
                <button onClick={() => remove(item.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Editor */}
            {editing === item.id && (
              <div className="border-t border-border/50 p-5 space-y-4 bg-muted/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="নাম" value={item.name} onChange={v => update(item.id, 'name', v)} />
                  <Field label="রোল / পেশা" value={item.role} onChange={v => update(item.id, 'role', v)} />
                  <Field label="অ্যাভাটার ইমোজি" value={item.avatar} onChange={v => update(item.id, 'avatar', v)} />
                  <Field label="প্রোডাক্ট নাম" value={item.product} onChange={v => update(item.id, 'product', v)} />
                  <Field label="তারিখ" value={item.date} onChange={v => update(item.id, 'date', v)} />
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">রেটিং (১-৫)</label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => update(item.id, 'rating', n)}
                          className={`w-9 h-9 rounded-xl text-lg transition-all ${item.rating >= n ? 'bg-primary/20 text-yellow-400' : 'glass-card text-muted-foreground'}`}>
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">রিভিউ টেক্সট</label>
                  <textarea value={item.text} rows={3} onChange={e => update(item.id, 'text', e.target.value)}
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none" />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">অ্যাকসেন্ট কালার</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => update(item.id, 'color', c)}
                        className="w-8 h-8 rounded-full border-2 transition-all"
                        style={{ background: c, borderColor: item.color === c ? 'white' : 'transparent', transform: item.color === c ? 'scale(1.2)' : 'scale(1)' }} />
                    ))}
                    <input type="color" value={item.color.startsWith('hsl') ? '#7c3aed' : item.color}
                      onChange={e => update(item.id, 'color', e.target.value)}
                      className="w-8 h-8 rounded-full border border-border cursor-pointer" title="কাস্টম রঙ" />
                  </div>
                </div>

                {/* Preview */}
                <div className="rounded-2xl p-4 mt-2"
                  style={{ background: `${item.color}08`, border: `1px solid ${item.color}25` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{item.avatar}</span>
                    <div>
                      <div className="font-semibold text-sm text-foreground">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.role}</div>
                    </div>
                    <div className="ml-auto text-yellow-400 text-xs">{'★'.repeat(item.rating)}</div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">"{item.text}"</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
    <input value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
  </div>
);

export default AdminTestimonials;
