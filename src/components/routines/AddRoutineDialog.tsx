// Add Routine Dialog with Start/End times, Category, Priority
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DIAS_SEMANA_LABEL } from '@/lib/agendaDb';

interface AddRoutineDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (rotina: {
    titulo: string;
    descricao?: string;
    dias_semana: string[];
    hora: string;
    hora_fim?: string;
    categoria: string;
    prioridade: string;
  }) => void;
}

const CATEGORIAS = [
  { value: 'trabalho', label: 'Trabalho', icon: '💼', color: 'bg-blue-500' },
  { value: 'estudo', label: 'Estudo', icon: '📚', color: 'bg-purple-500' },
  { value: 'pessoal', label: 'Pessoal', icon: '🏠', color: 'bg-green-500' },
  { value: 'saude', label: 'Saúde', icon: '💪', color: 'bg-red-500' },
];

const PRIORIDADES = [
  { value: 'baixa', label: 'Baixa', color: 'bg-gray-400' },
  { value: 'media', label: 'Média', color: 'bg-amber-500' },
  { value: 'alta', label: 'Alta', color: 'bg-red-500' },
];

export function AddRoutineDialog({ isOpen, onClose, onAdd }: AddRoutineDialogProps) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [hora, setHora] = useState('07:00');
  const [horaFim, setHoraFim] = useState('');
  const [temHoraFim, setTemHoraFim] = useState(false);
  const [categoria, setCategoria] = useState('pessoal');
  const [prioridade, setPrioridade] = useState('media');
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([
    'segunda', 'terca', 'quarta', 'quinta', 'sexta'
  ]);

  const toggleDia = (dia: string) => {
    setDiasSelecionados(prev => 
      prev.includes(dia) 
        ? prev.filter(d => d !== dia)
        : [...prev, dia]
    );
  };

  const validateTimeRange = (): boolean => {
    if (!temHoraFim || !horaFim) return true;
    
    const [hInicio, mInicio] = hora.split(':').map(Number);
    const [hFim, mFim] = horaFim.split(':').map(Number);
    
    const inicioMinutos = hInicio * 60 + mInicio;
    const fimMinutos = hFim * 60 + mFim;
    
    return fimMinutos > inicioMinutos;
  };

  const handleSubmit = () => {
    if (!titulo.trim()) {
      toast.error('Digite um título');
      return;
    }
    if (diasSelecionados.length === 0) {
      toast.error('Selecione pelo menos um dia');
      return;
    }
    if (!validateTimeRange()) {
      toast.error('O horário final deve ser maior que o inicial');
      return;
    }

    onAdd({ 
      titulo, 
      descricao: descricao || undefined,
      dias_semana: diasSelecionados, 
      hora,
      hora_fim: temHoraFim ? horaFim : undefined,
      categoria,
      prioridade,
    });
    
    // Reset form
    setTitulo('');
    setDescricao('');
    setHora('07:00');
    setHoraFim('');
    setTemHoraFim(false);
    setCategoria('pessoal');
    setPrioridade('media');
    setDiasSelecionados(['segunda', 'terca', 'quarta', 'quinta', 'sexta']);
    onClose();
  };

  const diasOrdenados = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Nova Rotina
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          {/* Título */}
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              placeholder="Ex: Ir para academia"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              autoFocus
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Textarea
              placeholder="Detalhes da rotina..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
            />
          </div>

          {/* Horários */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Horários</Label>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Definir fim</Label>
                <Switch
                  checked={temHoraFim}
                  onCheckedChange={setTemHoraFim}
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Início</Label>
                <Input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                />
              </div>
              {temHoraFim && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  className="flex-1 space-y-1"
                >
                  <Label className="text-xs text-muted-foreground">Fim</Label>
                  <Input
                    type="time"
                    value={horaFim}
                    onChange={(e) => setHoraFim(e.target.value)}
                  />
                </motion.div>
              )}
            </div>
            
            {temHoraFim && horaFim && !validateTimeRange() && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Horário final deve ser maior que o inicial
              </p>
            )}
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIAS.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategoria(cat.value)}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-lg border-2 transition-all",
                    categoria === cat.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  <span className="text-xl mb-1">{cat.icon}</span>
                  <span className="text-xs">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prioridade */}
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <div className="flex gap-2">
              {PRIORIDADES.map(prio => (
                <button
                  key={prio.value}
                  onClick={() => setPrioridade(prio.value)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border-2 transition-all",
                    prioridade === prio.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full", prio.color)} />
                  <span className="text-sm">{prio.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dias da semana */}
          <div className="space-y-2">
            <Label>Dias da semana</Label>
            <div className="flex flex-wrap gap-2">
              {diasOrdenados.map(dia => (
                <button
                  key={dia}
                  onClick={() => toggleDia(dia)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                    diasSelecionados.includes(dia)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {DIAS_SEMANA_LABEL[dia]?.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button onClick={handleSubmit} className="w-full">
            <Check className="w-4 h-4 mr-2" />
            Criar Rotina
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
