-- Fix RLS policies for matricula-based auth (no Supabase Auth session)

-- =============================================
-- TRANSACTIONS TABLE
-- =============================================
DROP POLICY IF EXISTS "admin_access" ON public.transactions;
DROP POLICY IF EXISTS "user_access" ON public.transactions;
DROP POLICY IF EXISTS "Users can manage transactions" ON public.transactions;
DROP POLICY IF EXISTS "public_transactions_select" ON public.transactions;
DROP POLICY IF EXISTS "public_transactions_insert" ON public.transactions;
DROP POLICY IF EXISTS "public_transactions_update" ON public.transactions;
DROP POLICY IF EXISTS "public_transactions_delete" ON public.transactions;

-- Allow SELECT for transactions belonging to valid matricula
CREATE POLICY "public_transactions_select"
ON public.transactions
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.users_matricula um
    WHERE um.matricula = transactions.user_matricula
  )
);

-- Allow INSERT when user_matricula exists
CREATE POLICY "public_transactions_insert"
ON public.transactions
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users_matricula um
    WHERE um.matricula = transactions.user_matricula
  )
);

-- Allow UPDATE for transactions of valid matricula
CREATE POLICY "public_transactions_update"
ON public.transactions
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.users_matricula um
    WHERE um.matricula = transactions.user_matricula
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users_matricula um
    WHERE um.matricula = transactions.user_matricula
  )
);

-- Allow DELETE for transactions of valid matricula
CREATE POLICY "public_transactions_delete"
ON public.transactions
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.users_matricula um
    WHERE um.matricula = transactions.user_matricula
  )
);

-- =============================================
-- USERS_MATRICULA TABLE (for profile updates)
-- =============================================
DROP POLICY IF EXISTS "Users can view their own data" ON public.users_matricula;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users_matricula;
DROP POLICY IF EXISTS "Allow public read access" ON public.users_matricula;
DROP POLICY IF EXISTS "public_users_select" ON public.users_matricula;
DROP POLICY IF EXISTS "public_users_update" ON public.users_matricula;
DROP POLICY IF EXISTS "public_users_insert" ON public.users_matricula;

-- Allow SELECT for all users (needed for login by matricula)
CREATE POLICY "public_users_select"
ON public.users_matricula
FOR SELECT
TO public
USING (true);

-- Allow INSERT for new registrations
CREATE POLICY "public_users_insert"
ON public.users_matricula
FOR INSERT
TO public
WITH CHECK (true);

-- Allow UPDATE for existing users
CREATE POLICY "public_users_update"
ON public.users_matricula
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- =============================================
-- CATEGORIES TABLE
-- =============================================
DROP POLICY IF EXISTS "categories_select" ON public.categories;
DROP POLICY IF EXISTS "categories_insert" ON public.categories;
DROP POLICY IF EXISTS "public_categories_select" ON public.categories;
DROP POLICY IF EXISTS "public_categories_insert" ON public.categories;

-- Allow SELECT for categories
CREATE POLICY "public_categories_select"
ON public.categories
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.users_matricula um
    WHERE um.matricula = categories.user_matricula
  )
);

-- Allow INSERT for new categories
CREATE POLICY "public_categories_insert"
ON public.categories
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users_matricula um
    WHERE um.matricula = categories.user_matricula
  )
);