import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trophy, Calendar, Users, Gift, CheckCircle2, Megaphone } from 'lucide-react';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import SEOHead from '@/components/seo/SEOHead';
import { useAuth } from '@/hooks/useAuth';
import ReactMarkdown from 'react-markdown';
import { parsePrizeItems } from '@/lib/offerPrizes';
import PhoneInput from '@/components/store/PhoneInput';

interface Offer {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  prize_details: string | null;
  terms: string | null;
  status: string;
  start_at: string | null;
  end_at: string | null;
  max_submissions: number | null;
  require_login: boolean;
  success_message: string | null;
  google_form_url: string | null;
  show_winners: boolean;
  submission_count: number;
  notice: string | null;
  show_notice: boolean;
  max_entries_per_user?: number | null;
  min_purchase_amount?: number | null;
}
interface Field {
  id: string;
  field_type: string;
  label: string;
  placeholder: string | null;
  help_text: string | null;
  required: boolean;
  options: any;
}
interface WinnerRow {
  id: string;
  rank: number;
  prize: string | null;
}

const formatBanglaDateTime = (value: string) =>
  new Date(value).toLocaleString('bn-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

// Convert a number to Bangla digits with thousands separators.
const toBanglaDigits = (n: number) => {
  const s = Math.floor(n).toLocaleString('en-US');
  return s.replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
};

// Deterministic pseudo-random in [0,1) from a string seed (offer id).
const seededRand = (seed: string) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
};

/**
 * Compute an inflated "participants" number that grows over the offer's
 * lifetime so the page feels active and encourages more entries. The real
 * submission_count is always respected as a floor. Target end value is
 * randomized per-offer in the 10k–20k range, scaled to duration (per ~30d).
 */
const computeDisplayCount = (offer: Offer): number => {
  const real = offer.submission_count || 0;
  const start = offer.start_at ? new Date(offer.start_at).getTime() : null;
  const end = offer.end_at ? new Date(offer.end_at).getTime() : null;
  const now = Date.now();
  if (!start || !end || end <= start) return real;

  const durationMs = end - start;
  const months = Math.max(0.25, durationMs / (1000 * 60 * 60 * 24 * 30));
  const rnd = seededRand(offer.id);
  // Target between 10,000 and 20,000 per month, scaled by total duration.
  const target = Math.floor((10000 + rnd * 10000) * months);

  const elapsed = Math.min(1, Math.max(0, (now - start) / durationMs));
  // Slight ease so growth accelerates toward mid/late campaign.
  const eased = Math.pow(elapsed, 0.85);
  // Warm-start baseline so it never shows 0 right after launch.
  const baseline = Math.floor(150 + rnd * 250);
  // Small time-based jitter (updates every ~2 min) so it feels live.
  const jitterSeed = seededRand(offer.id + Math.floor(now / 120000));
  const jitter = Math.floor(jitterSeed * 7);
  const projected = baseline + Math.floor(eased * (target - baseline)) + jitter;

  return Math.max(real, projected);
};

export default function OfferPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [winners, setWinners] = useState<Array<WinnerRow & { name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      if (!slug) return;
      setLoading(true);
      const { data: o } = await supabase.from('offers').select('*').eq('slug', slug).maybeSingle();
      if (!o) { setLoading(false); return; }
      setOffer(o as Offer);
      const [{ data: f }, { data: w }] = await Promise.all([
        supabase.from('offer_fields').select('*').eq('offer_id', o.id).order('sort_order'),
        supabase.from('offer_winners_public').select('id, rank, prize, participant_name').eq('offer_id', o.id).order('rank'),
      ]);
      setFields((f as Field[]) || []);
      if (w && w.length > 0) {
        setWinners(w.map((x: any) => ({ id: x.id, rank: x.rank, prize: x.prize, name: x.participant_name || 'Winner' })));
      }
      setLoading(false);
    })();
  }, [slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offer) return;
    if (offer.require_login && !user) {
      toast.error('এই অফারে যোগদান করতে লগইন করুন');
      return;
    }
    // Validate required
    for (const f of fields) {
      if (f.required) {
        const v = values[f.label];
        if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) {
          toast.error(`"${f.label}" পূরণ করুন`);
          return;
        }
      }
    }
    setSubmitting(true);

    // Enforce max entries per user
    const maxPerUser = offer.max_entries_per_user ?? 1;
    if (user && maxPerUser > 0) {
      const { count } = await supabase
        .from('offer_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('offer_id', offer.id)
        .eq('user_id', user.id);
      if ((count ?? 0) >= maxPerUser) {
        setSubmitting(false);
        toast.error(`আপনি এই giveaway-তে সর্বোচ্চ ${maxPerUser} বার এন্ট্রি দিতে পারবেন।`);
        return;
      }
    }

    // Enforce minimum purchase amount
    const minPurchase = Number(offer.min_purchase_amount ?? 0);
    if (user && minPurchase > 0) {
      const { data: orders } = await supabase
        .from('orders')
        .select('total')
        .eq('user_id', user.id)
        .eq('status', 'completed');
      const spent = (orders ?? []).reduce((acc: number, o: any) => acc + Number(o.total || 0), 0);
      if (spent < minPurchase) {
        setSubmitting(false);
        toast.error(`এই giveaway তে অংশ নিতে ন্যূনতম ৳${minPurchase} এর কেনাকাটা প্রয়োজন। আপনার মোট: ৳${spent.toFixed(0)}`);
        return;
      }
    }

    // Extract name/email/phone from common labels
    const nameKey = fields.find((f) => /name|নাম/i.test(f.label))?.label;
    const emailKey = fields.find((f) => f.field_type === 'email' || /email|ইমেইল/i.test(f.label))?.label;
    const phoneKey = fields.find((f) => f.field_type === 'phone' || /phone|ফোন|মোবাইল/i.test(f.label))?.label;

    const { error } = await supabase.from('offer_submissions').insert({
      offer_id: offer.id,
      user_id: user?.id || null,
      data: values,
      participant_name: nameKey ? values[nameKey] : null,
      participant_email: emailKey ? values[emailKey] : null,
      participant_phone: phoneKey ? values[phoneKey] : null,
      user_agent: navigator.userAgent,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setSubmitted(true);
    toast.success('জমা দেওয়া হয়েছে!');
  };

  const renderField = (f: Field) => {
    const v = values[f.label];
    const set = (val: any) => setValues({ ...values, [f.label]: val });
    switch (f.field_type) {
      case 'textarea':
        return <Textarea rows={4} value={v || ''} onChange={(e) => set(e.target.value)} placeholder={f.placeholder || ''} required={f.required} />;
      case 'select':
        return (
          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={v || ''} onChange={(e) => set(e.target.value)} required={f.required}>
            <option value="">-- Select --</option>
            {(f.options || []).map((o: string) => <option key={o} value={o}>{o}</option>)}
          </select>
        );
      case 'radio':
        return (
          <div className="space-y-1">
            {(f.options || []).map((o: string) => (
              <label key={o} className="flex items-center gap-2">
                <input type="radio" name={f.id} value={o} checked={v === o} onChange={(e) => set(e.target.value)} required={f.required} />
                <span>{o}</span>
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div className="space-y-1">
            {(f.options || []).map((o: string) => {
              const arr: string[] = Array.isArray(v) ? v : [];
              const checked = arr.includes(o);
              return (
                <label key={o} className="flex items-center gap-2">
                  <input type="checkbox" checked={checked} onChange={(e) => set(e.target.checked ? [...arr, o] : arr.filter((x) => x !== o))} />
                  <span>{o}</span>
                </label>
              );
            })}
          </div>
        );
      case 'date':
        return <Input type="date" value={v || ''} onChange={(e) => set(e.target.value)} required={f.required} />;
      case 'number':
        return <Input type="number" value={v || ''} onChange={(e) => set(e.target.value)} placeholder={f.placeholder || ''} required={f.required} />;
      case 'email':
        return <Input type="email" value={v || ''} onChange={(e) => set(e.target.value)} placeholder={f.placeholder || ''} required={f.required} />;
      case 'phone':
        return <PhoneInput value={v || ''} onChange={(val) => set(val)} placeholder={f.placeholder || '1XXXXXXXXX'} required={f.required} />;
      default:
        return <Input value={v || ''} onChange={(e) => set(e.target.value)} placeholder={f.placeholder || ''} required={f.required} />;
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-[60vh] flex items-center justify-center">Loading...</main>
        <Footer />
      </>
    );
  }

  if (!offer || offer.status === 'draft') {
    return (
      <>
        <Navbar />
        <main className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <Gift className="w-12 h-12 text-muted-foreground mb-3" />
          <h1 className="text-2xl font-bold mb-2">অফার পাওয়া যায়নি</h1>
          <p className="text-muted-foreground mb-4">এই অফারটি আর উপলব্ধ নেই।</p>
          <Button asChild><Link to="/">হোমে ফিরে যান</Link></Button>
        </main>
        <Footer />
      </>
    );
  }

  const now = new Date();
  const notStarted = offer.start_at && new Date(offer.start_at) > now;
  const ended = offer.status === 'closed' || (offer.end_at && new Date(offer.end_at) < now);
  const maxReached = offer.max_submissions && offer.submission_count >= offer.max_submissions;
  const canSubmit = !notStarted && !ended && !maxReached;
  const hasCustomForm = fields.length > 0;

  return (
    <>
      <SEOHead title={offer.title} description={offer.description?.slice(0, 160) || `${offer.title} - Shahed Store offer`} />
      <Navbar />
      <main className="min-h-screen container max-w-3xl mx-auto px-4 pt-24 md:pt-32 pb-6 md:pb-8 space-y-6">
        {offer.show_notice && offer.notice && offer.notice.trim() && (
          <div className="rounded-2xl border border-violet-200 dark:border-violet-900 bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/40 p-4 flex items-start gap-3 shadow-sm">
            <div className="shrink-0 rounded-full bg-violet-500/10 p-2">
              <Megaphone className="w-5 h-5 text-violet-600 dark:text-violet-300" />
            </div>
            <div className="flex-1 min-w-0 text-sm leading-relaxed whitespace-pre-wrap text-violet-900 dark:text-violet-100">
              {offer.notice}
            </div>
          </div>
        )}

        {offer.banner_url && (
          <img src={offer.banner_url} alt={offer.title} className="w-full rounded-2xl object-cover max-h-72" />
        )}

        <div className="text-center space-y-2">
          <h1 className="mx-auto max-w-3xl text-[clamp(1.85rem,3.5vw,2.85rem)] leading-snug font-bold break-words [text-wrap:balance]">{offer.title}</h1>
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {toBanglaDigits(computeDisplayCount(offer))} জন অংশগ্রহণ করেছেন</span>
            {offer.end_at && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> শেষ: {new Date(offer.end_at).toLocaleDateString('bn-BD')}</span>}
          </div>
        </div>

        {offer.description && (
          <Card><CardContent className="p-5 prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{offer.description}</ReactMarkdown>
          </CardContent></Card>
        )}

        {offer.prize_details && (() => {
          const items = parsePrizeItems(offer.prize_details);
          return (
            <Card><CardContent className="p-5">
              <h2 className="font-bold mb-3 flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> পুরস্কার</h2>
              {items.length > 0 ? (
                <div className="space-y-2">
                  {items.map((p, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-card/50 p-3">
                      <Badge className="bg-yellow-500/20 text-yellow-700 shrink-0">#{i + 1}</Badge>
                      <div className="flex-1 min-w-0">
                        {p.title && <div className="font-semibold text-sm">{p.title}</div>}
                        {p.description && <div className="text-sm text-muted-foreground whitespace-pre-wrap">{p.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-sm">{offer.prize_details}</div>
              )}
            </CardContent></Card>
          );
        })()}

        {/* Winners */}
        {offer.show_winners && winners.length > 0 && (
          <Card><CardContent className="p-5">
            <h2 className="font-bold mb-3 flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> বিজয়ীগণ 🎉</h2>
            <div className="space-y-2">
              {winners.map((w) => (
                <div key={w.id} className="flex items-center gap-3 border rounded-lg p-3">
                  <Badge className="bg-yellow-500/20 text-yellow-700">#{w.rank}</Badge>
                  <div className="flex-1">
                    <div className="font-medium">{w.name}</div>
                    {w.prize && <div className="text-xs text-muted-foreground">🎁 {w.prize}</div>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent></Card>
        )}

        {/* Form / Status */}
        {submitted ? (
          <Card><CardContent className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
            <h3 className="text-xl font-bold">ধন্যবাদ!</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{offer.success_message || 'আপনার এন্ট্রি গৃহীত হয়েছে।'}</p>
          </CardContent></Card>
        ) : !canSubmit ? (
          <Card><CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {notStarted ? `ফর্ম খুলবে: ${formatBanglaDateTime(offer.start_at!)}` :
               maxReached ? 'অংশগ্রহণের সীমা পূর্ণ হয়েছে।' :
               'এই অফারের সময়সীমা শেষ হয়েছে।'}
            </p>
          </CardContent></Card>
        ) : hasCustomForm ? (
          <Card><CardContent className="p-5">
            <h2 className="font-bold mb-4">অংশগ্রহণ করুন</h2>
            {offer.require_login && !user && (
              <p className="text-sm text-amber-600 mb-3">⚠️ এই অফারে যোগদান করতে আগে লগইন করুন।</p>
            )}
            <form onSubmit={submit} className="space-y-4">
              {fields.map((f) => (
                <div key={f.id} className="space-y-1.5">
                  <Label>{f.label} {f.required && <span className="text-red-500">*</span>}</Label>
                  {renderField(f)}
                  {f.help_text && <p className="text-xs text-muted-foreground">{f.help_text}</p>}
                </div>
              ))}
              <Button type="submit" disabled={submitting || (offer.require_login && !user)} className="w-full">
                {submitting ? 'জমা দেওয়া হচ্ছে...' : 'জমা দিন'}
              </Button>
            </form>
            {offer.google_form_url && (
              <div className="mt-4 rounded-lg border border-border p-3 text-sm text-muted-foreground">
                সমস্যা হলে বিকল্প Google Form ব্যবহার করুন:{' '}
                <a href={offer.google_form_url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4">
                  ফর্ম খুলুন
                </a>
              </div>
            )}
          </CardContent></Card>
        ) : offer.google_form_url ? (
          <Card><CardContent className="p-3">
            <iframe src={offer.google_form_url} className="w-full" style={{ height: '900px', border: 0 }} title={offer.title} />
          </CardContent></Card>
        ) : (
          <Card><CardContent className="p-6 text-center text-muted-foreground">এই অফারে এখনো কোনো ফর্ম তৈরি করা হয়নি।</CardContent></Card>
        )}

        {offer.terms && (
          <Card><CardContent className="p-5">
            <h3 className="font-bold mb-2 text-sm">শর্তাবলী</h3>
            <div className="text-xs text-muted-foreground whitespace-pre-wrap">{offer.terms}</div>
          </CardContent></Card>
        )}
      </main>
      <Footer />
    </>
  );
}
