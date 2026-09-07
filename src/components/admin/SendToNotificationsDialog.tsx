import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BellRing, Send, Loader2, Users, ShoppingBag, Mail } from 'lucide-react';
import AiPolishButton from './AiPolishButton';

export type NotificationAudience = 'all' | 'customers' | 'specific';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Prefill title */
  defaultTitle?: string;
  /** Prefill message */
  defaultMessage?: string;
  /** Prefill link (e.g. /offer/slug or /notices/slug) */
  defaultLink?: string;
  /** notification "type" label (e.g. "offer", "notice") */
  type?: string;
  /** Small badge shown at top of the dialog identifying the source */
  sourceLabel?: string;
}

const AUDIENCES: { value: NotificationAudience; label: string; help: string; icon: any }[] = [
  { value: 'all', label: 'All registered users', help: 'সব registered users পাবে (dashboard-এ login করে দেখতে পারবে)', icon: Users },
  { value: 'customers', label: 'Customers only (min 1 order)', help: 'যারা অন্তত ১টা order করেছেন', icon: ShoppingBag },
  { value: 'specific', label: 'Specific emails', help: 'কমা / লাইন দিয়ে email দিন', icon: Mail },
];

/**
 * Sends a notification to users' account notification center (dashboard bell).
 * Bulk-inserts into `notifications` — admins are allowed by RLS.
 * Chunks large audiences into batches so a single insert never exceeds Postgres limits.
 */
export default function SendToNotificationsDialog({
  open,
  onOpenChange,
  defaultTitle = '',
  defaultMessage = '',
  defaultLink = '',
  type = 'announcement',
  sourceLabel,
}: Props) {
  const [audience, setAudience] = useState<NotificationAudience>('all');
  const [emails, setEmails] = useState('');
  const [title, setTitle] = useState(defaultTitle);
  const [message, setMessage] = useState(defaultMessage);
  const [link, setLink] = useState(defaultLink);
  const [sending, setSending] = useState(false);
  const [counts, setCounts] = useState<{ all: number | null; customers: number | null }>({ all: null, customers: null });

  // Reset when opened with new defaults
  useEffect(() => {
    if (open) {
      setTitle(defaultTitle);
      setMessage(defaultMessage);
      setLink(defaultLink);
      setAudience('all');
      setEmails('');
    }
  }, [open, defaultTitle, defaultMessage, defaultLink]);

  // Load audience counts on open
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const [{ count: allCount }, { data: custRows }] = await Promise.all([
        supabase.from('profiles').select('user_id', { count: 'exact', head: true }),
        supabase.from('orders').select('user_id').not('user_id', 'is', null).limit(10000),
      ]);
      if (cancelled) return;
      const customersSet = new Set((custRows || []).map((r: any) => r.user_id).filter(Boolean));
      setCounts({ all: allCount ?? 0, customers: customersSet.size });
    })();
    return () => { cancelled = true; };
  }, [open]);

  const parsedEmails = useMemo(
    () =>
      emails
        .split(/[\s,;]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.includes('@')),
    [emails]
  );

  const resolveUserIds = async (): Promise<string[]> => {
    if (audience === 'all') {
      // Page through profiles
      const ids: string[] = [];
      const pageSize = 1000;
      let from = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id')
          .range(from, from + pageSize - 1);
        if (error) throw error;
        const chunk = (data || []).map((r: any) => r.user_id).filter(Boolean);
        ids.push(...chunk);
        if (!data || data.length < pageSize) break;
        from += pageSize;
      }
      return Array.from(new Set(ids));
    }
    if (audience === 'customers') {
      const { data, error } = await supabase
        .from('orders')
        .select('user_id')
        .not('user_id', 'is', null)
        .limit(50000);
      if (error) throw error;
      return Array.from(new Set((data || []).map((r: any) => r.user_id).filter(Boolean)));
    }
    // specific emails
    if (parsedEmails.length === 0) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, email')
      .in('email', parsedEmails);
    if (error) throw error;
    return Array.from(new Set((data || []).map((r: any) => r.user_id).filter(Boolean)));
  };

  const send = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Title এবং Message দুটোই লাগবে');
      return;
    }
    if (audience === 'specific' && parsedEmails.length === 0) {
      toast.error('অন্তত একটা valid email দিন');
      return;
    }
    setSending(true);
    try {
      const userIds = await resolveUserIds();
      if (userIds.length === 0) {
        toast.error('কোনো recipient পাওয়া যায়নি');
        setSending(false);
        return;
      }
      const rows = userIds.map((uid) => ({
        user_id: uid,
        title: title.trim(),
        message: message.trim(),
        type,
        link: link.trim() || null,
      }));
      // Insert in chunks of 500
      const chunkSize = 500;
      let inserted = 0;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const slice = rows.slice(i, i + chunkSize);
        const { error } = await supabase.from('notifications').insert(slice);
        if (error) throw error;
        inserted += slice.length;
      }
      toast.success(`✅ ${inserted} জন user-কে notification পাঠানো হয়েছে`);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || 'Send failed');
    } finally {
      setSending(false);
    }
  };

  const audienceCount =
    audience === 'all' ? counts.all :
    audience === 'customers' ? counts.customers :
    parsedEmails.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-cyan-600" />
            Send to Account Notifications
          </DialogTitle>
          <DialogDescription>
            Users এদের dashboard-এর 🔔 notification list-এ এই message দেখতে পাবে।
            {sourceLabel && (
              <Badge variant="outline" className="ml-2 border-cyan-300 text-cyan-700">{sourceLabel}</Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Audience</Label>
            <RadioGroup value={audience} onValueChange={(v) => setAudience(v as NotificationAudience)} className="space-y-1.5">
              {AUDIENCES.map((a) => {
                const Icon = a.icon;
                const activeCount =
                  a.value === 'all' ? counts.all :
                  a.value === 'customers' ? counts.customers :
                  parsedEmails.length;
                return (
                  <label
                    key={a.value}
                    htmlFor={`aud-${a.value}`}
                    className={`flex items-start gap-3 rounded-lg border p-2.5 cursor-pointer transition ${
                      audience === a.value ? 'border-cyan-500 bg-cyan-500/5' : 'border-border hover:bg-muted/40'
                    }`}
                  >
                    <RadioGroupItem id={`aud-${a.value}`} value={a.value} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 font-medium text-sm">
                        <Icon className="w-4 h-4 text-cyan-600" />
                        {a.label}
                        {typeof activeCount === 'number' && (
                          <Badge variant="secondary" className="text-[10px]">{activeCount}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{a.help}</div>
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          {audience === 'specific' && (
            <div>
              <Label className="text-xs">Emails (comma / newline separated)</Label>
              <Textarea
                rows={3}
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="user1@example.com, user2@example.com"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <Label className="text-xs">Title</Label>
              <AiPolishButton value={title} onChange={setTitle} kind="offer_title" maxChars={120} size="icon" />
            </div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="🎁 নতুন অফার..." maxLength={140} />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <Label className="text-xs">Message</Label>
              <AiPolishButton value={message} onChange={setMessage} kind="notice" maxChars={500} size="icon" />
            </div>
            <Textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="সংক্ষেপে message লিখুন..."
              maxLength={800}
            />
          </div>

          <div>
            <Label className="text-xs">Link (optional)</Label>
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/offer/summer-giveaway বা /notices/holiday" />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancel</Button>
          <Button onClick={send} disabled={sending}>
            {sending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
            Send{typeof audienceCount === 'number' && audienceCount > 0 ? ` to ${audienceCount}` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
