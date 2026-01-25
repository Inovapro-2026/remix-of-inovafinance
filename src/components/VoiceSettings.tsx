import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, Volume2, Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { isVoiceEnabled, setVoiceEnabled } from '@/services/isaVoiceService';

export function VoiceSettings() {
  const [isEnabled, setIsEnabled] = useState(() => isVoiceEnabled());
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = (checked: boolean) => {
    setIsEnabled(checked);
    setVoiceEnabled(checked);
    toast.success(checked ? 'Voz da assistente ativada' : 'Voz da assistente desativada');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Mic className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">🎙️ Voz da Assistente</CardTitle>
              <CardDescription>
                Configure se deseja que a INOVA fale com você
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50 transition-all hover:bg-muted/70">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Voz Ativa</p>
                <p className="text-sm text-muted-foreground">
                  A assistente usará a voz do seu navegador para te guiar
                </p>
              </div>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggle}
            />
          </div>

          <div className="p-4 rounded-lg bg-primary/5 text-sm text-muted-foreground space-y-2 border border-primary/10">
            <p className="font-medium text-foreground flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              Sobre a voz:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Usa a voz nativa otimizada do seu sistema</li>
              <li>Melhor desempenho e carregamento instantâneo</li>
              <li>Privacidade total (sem APIs externas de áudio)</li>
              <li>Sincronizado entre todas as abas do app</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
