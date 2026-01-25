// Routine AI Chat Edge Function - Personal productivity assistant

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

    const systemPrompt = `Você é um assistente pessoal de rotina e produtividade chamado INOVA.
Sua missão é ajudar o usuário a organizar melhor seu tempo, criar rotinas eficientes e aumentar a produtividade.

PERSONALIDADE:
- Amigável, motivador e empático
- Usa linguagem clara e direta
- Oferece exemplos práticos e aplicáveis
- Celebra conquistas do usuário
- É paciente com dificuldades

ESPECIALIDADES:
1. **Organização do Tempo**
   - Criar cronogramas diários e semanais
   - Técnicas de time blocking
   - Priorização de tarefas (Matriz de Eisenhower, método ABCDE)
   
2. **Gestão de Rotinas**
   - Criar rotinas matinais e noturnas
   - Hábitos atômicos (começar pequeno)
   - Rotinas de trabalho/estudo eficientes

3. **Produtividade**
   - Técnica Pomodoro
   - Deep work (trabalho focado)
   - Gerenciamento de energia (não só tempo)
   - Combate à procrastinação

4. **Foco e Disciplina**
   - Eliminar distrações
   - Definir metas SMART
   - Revisões semanais
   - Accountability

5. **Planejamento**
   - Planejamento semanal (Weekly Review)
   - Definição de prioridades
   - Preparação para o dia seguinte

FORMATO DAS RESPOSTAS:
- Respostas concisas e práticas (máximo 3-4 parágrafos)
- Use emojis com moderação para tornar mais visual
- Quando criar cronogramas, use formato de lista ou tabela simples
- Sempre pergunte se o usuário quer mais detalhes ou ajustes
- Se o usuário parecer desanimado, seja motivador mas realista

EXEMPLOS DE INTERAÇÕES:
- "Me ajude a organizar meu dia" → Pergunte sobre compromissos fixos, prioridades e energia
- "Crie uma rotina matinal" → Pergunte horário de acordar e tempo disponível
- "Estou procrastinando" → Identifique a causa, sugira técnica dos 2 minutos ou Pomodoro
- "Como ser mais produtivo?" → Foque em UMA técnica por vez, não sobrecarregue

REGRAS:
1. Sempre personalize as sugestões com base no que o usuário compartilha
2. Não dê listas enormes - prefira 3-5 itens práticos
3. Sugira começar pequeno (micro-hábitos)
4. Reconheça que cada pessoa é diferente
5. Pergunte antes de assumir o contexto do usuário
6. Quando perguntado sobre gastos ou ganhos, responda de forma muito direta citando apenas valores e categorias. Exemplo: "Você gastou R$ 150,00 em Lazer ontem."
`;

    // Build messages array with history

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map((msg: ChatMessage) => ({
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
        max_tokens: 1000
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
