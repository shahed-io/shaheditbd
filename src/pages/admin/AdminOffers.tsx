import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Plus, Edit, Trash2, Copy, ExternalLink, Gift, Users, Calendar,
  Sparkles, Trophy, BellRing, RefreshCw, Search, Filter, CircleDot,
  FileEdit, CheckCircle2, XCircle, Clock, Eye,
} from 'lucide-react';
import SendToNotificationsDialog from '@/components/admin/SendToNotificationsDialog';

interface Offer {
  id: string;
  slug: string;
  title: string;
  status: string;
  start_at: string | null;
  end_at: string | null;
  submission_count: number;
  banner_url: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: 'Active', color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30', icon: CheckCircle2 },
  draft: { label: 'Draft', color: 'bg-slate-500/15 text-slate-600 border-slate-500/30', icon: FileEdit },
  closed: { label: 'Closed', color: 'bg-rose-500/15 text-rose-600 border-rose-500/30', icon: XCircle },
};

const fmtCountdown = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export default function AdminOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifyOffer, setNotifyOffer] = useState<Offer | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sort, setSort] = useState<string>('newest');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('offers')
      .select('id, slug, title, status, start_at, end_at, submission_count, banner_url, created_at')
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    else setOffers((data as Offer[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createNew = async () => {
    const slug = `offer-${Date.now().toString(36)}`;
    const { data, error } = await supabase
      .from('offers')
      .insert({ slug, title: 'New Offer', status: 'draft', require_login: false, max_submissions: null })
      .select()
      .single();
    if (error) return toast.error(error.message);
    await supabase.from('offer_fields').insert([
      { offer_id: data.id, field_type: 'text', label: 'আপনার পূর্ণ নাম', required: true, sort_order: 0 },
      { offer_id: data.id, field_type: 'phone', label: 'আপনার ফোন নম্বর', required: true, sort_order: 1 },
      { offer_id: data.id, field_type: 'email', label: 'আপনার ইমেইল ঠিকানা', required: false, sort_order: 2 },
    ]);
    navigate(`/ceo/offers/${data.id}`);
  };

  const duplicate = async (offer: Offer) => {
    const { data: full } = await supabase.from('offers').select('*').eq('id', offer.id).single();
    if (!full) return;
    const { data: fields } = await supabase.from('offer_fields').select('*').eq('offer_id', offer.id);
    const { id, created_at, updated_at, submission_count, slug, ...rest } = full as any;
    const newSlug = `${slug}-copy-${Date.now().toString(36)}`;
    const { data: newOffer, error } = await supabase
      .from('offers')
      .insert({ ...rest, slug: newSlug, title: `${full.title} (Copy)`, status: 'draft' })
      .select()
      .single();
    if (error) return toast.error(error.message);
    if (fields && fields.length > 0) {
      const rows = fields.map((f: any) => {
        const { id: _, offer_id: __, created_at: ___, ...rest } = f;
        return { ...rest, offer_id: newOffer.id };
      });
      await supabase.from('offer_fields').insert(rows);
    }
    toast.success('Offer duplicated');
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this offer? All submissions and winners will be removed too.')) return;
    const { error } = await supabase.from('offers').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    load();
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/offer/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Public link copied');
  };

  const counts = useMemo(() => ({
    all: offers.length,
    active: offers.filter(o => o.status === 'active').length,
    draft: offers.filter(o => o.status === 'draft').length,
    closed: offers.filter(o => o.status === 'closed').length,
    entries: offers.reduce((s, o) => s + (o.submission_count || 0), 0),
  }), [offers]);

  const filtered = useMemo(() => {
    let list = offers.filter(o => {
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchSearch = !q || o.title.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
    if (sort === 'newest') list = [...list].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    if (sort === 'oldest') list = [...list].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    if (sort === 'most_entries') list = [...list].sort((a, b) => (b.submission_count || 0) - (a.submission_count || 0));
    if (sort === 'ending_soon') list = [...list].sort((a, b) => {
      const ea = a.end_at ? +new Date(a.end_at) : Infinity;
      const eb = b.end_at ? +new Date(b.end_at) : Infinity;
      return ea - eb;
    });
    return list;
  }, [offers, statusFilter, search, sort]);

  const statCards: Array<{ key: string; label: string; value: number; icon: React.ElementType; color: string; bg: string }> = [
    { key: 'all', label: 'All Offers', value: counts.all, icon: Gift, color: 'text-primary', bg: 'bg-primary/10' },
    { key: 'active', label: 'Active', value: counts.active, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { key: 'draft', label: 'Draft', value: counts.draft, icon: FileEdit, color: 'text-slate-500', bg: 'bg-slate-500/10' },
    { key: 'closed', label: 'Ended', value: counts.closed, icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="space-y-4 md:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2 break-words">
            <Gift size={22} className="text-primary shrink-0" />
            <span className="truncate">Offers &amp; Giveaways</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Manage giveaway campaigns, entries, winners &amp; automation</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={load} className="gap-2 flex-1 sm:flex-none">
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button size="sm" onClick={createNew} className="gap-2 flex-1 sm:flex-none bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white">
            <Plus size={14} /> New Offer
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        {statCards.map(s => {
          const Icon = s.icon;
          const active = statusFilter === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`glass-card rounded-xl p-3 sm:p-4 text-left transition-all border ${
                active ? 'border-primary/50 bg-primary/5' : 'border-border/50 hover:border-primary/30'
              }`}
            >
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center mb-1.5 sm:mb-2 ${s.bg}`}>
                <Icon size={16} className={s.color} />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground leading-none">{s.value}</div>
              <div className="text-[11px] sm:text-xs text-muted-foreground mt-1 truncate">{s.label}</div>
            </button>
          );
        })}
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="glass-card rounded-xl border border-border/50 p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-fuchsia-500/10 flex items-center justify-center">
            <Users size={16} className="text-fuchsia-500" />
          </div>
          <div>
            <div className="text-lg font-bold">{counts.entries}</div>
            <div className="text-[11px] text-muted-foreground">Total Entries</div>
          </div>
        </div>
        <div className="glass-card rounded-xl border border-border/50 p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Trophy size={16} className="text-amber-500" />
          </div>
          <div>
            <div className="text-lg font-bold">
              {offers.filter(o => o.end_at && new Date(o.end_at) < new Date()).length}
            </div>
            <div className="text-[11px] text-muted-foreground">Completed Giveaways</div>
          </div>
        </div>
        <div className="glass-card rounded-xl border border-border/50 p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Sparkles size={16} className="text-violet-500" />
          </div>
          <div>
            <div className="text-lg font-bold">
              {offers.filter(o => o.status === 'active' && o.end_at && new Date(o.end_at) > new Date()).length}
            </div>
            <div className="text-[11px] text-muted-foreground">Live Now</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title or slug..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-muted/30"
          />
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex-1 sm:w-40 bg-muted/30">
              <Filter size={14} className="mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="flex-1 sm:w-44 bg-muted/30">
              <CircleDot size={14} className="mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="most_entries">Most entries</SelectItem>
              <SelectItem value="ending_soon">Ending soon</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl border border-border/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <RefreshCw size={20} className="animate-spin mr-2" /> Loading offers...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Gift size={26} className="text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">No offers found</p>
            <Button size="sm" onClick={createNew} className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
              <Plus size={14} /> Create your first offer
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    {['Offer', 'Status', 'Entries', 'Schedule', 'Timing', 'Public Link', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o, i) => {
                    const cfg = statusConfig[o.status] ?? statusConfig.draft;
                    const StatusIcon = cfg.icon;
                    const now = Date.now();
                    const startTs = o.start_at ? new Date(o.start_at).getTime() : null;
                    const endTs = o.end_at ? new Date(o.end_at).getTime() : null;
                    let timing: React.ReactNode = <span className="text-muted-foreground text-xs">—</span>;
                    if (startTs && now < startTs) {
                      timing = <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-600 border-amber-500/30 whitespace-nowrap"><Clock size={10} />Starts in {fmtCountdown(startTs - now)}</span>;
                    } else if (endTs && now < endTs && o.status === 'active') {
                      timing = <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-600 border-emerald-500/30 whitespace-nowrap"><Clock size={10} />Ends in {fmtCountdown(endTs - now)}</span>;
                    } else if (endTs && now >= endTs) {
                      timing = <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border bg-rose-500/10 text-rose-600 border-rose-500/30 whitespace-nowrap">Ended</span>;
                    }
                    return (
                      <tr key={o.id} className={`border-b border-border/30 transition-colors hover:bg-muted/20 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-[220px] max-w-[320px]">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                              {o.banner_url ? (
                                <img src={o.banner_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <Trophy size={16} className="text-violet-600" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-foreground line-clamp-2 break-words">{o.title}</div>
                              <div className="text-[11px] text-muted-foreground">
                                {new Date(o.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap ${cfg.color}`}>
                            <StatusIcon size={11} />{cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                            <Users size={12} className="text-fuchsia-500" /> {o.submission_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-1"><Calendar size={11} />{o.start_at ? new Date(o.start_at).toLocaleDateString() : '—'}</div>
                          <div className="flex items-center gap-1"><Calendar size={11} />{o.end_at ? new Date(o.end_at).toLocaleDateString() : '—'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{timing}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => copyLink(o.slug)}
                            className="font-mono text-[11px] px-2 py-1 rounded-md bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition truncate max-w-[180px] block text-left"
                            title="Click to copy"
                          >
                            /offer/{o.slug}
                          </button>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1 flex-nowrap">
                            <Button size="sm" variant="outline" asChild className="h-7 w-7 p-0" title="Edit">
                              <Link to={`/ceo/offers/${o.id}`}><Edit size={12} /></Link>
                            </Button>
                            <Button size="sm" variant="outline" asChild className="h-7 px-2 gap-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/10" title="Pick winner from this offer">
                              <Link to={`/ceo/offer-winners?offer=${o.id}`}><Trophy size={12} /><span className="text-[11px] font-semibold hidden xl:inline">Winner</span></Link>
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => copyLink(o.slug)} className="h-7 w-7 p-0" title="Copy link">
                              <Copy size={12} />
                            </Button>
                            <Button size="sm" variant="outline" asChild className="h-7 w-7 p-0" title="Open public page">
                              <a href={`/offer/${o.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={12} /></a>
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => duplicate(o)} className="h-7 w-7 p-0" title="Duplicate">
                              <Eye size={12} />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setNotifyOffer(o)} className="h-7 w-7 p-0 text-violet-600" title="Send notification">
                              <BellRing size={12} />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => remove(o.id)} className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-500/10" title="Delete">
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / tablet card list */}
            <div className="lg:hidden divide-y divide-border/40">
              {filtered.map((o) => {
                const cfg = statusConfig[o.status] ?? statusConfig.draft;
                const StatusIcon = cfg.icon;
                const now = Date.now();
                const startTs = o.start_at ? new Date(o.start_at).getTime() : null;
                const endTs = o.end_at ? new Date(o.end_at).getTime() : null;
                let timing: React.ReactNode = null;
                if (startTs && now < startTs) {
                  timing = <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-600 border-amber-500/30"><Clock size={10} />Starts in {fmtCountdown(startTs - now)}</span>;
                } else if (endTs && now < endTs && o.status === 'active') {
                  timing = <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-600 border-emerald-500/30"><Clock size={10} />Ends in {fmtCountdown(endTs - now)}</span>;
                } else if (endTs && now >= endTs) {
                  timing = <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border bg-rose-500/10 text-rose-600 border-rose-500/30">Ended</span>;
                }
                return (
                  <div key={o.id} className="p-3 sm:p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                        {o.banner_url ? (
                          <img src={o.banner_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <Trophy size={18} className="text-violet-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground break-words line-clamp-2">{o.title}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${cfg.color}`}>
                            <StatusIcon size={10} />{cfg.label}
                          </span>
                          {timing}
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-600 border border-fuchsia-500/20">
                            <Users size={10} /> {o.submission_count}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1 min-w-0">
                        <Calendar size={11} className="shrink-0" />
                        <span className="truncate">Start: {o.start_at ? new Date(o.start_at).toLocaleDateString() : '—'}</span>
                      </div>
                      <div className="flex items-center gap-1 min-w-0">
                        <Calendar size={11} className="shrink-0" />
                        <span className="truncate">End: {o.end_at ? new Date(o.end_at).toLocaleDateString() : '—'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => copyLink(o.slug)}
                      className="font-mono text-[10px] px-2 py-1.5 rounded-md bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition truncate w-full text-left block"
                      title="Tap to copy"
                    >
                      /offer/{o.slug}
                    </button>

                    <div className="grid grid-cols-3 gap-1.5">
                      <Button size="sm" variant="outline" asChild className="h-8 text-[11px] gap-1">
                        <Link to={`/ceo/offers/${o.id}`}><Edit size={12} /> Edit</Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild className="h-8 text-[11px] gap-1 text-amber-600 border-amber-500/30">
                        <Link to={`/ceo/offer-winners?offer=${o.id}`}><Trophy size={12} /> Winner</Link>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => copyLink(o.slug)} className="h-8 text-[11px] gap-1">
                        <Copy size={12} /> Link
                      </Button>
                      <Button size="sm" variant="outline" asChild className="h-8 text-[11px] gap-1">
                        <a href={`/offer/${o.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={12} /> Open</a>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => duplicate(o)} className="h-8 text-[11px] gap-1">
                        <Eye size={12} /> Copy
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setNotifyOffer(o)} className="h-8 text-[11px] gap-1 text-violet-600">
                        <BellRing size={12} /> Notify
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => remove(o.id)} className="h-8 text-[11px] gap-1 text-rose-600 hover:bg-rose-500/10">
                        <Trash2 size={12} /> Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <SendToNotificationsDialog
        open={!!notifyOffer}
        onOpenChange={(o) => !o && setNotifyOffer(null)}
        defaultTitle={notifyOffer ? `🎁 ${notifyOffer.title}` : ''}
        defaultMessage={notifyOffer ? `New giveaway: "${notifyOffer.title}" — অংশ নিতে link-এ tap করুন।` : ''}
        defaultLink={notifyOffer ? `/offer/${notifyOffer.slug}` : ''}
        type="offer"
        sourceLabel={notifyOffer ? 'Offer' : undefined}
      />
    </div>
  );
}
