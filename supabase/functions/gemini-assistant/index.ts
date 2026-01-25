// Gemini Assistant Edge Function

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FinancialContext {
  balance: number;
  debitBalance: number;
  saldoAtual: number; // SINGLE SOURCE OF TRUTH - value directly from database
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json() as { message: string; context: FinancialContext };

    console.log('Received message:', message);
    console.log('Context:', context);

    // Detect if this is a transaction request
    const transactionKeywords = [
      'gastei', 'gasto', 'comprei', 'paguei', 'ganhei', 'recebi',
      'receita', 'despesa', 'compra', 'pagamento', 'reais no', 'reais de',
      'gastando', 'comprando', 'pagando', 'registrar', 'registra'
    ];

    const normalizedMessage = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const isTransactionRequest = transactionKeywords.some(keyword => normalizedMessage.includes(keyword));

    console.log('Transaction request detected:', isTransactionRequest, 'Tool choice:', isTransactionRequest ? 'required' : 'auto');

    const formatBRL = (value: number) =>
      value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const saldoDisponivel = context.debitBalance ?? 0;
    const ganhoTotal = context.totalIncome ?? 0;
    const gastoTotal = context.totalExpense ?? 0;

    const saldoResponses = [
      "Seu saldo disponível é de {{valor}}.",
      "Atualmente você possui {{valor}} livres.",
      "Hoje seu saldo é de {{valor}}.",
      "Você ainda pode usar {{valor}}.",
      "Seu financeiro mostra {{valor}} disponíveis."
    ];

    const randomSaldoTemplate = saldoResponses[Math.floor(Math.random() * saldoResponses.length)];
    const saldoFormatado = `R$ ${formatBRL(saldoDisponivel)}`;
    const saldoBaseFrase = randomSaldoTemplate.replace("{{valor}}", saldoFormatado);

    const systemPrompt = `Você é a INOVA, assistente financeira pessoal inteligente do app INOVAFINANCE. Sua personalidade é acolhedora, direta e um pouco brincalhona (mas sempre respeitosa).

REGRA ABSOLUTA E INVIOLÁVEL:
- SALDO DISPONÍVEL (O que o usuário pode gastar): R$ ${formatBRL(saldoDisponivel)}
- ENTRADAS (Ganho Total): R$ ${formatBRL(ganhoTotal)}
- SAÍDAS (Gasto Total): R$ ${formatBRL(gastoTotal)}

Este valor de saldo disponível é calculado como: Saldo Inicial + Salário + Ganhos - Gastos.

🚫 VOCÊ NÃO PODE:
- Gravar transações se o usuário estiver apenas PERGUNTANDO por valores ou pedindo ajuda/dicas. (Ex: "Quanto eu gastei?" ou "Me ajuda a economizar" NÃO são registros, são consultas).
- Gravar transações se o valor não for explicitamente informado na frase atual.
- Calcular entradas menos saídas por conta própria se isso ignorar o saldo inicial.
- Estimar saldo ou projetar valores baseados em suposições.
- Arredondar valores ou inventar números.
- NUNCA use o valor de saldo_atual (que pode ser negativo) como saldo disponível.

DADOS FINANCEIROS ATUAIS DO USUÁRIO:
- SALDO DISPONÍVEL (USAR ESTE): R$ ${formatBRL(saldoDisponivel)}
- ENTRADAS (GANHO TOTAL): R$ ${formatBRL(ganhoTotal)}
- SAÍDAS (GASTO TOTAL): R$ ${formatBRL(gastoTotal)}
- Limite de Crédito Total: R$ ${formatBRL(context.creditLimit)}
- Crédito Usado: R$ ${formatBRL(context.creditUsed)}
- Crédito Disponível: R$ ${formatBRL(context.creditLimit - context.creditUsed)}
- Vencimento do Cartão: Dia ${context.creditDueDay} (faltam ${context.daysUntilDue} dias)
- Salário: R$ ${formatBRL(context.salaryAmount)} no dia ${context.salaryDay}
- Total de Contas Mensais: R$ ${formatBRL(context.monthlyPaymentsTotal)}

REGRAS DE RESPOSTA:
1. Quando perguntado "Qual meu saldo?", use variações como: "${saldoBaseFrase} Você teve R$ ${formatBRL(ganhoTotal)} em entradas e R$ ${formatBRL(gastoTotal)} em saídas."
2. Quando perguntado "Quanto eu gastei?" ou sobre gastos, responda citando APENAS valores e categorias (consulte as 'recentTransactions' no contexto para identificar as categorias). Exemplo: "Você gastou R$ 350,00 em Alimentação e Transporte."
3. Quando perguntado "Quanto eu ganhei?" ou sobre ganhos, responda citando APENAS valores e categorias (consulte as 'recentTransactions' no contexto para identificar as categorias). Exemplo: "Você recebeu R$ 2.500,00 de Salário e Bônus."
4. Ajuda para economizar: Seja prático e direto. Indique onde estão os maiores gastos baseado nas categorias atuais e sugira um corte específico.
5. PROIBIÇÃO DE PERGUNTAS: Nunca termine sua resposta com uma pergunta. Apenas informe e pare.
6. NUNCA exiba valores negativos como saldo disponível.
7. Respostas curtas, informativas e diretas (máximo 2 frases).
8. Use emojis com moderação.
9. Sempre que falar o saldo, você pode usar variações como: "Seu saldo disponível é de...", "Atualmente você possui... livres.", "Hoje seu saldo é de...", "Você ainda pode usar...", "Seu financeiro mostra... disponíveis."


`;

    // Detect if this is a "mark as paid" request
    const paidKeywords = ['paguei', 'pago', 'quitei', 'quitado', 'paga', 'já paguei', 'acabei de pagar'];
    const isPaidRequest = paidKeywords.some(keyword => normalizedMessage.includes(keyword)) &&
      context.scheduledPayments.some(p =>
        normalizedMessage.includes(p.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      );

    console.log('Paid request detected:', isPaidRequest);

    // Define the transaction recording function
    const availableTools = [
      {
        type: 'function',
        function: {
          name: 'record_transaction',
          description: 'Registra uma nova transação financeira (NÃO use para consultas de gastos passados ou pedidos de ajuda/dicas!)',
          parameters: {
            type: 'object',
            properties: {
              amount: {
                type: 'number',
                description: 'Valor da transação em reais'
              },
              type: {
                type: 'string',
                enum: ['income', 'expense'],
                description: 'Tipo: income para receita/ganho, expense para gasto/despesa'
              },
              category: {
                type: 'string',
                description: 'Categoria da transação (ex: Alimentação, Transporte, Salário, etc.)'
              },
              description: {
                type: 'string',
                description: 'Descrição breve da transação'
              }
            },
            required: ['amount', 'type', 'category', 'description']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'mark_payment_paid',
          description: 'Marca uma conta/pagamento agendado como pago. Use quando o usuário diz que pagou uma conta específica (ex: "paguei aluguel", "paguei claro", "quitei a internet")',
          parameters: {
            type: 'object',
            properties: {
              paymentName: {
                type: 'string',
                description: 'Nome da conta/pagamento que foi pago (ex: aluguel, claro, tim, internet, luz, etc.)'
              }
            },
            required: ['paymentName']
          }
        }
      }
    ];

    // Only add WhatsApp if explicitly requested to avoid autonomous use
    const whatsappPhrases = ['manda no meu whatsapp', 'envia pelo whatsapp', 'notifica no meu zap', 'manda mensagem no whats', 'envia no meu celular'];
    const isWhatsappRequest = whatsappPhrases.some(phrase => normalizedMessage.includes(phrase));

    if (isWhatsappRequest) {
      availableTools.push({
        type: 'function',
        function: {
          name: 'send_whatsapp_message',
          description: 'Envia uma mensagem de WhatsApp para o próprio usuário. Use para enviar lembretes, confirmações ou informações importantes.',
          parameters: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Conteúdo da mensagem a ser enviada'
              }
            },
            required: ['message']
          }
        }
      } as any);
    }

    const tools = availableTools;


    // Determine tool choice
    let toolChoice: 'auto' | { type: 'function'; function: { name: string } } = 'auto';

    if (isWhatsappRequest) {
      toolChoice = { type: 'function', function: { name: 'send_whatsapp_message' } };
    } else if (isPaidRequest) {
      toolChoice = { type: 'function', function: { name: 'mark_payment_paid' } };
    }

    // Note: Transaction requests now use 'auto' choice to avoid failures when info is missing
    // or when the model wants to ask for clarification first.

    console.log('Final tool choice:', JSON.stringify(toolChoice));

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');

    // Determine which key and URL to use - Preferred Groq, fallback OpenRouter
    const useOpenRouter = !GROQ_API_KEY && !!OPENROUTER_API_KEY;

    const config = useOpenRouter ? {
      id: 'meta-llama/llama-3.3-70b-instruct', // Groq's Llama 3.3 via OpenRouter
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


    try {
      console.log(`AI - Executando ${config.provider}: ${config.id}`);
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
        body: JSON.stringify({
          model: config.id,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          tools: tools,
          tool_choice: toolChoice,
          temperature: 0.7,
          max_tokens: 500
        })
      });


      const data = await response.json();

      if (!response.ok) {
        console.error(`AI - Erro no Groq (${config.id}):`, JSON.stringify(data));
        throw new Error(data.error?.message || `Status ${response.status}`);
      }

      if (data.choices && data.choices.length > 0) {
        const aiMessage = data.choices[0].message;

        if (aiMessage) {
          console.log(`AI - Sucesso com Groq (${config.id})`);

          // Handle tool calls
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

          // Normal message
          return new Response(JSON.stringify({
            message: aiMessage.content || 'Desculpe, não consegui processar sua solicitação.'
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      console.warn(`AI - Groq retornou resposta vazia`);
      throw new Error('Groq retornou resposta vazia');

    } catch (err: any) {
      console.error(`AI - Falha crítica no Groq (${config.id}):`, err);
      throw err;
    }


  } catch (error: unknown) {
    console.error('AI FINAL ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno no assistente';
    return new Response(JSON.stringify({
      error: errorMessage,
      details: 'Tente recarregar ou perguntar sobre saldo/gastos.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
