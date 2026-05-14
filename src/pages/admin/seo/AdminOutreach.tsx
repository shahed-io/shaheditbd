import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Plus, Mail, Globe, Edit3, Trash2, Copy, ExternalLink, Search,
  CheckCircle2, Clock, XCircle, MessageSquare, Send, FileText,
  Download, History, Bell, AlarmClock, CalendarClock,
} from 'lucide-react';
import OutreachTimelineModal from '@/components/admin/OutreachTimelineModal';

interface Prospect {
  id: string;
  site_name: string;
  site_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_channel: string;
  category: string;
  domain_authority: number | null;
  status: string;
  pitch_template: string;
  notes: string | null;
  last_contacted_at: string | null;
  follow_up_at: string | null;
  published_url: string | null;
  created_at: string;
}

const STATUSES = [
  { value: 'prospect',    label: 'Prospect',    color: 'hsl(220 15% 60%)', icon: Search },
  { value: 'contacted',   label: 'Contacted',   color: 'hsl(220 90% 60%)', icon: Send },
  { value: 'replied',     label: 'Replied',     color: 'hsl(280 80% 65%)', icon: MessageSquare },
  { value: 'negotiating', label: 'Negotiating', color: 'hsl(40 95% 55%)',  icon: Clock },
  { value: 'published',   label: 'Published',   color: 'hsl(150 70% 45%)', icon: CheckCircle2 },
  { value: 'declined',    label: 'Declined',    color: 'hsl(0 80% 60%)',   icon: XCircle },
  { value: 'no_reply',    label: 'No Reply',    color: 'hsl(0 0% 50%)',    icon: XCircle },
];

const CATEGORIES = ['tech_blog', 'facebook_group', 'youtube', 'forum', 'news', 'other'];
const CHANNELS   = ['email', 'facebook', 'linkedin', 'whatsapp', 'form'];
const TEMPLATES  = ['guest_post', 'review', 'resource_link', 'partnership'];

type Variant = { label: string; subject: string; body: string };

const TEMPLATE_VARIANTS: Record<string, Variant[]> = {
  guest_post: [
    {
      label: 'Friendly / Educational',
      subject: 'Guest post idea for {{site_name}} — Free practical guide for your readers',
      body: `Hi {{contact_name}},

I'm Shahed from Shahed Store (shahedstore.com.bd) — a Bangladeshi digital software store serving 10,000+ local customers with genuine Microsoft, Adobe, AI tool, and other licenses.

I've been a regular reader of {{site_name}} and I think your audience would find this guest post useful:

  "Windows 11 Genuine License vs Crack — A Practical Buyer's Guide for Bangladeshi Users (2026)"

It would cover real BD pricing, bKash/Nagad payment, activation steps, and how to spot fake keys — entirely educational, not promotional. I'm happy to adapt the angle to whatever fits {{site_name}}'s tone best.

In return, all I ask is one author bio link back to shahedstore.com.bd.

Would this work for you? Happy to send a full draft within 3 days.

Thanks for considering,
Shahed
shahedstore.com.bd
WhatsApp: +880 ...`,
    },
    {
      label: 'Short & Direct',
      subject: '{{site_name}} guest post — 1500 words, ready in 3 days',
      body: `Hi {{contact_name}},

Quick one — I run shahedstore.com.bd (BD's genuine software marketplace, 10k+ customers).

I'd like to write a guest post for {{site_name}}:

  "How Bangladeshi Freelancers Can Save 60% on Software Licenses in 2026"

1500 words, original, with real BD pricing data. Just one author-bio link in return.

Yes / no — happy either way.

Shahed
shahedstore.com.bd`,
    },
    {
      label: 'Data-driven Pitch',
      subject: 'Exclusive 2026 BD software pricing data for {{site_name}}',
      body: `Hi {{contact_name}},

I'm Shahed — founder of Shahed Store, where we've processed 10,000+ digital software orders across Bangladesh in the last 18 months.

We have proprietary data on what BD users actually pay (and save) for Microsoft 365, Adobe CC, ChatGPT Plus, Canva Pro, etc. — broken down by city, payment method (bKash/Nagad/card) and freelancer vs student vs business buyer.

I'd love to turn this into an exclusive data-driven post for {{site_name}}:

  "The State of Software Spending in Bangladesh — 2026 Report"

All charts, original research, no competitor mentions. Just one author-bio backlink.

Interested? I can send a sample chart today.

Best,
Shahed
shahedstore.com.bd`,
    },
  ],
  review: [
    {
      label: 'No-strings Free Product',
      subject: 'Free product for honest review — Shahed Store',
      body: `Hi {{contact_name}},

I run Shahed Store (shahedstore.com.bd) — Bangladesh's trusted source for genuine Microsoft 365, Adobe, ChatGPT Plus, Canva Pro and other digital licenses with bKash/Nagad payment and 1-hour delivery.

I'd love to send you any product from our catalog (worth up to ৳5,000) for a no-strings-attached honest review on {{site_name}}. You're welcome to share both the good and the bad.

If interested, just reply with the product you'd like and I'll send the license today.

Thanks,
Shahed
shahedstore.com.bd`,
    },
    {
      label: 'Comparison Review',
      subject: '{{site_name}} review request — compare us with 3 other BD sellers',
      body: `Hi {{contact_name}},

Big fan of how {{site_name}} reviews local services honestly.

Would you be open to a comparison review of Bangladeshi digital software sellers (Shahed Store vs 3 others your readers know)? I'll cover the cost of all 4 products so the test is fair, and you keep full editorial control — including saying we're worse if we are.

If yes, I'll send the budget and product list within 24 hours.

Shahed
shahedstore.com.bd`,
    },
    {
      label: 'YouTube / Video Pitch',
      subject: 'Video review collab — free Microsoft 365 + ChatGPT Plus for {{site_name}}',
      body: `Hi {{contact_name}},

Loved your recent videos on {{site_name}} — your audience is exactly the people we serve at Shahed Store (BD freelancers and small businesses buying genuine software).

I'd like to send you free 1-year Microsoft 365 + ChatGPT Plus + Canva Pro licenses (worth ৳8,000+) for an honest video review. No script, no required mentions — just your real opinion.

If you're interested, reply with your delivery email and I'll activate everything within an hour.

Cheers,
Shahed
shahedstore.com.bd`,
    },
  ],
  partnership: [
    {
      label: 'Affiliate Partnership',
      subject: 'Partnership idea between {{site_name}} and Shahed Store',
      body: `Hi {{contact_name}},

I'm Shahed, founder of Shahed Store (shahedstore.com.bd) — Bangladesh's digital software marketplace.

I'd like to explore a small partnership with {{site_name}}: an affiliate or referral arrangement where your readers get a discount code and your team earns commission on sales. We currently pay 10% on every order through our referral program.

If that sounds interesting, I'd love to jump on a 15-min call this week.

Thanks,
Shahed
shahedstore.com.bd`,
    },
    {
      label: 'Co-marketing / Bundle',
      subject: 'Co-marketing idea: bundle {{site_name}} audience with Shahed Store offer',
      body: `Hi {{contact_name}},

Quick idea — I run Shahed Store (shahedstore.com.bd), BD's largest genuine software marketplace.

What if we ran a joint campaign for {{site_name}}'s audience? For example: an exclusive "{{site_name}} reader" bundle (Microsoft 365 + Canva Pro + ChatGPT Plus at 30% off) — you promote, we fulfill, and we split revenue 50/50 on every sale.

No upfront cost on either side. If it flops, we both walk away.

Worth a quick call?

Shahed
shahedstore.com.bd`,
    },
    {
      label: 'White-label / Reseller',
      subject: 'White-label software supply for {{site_name}}',
      body: `Hi {{contact_name}},

If {{site_name}} ever wanted to offer software licenses to your audience under your own brand — we can supply genuine Microsoft, Adobe, AI tool licenses at wholesale price, instant API delivery, and bKash/Nagad/card settlement.

You set the retail price. We handle activation, support, and refunds invisibly.

We already power 5+ BD resellers this way. If it's a fit for {{site_name}}, I'm happy to share pricing and the full reseller deck.

Best,
Shahed
shahedstore.com.bd`,
    },
  ],
  resource_link: [
    {
      label: 'Soft Resource Mention',
      subject: 'Resource for your readers — genuine software prices in BD',
      body: `Hi {{contact_name}},

I noticed your post/article about software pricing in Bangladesh — really useful piece.

We maintain a regularly-updated comparison page on Shahed Store that lists current BD prices for Microsoft 365, Adobe, Canva Pro, ChatGPT Plus, Grammarly, CapCut Pro and more (paid via bKash/Nagad, instant delivery). It might be a useful resource link for your readers:

  https://shahedstore.com.bd/shop

No obligation at all — just thought it might add value if you ever update the post.

Best,
Shahed
shahedstore.com.bd`,
    },
    {
      label: 'Broken Link Replacement',
      subject: 'Broken link on {{site_name}} — possible replacement',
      body: `Hi {{contact_name}},

While reading your guide on {{site_name}}, I noticed one of the outbound links to a software pricing page seems broken / outdated.

If you're updating it anyway, a current alternative could be our live BD pricing page:

  https://shahedstore.com.bd/shop

It's updated weekly with bKash/Nagad prices and is free to reference. Totally up to you — just wanted to flag it.

Cheers,
Shahed
shahedstore.com.bd`,
    },
  ],
};

const renderVariant = (v: Variant, p: Prospect) => {
  const replace = (s: string) =>
    s.split('{{site_name}}').join(p.site_name)
     .split('{{contact_name}}').join(p.contact_name || 'there');
  return { subject: replace(v.subject), body: replace(v.body) };
};

const CSV_HEADERS = ['Site Name', 'Site URL', 'Contact Name', 'Contact Email', 'Contact Channel', 'Category', 'Domain Authority', 'Status', 'Pitch Template', 'Published URL', 'Notes', 'Last Contacted', 'Follow Up'];

const toCSV = (rows: Prospect[]) => {
  const escape = (v: string | null) => {
    if (v == null) return '';
    if (v.includes(',') || v.includes('"') || v.includes('\n')) return '"' + v.replace(/"/g, '""') + '"';
    return v;
  };
  const lines = [CSV_HEADERS.join(','), ...rows.map(r =>
    [r.site_name, r.site_url, r.contact_name, r.contact_email, r.contact_channel, r.category, r.domain_authority, r.status, r.pitch_template, r.published_url, r.notes, r.last_contacted_at, r.follow_up_at]
      .map(v => escape(String(v ?? '')))
      .join(',')
  )];
  return lines.join('\n');
};

const toTSV = (rows: Prospect[]) => {
  const lines = [CSV_HEADERS.join('\t'), ...rows.map(r =>
    [r.site_name, r.site_url, r.contact_name, r.contact_email, r.contact_channel, r.category, r.domain_authority, r.status, r.pitch_template, r.published_url, r.notes, r.last_contacted_at, r.follow_up_at]
      .map(v => String(v ?? '').replace(/\t/g, ' '))
      .join('\t')
  )];
  return lines.join('\n');
};

const Pill = ({ status }: { status: string }) => {
  const s = STATUSES.find(x => x.value === status) || STATUSES[0];
  const Icon = s.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ background: `${s.color}22`, color: s.color, border: `1px solid ${s.color}55` }}
    >
      <Icon size={10} /> {s.label}
    </span>
  );
};

const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const empty: Partial<Prospect> = {
  site_name: '', site_url: '', contact_name: '', contact_email: '',
  contact_channel: 'email', category: 'tech_blog', status: 'prospect',
  pitch_template: 'guest_post', notes: '',
};

const AdminOutreach = () => {
  const [list, setList] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Partial<Prospect> | null>(null);
  const [showTpl, setShowTpl] = useState<Prospect | null>(null);
  const [variantIdx, setVariantIdx] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [timelineFor, setTimelineFor] = useState<Prospect | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('outreach_prospects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setList(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Auto-create notifications for due / overdue follow-ups (dedup per prospect per day)
  useEffect(() => {
    if (loading || list.length === 0) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const now = new Date();
      const todayKey = now.toISOString().slice(0, 10);
      const due = list.filter(p =>
        p.follow_up_at &&
        new Date(p.follow_up_at) <= now &&
        !['published', 'declined', 'no_reply'].includes(p.status)
      );
      if (due.length === 0) return;
      // Fetch existing notifications today linked to outreach to dedup
      const { data: existing } = await supabase
        .from('notifications')
        .select('link')
        .eq('user_id', user.id)
        .gte('created_at', `${todayKey}T00:00:00.000Z`)
        .like('link', '/ceo/seo/outreach%');
      const existingKeys = new Set((existing || []).map((n: any) => n.link));
      const toInsert = due
        .map(p => ({
          user_id: user.id,
          title: '🔔 Outreach follow-up due',
          message: `Time to follow up with ${p.site_name}${p.contact_name ? ` (${p.contact_name})` : ''}.`,
          type: 'info',
          link: `/ceo/seo/outreach?focus=${p.id}&d=${todayKey}`,
        }))
        .filter(n => !existingKeys.has(n.link));
      if (toInsert.length > 0) {
        await supabase.from('notifications').insert(toInsert);
      }
    })();
  }, [loading, list]);

  const snooze = async (id: string, days: number) => {
    const dt = new Date();
    dt.setDate(dt.getDate() + days);
    const { error } = await supabase
      .from('outreach_prospects')
      .update({ follow_up_at: dt.toISOString() })
      .eq('id', id);
    if (error) return toast.error(error.message);
    toast.success(`Snoozed ${days} day${days > 1 ? 's' : ''}`);
    load();
  };

  const markDone = async (id: string) => {
    const { error } = await supabase
      .from('outreach_prospects')
      .update({ follow_up_at: null, last_contacted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Marked done for today');
    load();
  };

  const save = async () => {
    if (!editing?.site_name?.trim()) { toast.error('Site name is required'); return; }
    const payload = { ...editing };
    if (payload.id) {
      const { error } = await supabase.from('outreach_prospects').update(payload).eq('id', payload.id);
      if (error) return toast.error(error.message);
      toast.success('Updated');
    } else {
      const { error } = await supabase.from('outreach_prospects').insert(payload as any);
      if (error) return toast.error(error.message);
      toast.success('Added');
    }
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this prospect?')) return;
    const { error } = await supabase.from('outreach_prospects').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    load();
  };

  const setStatus = async (id: string, status: string) => {
    const patch: any = { status };
    if (status === 'contacted') patch.last_contacted_at = new Date().toISOString();
    const { error } = await supabase.from('outreach_prospects').update(patch).eq('id', id);
    if (error) return toast.error(error.message);
    load();
  };

  const filtered = list.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search && !`${p.site_name} ${p.site_url ?? ''} ${p.contact_email ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = STATUSES.map(s => ({ ...s, count: list.filter(p => p.status === s.value).length }));
  const total = list.length;
  const published = list.filter(p => p.status === 'published').length;
  const conversion = total > 0 ? Math.round((published / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Backlink <span className="gradient-text">Outreach Tracker</span>
          </h1>
          <p className="text-muted-foreground text-sm">Track guest posts, reviews & link partnerships with BD tech communities</p>
        </div>
        <button
          onClick={() => setEditing({ ...empty })}
          className="btn-glow inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
        >
          <Plus size={14} /> Add Prospect
        </button>
      </div>

      {/* Today's Tasks */}
      {(() => {
        const now = new Date();
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
        const active = (p: Prospect) => !['published', 'declined', 'no_reply'].includes(p.status);
        const overdue = list.filter(p => active(p) && p.follow_up_at && new Date(p.follow_up_at) < new Date(new Date().setHours(0,0,0,0)));
        const dueToday = list.filter(p => active(p) && p.follow_up_at && new Date(p.follow_up_at) >= new Date(new Date().setHours(0,0,0,0)) && new Date(p.follow_up_at) <= todayEnd);
        const stalled = list.filter(p => p.status === 'contacted' && p.last_contacted_at && (now.getTime() - new Date(p.last_contacted_at).getTime()) > 7 * 24 * 3600 * 1000 && !p.follow_up_at);
        const tasks = [
          ...overdue.map(p => ({ p, kind: 'overdue' as const })),
          ...dueToday.map(p => ({ p, kind: 'today' as const })),
          ...stalled.map(p => ({ p, kind: 'stalled' as const })),
        ];
        if (tasks.length === 0) {
          return (
            <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-green-500" />
              <div>
                <p className="text-sm font-semibold text-foreground">All clear for today 🎉</p>
                <p className="text-xs text-muted-foreground">No follow-ups due. Set a follow-up date on any prospect to get reminders here.</p>
              </div>
            </div>
          );
        }
        const badge = (k: 'overdue' | 'today' | 'stalled') => {
          if (k === 'overdue') return { label: 'Overdue', cls: 'bg-red-500/15 text-red-500 border-red-500/30' };
          if (k === 'today') return { label: 'Due Today', cls: 'bg-amber-500/15 text-amber-500 border-amber-500/30' };
          return { label: 'Stalled 7d+', cls: 'bg-blue-500/15 text-blue-500 border-blue-500/30' };
        };
        return (
          <div className="glass-card rounded-2xl p-4 border border-primary/30">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={16} className="text-primary" />
              <h3 className="font-bold text-foreground text-sm">Today's Tasks</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">{tasks.length}</span>
              <span className="ml-auto text-[11px] text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {tasks.map(({ p, kind }) => {
                const b = badge(kind);
                return (
                  <div key={`${kind}-${p.id}`} className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/20 hover:bg-muted/30 border border-border/40">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${b.cls} whitespace-nowrap`}>{b.label}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.site_name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {p.contact_name || p.contact_email || '—'}
                        {p.follow_up_at && <> · <CalendarClock size={9} className="inline" /> {fmtDate(p.follow_up_at)}</>}
                        {kind === 'stalled' && p.last_contacted_at && <> · contacted {fmtDate(p.last_contacted_at)}</>}
                      </p>
                    </div>
                    <Pill status={p.status} />
                    <button onClick={() => setShowTpl(p)} title="Open pitch" className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-primary">
                      <Mail size={13} />
                    </button>
                    <button onClick={() => setTimelineFor(p)} title="Log activity" className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-primary">
                      <History size={13} />
                    </button>
                    <button onClick={() => snooze(p.id, 3)} title="Snooze 3 days" className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-amber-500">
                      <AlarmClock size={13} />
                    </button>
                    <button onClick={() => markDone(p.id)} title="Mark done" className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-green-500">
                      <CheckCircle2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Prospects</p>
          <p className="text-2xl font-bold text-foreground">{total}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Contacted</p>
          <p className="text-2xl font-bold text-foreground">{counts.find(c => c.value === 'contacted')!.count}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Published Links</p>
          <p className="text-2xl font-bold text-green-500">{published}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Conversion Rate</p>
          <p className="text-2xl font-bold text-foreground">{conversion}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${filter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/30 border-border text-foreground hover:bg-muted/50'}`}
        >
          All ({list.length})
        </button>
        {counts.map(s => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${filter === s.value ? 'text-white' : 'bg-muted/30 border-border text-foreground hover:bg-muted/50'}`}
            style={filter === s.value ? { background: s.color, borderColor: s.color } : {}}
          >
            {s.label} ({s.count})
          </button>
        ))}
        <div className="ml-auto relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="bg-background border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary w-56"
          />
        </div>
      </div>

      {/* Export bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 glass-card rounded-xl px-4 py-2.5">
          <span className="text-xs text-muted-foreground">{selected.size} selected</span>
          <div className="flex-1" />
          <button
            onClick={() => {
              const rows = filtered.filter(p => selected.has(p.id));
              const csv = toCSV(rows);
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `outreach_export_${new Date().toISOString().slice(0,10)}.csv`;
              a.click();
              toast.success('CSV downloaded');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-400/10 text-green-400 border border-green-400/30 hover:bg-green-400/20 transition"
          >
            <Download size={12} /> Export CSV
          </button>
          <button
            onClick={() => {
              const rows = filtered.filter(p => selected.has(p.id));
              const tsv = toTSV(rows);
              navigator.clipboard.writeText(tsv).then(() => toast.success('Copied — paste directly into Google Sheets'));
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition"
          >
            <Copy size={12} /> Copy for Google Sheets
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No prospects yet. Click "Add Prospect" to start.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/20 text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2.5 font-medium w-8">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && filtered.every(p => selected.has(p.id))}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelected(new Set(filtered.map(p => p.id)));
                        } else {
                          setSelected(new Set());
                        }
                      }}
                      className="accent-primary"
                    />
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium">Site</th>
                  <th className="text-left px-3 py-2.5 font-medium">Category</th>
                  <th className="text-left px-3 py-2.5 font-medium">Contact</th>
                  <th className="text-left px-3 py-2.5 font-medium">Pitch</th>
                  <th className="text-left px-3 py-2.5 font-medium">Status</th>
                  <th className="text-left px-3 py-2.5 font-medium">Last Contact</th>
                  <th className="text-right px-4 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-t border-border/40 hover:bg-muted/10">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={e => {
                          const next = new Set(selected);
                          if (e.target.checked) next.add(p.id);
                          else next.delete(p.id);
                          setSelected(next);
                        }}
                        className="accent-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{p.site_name}</div>
                      {p.site_url && (
                        <a href={p.site_url} target="_blank" rel="noopener noreferrer"
                          className="text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                          {p.site_url.replace(/^https?:\/\//, '').slice(0, 40)} <ExternalLink size={9} />
                        </a>
                      )}
                      {p.published_url && (
                        <a href={p.published_url} target="_blank" rel="noopener noreferrer"
                          className="block text-[11px] text-green-500 hover:underline mt-0.5">
                          ↗ Published link
                        </a>
                      )}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground capitalize">{p.category.replace('_', ' ')}</td>
                    <td className="px-3 py-3">
                      {p.contact_name && <div className="text-foreground">{p.contact_name}</div>}
                      {p.contact_email && <div className="text-[11px] text-muted-foreground break-all">{p.contact_email}</div>}
                      <div className="text-[10px] uppercase text-muted-foreground/70">{p.contact_channel}</div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground capitalize">{p.pitch_template.replace('_', ' ')}</td>
                    <td className="px-3 py-3">
                      <select
                        value={p.status}
                        onChange={e => setStatus(p.id, e.target.value)}
                        className="bg-transparent border border-border rounded-md px-1.5 py-0.5 text-[11px] text-foreground focus:outline-none focus:border-primary"
                      >
                        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      <div className="mt-1"><Pill status={p.status} /></div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{fmtDate(p.last_contacted_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setTimelineFor(p)}
                          title="Activity timeline"
                          className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-primary"
                        >
                          <History size={14} />
                        </button>
                        <button
                          onClick={() => setShowTpl(p)}
                          title="View pitch template"
                          className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-primary"
                        >
                          <FileText size={14} />
                        </button>
                        <button
                          onClick={() => setEditing(p)}
                          title="Edit"
                          className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-primary"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => remove(p.id)}
                          title="Delete"
                          className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 size={14} />
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

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="glass-card rounded-2xl p-6 w-full max-w-lg space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-foreground text-lg">{editing.id ? 'Edit Prospect' : 'New Prospect'}</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 text-xs">
                <span className="text-muted-foreground">Site Name *</span>
                <input value={editing.site_name || ''} onChange={e => setEditing({ ...editing, site_name: e.target.value })}
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </label>
              <label className="col-span-2 text-xs">
                <span className="text-muted-foreground">Site URL</span>
                <input value={editing.site_url || ''} onChange={e => setEditing({ ...editing, site_url: e.target.value })}
                  placeholder="https://"
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </label>
              <label className="text-xs">
                <span className="text-muted-foreground">Contact Name</span>
                <input value={editing.contact_name || ''} onChange={e => setEditing({ ...editing, contact_name: e.target.value })}
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </label>
              <label className="text-xs">
                <span className="text-muted-foreground">Contact Email</span>
                <input value={editing.contact_email || ''} onChange={e => setEditing({ ...editing, contact_email: e.target.value })}
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </label>
              <label className="text-xs">
                <span className="text-muted-foreground">Channel</span>
                <select value={editing.contact_channel || 'email'} onChange={e => setEditing({ ...editing, contact_channel: e.target.value })}
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary capitalize">
                  {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="text-xs">
                <span className="text-muted-foreground">Category</span>
                <select value={editing.category || 'tech_blog'} onChange={e => setEditing({ ...editing, category: e.target.value })}
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
              </label>
              <label className="text-xs">
                <span className="text-muted-foreground">Pitch Template</span>
                <select value={editing.pitch_template || 'guest_post'} onChange={e => setEditing({ ...editing, pitch_template: e.target.value })}
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                  {TEMPLATES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </label>
              <label className="text-xs">
                <span className="text-muted-foreground">Status</span>
                <select value={editing.status || 'prospect'} onChange={e => setEditing({ ...editing, status: e.target.value })}
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </label>
              <label className="text-xs">
                <span className="text-muted-foreground">Follow-up Reminder</span>
                <input
                  type="date"
                  value={editing.follow_up_at ? new Date(editing.follow_up_at).toISOString().slice(0, 10) : ''}
                  onChange={e => setEditing({ ...editing, follow_up_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </label>
              <label className="text-xs">
                <span className="text-muted-foreground">Published URL</span>
                <input value={editing.published_url || ''} onChange={e => setEditing({ ...editing, published_url: e.target.value })}
                  placeholder="https://"
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </label>
              <label className="col-span-2 text-xs">
                <span className="text-muted-foreground">Notes</span>
                <textarea value={editing.notes || ''} onChange={e => setEditing({ ...editing, notes: e.target.value })}
                  rows={3}
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg text-sm bg-muted/40 hover:bg-muted/60 text-foreground">Cancel</button>
              <button onClick={save} className="btn-glow px-4 py-2 rounded-lg text-sm font-medium">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Template viewer */}
      {showTpl && (() => {
        const t = renderTemplate(showTpl.pitch_template, showTpl);
        return (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowTpl(null)}>
            <div className="glass-card rounded-2xl p-6 w-full max-w-2xl space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                  <Mail size={18} className="text-primary" />
                  Pitch Template — <span className="capitalize">{showTpl.pitch_template.replace('_', ' ')}</span>
                </h3>
                <span className="text-xs text-muted-foreground">For: {showTpl.site_name}</span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Subject</label>
                  <button onClick={() => { navigator.clipboard.writeText(t.subject); toast.success('Subject copied'); }}
                    className="text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                    <Copy size={11} /> Copy
                  </button>
                </div>
                <div className="bg-muted/20 rounded-lg p-3 text-sm text-foreground border border-border">{t.subject}</div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Body</label>
                  <button onClick={() => { navigator.clipboard.writeText(t.body); toast.success('Body copied'); }}
                    className="text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                    <Copy size={11} /> Copy
                  </button>
                </div>
                <textarea readOnly value={t.body} rows={14}
                  className="w-full bg-muted/20 rounded-lg p-3 text-sm text-foreground border border-border font-mono resize-none focus:outline-none" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <a
                  href={showTpl.contact_email
                    ? `mailto:${showTpl.contact_email}?subject=${encodeURIComponent(t.subject)}&body=${encodeURIComponent(t.body)}`
                    : '#'}
                  onClick={(e) => { if (!showTpl.contact_email) { e.preventDefault(); toast.error('No email on file'); } }}
                  className="btn-glow inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  <Send size={14} /> Open in Email Client
                </a>
                <button onClick={() => setShowTpl(null)} className="px-4 py-2 rounded-lg text-sm bg-muted/40 hover:bg-muted/60 text-foreground">Close</button>
              </div>
            </div>
          </div>
        );
      })()}
      {timelineFor && (
        <OutreachTimelineModal
          prospectId={timelineFor.id}
          prospectName={timelineFor.site_name}
          onClose={() => setTimelineFor(null)}
          onLogChanged={load}
        />
      )}
    </div>
  );
};

export default AdminOutreach;
