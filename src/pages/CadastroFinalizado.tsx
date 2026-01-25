import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Copy, Check, Clock, AlertTriangle, Key, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { InstallAppButton } from '@/components/InstallAppButton';

const CadastroFinalizado = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  
  const matricula = searchParams.get('matricula') || '';
  const formattedMatricula = `IFN-${matricula}`;

  useEffect(() => {
    // If no matricula in URL, redirect to login
    if (!matricula) {
      navigate('/login');
    }
  }, [matricula, navigate]);

  const handleCopyAndRedirect = async () => {
    try {
      await navigator.clipboard.writeText(formattedMatricula);
      setCopied(true);
      toast.success('Matrícula copiada!');
      
      // Redirect to login after a brief moment
      setTimeout(() => {
        navigate(`/login?matricula=${matricula}`);
      }, 1500);
    } catch (error) {
      // Fallback for browsers without clipboard API
      toast.error('Não foi possível copiar. Anote sua matrícula.');
    }
  };

  const handleGoToLogin = () => {
    navigate(`/login?matricula=${matricula}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Success Card */}
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-6"
          >
            <h1 className="text-2xl font-bold text-foreground mb-2">
              🎉 Cadastro realizado com sucesso!
            </h1>
            <p className="text-muted-foreground">
              Sua conta no INOVAFINACE foi criada.
            </p>
          </motion.div>

          {/* Matricula Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-primary/10 border border-primary/30 rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Key className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Sua Matrícula</span>
            </div>
            <p className="text-3xl font-bold text-center text-primary font-mono tracking-wider">
              {formattedMatricula}
            </p>
          </motion.div>

          {/* Copy Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <Button
              onClick={handleCopyAndRedirect}
              className="w-full h-14 text-lg gap-3 bg-primary hover:bg-primary/90"
              disabled={copied}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  Copiado! Redirecionando...
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copiar matrícula e fazer login
                </>
              )}
            </Button>
          </motion.div>

          {/* Trial Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4"
          >
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-500 mb-1">
                  Teste grátis de 7 dias ativado!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Durante esse período você pode usar todas as funções do sistema, 
                  sem nenhuma cobrança. Após os 7 dias, será necessário realizar o 
                  pagamento para continuar utilizando o INOVAFINACE.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Warning */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
                  Importante
                </h3>
                <p className="text-sm text-muted-foreground">
                  Caso não haja pagamento após os 7 dias, o acesso ao sistema será 
                  automaticamente bloqueado.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="space-y-2 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <span className="text-primary">📘</span>
              <span>Guarde sua matrícula - ela será usada sempre para login</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary">🔐</span>
              <span>Não utilizamos e-mail ou senha</span>
            </div>
          </motion.div>

          {/* Install App Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
          >
            <InstallAppButton />
          </motion.div>

          {/* Secondary button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-4"
          >
            <Button
              variant="ghost"
              onClick={handleGoToLogin}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              Ir para login
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default CadastroFinalizado;
