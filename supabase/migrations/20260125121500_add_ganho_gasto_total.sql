-- Migration to add ganho_total and gasto_total columns
ALTER TABLE users_matricula 
ADD COLUMN IF NOT EXISTS ganho_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS gasto_total NUMERIC DEFAULT 0;

-- Update existing records to reflect current saldo_atual if it was used for expenses
UPDATE users_matricula 
SET gasto_total = ABS(saldo_atual),
    ganho_total = 0
WHERE saldo_atual < 0 AND (gasto_total = 0 OR gasto_total IS NULL);

UPDATE users_matricula 
SET ganho_total = saldo_atual,
    gasto_total = 0
WHERE saldo_atual > 0 AND (ganho_total = 0 OR ganho_total IS NULL);

-- Reset saldo_atual to be the difference
UPDATE users_matricula
SET saldo_atual = COALESCE(ganho_total, 0) - COALESCE(gasto_total, 0);
