-- Drop existing policies (some may have been dropped already)
DROP POLICY IF EXISTS "Users can view their own messages" ON public.routine_chat_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.routine_chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.routine_chat_messages;

-- Create corrected policies that work with user_matricula
-- Allow authenticated users to view their own messages by matching user_matricula
CREATE POLICY "Users can view their own messages" 
ON public.routine_chat_messages 
FOR SELECT 
USING (
  user_matricula IN (
    SELECT matricula FROM public.users_matricula 
    WHERE id::uuid = auth.uid()
  )
);

-- Allow authenticated users to insert their own messages
CREATE POLICY "Users can insert their own messages" 
ON public.routine_chat_messages 
FOR INSERT 
WITH CHECK (
  user_matricula IN (
    SELECT matricula FROM public.users_matricula 
    WHERE id::uuid = auth.uid()
  )
);

-- Allow authenticated users to delete their own messages
CREATE POLICY "Users can delete their own messages" 
ON public.routine_chat_messages 
FOR DELETE 
USING (
  user_matricula IN (
    SELECT matricula FROM public.users_matricula 
    WHERE id::uuid = auth.uid()
  )
);