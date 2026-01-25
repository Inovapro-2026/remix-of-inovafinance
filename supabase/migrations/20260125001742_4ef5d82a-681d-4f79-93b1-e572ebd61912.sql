
-- ============================================================
-- INOVAFINANCE SECURITY - FINAL CLEANUP
-- ============================================================

-- Remove old problematic policies that still exist
DROP POLICY IF EXISTS "anon_read_all" ON users_matricula;
DROP POLICY IF EXISTS "payments_select" ON payments;
DROP POLICY IF EXISTS "View own payments only" ON payments;

-- The view already has security_invoker=on, which means it respects RLS
-- But we need to ensure the base table policies are correct

-- Remove duplicate policies on affiliate_withdrawals
DROP POLICY IF EXISTS "Request own affiliate withdrawals" ON affiliate_withdrawals;
DROP POLICY IF EXISTS "View own affiliate withdrawals" ON affiliate_withdrawals;

-- Fix affiliate_commissions - uses old id check instead of auth_user_id
DROP POLICY IF EXISTS "Users can view their own commissions" ON affiliate_commissions;

CREATE POLICY "users_view_own_commissions"
ON affiliate_commissions FOR SELECT
TO authenticated
USING (
  affiliate_matricula IN (
    SELECT matricula FROM users_matricula WHERE auth_user_id = auth.uid()
  )
);

-- Fix affiliate_invites - uses old id check
DROP POLICY IF EXISTS "Users can view their own invites (as inviter)" ON affiliate_invites;

CREATE POLICY "users_view_own_invites"
ON affiliate_invites FOR SELECT
TO authenticated
USING (
  inviter_matricula IN (
    SELECT matricula FROM users_matricula WHERE auth_user_id = auth.uid()
  )
);

-- Fix announcement_reads - uses old id check  
DROP POLICY IF EXISTS "Users can mark announcements as read" ON announcement_reads;
DROP POLICY IF EXISTS "Users can view their own reads" ON announcement_reads;
DROP POLICY IF EXISTS "Admins can view all reads" ON announcement_reads;

CREATE POLICY "announcement_reads_admin"
ON announcement_reads FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "announcement_reads_user_view"
ON announcement_reads FOR SELECT
TO authenticated
USING (
  user_matricula IN (
    SELECT matricula FROM users_matricula WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "announcement_reads_user_insert"
ON announcement_reads FOR INSERT
TO authenticated
WITH CHECK (
  user_matricula IN (
    SELECT matricula FROM users_matricula WHERE auth_user_id = auth.uid()
  )
);

-- Fix affiliate_withdrawals policies
DROP POLICY IF EXISTS "Users can view their own withdrawals" ON affiliate_withdrawals;
DROP POLICY IF EXISTS "Users can request withdrawals" ON affiliate_withdrawals;

CREATE POLICY "withdrawals_user_view"
ON affiliate_withdrawals FOR SELECT
TO authenticated
USING (
  affiliate_matricula IN (
    SELECT matricula FROM users_matricula WHERE auth_user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "withdrawals_user_insert"
ON affiliate_withdrawals FOR INSERT
TO authenticated
WITH CHECK (
  affiliate_matricula IN (
    SELECT matricula FROM users_matricula WHERE auth_user_id = auth.uid()
  )
);

-- Limit coupon visibility to code validation only (not full list)
DROP POLICY IF EXISTS "coupons_public_validate" ON discount_coupons;

CREATE POLICY "coupons_authenticated_validate"
ON discount_coupons FOR SELECT
TO authenticated
USING (is_active = true);

-- Note: For full security, coupon validation should be done via edge function
-- This prevents enumeration attacks
