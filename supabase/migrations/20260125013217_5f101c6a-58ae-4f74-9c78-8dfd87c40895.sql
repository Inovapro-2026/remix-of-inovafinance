-- Add policy to allow reading user data for login purposes (by matricula)
-- This is necessary because the login flow needs to fetch the profile before authentication

CREATE POLICY "allow_login_read"
ON public.users_matricula
FOR SELECT
TO anon, authenticated
USING (true);