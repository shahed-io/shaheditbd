import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Wand2, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type Kind =
  | 'offer_title'
  | 'offer_description'
  | 'prize_title'
  | 'prize_description'
  | 'terms'
  | 'success_message'
  | 'notice'
  | 'field_label'
  | 'field_help'
  | 'field_options'
  | 'winner_prizes'
  | 'generic';

interface Props {
  /** Current value; will be sent to AI as `text`. */
  value: string;
  /** Called with the improved text. */
  onChange: (next: string) => void;
  /** Semantic hint that tunes the AI prompt. */
  kind?: Kind;
  /** Show a small label next to the icon. */
  label?: string;
  /** Language override — otherwise auto-detected. */
  language?: 'bn' | 'en' | 'auto';
  /** Max character limit passed to AI. */
  maxChars?: number;
  /** Button size */
  size?: 'sm' | 'icon';
  /** Extra class names for the trigger button. */
  className?: string;
}

/**
 * Small "AI improve / generate" button used across admin editors.
 * Opens a popover where admins can add an optional instruction (e.g. "make it shorter",
 * "translate to Bengali", "add a discount hint") and applies the AI-polished result.
 */
export default function AiPolishButton({
  value,
  onChange,
  kind = 'generic',
  label,
  language = 'auto',
  maxChars,
  size = 'sm',
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!value.trim() && !instruction.trim()) {
      toast.error('Type something first, or add an instruction.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-polish-text', {
        body: {
          text: value,
          instruction: instruction.trim() || undefined,
          kind,
          language,
          maxChars,
        },
      });
      if (error) throw error;
      const next = (data as any)?.text as string | undefined;
      if (!next) throw new Error('AI returned empty result');
      onChange(next);
      toast.success('AI improved ✨');
      setOpen(false);
      setInstruction('');
    } catch (e: any) {
      toast.error(e?.message || 'AI polish failed');
    } finally {
      setLoading(false);
    }
  };

  const hasValue = value.trim().length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={size === 'icon' ? 'icon' : 'sm'}
          className={
            'gap-1 text-cyan-600 border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 dark:border-cyan-900 dark:hover:bg-cyan-950 ' +
            (className || '')
          }
          title={hasValue ? 'Improve with AI' : 'Generate with AI'}
        >
          {size === 'icon' ? (
            <Wand2 className="w-4 h-4" />
          ) : (
            <>
              <Wand2 className="w-3.5 h-3.5" />
              {label || (hasValue ? 'AI Improve' : 'AI Generate')}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3">
        <div>
          <div className="flex items-center gap-1.5 font-semibold text-sm mb-1">
            <Sparkles className="w-4 h-4 text-cyan-500" />
            {hasValue ? 'Improve this text' : 'Generate this text'}
          </div>
          <p className="text-xs text-muted-foreground">
            Optional: tell the AI what to change (e.g. "make it shorter", "add urgency",
            "translate to Bengali").
          </p>
        </div>
        <Textarea
          rows={3}
          placeholder="Optional instruction…"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          disabled={loading}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={run} disabled={loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-1" />}
            {hasValue ? 'Improve' : 'Generate'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
