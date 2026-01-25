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

// Comprehensive knowledge base about INOVAFINANCE - COMPLETE AND ACCURATE
const INOVAFINANCE_KNOWLEDGE = `
# INOVAFINANCE - Base de Conhecimento Completa e Atualizada

## 📱 SOBRE O APP
INOVAFINANCE é um aplicativo completo de gestão financeira pessoal e produtividade com assistente de voz IA.

### MODOS DO APP (alternados pelo botão no topo da tela):
1. **Modo Finanças** - Gestão financeira pessoal completa
2. **Modo Rotinas** - Gestão de produtividade e hábitos diários

---

## 💰 MODO FINANÇAS - ABAS E FUNCIONALIDADES

### 🏠 ABA INÍCIO (Dashboard)
Tela principal com visão geral das finanças:
- **Card de Saldo Disponível** - Mostra o saldo atual em débito. CLICÁVEL para editar o valor diretamente
- **Card de Entradas** - Total de receitas recebidas (verde)
- **Card de Saídas** - Total de gastos realizados (vermelho)
- **Gráfico de Evolução** - Linha mostrando saldo dos últimos 7 dias
- **Gráfico de Categorias** - Pizza mostrando distribuição dos gastos por categoria
- **Insights de IA** - Cards com análises automáticas (economia, alertas, tendências)
- **Últimas Transações** - Lista dos 5 últimos gastos registrados
- **Botão de Suporte** - Flutuante no canto inferior direito para falar conosco

### 🤖 ABA AI (INOVA - Assistente de Voz)
**ESTA É A FORMA PRINCIPAL DE REGISTRAR TRANSAÇÕES!**

Como usar:
1. Toque no **botão de microfone** grande no centro da tela
2. Fale naturalmente o que gastou ou recebeu
3. OU toque no ícone de teclado para digitar
4. A IA processa automaticamente e abre um popout de confirmação
5. Confirme categoria, valor e método de pagamento
6. Pronto! Transação registrada

**Exemplos de comandos por voz/texto:**
- "Gastei 50 reais no mercado"
- "Recebi 2000 de salário"
- "Paguei 35 reais de almoço no débito"
- "Comprei remédio por 80 reais no crédito"
- "Entrou 500 reais de freelance"
- "Saiu 150 do cartão em combustível"

**Comandos de agendamento:**
- "Agenda 600 reais de aluguel dia 10"
- "Lembre de pagar internet dia 15"
- "Todo mês 200 reais de academia dia 5"

**Consultas (não abre popout, só responde):**
- "Qual meu saldo?"
- "Quanto gastei hoje?"
- "Como estão minhas finanças?"
- "Posso gastar mais 200 reais?"

### 💳 ABA CARTÃO
Gerenciamento do cartão de crédito virtual:
- **Cartão 3D interativo** - Toque para virar e ver CVV
- **Limite total** - Clicável para editar
- **Limite disponível** - Calculado automaticamente (limite - usado)
- **Fatura atual** - Gastos no crédito do mês
- **Dia de vencimento** - Clicável para alterar (padrão: dia 5)
- **Biometria** - Opção de proteger com digital/face ID
- **Barra de uso** - Visual do quanto do limite foi usado

### 📊 ABA EXTRATO
Histórico detalhado de todas as movimentações:
- **Filtros** - Por tipo (entradas/saídas/todos)
- **Busca** - Por descrição ou categoria
- **Lista completa** - Todas as transações com data, hora, valor e categoria
- **Cores** - Verde para entradas, vermelho para saídas
- **Ícones** - Cada categoria tem seu ícone específico

### 📅 ABA PLANEJAR
Planejamento financeiro mensal:
- **Configurar Salário** - Valor e dia do recebimento
- **Adiantamento** - Valor e dia (opcional)
- **Contas Programadas** - Cadastrar contas mensais fixas (aluguel, luz, etc.)
- **Projeção de Saldo** - Saldo previsto após todas as contas
- **Alertas de Vencimento** - Contas que vencem hoje ou estão atrasadas
- **Marcar como Pago** - Registra automaticamente como gasto

### 🎯 ABA METAS
Metas financeiras com progresso visual:
- **Criar nova meta** - Nome, valor alvo e prazo
- **Barra de progresso** - Visual do quanto já juntou
- **Adicionar valor** - Depositar na meta
- **Prazo** - Data limite para atingir
- **Arquivar** - Metas concluídas ou canceladas

### 👤 ABA PERFIL
Configurações pessoais e do app:
- **Dados pessoais** - Nome, CPF, telefone, email
- **Matrícula** - Seu número de identificação único
- **Saldo inicial** - Valor base para cálculos
- **Salário** - Valor e dia de recebimento
- **Crédito** - Limite e dia de vencimento
- **Voz INOVA** - Ativar/desativar assistente de voz
- **Alternar modo** - Trocar entre Finanças e Rotinas
- **Sair** - Fazer logout da conta

---

## ⏰ MODO ROTINAS - ABAS E FUNCIONALIDADES

### 📅 ABA AGENDA
Calendário para compromissos:
- **Visualização** - Dia, semana ou mês
- **Criar evento** - Título, data, hora, descrição
- **Tipos de evento** - Compromisso, lembrete, tarefa
- **Notificações** - Alertas configuráveis (5min, 15min, 1h antes)
- **Marcar concluído** - Riscar da lista

### 🔄 ABA ROTINAS
Hábitos e tarefas recorrentes:
- **Criar rotina** - Título, horário início/fim, dias da semana
- **Categorias** - Trabalho, pessoal, saúde, estudos, etc.
- **Prioridade** - Alta (vermelho), média (amarelo), baixa (verde)
- **Dias da semana** - Selecionar quais dias repetir
- **Notificações** - Lembrete antes de começar
- **WhatsApp** - Receber lembretes no WhatsApp
- **Marcar progresso** - Concluída, em andamento, não feita

### 🧠 ABA ROTINA INTELIGENTE (Chat IA)
Assistente de produtividade com IA (INOVAPRO AI):
- **Chat por texto** - Digite suas dúvidas sobre rotinas
- **Microfone** - Fale naturalmente
- **Análise de rotinas** - IA vê suas rotinas cadastradas
- **Dicas personalizadas** - Sugestões baseadas no seu perfil
- **Gráficos** - Taxa de conclusão, melhores horários
- **Relatório de produtividade** - Desempenho semanal/mensal

### 📈 ABA ANÁLISE
Estatísticas de produtividade:
- **Taxa de conclusão** - % de rotinas feitas
- **Streak** - Dias consecutivos de produtividade
- **Melhores horários** - Quando você é mais produtivo
- **Piores horários** - Quando você procrastina mais
- **Horas planejadas vs realizadas** - Comparativo
- **Gráficos** - Evolução ao longo do tempo

---

## 💳 PLANOS E ASSINATURA

### Teste Grátis
- **Duração**: 72 horas (3 dias)
- **Acesso**: Todas as funcionalidades liberadas
- **Após expirar**: Conta bloqueada, só retorna ao assinar
- **Única vez**: Não pode renovar o teste

### Plano Mensal
- **Primeira assinatura**: R$ 29,90
- **Renovação mensal**: R$ 49,90/mês
- **Pagamento**: PIX ou cartão via Mercado Pago
- **Sem renovação automática**: Você paga quando quiser renovar

---

## 🤝 PROGRAMA DE AFILIADOS

### Como funciona
1. Acesse a tela de afiliados (/affiliates)
2. Cadastre-se com seus dados
3. Aguarde aprovação do admin
4. Receba seu link único de convite
5. Compartilhe e ganhe comissões

### Comissões
- **Valor por indicação**: R$ 20,00 por assinatura
- **Carência**: 30 dias após pagamento do indicado
- **Saque mínimo**: R$ 50,00
- **Forma de saque**: PIX
- **Prazo do saque**: Até 5 dias úteis

### Painel de Afiliado
- Ver saldo disponível
- Histórico de indicações
- Status de comissões (pendente/liberada)
- Solicitar saque
- Copiar link de convite

---

## 🔧 FUNCIONALIDADES TÉCNICAS

### Assistente de Voz INOVA
- **Saudação automática** ao abrir o app
- **Fala valores e saldos** naturalmente
- **Ativar/desativar** no Dashboard ou Perfil
- **Usa voz do navegador** para velocidade

### Sincronização
- **Tempo real** - Dados sincronizam instantaneamente
- **Nuvem** - Tudo salvo no servidor
- **Multi-dispositivo** - Acesse de qualquer lugar

### Segurança
- **Login por matrícula** - Número único + senha
- **Biometria opcional** - Face ID ou digital
- **Sessões monitoradas** - Logs de acesso
- **Dados criptografados** - Proteção total

---

## ❓ PERGUNTAS FREQUENTES

### "Como registro um gasto?"
Use a **aba AI**! Toque no microfone e fale "gastei X reais em tal coisa" ou digite. A IA abre um popout para confirmar e registrar.

### "Como registro uma entrada?"
Mesma forma! Na **aba AI**, diga "recebi X reais de salário" ou "entrou X de freelance". A IA detecta automaticamente que é entrada.

### "Posso adicionar transação manualmente?"
A forma principal é pela IA (voz ou texto). Não existe botão "+" tradicional - a IA processa tudo automaticamente de forma mais inteligente.

### "Como editar meu saldo?"
No Dashboard, toque no card grande de "Saldo Disponível". Um modal abre para digitar o novo valor.

### "Como usar o cartão de crédito?"
Na aba AI, diga "gastei X no crédito em tal coisa". O sistema separa gastos de débito e crédito automaticamente.

### "Como agendar uma conta mensal?"
Na aba AI, diga "agenda X reais de aluguel dia 10" OU vá em Planejar e cadastre manualmente.

### "Como criar uma rotina?"
Mude para o Modo Rotinas (botão no topo), vá em Rotinas e toque no "+".

### "Como ver meu extrato?"
Na aba Extrato você vê todas as transações com filtros e busca.

### "Como falar com um humano?"
Clique no botão de suporte flutuante no Dashboard e depois em "Falar com Atendente Humano".

### "Esqueci minha senha"
Na tela de login, clique em "Esqueci minha senha" para recuperar.

---

## 🆘 SUPORTE

### Canais
- **Chat com IA** - Disponível 24h (você está aqui!)
- **Atendimento humano** - Clique em "Falar com Atendente"
- **WhatsApp**: (11) 97819-7645

### Horário de Atendimento Humano
- Segunda a Sexta: 9h às 18h
- Sábados: 9h às 13h

---

## 📋 REGRAS IMPORTANTES

1. Uma conta por CPF
2. Dados são privados e criptografados
3. Não compartilhamos com terceiros
4. Teste grátis é único (72h, sem renovação)
5. Comissões de afiliados têm carência de 30 dias
6. Saque mínimo de afiliado: R$ 50,00
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

REGRA CRÍTICA SOBRE REGISTRO DE TRANSAÇÕES:
- Para registrar gastos ou entradas, o usuário DEVE usar a ABA AI
- Não existe botão "+" tradicional para adicionar transações
- O usuário fala no microfone OU digita e a IA processa automaticamente

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
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from AI');
    }

    const aiMessage = data.choices[0].message.content;

    return new Response(JSON.stringify({ message: aiMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback: 'Desculpe, estou com dificuldades técnicas no momento. Por favor, tente o atendimento humano clicando no botão abaixo. 🙏'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});