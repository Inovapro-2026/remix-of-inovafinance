// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 LEADMAPS PRO - ANALYTICS DASHBOARD
// Dashboard de métricas e insights de leads
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    TrendingUp,
    Users,
    Target,
    Zap,
    Phone,
    Globe,
    Instagram,
    MapPin,
    Star,
    MessageSquare
} from 'lucide-react';
import { getAIContext } from '@/services/leadMapsAIService';
import { getQualificationStats } from '@/services/leadScoringService';
import type { QualifiedLead } from '@/types/leadmaps';

export function LeadMapsAnalyticsDashboard() {
    const [context, setContext] = useState(getAIContext());
    const [stats, setStats] = useState<ReturnType<typeof getQualificationStats> | null>(null);

    useEffect(() => {
        const ctx = getAIContext();
        setContext(ctx);

        if (ctx.qualifiedLeads.length > 0) {
            setStats(getQualificationStats(ctx.qualifiedLeads));
        }
    }, []);

    if (context.currentLeads.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <Card className="max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto">
                                <Zap className="w-8 h-8 text-yellow-600" />
                            </div>
                            <h3 className="text-lg font-semibold">Modo Standby</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Aguardando extração de leads do Google Maps para iniciar análises estratégicas.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!stats) return null;

    const topLeads = context.qualifiedLeads.slice(0, 10);

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Analytics Dashboard
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Última extração: {context.lastExtraction?.timestamp
                        ? new Date(context.lastExtraction.timestamp).toLocaleString('pt-BR')
                        : 'N/A'
                    }
                </p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
                        <Users className="w-4 h-4 text-slate-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Extraídos do Google Maps
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Leads Quentes</CardTitle>
                        <TrendingUp className="w-4 h-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {stats.distribution.quentes}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            {stats.distribution.quentesPercent}% do total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
                        <Target className="w-4 h-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.averages.score}/100</div>
                        <Progress value={stats.averages.score} className="mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Conversão Média</CardTitle>
                        <Zap className="w-4 h-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {stats.averages.conversionProbability}%
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Probabilidade estimada
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Distribuição por Temperatura</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium flex items-center gap-2">
                                    🔥 Quentes
                                    <Badge variant="destructive">{stats.distribution.quentes}</Badge>
                                </span>
                                <span className="text-sm text-slate-600">
                                    {stats.distribution.quentesPercent}%
                                </span>
                            </div>
                            <Progress value={stats.distribution.quentesPercent} className="bg-red-100" />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium flex items-center gap-2">
                                    ⚠️ Mornos
                                    <Badge variant="secondary">{stats.distribution.mornos}</Badge>
                                </span>
                                <span className="text-sm text-slate-600">
                                    {stats.distribution.mornosPercent}%
                                </span>
                            </div>
                            <Progress value={stats.distribution.mornosPercent} className="bg-yellow-100" />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium flex items-center gap-2">
                                    ❄️ Frios
                                    <Badge variant="outline">{stats.distribution.frios}</Badge>
                                </span>
                                <span className="text-sm text-slate-600">
                                    {stats.distribution.friosPercent}%
                                </span>
                            </div>
                            <Progress value={stats.distribution.friosPercent} className="bg-blue-100" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Presença Digital</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium">WhatsApp</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600">
                                    {stats.digitalPresence.whatsapp}
                                </span>
                                <Badge variant="outline">
                                    {stats.digitalPresence.whatsappPercent}%
                                </Badge>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium">Website</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600">
                                    {stats.digitalPresence.website}
                                </span>
                                <Badge variant="outline">
                                    {stats.digitalPresence.websitePercent}%
                                </Badge>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Instagram className="w-4 h-4 text-pink-600" />
                                <span className="text-sm font-medium">Instagram</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600">
                                    {stats.digitalPresence.instagram}
                                </span>
                                <Badge variant="outline">
                                    {stats.digitalPresence.instagramPercent}%
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Leads */}
            <Card>
                <CardHeader>
                    <CardTitle>Top 10 Leads (Maior Potencial)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {topLeads.map((lead, index) => (
                            <LeadCard key={lead.id} lead={lead} rank={index + 1} />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function LeadCard({ lead, rank }: { lead: QualifiedLead; rank: number }) {
    const getTemperatureColor = (temp: string) => {
        switch (temp) {
            case 'quente': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
            case 'morno': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'frio': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getTemperatureIcon = (temp: string) => {
        switch (temp) {
            case 'quente': return '🔥';
            case 'morno': return '⚠️';
            case 'frio': return '❄️';
            default: return '•';
        }
    };

    return (
        <div className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex-shrink-0 w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-sm">
                #{rank}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm truncate">{lead.nome}</h4>
                    <Badge className={getTemperatureColor(lead.temperature)}>
                        {getTemperatureIcon(lead.temperature)} {lead.temperature.toUpperCase()}
                    </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {lead.categoria}
                    </span>
                    <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {lead.cidade}
                    </span>
                    {lead.rating && (
                        <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {lead.rating}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 mt-2">
                    {lead.qualityFactors.hasWhatsApp && (
                        <Badge variant="outline" className="text-xs">
                            <Phone className="w-3 h-3 mr-1" />
                            WhatsApp
                        </Badge>
                    )}
                    {lead.qualityFactors.hasWebsite && (
                        <Badge variant="outline" className="text-xs">
                            <Globe className="w-3 h-3 mr-1" />
                            Website
                        </Badge>
                    )}
                    {lead.qualityFactors.hasInstagram && (
                        <Badge variant="outline" className="text-xs">
                            <Instagram className="w-3 h-3 mr-1" />
                            Instagram
                        </Badge>
                    )}
                </div>
            </div>

            <div className="flex-shrink-0 text-right">
                <div className="text-2xl font-bold text-blue-600">
                    {lead.score}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                    {lead.conversionProbability}% conversão
                </div>
            </div>
        </div>
    );
}
