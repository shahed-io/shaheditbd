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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Save, Plus, Trash2, ArrowUp, ArrowDown, Sparkles, Shuffle, Download, Trophy, Eye, Wand2, Loader2, BarChart3, Zap, Pencil, Ban, Mail, Search, X } from 'lucide-react';
import PrizesEditor from '@/components/admin/PrizesEditor';
import AiPolishButton from '@/components/admin/AiPolishButton';
import { parsePrizeItems } from '@/lib/offerPrizes';
import { sanitizeBengaliDeep } from '@/lib/bengaliSanitizer';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

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
  auto_publish: boolean;
  auto_close: boolean;
  max_entries_per_user: number;
  min_purchase_amount: number | null;
  referral_bonus_entries: number;
  winner_count: number;
  winner_selection_mode: string;
  auto_notify_winners: boolean;
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
  participant_name: string | null;
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
  const [submissionSearch, setSubmissionSearch] = useState('');
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
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null);
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [sendingWinnerEmail, setSendingWinnerEmail] = useState<string | null>(null);
  const [addingSubmission, setAddingSubmission] = useState(false);
  const [newSubmission, setNewSubmission] = useState<{ name: string; email: string; phone: string; data: Record<string, string> }>({ name: '', email: '', phone: '', data: {} });
  const [savingNew, setSavingNew] = useState(false);

  const openAddSubmission = () => {
    const initialData: Record<string, string> = {};
    fields.forEach((f) => { initialData[f.label] = ''; });
    setNewSubmission({ name: '', email: '', phone: '', data: initialData });
    setAddingSubmission(true);
  };

  const createSubmission = async () => {
    if (!offer) return;
    const name = newSubmission.name.trim();
    const email = newSubmission.email.trim().toLowerCase();
    const phone = newSubmission.phone.trim();
    if (!name && !email && !phone) return toast.error('Name, email or phone required');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error('Invalid email');
    // Validate required custom fields
    for (const f of fields) {
      if (f.required) {
        const v = (newSubmission.data[f.label] || '').trim();
        if (!v) return toast.error(`"${f.label}" is required`);
      }
    }
    setSavingNew(true);
    const { data: inserted, error } = await supabase.from('offer_submissions').insert({
      offer_id: offer.id,
      participant_name: name || null,
      participant_email: email || null,
      participant_phone: phone || null,
      data: newSubmission.data,
      source: 'admin_manual',
    } as any).select('*').single();
    setSavingNew(false);
    if (error) return toast.error(error.message);
    toast.success('Submission added');
    setSubmissions((prev) => [inserted as Submission, ...prev]);
    setAddingSubmission(false);
  };

  const deleteSubmission = async (s: Submission) => {
    if (!confirm(`Delete submission from ${s.participant_name || s.participant_email || 'this participant'}? This cannot be undone.`)) return;
    const { error } = await supabase.from('offer_submissions').delete().eq('id', s.id);
    if (error) return toast.error(error.message);
    toast.success('Submission deleted');
    setSubmissions((prev) => prev.filter((x) => x.id !== s.id));
  };

  const banParticipant = async (s: Submission) => {
    if (!offer) return;
    const identifier = s.participant_email || s.participant_phone;
    const kind = s.participant_email ? 'email' : (s.participant_phone ? 'phone' : null);
    if (!identifier || !kind) return toast.error('No email or phone to ban');
    const reason = prompt(`Ban ${identifier} from this offer? (optional reason)`, '');
    if (reason === null) return;
    const { error } = await supabase.from('offer_blocked_participants').insert({
      offer_id: offer.id, kind, identifier: identifier.toLowerCase().trim(), reason: reason || null,
    });
    if (error) return toast.error(error.message);
    toast.success(`${identifier} banned from this offer`);
  };

  const saveSubmissionEdit = async () => {
    if (!editingSubmission) return;
    setSavingEdit(true);
    const { id: sid, participant_name, participant_email, participant_phone, data } = editingSubmission;
    const { error } = await supabase.from('offer_submissions')
      .update({ participant_name, participant_email, participant_phone, data })
      .eq('id', sid);
    setSavingEdit(false);
    if (error) return toast.error(error.message);
    toast.success('Submission updated');
    setSubmissions((prev) => prev.map((x) => x.id === sid ? { ...x, participant_name, participant_email, participant_phone, data } : x));
    setEditingSubmission(null);
  };

  const sendWinnerEmail = async (w: Winner) => {
    const sub = submissions.find((s) => s.id === w.submission_id);
    if (!sub?.participant_email) return toast.error('Winner has no email address');
    if (!offer) return;
    if (!confirm(`Send winner notification email to ${sub.participant_email}?`)) return;
    setSendingWinnerEmail(w.id);
    try {
      const { error } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'giveaway-winner',
          recipientEmail: sub.participant_email,
          idempotencyKey: `giveaway-winner-manual-${w.id}-${Date.now()}`,
          templateData: {
            name: sub.participant_name || 'Winner',
            offerTitle: offer.title,
            rank: w.rank,
            prize: w.prize,
          },
        },
      });
      if (error) throw error;
      toast.success(`Email sent to ${sub.participant_email}`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send email');
    } finally {
      setSendingWinnerEmail(null);
    }
  };

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

  const parsePrizesFromDetails = (text: string | null | undefined): string[] => {
    return parsePrizeItems(text)
      .map((item) => [item.title, item.description].filter(Boolean).join(' — ').trim())
      .filter(Boolean);
  };

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: o }, { data: f }, { data: s }, { data: w }] = await Promise.all([
      supabase.from('offers').select('*').eq('id', id).single(),
      supabase.from('offer_fields').select('*').eq('offer_id', id).order('sort_order'),
      supabase.from('offer_submissions').select('*').eq('offer_id', id).order('created_at', { ascending: false }),
      (supabase as any).from('admin_offer_winners').select('*').eq('offer_id', id).order('rank'),
    ]);
    const offerData = o as any;
    if (offerData) {
      offerData.auto_publish = offerData.auto_publish ?? false;
      offerData.auto_close = offerData.auto_close ?? false;
      offerData.max_entries_per_user = offerData.max_entries_per_user ?? 1;
      offerData.min_purchase_amount = offerData.min_purchase_amount ?? null;
      offerData.referral_bonus_entries = offerData.referral_bonus_entries ?? 0;
      offerData.winner_count = offerData.winner_count ?? 1;
      offerData.winner_selection_mode = offerData.winner_selection_mode ?? 'manual';
      offerData.auto_notify_winners = offerData.auto_notify_winners ?? true;
    }
    setOffer(offerData as Offer);
    setFields((f as Field[]) || []);
    setSubmissions((s as Submission[]) || []);
    setWinners((w as Winner[]) || []);
    // Auto-fill prizes from offer.prize_details on first load (only if admin hasn't typed yet)
    const parsed = parsePrizesFromDetails((o as Offer | null)?.prize_details);
    if (parsed.length > 0) {
      setPrizesText((prev) => (prev && prev.trim() ? prev : parsed.join('\n')));
      setWinnerCount((prev) => (prev && prev !== 1 ? prev : Math.max(1, Math.min(100, parsed.length))));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const saveOffer = async () => {
    if (!offer) return;
    setSaving(true);
    const { id: _, submission_count: __, ...rest } = offer as any;
    const payload = sanitizeBengaliDeep(rest);
    const { error } = await supabase.from('offers').update(payload).eq('id', offer.id);
    if (!error && fields.length > 0) {
      const fieldResults = await Promise.all(fields.map((f) => supabase.from('offer_fields').update(sanitizeBengaliDeep(fieldPayload(f))).eq('id', f.id)));
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

  const autoPickWinners = async () => {
    if (!offer) return;
    if (submissions.length === 0) return toast.error('No submissions to pick from');
    if (offer.winner_selection_mode === 'manual') {
      return toast.error('Selection mode is set to Manual. Change it in Settings → Winner Automation, or use the manual picker below.');
    }
    if (!confirm(`Auto-pick ${offer.winner_count} winner(s) using "${offer.winner_selection_mode}" mode?`)) return;
    setPicking(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      const resp = await supabase.functions.invoke('offer-auto-winner', {
        body: { offer_id: offer.id },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (resp.error) throw resp.error;
      toast.success(`${resp.data?.winners || 0} winner(s) selected!`);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Auto-pick failed');
    } finally {
      setPicking(false);
    }
  };

  const downloadFullCSV = async () => {
    if (!offer) return;
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      const resp = await fetch(
        `https://dpvdavjwqyviredzoorj.supabase.co/functions/v1/offer-export-csv`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ offer_id: offer.id }),
        }
      );
      if (!resp.ok) throw new Error(await resp.text());
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${offer.slug}-full-export.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e.message || 'Export failed');
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
          <TabsTrigger value="analytics"><BarChart3 className="w-3.5 h-3.5 mr-1" /> Analytics</TabsTrigger>
        </TabsList>

        {/* AI BUILDER */}
        <TabsContent value="ai" className="space-y-4">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-sky-500/5">
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
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Label>Title</Label>
                  <AiPolishButton
                    value={offer.title}
                    onChange={(next) => setOffer({ ...offer, title: next })}
                    kind="offer_title"
                    maxChars={120}
                  />
                </div>
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
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Label>Description (Markdown supported)</Label>
                  <AiPolishButton
                    value={offer.description || ''}
                    onChange={(next) => setOffer({ ...offer, description: next })}
                    kind="offer_description"
                    maxChars={1500}
                  />
                </div>
                <Textarea rows={5} value={offer.description || ''} onChange={(e) => setOffer({ ...offer, description: e.target.value })} />
              </div>
              <div>
                <Label>Banner Image URL</Label>
                <Input value={offer.banner_url || ''} onChange={(e) => setOffer({ ...offer, banner_url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <Label>Prize Details</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  প্রতিটি পুরস্কার আলাদা box-এ যোগ করুন। ইচ্ছামত পুরস্কার add/remove/reorder করতে পারবেন। প্রতিটা field-এ AI দিয়ে সুন্দর করে লিখতে পারবেন ✨।
                </p>
                <PrizesEditor
                  value={offer.prize_details}
                  onChange={(next) => setOffer({ ...offer, prize_details: next })}
                />
              </div>
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Label>Terms & Conditions</Label>
                  <AiPolishButton
                    value={offer.terms || ''}
                    onChange={(next) => setOffer({ ...offer, terms: next })}
                    kind="terms"
                    maxChars={1500}
                  />
                </div>
                <Textarea rows={3} value={offer.terms || ''} onChange={(e) => setOffer({ ...offer, terms: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          {/* Optional notice / announcement banner shown at the top of the public offer page */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>Announcement / Notice (optional)</span>
                <Switch
                  checked={offer.show_notice}
                  onCheckedChange={(v) => setOffer({ ...offer, show_notice: v })}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Giveaway page-এর একদম উপরে একটা notice দেখাতে চাইলে এখানে লিখুন এবং toggle অন করুন। না চাইলে toggle বন্ধ রাখুন — notice hidden থাকবে।
              </p>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Notice text</Label>
                <AiPolishButton
                  value={offer.notice || ''}
                  onChange={(next) => setOffer({ ...offer, notice: next, show_notice: true })}
                  kind="notice"
                  maxChars={500}
                />
              </div>
              <Textarea
                rows={3}
                value={offer.notice || ''}
                onChange={(e) => setOffer({ ...offer, notice: e.target.value })}
                placeholder="উদাহরণ: শেষ ২৪ ঘন্টা! এন্ট্রি জমা দিতে ভুলবেন না।"
                disabled={!offer.show_notice}
              />
              {!offer.show_notice && (
                <p className="text-xs text-muted-foreground italic">
                  Toggle বন্ধ — notice public page-এ দেখানো হবে না।
                </p>
              )}
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

          {/* SCHEDULE AUTOMATION */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /> Schedule Automation</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Start এবং End Date-এ পৌঁছালে giveaway automatically publish/close হবে। Cron প্রতি ৫ মিনিটে চেক করে।</p>
              <div className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <div className="font-medium">Auto-Publish at Start Date</div>
                  <div className="text-xs text-muted-foreground">Draft giveaway automatically Active হবে যখন Start Date-এ পৌঁছাবে</div>
                </div>
                <Switch checked={offer.auto_publish} onCheckedChange={(v) => setOffer({ ...offer, auto_publish: v })} />
              </div>
              <div className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <div className="font-medium">Auto-Close at End Date</div>
                  <div className="text-xs text-muted-foreground">End Date পার হলে giveaway automatically Closed হবে</div>
                </div>
                <Switch checked={offer.auto_close} onCheckedChange={(v) => setOffer({ ...offer, auto_close: v })} />
              </div>
              {(offer.auto_publish || offer.auto_close) && !offer.start_at && !offer.end_at && (
                <div className="text-xs text-amber-600 border border-amber-400/40 bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                  ⚠️ Automation on আছে কিন্তু Start/End Date সেট করা হয়নি। উপরে "Status & Limits" এ set করুন।
                </div>
              )}
            </CardContent>
          </Card>

          {/* ENTRY RULES */}
          <Card>
            <CardHeader><CardTitle>Entry Rules</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Maximum Entries per User</Label>
                <Input
                  type="number"
                  min={1}
                  value={offer.max_entries_per_user}
                  onChange={(e) => setOffer({ ...offer, max_entries_per_user: Math.max(1, +e.target.value || 1) })}
                />
                <p className="text-xs text-muted-foreground mt-1">প্রতি user সর্বোচ্চ কতবার এন্ট্রি দিতে পারবে</p>
              </div>
              <div>
                <Label>Minimum Purchase Amount (৳)</Label>
                <Input
                  type="number"
                  min={0}
                  value={offer.min_purchase_amount ?? ''}
                  onChange={(e) => setOffer({ ...offer, min_purchase_amount: e.target.value ? +e.target.value : null })}
                  placeholder="0 = কোনো শর্ত নেই"
                />
                <p className="text-xs text-muted-foreground mt-1">এই amount-এর কেনাকাটা থাকলেই কেবল অংশ নিতে পারবে (completed orders)</p>
              </div>
              <div>
                <Label>Bonus Entries per Referral</Label>
                <Input
                  type="number"
                  min={0}
                  value={offer.referral_bonus_entries}
                  onChange={(e) => setOffer({ ...offer, referral_bonus_entries: Math.max(0, +e.target.value || 0) })}
                />
                <p className="text-xs text-muted-foreground mt-1">প্রতিটি referral এর জন্য অতিরিক্ত এন্ট্রি (weighted winner selection-এ কাজ করে)</p>
              </div>
            </CardContent>
          </Card>

          {/* WINNER AUTOMATION */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Winner Automation</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Number of Winners</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={offer.winner_count}
                    onChange={(e) => setOffer({ ...offer, winner_count: Math.max(1, Math.min(100, +e.target.value || 1)) })}
                  />
                </div>
                <div>
                  <Label>Selection Mode</Label>
                  <Select value={offer.winner_selection_mode} onValueChange={(v) => setOffer({ ...offer, winner_selection_mode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">✋ Manual (admin picks)</SelectItem>
                      <SelectItem value="random">🎲 Random (fair lottery)</SelectItem>
                      <SelectItem value="weighted_referral">⚖️ Weighted by Referrals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <div className="font-medium">Auto-Notify Winners</div>
                  <div className="text-xs text-muted-foreground">Winner select হওয়ার সাথে সাথে dashboard notification + email পাঠাবে</div>
                </div>
                <Switch checked={offer.auto_notify_winners} onCheckedChange={(v) => setOffer({ ...offer, auto_notify_winners: v })} />
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardHeader><CardTitle>Submission & Integration</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Label>Success Message (after submit)</Label>
                  <AiPolishButton
                    value={offer.success_message || ''}
                    onChange={(next) => setOffer({ ...offer, success_message: next })}
                    kind="success_message"
                    maxChars={400}
                  />
                </div>
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
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <Label>Label</Label>
                      <AiPolishButton
                        value={f.label || ''}
                        onChange={(next) => updateField(idx, { label: next })}
                        kind="field_label"
                        maxChars={80}
                        size="icon"
                      />
                    </div>
                    <Input value={f.label} onChange={(e) => updateField(idx, { label: e.target.value })} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <Label>Placeholder</Label>
                      <AiPolishButton
                        value={f.placeholder || ''}
                        onChange={(next) => updateField(idx, { placeholder: next })}
                        kind="field_help"
                        maxChars={100}
                        size="icon"
                      />
                    </div>
                    <Input value={f.placeholder || ''} onChange={(e) => updateField(idx, { placeholder: e.target.value })} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <Label>Help Text</Label>
                      <AiPolishButton
                        value={f.help_text || ''}
                        onChange={(next) => updateField(idx, { help_text: next })}
                        kind="field_help"
                        maxChars={160}
                        size="icon"
                      />
                    </div>
                    <Input value={f.help_text || ''} onChange={(e) => updateField(idx, { help_text: e.target.value })} />
                  </div>
                </div>
                {(f.field_type === 'select' || f.field_type === 'radio' || f.field_type === 'checkbox') && (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <Label>Options (one per line)</Label>
                      <AiPolishButton
                        value={Array.isArray(f.options) ? f.options.join('\n') : ''}
                        onChange={(next) => updateField(idx, { options: next.split('\n').map((s) => s.trim()).filter(Boolean) })}
                        kind="field_options"
                        maxChars={600}
                        size="sm"
                      />
                    </div>
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
          <div className="flex justify-between items-center flex-wrap gap-2">
            <p className="text-sm text-muted-foreground">
              {submissions.length} total ·{' '}
              <span className="text-green-600 font-medium">
                {submissions.filter((s) => s.converted_to_customer).length} converted
              </span>
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={openAddSubmission}
                className="border-cyan-500/40 text-cyan-700 hover:bg-cyan-500/10"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Submission
              </Button>
              <Button
                size="sm"
                onClick={() => convertSubmissions()}
                disabled={converting || submissions.length === 0}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 text-white"
              >
                {converting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : '👥 '}
                Convert All to Customers
              </Button>
              <Button variant="outline" size="sm" onClick={exportCSV} disabled={submissions.length === 0}>
                <Download className="w-4 h-4 mr-1" /> Export CSV
              </Button>
            </div>
          </div>
          <Card className="bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-900">
            <CardContent className="py-3 text-xs text-muted-foreground">
              💡 "Convert to Customer" সব submission এর email-এ account invite পাঠাবে। তারা link এ click করে password set করলেই customer হয়ে যাবে — এক click এ সবাই!
            </CardContent>
          </Card>
          {submissions.length > 0 && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                value={submissionSearch}
                onChange={(e) => setSubmissionSearch(e.target.value)}
                placeholder="Search by phone number, name, or email…"
                className="pl-9 pr-9"
              />
              {submissionSearch && (
                <button
                  type="button"
                  onClick={() => setSubmissionSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          )}
          {(() => {
            const q = submissionSearch.trim().toLowerCase();
            const qDigits = q.replace(/\D/g, '');
            const filteredSubmissions = q
              ? submissions.filter((s) => {
                  const hay = [
                    s.participant_name,
                    s.participant_email,
                    s.participant_phone,
                    ...Object.values(s.data || {}).map((v) => (v == null ? '' : String(v))),
                  ].join(' ').toLowerCase();
                  if (hay.includes(q)) return true;
                  if (qDigits) {
                    const phoneDigits = (s.participant_phone || '').replace(/\D/g, '');
                    if (phoneDigits.includes(qDigits)) return true;
                  }
                  return false;
                })
              : submissions;
            return submissions.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground space-y-3">
              <div>No submissions yet.</div>
              <Button variant="outline" size="sm" onClick={openAddSubmission} className="border-cyan-500/40 text-cyan-700 hover:bg-cyan-500/10">
                <Plus className="w-4 h-4 mr-1" /> Add first submission
              </Button>
            </CardContent></Card>
          ) : filteredSubmissions.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
              No submissions match "<span className="font-medium">{submissionSearch}</span>".
            </CardContent></Card>
          ) : (
            <>
              {/* Desktop / tablet — uniform table */}
              <div className="hidden md:block border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm table-fixed min-w-[880px]">
                    <colgroup>
                      <col className="w-[150px]" />
                      <col className="w-[140px]" />
                      <col />
                      <col className="w-[130px]" />
                      <col className="w-[90px]" />
                      <col className="w-[110px]" />
                      <col className="w-[240px]" />
                    </colgroup>
                    <thead className="bg-muted">
                      <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-2.5 text-left font-medium">Date</th>
                        <th className="px-3 py-2.5 text-left font-medium">Name</th>
                        <th className="px-3 py-2.5 text-left font-medium">Email</th>
                        <th className="px-3 py-2.5 text-left font-medium">Phone</th>
                        <th className="px-3 py-2.5 text-left font-medium">Winner</th>
                        <th className="px-3 py-2.5 text-left font-medium">Customer</th>
                        <th className="px-3 py-2.5 text-left font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubmissions.map((s) => (
                        <tr key={s.id} className="border-t align-middle hover:bg-muted/40">
                          <td className="px-3 py-2.5 whitespace-nowrap text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</td>
                          <td className="px-3 py-2.5 truncate" title={s.participant_name || ''}>{s.participant_name || '—'}</td>
                          <td className="px-3 py-2.5 truncate" title={s.participant_email || ''}>{s.participant_email || '—'}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap">{s.participant_phone || '—'}</td>
                          <td className="px-3 py-2.5">{s.is_winner ? <Badge className="bg-yellow-500/20 text-yellow-700">🏆 #{s.winner_rank}</Badge> : <span className="text-muted-foreground text-xs">—</span>}</td>
                          <td className="px-3 py-2.5">
                            {s.converted_to_customer ? (
                              <Badge className="bg-green-500/20 text-green-700">✓ Customer</Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setViewingSubmission(s)}>
                                <Eye className="w-3.5 h-3.5 mr-1" /> View
                              </Button>
                              {!s.converted_to_customer && s.participant_email && (
                                <Button size="sm" variant="outline" className="h-8 px-2" disabled={converting} onClick={() => convertSubmissions([s.id])}>
                                  Invite
                                </Button>
                              )}
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => setEditingSubmission({ ...s, data: s.data || {} })} title="Edit submission">
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-amber-600 border-amber-500/30 hover:bg-amber-500/10" onClick={() => banParticipant(s)} title="Ban from this offer">
                                <Ban className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-rose-600 border-rose-500/30 hover:bg-rose-500/10" onClick={() => deleteSubmission(s)} title="Delete submission">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile — stacked cards */}
              <div className="md:hidden space-y-2.5">
                {filteredSubmissions.map((s) => (
                  <Card key={s.id} className="overflow-hidden">
                    <CardContent className="p-3 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">{s.participant_name || '—'}</div>
                          <div className="text-xs text-muted-foreground break-all">{s.participant_email || '—'}</div>
                          {s.participant_phone && (
                            <div className="text-xs text-muted-foreground mt-0.5">{s.participant_phone}</div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {s.is_winner && <Badge className="bg-yellow-500/20 text-yellow-700 text-[10px]">🏆 #{s.winner_rank}</Badge>}
                          {s.converted_to_customer && <Badge className="bg-green-500/20 text-green-700 text-[10px]">✓ Customer</Badge>}
                        </div>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(s.created_at).toLocaleString()}
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t">
                        <Button size="sm" variant="outline" className="h-8 px-2 flex-1 min-w-[70px]" onClick={() => setViewingSubmission(s)}>
                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                        </Button>
                        {!s.converted_to_customer && s.participant_email && (
                          <Button size="sm" variant="outline" className="h-8 px-2 flex-1 min-w-[70px]" disabled={converting} onClick={() => convertSubmissions([s.id])}>
                            Invite
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="h-8 w-9 p-0" onClick={() => setEditingSubmission({ ...s, data: s.data || {} })} title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-9 p-0 text-amber-600 border-amber-500/30 hover:bg-amber-500/10" onClick={() => banParticipant(s)} title="Ban">
                          <Ban className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-9 p-0 text-rose-600 border-rose-500/30 hover:bg-rose-500/10" onClick={() => deleteSubmission(s)} title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          );
          })()}
        </TabsContent>

        {/* WINNERS */}
        <TabsContent value="winners" className="space-y-3">
          {/* One-click auto-pick using Settings → Winner Automation config */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-blue-500/5">
            <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm">
                <div className="font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" /> Auto Pick from Settings
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Uses: <b>{offer.winner_count}</b> winner(s), mode <Badge variant="outline">{offer.winner_selection_mode}</Badge>
                  {offer.auto_notify_winners && <span className="ml-2">🔔 Auto-notify ON</span>}
                </div>
              </div>
              <Button
                onClick={autoPickWinners}
                disabled={picking || submissions.length === 0 || offer.winner_selection_mode === 'manual'}
                className="bg-gradient-to-r from-primary to-blue-600 text-white"
              >
                {picking ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                Auto Pick Winners
              </Button>
            </CardContent>
          </Card>
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
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <Label>Prizes (one per line, in order — leave blank to skip)</Label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <AiPolishButton
                      value={prizesText}
                      onChange={setPrizesText}
                      kind="winner_prizes"
                      label="AI Improve"
                      maxChars={800}
                      size="sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        const parsed = parsePrizesFromDetails(offer?.prize_details);
                        if (parsed.length === 0) {
                          toast.error('No prizes found in the offer\'s "Prize Details" field.');
                          return;
                        }
                        setPrizesText(parsed.join('\n'));
                        setWinnerCount(Math.max(1, Math.min(100, parsed.length)));
                        toast.success(`Loaded ${parsed.length} prize(s) from Prize Details`);
                      }}
                    >
                      <Wand2 className="w-3.5 h-3.5 mr-1" /> Auto-fill from Prize Details
                    </Button>
                  </div>
                </div>
                <Textarea
                  rows={Math.min(Math.max(winnerCount, 3), 8)}
                  value={prizesText}
                  onChange={(e) => setPrizesText(e.target.value)}
                  placeholder={'1st Prize: iPhone 15\n2nd Prize: ৳5000\n3rd Prize: T-shirt'}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Prizes auto-load from the offer's "Prize Details" field. Edit freely — your changes here are used when picking winners.
                </p>
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
                    <div
                      key={w.id}
                      className="flex items-center justify-between border rounded-lg p-3 gap-3 hover:bg-accent/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold flex items-center gap-2 flex-wrap">
                          <Badge className="bg-yellow-500/20 text-yellow-700">🏆 Rank #{w.rank}</Badge>
                          <span>{sub?.participant_name || w.participant_name || 'Unknown'}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 break-all">
                          {sub?.participant_email || '—'} • {sub?.participant_phone || '—'}
                        </div>
                        {w.prize && <div className="text-sm mt-1">🎁 {w.prize}</div>}
                        {w.ai_reason && <div className="text-xs text-muted-foreground italic mt-1">AI: {w.ai_reason}</div>}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge variant="outline">{w.selected_by}</Badge>
                        {sub ? (
                          <div className="flex flex-col gap-1.5 items-end">
                            <Button size="sm" variant="outline" onClick={() => setViewingSubmission(sub)}>
                              <Eye className="w-3.5 h-3.5 mr-1" /> View Details
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!sub.participant_email || sendingWinnerEmail === w.id}
                              onClick={() => sendWinnerEmail(w)}
                              className="text-cyan-600 border-cyan-500/30 hover:bg-cyan-500/10"
                              title={sub.participant_email ? 'Send winner notification email' : 'No email on file'}
                            >
                              {sendingWinnerEmail === w.id
                                ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                : <Mail className="w-3.5 h-3.5 mr-1" />}
                              Send Email
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">submission removed</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="space-y-4">
          {(() => {
            const total = submissions.length;
            const uniqueUsers = new Set(submissions.filter((s) => (s as any).user_id).map((s: any) => s.user_id)).size;
            const converted = submissions.filter((s) => s.converted_to_customer).length;
            const winnerCountVal = winners.length;
            const conversionPct = total > 0 ? Math.round((converted / total) * 100) : 0;

            const byDay = new Map<string, number>();
            submissions.forEach((s) => {
              const d = new Date(s.created_at).toISOString().slice(0, 10);
              byDay.set(d, (byDay.get(d) ?? 0) + 1);
            });
            const chart = Array.from(byDay.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([day, entries]) => ({ day: day.slice(5), entries }));

            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total Entries</div><div className="text-2xl font-bold">{total}</div></CardContent></Card>
                  <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Unique Users</div><div className="text-2xl font-bold">{uniqueUsers}</div></CardContent></Card>
                  <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Converted to Customer</div><div className="text-2xl font-bold">{converted} <span className="text-sm text-muted-foreground">({conversionPct}%)</span></div></CardContent></Card>
                  <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Winners Selected</div><div className="text-2xl font-bold">{winnerCountVal}</div></CardContent></Card>
                </div>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base">Daily Entries</CardTitle>
                    <Button variant="outline" size="sm" onClick={downloadFullCSV} disabled={total === 0}>
                      <Download className="w-4 h-4 mr-1" /> Full Export (CSV)
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {chart.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground text-sm">No entries yet.</div>
                    ) : (
                      <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chart}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="day" fontSize={12} />
                            <YAxis fontSize={12} allowDecimals={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="entries" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </TabsContent>
      </Tabs>

      {/* Submission Detail Modal */}
      <Dialog open={!!viewingSubmission} onOpenChange={(o) => !o && setViewingSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" /> Submission Details
            </DialogTitle>
            <DialogDescription>
              {viewingSubmission && new Date(viewingSubmission.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {viewingSubmission && (
            <div className="space-y-4">
              {/* Status badges */}
              <div className="flex flex-wrap gap-2">
                {viewingSubmission.is_winner && (
                  <Badge className="bg-yellow-500/20 text-yellow-700">🏆 Winner #{viewingSubmission.winner_rank}</Badge>
                )}
                {viewingSubmission.converted_to_customer && (
                  <Badge className="bg-green-500/20 text-green-700">✓ Customer</Badge>
                )}
                {viewingSubmission.prize_won && (
                  <Badge className="bg-cyan-500/20 text-cyan-700">🎁 {viewingSubmission.prize_won}</Badge>
                )}
              </div>

              {/* Participant info */}
              <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Participant</h4>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{viewingSubmission.participant_name || '—'}</span></div>
                  <div><span className="text-muted-foreground">Email:</span> <span className="font-medium break-all">{viewingSubmission.participant_email || '—'}</span></div>
                  <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{viewingSubmission.participant_phone || '—'}</span></div>
                </div>
              </div>

              {/* All form answers */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Form Answers</h4>
                {viewingSubmission.data && Object.keys(viewingSubmission.data).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(viewingSubmission.data).map(([key, value]) => {
                      // Try to find matching field label
                      const field = fields.find((f) => f.id === key || f.label === key);
                      const label = field?.label || key;
                      const displayVal = Array.isArray(value)
                        ? value.join(', ')
                        : typeof value === 'object' && value !== null
                          ? JSON.stringify(value, null, 2)
                          : String(value ?? '—');
                      return (
                        <div key={key} className="border rounded-lg p-3">
                          <div className="text-xs text-muted-foreground mb-1">{label}</div>
                          <div className="text-sm font-medium whitespace-pre-wrap break-words">{displayVal || '—'}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No additional form data.</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t flex-wrap">
                {!viewingSubmission.converted_to_customer && viewingSubmission.participant_email && (
                  <Button
                    size="sm"
                    disabled={converting}
                    onClick={() => {
                      const id = viewingSubmission.id;
                      setViewingSubmission(null);
                      convertSubmissions([id]);
                    }}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
                  >
                    👥 Invite as Customer
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setViewingSubmission(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT SUBMISSION DIALOG */}
      <Dialog open={!!editingSubmission} onOpenChange={(o) => !o && setEditingSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Submission</DialogTitle>
            <DialogDescription>Update participant info or their custom field answers.</DialogDescription>
          </DialogHeader>
          {editingSubmission && (
            <div className="space-y-3 pt-2">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Name</Label>
                  <Input value={editingSubmission.participant_name || ''} onChange={(e) => setEditingSubmission({ ...editingSubmission, participant_name: e.target.value })} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={editingSubmission.participant_email || ''} onChange={(e) => setEditingSubmission({ ...editingSubmission, participant_email: e.target.value })} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={editingSubmission.participant_phone || ''} onChange={(e) => setEditingSubmission({ ...editingSubmission, participant_phone: e.target.value })} />
                </div>
              </div>
              {editingSubmission.data && Object.keys(editingSubmission.data).length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase">Custom Field Answers</div>
                  {Object.entries(editingSubmission.data).map(([key, value]) => (
                    <div key={key}>
                      <Label className="text-xs">{key}</Label>
                      <Input
                        value={typeof value === 'string' ? value : JSON.stringify(value)}
                        onChange={(e) => setEditingSubmission({ ...editingSubmission, data: { ...editingSubmission.data, [key]: e.target.value } })}
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingSubmission(null)}>Cancel</Button>
                <Button onClick={saveSubmissionEdit} disabled={savingEdit}>
                  {savingEdit ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ADD SUBMISSION DIALOG */}
      <Dialog open={addingSubmission} onOpenChange={(o) => !o && setAddingSubmission(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Submission Manually</DialogTitle>
            <DialogDescription>
              Admin manually add a participant. This creates a submission just like a public form entry.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <Input value={newSubmission.name} onChange={(e) => setNewSubmission({ ...newSubmission, name: e.target.value })} placeholder="Full name" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={newSubmission.email} onChange={(e) => setNewSubmission({ ...newSubmission, email: e.target.value })} placeholder="name@example.com" />
              </div>
              <div className="sm:col-span-2">
                <Label>Phone</Label>
                <Input value={newSubmission.phone} onChange={(e) => setNewSubmission({ ...newSubmission, phone: e.target.value })} placeholder="01XXXXXXXXX" />
              </div>
            </div>
            {fields.length > 0 && (
              <div className="space-y-2 border-t pt-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase">Custom Form Fields</div>
                {fields.map((f) => (
                  <div key={f.id}>
                    <Label className="text-xs">
                      {f.label} {f.required && <span className="text-rose-500">*</span>}
                    </Label>
                    {f.field_type === 'textarea' ? (
                      <Textarea
                        value={newSubmission.data[f.label] || ''}
                        placeholder={f.placeholder || ''}
                        onChange={(e) => setNewSubmission({ ...newSubmission, data: { ...newSubmission.data, [f.label]: e.target.value } })}
                      />
                    ) : f.field_type === 'select' || f.field_type === 'radio' ? (
                      <Select
                        value={newSubmission.data[f.label] || ''}
                        onValueChange={(v) => setNewSubmission({ ...newSubmission, data: { ...newSubmission.data, [f.label]: v } })}
                      >
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {(Array.isArray(f.options) ? f.options : (f.options?.choices || [])).map((opt: any, i: number) => {
                            const val = typeof opt === 'string' ? opt : (opt?.value ?? opt?.label ?? '');
                            return <SelectItem key={i} value={String(val)}>{String(val)}</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={f.field_type === 'number' ? 'number' : f.field_type === 'email' ? 'email' : f.field_type === 'date' ? 'date' : 'text'}
                        value={newSubmission.data[f.label] || ''}
                        placeholder={f.placeholder || ''}
                        onChange={(e) => setNewSubmission({ ...newSubmission, data: { ...newSubmission.data, [f.label]: e.target.value } })}
                      />
                    )}
                    {f.help_text && <p className="text-[11px] text-muted-foreground mt-0.5">{f.help_text}</p>}
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setAddingSubmission(false)}>Cancel</Button>
              <Button onClick={createSubmission} disabled={savingNew} className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
                {savingNew ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                Add Submission
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
