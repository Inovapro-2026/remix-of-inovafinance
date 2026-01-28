// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 LEADMAPS PRO - MARKET STRATEGY ENGINE
// Análise estratégica de mercado e oportunidades de expansão
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { GoogleMapsLead, QualifiedLead, MarketAnalysis } from '../types/leadmaps';

/**
 * Analisa densidade competitiva por região
 */
function analyzeCompetitionDensity(
    leads: GoogleMapsLead[],
    region: string
): 'baixa' | 'média' | 'alta' | 'saturada' {
    const count = leads.filter(l =>
        l.cidade === region || l.bairro === region
    ).length;

    if (count >= 50) return 'saturada';
    if (count >= 30) return 'alta';
    if (count >= 15) return 'média';
    return 'baixa';
}

/**
 * Calcula estatísticas de rating e reviews
 */
function calculateRatingStats(leads: GoogleMapsLead[]) {
    const withRating = leads.filter(l => l.rating);
    const withReviews = leads.filter(l => l.reviews);

    const avgRating = withRating.length > 0
        ? withRating.reduce((sum, l) => sum + (l.rating || 0), 0) / withRating.length
        : 0;

    const avgReviews = withReviews.length > 0
        ? withReviews.reduce((sum, l) => sum + (l.reviews || 0), 0) / withReviews.length
        : 0;

    return { avgRating, avgReviews };
}

/**
 * Identifica top categorias
 */
function getTopCategories(leads: GoogleMapsLead[]) {
    const categoryCounts = new Map<string, number>();

    leads.forEach(lead => {
        const count = categoryCounts.get(lead.categoria) || 0;
        categoryCounts.set(lead.categoria, count + 1);
    });

    const sorted = Array.from(categoryCounts.entries())
        .map(([categoria, count]) => ({
            categoria,
            count,
            percentage: Math.round((count / leads.length) * 100),
        }))
        .sort((a, b) => b.count - a.count);

    return sorted.slice(0, 10);
}

/**
 * Gera oportunidades baseadas na análise
 */
function generateOpportunities(
    leads: GoogleMapsLead[],
    density: 'baixa' | 'média' | 'alta' | 'saturada',
    stats: { avgRating: number; avgReviews: number }
): string[] {
    const opportunities: string[] = [];

    if (density === 'baixa') {
        opportunities.push('Região com baixa concorrência — oportunidade de entrada');
        opportunities.push('Possibilidade de dominar o mercado local rapidamente');
    }

    if (density === 'saturada') {
        opportunities.push('Mercado saturado — foco em diferenciação é crítico');
        opportunities.push('Considerar expansão para bairros adjacentes');
    }

    if (stats.avgRating < 4.0) {
        opportunities.push('Média de avaliação baixa — oportunidade para serviço superior');
    }

    const withoutWebsite = leads.filter(l => !l.website).length;
    const websiteGap = Math.round((withoutWebsite / leads.length) * 100);

    if (websiteGap > 60) {
        opportunities.push(`${websiteGap}% dos negócios sem site — grande oportunidade de digitalização`);
    }

    const withoutWhatsApp = leads.filter(l => !l.whatsapp).length;
    const whatsappGap = Math.round((withoutWhatsApp / leads.length) * 100);

    if (whatsappGap > 50) {
        opportunities.push(`${whatsappGap}% sem WhatsApp Business — canal de vendas inexplorado`);
    }

    return opportunities;
}

/**
 * Gera avisos estratégicos
 */
function generateWarnings(
    density: 'baixa' | 'média' | 'alta' | 'saturada',
    topCategories: Array<{ categoria: string; count: number; percentage: number }>
): string[] {
    const warnings: string[] = [];

    if (density === 'saturada') {
        warnings.push('⚠️ Alta saturação — entrada de novos players será desafiadora');
        warnings.push('⚠️ Necessário investimento alto em marketing para se destacar');
    }

    const dominantCategory = topCategories[0];
    if (dominantCategory && dominantCategory.percentage > 40) {
        warnings.push(`⚠️ ${dominantCategory.categoria} domina ${dominantCategory.percentage}% do mercado`);
    }

    return warnings;
}

/**
 * Gera recomendações estratégicas
 */
function generateRecommendations(
    leads: GoogleMapsLead[],
    density: 'baixa' | 'média' | 'alta' | 'saturada',
    stats: { avgRating: number; avgReviews: number }
): string[] {
    const recommendations: string[] = [];

    if (density === 'saturada') {
        recommendations.push('Foque em nichos específicos não atendidos');
        recommendations.push('Invista em branding forte e diferenciação clara');
        recommendations.push('Considere modelo de negócio inovador (dark kitchen, delivery-only, etc.)');
    } else if (density === 'baixa') {
        recommendations.push('Aproveite a baixa concorrência para estabelecer marca');
        recommendations.push('Invista em SEO local para dominar buscas da região');
        recommendations.push('Crie parcerias com negócios complementares');
    }

    if (stats.avgRating < 4.0) {
        recommendations.push('Priorize excelência no atendimento — concorrência tem avaliações baixas');
        recommendations.push('Implemente programa de fidelidade para reter clientes');
    }

    const digitalGap = leads.filter(l => !l.website && !l.whatsapp).length;
    if (digitalGap > leads.length * 0.5) {
        recommendations.push('Mercado com baixa maturidade digital — oportunidade de liderança tecnológica');
    }

    return recommendations;
}

/**
 * Analisa mercado por região (cidade ou bairro)
 */
export function analyzeMarketByRegion(
    leads: GoogleMapsLead[],
    region: string
): MarketAnalysis {
    const regionLeads = leads.filter(l =>
        l.cidade === region || l.bairro === region
    );

    const density = analyzeCompetitionDensity(leads, region);
    const stats = calculateRatingStats(regionLeads);
    const topCategories = getTopCategories(regionLeads);
    const opportunities = generateOpportunities(regionLeads, density, stats);
    const warnings = generateWarnings(density, topCategories);
    const recommendations = generateRecommendations(regionLeads, density, stats);

    return {
        region,
        totalLeads: regionLeads.length,
        competitionDensity: density,
        averageRating: Math.round(stats.avgRating * 10) / 10,
        averageReviews: Math.round(stats.avgReviews),
        topCategories,
        opportunities,
        warnings,
        recommendations,
    };
}

/**
 * Compara múltiplas regiões
 */
export function compareRegions(
    leads: GoogleMapsLead[],
    regions: string[]
): MarketAnalysis[] {
    return regions.map(region => analyzeMarketByRegion(leads, region));
}

/**
 * Identifica regiões com melhor oportunidade
 */
export function findBestOpportunityRegions(
    leads: GoogleMapsLead[],
    topN: number = 5
): Array<{ region: string; score: number; reasoning: string }> {
    const cities = [...new Set(leads.map(l => l.cidade))];

    const regionScores = cities.map(city => {
        const cityLeads = leads.filter(l => l.cidade === city);
        const density = analyzeCompetitionDensity(leads, city);
        const stats = calculateRatingStats(cityLeads);

        let score = 0;
        let reasoning: string[] = [];

        // Densidade ideal: média (não muito baixa, não saturada)
        if (density === 'média') {
            score += 40;
            reasoning.push('densidade competitiva equilibrada');
        } else if (density === 'baixa') {
            score += 30;
            reasoning.push('baixa concorrência');
        } else if (density === 'alta') {
            score += 20;
        } else {
            score += 10;
            reasoning.push('mercado saturado');
        }

        // Avaliação média baixa = oportunidade
        if (stats.avgRating < 4.0) {
            score += 20;
            reasoning.push('concorrentes com avaliações baixas');
        }

        // Gap digital
        const digitalGap = cityLeads.filter(l => !l.website).length / cityLeads.length;
        if (digitalGap > 0.6) {
            score += 25;
            reasoning.push('alto gap de digitalização');
        }

        // Volume de mercado
        if (cityLeads.length > 20) {
            score += 15;
            reasoning.push('mercado com volume relevante');
        }

        return {
            region: city,
            score,
            reasoning: reasoning.join(', '),
        };
    });

    return regionScores
        .sort((a, b) => b.score - a.score)
        .slice(0, topN);
}

/**
 * Analisa saturação por categoria
 */
export function analyzeCategorySaturation(
    leads: GoogleMapsLead[]
): Array<{
    categoria: string;
    count: number;
    saturation: 'baixa' | 'média' | 'alta';
    recommendation: string;
}> {
    const topCategories = getTopCategories(leads);

    return topCategories.map(cat => {
        let saturation: 'baixa' | 'média' | 'alta';
        let recommendation: string;

        if (cat.count >= 30) {
            saturation = 'alta';
            recommendation = 'Evitar entrada direta — buscar nicho específico';
        } else if (cat.count >= 15) {
            saturation = 'média';
            recommendation = 'Oportunidade com diferenciação clara';
        } else {
            saturation = 'baixa';
            recommendation = 'Excelente oportunidade de entrada';
        }

        return {
            categoria: cat.categoria,
            count: cat.count,
            saturation,
            recommendation,
        };
    });
}

/**
 * Gera insights de expansão geográfica
 */
export function generateExpansionInsights(
    leads: GoogleMapsLead[]
): {
    currentCoverage: string[];
    suggestedExpansion: string[];
    reasoning: string;
} {
    const cities = [...new Set(leads.map(l => l.cidade))];
    const neighborhoods = [...new Set(leads.map(l => l.bairro).filter(Boolean))];

    const bestOpportunities = findBestOpportunityRegions(leads, 3);

    return {
        currentCoverage: cities,
        suggestedExpansion: bestOpportunities.map(o => o.region),
        reasoning: `Baseado em análise de ${leads.length} leads, as regiões sugeridas apresentam: ${bestOpportunities[0]?.reasoning || 'oportunidades estratégicas'}`,
    };
}
