// Routine Analytics Component - Performance analysis
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target,
  Flame,
  Moon,
  Sun,
  Zap,
  Brain,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface RoutineAnalyticsProps {
  userMatricula: number;
}

interface AnalyticsData {
  totalRotinas: number;
  completedCount: number;
  notDoneCount: number;
  inProgressCount: number;
  completionRate: number;
  horasPlanejadas: number;
  horasConcluidas: number;
  indiceFoco: number;
  indiceEmpenho: number;
  streakDays: number;
  bestHour: string | null;
  worstHour: string | null;
  hourlyStats: { hour: string; completed: number; total: number }[];
}

const defaultAnalytics: AnalyticsData = {
  totalRotinas: 0,
  completedCount: 0,
  notDoneCount: 0,
  inProgressCount: 0,
  completionRate: 0,
  horasPlanejadas: 0,
  horasConcluidas: 0,
  indiceFoco: 0,
  indiceEmpenho: 0,
  streakDays: 0,
  bestHour: null,
  worstHour: null,
  hourlyStats: [],
};

export function RoutineAnalytics({ userMatricula }: RoutineAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData>(defaultAnalytics);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'dia' | 'semana' | 'mes'>('semana');

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Calculate date range based on period
      const today = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'dia':
          startDate = new Date(today);
          break;
        case 'semana':
          startDate = new Date(today);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'mes':
          startDate = new Date(today);
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];

      // Get all active routines
      const { data: rotinas, error: rotinasError } = await supabase
        .from('rotinas')
        .select('*')
        .eq('user_matricula', userMatricula)
        .eq('ativo', true);

      if (rotinasError) throw rotinasError;

      // Get completions for the period
      const { data: completions, error: completionsError } = await supabase
        .from('rotina_completions')
        .select('*')
        .eq('user_matricula', userMatricula)
        .gte('data_conclusao', startDateStr)
        .lte('data_conclusao', endDateStr);

      if (completionsError) throw completionsError;

      // Also try to get executions if they exist
      const { data: executions } = await supabase
        .from('rotina_executions')
        .select('*')
        .eq('user_matricula', userMatricula)
        .gte('data', startDateStr)
        .lte('data', endDateStr);

      // Helper to get day name in Portuguese
      const getDayName = (date: Date): string => {
        const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        return days[date.getDay()];
      };

      // Calculate total expected routines for the period
      let totalExpected = 0;
      const routineHours: { hour: string; rotinaId: string }[] = [];
      
      // Iterate through each day in the period
      const currentDate = new Date(startDate);
      while (currentDate <= today) {
        const dayName = getDayName(currentDate);
        
        rotinas?.forEach(rotina => {
          if (rotina.dias_semana.includes(dayName)) {
            totalExpected++;
            const hour = rotina.hora.slice(0, 2);
            routineHours.push({ hour, rotinaId: rotina.id });
          }
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Count completed
      const completedCount = completions?.length || 0;
      
      // Calculate from executions if available, otherwise use completions
      let inProgressCount = 0;
      let notDoneCount = 0;
      
      if (executions && executions.length > 0) {
        inProgressCount = executions.filter(e => e.status === 'em_andamento').length;
        notDoneCount = executions.filter(e => e.status === 'nao_feito').length;
      } else {
        // Estimate based on time passed
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // Only count not done for routines whose time has passed today
        if (period === 'dia') {
          rotinas?.forEach(rotina => {
            const todayName = getDayName(now);
            if (rotina.dias_semana.includes(todayName) && rotina.hora < currentTime) {
              const wasCompleted = completions?.some(c => c.rotina_id === rotina.id);
              if (!wasCompleted) {
                notDoneCount++;
              }
            }
          });
        }
      }

      // Calculate hours (estimate 30 min per routine if not specified)
      let horasPlanejadas = totalExpected * 0.5; // 30 min per routine
      let horasConcluidas = completedCount * 0.5;

      // Calculate hourly stats based on completions
      const hourlyMap: Record<string, { completed: number; total: number }> = {};
      
      completions?.forEach(comp => {
        const rotina = rotinas?.find(r => r.id === comp.rotina_id);
        if (rotina) {
          const hour = rotina.hora.slice(0, 2);
          if (!hourlyMap[hour]) {
            hourlyMap[hour] = { completed: 0, total: 0 };
          }
          hourlyMap[hour].completed++;
        }
      });

      // Add total expected per hour
      routineHours.forEach(({ hour }) => {
        if (!hourlyMap[hour]) {
          hourlyMap[hour] = { completed: 0, total: 0 };
        }
        hourlyMap[hour].total++;
      });

      const hourlyStats = Object.entries(hourlyMap)
        .map(([hour, stats]) => ({ hour: `${hour}h`, ...stats }))
        .sort((a, b) => a.hour.localeCompare(b.hour));

      // Find best and worst hours
      let bestHour = null;
      let worstHour = null;
      let bestRate = 0;
      let worstRate = 1;

      hourlyStats.forEach(stat => {
        if (stat.total >= 2) {
          const rate = stat.completed / stat.total;
          if (rate > bestRate) {
            bestRate = rate;
            bestHour = stat.hour;
          }
          if (rate < worstRate) {
            worstRate = rate;
            worstHour = stat.hour;
          }
        }
      });

      // Calculate indices
      const completionRate = totalExpected > 0 ? (completedCount / totalExpected) * 100 : 0;
      const indiceFoco = totalExpected > 0 ? ((completedCount + inProgressCount * 0.5) / totalExpected) * 100 : 0;
      const indiceEmpenho = Math.min(100, (completedCount * 10) + (inProgressCount * 5));

      // Calculate streak
      const { data: recentCompletions } = await supabase
        .from('rotina_completions')
        .select('data_conclusao')
        .eq('user_matricula', userMatricula)
        .order('data_conclusao', { ascending: false })
        .limit(30);

      let streakDays = 0;
      const uniqueDates = [...new Set(recentCompletions?.map(c => c.data_conclusao) || [])];
      
      for (let i = 0; i < uniqueDates.length; i++) {
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);
        const expectedDateStr = expectedDate.toISOString().split('T')[0];
        
        if (uniqueDates.includes(expectedDateStr)) {
          streakDays++;
        } else {
          break;
        }
      }

      setAnalytics({
        totalRotinas: totalExpected,
        completedCount,
        notDoneCount,
        inProgressCount,
        completionRate,
        horasPlanejadas,
        horasConcluidas,
        indiceFoco,
        indiceEmpenho,
        streakDays,
        bestHour,
        worstHour,
        hourlyStats,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userMatricula, period]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const getTimeIcon = (hour: string) => {
    const h = parseInt(hour);
    if (h >= 5 && h < 12) return <Sun className="w-4 h-4 text-amber-500" />;
    if (h >= 12 && h < 18) return <Zap className="w-4 h-4 text-orange-500" />;
    return <Moon className="w-4 h-4 text-blue-500" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex gap-2">
        {(['dia', 'semana', 'mes'] as const).map(p => (
          <Button
            key={p}
            variant={period === p ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(p)}
          >
            {p === 'dia' ? 'Hoje' : p === 'semana' ? 'Semana' : 'Mês'}
          </Button>
        ))}
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-500" />
                <span className="text-sm text-muted-foreground">Concluídas</span>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {analytics.completedCount}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  /{analytics.totalRotinas}
                </span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <span className="text-sm text-muted-foreground">Sequência</span>
              </div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {analytics.streakDays}
                <span className="text-sm font-normal text-muted-foreground ml-1">dias</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance Indices */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Índices de Desempenho
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-500" />
                Índice de Foco
              </span>
              <span className="font-medium">{analytics.indiceFoco.toFixed(0)}%</span>
            </div>
            <Progress value={analytics.indiceFoco} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Índice de Empenho
              </span>
              <span className="font-medium">{analytics.indiceEmpenho.toFixed(0)}%</span>
            </div>
            <Progress value={analytics.indiceEmpenho} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" />
                Taxa de Conclusão
              </span>
              <span className="font-medium">{analytics.completionRate.toFixed(0)}%</span>
            </div>
            <Progress value={analytics.completionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Time Map */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Mapa de Tempo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analytics.bestHour && (
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/30">
              <div className="flex items-center gap-2">
                {getTimeIcon(analytics.bestHour)}
                <span className="text-sm">Melhor horário</span>
              </div>
              <Badge className="bg-green-500">{analytics.bestHour}</Badge>
            </div>
          )}

          {analytics.worstHour && (
            <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/30">
              <div className="flex items-center gap-2">
                {getTimeIcon(analytics.worstHour)}
                <span className="text-sm">Horário difícil</span>
              </div>
              <Badge variant="destructive">{analytics.worstHour}</Badge>
            </div>
          )}

          {/* Hourly breakdown */}
          {analytics.hourlyStats.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Desempenho por hora</p>
              <div className="flex gap-1 flex-wrap">
                {analytics.hourlyStats.map(stat => {
                  const rate = stat.total > 0 ? stat.completed / stat.total : 0;
                  return (
                    <div
                      key={stat.hour}
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        rate >= 0.8 ? "bg-green-500/20 text-green-600" :
                        rate >= 0.5 ? "bg-amber-500/20 text-amber-600" :
                        "bg-red-500/20 text-red-600"
                      )}
                      title={`${stat.completed}/${stat.total} concluídas`}
                    >
                      {stat.hour}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Insight */}
      {analytics.bestHour && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
                    💡 Dica da IA
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Você rende melhor às {analytics.bestHour}. 
                    Tente mover tarefas importantes para esse período 
                    e deixe as mais leves para {analytics.worstHour || 'outros horários'}.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
