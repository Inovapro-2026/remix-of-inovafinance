// Routine Queue Service - Sequential popout management
import { supabase } from '@/integrations/supabase/client';

export interface QueuedRoutine {
  id: string;
  execution_id: string;
  rotina_id: string;
  titulo: string;
  hora: string;
  hora_fim?: string;
  categoria?: string;
  queue_type: 'inicio' | 'encerramento';
  status: string;
}

class RoutineQueueService {
  private queue: QueuedRoutine[] = [];
  private currentPopout: QueuedRoutine | null = null;
  private onQueueUpdate: ((queue: QueuedRoutine[], current: QueuedRoutine | null) => void) | null = null;

  setOnQueueUpdate(callback: (queue: QueuedRoutine[], current: QueuedRoutine | null) => void) {
    this.onQueueUpdate = callback;
  }

  private notify() {
    if (this.onQueueUpdate) {
      this.onQueueUpdate([...this.queue], this.currentPopout);
    }
  }

  async loadOverdueRoutines(userMatricula: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTimeStr = now.toTimeString().slice(0, 5);

    // Fetch today's executions that haven't been processed
    const { data: executions, error } = await supabase
      .from('rotina_executions')
      .select(`
        id,
        rotina_id,
        data,
        scheduled_time,
        status,
        hora_fim_planejada,
        rotinas!inner (
          id,
          titulo,
          hora,
          hora_fim,
          categoria
        )
      `)
      .eq('user_matricula', userMatricula)
      .eq('data', today)
      .eq('status', 'pendente')
      .order('scheduled_time', { ascending: true });

    if (error) {
      console.error('Error loading overdue routines:', error);
      return;
    }

    // Filter routines whose end time has passed
    const overdueRoutines: QueuedRoutine[] = [];

    for (const exec of executions || []) {
      const rotina = (exec as any).rotinas;
      if (!rotina) continue;

      const endTime = exec.hora_fim_planejada || rotina.hora_fim || rotina.hora;
      
      // If end time has passed and still pending, add to queue
      if (endTime && endTime < currentTimeStr) {
        overdueRoutines.push({
          id: exec.id,
          execution_id: exec.id,
          rotina_id: rotina.id,
          titulo: rotina.titulo,
          hora: rotina.hora,
          hora_fim: rotina.hora_fim,
          categoria: rotina.categoria,
          queue_type: 'encerramento',
          status: exec.status,
        });
      }
    }

    // Sort by time and add to queue
    this.queue = overdueRoutines.sort((a, b) => a.hora.localeCompare(b.hora));
    
    // Start processing if not already
    if (!this.currentPopout && this.queue.length > 0) {
      this.processNext();
    }
    
    this.notify();
  }

  addToQueue(routine: QueuedRoutine): void {
    // Avoid duplicates
    if (this.queue.some(r => r.execution_id === routine.execution_id && r.queue_type === routine.queue_type)) {
      return;
    }
    
    this.queue.push(routine);
    
    // Start processing if this is the first item
    if (!this.currentPopout) {
      this.processNext();
    }
    
    this.notify();
  }

  processNext(): void {
    if (this.queue.length === 0) {
      this.currentPopout = null;
      this.notify();
      return;
    }

    this.currentPopout = this.queue.shift() || null;
    this.notify();
  }

  getCurrentPopout(): QueuedRoutine | null {
    return this.currentPopout;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  async markAsProcessed(executionId: string, completed: boolean): Promise<void> {
    const newStatus = completed ? 'concluido' : 'nao_feito';
    const now = new Date().toISOString();

    await supabase
      .from('rotina_executions')
      .update({ 
        status: newStatus,
        completed_at: completed ? now : null,
      })
      .eq('id', executionId);

    // Move to next in queue
    this.processNext();
  }

  async startRoutine(executionId: string): Promise<void> {
    const now = new Date().toISOString();

    await supabase
      .from('rotina_executions')
      .update({ 
        status: 'em_andamento',
        started_at: now,
        hora_real_inicio: now,
      })
      .eq('id', executionId);

    // Move to next in queue
    this.processNext();
  }

  async cancelRoutine(executionId: string): Promise<void> {
    await supabase
      .from('rotina_executions')
      .update({ 
        status: 'nao_feito',
      })
      .eq('id', executionId);

    // Move to next in queue
    this.processNext();
  }

  clearQueue(): void {
    this.queue = [];
    this.currentPopout = null;
    this.notify();
  }
}

export const routineQueueService = new RoutineQueueService();
