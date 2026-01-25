-- Adicionar campos de controle de onboarding e plano
-- Estes campos garantem que o usuário não volte ao cadastro após completar

-- 1. Campo para indicar que o onboarding foi concluído
ALTER TABLE public.users_matricula 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- 2. Campo para armazenar o passo atual do onboarding (útil para retomar)
ALTER TABLE public.users_matricula 
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

-- 3. Campo para tipo de plano (free_trial, paid, blocked)
-- Nota: já existe subscription_type, mas vamos padronizar com plan_type
ALTER TABLE public.users_matricula 
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'none' 
  CHECK (plan_type IN ('none', 'free_trial', 'paid', 'blocked'));

-- 4. Campo para data de expiração da assinatura paga
ALTER TABLE public.users_matricula 
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ DEFAULT NULL;

-- 5. Atualizar usuários existentes com FREE_TRIAL para ter onboarding_completed = true
UPDATE public.users_matricula 
SET onboarding_completed = true, 
    plan_type = 'free_trial' 
WHERE subscription_type = 'FREE_TRIAL' AND user_status = 'approved';

-- 6. Atualizar usuários existentes com assinatura ativa para ter onboarding_completed = true
UPDATE public.users_matricula 
SET onboarding_completed = true, 
    plan_type = 'paid' 
WHERE subscription_status = 'active' AND user_status = 'approved';

-- 7. Atualizar afiliados admin para ter onboarding_completed = true
UPDATE public.users_matricula 
SET onboarding_completed = true, 
    plan_type = 'free_trial' 
WHERE subscription_type = 'AFFILIATE_FREE' AND user_status = 'approved';

-- 8. Marcar usuários bloqueados
UPDATE public.users_matricula 
SET plan_type = 'blocked' 
WHERE blocked = true;