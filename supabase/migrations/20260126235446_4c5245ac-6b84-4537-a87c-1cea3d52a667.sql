-- TASK: Evolve rotinas table to unify agenda + routines

-- 1. Add tipo column (rotina / agenda / lembrete / evento)
ALTER TABLE public.rotinas 
  ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'rotina';

-- 2. Add data column (date for single-day events)
ALTER TABLE public.rotinas 
  ADD COLUMN IF NOT EXISTS data DATE;

-- 3. Add recorrente flag (true for routine, false for single events)
ALTER TABLE public.rotinas 
  ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT true;

-- 4. Add origem (chat / voz / manual / legacy)
ALTER TABLE public.rotinas 
  ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'manual';

-- 5. For existing records, set hora_fim = hora + 1 hour if null
UPDATE public.rotinas
SET hora_fim = hora + INTERVAL '1 hour'
WHERE hora_fim IS NULL AND hora IS NOT NULL;

-- 6. Migrate agenda_items → rotinas
INSERT INTO public.rotinas (
  user_matricula,
  titulo,
  descricao,
  tipo,
  data,
  hora,
  hora_fim,
  recorrente,
  origem,
  ativo,
  dias_semana,
  notificacao_minutos,
  created_at,
  updated_at
)
SELECT
  ai.user_matricula,
  ai.titulo,
  ai.descricao,
  ai.tipo::text,
  ai.data::date,
  ai.hora::time,
  (ai.hora::time + INTERVAL '1 hour')::time,
  false,
  'legacy',
  NOT ai.concluido,
  ARRAY[]::TEXT[],
  ai.notificacao_minutos,
  ai.created_at,
  ai.updated_at
FROM public.agenda_items ai
WHERE NOT EXISTS (
  SELECT 1 FROM public.rotinas r 
  WHERE r.user_matricula = ai.user_matricula 
    AND r.titulo = ai.titulo 
    AND r.data = ai.data::date
);

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_rotinas_tipo ON public.rotinas (tipo);
CREATE INDEX IF NOT EXISTS idx_rotinas_data ON public.rotinas (data);
CREATE INDEX IF NOT EXISTS idx_rotinas_origem ON public.rotinas (origem);
CREATE INDEX IF NOT EXISTS idx_rotinas_recorrente ON public.rotinas (recorrente);