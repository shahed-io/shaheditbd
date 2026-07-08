import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Trophy, Facebook, UserPlus, Ban, RefreshCw, Sparkles, Trash2, Edit3, Download, ShieldOff, Users, Gift, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import CustomEventsManager from '@/components/admin/CustomEventsManager';

type Offer = { id: string; title: string; slug: string; status: string; winner_count: number };
type Submission = {
  id: string; offer_id: string; participant_name: string | null; participant_email: string | null;
  participant_phone: string | null; is_winner: boolean; winner_rank: number | null; data: any;
  created_at: string;
};
type Winner = {
  id: string; offer_id: string; rank: number; prize: string | null; participant_name: string | null;
  participant_contact: string | null; source: string; notes: string | null;
  submission_id: string | null; fb_comment_id: string | null;
};
type FBComment = {
  id: string; offer_id: string; fb_comment_id: string; author_id: string | null;
  author_name: string | null; message: string | null; like_count: number; is_winner: boolean;
};
type Blocked = { id: string; offer_id: string | null; kind: string; identifier: string; reason: string | null; created_at: string };

const emptyPost = { post_url: '' };

export default function AdminOfferWinners() {
  const [mode, setMode] = useState<'offer' | 'custom'>('offer');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offerId, setOfferId] = useState<string>('');
  const [subs, setSubs] = useState<Submission[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [fbComments, setFbComments] = useState<FBComment[]>([]);
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  // Pick config
  const [pickCount, setPickCount] = useState(1);
  const [pickMode, setPickMode] = useState<'random' | 'ai'>('random');
  const [prizesText, setPrizesText] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false);

  // Facebook
  const [fbForm, setFbForm] = useState(emptyPost);
  const [fbPickCount, setFbPickCount] = useState(1);
  const [fbSelectedIds, setFbSelectedIds] = useState<string[]>([]);
  const [fbOnePerUser, setFbOnePerUser] = useState(true);

  // Winner edit
  const [editWinner, setEditWinner] = useState<Winner | null>(null);

  // Manual add
  const [manualForm, setManualForm] = useState({ name: '', email: '', phone: '', note: '' });
  const [manualOpen, setManualOpen] = useState(false);

  // Block
  const [blockForm, setBlockForm] = useState({ kind: 'email', identifier: '', reason: '', global: false });

  useEffect(() => { loadOffers(); }, []);
  useEffect(() => { if (offerId) loadAll(); }, [offerId]);

  async function loadOffers() {
    const { data } = await supabase
      .from('offers')
      .select('id, title, slug, status, winner_count')
      .in('status', ['active', 'closed', 'draft'])
      .order('created_at', { ascending: false });
    setOffers((data as Offer[]) || []);
    if (data && data.length && !offerId) setOfferId(data[0].id);
  }

  async function loadAll() {
    setLoading(true);
    try {
      const [s, w, fb, bl] = await Promise.all([
        supabase.from('offer_submissions').select('*').eq('offer_id', offerId).order('created_at', { ascending: false }),
        supabase.from('offer_winners').select('*').eq('offer_id', offerId).order('rank'),
        supabase.from('offer_facebook_comments').select('*').eq('offer_id', offerId).order('imported_at', { ascending: false }),
        supabase.from('offer_blocked_participants').select('*').or(`offer_id.eq.${offerId},offer_id.is.null`).order('created_at', { ascending: false }),
      ]);
      setSubs((s.data as Submission[]) || []);
      setWinners((w.data as Winner[]) || []);
      setFbComments((fb.data as FBComment[]) || []);
      setBlocked((bl.data as Blocked[]) || []);
    } finally { setLoading(false); }
  }

  // Duplicate detection — count entries per email/phone/name
  const duplicateGroups = useMemo(() => {
    const groups: Record<string, Submission[]> = {};
    for (const s of subs) {
      const key = (s.participant_email || s.participant_phone || s.participant_name || '').toLowerCase().trim();
      if (!key) continue;
      (groups[key] ||= []).push(s);
    }
    return Object.entries(groups).filter(([, v]) => v.length > 1);
  }, [subs]);

  async function pickFromSubmissions() {
    if (!offerId) return;
    setBusy(true);
    try {
      const prizes = prizesText.split('\n').map(s => s.trim()).filter(Boolean);
      const resp = await supabase.functions.invoke('pick-winners', {
        body: { offer_id: offerId, count: pickCount, mode: pickMode, prizes, replace_existing: replaceExisting },
      });
      if (resp.error) throw resp.error;
      toast.success(`${resp.data?.winners?.length || 0} winner(s) picked`);
      await loadAll();
    } catch (e: any) { toast.error(e.message || 'Failed'); } finally { setBusy(false); }
  }

  async function importFbComments() {
    if (!offerId || !fbForm.post_url) return;
    setBusy(true);
    try {
      const resp = await supabase.functions.invoke('facebook-import-comments', {
        body: { offer_id: offerId, post_url: fbForm.post_url },
      });
      if (resp.error) throw new Error((await (resp.error as any).context?.text?.()) || resp.error.message);
      const d = resp.data as any;
      toast.success(`Imported ${d.imported ?? 0} comments (total ${d.total_comments ?? 0})`);
      await loadAll();
    } catch (e: any) { toast.error(e.message || 'Failed to import'); } finally { setBusy(false); }
  }

  async function pickFbWinners(useSelected: boolean) {
    if (!offerId) return;
    setBusy(true);
    try {
      const prizes = prizesText.split('\n').map(s => s.trim()).filter(Boolean);
      const resp = await supabase.functions.invoke('pick-fb-winners', {
        body: {
          offer_id: offerId,
          count: fbPickCount,
          prizes,
          one_per_user: fbOnePerUser,
          comment_ids: useSelected ? fbSelectedIds : undefined,
        },
      });
      if (resp.error) throw new Error((await (resp.error as any).context?.text?.()) || resp.error.message);
      toast.success(`${(resp.data as any)?.winners ?? 0} FB winner(s) added`);
      setFbSelectedIds([]);
      await loadAll();
    } catch (e: any) { toast.error(e.message || 'Failed'); } finally { setBusy(false); }
  }

  async function saveWinnerEdit() {
    if (!editWinner) return;
    const { error } = await supabase.from('offer_winners').update({
      participant_name: editWinner.participant_name,
      participant_contact: editWinner.participant_contact,
      prize: editWinner.prize,
      rank: editWinner.rank,
      notes: editWinner.notes,
    }).eq('id', editWinner.id);
    if (error) return toast.error(error.message);
    toast.success('Winner updated');
    setEditWinner(null);
    loadAll();
  }

  async function deleteWinner(id: string) {
    if (!confirm('Remove this winner?')) return;
    const { error } = await supabase.from('offer_winners').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Winner removed');
    loadAll();
  }

  async function addManualEntry() {
    if (!offerId || !manualForm.name) return;
    const { error } = await supabase.from('offer_submissions').insert({
      offer_id: offerId,
      participant_name: manualForm.name,
      participant_email: manualForm.email || null,
      participant_phone: manualForm.phone || null,
      data: { source: 'manual_admin', note: manualForm.note },
    } as any);
    if (error) return toast.error(error.message);
    toast.success('Entry added');
    setManualForm({ name: '', email: '', phone: '', note: '' });
    setManualOpen(false);
    loadAll();
  }

  async function blockParticipant(sub: Submission) {
    const kind = sub.participant_email ? 'email' : sub.participant_phone ? 'phone' : 'name';
    const identifier = sub.participant_email || sub.participant_phone || sub.participant_name || '';
    if (!identifier) return toast.error('Nothing to block for this entry');
    const { error } = await supabase.from('offer_blocked_participants').insert({
      offer_id: offerId, kind, identifier, reason: 'Blocked from submissions list',
    } as any);
    if (error) return toast.error(error.message);
    toast.success('Blocked — future entries will be flagged');
    loadAll();
  }

  async function addBlockManual() {
    if (!blockForm.identifier) return;
    const { error } = await supabase.from('offer_blocked_participants').insert({
      offer_id: blockForm.global ? null : offerId,
      kind: blockForm.kind, identifier: blockForm.identifier, reason: blockForm.reason || null,
    } as any);
    if (error) return toast.error(error.message);
    toast.success('Blocked');
    setBlockForm({ kind: 'email', identifier: '', reason: '', global: false });
    loadAll();
  }

  async function unblock(id: string) {
    const { error } = await supabase.from('offer_blocked_participants').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Unblocked');
    loadAll();
  }

  const blockedIdentifiers = useMemo(() => new Set(blocked.map(b => `${b.kind}:${(b.identifier || '').toLowerCase()}`)), [blocked]);
  const isSubBlocked = (s: Submission) => {
    return (
      (s.participant_email && blockedIdentifiers.has(`email:${s.participant_email.toLowerCase()}`)) ||
      (s.participant_phone && blockedIdentifiers.has(`phone:${s.participant_phone.toLowerCase()}`)) ||
      (s.participant_name && blockedIdentifiers.has(`name:${s.participant_name.toLowerCase()}`))
    );
  };

  const currentOffer = offers.find(o => o.id === offerId);

  return (
    <div className="space-y-6">
      {/* Mode toggle: Offer-based winners vs Custom events */}
      <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-muted/40 w-fit">
        <button
          type="button"
          onClick={() => setMode('offer')}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${mode === 'offer' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Gift className="w-4 h-4" />Offer Winners
        </button>
        <button
          type="button"
          onClick={() => setMode('custom')}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${mode === 'custom' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Wand2 className="w-4 h-4" />Custom Events
        </button>
      </div>

      {mode === 'custom' ? <CustomEventsManager /> : (
      <>
      {/* Offer selector + stats */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <Label className="text-xs">Select Offer</Label>
            <Select value={offerId} onValueChange={setOfferId}>
              <SelectTrigger><SelectValue placeholder="Choose an offer" /></SelectTrigger>
              <SelectContent>
                {offers.map(o => (
                  <SelectItem key={o.id} value={o.id}>{o.title} <span className="text-xs text-muted-foreground ml-2">({o.status})</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline"><Users className="w-3 h-3 mr-1" />{subs.length} entries</Badge>
            <Badge variant="outline"><Trophy className="w-3 h-3 mr-1" />{winners.length} winners</Badge>
            <Badge variant="outline"><Facebook className="w-3 h-3 mr-1" />{fbComments.length} FB comments</Badge>
            <Badge variant="outline"><Ban className="w-3 h-3 mr-1" />{blocked.length} blocked</Badge>
            <Button variant="outline" size="sm" onClick={loadAll} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {!offerId ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Select an offer to manage winners.</CardContent></Card>
      ) : (
        <Tabs defaultValue="winners" className="space-y-4">
          <TabsList>
            <TabsTrigger value="winners">Winners ({winners.length})</TabsTrigger>
            <TabsTrigger value="entries">Entries ({subs.length})</TabsTrigger>
            <TabsTrigger value="facebook">Facebook ({fbComments.length})</TabsTrigger>
            <TabsTrigger value="blocked">Blocked ({blocked.length})</TabsTrigger>
          </TabsList>

          {/* WINNERS */}
          <TabsContent value="winners" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4" />Pick from entries</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-4">
                <div>
                  <Label className="text-xs">Count</Label>
                  <Input type="number" min={1} value={pickCount} onChange={e => setPickCount(+e.target.value || 1)} />
                </div>
                <div>
                  <Label className="text-xs">Mode</Label>
                  <Select value={pickMode} onValueChange={v => setPickMode(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random">Random</SelectItem>
                      <SelectItem value="ai">AI (quality-scored)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Prizes (one per line, in rank order)</Label>
                  <Textarea rows={2} value={prizesText} onChange={e => setPrizesText(e.target.value)} placeholder="1st prize&#10;2nd prize" />
                </div>
                <div className="md:col-span-4 flex items-center gap-3 flex-wrap">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={replaceExisting} onCheckedChange={v => setReplaceExisting(!!v)} />
                    Replace existing winners
                  </label>
                  <Button onClick={pickFromSubmissions} disabled={busy}><Trophy className="w-4 h-4 mr-1" />Pick Winners</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Current Winners</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {winners.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No winners yet.</p>
                ) : winners.map(w => (
                  <div key={w.id} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white flex items-center justify-center font-bold shrink-0">#{w.rank}</div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{w.participant_name || 'Unnamed'}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {w.prize || 'No prize set'}
                          {w.participant_contact && ` • ${w.participant_contact}`}
                          {' • '}<Badge variant="outline" className="text-[10px]">{w.source}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditWinner(w)}><Edit3 className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteWinner(w.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ENTRIES */}
          <TabsContent value="entries" className="space-y-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Submissions</CardTitle>
                <Dialog open={manualOpen} onOpenChange={setManualOpen}>
                  <DialogTrigger asChild><Button size="sm"><UserPlus className="w-4 h-4 mr-1" />Add entry</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add participant manually</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Name *</Label><Input value={manualForm.name} onChange={e => setManualForm({ ...manualForm, name: e.target.value })} /></div>
                      <div><Label>Email</Label><Input value={manualForm.email} onChange={e => setManualForm({ ...manualForm, email: e.target.value })} /></div>
                      <div><Label>Phone</Label><Input value={manualForm.phone} onChange={e => setManualForm({ ...manualForm, phone: e.target.value })} /></div>
                      <div><Label>Note</Label><Textarea value={manualForm.note} onChange={e => setManualForm({ ...manualForm, note: e.target.value })} /></div>
                    </div>
                    <DialogFooter><Button onClick={addManualEntry}>Add</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {duplicateGroups.length > 0 && (
                  <div className="mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm">
                    <b>{duplicateGroups.length}</b> potential duplicate group(s) detected — entries sharing the same email/phone/name are highlighted below.
                  </div>
                )}
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {subs.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No entries yet.</p>}
                  {subs.map(s => {
                    const key = (s.participant_email || s.participant_phone || s.participant_name || '').toLowerCase().trim();
                    const isDup = key && duplicateGroups.some(([k]) => k === key);
                    const blockedNow = isSubBlocked(s);
                    return (
                      <div key={s.id} className={`flex items-center justify-between gap-3 border rounded-lg p-3 ${isDup ? 'border-amber-500/50 bg-amber-500/5' : ''}`}>
                        <div className="min-w-0">
                          <div className="font-medium truncate flex items-center gap-2">
                            {s.participant_name || 'Anonymous'}
                            {s.is_winner && <Badge className="bg-yellow-500 text-white">Winner #{s.winner_rank}</Badge>}
                            {isDup && <Badge variant="outline" className="text-amber-600 border-amber-500">Duplicate</Badge>}
                            {blockedNow && <Badge variant="destructive">Blocked</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {s.participant_email || '—'} • {s.participant_phone || '—'} • {new Date(s.created_at).toLocaleString()}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => blockParticipant(s)} disabled={blockedNow}>
                          <Ban className="w-3.5 h-3.5 mr-1" />Block
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FACEBOOK */}
          <TabsContent value="facebook" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Facebook className="w-4 h-4" />Import Facebook post comments</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <div>
                    <Label className="text-xs">Facebook post / permalink URL</Label>
                    <Input value={fbForm.post_url} onChange={e => setFbForm({ post_url: e.target.value })} placeholder="https://www.facebook.com/yourpage/posts/1234567890" />
                  </div>
                  <div className="flex items-end"><Button onClick={importFbComments} disabled={busy || !fbForm.post_url}><Download className="w-4 h-4 mr-1" />Import</Button></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires a Facebook Page Access Token (secret: <code>FACEBOOK_PAGE_ACCESS_TOKEN</code>). Ask us to add it when ready.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">Imported comments</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-xs flex items-center gap-1"><Checkbox checked={fbOnePerUser} onCheckedChange={v => setFbOnePerUser(!!v)} />one entry per FB user</label>
                  <Input type="number" min={1} value={fbPickCount} onChange={e => setFbPickCount(+e.target.value || 1)} className="w-20" />
                  <Button size="sm" variant="outline" onClick={() => pickFbWinners(false)} disabled={busy || fbComments.length === 0}>
                    <Sparkles className="w-3.5 h-3.5 mr-1" />Random pick
                  </Button>
                  <Button size="sm" onClick={() => pickFbWinners(true)} disabled={busy || fbSelectedIds.length === 0}>
                    <Trophy className="w-3.5 h-3.5 mr-1" />Make selected winners ({fbSelectedIds.length})
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {fbComments.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No comments imported yet.</p>}
                  {fbComments.map(c => (
                    <label key={c.id} className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer ${fbSelectedIds.includes(c.id) ? 'border-primary bg-primary/5' : ''}`}>
                      <Checkbox
                        checked={fbSelectedIds.includes(c.id)}
                        onCheckedChange={v => setFbSelectedIds(prev => v ? [...prev, c.id] : prev.filter(x => x !== c.id))}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm flex items-center gap-2">
                          {c.author_name || 'FB User'}
                          {c.is_winner && <Badge className="bg-yellow-500 text-white">Winner</Badge>}
                          <span className="text-xs text-muted-foreground">👍 {c.like_count}</span>
                        </div>
                        <div className="text-sm mt-0.5 break-words">{c.message || <em className="text-muted-foreground">no text</em>}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BLOCKED */}
          <TabsContent value="blocked" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Add block</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-5">
                <Select value={blockForm.kind} onValueChange={v => setBlockForm({ ...blockForm, kind: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="facebook_id">Facebook ID</SelectItem>
                    <SelectItem value="user_id">User ID</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Identifier" value={blockForm.identifier} onChange={e => setBlockForm({ ...blockForm, identifier: e.target.value })} />
                <Input placeholder="Reason (optional)" value={blockForm.reason} onChange={e => setBlockForm({ ...blockForm, reason: e.target.value })} className="md:col-span-2" />
                <div className="flex items-center gap-2">
                  <label className="text-xs flex items-center gap-1"><Checkbox checked={blockForm.global} onCheckedChange={v => setBlockForm({ ...blockForm, global: !!v })} />Global</label>
                  <Button size="sm" onClick={addBlockManual}><Ban className="w-4 h-4 mr-1" />Block</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Blocked list</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {blocked.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nothing blocked.</p>}
                {blocked.map(b => (
                  <div key={b.id} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                    <div className="min-w-0">
                      <div className="font-medium text-sm flex items-center gap-2">
                        <Badge variant="outline">{b.kind}</Badge>
                        <span className="truncate">{b.identifier}</span>
                        {!b.offer_id && <Badge variant="secondary">Global</Badge>}
                      </div>
                      {b.reason && <div className="text-xs text-muted-foreground mt-0.5">{b.reason}</div>}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => unblock(b.id)}><ShieldOff className="w-3.5 h-3.5 mr-1" />Unblock</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Edit winner dialog */}
      <Dialog open={!!editWinner} onOpenChange={o => !o && setEditWinner(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit winner</DialogTitle></DialogHeader>
          {editWinner && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Rank</Label><Input type="number" value={editWinner.rank} onChange={e => setEditWinner({ ...editWinner, rank: +e.target.value })} /></div>
                <div><Label>Prize</Label><Input value={editWinner.prize || ''} onChange={e => setEditWinner({ ...editWinner, prize: e.target.value })} /></div>
              </div>
              <div><Label>Name</Label><Input value={editWinner.participant_name || ''} onChange={e => setEditWinner({ ...editWinner, participant_name: e.target.value })} /></div>
              <div><Label>Contact (email / phone / facebook)</Label><Input value={editWinner.participant_contact || ''} onChange={e => setEditWinner({ ...editWinner, participant_contact: e.target.value })} /></div>
              <div><Label>Notes</Label><Textarea value={editWinner.notes || ''} onChange={e => setEditWinner({ ...editWinner, notes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={saveWinnerEdit}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      </>
      )}
    </div>
  );
}
