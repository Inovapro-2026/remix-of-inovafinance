-- Add hora_fim (end time), categoria, prioridade to rotinas table
ALTER TABLE public.rotinas 
ADD COLUMN IF NOT EXISTS hora_fim time without time zone,
ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'pessoal',
ADD COLUMN IF NOT EXISTS prioridade text DEFAULT 'media',
ADD COLUMN IF NOT EXISTS descricao text;

-- Add more fields to rotina_executions for tracking
ALTER TABLE public.rotina_executions
ADD COLUMN IF NOT EXISTS hora_fim_planejada time without time zone,
ADD COLUMN IF NOT EXISTS hora_real_inicio timestamp with time zone,
ADD COLUMN IF NOT EXISTS hora_real_fim timestamp with time zone,
ADD COLUMN IF NOT EXISTS tempo_planejado_minutos integer,
ADD COLUMN IF NOT EXISTS tempo_executado_minutos integer,
ADD COLUMN IF NOT EXISTS atraso_minutos integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'pessoal',
ADD COLUMN IF NOT EXISTS prioridade text DEFAULT 'media';

-- Update rotina_analytics table with more metrics
ALTER TABLE public.rotina_analytics
ADD COLUMN IF NOT EXISTS horas_planejadas numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS horas_concluidas numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS horas_nao_cumpridas numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS indice_foco numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS indice_empenho numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS melhor_horario text,
ADD COLUMN IF NOT EXISTS pior_horario text,
ADD COLUMN IF NOT EXISTS horarios_sobrecarregados text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS horarios_livres text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS horarios_ideais text[] DEFAULT '{}';

-- Create routine_tips table for AI tips
CREATE TABLE IF NOT EXISTS public.routine_tips (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_matricula integer NOT NULL,
  rotina_id uuid REFERENCES public.rotinas(id) ON DELETE CASCADE,
  execution_id uuid REFERENCES public.rotina_executions(id) ON DELETE CASCADE,
  tip_text text NOT NULL,
  tip_type text DEFAULT 'produtividade',
  accepted boolean DEFAULT false,
  shown_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on routine_tips
ALTER TABLE public.routine_tips ENABLE ROW LEVEL SECURITY;

-- RLS policies for routine_tips
CREATE POLICY "Users can view their own tips"
ON public.routine_tips FOR SELECT
USING (true);

CREATE POLICY "Users can create their own tips"
ON public.routine_tips FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own tips"
ON public.routine_tips FOR UPDATE
USING (true);

-- Create routine_queue table for pending popouts
CREATE TABLE IF NOT EXISTS public.routine_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_matricula integer NOT NULL,
  execution_id uuid REFERENCES public.rotina_executions(id) ON DELETE CASCADE,
  queue_type text NOT NULL DEFAULT 'encerramento', -- 'inicio', 'encerramento'
  priority integer DEFAULT 0,
  processed boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone
);

-- Enable RLS on routine_queue
ALTER TABLE public.routine_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for routine_queue
CREATE POLICY "Users can manage their own queue"
ON public.routine_queue FOR ALL
USING (true)
WITH CHECK (true);