import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, X, GripVertical, ChevronDown, ToggleLeft, AlignJustify, LayoutGrid, Loader2, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────
interface OptionValue {
  id?: string;
  label: string;
  price_adjustment: number;
  is_default: boolean;
  sort_order: number;
  _deleted?: boolean;
  _tempId?: string;
}

interface OptionGroup {
  id?: string;
  name: string;
  display_type: 'button' | 'radio' | 'dropdown';
  is_required: boolean;
  sort_order: number;
  values: OptionValue[];
  _deleted?: boolean;
  _tempId?: string;
}

interface Props {
  productId: string;
  basePrice: number;
}

const ic = 'w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground';
const lc = 'text-xs text-muted-foreground mb-1 block font-medium';

const DISPLAY_TYPES: { value: 'button' | 'radio' | 'dropdown'; icon: React.ReactNode; label: string }[] = [
  { value: 'button',   icon: <LayoutGrid size={12} />,  label: 'Button' },
  { value: 'radio',    icon: <ToggleLeft size={12} />,  label: 'Radio' },
  { value: 'dropdown', icon: <ChevronDown size={12} />, label: 'Dropdown' },
];

let tempCounter = 0;
const genTempId = () => `tmp_${++tempCounter}`;

// ── Component ─────────────────────────────────────────────────
const ProductOptionsBuilder = ({ productId, basePrice }: Props) => {
  const [groups, setGroups] = useState<OptionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Fetch existing option groups for this product ──────────
  const fetchOptions = useCallback(async () => {
    setLoading(true);
    const { data: groupData } = await supabase
      .from('product_option_groups' as any)
      .select('*, product_option_values(*)')
      .eq('product_id', productId)
      .order('sort_order');

    if (groupData) {
      setGroups((groupData as any[]).map((g: any) => ({
        id: g.id,
        name: g.name,
        display_type: g.display_type,
        is_required: g.is_required,
        sort_order: g.sort_order,
        values: (g.product_option_values || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((v: any) => ({
            id: v.id,
            label: v.label,
            price_adjustment: Number(v.price_adjustment),
            is_default: v.is_default,
            sort_order: v.sort_order,
          })),
      })));
    }
    setLoading(false);
  }, [productId]);

  useEffect(() => { fetchOptions(); }, [fetchOptions]);

  // ── Group helpers ──────────────────────────────────────────
  const addGroup = () => {
    setGroups(prev => [...prev, {
      _tempId: genTempId(),
      name: '',
      display_type: 'button',
      is_required: true,
      sort_order: prev.length,
      values: [{ _tempId: genTempId(), label: '', price_adjustment: 0, is_default: true, sort_order: 0 }],
    }]);
  };

  const removeGroup = (idx: number) => {
    setGroups(prev => prev.map((g, i) => i === idx ? { ...g, _deleted: true } : g));
  };

  const updateGroup = (idx: number, patch: Partial<OptionGroup>) => {
    setGroups(prev => prev.map((g, i) => i === idx ? { ...g, ...patch } : g));
  };

  // ── Value helpers ──────────────────────────────────────────
  const addValue = (gi: number) => {
    setGroups(prev => prev.map((g, i) => {
      if (i !== gi) return g;
      return { ...g, values: [...g.values, { _tempId: genTempId(), label: '', price_adjustment: 0, is_default: false, sort_order: g.values.length }] };
    }));
  };

  const removeValue = (gi: number, vi: number) => {
    setGroups(prev => prev.map((g, i) => {
      if (i !== gi) return g;
      return { ...g, values: g.values.map((v, j) => j === vi ? { ...v, _deleted: true } : v) };
    }));
  };

  const updateValue = (gi: number, vi: number, patch: Partial<OptionValue>) => {
    setGroups(prev => prev.map((g, i) => {
      if (i !== gi) return g;
      const values = g.values.map((v, j) => j === vi ? { ...v, ...patch } : v);
      // Only one default per group
      if (patch.is_default) {
        return { ...g, values: values.map((v, j) => ({ ...v, is_default: j === vi })) };
      }
      return { ...g, values };
    }));
  };

  // ── Save ──────────────────────────────────────────────────
  const handleSave = async () => {
    // Validate
    for (const g of groups.filter(g => !g._deleted)) {
      if (!g.name.trim()) { toast.error('Option group name is required'); return; }
      const activeVals = g.values.filter(v => !v._deleted);
      if (activeVals.length === 0) { toast.error(`"${g.name}" must have at least one option value`); return; }
      for (const v of activeVals) {
        if (!v.label.trim()) { toast.error(`All option values in "${g.name}" must have a label`); return; }
      }
    }

    setSaving(true);
    try {
      // Process each group
      for (let gi = 0; gi < groups.length; gi++) {
        const g = groups[gi];
        
        if (g._deleted && g.id) {
          // Delete existing group (cascade deletes values)
          await supabase.from('product_option_groups' as any).delete().eq('id', g.id);
          continue;
        }
        if (g._deleted) continue;

        let groupId = g.id;

        if (!groupId) {
          // Insert new group
          const { data, error } = await supabase
            .from('product_option_groups' as any)
            .insert({ product_id: productId, name: g.name.trim(), display_type: g.display_type, is_required: g.is_required, sort_order: gi })
            .select('id')
            .single();
          if (error) throw error;
          groupId = (data as any).id;
        } else {
          // Update existing group
          await supabase.from('product_option_groups' as any)
            .update({ name: g.name.trim(), display_type: g.display_type, is_required: g.is_required, sort_order: gi })
            .eq('id', groupId);
        }

        // Process values for this group
        for (let vi = 0; vi < g.values.length; vi++) {
          const v = g.values[vi];

          if (v._deleted && v.id) {
            await supabase.from('product_option_values' as any).delete().eq('id', v.id);
            continue;
          }
          if (v._deleted) continue;

          if (!v.id) {
            // Insert new value
            await supabase.from('product_option_values' as any).insert({
              group_id: groupId,
              product_id: productId,
              label: v.label.trim(),
              price_adjustment: v.price_adjustment,
              is_default: v.is_default,
              sort_order: vi,
            });
          } else {
            // Update existing value
            await supabase.from('product_option_values' as any)
              .update({ label: v.label.trim(), price_adjustment: v.price_adjustment, is_default: v.is_default, sort_order: vi })
              .eq('id', v.id);
          }
        }
      }

      toast.success('✅ Options saved successfully!');
      await fetchOptions();
    } catch (err: any) {
      toast.error('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const visibleGroups = groups.filter(g => !g._deleted);

  if (loading) return (
    <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground text-sm">
      <Loader2 size={16} className="animate-spin" /> Loading options...
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">🎛️ Custom Product Options</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Define option groups like Type, Duration, Plan — customers can select and price updates live
          </p>
        </div>
        <button
          type="button"
          onClick={addGroup}
          className="flex items-center gap-1.5 text-xs text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={12} /> Add Group
        </button>
      </div>

      {visibleGroups.length === 0 && (
        <div
          className="rounded-xl border-2 border-dashed py-10 flex flex-col items-center gap-2 text-muted-foreground cursor-pointer hover:border-primary/40 transition-colors"
          style={{ borderColor: 'hsl(var(--border))' }}
          onClick={addGroup}
        >
          <LayoutGrid size={28} className="opacity-40" />
          <p className="text-sm font-medium">No option groups yet</p>
          <p className="text-xs opacity-60">Click to add Type, Duration, Plan, License…</p>
        </div>
      )}

      {/* Option Groups */}
      <div className="space-y-4">
        {groups.map((group, gi) => {
          if (group._deleted) return null;
          const visibleValues = group.values.filter(v => !v._deleted);

          return (
            <div
              key={group.id || group._tempId}
              className="rounded-xl border p-4 space-y-3 transition-all"
              style={{ background: 'hsla(215,28%,10%,0.5)', borderColor: 'hsl(var(--border))' }}
            >
              {/* Group header row */}
              <div className="flex items-start gap-2">
                <GripVertical size={14} className="text-muted-foreground mt-2.5 flex-shrink-0 cursor-grab" />
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Group name */}
                  <div className="sm:col-span-1">
                    <label className={lc}>Group Name *</label>
                    <input
                      value={group.name}
                      onChange={e => updateGroup(gi, { name: e.target.value })}
                      placeholder="e.g. Duration, Plan, Type"
                      className={ic}
                    />
                  </div>
                  {/* Display type */}
                  <div>
                    <label className={lc}>Display As</label>
                    <div className="flex gap-2">
                      {DISPLAY_TYPES.map(dt => (
                        <button
                          key={dt.value}
                          type="button"
                          onClick={() => updateGroup(gi, { display_type: dt.value })}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium border transition-colors ${
                            group.display_type === dt.value
                              ? 'border-primary bg-primary/15 text-primary'
                              : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/40'
                          }`}
                          title={dt.label}
                        >
                          {dt.icon}
                          <span className="hidden sm:inline">{dt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Required toggle */}
                  <div>
                    <label className={lc}>Required?</label>
                    <button
                      type="button"
                      onClick={() => updateGroup(gi, { is_required: !group.is_required })}
                      className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        group.is_required
                          ? 'border-green-500/40 bg-green-500/10 text-green-400'
                          : 'border-border bg-muted/20 text-muted-foreground'
                      }`}
                    >
                      {group.is_required ? '✅ Required' : '⬜ Optional'}
                    </button>
                  </div>
                </div>
                <button type="button" onClick={() => removeGroup(gi)} className="text-muted-foreground hover:text-destructive transition-colors mt-1 flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Values */}
              <div className="pl-5 space-y-2">
                <label className={lc}>Option Values</label>
                {visibleValues.length === 0 && (
                  <p className="text-xs text-muted-foreground/60 italic py-1">No values — add at least one</p>
                )}
                {group.values.map((val, vi) => {
                  if (val._deleted) return null;
                  return (
                    <div key={val.id || val._tempId} className="flex items-center gap-2">
                      {/* Default radio */}
                      <button
                        type="button"
                        onClick={() => updateValue(gi, vi, { is_default: true })}
                        title="Set as default"
                        className={`w-4 h-4 flex-shrink-0 rounded-full border-2 transition-colors ${
                          val.is_default ? 'border-primary bg-primary' : 'border-border bg-transparent hover:border-primary/50'
                        }`}
                      />
                      {/* Label */}
                      <input
                        value={val.label}
                        onChange={e => updateValue(gi, vi, { label: e.target.value })}
                        placeholder="Label (e.g. 1 Month, Personal, OEM)"
                        className={`${ic} flex-1`}
                      />
                      {/* Price */}
                      <div className="relative flex-shrink-0 w-28">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">৳</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={val.price_adjustment || ''}
                          onChange={e => updateValue(gi, vi, { price_adjustment: parseFloat(e.target.value) || 0 })}
                          placeholder={String(basePrice)}
                          className={`${ic} pl-6`}
                          title="Price for this option (leave 0 to use base price)"
                        />
                      </div>
                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeValue(gi, vi)}
                        className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => addValue(gi)}
                  className="text-xs text-primary/80 hover:text-primary flex items-center gap-2 mt-1 transition-colors"
                >
                  <Plus size={11} /> Add Value
                </button>

                {/* Price preview */}
                {visibleValues.some(v => v.price_adjustment > 0) && (
                  <div className="mt-2 p-2 rounded-lg text-xs border"
                    style={{ background: 'hsla(271,91%,65%,0.06)', borderColor: 'hsla(271,91%,65%,0.2)' }}>
                    <span className="text-muted-foreground">Price preview: </span>
                    {visibleValues.filter(v => v.price_adjustment > 0).map(v => (
                      <span key={v.label} className="mr-2 font-semibold" style={{ color: 'hsl(271,91%,75%)' }}>
                        {v.label}: ৳{v.price_adjustment.toLocaleString()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save button */}
      {(visibleGroups.length > 0 || groups.some(g => g._deleted && g.id)) && (
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: saving ? 'hsla(271,91%,65%,0.3)' : 'linear-gradient(135deg, hsl(271,91%,65%), hsl(185,90%,52%))',
            color: 'white',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save Options'}
        </button>
      )}

      <p className="text-xs text-muted-foreground/60 text-center">
        💡 Set price = 0 to use the product base price • Filled circle = default selection
      </p>
    </div>
  );
};

export default ProductOptionsBuilder;
