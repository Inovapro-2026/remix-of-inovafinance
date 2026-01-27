-- Política permissiva para leitura de rotinas por matrícula (mesmo padrão usado em live_chat)
-- Permitir SELECT para usuários autenticados e anônimos filtrando por user_matricula no app

DROP POLICY IF EXISTS "Users can view own rotinas" ON public.rotinas;

CREATE POLICY "Allow select rotinas by matricula"
ON public.rotinas
FOR SELECT
USING (true);

-- Política permissiva para INSERT
DROP POLICY IF EXISTS "Users can insert own rotinas" ON public.rotinas;

CREATE POLICY "Allow insert rotinas"
ON public.rotinas
FOR INSERT
WITH CHECK (true);

-- Política permissiva para UPDATE
DROP POLICY IF EXISTS "Users can update own rotinas" ON public.rotinas;

CREATE POLICY "Allow update rotinas"
ON public.rotinas
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Política permissiva para DELETE
DROP POLICY IF EXISTS "Users can delete own rotinas" ON public.rotinas;

CREATE POLICY "Allow delete rotinas"
ON public.rotinas
FOR DELETE
USING (true);