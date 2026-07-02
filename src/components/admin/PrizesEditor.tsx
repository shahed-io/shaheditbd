import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ArrowUp, ArrowDown, Trophy } from 'lucide-react';
import { parsePrizeItems, serializePrizeItems, type PrizeItem } from '@/lib/offerPrizes';
import AiPolishButton from './AiPolishButton';

interface Props {
  /** Raw `prize_details` string from the offer. */
  value: string | null | undefined;
  /** Called with the new serialized string whenever the admin edits the list. */
  onChange: (next: string) => void;
}

type EditablePrizeItem = PrizeItem & { id: string };

const createPrizeId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const withStableIds = (items: PrizeItem[]): EditablePrizeItem[] =>
  items.map((item) => ({ ...item, id: createPrizeId() }));

const getDefaultTitle = (position: number) => {
  const ordinals = ['১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'];
  const ord = ordinals[position - 1] || `${position}তম`;
  return `${ord} পুরস্কার`;
};

/**
 * Box-style prize editor — admin can add any number of prizes (1st, 2nd, ...),
 * each with a free-form title and description, and reorder/remove them.
 * The list is serialized back to a markdown string stored on `offers.prize_details`.
 */
export default function PrizesEditor({ value, onChange }: Props) {
  const [items, setItems] = useState<EditablePrizeItem[]>(() => withStableIds(parsePrizeItems(value)));

  useEffect(() => {
    const incoming = serializePrizeItems(parsePrizeItems(value));
    const local = serializePrizeItems(items);

    // Do not re-hydrate the list after every keystroke that we already emitted
    // to the parent. Re-hydrating creates new React keys, which was the root of
    // the “editing one prize changes/jumps to another” feeling.
    if (incoming !== local) {
      setItems(withStableIds(parsePrizeItems(value)));
    }
    // We intentionally only react to external value changes here. Including
    // `items` would make the effect run after each local keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const commit = (next: EditablePrizeItem[]) => {
    setItems(next);
    onChange(serializePrizeItems(next));
  };

  const update = (id: string, patch: Partial<PrizeItem>) => {
    const next = items.map((it) => (it.id === id ? { ...it, ...patch } : it));
    commit(next);
  };

  const add = () => {
    commit([...items, { id: createPrizeId(), title: getDefaultTitle(items.length + 1), description: '' }]);
  };

  const remove = (id: string) => {
    if (!confirm('এই পুরস্কারটি মুছে ফেলবেন?')) return;
    commit(items.filter((item) => item.id !== id));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[idx], next[j]] = [next[j], next[idx]];
    commit(next);
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          এখনো কোনো পুরস্কার যোগ করা হয়নি। নিচের "Add Prize" বাটনে ক্লিক করুন।
        </div>
      )}

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="rounded-lg border border-border bg-card/50 p-3 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                Prize #{idx + 1}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  title="Move up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => move(idx, 1)}
                  disabled={idx === items.length - 1}
                  title="Move down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => remove(item.id)}
                  title="Delete prize"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Label className="text-xs">Title</Label>
                  <AiPolishButton
                    value={item.title}
                    onChange={(next) => update(item.id, { title: next })}
                    kind="prize_title"
                    size="icon"
                  />
                </div>
                <Input
                  value={item.title}
                  onChange={(e) => update(item.id, { title: e.target.value })}
                  placeholder="১ম পুরস্কার"
                />
              </div>
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Label className="text-xs">Description</Label>
                  <AiPolishButton
                    value={item.description}
                    onChange={(next) => update(item.id, { description: next })}
                    kind="prize_description"
                    size="icon"
                  />
                </div>
                <Textarea
                  rows={2}
                  value={item.description}
                  onChange={(e) => update(item.id, { description: e.target.value })}
                  placeholder="অফিস ৩৬৫ ফ্যামিলি সাবস্ক্রিপশন + একটি চমৎকার Hide গিফট"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="w-4 h-4 mr-1" /> Add Prize
      </Button>
    </div>
  );
}
