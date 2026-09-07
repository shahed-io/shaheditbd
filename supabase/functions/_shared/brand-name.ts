// Brand name normalization (edge-function copy)
// Rule: the brand is always written "Shahed IT", in Bengali text too.

const NAME = "Shahed IT";

const BENGALI_VARIANTS = [
  "শাহেদ স্টোর",
  "শাহিদ স্টোর",
  "সাহেদ স্টোর",
  "শায়েদ স্টোর",
  "সাহিদ স্টোর",
  "শাহীদ স্টোর",
  "শহীদ স্টোর",
  "শাহেদ ষ্টোর",
  "শাহেদ ইস্টোর",
  "শাওন স্টোর",
  "শাহেদ আইটি",
];

export function normalizeBrandNameText(value: string): string {
  let out = value || "";

  for (const variant of BENGALI_VARIANTS) {
    out = out.split(variant).join(NAME);
  }

  out = out
    .replace(/ShahedStore/gi, NAME)
    .replace(/ShahedIT/g, NAME)
    .replace(/\b(?:Shahed|Shahid|Sahed|Shawon|Shahied|Sahid)\s+Store\b/gi, NAME)
    .replace(/\bShahed\s{2,}IT\b/g, NAME)
    .replace(/\bshahed\s+it\b/g, NAME);

  out = out
    .replace(/Shahed IT\s*Bangladesh/gi, `${NAME} Bangladesh`)
    .replace(/Shahed IT\s*BD/gi, `${NAME} BD`);

  return out
    .replace(/\s+([।.,!?…])/g, "$1")
    .replace(/ {2,}/g, " ");
}

export function normalizeBrandNameDeep<T>(value: T): T {
  if (typeof value === "string") return normalizeBrandNameText(value) as T;
  if (Array.isArray(value)) return value.map((item) => normalizeBrandNameDeep(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeBrandNameDeep(item)]),
    ) as T;
  }
  return value;
}
