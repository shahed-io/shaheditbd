UPDATE public.site_settings
SET value = jsonb_build_object(
  'brandColor', '#7c3aed',
  'brandLight', '#f3f0ff',
  'headerBg', 'auto',
  'headerText', '#ffffff',
  'totalColor', 'auto',
  'accentText', '#1a1a2e',
  'borderRadius', 12,
  'showLogo', true,
  'companyName', 'Shahed Store',
  'companyWebsite', 'shahedstore.com.bd',
  'companyEmail', 'info@shahedstore.com.bd',
  'companyPhone', '01840099853',
  'companyAddress', '',
  'invoiceTitle', 'INVOICE',
  'thankYouText', 'ধন্যবাদ আমাদের সাথে কেনাকাটা করার জন্য!',
  'footerNote', 'This is a computer-generated invoice and does not require a signature.',
  'labelBilling', 'বিলিং তথ্য',
  'labelPayment', 'Payment Info',
  'labelItem', 'পণ্যের নাম',
  'labelQty', 'পরিমাণ',
  'labelPrice', 'দাম',
  'labelTotal', 'মোট',
  'labelSubtotal', 'Subtotal',
  'labelDiscount', 'Discount',
  'labelGrandTotal', 'Total'
)
WHERE key = 'invoice_design';