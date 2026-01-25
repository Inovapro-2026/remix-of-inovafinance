// Direct Groq AI Integration Service - INOVAPRO AI
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

export interface UserRoutineContext {
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

/**
 * Build user context string from their agenda and routines
 */
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
    }

    if (context.rotinas && context.rotinas.length > 0) {
        const rotinasHoje = context.rotinas.filter(r => r.dias_semana.includes(todayName));
        const rotinasStr = context.rotinas.map(r => 
            `- ${r.titulo} às ${r.hora}${r.hora_fim ? `-${r.hora_fim}` : ''} | Dias: ${r.dias_semana.join(', ')} | ${r.categoria || 'geral'} | ${r.prioridade || 'média'}`
        ).join('\n');
        parts.push(`🔄 ROTINAS CADASTRADAS (${context.rotinas.length} ativas, ${rotinasHoje.length} para hoje):\n${rotinasStr}`);
    }

    if (context.executions && context.executions.length > 0) {
        const execStr = context.executions.map(e => 
            `- ${e.scheduled_time}: ${e.status}`
        ).join('\n');
        parts.push(`📊 EXECUÇÕES DE HOJE:\n${execStr}`);
    }

    if (parts.length > 0) {
        return `\n\n--- DADOS DO USUÁRIO (${today}) ---\n${parts.join('\n\n')}`;
    }

    return '';
}

/**
 * Send a message to Groq AI directly with optional user context
 */
export async function sendGroqMessage(
    message: string,
    history: ChatMessage[] = [],
    userContext?: UserRoutineContext
): Promise<GroqChatResponse> {
    try {
        if (!GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY not configured. Please add VITE_GROQ_API_KEY to your .env file.');
        }

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
7. Quando o usuário perguntar sobre rotinas/agenda, USE os dados abaixo${contextStr}`
        };

        const messages: ChatMessage[] = [
            systemPrompt,
            ...history,
            { role: 'user', content: message }
        ];

        console.log('[INOVAPRO AI] Sending request with', messages.length, 'messages');
        console.log('[INOVAPRO AI] User context included:', contextStr ? 'yes' : 'no');

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
            console.error('[INOVAPRO AI] API Error:', response.status, errorText);
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.choices || data.choices.length === 0) {
            throw new Error('No response from INOVAPRO AI');
        }

        const aiMessage = data.choices[0].message.content;
        console.log('[INOVAPRO AI] Response received successfully');

        return {
            message: aiMessage
        };

    } catch (error) {
        console.error('[INOVAPRO AI] Error:', error);
        return {
            message: '',
            error: error instanceof Error ? error.message : 'Erro desconhecido ao conectar com INOVAPRO AI'
        };
    }
}

/**
 * Check if Groq API key is configured
 */
export function isGroqConfigured(): boolean {
    return !!GROQ_API_KEY && GROQ_API_KEY.length > 0;
}
