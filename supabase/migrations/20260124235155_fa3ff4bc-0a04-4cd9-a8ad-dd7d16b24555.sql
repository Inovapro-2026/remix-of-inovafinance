-- ==============================================
-- FIX ADMIN ACCESS TO ALL TABLES
-- ==============================================

-- Drop existing restrictive policies on users_matricula
DROP POLICY IF EXISTS "Users can manage their own data" ON public.users_matricula;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users_matricula;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users_matricula;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users_matricula;

-- Create proper policies for users_matricula that allow admin access
CREATE POLICY "Admins can manage all users"
ON public.users_matricula
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own data"
ON public.users_matricula
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update their own data"
ON public.users_matricula
FOR UPDATE
USING (id = auth.uid());

-- Fix transactions policies for admin access
DROP POLICY IF EXISTS "Users can manage transactions" ON public.transactions;
DROP POLICY IF EXISTS "View own transactions only" ON public.transactions;
DROP POLICY IF EXISTS "Insert own transactions only" ON public.transactions;
DROP POLICY IF EXISTS "Update own transactions only" ON public.transactions;
DROP POLICY IF EXISTS "Delete own transactions only" ON public.transactions;

CREATE POLICY "Admins can manage all transactions"
ON public.transactions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage own transactions"
ON public.transactions
FOR ALL
USING (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()));

-- Fix scheduled_payments policies for admin access
DROP POLICY IF EXISTS "Users can manage scheduled payments" ON public.scheduled_payments;

CREATE POLICY "Admins can manage all scheduled payments"
ON public.scheduled_payments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage own scheduled payments"
ON public.scheduled_payments
FOR ALL
USING (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()));

-- Fix salary_credits policies for admin access
DROP POLICY IF EXISTS "Users can manage salary credits" ON public.salary_credits;

CREATE POLICY "Admins can manage all salary credits"
ON public.salary_credits
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage own salary credits"
ON public.salary_credits
FOR ALL
USING (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()));

-- Fix categories policies for admin access
DROP POLICY IF EXISTS "Users can manage categories" ON public.categories;

CREATE POLICY "Admins can manage all categories"
ON public.categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage own categories"
ON public.categories
FOR ALL
USING (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()));

-- Fix goals policies for admin access
DROP POLICY IF EXISTS "Users can manage goals" ON public.goals;

CREATE POLICY "Admins can manage all goals"
ON public.goals
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage own goals"
ON public.goals
FOR ALL
USING (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()));

-- Fix payment_logs policies for admin access
DROP POLICY IF EXISTS "Users can view payment logs" ON public.payment_logs;
DROP POLICY IF EXISTS "Users can insert payment logs" ON public.payment_logs;
DROP POLICY IF EXISTS "View own payment logs only" ON public.payment_logs;
DROP POLICY IF EXISTS "Insert own payment logs only" ON public.payment_logs;

CREATE POLICY "Admins can manage all payment logs"
ON public.payment_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own payment logs"
ON public.payment_logs
FOR SELECT
USING (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()));

CREATE POLICY "Users can insert own payment logs"
ON public.payment_logs
FOR INSERT
WITH CHECK (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()));

-- Fix user_sessions policies for admin access
DROP POLICY IF EXISTS "Users can manage sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;

CREATE POLICY "Admins can manage all sessions"
ON public.user_sessions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage own sessions"
ON public.user_sessions
FOR ALL
USING (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()));

-- Fix rotinas policies for admin access
DROP POLICY IF EXISTS "Users can view own rotinas" ON public.rotinas;
DROP POLICY IF EXISTS "Users can create own rotinas" ON public.rotinas;
DROP POLICY IF EXISTS "Users can update own rotinas" ON public.rotinas;
DROP POLICY IF EXISTS "Users can delete own rotinas" ON public.rotinas;

CREATE POLICY "Admins can manage all rotinas"
ON public.rotinas
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage own rotinas"
ON public.rotinas
FOR ALL
USING (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()));

-- Fix rotina_executions policies for admin access
DROP POLICY IF EXISTS "Users can manage rotina executions" ON public.rotina_executions;

CREATE POLICY "Admins can manage all rotina executions"
ON public.rotina_executions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage own rotina executions"
ON public.rotina_executions
FOR ALL
USING (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()));

-- Fix agenda_items policies for admin access
DROP POLICY IF EXISTS "Users can view own agenda items" ON public.agenda_items;
DROP POLICY IF EXISTS "Users can create their own agenda items" ON public.agenda_items;
DROP POLICY IF EXISTS "Users can update own agenda items" ON public.agenda_items;
DROP POLICY IF EXISTS "Users can delete own agenda items" ON public.agenda_items;

CREATE POLICY "Admins can manage all agenda items"
ON public.agenda_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage own agenda items"
ON public.agenda_items
FOR ALL
USING (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()));

-- Fix support_tickets policies for admin access
DROP POLICY IF EXISTS "Users can view their own support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create their own support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can update their own support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Create own support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "View own support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Update own support tickets" ON public.support_tickets;

CREATE POLICY "Admins can manage all support tickets"
ON public.support_tickets
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own support tickets"
ON public.support_tickets
FOR SELECT
USING (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()));

CREATE POLICY "Users can create support tickets"
ON public.support_tickets
FOR INSERT
WITH CHECK (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()));

CREATE POLICY "Users can update own support tickets"
ON public.support_tickets
FOR UPDATE
USING (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()));

-- Fix support_messages policies for admin access
DROP POLICY IF EXISTS "Users can view support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Users can create support messages" ON public.support_messages;
DROP POLICY IF EXISTS "View own ticket messages" ON public.support_messages;
DROP POLICY IF EXISTS "Send messages to own tickets" ON public.support_messages;

CREATE POLICY "Admins can manage all support messages"
ON public.support_messages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own ticket messages"
ON public.support_messages
FOR SELECT
USING (
  ticket_id IN (
    SELECT id FROM support_tickets 
    WHERE user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can send messages to own tickets"
ON public.support_messages
FOR INSERT
WITH CHECK (
  ticket_id IN (
    SELECT id FROM support_tickets 
    WHERE user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid())
  )
);

-- Fix user_voice_settings policies for admin access  
DROP POLICY IF EXISTS "Users can view their own voice settings" ON public.user_voice_settings;
DROP POLICY IF EXISTS "Users can insert their own voice settings" ON public.user_voice_settings;
DROP POLICY IF EXISTS "Users can update their own voice settings" ON public.user_voice_settings;
DROP POLICY IF EXISTS "Users can delete their own voice settings" ON public.user_voice_settings;

CREATE POLICY "Admins can manage all voice settings"
ON public.user_voice_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage own voice settings"
ON public.user_voice_settings
FOR ALL
USING (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()));

-- Fix user_whatsapp_settings policies
DROP POLICY IF EXISTS "Users can view their own whatsapp settings" ON public.user_whatsapp_settings;
DROP POLICY IF EXISTS "Users can insert their own whatsapp settings" ON public.user_whatsapp_settings;
DROP POLICY IF EXISTS "Users can update their own whatsapp settings" ON public.user_whatsapp_settings;
DROP POLICY IF EXISTS "Users can delete their own whatsapp settings" ON public.user_whatsapp_settings;

CREATE POLICY "Admins can manage all whatsapp settings"
ON public.user_whatsapp_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage own whatsapp settings"
ON public.user_whatsapp_settings
FOR ALL
USING (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()))
WITH CHECK (user_matricula IN (SELECT matricula FROM users_matricula WHERE id = auth.uid()));