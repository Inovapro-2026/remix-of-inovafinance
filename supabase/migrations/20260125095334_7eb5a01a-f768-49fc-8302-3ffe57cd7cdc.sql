-- Reset policies for user_whatsapp_settings (matricula-based, no Supabase Auth session)

DROP POLICY IF EXISTS "user_whatsapp_settings_user_access" ON public.user_whatsapp_settings;
DROP POLICY IF EXISTS "user_whatsapp_settings_admin_access" ON public.user_whatsapp_settings;
DROP POLICY IF EXISTS "public_whatsapp_settings_select" ON public.user_whatsapp_settings;
DROP POLICY IF EXISTS "public_whatsapp_settings_insert" ON public.user_whatsapp_settings;
DROP POLICY IF EXISTS "public_whatsapp_settings_update" ON public.user_whatsapp_settings;

-- Allow SELECT for any row that belongs to an existing matricula
CREATE POLICY "public_whatsapp_settings_select"
ON public.user_whatsapp_settings
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.users_matricula um
    WHERE um.matricula = user_whatsapp_settings.user_matricula
  )
);

-- Allow INSERT when the referenced matricula exists
CREATE POLICY "public_whatsapp_settings_insert"
ON public.user_whatsapp_settings
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users_matricula um
    WHERE um.matricula = user_whatsapp_settings.user_matricula
  )
);

-- Allow UPDATE when the referenced matricula exists
CREATE POLICY "public_whatsapp_settings_update"
ON public.user_whatsapp_settings
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.users_matricula um
    WHERE um.matricula = user_whatsapp_settings.user_matricula
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users_matricula um
    WHERE um.matricula = user_whatsapp_settings.user_matricula
  )
);
