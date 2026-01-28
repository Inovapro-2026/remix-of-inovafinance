// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 LEADMAPS PRO - TYPE DEFINITIONS
// Sistema de tipos para extração e análise de leads do Google Maps
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Lead extraído do Google Maps
 */
export interface GoogleMapsLead {
    id: string;
    nome: string;
    categoria: string;
    endereco: string;
    bairro?: string;
    cidade: string;
    estado: string;
    telefone?: string;
    whatsapp?: string;
    instagram?: string;
    website?: string;
    rating?: number;
    reviews?: number;
    palavraChave: string;
    extractedAt: string;
    latitude?: number;
    longitude?: number;
}

/**
 * Classificação de temperatura do lead
 */
export type LeadTemperature = 'quente' | 'morno' | 'frio';

/**
 * Lead qualificado com scoring
 */
export interface QualifiedLead extends GoogleMapsLead {
    score: number; // 0-100
    temperature: LeadTemperature;
    qualityFactors: {
        hasDigitalPresence: boolean;
        hasHighRating: boolean;
        hasGoodReviewVolume: boolean;
        hasWhatsApp: boolean;
        hasWebsite: boolean;
        hasInstagram: boolean;
    };
    conversionProbability: number; // 0-100
    priorityRank?: number;
}

/**
 * Script de prospecção personalizado
 */
export interface ProspectingScript {
    leadId: string;
    leadName: string;
    channel: 'whatsapp' | 'call' | 'email';
    script: string;
    personalizationFactors: string[];
    painPoints: string[];
    valueProposition: string;
    cta: string;
}

/**
 * Análise de mercado por região
 */
export interface MarketAnalysis {
    region: string;
    totalLeads: number;
    competitionDensity: 'baixa' | 'média' | 'alta' | 'saturada';
    averageRating: number;
    averageReviews: number;
    topCategories: Array<{
        categoria: string;
        count: number;
        percentage: number;
    }>;
    opportunities: string[];
    warnings: string[];
    recommendations: string[];
}

/**
 * Resumo executivo de extração
 */
export interface ExtractionSummary {
    extractionId: string;
    timestamp: string;
    totalLeads: number;
    qualifiedLeads: {
        quentes: number;
        mornos: number;
        frios: number;
    };
    topOpportunities: QualifiedLead[];
    marketInsights: string[];
    nextActions: string[];
    comparisonWithPrevious?: {
        previousTotal: number;
        growth: number;
        qualityImprovement: number;
    };
}

/**
 * Contexto persistente da IA
 */
export interface LeadMapsAIContext {
    currentLeads: GoogleMapsLead[];
    qualifiedLeads: QualifiedLead[];
    extractionHistory: ExtractionSummary[];
    lastExtraction?: ExtractionSummary;
    activeFilters?: {
        temperatura?: LeadTemperature[];
        minScore?: number;
        categorias?: string[];
        cidades?: string[];
        hasWhatsApp?: boolean;
        hasWebsite?: boolean;
        minRating?: number;
    };
    marketAnalyses: MarketAnalysis[];
}

/**
 * Resposta da IA Analytics Hub
 */
export interface AIAnalyticsResponse {
    message: string;
    data?: {
        leads?: QualifiedLead[];
        scripts?: ProspectingScript[];
        analysis?: MarketAnalysis;
        summary?: ExtractionSummary;
    };
    insights?: string[];
    recommendations?: string[];
    error?: string;
}

/**
 * Tipo de análise solicitada
 */
export type AnalysisType =
    | 'qualification'      // Qualificar leads
    | 'copywriting'        // Gerar scripts
    | 'filtering'          // Filtrar por critérios
    | 'market_strategy'    // Análise de mercado
    | 'summary'            // Resumo executivo
    | 'comparison'         // Comparar extrações
    | 'general';           // Consulta geral
