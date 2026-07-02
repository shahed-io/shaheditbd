---
name: Store name spelling by language
description: In English write "Shahed Store". In Bengali write "শাহেদ স্টোর" (correct Bengali spelling). Never use misspelled variants in either language.
type: constraint
---
The store name must be written correctly based on the surrounding language.

- **English text →** `Shahed Store` (exact)
- **Bengali text →** `শাহেদ স্টোর` (শা-হে-দ, "হে"-তে এ-কার — this is the correct Bengali spelling)

**Forbidden misspellings** (sanitize on input, never generate):
- Wrong Bengali: শাহিদ স্টোর, সাহেদ স্টোর, শায়েদ স্টোর, সাহিদ স্টোর, শাহীদ স্টোর, শহীদ স্টোর, শাহেদ ষ্টোর, শাহেদ ইস্টোর, শাওন স্টোর
- Wrong English: ShahedStore, Shahid Store, Sahed Store, Shawon Store, Shahied Store
- Mixed: "Shahed Store-এর" / "Shahed Storeে" (English name + Bengali suffix). Use the Bengali form with case marker instead: শাহেদ স্টোরের, শাহেদ স্টোরে, শাহেদ স্টোরকে.

**How to apply:**
- All normalizers (`src/lib/brandName.ts`, `supabase/functions/_shared/brand-name.ts`) detect Bengali context by looking for Bengali script (\u0980–\u09FF) around the match:
  - Bengali context → converts to `শাহেদ স্টোর` (keeps any case marker suffix)
  - English context → converts to `Shahed Store`
- All AI prompts (`generate-product-faqs`, `generate-product-content`, `generate-product-blog`, `generate-product-reviews`, `generate-topic-blog`, `ai-generate-notice`, `ai-support-chat`) instruct the model to use the language-appropriate spelling.

**Why:** User explicitly requested that Bengali content use the correct Bengali spelling "শাহেদ স্টোর" while English content keeps "Shahed Store". The previous rule (force English everywhere) was wrong and made Bengali output feel unnatural.
