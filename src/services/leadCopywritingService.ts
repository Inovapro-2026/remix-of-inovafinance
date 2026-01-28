// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💬 LEADMAPS PRO - COPYWRITING ENGINE
// Gerador de scripts de prospecção B2B personalizados
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { QualifiedLead, ProspectingScript } from '../types/leadmaps';

/**
 * Identifica pain points baseado na presença digital do lead
 */
function identifyPainPoints(lead: QualifiedLead): string[] {
    const painPoints: string[] = [];

    if (!lead.website) {
        painPoints.push('Ausência de site próprio limita vendas diretas');
        painPoints.push('Dependência de plataformas de terceiros (iFood, Rappi, etc.)');
    }

    if (!lead.whatsapp) {
        painPoints.push('Sem WhatsApp Business para atendimento rápido');
        painPoints.push('Perda de clientes que preferem contato via WhatsApp');
    }

    if (!lead.instagram) {
        painPoints.push('Ausência no Instagram reduz visibilidade');
        painPoints.push('Falta de engajamento com público jovem');
    }

    if (lead.rating && lead.rating < 4.0) {
        painPoints.push('Avaliação abaixo da média pode afastar clientes');
    }

    if (lead.reviews && lead.reviews < 20) {
        painPoints.push('Poucas avaliações reduzem confiança do público');
    }

    return painPoints;
}

/**
 * Gera proposta de valor personalizada
 */
function generateValueProposition(lead: QualifiedLead, painPoints: string[]): string {
    const propositions: string[] = [];

    if (!lead.website) {
        propositions.push('site profissional com sistema de pedidos integrado');
    }

    if (!lead.whatsapp) {
        propositions.push('automação de WhatsApp para atendimento 24/7');
    }

    if (!lead.instagram) {
        propositions.push('gestão de redes sociais com conteúdo estratégico');
    }

    if (lead.rating && lead.rating >= 4.5) {
        propositions.push('potencializar sua excelente reputação online');
    }

    return propositions.join(', ');
}

/**
 * Gera script para WhatsApp
 */
function generateWhatsAppScript(lead: QualifiedLead): string {
    const painPoints = identifyPainPoints(lead);
    const mainPainPoint = painPoints[0] || 'oportunidades de crescimento digital';

    const hasGoodRating = lead.rating && lead.rating >= 4.5;
    const ratingMention = hasGoodRating
        ? `Vi que ${lead.nome} possui avaliação ${lead.rating} ⭐ no Google`
        : `Encontrei ${lead.nome} no Google`;

    const digitalGap = !lead.website
        ? 'mas não encontrei um site para pedidos diretos — isso faz muitos clientes acabarem pedindo pelo iFood, que cobra taxas altas.'
        : 'e identifiquei oportunidades para aumentar suas vendas online.';

    return `Olá! Tudo bem?

${ratingMention}, ${digitalGap}

Trabalho com soluções digitais para ${lead.categoria.toLowerCase()}s e ajudo negócios como o seu a:

✅ Reduzir dependência de apps de delivery
✅ Aumentar vendas diretas
✅ Automatizar atendimento via WhatsApp

Posso te mostrar como outros estabelecimentos aumentaram o faturamento em até 40% com essas estratégias.

Tem 5 minutos para conversarmos?`;
}

/**
 * Gera script para cold call
 */
function generateColdCallScript(lead: QualifiedLead): string {
    const hasGoodRating = lead.rating && lead.rating >= 4.5;
    const ratingMention = hasGoodRating
        ? `vi que vocês possuem avaliação ${lead.rating} estrelas no Google`
        : 'encontrei vocês no Google';

    return `**ABERTURA:**
"Bom dia/Boa tarde! Meu nome é [SEU NOME], da [SUA EMPRESA]. Estou ligando para ${lead.nome}. Poderia falar com o responsável?"

**PITCH:**
"Olha, ${ratingMention} e percebi que vocês têm um ótimo negócio. O motivo da ligação é que trabalho com soluções digitais específicas para ${lead.categoria.toLowerCase()}s e tenho ajudado estabelecimentos da região a aumentar suas vendas diretas, reduzindo a dependência de apps como iFood."

**QUALIFICAÇÃO:**
"Vocês já pensaram em ter um sistema próprio de pedidos online? Ou em automatizar o atendimento via WhatsApp?"

**CTA:**
"Posso agendar uma demonstração rápida de 15 minutos para mostrar como funciona. Que tal amanhã às 14h ou quinta às 10h?"

**OBJEÇÃO (se disser que não tem tempo):**
"Entendo perfeitamente. Por isso mesmo nossa solução é pensada para quem não tem tempo — ela automatiza o que hoje toma horas do seu dia. Que tal eu te enviar um vídeo de 3 minutos pelo WhatsApp? Qual o melhor número?"`;
}

/**
 * Gera script para email
 */
function generateEmailScript(lead: QualifiedLead): string {
    const hasGoodRating = lead.rating && lead.rating >= 4.5;
    const ratingMention = hasGoodRating
        ? `Parabéns pela avaliação ${lead.rating} ⭐ no Google!`
        : '';

    return `**Assunto:** ${lead.nome} — Oportunidade de aumentar vendas diretas

Olá, equipe ${lead.nome}!

${ratingMention}

Meu nome é [SEU NOME] e trabalho com transformação digital para ${lead.categoria.toLowerCase()}s.

Analisando a presença online de ${lead.nome}, identifiquei oportunidades claras para:

📈 **Aumentar vendas diretas** (sem taxas de apps)
⚡ **Automatizar atendimento** via WhatsApp
🎯 **Capturar mais clientes** da sua região

**Cases de sucesso:**
Ajudamos a [Exemplo 1] a reduzir custos com delivery em 35% e a [Exemplo 2] a aumentar pedidos diretos em 50%.

**Próximo passo:**
Gostaria de agendar 15 minutos para uma demonstração? Sem compromisso.

Responda este email ou me chame no WhatsApp: [SEU WHATSAPP]

Abraço,
[SEU NOME]
[SUA EMPRESA]`;
}

/**
 * Gera script personalizado para um lead
 */
export function generateProspectingScript(
    lead: QualifiedLead,
    channel: 'whatsapp' | 'call' | 'email'
): ProspectingScript {
    const painPoints = identifyPainPoints(lead);
    const valueProposition = generateValueProposition(lead, painPoints);

    let script: string;
    let cta: string;

    switch (channel) {
        case 'whatsapp':
            script = generateWhatsAppScript(lead);
            cta = 'Tem 5 minutos para conversarmos?';
            break;
        case 'call':
            script = generateColdCallScript(lead);
            cta = 'Que tal amanhã às 14h ou quinta às 10h?';
            break;
        case 'email':
            script = generateEmailScript(lead);
            cta = 'Responda este email ou me chame no WhatsApp';
            break;
    }

    const personalizationFactors = [
        `Nome: ${lead.nome}`,
        `Categoria: ${lead.categoria}`,
        lead.rating ? `Rating: ${lead.rating} ⭐` : '',
        lead.reviews ? `Reviews: ${lead.reviews}` : '',
        `Temperatura: ${lead.temperature}`,
        `Score: ${lead.score}/100`,
    ].filter(Boolean);

    return {
        leadId: lead.id,
        leadName: lead.nome,
        channel,
        script,
        personalizationFactors,
        painPoints,
        valueProposition,
        cta,
    };
}

/**
 * Gera scripts para múltiplos leads
 */
export function generateBulkScripts(
    leads: QualifiedLead[],
    channel: 'whatsapp' | 'call' | 'email'
): ProspectingScript[] {
    return leads.map(lead => generateProspectingScript(lead, channel));
}

/**
 * Gera scripts para os top N leads
 */
export function generateTopLeadsScripts(
    leads: QualifiedLead[],
    topN: number = 10,
    channel: 'whatsapp' | 'call' | 'email'
): ProspectingScript[] {
    const topLeads = leads
        .sort((a, b) => b.score - a.score)
        .slice(0, topN);

    return generateBulkScripts(topLeads, channel);
}

/**
 * Gera resumo de abordagem recomendada
 */
export function getRecommendedApproach(lead: QualifiedLead): {
    primaryChannel: 'whatsapp' | 'call' | 'email';
    reasoning: string;
    alternativeChannels: string[];
} {
    // Prioriza WhatsApp se disponível
    if (lead.whatsapp) {
        return {
            primaryChannel: 'whatsapp',
            reasoning: 'Lead possui WhatsApp — canal com maior taxa de resposta (70%+)',
            alternativeChannels: ['call', 'email'],
        };
    }

    // Se tem telefone mas não WhatsApp, usa call
    if (lead.telefone) {
        return {
            primaryChannel: 'call',
            reasoning: 'Lead possui telefone — abordagem direta e pessoal',
            alternativeChannels: ['email'],
        };
    }

    // Fallback para email (menos efetivo)
    return {
        primaryChannel: 'email',
        reasoning: 'Sem WhatsApp ou telefone — email como última opção',
        alternativeChannels: [],
    };
}
