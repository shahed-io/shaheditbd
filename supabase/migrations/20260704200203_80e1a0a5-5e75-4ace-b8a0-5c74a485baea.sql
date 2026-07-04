
-- Hide author_email from anonymous visitors on blog_comments and product_reviews
REVOKE SELECT ON public.blog_comments FROM anon;
GRANT SELECT (id, post_id, user_id, author_name, content, status, parent_id, created_at) ON public.blog_comments TO anon;

REVOKE SELECT ON public.product_reviews FROM anon;
GRANT SELECT (id, product_id, product_slug, user_id, author_name, rating, title, body, status, is_verified, helpful_count, created_at, updated_at) ON public.product_reviews TO anon;
