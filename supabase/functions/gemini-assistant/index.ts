// Gemini Assistant Edge Function - INOVAFINANCE AI

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FinancialContext {
  balance: number;
  debitBalance: number;
  saldoAtual: number;
  totalIncome: number;
  totalExpense: number;
  creditLimit: number;
  creditUsed: number;
  creditDueDay: number;
  daysUntilDue: number;
  salaryAmount: number;
  salaryDay: number;
  monthlyPaymentsTotal: number;
  projectedBalance: number;
  todayExpenses: number;
  todayIncome: number;
  scheduledPayments: Array<{
    name: string;
    amount: number;
    dueDay: number;
    category: string;
  }>;
  recentTransactions: Array<{
    amount: number;
    type: string;
    category: string;
    description: string;
    date: string;
  }>;
}

// ============================================================
// INTENT DETECTION - CRITICAL LOGIC
// ============================================================

interface IntentResult {
  intent: 'transaction' | 'analysis' | 'schedule' | 'mark_paid' | 'whatsapp';
  confidence: number;
  extractedAmount?: number;
  transactionType?: 'income' | 'expense';
}

function detectIntent(message: string): IntentResult {
  const normalized = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  
  // Rule 1: Messages with "?" are ALWAYS analysis (queries)
  if (message.includes('?')) {
    return { intent: 'analysis', confidence: 1.0 };
  }
  
  // Rule 2: Analysis keywords - NEVER open popout for these
  const analysisKeywords = [
    'quanto', 'qual', 'saldo', 'posso gastar', 'me ajuda', 'economizar',
    'analisar', 'analise', 'relatorio', 'resumo', 'situacao', 'sobrou',
    'como esta', 'como estou', 'dica', 'ajuda', 'sugestao', 'conselho',
    'previsao', 'projecao', 'tendencia', 'historico', 'media',
    'comparar', 'comparacao', 'diferenca', 'evolucao', 'progresso',
    'meu dinheiro', 'minhas financas', 'minha conta', 'meu extrato',
    'quanto tenho', 'quanto eu tenho', 'quanto gastei', 'quanto ganhei',
    'quanto sobrou', 'quanto falta', 'quanto posso', 'quanto devo',
    'o que', 'quando', 'onde', 'por que', 'porque', 'como',
    'explica', 'explique', 'detalha', 'mostra', 'mostre', 'lista', 'liste'
  ];
  
  const hasAnalysisKeyword = analysisKeywords.some(kw => normalized.includes(kw));
  
  // Rule 3: Transaction REGISTRATION keywords (past tense = already happened)
  const expenseRegistrationKeywords = [
    'gastei', 'paguei', 'comprei', 'saiu', 'perdi', 'usei',
    'vou gastar', 'vou pagar', 'vou comprar', 'gastarei', 'pagarei'
  ];
  
  const incomeRegistrationKeywords = [
    'ganhei', 'recebi', 'entrou', 'depositei', 'depositaram',
    'vou ganhar', 'vou receber', 'ganharei', 'receberei'
  ];
  
  const hasExpenseKeyword = expenseRegistrationKeywords.some(kw => normalized.includes(kw));
  const hasIncomeKeyword = incomeRegistrationKeywords.some(kw => normalized.includes(kw));
  const hasTransactionKeyword = hasExpenseKeyword || hasIncomeKeyword;
  
  // Rule 4: Extract amount from message
  const amountPatterns = [
    /(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real|r\$)/i,
    /r\$\s*(\d+(?:[.,]\d{1,2})?)/i,
    /(\d+(?:[.,]\d{1,2})?)\s*(?:no|de|em|pra|para)\s/i,
    /(?:gastei|paguei|comprei|ganhei|recebi)\s+(\d+(?:[.,]\d{1,2})?)/i
  ];
  
  let extractedAmount: number | undefined;
  for (const pattern of amountPatterns) {
    const match = message.match(pattern);
    if (match) {
      extractedAmount = parseFloat(match[1].replace(',', '.'));
      break;
    }
  }
  
  // Rule 5: Schedule payment detection
  const scheduleKeywords = ['agendar', 'agenda', 'lembrete', 'lembre', 'dia \\d{1,2}', 'todo mes', 'todo dia'];
  const isSchedule = scheduleKeywords.some(kw => new RegExp(kw).test(normalized));
  if (isSchedule && extractedAmount) {
    return { intent: 'schedule', confidence: 0.9, extractedAmount };
  }
  
  // Rule 6: Mark as paid detection
  const paidKeywords = ['ja paguei', 'paguei a conta', 'quitei', 'pago'];
  const isPaid = paidKeywords.some(kw => normalized.includes(kw));
  if (isPaid) {
    return { intent: 'mark_paid', confidence: 0.9 };
  }
  
  // Rule 7: WhatsApp request
  const whatsappKeywords = ['whatsapp', 'whats', 'zap', 'manda no meu'];
  const isWhatsapp = whatsappKeywords.some(kw => normalized.includes(kw));
  if (isWhatsapp) {
    return { intent: 'whatsapp', confidence: 0.9 };
  }
  
  // DECISION LOGIC:
  // If has analysis keyword -> ANALYSIS (never popout)
  // If has transaction keyword + amount -> TRANSACTION (open popout)
  // If has transaction keyword but NO amount -> ANALYSIS (just asking)
  
  if (hasAnalysisKeyword) {
    return { intent: 'analysis', confidence: 0.95 };
  }
  
  if (hasTransactionKeyword && extractedAmount && extractedAmount > 0) {
    return {
      intent: 'transaction',
      confidence: 0.9,
      extractedAmount,
      transactionType: hasExpenseKeyword ? 'expense' : 'income'
    };
  }
  
  // Default: analysis (safe, no popout)
  return { intent: 'analysis', confidence: 0.7 };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json() as { message: string; context: FinancialContext };

    console.log('Received message:', message);
    
    // Detect intent using improved logic
    const intentResult = detectIntent(message);
    console.log('Intent detected:', JSON.stringify(intentResult));

    const formatBRL = (value: number) =>
      value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Use debitBalance as the REAL available balance
    const saldoDisponivel = Math.max(0, context.debitBalance ?? 0);
    const ganhoTotal = context.totalIncome ?? 0;
    const gastoTotal = context.totalExpense ?? 0;

    // Build system prompt focused on ANALYSIS (objective responses)
    const systemPrompt = `Você é a INOVA, assistente financeira pessoal do app INOVAFINANCE.

DADOS FINANCEIROS DO USUÁRIO:
- SALDO DISPONÍVEL: R$ ${formatBRL(saldoDisponivel)}
- TOTAL GANHO: R$ ${formatBRL(ganhoTotal)}
- TOTAL GASTO: R$ ${formatBRL(gastoTotal)}
- Limite de Crédito: R$ ${formatBRL(context.creditLimit)}
- Crédito Usado: R$ ${formatBRL(context.creditUsed)}
- Crédito Disponível: R$ ${formatBRL(context.creditLimit - context.creditUsed)}
- Salário: R$ ${formatBRL(context.salaryAmount)} dia ${context.salaryDay}
- Gastos hoje: R$ ${formatBRL(context.todayExpenses)}
- Ganhos hoje: R$ ${formatBRL(context.todayIncome)}

TRANSAÇÕES RECENTES:
${context.recentTransactions.slice(0, 5).map(t => 
  `- ${t.type === 'expense' ? 'Gasto' : 'Ganho'}: R$ ${formatBRL(t.amount)} em ${t.category} (${t.description}) - ${t.date}`
).join('\n')}

CONTAS AGENDADAS:
${context.scheduledPayments.slice(0, 5).map(p => 
  `- ${p.name}: R$ ${formatBRL(p.amount)} dia ${p.dueDay}`
).join('\n')}

REGRAS ABSOLUTAS:
1. Responda de forma OBJETIVA e DIRETA (máximo 2-3 frases)
2. NUNCA faça perguntas ao usuário - apenas informe e pare
3. Cite valores exatos baseados nos dados acima
4. Se for pergunta sobre saldo: informe o saldo disponível claramente
5. Se for pergunta sobre gastos/ganhos: liste valores e categorias
6. Se pedido de dica/ajuda: dê 1-2 sugestões práticas baseadas nos gastos reais
7. Use variações naturais nas respostas
8. NUNCA mostre valores negativos como saldo

FORMATO DE RESPOSTA:
- Seja conciso e informativo
- Use emojis com moderação (1-2 no máximo)
- Não termine com perguntas
- Não peça confirmação
- Apenas analise e informe`;

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');

    const useOpenRouter = !GROQ_API_KEY && !!OPENROUTER_API_KEY;

    const config = useOpenRouter ? {
      id: 'meta-llama/llama-3.3-70b-instruct',
      provider: 'openrouter',
      apiKey: OPENROUTER_API_KEY,
      url: 'https://openrouter.ai/api/v1/chat/completions'
    } : {
      id: 'llama-3.3-70b-versatile',
      provider: 'groq',
      apiKey: GROQ_API_KEY,
      url: 'https://api.groq.com/openai/v1/chat/completions'
    };

    if (!config.apiKey) {
      throw new Error('AI API Key not configured (GROQ_API_KEY or OPENROUTER_API_KEY missing)');
    }

    // Build tools array based on intent
    const tools: any[] = [];
    let toolChoice: 'auto' | 'none' | { type: 'function'; function: { name: string } } = 'none';

    // ONLY add transaction tool if intent is transaction with valid amount
    if (intentResult.intent === 'transaction' && intentResult.extractedAmount) {
      tools.push({
        type: 'function',
        function: {
          name: 'record_transaction',
          description: 'Registra uma transação financeira do usuário',
          parameters: {
            type: 'object',
            properties: {
              amount: { type: 'number', description: 'Valor em reais' },
              type: { type: 'string', enum: ['income', 'expense'], description: 'Tipo da transação' },
              category: { type: 'string', description: 'Categoria (ex: Alimentação, Transporte, Salário)' },
              description: { type: 'string', description: 'Descrição breve' }
            },
            required: ['amount', 'type', 'category', 'description']
          }
        }
      });
      toolChoice = { type: 'function', function: { name: 'record_transaction' } };
    }

    // Add mark_paid tool if intent matches
    if (intentResult.intent === 'mark_paid') {
      tools.push({
        type: 'function',
        function: {
          name: 'mark_payment_paid',
          description: 'Marca uma conta agendada como paga',
          parameters: {
            type: 'object',
            properties: {
              paymentName: { type: 'string', description: 'Nome da conta paga' }
            },
            required: ['paymentName']
          }
        }
      });
      toolChoice = { type: 'function', function: { name: 'mark_payment_paid' } };
    }

    // Add WhatsApp tool if requested
    if (intentResult.intent === 'whatsapp') {
      tools.push({
        type: 'function',
        function: {
          name: 'send_whatsapp_message',
          description: 'Envia mensagem WhatsApp ao usuário',
          parameters: {
            type: 'object',
            properties: {
              message: { type: 'string', description: 'Conteúdo da mensagem' }
            },
            required: ['message']
          }
        }
      });
      toolChoice = { type: 'function', function: { name: 'send_whatsapp_message' } };
    }

    console.log(`AI - Intent: ${intentResult.intent}, Tool choice: ${JSON.stringify(toolChoice)}`);

    const requestBody: any = {
      model: config.id,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    };

    // Only add tools if we have any
    if (tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = toolChoice;
    }

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...(config.provider === 'openrouter' ? {
          'HTTP-Referer': 'https://inovabank.inovapro.cloud/',
          'X-Title': 'INOVA Assistant'
        } : {})
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`AI Error (${config.id}):`, JSON.stringify(data));
      throw new Error(data.error?.message || `Status ${response.status}`);
    }

    if (data.choices && data.choices.length > 0) {
      const aiMessage = data.choices[0].message;

      if (aiMessage) {
        console.log(`AI Success - ${config.provider}`);

        // Handle tool calls (only if intent was transaction/mark_paid/whatsapp)
        if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
          const toolCall = aiMessage.tool_calls[0];
          return new Response(JSON.stringify({
            message: aiMessage.content || 'Registrando...',
            functionCall: {
              name: toolCall.function.name,
              args: JSON.parse(toolCall.function.arguments)
            }
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Normal analysis response - no popout
        return new Response(JSON.stringify({
          message: aiMessage.content || 'Desculpe, não consegui processar.'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    throw new Error('Resposta vazia da IA');

  } catch (error: unknown) {
    console.error('AI FINAL ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(JSON.stringify({
      error: errorMessage,
      details: 'Tente novamente em instantes.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
