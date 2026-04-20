import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Gift, MousePointerClick, TrendingUp, Wallet, Copy, Check, Share2,
  Send, Loader2, Clock, CheckCircle2, XCircle, Info, ArrowLeft,
  DollarSign, Sparkles, FileText, ExternalLink, Globe, Facebook, Youtube,
  Users as UsersIcon, Target, Rocket, User as UserIcon, Mail, Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';

interface Account {
  id: string;
  referral_code: string;
  status: string;
  available_balance: number;
  total_earned: number;
  total_paid: number;
  total_clicks: number;
  total_conversions: number;
  custom_commission_percent: number | null;
}
interface Settings {
  is_enabled: boolean;
  default_commission_percent: number;
  minimum_withdrawal: number;
  cookie_duration_days: number;
  enable_affiliate_commission: boolean;
  enable_customer_discount: boolean;
  customer_discount_percent: number;
  terms_and_conditions: string | null;
}
interface Conversion {
  id: string;
  order_number: string;
  order_total: number;
  commission_amount: number;
  status: string;
  created_at: string;
}
interface Withdrawal {
  id: string;
  amount: number;
  method: string;
  account_number: string;
  status: string;
  requested_at: string;
  transaction_id: string | null;
  admin_notes: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
  approved: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-700 border-red-500/30',
  paid: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
};

const NICHE_OPTIONS = [
  'Software / SaaS',
  'Tech / Gadgets',
  'Education / Tutorials',
  'Gaming',
  'Lifestyle / Vlog',
  'Business / Marketing',
  'Freelancing',
  'Design / Creative',
  'Other',
];

const Affiliate = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<Account | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  // Detailed application form
  const [form, setForm] = useState({
    applicant_name: '',
    applicant_email: '',
    applicant_phone: '',
    website_url: '',
    facebook_url: '',
    youtube_url: '',
    other_social_url: '',
    audience_size: '',
    niche: '',
    why_join: '',
    promotion_strategy: '',
    accept_terms: false,
  });
  const [applying, setApplying] = useState(false);

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ amount: 0, method: 'bkash', account_number: '', account_name: '' });
  const [withdrawing, setWithdrawing] = useState(false);

  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [accRes, setRes, profileRes] = await Promise.all([
        supabase.from('affiliate_accounts').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('affiliate_settings').select('*').eq('id', 1).maybeSingle(),
        supabase.from('profiles').select('display_name, email, phone').eq('user_id', user.id).maybeSingle(),
      ]);
      setSettings(setRes.data as Settings | null);
      setAccount(accRes.data as Account | null);

      // Auto-fill basic fields if no account yet
      if (!accRes.data && profileRes.data) {
        setForm(f => ({
          ...f,
          applicant_name: f.applicant_name || profileRes.data.display_name || '',
          applicant_email: f.applicant_email || profileRes.data.email || user.email || '',
          applicant_phone: f.applicant_phone || profileRes.data.phone || '',
        }));
      }

      if (accRes.data) {
        const [convRes, wdRes] = await Promise.all([
          supabase.from('affiliate_conversions').select('*').eq('affiliate_id', accRes.data.id).order('created_at', { ascending: false }).limit(50),
          supabase.from('affiliate_withdrawals').select('*').eq('affiliate_id', accRes.data.id).order('requested_at', { ascending: false }).limit(50),
        ]);
        setConversions((convRes.data || []) as Conversion[]);
        setWithdrawals((wdRes.data || []) as Withdrawal[]);
      }
    } catch (e: any) {
      toast.error('Failed to load: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user, authLoading]);

  const handleApply = async () => {
    if (!user) return;

    // Validation
    if (!form.applicant_name.trim()) return toast.error('আপনার নাম লিখুন');
    if (!form.applicant_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.applicant_email)) return toast.error('সঠিক ইমেইল লিখুন');
    if (!form.applicant_phone.trim() || form.applicant_phone.trim().length < 10) return toast.error('সঠিক ফোন নম্বর লিখুন');
    if (!form.niche) return toast.error('Niche/Category নির্বাচন করুন');
    if (!form.audience_size.trim()) return toast.error('Audience size লিখুন');
    if (!form.why_join.trim() || form.why_join.trim().length < 20) return toast.error('কেন যোগ দিতে চান বিস্তারিত লিখুন (অন্তত ২০ অক্ষর)');
    if (!form.promotion_strategy.trim() || form.promotion_strategy.trim().length < 20) return toast.error('প্রমোশন স্ট্র্যাটেজি বিস্তারিত লিখুন (অন্তত ২০ অক্ষর)');

    // Must have at least one promotion channel
    if (!form.website_url.trim() && !form.facebook_url.trim() && !form.youtube_url.trim() && !form.other_social_url.trim()) {
      return toast.error('অন্তত একটি প্রমোশন চ্যানেল দিন (Website / Facebook / YouTube / Social link)');
    }

    if (settings?.terms_and_conditions && !form.accept_terms) return toast.error('Terms & Conditions অ্যাক্সেপ্ট করুন');

    setApplying(true);
    try {
      const { data: existing } = await supabase
        .from('affiliate_accounts').select('id').eq('user_id', user.id).maybeSingle();
      if (existing) { toast.error('Already applied'); return; }

      const insertPayload: any = {
        user_id: user.id,
        referral_code: '',
        status: 'pending',
        applicant_name: form.applicant_name.trim(),
        applicant_email: form.applicant_email.trim(),
        applicant_phone: form.applicant_phone.trim(),
        website_url: form.website_url.trim() || null,
        facebook_url: form.facebook_url.trim() || null,
        youtube_url: form.youtube_url.trim() || null,
        other_social_url: form.other_social_url.trim() || null,
        audience_size: form.audience_size.trim(),
        niche: form.niche,
        why_join: form.why_join.trim(),
        promotion_strategy: form.promotion_strategy.trim(),
        application_note: null,
      };

      const { data: inserted, error } = await supabase
        .from('affiliate_accounts')
        .insert(insertPayload)
        .select()
        .single();
      if (error) throw error;

      const { data: s } = await supabase.from('affiliate_settings').select('auto_approve_applications').eq('id', 1).maybeSingle();
      if ((s as any)?.auto_approve_applications) {
        await supabase.from('affiliate_accounts').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('user_id', user.id);
      }

      // Notify admin via Telegram + email (fire & forget)
      try {
        supabase.functions.invoke('notify-affiliate-application', {
          body: { affiliateId: (inserted as any)?.id },
        });
      } catch (e) {
        console.warn('notify-affiliate-application invoke failed', e);
      }

      toast.success('আবেদন সফলভাবে জমা হয়েছে! 🎉 অ্যাডমিন রিভিউ করার পর আপনাকে জানানো হবে।');
      fetchData();
    } catch (e: any) {
      toast.error('Failed: ' + e.message);
    } finally {
      setApplying(false);
    }
  };

  const referralLink = account ? `${window.location.origin}/?ref=${account.referral_code}` : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy failed');
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Earn with Shahed Store', text: `Use my code ${account?.referral_code} and shop`, url: referralLink });
      } catch { }
    } else {
      copyLink();
    }
  };

  const submitWithdrawal = async () => {
    if (!account) return;
    if (withdrawForm.amount < (settings?.minimum_withdrawal || 500)) {
      toast.error(`Minimum withdrawal: ৳${settings?.minimum_withdrawal}`); return;
    }
    if (withdrawForm.amount > Number(account.available_balance)) {
      toast.error('Insufficient balance'); return;
    }
    if (!withdrawForm.account_number.trim()) {
      toast.error('Enter account number'); return;
    }
    setWithdrawing(true);
    try {
      const { error } = await supabase.from('affiliate_withdrawals').insert({
        affiliate_id: account.id,
        user_id: user!.id,
        amount: withdrawForm.amount,
        method: withdrawForm.method,
        account_number: withdrawForm.account_number.trim(),
        account_name: withdrawForm.account_name.trim() || null,
      });
      if (error) throw error;
      toast.success('Withdrawal requested! Admin will review shortly.');
      setShowWithdraw(false);
      setWithdrawForm({ amount: 0, method: 'bkash', account_number: '', account_name: '' });
      fetchData();
    } catch (e: any) {
      toast.error('Failed: ' + e.message);
    } finally {
      setWithdrawing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  if (settings && !settings.is_enabled) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <Info size={48} className="mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold">Affiliate Program is currently unavailable</h1>
          <p className="text-muted-foreground mt-2">Please check back later.</p>
        </div>
        <Footer />
      </div>
    );
  }

  // ─── Application Form ──────────────────────────────────────────────────
  if (!account) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-2"><ArrowLeft size={14} /> Back to Dashboard</Button>

          <div className="text-center space-y-2">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="text-white" size={36} />
            </div>
            <h1 className="text-3xl font-bold">অ্যাফিলিয়েট প্রোগ্রামে আবেদন করুন</h1>
            <p className="text-muted-foreground">আপনার রেফারেল লিংক শেয়ার করে প্রতিটি বিক্রয়ে কমিশন আয় করুন।</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <BenefitCard icon={DollarSign} title={`${settings?.default_commission_percent || 10}%`} desc="বেস কমিশন" />
            <BenefitCard icon={Clock} title={`${settings?.cookie_duration_days || 30} দিন`} desc="কুকি স্থায়িত্ব" />
            <BenefitCard icon={Wallet} title={`৳${settings?.minimum_withdrawal || 500}`} desc="মিনিমাম উইথড্রয়াল" />
          </div>

          {/* Application Form */}
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <FileText size={18} className="text-primary" />
              <h2 className="text-lg font-bold">আবেদন ফর্ম</h2>
            </div>

            {/* Basic info */}
            <Section title="১. আপনার পরিচিতি" icon={UserIcon}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="পূর্ণ নাম" required icon={UserIcon}>
                  <Input value={form.applicant_name} onChange={e => setForm({ ...form, applicant_name: e.target.value })} placeholder="আপনার নাম" />
                </Field>
                <Field label="ইমেইল" required icon={Mail}>
                  <Input type="email" value={form.applicant_email} onChange={e => setForm({ ...form, applicant_email: e.target.value })} placeholder="you@example.com" />
                </Field>
                <Field label="ফোন নম্বর" required icon={Phone}>
                  <Input type="tel" value={form.applicant_phone} onChange={e => setForm({ ...form, applicant_phone: e.target.value })} placeholder="01XXXXXXXXX" />
                </Field>
              </div>
            </Section>

            {/* Promotion channels */}
            <Section title="২. প্রমোশন চ্যানেল (অন্তত একটি দিন)" icon={Globe}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Website / Blog URL" icon={Globe}>
                  <Input type="url" value={form.website_url} onChange={e => setForm({ ...form, website_url: e.target.value })} placeholder="https://yoursite.com" />
                </Field>
                <Field label="Facebook Page" icon={Facebook}>
                  <Input type="url" value={form.facebook_url} onChange={e => setForm({ ...form, facebook_url: e.target.value })} placeholder="https://fb.com/yourpage" />
                </Field>
                <Field label="YouTube Channel" icon={Youtube}>
                  <Input type="url" value={form.youtube_url} onChange={e => setForm({ ...form, youtube_url: e.target.value })} placeholder="https://youtube.com/@channel" />
                </Field>
                <Field label="Instagram / TikTok / অন্যান্য" icon={ExternalLink}>
                  <Input type="url" value={form.other_social_url} onChange={e => setForm({ ...form, other_social_url: e.target.value })} placeholder="https://..." />
                </Field>
              </div>
            </Section>

            {/* Audience */}
            <Section title="৩. অডিয়েন্স তথ্য" icon={UsersIcon}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="মোট ফলোয়ার / অডিয়েন্স সাইজ" required icon={UsersIcon}>
                  <Input value={form.audience_size} onChange={e => setForm({ ...form, audience_size: e.target.value })} placeholder="যেমন: 10K Facebook, 5K YouTube" />
                </Field>
                <Field label="Niche / Category" required icon={Target}>
                  <select
                    value={form.niche}
                    onChange={e => setForm({ ...form, niche: e.target.value })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">— নির্বাচন করুন —</option>
                    {NICHE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </Field>
              </div>
            </Section>

            {/* Why & Strategy */}
            <Section title="৪. আপনার সম্পর্কে ও স্ট্র্যাটেজি" icon={Rocket}>
              <Field label="কেন আমাদের অ্যাফিলিয়েট প্রোগ্রামে যোগ দিতে চান?" required>
                <Textarea rows={3}
                  value={form.why_join}
                  onChange={e => setForm({ ...form, why_join: e.target.value })}
                  placeholder="আপনি কে, কী করেন, এবং কেন এই প্রোগ্রাম আপনার জন্য উপযুক্ত..."
                />
                <p className="text-[11px] text-muted-foreground">{form.why_join.length}/500 অক্ষর</p>
              </Field>
              <Field label="কীভাবে প্রোডাক্ট প্রমোট করবেন?" required>
                <Textarea rows={4}
                  value={form.promotion_strategy}
                  onChange={e => setForm({ ...form, promotion_strategy: e.target.value })}
                  placeholder="যেমন: Facebook post, YouTube video, ব্লগ রিভিউ, ইমেইল মার্কেটিং, পেইড অ্যাড..."
                />
                <p className="text-[11px] text-muted-foreground">{form.promotion_strategy.length}/1000 অক্ষর</p>
              </Field>
            </Section>

            {/* Terms */}
            {settings?.terms_and_conditions && (
              <div className="bg-muted/50 border border-border rounded-xl p-4 space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2"><FileText size={14} /> Terms & Conditions</h3>
                <div className="text-xs text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">{settings.terms_and_conditions}</div>
                <label className="flex items-start gap-2 text-xs cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={form.accept_terms}
                    onChange={e => setForm({ ...form, accept_terms: e.target.checked })}
                    className="mt-0.5"
                  />
                  <span>আমি উপরের Terms & Conditions পড়েছি এবং সম্মত</span>
                </label>
              </div>
            )}

            <Button onClick={handleApply} disabled={applying} className="w-full" size="lg">
              {applying ? <><Loader2 size={16} className="animate-spin mr-2" /> Submitting...</> : <><Send size={16} className="mr-2" /> Submit Application</>}
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">আবেদন রিভিউ করতে সাধারণত ১-২ কর্মদিবস সময় লাগে।</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ─── Approved/Pending Dashboard ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-2"><ArrowLeft size={14} /> Back to Dashboard</Button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><Gift className="text-primary" size={28} /> Affiliate Dashboard</h1>
            <p className="text-sm text-muted-foreground">Code: <span className="font-mono font-bold text-primary">{account.referral_code}</span></p>
          </div>
          <Badge className={STATUS_COLORS[account.status]} variant="outline">{account.status.toUpperCase()}</Badge>
        </div>

        {account.status === 'pending' && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-sm text-amber-700">
            <strong>⏳ আপনার আবেদন পর্যালোচনাধীন।</strong> অ্যাডমিন অ্যাপ্রুভ করার পর আপনি লিংক শেয়ার শুরু করতে পারবেন।
          </div>
        )}
        {account.status === 'rejected' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-sm text-red-700">
            <strong>❌ আবেদন গ্রহণ করা হয়নি।</strong> বিস্তারিত জানতে সাপোর্টে যোগাযোগ করুন।
          </div>
        )}
        {account.status === 'suspended' && (
          <div className="bg-gray-500/10 border border-gray-500/30 rounded-2xl p-4 text-sm text-gray-700">
            <strong>⛔ আপনার অ্যাকাউন্ট স্থগিত।</strong>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox icon={Wallet} label="Available" value={`৳${Number(account.available_balance).toFixed(0)}`} color="from-emerald-500 to-green-600" />
          <StatBox icon={TrendingUp} label="Total Earned" value={`৳${Number(account.total_earned).toFixed(0)}`} color="from-violet-500 to-purple-600" />
          <StatBox icon={DollarSign} label="Total Paid" value={`৳${Number(account.total_paid).toFixed(0)}`} color="from-blue-500 to-cyan-600" />
          <StatBox icon={MousePointerClick} label="Clicks / Conv." value={`${account.total_clicks} / ${account.total_conversions}`} color="from-pink-500 to-rose-600" />
        </div>

        {account.status === 'approved' && (
          <>
            <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/30 rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><Share2 size={16} /> আপনার রেফারেল লিংক</h3>
              <div className="flex gap-2">
                <Input readOnly value={referralLink} className="font-mono text-xs" />
                <Button onClick={copyLink} size="sm" variant="outline" className="shrink-0">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </Button>
                <Button onClick={shareLink} size="sm" className="shrink-0"><Share2 size={14} /></Button>
              </div>
              <p className="text-xs text-muted-foreground">
                আপনার কমিশন: <strong>{account.custom_commission_percent ?? settings?.default_commission_percent}%</strong>
                {' • '}কুকি স্থায়িত্ব: <strong>{settings?.cookie_duration_days} দিন</strong>
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => { setWithdrawForm(f => ({ ...f, amount: Number(account.available_balance) })); setShowWithdraw(true); }}
                disabled={Number(account.available_balance) < (settings?.minimum_withdrawal || 500)}
                className="gap-2">
                <Send size={14} /> Request Withdrawal
              </Button>
            </div>

            <Tabs defaultValue="conversions" className="w-full">
              <TabsList>
                <TabsTrigger value="conversions">Conversions ({conversions.length})</TabsTrigger>
                <TabsTrigger value="withdrawals">Withdrawals ({withdrawals.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="conversions" className="mt-4">
                <div className="bg-card border border-border rounded-2xl divide-y divide-border">
                  {conversions.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No conversions yet. Start sharing your link!</div>
                  ) : conversions.map(c => (
                    <div key={c.id} className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-mono text-xs text-muted-foreground">Order #{c.order_number}</div>
                        <div className="text-sm">৳{Number(c.order_total).toFixed(0)} → <span className="text-emerald-600 font-semibold">+৳{Number(c.commission_amount).toFixed(2)}</span></div>
                        <div className="text-xs text-muted-foreground mt-0.5">{new Date(c.created_at).toLocaleDateString()}</div>
                      </div>
                      <Badge className={STATUS_COLORS[c.status]} variant="outline">{c.status}</Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="withdrawals" className="mt-4">
                <div className="bg-card border border-border rounded-2xl divide-y divide-border">
                  {withdrawals.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No withdrawals yet.</div>
                  ) : withdrawals.map(w => (
                    <div key={w.id} className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-base font-semibold">৳{Number(w.amount).toFixed(0)}</div>
                        <div className="text-xs text-muted-foreground">{w.method.toUpperCase()} → <span className="font-mono">{w.account_number}</span></div>
                        <div className="text-xs text-muted-foreground mt-0.5">{new Date(w.requested_at).toLocaleDateString()}</div>
                        {w.transaction_id && <div className="text-xs text-emerald-600 mt-0.5">TX: {w.transaction_id}</div>}
                      </div>
                      <Badge className={STATUS_COLORS[w.status]} variant="outline">{w.status}</Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Withdrawal</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Available: <strong className="text-foreground">৳{Number(account?.available_balance || 0).toFixed(0)}</strong>
              {' • '}Minimum: <strong className="text-foreground">৳{settings?.minimum_withdrawal}</strong>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount (৳)</Label>
                <Input type="number" value={withdrawForm.amount}
                  onChange={e => setWithdrawForm({ ...withdrawForm, amount: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Method</Label>
                <select value={withdrawForm.method}
                  onChange={e => setWithdrawForm({ ...withdrawForm, method: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="rocket">Rocket</option>
                  <option value="bank">Bank</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Account Number</Label>
              <Input value={withdrawForm.account_number}
                onChange={e => setWithdrawForm({ ...withdrawForm, account_number: e.target.value })}
                placeholder="01XXXXXXXXX" />
            </div>
            <div className="space-y-1.5">
              <Label>Account Name (optional)</Label>
              <Input value={withdrawForm.account_name}
                onChange={e => setWithdrawForm({ ...withdrawForm, account_name: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdraw(false)}>Cancel</Button>
            <Button onClick={submitWithdrawal} disabled={withdrawing}>
              {withdrawing ? <><Loader2 size={14} className="animate-spin mr-2" /> Submitting...</> : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

const BenefitCard = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <div className="bg-card border border-border rounded-2xl p-4 text-center">
    <Icon className="mx-auto text-primary mb-2" size={22} />
    <div className="text-lg font-bold">{title}</div>
    <div className="text-xs text-muted-foreground">{desc}</div>
  </div>
);

const StatBox = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <div className="bg-card border border-border rounded-2xl p-4">
    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-2`}>
      <Icon className="text-white" size={16} />
    </div>
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-lg font-bold">{value}</div>
  </div>
);

const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon size={14} className="text-primary" />
      </div>
      <h3 className="font-semibold text-sm">{title}</h3>
    </div>
    <div className="space-y-3 pl-9">{children}</div>
  </div>
);

const Field = ({ label, required, icon: Icon, children }: { label: string; required?: boolean; icon?: any; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs flex items-center gap-1.5">
      {Icon && <Icon size={11} className="text-muted-foreground" />}
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    {children}
  </div>
);

export default Affiliate;
