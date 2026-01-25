-- =====================================================
-- CORREÇÃO DE SEGURANÇA - PARTE 2: MAIS TABELAS
-- =====================================================

-- 6. CORRIGIR POLÍTICAS DA TABELA: transactions
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;

CREATE POLICY "Users can manage transactions"
ON public.transactions FOR ALL
USING (
  user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid())
)
WITH CHECK (
  user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid())
);

-- 7. CORRIGIR POLÍTICAS DA TABELA: categories
DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can view own categories" ON public.categories;

CREATE POLICY "Users can manage categories"
ON public.categories FOR ALL
USING (
  user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid())
)
WITH CHECK (
  user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid())
);

-- 8. CORRIGIR POLÍTICAS DA TABELA: goals
DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can view own goals" ON public.goals;

CREATE POLICY "Users can manage goals"
ON public.goals FOR ALL
USING (
  user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid())
)
WITH CHECK (
  user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid())
);

-- 9. CORRIGIR POLÍTICAS DA TABELA: user_sessions
DROP POLICY IF EXISTS "Public can create user sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Public can update user sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Public can view user sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.user_sessions;

CREATE POLICY "Users can manage sessions"
ON public.user_sessions FOR ALL
USING (
  user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid())
  OR has_role(auth.uid(), 'admin')
)
WITH CHECK (
  user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid())
  OR has_role(auth.uid(), 'admin')
);

-- 10. CORRIGIR POLÍTICAS DA TABELA: rotinas_transporte
DROP POLICY IF EXISTS "Users can create their own transport routines" ON public.rotinas_transporte;
DROP POLICY IF EXISTS "Users can delete their own transport routines" ON public.rotinas_transporte;
DROP POLICY IF EXISTS "Users can update their own transport routines" ON public.rotinas_transporte;
DROP POLICY IF EXISTS "Users can view their own transport routines" ON public.rotinas_transporte;

CREATE POLICY "Users can manage transport routines"
ON public.rotinas_transporte FOR ALL
USING (
  user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid())
)
WITH CHECK (
  user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid())
);

-- 11. CORRIGIR POLÍTICAS DA TABELA: rotina_executions
DROP POLICY IF EXISTS "Users can create their own rotina executions" ON public.rotina_executions;
DROP POLICY IF EXISTS "Users can delete their own rotina executions" ON public.rotina_executions;
DROP POLICY IF EXISTS "Users can update their own rotina executions" ON public.rotina_executions;
DROP POLICY IF EXISTS "Users can view their own rotina executions" ON public.rotina_executions;

CREATE POLICY "Users can manage rotina executions"
ON public.rotina_executions FOR ALL
USING (
  user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid())
)
WITH CHECK (
  user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid())
);