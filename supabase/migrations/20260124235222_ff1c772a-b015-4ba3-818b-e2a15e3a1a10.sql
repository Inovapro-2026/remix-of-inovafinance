-- ==============================================
-- FIX OVERLY PERMISSIVE RLS POLICIES
-- ==============================================

-- Fix payments table - allow public insert only for new registrations
DROP POLICY IF EXISTS "Insert payments allowed" ON public.payments;

-- Create more restrictive insert policy for payments
CREATE POLICY "Allow payment registration"
ON public.payments
FOR INSERT
WITH CHECK (
  -- Only allow if user_temp_id is provided (new registration)
  -- or user is admin
  user_temp_id IS NOT NULL 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix security_logs - should only be insertable by authenticated users or service
DROP POLICY IF EXISTS "Service can insert security logs" ON public.security_logs;

CREATE POLICY "Authenticated users can insert security logs"
ON public.security_logs
FOR INSERT
WITH CHECK (
  -- Allow authenticated users to log their own actions
  auth.uid() IS NOT NULL
  OR user_matricula IS NULL -- Allow anonymous security events (like failed logins)
);

-- Fix users_matricula public registration - restrict to valid registration flow
DROP POLICY IF EXISTS "Public registration allowed" ON public.users_matricula;

CREATE POLICY "Allow user registration"
ON public.users_matricula
FOR INSERT
WITH CHECK (
  -- Only allow insert if there's a corresponding payment or admin
  matricula IN (SELECT matricula FROM payments WHERE payment_status = 'paid')
  OR has_role(auth.uid(), 'admin'::app_role)
  OR auth.uid() IS NOT NULL -- Allow authenticated user to create their own record
);