-- Fix remaining tables and tighten INSERT policy

-- USER_SESSIONS: Fix policies
DROP POLICY IF EXISTS "Users manage own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Admins manage all sessions" ON public.user_sessions;

CREATE POLICY "sessions_all"
ON public.user_sessions FOR ALL TO authenticated
USING (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Allow anon to insert sessions for login tracking
CREATE POLICY "sessions_anon_insert"
ON public.user_sessions FOR INSERT TO anon
WITH CHECK (true);

-- ROTINAS: Fix policies
DROP POLICY IF EXISTS "Users manage own routines" ON public.rotinas;
DROP POLICY IF EXISTS "Admins manage all routines" ON public.rotinas;

CREATE POLICY "rotinas_all"
ON public.rotinas FOR ALL TO authenticated
USING (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- ROTINA_EXECUTIONS: Fix policies
DROP POLICY IF EXISTS "Users manage own routine executions" ON public.rotina_executions;
DROP POLICY IF EXISTS "Admins manage all routine executions" ON public.rotina_executions;

CREATE POLICY "rotina_executions_all"
ON public.rotina_executions FOR ALL TO authenticated
USING (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- AGENDA_ITEMS: Fix policies
DROP POLICY IF EXISTS "Users manage own agenda items" ON public.agenda_items;
DROP POLICY IF EXISTS "Admins manage all agenda items" ON public.agenda_items;

CREATE POLICY "agenda_items_all"
ON public.agenda_items FOR ALL TO authenticated
USING (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- SUPPORT_TICKETS: Fix policies
DROP POLICY IF EXISTS "Users manage own support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins manage all support tickets" ON public.support_tickets;

CREATE POLICY "support_tickets_all"
ON public.support_tickets FOR ALL TO authenticated
USING (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- SUPPORT_MESSAGES: Fix policies  
DROP POLICY IF EXISTS "Users view messages from own tickets" ON public.support_messages;
DROP POLICY IF EXISTS "Users and admins can insert messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins manage all support messages" ON public.support_messages;

CREATE POLICY "support_messages_all"
ON public.support_messages FOR ALL TO authenticated
USING (
  ticket_id IN (
    SELECT id FROM public.support_tickets 
    WHERE user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  ticket_id IN (
    SELECT id FROM public.support_tickets 
    WHERE user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- USER_VOICE_SETTINGS: Fix policies  
DROP POLICY IF EXISTS "Users manage own voice settings" ON public.user_voice_settings;
DROP POLICY IF EXISTS "Admins manage all voice settings" ON public.user_voice_settings;

CREATE POLICY "voice_settings_all"
ON public.user_voice_settings FOR ALL TO authenticated
USING (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- USER_WHATSAPP_SETTINGS: Fix policies
DROP POLICY IF EXISTS "Users manage own whatsapp settings" ON public.user_whatsapp_settings;
DROP POLICY IF EXISTS "Admins manage all whatsapp settings" ON public.user_whatsapp_settings;

CREATE POLICY "whatsapp_settings_all"
ON public.user_whatsapp_settings FOR ALL TO authenticated
USING (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- SECURITY_LOGS: Fix policies
DROP POLICY IF EXISTS "Users can view own security logs" ON public.security_logs;
DROP POLICY IF EXISTS "System can insert security logs" ON public.security_logs;
DROP POLICY IF EXISTS "Admins manage all security logs" ON public.security_logs;

CREATE POLICY "security_logs_select"
ON public.security_logs FOR SELECT TO authenticated
USING (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "security_logs_insert"
ON public.security_logs FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- ADMIN_LOGS: Ensure admin access
DROP POLICY IF EXISTS "Admins can view logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Admins can insert logs" ON public.admin_logs;

CREATE POLICY "admin_logs_select"
ON public.admin_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_logs_insert"
ON public.admin_logs FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- PAYMENTS: Fix policies
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Admin full access" ON public.payments;

CREATE POLICY "payments_select"
ON public.payments FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "payments_insert"
ON public.payments FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "payments_update"
ON public.payments FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "payments_delete"
ON public.payments FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));