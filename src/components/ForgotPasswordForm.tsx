import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, KeyRound, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface ForgotPasswordFormProps {
    onBack: () => void;
}

type Step = 'email' | 'code' | 'newPassword' | 'success';

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setError('Digite seu email');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Use signInWithOtp to get a numeric code (if enabled in Supabase)
            // This allows the user to type the code instead of clicking a link
            const { error } = await supabase.auth.signInWithOtp({
                email: email.trim(),
                options: {
                    shouldCreateUser: false,
                },
            });
            if (error) throw error;
            setStep('code');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erro ao enviar código');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) {
            setError('Digite o código');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Verify the OTP code (logs the user in)
            const { error } = await supabase.auth.verifyOtp({
                email: email.trim(),
                token: code.trim(),
                type: 'email',
            });

            if (error) throw error;
            setStep('newPassword');
        } catch (err: any) {
            console.error(err);
            setError('Código inválido ou expirado');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) throw error;
            setStep('success');
        } catch (err: any) {
            console.error(err);
            setError('Erro ao atualizar senha');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            key="forgot-password"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm"
        >
            <div className="relative">
                <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/50 via-emerald-500/50 to-primary/50 rounded-2xl opacity-50" />

                <GlassCard className="relative p-6 backdrop-blur-xl bg-card/90 border-0">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-semibold">
                            Recuperar Senha
                        </h2>
                    </div>

                    {step !== 'success' && (
                        <p className="text-muted-foreground text-sm text-center mb-6">
                            {step === 'email' && 'Digite seu email para receber o código'}
                            {step === 'code' && 'Digite o código enviado para seu email'}
                            {step === 'newPassword' && 'Crie sua nova senha de acesso'}
                        </p>
                    )}

                    {step === 'email' && (
                        <form onSubmit={handleSendCode} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-primary" />
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="bg-muted/30 border-border h-11"
                                    disabled={isLoading}
                                />
                            </div>

                            {error && <p className="text-destructive text-sm text-center">{error}</p>}

                            <Button type="submit" disabled={isLoading} className="w-full h-11 bg-primary">
                                {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Enviar Código'}
                            </Button>
                        </form>
                    )}

                    {step === 'code' && (
                        <form onSubmit={handleVerifyCode} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium flex items-center gap-2">
                                    <KeyRound className="w-3.5 h-3.5 text-primary" />
                                    Código de Verificação
                                </label>
                                <Input
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="123456"
                                    className="bg-muted/30 border-border h-11 text-center text-lg tracking-widest"
                                    disabled={isLoading}
                                />
                            </div>

                            {error && <p className="text-destructive text-sm text-center">{error}</p>}

                            <Button type="submit" disabled={isLoading} className="w-full h-11 bg-primary">
                                {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Verificar Código'}
                            </Button>
                        </form>
                    )}

                    {step === 'newPassword' && (
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium flex items-center gap-2">
                                    <KeyRound className="w-3.5 h-3.5 text-primary" />
                                    Nova Senha
                                </label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Nova senha"
                                    className="bg-muted/30 border-border h-11"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium flex items-center gap-2">
                                    <KeyRound className="w-3.5 h-3.5 text-primary" />
                                    Confirmar Senha
                                </label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirme a nova senha"
                                    className="bg-muted/30 border-border h-11"
                                    disabled={isLoading}
                                />
                            </div>

                            {error && <p className="text-destructive text-sm text-center">{error}</p>}

                            <Button type="submit" disabled={isLoading} className="w-full h-11 bg-primary">
                                {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Salvar Nova Senha'}
                            </Button>
                        </form>
                    )}

                    {step === 'success' && (
                        <div className="text-center space-y-4 py-4">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Senha Atualizada!</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Sua senha foi alterada com sucesso. Você já pode fazer login.
                                </p>
                            </div>
                            <Button onClick={onBack} className="w-full h-11 bg-primary mt-4">
                                Voltar para Login
                            </Button>
                        </div>
                    )}

                    {step !== 'success' && (
                        <Button variant="ghost" className="w-full mt-4" onClick={onBack}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                        </Button>
                    )}
                </GlassCard>
            </div>
        </motion.div>
    );
}
