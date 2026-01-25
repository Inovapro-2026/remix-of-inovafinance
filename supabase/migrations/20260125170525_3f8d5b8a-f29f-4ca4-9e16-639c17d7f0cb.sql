-- Tabela para chat ao vivo entre cliente e admin
CREATE TABLE public.live_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_matricula INTEGER NOT NULL,
  user_name TEXT,
  status TEXT NOT NULL DEFAULT 'waiting',
  admin_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Mensagens do chat ao vivo
CREATE TABLE public.live_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.live_chat_sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL DEFAULT 'user',
  sender_id TEXT,
  message TEXT NOT NULL,
  is_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for live_chat_sessions
CREATE POLICY "Users can view their own sessions"
ON public.live_chat_sessions
FOR SELECT
USING (user_matricula IN (SELECT matricula FROM users_matricula WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can create their own sessions"
ON public.live_chat_sessions
FOR INSERT
WITH CHECK (user_matricula IN (SELECT matricula FROM users_matricula WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins can manage all sessions"
ON public.live_chat_sessions
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS policies for live_chat_messages
CREATE POLICY "Users can view messages in their sessions"
ON public.live_chat_messages
FOR SELECT
USING (
  session_id IN (
    SELECT id FROM live_chat_sessions 
    WHERE user_matricula IN (SELECT matricula FROM users_matricula WHERE auth_user_id = auth.uid())
  )
);

CREATE POLICY "Users can insert messages in their sessions"
ON public.live_chat_messages
FOR INSERT
WITH CHECK (
  session_id IN (
    SELECT id FROM live_chat_sessions 
    WHERE user_matricula IN (SELECT matricula FROM users_matricula WHERE auth_user_id = auth.uid())
  )
);

CREATE POLICY "Admins can manage all messages"
ON public.live_chat_messages
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_live_chat_sessions_updated_at
BEFORE UPDATE ON public.live_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index para melhor performance
CREATE INDEX idx_live_chat_sessions_status ON public.live_chat_sessions(status);
CREATE INDEX idx_live_chat_sessions_user ON public.live_chat_sessions(user_matricula);
CREATE INDEX idx_live_chat_messages_session ON public.live_chat_messages(session_id);