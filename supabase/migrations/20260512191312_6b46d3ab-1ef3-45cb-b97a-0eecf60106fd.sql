UPDATE public.products
SET description = regexp_replace(
  description,
  '###[^\n]*গুরুত্বপূর্ণ তথ্য[\s\S]*?(\n*<!-- shahed-disclaimer -->|\n*### 📌|\Z)',
  E'### ⚠️ Important Notes\n\n❌ Sold Products Are Not Returnable.\n\n🛒 The product will be delivered instantly or within 1 hours (Rare cases: up to 24 hours)\n\n❌ Any of our products are requested to be activated within two days maximum. Otherwise the warranty will be void.\n\1',
  'g'
)
WHERE description ~ '###[^\n]*গুরুত্বপূর্ণ তথ্য';