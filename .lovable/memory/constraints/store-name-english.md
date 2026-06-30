---
name: Store name must always be English
description: The brand name is "Shahed Store" — always in English even inside Bengali text or AI-generated Bengali content. Never use Bengali script variants.
type: constraint
---
The store name is **"Shahed Store"** — written in English everywhere on the site, in the database, and in AI output, even when surrounding text is Bengali.

**Forbidden** (never produce, never store, sanitize on the way in):
- Bengali script: শাহেদ স্টোর, শাহিদ স্টোর, সাহেদ স্টোর, শায়েদ স্টোর, সাহিদ স্টোর, শাহীদ স্টোর, শহীদ স্টোর, শাহেদ ষ্টোর, শাহেদ ইস্টোর, শাওন স্টোর
- English variants: ShahedStore, Shahid Store, Sahed Store, Shawon Store
- Bengali possessive suffix "Shahed Store-এর" → use "Shahed Store"
- "Shahed Store বাংলাদেশ" → use "Shahed Store Bangladesh"

**How to apply:** In Bengali sentences write the name verbatim ("Shahed Store থেকে কিনুন"). All AI prompt sanitizers (`generate-product-faqs`, `generate-product-content`, `generate-product-blog`, `generate-product-reviews`, `AdminAiFaqGenerator`) normalize every variant → `Shahed Store`.

**Why:** User explicitly requested the brand name remain English everywhere, including AI-generated content.
