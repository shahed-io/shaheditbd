-- Lock down sensitive columns from public/authenticated reads

-- products.cost_price: only admins (via admin_list_products_with_cost RPC) and service_role
REVOKE SELECT (cost_price) ON public.products FROM anon, authenticated;

-- coupons.customer_email: do not leak per-user-targeted coupon emails
REVOKE SELECT (customer_email) ON public.coupons FROM anon, authenticated;