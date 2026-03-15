import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Plus, Trash2, Edit, X, Save, Loader2, Tags, ChevronDown,
  ChevronRight, Hash, Tag, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ────────────────────────────────────────────────────────
interface GlobalAttribute {
  id: string;
  name: string;
  slug: string;
  type: 'select' | 'text' | 'color';
  order_by: string;
  has_archives: boolean;
  sort_order: number;
  values?: GlobalAttributeValue[];
}

interface GlobalAttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  slug: string;
  description: string | null;
  color_code: string | null;
  sort_order: number;
}

// ── Helpers ──────────────────────────────────────────────────────
const ic = 'w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground';
const lc = 'text-xs text-muted-foreground mb-1 block font-medium';

const toSlug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const ATTR_TYPES = [
  { value: 'select', label: '🔘 Select (dropdown)' },
  { value: 'text',   label: '📝 Text' },
  { value: 'color',  label: '🎨 Color Swatch' },
];

const ORDER_BY = [
  { value: 'name',     label: 'Name' },
  { value: 'name_num', label: 'Name (numeric)' },
  { value: 'id',       label: 'Term ID' },
  { value: 'custom',   label: 'Custom order' },
];

// ════════════════════════════════════════════════════════════════
const AdminAttributes = () => {
  const [attrs, setAttrs] = useState<GlobalAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Attribute form
  const [showAttrForm, setShowAttrForm] = useState(false);
  const [editingAttr, setEditingAttr] = useState<GlobalAttribute | null>(null);
  const [attrForm, setAttrForm] = useState({ name: '', slug: '', type: 'select', order_by: 'name', has_archives: false });
  const [savingAttr, setSavingAttr] = useState(false);

  // Value form
  const [showValForm, setShowValForm] = useState<string | null>(null); // attribute id
  const [editingVal, setEditingVal] = useState<GlobalAttributeValue | null>(null);
  const [valForm, setValForm] = useState({ value: '', slug: '', description: '', color_code: '' });
  const [savingVal, setSavingVal] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('global_attributes' as any)
      .select('*, global_attribute_values(*)')
      .order('sort_order');
    if (data) {
      setAttrs((data as any[]).map(a => ({
        ...a,
        values: (a.global_attribute_values || []).sort((x: any, y: any) => x.sort_order - y.sort_order),
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Attribute CRUD ───────────────────────────────────────────
  const openNewAttr = () => {
    setEditingAttr(null);
    setAttrForm({ name: '', slug: '', type: 'select', order_by: 'name', has_archives: false });
    setShowAttrForm(true);
  };

  const openEditAttr = (a: GlobalAttribute) => {
    setEditingAttr(a);
    setAttrForm({ name: a.name, slug: a.slug, type: a.type, order_by: a.order_by, has_archives: a.has_archives });
    setShowAttrForm(true);
  };

  const saveAttr = async () => {
    if (!attrForm.name.trim()) { toast.error('Name is required'); return; }
    setSavingAttr(true);
    const payload = {
      name: attrForm.name.trim(),
      slug: attrForm.slug.trim() || toSlug(attrForm.name),
      type: attrForm.type,
      order_by: attrForm.order_by,
      has_archives: attrForm.has_archives,
      sort_order: editingAttr ? editingAttr.sort_order : attrs.length,
    };
    try {
      if (editingAttr) {
        const { error } = await supabase.from('global_attributes' as any).update(payload).eq('id', editingAttr.id);
        if (error) throw error;
        toast.success('Attribute updated');
      } else {
        const { error } = await supabase.from('global_attributes' as any).insert(payload);
        if (error) throw error;
        toast.success('Attribute created');
      }
      setShowAttrForm(false);
      fetchAll();
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingAttr(false); }
  };

  const deleteAttr = async (id: string) => {
    if (!confirm('Delete this attribute and all its values?')) return;
    const { error } = await supabase.from('global_attributes' as any).delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Attribute deleted'); fetchAll(); }
  };

  // ── Value CRUD ───────────────────────────────────────────────
  const openNewVal = (attrId: string) => {
    setEditingVal(null);
    setValForm({ value: '', slug: '', description: '', color_code: '' });
    setShowValForm(attrId);
  };

  const openEditVal = (v: GlobalAttributeValue) => {
    setEditingVal(v);
    setValForm({ value: v.value, slug: v.slug, description: v.description || '', color_code: v.color_code || '' });
    setShowValForm(v.attribute_id);
  };

  const saveVal = async () => {
    if (!valForm.value.trim() || !showValForm) { toast.error('Value is required'); return; }
    setSavingVal(true);
    const payload = {
      attribute_id: showValForm,
      value: valForm.value.trim(),
      slug: valForm.slug.trim() || toSlug(valForm.value),
      description: valForm.description || null,
      color_code: valForm.color_code || null,
      sort_order: editingVal ? editingVal.sort_order : (attrs.find(a => a.id === showValForm)?.values?.length || 0),
    };
    try {
      if (editingVal) {
        const { error } = await supabase.from('global_attribute_values' as any).update(payload).eq('id', editingVal.id);
        if (error) throw error;
        toast.success('Value updated');
      } else {
        const { error } = await supabase.from('global_attribute_values' as any).insert(payload);
        if (error) throw error;
        toast.success('Value added');
      }
      setShowValForm(null);
      fetchAll();
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingVal(false); }
  };

  const deleteVal = async (id: string) => {
    if (!confirm('Delete this value?')) return;
    const { error } = await supabase.from('global_attribute_values' as any).delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Value deleted'); fetchAll(); }
  };

  const currentAttrType = editingAttr?.type || attrForm.type;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Product <span className="gradient-text">Attributes</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Define global attributes like Color, Size, Platform — reuse them across products
          </p>
        </div>
        <button
          onClick={openNewAttr}
          className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold"
        >
          <Plus size={16} /> Add Attribute
        </button>
      </div>

      {/* Attribute form modal */}
      {showAttrForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">{editingAttr ? 'Edit' : 'New'} Attribute</h2>
              <button onClick={() => setShowAttrForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>

            <div>
              <label className={lc}>Name *</label>
              <input value={attrForm.name}
                onChange={e => setAttrForm(p => ({ ...p, name: e.target.value, slug: toSlug(e.target.value) }))}
                placeholder="e.g. Color, Size, Platform" className={ic} />
            </div>
            <div>
              <label className={lc}>Slug</label>
              <input value={attrForm.slug}
                onChange={e => setAttrForm(p => ({ ...p, slug: e.target.value }))}
                placeholder="auto-generated" className={ic} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lc}>Type</label>
                <select value={attrForm.type} onChange={e => setAttrForm(p => ({ ...p, type: e.target.value as any }))} className={ic}>
                  {ATTR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className={lc}>Order By</label>
                <select value={attrForm.order_by} onChange={e => setAttrForm(p => ({ ...p, order_by: e.target.value }))} className={ic}>
                  {ORDER_BY.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={attrForm.has_archives}
                onChange={e => setAttrForm(p => ({ ...p, has_archives: e.target.checked }))}
                className="w-4 h-4 accent-primary" />
              <span className="text-sm text-foreground">Enable archives / filtering page</span>
            </label>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAttrForm(false)} className="flex-1 glass-card py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={saveAttr} disabled={savingAttr} className="flex-1 btn-glow py-2.5 rounded-xl text-sm font-semibold">
                {savingAttr ? <Loader2 size={14} className="animate-spin mx-auto" /> : <><Save size={14} className="inline mr-1" />{editingAttr ? 'Update' : 'Create'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Value form modal */}
      {showValForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">{editingVal ? 'Edit' : 'Add'} Value</h2>
              <button onClick={() => setShowValForm(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>

            <div>
              <label className={lc}>Value *</label>
              <input value={valForm.value}
                onChange={e => setValForm(p => ({ ...p, value: e.target.value, slug: toSlug(e.target.value) }))}
                placeholder="e.g. Red, Windows, 1 Year" className={ic} />
            </div>
            <div>
              <label className={lc}>Slug</label>
              <input value={valForm.slug}
                onChange={e => setValForm(p => ({ ...p, slug: e.target.value }))}
                placeholder="auto-generated" className={ic} />
            </div>
            <div>
              <label className={lc}>Description <span className="opacity-50">(optional)</span></label>
              <input value={valForm.description}
                onChange={e => setValForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Brief description..." className={ic} />
            </div>
            {currentAttrType === 'color' && (
              <div>
                <label className={lc}>Color Code <span className="opacity-50">(hex)</span></label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={valForm.color_code || '#7c3aed'}
                    onChange={e => setValForm(p => ({ ...p, color_code: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                  <input value={valForm.color_code}
                    onChange={e => setValForm(p => ({ ...p, color_code: e.target.value }))}
                    placeholder="#7c3aed" className={`${ic} flex-1`} />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowValForm(null)} className="flex-1 glass-card py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={saveVal} disabled={savingVal} className="flex-1 btn-glow py-2.5 rounded-xl text-sm font-semibold">
                {savingVal ? <Loader2 size={14} className="animate-spin mx-auto" /> : <><Save size={14} className="inline mr-1" />{editingVal ? 'Update' : 'Add'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attributes list */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl shimmer" />)}</div>
      ) : attrs.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <Tags size={48} className="mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="font-semibold text-foreground">No attributes yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first attribute like Color, Size, or Platform</p>
        </div>
      ) : (
        <div className="space-y-3">
          {attrs.map(attr => {
            const isExpanded = expanded[attr.id];
            return (
              <div key={attr.id} className="glass-card rounded-2xl overflow-hidden border border-border/50">
                {/* Attribute row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <button
                    onClick={() => setExpanded(p => ({ ...p, [attr.id]: !isExpanded }))}
                    className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground text-sm">{attr.name}</span>
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                        {attr.slug}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border"
                        style={{ color: 'hsl(271,91%,75%)', borderColor: 'hsla(271,91%,65%,0.3)', background: 'hsla(271,91%,65%,0.08)' }}>
                        {ATTR_TYPES.find(t => t.value === attr.type)?.label.replace(/^[^\s]+ /, '') || attr.type}
                      </span>
                      {attr.has_archives && (
                        <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
                          archives
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(attr.values || []).length} values • order by {attr.order_by}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEditAttr(attr)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-primary/10">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => deleteAttr(attr.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Values panel */}
                {isExpanded && (
                  <div className="border-t border-border/50 px-5 py-4 space-y-3"
                    style={{ background: 'hsla(215,28%,8%,0.4)' }}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground">Values</p>
                      <button onClick={() => openNewVal(attr.id)}
                        className="text-xs text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors">
                        <Plus size={11} /> Add Value
                      </button>
                    </div>

                    {(attr.values || []).length === 0 ? (
                      <p className="text-xs text-muted-foreground/60 italic py-2 text-center">No values yet — add some</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(attr.values || []).map(val => (
                          <div key={val.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium group transition-all"
                            style={{
                              background: 'hsla(215,28%,12%,0.8)',
                              borderColor: 'hsl(var(--border))',
                            }}
                          >
                            {attr.type === 'color' && val.color_code && (
                              <span className="w-3 h-3 rounded-full flex-shrink-0 border border-border"
                                style={{ background: val.color_code }} />
                            )}
                            <span className="text-foreground">{val.value}</span>
                            <span className="text-muted-foreground/60 font-mono">({val.slug})</span>
                            <button onClick={() => openEditVal(val)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all ml-0.5">
                              <Edit size={11} />
                            </button>
                            <button onClick={() => deleteVal(val.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                              <X size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="glass-card rounded-2xl p-5 border border-primary/10">
        <h3 className="text-sm font-bold text-foreground mb-2">📘 How to Use Attributes</h3>
        <ul className="text-xs text-muted-foreground space-y-1.5">
          <li>→ Create <strong className="text-foreground">global attributes</strong> here (Color, Size, Platform)</li>
          <li>→ Add <strong className="text-foreground">values</strong> for each attribute (Red/Blue, S/M/L, Windows/Mac)</li>
          <li>→ Assign attributes to products in the <strong className="text-foreground">product edit → Attributes tab</strong></li>
          <li>→ <strong className="text-foreground">Visible on product page</strong> = shows in specifications table</li>
          <li>→ <strong className="text-foreground">Use in variation</strong> = drives price/stock variations (future)</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminAttributes;
