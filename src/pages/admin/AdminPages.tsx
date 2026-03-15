import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, GripVertical, ExternalLink, Eye, EyeOff, Check, X, FileText, Info, Shield } from 'lucide-react';
import { toast } from 'sonner';

/* ─── Types ─────────────────────────────────────────────────── */
type PageSection = 'information' | 'policies';

interface PageLink {
  id: string;
  section: PageSection;
  label: string;
  href: string;
  sort_order: number;
  is_active: boolean;
}

/* ─── Default data (Information + Policies from footer) ──────── */
const DEFAULT_LINKS: Omit<PageLink, 'id'>[] = [
  // Information
  { section: 'information', label: 'FAQs',          href: '/help',      sort_order: 1, is_active: true },
  { section: 'information', label: 'Help Center',   href: '/help',      sort_order: 2, is_active: true },
  { section: 'information', label: 'About Us',      href: '/about',     sort_order: 3, is_active: true },
  { section: 'information', label: 'My Account',    href: '/dashboard', sort_order: 4, is_active: true },
  { section: 'information', label: 'Contact Us',    href: '/contact',   sort_order: 5, is_active: true },
  { section: 'information', label: 'All Products',  href: '/shop',      sort_order: 6, is_active: true },
  // Policies
  { section: 'policies', label: 'Privacy Policy',        href: '/privacy-policy',   sort_order: 1, is_active: true },
  { section: 'policies', label: 'Terms & Conditions',    href: '/terms-conditions', sort_order: 2, is_active: true },
  { section: 'policies', label: 'Refund & Return Policy',href: '/refund-policy',    sort_order: 3, is_active: true },
  { section: 'policies', label: 'Order & Cancellation',  href: '/order-policy',     sort_order: 4, is_active: true },
  { section: 'policies', label: 'Delivery Info',         href: '/delivery-info',    sort_order: 5, is_active: true },
  { section: 'policies', label: 'Return Policy',         href: '/return-policy',    sort_order: 6, is_active: true },
];

/* ─── Inline edit row ─────────────────────────────────────────── */
const EditRow = ({
  link,
  onSave,
  onCancel,
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
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Link label"
        />
      </td>
      <td className="px-4 py-3">
        <input
          className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:border-primary font-mono"
          value={href}
          onChange={e => setHref(e.target.value)}
          placeholder="/page-path"
        />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onSave({ label, href })}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, hsl(243,75%,65%), hsl(263,70%,62%))' }}
          >
            <Check size={13} />
          </button>
          <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-xs bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
            <X size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
};

/* ─── Section panel ───────────────────────────────────────────── */
const SectionPanel = ({
  section,
  label,
  icon: Icon,
  color,
  links,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
}: {
  section: PageSection;
  label: string;
  icon: React.ElementType;
  color: string;
  links: PageLink[];
  onAdd: (section: PageSection) => void;
  onEdit: (link: PageLink) => void;
  onDelete: (id: string) => void;
  onToggle: (link: PageLink) => void;
}) => {
  const sorted = [...links].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="rounded-2xl border border-border/60 overflow-hidden"
      style={{ boxShadow: '0 2px 16px hsla(226,35%,12%,0.06)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50"
        style={{ background: `${color}08` }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
            <Icon size={16} style={{ color }} />
          </div>
          <div>
            <h3 className="font-sora font-bold text-sm text-foreground">{label}</h3>
            <p className="text-[11px] text-muted-foreground">{sorted.length} links · {sorted.filter(l => l.is_active).length} active</p>
          </div>
        </div>
        <button
          onClick={() => onAdd(section)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 4px 14px ${color}35` }}
        >
          <Plus size={13} /> Add Link
        </button>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/40 bg-muted/20">
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Label</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">URL / Path</th>
            <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">
                No links yet — click "Add Link" to start.
              </td>
            </tr>
          ) : (
            sorted.map(link => (
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
                    <button onClick={() => onToggle(link)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      title={link.is_active ? 'Hide' : 'Show'}>
                      {link.is_active
                        ? <Eye size={14} className="text-emerald-500" />
                        : <EyeOff size={14} className="text-muted-foreground" />}
                    </button>
                    <button onClick={() => onEdit(link)}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => onDelete(link.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

/* ─── Main page ───────────────────────────────────────────────── */
const AdminPages = () => {
  const qc = useQueryClient();

  // We store pages data in site_settings as JSON (key = 'footer_pages')
  const SETTINGS_KEY = 'footer_pages';

  const { data: links = [], isLoading } = useQuery<PageLink[]>({
    queryKey: ['admin-pages'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', SETTINGS_KEY)
        .maybeSingle();
      if (data?.value) return JSON.parse(data.value) as PageLink[];
      // auto-seed defaults into DB
      const seeded: PageLink[] = DEFAULT_LINKS.map((l, i) => ({ ...l, id: `default-${i}` }));
      await supabase.from('site_settings').upsert(
        { key: SETTINGS_KEY, value: JSON.stringify(seeded), category: 'pages' },
        { onConflict: 'key' }
      );
      return seeded;
    },
  });

  const save = useMutation({
    mutationFn: async (updated: PageLink[]) => {
      await supabase.from('site_settings').upsert(
        { key: SETTINGS_KEY, value: JSON.stringify(updated), category: 'pages' },
        { onConflict: 'key' }
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pages'] });
      qc.invalidateQueries({ queryKey: ['footer-pages'] });
      toast.success('সেভ হয়েছে!');
    },
    onError: () => toast.error('সেভ করতে ব্যর্থ।'),
  });

  const persist = (updated: PageLink[]) => save.mutate(updated);

  const handleReset = () => {
    if (!confirm('সকল লিঙ্ক ডিফল্টে রিসেট করবেন?')) return;
    const seeded: PageLink[] = DEFAULT_LINKS.map((l, i) => ({ ...l, id: `default-${i}` }));
    persist(seeded);
  };

  // editing state
  const [adding, setAdding]   = useState<PageSection | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const genId = () => `pg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const handleAdd = (section: PageSection, data: Partial<PageLink>) => {
    if (!data.label?.trim() || !data.href?.trim()) return toast.error('Label and URL are required.');
    const maxOrder = links.filter(l => l.section === section).reduce((m, l) => Math.max(m, l.sort_order), 0);
    const newLink: PageLink = {
      id: genId(),
      section,
      label: data.label.trim(),
      href: data.href.trim(),
      sort_order: maxOrder + 1,
      is_active: true,
    };
    persist([...links, newLink]);
    setAdding(null);
  };

  const handleEdit = (id: string, data: Partial<PageLink>) => {
    if (!data.label?.trim() || !data.href?.trim()) return toast.error('Label and URL are required.');
    persist(links.map(l => l.id === id ? { ...l, ...data } : l));
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this link?')) return;
    persist(links.filter(l => l.id !== id));
  };

  const handleToggle = (link: PageLink) => {
    persist(links.map(l => l.id === link.id ? { ...l, is_active: !l.is_active } : l));
  };

  const infoLinks    = links.filter(l => l.section === 'information');
  const policyLinks  = links.filter(l => l.section === 'policies');

  const SECTIONS = [
    { section: 'information' as PageSection, label: 'Information',  icon: Info,       color: 'hsl(243,75%,65%)',  links: infoLinks  },
    { section: 'policies'    as PageSection, label: 'Policies',     icon: Shield,     color: 'hsl(158,64%,48%)',  links: policyLinks },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(243,75%,65%), hsl(263,70%,62%))', boxShadow: '0 4px 16px hsla(243,75%,65%,0.35)' }}>
              <FileText size={17} className="text-white" />
            </div>
            <h1 className="font-sora font-black text-2xl text-foreground">Pages</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-11">
            Manage footer navigation links for Information & Policies sections.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ background: 'hsla(243,75%,65%,0.08)', border: '1px solid hsla(243,75%,65%,0.18)' }}>
            <span className="text-xs font-medium text-muted-foreground">মোট লিঙ্ক:</span>
            <span className="text-sm font-bold" style={{ color: 'hsl(243,75%,65%)' }}>{links.length}</span>
          </div>
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border transition-all hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            style={{ borderColor: 'hsla(0,0%,0%,0.12)', color: 'hsl(226,25%,45%)' }}
          >
            ↺ Reset to Default
          </button>
        </div>
      </div>

      {/* Preview hint */}
      <div className="flex items-start gap-3 p-4 rounded-2xl"
        style={{ background: 'hsla(38,100%,55%,0.08)', border: '1px solid hsla(38,100%,55%,0.22)' }}>
        <ExternalLink size={15} style={{ color: 'hsl(38,100%,55%)' }} className="mt-0.5 flex-shrink-0" />
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          এই লিঙ্কগুলো ওয়েবসাইটের <strong className="text-foreground">Footer</strong> এর <em>Information</em> এবং <em>Policies</em> সেকশনে দেখা যাবে।
          লিঙ্ক লুকানো (Hidden) করলে ফুটারে দেখাবে না।
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {SECTIONS.map(sec => (
            <div key={sec.section}>
              {/* Add row for this section */}
              <div className="rounded-2xl border border-border/60 overflow-hidden"
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
                  <button
                    onClick={() => setAdding(sec.section)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${sec.color}, ${sec.color}cc)`, boxShadow: `0 4px 14px ${sec.color}35` }}
                  >
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

                    {/* Add new row */}
                    {adding === sec.section && (
                      <EditRow
                        link={{ section: sec.section }}
                        onSave={data => handleAdd(sec.section, data)}
                        onCancel={() => setAdding(null)}
                      />
                    )}

                    {sec.links.length === 0 && adding !== sec.section ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">
                          No links yet — click "Add Link" to start.
                        </td>
                      </tr>
                    ) : (
                      [...sec.links].sort((a, b) => a.sort_order - b.sort_order).map(link => (
                        editing === link.id ? (
                          <EditRow
                            key={link.id}
                            link={link}
                            onSave={data => handleEdit(link.id, data)}
                            onCancel={() => setEditing(null)}
                          />
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
                                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                  title={link.is_active ? 'Hide' : 'Show'}>
                                  {link.is_active
                                    ? <Eye size={14} className="text-emerald-500" />
                                    : <EyeOff size={14} className="text-muted-foreground" />}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPages;
