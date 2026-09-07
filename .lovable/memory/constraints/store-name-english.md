---
name: Brand name and domain
description: The brand is "Shahed IT" (English spelling everywhere, including Bengali text) on the domain shahedit.com. All legacy "Shahed Store" / "শাহেদ স্টোর" / shahedstore.com.bd naming is retired.
type: constraint
---
The brand name is **Shahed IT** and the website domain is **shahedit.com**.

- Write `Shahed IT` in English AND inside Bengali sentences (no Bengali transliteration of the name).
- Primary URLs: `https://shahedit.com`, `https://www.shahedit.com`; contact email `info@shahedit.com`.

**Retired / forbidden (never generate, auto-correct on input):**
- `Shahed Store`, `ShahedStore`, `Shahid Store`, `Sahed Store`, `Shawon Store`, `Shahied Store`
- `শাহেদ স্টোর` and all its misspellings, `শাহেদ আইটি`
- Domain `shahedstore.com.bd` (any path or www form)

**Exception:** the transactional email sender domain remains `get.shahedstore.com.bd`
(verified with the email provider). Do not rewrite it in edge functions.
Social handles (`facebook.com/Shahed.Store365`, `t.me/Shahed_Store`,
`instagram.com/shahedstore.com.bd`) still use the old account names until the
user provides renamed accounts.

**How to apply:** normalizers `src/lib/brandName.ts` and
`supabase/functions/_shared/brand-name.ts` map every legacy variant to
`Shahed IT`; all AI prompts instruct the model to use `Shahed IT`.
