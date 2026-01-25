// Productivity Charts Component using Recharts
// Visual analysis of routine completion trends

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  Clock,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface ProductivityChartsProps {
  userMatricula: number;
}

interface DailyData {
  date: string;
  dayLabel: string;
  completed: number;
  notDone: number;
  total: number;
  rate: number;
}

interface HourlyData {
  hour: string;
  completed: number;
  total: number;
  rate: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  trabalho: '#3B82F6',
  estudo: '#8B5CF6',
  pessoal: '#10B981',
  saude: '#EF4444',
  lazer: '#F59E0B',
  outro: '#6B7280'
};

export function ProductivityCharts({ userMatricula }: ProductivityChartsProps) {
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const loadChartData = useCallback(async () => {
    setIsLoading(true);

    try {
      const today = new Date();
      const daysBack = period === 'week' ? 7 : 30;
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - daysBack);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];

      // Get all active routines
      const { data: routines, error: routinesError } = await supabase
        .from('rotinas')
        .select('*')
        .eq('user_matricula', userMatricula)
        .eq('ativo', true);

      if (routinesError) throw routinesError;

      // Get completions for the period
      const { data: completions, error: completionsError } = await supabase
        .from('rotina_completions')
        .select('*')
        .eq('user_matricula', userMatricula)
        .gte('data_conclusao', startDateStr)
        .lte('data_conclusao', endDateStr);

      if (completionsError) throw completionsError;

      // Get executions if available
      const { data: executions } = await supabase
        .from('rotina_executions')
        .select('*')
        .eq('user_matricula', userMatricula)
        .gte('data', startDateStr)
        .lte('data', endDateStr);

      // Helper functions
      const getDayName = (date: Date): string => {
        const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        return days[date.getDay()];
      };

      const getDayLabel = (date: Date): string => {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return days[date.getDay()];
      };

      // Build daily data
      const dailyMap: Record<string, { completed: number; notDone: number; total: number }> = {};
      
      const currentDate = new Date(startDate);
      while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayName = getDayName(currentDate);
        
        let expectedCount = 0;
        routines?.forEach(rotina => {
          if (rotina.dias_semana.includes(dayName)) {
            expectedCount++;
          }
        });

        const dayCompletions = completions?.filter(c => c.data_conclusao === dateStr) || [];
        const dayExecutions = executions?.filter(e => e.data === dateStr) || [];
        const notDoneCount = dayExecutions.filter(e => e.status === 'nao_feito').length;

        dailyMap[dateStr] = {
          completed: dayCompletions.length,
          notDone: notDoneCount,
          total: expectedCount
        };

        currentDate.setDate(currentDate.getDate() + 1);
      }

      const daily: DailyData[] = Object.entries(dailyMap).map(([date, data]) => ({
        date,
        dayLabel: getDayLabel(new Date(date + 'T12:00:00')),
        ...data,
        rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
      }));

      setDailyData(daily.slice(-7)); // Show last 7 days

      // Build hourly data
      const hourlyMap: Record<string, { completed: number; total: number }> = {};
      
      for (let h = 5; h <= 23; h++) {
        const hourStr = h.toString().padStart(2, '0');
        hourlyMap[hourStr] = { completed: 0, total: 0 };
      }

      completions?.forEach(comp => {
        const rotina = routines?.find(r => r.id === comp.rotina_id);
        if (rotina) {
          const hour = rotina.hora.slice(0, 2);
          if (hourlyMap[hour]) {
            hourlyMap[hour].completed++;
          }
        }
      });

      // Count expected per hour
      routines?.forEach(rotina => {
        const hour = rotina.hora.slice(0, 2);
        if (hourlyMap[hour]) {
          // Multiply by days in period that match routine days
          const daysInPeriod = dailyData.filter(d => {
            const dayName = getDayName(new Date(d.date + 'T12:00:00'));
            return rotina.dias_semana.includes(dayName);
          }).length;
          hourlyMap[hour].total += daysInPeriod || 1;
        }
      });

      const hourly: HourlyData[] = Object.entries(hourlyMap)
        .filter(([, data]) => data.total > 0 || data.completed > 0)
        .map(([hour, data]) => ({
          hour: `${hour}h`,
          ...data,
          rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
        }));

      setHourlyData(hourly);

      // Build category data
      const categoryMap: Record<string, number> = {};
      
      completions?.forEach(comp => {
        const rotina = routines?.find(r => r.id === comp.rotina_id);
        if (rotina) {
          const cat = rotina.categoria || 'outro';
          categoryMap[cat] = (categoryMap[cat] || 0) + 1;
        }
      });

      const categories: CategoryData[] = Object.entries(categoryMap).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: CATEGORY_COLORS[name] || CATEGORY_COLORS.outro
      }));

      setCategoryData(categories);

    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userMatricula, period]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex gap-2">
        <Button
          variant={period === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod('week')}
        >
          <Calendar className="w-4 h-4 mr-1" />
          Semana
        </Button>
        <Button
          variant={period === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod('month')}
        >
          <Calendar className="w-4 h-4 mr-1" />
          Mês
        </Button>
      </div>

      {/* Daily Completion Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Evolução Diária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="dayLabel" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Concluídas"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#colorCompleted)"
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Esperadas"
                    stroke="#6B7280"
                    strokeDasharray="5 5"
                    strokeWidth={1}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Hourly Performance Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Desempenho por Horário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="hour" 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    formatter={(value: number) => [`${value}%`, 'Taxa de conclusão']}
                  />
                  <Bar 
                    dataKey="rate" 
                    name="Taxa %"
                    radius={[4, 4, 0, 0]}
                  >
                    {hourlyData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={
                          entry.rate >= 80 ? '#10B981' :
                          entry.rate >= 50 ? '#F59E0B' :
                          '#EF4444'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Distribution */}
      {categoryData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Distribuição por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-32 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={50}
                        dataKey="value"
                        stroke="none"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {categoryData.map((cat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-sm">{cat.name}</span>
                      </div>
                      <Badge variant="secondary">{cat.value}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="grid grid-cols-3 gap-2">
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                {dailyData.reduce((acc, d) => acc + d.completed, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Concluídas</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {dailyData.reduce((acc, d) => acc + d.total, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Planejadas</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">
                {dailyData.length > 0 
                  ? Math.round(dailyData.reduce((acc, d) => acc + d.rate, 0) / dailyData.length)
                  : 0}%
              </p>
              <p className="text-xs text-muted-foreground">Média</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
