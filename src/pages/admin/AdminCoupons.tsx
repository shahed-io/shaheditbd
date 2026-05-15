import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Tag, Copy, CheckCircle, Sparkles, Calendar, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import { handleDbError } from '@/lib/errorHandler';
import { z } from 'zod';

const couponSchema = z.object({
  code: z.string().trim().min(2, 'Code must be at least 2 characters').max(50, 'Code must be ≤ 50 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Code can only contain uppercase letters, numbers, hyphens and underscores'),
  description: z.string().trim().max(200, 'Description must be ≤ 200 characters').optional().or(z.literal('')),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.string().refine(v => {
    const n = parseFloat(v);
    return !isNaN(n) && n > 0 && n <= 100000;
  }, 'Discount value must be between 0 and 100000'),
  min_order_amount: z.string().refine(v => {
    const n = parseFloat(v);
    return isNaN(n) || n >= 0;
  }, 'Min order amount must be 0 or more'),
  max_uses: z.string().refine(v => !v || (parseInt(v) > 0 && parseInt(v) <= 1000000), 'Usage limit must be between 1 and 1,000,000').optional().or(z.literal('')),
  is_active: z.boolean(),
  expires_at: z.string().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.discount_type === 'percentage') {
    const v = parseFloat(data.discount_value);
    if (v > 100) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Percentage discount cannot exceed 100%', path: ['discount_value'] });
  }
});

const inputClass = "w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground";
const labelClass = "text-xs text-muted-foreground mb-1 block";

const emptyForm = {
  code: '', description: '', discount_type: 'percentage', discount_value: '',
  min_order_amount: '0', max_uses: '', is_active: true, expires_at: '',
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCoupons = async () => {
    setLoading(true);
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    setCoupons(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate with Zod
    const validation = couponSchema.safeParse({ ...form, code: form.code.toUpperCase() });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    const d = validation.data;
    if (!d.discount_value || parseFloat(d.discount_value) <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }
    setSaving(true);
    const payload = {
      code: d.code,
      description: d.description || null,
      discount_type: d.discount_type,
      discount_value: parseFloat(d.discount_value),
      min_order_amount: parseFloat(d.min_order_amount) || 0,
      max_uses: d.max_uses ? parseInt(d.max_uses) : null,
      is_active: d.is_active,
      expires_at: d.expires_at || null,
    };
    if (editing) {
      const { error } = await supabase.from('coupons').update(payload).eq('id', editing.id);
      if (error) toast.error(handleDbError(error));
      else { toast.success('Coupon updated!'); setShowForm(false); fetchCoupons(); }
    } else {
      const { error } = await supabase.from('coupons').insert(payload);
      if (error) toast.error(handleDbError(error));
      else { toast.success('Coupon created!'); setShowForm(false); fetchCoupons(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    await supabase.from('coupons').delete().eq('id', id);
    toast.success('Deleted'); fetchCoupons();
  };

  const handleEdit = (coupon: any) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_order_amount: String(coupon.min_order_amount || 0),
      max_uses: coupon.max_uses ? String(coupon.max_uses) : '',
      is_active: coupon.is_active,
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : '',
    });
    setShowForm(true);
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success(`Copied: ${code}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isExpired = (expires_at: string | null) => expires_at && new Date(expires_at) < new Date();
  const usagePercent = (coupon: any) => coupon.max_uses ? Math.min(100, (coupon.uses_count / coupon.max_uses) * 100) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Coupons & <span className="gradient-text">Discounts</span>
          </h1>
          <p className="text-muted-foreground text-sm">{coupons.length} coupons total</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true); }}
          className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold"
        >
          <Plus size={16} /> New Coupon
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">{editing ? 'Edit Coupon' : 'New Coupon'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Coupon Code *</label>
                <input
                  required
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SAVE20"
                  className={`${inputClass} font-mono uppercase tracking-widest`}
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. 20% off for new customers" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Discount Type</label>
                  <select value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })} className={inputClass}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (৳)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Value * {form.discount_type === 'percentage' ? '(%)' : '(৳)'}</label>
                  <input required type="number" step="0.01" min="0.01" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Min Order Amount (৳)</label>
                  <input type="number" min="0" value={form.min_order_amount} onChange={e => setForm({ ...form, min_order_amount: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Usage Limit</label>
                  <input type="number" min="1" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} placeholder="Unlimited" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Expiry Date & Time</label>
                <input type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} className={inputClass} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-primary" />
                <span className="text-sm text-foreground">Active</span>
              </label>

              {/* Live Preview */}
              {form.code && (
                <div className="glass-card rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Preview</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">{form.code}</span>
                    <span className="text-xs text-muted-foreground">→</span>
                    <span className="text-sm font-semibold text-foreground">
                      {form.discount_value ? (form.discount_type === 'percentage' ? `${form.discount_value}% OFF` : `৳${form.discount_value} OFF`) : '—'}
                    </span>
                    {form.min_order_amount && parseFloat(form.min_order_amount) > 0 && (
                      <span className="text-xs text-muted-foreground">· Min ৳{form.min_order_amount}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 glass-card py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-glow py-2.5 rounded-xl text-sm font-semibold">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 glass-card rounded-2xl animate-pulse" />)
        ) : coupons.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-muted-foreground">
            <Tag size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No coupons yet</p>
            <p className="text-sm mt-1">Create your first coupon to start offering discounts</p>
          </div>
        ) : coupons.map((coupon) => {
          const expired = isExpired(coupon.expires_at);
          const usage = usagePercent(coupon);
          const isPercent = coupon.discount_type === 'percentage';
          const valueLabel = isPercent ? `${coupon.discount_value}%` : `৳${coupon.discount_value}`;
          return (
            <div
              key={coupon.id}
              className={`group relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-background/80 via-primary/[0.04] to-background/80 backdrop-blur-xl p-5 shadow-[0_8px_30px_-12px_rgba(99,102,241,0.25)] hover:shadow-[0_15px_40px_-10px_rgba(99,102,241,0.4)] hover:border-primary/40 transition-all duration-500 ${expired ? 'opacity-60' : ''}`}
            >
              {/* Decorative blob */}
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/20 blur-3xl opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-gradient-to-br from-pink-500/20 to-amber-400/15 blur-3xl opacity-50 pointer-events-none" />

              {/* Ticket notch perforations */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 w-4 h-4 rounded-full bg-background border border-primary/15" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 -mr-2 w-4 h-4 rounded-full bg-background border border-primary/15" />

              <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Sparkles size={13} className="text-amber-400 animate-pulse" />
                      <span className="font-mono font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-lg truncate">
                        {coupon.code}
                      </span>
                      <button
                        onClick={() => copyCode(coupon.code, coupon.id)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                        title="Copy code"
                      >
                        {copiedId === coupon.id ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                    {coupon.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{coupon.description}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => handleEdit(coupon)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Edit size={14} /></button>
                    <button onClick={() => handleDelete(coupon.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>

                {/* Big discount display */}
                <div className="my-4 flex items-end gap-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary via-fuchsia-500 to-pink-500 leading-none">
                      {valueLabel}
                    </span>
                    <span className="text-xs font-bold text-primary/70 uppercase tracking-wider">OFF</span>
                  </div>
                </div>

                {/* Meta chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${coupon.is_active && !expired ? 'text-emerald-300 bg-emerald-400/10 border border-emerald-400/30' : 'text-red-300 bg-red-400/10 border border-red-400/30'}`}>
                    {expired ? 'Expired' : coupon.is_active ? '● Active' : 'Inactive'}
                  </span>
                  {coupon.min_order_amount > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground border border-border">
                      Min ৳{coupon.min_order_amount}
                    </span>
                  )}
                  {coupon.customer_email && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-400/10 text-purple-300 border border-purple-400/30 flex items-center gap-1">
                      <Users size={9} /> Personal
                    </span>
                  )}
                </div>

                {/* Usage bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp size={11} /> Used: <span className="font-bold text-foreground">{coupon.uses_count}</span>
                    </span>
                    <span className="text-muted-foreground">{coupon.max_uses ? `of ${coupon.max_uses}` : '∞ Unlimited'}</span>
                  </div>
                  {usage !== null && (
                    <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${usage >= 100 ? 'bg-gradient-to-r from-red-500 to-rose-500' : usage >= 80 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-primary via-fuchsia-500 to-pink-500'}`}
                        style={{ width: `${Math.max(3, usage)}%` }}
                      />
                    </div>
                  )}
                </div>

                {coupon.expires_at && (
                  <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
                    <Calendar size={11} /> Expires {new Date(coupon.expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminCoupons;
