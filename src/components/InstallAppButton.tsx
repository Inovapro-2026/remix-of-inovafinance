import { Download, CheckCircle, Smartphone } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { toast } from 'sonner';

interface InstallAppButtonProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function InstallAppButton({ variant = 'default', className = '' }: InstallAppButtonProps) {
  const { isInstallable, isInstalled, installApp } = usePwaInstall();

  // Detectar iOS para mostrar instruções específicas
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Se já está instalado, mostrar indicador
  if (isInstalled) {
    return (
      <div className={`flex items-center justify-center gap-2 py-2 text-emerald-400 text-sm ${className}`}>
        <CheckCircle className="w-4 h-4" />
        <span>App instalado</span>
      </div>
    );
  }

  // Só mostrar o botão se for instalável (Chrome/Android) ou se for iOS
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      toast.success('App instalado com sucesso!');
    }
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleInstall}
        className={`flex items-center gap-2 py-2 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-primary text-sm ${className}`}
      >
        <Download className="w-4 h-4" />
        <span>Instalar App</span>
      </button>
    );
  }

  return (
    <div className={`mt-4 pt-4 border-t border-border ${className}`}>
      <button
        onClick={handleInstall}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-primary/50 bg-primary/10 hover:bg-primary/20 transition-colors text-primary font-medium shadow-lg shadow-primary/10"
      >
        {isIOS ? (
          <>
            <Smartphone className="w-5 h-5" />
            Adicionar à Tela de Início
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Instalar App
          </>
        )}
      </button>
      <p className="text-xs text-muted-foreground text-center mt-2">
        {isIOS
          ? 'Toque em Compartilhar → Adicionar à Tela de Início'
          : 'Instale o app para acesso rápido e modo offline'
        }
      </p>
    </div>
  );
}
