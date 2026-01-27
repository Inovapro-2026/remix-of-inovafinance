-- Corrigir RLS da tabela rotinas para usar auth.uid() via auth_user_id
-- Remove políticas permissivas e cria políticas seguras

DROP POLICY IF EXISTS "Allow select rotinas by matricula" ON public.rotinas;
DROP POLICY IF EXISTS "Allow insert rotinas" ON public.rotinas;
DROP POLICY IF EXISTS "Allow update rotinas" ON public.rotinas;
DROP POLICY IF EXISTS "Allow delete rotinas" ON public.rotinas;
DROP POLICY IF EXISTS "admin_access" ON public.rotinas;
DROP POLICY IF EXISTS "admin_delete_rotinas" ON public.rotinas;
DROP POLICY IF EXISTS "user_access" ON public.rotinas;

-- Criar função auxiliar para obter matricula do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_user_matricula()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Políticas seguras baseadas em auth.uid() -> users_matricula.auth_user_id -> matricula

CREATE POLICY "Users can select own rotinas"
ON public.rotinas
FOR SELECT
USING (user_matricula = public.get_user_matricula());

CREATE POLICY "Users can insert own rotinas"
ON public.rotinas
FOR INSERT
WITH CHECK (user_matricula = public.get_user_matricula());

CREATE POLICY "Users can update own rotinas"
ON public.rotinas
FOR UPDATE
USING (user_matricula = public.get_user_matricula())
WITH CHECK (user_matricula = public.get_user_matricula());

CREATE POLICY "Users can delete own rotinas"
ON public.rotinas
FOR DELETE
USING (user_matricula = public.get_user_matricula());

-- Admin full access
CREATE POLICY "Admins have full access to rotinas"
ON public.rotinas
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Aplicar o mesmo padrão para rotina_executions, rotina_completions, transactions, etc.

-- rotina_executions
DROP POLICY IF EXISTS "Users can manage own executions" ON public.rotina_executions;
DROP POLICY IF EXISTS "user_access" ON public.rotina_executions;
DROP POLICY IF EXISTS "admin_access" ON public.rotina_executions;

CREATE POLICY "Users can select own rotina_executions"
ON public.rotina_executions FOR SELECT
USING (user_matricula = public.get_user_matricula());

CREATE POLICY "Users can insert own rotina_executions"
ON public.rotina_executions FOR INSERT
WITH CHECK (user_matricula = public.get_user_matricula());

CREATE POLICY "Users can update own rotina_executions"
ON public.rotina_executions FOR UPDATE
USING (user_matricula = public.get_user_matricula());

CREATE POLICY "Users can delete own rotina_executions"
ON public.rotina_executions FOR DELETE
USING (user_matricula = public.get_user_matricula());

-- rotina_completions
DROP POLICY IF EXISTS "user_access" ON public.rotina_completions;
DROP POLICY IF EXISTS "admin_access" ON public.rotina_completions;

CREATE POLICY "Users can manage own rotina_completions"
ON public.rotina_completions FOR ALL
USING (user_matricula = public.get_user_matricula())
WITH CHECK (user_matricula = public.get_user_matricula());

-- transactions
DROP POLICY IF EXISTS "user_access" ON public.transactions;
DROP POLICY IF EXISTS "admin_access" ON public.transactions;

CREATE POLICY "Users can manage own transactions"
ON public.transactions FOR ALL
USING (user_matricula = public.get_user_matricula())
WITH CHECK (user_matricula = public.get_user_matricula());

-- categories
DROP POLICY IF EXISTS "user_access" ON public.categories;
DROP POLICY IF EXISTS "admin_access" ON public.categories;

CREATE POLICY "Users can manage own categories"
ON public.categories FOR ALL
USING (user_matricula = public.get_user_matricula())
WITH CHECK (user_matricula = public.get_user_matricula());

-- goals
DROP POLICY IF EXISTS "user_access" ON public.goals;
DROP POLICY IF EXISTS "admin_access" ON public.goals;

CREATE POLICY "Users can manage own goals"
ON public.goals FOR ALL
USING (user_matricula = public.get_user_matricula())
WITH CHECK (user_matricula = public.get_user_matricula());

-- agenda_items
DROP POLICY IF EXISTS "user_access" ON public.agenda_items;
DROP POLICY IF EXISTS "admin_access" ON public.agenda_items;

CREATE POLICY "Users can manage own agenda_items"
ON public.agenda_items FOR ALL
USING (user_matricula = public.get_user_matricula())
WITH CHECK (user_matricula = public.get_user_matricula());

-- users_matricula - usuário pode ver/editar apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.users_matricula;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users_matricula;
DROP POLICY IF EXISTS "user_access" ON public.users_matricula;
DROP POLICY IF EXISTS "admin_access" ON public.users_matricula;
DROP POLICY IF EXISTS "Enable public signup" ON public.users_matricula;
DROP POLICY IF EXISTS "Enable all access for testing" ON public.users_matricula;

CREATE POLICY "Users can view own profile"
ON public.users_matricula FOR SELECT
USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.users_matricula FOR UPDATE
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Permitir insert para novos cadastros (antes de ter auth_user_id)
CREATE POLICY "Allow insert during signup"
ON public.users_matricula FOR INSERT
WITH CHECK (true);

-- Admin full access
CREATE POLICY "Admins have full access to users_matricula"
ON public.users_matricula FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));