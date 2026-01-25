-- Adicionar políticas RLS para user_whatsapp_settings
CREATE POLICY "user_whatsapp_settings_user_access"
ON public.user_whatsapp_settings
FOR ALL
USING (user_matricula IN (
  SELECT matricula FROM users_matricula WHERE auth_user_id = auth.uid()
))
WITH CHECK (user_matricula IN (
  SELECT matricula FROM users_matricula WHERE auth_user_id = auth.uid()
));

CREATE POLICY "user_whatsapp_settings_admin_access"
ON public.user_whatsapp_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Limpar todas as tabelas de dados (mantendo estrutura e admin)

-- Limpar dados de rotinas
DELETE FROM public.routine_tips;
DELETE FROM public.routine_queue;
DELETE FROM public.routine_chat_messages;
DELETE FROM public.rotina_completions;
DELETE FROM public.rotina_executions;
DELETE FROM public.rotina_analytics;
DELETE FROM public.rotinas_transporte;
DELETE FROM public.rotinas;

-- Limpar dados de agenda
DELETE FROM public.agenda_items;

-- Limpar dados financeiros
DELETE FROM public.payment_logs;
DELETE FROM public.salary_credits;
DELETE FROM public.scheduled_payments;
DELETE FROM public.transactions;
DELETE FROM public.categories;
DELETE FROM public.goals;

-- Limpar dados de suporte
DELETE FROM public.support_messages;
DELETE FROM public.support_tickets;

-- Limpar dados de afiliados
DELETE FROM public.affiliate_commissions;
DELETE FROM public.affiliate_invites;
DELETE FROM public.affiliate_withdrawals;

-- Limpar dados de sessão e configurações de usuário
DELETE FROM public.user_sessions;
DELETE FROM public.user_voice_settings;
DELETE FROM public.user_whatsapp_settings;
DELETE FROM public.whatsapp_notifications_log;
DELETE FROM public.security_logs;
DELETE FROM public.announcement_reads;

-- Limpar pagamentos (exceto os necessários)
DELETE FROM public.payments;

-- Limpar usuários não-admin (mantém apenas admins)
DELETE FROM public.users_matricula 
WHERE auth_user_id NOT IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
) OR auth_user_id IS NULL;