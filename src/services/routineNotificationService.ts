// Routine Notification Service
// Handles scheduling and sending notifications for routines with 15-minute alerts

import { supabase } from '@/integrations/supabase/client';

const SW_PATH = '/sw-routines.js';
const ADVANCE_ALERT_MINUTES = 15;

export interface RoutineAlert {
  id: string;
  routineId: string;
  executionId?: string;
  title: string;
  body: string;
  scheduledTime: number;
  type: 'advance' | 'start' | 'end' | 'reminder';
}

class RoutineNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isInitialized = false;
  private checkInterval: number | null = null;
  private scheduledAlerts: Map<string, NodeJS.Timeout> = new Map();

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Register the custom service worker
      if ('serviceWorker' in navigator) {
        // First check if we have permission
        const permission = await this.requestPermission();
        if (!permission) {
          console.warn('[RoutineNotifications] Permission denied');
          return false;
        }

        // Register the service worker
        this.swRegistration = await navigator.serviceWorker.register(SW_PATH, {
          scope: '/'
        });

        console.log('[RoutineNotifications] Service Worker registered:', this.swRegistration);

        // Listen for messages from the service worker
        navigator.serviceWorker.addEventListener('message', this.handleSWMessage.bind(this));

        // Set up periodic background check
        if ('periodicSync' in this.swRegistration) {
          try {
            await (this.swRegistration as any).periodicSync.register('check-routines', {
              minInterval: 60 * 1000 // 1 minute
            });
          } catch (e) {
            console.log('[RoutineNotifications] Periodic sync not available, using fallback');
            this.startFallbackChecker();
          }
        } else {
          this.startFallbackChecker();
        }

        this.isInitialized = true;
        return true;
      }
    } catch (error) {
      console.error('[RoutineNotifications] Initialization error:', error);
    }

    // Fallback for browsers without full SW support
    this.startFallbackChecker();
    return false;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('[RoutineNotifications] Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  private handleSWMessage(event: MessageEvent) {
    const { type, action, routineId, executionId } = event.data;

    if (type === 'NOTIFICATION_ACTION') {
      // Dispatch custom event for the app to handle
      window.dispatchEvent(new CustomEvent('routine-notification-action', {
        detail: { action, routineId, executionId }
      }));
    }
  }

  private startFallbackChecker() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check every minute
    this.checkInterval = window.setInterval(() => {
      this.checkScheduledAlerts();
    }, 60 * 1000);

    console.log('[RoutineNotifications] Fallback checker started');
  }

  async scheduleRoutineAlerts(
    userMatricula: number,
    date: string = new Date().toISOString().split('T')[0]
  ): Promise<void> {
    try {
      // Get all active routines for today
      const dayName = this.getDayName(new Date(date));

      const { data: routines, error } = await supabase
        .from('rotinas')
        .select('*')
        .eq('user_matricula', userMatricula)
        .eq('ativo', true)
        .contains('dias_semana', [dayName]);

      if (error) throw error;

      const now = new Date();
      const currentTimeMs = now.getTime();

      for (const routine of routines || []) {
        // Parse routine time
        const [hours, minutes] = routine.hora.split(':').map(Number);
        const routineTime = new Date(date);
        routineTime.setHours(hours, minutes, 0, 0);
        const routineTimeMs = routineTime.getTime();

        // Schedule 15-minute advance alert
        const advanceAlertTime = routineTimeMs - (ADVANCE_ALERT_MINUTES * 60 * 1000);

        if (advanceAlertTime > currentTimeMs) {
          await this.scheduleAlert({
            id: `advance-${routine.id}-${date}`,
            routineId: routine.id,
            title: `⏰ ${routine.titulo} em 15 minutos`,
            body: `Prepare-se! Sua rotina "${routine.titulo}" começa às ${routine.hora}`,
            scheduledTime: advanceAlertTime,
            type: 'advance'
          });
        }

        // Schedule start alert
        if (routineTimeMs > currentTimeMs) {
          await this.scheduleAlert({
            id: `start-${routine.id}-${date}`,
            routineId: routine.id,
            title: `🚀 Hora de: ${routine.titulo}`,
            body: `Sua rotina está começando agora!`,
            scheduledTime: routineTimeMs,
            type: 'start'
          });
        }

        // Schedule end alert if has end time
        if (routine.hora_fim) {
          const [endHours, endMinutes] = routine.hora_fim.split(':').map(Number);
          const endTime = new Date(date);
          endTime.setHours(endHours, endMinutes, 0, 0);
          const endTimeMs = endTime.getTime();

          if (endTimeMs > currentTimeMs) {
            await this.scheduleAlert({
              id: `end-${routine.id}-${date}`,
              routineId: routine.id,
              title: `⚠️ Finalizar: ${routine.titulo}`,
              body: `Você concluiu essa rotina?`,
              scheduledTime: endTimeMs,
              type: 'end'
            });
          }
        }
      }

      console.log('[RoutineNotifications] Alerts scheduled for', routines?.length || 0, 'routines');

      // Also schedule Agenda alerts
      await this.scheduleAgendaAlerts(userMatricula, date);
    } catch (error) {
      console.error('[RoutineNotifications] Error scheduling alerts:', error);
    }
  }

  async scheduleAgendaAlerts(
    userMatricula: number,
    date: string = new Date().toISOString().split('T')[0]
  ): Promise<void> {
    try {
      const { data: items, error } = await supabase
        .from('agenda_items')
        .select('*')
        .eq('user_matricula', userMatricula)
        .eq('data', date)
        .eq('concluido', false);

      if (error) throw error;

      const now = new Date();
      const currentTimeMs = now.getTime();

      for (const item of items || []) {
        // Parse time
        const [hours, minutes] = item.hora.split(':').map(Number);
        const itemTime = new Date(date);
        itemTime.setHours(hours, minutes, 0, 0);
        const itemTimeMs = itemTime.getTime();

        // Schedule 15-minute advance alert
        const advanceAlertTime = itemTimeMs - (ADVANCE_ALERT_MINUTES * 60 * 1000);

        if (advanceAlertTime > currentTimeMs) {
          await this.scheduleAlert({
            id: `agenda-advance-${item.id}-${date}`,
            routineId: item.id,
            title: `📅 Agenda: ${item.titulo} em 15 min`,
            body: `Seu compromisso "${item.titulo}" começa em breve, às ${item.hora}`,
            scheduledTime: advanceAlertTime,
            type: 'advance'
          });
        }

        // Schedule start alert
        if (itemTimeMs > currentTimeMs) {
          await this.scheduleAlert({
            id: `agenda-start-${item.id}-${date}`,
            routineId: item.id,
            title: `🚀 Hora de: ${item.titulo}`,
            body: `Seu compromisso está começando agora!`,
            scheduledTime: itemTimeMs,
            type: 'start'
          });
        }
      }

      console.log('[AgendaNotifications] Alerts scheduled for', items?.length || 0, 'items');
    } catch (error) {
      console.error('[AgendaNotifications] Error scheduling alerts:', error);
    }
  }


  private async scheduleAlert(alert: RoutineAlert): Promise<void> {
    const delay = alert.scheduledTime - Date.now();

    if (delay <= 0) return;

    // Clear existing alert with same ID
    if (this.scheduledAlerts.has(alert.id)) {
      clearTimeout(this.scheduledAlerts.get(alert.id));
    }

    // Try to use service worker for background notifications
    if (this.swRegistration?.active) {
      const messageChannel = new MessageChannel();
      this.swRegistration.active.postMessage(
        { type: 'SCHEDULE_NOTIFICATION', payload: alert },
        [messageChannel.port2]
      );
    }

    // Also set a local timeout as fallback
    const timeout = setTimeout(() => {
      this.showNotification(alert);
      this.scheduledAlerts.delete(alert.id);
    }, delay);

    this.scheduledAlerts.set(alert.id, timeout);
  }

  async cancelAlert(alertId: string): Promise<void> {
    // Clear local timeout
    if (this.scheduledAlerts.has(alertId)) {
      clearTimeout(this.scheduledAlerts.get(alertId));
      this.scheduledAlerts.delete(alertId);
    }

    // Cancel in service worker
    if (this.swRegistration?.active) {
      this.swRegistration.active.postMessage({
        type: 'CANCEL_NOTIFICATION',
        payload: { id: alertId }
      });
    }
  }

  async showNotification(alert: RoutineAlert): Promise<void> {
    // Vibrate if supported
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 300]);
    }

    // Try service worker first for background support
    if (this.swRegistration?.active) {
      this.swRegistration.active.postMessage({
        type: 'SHOW_IMMEDIATE',
        payload: {
          title: alert.title,
          body: alert.body,
          tag: alert.id,
          actions: this.getActionsForType(alert.type),
          data: {
            routineId: alert.routineId,
            executionId: alert.executionId,
            type: alert.type
          }
        }
      });
      return;
    }

    // Fallback to regular Notification API
    if (Notification.permission === 'granted') {
      new Notification(alert.title, {
        body: alert.body,
        icon: '/apple-touch-icon.png',
        tag: alert.id,
        requireInteraction: true
      });
    }
  }

  private getActionsForType(type: RoutineAlert['type']) {
    switch (type) {
      case 'advance':
        return [
          { action: 'start', title: '▶️ Iniciar agora' },
          { action: 'dismiss', title: '⏰ Aguardar' }
        ];
      case 'start':
        return [
          { action: 'start', title: '▶️ Iniciar' },
          { action: 'skip', title: '⏭️ Pular' }
        ];
      case 'end':
        return [
          { action: 'complete', title: '✅ Sim' },
          { action: 'incomplete', title: '❌ Não' }
        ];
      default:
        return [
          { action: 'open', title: '📱 Abrir' },
          { action: 'dismiss', title: '❌ Dispensar' }
        ];
    }
  }

  private checkScheduledAlerts() {
    const now = Date.now();

    this.scheduledAlerts.forEach((timeout, id) => {
      // Timeouts are handled automatically, this is just for cleanup
    });
  }

  private getDayName(date: Date): string {
    const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    return days[date.getDay()];
  }

  async sendTestNotification(): Promise<void> {
    await this.showNotification({
      id: 'test-' + Date.now(),
      routineId: 'test',
      title: '🔔 Teste de Notificação',
      body: 'As notificações de rotinas estão funcionando!',
      scheduledTime: Date.now(),
      type: 'reminder'
    });
  }

  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.scheduledAlerts.forEach((timeout) => clearTimeout(timeout));
    this.scheduledAlerts.clear();
  }
}

export const routineNotificationService = new RoutineNotificationService();
