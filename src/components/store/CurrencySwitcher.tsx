import { useCurrency } from "@/hooks/useCurrency";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown, DollarSign } from "lucide-react";
import { useState } from "react";

interface Props {
  compact?: boolean;
  className?: string;
}

const CurrencySwitcher = ({ className }: Props) => {
  const { currencies, active, setActive } = useCurrency();
  const [open, setOpen] = useState(false);
  if (!currencies || currencies.length <= 1) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Change currency"
          className={`group relative flex items-center gap-2.5 h-9 px-3 rounded-full bg-foreground/[0.04] dark:bg-white/5 border border-border/60 dark:border-white/10 hover:border-primary/50 hover:bg-foreground/[0.08] dark:hover:bg-white/10 transition-all duration-300 backdrop-blur-md cursor-pointer shadow-lg shadow-black/10 active:scale-[0.97] ${className || ""}`}
        >
          {/* Coin glyph */}
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 shadow-[0_0_8px_rgba(251,191,36,0.4)] group-hover:shadow-[0_0_12px_rgba(251,191,36,0.6)] transition-shadow">
            <DollarSign className="w-3 h-3 text-amber-900" strokeWidth={3} />
          </span>

          {/* Divider */}
          <span className="w-px h-4 bg-border dark:bg-white/10 group-hover:bg-foreground/20 dark:group-hover:bg-white/20 transition-colors" />

          {/* Flag + ISO */}
          <span className="flex items-center gap-2">
            {active.flag_emoji ? (
              <span className="text-[13px] leading-none">{active.flag_emoji}</span>
            ) : null}
            <span className="text-[13px] font-semibold tracking-wide text-foreground/80 group-hover:text-foreground transition-colors">
              {active.code}
            </span>
          </span>

          {/* Chevron */}
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-all duration-300 ${open ? "rotate-180" : ""}`}
            strokeWidth={2.5}
          />

          {/* Bottom glow line */}
          <span className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel className="text-xs">Select Currency</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {currencies.map((c) => (
          <DropdownMenuItem
            key={c.id}
            onClick={() => setActive(c.code)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <span className="flex items-center gap-2 text-sm">
              <span className="text-base">{c.flag_emoji || "🌐"}</span>
              <span className="font-semibold">{c.code}</span>
              <span className="text-muted-foreground text-xs truncate">{c.name}</span>
            </span>
            {active.code === c.code && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CurrencySwitcher;

