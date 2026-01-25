-- Create table for routine AI chat messages
CREATE TABLE public.routine_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_matricula INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_routine_chat_messages_user ON public.routine_chat_messages(user_matricula, created_at DESC);

-- Enable RLS
ALTER TABLE public.routine_chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages
CREATE POLICY "Users can view their own chat messages"
ON public.routine_chat_messages
FOR SELECT
USING (user_matricula = (current_setting('request.jwt.claims', true)::json->>'user_matricula')::integer OR user_matricula IN (
  SELECT matricula FROM public.users_matricula WHERE id = auth.uid()
));

-- Users can insert their own messages
CREATE POLICY "Users can insert their own chat messages"
ON public.routine_chat_messages
FOR INSERT
WITH CHECK (user_matricula IN (
  SELECT matricula FROM public.users_matricula WHERE id = auth.uid()
));

-- Users can delete their own messages (to clear history)
CREATE POLICY "Users can delete their own chat messages"
ON public.routine_chat_messages
FOR DELETE
USING (user_matricula IN (
  SELECT matricula FROM public.users_matricula WHERE id = auth.uid()
));