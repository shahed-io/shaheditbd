import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Loader2, Upload, CheckCircle2, AlertCircle, Copy } from 'lucide-react';
import AuthModal from '@/components/store/AuthModal';

type PaymentMethod = { name: string; number?: string; instructions?: string };
type CustomField = { label: string; type?: 'text' | 'email' | 'number'; required?: boolean };

export default function PaymentLink() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const pendingSubmitRef = useRef(false);

  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '', customer_address: '',
    quantity: 1, payment_method: '', transaction_id: '', sender_number: '',
    payment_screenshot_url: '', customer_note: '',
    open_product_name: '', open_amount: '' as string | number,
  });
  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  const PENDING_KEY = `pending_payment_link_submission_${slug}`;

  useEffect(() => {
    (async () => {
      if (!slug) return;
      const { data, error } = await supabase.from('payment_links').select('*').eq('slug', slug).maybeSingle();
      if (error || !data) { setLoading(false); return; }
      setLink(data);
      setForm(f => ({ ...f, quantity: data.quantity || 1, payment_method: (data.payment_methods?.[0]?.name) || '' }));
      // Restore any pending form data (e.g. after login redirect)
      let hadPending = false;
      try {
        const saved = sessionStorage.getItem(PENDING_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.form) setForm(parsed.form);
          if (parsed.customFields) setCustomFields(parsed.customFields);
          hadPending = true;
        }
      } catch {}
      setLoading(false);
      // If user is now logged in and we had a pending submission (after OAuth redirect), auto-submit
      if (hadPending) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setTimeout(() => {
            const formEl = document.getElementById('payment-link-form') as HTMLFormElement | null;
            formEl?.requestSubmit();
          }, 500);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Listen for sign-in and auto-submit if a submission was pending
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session && pendingSubmitRef.current) {
        pendingSubmitRef.current = false;
        setShowAuthModal(false);
        setTimeout(() => {
          const formEl = document.getElementById('payment-link-form') as HTMLFormElement | null;
          formEl?.requestSubmit();
        }, 400);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error('ছবি 5MB-এর কম হতে হবে'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `pl/${slug}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('payment-proofs').upload(path, file, { upsert: false });
      if (error) throw error;
      const { data: pub } = supabase.storage.from('payment-proofs').getPublicUrl(path);
      setForm(f => ({ ...f, payment_screenshot_url: pub.publicUrl }));
      toast.success('স্ক্রিনশট আপলোড হয়েছে');
    } catch (e: any) {
      toast.error(e.message || 'আপলোড ব্যর্থ');
    } finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name.trim()) return toast.error('আপনার নাম দিন');
    if (!form.customer_phone.trim()) return toast.error('ফোন নাম্বার দিন');
    if (link.is_open_form) {
      if (!form.open_product_name.trim()) return toast.error('কোন পণ্য / সার্ভিসের জন্য পেমেন্ট সেটা লিখুন');
      const amt = Number(form.open_amount);
      if (!amt || amt <= 0) return toast.error('পরিমাণ (৳) সঠিকভাবে দিন');
    }
    if (!form.payment_method) return toast.error('পেমেন্ট মেথড নির্বাচন করুন');
    if (!form.transaction_id.trim()) return toast.error('Transaction ID দিন');

    const req = link.required_fields || {};
    if (req.email && !form.customer_email.trim()) return toast.error('ইমেইল দিন');
    if (req.address && !form.customer_address.trim()) return toast.error('ঠিকানা দিন');

    // custom fields
    const cfArr: CustomField[] = link.custom_fields || [];
    for (const f of cfArr) {
      if (f.required && !customFields[f.label]?.trim()) {
        return toast.error(`${f.label} দিন`);
      }
    }

    // Require login before submission. If not logged in, open AuthModal — auto-submit on sign-in.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      pendingSubmitRef.current = true;
      // Persist form state so it survives any OAuth full-page redirect
      try { sessionStorage.setItem(PENDING_KEY, JSON.stringify({ form, customFields })); } catch {}
      toast.info('সাবমিট করতে লগইন করুন — লগইনের পর অর্ডার নিজে থেকেই সাবমিট হবে');
      setShowAuthModal(true);
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-payment-link', {
        body: {
          slug,
          ...form,
          quantity: link.allow_qty_change ? form.quantity : link.quantity,
          custom_field_values: customFields,
          open_product_name: link.is_open_form ? form.open_product_name : undefined,
          open_amount: link.is_open_form ? Number(form.open_amount) : undefined,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const id = (data as any).id;
      sessionStorage.removeItem(PENDING_KEY);
      toast.success('সাবমিট সফল! অ্যাডমিন রিভিউ করছে।');
      if (link.redirect_url) {
        window.location.href = link.redirect_url;
      } else {
        navigate(`/pay/track/${id}`);
      }
    } catch (e: any) {
      toast.error(e.message || 'সাবমিট ব্যর্থ');
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!link) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-3">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
            <h1 className="text-xl font-bold">লিংক পাওয়া যায়নি</h1>
            <p className="text-sm text-muted-foreground">এই পেমেন্ট লিংকটি বাতিল করা হয়েছে বা অস্তিত্ব নেই।</p>
            <Link to="/" className="text-primary underline text-sm">হোমে ফিরে যান</Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (link.status !== 'active') {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <Card className="max-w-md w-full"><CardContent className="p-8 text-center space-y-3">
          <AlertCircle className="w-12 h-12 mx-auto text-amber-500" />
          <h1 className="text-xl font-bold">লিংকটি বর্তমানে সক্রিয় নয়</h1>
        </CardContent></Card>
      </div>
    );
  }

  const req = link.required_fields || {};
  const methods: PaymentMethod[] = link.payment_methods || [];
  const selectedMethod = methods.find(m => m.name === form.payment_method);
  const cfArr: CustomField[] = link.custom_fields || [];
  const qty = link.allow_qty_change ? form.quantity : link.quantity;
  const effectiveAmount = link.is_open_form ? Number(form.open_amount || 0) : Number(link.amount || 0);
  const total = effectiveAmount * qty;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 py-6 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {link.product_image && !link.is_open_form && (
              <div className="aspect-video bg-muted overflow-hidden">
                <img src={link.product_image} alt={link.product_name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6 space-y-2">
              <h1 className="text-2xl font-bold">{link.title}</h1>
              {!link.is_open_form && link.product_name && <p className="text-sm text-muted-foreground">{link.product_name}</p>}
              {link.description && <p className="text-sm whitespace-pre-line">{link.description}</p>}
              {!link.is_open_form ? (
                <div className="flex items-baseline gap-2 pt-2">
                  <span className="text-3xl font-bold text-primary">৳{Number(link.amount).toLocaleString('bn-BD')}</span>
                  {link.original_amount && Number(link.original_amount) > Number(link.amount) && (
                    <span className="text-sm line-through text-muted-foreground">৳{Number(link.original_amount).toLocaleString('bn-BD')}</span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground pt-2">নিচে আপনার বিস্তারিত তথ্য, পরিমাণ ও পেমেন্ট তথ্য দিন।</p>
              )}
            </div>
          </CardContent>
        </Card>

        <form id="payment-link-form" onSubmit={handleSubmit}>
          {link.is_open_form && (
            <Card className="mb-4"><CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">কোন পণ্য / সার্ভিস কিনছেন</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Label>পণ্য / সার্ভিসের নাম *</Label>
                  <Input value={form.open_product_name} onChange={e => setForm({ ...form, open_product_name: e.target.value })} placeholder="যেমন: Office 365 — 1 Year" required />
                </div>
                <div>
                  <Label>পরিমাণ (৳) *</Label>
                  <Input type="number" min={1} value={form.open_amount} onChange={e => setForm({ ...form, open_amount: e.target.value })} placeholder="0" required />
                </div>
              </div>
            </CardContent></Card>
          )}

          <Card><CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">আপনার তথ্য</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>নাম *</Label><Input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} required /></div>
              <div><Label>ফোন *</Label><Input value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} required /></div>
              <div className="sm:col-span-2"><Label>ইমেইল {req.email ? '*' : '(Optional)'}</Label><Input type="email" value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} required={!!req.email} /></div>
              {req.address && <div className="sm:col-span-2"><Label>ঠিকানা</Label><Textarea value={form.customer_address} onChange={e => setForm({ ...form, customer_address: e.target.value })} /></div>}
              {link.allow_qty_change && (
                <div><Label>পরিমাণ</Label><Input type="number" min={1} max={100} value={form.quantity} onChange={e => setForm({ ...form, quantity: Math.max(1, parseInt(e.target.value) || 1) })} /></div>
              )}
            </div>
            {cfArr.length > 0 && (
              <div className="space-y-3 pt-2 border-t">
                {cfArr.map((cf, i) => (
                  <div key={i}>
                    <Label>{cf.label}{cf.required && ' *'}</Label>
                    <Input
                      type={cf.type || 'text'}
                      value={customFields[cf.label] || ''}
                      onChange={e => setCustomFields({ ...customFields, [cf.label]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent></Card>

          <Card className="mt-4"><CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">পেমেন্ট</h2>
            <p className="text-sm text-muted-foreground">মোট পরিশোধ: <span className="font-bold text-primary text-base">৳{total.toLocaleString('bn-BD')}</span></p>

            {methods.length > 0 && (
              <RadioGroup value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })} className="grid grid-cols-2 gap-2">
                {methods.map(m => (
                  <label key={m.name} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${form.payment_method === m.name ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <RadioGroupItem value={m.name} />
                    <span className="font-medium">{m.name}</span>
                  </label>
                ))}
              </RadioGroup>
            )}

            {selectedMethod && (selectedMethod.number || selectedMethod.instructions) && (
              <div className="p-4 bg-muted/40 rounded-lg space-y-2 text-sm">
                {selectedMethod.number && (
                  <div className="flex items-center justify-between gap-2">
                    <div><span className="text-muted-foreground">নাম্বার: </span><span className="font-mono font-bold">{selectedMethod.number}</span></div>
                    <Button type="button" size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(selectedMethod.number!); toast.success('কপি হয়েছে'); }}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {selectedMethod.instructions && <p className="whitespace-pre-line text-muted-foreground">{selectedMethod.instructions}</p>}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Transaction ID *</Label><Input value={form.transaction_id} onChange={e => setForm({ ...form, transaction_id: e.target.value })} required /></div>
              <div><Label>যে নাম্বার থেকে পাঠিয়েছেন</Label><Input value={form.sender_number} onChange={e => setForm({ ...form, sender_number: e.target.value })} /></div>
            </div>

            <div>
              <Label>পেমেন্ট স্ক্রিনশট (Optional)</Label>
              <div className="mt-1 space-y-3">
                <label className="block cursor-pointer border-2 border-dashed border-border rounded-lg p-4 text-center hover:bg-muted/40 transition">
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} disabled={uploading} />
                  {uploading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : form.payment_screenshot_url ? (
                    <span className="text-sm text-green-600 flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> {form.payment_screenshot_url ? 'অন্য ছবি আপলোড করুন' : 'আপলোড সম্পন্ন'}</span>
                  ) : <span className="text-sm text-muted-foreground flex items-center justify-center gap-2"><Upload className="w-4 h-4" /> ছবি আপলোড করুন</span>}
                </label>
                {form.payment_screenshot_url && (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground mb-2">প্রিভিউ — ছবিটি স্পষ্ট দেখা যাচ্ছে কিনা যাচাই করুন</p>
                    <a href={form.payment_screenshot_url} target="_blank" rel="noopener noreferrer" className="block">
                      <img
                        src={form.payment_screenshot_url}
                        alt="Payment screenshot preview"
                        className="w-full max-h-80 object-contain rounded-md border bg-background"
                      />
                    </a>
                    <div className="flex justify-end mt-2">
                      <Button type="button" size="sm" variant="ghost" onClick={() => setForm(f => ({ ...f, payment_screenshot_url: '' }))}>
                        ছবি মুছুন
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {req.note && (
              <div><Label>নোট</Label><Textarea value={form.customer_note} onChange={e => setForm({ ...form, customer_note: e.target.value })} /></div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={submitting || uploading}>
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> সাবমিট হচ্ছে...</> : 'অর্ডার সাবমিট করুন'}
            </Button>
            <p className="text-xs text-center text-muted-foreground">সাবমিটের পর অ্যাডমিন রিভিউ করে আপনার অর্ডার নিশ্চিত করবে।</p>
          </CardContent></Card>
        </form>
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} redirectAfterLogin={false} />
    </div>
  );
}
