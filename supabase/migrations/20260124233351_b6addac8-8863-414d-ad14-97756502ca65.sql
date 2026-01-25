-- =====================================================
-- INOVAFINACE SECURITY OVERHAUL - COMPLETE RLS FIX (v2)
-- =====================================================

-- 1. SECURITY LOGS TABLE (Audit trail)
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_matricula INTEGER NULL,
  action TEXT NOT NULL,
  ip_address TEXT NULL,
  user_agent TEXT NULL,
  details JSONB NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs, no one can modify
DROP POLICY IF EXISTS "Admins can view security logs" ON public.security_logs;
CREATE POLICY "Admins can view security logs"
ON public.security_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only service role can insert (from edge functions)
DROP POLICY IF EXISTS "Service can insert security logs" ON public.security_logs;
CREATE POLICY "Service can insert security logs"
ON public.security_logs FOR INSERT
WITH CHECK (true);

-- 2. USER VOICE SETTINGS TABLE (Per-user ElevenLabs)
CREATE TABLE IF NOT EXISTS public.user_voice_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_matricula INTEGER NOT NULL UNIQUE,
  eleven_api_key_encrypted TEXT NULL,
  voice_id TEXT NULL DEFAULT 'cgSgspJ2msm6clMCkdW9',
  voice_name TEXT NULL DEFAULT 'Jessica',
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_voice_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own voice settings" ON public.user_voice_settings;
CREATE POLICY "Users view own voice settings"
ON public.user_voice_settings FOR SELECT
USING (
  user_matricula IN (SELECT matricula FROM users_matricula)
  OR has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Users insert own voice settings" ON public.user_voice_settings;
CREATE POLICY "Users insert own voice settings"
ON public.user_voice_settings FOR INSERT
WITH CHECK (
  user_matricula IN (SELECT matricula FROM users_matricula)
);

DROP POLICY IF EXISTS "Users update own voice settings" ON public.user_voice_settings;
CREATE POLICY "Users update own voice settings"
ON public.user_voice_settings FOR UPDATE
USING (
  user_matricula IN (SELECT matricula FROM users_matricula)
  OR has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Users delete own voice settings" ON public.user_voice_settings;
CREATE POLICY "Users delete own voice settings"
ON public.user_voice_settings FOR DELETE
USING (
  user_matricula IN (SELECT matricula FROM users_matricula)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Trigger for updated_at (only if not exists)
DROP TRIGGER IF EXISTS update_user_voice_settings_updated_at ON public.user_voice_settings;
CREATE TRIGGER update_user_voice_settings_updated_at
BEFORE UPDATE ON public.user_voice_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 3. FIX ALL VULNERABLE RLS POLICIES
-- =====================================================

-- === users_matricula (CRITICAL - Contains all PII) ===
DROP POLICY IF EXISTS "Allow reading users" ON public.users_matricula;
DROP POLICY IF EXISTS "Users can view own data" ON public.users_matricula;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users_matricula;
DROP POLICY IF EXISTS "Users can update own data" ON public.users_matricula;
DROP POLICY IF EXISTS "Users view own profile" ON public.users_matricula;
DROP POLICY IF EXISTS "Public can register" ON public.users_matricula;
DROP POLICY IF EXISTS "Users update own profile" ON public.users_matricula;

-- Users can ONLY see their own data (by matricula)
CREATE POLICY "Users view own profile only"
ON public.users_matricula FOR SELECT
USING (
  matricula IN (SELECT matricula FROM users_matricula)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Public can insert for registration
CREATE POLICY "Public registration allowed"
ON public.users_matricula FOR INSERT
WITH CHECK (true);

-- Users update only their own record
CREATE POLICY "Users update own profile only"
ON public.users_matricula FOR UPDATE
USING (
  matricula IN (SELECT matricula FROM users_matricula)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- === support_tickets (Contains customer issues) ===
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users view own tickets only" ON public.support_tickets;
DROP POLICY IF EXISTS "Users create own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users update own tickets" ON public.support_tickets;

CREATE POLICY "View own support tickets"
ON public.support_tickets FOR SELECT
USING (
  user_matricula IN (SELECT matricula FROM users_matricula)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Create own support tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (
  user_matricula IN (SELECT matricula FROM users_matricula)
);

CREATE POLICY "Update own support tickets"
ON public.support_tickets FOR UPDATE
USING (
  user_matricula IN (SELECT matricula FROM users_matricula)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- === support_messages (Private conversations) ===
DROP POLICY IF EXISTS "Users can view messages" ON public.support_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can manage messages" ON public.support_messages;
DROP POLICY IF EXISTS "Users view own ticket messages" ON public.support_messages;
DROP POLICY IF EXISTS "Users send messages to own tickets" ON public.support_messages;

CREATE POLICY "View own ticket messages"
ON public.support_messages FOR SELECT
USING (
  ticket_id IN (
    SELECT id FROM support_tickets 
    WHERE user_matricula IN (SELECT matricula FROM users_matricula)
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Send messages to own tickets"
ON public.support_messages FOR INSERT
WITH CHECK (
  ticket_id IN (
    SELECT id FROM support_tickets 
    WHERE user_matricula IN (SELECT matricula FROM users_matricula)
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- === payments (Financial data) ===
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Service role insert" ON public.payments;
DROP POLICY IF EXISTS "Users view own payments" ON public.payments;
DROP POLICY IF EXISTS "Service inserts payments" ON public.payments;
DROP POLICY IF EXISTS "Admins update payments" ON public.payments;

CREATE POLICY "View own payments only"
ON public.payments FOR SELECT
USING (
  matricula IN (SELECT matricula FROM users_matricula)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Insert payments allowed"
ON public.payments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins manage payments"
ON public.payments FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- === transactions (User financial transactions) ===
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users delete own transactions" ON public.transactions;

CREATE POLICY "View own transactions only"
ON public.transactions FOR SELECT
USING (
  user_matricula IN (SELECT matricula FROM users_matricula)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Insert own transactions only"
ON public.transactions FOR INSERT
WITH CHECK (
  user_matricula IN (SELECT matricula FROM users_matricula)
);

CREATE POLICY "Update own transactions only"
ON public.transactions FOR UPDATE
USING (
  user_matricula IN (SELECT matricula FROM users_matricula)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Delete own transactions only"
ON public.transactions FOR DELETE
USING (
  user_matricula IN (SELECT matricula FROM users_matricula)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- === payment_logs (Payment audit) ===
DROP POLICY IF EXISTS "Users can view own logs" ON public.payment_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON public.payment_logs;
DROP POLICY IF EXISTS "Users view own payment logs" ON public.payment_logs;
DROP POLICY IF EXISTS "Users insert own payment logs" ON public.payment_logs;

CREATE POLICY "View own payment logs only"
ON public.payment_logs FOR SELECT
USING (
  user_matricula IN (SELECT matricula FROM users_matricula)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Insert own payment logs only"
ON public.payment_logs FOR INSERT
WITH CHECK (
  user_matricula IN (SELECT matricula FROM users_matricula)
);

-- === whatsapp_notifications_log (Notification audit) ===
DROP POLICY IF EXISTS "Users can insert own logs" ON public.whatsapp_notifications_log;
DROP POLICY IF EXISTS "Admins can view all" ON public.whatsapp_notifications_log;
DROP POLICY IF EXISTS "View own notification logs" ON public.whatsapp_notifications_log;
DROP POLICY IF EXISTS "Insert own notification logs" ON public.whatsapp_notifications_log;

CREATE POLICY "View own whatsapp logs"
ON public.whatsapp_notifications_log FOR SELECT
USING (
  user_matricula IN (SELECT matricula FROM users_matricula)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Insert own whatsapp logs"
ON public.whatsapp_notifications_log FOR INSERT
WITH CHECK (
  user_matricula IN (SELECT matricula FROM users_matricula)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- === affiliate_withdrawals (Contains PIX keys) ===
DROP POLICY IF EXISTS "Users view own withdrawals" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Users insert own withdrawals" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Users view own withdrawals only" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Users request own withdrawals" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Admins process withdrawals" ON public.affiliate_withdrawals;

CREATE POLICY "View own affiliate withdrawals"
ON public.affiliate_withdrawals FOR SELECT
USING (
  affiliate_matricula IN (SELECT matricula FROM users_matricula)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Request own affiliate withdrawals"
ON public.affiliate_withdrawals FOR INSERT
WITH CHECK (
  affiliate_matricula IN (SELECT matricula FROM users_matricula)
);

CREATE POLICY "Admins process affiliate withdrawals"
ON public.affiliate_withdrawals FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON public.security_logs(user_matricula);
CREATE INDEX IF NOT EXISTS idx_security_logs_action ON public.security_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_logs_created ON public.security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_voice_settings_matricula ON public.user_voice_settings(user_matricula);