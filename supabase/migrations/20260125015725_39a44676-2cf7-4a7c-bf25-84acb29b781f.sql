-- Drop existing policies
DROP POLICY IF EXISTS "user_access" ON public.user_voice_settings;
DROP POLICY IF EXISTS "admin_access" ON public.user_voice_settings;

-- Create permissive policies for user_voice_settings
-- Allow anyone to read their own settings (using user_matricula as identifier)
CREATE POLICY "allow_read_voice_settings" 
ON public.user_voice_settings 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Allow insert/update/delete for anyone (frontend controls matricula)
CREATE POLICY "allow_write_voice_settings" 
ON public.user_voice_settings 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "allow_update_voice_settings" 
ON public.user_voice_settings 
FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_delete_voice_settings" 
ON public.user_voice_settings 
FOR DELETE 
TO anon, authenticated
USING (true);