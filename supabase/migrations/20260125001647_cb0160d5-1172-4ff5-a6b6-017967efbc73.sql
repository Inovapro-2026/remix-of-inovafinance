
-- ============================================================
-- INOVAFINANCE SECURITY - REMOVE ALL PERMISSIVE POLICIES
-- ============================================================

-- Remove remaining permissive policies
DROP POLICY IF EXISTS "payments_insert" ON payments;
DROP POLICY IF EXISTS "insert_logs" ON security_logs;
DROP POLICY IF EXISTS "anon_insert" ON user_sessions;
DROP POLICY IF EXISTS "public_insert" ON users_matricula;

-- ============================================================
-- CREATE SECURE REPLACEMENT POLICIES
-- ============================================================

-- PAYMENTS: Only allow insert from authenticated users or during registration
-- Registration flow uses edge functions with service role
-- No completely open insert allowed
CREATE POLICY "payments_secure_insert"
ON payments FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR matricula IN (SELECT matricula FROM users_matricula WHERE auth_user_id = auth.uid())
);

-- SECURITY_LOGS: Only authenticated users can insert, with their own matricula
CREATE POLICY "security_logs_secure_insert"
ON security_logs FOR INSERT
TO authenticated
WITH CHECK (
  user_matricula IS NULL 
  OR user_matricula IN (SELECT matricula FROM users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- USER_SESSIONS: Users can only create sessions for their own matricula
CREATE POLICY "user_sessions_secure_insert"
ON user_sessions FOR INSERT
TO authenticated
WITH CHECK (
  user_matricula IN (SELECT matricula FROM users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- USERS_MATRICULA: No direct insert allowed - registration handled by edge functions
-- Admin can insert manually
CREATE POLICY "users_matricula_admin_insert"
ON users_matricula FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- ENSURE AUTHENTICATED INSERT POLICY FOR LOGS EXISTS
-- ============================================================

-- Drop and recreate the correct one
DROP POLICY IF EXISTS "authenticated_insert_logs" ON security_logs;

CREATE POLICY "authenticated_insert_logs_v2"
ON security_logs FOR INSERT
TO authenticated
WITH CHECK (
  -- User can only log for themselves or null (system log)
  user_matricula IS NULL 
  OR user_matricula IN (SELECT matricula FROM users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);
