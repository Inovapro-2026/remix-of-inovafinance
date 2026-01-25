-- Create user_whatsapp_settings table
CREATE TABLE IF NOT EXISTS public.user_whatsapp_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_matricula INTEGER NOT NULL,
    name TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    total_notifications_sent INTEGER DEFAULT 0,
    UNIQUE(user_matricula)
);

-- Access control (RLS)
ALTER TABLE public.user_whatsapp_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
    ON public.user_whatsapp_settings FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own settings"
    ON public.user_whatsapp_settings FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own settings"
    ON public.user_whatsapp_settings FOR UPDATE
    USING (true);
