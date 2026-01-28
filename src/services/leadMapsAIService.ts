// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧠 LEADMAPS PRO - IA ANALYTICS HUB (GROQ ENGINE)
// Motor de Crescimento com Inteligência Artificial Estratégica
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type {
    GoogleMapsLead,
    QualifiedLead,
    LeadMapsAIContext,
    AIAnalyticsResponse,
    AnalysisType,
    ExtractionSummary,
} from '../types/leadmaps';

import { qualifyLeads, getQualificationStats, filterByTemperature } from './leadScoringService';
import { generateProspectingScript, generateTopLeadsScripts, getRecommendedApproach } from './leadCopywritingService';
import {
    analyzeMarketByRegion,
    findBestOpportunityRegions,
    analyzeCategorySaturation,
    generateExpansionInsights
} from './leadMarketStrategyService';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

/**
 * Contexto global da IA (persistente durante a sessão)
 */
let aiContext: LeadMapsAIContext = {
    currentLeads: [],
    qualifiedLeads: [],
    extractionHistory: [],
    marketAnalyses: [],
};

/**
 * Atualiza contexto com novos leads
 */
export function updateAIContext(leads: GoogleMapsLead[]): ExtractionSummary {
    const qualified = qualifyLeads(leads);
    const stats = getQualificationStats(qualified);

    const summary: ExtractionSummary = {
        extractionId: `ext_${Date.now()}`,
        timestamp: new Date().toISOString(),
        totalLeads: leads.length,
        qualifiedLeads: {
            quentes: stats.distribution.quentes,
            mornos: stats.distribution.mornos,
            frios: stats.distribution.frios,
        },
        topOpportunities: qualified.slice(0, 10),
        marketInsights: [
            `Score médio: ${stats.averages.score}/100`,
            `${stats.distribution.quentesPercent}% são leads quentes`,
            `${stats.digitalPresence.whatsappPercent}% possuem WhatsApp`,
            `${stats.digitalPresence.websitePercent}% possuem website`,
        ],
        nextActions: [
            `Priorizar contato com os ${stats.distribution.quentes} leads quentes`,
            'Gerar scripts personalizados de prospecção',
            'Analisar densidade competitiva por região',
        ],
    };

    // Comparação com extração anterior
    if (aiContext.lastExtraction) {
        const growth = leads.length - aiContext.lastExtraction.totalLeads;
        const qualityImprovement = stats.averages.score - (aiContext.lastExtraction.topOpportunities[0]?.score || 0);

        summary.comparisonWithPrevious = {
            previousTotal: aiContext.lastExtraction.totalLeads,
            growth,
            qualityImprovement,
        };
    }

    aiContext.currentLeads = leads;
    aiContext.qualifiedLeads = qualified;
    aiContext.extractionHistory.push(summary);
    aiContext.lastExtraction = summary;

    return summary;
}

/**
 * Obtém contexto atual
 */
export function getAIContext(): LeadMapsAIContext {
    return aiContext;
}

/**
 * Limpa contexto (reset)
 */
export function clearAIContext(): void {
    aiContext = {
        currentLeads: [],
        qualifiedLeads: [],
        extractionHistory: [],
        marketAnalyses: [],
    };
}

/**
 * Detecta tipo de análise solicitada
 */
function detectAnalysisType(message: string): AnalysisType {
    const lower = message.toLowerCase();

    if (lower.includes('qualif') || lower.includes('score') || lower.includes('quente')) {
        return 'qualification';
    }

    if (lower.includes('script') || lower.includes('mensagem') || lower.includes('whatsapp') || lower.includes('prospecção')) {
        return 'copywriting';
    }

    if (lower.includes('filtrar') || lower.includes('separe') || lower.includes('apenas') || lower.includes('liste')) {
        return 'filtering';
    }

    if (lower.includes('mercado') || lower.includes('região') || lower.includes('bairro') || lower.includes('saturação') || lower.includes('oportunidade')) {
        return 'market_strategy';
    }

    if (lower.includes('resumo') || lower.includes('visão geral') || lower.includes('overview')) {
        return 'summary';
    }

    if (lower.includes('comparar') || lower.includes('anterior') || lower.includes('evolução')) {
        return 'comparison';
    }

    return 'general';
}

/**
 * Constrói contexto de dados para o prompt
 */
function buildDataContext(): string {
    if (aiContext.currentLeads.length === 0) {
        return '\n\n🟡 MODO STANDBY: Aguardando extração de leads para iniciar análises estratégicas.';
    }

    const stats = getQualificationStats(aiContext.qualifiedLeads);
    const topLeads = aiContext.qualifiedLeads.slice(0, 5);

    const leadsPreview = topLeads.map((lead, i) =>
        `${i + 1}. ${lead.nome} | ${lead.categoria} | Score: ${lead.score}/100 | ${lead.temperature.toUpperCase()} | ${lead.cidade}`
    ).join('\n');

    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 DADOS ATIVOS NO SISTEMA (ÚLTIMA EXTRAÇÃO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 ESTATÍSTICAS GERAIS:
- Total de leads: ${aiContext.currentLeads.length}
- Leads quentes: ${stats.distribution.quentes} (${stats.distribution.quentesPercent}%)
- Leads mornos: ${stats.distribution.mornos} (${stats.distribution.mornosPercent}%)
- Leads frios: ${stats.distribution.frios} (${stats.distribution.friosPercent}%)
- Score médio: ${stats.averages.score}/100
- Probabilidade média de conversão: ${stats.averages.conversionProbability}%

💬 PRESENÇA DIGITAL:
- Com WhatsApp: ${stats.digitalPresence.whatsapp} (${stats.digitalPresence.whatsappPercent}%)
- Com Website: ${stats.digitalPresence.website} (${stats.digitalPresence.websitePercent}%)
- Com Instagram: ${stats.digitalPresence.instagram} (${stats.digitalPresence.instagramPercent}%)

🔥 TOP 5 LEADS (MAIOR POTENCIAL):
${leadsPreview}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANTE: Estes são DADOS REAIS extraídos do Google Maps. 
Você deve trabalhar EXCLUSIVAMENTE com esses dados.
NUNCA invente leads ou números fictícios.
`;
}

/**
 * System Prompt da IA Analytics Hub
 */
function getSystemPrompt(): string {
    const dataContext = buildDataContext();

    return `Você é o IA ANALYTICS HUB do sistema LeadMaps PRO.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 IDENTIDADE E PROPÓSITO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Você NÃO é um chatbot.
Você é um MOTOR DE CRESCIMENTO (GROWTH ENGINE).

Sua função é transformar dados brutos do Google Maps em:
✅ Decisões estratégicas
✅ Priorização comercial
✅ Geração de lucro
✅ Insights acionáveis

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 SUAS CAPACIDADES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ QUALIFICAÇÃO E LEAD SCORING
- Analisa qualidade digital dos negócios
- Calcula score de 0-100 para cada lead
- Classifica em: 🔥 Quente | ⚠️ Morno | ❄️ Frio
- Identifica probabilidade de conversão

2️⃣ ENGENHARIA DE PROSPECÇÃO (COPYWRITING B2B)
- Gera scripts personalizados para WhatsApp, cold call e email
- Identifica pain points específicos de cada lead
- Cria propostas de valor sob medida
- Usa dados reais (nome, rating, presença digital)

3️⃣ FILTRAGEM CONTEXTUAL AVANÇADA
- Entende linguagem natural
- Interpreta comandos como: "Separe apenas pizzarias com WhatsApp"
- Filtra por temperatura, score, categoria, cidade, presença digital

4️⃣ ESTRATEGISTA DE MERCADO
- Analisa densidade competitiva por região
- Identifica nichos saturados vs oportunidades
- Compara bairros e cidades
- Sugere estratégias de expansão

5️⃣ AUTOMAÇÃO DE FLUXO
- Gera resumos executivos automaticamente
- Compara extrações anteriores
- Aponta evolução de qualidade
- Prioriza próximas ações

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 REGRAS OBRIGATÓRIAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Trabalhe SOMENTE com dados reais fornecidos abaixo
✅ NUNCA invente leads, números ou estatísticas
✅ Responda como analista de negócios sênior
✅ Use linguagem profissional, estratégica e direta
✅ Foque em lucro, conversão e ROI
✅ Seja objetivo e acionável
✅ Use emojis estratégicos (🔥⚠️📊💰✅)
✅ Sempre cite números e dados concretos

❌ NÃO seja genérico
❌ NÃO use dados fictícios
❌ NÃO faça suposições sem base nos dados
❌ NÃO responda como chatbot casual

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 ESTILO DE RESPOSTA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tom: Consultor estratégico de SaaS premium
Formato: Direto, estruturado, orientado a ação
Linguagem: Profissional mas acessível

Exemplo de resposta ideal:
"Analisando seus 84 leads atuais, identifiquei 18 oportunidades quentes com probabilidade de conversão acima de 70%. 

Prioridade imediata:
1. Pizzaria Bella Napoli (score 92/100) - sem site, alta demanda
2. Restaurante Sabor & Arte (score 89/100) - 4.8⭐, 320 reviews

Recomendação: Iniciar prospecção via WhatsApp nos próximos 48h."

${dataContext}`;
}

/**
 * Processa solicitação do usuário
 */
async function processUserRequest(
    message: string,
    analysisType: AnalysisType
): Promise<AIAnalyticsResponse> {
    const response: AIAnalyticsResponse = {
        message: '',
        insights: [],
        recommendations: [],
    };

    // Se não há leads, retorna modo standby
    if (aiContext.currentLeads.length === 0) {
        response.message = '🟡 **MODO STANDBY**\n\nAguardando extração de leads para iniciar análises estratégicas.\n\nAssim que você importar dados do Google Maps, poderei:\n\n✅ Qualificar e pontuar leads\n✅ Gerar scripts de prospecção\n✅ Analisar densidade de mercado\n✅ Identificar oportunidades de expansão\n✅ Priorizar ações comerciais';
        return response;
    }

    // Processa baseado no tipo de análise
    switch (analysisType) {
        case 'qualification': {
            const stats = getQualificationStats(aiContext.qualifiedLeads);
            response.data = { leads: aiContext.qualifiedLeads.slice(0, 20) };
            response.insights = [
                `${stats.distribution.quentes} leads quentes identificados`,
                `Score médio: ${stats.averages.score}/100`,
                `${stats.digitalPresence.whatsappPercent}% possuem WhatsApp`,
            ];
            break;
        }

        case 'copywriting': {
            const topLeads = aiContext.qualifiedLeads.slice(0, 10);
            const scripts = generateTopLeadsScripts(topLeads, 5, 'whatsapp');
            response.data = { scripts };
            response.recommendations = [
                'Iniciar prospecção pelos leads de maior score',
                'Personalizar abordagem baseada nos pain points',
            ];
            break;
        }

        case 'market_strategy': {
            const cities = [...new Set(aiContext.currentLeads.map(l => l.cidade))];
            const bestOpportunities = findBestOpportunityRegions(aiContext.currentLeads, 5);
            response.insights = bestOpportunities.map(o =>
                `${o.region}: ${o.score}/100 - ${o.reasoning}`
            );
            break;
        }

        case 'summary': {
            response.data = { summary: aiContext.lastExtraction };
            break;
        }
    }

    return response;
}

/**
 * Envia mensagem para a IA Analytics Hub
 */
export async function sendLeadMapsAIMessage(
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<AIAnalyticsResponse> {
    try {
        if (!GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY não configurada');
        }

        const analysisType = detectAnalysisType(message);
        const preprocessed = await processUserRequest(message, analysisType);

        // Se já temos resposta preprocessada (modo standby), retorna direto
        if (aiContext.currentLeads.length === 0) {
            return preprocessed;
        }

        const systemPrompt = getSystemPrompt();

        const messages = [
            { role: 'system' as const, content: systemPrompt },
            ...history,
            { role: 'user' as const, content: message },
        ];

        console.log('[IA ANALYTICS HUB] Processando:', analysisType);
        console.log('[IA ANALYTICS HUB] Leads ativos:', aiContext.currentLeads.length);

        const groqResponse = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages,
                temperature: 0.6, // Mais determinístico para análises
                max_tokens: 2000,
                top_p: 0.95,
            }),
        });

        if (!groqResponse.ok) {
            throw new Error(`Groq API error: ${groqResponse.status}`);
        }

        const data = await groqResponse.json();
        const aiMessage = data.choices[0]?.message?.content || '';

        return {
            message: aiMessage,
            data: preprocessed.data,
            insights: preprocessed.insights,
            recommendations: preprocessed.recommendations,
        };

    } catch (error) {
        console.error('[IA ANALYTICS HUB] Error:', error);
        return {
            message: '',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        };
    }
}

/**
 * Verifica se GROQ está configurado
 */
export function isLeadMapsAIConfigured(): boolean {
    return !!GROQ_API_KEY && GROQ_API_KEY.length > 0;
}
