import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, GripVertical, ExternalLink, Eye, EyeOff,
  Check, X, FileText, Info, Shield, Edit3, Save, ChevronDown,
  ChevronRight, Globe, Layout, Link2
} from 'lucide-react';
import { toast } from 'sonner';

/* ─── Types ─── */
type PageSection = 'information' | 'policies';

interface PageLink {
  id: string;
  section: PageSection;
  label: string;
  href: string;
  sort_order: number;
  is_active: boolean;
}

interface ContentSection {
  id: string;
  title: string;
  body: string;
}

interface PageContent {
  pageKey: string;
  title: string;
  subtitle: string;
  badge: string;
  sections: ContentSection[];
}

/* ─── Pages that can be content-edited ─── */
const EDITABLE_PAGES = [
  { key: 'about',           label: 'About Us',              path: '/about',           icon: '👥', color: 'hsl(258,78%,55%)' },
  { key: 'privacy',         label: 'Privacy Policy',        path: '/privacy-policy',  icon: '🔒', color: 'hsl(200,90%,45%)' },
  { key: 'terms',           label: 'Terms & Conditions',    path: '/terms',           icon: '📜', color: 'hsl(38,100%,52%)'  },
  { key: 'refund',          label: 'Refund Policy',         path: '/refund-policy',   icon: '💰', color: 'hsl(142,72%,38%)' },
  { key: 'order_policy',    label: 'Order & Cancellation',  path: '/order-policy',    icon: '🛒', color: 'hsl(329,86%,56%)' },
  { key: 'delivery',        label: 'Delivery Info',         path: '/delivery-info',   icon: '🚚', color: 'hsl(180,72%,40%)' },
  { key: 'return',          label: 'Return Policy',         path: '/return-policy',   icon: '↩️',  color: 'hsl(30,90%,52%)'  },
  { key: 'faqs',            label: 'FAQs',                  path: '/faqs',            icon: '❓', color: 'hsl(243,75%,65%)' },
  { key: 'contact',         label: 'Contact Us',            path: '/contact',         icon: '📞', color: 'hsl(162,72%,38%)' },
];

/* ─── Default footer links ─── */
const DEFAULT_LINKS: Omit<PageLink, 'id'>[] = [
  { section: 'information', label: 'Blog',             href: '/blog',             sort_order: 1,  is_active: true },
  { section: 'information', label: 'Help Center',      href: '/link',             sort_order: 2,  is_active: true },
  { section: 'information', label: 'About Us',         href: '/about',            sort_order: 3,  is_active: true },
  { section: 'information', label: 'My Account',       href: '/dashboard',        sort_order: 4,  is_active: true },
  { section: 'information', label: 'Contact Us',       href: '/contact',          sort_order: 5,  is_active: true },
  { section: 'information', label: 'All Products',     href: '/shop',             sort_order: 6,  is_active: true },
  { section: 'policies',    label: 'Privacy Policy',   href: '/privacy-policy',  sort_order: 1,  is_active: true },
  { section: 'policies',    label: 'Terms & Conditions', href: '/terms',          sort_order: 2,  is_active: true },
  { section: 'policies',    label: 'Refund Policy',    href: '/refund-policy',   sort_order: 3,  is_active: true },
  { section: 'policies',    label: 'Order Policy',     href: '/order-policy',    sort_order: 4,  is_active: true },
  { section: 'policies',    label: 'Delivery Info',    href: '/delivery-info',   sort_order: 5,  is_active: true },
  { section: 'policies',    label: 'Return Policy',    href: '/return-policy',   sort_order: 6,  is_active: true },
];

/* ─── Inline edit row for links ─── */
const EditRow = ({
  link, onSave, onCancel,
}: {
  link: Partial<PageLink> & { section: PageSection };
  onSave: (data: Partial<PageLink>) => void;
  onCancel: () => void;
}) => {
  const [label, setLabel] = useState(link.label ?? '');
  const [href, setHref]   = useState(link.href ?? '');
  return (
    <tr className="bg-primary/5">
      <td className="px-4 py-3">
        <input
          className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:border-primary"
          value={label} onChange={e => setLabel(e.target.value)} placeholder="Link label"
        />
      </td>
      <td className="px-4 py-3">
        <input
          className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:border-primary font-mono"
          value={href} onChange={e => setHref(e.target.value)} placeholder="/page-path"
        />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => onSave({ label, href })}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, hsl(243,75%,65%), hsl(263,70%,62%))' }}>
            <Check size={13} />
          </button>
          <button onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
            <X size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
};

/* ─── Page Content Editor Panel ─── */
const PageContentEditor = ({ pageInfo }: { pageInfo: typeof EDITABLE_PAGES[0] }) => {
  const qc = useQueryClient();
  const CONTENT_KEY = `page_content_${pageInfo.key}`;

  const { data: content, isLoading } = useQuery<PageContent>({
    queryKey: ['page-content', pageInfo.key],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', CONTENT_KEY)
        .maybeSingle();
      if (data?.value) return JSON.parse(data.value) as PageContent;
      return {
        pageKey: pageInfo.key,
        title: pageInfo.label,
        subtitle: '',
        badge: pageInfo.label,
        sections: [{ id: 'sec-1', title: 'প্রথম সেকশন', body: 'এখানে কন্টেন্ট লিখুন...' }],
      };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (updated: PageContent) => {
      await supabase.from('site_settings').upsert(
        { key: CONTENT_KEY, value: JSON.stringify(updated), category: 'page_content' },
        { onConflict: 'key' }
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['page-content', pageInfo.key] });
      toast.success(`${pageInfo.label} সেভ হয়েছে!`);
    },
    onError: () => toast.error('সেভ করতে সমস্যা হয়েছে।'),
  });

  const [local, setLocal] = useState<PageContent | null>(null);
  const working = local ?? content;

  const update = (patch: Partial<PageContent>) => {
    if (!working) return;
    setLocal({ ...working, ...patch });
  };

  const updateSection = (id: string, patch: Partial<ContentSection>) => {
    if (!working) return;
    setLocal({
      ...working,
      sections: working.sections.map(s => s.id === id ? { ...s, ...patch } : s),
    });
  };

  const addSection = () => {
    if (!working) return;
    const newSec: ContentSection = { id: `sec-${Date.now()}`, title: 'নতুন সেকশন', body: '' };
    setLocal({ ...working, sections: [...working.sections, newSec] });
  };

  const deleteSection = (id: string) => {
    if (!working) return;
    setLocal({ ...working, sections: working.sections.filter(s => s.id !== id) });
  };

  const save = () => {
    if (!working) return;
    saveMutation.mutate(working);
    setLocal(null);
  };

  if (isLoading) return <div className="h-32 rounded-2xl bg-muted animate-pulse" />;
  if (!working) return null;

  const isDirty = local !== null;

  return (
    <div className="space-y-4">
      {/* Header meta */}
      <div className="rounded-2xl border border-border/60 overflow-hidden"
        style={{ boxShadow: '0 2px 16px hsla(226,35%,12%,0.06)' }}>
        <div className="px-5 py-3.5 border-b border-border/40 flex items-center justify-between"
          style={{ background: `${pageInfo.color}08` }}>
          <span className="text-sm font-bold text-foreground">পেজের মূল তথ্য</span>
          <a href={pageInfo.path} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
            <ExternalLink size={12} /> পেজ দেখুন
          </a>
        </div>
        <div className="p-5 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">পেজ টাইটেল</label>
            <input
              className="w-full text-sm rounded-xl border border-border bg-background px-3.5 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition"
              value={working.title}
              onChange={e => update({ title: e.target.value })}
              placeholder="পেজের নাম"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">ব্যাজ লেবেল</label>
            <input
              className="w-full text-sm rounded-xl border border-border bg-background px-3.5 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition"
              value={working.badge}
              onChange={e => update({ badge: e.target.value })}
              placeholder="যেমন: Legal Document"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">সাবটাইটেল / বিবরণ</label>
            <textarea
              className="w-full text-sm rounded-xl border border-border bg-background px-3.5 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition resize-none"
              rows={2}
              value={working.subtitle}
              onChange={e => update({ subtitle: e.target.value })}
              placeholder="পেজের সংক্ষিপ্ত বিবরণ..."
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {working.sections.map((sec, idx) => (
          <div key={sec.id} className="rounded-2xl border border-border/60 overflow-hidden"
            style={{ boxShadow: '0 2px 10px hsla(226,35%,12%,0.04)' }}>
            <div className="px-5 py-3 border-b border-border/40 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                  style={{ background: pageInfo.color }}>{idx + 1}</span>
                <input
                  className="text-sm font-bold bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground min-w-0 w-full"
                  value={sec.title}
                  onChange={e => updateSection(sec.id, { title: e.target.value })}
                  placeholder="সেকশনের নাম..."
                />
              </div>
              <button onClick={() => deleteSection(sec.id)}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
            <div className="p-4">
              <textarea
                className="w-full text-sm rounded-xl border border-border bg-background px-3.5 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition resize-y leading-relaxed"
                rows={5}
                value={sec.body}
                onChange={e => updateSection(sec.id, { body: e.target.value })}
                placeholder="এই সেকশনের কন্টেন্ট লিখুন...&#10;&#10;• বুলেট পয়েন্টের জন্য • ব্যবহার করুন&#10;• প্রতিটি লাইন আলাদা বুলেট হবে"
              />
              <p className="text-[11px] text-muted-foreground mt-2">
                💡 প্রতিটি লাইন আলাদা প্যারাগ্রাফ। বুলেট পয়েন্টের জন্য লাইন শুরুতে • ব্যবহার করুন।
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button onClick={addSection}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-dashed border-border hover:border-primary hover:text-primary text-muted-foreground transition-all">
          <Plus size={14} /> সেকশন যোগ করুন
        </button>
        <button
          onClick={save}
          disabled={!isDirty || saveMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
          style={{ background: isDirty ? `linear-gradient(135deg, ${pageInfo.color}, ${pageInfo.color}bb)` : 'hsl(var(--muted))', boxShadow: isDirty ? `0 4px 16px ${pageInfo.color}40` : 'none' }}>
          <Save size={14} />
          {saveMutation.isPending ? 'সেভ হচ্ছে...' : isDirty ? 'সেভ করুন' : 'পরিবর্তন নেই'}
        </button>
      </div>
    </div>
  );
};

/* ─── Main AdminPages ─── */
const AdminPages = () => {
  const qc = useQueryClient();
  const SETTINGS_KEY = 'footer_pages';

  const [activeTab, setActiveTab] = useState<'content' | 'links'>('content');
  const [selectedPage, setSelectedPage] = useState(EDITABLE_PAGES[0].key);
  const [adding, setAdding]   = useState<PageSection | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  /* ── Footer links CRUD ── */
  const { data: links = [], isLoading: linksLoading } = useQuery<PageLink[]>({
    queryKey: ['admin-pages'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('value').eq('key', SETTINGS_KEY).maybeSingle();
      if (data?.value) return JSON.parse(data.value) as PageLink[];
      return DEFAULT_LINKS.map((l, i) => ({ ...l, id: `default-${i}` }));
    },
  });

  const save = useMutation({
    mutationFn: async (updated: PageLink[]) => {
      await supabase.from('site_settings').upsert({ key: SETTINGS_KEY, value: JSON.stringify(updated), category: 'pages' }, { onConflict: 'key' });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pages'] }); toast.success('লিংক সেভ হয়েছে!'); },
    onError: () => toast.error('সেভ করতে সমস্যা হয়েছে।'),
  });

  const persist = (updated: PageLink[]) => save.mutate(updated);
  const genId   = () => `pg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const handleAdd = (section: PageSection, data: Partial<PageLink>) => {
    if (!data.label?.trim() || !data.href?.trim()) return toast.error('Label and URL are required.');
    const maxOrder = links.filter(l => l.section === section).reduce((m, l) => Math.max(m, l.sort_order), 0);
    persist([...links, { id: genId(), section, label: data.label.trim(), href: data.href.trim(), sort_order: maxOrder + 1, is_active: true }]);
    setAdding(null);
  };

  const handleEdit = (id: string, data: Partial<PageLink>) => {
    if (!data.label?.trim() || !data.href?.trim()) return toast.error('Label and URL are required.');
    persist(links.map(l => l.id === id ? { ...l, ...data } : l));
    setEditing(null);
  };

  const handleDelete = (id: string) => { if (!confirm('এই লিংক মুছে ফেলবেন?')) return; persist(links.filter(l => l.id !== id)); };
  const handleToggle = (link: PageLink) => persist(links.map(l => l.id === link.id ? { ...l, is_active: !l.is_active } : l));

  const infoLinks   = links.filter(l => l.section === 'information');
  const policyLinks = links.filter(l => l.section === 'policies');

  const LINK_SECTIONS = [
    { section: 'information' as PageSection, label: 'Information', icon: Info,   color: 'hsl(243,75%,65%)', links: infoLinks   },
    { section: 'policies'    as PageSection, label: 'Policies',    icon: Shield, color: 'hsl(158,64%,48%)', links: policyLinks },
  ];

  const activePage = EDITABLE_PAGES.find(p => p.key === selectedPage)!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(243,75%,65%), hsl(263,70%,62%))', boxShadow: '0 4px 16px hsla(243,75%,65%,0.35)' }}>
              <FileText size={17} className="text-white" />
            </div>
            <h1 className="font-sora font-black text-2xl text-foreground">Pages</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-11">পেজের কন্টেন্ট ও ফুটার লিংক পরিচালনা করুন।</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-2xl w-fit"
        style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
        <button
          onClick={() => setActiveTab('content')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={activeTab === 'content'
            ? { background: 'linear-gradient(135deg, hsl(243,75%,65%), hsl(263,70%,62%))', color: 'white', boxShadow: '0 4px 14px hsla(243,75%,65%,0.35)' }
            : { color: 'hsl(var(--muted-foreground))' }}>
          <Edit3 size={14} /> পেজ কন্টেন্ট
        </button>
        <button
          onClick={() => setActiveTab('links')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={activeTab === 'links'
            ? { background: 'linear-gradient(135deg, hsl(158,64%,48%), hsl(180,72%,40%))', color: 'white', boxShadow: '0 4px 14px hsla(158,64%,48%,0.35)' }
            : { color: 'hsl(var(--muted-foreground))' }}>
          <Link2 size={14} /> ফুটার লিংক
        </button>
      </div>

      {/* ── Tab: Page Content ── */}
      {activeTab === 'content' && (
        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          {/* Page list sidebar */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">পেজসমূহ</p>
            {EDITABLE_PAGES.map(page => (
              <button
                key={page.key}
                onClick={() => setSelectedPage(page.key)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all text-left"
                style={selectedPage === page.key
                  ? { background: `${page.color}14`, border: `1.5px solid ${page.color}40`, color: page.color }
                  : { background: 'transparent', border: '1.5px solid transparent', color: 'hsl(var(--foreground))' }}>
                <span className="text-base flex-shrink-0">{page.icon}</span>
                <div className="min-w-0">
                  <div className="truncate">{page.label}</div>
                  <div className="text-[10px] font-mono truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{page.path}</div>
                </div>
                {selectedPage === page.key && <ChevronRight size={14} className="ml-auto flex-shrink-0" />}
              </button>
            ))}
          </div>

          {/* Content editor */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{activePage.icon}</span>
              <div>
                <h2 className="font-sora font-bold text-lg text-foreground">{activePage.label}</h2>
                <a href={activePage.path} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                  <Globe size={10} /> {activePage.path}
                </a>
              </div>
            </div>
            <PageContentEditor key={selectedPage} pageInfo={activePage} />
          </div>
        </div>
      )}

      {/* ── Tab: Footer Links ── */}
      {activeTab === 'links' && (
        <div className="space-y-6">
          <div className="flex items-start gap-3 p-4 rounded-2xl"
            style={{ background: 'hsla(38,100%,55%,0.08)', border: '1px solid hsla(38,100%,55%,0.22)' }}>
            <ExternalLink size={15} style={{ color: 'hsl(38,100%,55%)' }} className="mt-0.5 flex-shrink-0" />
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              এই লিঙ্কগুলো ওয়েবসাইটের <strong className="text-foreground">Footer</strong> এর <em>Information</em> এবং <em>Policies</em> সেকশনে দেখা যাবে। লিঙ্ক লুকানো (Hidden) করলে ফুটারে দেখাবে না।
            </p>
          </div>

          {linksLoading ? (
            <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />)}</div>
          ) : (
            LINK_SECTIONS.map(sec => (
              <div key={sec.section} className="rounded-2xl border border-border/60 overflow-hidden"
                style={{ boxShadow: '0 2px 16px hsla(226,35%,12%,0.06)' }}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/50"
                  style={{ background: `${sec.color}08` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `${sec.color}18`, border: `1px solid ${sec.color}30` }}>
                      <sec.icon size={16} style={{ color: sec.color }} />
                    </div>
                    <div>
                      <h3 className="font-sora font-bold text-sm text-foreground">{sec.label}</h3>
                      <p className="text-[11px] text-muted-foreground">
                        {sec.links.length} links · {sec.links.filter(l => l.is_active).length} active
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setAdding(sec.section)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${sec.color}, ${sec.color}cc)`, boxShadow: `0 4px 14px ${sec.color}35` }}>
                    <Plus size={13} /> Add Link
                  </button>
                </div>

                {/* Table */}
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/20">
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[40%]">Label</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">URL / Path</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {adding === sec.section && (
                      <EditRow link={{ section: sec.section }} onSave={data => handleAdd(sec.section, data)} onCancel={() => setAdding(null)} />
                    )}
                    {sec.links.length === 0 && adding !== sec.section ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">No links yet — click "Add Link" to start.</td>
                      </tr>
                    ) : (
                      [...sec.links].sort((a, b) => a.sort_order - b.sort_order).map(link => (
                        editing === link.id ? (
                          <EditRow key={link.id} link={link} onSave={data => handleEdit(link.id, data)} onCancel={() => setEditing(null)} />
                        ) : (
                          <tr key={link.id} className="hover:bg-muted/20 transition-colors group">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <GripVertical size={13} className="text-muted-foreground/40 cursor-grab" />
                                <span className={`text-sm font-medium ${link.is_active ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                                  {link.label}
                                </span>
                                {!link.is_active && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Hidden</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <code className="text-xs font-mono text-primary bg-primary/8 px-2 py-0.5 rounded-lg">{link.href}</code>
                                <a href={link.href} target="_blank" rel="noopener noreferrer"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary">
                                  <ExternalLink size={12} />
                                </a>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={() => handleToggle(link)}
                                  className="p-1.5 rounded-lg hover:bg-muted transition-colors" title={link.is_active ? 'Hide' : 'Show'}>
                                  {link.is_active ? <Eye size={14} className="text-emerald-500" /> : <EyeOff size={14} className="text-muted-foreground" />}
                                </button>
                                <button onClick={() => setEditing(link.id)}
                                  className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                                  <Pencil size={14} />
                                </button>
                                <button onClick={() => handleDelete(link.id)}
                                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPages;
