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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { 
  Wallet, 
  Search, 
  RefreshCcw, 
  Loader2,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  Eye
} from "lucide-react";
import { getWithdrawals, Withdrawal } from "@/services/adminAffiliateService";

export function AdminWithdrawalsPanel() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadWithdrawals();
  }, []);

  useEffect(() => {
    if (search) {
      const filtered = withdrawals.filter(w => 
        w.affiliate_name?.toLowerCase().includes(search.toLowerCase()) ||
        w.affiliate_matricula.toString().includes(search) ||
        w.pix_key?.includes(search)
      );
      setFilteredWithdrawals(filtered);
    } else {
      setFilteredWithdrawals(withdrawals);
    }
  }, [search, withdrawals]);

  const loadWithdrawals = async () => {
    setIsLoading(true);
    try {
      const data = await getWithdrawals();
      setWithdrawals(data);
      setFilteredWithdrawals(data);
    } catch (error) {
      console.error("Erro ao carregar saques:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os saques.",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const handleApprove = async (withdrawal: Withdrawal) => {
    try {
      const { error } = await supabase
        .from('affiliate_withdrawals')
        .update({ 
          status: 'approved',
          processed_at: new Date().toISOString()
        })
        .eq('id', withdrawal.id);

      if (error) throw error;

      toast({
        title: "Saque aprovado",
        description: `Saque de R$ ${withdrawal.amount.toFixed(2)} foi aprovado.`
      });
      loadWithdrawals();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o saque.",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (withdrawal: Withdrawal) => {
    try {
      // Return balance to affiliate
      const { data: affiliate } = await supabase
        .from('users_matricula')
        .select('affiliate_balance')
        .eq('matricula', withdrawal.affiliate_matricula)
        .single();

      if (affiliate) {
        const newBalance = (affiliate.affiliate_balance || 0) + withdrawal.amount;
        await supabase
          .from('users_matricula')
          .update({ affiliate_balance: newBalance })
          .eq('matricula', withdrawal.affiliate_matricula);
      }

      const { error } = await supabase
        .from('affiliate_withdrawals')
        .update({ 
          status: 'rejected',
          processed_at: new Date().toISOString()
        })
        .eq('id', withdrawal.id);

      if (error) throw error;

      toast({
        title: "Saque rejeitado",
        description: "O saldo foi devolvido ao afiliado."
      });
      loadWithdrawals();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar o saque.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Aprovado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejeitado</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  const getPixTypeBadge = (type: string | null) => {
    if (!type) return '-';
    const types: Record<string, string> = {
      cpf: 'CPF',
      phone: 'Telefone',
      email: 'E-mail',
      random: 'Aleatória'
    };
    return types[type] || type;
  };

  const totalPending = withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0);
  const totalApproved = withdrawals.filter(w => w.status === 'approved').reduce((sum, w) => sum + w.amount, 0);
  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;

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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              Saques
            </h1>
            <p className="text-slate-400 mt-1">Gerenciamento de solicitações de saque</p>
          </div>
          <Button 
            onClick={loadWithdrawals} 
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Pendentes</p>
                  <p className="text-lg font-bold text-yellow-400">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Valor Pendente</p>
                  <p className="text-lg font-bold text-orange-400">R$ {totalPending.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Pago</p>
                  <p className="text-lg font-bold text-green-400">R$ {totalApproved.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Solicitações</p>
                  <p className="text-lg font-bold text-white">{withdrawals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por afiliado ou chave PIX..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-white"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Solicitações de Saque</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredWithdrawals.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma solicitação encontrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-400">Afiliado</TableHead>
                      <TableHead className="text-slate-400">Valor</TableHead>
                      <TableHead className="text-slate-400">Chave PIX</TableHead>
                      <TableHead className="text-slate-400">Tipo</TableHead>
                      <TableHead className="text-slate-400">Solicitado em</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWithdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.id} className="border-slate-700">
                        <TableCell>
                          <div>
                            <p className="text-white font-medium">{withdrawal.affiliate_name || '-'}</p>
                            <p className="text-xs text-slate-400">#{withdrawal.affiliate_matricula}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-green-400 font-semibold">
                            R$ {withdrawal.amount.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-300 font-mono text-sm">
                          {withdrawal.pix_key || '-'}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {getPixTypeBadge(withdrawal.pix_key_type)}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {format(new Date(withdrawal.requested_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(withdrawal.status)}
                        </TableCell>
                        <TableCell>
                          {withdrawal.status === 'pending' ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4 text-slate-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                                <DropdownMenuItem 
                                  onClick={() => handleApprove(withdrawal)}
                                  className="text-green-400 focus:bg-green-500/20 focus:text-green-400"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Aprovar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleReject(withdrawal)}
                                  className="text-red-400 focus:bg-red-500/20 focus:text-red-400"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Rejeitar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-xs text-slate-500">
                              {withdrawal.processed_at && format(new Date(withdrawal.processed_at), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          )}
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
