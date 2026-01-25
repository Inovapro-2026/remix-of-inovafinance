import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, DollarSign, TrendingUp, Users, UserX, UsersRound, Link2, Wallet, Receipt } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { 
  getRevenueStats, 
  getDailyRevenue, 
  getMonthlyRevenue,
  getSales,
  SUBSCRIPTION_PRICE,
  type RevenueStats,
  type DailyRevenue,
  type MonthlyRevenue
} from "@/services/adminAffiliateService";

const COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899'];

export function AdminRevenuePanel() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [dailyData, setDailyData] = useState<DailyRevenue[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [distributionData, setDistributionData] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [revenueStats, daily, monthly, sales] = await Promise.all([
        getRevenueStats(),
        getDailyRevenue(30),
        getMonthlyRevenue(12),
        getSales()
      ]);
      
      setStats(revenueStats);
      setDailyData(daily);
      setMonthlyData(monthly);

      // Calculate distribution
      const approvedSales = sales.filter(s => s.payment_status === 'approved');
      const affiliateSales = approvedSales.filter(s => s.is_affiliate_sale).length;
      const directSales = approvedSales.length - affiliateSales;
      
      setDistributionData([
        { name: 'Vendas Diretas', value: directSales * SUBSCRIPTION_PRICE, color: '#3b82f6' },
        { name: 'Vendas Afiliados', value: affiliateSales * SUBSCRIPTION_PRICE, color: '#10b981' }
      ]);
    } catch (error) {
      console.error('Error loading revenue data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { title: "Faturamento Total", value: formatCurrency(stats.total), icon: DollarSign, color: "text-emerald-400", bgColor: "bg-emerald-500/20" },
    { title: "Faturamento do Mês", value: formatCurrency(stats.month), icon: TrendingUp, color: "text-blue-400", bgColor: "bg-blue-500/20" },
    { title: "Faturamento da Semana", value: formatCurrency(stats.week), icon: TrendingUp, color: "text-purple-400", bgColor: "bg-purple-500/20" },
    { title: "Faturamento de Hoje", value: formatCurrency(stats.today), icon: TrendingUp, color: "text-orange-400", bgColor: "bg-orange-500/20" },
    { title: "Assinantes Ativos", value: stats.totalSubscribers.toString(), icon: Users, color: "text-green-400", bgColor: "bg-green-500/20" },
    { title: "Assinaturas Canceladas", value: stats.canceledSubscriptions.toString(), icon: UserX, color: "text-red-400", bgColor: "bg-red-500/20" },
    { title: "Afiliados Ativos", value: stats.totalAffiliates.toString(), icon: UsersRound, color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
    { title: "Total de Indicações", value: stats.totalIndicacoes.toString(), icon: Link2, color: "text-indigo-400", bgColor: "bg-indigo-500/20" },
    { title: "Comissões Pagas", value: formatCurrency(stats.totalCommissionsPaid), icon: Wallet, color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
    { title: "Saques Realizados", value: formatCurrency(stats.totalWithdrawals), icon: Receipt, color: "text-pink-400", bgColor: "bg-pink-500/20" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Geral</h1>
          <p className="text-slate-400 text-sm">Métricas financeiras em tempo real • Valor fixo: {formatCurrency(SUBSCRIPTION_PRICE)}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors h-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 truncate">{stat.title}</p>
                    <p className={`text-lg font-bold ${stat.color} truncate`}>{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-white">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Faturamento por Dia (Últimos 30 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      fontSize={10}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={11}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-white">
                <UsersRound className="w-4 h-4 text-emerald-400" />
                Distribuição de Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Monthly Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <DollarSign className="w-4 h-4 text-purple-400" />
              Faturamento por Mês (Últimos 12 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#94a3b8" 
                    fontSize={11}
                    tickFormatter={(value) => {
                      const [year, month] = value.split('-');
                      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', { month: 'short' });
                    }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11}
                    tickFormatter={(value) => `R$ ${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                  />
                  <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
