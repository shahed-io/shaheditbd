import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Save, Plus, Trash2, ArrowUp, ArrowDown, Sparkles, Shuffle, Download, Trophy, Eye, Wand2, Loader2 } from 'lucide-react';

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
}

interface Field {
  id: string;
  offer_id: string;
  field_type: string;
  label: string;
  placeholder: string | null;
  help_text: string | null;
  required: boolean;
  options: any;
  sort_order: number;
}

interface Submission {
  id: string;
  data: any;
  participant_name: string | null;
  participant_email: string | null;
  participant_phone: string | null;
  is_winner: boolean;
  winner_rank: number | null;
  prize_won: string | null;
  created_at: string;
  converted_to_customer?: boolean;
  customer_user_id?: string | null;
  converted_at?: string | null;
}

interface Winner {
  id: string;
  submission_id: string;
  rank: number;
  prize: string | null;
  selected_by: string;
  ai_reason: string | null;
}

const FIELD_TYPES = [
  { v: 'text', l: 'Short Text' },
  { v: 'textarea', l: 'Long Text' },
  { v: 'email', l: 'Email' },
  { v: 'phone', l: 'Phone' },
  { v: 'number', l: 'Number' },
  { v: 'select', l: 'Dropdown' },
  { v: 'radio', l: 'Radio Buttons' },
  { v: 'checkbox', l: 'Checkboxes' },
  { v: 'date', l: 'Date' },
];

export default function AdminOfferEditor() {
  const { id } = useParams();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Winner picker state
  const [winnerCount, setWinnerCount] = useState(1);
  const [winnerMode, setWinnerMode] = useState<'random' | 'ai'>('random');
  const [prizesText, setPrizesText] = useState('');
  const [picking, setPicking] = useState(false);

  // Active tab (controlled so AI build can auto-switch to Settings)
  const [activeTab, setActiveTab] = useState<string>('ai');

  // AI Builder state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBuilding, setAiBuilding] = useState(false);
  const [aiPreview, setAiPreview] = useState<any>(null);

  // Convert submissions -> customers state
  const [converting, setConverting] = useState(false);

  const convertSubmissions = async (ids?: string[]) => {
    if (!offer) return;
    const eligible = (ids
      ? submissions.filter((s) => ids.includes(s.id))
      : submissions
    ).filter((s) => s.participant_email && !s.converted_to_customer);
    if (eligible.length === 0) {
      toast.error('No eligible submissions (need email & not already converted)');
      return;
    }
    if (!confirm(`Send account invite email to ${eligible.length} participant(s)? They'll receive a link to set their password and become customers.`)) return;
    setConverting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      const resp = await supabase.functions.invoke('convert-submissions-to-customers', {
        body: { offer_id: offer.id, submission_ids: ids },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (resp.error) throw resp.error;
      const r = resp.data?.results;
      toast.success(`✅ ${r?.invited || 0} invited, ${r?.linked_existing || 0} linked, ${r?.skipped || 0} skipped, ${r?.failed || 0} failed`);
      if (r?.errors?.length) console.warn('Convert errors:', r.errors);
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Conversion failed');
    } finally {
      setConverting(false);
    }
  };

  const hasFutureStart = Boolean(offer?.start_at && new Date(offer.start_at) > new Date());
  const hasEnded = Boolean(offer?.end_at && new Date(offer.end_at) < new Date());
  const formReady = fields.length > 0 || Boolean(offer?.google_form_url);

  const fieldPayload = (f: Field) => {
    const { id: _id, offer_id: _offerId, created_at: _createdAt, ...payload } = f as any;
    if (!['select', 'radio', 'checkbox'].includes(payload.field_type)) payload.options = null;
    return payload;
  };

  const runAiBuild = async (apply: boolean) => {
    if (!offer) return;
    if (aiPrompt.trim().length < 10) return toast.error('Please describe the offer in more detail');
    setAiBuilding(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      const resp = await supabase.functions.invoke('ai-build-offer', {
        body: { offer_id: offer.id, prompt: aiPrompt, apply },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (resp.error) throw resp.error;
      setAiPreview(resp.data?.plan);
      if (apply) {
        toast.success('AI built the offer! You can now edit anything in the tabs below.');
        // Apply winner plan to local state
        const wp = resp.data?.plan?.winner_plan;
        if (wp) {
          setWinnerCount(Math.max(1, Math.min(100, wp.count || 1)));
          setWinnerMode(wp.mode === 'ai' ? 'ai' : 'random');
          setPrizesText(Array.isArray(wp.prizes) ? wp.prizes.join('\n') : '');
        }
        await load();
        // Auto-switch to Settings so admin sees editable content immediately
        setActiveTab('settings');
      } else {
        toast.success('Preview ready — review below, then Apply');
      }
    } catch (e: any) {
      toast.error(e.message || 'AI build failed');
    } finally {
      setAiBuilding(false);
    }
  };

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: o }, { data: f }, { data: s }, { data: w }] = await Promise.all([
      supabase.from('offers').select('*').eq('id', id).single(),
      supabase.from('offer_fields').select('*').eq('offer_id', id).order('sort_order'),
      supabase.from('offer_submissions').select('*').eq('offer_id', id).order('created_at', { ascending: false }),
      supabase.from('offer_winners').select('*').eq('offer_id', id).order('rank'),
    ]);
    setOffer(o as Offer);
    setFields((f as Field[]) || []);
    setSubmissions((s as Submission[]) || []);
    setWinners((w as Winner[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const saveOffer = async () => {
    if (!offer) return;
    setSaving(true);
    const { id: _, submission_count: __, ...payload } = offer as any;
    const { error } = await supabase.from('offers').update(payload).eq('id', offer.id);
    if (!error && fields.length > 0) {
      const fieldResults = await Promise.all(fields.map((f) => supabase.from('offer_fields').update(fieldPayload(f)).eq('id', f.id)));
      const fieldError = fieldResults.find((r) => r.error)?.error;
      if (fieldError) {
        setSaving(false);
        return toast.error(fieldError.message);
      }
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Saved');
  };

  const publishOffer = async (openNow = false) => {
    if (!offer) return;
    if (!formReady) {
      toast.error('Add form fields or a Google Form URL before publishing');
      setActiveTab('fields');
      return;
    }
    setSaving(true);
    const patch: Partial<Offer> = { status: 'active' };
    if (openNow || hasFutureStart) patch.start_at = null;
    const { error } = await supabase.from('offers').update(patch).eq('id', offer.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    setOffer({ ...offer, ...patch });
    toast.success(openNow || hasFutureStart ? 'Offer is LIVE now — form is open' : 'Offer is now LIVE 🎉 — public link is active');
  };

  const unpublishOffer = async () => {
    if (!offer) return;
    setSaving(true);
    const { error } = await supabase.from('offers').update({ status: 'draft' }).eq('id', offer.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    setOffer({ ...offer, status: 'draft' });
    toast.success('Offer unpublished (Draft)');
  };

  const addField = async () => {
    if (!offer) return;
    const { data, error } = await supabase
      .from('offer_fields')
      .insert({
        offer_id: offer.id,
        field_type: 'text',
        label: 'New Field',
        required: false,
        sort_order: fields.length,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setFields([...fields, data as Field]);
  };

  const updateField = (idx: number, patch: Partial<Field>) => {
    const next = [...fields];
    next[idx] = { ...next[idx], ...patch };
    setFields(next);
  };

  const saveField = async (f: Field) => {
    const { id: _, offer_id: __, ...payload } = f as any;
    const { error } = await supabase.from('offer_fields').update(payload).eq('id', f.id);
    if (error) toast.error(error.message);
    else toast.success('Field saved');
  };

  const deleteField = async (fid: string) => {
    if (!confirm('Delete this field?')) return;
    await supabase.from('offer_fields').delete().eq('id', fid);
    setFields(fields.filter((f) => f.id !== fid));
  };

  const moveField = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= fields.length) return;
    const next = [...fields];
    [next[idx], next[j]] = [next[j], next[idx]];
    next.forEach((f, i) => (f.sort_order = i));
    setFields(next);
    await Promise.all(next.map((f) => supabase.from('offer_fields').update({ sort_order: f.sort_order }).eq('id', f.id)));
  };

  const pickWinners = async () => {
    if (!offer) return;
    if (submissions.length === 0) return toast.error('No submissions to pick from');
    setPicking(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      const prizes = prizesText.split('\n').map((s) => s.trim()).filter(Boolean);
      const resp = await supabase.functions.invoke('pick-winners', {
        body: {
          offer_id: offer.id,
          count: winnerCount,
          mode: winnerMode,
          prizes,
          replace_existing: true,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (resp.error) throw resp.error;
      toast.success(`${resp.data?.winners?.length || 0} winner(s) selected!`);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to pick winners');
    } finally {
      setPicking(false);
    }
  };

  const exportCSV = () => {
    if (submissions.length === 0) return;
    const allKeys = new Set<string>();
    submissions.forEach((s) => Object.keys(s.data || {}).forEach((k) => allKeys.add(k)));
    const keys = Array.from(allKeys);
    const header = ['Date', 'Name', 'Email', 'Phone', ...keys, 'Winner', 'Rank', 'Prize'];
    const rows = submissions.map((s) => [
      new Date(s.created_at).toLocaleString(),
      s.participant_name || '',
      s.participant_email || '',
      s.participant_phone || '',
      ...keys.map((k) => String(s.data?.[k] ?? '')),
      s.is_winner ? 'Yes' : '',
      s.winner_rank || '',
      s.prize_won || '',
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${offer?.slug}-submissions.csv`;
    a.click();
  };

  const exportWinnersCSV = () => {
    if (winners.length === 0) return;
    const allKeys = new Set<string>();
    winners.forEach((w) => {
      const sub = submissions.find((s) => s.id === w.submission_id);
      if (sub) Object.keys(sub.data || {}).forEach((k) => allKeys.add(k));
    });
    const keys = Array.from(allKeys);
    const header = ['Rank', 'Prize', 'Name', 'Email', 'Phone', 'Selected By', 'AI Reason', 'Submitted At', ...keys];
    const rows = winners
      .slice()
      .sort((a, b) => a.rank - b.rank)
      .map((w) => {
        const sub = submissions.find((s) => s.id === w.submission_id);
        return [
          w.rank,
          w.prize || '',
          sub?.participant_name || '',
          sub?.participant_email || '',
          sub?.participant_phone || '',
          w.selected_by,
          w.ai_reason || '',
          sub ? new Date(sub.created_at).toLocaleString() : '',
          ...keys.map((k) => String(sub?.data?.[k] ?? '')),
        ];
      });
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${offer?.slug}-winners.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${winners.length} winner(s) exported`);
  };

  if (loading || !offer) return <div className="py-12 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/ceo/offers"><ArrowLeft className="w-4 h-4 mr-1" /> All Offers</Link>
          </Button>
          <h1 className="text-xl font-bold">{offer.title}</h1>
          <Badge>{offer.status}</Badge>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" asChild>
            <a href={`/offer/${offer.slug}`} target="_blank" rel="noopener noreferrer">
              <Eye className="w-4 h-4 mr-1" /> Preview
            </a>
          </Button>
          {offer.status !== 'active' ? (
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={saving}
              onClick={() => publishOffer(true)}
            >
              🚀 Publish (Go Live)
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled={saving}
              onClick={unpublishOffer}
            >
              Unpublish
            </Button>
          )}
          <Button onClick={saveOffer} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {offer.status === 'draft' && (
        <div className="rounded-lg border border-amber-400/40 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm flex items-center justify-between gap-3 flex-wrap">
          <div>
            ⚠️ এই offer এখনো <b>Draft</b> অবস্থায় আছে — public link এ "অফার পাওয়া যায়নি" দেখাবে। উপরের <b>🚀 Publish</b> বাটনে ক্লিক করে Live করুন।
          </div>
        </div>
      )}

      {offer.status === 'active' && hasFutureStart && (
        <div className="rounded-lg border border-amber-400/40 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm flex items-center justify-between gap-3 flex-wrap">
          <div>
            ⚠️ এই offer Active, কিন্তু Start Date ভবিষ্যতে দেওয়া আছে — public page এ এখন form দেখাবে না।
          </div>
          <Button size="sm" onClick={() => publishOffer(true)} disabled={saving}>Open Form Now</Button>
        </div>
      )}

      {offer.status === 'active' && !formReady && (
        <div className="rounded-lg border border-red-400/40 bg-red-50 dark:bg-red-950/20 p-3 text-sm flex items-center justify-between gap-3 flex-wrap">
          <div>⚠️ এই offer Active, কিন্তু কোনো custom form field বা Google Form URL নেই — public page এ submission form দেখাবে না।</div>
          <Button size="sm" variant="outline" onClick={() => setActiveTab('fields')}>Add Fields</Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="ai"><Wand2 className="w-3.5 h-3.5 mr-1" /> AI Builder</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="fields">Form Fields ({fields.length})</TabsTrigger>
          <TabsTrigger value="submissions">Submissions ({submissions.length})</TabsTrigger>
          <TabsTrigger value="winners">Winners ({winners.length})</TabsTrigger>
        </TabsList>

        {/* AI BUILDER */}
        <TabsContent value="ai" className="space-y-4">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" /> AI Offer Builder (Gemini)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Describe your offer in plain language (Bengali or English). The AI will design the title, description, prize list, terms, form fields, and winner-selection plan automatically.
              </p>
              <div>
                <Label>Offer Description / Brief</Label>
                <Textarea
                  rows={6}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={'উদাহরণ: ঈদ উপলক্ষে আমরা একটি Windows 11 Pro Key giveaway করতে চাই। ৩ জন winner থাকবে। প্রথম জন পাবে Windows 11 Pro + Office 2021, দ্বিতীয় জন Windows 11 Pro, তৃতীয় জন Office 365 1 বছর। যারা আমাদের page follow করে এবং একটি creative caption লিখে পাঠাবে তারা অংশ নিতে পারবে।'}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => runAiBuild(false)} disabled={aiBuilding} variant="outline">
                  {aiBuilding ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Eye className="w-4 h-4 mr-1" />}
                  Preview
                </Button>
                <Button onClick={() => runAiBuild(true)} disabled={aiBuilding}>
                  {aiBuilding ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                  Build & Apply
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ "Build & Apply" will replace current form fields and offer text. Submissions are preserved.
              </p>
            </CardContent>
          </Card>

          {aiPreview && (
            <Card>
              <CardHeader><CardTitle>AI Plan Preview</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="font-semibold mb-1">Title</div>
                  <div>{aiPreview.offer?.title}</div>
                </div>
                {aiPreview.offer?.slug && (
                  <div>
                    <div className="font-semibold mb-1">Slug</div>
                    <code className="text-xs bg-muted px-2 py-1 rounded">/offer/{aiPreview.offer.slug}</code>
                  </div>
                )}
                <div>
                  <div className="font-semibold mb-1">Description</div>
                  <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded">{aiPreview.offer?.description}</pre>
                </div>
                <div>
                  <div className="font-semibold mb-1">Prizes</div>
                  <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded">{aiPreview.offer?.prize_details}</pre>
                </div>
                <div>
                  <div className="font-semibold mb-1">Terms</div>
                  <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded">{aiPreview.offer?.terms}</pre>
                </div>
                <div>
                  <div className="font-semibold mb-1">Form Fields ({aiPreview.fields?.length || 0})</div>
                  <div className="space-y-1">
                    {aiPreview.fields?.map((f: any, i: number) => (
                      <div key={i} className="border rounded p-2 text-xs">
                        <Badge variant="outline" className="mr-2">{f.field_type}</Badge>
                        <strong>{f.label}</strong>{f.required && <span className="text-red-500"> *</span>}
                        {f.options && <div className="mt-1 text-muted-foreground">Options: {f.options.join(', ')}</div>}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-semibold mb-1">Winner Plan</div>
                  <div className="text-xs bg-muted p-2 rounded">
                    {aiPreview.winner_plan?.count} winner(s) • Mode: <Badge variant="outline">{aiPreview.winner_plan?.mode}</Badge>
                    {aiPreview.winner_plan?.prizes?.length > 0 && (
                      <ul className="mt-1 ml-4 list-disc">
                        {aiPreview.winner_plan.prizes.map((p: string, i: number) => <li key={i}>#{i + 1}: {p}</li>)}
                      </ul>
                    )}
                    {aiPreview.winner_plan?.reasoning && <div className="mt-1 italic text-muted-foreground">{aiPreview.winner_plan.reasoning}</div>}
                  </div>
                </div>
                <Button onClick={() => runAiBuild(true)} disabled={aiBuilding} className="w-full">
                  <Sparkles className="w-4 h-4 mr-1" /> Apply This Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input value={offer.title} onChange={(e) => setOffer({ ...offer, title: e.target.value })} />
              </div>
              <div>
                <Label>URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">/offer/</span>
                  <Input value={offer.slug} onChange={(e) => setOffer({ ...offer, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
                </div>
              </div>
              <div>
                <Label>Description (Markdown supported)</Label>
                <Textarea rows={5} value={offer.description || ''} onChange={(e) => setOffer({ ...offer, description: e.target.value })} />
              </div>
              <div>
                <Label>Banner Image URL</Label>
                <Input value={offer.banner_url || ''} onChange={(e) => setOffer({ ...offer, banner_url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <Label>Prize Details</Label>
                <Textarea rows={3} value={offer.prize_details || ''} onChange={(e) => setOffer({ ...offer, prize_details: e.target.value })} placeholder="1st: iPhone 15&#10;2nd: ৳5000&#10;3rd: T-shirt" />
              </div>
              <div>
                <Label>Terms & Conditions</Label>
                <Textarea rows={3} value={offer.terms || ''} onChange={(e) => setOffer({ ...offer, terms: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Status & Limits</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Status</Label>
                <Select value={offer.status} onValueChange={(v) => setOffer({ ...offer, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft (hidden)</SelectItem>
                    <SelectItem value="active">Active (live)</SelectItem>
                    <SelectItem value="closed">Closed (read-only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg border p-3 text-sm space-y-2">
                <div className="font-medium">Public form readiness</div>
                <div className="grid gap-1 text-muted-foreground">
                  <div>{offer.status === 'active' ? '✅ Published' : '⚠️ Draft: public link hidden'}</div>
                  <div>{hasFutureStart ? '⚠️ Start Date is in future: form hidden until then' : '✅ Form can open now'}</div>
                  <div>{hasEnded ? '⚠️ End Date already passed' : '✅ Not expired'}</div>
                  <div>{formReady ? '✅ Form source exists' : '⚠️ Add custom fields or Google Form URL'}</div>
                  <div>{offer.require_login ? 'ℹ️ Login required before submit' : '✅ Public visitors can submit without login'}</div>
                </div>
                {(offer.status !== 'active' || hasFutureStart) && formReady && (
                  <Button size="sm" onClick={() => publishOffer(true)} disabled={saving}>Open Public Form Now</Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start Date</Label>
                  <Input type="datetime-local" value={offer.start_at ? offer.start_at.slice(0, 16) : ''} onChange={(e) => setOffer({ ...offer, start_at: e.target.value || null })} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="datetime-local" value={offer.end_at ? offer.end_at.slice(0, 16) : ''} onChange={(e) => setOffer({ ...offer, end_at: e.target.value || null })} />
                </div>
              </div>
              <div>
                <Label>Max Submissions (blank = unlimited)</Label>
                <Input type="number" value={offer.max_submissions || ''} onChange={(e) => setOffer({ ...offer, max_submissions: e.target.value ? +e.target.value : null })} />
              </div>
              <div className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <div className="font-medium">Require Login</div>
                  <div className="text-xs text-muted-foreground">Only signed-in users can submit</div>
                </div>
                <Switch checked={offer.require_login} onCheckedChange={(v) => setOffer({ ...offer, require_login: v })} />
              </div>
              <div className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <div className="font-medium">Show Winners Publicly</div>
                  <div className="text-xs text-muted-foreground">Display winners list on the offer page</div>
                </div>
                <Switch checked={offer.show_winners} onCheckedChange={(v) => setOffer({ ...offer, show_winners: v })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Submission & Integration</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Success Message (after submit)</Label>
                <Textarea rows={2} value={offer.success_message || ''} onChange={(e) => setOffer({ ...offer, success_message: e.target.value })} />
              </div>
              <div>
                <Label>Google Form URL (optional fallback)</Label>
                <Input value={offer.google_form_url || ''} onChange={(e) => setOffer({ ...offer, google_form_url: e.target.value })} placeholder="https://forms.gle/... (if set, embeds Google Form instead)" />
                <p className="text-xs text-muted-foreground mt-1">If custom fields exist, this is shown as a backup link. If no custom fields exist, it embeds the Google Form on your domain.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FIELDS */}
        <TabsContent value="fields" className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={addField}><Plus className="w-4 h-4 mr-1" /> Add Field</Button>
          </div>
          {fields.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">No fields yet. Add fields to build your form.</CardContent></Card>}
          {fields.map((f, idx) => (
            <Card key={f.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">#{idx + 1}</Badge>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => moveField(idx, -1)} disabled={idx === 0}><ArrowUp className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => moveField(idx, 1)} disabled={idx === fields.length - 1}><ArrowDown className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => saveField(f)}><Save className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteField(f.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={f.field_type} onValueChange={(v) => updateField(idx, { field_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Label</Label>
                    <Input value={f.label} onChange={(e) => updateField(idx, { label: e.target.value })} />
                  </div>
                  <div>
                    <Label>Placeholder</Label>
                    <Input value={f.placeholder || ''} onChange={(e) => updateField(idx, { placeholder: e.target.value })} />
                  </div>
                  <div>
                    <Label>Help Text</Label>
                    <Input value={f.help_text || ''} onChange={(e) => updateField(idx, { help_text: e.target.value })} />
                  </div>
                </div>
                {(f.field_type === 'select' || f.field_type === 'radio' || f.field_type === 'checkbox') && (
                  <div>
                    <Label>Options (one per line)</Label>
                    <Textarea
                      rows={3}
                      value={Array.isArray(f.options) ? f.options.join('\n') : ''}
                      onChange={(e) => updateField(idx, { options: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Switch checked={f.required} onCheckedChange={(v) => updateField(idx, { required: v })} />
                  <Label>Required</Label>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* SUBMISSIONS */}
        <TabsContent value="submissions" className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{submissions.length} total entries</p>
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={submissions.length === 0}>
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
          </div>
          {submissions.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No submissions yet.</CardContent></Card>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Phone</th>
                    <th className="p-2 text-left">Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="p-2 whitespace-nowrap">{new Date(s.created_at).toLocaleString()}</td>
                      <td className="p-2">{s.participant_name || '—'}</td>
                      <td className="p-2">{s.participant_email || '—'}</td>
                      <td className="p-2">{s.participant_phone || '—'}</td>
                      <td className="p-2">{s.is_winner && <Badge className="bg-yellow-500/20 text-yellow-700">🏆 #{s.winner_rank}</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* WINNERS */}
        <TabsContent value="winners" className="space-y-3">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Pick Winners</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Number of Winners</Label>
                  <Input type="number" min={1} max={100} value={winnerCount} onChange={(e) => setWinnerCount(Math.max(1, Math.min(100, +e.target.value || 1)))} />
                </div>
                <div>
                  <Label>Selection Mode</Label>
                  <Select value={winnerMode} onValueChange={(v: any) => setWinnerMode(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random">🎲 Random (fair lottery)</SelectItem>
                      <SelectItem value="ai">✨ AI Smart Pick (Gemini)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Prizes (one per line, in order — leave blank to skip)</Label>
                <Textarea
                  rows={Math.min(winnerCount, 5)}
                  value={prizesText}
                  onChange={(e) => setPrizesText(e.target.value)}
                  placeholder={'1st Prize: iPhone 15\n2nd Prize: ৳5000\n3rd Prize: T-shirt'}
                />
              </div>
              <Button onClick={pickWinners} disabled={picking || submissions.length === 0} className="w-full">
                {picking ? 'Picking...' : winnerMode === 'ai' ? <><Sparkles className="w-4 h-4 mr-1" /> Pick {winnerCount} Winner(s) with AI</> : <><Shuffle className="w-4 h-4 mr-1" /> Pick {winnerCount} Random Winner(s)</>}
              </Button>
              {winners.length > 0 && (
                <p className="text-xs text-amber-600">⚠️ This will replace the {winners.length} existing winner(s).</p>
              )}
            </CardContent>
          </Card>

          {winners.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Current Winners ({winners.length})</CardTitle>
                <Button variant="outline" size="sm" onClick={exportWinnersCSV}>
                  <Download className="w-4 h-4 mr-1" /> Export Winners CSV
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {winners.map((w) => {
                  const sub = submissions.find((s) => s.id === w.submission_id);
                  return (
                    <div key={w.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          <Badge className="bg-yellow-500/20 text-yellow-700">🏆 Rank #{w.rank}</Badge>
                          {sub?.participant_name || 'Unknown'}
                        </div>
                        <div className="text-xs text-muted-foreground">{sub?.participant_email} • {sub?.participant_phone}</div>
                        {w.prize && <div className="text-sm mt-1">🎁 {w.prize}</div>}
                        {w.ai_reason && <div className="text-xs text-muted-foreground italic mt-1">AI: {w.ai_reason}</div>}
                      </div>
                      <Badge variant="outline">{w.selected_by}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
