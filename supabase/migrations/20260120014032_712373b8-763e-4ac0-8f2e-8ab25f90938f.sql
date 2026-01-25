-- Add saldo_atual column to users_matricula for real-time balance tracking
-- This column will be the SINGLE SOURCE OF TRUTH for the user's current balance
-- The AI must ALWAYS use this value directly, never calculate it

ALTER TABLE public.users_matricula
ADD COLUMN IF NOT EXISTS saldo_atual DECIMAL(12,2) DEFAULT 0;

-- Add a comment to the column for documentation
COMMENT ON COLUMN public.users_matricula.saldo_atual IS 'Saldo atual do usuário - ÚNICA fonte de verdade para a IA. Não calcular, usar valor direto.';

-- Update existing users: set saldo_atual = initial_balance for now
-- This will be updated by triggers/application logic when transactions occur
UPDATE public.users_matricula
SET saldo_atual = COALESCE(initial_balance, 0)
WHERE saldo_atual IS NULL OR saldo_atual = 0;