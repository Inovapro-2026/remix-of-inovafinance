-- CRITICAL: Remove ALL existing policies on users_matricula to eliminate recursion
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users_matricula' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users_matricula', pol.policyname);
    END LOOP;
END $$;

-- Create SIMPLE policies that don't cause recursion
-- Admin full access (using has_role which doesn't query users_matricula)
CREATE POLICY "admin_full_access"
ON public.users_matricula
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Anon can read all users (needed for login flow to check matricula)
CREATE POLICY "anon_read_all"
ON public.users_matricula
FOR SELECT
TO anon
USING (true);

-- Authenticated users can read their own row (by matching auth_user_id directly)
CREATE POLICY "user_read_own"
ON public.users_matricula
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- Authenticated users can update their own row
CREATE POLICY "user_update_own"
ON public.users_matricula
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Anyone can insert (registration)
CREATE POLICY "public_insert"
ON public.users_matricula
FOR INSERT
TO anon, authenticated
WITH CHECK (true);