// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧠 LEADMAPS PRO - IA ANALYTICS CHAT COMPONENT
// Interface de chat para interação com o IA Analytics Hub
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, TrendingUp, Users, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { sendLeadMapsAIMessage, getAIContext } from '@/services/leadMapsAIService';
import type { AIAnalyticsResponse } from '@/types/leadmaps';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    data?: AIAnalyticsResponse['data'];
    insights?: string[];
    recommendations?: string[];
}

export function LeadMapsAIChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const context = getAIContext();
    const hasLeads = context.currentLeads.length > 0;

    // Auto-scroll para última mensagem
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Mensagem inicial
    useEffect(() => {
        if (messages.length === 0) {
            const welcomeMessage: Message = {
                role: 'assistant',
                content: hasLeads
                    ? `🧠 **IA Analytics Hub ativo**\n\nAnalisando ${context.currentLeads.length} leads da última extração.\n\nComo posso ajudar você a converter mais vendas hoje?`
                    : '🟡 **Modo Standby**\n\nAguardando extração de leads para iniciar análises estratégicas.\n\nImporte dados do Google Maps para começar.',
                timestamp: new Date(),
            };
            setMessages([welcomeMessage]);
        }
    }, [hasLeads]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const history = messages.map(m => ({
                role: m.role,
                content: m.content,
            }));

            const response = await sendLeadMapsAIMessage(input, history);

            const assistantMessage: Message = {
                role: 'assistant',
                content: response.message || response.error || 'Erro ao processar solicitação',
                timestamp: new Date(),
                data: response.data,
                insights: response.insights,
                recommendations: response.recommendations,
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: '❌ Erro ao processar sua solicitação. Tente novamente.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const quickActions = [
        { icon: TrendingUp, label: 'Top 10 Leads', query: 'Quais são os 10 melhores leads?' },
        { icon: Users, label: 'Leads Quentes', query: 'Mostre apenas leads quentes' },
        { icon: Target, label: 'Gerar Scripts', query: 'Gere scripts de WhatsApp para os top 5 leads' },
        { icon: Zap, label: 'Análise de Mercado', query: 'Analise a densidade competitiva por região' },
    ];

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            IA Analytics Hub
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {hasLeads
                                ? `${context.currentLeads.length} leads ativos • ${context.qualifiedLeads.filter(l => l.temperature === 'quente').length} quentes`
                                : 'Aguardando dados'
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <Card
                            className={`max-w-[80%] p-4 ${message.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                                }`}
                        >
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <div className="whitespace-pre-wrap">{message.content}</div>
                            </div>

                            {/* Insights */}
                            {message.insights && message.insights.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                    <p className="text-xs font-semibold mb-2">💡 Insights:</p>
                                    <ul className="text-xs space-y-1">
                                        {message.insights.map((insight, i) => (
                                            <li key={i}>• {insight}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Recommendations */}
                            {message.recommendations && message.recommendations.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                    <p className="text-xs font-semibold mb-2">✅ Recomendações:</p>
                                    <ul className="text-xs space-y-1">
                                        {message.recommendations.map((rec, i) => (
                                            <li key={i}>• {rec}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <p className="text-xs opacity-60 mt-2">
                                {message.timestamp.toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </Card>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <Card className="bg-white dark:bg-slate-800 p-4">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Analisando dados...</span>
                            </div>
                        </Card>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 1 && hasLeads && (
                <div className="px-4 pb-4">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                        Ações rápidas:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {quickActions.map((action, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="justify-start gap-2"
                                onClick={() => setInput(action.query)}
                            >
                                <action.icon className="w-4 h-4" />
                                <span className="text-xs">{action.label}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={
                            hasLeads
                                ? 'Pergunte sobre seus leads, peça análises ou scripts...'
                                : 'Importe leads do Google Maps para começar'
                        }
                        disabled={isLoading || !hasLeads}
                        className="flex-1"
                    />
                    <Button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim() || !hasLeads}
                        size="icon"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
