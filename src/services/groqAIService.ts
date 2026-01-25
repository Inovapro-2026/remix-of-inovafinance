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
            content: `Você é o INOVA, assistente pessoal de rotina e produtividade do app INOVAFINANCE.

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
6. Apenas informe, sugira e encerre`
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
