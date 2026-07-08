import { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Upload, Trophy, Trash2, Edit3, UserPlus, Sparkles, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type Event = { id: string; name: string; description: string | null; notes: string | null; winner_count: number; status: string; created_at: string };
type Participant = {
  id: string; event_id: string; name: string; email: string | null; phone: string | null;
  facebook: string | null; extra: any; notes: string | null;
  is_winner: boolean; winner_rank: number | null; prize: string | null; created_at: string;
};

export default function CustomEventsManager() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState<string>('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);

  // New event
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', description: '', notes: '', winner_count: 1 });

  // Edit event
  const [editEvent, setEditEvent] = useState<Event | null>(null);

  // Manual add participant
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', facebook: '', notes: '' });

  // Pick
  const [pickCount, setPickCount] = useState(1);
  const [prizesText, setPrizesText] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [onePerContact, setOnePerContact] = useState(true);

  // Edit participant
  const [editP, setEditP] = useState<Participant | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadEvents(); }, []);
  useEffect(() => { if (eventId) loadParticipants(); else setParticipants([]); }, [eventId]);

  async function loadEvents() {
    const { data } = await supabase.from('custom_winner_events').select('*').order('created_at', { ascending: false });
    setEvents((data as Event[]) || []);
    if (data && data.length && !eventId) setEventId(data[0].id);
  }

  async function loadParticipants() {
    setLoading(true);
    const { data } = await supabase.from('custom_event_participants').select('*').eq('event_id', eventId).order('created_at', { ascending: false });
    setParticipants((data as Participant[]) || []);
    setLoading(false);
  }

  async function createEvent() {
    if (!newForm.name.trim()) return toast.error('Name required');
    const { data, error } = await supabase.from('custom_winner_events').insert({
      name: newForm.name.trim(),
      description: newForm.description || null,
      notes: newForm.notes || null,
      winner_count: Math.max(1, newForm.winner_count),
    } as any).select('*').single();
    if (error) return toast.error(error.message);
    toast.success('Event created');
    setNewForm({ name: '', description: '', notes: '', winner_count: 1 });
    setNewOpen(false);
    await loadEvents();
    setEventId((data as any).id);
  }

  async function saveEditEvent() {
    if (!editEvent) return;
    const { error } = await supabase.from('custom_winner_events').update({
      name: editEvent.name, description: editEvent.description, notes: editEvent.notes,
      winner_count: editEvent.winner_count, status: editEvent.status,
    }).eq('id', editEvent.id);
    if (error) return toast.error(error.message);
    toast.success('Saved');
    setEditEvent(null);
    loadEvents();
  }

  async function deleteEvent(id: string) {
    if (!confirm('Delete this event and all participants?')) return;
    const { error } = await supabase.from('custom_winner_events').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    if (eventId === id) setEventId('');
    loadEvents();
  }

  async function addParticipant() {
    if (!eventId || !addForm.name.trim()) return toast.error('Name required');
    const { error } = await supabase.from('custom_event_participants').insert({
      event_id: eventId,
      name: addForm.name.trim(),
      email: addForm.email || null,
      phone: addForm.phone || null,
      facebook: addForm.facebook || null,
      notes: addForm.notes || null,
    } as any);
    if (error) return toast.error(error.message);
    toast.success('Added');
    setAddForm({ name: '', email: '', phone: '', facebook: '', notes: '' });
    setAddOpen(false);
    loadParticipants();
  }

  async function deleteParticipant(id: string) {
    if (!confirm('Remove this participant?')) return;
    const { error } = await supabase.from('custom_event_participants').delete().eq('id', id);
    if (error) return toast.error(error.message);
    loadParticipants();
  }

  async function saveEditP() {
    if (!editP) return;
    const { error } = await supabase.from('custom_event_participants').update({
      name: editP.name, email: editP.email, phone: editP.phone, facebook: editP.facebook,
      notes: editP.notes, prize: editP.prize, winner_rank: editP.winner_rank, is_winner: editP.is_winner,
    }).eq('id', editP.id);
    if (error) return toast.error(error.message);
    toast.success('Updated');
    setEditP(null);
    loadParticipants();
  }

  async function importFile(f: File) {
    if (!eventId) return toast.error('Select or create an event first');
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      if (!rows.length) return toast.error('No rows found');
      // Map columns loosely
      const norm = (s: string) => s.toString().toLowerCase().replace(/[\s_\-]+/g, '');
      const pick = (row: any, keys: string[]) => {
        for (const k of Object.keys(row)) {
          if (keys.includes(norm(k))) return String(row[k] ?? '').trim();
        }
        return '';
      };
      const inserts = rows.map((r) => {
        const name = pick(r, ['name', 'fullname', 'নাম', 'participantname']);
        const email = pick(r, ['email', 'mail', 'ইমেইল']);
        const phone = pick(r, ['phone', 'mobile', 'ফোন', 'mobilenumber', 'contact']);
        const facebook = pick(r, ['facebook', 'fb', 'fbprofile', 'fblink']);
        const notes = pick(r, ['notes', 'note', 'comment', 'remark']);
        // Everything else → extra
        const extra: any = {};
        for (const k of Object.keys(r)) {
          const nk = norm(k);
          if (!['name', 'fullname', 'নাম', 'participantname', 'email', 'mail', 'ইমেইল',
                'phone', 'mobile', 'ফোন', 'mobilenumber', 'contact',
                'facebook', 'fb', 'fbprofile', 'fblink', 'notes', 'note', 'comment', 'remark'].includes(nk)) {
            extra[k] = r[k];
          }
        }
        return { event_id: eventId, name: name || 'Unnamed', email: email || null, phone: phone || null, facebook: facebook || null, notes: notes || null, extra };
      }).filter(r => r.name);
      const { error, count } = await supabase.from('custom_event_participants').insert(inserts as any, { count: 'exact' });
      if (error) throw error;
      toast.success(`Imported ${count ?? inserts.length} participants`);
      loadParticipants();
    } catch (e: any) {
      toast.error(e.message || 'Import failed');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function pickWinners() {
    if (!eventId) return;
    let pool = participants.filter(p => !p.is_winner);
    if (onePerContact) {
      const seen = new Set<string>();
      pool = pool.filter(p => {
        const key = (p.email || p.phone || p.facebook || p.name).toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    if (replaceExisting) {
      await supabase.from('custom_event_participants').update({ is_winner: false, winner_rank: null, prize: null }).eq('event_id', eventId);
      pool = [...participants];
    }
    if (pool.length === 0) return toast.error('No eligible participants');
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const winners = shuffled.slice(0, Math.min(pickCount, shuffled.length));
    const prizes = prizesText.split('\n').map(s => s.trim()).filter(Boolean);
    const existingWinners = participants.filter(p => p.is_winner).length;
    const startRank = replaceExisting ? 1 : existingWinners + 1;
    for (let i = 0; i < winners.length; i++) {
      await supabase.from('custom_event_participants').update({
        is_winner: true, winner_rank: startRank + i, prize: prizes[i] || null,
      }).eq('id', winners[i].id);
    }
    toast.success(`${winners.length} winner(s) picked!`);
    loadParticipants();
  }

  function exportCsv() {
    if (!participants.length) return;
    const headers = ['Name', 'Email', 'Phone', 'Facebook', 'Notes', 'Winner', 'Rank', 'Prize', 'Created'];
    const rows = participants.map(p => [
      p.name, p.email || '', p.phone || '', p.facebook || '', p.notes || '',
      p.is_winner ? 'Yes' : '', p.winner_rank ?? '', p.prize ?? '',
      new Date(p.created_at).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${currentEvent?.name || 'event'}-participants.csv`;
    a.click();
  }

  const currentEvent = events.find(e => e.id === eventId);
  const winners = useMemo(() => participants.filter(p => p.is_winner).sort((a, b) => (a.winner_rank ?? 0) - (b.winner_rank ?? 0)), [participants]);

  return (
    <div className="space-y-5">
      {/* Event selector */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <Label className="text-xs">Select Custom Event</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger><SelectValue placeholder={events.length ? 'Choose an event' : 'No events yet — create one'} /></SelectTrigger>
              <SelectContent>
                {events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />New Event</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create custom winner event</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Event name *</Label><Input value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })} placeholder="e.g. Facebook Post Giveaway - Aug 2025" /></div>
                <div><Label>Description</Label><Textarea rows={2} value={newForm.description} onChange={e => setNewForm({ ...newForm, description: e.target.value })} placeholder="Where the entries came from, rules, etc." /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Winner count</Label><Input type="number" min={1} value={newForm.winner_count} onChange={e => setNewForm({ ...newForm, winner_count: +e.target.value || 1 })} /></div>
                </div>
                <div><Label>Notes (private)</Label><Textarea rows={2} value={newForm.notes} onChange={e => setNewForm({ ...newForm, notes: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={createEvent}>Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
          {currentEvent && (
            <>
              <Button variant="outline" onClick={() => setEditEvent(currentEvent)}><Edit3 className="w-4 h-4 mr-1" />Edit</Button>
              <Button variant="outline" className="text-destructive" onClick={() => deleteEvent(currentEvent.id)}><Trash2 className="w-4 h-4 mr-1" />Delete</Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => { loadEvents(); loadParticipants(); }}><RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
        </CardContent>
      </Card>

      {!eventId ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          Create a custom event to start adding participants and picking winners.
        </CardContent></Card>
      ) : (
        <>
          {/* Import + add */}
          <Card>
            <CardHeader><CardTitle className="text-base">Add participants</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild><Button><UserPlus className="w-4 h-4 mr-1" />Add manually</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add participant</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Name *</Label><Input value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Email</Label><Input value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} /></div>
                      <div><Label>Phone</Label><Input value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} /></div>
                    </div>
                    <div><Label>Facebook link/ID</Label><Input value={addForm.facebook} onChange={e => setAddForm({ ...addForm, facebook: e.target.value })} /></div>
                    <div><Label>Notes</Label><Textarea rows={2} value={addForm.notes} onChange={e => setAddForm({ ...addForm, notes: e.target.value })} /></div>
                  </div>
                  <DialogFooter><Button onClick={addParticipant}>Add</Button></DialogFooter>
                </DialogContent>
              </Dialog>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])}
              />
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-1" />Import Excel / CSV
              </Button>
              <Button variant="outline" onClick={exportCsv} disabled={!participants.length}>
                <Download className="w-4 h-4 mr-1" />Export CSV
              </Button>
              <div className="text-xs text-muted-foreground">
                Excel columns are matched loosely: <b>name, email, phone, facebook, notes</b> (extras kept as data).
              </div>
            </CardContent>
          </Card>

          {/* Pick winners */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4" />Pick winners</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <div>
                <Label className="text-xs">Count</Label>
                <Input type="number" min={1} value={pickCount} onChange={e => setPickCount(+e.target.value || 1)} />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Prizes (one per line, in rank order)</Label>
                <Textarea rows={2} value={prizesText} onChange={e => setPrizesText(e.target.value)} placeholder="1st prize&#10;2nd prize" />
              </div>
              <div className="flex flex-col justify-end gap-2">
                <label className="text-xs flex items-center gap-2"><Checkbox checked={onePerContact} onCheckedChange={v => setOnePerContact(!!v)} />One entry per email/phone/fb</label>
                <label className="text-xs flex items-center gap-2"><Checkbox checked={replaceExisting} onCheckedChange={v => setReplaceExisting(!!v)} />Replace existing winners</label>
              </div>
              <div className="md:col-span-4">
                <Button onClick={pickWinners} disabled={!participants.length}><Trophy className="w-4 h-4 mr-1" />Pick {pickCount} Winner(s)</Button>
              </div>
            </CardContent>
          </Card>

          {/* Winners */}
          {winners.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500" />Winners ({winners.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {winners.map(w => (
                  <div key={w.id} className="flex items-center justify-between gap-3 border rounded-lg p-3 bg-yellow-500/5 border-yellow-500/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white flex items-center justify-center font-bold shrink-0">#{w.winner_rank}</div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{w.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {w.prize || 'No prize set'}
                          {w.email && ` • ${w.email}`}
                          {w.phone && ` • ${w.phone}`}
                        </div>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => setEditP(w)}><Edit3 className="w-4 h-4" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Participants */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Participants ({participants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {participants.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No participants yet — add manually or import a file.</p>}
                {participants.map(p => (
                  <div key={p.id} className={`flex items-center justify-between gap-3 border rounded-lg p-3 ${p.is_winner ? 'bg-yellow-500/5 border-yellow-500/30' : ''}`}>
                    <div className="min-w-0">
                      <div className="font-medium truncate flex items-center gap-2">
                        {p.name}
                        {p.is_winner && <Badge className="bg-yellow-500 text-white">Winner #{p.winner_rank}</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.email || '—'} • {p.phone || '—'} {p.facebook ? `• fb: ${p.facebook}` : ''}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => setEditP(p)}><Edit3 className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteParticipant(p.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit event dialog */}
      <Dialog open={!!editEvent} onOpenChange={o => !o && setEditEvent(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit event</DialogTitle></DialogHeader>
          {editEvent && (
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={editEvent.name} onChange={e => setEditEvent({ ...editEvent, name: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea rows={2} value={editEvent.description || ''} onChange={e => setEditEvent({ ...editEvent, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Winner count</Label><Input type="number" min={1} value={editEvent.winner_count} onChange={e => setEditEvent({ ...editEvent, winner_count: +e.target.value || 1 })} /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={editEvent.status} onValueChange={v => setEditEvent({ ...editEvent, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Notes</Label><Textarea rows={2} value={editEvent.notes || ''} onChange={e => setEditEvent({ ...editEvent, notes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={saveEditEvent}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit participant dialog */}
      <Dialog open={!!editP} onOpenChange={o => !o && setEditP(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit participant</DialogTitle></DialogHeader>
          {editP && (
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={editP.name} onChange={e => setEditP({ ...editP, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email</Label><Input value={editP.email || ''} onChange={e => setEditP({ ...editP, email: e.target.value })} /></div>
                <div><Label>Phone</Label><Input value={editP.phone || ''} onChange={e => setEditP({ ...editP, phone: e.target.value })} /></div>
              </div>
              <div><Label>Facebook</Label><Input value={editP.facebook || ''} onChange={e => setEditP({ ...editP, facebook: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Winner?</Label>
                  <Select value={editP.is_winner ? 'yes' : 'no'} onValueChange={v => setEditP({ ...editP, is_winner: v === 'yes' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Rank</Label><Input type="number" value={editP.winner_rank ?? ''} onChange={e => setEditP({ ...editP, winner_rank: e.target.value ? +e.target.value : null })} /></div>
              </div>
              <div><Label>Prize</Label><Input value={editP.prize || ''} onChange={e => setEditP({ ...editP, prize: e.target.value })} /></div>
              <div><Label>Notes</Label><Textarea rows={2} value={editP.notes || ''} onChange={e => setEditP({ ...editP, notes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={saveEditP}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
