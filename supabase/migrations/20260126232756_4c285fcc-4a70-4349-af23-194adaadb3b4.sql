-- Fix routine days format from short (seg, ter...) to full names (segunda, terca...)
UPDATE rotinas 
SET dias_semana = ARRAY(
  SELECT CASE 
    WHEN elem = 'seg' THEN 'segunda'
    WHEN elem = 'ter' THEN 'terca'
    WHEN elem = 'qua' THEN 'quarta'
    WHEN elem = 'qui' THEN 'quinta'
    WHEN elem = 'sex' THEN 'sexta'
    WHEN elem = 'sab' THEN 'sabado'
    WHEN elem = 'dom' THEN 'domingo'
    ELSE elem
  END
  FROM unnest(dias_semana) AS elem
)
WHERE EXISTS (
  SELECT 1 FROM unnest(dias_semana) AS d 
  WHERE d IN ('seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom')
);