-- Drop existing INSERT policies that are blocking registration
DROP POLICY IF EXISTS "users_matricula_admin_insert" ON public.users_matricula;
DROP POLICY IF EXISTS "allow_registration" ON public.users_matricula;

-- Create policy to allow registration for both anonymous and authenticated users
CREATE POLICY "allow_user_registration"
ON public.users_matricula
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Keep admin full access for other operations
-- (admin_full_access already exists)