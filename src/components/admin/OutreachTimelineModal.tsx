import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send, Reply, Phone, StickyNote, Clock, Edit3, Trash2, Plus, X, Mail } from 'lucide-react';

export interface OutreachLog {
  id: string;
  prospect_id: string;
  event_type: string;
  channel: string | null;
  subject: string | null;
  message: string | null;
  occurred_at: string;
  created_at: string;
}

const EVENT_TYPES = [
  { value: 'sent',      label: 'Email Sent',  icon: Send,       color: 'hsl(220 90% 60%)' },
  { value: 'replied',   label: 'Reply Received', icon: Reply,   color: 'hsl(150 70% 45%)' },
  { value: 'follow_up', label: 'Follow-up',   icon: Clock,      color: 'hsl(40 95% 55%)' },
  { value: 'call',      label: 'Call/Meeting',icon: Phone,      color: 'hsl(280 80% 65%)' },
  { value: 'note',      label: 'Note',        icon: StickyNote, color: 'hsl(220 15% 60%)' },
];

const CHANNELS = ['email', 'facebook', 'whatsapp', 'linkedin', 'phone', 'in_person', 'other'];

const fmt = (iso: string) => new Date(iso).toLocaleString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

interface Props {
  prospectId: string;
  prospectName: string;
  onClose: () => void;
  onLogChanged?: () => void;
}

const empty: Partial<OutreachLog> = { event_type: 'sent', channel: 'email', subject: '', message: '' };

const OutreachTimelineModal = ({ prospectId, prospectName, onClose, onLogChanged }: Props) => {
  const [logs, setLogs] = useState<OutreachLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<OutreachLog> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('outreach_logs')
      .select('*')
      .eq('prospect_id', prospectId)
      .order('occurred_at', { ascending: false });
    if (error) toast.error(error.message);
    setLogs((data as OutreachLog[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [prospectId]);

  const save = async () => {
    if (!editing?.event_type) return;
    if (!editing.message?.trim() && !editing.subject?.trim()) {
      toast.error('Add a subject or message');
      return;
    }
    setSaving(true);
    const payload: any = {
      prospect_id: prospectId,
      event_type: editing.event_type,
      channel: editing.channel || null,
      subject: editing.subject || null,
      message: editing.message || null,
      occurred_at: editing.occurred_at || new Date().toISOString(),
    };
    if (editing.id) {
      const { error } = await supabase.from('outreach_logs').update(payload).eq('id', editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Log updated');
    } else {
      const { error } = await supabase.from('outreach_logs').insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      // Sync prospect.last_contacted_at on sent/follow_up
      if (editing.event_type === 'sent' || editing.event_type === 'follow_up') {
        await supabase.from('outreach_prospects')
          .update({ last_contacted_at: payload.occurred_at, status: 'contacted' })
          .eq('id', prospectId);
      } else if (editing.event_type === 'replied') {
        await supabase.from('outreach_prospects')
          .update({ status: 'replied' })
          .eq('id', prospectId);
      }
      toast.success('Log added');
    }
    setEditing(null);
    setSaving(false);
    load();
    onLogChanged?.();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this log entry?')) return;
    const { error } = await supabase.from('outreach_logs').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    load();
    onLogChanged?.();
  };

  const localInput = (iso?: string) => {
    const d = iso ? new Date(iso) : new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-card rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
              <Mail size={18} className="text-primary" /> Outreach Timeline
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{prospectName} · {logs.length} {logs.length === 1 ? 'entry' : 'entries'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing({ ...empty, occurred_at: new Date().toISOString() })}
              className="btn-glow inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            >
              <Plus size={12} /> Add Entry
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Editor */}
        {editing && (
          <div className="bg-muted/20 border border-border rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs">
                <span className="text-muted-foreground">Event</span>
                <select value={editing.event_type || 'sent'} onChange={e => setEditing({ ...editing, event_type: e.target.value })}
                  className="w-full mt-1 bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary">
                  {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>
              <label className="text-xs">
                <span className="text-muted-foreground">Channel</span>
                <select value={editing.channel || 'email'} onChange={e => setEditing({ ...editing, channel: e.target.value })}
                  className="w-full mt-1 bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary capitalize">
                  {CHANNELS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
              </label>
              <label className="text-xs">
                <span className="text-muted-foreground">When</span>
                <input
                  type="datetime-local"
                  value={localInput(editing.occurred_at)}
                  onChange={e => setEditing({ ...editing, occurred_at: new Date(e.target.value).toISOString() })}
                  className="w-full mt-1 bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </label>
            </div>
            <label className="text-xs block">
              <span className="text-muted-foreground">Subject (optional)</span>
              <input value={editing.subject || ''} onChange={e => setEditing({ ...editing, subject: e.target.value })}
                placeholder="Email subject or short summary"
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </label>
            <label className="text-xs block">
              <span className="text-muted-foreground">Message / Notes</span>
              <textarea value={editing.message || ''} onChange={e => setEditing({ ...editing, message: e.target.value })}
                rows={4} placeholder="What did you say or hear back?"
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-3 py-1.5 rounded-lg text-xs bg-muted/40 hover:bg-muted/60 text-foreground">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-glow px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50">
                {saving ? 'Saving…' : (editing.id ? 'Update' : 'Add Entry')}
              </button>
            </div>
          </div>
        )}

        {/* Timeline */}
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No activity yet. Click <span className="text-foreground font-medium">Add Entry</span> to log your first outreach.
          </div>
        ) : (
          <div className="relative pl-6">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
            <div className="space-y-3">
              {logs.map(log => {
                const t = EVENT_TYPES.find(x => x.value === log.event_type) || EVENT_TYPES[4];
                const Icon = t.icon;
                return (
                  <div key={log.id} className="relative">
                    <div
                      className="absolute -left-[18px] top-2 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center"
                      style={{ background: t.color }}
                    >
                      <Icon size={8} className="text-white" />
                    </div>
                    <div className="bg-muted/15 hover:bg-muted/25 transition border border-border rounded-xl p-3 group">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                            style={{ background: `${t.color}22`, color: t.color, border: `1px solid ${t.color}55` }}
                          >
                            {t.label}
                          </span>
                          {log.channel && (
                            <span className="text-[10px] uppercase text-muted-foreground/70">via {log.channel}</span>
                          )}
                          <span className="text-[11px] text-muted-foreground">{fmt(log.occurred_at)}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => setEditing(log)} title="Edit"
                            className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-primary">
                            <Edit3 size={12} />
                          </button>
                          <button onClick={() => remove(log.id)} title="Delete"
                            className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-red-500">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      {log.subject && <div className="text-sm font-medium text-foreground mb-0.5">{log.subject}</div>}
                      {log.message && <div className="text-xs text-muted-foreground whitespace-pre-wrap">{log.message}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutreachTimelineModal;
