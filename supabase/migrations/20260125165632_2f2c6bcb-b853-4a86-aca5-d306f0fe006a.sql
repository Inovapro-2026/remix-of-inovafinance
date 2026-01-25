-- Update subscription prices: 29.90 first month, then 49.90
UPDATE public.system_settings
SET value = '29.90', updated_at = now()
WHERE key = 'subscription_price';

UPDATE public.system_settings
SET value = '49.90', updated_at = now()
WHERE key = 'affiliate_price';

-- Ensure values exist
INSERT INTO public.system_settings (key, value)
SELECT 'subscription_price', '29.90'
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'subscription_price');

INSERT INTO public.system_settings (key, value)
SELECT 'affiliate_price', '49.90'
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'affiliate_price');