// Brand name normalization (edge-function copy)
// Rule (updated):
//   • English contexts  → "Shahed Store"
//   • Bengali contexts  → "শাহেদ স্টোর"
//   • Misspellings are auto-corrected in the matching language

const EN_NAME = "Shahed Store";
const BN_NAME = "শাহেদ স্টোর";

const BENGALI_MISSPELLINGS = [
  "শাহিদ স্টোর",
  "সাহেদ স্টোর",
  "শায়েদ স্টোর",
  "সাহিদ স্টোর",
  "শাহীদ স্টোর",
  "শহীদ স্টোর",
  "শাহেদ ষ্টোর",
  "শাহেদ ইস্টোর",
  "শাওন স্টোর",
];

const BN_RE = /[\u0980-\u09FF]/;

function isBengaliContext(full: string, matchIndex: number, matchLen: number): boolean {
  const before = full.slice(Math.max(0, matchIndex - 40), matchIndex);
  const after = full.slice(matchIndex + matchLen, matchIndex + matchLen + 40);
  return BN_RE.test(before) || BN_RE.test(after);
}

export function normalizeBrandNameText(value: string): string {
  let out = value || "";

  for (const variant of BENGALI_MISSPELLINGS) {
    out = out.split(variant).join(BN_NAME);
  }

  out = out
    .replace(/ShahedStore/gi, EN_NAME)
    .replace(/\b(?:Shahid|Sahed|Shawon|Shahied|Sahid)\s+Store\b/gi, EN_NAME)
    .replace(/Shahed\s{2,}Store/g, EN_NAME);

  out = out.replace(
    /Shahed\s*Store(?:\s*-\s*|\s*)?(এর|কে|তে|এ|ের|য়|ে)?/g,
    (match, suffix, offset, full) => {
      if (isBengaliContext(full, offset, match.length)) {
        return BN_NAME + (suffix || "");
      }
      return EN_NAME;
    },
  );

  out = out
    .replace(/Shahed\s*Store\s*বাংলাদেশ/g, `${BN_NAME} বাংলাদেশ`)
    .replace(/Shahed Store\s*Bangladesh/gi, `${EN_NAME} Bangladesh`)
    .replace(/Shahed Store\s*BD/gi, `${EN_NAME} BD`);

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
