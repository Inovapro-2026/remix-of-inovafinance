// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 LEADMAPS PRO - EXEMPLO DE INTEGRAÇÃO COMPLETA
// Demonstração de uso do IA Analytics Hub
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { GoogleMapsLead } from '../types/leadmaps';
import {
    updateAIContext,
    sendLeadMapsAIMessage,
    getAIContext,
    clearAIContext
} from '../services/leadMapsAIService';
import { qualifyLeads, getQualificationStats } from '../services/leadScoringService';
import { generateProspectingScript, generateTopLeadsScripts } from '../services/leadCopywritingService';
import {
    analyzeMarketByRegion,
    findBestOpportunityRegions,
    analyzeCategorySaturation
} from '../services/leadMarketStrategyService';

/**
 * EXEMPLO 1: Importar e Qualificar Leads
 */
export async function example1_ImportAndQualifyLeads() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 EXEMPLO 1: Importar e Qualificar Leads');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Dados extraídos do Google Maps (exemplo)
    const leads: GoogleMapsLead[] = [
        {
            id: '1',
            nome: 'Pizzaria Bella Napoli',
            categoria: 'Pizzaria',
            endereco: 'Rua das Flores, 123',
            bairro: 'Centro',
            cidade: 'São Paulo',
            estado: 'SP',
            telefone: '11999999999',
            whatsapp: '11999999999',
            rating: 4.8,
            reviews: 320,
            palavraChave: 'pizzaria',
            extractedAt: new Date().toISOString(),
        },
        {
            id: '2',
            nome: 'Restaurante Sabor & Arte',
            categoria: 'Restaurante',
            endereco: 'Av. Paulista, 1000',
            bairro: 'Bela Vista',
            cidade: 'São Paulo',
            estado: 'SP',
            telefone: '11988888888',
            rating: 4.9,
            reviews: 450,
            palavraChave: 'restaurante',
            extractedAt: new Date().toISOString(),
        },
        {
            id: '3',
            nome: 'Hamburgueria Top Burger',
            categoria: 'Hamburgueria',
            endereco: 'Rua Augusta, 500',
            bairro: 'Consolação',
            cidade: 'São Paulo',
            estado: 'SP',
            whatsapp: '11977777777',
            instagram: '@topburger',
            website: 'https://topburger.com.br',
            rating: 4.6,
            reviews: 180,
            palavraChave: 'hamburgueria',
            extractedAt: new Date().toISOString(),
        },
        {
            id: '4',
            nome: 'Cafeteria Aroma',
            categoria: 'Cafeteria',
            endereco: 'Rua Oscar Freire, 200',
            bairro: 'Jardins',
            cidade: 'São Paulo',
            estado: 'SP',
            telefone: '11966666666',
            rating: 4.2,
            reviews: 45,
            palavraChave: 'cafeteria',
            extractedAt: new Date().toISOString(),
        },
        {
            id: '5',
            nome: 'Pizzaria Dona Maria',
            categoria: 'Pizzaria',
            endereco: 'Rua das Palmeiras, 789',
            bairro: 'Vila Madalena',
            cidade: 'São Paulo',
            estado: 'SP',
            whatsapp: '11955555555',
            instagram: '@pizzariadonamaria',
            rating: 4.7,
            reviews: 210,
            palavraChave: 'pizzaria',
            extractedAt: new Date().toISOString(),
        },
    ];

    // Atualiza contexto da IA
    const summary = updateAIContext(leads);

    console.log('\n✅ Resumo da Extração:');
    console.log(`Total de leads: ${summary.totalLeads}`);
    console.log(`Leads quentes: ${summary.qualifiedLeads.quentes}`);
    console.log(`Leads mornos: ${summary.qualifiedLeads.mornos}`);
    console.log(`Leads frios: ${summary.qualifiedLeads.frios}`);

    console.log('\n💡 Insights:');
    summary.marketInsights.forEach(insight => console.log(`  - ${insight}`));

    console.log('\n✅ Próximas Ações:');
    summary.nextActions.forEach(action => console.log(`  - ${action}`));

    // Obtém estatísticas detalhadas
    const context = getAIContext();
    const stats = getQualificationStats(context.qualifiedLeads);

    console.log('\n📊 Estatísticas Detalhadas:');
    console.log(`Score médio: ${stats.averages.score}/100`);
    console.log(`Conversão média: ${stats.averages.conversionProbability}%`);
    console.log(`Com WhatsApp: ${stats.digitalPresence.whatsappPercent}%`);
    console.log(`Com Website: ${stats.digitalPresence.websitePercent}%`);
    console.log(`Com Instagram: ${stats.digitalPresence.instagramPercent}%`);

    return summary;
}

/**
 * EXEMPLO 2: Gerar Scripts de Prospecção
 */
export async function example2_GenerateProspectingScripts() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💬 EXEMPLO 2: Gerar Scripts de Prospecção');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const context = getAIContext();
    const topLeads = context.qualifiedLeads.slice(0, 3);

    console.log(`\n📝 Gerando scripts para os top ${topLeads.length} leads...\n`);

    topLeads.forEach((lead, index) => {
        console.log(`\n${index + 1}. ${lead.nome} (Score: ${lead.score}/100)`);
        console.log('─'.repeat(60));

        // Script WhatsApp
        const whatsappScript = generateProspectingScript(lead, 'whatsapp');
        console.log('\n💬 SCRIPT WHATSAPP:');
        console.log(whatsappScript.script);

        console.log('\n🎯 Pain Points Identificados:');
        whatsappScript.painPoints.forEach(pp => console.log(`  - ${pp}`));

        console.log('\n💰 Proposta de Valor:');
        console.log(`  ${whatsappScript.valueProposition}`);
    });
}

/**
 * EXEMPLO 3: Análise de Mercado
 */
export async function example3_MarketAnalysis() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 EXEMPLO 3: Análise de Mercado');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const context = getAIContext();

    // Análise por região
    const analysis = analyzeMarketByRegion(context.currentLeads, 'São Paulo');

    console.log(`\n🏙️ Análise de Mercado: ${analysis.region}`);
    console.log('─'.repeat(60));
    console.log(`Total de leads: ${analysis.totalLeads}`);
    console.log(`Densidade competitiva: ${analysis.competitionDensity.toUpperCase()}`);
    console.log(`Rating médio: ${analysis.averageRating} ⭐`);
    console.log(`Reviews médio: ${analysis.averageReviews}`);

    console.log('\n📊 Top Categorias:');
    analysis.topCategories.slice(0, 5).forEach(cat => {
        console.log(`  ${cat.categoria}: ${cat.count} (${cat.percentage}%)`);
    });

    console.log('\n💡 Oportunidades:');
    analysis.opportunities.forEach(opp => console.log(`  ✅ ${opp}`));

    console.log('\n⚠️ Avisos:');
    analysis.warnings.forEach(warn => console.log(`  ${warn}`));

    console.log('\n🎯 Recomendações:');
    analysis.recommendations.forEach(rec => console.log(`  • ${rec}`));

    // Melhores regiões para expansão
    console.log('\n🚀 Melhores Oportunidades de Expansão:');
    const bestRegions = findBestOpportunityRegions(context.currentLeads, 3);
    bestRegions.forEach((region, index) => {
        console.log(`  ${index + 1}. ${region.region} (Score: ${region.score}/100)`);
        console.log(`     ${region.reasoning}`);
    });

    // Saturação por categoria
    console.log('\n📊 Saturação por Categoria:');
    const saturation = analyzeCategorySaturation(context.currentLeads);
    saturation.slice(0, 5).forEach(cat => {
        console.log(`  ${cat.categoria}: ${cat.saturation.toUpperCase()} (${cat.count} negócios)`);
        console.log(`     → ${cat.recommendation}`);
    });
}

/**
 * EXEMPLO 4: Interação com a IA
 */
export async function example4_AIInteraction() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧠 EXEMPLO 4: Interação com a IA Analytics Hub');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const queries = [
        'Quais são os 5 melhores leads para prospectar agora?',
        'Separe apenas pizzarias com WhatsApp',
        'Analise a densidade competitiva por região',
        'Gere scripts de WhatsApp para os top 3 leads',
    ];

    for (const query of queries) {
        console.log(`\n👤 USUÁRIO: ${query}`);
        console.log('─'.repeat(60));

        const response = await sendLeadMapsAIMessage(query);

        console.log(`🧠 IA ANALYTICS HUB:\n${response.message}`);

        if (response.insights && response.insights.length > 0) {
            console.log('\n💡 Insights:');
            response.insights.forEach(insight => console.log(`  - ${insight}`));
        }

        if (response.recommendations && response.recommendations.length > 0) {
            console.log('\n✅ Recomendações:');
            response.recommendations.forEach(rec => console.log(`  - ${rec}`));
        }

        // Pequeno delay entre queries
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

/**
 * EXEMPLO 5: Fluxo Completo de Prospecção
 */
export async function example5_CompleteProspectingFlow() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 EXEMPLO 5: Fluxo Completo de Prospecção');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const context = getAIContext();

    // 1. Filtrar apenas leads quentes
    const hotLeads = context.qualifiedLeads.filter(l => l.temperature === 'quente');
    console.log(`\n🔥 Leads Quentes Identificados: ${hotLeads.length}`);

    // 2. Gerar scripts para todos
    const scripts = generateTopLeadsScripts(hotLeads, hotLeads.length, 'whatsapp');
    console.log(`📝 Scripts Gerados: ${scripts.length}`);

    // 3. Simular envio de mensagens
    console.log('\n📤 Simulando Envio de Mensagens:\n');

    scripts.forEach((script, index) => {
        console.log(`${index + 1}. Enviando para: ${script.leadName}`);
        console.log(`   Canal: WhatsApp`);
        console.log(`   Preview: ${script.script.substring(0, 80)}...`);
        console.log('   ✅ Enviado com sucesso!\n');
    });

    // 4. Gerar relatório
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RELATÓRIO DE PROSPECÇÃO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total de leads processados: ${context.currentLeads.length}`);
    console.log(`Leads quentes contatados: ${hotLeads.length}`);
    console.log(`Taxa de qualificação: ${Math.round((hotLeads.length / context.currentLeads.length) * 100)}%`);
    console.log(`Mensagens enviadas: ${scripts.length}`);
    console.log(`Taxa de sucesso: 100%`);
    console.log('\n✅ Prospecção concluída com sucesso!');
}

/**
 * Executar todos os exemplos
 */
export async function runAllExamples() {
    console.log('\n🚀 LEADMAPS PRO - IA ANALYTICS HUB');
    console.log('Demonstração Completa de Funcionalidades\n');

    try {
        // Limpa contexto anterior
        clearAIContext();

        // Executa exemplos em sequência
        await example1_ImportAndQualifyLeads();
        await example2_GenerateProspectingScripts();
        await example3_MarketAnalysis();
        await example4_AIInteraction();
        await example5_CompleteProspectingFlow();

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Todos os exemplos executados com sucesso!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('\n❌ Erro ao executar exemplos:', error);
    }
}

// Exporta função para uso em console/testes
if (typeof window !== 'undefined') {
    (window as any).runLeadMapsExamples = runAllExamples;
}
