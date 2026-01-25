
-- ============================================================
-- INOVAFINANCE SECURITY OVERHAUL - PART 2 (CORRECTED)
-- ============================================================

-- ============================================================
-- STEP 6: SECURE STORAGE BUCKETS
-- ============================================================

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Public audio cache read" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read audio-cache" ON storage.objects;

-- Payment proofs: Users upload to their own folder, admins can view all
CREATE POLICY "payment_proofs_user_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "payment_proofs_user_read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "payment_proofs_admin_manage"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'payment-proofs' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'payment-proofs' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Audio cache: Public read (cached TTS), admin insert
CREATE POLICY "audio_cache_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'audio-cache');

CREATE POLICY "audio_cache_admin_manage"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'audio-cache' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'audio-cache' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- ============================================================
-- STEP 7: VERIFY/UPDATE OTHER TABLE POLICIES
-- ============================================================

-- Ensure admin_logs only accessible by admins
DROP POLICY IF EXISTS "admin_logs_insert" ON admin_logs;
DROP POLICY IF EXISTS "admin_logs_select" ON admin_logs;

CREATE POLICY "admin_logs_admin_only"
ON admin_logs FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Ensure elevenlabs_usage only accessible by admins
DROP POLICY IF EXISTS "Admins can insert usage" ON elevenlabs_usage;
DROP POLICY IF EXISTS "Admins can update usage" ON elevenlabs_usage;
DROP POLICY IF EXISTS "Admins can view usage" ON elevenlabs_usage;

CREATE POLICY "elevenlabs_usage_admin_only"
ON elevenlabs_usage FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Ensure system_settings only accessible by admins
DROP POLICY IF EXISTS "Admins can delete settings" ON system_settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON system_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON system_settings;
DROP POLICY IF EXISTS "Admins can view settings" ON system_settings;

CREATE POLICY "system_settings_admin_only"
ON system_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Ensure discount_coupons managed by admins, public can only validate active ones
DROP POLICY IF EXISTS "Admins can manage coupons" ON discount_coupons;
DROP POLICY IF EXISTS "Public can validate coupons" ON discount_coupons;

CREATE POLICY "coupons_admin_manage"
ON discount_coupons FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "coupons_public_validate"
ON discount_coupons FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- ============================================================
-- STEP 8: CREATE HELPER VIEW FOR ADMIN (CORRECT COLUMNS)
-- ============================================================

-- Drop if exists
DROP VIEW IF EXISTS public.users_admin_view;

-- Create view for admin that excludes most sensitive data
CREATE VIEW public.users_admin_view 
WITH (security_invoker = on) AS
SELECT 
  id,
  matricula,
  full_name,
  email,
  phone,
  user_status,
  subscription_status,
  subscription_type,
  subscription_start_date,
  subscription_end_date,
  subscription_expires_at,
  is_affiliate,
  is_admin_affiliate,
  affiliate_balance,
  affiliate_code,
  initial_balance,
  saldo_atual,
  credit_limit,
  credit_used,
  credit_due_day,
  salary_day,
  salary_amount,
  blocked,
  created_at,
  onboarding_completed,
  plan_type
FROM users_matricula;
-- Note: Excludes cpf, pix_key, auth_user_id, birth_date for extra security

-- ============================================================
-- STEP 9: REFRESH HAS_ROLE FUNCTION FOR PERFORMANCE
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon;
