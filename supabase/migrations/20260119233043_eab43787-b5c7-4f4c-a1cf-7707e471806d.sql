-- Drop existing policies (if any still exist)
DROP POLICY IF EXISTS "Users can view their own messages" ON public.routine_chat_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.routine_chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.routine_chat_messages;

-- Create policies using the same pattern as other tables (announcement_reads)
CREATE POLICY "Users can view their own messages" 
ON public.routine_chat_messages 
FOR SELECT 
TO authenticated
USING (
  user_matricula IN (
    SELECT matricula FROM public.users_matricula WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own messages" 
ON public.routine_chat_messages 
FOR INSERT 
TO authenticated
WITH CHECK (
  user_matricula IN (
    SELECT matricula FROM public.users_matricula WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own messages" 
ON public.routine_chat_messages 
FOR DELETE 
TO authenticated
USING (
  user_matricula IN (
    SELECT matricula FROM public.users_matricula WHERE id = auth.uid()
  )
);