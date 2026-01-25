-- Corrigir usuário Saulo Yosef que deveria ser afiliado
UPDATE users_matricula 
SET 
  is_affiliate = true,
  affiliate_code = matricula::text,
  affiliate_balance = 0,
  is_admin_affiliate = true,
  subscription_type = 'AFFILIATE_FREE',
  subscription_status = 'active',
  subscription_end_date = null
WHERE matricula = 675632;