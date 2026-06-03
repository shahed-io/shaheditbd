UPDATE public.site_settings
SET value = value
  || jsonb_build_object(
    'labelBilling', 'Billing Info',
    'labelItem', 'Item',
    'labelQty', 'Qty',
    'labelPrice', 'Price',
    'labelTotal', 'Total',
    'thankYouText', 'Thank you for shopping with us!'
  )
WHERE key = 'invoice_design';