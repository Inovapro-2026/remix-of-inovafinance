-- Fix: RLS policies so authenticated users can read/write their own routines by mapping auth.uid() -> users_matricula.matricula

-- Helper function: get current user's matricula
CREATE OR REPLACE FUNCTION public.current_user_matricula()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.matricula
  FROM public.users_matricula u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1
$$;

-- ROTINAS
ALTER TABLE public.rotinas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own rotinas" ON public.rotinas;
DROP POLICY IF EXISTS "Users can insert own rotinas" ON public.rotinas;
DROP POLICY IF EXISTS "Users can update own rotinas" ON public.rotinas;
DROP POLICY IF EXISTS "Users can delete own rotinas" ON public.rotinas;

CREATE POLICY "Users can view own rotinas"
ON public.rotinas
FOR SELECT
USING (user_matricula = public.current_user_matricula());

CREATE POLICY "Users can insert own rotinas"
ON public.rotinas
FOR INSERT
WITH CHECK (user_matricula = public.current_user_matricula());

CREATE POLICY "Users can update own rotinas"
ON public.rotinas
FOR UPDATE
USING (user_matricula = public.current_user_matricula())
WITH CHECK (user_matricula = public.current_user_matricula());

CREATE POLICY "Users can delete own rotinas"
ON public.rotinas
FOR DELETE
USING (user_matricula = public.current_user_matricula());

-- ROTINA_EXECUTIONS
ALTER TABLE public.rotina_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own rotina executions" ON public.rotina_executions;
DROP POLICY IF EXISTS "Users can insert own rotina executions" ON public.rotina_executions;
DROP POLICY IF EXISTS "Users can update own rotina executions" ON public.rotina_executions;
DROP POLICY IF EXISTS "Users can delete own rotina executions" ON public.rotina_executions;

CREATE POLICY "Users can view own rotina executions"
ON public.rotina_executions
FOR SELECT
USING (user_matricula = public.current_user_matricula());

CREATE POLICY "Users can insert own rotina executions"
ON public.rotina_executions
FOR INSERT
WITH CHECK (user_matricula = public.current_user_matricula());

CREATE POLICY "Users can update own rotina executions"
ON public.rotina_executions
FOR UPDATE
USING (user_matricula = public.current_user_matricula())
WITH CHECK (user_matricula = public.current_user_matricula());

CREATE POLICY "Users can delete own rotina executions"
ON public.rotina_executions
FOR DELETE
USING (user_matricula = public.current_user_matricula());

-- ROTINA_COMPLETIONS
ALTER TABLE public.rotina_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own rotina completions" ON public.rotina_completions;
DROP POLICY IF EXISTS "Users can insert own rotina completions" ON public.rotina_completions;
DROP POLICY IF EXISTS "Users can delete own rotina completions" ON public.rotina_completions;

CREATE POLICY "Users can view own rotina completions"
ON public.rotina_completions
FOR SELECT
USING (user_matricula = public.current_user_matricula());

CREATE POLICY "Users can insert own rotina completions"
ON public.rotina_completions
FOR INSERT
WITH CHECK (user_matricula = public.current_user_matricula());

CREATE POLICY "Users can delete own rotina completions"
ON public.rotina_completions
FOR DELETE
USING (user_matricula = public.current_user_matricula());

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_users_matricula_auth_user_id ON public.users_matricula (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_rotinas_user_matricula ON public.rotinas (user_matricula);
CREATE INDEX IF NOT EXISTS idx_rotina_executions_user_matricula ON public.rotina_executions (user_matricula);
CREATE INDEX IF NOT EXISTS idx_rotina_completions_user_matricula ON public.rotina_completions (user_matricula);
