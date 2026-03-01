import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Percent, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { handleDbError } from '@/lib/errorHandler';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ code: '', description: '', discount_type: 'percentage', discount_value: '', min_order_amount: '0', max_uses: '', is_active: true, expires_at: '' });
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    setCoupons(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      code: form.code.toUpperCase(), description: form.description,
      discount_type: form.discount_type, discount_value: parseFloat(form.discount_value),
      min_order_amount: parseFloat(form.min_order_amount) || 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      is_active: form.is_active,
      expires_at: form.expires_at || null,
    };
    if (editing) {
      const { error } = await supabase.from('coupons').update(payload).eq('id', editing.id);
      if (error) toast.error(handleDbError(error)); else { toast.success('Updated!'); setShowForm(false); fetchCoupons(); }
    } else {
      const { error } = await supabase.from('coupons').insert(payload);
      if (error) toast.error(handleDbError(error)); else { toast.success('Coupon created!'); setShowForm(false); fetchCoupons(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete coupon?')) return;
    await supabase.from('coupons').delete().eq('id', id);
    toast.success('Deleted'); fetchCoupons();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Coupons & <span className="gradient-text">Discounts</span>
          </h1>
        </div>
        <button onClick={() => { setEditing(null); setForm({ code:'',description:'',discount_type:'percentage',discount_value:'',min_order_amount:'0',max_uses:'',is_active:true,expires_at:'' }); setShowForm(true); }}
          className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <Plus size={16} /> New Coupon
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">{editing ? 'Edit Coupon' : 'New Coupon'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Coupon Code *</label>
                <input required value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
                  placeholder="e.g. SAVE20" className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground font-mono uppercase focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                  <select value={form.discount_type} onChange={e => setForm({...form, discount_type: e.target.value})}
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (৳)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Value *</label>
                  <input required type="number" step="0.01" value={form.discount_value} onChange={e => setForm({...form, discount_value: e.target.value})}
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Min Order (৳)</label>
                  <input type="number" value={form.min_order_amount} onChange={e => setForm({...form, min_order_amount: e.target.value})}
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Max Uses</label>
                  <input type="number" value={form.max_uses} onChange={e => setForm({...form, max_uses: e.target.value})}
                    placeholder="Unlimited" className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Expiry Date</label>
                <input type="datetime-local" value={form.expires_at} onChange={e => setForm({...form, expires_at: e.target.value})}
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-4 h-4 accent-primary" />
                <span className="text-sm text-foreground">Active</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 glass-card py-2.5 rounded-xl text-sm text-muted-foreground">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-glow py-2.5 rounded-xl text-sm font-semibold">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array.from({length: 4}).map((_, i) => (
          <div key={i} className="h-36 glass-card rounded-2xl animate-pulse" />
        )) : coupons.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-muted-foreground">
            <Tag size={48} className="mx-auto mb-3 opacity-30" />
            <p>No coupons yet. Create your first coupon!</p>
          </div>
        ) : coupons.map((coupon) => (
          <div key={coupon.id} className="glass-card-hover rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-mono font-bold text-primary text-lg">{coupon.code}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{coupon.description}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(coupon); setForm({ code: coupon.code, description: coupon.description || '', discount_type: coupon.discount_type, discount_value: String(coupon.discount_value), min_order_amount: String(coupon.min_order_amount), max_uses: coupon.max_uses ? String(coupon.max_uses) : '', is_active: coupon.is_active, expires_at: '' }); setShowForm(true); }}
                  className="p-1.5 text-muted-foreground hover:text-primary"><Edit size={14} /></button>
                <button onClick={() => handleDelete(coupon.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="glass-card px-3 py-1 rounded-full text-xs font-bold text-primary">
                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `৳${coupon.discount_value} OFF`}
              </span>
              {coupon.min_order_amount > 0 && (
                <span className="text-xs text-muted-foreground">Min: ৳{coupon.min_order_amount}</span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full ${coupon.is_active ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                {coupon.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Used: {coupon.uses_count} times {coupon.max_uses ? `/ ${coupon.max_uses}` : '(unlimited)'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCoupons;
