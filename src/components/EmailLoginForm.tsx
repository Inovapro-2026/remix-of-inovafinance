import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, KeyRound, Eye, EyeOff, Loader2, CreditCard, Calendar, Fingerprint } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { InstallAppButton } from '@/components/InstallAppButton';

interface EmailLoginFormProps {
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  onBiometricLogin: () => void;
  isLoading: boolean;
}

export function EmailLoginForm({ 
  biometricAvailable, 
  biometricEnabled, 
  onBiometricLogin,
  isLoading: externalLoading 
}: EmailLoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { loginWithEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Digite seu email');
      return;
    }
    
    if (!password) {
      setError('Digite sua senha');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await loginWithEmail(email.trim(), password);
      
      if (result.success) {
        navigate('/');
      } else {
        // Translate common errors to Portuguese
        let errorMessage = result.error || 'Erro ao fazer login';
        if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha incorretos';
        } else if (errorMessage.includes('Email not confirmed')) {
          errorMessage = 'Confirme seu email antes de fazer login';
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const loading = isLoading || externalLoading;

  return (
    <motion.div
      key="email-login"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-sm"
    >
      <div className="relative">
        {/* Tech border effect */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/50 via-emerald-500/50 to-primary/50 rounded-2xl opacity-50" />
        
        <GlassCard className="relative p-6 backdrop-blur-xl bg-card/90 border-0">
          {/* Header with icon */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">
              Acesso Seguro
            </h2>
          </div>
          <p className="text-muted-foreground text-sm text-center mb-6">
            Entre com seu email e senha
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
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
                disabled={loading}
                autoComplete="email"
              />
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-primary" />
                Senha
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-muted/30 border-border h-11 pr-10"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-sm text-center flex items-center justify-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                {error}
              </motion.p>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Biometric Login Button */}
          {biometricAvailable && biometricEnabled && (
            <div className="mt-4">
              <button
                onClick={onBiometricLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-all text-foreground font-medium border border-border"
              >
                <Fingerprint className="w-5 h-5 text-primary" />
                Entrar com biometria
              </button>
            </div>
          )}

          {/* Action buttons with tech style */}
          <div className="mt-6 pt-4 border-t border-border/50 space-y-3">
            <button
              onClick={() => navigate('/subscribe')}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all text-primary-foreground font-medium shadow-lg shadow-primary/20"
            >
              <CreditCard className="w-5 h-5" />
              Assine agora
            </button>
            <button
              onClick={() => navigate('/subscribe?trial=true')}
              className="group w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border-2 border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500 transition-all text-emerald-400 font-medium"
            >
              <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Teste grátis por 7 dias
            </button>
          </div>
          
          {/* Install App Button */}
          <InstallAppButton />
        </GlassCard>
      </div>
    </motion.div>
  );
}
