-- Hide reviewer email from public/auth roles (admins/service_role keep access)
REVOKE SELECT (author_email) ON public.product_reviews FROM anon, authenticated;

-- Re-assert cost_price column-level revoke (idempotent)
REVOKE SELECT (cost_price) ON public.products FROM anon, authenticated;