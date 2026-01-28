// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔥 LEADMAPS PRO - LEAD SCORING ENGINE
// Motor de qualificação e scoring inteligente de leads
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type {
    GoogleMapsLead,
    QualifiedLead,
    LeadTemperature
} from '../types/leadmaps';

/**
 * Critérios de scoring
 */
const SCORING_WEIGHTS = {
    rating: 25,           // Peso da avaliação (0-25 pontos)
    reviews: 20,          // Peso do volume de avaliações (0-20 pontos)
    digitalPresence: 30,  // Peso da presença digital (0-30 pontos)
    category: 15,         // Peso da categoria do negócio (0-15 pontos)
    location: 10,         // Peso da localização (0-10 pontos)
};

/**
 * Categorias de alto valor (maior potencial de conversão)
 */
const HIGH_VALUE_CATEGORIES = [
    'restaurante',
    'pizzaria',
    'hamburgueria',
    'lanchonete',
    'cafeteria',
    'padaria',
    'hotel',
    'pousada',
    'academia',
    'clínica',
    'consultório',
    'escritório',
    'loja',
    'salão',
    'barbearia',
    'pet shop',
    'autoescola',
    'escola',
    'curso',
];

/**
 * Calcula score de rating (0-25 pontos)
 */
function calculateRatingScore(rating?: number): number {
    if (!rating) return 0;

    if (rating >= 4.5) return 25;
    if (rating >= 4.0) return 20;
    if (rating >= 3.5) return 15;
    if (rating >= 3.0) return 10;
    return 5;
}

/**
 * Calcula score de reviews (0-20 pontos)
 */
function calculateReviewsScore(reviews?: number): number {
    if (!reviews) return 0;

    if (reviews >= 500) return 20;
    if (reviews >= 200) return 18;
    if (reviews >= 100) return 15;
    if (reviews >= 50) return 12;
    if (reviews >= 20) return 8;
    return 5;
}

/**
 * Calcula score de presença digital (0-30 pontos)
 */
function calculateDigitalPresenceScore(lead: GoogleMapsLead): number {
    let score = 0;

    if (lead.website) score += 12;
    if (lead.whatsapp) score += 10;
    if (lead.instagram) score += 8;

    return score;
}

/**
 * Calcula score de categoria (0-15 pontos)
 */
function calculateCategoryScore(categoria: string): number {
    const normalizedCategory = categoria.toLowerCase();

    const isHighValue = HIGH_VALUE_CATEGORIES.some(cat =>
        normalizedCategory.includes(cat)
    );

    return isHighValue ? 15 : 8;
}

/**
 * Calcula score de localização (0-10 pontos)
 * Pode ser expandido com lógica de bairros nobres, centros comerciais, etc.
 */
function calculateLocationScore(lead: GoogleMapsLead): number {
    // Implementação básica - pode ser expandida
    if (lead.bairro) return 10;
    return 5;
}

/**
 * Determina temperatura do lead baseado no score
 */
function determineTemperature(score: number): LeadTemperature {
    if (score >= 70) return 'quente';
    if (score >= 45) return 'morno';
    return 'frio';
}

/**
 * Calcula probabilidade de conversão (0-100%)
 */
function calculateConversionProbability(lead: GoogleMapsLead, score: number): number {
    let probability = score;

    // Bônus: rating alto + muitas reviews = alta confiança
    if (lead.rating && lead.rating >= 4.5 && lead.reviews && lead.reviews >= 100) {
        probability += 10;
    }

    // Penalidade: sem presença digital
    if (!lead.website && !lead.whatsapp && !lead.instagram) {
        probability -= 15;
    }

    // Bônus: WhatsApp disponível (facilita contato)
    if (lead.whatsapp) {
        probability += 5;
    }

    return Math.min(100, Math.max(0, probability));
}

/**
 * Qualifica um único lead
 */
export function qualifyLead(lead: GoogleMapsLead): QualifiedLead {
    const ratingScore = calculateRatingScore(lead.rating);
    const reviewsScore = calculateReviewsScore(lead.reviews);
    const digitalScore = calculateDigitalPresenceScore(lead);
    const categoryScore = calculateCategoryScore(lead.categoria);
    const locationScore = calculateLocationScore(lead);

    const totalScore = ratingScore + reviewsScore + digitalScore + categoryScore + locationScore;
    const temperature = determineTemperature(totalScore);
    const conversionProbability = calculateConversionProbability(lead, totalScore);

    const qualityFactors = {
        hasDigitalPresence: !!(lead.website || lead.whatsapp || lead.instagram),
        hasHighRating: (lead.rating ?? 0) >= 4.5,
        hasGoodReviewVolume: (lead.reviews ?? 0) >= 50,
        hasWhatsApp: !!lead.whatsapp,
        hasWebsite: !!lead.website,
        hasInstagram: !!lead.instagram,
    };

    return {
        ...lead,
        score: Math.round(totalScore),
        temperature,
        qualityFactors,
        conversionProbability: Math.round(conversionProbability),
    };
}

/**
 * Qualifica múltiplos leads e ordena por score
 */
export function qualifyLeads(leads: GoogleMapsLead[]): QualifiedLead[] {
    const qualified = leads.map(qualifyLead);

    // Ordena por score (maior primeiro)
    qualified.sort((a, b) => b.score - a.score);

    // Adiciona ranking de prioridade
    qualified.forEach((lead, index) => {
        lead.priorityRank = index + 1;
    });

    return qualified;
}

/**
 * Filtra leads por temperatura
 */
export function filterByTemperature(
    leads: QualifiedLead[],
    temperatures: LeadTemperature[]
): QualifiedLead[] {
    return leads.filter(lead => temperatures.includes(lead.temperature));
}

/**
 * Filtra leads por score mínimo
 */
export function filterByMinScore(
    leads: QualifiedLead[],
    minScore: number
): QualifiedLead[] {
    return leads.filter(lead => lead.score >= minScore);
}

/**
 * Obtém estatísticas de qualificação
 */
export function getQualificationStats(leads: QualifiedLead[]) {
    const total = leads.length;
    const quentes = leads.filter(l => l.temperature === 'quente').length;
    const mornos = leads.filter(l => l.temperature === 'morno').length;
    const frios = leads.filter(l => l.temperature === 'frio').length;

    const avgScore = leads.reduce((sum, l) => sum + l.score, 0) / total;
    const avgConversion = leads.reduce((sum, l) => sum + l.conversionProbability, 0) / total;

    const withWhatsApp = leads.filter(l => l.qualityFactors.hasWhatsApp).length;
    const withWebsite = leads.filter(l => l.qualityFactors.hasWebsite).length;
    const withInstagram = leads.filter(l => l.qualityFactors.hasInstagram).length;

    return {
        total,
        distribution: {
            quentes,
            mornos,
            frios,
            quentesPercent: Math.round((quentes / total) * 100),
            mornosPercent: Math.round((mornos / total) * 100),
            friosPercent: Math.round((frios / total) * 100),
        },
        averages: {
            score: Math.round(avgScore),
            conversionProbability: Math.round(avgConversion),
        },
        digitalPresence: {
            whatsapp: withWhatsApp,
            website: withWebsite,
            instagram: withInstagram,
            whatsappPercent: Math.round((withWhatsApp / total) * 100),
            websitePercent: Math.round((withWebsite / total) * 100),
            instagramPercent: Math.round((withInstagram / total) * 100),
        },
    };
}
