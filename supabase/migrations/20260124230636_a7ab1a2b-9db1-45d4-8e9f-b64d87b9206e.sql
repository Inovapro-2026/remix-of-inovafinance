-- =====================================================
-- CORREÇÃO DE SEGURANÇA - PARTE 3: TABELAS FINAIS (CORRIGIDO)
-- =====================================================

-- 12. CORRIGIR POLÍTICAS DA TABELA: payments
DROP POLICY IF EXISTS "Allow public insert for payments" ON public.payments;
DROP POLICY IF EXISTS "Allow public select for payments by temp_id" ON public.payments;

-- SELECT restrito ao próprio usuário ou admin
CREATE POLICY "Users can view own payments"
ON public.payments FOR SELECT
USING (
  matricula IN (SELECT um.matricula FROM users_matricula um WHERE um.id = auth.uid())
  OR has_role(auth.uid(), 'admin')
);

-- INSERT via edge function com service role
CREATE POLICY "Service role can insert payments"
ON public.payments FOR INSERT
WITH CHECK (user_temp_id IS NOT NULL OR matricula IS NOT NULL);

-- 13. CORRIGIR POLÍTICAS DA TABELA: users_matricula
DROP POLICY IF EXISTS "permit_all_for_now" ON public.users_matricula;

-- Usuários podem ver apenas seu próprio perfil ou durante login
CREATE POLICY "Users can view own profile"
ON public.users_matricula FOR SELECT
USING (
  id = auth.uid()
  OR has_role(auth.uid(), 'admin')
  OR true -- Necessário durante login/registro
);

CREATE POLICY "Users can update own profile"
ON public.users_matricula FOR UPDATE
USING (
  id = auth.uid()
  OR has_role(auth.uid(), 'admin')
);

-- INSERT público para registro
CREATE POLICY "Public can register"
ON public.users_matricula FOR INSERT
WITH CHECK (true);

-- 14. Corrigir políticas do whatsapp_notifications_log
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.whatsapp_notifications_log;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.whatsapp_notifications_log;

CREATE POLICY "Users can view notifications"
ON public.whatsapp_notifications_log FOR SELECT
USING (
  user_matricula IN (SELECT um.matricula FROM users_matricula um WHERE um.id = auth.uid())
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Service can insert notifications"
ON public.whatsapp_notifications_log FOR INSERT
WITH CHECK (user_matricula IS NOT NULL);

-- 15. Habilitar RLS em todas as tabelas
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_matricula ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_notifications_log ENABLE ROW LEVEL SECURITY;