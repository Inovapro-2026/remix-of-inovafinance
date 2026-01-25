// Routine AI Chat Edge Function - Personal productivity assistant (INOVA AI)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history } = await req.json() as {
      message: string;
      history: ChatMessage[];
    };

    console.log('Received message:', message);
    console.log('History length:', history?.length || 0);

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');

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

    // Build the system prompt for productivity assistant
    const systemPrompt = `Você é o INOVA, assistente pessoal de rotina e produtividade do app INOVAFINANCE.

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

REGRAS DE RESPOSTA:
1. Seja CONCISO - máximo 3-4 frases por tópico
2. Dê dicas PRÁTICAS e APLICÁVEIS imediatamente
3. Prefira listas de 3-5 itens no máximo
4. NUNCA faça perguntas de volta ao usuário
5. Não peça confirmação ou feedback
6. Apenas informe, sugira e encerre

FORMATO:
- Respostas curtas e práticas
- Use listas quando apropriado
- Emojis moderados (máx 2)
- Sem frases de encerramento como "Posso ajudar com algo mais?"`;

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

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...(useOpenRouter ? {
          'HTTP-Referer': 'https://inovabank.inovapro.cloud/',
          'X-Title': 'INOVA Routine Assistant'
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
    console.log('AI response received');

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
