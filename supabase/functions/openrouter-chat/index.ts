import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UserRoutineContext {
  agendaItems?: Array<{
    titulo: string;
    data: string;
    hora: string;
    tipo: string;
    concluido: boolean;
  }>;
  rotinas?: Array<{
    titulo: string;
    hora: string;
    hora_fim?: string;
    dias_semana: string[];
    categoria?: string;
    prioridade?: string;
  }>;
  executions?: Array<{
    scheduled_time: string;
    status: string;
  }>;
}

function buildUserContext(context?: UserRoutineContext): string {
  if (!context) return '';

  const parts: string[] = [];
  const today = new Date().toISOString().split('T')[0];
  const todayName = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][new Date().getDay()];

  if (context.agendaItems && context.agendaItems.length > 0) {
    const agendaStr = context.agendaItems.map(a => 
      `- ${a.data} ${a.hora}: ${a.titulo} (${a.tipo})${a.concluido ? ' ✓' : ''}`
    ).join('\n');
    parts.push(`📅 AGENDA DO USUÁRIO (próximos 7 dias):\n${agendaStr}`);
  } else {
    parts.push(`📅 AGENDA DO USUÁRIO: Nenhum compromisso agendado para os próximos 7 dias.`);
  }

  if (context.rotinas && context.rotinas.length > 0) {
    const rotinasHoje = context.rotinas.filter(r => r.dias_semana.includes(todayName));
    const rotinasStr = context.rotinas.map(r => 
      `- ${r.titulo} às ${r.hora}${r.hora_fim ? `-${r.hora_fim}` : ''} | Dias: ${r.dias_semana.join(', ')} | ${r.categoria || 'geral'} | ${r.prioridade || 'média'}`
    ).join('\n');
    parts.push(`🔄 ROTINAS CADASTRADAS (${context.rotinas.length} ativas, ${rotinasHoje.length} para hoje):\n${rotinasStr}`);
  } else {
    parts.push(`🔄 ROTINAS CADASTRADAS: O usuário ainda não cadastrou nenhuma rotina no app.`);
  }

  if (context.executions && context.executions.length > 0) {
    const execStr = context.executions.map(e => 
      `- ${e.scheduled_time}: ${e.status}`
    ).join('\n');
    parts.push(`📊 EXECUÇÕES DE HOJE:\n${execStr}`);
  } else {
    parts.push(`📊 EXECUÇÕES DE HOJE: Nenhuma execução registrada.`);
  }

  return `\n\n--- DADOS REAIS DO USUÁRIO (${today}) ---\n${parts.join('\n\n')}\n\nIMPORTANTE: Use APENAS os dados acima para responder sobre a rotina do usuário. Se não houver dados, sugira que o usuário cadastre suas rotinas e agenda no app.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const { message, history, userMatricula } = await req.json();

    if (!message || !userMatricula) {
      throw new Error('Message and userMatricula are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user's REAL data from database
    const today = new Date().toISOString().split('T')[0];
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

    console.log(`[OpenRouter] User ${userMatricula} - Agenda: ${agendaResult.data?.length || 0}, Rotinas: ${rotinasResult.data?.length || 0}, Execuções: ${executionsResult.data?.length || 0}`);

    const userContext: UserRoutineContext = {
      agendaItems: agendaResult.data?.map(a => ({
        titulo: a.titulo,
        data: a.data,
        hora: a.hora,
        tipo: a.tipo,
        concluido: a.concluido || false
      })) || [],
      rotinas: rotinasResult.data?.map(r => ({
        titulo: r.titulo,
        hora: r.hora,
        hora_fim: r.hora_fim || undefined,
        dias_semana: r.dias_semana,
        categoria: r.categoria || undefined,
        prioridade: r.prioridade || undefined
      })) || [],
      executions: executionsResult.data?.map(e => ({
        scheduled_time: e.scheduled_time,
        status: e.status
      })) || []
    };

    const contextStr = buildUserContext(userContext);

    const systemPrompt: ChatMessage = {
      role: 'system',
      content: `Você é o INOVAPRO AI, assistente pessoal de rotina e produtividade do app INOVAFINANCE.

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

REGRAS CRÍTICAS:
1. Use APENAS os dados reais fornecidos abaixo para falar sobre rotinas/agenda do usuário
2. Se não houver dados cadastrados, NÃO INVENTE rotinas ou compromissos
3. Sugira que o usuário cadastre suas rotinas na aba "Rotinas" e compromissos na aba "Agenda"
4. Seja CONCISO - máximo 3-4 frases por tópico
5. Dê dicas PRÁTICAS e APLICÁVEIS imediatamente
6. NUNCA faça perguntas de volta ao usuário
7. Não peça confirmação ou feedback${contextStr}`
    };

    const messages: ChatMessage[] = [
      systemPrompt,
      ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    console.log('[OpenRouter] Sending request with', messages.length, 'messages');

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://inovafinance.lovable.app',
        'X-Title': 'INOVAPRO AI'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OpenRouter] API Error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenRouter');
    }

    const aiMessage = data.choices[0].message.content;
    console.log('[OpenRouter] Response received successfully');

    return new Response(JSON.stringify({ message: aiMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[OpenRouter] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
