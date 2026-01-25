// Routine Card Component - Block visualization
import { motion } from 'framer-motion';
import { 
  Clock, 
  Check, 
  Pause, 
  Play, 
  Trash2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DIAS_SEMANA_LABEL, formatTime } from '@/lib/agendaDb';

type RotinaStatus = 'pendente' | 'em_andamento' | 'feito' | 'nao_feito';

interface RoutineCardProps {
  rotina: {
    id: string;
    titulo: string;
    hora: string;
    hora_fim?: string;
    dias_semana: string[];
    categoria?: string;
    prioridade?: string;
    ativo: boolean;
  };
  status: RotinaStatus;
  showDays?: boolean;
  onComplete?: () => void;
  onToggleActive?: () => void;
  onDelete?: () => void;
  delay?: number;
}

const categoryConfig: Record<string, { icon: string; bg: string; border: string }> = {
  trabalho: { icon: '💼', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  estudo: { icon: '📚', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  pessoal: { icon: '🏠', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  saude: { icon: '💪', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  default: { icon: '⏰', bg: 'bg-muted', border: 'border-border' },
};

const statusConfig: Record<RotinaStatus, { label: string; color: string; bgColor: string; borderColor: string }> = {
  pendente: { 
    label: 'Pendente', 
    color: 'text-muted-foreground',
    bgColor: 'bg-card/50',
    borderColor: 'border-border/50'
  },
  em_andamento: { 
    label: 'Em andamento', 
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30'
  },
  feito: { 
    label: '✓ Feito', 
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30'
  },
  nao_feito: { 
    label: '✗ Não feito', 
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30'
  },
};

const prioridadeColors: Record<string, string> = {
  baixa: 'bg-gray-400',
  media: 'bg-amber-500',
  alta: 'bg-red-500',
};

export function RoutineCard({
  rotina,
  status,
  showDays = false,
  onComplete,
  onToggleActive,
  onDelete,
  delay = 0,
}: RoutineCardProps) {
  const category = categoryConfig[rotina.categoria || 'default'] || categoryConfig.default;
  const statusInfo = statusConfig[status];
  const prioridadeColor = prioridadeColors[rotina.prioridade || 'media'];

  const isCompleted = status === 'feito';
  const isNotDone = status === 'nao_feito';
  const isInProgress = status === 'em_andamento';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: delay * 0.05 }}
    >
      <Card className={cn(
        "backdrop-blur-sm overflow-hidden transition-all",
        statusInfo.bgColor,
        statusInfo.borderColor,
        !rotina.ativo && "opacity-60"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Complete Button / Status Icon */}
            {onComplete ? (
              <button
                onClick={onComplete}
                className={cn(
                  "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                  isCompleted
                    ? "bg-green-500 border-green-500"
                    : isNotDone
                      ? "bg-red-500 border-red-500"
                      : isInProgress
                        ? "bg-amber-500 border-amber-500"
                        : "border-primary/50 hover:border-primary hover:bg-primary/10"
                )}
              >
                {isCompleted && <Check className="w-5 h-5 text-white" />}
                {isNotDone && <AlertCircle className="w-5 h-5 text-white" />}
                {isInProgress && <Loader2 className="w-5 h-5 text-white animate-spin" />}
              </button>
            ) : (
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                category.bg, category.border, "border"
              )}>
                <span className="text-lg">{category.icon}</span>
              </div>
            )}
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  "font-medium truncate",
                  isCompleted && "line-through text-muted-foreground"
                )}>
                  {rotina.titulo}
                </h3>
                {rotina.prioridade && (
                  <span className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    prioridadeColor
                  )} />
                )}
              </div>
              
              {/* Time Block */}
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {formatTime(rotina.hora)}
                  {rotina.hora_fim && (
                    <>
                      <span className="mx-1">→</span>
                      {formatTime(rotina.hora_fim)}
                    </>
                  )}
                </span>
              </div>

              {/* Days */}
              {showDays && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {rotina.dias_semana.map(dia => (
                    <Badge key={dia} variant="outline" className="text-xs px-1.5">
                      {DIAS_SEMANA_LABEL[dia]?.slice(0, 3)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {/* Status Badge */}
            {status !== 'pendente' && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  statusInfo.color,
                  statusInfo.borderColor
                )}
              >
                {statusInfo.label}
              </Badge>
            )}

            {/* Action Buttons */}
            {(onToggleActive || onDelete) && (
              <div className="flex gap-1">
                {onToggleActive && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleActive}
                    className={rotina.ativo ? "text-amber-500" : "text-green-500"}
                  >
                    {rotina.ativo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                    onClick={onDelete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
