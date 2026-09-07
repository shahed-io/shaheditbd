import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, X, Loader2, Save, ChevronDown, Tag, Globe, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────
interface GlobalAttr {
  id: string;
  name: string;
  slug: string;
  type: string;
  values: { id: string; value: string; slug: string; color_code: string | null }[];
}

interface Assignment {
  id?: string;
  attribute_id: string | null;
  custom_name: string;
  attribute_type: 'global' | 'custom';
  selected_values: string[];  // labels/strings
  is_visible: boolean;
  use_in_variation: boolean;
  sort_order: number;
  _deleted?: boolean;
  _tempId?: string;
}

interface Props {
  productId: string;
}

const ic = 'w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground';

let tc = 0;
const gid = () => `t_${++tc}`;

// ── Component ─────────────────────────────────────────────────
const ProductAttributesEditor = ({ productId }: Props) => {
  const [globalAttrs, setGlobalAttrs]   = useState<GlobalAttr[]>([]);
  const [assignments, setAssignments]   = useState<Assignment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [expandedIdx, setExpandedIdx]   = useState<number | null>(null);
  const [addMode, setAddMode]           = useState<'global' | 'custom' | null>(null);
  const [selectedGlobalId, setSelectedGlobalId] = useState('');
  // Per-assignment value input state
  const [valueInputs, setValueInputs]   = useState<Record<string, string>>({});

  // ── Fetch ──────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: gData }, { data: aData }] = await Promise.all([
      supabase
        .from('global_attributes' as any)
        .select('*, global_attribute_values(*)')
        .order('sort_order'),
      supabase
        .from('product_attribute_assignments' as any)
        .select('*')
        .eq('product_id', productId)
        .order('sort_order'),
    ]);

    if (gData) {
      setGlobalAttrs((gData as any[]).map((g: any) => ({
        id: g.id,
        name: g.name,
        slug: g.slug,
        type: g.type,
        values: (g.global_attribute_values || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      })));
    }
    if (aData) {
      setAssignments((aData as any[]).map((a: any) => ({
        id: a.id,
        attribute_id: a.attribute_id,
        custom_name: a.custom_name || '',
        attribute_type: a.attribute_type,
        selected_values: Array.isArray(a.selected_values) ? a.selected_values : [],
        is_visible: a.is_visible,
        use_in_variation: a.use_in_variation,
        sort_order: a.sort_order,
      })));
    }
    setLoading(false);
  }, [productId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Add attribute ─────────────────────────────────────────
  const addGlobalAttr = () => {
    if (!selectedGlobalId) { toast.error('Select an attribute first'); return; }
    if (assignments.some(a => a.attribute_id === selectedGlobalId && !a._deleted)) {
      toast.error('This attribute is already added'); return;
    }
    const ga = globalAttrs.find(g => g.id === selectedGlobalId);
    if (!ga) return;
    setAssignments(prev => [...prev, {
      _tempId: gid(),
      attribute_id: selectedGlobalId,
      custom_name: '',
      attribute_type: 'global',
      selected_values: [],
      is_visible: true,
      use_in_variation: false,
      sort_order: prev.filter(a => !a._deleted).length,
    }]);
    setSelectedGlobalId('');
    setAddMode(null);
  };

  const addCustomAttr = () => {
    setAssignments(prev => [...prev, {
      _tempId: gid(),
      attribute_id: null,
      custom_name: '',
      attribute_type: 'custom',
      selected_values: [],
      is_visible: true,
      use_in_variation: false,
      sort_order: prev.filter(a => !a._deleted).length,
    }]);
    setAddMode(null);
  };

  const removeAssignment = (idx: number) => {
    setAssignments(prev => prev.map((a, i) => i === idx ? { ...a, _deleted: true } : a));
  };

  const updateAssignment = (idx: number, patch: Partial<Assignment>) => {
    setAssignments(prev => prev.map((a, i) => i === idx ? { ...a, ...patch } : a));
  };

  // ── Tag-style value management ────────────────────────────
  const addValue = (idx: number, val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    setAssignments(prev => prev.map((a, i) => {
      if (i !== idx) return a;
      if (a.selected_values.includes(trimmed)) return a;
      return { ...a, selected_values: [...a.selected_values, trimmed] };
    }));
  };

  const removeValue = (idx: number, val: string) => {
    setAssignments(prev => prev.map((a, i) =>
      i === idx ? { ...a, selected_values: a.selected_values.filter(v => v !== val) } : a
    ));
  };

  const handleValueKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>, inputId: string) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addValue(idx, valueInputs[inputId] || '');
      setValueInputs(p => ({ ...p, [inputId]: '' }));
    }
  };

  // ── Save ──────────────────────────────────────────────────
  const handleSave = async () => {
    // Validate
    for (const a of assignments.filter(a => !a._deleted)) {
      if (a.attribute_type === 'global' && !a.attribute_id) {
        toast.error('Select a global attribute'); return;
      }
      if (a.attribute_type === 'custom' && !a.custom_name.trim()) {
        toast.error('Custom attribute must have a name'); return;
      }
    }

    setSaving(true);
    try {
      for (let i = 0; i < assignments.length; i++) {
        const a = assignments[i];
        if (a._deleted && a.id) {
          await supabase.from('product_attribute_assignments' as any).delete().eq('id', a.id);
          continue;
        }
        if (a._deleted) continue;

        const payload = {
          product_id: productId,
          attribute_id: a.attribute_id,
          custom_name: a.attribute_type === 'custom' ? a.custom_name.trim() : null,
          attribute_type: a.attribute_type,
          selected_values: a.selected_values,
          is_visible: a.is_visible,
          use_in_variation: a.use_in_variation,
          sort_order: i,
        };

        if (a.id) {
          const { error } = await supabase.from('product_attribute_assignments' as any).update(payload).eq('id', a.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('product_attribute_assignments' as any).insert(payload);
          if (error) throw error;
        }
      }
      toast.success('✅ Attributes saved!');
      fetchAll();
    } catch (e: any) {
      toast.error('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────
  const getAttrName = (a: Assignment) => {
    if (a.attribute_type === 'custom') return a.custom_name || 'Custom Attribute';
    const ga = globalAttrs.find(g => g.id === a.attribute_id);
    return ga?.name || 'Unknown';
  };

  const getGlobalValues = (attrId: string | null) => {
    if (!attrId) return [];
    return globalAttrs.find(g => g.id === attrId)?.values || [];
  };

  const visibleAssignments = assignments.filter(a => !a._deleted);
  const usedGlobalIds = new Set(visibleAssignments.filter(a => a.attribute_type === 'global').map(a => a.attribute_id));
  const availableGlobals = globalAttrs.filter(g => !usedGlobalIds.has(g.id));

  if (loading) return (
    <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground text-sm">
      <Loader2 size={16} className="animate-spin" /> Loading attributes…
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Add attributes to this product. Use <strong className="text-foreground">global attributes</strong> for filtering across the store, or create <strong className="text-foreground">custom attributes</strong> for product-specific specs.
      </p>

      {/* Assignment list */}
      {visibleAssignments.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-border py-10 text-center text-muted-foreground">
          <Tag size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No attributes added — click below to add</p>
        </div>
      )}

      <div className="space-y-3">
        {assignments.map((a, idx) => {
          if (a._deleted) return null;
          const inputId = a.id || a._tempId || String(idx);
          const gVals = getGlobalValues(a.attribute_id);
          const isExpanded = expandedIdx === idx;

          return (
            <div key={inputId} className="rounded-xl border border-border overflow-hidden"
              style={{ background: 'hsla(215,28%,10%,0.5)' }}>
              {/* Header row */}
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}>
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  {a.attribute_type === 'global'
                    ? <Globe size={14} className="text-primary flex-shrink-0" />
                    : <Pencil size={14} className="text-amber-400 flex-shrink-0" />
                  }
                  <span className="font-semibold text-sm text-foreground truncate">
                    {getAttrName(a)}
                  </span>
                  {a.selected_values.length > 0 && (
                    <span className="text-xs text-muted-foreground truncate hidden sm:block">
                      — {a.selected_values.slice(0, 3).join(', ')}{a.selected_values.length > 3 ? '…' : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-muted-foreground">{a.selected_values.length} value{a.selected_values.length !== 1 ? 's' : ''}</span>
                  <button onClick={e => { e.stopPropagation(); removeAssignment(idx); }}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1">
                    <Trash2 size={13} />
                  </button>
                  <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Expanded body */}
              {isExpanded && (
                <div className="border-t border-border px-4 py-4 space-y-4"
                  style={{ background: 'hsla(215,28%,8%,0.5)' }}>
                  {/* Custom name input */}
                  {a.attribute_type === 'custom' && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block font-medium">Attribute Name *</label>
                      <input value={a.custom_name}
                        onChange={e => updateAssignment(idx, { custom_name: e.target.value })}
                        placeholder="e.g. Compatibility, License Type"
                        className={ic} />
                    </div>
                  )}

                  {/* Values section */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block font-medium">
                      Values
                      <span className="ml-1 opacity-60">
                        {a.attribute_type === 'global' && gVals.length > 0
                          ? '(click to add from list, or type custom)'
                          : '(type and press Enter or comma to add)'}
                      </span>
                    </label>

                    {/* Tag display */}
                    <div className="min-h-[44px] flex flex-wrap gap-2 p-3 rounded-xl border border-border bg-muted/20 mb-2">
                      {a.selected_values.map(val => (
                        <span key={val}
                          className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border border-primary/30 text-primary bg-primary/10">
                          {val}
                          <button onClick={() => removeValue(idx, val)} className="hover:text-destructive ml-0.5">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                      {a.selected_values.length === 0 && (
                        <span className="text-xs text-muted-foreground/50 self-center">No values yet</span>
                      )}
                    </div>

                    {/* Global attribute preset values */}
                    {a.attribute_type === 'global' && gVals.length > 0 && (
                      <div className="mb-2">
                        <p className="text-[11px] text-muted-foreground mb-1.5">Quick add from global values:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {gVals.map(gv => {
                            const isAdded = a.selected_values.includes(gv.value);
                            return (
                              <button key={gv.id}
                                onClick={() => isAdded ? removeValue(idx, gv.value) : addValue(idx, gv.value)}
                                className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs border transition-all ${
                                  isAdded
                                    ? 'border-primary bg-primary/15 text-primary'
                                    : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/40'
                                }`}
                              >
                                {gv.color_code && (
                                  <span className="w-3 h-3 rounded-full border border-border"
                                    style={{ background: gv.color_code }} />
                                )}
                                {gv.value}
                                {isAdded && <X size={9} className="ml-0.5" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Free-text input */}
                    <input
                      value={valueInputs[inputId] || ''}
                      onChange={e => setValueInputs(p => ({ ...p, [inputId]: e.target.value }))}
                      onKeyDown={e => handleValueKeyDown(idx, e, inputId)}
                      onBlur={() => {
                        if (valueInputs[inputId]?.trim()) {
                          addValue(idx, valueInputs[inputId]);
                          setValueInputs(p => ({ ...p, [inputId]: '' }));
                        }
                      }}
                      placeholder="Type a value + Enter/comma to add..."
                      className={ic}
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={a.is_visible}
                        onChange={e => updateAssignment(idx, { is_visible: e.target.checked })}
                        className="w-4 h-4 accent-primary" />
                      <div>
                        <span className="text-sm text-foreground font-medium">Visible on product page</span>
                        <p className="text-[11px] text-muted-foreground">Show in specifications table</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={a.use_in_variation}
                        onChange={e => updateAssignment(idx, { use_in_variation: e.target.checked })}
                        className="w-4 h-4 accent-primary" />
                      <div>
                        <span className="text-sm text-foreground font-medium">Used for variations</span>
                        <p className="text-[11px] text-muted-foreground">Drives price/stock per option</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add controls */}
      {addMode === null ? (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setAddMode('global')}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-border bg-muted/20 hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all">
            <Globe size={14} className="text-primary" /> Add Existing Attribute
          </button>
          <button onClick={addCustomAttr}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-border bg-muted/20 hover:border-amber-400/40 text-muted-foreground hover:text-foreground transition-all">
            <Pencil size={14} className="text-amber-400" /> Add Custom Attribute
          </button>
        </div>
      ) : addMode === 'global' ? (
        <div className="flex gap-2 items-center p-3 rounded-xl border border-primary/20 bg-primary/5">
          <Globe size={14} className="text-primary flex-shrink-0" />
          <select value={selectedGlobalId} onChange={e => setSelectedGlobalId(e.target.value)}
            className="flex-1 bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
            <option value="">— Select Attribute —</option>
            {availableGlobals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <button onClick={addGlobalAttr} className="px-3 py-2 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors">Add</button>
          <button onClick={() => setAddMode(null)} className="text-muted-foreground hover:text-foreground p-1"><X size={14} /></button>
        </div>
      ) : null}

      {/* Save button */}
      {(visibleAssignments.length > 0 || assignments.some(a => a._deleted && a.id)) && (
        <button onClick={handleSave} disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{
            background: saving ? 'hsla(271,91%,65%,0.4)' : 'linear-gradient(135deg, hsl(271,91%,65%), hsl(185,90%,52%))',
          }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Attributes'}
        </button>
      )}
    </div>
  );
};

export default ProductAttributesEditor;
