import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  CreditCard, Search, Filter, CheckCircle2, XCircle, Clock,
  Eye, RefreshCw, ExternalLink, ImageIcon, BadgeCheck,
  Settings, Plus, Trash2, GripVertical, Edit3, Save, X,
  Phone, Palette, Upload, AlertCircle, ToggleLeft, ToggleRight,
  ChevronUp, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePaymentSettings, PaymentMethodConfig, DEFAULT_PAYMENT_CONFIGS } from '@/hooks/usePaymentSettings';

// ── Asset logos (fallback) ──────────────────────────────────
import bkashLogo from '@/assets/payment/bkash.png';
import nagadLogo from '@/assets/payment/nagad.png';
import rocketLogo from '@/assets/payment/rocket.png';
import upayLogo from '@/assets/payment/upay.png';
import bkashMerchantLogo from '@/assets/payment/bkash-merchant.png';

const ASSET_LOGOS: Record<string, string> = {
  bkash: bkashLogo,
  nagad: nagadLogo,
  rocket: rocketLogo,
  upay: upayLogo,
  bkash_merchant: bkashMerchantLogo,
};

// ── Payments list types ─────────────────────────────────────
type PaymentProof = {
  id: string; order_id: string; transaction_id: string; payment_method: string;
  amount: number | null; status: string; screenshot_url: string | null;
  submitted_at: string; reviewed_at: string | null; admin_notes: string | null; user_id: string | null;
  orders?: { order_number: string; customer_name: string; customer_email: string; total: number } | null;
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:  { label: 'Pending',  color: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-500/15 text-green-500 border-green-500/30',   icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-destructive/15 text-destructive border-destructive/30', icon: XCircle },
};
const methodLabels: Record<string, string> = {
  bkash_online: 'bKash (Online)',
  bkash: 'BKash', nagad: 'Nagad', rocket: 'Rocket', bank: 'Bank Transfer',
  bank_transfer: 'Bank Transfer', upay: 'উপায়', bkash_merchant: 'BKash Merchant', wallet: 'Wallet',
};

// ── Empty method template ───────────────────────────────────
const newMethodTemplate = (): PaymentMethodConfig => ({
  id: `method_${Date.now()}`,
  label: '',
  number: '',
  type: 'Send Money',
  logoUrl: '',
  accentColor: 'hsl(258,78%,55%)',
  bgColor: 'hsla(258,78%,55%,0.07)',
  steps: [
    'আপনার অ্যাপ ওপেন করুন',
    '"Send Money" অপশনটি সিলেক্ট করুন',
    'নম্বর বক্সে উপরের নম্বরটি পেস্ট করুন',
    'পরিমাণ লিখুন ও PIN দিয়ে কনফার্ম করুন',
    'Transaction ID কপি করুন',
    'নিচের বক্সে TrxID পেস্ট করে অর্ডার সম্পন্ন করুন',
  ],
  isActive: true,
  sortOrder: 999,
});

// ── Method Editor Dialog ────────────────────────────────────
const MethodEditor = ({
  method, onSave, onClose,
}: {
  method: PaymentMethodConfig;
  onSave: (m: PaymentMethodConfig) => void;
  onClose: () => void;
}) => {
  const [form, setForm] = useState<PaymentMethodConfig>({ ...method });
  const [stepInput, setStepInput] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const set = (key: keyof PaymentMethodConfig, val: any) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `payment-logos/${form.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      set('logoUrl', publicUrl);
      toast.success('লোগো আপলোড সফল');
    } catch {
      toast.error('লোগো আপলোড ব্যর্থ');
    } finally {
      setUploading(false);
    }
  };

  const addStep = () => {
    if (!stepInput.trim()) return;
    set('steps', [...form.steps, stepInput.trim()]);
    setStepInput('');
  };

  const removeStep = (i: number) =>
    set('steps', form.steps.filter((_, idx) => idx !== i));

  const moveStep = (i: number, dir: -1 | 1) => {
    const arr = [...form.steps];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    set('steps', arr);
  };

  const updateStep = (i: number, val: string) => {
    const arr = [...form.steps];
    arr[i] = val;
    set('steps', arr);
  };

  const logoSrc = form.logoUrl || ASSET_LOGOS[form.id] || '';

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 size={18} className="text-primary" />
            {method.label ? `${method.label} সম্পাদনা` : 'নতুন পেমেন্ট মেথড'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase">নাম *</label>
              <Input value={form.label} onChange={e => set('label', e.target.value)} placeholder="যেমন: BKash" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase">নম্বর *</label>
              <Input value={form.number} onChange={e => set('number', e.target.value)} placeholder="01XXXXXXXXX" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase">পেমেন্ট টাইপ</label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Send Money">Send Money</SelectItem>
                  <SelectItem value="Merchant Payment">Merchant Payment</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase">স্ট্যাটাস</label>
              <button
                type="button"
                onClick={() => set('isActive', !form.isActive)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border w-full text-sm font-medium transition-colors ${
                  form.isActive
                    ? 'bg-green-500/10 border-green-500/30 text-green-600'
                    : 'bg-muted/50 border-border text-muted-foreground'
                }`}
              >
                {form.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                {form.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
              </button>
            </div>
          </div>

          {/* Logo */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase">লোগো</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-12 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                {logoSrc
                  ? <img src={logoSrc} alt="logo" className="h-10 w-auto object-contain" />
                  : <ImageIcon size={20} className="text-muted-foreground" />
                }
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  value={form.logoUrl}
                  onChange={e => set('logoUrl', e.target.value)}
                  placeholder="লোগো URL (ঐচ্ছিক)"
                  className="text-xs"
                />
                <div className="flex gap-2">
                  <Button
                    type="button" variant="outline" size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploading}
                    className="gap-2 text-xs"
                  >
                    <Upload size={13} />
                    {uploading ? 'আপলোড হচ্ছে...' : 'ফাইল আপলোড'}
                  </Button>
                  {form.logoUrl && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => set('logoUrl', '')} className="text-xs text-destructive">
                      রিসেট
                    </Button>
                  )}
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase flex items-center gap-2">
                <Palette size={12} /> Accent Color (HSL)
              </label>
              <div className="flex gap-2">
                <Input
                  value={form.accentColor}
                  onChange={e => set('accentColor', e.target.value)}
                  placeholder="hsl(338,90%,48%)"
                  className="text-xs font-mono"
                />
                <div
                  className="w-10 h-10 rounded-lg border border-border flex-shrink-0"
                  style={{ background: form.accentColor }}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase flex items-center gap-2">
                <Palette size={12} /> Background Color (HSLA)
              </label>
              <div className="flex gap-2">
                <Input
                  value={form.bgColor}
                  onChange={e => set('bgColor', e.target.value)}
                  placeholder="hsla(338,90%,48%,0.07)"
                  className="text-xs font-mono"
                />
                <div
                  className="w-10 h-10 rounded-lg border border-border flex-shrink-0"
                  style={{ background: form.bgColor }}
                />
              </div>
            </div>
          </div>

          {/* Warning */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase">সতর্কতা বার্তা (ঐচ্ছিক)</label>
            <Input
              value={form.warning ?? ''}
              onChange={e => set('warning', e.target.value || undefined)}
              placeholder="যেমন: অবশ্যই Send Money করবেন..."
            />
          </div>

          {/* Bank Transfer Fields */}
          {form.type === 'Bank Transfer' && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
              <p className="text-xs font-black tracking-widest uppercase text-primary flex items-center gap-1.5">🏦 ব্যাংক অ্যাকাউন্ট তথ্য</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase">ব্যাংকের নাম</label>
                  <Input value={form.bankName ?? ''} onChange={e => set('bankName', e.target.value)} placeholder="যেমন: Dutch-Bangla Bank" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase">অ্যাকাউন্ট নাম</label>
                  <Input value={form.accountName ?? ''} onChange={e => set('accountName', e.target.value)} placeholder="Account Holder Name" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase">অ্যাকাউন্ট নম্বর</label>
                  <Input value={form.number} onChange={e => set('number', e.target.value)} placeholder="Account Number" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase">শাখার নাম</label>
                  <Input value={form.branchName ?? ''} onChange={e => set('branchName', e.target.value)} placeholder="Branch Name" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase">রাউটিং নম্বর (ঐচ্ছিক)</label>
                <Input value={form.routingNumber ?? ''} onChange={e => set('routingNumber', e.target.value)} placeholder="Routing Number" />
              </div>
            </div>
          )}

          {/* Steps */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase">ধাপসমূহ</label>
            <div className="space-y-2 mb-3">
              {form.steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <Input
                    value={step}
                    onChange={e => updateStep(i, e.target.value)}
                    className="text-xs flex-1"
                  />
                  <button type="button" onClick={() => moveStep(i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ChevronUp size={14} />
                  </button>
                  <button type="button" onClick={() => moveStep(i, 1)} disabled={i === form.steps.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ChevronDown size={14} />
                  </button>
                  <button type="button" onClick={() => removeStep(i)} className="text-destructive/60 hover:text-destructive">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={stepInput}
                onChange={e => setStepInput(e.target.value)}
                placeholder="নতুন ধাপ লিখুন..."
                className="text-xs"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addStep())}
              />
              <Button type="button" variant="outline" size="sm" onClick={addStep} className="gap-2 text-xs">
                <Plus size={13} /> যোগ
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>বাতিল</Button>
          <Button
            onClick={() => {
              if (!form.label.trim() || !form.number.trim()) {
                toast.error('নাম এবং নম্বর আবশ্যক');
                return;
              }
              onSave(form);
            }}
            className="gap-1.5"
          >
            <Save size={14} /> সেভ করুন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Payment Settings Tab ────────────────────────────────────
const PaymentSettingsTab = () => {
  const { configs, saveMutation } = usePaymentSettings();
  const [localConfigs, setLocalConfigs] = useState<PaymentMethodConfig[] | null>(null);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodConfig | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const working = localConfigs ?? configs;

  const update = (updated: PaymentMethodConfig[]) => {
    setLocalConfigs(updated);
    setIsDirty(true);
  };

  const handleSave = (method: PaymentMethodConfig) => {
    const idx = working.findIndex(m => m.id === method.id);
    let next: PaymentMethodConfig[];
    if (idx >= 0) {
      next = working.map((m, i) => i === idx ? method : m);
    } else {
      next = [...working, { ...method, sortOrder: working.length }];
    }
    update(next);
    setEditingMethod(null);
    toast.success('পরিবর্তন সংরক্ষিত — এখন "সেভ করুন" বাটন ক্লিক করুন');
  };

  const toggleActive = (id: string) => {
    update(working.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m));
  };

  const deleteMethod = (id: string) => {
    if (!confirm('এই পেমেন্ট মেথড মুছে ফেলতে চান?')) return;
    update(working.filter(m => m.id !== id));
  };

  const moveMethod = (i: number, dir: -1 | 1) => {
    const arr = [...working];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    update(arr.map((m, idx) => ({ ...m, sortOrder: idx })));
  };

  const saveAll = async () => {
    await saveMutation.mutateAsync(working);
    setIsDirty(false);
    setLocalConfigs(null);
    toast.success('পেমেন্ট সেটিংস সফলভাবে সেভ হয়েছে!');
  };

  const resetToDefault = () => {
    if (!confirm('ডিফল্ট সেটিংসে ফিরে যেতে চান? সব পরিবর্তন হারিয়ে যাবে।')) return;
    update(DEFAULT_PAYMENT_CONFIGS);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Settings size={18} className="text-primary" /> পেমেন্ট নম্বর ম্যানেজমেন্ট
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">পেমেন্ট মেথডের নম্বর, লোগো ও তথ্য পরিবর্তন করুন</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={resetToDefault} className="text-xs gap-2">
            <RefreshCw size={13} /> রিসেট
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditingMethod(newMethodTemplate())} className="text-xs gap-2">
            <Plus size={13} /> নতুন মেথড
          </Button>
          {isDirty && (
            <Button size="sm" onClick={saveAll} disabled={saveMutation.isPending} className="gap-2 bg-green-600 hover:bg-green-700 text-white text-xs">
              <Save size={13} /> {saveMutation.isPending ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
            </Button>
          )}
        </div>
      </div>

      {isDirty && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 text-xs font-medium">
          <AlertCircle size={14} /> অসংরক্ষিত পরিবর্তন আছে — উপরে "সেভ করুন" বাটন ক্লিক করুন
        </div>
      )}

      {/* Method cards */}
      <div className="space-y-3">
        {working.map((method, i) => {
          const logoSrc = method.logoUrl || ASSET_LOGOS[method.id] || '';
          return (
            <div
              key={method.id}
              className={`glass-card rounded-xl border p-4 transition-all ${
                method.isActive ? 'border-border/50' : 'border-border/20 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Sort arrows */}
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveMethod(i, -1 as -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                    <ChevronUp size={14} />
                  </button>
                  <GripVertical size={14} className="text-muted-foreground/40 mx-auto" />
                  <button onClick={() => moveMethod(i, 1 as 1)} disabled={i === working.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                    <ChevronDown size={14} />
                  </button>
                </div>

                {/* Logo */}
                <div
                  className="w-14 h-10 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                  style={{ background: method.bgColor, border: `1px solid ${method.accentColor}30` }}
                >
                  {logoSrc
                    ? <img src={logoSrc} alt={method.label} className="h-8 w-auto object-contain" />
                    : <CreditCard size={18} style={{ color: method.accentColor }} />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-foreground">{method.label || '(নাম নেই)'}</p>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: `${method.accentColor}15`, color: method.accentColor }}
                    >
                      {method.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Phone size={11} className="text-muted-foreground" />
                    <p className="text-sm font-mono font-bold" style={{ color: method.accentColor }}>
                      {method.number || '—'}
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{method.steps.length} টি ধাপ</p>
                </div>

                {/* Color dot */}
                <div
                  className="w-6 h-6 rounded-full border-2 border-background flex-shrink-0"
                  style={{ background: method.accentColor }}
                  title={method.accentColor}
                />

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleActive(method.id)}
                    title={method.isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                    className={`p-1.5 rounded-lg transition-colors ${
                      method.isActive
                        ? 'text-green-600 bg-green-500/10 hover:bg-green-500/20'
                        : 'text-muted-foreground bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    {method.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button
                    onClick={() => setEditingMethod(method)}
                    className="p-1.5 rounded-lg text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                    title="সম্পাদনা"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => deleteMethod(method.id)}
                    className="p-1.5 rounded-lg text-destructive/60 bg-destructive/5 hover:bg-destructive/15 transition-colors"
                    title="মুছুন"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {working.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <CreditCard size={32} className="mx-auto mb-3 opacity-30" />
          কোনো পেমেন্ট মেথড নেই —{' '}
          <button className="text-primary underline" onClick={() => setEditingMethod(newMethodTemplate())}>
            নতুন যোগ করুন
          </button>
        </div>
      )}

      {editingMethod && (
        <MethodEditor
          method={editingMethod}
          onSave={handleSave}
          onClose={() => setEditingMethod(null)}
        />
      )}
    </div>
  );
};

// ── Main AdminPayments ──────────────────────────────────────
export default function AdminPayments() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'proofs' | 'settings'>('proofs');
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('all');
  const [methodFilter, setMethod]   = useState('all');
  const [selected, setSelected]     = useState<PaymentProof | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [imgOpen, setImgOpen]       = useState(false);

  const { data: payments = [], isLoading, refetch } = useQuery({
    queryKey: ['payment-proofs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_proofs')
        .select(`*, orders(order_number, customer_name, customer_email, total)`)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return data as PaymentProof[];
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const { error } = await supabase
        .from('payment_proofs')
        .update({ status, admin_notes: notes, reviewed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      if (selected) {
        await supabase
          .from('orders')
          .update({ payment_status: status === 'approved' ? 'paid' : 'failed' })
          .eq('id', selected.order_id);
      }
    },
    onSuccess: (_, vars) => {
      toast.success(`Payment ${vars.status === 'approved' ? 'approved' : 'rejected'} successfully`);
      qc.invalidateQueries({ queryKey: ['payment-proofs'] });
      if (selected) {
        const order = (selected as any).orders;
        supabase.functions.invoke('notify-telegram-event', {
          body: {
            title: vars.status === 'approved' ? '✅ Payment Approved' : '❌ Payment Rejected',
            lines: [
              order?.order_number ? `🧾 অর্ডার: #${order.order_number}` : null,
              order?.customer_name ? `👤 ${order.customer_name}` : null,
              order?.customer_email ? `📧 ${order.customer_email}` : null,
              `💵 ৳${Number(selected.amount || order?.total || 0).toLocaleString()}`,
              selected.payment_method ? `💳 ${selected.payment_method.toUpperCase()}` : null,
              selected.transaction_id ? `🔖 TrxID: ${selected.transaction_id}` : null,
            ],
          },
        }).catch(() => {});
      }
      setSelected(null);
    },
    onError: () => toast.error('Action failed, please try again'),
  });

  const filtered = payments.filter(p => {
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchMethod = methodFilter === 'all' || p.payment_method === methodFilter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || p.transaction_id.toLowerCase().includes(q)
      || (p.payment_method ?? '').toLowerCase().includes(q)
      || (methodLabels[p.payment_method] ?? '').toLowerCase().includes(q)
      || (p.orders?.order_number ?? '').toLowerCase().includes(q)
      || (p.orders?.customer_name ?? '').toLowerCase().includes(q)
      || (p.orders?.customer_email ?? '').toLowerCase().includes(q);
    return matchStatus && matchMethod && matchSearch;
  });

  const counts = {
    all: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    approved: payments.filter(p => p.status === 'approved').length,
    rejected: payments.filter(p => p.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard size={24} className="text-primary" />
            Payments
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Payment proof verification & settings management</p>
        </div>
        {activeTab === 'proofs' && (
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw size={14} /> Refresh
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-muted/40 border border-border/50 w-fit">
        {([
          { key: 'proofs', label: 'পেমেন্ট প্রুফ', icon: BadgeCheck },
          { key: 'settings', label: 'পেমেন্ট সেটিংস', icon: Settings },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-background text-foreground shadow-sm border border-border/50'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'settings' ? (
        <PaymentSettingsTab />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(s => {
              const cfg = s === 'all'
                ? { label: 'Total', color: 'text-primary', bg: 'bg-primary/10', icon: CreditCard }
                : statusConfig[s];
              const Icon = cfg.icon;
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`glass-card rounded-xl p-4 text-left transition-all border ${
                    statusFilter === s ? 'border-primary/50 bg-primary/5' : 'border-border/50 hover:border-primary/30'
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2 bg-primary/10">
                    <Icon size={18} className={s === 'all' ? 'text-primary' : (cfg as any).color?.split(' ')[1]} />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{counts[s]}</div>
                  <div className="text-xs text-muted-foreground capitalize mt-0.5">{s === 'all' ? 'All Payments' : (cfg as any).label}</div>
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by transaction ID, order, customer..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-16 bg-muted/30"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatus}>
              <SelectTrigger className="w-40 bg-muted/30">
                <Filter size={14} className="mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethod}>
              <SelectTrigger className="w-44 bg-muted/30">
                <CreditCard size={14} className="mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {Object.entries(methodLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="glass-card rounded-xl border border-border/50 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <RefreshCw size={20} className="animate-spin mr-2" /> Loading payments...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <CreditCard size={26} className="text-primary" />
                </div>
                <p className="text-muted-foreground text-sm">No payment proofs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/20">
                      {['Transaction ID', 'Order', 'Customer', 'Method', 'Amount', 'Submitted', 'Status', 'Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p, i) => {
                      const cfg = statusConfig[p.status] ?? statusConfig.pending;
                      const Icon = cfg.icon;
                      return (
                        <tr key={p.id} className={`border-b border-border/30 transition-colors hover:bg-muted/20 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                          <td className="px-4 py-3 font-mono text-xs text-primary font-medium">{p.transaction_id}</td>
                          <td className="px-4 py-3 text-xs font-medium">{p.orders?.order_number ?? '—'}</td>
                          <td className="px-4 py-3">
                            <div className="text-xs font-medium truncate max-w-[130px]">{p.orders?.customer_name ?? '—'}</div>
                            <div className="text-[10px] text-muted-foreground truncate max-w-[130px]">{p.orders?.customer_email ?? ''}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                              {methodLabels[p.payment_method] ?? p.payment_method}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground">
                            {p.amount != null ? `৳${p.amount.toLocaleString()}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(p.submitted_at), 'dd MMM, hh:mm a')}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.color}`}>
                              <Icon size={11} />{cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Button size="sm" variant="outline" onClick={() => { setSelected(p); setAdminNotes(p.admin_notes ?? ''); }} className="h-7 text-xs gap-2">
                              <Eye size={12} /> Review
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Review Dialog */}
          <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BadgeCheck size={18} className="text-primary" /> Payment Review
                </DialogTitle>
              </DialogHeader>
              {selected && (() => {
                const cfg = statusConfig[selected.status] ?? statusConfig.pending;
                const Icon = cfg.icon;
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        { label: 'Transaction ID', value: <span className="font-mono text-xs text-primary font-bold">{selected.transaction_id}</span> },
                        { label: 'Order', value: selected.orders?.order_number ?? '—' },
                        { label: 'Customer', value: <span className="truncate">{selected.orders?.customer_name ?? '—'}</span> },
                        { label: 'Amount', value: <span className="font-bold text-primary">{selected.amount != null ? `৳${selected.amount.toLocaleString()}` : '—'}</span> },
                        { label: 'Method', value: methodLabels[selected.payment_method] ?? selected.payment_method },
                        { label: 'Status', value: <span className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.color}`}><Icon size={11} />{cfg.label}</span> },
                      ].map(({ label, value }) => (
                        <div key={label} className="glass-card rounded-lg p-3 border border-border/50">
                          <div className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">{label}</div>
                          <div className="font-semibold text-xs">{value}</div>
                        </div>
                      ))}
                    </div>
                    {selected.screenshot_url ? (
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Payment Screenshot</div>
                        <div className="relative rounded-xl border border-border/50 overflow-hidden cursor-pointer group" onClick={() => setImgOpen(true)}>
                          <img src={selected.screenshot_url} alt="Payment proof" className="w-full max-h-48 object-contain bg-muted/30" />
                          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ExternalLink size={20} className="text-foreground" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50 text-muted-foreground text-xs">
                        <ImageIcon size={14} /> No screenshot uploaded
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">Admin Notes</label>
                      <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Add notes (optional)..." rows={2} className="bg-muted/30 text-sm resize-none" />
                    </div>
                  </div>
                );
              })()}
              <DialogFooter className="flex gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => setSelected(null)} className="flex-1">Cancel</Button>
                <Button variant="destructive" onClick={() => reviewMutation.mutate({ id: selected!.id, status: 'rejected', notes: adminNotes })} disabled={reviewMutation.isPending || selected?.status === 'rejected'} className="flex-1 gap-2">
                  <XCircle size={14} /> Reject
                </Button>
                <Button onClick={() => reviewMutation.mutate({ id: selected!.id, status: 'approved', notes: adminNotes })} disabled={reviewMutation.isPending || selected?.status === 'approved'} className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle2 size={14} /> Approve
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={imgOpen} onOpenChange={setImgOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Payment Screenshot</DialogTitle></DialogHeader>
              {selected?.screenshot_url && <img src={selected.screenshot_url} alt="Payment screenshot" className="w-full rounded-lg" />}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
