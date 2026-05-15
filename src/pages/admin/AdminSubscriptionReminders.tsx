import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Mail, RefreshCw, Save, Send, CalendarClock, Search, Loader2, Filter, Sparkles, Wand2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

type SourceKind = 'order_item' | 'personal_license';

interface SubRow {
  source: SourceKind;
  id: string;
  product_id: string | null;
  product_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  expires_at: string | null;
  last_reminder_sent_at: string | null;
  order_id?: string | null;
  order_number?: string | null;
}

interface ProductOpt { id: string; name: string }

const SITE = 'https://shahedstore.com.bd';
const PAGE_SIZE = 50;

function daysBetween(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return null;
  return Math.ceil((d - Date.now()) / (24 * 60 * 60 * 1000));
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusOf(iso: string | null) {
  const d = daysBetween(iso);
  if (d === null) return { label: 'No date', variant: 'secondary' as const, days: null };
  if (d < 0) return { label: `Expired ${Math.abs(d)}d ago`, variant: 'destructive' as const, days: d };
  if (d === 0) return { label: 'Expires today', variant: 'destructive' as const, days: d };
  if (d <= 7) return { label: `${d}d left`, variant: 'destructive' as const, days: d };
  if (d <= 30) return { label: `${d}d left`, variant: 'default' as const, days: d };
  return { label: `${d}d left`, variant: 'secondary' as const, days: d };
}

export default function AdminSubscriptionReminders() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<SubRow[]>([]);
  const [products, setProducts] = useState<ProductOpt[]>([]);
  const [productFilter, setProductFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'expired' | 'expiring_7' | 'expiring_30' | 'no_date'>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<SubRow | null>(null);
  const [editDate, setEditDate] = useState('');
  const [saving, setSaving] = useState(false);

  // Send dialog
  const [sendOpen, setSendOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState('');
  const [renewUrl, setRenewUrl] = useState(SITE + '/shop');
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ done: 0, total: 0, failed: 0 });

  // Manual / AI composer
  const [mProductId, setMProductId] = useState<string>('');
  const [mProductName, setMProductName] = useState('');
  const [mProductOpen, setMProductOpen] = useState(false);
  const [mCustomerName, setMCustomerName] = useState('');
  const [mCustomerEmail, setMCustomerEmail] = useState('');
  const [mExpiry, setMExpiry] = useState('');
  const [mLanguage, setMLanguage] = useState<'en' | 'bn'>('bn');
  const [mTone, setMTone] = useState('professional, warm, concise');
  const [mNotes, setMNotes] = useState('');
  const [mMessage, setMMessage] = useState('');
  const [mGenerating, setMGenerating] = useState(false);
  const [mSending, setMSending] = useState(false);
  const [mAutoSend, setMAutoSend] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: prods }, { data: oi, error: oiErr }, { data: pl, error: plErr }] = await Promise.all([
        supabase.from('products').select('id, name').order('name'),
        supabase
          .from('order_items')
          .select('id, product_id, product_name, expires_at, last_reminder_sent_at, order_id, orders!inner(id, order_number, customer_name, customer_email, customer_phone)')
          .order('expires_at', { ascending: true, nullsFirst: false })
          .limit(2000),
        supabase
          .from('personal_licenses')
          .select('id, name, customer_name, customer_email, customer_phone, expires_at, last_reminder_sent_at')
          .order('expires_at', { ascending: true, nullsFirst: false })
          .limit(2000),
      ]);
      if (oiErr) throw oiErr;
      if (plErr) throw plErr;
      setProducts((prods || []) as ProductOpt[]);

      const oiRows: SubRow[] = ((oi as any[]) || []).map(r => ({
        source: 'order_item' as const,
        id: r.id,
        product_id: r.product_id,
        product_name: r.product_name,
        customer_name: r.orders?.customer_name || '—',
        customer_email: r.orders?.customer_email || '',
        customer_phone: r.orders?.customer_phone || null,
        expires_at: r.expires_at,
        last_reminder_sent_at: r.last_reminder_sent_at,
        order_id: r.orders?.id,
        order_number: r.orders?.order_number,
      })).filter(r => r.customer_email);

      const plRows: SubRow[] = ((pl as any[]) || []).map(r => ({
        source: 'personal_license' as const,
        id: r.id,
        product_id: null,
        product_name: r.name,
        customer_name: r.customer_name || '—',
        customer_email: r.customer_email || '',
        customer_phone: r.customer_phone,
        expires_at: r.expires_at,
        last_reminder_sent_at: r.last_reminder_sent_at,
      })).filter(r => r.customer_email);

      setRows([...oiRows, ...plRows]);
    } catch (e: any) {
      toast.error('Failed to load: ' + (e?.message || 'unknown'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (productFilter !== 'all') {
        if (r.source === 'order_item' && r.product_id !== productFilter) return false;
        if (r.source === 'personal_license') return false;
      }
      const d = daysBetween(r.expires_at);
      if (statusFilter === 'expired' && !(d !== null && d < 0)) return false;
      if (statusFilter === 'expiring_7' && !(d !== null && d >= 0 && d <= 7)) return false;
      if (statusFilter === 'expiring_30' && !(d !== null && d >= 0 && d <= 30)) return false;
      if (statusFilter === 'no_date' && d !== null) return false;
      if (q) {
        const hay = `${r.customer_name} ${r.customer_email} ${r.customer_phone || ''} ${r.product_name} ${r.order_number || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, productFilter, statusFilter, search]);

  const visible = filtered.slice(0, PAGE_SIZE);
  const allChecked = visible.length > 0 && visible.every(r => selected[`${r.source}:${r.id}`]);

  const toggleAll = (v: boolean) => {
    const next = { ...selected };
    visible.forEach(r => { next[`${r.source}:${r.id}`] = v; });
    setSelected(next);
  };

  const selectedRows = useMemo(
    () => filtered.filter(r => selected[`${r.source}:${r.id}`]),
    [filtered, selected],
  );

  const stats = useMemo(() => {
    const out = { expired: 0, in7: 0, in30: 0, total: rows.length };
    rows.forEach(r => {
      const d = daysBetween(r.expires_at);
      if (d === null) return;
      if (d < 0) out.expired++;
      else if (d <= 7) out.in7++;
      else if (d <= 30) out.in30++;
    });
    return out;
  }, [rows]);

  const saveExpiry = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const value = editDate ? new Date(editDate).toISOString() : null;
      const table = editing.source === 'order_item' ? 'order_items' : 'personal_licenses';
      const { error } = await supabase.from(table).update({ expires_at: value }).eq('id', editing.id);
      if (error) throw error;
      toast.success('Expiry date updated');
      setEditing(null);
      setEditDate('');
      await load();
    } catch (e: any) {
      toast.error('Save failed: ' + (e?.message || 'unknown'));
    } finally {
      setSaving(false);
    }
  };

  const openSend = () => {
    if (selectedRows.length === 0) {
      toast.error('Select at least one customer');
      return;
    }
    setSendOpen(true);
  };

  const sendAll = async () => {
    setSending(true);
    setSendProgress({ done: 0, total: selectedRows.length, failed: 0 });
    let done = 0, failed = 0;
    // Group per product+customer for clean idempotency keys
    for (const r of selectedRows) {
      try {
        const days = daysBetween(r.expires_at);
        const today = new Date().toISOString().slice(0, 10);
        const idem = `subrenew-${r.source}-${r.id}-${today}`;
        const { error } = await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'subscription-renewal-reminder',
            recipientEmail: r.customer_email,
            idempotencyKey: idem,
            templateData: {
              customerName: r.customer_name,
              productName: r.product_name,
              expiryDate: r.expires_at ? fmtDate(r.expires_at) : '',
              daysLeft: days,
              renewUrl: renewUrl || (SITE + '/shop'),
              customMessage: customMsg || undefined,
              orderNumber: r.order_number || undefined,
            },
          },
        });
        if (error) throw error;
        // mark reminder sent
        const table = r.source === 'order_item' ? 'order_items' : 'personal_licenses';
        await supabase.from(table).update({ last_reminder_sent_at: new Date().toISOString() }).eq('id', r.id);
        done++;
      } catch {
        failed++;
      }
      setSendProgress({ done: done + failed, total: selectedRows.length, failed });
      // small spacing for rate-limit politeness
      await new Promise(res => setTimeout(res, 120));
    }
    setSending(false);
    toast.success(`Sent ${done} email${done === 1 ? '' : 's'}${failed ? `, ${failed} failed` : ''}`);
    setSendOpen(false);
    setSelected({});
    setCustomMsg('');
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-primary" />
            Subscription Renewal Reminders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track expiring subscriptions and send branded reminder emails to customers — individually or in bulk.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total tracked</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Expired</div>
          <div className="text-2xl font-bold text-destructive">{stats.expired}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Next 7 days</div>
          <div className="text-2xl font-bold">{stats.in7}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Next 30 days</div>
          <div className="text-2xl font-bold">{stats.in30}</div>
        </Card>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by customer, email, phone, product, order #"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Product" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All products</SelectItem>
              {products.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="expiring_7">Expiring ≤ 7 days</SelectItem>
              <SelectItem value="expiring_30">Expiring ≤ 30 days</SelectItem>
              <SelectItem value="no_date">No expiry set</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openSend} disabled={selectedRows.length === 0}>
            <Send className="h-4 w-4 mr-2" />
            Send Reminder ({selectedRows.length})
          </Button>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={allChecked} onCheckedChange={(v) => toggleAll(!!v)} />
                </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last reminder</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading…
                </TableCell></TableRow>
              ) : visible.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No matching subscriptions.
                </TableCell></TableRow>
              ) : visible.map(r => {
                const key = `${r.source}:${r.id}`;
                const s = statusOf(r.expires_at);
                return (
                  <TableRow key={key}>
                    <TableCell>
                      <Checkbox
                        checked={!!selected[key]}
                        onCheckedChange={(v) => setSelected({ ...selected, [key]: !!v })}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r.customer_name}</div>
                      <div className="text-xs text-muted-foreground break-all">{r.customer_email}</div>
                      {r.customer_phone && <div className="text-xs text-muted-foreground">{r.customer_phone}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{r.product_name}</div>
                      {r.order_number && <div className="text-xs text-muted-foreground">#{r.order_number}</div>}
                      {r.source === 'personal_license' && (
                        <Badge variant="outline" className="text-[10px] mt-1">personal</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{fmtDate(r.expires_at)}</TableCell>
                    <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.last_reminder_sent_at ? fmtDate(r.last_reminder_sent_at) : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditing(r);
                        setEditDate(r.expires_at ? r.expires_at.slice(0, 10) : '');
                      }}>
                        Edit date
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {filtered.length > PAGE_SIZE && (
          <p className="text-xs text-muted-foreground">
            Showing first {PAGE_SIZE} of {filtered.length}. Refine filters to narrow down.
          </p>
        )}
      </Card>

      {/* Edit expiry date */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set expiry date</DialogTitle>
            <DialogDescription>
              {editing?.product_name} — {editing?.customer_email}
            </DialogDescription>
          </DialogHeader>
          <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveExpiry} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send confirmation */}
      <Dialog open={sendOpen} onOpenChange={(o) => !sending && setSendOpen(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" /> Send renewal reminder
            </DialogTitle>
            <DialogDescription>
              Sending to <strong>{selectedRows.length}</strong> customer{selectedRows.length === 1 ? '' : 's'}.
              Each email is product-aware with the customer's own expiry date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium">Renew URL</label>
              <Input value={renewUrl} onChange={e => setRenewUrl(e.target.value)} placeholder={SITE + '/shop'} />
            </div>
            <div>
              <label className="text-xs font-medium">Custom message (optional)</label>
              <Textarea
                rows={4}
                value={customMsg}
                onChange={e => setCustomMsg(e.target.value)}
                placeholder="Add a personal note. Leave blank to use the default reminder text."
              />
            </div>
            {sending && (
              <div className="text-sm">
                Sending… {sendProgress.done}/{sendProgress.total}
                {sendProgress.failed > 0 && <span className="text-destructive"> ({sendProgress.failed} failed)</span>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)} disabled={sending}>Cancel</Button>
            <Button onClick={sendAll} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send {selectedRows.length} email{selectedRows.length === 1 ? '' : 's'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
