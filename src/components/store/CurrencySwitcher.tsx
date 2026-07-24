import { useCurrency } from "@/hooks/useCurrency";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, Globe } from "lucide-react";

interface Props {
  compact?: boolean;
  className?: string;
}

const CurrencySwitcher = ({ compact, className }: Props) => {
  const { currencies, active, setActive } = useCurrency();
  if (!currencies || currencies.length <= 1) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`gap-1.5 h-9 px-2.5 rounded-full hover:bg-primary/10 ${className || ""}`}
          aria-label="Change currency"
        >
          <Globe className="w-4 h-4 opacity-70" />
          <span className="text-sm font-semibold">
            {active.flag_emoji || ""} {active.code}
          </span>
        </Button>
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
