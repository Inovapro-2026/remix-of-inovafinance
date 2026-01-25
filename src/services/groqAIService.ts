// Direct Groq AI Integration Service
// Bypasses Supabase Edge Functions for better reliability

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface GroqChatResponse {
    message: string;
    error?: string;
}

/**
 * Send a message to Groq AI directly
 */
export async function sendGroqMessage(
    message: string,
    history: ChatMessage[] = []
): Promise<GroqChatResponse> {
    try {
        if (!GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY not configured. Please add VITE_GROQ_API_KEY to your .env file.');
        }

        const systemPrompt: ChatMessage = {
            role: 'system',
            content: `Você é um assistente pessoal de rotina e produtividade chamado INOVA.
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
5. Pergunte antes de assumir o contexto do usuário`
        };

        const messages: ChatMessage[] = [
            systemPrompt,
            ...history,
            { role: 'user', content: message }
        ];

        console.log('[Groq AI] Sending request with', messages.length, 'messages');

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000,
                top_p: 1,
                stream: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Groq AI] API Error:', response.status, errorText);
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.choices || data.choices.length === 0) {
            throw new Error('No response from Groq AI');
        }

        const aiMessage = data.choices[0].message.content;
        console.log('[Groq AI] Response received successfully');

        return {
            message: aiMessage
        };

    } catch (error) {
        console.error('[Groq AI] Error:', error);
        return {
            message: '',
            error: error instanceof Error ? error.message : 'Erro desconhecido ao conectar com Groq AI'
        };
    }
}

/**
 * Check if Groq API key is configured
 */
export function isGroqConfigured(): boolean {
    return !!GROQ_API_KEY && GROQ_API_KEY.length > 0;
}
