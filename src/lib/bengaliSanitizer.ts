// Bengali text sanitizer — fixes common Bengali spelling mistakes that
// creep into admin-typed or AI-generated content. Keep this list conservative:
// each entry MUST be an unambiguous wrong→right spelling, never a stylistic choice.
//
// Add a new pair here whenever we see the same Bengali typo appear in
// invoices, notifications, offers or emails.

const REPLACEMENTS: Array<[RegExp, string]> = [
  // পুরষ্কার → পুরস্কার (very common typo)
  [/পুরষ্কার/g, 'পুরস্কার'],
  [/পুরষ্কৃত/g, 'পুরস্কৃত'],
  // ঘোষনা → ঘোষণা
  [/ঘোষনা/g, 'ঘোষণা'],
  // ধন্যবাধ → ধন্যবাদ
  [/ধন্যবাধ/g, 'ধন্যবাদ'],
  // ষ্টোর → স্টোর  (brand name & generic word)
  [/ষ্টোর/g, 'স্টোর'],
  // দারুন → দারুণ
  [/দারুন(?=[\s,।!?ঃ])/g, 'দারুণ'],
  [/^দারুন$/g, 'দারুণ'],
  // Taka symbol spacing: "৳ 500" → "৳500"
  [/৳\s+(?=[\d০-৯])/g, '৳'],
];

export function sanitizeBengali(input: string | null | undefined): string {
  if (!input) return input ?? '';
  let out = String(input);
  for (const [pat, rep] of REPLACEMENTS) {
    out = out.replace(pat, rep);
  }
  return out;
}

// Deep-sanitize any plain object/array — leaves numbers, booleans, dates alone.
export function sanitizeBengaliDeep<T>(value: T): T {
  if (value == null) return value;
  if (typeof value === 'string') return sanitizeBengali(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => sanitizeBengaliDeep(v)) as unknown as T;
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeBengaliDeep(v);
    }
    return out as unknown as T;
  }
  return value;
}
