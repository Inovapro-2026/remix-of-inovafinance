-- Add DELETE policies for admins on all user-related tables
-- This allows admins to properly delete users and their related data

-- agenda_items
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_agenda_items' AND tablename = 'agenda_items') THEN
    CREATE POLICY "admin_delete_agenda_items" ON public.agenda_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- announcement_reads
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_announcement_reads' AND tablename = 'announcement_reads') THEN
    CREATE POLICY "admin_delete_announcement_reads" ON public.announcement_reads FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- rotina_analytics
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_rotina_analytics' AND tablename = 'rotina_analytics') THEN
    CREATE POLICY "admin_delete_rotina_analytics" ON public.rotina_analytics FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- rotina_completions (need to handle foreign key with rotinas first)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_rotina_completions' AND tablename = 'rotina_completions') THEN
    CREATE POLICY "admin_delete_rotina_completions" ON public.rotina_completions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- rotina_executions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_rotina_executions' AND tablename = 'rotina_executions') THEN
    CREATE POLICY "admin_delete_rotina_executions" ON public.rotina_executions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- rotinas
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_rotinas' AND tablename = 'rotinas') THEN
    CREATE POLICY "admin_delete_rotinas" ON public.rotinas FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- rotinas_transporte
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_rotinas_transporte' AND tablename = 'rotinas_transporte') THEN
    CREATE POLICY "admin_delete_rotinas_transporte" ON public.rotinas_transporte FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- routine_chat_messages
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_routine_chat_messages' AND tablename = 'routine_chat_messages') THEN
    CREATE POLICY "admin_delete_routine_chat_messages" ON public.routine_chat_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- routine_queue
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_routine_queue' AND tablename = 'routine_queue') THEN
    CREATE POLICY "admin_delete_routine_queue" ON public.routine_queue FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- routine_tips
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_routine_tips' AND tablename = 'routine_tips') THEN
    CREATE POLICY "admin_delete_routine_tips" ON public.routine_tips FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- security_logs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_security_logs' AND tablename = 'security_logs') THEN
    CREATE POLICY "admin_delete_security_logs" ON public.security_logs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- support_messages
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_support_messages' AND tablename = 'support_messages') THEN
    CREATE POLICY "admin_delete_support_messages" ON public.support_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- support_tickets
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_support_tickets' AND tablename = 'support_tickets') THEN
    CREATE POLICY "admin_delete_support_tickets" ON public.support_tickets FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- user_sessions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_user_sessions' AND tablename = 'user_sessions') THEN
    CREATE POLICY "admin_delete_user_sessions" ON public.user_sessions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- user_voice_settings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_user_voice_settings' AND tablename = 'user_voice_settings') THEN
    CREATE POLICY "admin_delete_user_voice_settings" ON public.user_voice_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- user_whatsapp_settings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_user_whatsapp_settings' AND tablename = 'user_whatsapp_settings') THEN
    CREATE POLICY "admin_delete_user_whatsapp_settings" ON public.user_whatsapp_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- whatsapp_notifications_log
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_whatsapp_notifications_log' AND tablename = 'whatsapp_notifications_log') THEN
    CREATE POLICY "admin_delete_whatsapp_notifications_log" ON public.whatsapp_notifications_log FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- affiliate_commissions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_affiliate_commissions' AND tablename = 'affiliate_commissions') THEN
    CREATE POLICY "admin_delete_affiliate_commissions" ON public.affiliate_commissions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- affiliate_invites
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_affiliate_invites' AND tablename = 'affiliate_invites') THEN
    CREATE POLICY "admin_delete_affiliate_invites" ON public.affiliate_invites FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- affiliate_withdrawals
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_affiliate_withdrawals' AND tablename = 'affiliate_withdrawals') THEN
    CREATE POLICY "admin_delete_affiliate_withdrawals" ON public.affiliate_withdrawals FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- transactions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_transactions' AND tablename = 'transactions') THEN
    CREATE POLICY "admin_delete_transactions" ON public.transactions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- scheduled_payments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_scheduled_payments' AND tablename = 'scheduled_payments') THEN
    CREATE POLICY "admin_delete_scheduled_payments" ON public.scheduled_payments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- payment_logs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_payment_logs' AND tablename = 'payment_logs') THEN
    CREATE POLICY "admin_delete_payment_logs" ON public.payment_logs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- salary_credits
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_salary_credits' AND tablename = 'salary_credits') THEN
    CREATE POLICY "admin_delete_salary_credits" ON public.salary_credits FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- categories
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_categories' AND tablename = 'categories') THEN
    CREATE POLICY "admin_delete_categories" ON public.categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- goals
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_goals' AND tablename = 'goals') THEN
    CREATE POLICY "admin_delete_goals" ON public.goals FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;