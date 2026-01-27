-- Adicionar role admin para maiconsillva2025@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('11ac1f5e-a88c-438a-9486-ce2c90aeb6f5', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;