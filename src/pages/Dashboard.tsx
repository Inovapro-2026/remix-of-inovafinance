import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Receipt,
  ChevronRight,
  Volume2,
  VolumeX,
  MessageCircle,
  Edit3
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/contexts/AuthContext';
import { calculateBalance, getTransactions, updateProfile, type Transaction } from '@/lib/db';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { useIsaGreeting } from '@/hooks/useIsaGreeting';
import { isVoiceEnabled, setVoiceEnabled } from '@/services/isaVoiceService';
import { Switch } from '@/components/ui/switch';
import { ModeToggle } from '@/components/ModeToggle';
import { cn } from '@/lib/utils';
import { EditValueModal } from '@/components/EditValueModal';
import { toast } from 'sonner';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { RenewalModal, BlockedModal } from '@/components/SubscriptionModals';

const CHART_COLORS = ['#7A5CFA', '#4A90FF', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6'];

const WHATSAPP_NUMBER = '5511978197645';
const WHATSAPP_MESSAGE = 'Olá! Preciso de ajuda com o INOVAFINANCE';

const openWhatsAppSupport = () => {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  window.open(url, '_blank');
};

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useAuth();
  const [balance, setBalance] = useState(0);
  const [debitBalance, setDebitBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [chartData, setChartData] = useState<{ date: string; balance: number }[]>([]);
  const [voiceEnabled, setVoiceEnabledState] = useState(isVoiceEnabled());

  // Edit modals state
  const [editBalanceOpen, setEditBalanceOpen] = useState(false);

  // Use new subscription status hook
  const {
    isFreeTrial,
    isBlocked,
    isExpired,
    isExpiringSoon,
    hoursRemaining,
    minutesRemaining,
    timeRemainingText,
    showRenewalModal,
    showBlockedModal,
    closeRenewalModal,
  } = useSubscriptionStatus();

  // Only show WhatsApp button on home route
  const isHomePage = location.pathname === '/';

  // INOVA greeting on dashboard access
  useIsaGreeting({
    pageType: 'dashboard',
    userId: user?.userId || 0,
    userName: user?.fullName || '',
    initialBalance: user?.initialBalance || 0,
    enabled: !!user && voiceEnabled
  });

  const handleToggleVoice = () => {
    const newState = !voiceEnabled;
    setVoiceEnabledState(newState);
    setVoiceEnabled(newState);
  };

  // Handler para editar saldo disponível (ajusta o saldo inicial para que o saldo exibido fique exatamente no valor informado)
  const handleEditBalance = async (newDebitBalance: number) => {
    if (!user) return;

    await updateProfile(user.userId, { saldoAtual: newDebitBalance });
    await refreshUser();
    await loadData();
    toast.success('Saldo atualizado com sucesso!');
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, user?.initialBalance, user?.creditLimit]);

  // Reload data when page gets focus (after returning from AI page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        loadData();
      }
    };

    const handleFocus = () => {
      if (user) {
        loadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const { balance: bal, totalIncome: inc, totalExpense: exp, debitBalance: debit } = await calculateBalance(
      user.userId
    );
    setBalance(bal);
    setDebitBalance(Math.max(0, debit)); // Never show negative debit balance
    setTotalIncome(inc);
    setTotalExpense(exp);

    const txns = await getTransactions(user.userId);
    setTransactions(txns);

    // Process category data for pie chart
    const categoryMap = new Map<string, number>();
    txns.filter(t => t.type === 'expense').forEach(t => {
      const current = categoryMap.get(t.category) || 0;
      categoryMap.set(t.category, current + t.amount);
    });

    const catData = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
    setCategoryData(catData);

    // Process chart data for area chart (last 7 days)
    const last7Days: { date: string; balance: number }[] = [];
    let runningBalance = user.initialBalance;

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      const dayTxns = txns.filter(t => {
        const txnDate = new Date(t.date);
        return txnDate.toDateString() === date.toDateString();
      });

      dayTxns.forEach(t => {
        if (t.type === 'income') {
          runningBalance += t.amount;
        } else if (t.paymentMethod === 'debit' || !t.paymentMethod) {
          runningBalance -= t.amount;
        }
      });

      last7Days.push({ date: dateStr, balance: runningBalance });
    }

    setChartData(last7Days);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'HH:mm', { locale: ptBR });
  };

  // Get last 5 expenses for the card
  const lastExpenses = transactions
    .filter(t => t.type === 'expense')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Multiple AI insights with more intelligence
  const getAIInsights = (): { icon: string; title: string; description: string; type: 'success' | 'warning' | 'info' | 'danger' }[] => {
    const insights: { icon: string; title: string; description: string; type: 'success' | 'warning' | 'info' | 'danger' }[] = [];

    // Balance growth
    if (debitBalance > (user?.initialBalance || 0) * 1.1) {
      insights.push({
        icon: '📈',
        title: 'Crescimento Saudável',
        description: `Saldo cresceu ${Math.round(((debitBalance / (user?.initialBalance || 1)) - 1) * 100)}% desde o início`,
        type: 'success'
      });
    }

    // Spending warning
    if (totalExpense > totalIncome && totalIncome > 0) {
      insights.push({
        icon: '⚠️',
        title: 'Atenção aos Gastos',
        description: `Você gastou ${formatCurrency(totalExpense - totalIncome)} a mais do que ganhou`,
        type: 'danger'
      });
    }

    // Good savings rate
    if (totalIncome > 0 && totalExpense < totalIncome * 0.7) {
      const savingsRate = Math.round(((totalIncome - totalExpense) / totalIncome) * 100);
      insights.push({
        icon: '💰',
        title: 'Boa Taxa de Economia',
        description: `Você está economizando ${savingsRate}% dos seus ganhos`,
        type: 'success'
      });
    }

    // Category analysis
    if (categoryData.length > 0) {
      const topCategory = categoryData.reduce((prev, curr) => prev.value > curr.value ? prev : curr);
      insights.push({
        icon: '📊',
        title: 'Maior Categoria',
        description: `${topCategory.name}: ${formatCurrency(topCategory.value)} (${Math.round((topCategory.value / totalExpense) * 100)}%)`,
        type: 'info'
      });
    }

    // Credit card usage
    if (user?.creditLimit && user?.creditUsed) {
      const usagePercent = (user.creditUsed / user.creditLimit) * 100;
      if (usagePercent > 80) {
        insights.push({
          icon: '💳',
          title: 'Limite Alto',
          description: `${Math.round(usagePercent)}% do limite de crédito utilizado`,
          type: 'warning'
        });
      }
    }

    // Default insight
    if (insights.length === 0) {
      insights.push({
        icon: '💡',
        title: 'Comece a Registrar',
        description: 'Adicione transações para ver insights personalizados',
        type: 'info'
      });
    }

    return insights.slice(0, 3);
  };

  const aiInsights = getAIInsights();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="min-h-screen pb-28 px-4 pt-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Mode Toggle */}
      <ModeToggle />

      {/* Floating WhatsApp Support Button - Only on Home */}
      {isHomePage && (
        <motion.button
          onClick={openWhatsAppSupport}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-24 right-4 w-12 h-12 rounded-full bg-[#25D366] shadow-lg flex items-center justify-center z-50"
          aria-label="Suporte WhatsApp"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </motion.button>
      )}

      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Olá,</p>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {user?.fullName.split(' ')[0]} 👋
          </h1>
        </div>

        {/* Voice Toggle */}
        <div className="flex items-center gap-2">
          {voiceEnabled ? (
            <Volume2 className="w-4 h-4 text-primary" />
          ) : (
            <VolumeX className="w-4 h-4 text-muted-foreground" />
          )}
          <Switch
            checked={voiceEnabled}
            onCheckedChange={handleToggleVoice}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </motion.div>



      {/* Trial Status Banner */}
      {isFreeTrial && !isExpired && !isBlocked && (
        <motion.div
          variants={itemVariants}
          className="mb-6"
        >
          <GlassCard className="p-4 border-primary/40 bg-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">Teste Grátis Ativo</p>
                <p className="text-xs text-muted-foreground">Expira em: <span className="font-mono font-medium text-foreground">{timeRemainingText}</span></p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/subscription')} className="text-xs h-8">
              Assinar agora
            </Button>
          </GlassCard>
        </motion.div>
      )}

      {/* Renewal Modal (24h before expiration) */}
      <RenewalModal
        isOpen={showRenewalModal}
        onClose={closeRenewalModal}
        hoursRemaining={hoursRemaining}
        minutesRemaining={minutesRemaining}
      />

      {/* Blocked Modal (expired or blocked account) */}
      <BlockedModal
        isOpen={showBlockedModal}
        isExpired={isExpired}
      />

      {/* Bento Grid - Premium Tech Design */}
      <div className="bento-grid">
        {/* Balance Card - Large (Saldo Débito) - PREMIUM DESIGN */}
        <motion.div variants={itemVariants} className="bento-item-large">
          <GlassCard
            className="p-6 relative overflow-hidden border-success/30 cursor-pointer hover:border-success/50 transition-colors"
            glow
            onClick={() => setEditBalanceOpen(true)}
          >
            {/* Animated background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-success/10 via-transparent to-primary/10" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-success/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/15 rounded-full blur-2xl" />

            {/* Holographic line effect */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-success/50 to-transparent" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Saldo Disponível</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-emerald-500 font-bold">ATIVO</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Clique para editar</span>
                </div>
              </div>

              <h2 className="font-display text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(debitBalance)}
              </h2>

              {/* Mini stats bar */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/10">
                <div className="flex items-center gap-1.5">
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{formatCurrency(totalIncome)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ArrowDownRight className="w-3 h-3 text-rose-500" />
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">{formatCurrency(totalExpense)}</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Income Card - TECH STYLE */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-4 h-full relative overflow-hidden border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <ArrowUpRight className="w-5 h-5 text-white" />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-500/50" />
              </div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Entradas</p>
              <p className="font-bold text-xl text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalIncome)}
              </p>
              <div className="h-1 bg-emerald-500/20 rounded-full mt-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: totalIncome > 0 ? '100%' : '0%' }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Expense Card - TECH STYLE */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-4 h-full relative overflow-hidden border-rose-500/20 hover:border-rose-500/40 transition-colors">
            <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-full blur-xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <ArrowDownRight className="w-5 h-5 text-white" />
                </div>
                <TrendingDown className="w-4 h-4 text-rose-500/50" />
              </div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Saídas</p>
              <p className="font-bold text-xl text-rose-600 dark:text-rose-400">
                {formatCurrency(totalExpense)}
              </p>
              <div className="h-1 bg-rose-500/20 rounded-full mt-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: totalIncome > 0 ? `${Math.min((totalExpense / totalIncome) * 100, 100)}%` : '0%' }}
                  transition={{ duration: 1, delay: 0.7 }}
                />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* AI Insights Card - SMART TECH DESIGN */}
        <motion.div variants={itemVariants} className="bento-item-large">
          <GlassCard className="p-4 relative overflow-hidden border-primary/30">
            {/* Animated tech background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            {/* Scanning line effect */}
            <motion.div
              className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"
              initial={{ top: 0 }}
              animate={{ top: '100%' }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">INOVA Insights</p>
                  <p className="text-[10px] text-muted-foreground">Análise inteligente em tempo real</p>
                </div>
              </div>

              <div className="space-y-3">
                {aiInsights.map((insight, index) => (
                  <motion.div
                    key={index}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border transition-all",
                      insight.type === 'success' && "bg-success/5 border-success/20",
                      insight.type === 'warning' && "bg-warning/5 border-warning/20",
                      insight.type === 'danger' && "bg-destructive/5 border-destructive/20",
                      insight.type === 'info' && "bg-primary/5 border-primary/20"
                    )}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  >
                    <span className="text-xl">{insight.icon}</span>
                    <div>
                      <p className={cn(
                        "text-sm font-semibold",
                        insight.type === 'success' && "text-success",
                        insight.type === 'warning' && "text-warning",
                        insight.type === 'danger' && "text-destructive",
                        insight.type === 'info' && "text-primary"
                      )}>{insight.title}</p>
                      <p className="text-xs text-muted-foreground">{insight.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Area Chart - Balance Evolution - PREMIUM TECH */}
        <motion.div variants={itemVariants} className="bento-item-large">
          <GlassCard className="p-4 relative overflow-hidden">
            {/* Grid background effect */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground dark:text-white">Evolução do Saldo</h3>
                    <p className="text-[10px] text-muted-foreground">Últimos 7 dias</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 border border-success/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] text-success font-medium">LIVE</span>
                </div>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px hsl(var(--primary) / 0.2)',
                      }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => [formatCurrency(value), 'Saldo']}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      fill="url(#balanceGradient)"
                      filter="url(#glow)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Pie Chart - Categories - PREMIUM TECH */}
        <motion.div variants={itemVariants} className="bento-item-large">
          <GlassCard className="p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Gastos por Categoria</h3>
                    <p className="text-[10px] text-muted-foreground">Distribuição mensal</p>
                  </div>
                </div>
              </div>

              {categoryData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <div className="w-36 h-36 relative">
                    {/* Center text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">{categoryData.length}</p>
                        <p className="text-[10px] text-muted-foreground">categorias</p>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          {CHART_COLORS.map((color, index) => (
                            <linearGradient key={`gradient-${index}`} id={`pieGradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor={color} stopOpacity={1} />
                              <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                            </linearGradient>
                          ))}
                        </defs>
                        <Pie
                          data={categoryData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={55}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {categoryData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={`url(#pieGradient-${index % CHART_COLORS.length})`}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {categoryData.slice(0, 4).map((cat, index) => (
                      <motion.div
                        key={cat.name}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full shadow-lg"
                            style={{
                              backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                              boxShadow: `0 0 8px ${CHART_COLORS[index % CHART_COLORS.length]}40`
                            }}
                          />
                          <span className="text-xs font-bold capitalize text-foreground dark:text-white">
                            {cat.name}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(cat.value)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                    <Receipt className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground text-sm">Nenhum gasto registrado</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Adicione gastos para ver o gráfico</p>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Last Expenses Card */}
        <motion.div variants={itemVariants} className="bento-item-large">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground dark:text-white">Últimos Gastos</h3>
              </div>
              <button
                onClick={() => navigate('/statement')}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Extrato completo
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {lastExpenses.length > 0 ? (
              <div className="space-y-3">
                {lastExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                        <ArrowDownRight className="w-4 h-4 text-rose-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground dark:text-white">
                          {expense.description || expense.category}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {expense.category} • {formatTime(expense.date.toString())}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                      -{formatCurrency(expense.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">
                Nenhum gasto registrado ainda
              </p>
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* Edit Balance Modal */}
      <EditValueModal
        open={editBalanceOpen}
        onOpenChange={setEditBalanceOpen}
        title="Editar Saldo Inicial"
        description="Altere o valor do seu saldo inicial (débito)"
        currentValue={user?.initialBalance || 0}
        onSave={handleEditBalance}
        type="currency"
      />
    </motion.div >
  );
}
