import { useCurrency } from "@/hooks/useCurrency";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
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
          aria-label={`Currency: ${active.code}. Click to change`}
          title="Change currency"
          className={`group relative flex items-center gap-2 h-10 pl-1.5 pr-3 rounded-full bg-background border border-primary/25 hover:border-primary/60 hover:bg-primary/[0.04] transition-all duration-300 cursor-pointer shadow-sm hover:shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.35)] active:scale-[0.97] ${className || ""}`}
        >
          {/* Currency symbol badge (the universal money signal) */}
          <span
            className="flex items-center justify-center w-7 h-7 rounded-full text-[13px] font-bold text-amber-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_0_10px_rgba(251,191,36,0.35)]"
            style={{ background: "linear-gradient(135deg, #fde68a 0%, #fbbf24 55%, #d97706 100%)" }}
          >
            {active.symbol || "¤"}
          </span>

          {/* Flag + ISO code */}
          <span className="flex items-center gap-1.5">
            {active.flag_emoji ? (
              <span className="text-[14px] leading-none" aria-hidden>
                {active.flag_emoji}
              </span>
            ) : null}
            <span className="text-[13px] font-bold tracking-wide text-foreground">
              {active.code}
            </span>
          </span>

          {/* Chevron */}
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-all duration-300 ${open ? "rotate-180" : ""}`}
            strokeWidth={2.5}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel className="text-xs">Select Currency</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {currencies.map((c) => (
          <DropdownMenuItem
            key={c.id}
            onClick={() => setActive(c.code)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <span className="flex items-center gap-2 text-sm min-w-0">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-[12px] font-bold text-foreground/80 flex-shrink-0">
                {c.symbol || "¤"}
              </span>
              <span className="text-base" aria-hidden>{c.flag_emoji || "🌐"}</span>
              <span className="text-muted-foreground text-xs truncate">{c.name}</span>
            </span>
            {active.code === c.code && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CurrencySwitcher;


