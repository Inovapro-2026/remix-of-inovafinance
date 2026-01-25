// Routine AI Chat Edge Function - INOVAPRO AI (Personal productivity assistant with agenda/routine access)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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
  rotina_titulo?: string;
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

    // Fetch user's agenda and routines if matricula provided
    let userContext = '';
    
    if (userMatricula && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const today = new Date().toISOString().split('T')[0];
      const todayName = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][new Date().getDay()];
      
      // Fetch agenda items (today and upcoming 7 days)
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
          .select('data, scheduled_time, status, rotina_id')
          .eq('user_matricula', userMatricula)
          .eq('data', today)
      ]);

      const agendaItems: AgendaItem[] = agendaResult.data || [];
      const rotinas: Rotina[] = rotinasResult.data || [];
      const executions: RotinaExecution[] = executionsResult.data || [];

      // Build context string
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

    // Use Groq direct or via OpenRouter
    const useOpenRouter = !GROQ_API_KEY && !!OPENROUTER_API_KEY;

    const config = useOpenRouter ? {
      id: 'meta-llama/llama-3.3-70b-instruct',
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

    // Build the system prompt for productivity assistant with user data context
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

ACESSO AOS DADOS:
- Você tem acesso à agenda e rotinas do usuário
- Use esses dados para dar sugestões PERSONALIZADAS
- Cite compromissos e rotinas específicas quando relevante
- Ajude a otimizar a agenda baseado nas rotinas cadastradas

REGRAS DE RESPOSTA:
1. Seja CONCISO - máximo 3-4 frases por tópico
2. Dê dicas PRÁTICAS e APLICÁVEIS imediatamente
3. Prefira listas de 3-5 itens no máximo
4. NUNCA faça perguntas de volta ao usuário
5. Não peça confirmação ou feedback
6. Apenas informe, sugira e encerre
7. Quando o usuário perguntar sobre rotinas/agenda, USE os dados abaixo

FORMATO:
- Respostas curtas e práticas
- Use listas quando apropriado
- Emojis moderados (máx 2)
- Sem frases de encerramento como "Posso ajudar com algo mais?"${userContext}`;

    // Build messages array with history (limit to last 10 messages for context)
    const recentHistory = (history || []).slice(-10);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...recentHistory.map((msg: ChatMessage) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    console.log(`Sending to ${useOpenRouter ? 'OpenRouter' : 'Groq'} with ${messages.length} messages`);
    console.log('User context included:', userContext ? 'yes' : 'no');

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
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('INOVAPRO AI response received');

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
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
