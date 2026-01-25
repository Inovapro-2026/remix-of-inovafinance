import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Wifi, Eye, EyeOff, Fingerprint, Calendar, AlertCircle, Edit3 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/contexts/AuthContext';
import { calculateBalance, updateProfile } from '@/lib/db';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  isBiometricSupported,
  isPlatformAuthenticatorAvailable,
  isBiometricEnabled,
  registerBiometric,
  disableBiometric
} from '@/services/biometricService';
import { useIsaGreeting } from '@/hooks/useIsaGreeting';
import { cn } from '@/lib/utils';
import { EditValueModal } from '@/components/EditValueModal';

export default function Card() {
  const { user, refreshUser } = useAuth();
  const [isFlipped, setIsFlipped] = useState(false);
  const [showCVV, setShowCVV] = useState(false);
  const [creditUsed, setCreditUsed] = useState(0);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  // Edit modals state
  const [editCreditLimitOpen, setEditCreditLimitOpen] = useState(false);
  const [editDueDayOpen, setEditDueDayOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
    checkBiometricStatus();
  }, [user]);

  const checkBiometricStatus = async () => {
    const supported = isBiometricSupported();
    const available = await isPlatformAuthenticatorAvailable();
    const enabled = isBiometricEnabled();

    setBiometricAvailable(supported && available);
    setBiometricEnabled(enabled);
  };

  const handleBiometricToggle = async (checked: boolean) => {
    if (!user) return;

    setBiometricLoading(true);

    try {
      if (checked) {
        const success = await registerBiometric(user.userId, user.fullName);
        if (success) {
          setBiometricEnabled(true);
          toast.success('Biometria ativada com sucesso!');
        } else {
          toast.error('Não foi possível ativar a biometria');
        }
      } else {
        disableBiometric();
        setBiometricEnabled(false);
        toast.success('Biometria desativada');
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
      toast.error('Erro ao configurar biometria');
    } finally {
      setBiometricLoading(false);
    }
  };

  const loadData = async () => {
    if (!user) return;
    await refreshUser();
    const { creditUsed: used } = await calculateBalance(user.userId);
    setCreditUsed(used);
  };

  const creditLimit = user?.creditLimit || 0;
  const availableCredit = Math.max(0, creditLimit - (user?.creditUsed || 0));
  const creditPercentUsed = creditLimit > 0 ? ((user?.creditUsed || 0) / creditLimit) * 100 : 0;

  // ISA greeting for Card page
  useIsaGreeting({
    pageType: 'card',
    userId: user?.userId || 0,
    userName: user?.fullName || '',
    initialBalance: user?.initialBalance || 0,
    enabled: !!user,
    creditLimit: creditLimit,
    creditUsed: user?.creditUsed || 0,
    creditDueDay: user?.creditDueDay || 5
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatCardNumber = () => {
    const baseNumber = user?.userId.toString().padStart(16, '4532') || '4532000000000000';
    return baseNumber.match(/.{1,4}/g)?.join(' ') || '';
  };

  const getExpiryDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 3);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
  };

  const getDueDate = () => {
    const dueDay = user?.creditDueDay || 5;
    const today = new Date();
    let dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
    if (today.getDate() > dueDay) {
      dueDate = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
    }
    return dueDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
    });
  };

  const getDaysUntilDue = () => {
    const dueDay = user?.creditDueDay || 5;
    const today = new Date();
    let dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
    if (today.getDate() > dueDay) {
      dueDate = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
    }
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Handler para editar dia de vencimento
  const handleEditDueDay = async (newDueDay: number) => {
    if (!user) return;
    await updateProfile(user.userId, { creditDueDay: newDueDay });
    await refreshUser();
    toast.success(`Data de vencimento alterada para dia ${newDueDay}`);
  };

  // Handler para editar limite de crédito
  const handleEditCreditLimit = async (newValue: number) => {
    if (!user) return;
    await updateProfile(user.userId, { creditLimit: newValue });
    await refreshUser();
    await loadData();
    toast.success('Limite de crédito atualizado com sucesso!');
  };

  const daysUntilDue = getDaysUntilDue();

  return (
    <motion.div
      className="min-h-screen pb-28 px-4 pt-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-display text-2xl font-bold">INOVA BANK</h1>
        <p className="text-muted-foreground text-sm">Seu cartão premium</p>
      </motion.div>

      {/* 3D Card Container */}
      <div
        className="mb-8"
        style={{ perspective: '1200px' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            rotateY: isFlipped ? 180 : 0
          }}
          transition={{
            opacity: { duration: 0.3 },
            y: { duration: 0.3 },
            rotateY: { duration: 0.8, ease: [0.23, 1, 0.32, 1] }
          }}
          className="relative w-full aspect-[1.586/1] max-w-sm mx-auto cursor-pointer group"
          style={{ transformStyle: 'preserve-3d' }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* FRONT FACE */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              zIndex: 2
            }}
          >
            <div className="w-full h-full rounded-[24px] p-6 md:p-8 relative bg-zinc-950 border border-white/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8),0_0_20px_rgba(255,255,255,0.05)_inset] overflow-hidden flex flex-col justify-between">
              {/* Premium Brushed Metal Surface */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-black to-[#0a0a0a]" />

              {/* Subtle metallic texture/grain */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />

              {/* Dynamic Light Reflection Effect */}
              <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/[0.08] to-transparent rotate-[35deg] transition-transform duration-1000 group-hover:translate-x-1/4" />

              {/* Top Row - Premium Logo */}
              <div className="relative z-10 flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center border border-white/10 shadow-inner">
                    <Shield className="w-5 h-5 md:w-7 md:h-7 text-zinc-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]" />
                  </div>
                  <div className="flex flex-col">
                    <span
                      className="font-display font-extrabold text-lg md:text-xl tracking-tight leading-none"
                      style={{
                        background: 'linear-gradient(180deg, #ffffff 0%, #d4d4d8 50%, #71717a 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 2px 2px rgba(0,0,0,1))'
                      }}
                    >
                      INOVA BANK
                    </span>
                    <span className="text-[8px] md:text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase mt-0.5">Premium Black</span>
                  </div>
                </div>
                <Wifi className="w-6 h-6 md:w-7 md:h-7 text-zinc-600/50 rotate-90" />
              </div>

              {/* Refined Gold Chip & Number */}
              <div className="relative z-10 space-y-6">
                {/* Chip */}
                <div className="relative w-12 h-9 md:w-14 md:h-10 rounded-lg bg-gradient-to-br from-[#ffd700] via-[#b8860b] to-[#8b4513] shadow-[0_2px_10px_rgba(184,134,11,0.3)] overflow-hidden border border-black/20">
                  <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]" />
                  <div className="w-full h-full grid grid-cols-3 gap-px p-1 md:p-1.5 opacity-80">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="border border-black/20 rounded-sm" />
                    ))}
                  </div>
                </div>

                {/* Card Number */}
                <p
                  className="font-mono text-lg md:text-2xl tracking-[0.14em] font-bold truncate"
                  style={{
                    background: 'linear-gradient(180deg, #f4f4f5 0%, #a1a1aa 50%, #3f3f46 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 2px 3px rgba(0,0,0,1))'
                  }}
                >
                  {formatCardNumber()}
                </p>
              </div>

              {/* Bottom Row - User Detail Section */}
              <div className="relative z-10 flex justify-between items-end">
                <div className="space-y-0.5 md:space-y-1">
                  <p className="text-[8px] md:text-[9px] text-zinc-500 font-bold uppercase tracking-widest opacity-60">Titular</p>
                  <p
                    className="font-bold text-sm md:text-base uppercase tracking-wider truncate max-w-[180px]"
                    style={{
                      background: 'linear-gradient(180deg, #ffffff 0%, #d4d4d8 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))'
                    }}
                  >
                    {user?.fullName || 'NOME DO TITULAR'}
                  </p>
                </div>
                <div className="text-right space-y-0.5 md:space-y-1">
                  <p className="text-[8px] md:text-[9px] text-zinc-500 font-bold uppercase tracking-widest opacity-60">Validade</p>
                  <p
                    className="font-mono text-sm md:text-base font-bold"
                    style={{
                      background: 'linear-gradient(180deg, #ffffff 0%, #d4d4d8 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {getExpiryDate()}
                  </p>
                </div>
              </div>

              {/* Subtle inner border glow */}
              <div className="absolute inset-0 rounded-[24px] border border-white/10 pointer-events-none" />
            </div>
          </div>

          {/* BACK FACE */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              zIndex: 1
            }}
          >
            <div className="w-full h-full rounded-[24px] bg-gradient-to-br from-[#0c0c0c] via-zinc-950 to-[#050505] border border-white/5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col group">
              {/* Magnetic Strip */}
              <div className="mt-6 h-10 md:h-12 bg-[#1a1a1a] shadow-inner w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)]" />
              </div>

              {/* CVV & Signature Area */}
              <div className="mt-4 md:mt-6 px-6 w-full">
                <div className="bg-white/5 border border-white/5 rounded-lg p-2 md:p-3 w-full backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[7px] md:text-[8px] text-zinc-500 font-bold uppercase tracking-tighter mb-1">Assinatura Autorizada</p>
                      <div className="w-24 md:w-32 h-6 md:h-8 bg-white/10 rounded flex items-center px-2 relative overflow-hidden">
                        <div className="absolute inset-0 repeating-linear-gradient-45 from-transparent to-white/5" />
                        <span className="text-[10px] md:text-[12px] italic text-zinc-400 opacity-70 font-serif whitespace-nowrap z-10">Authorized Signature</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] md:text-[10px] text-zinc-500 font-bold mb-1">CVV</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCVV(!showCVV);
                        }}
                        className="flex items-center gap-2 bg-black/40 px-3 py-1.5 md:px-4 md:py-2 rounded-md border border-white/5 hover:bg-black/60 transition-colors"
                      >
                        <span className="font-mono text-white font-bold text-xs md:text-sm tracking-widest">
                          {showCVV ? '742' : '•••'}
                        </span>
                        {showCVV ? (
                          <EyeOff className="w-3 h-3 md:w-3.5 md:h-3.5 text-zinc-400" />
                        ) : (
                          <Eye className="w-3 h-3 md:w-3.5 md:h-3.5 text-zinc-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Bank Info */}
              <div className="flex-1 flex flex-col items-center justify-center px-6 w-full mt-2">
                <div className="w-full p-3 md:p-4 rounded-xl bg-gradient-to-r from-transparent via-white/[0.03] to-transparent border-y border-white/5 text-center">
                  <p className="text-[8px] md:text-[9px] text-zinc-500 uppercase tracking-[0.2em] mb-1">Limite Disponível</p>
                  <p className="font-display text-xl md:text-2xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    {formatCurrency(availableCredit)}
                  </p>
                </div>
              </div>

              {/* Footer Symbols */}
              <div className="px-6 pb-6 flex justify-between items-center opacity-40 w-full mt-auto">
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3 md:w-4 md:h-4 text-zinc-400" />
                  <span className="text-[7px] md:text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">Secure Chip</span>
                </div>
                <div className="flex gap-3 md:gap-4 items-center">
                  <Fingerprint className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" />
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-linear-to-br from-zinc-800 to-black border border-white/10 shadow-inner flex items-center justify-center">
                    <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-zinc-900 border border-white/5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tip */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center text-muted-foreground text-sm mb-8"
      >
        Toque no cartão para virar
      </motion.p>

      {/* Card Info */}
      <div className="space-y-4">
        {/* Limite do Cartão com Progress */}
        <GlassCard
          className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setEditCreditLimitOpen(true)}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-muted-foreground text-xs">Limite Total</p>
              <p className="font-semibold text-lg">{formatCurrency(creditLimit)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-muted-foreground" />
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Usado: {formatCurrency(user?.creditUsed || 0)}</span>
              <span className="text-secondary">Disponível: {formatCurrency(availableCredit)}</span>
            </div>
            <Progress
              value={creditPercentUsed}
              className="h-2 bg-muted"
            />
          </div>
        </GlassCard>

        {/* Fatura Atual */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs">Fatura Atual</p>
              <p className={`font-bold text-lg ${(user?.creditUsed || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {formatCurrency(user?.creditUsed || 0)}
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-bold ${(user?.creditUsed || 0) === 0
              ? 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30'
              : 'text-rose-600 bg-rose-100 dark:text-rose-400 dark:bg-rose-900/30'
              }`}>
              {(user?.creditUsed || 0) === 0 ? 'Sem pendências' : 'Em aberto'}
            </span>
          </div>
        </GlassCard>

        {/* Data de Vencimento - Clicável */}
        <GlassCard
          className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setEditDueDayOpen(true)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Data limite</p>
                <p className="font-medium text-sm">{getDueDate()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-muted-foreground" />
              {daysUntilDue !== null && (
                <span className={`text-xs px-2 py-1 rounded-full ${daysUntilDue > 7
                  ? 'text-success bg-success/20'
                  : daysUntilDue > 0
                    ? 'text-warning bg-warning/20'
                    : 'text-destructive bg-destructive/20'
                  }`}>
                  {daysUntilDue > 0 ? `${daysUntilDue} dias` : 'Vencida'}
                </span>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Biometria */}
        {biometricAvailable && (
          <GlassCard className="p-4">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${biometricEnabled ? 'bg-primary/20' : 'bg-muted'
                }`}>
                <Fingerprint className={`w-5 h-5 ${biometricEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Desbloqueio biométrico</p>
                <p className="text-muted-foreground text-xs">
                  {biometricEnabled
                    ? 'Digital ou Face ID ativo'
                    : 'Ative para login rápido'}
                </p>
              </div>
              <Switch
                checked={biometricEnabled}
                onCheckedChange={handleBiometricToggle}
                disabled={biometricLoading}
              />
            </div>
          </GlassCard>
        )}

        {!biometricAvailable && (
          <GlassCard className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Fingerprint className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Biometria</p>
                <p className="text-muted-foreground text-xs">
                  Não disponível neste dispositivo
                </p>
              </div>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Edit Credit Limit Modal */}
      <EditValueModal
        open={editCreditLimitOpen}
        onOpenChange={setEditCreditLimitOpen}
        title="Editar Limite de Crédito"
        description="Altere o valor do seu limite de crédito"
        currentValue={user?.creditLimit || 0}
        onSave={handleEditCreditLimit}
        type="currency"
      />

      {/* Edit Due Day Modal */}
      <EditValueModal
        open={editDueDayOpen}
        onOpenChange={setEditDueDayOpen}
        title="Editar Dia de Vencimento"
        description="Escolha o dia do mês para vencimento da fatura (1-31)"
        currentValue={user?.creditDueDay || 5}
        onSave={handleEditDueDay}
        type="day"
        minValue={1}
        maxValue={31}
      />
    </motion.div>
  );
}
