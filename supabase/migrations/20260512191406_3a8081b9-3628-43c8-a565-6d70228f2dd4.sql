UPDATE public.products
SET description = regexp_replace(
  description,
  '(Our Credibility:[\s\S]*?)?Important Notes:[\s\S]*?(\n*<!-- shahed-disclaimer -->|\n*### 📌|\Z)',
  E'### ⚠️ Important Notes\n\n❌ Sold Products Are Not Returnable.\n\n🛒 The product will be delivered instantly or within 1 hours (Rare cases: up to 24 hours)\n\n❌ Any of our products are requested to be activated within two days maximum. Otherwise the warranty will be void.\n\2',
  'g'
)
WHERE description ~ 'Important Notes:' AND description NOT ILIKE '%Sold Products Are Not Returnable%';