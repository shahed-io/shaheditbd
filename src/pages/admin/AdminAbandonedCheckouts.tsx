import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ShoppingCart, Search, RefreshCw, Trash2, Eye, X, Mail, Phone, User as UserIcon,
  CheckCircle2, Clock, MessageCircle, Copy, Check, Calendar, Package, FileText,
} from 'lucide-react';

interface AbandonedRow {
  id: string;
  session_token: string;
  user_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  cart_items: any[];
  item_count: number;
  subtotal: number;
  discount_amount: number;
  total: number;
  coupon_code: string | null;
  payment_method: string | null;
  notes: string | null;
  page_url: string | null;
  user_agent: string | null;
  converted: boolean;
  converted_order_id: string | null;
  converted_at: string | null;
  contacted: boolean;
  contacted_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

type StatusFilter = 'all' | 'pending' | 'converted' | 'contacted';

const fmtBDT = (n: number) => `৳${Number(n || 0).toLocaleString('en-US')}`;
const fmtDate = (d: string) => new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
const inputCls = 'w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors';

export default function AdminAbandonedCheckouts() {
  const [rows, setRows] = useState<AbandonedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [selected, setSelected] = useState<AbandonedRow | null>(null);
  const [copiedId, setCopiedId] = useState<string>('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('abandoned_checkouts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) {
      toast.error('Failed to load: ' + error.message);
    } else {
      setRows((data || []) as any);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    return rows.filter(r => {
      if (statusFilter === 'pending' && (r.converted || r.item_count === 0)) return false;
      if (statusFilter === 'converted' && !r.converted) return false;
      if (statusFilter === 'contacted' && !r.contacted) return false;
      if (!q) return true;
      return (
        (r.customer_name || '').toLowerCase().includes(q) ||
        (r.customer_email || '').toLowerCase().includes(q) ||
        (r.customer_phone || '').toLowerCase().includes(q) ||
        (r.coupon_code || '').toLowerCase().includes(q) ||
        (r.cart_items || []).some((ci: any) => String(ci?.name || '').toLowerCase().includes(q))
      );
    });
  }, [rows, search, statusFilter]);

  const stats = useMemo(() => {
    const pending = rows.filter(r => !r.converted && r.item_count > 0);
    const converted = rows.filter(r => r.converted);
    const lostValue = pending.reduce((s, r) => s + Number(r.total || 0), 0);
    return {
      total: rows.length,
      pending: pending.length,
      converted: converted.length,
      contacted: rows.filter(r => r.contacted).length,
      lostValue,
    };
  }, [rows]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this abandoned checkout?')) return;
    const { error } = await supabase.from('abandoned_checkouts').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    setRows(prev => prev.filter(r => r.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const markContacted = async (id: string, contacted: boolean) => {
    const { error } = await supabase
      .from('abandoned_checkouts')
      .update({ contacted, contacted_at: contacted ? new Date().toISOString() : null })
      .eq('id', id);
    if (error) return toast.error(error.message);
    setRows(prev => prev.map(r => r.id === id ? { ...r, contacted, contacted_at: contacted ? new Date().toISOString() : null } : r));
    if (selected?.id === id) setSelected(s => s ? { ...s, contacted, contacted_at: contacted ? new Date().toISOString() : null } : s);
    toast.success(contacted ? 'Marked as contacted' : 'Unmarked');
  };

  const saveAdminNotes = async (id: string, notes: string) => {
    const { error } = await supabase.from('abandoned_checkouts').update({ admin_notes: notes }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Notes saved');
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 1200);
  };

  const waLink = (phone: string, name: string | null) => {
    const msg = encodeURIComponent(`Hi ${name || ''}, this is from Shahed Store. We noticed you started a purchase on our website but didn't finish. Can we help complete your order?`);
    const cleanPhone = phone.replace(/\D/g, '').replace(/^0/, '880');
    return `https://wa.me/${cleanPhone}?text=${msg}`;
  };

  // ── UI ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-background to-background border border-border/50 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
            <ShoppingCart className="text-white" size={26} />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Abandoned Checkouts</h1>
            <p className="text-sm text-muted-foreground">Customers who filled checkout but didn't complete payment</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} icon={FileText} color="from-slate-500 to-slate-600"
          active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
        <StatCard label="Pending Recovery" value={stats.pending} icon={Clock} color="from-amber-500 to-orange-500"
          active={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')} />
        <StatCard label="Recovered" value={stats.converted} icon={CheckCircle2} color="from-emerald-500 to-green-600"
          active={statusFilter === 'converted'} onClick={() => setStatusFilter('converted')} />
        <StatCard label="Lost Value" value={fmtBDT(stats.lostValue)} icon={Package} color="from-rose-500 to-red-600" isText
          active={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')} />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, coupon or product..."
            className={inputCls + ' pl-11'}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {(['pending', 'all', 'converted', 'contacted'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {s === 'pending' && `Pending (${stats.pending})`}
              {s === 'all' && `All (${stats.total})`}
              {s === 'converted' && `Recovered (${stats.converted})`}
              {s === 'contacted' && `Contacted (${stats.contacted})`}
            </button>
          ))}
          <button
            onClick={load}
            className="px-4 py-2 rounded-xl bg-muted/40 hover:bg-muted/70 text-sm flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {search && (
        <div className="flex">
          <button
            onClick={() => setSearch('')}
            className="ml-auto px-3 py-1.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20"
          >
            Clear search · {filtered.length} shown
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart size={40} className="mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No abandoned checkouts found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Customer</th>
                  <th className="text-left px-4 py-3">Contact</th>
                  <th className="text-left px-4 py-3">Items</th>
                  <th className="text-left px-4 py-3">Total</th>
                  <th className="text-left px-4 py-3">When</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-t border-border/30 hover:bg-muted/20 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{r.customer_name || <span className="text-muted-foreground italic">Unknown</span>}</div>
                      {r.user_id && <div className="text-xs text-emerald-500 mt-0.5">Logged in</div>}
                    </td>
                    <td className="px-4 py-3 space-y-1">
                      {r.customer_email && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Mail size={12} className="text-muted-foreground" />
                          <span className="break-all">{r.customer_email}</span>
                        </div>
                      )}
                      {r.customer_phone && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Phone size={12} className="text-muted-foreground" />
                          <span>{r.customer_phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{r.item_count}</td>
                    <td className="px-4 py-3 font-semibold text-primary">{fmtBDT(r.total)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(r.created_at)}</td>
                    <td className="px-4 py-3">
                      {r.converted ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">Recovered</span>
                      ) : r.contacted ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/15 text-blue-500 border border-blue-500/30">Contacted</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/15 text-amber-500 border border-amber-500/30">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setSelected(r)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" title="View">
                          <Eye size={15} />
                        </button>
                        {r.customer_phone && (
                          <a
                            href={waLink(r.customer_phone, r.customer_name)}
                            target="_blank" rel="noreferrer"
                            className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-500"
                            title="WhatsApp"
                          >
                            <MessageCircle size={15} />
                          </a>
                        )}
                        <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <DetailDrawer
          row={selected}
          onClose={() => setSelected(null)}
          onContacted={(b) => markContacted(selected.id, b)}
          onSaveNotes={(n) => saveAdminNotes(selected.id, n)}
          onCopy={copy}
          copiedId={copiedId}
          onDelete={() => handleDelete(selected.id)}
          waLink={waLink}
        />
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, isText, active, onClick }: { label: string; value: any; icon: any; color: string; isText?: boolean; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-2xl bg-card/50 backdrop-blur-xl border p-4 flex items-center justify-between transition hover:scale-[1.02] hover:shadow-md ${active ? 'border-primary ring-2 ring-primary/40' : 'border-border/50'}`}
    >
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`mt-1 font-bold ${isText ? 'text-lg' : 'text-2xl'} text-foreground`}>{value}</div>
      </div>
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
        <Icon className="text-white" size={18} />
      </div>
    </button>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────
function DetailDrawer({
  row, onClose, onContacted, onSaveNotes, onCopy, copiedId, onDelete, waLink,
}: {
  row: AbandonedRow;
  onClose: () => void;
  onContacted: (b: boolean) => void;
  onSaveNotes: (notes: string) => void;
  onCopy: (text: string, id: string) => void;
  copiedId: string;
  onDelete: () => void;
  waLink: (p: string, n: string | null) => string;
}) {
  const [notes, setNotes] = useState(row.admin_notes || '');
  useEffect(() => { setNotes(row.admin_notes || ''); }, [row.id]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-2xl h-full bg-background border-l border-border overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold">Checkout Details</h2>
            <p className="text-xs text-muted-foreground">{fmtDate(row.created_at)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status */}
          <div className="flex flex-wrap gap-2">
            {row.converted ? (
              <span className="px-3 py-1 rounded-full text-xs bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">✅ Recovered (order placed)</span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs bg-amber-500/15 text-amber-500 border border-amber-500/30">⏳ Pending recovery</span>
            )}
            {row.contacted && <span className="px-3 py-1 rounded-full text-xs bg-blue-500/15 text-blue-500 border border-blue-500/30">📞 Contacted</span>}
            {row.user_id && <span className="px-3 py-1 rounded-full text-xs bg-purple-500/15 text-purple-500 border border-purple-500/30">👤 Logged-in user</span>}
          </div>

          {/* Customer */}
          <Section title="Customer">
            <Field icon={UserIcon} label="Name" value={row.customer_name} />
            <Field
              icon={Mail} label="Email" value={row.customer_email}
              onCopy={() => row.customer_email && onCopy(row.customer_email, 'email')}
              copied={copiedId === 'email'}
            />
            <Field
              icon={Phone} label="Phone" value={row.customer_phone}
              onCopy={() => row.customer_phone && onCopy(row.customer_phone, 'phone')}
              copied={copiedId === 'phone'}
            />
          </Section>

          {/* Cart */}
          <Section title={`Cart (${row.item_count} items)`}>
            <div className="space-y-2">
              {(row.cart_items || []).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between bg-muted/30 rounded-xl px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{item.name}{item.variant ? ` (${item.variant})` : ''}</div>
                    <div className="text-xs text-muted-foreground">Qty {item.quantity} × {fmtBDT(item.price)}</div>
                  </div>
                  <div className="text-sm font-semibold text-primary whitespace-nowrap">{fmtBDT(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-border/50 pt-3 mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmtBDT(row.subtotal)}</span></div>
              {row.discount_amount > 0 && <div className="flex justify-between text-emerald-500"><span>Discount {row.coupon_code && `(${row.coupon_code})`}</span><span>-{fmtBDT(row.discount_amount)}</span></div>}
              <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-primary">{fmtBDT(row.total)}</span></div>
            </div>
          </Section>

          {/* Meta */}
          <Section title="More info">
            <Field icon={Package} label="Payment Method" value={row.payment_method?.toUpperCase() || '—'} />
            <Field icon={Calendar} label="Last Updated" value={fmtDate(row.updated_at)} />
            {row.notes && <Field icon={FileText} label="Customer Note" value={row.notes} multiline />}
            {row.page_url && <Field icon={FileText} label="Page" value={row.page_url} multiline small />}
            {row.user_agent && <Field icon={FileText} label="Device" value={row.user_agent} multiline small />}
          </Section>

          {/* Admin notes */}
          <Section title="Internal Notes">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className={inputCls}
              placeholder="Add internal notes..."
            />
            <button
              onClick={() => onSaveNotes(notes)}
              className="px-4 py-2 mt-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              Save Notes
            </button>
          </Section>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            {row.customer_phone && (
              <a
                href={waLink(row.customer_phone, row.customer_name)}
                target="_blank" rel="noreferrer"
                className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-emerald-600"
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
            )}
            {row.customer_email && (
              <a
                href={`mailto:${row.customer_email}?subject=${encodeURIComponent('Complete your order at Shahed Store')}`}
                className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-600"
              >
                <Mail size={16} /> Email
              </a>
            )}
            <button
              onClick={() => onContacted(!row.contacted)}
              className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted/70"
            >
              <CheckCircle2 size={16} /> {row.contacted ? 'Unmark Contacted' : 'Mark Contacted'}
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 text-red-500 text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-500/20"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card/50 border border-border/50 p-4">
      <div className="text-xs font-semibold uppercase text-muted-foreground mb-3">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({
  icon: Icon, label, value, onCopy, copied, multiline, small,
}: {
  icon: any; label: string; value: any; onCopy?: () => void; copied?: boolean; multiline?: boolean; small?: boolean;
}) {
  if (!value) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Icon size={14} className="text-muted-foreground" />
        <span className="text-muted-foreground">{label}:</span>
        <span className="text-muted-foreground italic">—</span>
      </div>
    );
  }
  return (
    <div className={`flex ${multiline ? 'flex-col gap-1' : 'items-center justify-between gap-2'} text-sm`}>
      <div className="flex items-center gap-2 min-w-0">
        <Icon size={14} className="text-muted-foreground shrink-0" />
        <span className="text-muted-foreground">{label}:</span>
        <span className={`font-medium text-foreground ${multiline ? 'break-all' : 'truncate'} ${small ? 'text-xs' : ''}`}>{value}</span>
      </div>
      {onCopy && (
        <button onClick={onCopy} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground shrink-0">
          {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
        </button>
      )}
    </div>
  );
}
