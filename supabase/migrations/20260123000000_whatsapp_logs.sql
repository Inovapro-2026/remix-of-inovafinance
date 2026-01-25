-- Create whatsapp_notifications_log table
CREATE TABLE IF NOT EXISTS public.whatsapp_notifications_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_matricula INTEGER NOT NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL, -- sent, failed
    error TEXT,
    notified_type TEXT, -- routine, event, manual
    notified_id UUID, -- reference to agenda_items or rotinas
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for checking duplicates and performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_lookup ON public.whatsapp_notifications_log(notified_id, notified_type, created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_user ON public.whatsapp_notifications_log(user_matricula);

-- Access control (RLS)
ALTER TABLE public.whatsapp_notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own logs"
    ON public.whatsapp_notifications_log FOR SELECT
    USING (user_matricula = (
        SELECT matricula FROM public.users_matricula 
        WHERE id = auth.uid()
    ));

-- Allow service role to manage logs
CREATE POLICY "Service role can manage all logs"
    ON public.whatsapp_notifications_log
    USING (true)
    WITH CHECK (true);
