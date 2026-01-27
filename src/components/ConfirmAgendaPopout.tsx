/**
 * Confirm Agenda Popout - Modal for confirming parsed agenda/routine data
 * 
 * This component displays the parsed data and allows the user to confirm or edit before saving.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  X,
  Edit3,
  Repeat,
  Tag,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import type { ParsedAgendaEvent } from '@/services/unifiedAgendaParser';

interface ConfirmAgendaPopoutProps {
  isOpen: boolean;
  parsedEvent: ParsedAgendaEvent | null;
  onConfirm: (event: ParsedAgendaEvent) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const DIAS_SEMANA_OPTIONS = [
  { value: 'segunda', label: 'Segunda' },
  { value: 'terca', label: 'Terça' },
  { value: 'quarta', label: 'Quarta' },
  { value: 'quinta', label: 'Quinta' },
  { value: 'sexta', label: 'Sexta' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
];

const categoryColors: Record<string, string> = {
  trabalho: 'from-blue-500 to-blue-600',
  estudo: 'from-purple-500 to-purple-600',
  pessoal: 'from-green-500 to-green-600',
  saude: 'from-red-500 to-red-600',
};

const categoryIcons: Record<string, string> = {
  trabalho: '💼',
  estudo: '📚',
  pessoal: '🏠',
  saude: '💪',
};

export function ConfirmAgendaPopout({
  isOpen,
  parsedEvent,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmAgendaPopoutProps) {
  const [editedEvent, setEditedEvent] = useState<ParsedAgendaEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (parsedEvent) {
      setEditedEvent({ ...parsedEvent });
      setIsEditing(false);
    }
  }, [parsedEvent]);

  if (!isOpen || !editedEvent) return null;

  const handleConfirm = async () => {
    if (editedEvent) {
      await onConfirm(editedEvent);
    }
  };

  const updateField = <K extends keyof ParsedAgendaEvent>(
    field: K,
    value: ParsedAgendaEvent[K]
  ) => {
    setEditedEvent(prev => prev ? { ...prev, [field]: value } : null);
  };

  const toggleDay = (day: string) => {
    setEditedEvent(prev => {
      if (!prev) return null;
      const days = prev.dias_semana.includes(day)
        ? prev.dias_semana.filter(d => d !== day)
        : [...prev.dias_semana, day];
      return { ...prev, dias_semana: days };
    });
  };

  const categoryGradient = categoryColors[editedEvent.categoria || 'pessoal'] || categoryColors.pessoal;
  const categoryIcon = categoryIcons[editedEvent.categoria || 'pessoal'] || '📌';

  const tipoLabel = {
    rotina: 'Rotina',
    agenda: 'Agenda',
    lembrete: 'Lembrete',
    evento: 'Evento',
  }[editedEvent.tipo];

  const formattedDate = new Date(editedEvent.data + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className={cn(
            "bg-gradient-to-r p-5 text-white",
            categoryGradient
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{categoryIcon}</span>
                <div>
                  <p className="text-white/80 text-sm font-medium flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    Confirmar {tipoLabel}
                  </p>
                  <h2 className="text-xl font-bold">{editedEvent.titulo}</h2>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/80 hover:text-white hover:bg-white/20"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit3 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {isEditing ? (
              // Editing mode
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={editedEvent.titulo}
                    onChange={(e) => updateField('titulo', e.target.value)}
                    placeholder="Ex: Reunião com cliente"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={editedEvent.tipo}
                    onValueChange={(v) => updateField('tipo', v as ParsedAgendaEvent['tipo'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rotina">🔄 Rotina</SelectItem>
                      <SelectItem value="agenda">📅 Agenda</SelectItem>
                      <SelectItem value="lembrete">🔔 Lembrete</SelectItem>
                      <SelectItem value="evento">📌 Evento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!editedEvent.recorrente && (
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={editedEvent.data}
                      onChange={(e) => updateField('data', e.target.value)}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Início</Label>
                    <Input
                      type="time"
                      value={editedEvent.hora}
                      onChange={(e) => updateField('hora', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fim</Label>
                    <Input
                      type="time"
                      value={editedEvent.hora_fim}
                      onChange={(e) => updateField('hora_fim', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Repeat className="w-4 h-4" />
                    Repetição
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={editedEvent.recorrente ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateField('recorrente', true)}
                    >
                      Semanal
                    </Button>
                    <Button
                      variant={!editedEvent.recorrente ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateField('recorrente', false)}
                    >
                      Única vez
                    </Button>
                  </div>
                </div>

                {editedEvent.recorrente && (
                  <div className="space-y-2">
                    <Label>Dias da semana</Label>
                    <div className="flex flex-wrap gap-2">
                      {DIAS_SEMANA_OPTIONS.map((day) => (
                        <Button
                          key={day.value}
                          variant={editedEvent.dias_semana.includes(day.value) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleDay(day.value)}
                        >
                          {day.label.slice(0, 3)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={editedEvent.categoria || 'pessoal'}
                    onValueChange={(v) => updateField('categoria', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trabalho">💼 Trabalho</SelectItem>
                      <SelectItem value="estudo">📚 Estudo</SelectItem>
                      <SelectItem value="pessoal">🏠 Pessoal</SelectItem>
                      <SelectItem value="saude">💪 Saúde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              // Preview mode
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-medium">
                      {editedEvent.recorrente 
                        ? editedEvent.dias_semana.map(d => DIAS_SEMANA_OPTIONS.find(o => o.value === d)?.label || d).join(', ')
                        : formattedDate
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Horário</p>
                    <p className="font-medium">{editedEvent.hora} – {editedEvent.hora_fim}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Tag className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="font-medium">{tipoLabel} • {editedEvent.recorrente ? 'Recorrente' : 'Única vez'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-5 pt-0 flex gap-3">
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 h-12"
              size="lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {isLoading ? 'Salvando...' : 'Confirmar'}
            </Button>
            <Button
              onClick={onCancel}
              disabled={isLoading}
              variant="outline"
              className="h-12"
              size="lg"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ConfirmAgendaPopout;
