import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, GripVertical, ExternalLink, Eye, EyeOff,
  Check, X, FileText, Edit3, Save, ChevronRight, Globe, Link2,
  Layers, Palette, ChevronUp, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import MDEditor from '@uiw/react-md-editor';
import {
  FOOTER_MENU_DEFAULTS, FOOTER_MENU_KEY,
  type FooterSection, type FooterLink,
} from '@/hooks/useFooterMenu';

/* ─── Editable pages registry ─── */
const EDITABLE_PAGES = [
  { key: 'about',           label: 'About Us',              path: '/about',           icon: '👥', color: 'hsl(258,78%,55%)' },
  { key: 'privacy',         label: 'Privacy Policy',        path: '/privacy-policy',  icon: '🔒', color: 'hsl(200,90%,45%)' },
  { key: 'terms',           label: 'Terms & Conditions',    path: '/terms-conditions',icon: '📜', color: 'hsl(38,100%,52%)' },
  { key: 'refund',          label: 'Refund Policy',         path: '/refund-policy',   icon: '💰', color: 'hsl(142,72%,38%)' },
  { key: 'order_policy',    label: 'Order & Cancellation',  path: '/order-policy',    icon: '🛒', color: 'hsl(329,86%,56%)' },
  { key: 'delivery',        label: 'Delivery Info',         path: '/delivery-info',   icon: '🚚', color: 'hsl(180,72%,40%)' },
  { key: 'return',          label: 'Return Policy',         path: '/return-policy',   icon: '↩️',  color: 'hsl(30,90%,52%)'  },
  { key: 'faqs',            label: 'FAQs',                  path: '/faqs',            icon: '❓', color: 'hsl(243,75%,65%)' },
  { key: 'contact',         label: 'Contact Us',            path: '/contact',         icon: '📞', color: 'hsl(162,72%,38%)' },
];

/* ─── Available icons for sections ─── */
const ICON_OPTIONS = ['Package', 'Info', 'FileText', 'Shield', 'Globe', 'ShoppingBag', 'BookOpen', 'HelpCircle', 'Sparkles', 'Gift', 'Tag', 'Star', 'Heart', 'Download', 'Mail', 'Phone', 'MessageCircle'];

/* ─── Available accent colors ─── */
const COLOR_OPTIONS = [
  { label: 'Purple',  value: 'hsl(258,78%,55%)' },
  { label: 'Blue',    value: 'hsl(200,90%,45%)' },
  { label: 'Green',   value: 'hsl(162,72%,38%)' },
  { label: 'Orange',  value: 'hsl(38,100%,55%)' },
  { label: 'Pink',    value: 'hsl(329,86%,56%)' },
  { label: 'Indigo',  value: 'hsl(243,75%,65%)' },
  { label: 'Cyan',    value: 'hsl(180,72%,40%)' },
  { label: 'Red',     value: 'hsl(0,75%,55%)' },
];

interface ContentSection { id: string; title: string; body: string; }
interface PageContent { pageKey: string; title: string; subtitle: string; badge: string; sections: ContentSection[]; }

/* ─── Inline edit row for links ─── */
const LinkEditRow = ({ link, onSave, onCancel }: {
  link: Partial<FooterLink>;
  onSave: (data: Partial<FooterLink>) => void;
  onCancel: () => void;
}) => {
  const [label, setLabel]       = useState(link.label ?? '');
  const [href, setHref]         = useState(link.href ?? '');
  const [external, setExternal] = useState(link.external ?? false);
  return (
    <tr className="bg-primary/5">
      <td className="px-4 py-3">
        <input className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:border-primary"
          value={label} onChange={e => setLabel(e.target.value)} placeholder="Link label" />
      </td>
      <td className="px-4 py-3">
        <input className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:border-primary font-mono"
          value={href} onChange={e => setHref(e.target.value)} placeholder="/page-path or https://..." />
        <label className="flex items-center gap-1.5 mt-1.5 text-[11px] text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={external} onChange={e => setExternal(e.target.checked)}
            className="rounded border-border" />
          Open in new tab (external)
        </label>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => onSave({ label, href, external })}
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

/* ─── Page Content Editor (Markdown) ─── */
const PageContentEditor = ({ pageInfo }: { pageInfo: typeof EDITABLE_PAGES[0] }) => {
  const qc = useQueryClient();
  const CONTENT_KEY = `page_content_${pageInfo.key}`;

  const { data: content, isLoading } = useQuery<PageContent>({
    queryKey: ['page-content', pageInfo.key],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('value').eq('key', CONTENT_KEY).maybeSingle();
      if (data?.value) {
        try { return JSON.parse(data.value) as PageContent; } catch { /* */ }
      }
      return {
        pageKey: pageInfo.key, title: pageInfo.label, subtitle: '', badge: pageInfo.label,
        sections: [{ id: 'sec-1', title: 'First Section', body: '## Heading\n\nWrite content here. **Bold**, *italic*, [links](https://example.com), lists supported.\n\n- Bullet 1\n- Bullet 2' }],
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
      toast.success(`${pageInfo.label} saved!`);
    },
    onError: () => toast.error('Save failed.'),
  });

  const [local, setLocal] = useState<PageContent | null>(null);
  const working = local ?? content;

  const update = (patch: Partial<PageContent>) => working && setLocal({ ...working, ...patch });
  const updateSection = (id: string, patch: Partial<ContentSection>) =>
    working && setLocal({ ...working, sections: working.sections.map(s => s.id === id ? { ...s, ...patch } : s) });
  const addSection = () =>
    working && setLocal({ ...working, sections: [...working.sections, { id: `sec-${Date.now()}`, title: 'New Section', body: '' }] });
  const deleteSection = (id: string) =>
    working && setLocal({ ...working, sections: working.sections.filter(s => s.id !== id) });
  const moveSection = (idx: number, dir: -1 | 1) => {
    if (!working) return;
    const next = [...working.sections];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setLocal({ ...working, sections: next });
  };

  const save = () => { if (!working) return; saveMutation.mutate(working); setLocal(null); };

  if (isLoading) return <div className="h-32 rounded-2xl bg-muted animate-pulse" />;
  if (!working) return null;

  const isDirty = local !== null;

  return (
    <div className="space-y-4">
      {/* Header meta */}
      <div className="rounded-2xl border border-border/60 overflow-hidden" style={{ boxShadow: '0 2px 16px hsla(226,35%,12%,0.06)' }}>
        <div className="px-5 py-3.5 border-b border-border/40 flex items-center justify-between" style={{ background: `${pageInfo.color}08` }}>
          <span className="text-sm font-bold text-foreground">Page Meta</span>
          <a href={pageInfo.path} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
            <ExternalLink size={12} /> View Page
          </a>
        </div>
        <div className="p-5 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Page Title</label>
            <input className="w-full text-sm rounded-xl border border-border bg-background px-3.5 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition"
              value={working.title} onChange={e => update({ title: e.target.value })} placeholder="Page name" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Badge Label</label>
            <input className="w-full text-sm rounded-xl border border-border bg-background px-3.5 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition"
              value={working.badge} onChange={e => update({ badge: e.target.value })} placeholder="e.g. Legal Document" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Subtitle / Description</label>
            <textarea className="w-full text-sm rounded-xl border border-border bg-background px-3.5 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition resize-none"
              rows={2} value={working.subtitle} onChange={e => update({ subtitle: e.target.value })}
              placeholder="Short page description..." />
          </div>
        </div>
      </div>

      {/* Sections — Markdown editor */}
      <div className="space-y-3">
        {working.sections.map((sec, idx) => (
          <div key={sec.id} className="rounded-2xl border border-border/60 overflow-hidden" style={{ boxShadow: '0 2px 10px hsla(226,35%,12%,0.04)' }}>
            <div className="px-4 py-2.5 border-b border-border/40 flex items-center justify-between bg-muted/20 gap-2">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                  style={{ background: pageInfo.color }}>{idx + 1}</span>
                <input className="text-sm font-bold bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground min-w-0 w-full"
                  value={sec.title} onChange={e => updateSection(sec.id, { title: e.target.value })} placeholder="Section title..." />
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button onClick={() => moveSection(idx, -1)} disabled={idx === 0}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronUp size={13} />
                </button>
                <button onClick={() => moveSection(idx, 1)} disabled={idx === working.sections.length - 1}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronDown size={13} />
                </button>
                <button onClick={() => deleteSection(sec.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="p-3" data-color-mode="light">
              <MDEditor value={sec.body} onChange={(v) => updateSection(sec.id, { body: v ?? '' })}
                height={260} preview="edit" hideToolbar={false} />
              <p className="text-[11px] text-muted-foreground mt-2">
                💡 Markdown supported — **bold**, *italic*, ## heading, - bullets, [links](url), images.
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={addSection}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-dashed border-border hover:border-primary hover:text-primary text-muted-foreground transition-all">
          <Plus size={14} /> Add Section
        </button>
        <button onClick={save} disabled={!isDirty || saveMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
          style={{ background: isDirty ? `linear-gradient(135deg, ${pageInfo.color}, ${pageInfo.color}bb)` : 'hsl(var(--muted))', boxShadow: isDirty ? `0 4px 16px ${pageInfo.color}40` : 'none' }}>
          <Save size={14} />
          {saveMutation.isPending ? 'Saving...' : isDirty ? 'Save Changes' : 'No Changes'}
        </button>
      </div>
    </div>
  );
};

/* ─── Main AdminPages ─── */
const AdminPages = () => {
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'content' | 'menu'>('menu');
  const [selectedPage, setSelectedPage] = useState(EDITABLE_PAGES[0].key);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [addingLinkTo, setAddingLinkTo] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<string | null>(null);

  /* ─── Footer menu (sections + links) ─── */
  const { data: sections = FOOTER_MENU_DEFAULTS, isLoading: menuLoading } = useQuery<FooterSection[]>({
    queryKey: ['footer-menu'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('value').eq('key', FOOTER_MENU_KEY).maybeSingle();
      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value) as FooterSection[];
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch { /* */ }
      }
      return FOOTER_MENU_DEFAULTS;
    },
  });

  const saveMenu = useMutation({
    mutationFn: async (updated: FooterSection[]) => {
      await supabase.from('site_settings').upsert(
        { key: FOOTER_MENU_KEY, value: JSON.stringify(updated), category: 'store' },
        { onConflict: 'key' }
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['footer-menu'] });
      toast.success('Footer menu saved!');
    },
    onError: () => toast.error('Save failed.'),
  });

  const persist = (next: FooterSection[]) => saveMenu.mutate(next);
  const genId = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  /* Section handlers */
  const addNewSection = () => {
    const maxOrder = sections.reduce((m, s) => Math.max(m, s.sort_order), 0);
    persist([...sections, {
      id: genId('sec'), title: 'New Section', icon: 'Info',
      accent: COLOR_OPTIONS[0].value, is_active: true, sort_order: maxOrder + 1, links: [],
    }]);
  };
  const updateSection = (id: string, patch: Partial<FooterSection>) =>
    persist(sections.map(s => s.id === id ? { ...s, ...patch } : s));
  const deleteSection = (id: string) => {
    if (!confirm('Delete this entire section and all its links?')) return;
    persist(sections.filter(s => s.id !== id));
  };
  const moveSection = (idx: number, dir: -1 | 1) => {
    const sorted = [...sections].sort((a, b) => a.sort_order - b.sort_order);
    const target = idx + dir;
    if (target < 0 || target >= sorted.length) return;
    [sorted[idx], sorted[target]] = [sorted[target], sorted[idx]];
    persist(sorted.map((s, i) => ({ ...s, sort_order: i + 1 })));
  };

  /* Link handlers */
  const addLink = (sectionId: string, data: Partial<FooterLink>) => {
    if (!data.label?.trim() || !data.href?.trim()) return toast.error('Label and URL are required.');
    persist(sections.map(s => s.id === sectionId ? {
      ...s, links: [...s.links, {
        id: genId('lnk'), label: data.label!.trim(), href: data.href!.trim(),
        external: data.external ?? false, is_active: true,
        sort_order: s.links.reduce((m, l) => Math.max(m, l.sort_order), 0) + 1,
      }],
    } : s));
    setAddingLinkTo(null);
  };
  const editLink = (sectionId: string, linkId: string, data: Partial<FooterLink>) => {
    if (!data.label?.trim() || !data.href?.trim()) return toast.error('Label and URL are required.');
    persist(sections.map(s => s.id === sectionId ? {
      ...s, links: s.links.map(l => l.id === linkId ? { ...l, ...data } : l),
    } : s));
    setEditingLink(null);
  };
  const deleteLink = (sectionId: string, linkId: string) => {
    if (!confirm('Delete this link?')) return;
    persist(sections.map(s => s.id === sectionId ? { ...s, links: s.links.filter(l => l.id !== linkId) } : s));
  };
  const toggleLink = (sectionId: string, linkId: string) =>
    persist(sections.map(s => s.id === sectionId ? {
      ...s, links: s.links.map(l => l.id === linkId ? { ...l, is_active: !l.is_active } : l),
    } : s));

  const sortedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order);
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
            <h1 className="font-sora font-black text-2xl text-foreground">Pages & Footer</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-11">Manage page content and the entire footer menu structure.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-2xl w-fit"
        style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
        <button onClick={() => setActiveTab('menu')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={activeTab === 'menu'
            ? { background: 'linear-gradient(135deg, hsl(158,64%,48%), hsl(180,72%,40%))', color: 'white', boxShadow: '0 4px 14px hsla(158,64%,48%,0.35)' }
            : { color: 'hsl(var(--muted-foreground))' }}>
          <Layers size={14} /> Footer Menu
        </button>
        <button onClick={() => setActiveTab('content')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={activeTab === 'content'
            ? { background: 'linear-gradient(135deg, hsl(243,75%,65%), hsl(263,70%,62%))', color: 'white', boxShadow: '0 4px 14px hsla(243,75%,65%,0.35)' }
            : { color: 'hsl(var(--muted-foreground))' }}>
          <Edit3 size={14} /> Page Content
        </button>
      </div>

      {/* ── TAB: Footer Menu (fully dynamic) ── */}
      {activeTab === 'menu' && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-4 rounded-2xl"
            style={{ background: 'hsla(38,100%,55%,0.08)', border: '1px solid hsla(38,100%,55%,0.22)' }}>
            <Link2 size={15} style={{ color: 'hsl(38,100%,55%)' }} className="mt-0.5 flex-shrink-0" />
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Add, rename, reorder, hide, or delete footer sections and any link inside them. Changes appear on the live website immediately.
            </p>
          </div>

          {menuLoading ? (
            <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />)}</div>
          ) : (
            <>
              {sortedSections.map((sec, idx) => (
                <div key={sec.id} className="rounded-2xl border border-border/60 overflow-hidden"
                  style={{ boxShadow: '0 2px 16px hsla(226,35%,12%,0.06)' }}>
                  {/* Section header */}
                  <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between gap-3 flex-wrap"
                    style={{ background: `${sec.accent}08` }}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${sec.accent}18`, border: `1px solid ${sec.accent}30`, color: sec.accent }}>
                        <Layers size={16} />
                      </div>
                      <div className="min-w-0">
                        {editingSection === sec.id ? (
                          <input autoFocus className="text-sm font-bold bg-background border border-primary rounded-lg px-2 py-1 outline-none"
                            value={sec.title}
                            onChange={e => updateSection(sec.id, { title: e.target.value })}
                            onBlur={() => setEditingSection(null)}
                            onKeyDown={e => e.key === 'Enter' && setEditingSection(null)} />
                        ) : (
                          <button onClick={() => setEditingSection(sec.id)}
                            className={`text-sm font-bold text-foreground hover:text-primary text-left ${!sec.is_active ? 'line-through opacity-50' : ''}`}>
                            {sec.title || '(untitled)'}
                          </button>
                        )}
                        <p className="text-[11px] text-muted-foreground">{sec.links.length} links · {sec.links.filter(l => l.is_active).length} active</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => moveSection(idx, -1)} disabled={idx === 0}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors disabled:opacity-30">
                        <ChevronUp size={14} />
                      </button>
                      <button onClick={() => moveSection(idx, 1)} disabled={idx === sortedSections.length - 1}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors disabled:opacity-30">
                        <ChevronDown size={14} />
                      </button>
                      <button onClick={() => updateSection(sec.id, { is_active: !sec.is_active })}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors" title={sec.is_active ? 'Hide section' : 'Show section'}>
                        {sec.is_active ? <Eye size={14} className="text-emerald-500" /> : <EyeOff size={14} />}
                      </button>
                      <button onClick={() => deleteSection(sec.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 size={14} />
                      </button>
                      <button onClick={() => setAddingLinkTo(sec.id)}
                        className="ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105"
                        style={{ background: `linear-gradient(135deg, ${sec.accent}, ${sec.accent}cc)`, boxShadow: `0 4px 14px ${sec.accent}35` }}>
                        <Plus size={12} /> Add Link
                      </button>
                    </div>
                  </div>

                  {/* Section settings row */}
                  <div className="px-5 py-3 border-b border-border/40 bg-muted/20 grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Icon</label>
                      <select value={sec.icon} onChange={e => updateSection(sec.id, { icon: e.target.value })}
                        className="w-full text-xs rounded-lg border border-border bg-background px-2.5 py-1.5 focus:outline-none focus:border-primary">
                        {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1 flex items-center gap-1">
                        <Palette size={10} /> Accent Color
                      </label>
                      <div className="flex gap-1.5 flex-wrap">
                        {COLOR_OPTIONS.map(c => (
                          <button key={c.value} onClick={() => updateSection(sec.id, { accent: c.value })}
                            title={c.label}
                            className="w-6 h-6 rounded-md transition-all hover:scale-110"
                            style={{
                              background: c.value,
                              border: sec.accent === c.value ? '2px solid hsl(var(--foreground))' : '2px solid transparent',
                              boxShadow: sec.accent === c.value ? `0 0 0 2px hsl(var(--background)), 0 0 0 3px ${c.value}` : 'none',
                            }} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Links table */}
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/10">
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[35%]">Label</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">URL / Path</th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {addingLinkTo === sec.id && (
                        <LinkEditRow link={{}} onSave={data => addLink(sec.id, data)} onCancel={() => setAddingLinkTo(null)} />
                      )}
                      {sec.links.length === 0 && addingLinkTo !== sec.id ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">No links — click "Add Link" to start.</td>
                        </tr>
                      ) : (
                        [...sec.links].sort((a, b) => a.sort_order - b.sort_order).map(link => (
                          editingLink === link.id ? (
                            <LinkEditRow key={link.id} link={link}
                              onSave={data => editLink(sec.id, link.id, data)}
                              onCancel={() => setEditingLink(null)} />
                          ) : (
                            <tr key={link.id} className="hover:bg-muted/20 transition-colors group">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <GripVertical size={13} className="text-muted-foreground/40" />
                                  <span className={`text-sm font-medium ${link.is_active ? 'text-foreground' : 'text-muted-foreground line-through'}`}>{link.label}</span>
                                  {!link.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Hidden</span>}
                                  {link.external && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-medium">External</span>}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <code className="text-xs font-mono text-primary bg-primary/8 px-2 py-0.5 rounded-lg truncate max-w-[220px]">{link.href}</code>
                                  <a href={link.href} target="_blank" rel="noopener noreferrer"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary flex-shrink-0">
                                    <ExternalLink size={12} />
                                  </a>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button onClick={() => toggleLink(sec.id, link.id)}
                                    className="p-1.5 rounded-lg hover:bg-muted transition-colors" title={link.is_active ? 'Hide' : 'Show'}>
                                    {link.is_active ? <Eye size={14} className="text-emerald-500" /> : <EyeOff size={14} className="text-muted-foreground" />}
                                  </button>
                                  <button onClick={() => setEditingLink(link.id)}
                                    className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                                    <Pencil size={14} />
                                  </button>
                                  <button onClick={() => deleteLink(sec.id, link.id)}
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
              ))}

              {/* Add new section */}
              <button onClick={addNewSection}
                className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl text-sm font-bold border-2 border-dashed border-border hover:border-primary hover:text-primary text-muted-foreground transition-all hover:bg-primary/5">
                <Plus size={16} /> Add New Footer Section
              </button>
            </>
          )}
        </div>
      )}

      {/* ── TAB: Page Content (Markdown editor) ── */}
      {activeTab === 'content' && (
        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          {/* Page list sidebar */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Pages</p>
            {EDITABLE_PAGES.map(page => (
              <button key={page.key} onClick={() => setSelectedPage(page.key)}
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
    </div>
  );
};

export default AdminPages;
