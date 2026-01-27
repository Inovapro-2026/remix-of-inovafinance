import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Plus,
  Mic,
  MicOff,
  Calendar,
  BarChart3,
  Sparkles,
  MessageSquare,
  Send,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { isaSpeak, timeToSpeech } from '@/services/isaVoiceService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  getRotinas,
  addRotina as addRotinaDb,
  deleteRotina,
  toggleRotinaActive,
  getRotinaCompletionsForDate,
  markRotinaComplete,
  unmarkRotinaComplete,
  getRotinasForToday,
  isRotinaCompletedToday,
  Rotina,
  RotinaCompletion,
  getTodayDate,
  DIAS_SEMANA_LABEL
} from '@/lib/agendaDb';
import {
  requestNotificationPermission,
  hasNotificationPermission,
  sendNotification
} from '@/services/notificationService';
import { routineNotificationService } from '@/services/routineNotificationService';
import { ModeToggle } from '@/components/ModeToggle';
import { useIsaGreeting } from '@/hooks/useIsaGreeting';
import { BrazilClock } from '@/components/BrazilClock';

// New components
import { AddRoutineDialog } from '@/components/routines/AddRoutineDialog';
import { RoutineCard } from '@/components/routines/RoutineCard';
import { RoutinePopout } from '@/components/routines/RoutinePopout';
import { WhatsAppSetupDialog } from '@/components/routines/WhatsAppSetupDialog';
import { routineQueueService, QueuedRoutine } from '@/services/routineQueueService';
import { generateProductivityTip } from '@/services/routineAIService';

// WhatsApp API base URL
// - In produção (VPS com Traefik): usamos a rota relativa /whatsapp-api
// - No preview (Lovable): precisamos apontar para o domínio público da VPS
const WHATSAPP_API_URL = (() => {
  const envUrl = (import.meta as any).env?.VITE_WHATSAPP_API_URL as string | undefined;
  if (envUrl) return envUrl.replace(/\/+$/, '');

  const host = typeof window !== 'undefined' ? window.location.hostname : '';

  // Se já estamos no domínio da VPS (ou outro proxy local), a rota relativa funciona
  if (host.includes('inovabank.inovapro.cloud')) return '/whatsapp-api';

  // Preview/Dev: usa o endpoint público
  return 'https://inovabank.inovapro.cloud/whatsapp-api';
})();

type ViewMode = 'hoje' | 'todas';
type PanelMode = 'rotinas' | 'agenda';

export default function Rotinas() {
  const { user } = useAuth();
  const [allRotinas, setAllRotinas] = useState<Rotina[]>([]);
  const [todayRotinas, setTodayRotinas] = useState<Rotina[]>([]);
  const [completions, setCompletions] = useState<RotinaCompletion[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('hoje');
  const [panelMode, setPanelMode] = useState<PanelMode>('rotinas');
  const [agendaViewMode, setAgendaViewMode] = useState<ViewMode>('hoje');
  const [hasWhatsAppEnabled, setHasWhatsAppEnabled] = useState(false);
  const recognitionRef = useRef<any>(null);

  type UnifiedRotina = Rotina & {
    tipo?: string | null;
    data?: string | null;
    recorrente?: boolean | null;
    hora_fim?: string | null;
    categoria?: string | null;
    prioridade?: string | null;
  };

  // Popout state
  const [currentPopout, setCurrentPopout] = useState<QueuedRoutine | null>(null);
  const [currentTip, setCurrentTip] = useState<string>('');

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rotinaToDelete, setRotinaToDelete] = useState<Rotina | null>(null);

  // Track announced rotinas
  const announcedRotinasRef = useRef<Set<string>>(new Set());

  useIsaGreeting({
    pageType: 'rotinas',
    userId: user?.userId || 0,
    userName: user?.fullName || '',
    initialBalance: 0,
    enabled: !!user
  });

  // Load data
  const loadRotinas = useCallback(async () => {
    if (!user) return;

    const userMatricula = user.userId;
    const rotinas = await getRotinas(userMatricula);
    setAllRotinas(rotinas);

    const today = getRotinasForToday(rotinas);
    setTodayRotinas(today);

    const todayDate = getTodayDate();
    const todayCompletions = await getRotinaCompletionsForDate(userMatricula, todayDate);
    setCompletions(todayCompletions);

    // Load executions
    const { data: execs } = await supabase
      .from('rotina_executions')
      .select('*')
      .eq('user_matricula', userMatricula)
      .eq('data', todayDate);
    setExecutions(execs || []);

    // Check for overdue routines
    await routineQueueService.loadOverdueRoutines(userMatricula);

    // Check WhatsApp settings
    const { data: whatsSettings } = await (supabase as any)
      .from('user_whatsapp_settings')
      .select('*')
      .eq('user_matricula', userMatricula)
      .maybeSingle();

    if (!whatsSettings) {
      setShowWhatsAppDialog(true);
      setHasWhatsAppEnabled(false);
    } else {
      setHasWhatsAppEnabled(whatsSettings.enabled === true);
    }
  }, [user]);

  // Test WhatsApp notification
  const handleTestWhatsApp = async () => {
    if (!user) return;
    
    setIsSendingTest(true);
    try {
      const response = await fetch(`${WHATSAPP_API_URL}/test-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_matricula: user.userId })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('✅ Mensagem de teste enviada! Verifique seu WhatsApp.');
      } else {
        toast.error(data.error || 'Erro ao enviar mensagem de teste');
      }
    } catch (error: any) {
      console.error('WhatsApp test error:', error);
      toast.error('Erro ao conectar com o servidor WhatsApp');
    } finally {
      setIsSendingTest(false);
    }
  };

  useEffect(() => {
    loadRotinas();
  }, [loadRotinas]);

  // Setup queue listener
  useEffect(() => {
    routineQueueService.setOnQueueUpdate(async (queue, current) => {
      setCurrentPopout(current);
      if (current) {
        const tip = await generateProductivityTip({
          titulo: current.titulo,
          hora: current.hora,
          categoria: current.categoria,
        });
        setCurrentTip(tip);
      }
    });
  }, []);

  // Request notification permission and initialize notification service
  useEffect(() => {
    const initNotifications = async () => {
      if (user) {
        // Request permission
        if (!hasNotificationPermission()) {
          await requestNotificationPermission();
        }

        // Initialize the routine notification service with 15-minute alerts
        await routineNotificationService.initialize();
        await routineNotificationService.scheduleRoutineAlerts(user.userId);
      }
    };

    initNotifications();

    return () => {
      routineNotificationService.destroy();
    };
  }, [user]);

  // Check for upcoming routines
  useEffect(() => {
    const checkUpcomingRotinas = async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinute;

      for (const rotina of todayRotinas) {
        if (isRotinaCompletedToday(rotina.id, completions)) continue;
        if (announcedRotinasRef.current.has(rotina.id)) continue;

        const [h, m] = rotina.hora.split(':').map(Number);
        const rotinaTimeMinutes = h * 60 + m;
        const minutesUntil = rotinaTimeMinutes - currentTimeMinutes;

        // Notify 5 minutes before
        if (minutesUntil > 0 && minutesUntil <= 5) {
          announcedRotinasRef.current.add(rotina.id);
          await sendNotification(
            '⏰ Rotina em breve',
            `${rotina.titulo} em ${minutesUntil} minuto${minutesUntil > 1 ? 's' : ''}`,
            `rotina-${rotina.id}`
          );
          await isaSpeak(`Atenção: ${rotina.titulo} em ${minutesUntil} ${minutesUntil === 1 ? 'minuto' : 'minutos'}.`, 'rotinas');
        }

        // Show popout at exact time
        if (minutesUntil === 0) {
          const execution = executions.find(e => e.rotina_id === rotina.id);
          if (execution && execution.status === 'pendente') {
            routineQueueService.addToQueue({
              id: execution.id,
              execution_id: execution.id,
              rotina_id: rotina.id,
              titulo: rotina.titulo,
              hora: rotina.hora,
              hora_fim: (rotina as any).hora_fim,
              categoria: (rotina as any).categoria,
              queue_type: 'inicio',
              status: 'pendente',
            });
          }
        }
      }
    };

    const interval = setInterval(checkUpcomingRotinas, 60000);
    checkUpcomingRotinas();
    return () => clearInterval(interval);
  }, [todayRotinas, completions, executions]);

  // Progress calculation
  const completedCount = todayRotinas.filter(r => isRotinaCompletedToday(r.id, completions)).length;
  const totalCount = todayRotinas.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const todayDate = getTodayDate();
  const agendaItems = (allRotinas as UnifiedRotina[])
    .filter(r => (r.recorrente ?? true) === false || (r.tipo && r.tipo !== 'rotina'))
    .sort((a, b) => {
      const da = a.data || '';
      const db = b.data || '';
      if (da !== db) return da.localeCompare(db);
      return (a.hora || '').localeCompare(b.hora || '');
    });

  const agendaItemsHoje = agendaItems.filter(r => (r.data || '') === todayDate);

  const formatAgendaDate = (isoDate: string) => {
    try {
      return new Date(`${isoDate}T00:00:00`).toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
      });
    } catch {
      return isoDate;
    }
  };

  // Get execution status for a routine
  const getExecutionStatus = (rotinaId: string): 'pendente' | 'em_andamento' | 'feito' | 'nao_feito' => {
    if (isRotinaCompletedToday(rotinaId, completions)) return 'feito';
    const exec = executions.find(e => e.rotina_id === rotinaId);
    if (exec) {
      if (exec.status === 'concluido') return 'feito';
      if (exec.status === 'nao_feito') return 'nao_feito';
      if (exec.status === 'em_andamento') return 'em_andamento';
    }
    return 'pendente';
  };

  // Handlers
  const handleAddRotina = async (rotinaData: any) => {
    if (!user) return;

    const rotina = await addRotinaDb({
      user_matricula: user.userId,
      titulo: rotinaData.titulo,
      dias_semana: rotinaData.dias_semana,
      hora: rotinaData.hora,
    });

    if (rotina) {
      // Update with additional fields
      await supabase
        .from('rotinas')
        .update({
          hora_fim: rotinaData.hora_fim || null,
          categoria: rotinaData.categoria,
          prioridade: rotinaData.prioridade,
          descricao: rotinaData.descricao || null,
        })
        .eq('id', rotina.id);

      toast.success('Rotina criada!');
      await isaSpeak(`Rotina ${rotinaData.titulo} adicionada para às ${timeToSpeech(rotinaData.hora)}.`, 'rotinas');
      await loadRotinas();
    }
  };

  const handleComplete = async (rotinaId: string) => {
    if (!user) return;

    const isCompleted = isRotinaCompletedToday(rotinaId, completions);

    if (isCompleted) {
      await unmarkRotinaComplete(rotinaId, getTodayDate());
    } else {
      await markRotinaComplete(rotinaId, user.userId, getTodayDate());

      if (completedCount + 1 === totalCount) {
        await isaSpeak('Parabéns! Você completou todas as rotinas de hoje!', 'rotinas');
        toast.success('🎉 Todas as rotinas completas!');
      }
    }
    await loadRotinas();
  };

  const handlePopoutStart = async () => {
    if (currentPopout) {
      await routineQueueService.startRoutine(currentPopout.execution_id);
      toast.success('Rotina iniciada!');
      await loadRotinas();
    }
  };

  const handlePopoutComplete = async (completed: boolean) => {
    if (currentPopout) {
      await routineQueueService.markAsProcessed(currentPopout.execution_id, completed);
      if (completed) {
        await markRotinaComplete(currentPopout.rotina_id, user?.userId || 0, getTodayDate());
        toast.success('Rotina concluída!');
      } else {
        toast.info('Rotina marcada como não feita');
      }
      await loadRotinas();
    }
  };

  const handlePopoutCancel = async () => {
    if (currentPopout) {
      await routineQueueService.cancelRoutine(currentPopout.execution_id);
      toast.info('Rotina cancelada');
      await loadRotinas();
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (rotina: Rotina) => {
    setRotinaToDelete(rotina);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (rotinaToDelete) {
      await deleteRotina(rotinaToDelete.id);
      toast.success('Rotina excluída!');
      await loadRotinas();
    }
    setDeleteDialogOpen(false);
    setRotinaToDelete(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Faça login para acessar</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <ModeToggle />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              Rotinas Inteligentes
            </h1>
            <p className="text-sm text-muted-foreground">
              {completedCount}/{totalCount} completas hoje
            </p>
          </div>
          <div className="flex items-center gap-2">
            {panelMode === 'rotinas' && (
              <>
                <Button
                  variant={viewMode === 'hoje' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('hoje')}
                >
                  Hoje
                </Button>
                <Button
                  variant={viewMode === 'todas' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('todas')}
                >
                  Todas
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </>
            )}

            {panelMode === 'agenda' && (
              <>
                <Button
                  variant={agendaViewMode === 'hoje' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setAgendaViewMode('hoje')}
                >
                  Hoje
                </Button>
                <Button
                  variant={agendaViewMode === 'todas' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setAgendaViewMode('todas')}
                >
                  Todas
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-3">
          <Tabs value={panelMode} onValueChange={(v) => setPanelMode(v as PanelMode)}>
            <TabsList className="w-full">
              <TabsTrigger value="rotinas" className="flex-1">Rotinas</TabsTrigger>
              <TabsTrigger value="agenda" className="flex-1">Agenda</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {viewMode === 'hoje' && totalCount > 0 && (
          <div className="mt-3">
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}

        {/* WhatsApp Test Button */}
        {hasWhatsAppEnabled && (
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestWhatsApp}
              disabled={isSendingTest}
              className="w-full flex items-center justify-center gap-2 border-primary/50 text-primary hover:bg-primary/10"
            >
              <MessageSquare className="w-4 h-4" />
              {isSendingTest ? 'Enviando...' : 'Testar Notificação WhatsApp'}
              <Send className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">
        <Tabs value={panelMode} onValueChange={(v) => setPanelMode(v as PanelMode)}>
          <TabsContent value="rotinas" className="mt-0">
            {/* Today's View */}
            {viewMode === 'hoje' && (
              <AnimatePresence mode="popLayout">
                {todayRotinas.map((rotina, index) => (
                  <RoutineCard
                    key={rotina.id}
                    rotina={rotina as any}
                    status={getExecutionStatus(rotina.id)}
                    onComplete={() => handleComplete(rotina.id)}
                    onDelete={() => handleDeleteClick(rotina)}
                    delay={index}
                  />
                ))}
              </AnimatePresence>
            )}

            {/* All Routines View */}
            {viewMode === 'todas' && (
              <AnimatePresence mode="popLayout">
                {(allRotinas as UnifiedRotina[])
                  .filter(r => (r.recorrente ?? true) === true && (r.tipo ?? 'rotina') === 'rotina')
                  .map((rotina, index) => (
                    <RoutineCard
                      key={rotina.id}
                      rotina={rotina as any}
                      status="pendente"
                      showDays
                      onToggleActive={() => toggleRotinaActive(rotina.id, !rotina.ativo).then(loadRotinas)}
                      onDelete={() => handleDeleteClick(rotina)}
                      delay={index}
                    />
                  ))}
              </AnimatePresence>
            )}

            {/* Empty states */}
            {viewMode === 'hoje' && todayRotinas.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nenhuma rotina para hoje</p>
                <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" /> Criar Rotina
                </Button>
              </motion.div>
            )}

            {viewMode === 'todas' && (
              (allRotinas as UnifiedRotina[]).filter(r => (r.recorrente ?? true) === true && (r.tipo ?? 'rotina') === 'rotina').length === 0
            ) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <RefreshCw className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nenhuma rotina criada</p>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="agenda" className="mt-0">
            <AnimatePresence mode="popLayout">
              {(agendaViewMode === 'hoje' ? agendaItemsHoje : agendaItems).map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.03 }}
                  className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                          {(item.tipo || 'agenda').toString()}
                        </span>
                        {item.data && (
                          <span className="text-xs text-muted-foreground">{formatAgendaDate(item.data)}</span>
                        )}
                      </div>
                      <p className="mt-1 font-medium truncate">{item.titulo}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.hora}{item.hora_fim ? `–${item.hora_fim}` : ''}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteClick(item as any)}
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {(agendaViewMode === 'hoje' ? agendaItemsHoje.length === 0 : agendaItems.length === 0) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nenhum item de agenda salvo</p>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Dialog */}
      <AddRoutineDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddRotina}
      />

      {/* Routine Popout */}
      {currentPopout && (
        <RoutinePopout
          isOpen={!!currentPopout}
          type={currentPopout.queue_type}
          rotina={{
            id: currentPopout.rotina_id,
            titulo: currentPopout.titulo,
            hora: currentPopout.hora,
            hora_fim: currentPopout.hora_fim,
            categoria: currentPopout.categoria,
          }}
          aiTip={currentTip}
          onStart={handlePopoutStart}
          onComplete={handlePopoutComplete}
          onCancel={handlePopoutCancel}
          onDismiss={() => setCurrentPopout(null)}
        />
      )}
      {/* WhatsApp Setup Dialog */}
      <WhatsAppSetupDialog
        isOpen={showWhatsAppDialog}
        onClose={() => setShowWhatsAppDialog(false)}
        userId={user.userId.toString()}
        userName={user.fullName || ''}
        onSuccess={() => {
          setShowWhatsAppDialog(false);
          loadRotinas();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Excluir Rotina
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a rotina <strong>"{rotinaToDelete?.titulo}"</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRotinaToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
