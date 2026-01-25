// Routine AI Service - Productivity tips and suggestions
import { supabase } from '@/integrations/supabase/client';

interface RoutineContext {
  titulo: string;
  hora: string;
  hora_fim?: string;
  categoria?: string;
  prioridade?: string;
  userHistory?: {
    completionRate: number;
    bestHour?: string;
    worstHour?: string;
    streakDays: number;
  };
}

// Pre-defined tips based on category and time of day
const TIPS_BY_CATEGORY: Record<string, string[]> = {
  trabalho: [
    "Comece pelas tarefas mais difíceis primeiro. Isso aumenta seu foco e reduz o cansaço mental.",
    "Defina micro-metas para as próximas 2 horas. Pequenas vitórias mantêm a motivação.",
    "Faça uma pausa de 5 minutos a cada 25 minutos de trabalho focado (técnica Pomodoro).",
    "Silencie as notificações do celular para manter o foco por pelo menos 1 hora.",
    "Antes de começar, escreva 3 resultados que você quer alcançar hoje.",
  ],
  estudo: [
    "Revise o material da sessão anterior antes de começar algo novo.",
    "Use a técnica de Feynman: explique o conceito como se ensinasse a uma criança.",
    "Faça anotações à mão - isso melhora a retenção em até 40%.",
    "Alterne entre tópicos diferentes para manter o cérebro engajado.",
    "Faça pausas ativas: levante, alongue-se, tome água.",
  ],
  pessoal: [
    "Dedique os primeiros 10 minutos apenas para organizar o ambiente.",
    "Coloque uma música que te motiva para criar um ambiente positivo.",
    "Lembre-se: progresso é melhor que perfeição. Comece pequeno.",
    "Tire um momento para agradecer por algo bom que aconteceu hoje.",
    "Defina uma recompensa para quando completar essa tarefa.",
  ],
  saude: [
    "Comece com um aquecimento leve de 5 minutos para evitar lesões.",
    "Mantenha uma garrafa de água por perto - hidratação é essencial.",
    "Foque na respiração durante os exercícios para melhor desempenho.",
    "Lembre-se: consistência é mais importante que intensidade.",
    "Após terminar, faça 5 minutos de alongamento para relaxar os músculos.",
  ],
};

const TIPS_BY_TIME: Record<string, string[]> = {
  manha: [
    "A manhã é quando seu cérebro está mais fresco. Aproveite para tarefas complexas.",
    "Tome um copo de água ao acordar antes de qualquer café.",
    "Os primeiros 30 minutos do dia definem seu humor. Comece positivo!",
  ],
  tarde: [
    "O pico de energia geralmente cai após o almoço. Faça uma caminhada rápida se possível.",
    "Tarefas criativas costumam fluir melhor à tarde.",
    "Se sentir sono, uma pausa de 10-20 minutos pode restaurar sua energia.",
  ],
  noite: [
    "Evite telas muito brilhantes para não prejudicar seu sono.",
    "Noite é bom para revisões e planejamento do dia seguinte.",
    "Termine suas tarefas pelo menos 1 hora antes de dormir.",
  ],
};

function getTimeOfDay(hora: string): 'manha' | 'tarde' | 'noite' {
  const hour = parseInt(hora.split(':')[0]);
  if (hour >= 5 && hour < 12) return 'manha';
  if (hour >= 12 && hour < 18) return 'tarde';
  return 'noite';
}

function getRandomTip(tips: string[]): string {
  return tips[Math.floor(Math.random() * tips.length)];
}

export async function generateProductivityTip(context: RoutineContext): Promise<string> {
  const categoria = context.categoria || 'pessoal';
  const timeOfDay = getTimeOfDay(context.hora);

  // Combine category and time-based tips
  const categoryTips = TIPS_BY_CATEGORY[categoria] || TIPS_BY_CATEGORY.pessoal;
  const timeTips = TIPS_BY_TIME[timeOfDay];

  // 70% chance category tip, 30% time-based tip
  const useCategoryTip = Math.random() < 0.7;
  const baseTip = useCategoryTip ? getRandomTip(categoryTips) : getRandomTip(timeTips);

  // Add personalization based on user history
  if (context.userHistory) {
    if (context.userHistory.streakDays > 0) {
      return `🔥 ${context.userHistory.streakDays} dias em sequência! ${baseTip}`;
    }
    if (context.userHistory.completionRate < 50) {
      return `💪 Vamos melhorar hoje! ${baseTip}`;
    }
    if (context.userHistory.bestHour && context.hora.startsWith(context.userHistory.bestHour.slice(0, 2))) {
      return `⭐ Este é seu melhor horário! ${baseTip}`;
    }
  }

  return baseTip;
}

export async function generateAITipFromAPI(context: RoutineContext): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('routine-ai-chat', {


      body: {
        message: `Gere uma dica curta (máximo 2 frases) de produtividade para a rotina "${context.titulo}" às ${context.hora}. Categoria: ${context.categoria || 'pessoal'}.`,
        history: []
      }
    });

    if (error) throw error;
    return data?.message || null;
  } catch (error) {
    console.error('Error generating AI tip:', error);
    // Fallback to local tips
    return generateProductivityTip(context);
  }
}

export async function suggestRoutineOptimization(
  userMatricula: number,
  rotinas: any[]
): Promise<string[]> {
  const suggestions: string[] = [];

  // Analyze routine distribution
  const morningCount = rotinas.filter(r => {
    const hour = parseInt(r.hora.split(':')[0]);
    return hour >= 5 && hour < 12;
  }).length;

  const afternoonCount = rotinas.filter(r => {
    const hour = parseInt(r.hora.split(':')[0]);
    return hour >= 12 && hour < 18;
  }).length;

  const eveningCount = rotinas.filter(r => {
    const hour = parseInt(r.hora.split(':')[0]);
    return hour >= 18;
  }).length;

  // Suggestions based on distribution
  if (morningCount === 0) {
    suggestions.push("Considere adicionar uma rotina matinal. A manhã é ideal para tarefas importantes.");
  }

  if (afternoonCount > morningCount + eveningCount) {
    suggestions.push("Você tem muitas rotinas à tarde. Considere distribuir melhor ao longo do dia.");
  }

  // Check for back-to-back routines
  const sortedRotinas = [...rotinas].sort((a, b) => a.hora.localeCompare(b.hora));
  for (let i = 1; i < sortedRotinas.length; i++) {
    const prev = sortedRotinas[i - 1];
    const curr = sortedRotinas[i];

    const prevEnd = prev.hora_fim || prev.hora;
    if (curr.hora <= prevEnd) {
      suggestions.push(`As rotinas "${prev.titulo}" e "${curr.titulo}" podem estar sobrepostas. Considere ajustar os horários.`);
    }
  }

  // Check for gaps (potential rest periods)
  const hasMiddayBreak = !sortedRotinas.some(r => {
    const hour = parseInt(r.hora.split(':')[0]);
    return hour >= 12 && hour <= 13;
  });

  if (!hasMiddayBreak && rotinas.length > 3) {
    suggestions.push("Lembre-se de manter uma pausa para almoço entre 12h e 13h.");
  }

  return suggestions;
}
