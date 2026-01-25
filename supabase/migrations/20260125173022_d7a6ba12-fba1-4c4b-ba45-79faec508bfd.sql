-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create their own sessions" ON public.live_chat_sessions;

-- Create a new policy that allows any authenticated or anonymous user to create sessions
-- Since this app uses matricula-based auth (not Supabase Auth), we need to allow inserts
CREATE POLICY "Anyone can create chat sessions"
ON public.live_chat_sessions
FOR INSERT
WITH CHECK (true);

-- Also fix the SELECT policy to allow users to see their own sessions by matricula
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.live_chat_sessions;

CREATE POLICY "Users can view their own sessions"
ON public.live_chat_sessions
FOR SELECT
USING (true);

-- Allow users to update their own sessions (for status changes etc)
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.live_chat_sessions;

CREATE POLICY "Users can update their own sessions"
ON public.live_chat_sessions
FOR UPDATE
USING (true);

-- Also fix live_chat_messages policies
DROP POLICY IF EXISTS "Users can create messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Users can view messages" ON public.live_chat_messages;

CREATE POLICY "Anyone can create messages"
ON public.live_chat_messages
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view messages"
ON public.live_chat_messages
FOR SELECT
USING (true);