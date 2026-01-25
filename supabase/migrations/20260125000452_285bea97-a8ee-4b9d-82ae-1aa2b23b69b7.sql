-- Fix policies on other tables to remove recursive subqueries
-- These policies were querying users_matricula with WHERE users_matricula.id = auth.uid() which is wrong
-- The correct comparison is auth_user_id = auth.uid()

-- TRANSACTIONS: Drop old policies and create simple ones
DO $$ 
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'transactions' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.transactions', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "admin_access" ON public.transactions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_access" ON public.transactions FOR ALL TO authenticated
USING (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()));

-- SCHEDULED_PAYMENTS
DO $$ 
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'scheduled_payments' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.scheduled_payments', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "admin_access" ON public.scheduled_payments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_access" ON public.scheduled_payments FOR ALL TO authenticated
USING (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()));

-- SALARY_CREDITS
DO $$ 
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'salary_credits' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.salary_credits', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "admin_access" ON public.salary_credits FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_access" ON public.salary_credits FOR ALL TO authenticated
USING (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()));

-- CATEGORIES
DO $$ 
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'categories' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.categories', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "admin_access" ON public.categories FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_access" ON public.categories FOR ALL TO authenticated
USING (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()));

-- GOALS
DO $$ 
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'goals' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.goals', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "admin_access" ON public.goals FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_access" ON public.goals FOR ALL TO authenticated
USING (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()));

-- PAYMENT_LOGS
DO $$ 
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'payment_logs' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.payment_logs', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "admin_access" ON public.payment_logs FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_access" ON public.payment_logs FOR ALL TO authenticated
USING (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()));

-- USER_SESSIONS
DO $$ 
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'user_sessions' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_sessions', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "admin_access" ON public.user_sessions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_access" ON public.user_sessions FOR ALL TO authenticated
USING (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()));

CREATE POLICY "anon_insert" ON public.user_sessions FOR INSERT TO anon WITH CHECK (true);

-- ROTINAS
DO $$ 
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'rotinas' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.rotinas', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "admin_access" ON public.rotinas FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_access" ON public.rotinas FOR ALL TO authenticated
USING (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()));

-- ROTINA_EXECUTIONS
DO $$ 
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'rotina_executions' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.rotina_executions', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "admin_access" ON public.rotina_executions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_access" ON public.rotina_executions FOR ALL TO authenticated
USING (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()));

-- AGENDA_ITEMS
DO $$ 
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'agenda_items' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.agenda_items', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "admin_access" ON public.agenda_items FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_access" ON public.agenda_items FOR ALL TO authenticated
USING (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()));

-- SUPPORT_TICKETS
DO $$ 
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'support_tickets' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.support_tickets', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "admin_access" ON public.support_tickets FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_access" ON public.support_tickets FOR ALL TO authenticated
USING (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()));

-- SUPPORT_MESSAGES  
DO $$ 
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'support_messages' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.support_messages', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "admin_access" ON public.support_messages FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_access" ON public.support_messages FOR ALL TO authenticated
USING (ticket_id IN (SELECT id FROM public.support_tickets WHERE user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())))
WITH CHECK (ticket_id IN (SELECT id FROM public.support_tickets WHERE user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())));

-- USER_VOICE_SETTINGS
DO $$ 
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'user_voice_settings' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_voice_settings', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "admin_access" ON public.user_voice_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_access" ON public.user_voice_settings FOR ALL TO authenticated
USING (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()));

-- USER_WHATSAPP_SETTINGS
DO $$ 
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'user_whatsapp_settings' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_whatsapp_settings', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "admin_access" ON public.user_whatsapp_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_access" ON public.user_whatsapp_settings FOR ALL TO authenticated
USING (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()));

-- SECURITY_LOGS
DO $$ 
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'security_logs' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.security_logs', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "admin_access" ON public.security_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "insert_logs" ON public.security_logs FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "user_view_own" ON public.security_logs FOR SELECT TO authenticated
USING (user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid()));