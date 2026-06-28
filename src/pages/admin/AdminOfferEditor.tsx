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
import { ArrowLeft, Save, Plus, Trash2, ArrowUp, ArrowDown, Sparkles, Shuffle, Download, Trophy, Eye } from 'lucide-react';

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
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Saved');
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
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={`/offer/${offer.slug}`} target="_blank" rel="noopener noreferrer">
              <Eye className="w-4 h-4 mr-1" /> Preview
            </a>
          </Button>
          <Button onClick={saveOffer} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="settings">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="fields">Form Fields ({fields.length})</TabsTrigger>
          <TabsTrigger value="submissions">Submissions ({submissions.length})</TabsTrigger>
          <TabsTrigger value="winners">Winners ({winners.length})</TabsTrigger>
        </TabsList>

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
                <p className="text-xs text-muted-foreground mt-1">If filled, the public page embeds this Google Form instead of the custom form — but the URL stays on your domain.</p>
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
              <CardHeader><CardTitle>Current Winners</CardTitle></CardHeader>
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
