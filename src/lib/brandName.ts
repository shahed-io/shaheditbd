// Brand name normalization
// Rule: the brand is always written "Shahed IT" (English), in Bengali text too.
// Every legacy name / misspelling is corrected to that form.

const NAME = 'Shahed IT';

// Legacy + misspelled Bengali variants → always fixed to "Shahed IT"
const BENGALI_VARIANTS = [
  'শাহেদ স্টোর',
  'শাহিদ স্টোর',
  'সাহেদ স্টোর',
  'শায়েদ স্টোর',
  'সাহিদ স্টোর',
  'শাহীদ স্টোর',
  'শহীদ স্টোর',
  'শাহেদ ষ্টোর',
  'শাহেদ ইস্টোর',
  'শাওন স্টোর',
  'শাহেদ আইটি',
];

export const normalizeBrandNameText = (value: string): string => {
  let out = value || '';

  // 1. Bengali legacy/misspelled variants → Shahed IT
  for (const variant of BENGALI_VARIANTS) {
    out = out.split(variant).join(NAME);
  }

  // 2. Latin legacy names & misspellings → Shahed IT
  out = out
    .replace(/ShahedStore/gi, NAME)
    .replace(/ShahedIT/g, NAME)
    .replace(/\b(?:Shahed|Shahid|Sahed|Shawon|Shahied|Sahid)\s+Store\b/gi, NAME)
    .replace(/\bShahed\s{2,}IT\b/g, NAME)
    .replace(/\bshahed\s+it\b/g, NAME);

  // 3. Country suffix normalization
  out = out
    .replace(/Shahed IT\s*Bangladesh/gi, `${NAME} Bangladesh`)
    .replace(/Shahed IT\s*BD/gi, `${NAME} BD`);

  // 4. Generic: ensure a space between Latin letters/digits and Bengali script
  //    (fixes cases like "ITথেকে", "VPNএর দাম", "2499৳" style joins)
  out = out
    .replace(/([A-Za-z0-9])([\u0985-\u09B9\u09BE-\u09CC\u09D7\u09DC-\u09DF])/g, '$1 $2')
    .replace(/([\u0985-\u09B9\u09BE-\u09CC\u09D7\u09DC-\u09DF])([A-Za-z0-9])/g, '$1 $2');

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
