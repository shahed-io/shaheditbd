import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  rate_from_bdt: number; // 1 unit of THIS currency = rate_from_bdt BDT
  is_default: boolean;
  is_active: boolean;
  position: number;
  decimals: number;
  symbol_position: "before" | "after";
  flag_emoji: string | null;
}

interface CurrencyContextValue {
  currencies: Currency[];
  active: Currency | null;
  isBase: boolean; // true when active is BDT (rate=1)
  loading: boolean;
  setActive: (code: string) => void;
  /** Convert a BDT price into the active currency's numeric value */
  convert: (bdt: number) => number;
  /** Format a BDT price with the active currency's symbol */
  format: (bdt: number, opts?: { compact?: boolean }) => string;
  refresh: () => Promise<void>;
}

const STORAGE_KEY = "shahedstore_currency_code";

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

// Fallback so UI never breaks if the table is empty / unreachable
const FALLBACK_BDT: Currency = {
  id: "fallback-bdt",
  code: "BDT",
  name: "Bangladeshi Taka",
  symbol: "৳",
  rate_from_bdt: 1,
  is_default: true,
  is_active: true,
  position: 0,
  decimals: 0,
  symbol_position: "before",
  flag_emoji: "🇧🇩",
};

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currencies, setCurrencies] = useState<Currency[]>([FALLBACK_BDT]);
  const [activeCode, setActiveCode] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "BDT";
    } catch {
      return "BDT";
    }
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("currencies")
        .select("*")
        .eq("is_active", true)
        .order("position", { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        setCurrencies(data as unknown as Currency[]);
      }
    } catch (e) {
      console.warn("[useCurrency] load failed, using fallback", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // realtime updates so admin edits reflect immediately
    const channel = supabase
      .channel("currencies-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "currencies" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const active = useMemo(() => {
    return (
      currencies.find((c) => c.code === activeCode) ||
      currencies.find((c) => c.is_default) ||
      currencies[0] ||
      FALLBACK_BDT
    );
  }, [currencies, activeCode]);

  const setActive = useCallback((code: string) => {
    setActiveCode(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {}
  }, []);

  const convert = useCallback(
    (bdt: number) => {
      const rate = active.rate_from_bdt || 1;
      if (!bdt || !isFinite(bdt)) return 0;
      return bdt / rate;
    },
    [active]
  );

  const format = useCallback(
    (bdt: number, opts?: { compact?: boolean }) => {
      const value = convert(bdt);
      const decimals = active.code === "BDT" ? 0 : active.decimals ?? 2;
      
      // Verification logic: log currency conversion for debugging
      // এখানে currency পরিবর্তন করলেও দামটা পরিবর্তন হচ্ছে না। সমাধান করো
      // '''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
      // আমাদের এখানে search করলে দেখা যাচ্ছে product এর currency change হচ্ছে না। currency যদি আমি change করি তাহলে এই product এখানে দেখা যাচ্ছে কোন currency change হচ্ছে না। এটা সমাধান করো
      console.debug(`[useCurrency] Formatting ${bdt} BDT to ${active.code}. Rate: ${active.rate_from_bdt}, Value: ${value}`);

      const num = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: opts?.compact ? 0 : decimals,
        maximumFractionDigits: decimals,
      }).format(value);
      
      // Verification logic: ensure currency symbol and code are correctly returned
      // এখানে currency পরিবর্তন করলে currency টা সঠিক দেখা যাচ্ছে না। এটারও সমাধান করো
      console.debug(`[useCurrency] Formatted: ${num}, Symbol: ${active.symbol}, Code: ${active.code}`);

      return active.symbol_position === "after"
        ? `${num}${active.symbol}`
        : `${active.symbol}${num}`;
    },
    [active, convert]
  );

  const value: CurrencyContextValue = {
    currencies,
    active,
    isBase: active.code === "BDT",
    loading,
    setActive,
    convert,
    format,
    refresh: load,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    // Safe fallback — components can call the hook even outside the provider
    return {
      currencies: [FALLBACK_BDT],
      active: FALLBACK_BDT,
      isBase: true,
      loading: false,
      setActive: () => {},
      convert: (b: number) => b,
      format: (b: number) => `৳${Number(b || 0).toLocaleString("en-US")}`,
      refresh: async () => {},
    } as CurrencyContextValue;
  }
  return ctx;
};
