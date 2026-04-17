import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, RotateCcw, Save, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { usePasswordTypes, DEFAULT_PASSWORD_TYPES, type PasswordType } from '@/hooks/usePasswordTypes';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const COLORS = ['orange', 'green', 'blue', 'purple', 'pink', 'red', 'yellow', 'cyan', 'gray'];

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'custom';
}

export default function PasswordTypesManager({ open, onOpenChange }: Props) {
  const { types, save, saving } = usePasswordTypes();
  const [draft, setDraft] = useState<PasswordType[]>(types);
  const [dirty, setDirty] = useState(false);

  // Reset draft when dialog opens
  function handleOpen(v: boolean) {
    if (v) {
      setDraft(types);
      setDirty(false);
    }
    onOpenChange(v);
  }

  function update(idx: number, patch: Partial<PasswordType>) {
    setDraft(d => d.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
    setDirty(true);
  }

  function add() {
    const newId = `custom_${Date.now()}`;
    setDraft(d => [
      ...d,
      { id: newId, label: 'New Type', emoji: '🔖', color: 'blue', description: '' },
    ]);
    setDirty(true);
  }

  function remove(idx: number) {
    setDraft(d => d.filter((_, i) => i !== idx));
    setDirty(true);
  }

  function move(idx: number, dir: -1 | 1) {
    const next = [...draft];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setDraft(next);
    setDirty(true);
  }

  function resetDefault() {
    if (!confirm('সব কাস্টম টাইপ মুছে ডিফল্ট ৫টি প্রিসেট ফিরিয়ে আনবেন?')) return;
    setDraft(DEFAULT_PASSWORD_TYPES);
    setDirty(true);
  }

  async function handleSave() {
    // Validate
    const ids = new Set<string>();
    const cleaned: PasswordType[] = [];
    for (const t of draft) {
      const label = t.label.trim();
      if (!label) {
        toast.error('সব টাইপের লেবেল দরকার');
        return;
      }
      let id = t.id?.trim() || slugify(label);
      // Ensure unique id
      let i = 1;
      const baseId = id;
      while (ids.has(id)) {
        id = `${baseId}_${i++}`;
      }
      ids.add(id);
      cleaned.push({
        id,
        label,
        emoji: (t.emoji || '🔖').trim(),
        color: t.color || 'blue',
        description: (t.description || '').trim(),
      });
    }
    try {
      await save(cleaned);
      toast.success('পাসওয়ার্ড টাইপ সেভ হয়েছে');
      setDirty(false);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'সেভ ব্যর্থ');
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>পাসওয়ার্ড টাইপ ম্যানেজার</DialogTitle>
          <DialogDescription>
            আপনার পছন্দ মত পাসওয়ার্ডের ধরন (Type) তৈরি, এডিট ও মুছে ফেলুন। প্রতিটি টাইপ লাইসেন্স ফর্মে dropdown হিসেবে আসবে এবং WhatsApp/Copy ডেলিভারিতে ইমোজি সহ দেখাবে।
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {draft.map((t, idx) => (
            <Card key={idx} className="p-3 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <button type="button" onClick={() => move(idx, -1)} className="text-muted-foreground hover:text-foreground text-xs">▲</button>
                  <button type="button" onClick={() => move(idx, 1)} className="text-muted-foreground hover:text-foreground text-xs">▼</button>
                </div>
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <div className="grid grid-cols-12 gap-2 flex-1">
                  <div className="col-span-2">
                    <Label className="text-xs">ইমোজি</Label>
                    <Input
                      value={t.emoji}
                      onChange={e => update(idx, { emoji: e.target.value })}
                      className="text-center text-lg"
                      maxLength={4}
                    />
                  </div>
                  <div className="col-span-5">
                    <Label className="text-xs">লেবেল *</Label>
                    <Input
                      value={t.label}
                      onChange={e => update(idx, { label: e.target.value })}
                      placeholder="যেমন: Permanent"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">কালার</Label>
                    <select
                      value={t.color}
                      onChange={e => update(idx, { color: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      {COLORS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 flex items-end">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive ml-auto"
                      onClick={() => remove(idx)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs">বিবরণ (ঐচ্ছিক)</Label>
                <Input
                  value={t.description || ''}
                  onChange={e => update(idx, { description: e.target.value })}
                  placeholder="এই টাইপের সংক্ষিপ্ত ব্যাখ্যা"
                />
              </div>
            </Card>
          ))}

          <Button type="button" variant="outline" className="w-full" onClick={add}>
            <Plus className="w-4 h-4 mr-2" />নতুন টাইপ যোগ করুন
          </Button>
        </div>

        <div className="flex flex-wrap justify-between gap-2 pt-3 border-t">
          <Button type="button" variant="ghost" onClick={resetDefault}>
            <RotateCcw className="w-4 h-4 mr-2" />ডিফল্ট ফিরিয়ে আনুন
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>বাতিল</Button>
            <Button type="button" onClick={handleSave} disabled={!dirty || saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
