// Brand name normalization
// Rule (updated):
//   • English contexts  → "Shahed Store"
//   • Bengali contexts  → "শাহেদ স্টোর" (correct Bengali spelling)
//   • All misspellings (Bengali or English) → corrected form in the matching language

const EN_NAME = 'Shahed Store';
const BN_NAME = 'শাহেদ স্টোর';

// Misspelled Bengali variants → always fixed to the correct Bengali form
const BENGALI_MISSPELLINGS = [
  'শাহিদ স্টোর',
  'সাহেদ স্টোর',
  'শায়েদ স্টোর',
  'সাহিদ স্টোর',
  'শাহীদ স্টোর',
  'শহীদ স্টোর',
  'শাহেদ ষ্টোর',
  'শাহেদ ইস্টোর',
  'শাওন স্টোর',
];

// Bengali Unicode range
const BN_RE = /[\u0980-\u09FF]/;

const isBengaliContext = (full: string, matchIndex: number, matchLen: number): boolean => {
  // Look at ~40 chars around the match for Bengali script
  const before = full.slice(Math.max(0, matchIndex - 40), matchIndex);
  const after = full.slice(matchIndex + matchLen, matchIndex + matchLen + 40);
  return BN_RE.test(before) || BN_RE.test(after);
};

export const normalizeBrandNameText = (value: string): string => {
  let out = value || '';

  // 1. Fix misspelled Bengali variants → correct Bengali
  for (const variant of BENGALI_MISSPELLINGS) {
    out = out.split(variant).join(BN_NAME);
  }

  // 2. Fix English misspellings → Shahed Store
  out = out
    .replace(/ShahedStore/gi, EN_NAME)
    .replace(/\b(?:Shahid|Sahed|Shawon|Shahied|Sahid)\s+Store\b/gi, EN_NAME)
    .replace(/Shahed\s{2,}Store/g, EN_NAME);

  // 3. If "Shahed Store" appears inside a Bengali context, convert to Bengali form
  //    (handles case markers like "Shahed Store-এর" / "Shahed Storeে" too)
  out = out.replace(
    /Shahed\s*Store(\s*-\s*|\s+)?(এর|কে|তে|এ|ের|য়|ে)?/g,
    (match, separator, suffix, offset, full) => {
      if (isBengaliContext(full, offset, match.length)) {
        // If there's a suffix like 'এর', we usually don't want a space before it in Bengali
        const finalSeparator = suffix ? '' : (separator || ' ');
        return BN_NAME + finalSeparator + (suffix || '');
      }
      // English context — keep English
      return EN_NAME + (separator || ' ') + (suffix || '');
    }
  );

  // 4. Country suffix normalization (English only)
  out = out
    .replace(/Shahed\s*Store\s*বাংলাদেশ/g, `${BN_NAME} বাংলাদেশ`)
    .replace(/Shahed Store\s*Bangladesh/gi, `${EN_NAME} Bangladesh`)
    .replace(/Shahed Store\s*BD/gi, `${EN_NAME} BD`);

  // 5. Cleanup double spaces / spaces before Bengali punctuation
  return out
    .replace(/\s+([।.,!?…])/g, '$1')
    .replace(/ {2,}/g, ' ');
};

export const normalizeBrandNameDeep = <T,>(value: T): T => {
  if (typeof value === 'string') return normalizeBrandNameText(value) as T;
  if (Array.isArray(value)) return value.map((item) => normalizeBrandNameDeep(item)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeBrandNameDeep(item)])
    ) as T;
  }
  return value;
};

export const normalizeBrandNameFaqs = <T extends { q: string; a: string }>(faqs: T[]): T[] =>
  faqs.map((faq) => ({
    ...faq,
    q: normalizeBrandNameText(faq.q),
    a: normalizeBrandNameText(faq.a),
  }));
