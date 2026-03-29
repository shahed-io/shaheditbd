
-- ═══════════════════════════════════════════════════════════════════
-- FIX 1: Guest orders with customer PII are publicly readable
-- Remove the unsafe "OR (user_id IS NULL)" SELECT policy
-- ═══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

-- ═══════════════════════════════════════════════════════════════════
-- FIX 3: Users Can Manipulate Payment Status and Totals on Pending Orders
-- Drop user UPDATE policy — only admins should update orders
-- ═══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;

-- Also fix order_items: remove the unsafe guest SELECT policy
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;

-- Also fix order_items INSERT policies that duplicate
DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;

-- ═══════════════════════════════════════════════════════════════════
-- FIX 5: Blog comment author emails exposed via blog_comments_public view
-- Recreate the view WITHOUT user_id to prevent identity exposure
-- ═══════════════════════════════════════════════════════════════════
DROP VIEW IF EXISTS public.blog_comments_public;
CREATE VIEW public.blog_comments_public
WITH (security_invoker = on) AS
  SELECT id, post_id, parent_id, author_name, content, created_at, status
  FROM public.blog_comments
  WHERE status = 'approved';
