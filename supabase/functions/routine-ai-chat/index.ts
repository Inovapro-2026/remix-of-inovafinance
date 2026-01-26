// Routine AI Chat Edge Function - INOVAPRO AI 
// Personal productivity assistant with automatic routine parsing and saving

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ParsedRoutine {
  dia: string;
  dias_semana: string[];
  horario_inicio: string;
  horario_fim: string | null;
  atividade: string;
  categoria: string;
}

interface AgendaItem {
  titulo: string;
  descricao: string | null;
  data: string;
  hora: string;
  tipo: string;
  concluido: boolean;
}

interface Rotina {
  titulo: string;
  descricao: string | null;
  hora: string;
  hora_fim: string | null;
  dias_semana: string[];
  categoria: string | null;
  prioridade: string | null;
  ativo: boolean;
}

interface RotinaExecution {
  data: string;
  scheduled_time: string;
  status: string;
}

// Day name mappings - Use full names for database compatibility with frontend
const DAY_MAPPINGS: Record<string, string[]> = {
  'segunda': ['segunda', 'segunda-feira', 'seg'],
  'terca': ['terça', 'terca', 'terça-feira', 'terca-feira', 'ter'],
  'quarta': ['quarta', 'quarta-feira', 'qua'],
  'quinta': ['quinta', 'quinta-feira', 'qui'],
  'sexta': ['sexta', 'sexta-feira', 'sex'],
  'sabado': ['sábado', 'sabado', 'sab'],
  'domingo': ['domingo', 'dom'],
};

const ALL_WEEKDAYS = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'];
const ALL_DAYS = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];

/**
 * Normalize day name to short format (seg, ter, qua, etc.)
 */
function normalizeDayName(day: string): string | null {
  const lowerDay = day.toLowerCase().trim();
  for (const [shortName, variants] of Object.entries(DAY_MAPPINGS)) {
    if (variants.some(v => lowerDay.includes(v))) {
      return shortName;
    }
  }
  return null;
}

/**
 * Parse time from text like "19h00", "19:00", "7h", "19h00 - 20h00"
 */
function parseTime(text: string): { inicio: string; fim: string | null } | null {
  // Match patterns like "19h00 - 20h00", "19:00-20:00", "19h - 20h"
  const rangePattern = /(\d{1,2})[h:](\d{0,2})?\s*[-–a]\s*(\d{1,2})[h:](\d{0,2})?/i;
  const rangeMatch = text.match(rangePattern);
  
  if (rangeMatch) {
    const startHour = rangeMatch[1].padStart(2, '0');
    const startMin = (rangeMatch[2] || '00').padStart(2, '0');
    const endHour = rangeMatch[3].padStart(2, '0');
    const endMin = (rangeMatch[4] || '00').padStart(2, '0');
    
    return {
      inicio: `${startHour}:${startMin}`,
      fim: `${endHour}:${endMin}`
    };
  }
  
  // Match single time like "19h00", "19:00", "7h"
  const singlePattern = /(\d{1,2})[h:](\d{0,2})?/i;
  const singleMatch = text.match(singlePattern);
  
  if (singleMatch) {
    const hour = singleMatch[1].padStart(2, '0');
    const min = (singleMatch[2] || '00').padStart(2, '0');
    return { inicio: `${hour}:${min}`, fim: null };
  }
  
  return null;
}

/**
 * Detect if message contains routine schedule pattern
 */
function isRoutineScheduleMessage(message: string): boolean {
  const lowerMsg = message.toLowerCase();
  
  // Check for day + time patterns
  const hasDay = Object.values(DAY_MAPPINGS).flat().some(d => lowerMsg.includes(d));
  const hasTime = /\d{1,2}[h:]\d{0,2}/.test(lowerMsg);
  const hasTimeRange = /\d{1,2}[h:]\d{0,2}\s*[-–a]\s*\d{1,2}[h:]\d{0,2}/.test(lowerMsg);
  const hasMultipleLines = message.split('\n').length >= 2;
  
  // Patterns that indicate schedule
  const scheduleIndicators = [
    'segunda', 'terça', 'terca', 'quarta', 'quinta', 'sexta', 'sábado', 'sabado', 'domingo',
    'segunda-feira', 'terça-feira', 'terca-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira',
    'todo dia', 'todos os dias', 'de segunda a sexta', 'terça-feira em diante',
    'a partir de', 'rotina fixa', 'minha rotina', 'meu horário', 'meu cronograma'
  ];
  
  const hasScheduleIndicator = scheduleIndicators.some(ind => lowerMsg.includes(ind));
  
  return (hasDay && hasTime) || (hasTimeRange && hasMultipleLines) || (hasScheduleIndicator && hasTime);
}

/**
 * Parse routine schedule from natural language text
 */
function parseRoutineSchedule(message: string): ParsedRoutine[] {
  const routines: ParsedRoutine[] = [];
  const lines = message.split('\n').filter(l => l.trim());
  
  let currentDays: string[] = [];
  let currentDayLabel = '';
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim();
    
    // Check if this line is a day header
    const isDayHeader = 
      lowerLine.endsWith(':') || 
      lowerLine.match(/^(segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo)/i) ||
      lowerLine.includes('segunda-feira') ||
      lowerLine.includes('terça-feira') ||
      lowerLine.includes('terca-feira') ||
      lowerLine.includes('quarta-feira') ||
      lowerLine.includes('quinta-feira') ||
      lowerLine.includes('sexta-feira');
    
    if (isDayHeader && !lowerLine.match(/\d{1,2}[h:]/)) {
      // Parse which days this header represents
      currentDays = [];
      currentDayLabel = line.replace(':', '').trim();
      
      // Handle range patterns
      if (lowerLine.includes('terça-feira em diante') || lowerLine.includes('terca-feira em diante') ||
          lowerLine.includes('terça em diante') || lowerLine.includes('terca em diante')) {
        currentDays = ['terca', 'quarta', 'quinta', 'sexta'];
      } else if (lowerLine.includes('de segunda a sexta') || lowerLine.includes('segunda a sexta')) {
        currentDays = ALL_WEEKDAYS;
      } else if (lowerLine.includes('todo dia') || lowerLine.includes('todos os dias')) {
        currentDays = ALL_DAYS;
      } else {
        // Check for individual day mention
        for (const [shortName, variants] of Object.entries(DAY_MAPPINGS)) {
          if (variants.some(v => lowerLine.includes(v))) {
            if (!currentDays.includes(shortName)) {
              currentDays.push(shortName);
            }
          }
        }
      }
      continue;
    }
    
    // Check if this line has a time + activity
    const timeMatch = parseTime(line);
    if (timeMatch && currentDays.length > 0) {
      // Extract activity text (remove time portion)
      let activity = line
        .replace(/\d{1,2}[h:]\d{0,2}\s*[-–a]\s*\d{1,2}[h:]\d{0,2}/gi, '')
        .replace(/\d{1,2}[h:]\d{0,2}/gi, '')
        .replace(/^[-–:\s]+/, '')
        .replace(/[-–:\s]+$/, '')
        .trim();
      
      if (activity) {
        // Determine category
        const categoria = detectCategory(activity);
        
        routines.push({
          dia: currentDayLabel,
          dias_semana: [...currentDays],
          horario_inicio: timeMatch.inicio,
          horario_fim: timeMatch.fim,
          atividade: activity,
          categoria
        });
      }
    }
  }
  
  return routines;
}

/**
 * Detect category from activity description
 */
function detectCategory(activity: string): string {
  const lowerActivity = activity.toLowerCase();
  
  if (lowerActivity.match(/trabalho|reunião|reuniao|automação|automacao|lead|prospecção|prospeccao|venda|cliente|facebook|instagram|google|email|projeto/)) {
    return 'trabalho';
  }
  if (lowerActivity.match(/estudo|estudar|aula|curso|leitura|ler|livro|aprendizado/)) {
    return 'estudo';
  }
  if (lowerActivity.match(/exercício|exercicio|academia|treino|corrida|caminhada|yoga|saúde|saude/)) {
    return 'saude';
  }
  if (lowerActivity.match(/documentação|documentacao|revisão|revisao|planejamento|organização|organizacao|métricas|metricas|análise|analise/)) {
    return 'trabalho';
  }
  
  return 'pessoal';
}

/**
 * Save parsed routines to database
 */
async function saveRoutines(
  supabase: any,
  userMatricula: number,
  routines: ParsedRoutine[]
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const insertData = routines.map(r => ({
      user_matricula: userMatricula,
      titulo: r.atividade,
      hora: r.horario_inicio,
      hora_fim: r.horario_fim,
      dias_semana: r.dias_semana,
      categoria: r.categoria,
      prioridade: 'media',
      ativo: true,
      notificacao_minutos: 15
    }));
    
    const { error } = await supabase
      .from('rotinas')
      .insert(insertData as any);
    
    if (error) {
      console.error('Error saving routines:', error);
      return { success: false, count: 0, error: error.message };
    }
    
    return { success: true, count: routines.length };
  } catch (err) {
    console.error('Error in saveRoutines:', err);
    return { success: false, count: 0, error: String(err) };
  }
}

/**
 * Generate confirmation message for saved routines
 */
function generateConfirmationMessage(routines: ParsedRoutine[]): string {
  // Group routines by day pattern
  const grouped: Record<string, ParsedRoutine[]> = {};
  
  for (const r of routines) {
    const key = r.dias_semana.sort().join(',');
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  }
  
  let message = '✅ **Rotina criada com sucesso!**\n\n';
  message += 'Organizei sua agenda da seguinte forma:\n\n';
  
  for (const [daysKey, items] of Object.entries(grouped)) {
    const days = daysKey.split(',');
    let dayLabel = '';
    
    if (days.length === 5 && days.sort().join(',') === 'quarta,quinta,segunda,sexta,terca') {
      dayLabel = 'Segunda a Sexta';
    } else if (days.length === 7) {
      dayLabel = 'Todos os dias';
    } else if (days.length === 4 && days.includes('terca') && !days.includes('segunda')) {
      dayLabel = 'Terça a Sexta';
    } else if (days.length === 1) {
      const dayNames: Record<string, string> = {
        'segunda': 'Segunda-feira',
        'terca': 'Terça-feira',
        'quarta': 'Quarta-feira',
        'quinta': 'Quinta-feira',
        'sexta': 'Sexta-feira',
        'sabado': 'Sábado',
        'domingo': 'Domingo'
      };
      dayLabel = dayNames[days[0]] || days[0];
    } else {
      dayLabel = days.map(d => {
        const names: Record<string, string> = { 'segunda': 'Seg', 'terca': 'Ter', 'quarta': 'Qua', 'quinta': 'Qui', 'sexta': 'Sex', 'sabado': 'Sáb', 'domingo': 'Dom' };
        return names[d] || d;
      }).join(', ');
    }
    
    message += `📅 **${dayLabel}**\n`;
    
    for (const item of items.sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio))) {
      const timeStr = item.horario_fim 
        ? `${item.horario_inicio}–${item.horario_fim}` 
        : item.horario_inicio;
      message += `• ${timeStr} → ${item.atividade}\n`;
    }
    message += '\n';
  }
  
  message += '🔄 Essas rotinas serão repetidas **semanalmente**.\n';
  message += '📊 Acompanhe seu progresso na aba **Desempenho**.';
  
  return message;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history, userMatricula } = await req.json() as {
      message: string;
      history: ChatMessage[];
      userMatricula?: number;
    };

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Create Supabase client
    const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY 
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : null;

    // ========================================
    // STEP 1: Check if message contains routine schedule
    // ========================================
    if (userMatricula && supabase && isRoutineScheduleMessage(message)) {
      console.log('[INOVAPRO AI] Detected routine schedule in message');
      
      const parsedRoutines = parseRoutineSchedule(message);
      console.log(`[INOVAPRO AI] Parsed ${parsedRoutines.length} routines`);
      
      if (parsedRoutines.length > 0) {
        // Save routines to database
        const saveResult = await saveRoutines(supabase, userMatricula, parsedRoutines);
        
        if (saveResult.success) {
          console.log(`[INOVAPRO AI] Saved ${saveResult.count} routines successfully`);
          
          // Generate and return confirmation message
          const confirmationMessage = generateConfirmationMessage(parsedRoutines);
          
          return new Response(JSON.stringify({
            message: confirmationMessage,
            routinesCreated: saveResult.count
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          console.error('[INOVAPRO AI] Failed to save routines:', saveResult.error);
          // Continue to normal AI response if save failed
        }
      }
    }

    // ========================================
    // STEP 2: Normal AI conversation flow
    // ========================================
    
    // Fetch user's agenda and routines for context
    let userContext = '';
    
    if (userMatricula && supabase) {
      const today = new Date().toISOString().split('T')[0];
      const todayName = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][new Date().getDay()];
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];
      
      const [agendaResult, rotinasResult, executionsResult] = await Promise.all([
        supabase
          .from('agenda_items')
          .select('titulo, descricao, data, hora, tipo, concluido')
          .eq('user_matricula', userMatricula)
          .gte('data', today)
          .lte('data', nextWeekStr)
          .order('data', { ascending: true })
          .order('hora', { ascending: true }),
        
        supabase
          .from('rotinas')
          .select('titulo, descricao, hora, hora_fim, dias_semana, categoria, prioridade, ativo')
          .eq('user_matricula', userMatricula)
          .eq('ativo', true),
        
        supabase
          .from('rotina_executions')
          .select('data, scheduled_time, status')
          .eq('user_matricula', userMatricula)
          .eq('data', today)
      ]);

      const agendaItems: AgendaItem[] = agendaResult.data || [];
      const rotinas: Rotina[] = rotinasResult.data || [];
      const executions: RotinaExecution[] = executionsResult.data || [];

      const parts: string[] = [];
      
      if (agendaItems.length > 0) {
        const agendaStr = agendaItems.map(a => 
          `- ${a.data} ${a.hora}: ${a.titulo} (${a.tipo})${a.concluido ? ' ✓' : ''}`
        ).join('\n');
        parts.push(`📅 AGENDA DO USUÁRIO (próximos 7 dias):\n${agendaStr}`);
      }
      
      if (rotinas.length > 0) {
        const rotinasHoje = rotinas.filter(r => r.dias_semana.includes(todayName));
        const rotinasStr = rotinas.map(r => 
          `- ${r.titulo} às ${r.hora}${r.hora_fim ? `-${r.hora_fim}` : ''} | Dias: ${r.dias_semana.join(', ')} | ${r.categoria || 'geral'} | ${r.prioridade || 'média'}`
        ).join('\n');
        parts.push(`🔄 ROTINAS CADASTRADAS (${rotinas.length} ativas, ${rotinasHoje.length} para hoje):\n${rotinasStr}`);
      }
      
      if (executions.length > 0) {
        const execStr = executions.map(e => 
          `- ${e.scheduled_time}: ${e.status}`
        ).join('\n');
        parts.push(`📊 EXECUÇÕES DE HOJE:\n${execStr}`);
      }
      
      if (parts.length > 0) {
        userContext = `\n\n--- DADOS DO USUÁRIO (${today}) ---\n${parts.join('\n\n')}`;
      }
    }

    // Use Groq or OpenRouter
    const useOpenRouter = !GROQ_API_KEY && !!OPENROUTER_API_KEY;

    const config = useOpenRouter ? {
      id: 'openai/gpt-4o-mini',
      apiKey: OPENROUTER_API_KEY,
      url: 'https://openrouter.ai/api/v1/chat/completions'
    } : {
      id: 'llama-3.3-70b-versatile',
      apiKey: GROQ_API_KEY,
      url: 'https://api.groq.com/openai/v1/chat/completions'
    };

    if (!config.apiKey) {
      throw new Error('AI API Key not configured (GROQ_API_KEY or OPENROUTER_API_KEY missing)');
    }

    const systemPrompt = `Você é o INOVAPRO AI, assistente pessoal de rotina e produtividade do app INOVAFINANCE.

PERSONALIDADE:
- Amigável, motivador e empático
- Respostas DIRETAS e OBJETIVAS (máximo 3 parágrafos curtos)
- NUNCA termine com perguntas - apenas informe e pare
- Use emojis com moderação (1-2 por resposta)

ESPECIALIDADES:
1. Organização do Tempo - cronogramas, time blocking, priorização
2. Gestão de Rotinas - rotinas matinais/noturnas, hábitos atômicos
3. Produtividade - Pomodoro, deep work, combate à procrastinação
4. Foco e Disciplina - eliminar distrações, metas SMART
5. Planejamento - revisões semanais, preparação para o dia

CAPACIDADE ESPECIAL - CRIAÇÃO DE ROTINAS:
Quando o usuário enviar mensagens com cronogramas como:
"Segunda-feira:
19h00 - 20h00: tarefa X
20h00 - 21h00: tarefa Y"

Você DEVE:
1. Identificar dias da semana, horários (início/fim) e atividades
2. Interpretar frases como "terça-feira em diante", "de segunda a sexta", "todo dia"
3. Salvar automaticamente as rotinas no sistema
4. Confirmar a criação mostrando a organização por dia

REGRAS DE RESPOSTA:
1. Seja CONCISO - máximo 3-4 frases por tópico
2. Dê dicas PRÁTICAS e APLICÁVEIS imediatamente
3. Prefira listas de 3-5 itens no máximo
4. NUNCA faça perguntas de volta ao usuário
5. Quando o usuário perguntar sobre rotinas/agenda, USE os dados abaixo${userContext}`;

    const recentHistory = (history || []).slice(-10);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...recentHistory.map((msg: ChatMessage) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    console.log(`[INOVAPRO AI] Sending to ${useOpenRouter ? 'OpenRouter' : 'Groq'} with ${messages.length} messages`);

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...(useOpenRouter ? {
          'HTTP-Referer': 'https://inovabank.inovapro.cloud/',
          'X-Title': 'INOVAPRO AI Assistant'
        } : {})
      },
      body: JSON.stringify({
        model: config.id,
        messages: messages,
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[INOVAPRO AI] API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[INOVAPRO AI] Response received');

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from AI');
    }

    const aiMessage = data.choices[0].message.content;

    return new Response(JSON.stringify({
      message: aiMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('[INOVAPRO AI] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
