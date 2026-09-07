
-- Add custom_fields column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]'::jsonb;

-- Add custom_field_values column to order_items table
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS custom_field_values JSONB DEFAULT '{}'::jsonb;
