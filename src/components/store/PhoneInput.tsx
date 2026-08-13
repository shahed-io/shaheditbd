import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { COUNTRIES, DEFAULT_COUNTRY, joinPhone, splitPhone, type Country } from '@/lib/countries';

type Props = {
  value: string;
  onChange: (fullNumber: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
};

/**
 * International phone input — searchable country picker (all world dial codes)
 * plus free-form number entry. Emits the combined E.164-style string, e.g. +8801XXXXXXXXX.
 */
const PhoneInput = ({
  value,
  onChange,
  placeholder = 'Phone number',
  className = '',
  inputClassName = '',
  id,
  name,
  required,
  disabled,
  autoFocus,
}: Props) => {
  const initial = useMemo(() => splitPhone(value), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [country, setCountry] = useState<Country>(initial.country || DEFAULT_COUNTRY);
  const [local, setLocal] = useState(initial.local);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  // Keep in sync when the parent resets/loads the value externally.
  useEffect(() => {
    const next = splitPhone(value);
    if (joinPhone(country, local) !== (value || '')) {
      setCountry(next.country);
      setLocal(next.local);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, '');
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dial.replace('+', '').startsWith(q)
    );
  }, [query]);

  const emit = (c: Country, l: string) => onChange(joinPhone(c, l));

  return (
    <div ref={wrapRef} className={`relative flex items-stretch gap-2 ${className}`}>
      {/* Country selector */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        aria-label="Select country code"
        className={`flex items-center gap-1.5 px-3 rounded-xl border border-border bg-muted/30 text-sm font-semibold text-foreground flex-shrink-0 transition-colors hover:border-primary disabled:opacity-60 ${inputClassName}`}
      >
        <span className="text-base leading-none">{country.flag}</span>
        <span className="whitespace-nowrap">{country.dial}</span>
        <ChevronDown size={14} className="opacity-60" />
      </button>

      {/* Number */}
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        value={local}
        onChange={e => {
          const v = e.target.value.replace(/[^0-9\s-]/g, '');
          setLocal(v);
          emit(country, v);
        }}
        placeholder={placeholder}
        className={`flex-1 min-w-0 w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors ${inputClassName}`}
      />

      {open && (
        <div
          className="absolute z-[200] top-full left-0 mt-2 w-[300px] max-w-[92vw] rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
          role="listbox"
        >
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40">
              <Search size={14} className="text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search country or code..."
                className="flex-1 bg-transparent text-sm text-foreground outline-none"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  setCountry(c);
                  setOpen(false);
                  setQuery('');
                  emit(c, local);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60 ${
                  c.code === country.code ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground'
                }`}
              >
                <span className="text-base leading-none">{c.flag}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.dial}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">No country found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneInput;
