import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CreditCard, 
  Search, 
  RefreshCcw, 
  Loader2,
  Users,
  TrendingUp,
  XCircle,
  DollarSign,
  Calendar
} from "lucide-react";
import { getSubscriptions, Subscription, SUBSCRIPTION_PRICE } from "@/services/adminAffiliateService";

export function AdminSubscriptionsPanel() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptions();
  }, []);

  useEffect(() => {
    if (search) {
      const filtered = subscriptions.filter(s => 
        s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.matricula.toString().includes(search)
      );
      setFilteredSubscriptions(filtered);
    } else {
      setFilteredSubscriptions(subscriptions);
    }
  }, [search, subscriptions]);

  const loadSubscriptions = async () => {
    setIsLoading(true);
    try {
      const data = await getSubscriptions();
      setSubscriptions(data);
      setFilteredSubscriptions(data);
    } catch (error) {
      console.error("Erro ao carregar assinaturas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as assinaturas.",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ativa</Badge>;
      case 'canceled':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Cancelada</Badge>;
      case 'expired':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Expirada</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>;
      case 'trial':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Trial</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{status || '-'}</Badge>;
    }
  };

  const getTypeBadge = (type: string | null) => {
    switch (type) {
      case 'monthly':
        return <Badge variant="outline" className="border-slate-600 text-slate-300">Mensal</Badge>;
      case 'yearly':
        return <Badge variant="outline" className="border-primary text-primary">Anual</Badge>;
      case 'lifetime':
        return <Badge variant="outline" className="border-amber-500 text-amber-400">Vitalício</Badge>;
      default:
        return <Badge variant="outline" className="border-slate-600 text-slate-400">{type || '-'}</Badge>;
    }
  };

  const activeSubscriptions = subscriptions.filter(s => s.subscription_status === 'active');
  const canceledSubscriptions = subscriptions.filter(s => s.subscription_status === 'canceled');
  const trialSubscriptions = subscriptions.filter(s => s.subscription_status === 'trial');
  const mrr = activeSubscriptions.length * SUBSCRIPTION_PRICE;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              Assinaturas
            </h1>
            <p className="text-slate-400 mt-1">Gerenciamento de assinantes</p>
          </div>
          <Button 
            onClick={loadSubscriptions} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
            className="border-slate-700 text-slate-300"
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Ativas</p>
                  <p className="text-lg font-bold text-green-400">{activeSubscriptions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Em Trial</p>
                  <p className="text-lg font-bold text-blue-400">{trialSubscriptions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Canceladas</p>
                  <p className="text-lg font-bold text-red-400">{canceledSubscriptions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">MRR</p>
                  <p className="text-lg font-bold text-amber-400">R$ {mrr.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total</p>
                  <p className="text-lg font-bold text-white">{subscriptions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, e-mail ou matrícula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-white"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Lista de Assinantes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma assinatura encontrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-400">Usuário</TableHead>
                      <TableHead className="text-slate-400">E-mail</TableHead>
                      <TableHead className="text-slate-400">Tipo</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Início</TableHead>
                      <TableHead className="text-slate-400">Fim</TableHead>
                      <TableHead className="text-slate-400">Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions.map((subscription) => (
                      <TableRow key={subscription.matricula} className="border-slate-700">
                        <TableCell>
                          <div>
                            <p className="text-white font-medium">{subscription.full_name || '-'}</p>
                            <p className="text-xs text-slate-400">#{subscription.matricula}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {subscription.email || '-'}
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(subscription.subscription_type)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(subscription.subscription_status)}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {subscription.subscription_start_date 
                            ? format(new Date(subscription.subscription_start_date), "dd/MM/yyyy", { locale: ptBR })
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {subscription.subscription_end_date 
                            ? format(new Date(subscription.subscription_end_date), "dd/MM/yyyy", { locale: ptBR })
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {format(new Date(subscription.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
