import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, CreditCard, AlertTriangle, Lock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';

interface RenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  hoursRemaining: number;
  minutesRemaining: number;
}

export function RenewalModal({ isOpen, onClose, hoursRemaining, minutesRemaining }: RenewalModalProps) {
  const navigate = useNavigate();

  const handleSubscribe = () => {
    navigate('/subscription');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-md"
        >
          <GlassCard className="p-6 text-center border-warning/50 shadow-2xl">
            {/* Animated warning icon */}
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto animate-pulse">
                <Clock className="w-10 h-10 text-warning" />
              </div>
              <div className="absolute -top-1 -right-1 left-0 right-0 mx-auto w-fit">
                <span className="inline-flex items-center gap-1 bg-warning text-warning-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  <Zap className="w-3 h-3" /> URGENTE
                </span>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-2 text-foreground">
              Seu teste gratuito está acabando!
            </h2>
            
            <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-4">
              <p className="text-lg font-mono font-bold text-warning">
                {hoursRemaining > 0 ? `${hoursRemaining}h ${minutesRemaining}min` : `${minutesRemaining} minutos`}
              </p>
              <p className="text-sm text-muted-foreground">
                para o bloqueio da conta
              </p>
            </div>

            <p className="text-muted-foreground mb-6">
              Para continuar usando o <span className="font-semibold text-foreground">INOVAFINANCE</span> e ter controle total das suas finanças, realize a assinatura.
            </p>

            <div className="space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-primary to-accent font-semibold h-12"
                size="lg"
                onClick={handleSubscribe}
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Assinar agora
              </Button>
              
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={onClose}
              >
                Depois
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

interface BlockedModalProps {
  isOpen: boolean;
  isExpired?: boolean;
}

export function BlockedModal({ isOpen, isExpired = true }: BlockedModalProps) {
  const navigate = useNavigate();

  const handleSubscribe = () => {
    navigate('/subscription');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8 text-center border-destructive/50 shadow-2xl">
          {/* Locked icon */}
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Lock className="w-12 h-12 text-destructive" />
            </div>
            <motion.div 
              className="absolute inset-0 rounded-full border-2 border-destructive/30"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>

          <h2 className="text-2xl font-bold mb-2 text-foreground">
            Sua conta foi bloqueada
          </h2>
          
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span className="font-semibold text-destructive">Acesso suspenso</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {isExpired 
                ? 'Seu teste gratuito de 7 dias expirou.'
                : 'Sua assinatura expirou.'}
            </p>
          </div>

          <p className="text-muted-foreground mb-6">
            Para continuar usando o <span className="font-semibold text-foreground">INOVAFINANCE</span> com todos os recursos, realize o pagamento.
          </p>

          {/* Features reminder */}
          <div className="bg-muted/30 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs text-muted-foreground mb-2">Ao assinar você terá acesso a:</p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <span className="text-success">✓</span> Dashboard completo
              </li>
              <li className="flex items-center gap-2">
                <span className="text-success">✓</span> Assistente de voz ISA
              </li>
              <li className="flex items-center gap-2">
                <span className="text-success">✓</span> Rotinas inteligentes
              </li>
              <li className="flex items-center gap-2">
                <span className="text-success">✓</span> IA financeira
              </li>
            </ul>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-primary to-accent font-semibold h-14 text-lg"
            size="lg"
            onClick={handleSubscribe}
          >
            <CreditCard className="w-6 h-6 mr-2" />
            Gerar PIX para reativar
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            Pagamento processado via Mercado Pago
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
