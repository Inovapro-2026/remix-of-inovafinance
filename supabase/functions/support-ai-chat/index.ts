import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

// Comprehensive knowledge base about INOVAFINANCE
const INOVAFINANCE_KNOWLEDGE = `
# INOVAFINANCE - Base de Conhecimento Completa

## 📱 SOBRE O APP
INOVAFINANCE é um aplicativo completo de gestão financeira pessoal e produtividade.

### MODOS DO APP:
1. **Modo Finanças** - Gestão financeira pessoal
2. **Modo Rotinas** - Gestão de produtividade e rotinas

## 💰 FUNCIONALIDADES DO MODO FINANÇAS

### Dashboard (Tela Inicial)
- Saldo disponível (débito) - clicável para editar
- Entradas totais do período
- Saídas totais do período
- Gráfico de evolução do saldo (últimos 7 dias)
- Gráfico de categorias de gastos (pizza)
- Insights de IA sobre finanças
- Últimas transações

### Cartão de Crédito
- Visualização do limite total e disponível
- Fatura atual e próxima
- Histórico de gastos no crédito
- Dia de vencimento configurável
- Parcelamentos ativos

### Transações
- Registrar entradas (receitas)
- Registrar saídas (despesas)
- Categorias personalizáveis
- Método de pagamento (débito/crédito)
- Histórico completo de transações
- Filtros por período e categoria

### Planejamento Financeiro
- Contas programadas (mensais e pontuais)
- Metas financeiras com progresso
- Planejamento de gastos
- Alertas de vencimento

### Perfil do Usuário
- Dados pessoais (nome, CPF, telefone, email)
- Configurações de salário e data de pagamento
- Adiantamento configurável
- Saldo inicial
- Limite de crédito e dia de vencimento
- Alternar entre modos (Finanças/Rotinas)
- Configurações de voz da assistente

## ⏰ FUNCIONALIDADES DO MODO ROTINAS

### Agenda
- Compromissos e eventos
- Lembretes personalizados
- Visualização por dia/semana/mês
- Notificações configuráveis

### Rotinas
- Criar rotinas recorrentes
- Definir dias da semana
- Horário de início e fim
- Categorias (trabalho, pessoal, saúde, etc.)
- Prioridade (alta, média, baixa)
- Marcar como concluída

### Rotina Inteligente (Chat IA)
- Assistente de produtividade com IA
- Análise das suas rotinas cadastradas
- Dicas personalizadas baseadas nos seus dados
- Gráficos de produtividade
- Taxa de conclusão de rotinas

### Análise de Produtividade
- Gráficos de desempenho
- Melhores e piores horários
- Streak de dias produtivos
- Horas planejadas vs concluídas

## 💳 PLANOS E ASSINATURA

### Teste Grátis
- Duração: 72 horas (3 dias)
- Acesso completo a todas as funcionalidades
- Após expirar: conta bloqueada até assinar

### Plano Mensal
- Primeiro mês: R$ 29,90
- Renovação: R$ 49,90/mês
- Acesso ilimitado
- Suporte prioritário

### Programa de Afiliados
- Ganhe comissões indicando novos usuários
- Comissão por cada assinatura ativa
- Painel exclusivo de afiliados
- Saques via PIX

## 🔧 FUNCIONALIDADES TÉCNICAS

### Assistente de Voz (INOVA)
- Saudações personalizadas
- Leitura de saldo e informações
- Pode ser ativada/desativada nas configurações
- Voz nativa do sistema (mais rápida)

### Sincronização
- Dados salvos em nuvem
- Sincronização automática
- Funciona offline (dados locais)

### Segurança
- Login seguro com email/senha
- Sessões monitoradas
- Logs de segurança

## ❓ PERGUNTAS FREQUENTES

### "Como adicionar uma transação?"
Na tela inicial, toque em "+" ou vá em Transações. Escolha entrada ou saída, preencha valor, categoria e descrição.

### "Como editar meu saldo?"
Na tela inicial, toque no card de Saldo Disponível. Um modal abrirá para editar o valor.

### "Como funciona o cartão de crédito?"
Vá na aba Cartão. Lá você verá seu limite, fatura atual e pode registrar gastos no crédito. O dia de vencimento é configurável no Perfil.

### "Como criar uma rotina?"
No modo Rotinas, vá em Rotinas > botão "+". Preencha título, horário, dias da semana e categoria.

### "Como cancelar minha assinatura?"
Entre em contato com o suporte. Não há renovação automática - você paga manualmente cada mês.

### "Esqueci minha senha"
Na tela de login, clique em "Esqueci minha senha" e siga as instruções enviadas por email.

### "O app não está abrindo"
Tente limpar o cache do navegador ou reinstalar. Se persistir, contate o suporte.

### "Como funciona o programa de afiliados?"
Na tela de login de afiliados (/affiliates), você pode se cadastrar. Após aprovação, recebe um link único para compartilhar.

### "Quando recebo minha comissão?"
As comissões são liberadas após 30 dias da assinatura do indicado (período de carência).

### "Como solicitar saque?"
No painel de afiliados, vá em Saques. Informe o valor e sua chave PIX. O saque é processado em até 5 dias úteis.

## 🆘 SUPORTE

### Canais de Atendimento
- Chat com IA (24h) - estamos aqui!
- Atendimento humano - clique em "Falar com Atendente"
- WhatsApp: (11) 97819-7645

### Horário de Atendimento Humano
Segunda a Sexta: 9h às 18h
Sábados: 9h às 13h

## 📋 REGRAS IMPORTANTES

1. Uma conta por CPF
2. Dados financeiros são privados e criptografados
3. Não compartilhamos informações com terceiros
4. O período de teste é único (não pode ser renovado)
5. Comissões de afiliados têm carência de 30 dias
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const { message, history } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    const systemPrompt: ChatMessage = {
      role: 'system',
      content: `Você é a assistente virtual de suporte do INOVAFINANCE. Seu nome é INOVA.

PERSONALIDADE:
- Amigável, prestativa e profissional
- Respostas claras e objetivas (máximo 3-4 parágrafos)
- Use emojis com moderação (1-2 por resposta)
- Sempre em português brasileiro

COMPORTAMENTO:
1. Responda APENAS sobre o INOVAFINANCE usando a base de conhecimento abaixo
2. Se não souber a resposta, seja honesta e sugira falar com atendimento humano
3. NUNCA invente funcionalidades que não existem
4. Para problemas técnicos específicos, sugira atendimento humano
5. NUNCA peça informações sensíveis (senha, cartão, etc.)

REGRAS:
- Máximo 4 parágrafos por resposta
- Seja concisa e direta
- Use listas quando apropriado
- Termine oferecendo mais ajuda OU sugerindo atendimento humano para casos complexos

${INOVAFINANCE_KNOWLEDGE}`
    };

    const messages: ChatMessage[] = [
      systemPrompt,
      ...(history || []).slice(-10).map((m: any) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    console.log('[Support AI] Processing message:', message.substring(0, 50));

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://inovafinance.lovable.app',
        'X-Title': 'INOVAFINANCE Support AI'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Support AI] API Error:', response.status, errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from AI');
    }

    const aiMessage = data.choices[0].message.content;
    console.log('[Support AI] Response generated successfully');

    return new Response(JSON.stringify({ message: aiMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Support AI] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback: 'Desculpe, estou com dificuldades técnicas no momento. Por favor, tente o atendimento humano clicando no botão abaixo. 🙏'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
