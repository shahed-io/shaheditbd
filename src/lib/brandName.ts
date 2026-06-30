const STORE_NAME = 'Shahed Store';

const BENGALI_STORE_NAME_VARIANTS = [
  'শাহেদ স্টোর',
  'শাহিদ স্টোর',
  'সাহেদ স্টোর',
  'শায়েদ স্টোর',
  'শায়েদ স্টোর',
  'সাহিদ স্টোর',
  'শাহীদ স্টোর',
  'শহীদ স্টোর',
  'শাহেদ ষ্টোর',
  'শাহেদ ইস্টোর',
  'শাওন স্টোর',
];

export const normalizeBrandNameText = (value: string): string => {
  let out = value || '';

  BENGALI_STORE_NAME_VARIANTS.forEach((variant) => {
    out = out.split(variant).join(STORE_NAME);
  });

  return out
    .replace(/Shahed\s*Store\s*বাংলাদেশ/gi, 'Shahed Store Bangladesh')
    .replace(/Shahed\s*Store\s*Bangladesh/gi, 'Shahed Store Bangladesh')
    .replace(/Shahed\s*Store\s*BD/gi, 'Shahed Store BD')
    .replace(/ShahedStore/gi, STORE_NAME)
    .replace(/Shahid\s*Store|Sahed\s*Store|Shawon\s*Store/gi, STORE_NAME)
    .replace(/Shahed\s+Store/gi, STORE_NAME)
    .replace(/Shahed Store\s*(?:'|’)s\b/gi, STORE_NAME)
    .replace(/Shahed Store\s*(?:-|–|—)?\s*(?:এর|কে|এ)(?=\s|$|[।.,!?…])/g, STORE_NAME)
    .replace(/Shahed Storeে(?=\s|$|[।.,!?…])/g, STORE_NAME)
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