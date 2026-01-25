-- Fix RLS for user_sessions table
DROP POLICY IF EXISTS "allow_insert_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "allow_update_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "allow_read_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "allow_delete_sessions" ON public.user_sessions;

-- Allow all operations for session tracking (app doesn't use Supabase Auth)
CREATE POLICY "allow_session_operations" 
ON public.user_sessions 
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);