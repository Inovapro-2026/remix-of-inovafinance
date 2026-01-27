/**
 * Save Unified Routine Service
 * 
 * This service handles saving parsed agenda/routine events to the database.
 * It uses the unified `rotinas` table for all event types.
 */

import { supabase } from '@/integrations/supabase/client';
import type { ParsedAgendaEvent } from './unifiedAgendaParser';

export interface SaveResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Save a parsed event to the unified rotinas table
 */
export async function saveUnifiedRoutine(
  event: ParsedAgendaEvent,
  userMatricula: number
): Promise<SaveResult> {
  try {
    console.log('[saveUnifiedRoutine] Saving event:', event, 'for user:', userMatricula);

    // Prepare the record for insertion
    const record = {
      user_matricula: userMatricula,
      titulo: event.titulo,
      descricao: event.descricao || null,
      tipo: event.tipo,
      data: event.recorrente ? null : event.data,
      hora: event.hora, // This is hora_inicio in the original schema
      hora_fim: event.hora_fim,
      recorrente: event.recorrente,
      origem: event.origem,
      dias_semana: event.recorrente ? event.dias_semana : [],
      categoria: event.categoria || 'pessoal',
      ativo: true,
      notificacao_minutos: 15,
    };

    const { data, error } = await supabase
      .from('rotinas')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error('[saveUnifiedRoutine] Database error:', error);
      return { success: false, error: error.message };
    }

    console.log('[saveUnifiedRoutine] Successfully saved:', data);

    // Also create execution record for today if applicable
    if (!event.recorrente && data) {
      const today = new Date().toISOString().split('T')[0];
      if (event.data === today) {
        await supabase.from('rotina_executions').insert({
          rotina_id: data.id,
          user_matricula: userMatricula,
          data: event.data,
          scheduled_time: event.hora,
          status: 'pendente',
        });
      }
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[saveUnifiedRoutine] Unexpected error:', err);
    return { success: false, error: 'Erro inesperado ao salvar' };
  }
}

/**
 * Format success message for display
 */
export function formatSuccessMessage(event: ParsedAgendaEvent): string {
  const tipoLabel = {
    rotina: 'Rotina',
    agenda: 'Agenda',
    lembrete: 'Lembrete',
    evento: 'Evento',
  }[event.tipo];

  if (event.recorrente && event.dias_semana.length > 0) {
    const diasLabels: Record<string, string> = {
      segunda: 'Segunda', terca: 'Terça', quarta: 'Quarta',
      quinta: 'Quinta', sexta: 'Sexta', sabado: 'Sábado', domingo: 'Domingo',
    };
    const diasStr = event.dias_semana.map(d => diasLabels[d] || d).join(', ');
    
    return `✅ ${tipoLabel} adicionada com sucesso!\n\n📅 ${diasStr}\n⏰ ${event.hora}–${event.hora_fim}\n📌 ${event.titulo}`;
  }

  const dataFormatted = new Date(event.data + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return `✅ ${tipoLabel} adicionado com sucesso!\n\n📅 ${dataFormatted}\n⏰ ${event.hora}–${event.hora_fim}\n📌 ${event.titulo}`;
}
