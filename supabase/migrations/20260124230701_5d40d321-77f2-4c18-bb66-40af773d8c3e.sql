-- CORREÇÃO FINAL: Políticas restantes
DROP POLICY IF EXISTS "Users can update their own rotina analytics" ON public.rotina_analytics;
DROP POLICY IF EXISTS "Users can view their own rotina analytics" ON public.rotina_analytics;
DROP POLICY IF EXISTS "Users can create their own rotina analytics" ON public.rotina_analytics;
DROP POLICY IF EXISTS "Users can manage their own queue" ON public.routine_queue;
DROP POLICY IF EXISTS "Users can view their own tips" ON public.routine_tips;
DROP POLICY IF EXISTS "Users can create their own tips" ON public.routine_tips;
DROP POLICY IF EXISTS "Users can update their own tips" ON public.routine_tips;
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_whatsapp_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_whatsapp_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_whatsapp_settings;
DROP POLICY IF EXISTS "Service role can manage all logs" ON public.whatsapp_notifications_log;

-- Políticas corretas com verificação de user_matricula
CREATE POLICY "Users manage rotina_analytics" ON public.rotina_analytics FOR ALL
USING (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()));

CREATE POLICY "Users manage routine_queue" ON public.routine_queue FOR ALL
USING (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()));

CREATE POLICY "Users manage routine_tips" ON public.routine_tips FOR ALL
USING (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()));

CREATE POLICY "Users manage whatsapp_settings" ON public.user_whatsapp_settings FOR ALL
USING (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()));

CREATE POLICY "Admins manage whatsapp_logs" ON public.whatsapp_notifications_log FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));