// Bengali text sanitizer for edge functions. Mirror of src/lib/bengaliSanitizer.ts.
// Keep both files in sync when you add a new correction.

const REPLACEMENTS: Array<[RegExp, string]> = [
  [/পুরষ্কার/g, 'পুরস্কার'],
  [/পুরষ্কৃত/g, 'পুরস্কৃত'],
  [/ঘোষনা/g, 'ঘোষণা'],
  [/ধন্যবাধ/g, 'ধন্যবাদ'],
  [/ষ্টোর/g, 'স্টোর'],
  [/দারুন(?=[\s,।!?ঃ])/g, 'দারুণ'],
  [/^দারুন$/g, 'দারুণ'],
  [/৳\s+(?=[\d০-৯])/g, '৳'],
];

export function sanitizeBengali(input: string | null | undefined): string {
  if (!input) return input ?? '';
  let out = String(input);
  for (const [pat, rep] of REPLACEMENTS) out = out.replace(pat, rep);
  return out;
}
