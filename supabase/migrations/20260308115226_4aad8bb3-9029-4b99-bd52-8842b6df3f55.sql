
-- Fix: "Admins can manage roles" is RESTRICTIVE ALL, which also blocks SELECT for non-admins
-- Split it into write-only (INSERT/UPDATE/DELETE) so it doesn't block users reading their own role

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Admins can do everything (PERMISSIVE)
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can read their own role (PERMISSIVE - already recreated in previous migration)
-- Re-ensure it exists
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
