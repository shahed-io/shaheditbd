
-- Drop existing restrictive SELECT policy on user_roles and replace with permissive
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;

-- Create PERMISSIVE policy (default) so authenticated users can read their own role
CREATE POLICY "Users can read own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
