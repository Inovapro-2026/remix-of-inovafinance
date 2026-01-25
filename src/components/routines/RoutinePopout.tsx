// Routine Popout Component - Interactive modal for routine start/end
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Play, 
  X, 
  CheckCircle, 
  XCircle,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { timeToSpeech } from '@/services/isaVoiceService';

interface RoutinePopoutProps {
  isOpen: boolean;
  type: 'inicio' | 'encerramento';
  rotina: {
    id: string;
    titulo: string;
    hora: string;
    hora_fim?: string;
    categoria?: string;
  };
  aiTip?: string;
  onStart?: () => void;
  onComplete?: (completed: boolean) => void;
  onCancel?: () => void;
  onDismiss?: () => void;
}

const categoryColors: Record<string, string> = {
  trabalho: 'from-blue-500 to-blue-600',
  estudo: 'from-purple-500 to-purple-600',
  pessoal: 'from-green-500 to-green-600',
  saude: 'from-red-500 to-red-600',
  default: 'from-primary to-primary/80',
};

const categoryIcons: Record<string, string> = {
  trabalho: '💼',
  estudo: '📚',
  pessoal: '🏠',
  saude: '💪',
  default: '⏰',
};

export function RoutinePopout({
  isOpen,
  type,
  rotina,
  aiTip,
  onStart,
  onComplete,
  onCancel,
  onDismiss,
}: RoutinePopoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const categoryGradient = categoryColors[rotina.categoria || 'default'] || categoryColors.default;
  const categoryIcon = categoryIcons[rotina.categoria || 'default'] || categoryIcons.default;

  const handleStart = async () => {
    setIsLoading(true);
    await onStart?.();
    setIsLoading(false);
  };

  const handleComplete = async (completed: boolean) => {
    setIsLoading(true);
    await onComplete?.(completed);
    setIsLoading(false);
  };

  const handleCancel = async () => {
    setIsLoading(true);
    await onCancel?.();
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header with gradient */}
          <div className={cn(
            "bg-gradient-to-r p-6 text-white",
            categoryGradient
          )}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{categoryIcon}</span>
              <div>
                <p className="text-white/80 text-sm font-medium">
                  {type === 'inicio' ? '⏰ Hora de iniciar' : '⏱️ Rotina encerrada'}
                </p>
                <h2 className="text-xl font-bold">{rotina.titulo}</h2>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-3 bg-white/20 rounded-lg px-3 py-2">
              <Clock className="w-4 h-4" />
              <span className="font-medium">
                {rotina.hora}
                {rotina.hora_fim && ` → ${rotina.hora_fim}`}
              </span>
            </div>
          </div>

          {/* AI Tip Section */}
          {type === 'inicio' && aiTip && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mx-4 mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">
                    💡 Dica de Produtividade
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {aiTip}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Question for encerramento */}
          {type === 'encerramento' && (
            <div className="p-4 text-center">
              <p className="text-lg font-medium text-foreground">
                Você concluiu essa rotina?
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-4 space-y-3">
            {type === 'inicio' ? (
              <>
                <Button
                  onClick={handleStart}
                  disabled={isLoading}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Iniciar Rotina
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  <X className="w-5 h-5 mr-2" />
                  Cancelar
                </Button>
              </>
            ) : (
              <div className="flex gap-3">
                <Button
                  onClick={() => handleComplete(true)}
                  disabled={isLoading}
                  className="flex-1 h-12 bg-green-500 hover:bg-green-600"
                  size="lg"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Sim
                </Button>
                <Button
                  onClick={() => handleComplete(false)}
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1 h-12 border-destructive text-destructive hover:bg-destructive/10"
                  size="lg"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Não
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
