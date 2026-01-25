-- Fix RLS policy for user_whatsapp_settings
-- The issue is that auth.uid() is NULL because the app uses matricula-based auth, not Supabase Auth

-- Drop existing policy
DROP POLICY IF EXISTS "Users manage whatsapp_settings" ON public.user_whatsapp_settings;

-- Create separate policies for each operation

-- SELECT: Users can view their own settings (allow if matricula exists)
CREATE POLICY "Users can view own whatsapp settings" 
ON public.user_whatsapp_settings 
FOR SELECT 
USING (
  user_matricula IN (SELECT matricula FROM users_matricula)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- INSERT: Allow users to insert their own settings (matricula must exist)
CREATE POLICY "Users can insert own whatsapp settings" 
ON public.user_whatsapp_settings 
FOR INSERT 
WITH CHECK (
  user_matricula IN (SELECT matricula FROM users_matricula)
);

-- UPDATE: Users can update their own settings
CREATE POLICY "Users can update own whatsapp settings" 
ON public.user_whatsapp_settings 
FOR UPDATE 
USING (
  user_matricula IN (SELECT matricula FROM users_matricula)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- DELETE: Users can delete their own settings
CREATE POLICY "Users can delete own whatsapp settings" 
ON public.user_whatsapp_settings 
FOR DELETE 
USING (
  user_matricula IN (SELECT matricula FROM users_matricula)
  OR has_role(auth.uid(), 'admin'::app_role)
);