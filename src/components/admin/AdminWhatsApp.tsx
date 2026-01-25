import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, RefreshCw, CheckCircle2, XCircle, QrCode } from "lucide-react";
import { toast } from "sonner";

export function AdminWhatsApp() {
    const [status, setStatus] = useState<any>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [testPhone, setTestPhone] = useState('');
    const [isSendingTest, setIsSendingTest] = useState(false);

    const fetchStatus = async () => {
        try {
            const response = await fetch('/api/whatsapp/status');
            const data = await response.json();
            setStatus(data);
        } catch (error) {
            console.error('Error fetching WhatsApp status:', error);
            setStatus({ status: 'offline', whatsapp: 'DISCONNECTED' });
        }
    };

    const fetchQr = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/whatsapp/qr');
            const data = await response.json();

            if (data.qr) {
                setQrCode(data.qr);
            } else if (data.status === 'CONNECTED') {
                setQrCode(null);
                toast.info('WhatsApp já está conectado.');
            } else {
                setQrCode(null);
                toast.warning('QR Code ainda não disponível. Tente novamente em alguns segundos.');
            }
        } catch (error) {
            console.error('Error fetching QR code:', error);
            toast.error('Erro ao conectar com o bot de WhatsApp.');
        } finally {
            setIsLoading(false);
        }
    };

    const reconnectBot = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/whatsapp/reconnect', { method: 'POST' });
            if (response.ok) {
                toast.success('Iniciando reconexão...');
                fetchStatus();
            } else {
                toast.error('Erro ao solicitar reconexão.');
            }
        } catch (error) {
            toast.error('Erro ao comunicar com o servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    const sendTestMessage = async () => {
        if (!testPhone.trim()) {
            toast.error('Digite um número de telefone.');
            return;
        }

        if (status?.whatsapp !== 'CONNECTED') {
            toast.error('WhatsApp não está conectado.');
            return;
        }

        setIsSendingTest(true);
        try {
            const response = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: testPhone,
                    message: '🔔 *INOVAFINANCE - WhatsApp Oficial*\n\nEsta é uma mensagem de teste do sistema atualizado.\n\nSessão: Persistente ✅\nMotor: whatsapp-web.js ✅\n\nSeu sistema de notificações está PRONTO! 🚀'
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success('Mensagem de teste enviada com sucesso!');
                setTestPhone('');
            } else {
                toast.error('Erro ao enviar mensagem: ' + (data.error || 'Desconhecido'));
            }
        } catch (error) {
            console.error('Error sending test message:', error);
            toast.error('Erro ao enviar mensagem de teste.');
        } finally {
            setIsSendingTest(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white gap-2 flex items-center">
                        <MessageCircle className="w-8 h-8 text-[#25D366]" />
                        Integração WhatsApp
                    </h2>
                    <p className="text-slate-400">
                        Gerencie a conexão do bot oficial do INOVAFINANCE via whatsapp-web.js.
                    </p>
                </div>
                <Button
                    variant="outline"
                    className="border-slate-700 hover:bg-slate-800 text-white"
                    onClick={reconnectBot}
                >
                    <RefreshCw className="mr-2 h-4 w-4" /> Reconectar Bot
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-slate-900 border-slate-800 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-white">Status do Sistema</CardTitle>
                        <CardDescription className="text-slate-400">Estado atual do serviço PM2.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                            <span className="text-slate-300 font-medium">Status do Bot</span>
                            {status?.whatsapp === 'CONNECTED' ? (
                                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-emerald-500/20 text-emerald-500 border-emerald-500/50 gap-1 px-3 py-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>🟢 Conectado</span>
                                </div>
                            ) : status?.whatsapp === 'QR_CODE_READY' ? (
                                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-blue-500/20 text-blue-500 border-blue-500/50 gap-1 px-3 py-1">
                                    <QrCode className="w-3 h-3" />
                                    <span>🔵 Aguardando QR</span>
                                </div>
                            ) : (
                                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-red-500/20 text-red-500 border-red-500/50 gap-1 px-3 py-1">
                                    <XCircle className="w-3 h-3" />
                                    <span>🔴 {status?.whatsapp || 'Desconectado'}</span>
                                </div>
                            )}
                        </div>

                        {status?.info && (
                            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-2">
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Número Conectado</p>
                                <p className="text-white font-mono text-lg">{status.info.wid?.user || status.info.wid}</p>
                                <div className="flex justify-between items-center text-sm text-slate-400">
                                    <span>Nome</span>
                                    <span className="text-slate-200">{status.info.pushname}</span>
                                </div>
                            </div>
                        )}

                        <Button
                            variant="outline"
                            className="w-full border-slate-700 hover:bg-slate-800 text-white"
                            onClick={fetchStatus}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" /> Atualizar Status
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-white">Conectar Novo Aparelho</CardTitle>
                        <CardDescription className="text-slate-400">Escaneie o código para autenticar o bot.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center space-y-6">
                        <div className="relative group">
                            {qrCode ? (
                                <div className="p-4 bg-white rounded-xl shadow-[0_0_30px_rgba(37,211,102,0.2)]">
                                    <img
                                        src={qrCode}
                                        alt="QR Code WhatsApp"
                                        className="w-48 h-48"
                                    />
                                </div>
                            ) : (
                                <div className="w-48 h-48 bg-slate-800/50 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-slate-700 text-slate-500 text-center p-4">
                                    <QrCode className="w-12 h-12 mb-2 opacity-10" />
                                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">Nenhum QR Code</p>
                                </div>
                            )}
                        </div>

                        <Button
                            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-black py-6 rounded-xl shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02]"
                            onClick={fetchQr}
                            disabled={isLoading || status?.whatsapp === 'CONNECTED'}
                        >
                            {isLoading ? (
                                <>
                                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                                    BUSCANDO...
                                </>
                            ) : (
                                <>
                                    <QrCode className="mr-2 h-5 w-5" />
                                    GERAR QR CODE
                                </>
                            )}
                        </Button>

                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg w-full">
                            <p className="text-[10px] text-emerald-500/70 text-center leading-relaxed font-medium">
                                Sessão Persistente (LocalAuth) ativada. O login permanecerá ativo mesmo após reiniciar o serviço.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Test Message Card */}
            <Card className="bg-slate-900 border-slate-800 shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-white">Testar Envio de Mensagem</CardTitle>
                    <CardDescription className="text-slate-400">Envie uma mensagem de teste para verificar se o bot está funcionando.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Número de Telefone (com DDD)</label>
                        <Input
                            type="tel"
                            placeholder="Ex: 11999999999"
                            value={testPhone}
                            onChange={(e) => setTestPhone(e.target.value)}
                            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                            disabled={status?.whatsapp !== 'CONNECTED'}
                        />
                        <p className="text-xs text-slate-500">
                            O DDI +55 será adicionado automaticamente
                        </p>
                    </div>

                    <Button
                        onClick={sendTestMessage}
                        disabled={isSendingTest || status?.whatsapp !== 'CONNECTED' || !testPhone.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg"
                    >
                        {isSendingTest ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Enviar Mensagem de Teste
                            </>
                        )}
                    </Button>

                    {status?.whatsapp !== 'CONNECTED' && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
                            <p className="text-xs text-yellow-500/90 text-center">
                                ⚠️ WhatsApp não está conectado. Conecte primeiro para enviar mensagens.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
