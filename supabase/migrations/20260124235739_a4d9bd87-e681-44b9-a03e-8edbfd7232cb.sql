-- First, add auth_user_id column to users_matricula
ALTER TABLE public.users_matricula ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "users_view_own_profile" ON public.users_matricula;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.users_matricula;
DROP POLICY IF EXISTS "allow_public_registration" ON public.users_matricula;
DROP POLICY IF EXISTS "admins_delete_users" ON public.users_matricula;

-- Create simple policies that won't cause recursion
-- Allow all authenticated users to SELECT (admins need this for the panel)
CREATE POLICY "users_view_own_or_admin_all"
ON public.users_matricula
FOR SELECT
TO authenticated
USING (
  auth.uid() = auth_user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Allow anon to SELECT for public access (login flow needs to check matricula)
CREATE POLICY "anon_can_check_matricula"
ON public.users_matricula
FOR SELECT
TO anon
USING (true);

-- Policy for users to update their own data or admin to update all
CREATE POLICY "users_or_admin_update"
ON public.users_matricula
FOR UPDATE
TO authenticated
USING (
  auth.uid() = auth_user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  auth.uid() = auth_user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Policy for public registration
CREATE POLICY "allow_registration"
ON public.users_matricula
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy for admin to delete users
CREATE POLICY "admin_delete_users"
ON public.users_matricula
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));