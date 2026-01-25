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
  Coins, 
  Search, 
  RefreshCcw, 
  Loader2,
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp
} from "lucide-react";
import { getCommissions, Commission, SUBSCRIPTION_PRICE, COMMISSION_RATE } from "@/services/adminAffiliateService";

export function AdminCommissionsPanel() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [filteredCommissions, setFilteredCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadCommissions();
  }, []);

  useEffect(() => {
    if (search) {
      const filtered = commissions.filter(c => 
        c.affiliate_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.invited_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.affiliate_matricula.toString().includes(search) ||
        c.invited_matricula.toString().includes(search)
      );
      setFilteredCommissions(filtered);
    } else {
      setFilteredCommissions(commissions);
    }
  }, [search, commissions]);

  const loadCommissions = async () => {
    setIsLoading(true);
    try {
      const data = await getCommissions();
      setCommissions(data);
      setFilteredCommissions(data);
    } catch (error) {
      console.error("Erro ao carregar comissões:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as comissões.",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'released':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Paga</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  const totalPending = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);
  const totalReleased = commissions.filter(c => c.status === 'released').reduce((sum, c) => sum + c.amount, 0);
  const commissionValue = SUBSCRIPTION_PRICE * COMMISSION_RATE;

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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Coins className="w-5 h-5 text-white" />
              </div>
              Comissões
            </h1>
            <p className="text-slate-400 mt-1">Gerenciamento de comissões de afiliados</p>
          </div>
          <Button 
            onClick={loadCommissions} 
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
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Valor por Comissão</p>
                  <p className="text-lg font-bold text-white">R$ {commissionValue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Pendentes</p>
                  <p className="text-lg font-bold text-yellow-400">R$ {totalPending.toFixed(2)}</p>
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
                  <p className="text-xs text-slate-400">Pagas</p>
                  <p className="text-lg font-bold text-green-400">R$ {totalReleased.toFixed(2)}</p>
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
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Geral</p>
                  <p className="text-lg font-bold text-white">R$ {(totalPending + totalReleased).toFixed(2)}</p>
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
            placeholder="Buscar por afiliado ou indicado..."
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
            <CardTitle className="text-white text-lg">Histórico de Comissões</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredCommissions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Coins className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma comissão encontrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-400">Afiliado</TableHead>
                      <TableHead className="text-slate-400">Indicado</TableHead>
                      <TableHead className="text-slate-400">Valor</TableHead>
                      <TableHead className="text-slate-400">Data</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Liberação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCommissions.map((commission) => (
                      <TableRow key={commission.id} className="border-slate-700">
                        <TableCell>
                          <div>
                            <p className="text-white font-medium">{commission.affiliate_name || '-'}</p>
                            <p className="text-xs text-slate-400">#{commission.affiliate_matricula}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-white">{commission.invited_name || '-'}</p>
                            <p className="text-xs text-slate-400">#{commission.invited_matricula}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-green-400 font-semibold">
                            R$ {commission.amount.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {format(new Date(commission.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(commission.status)}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {commission.released_at 
                            ? format(new Date(commission.released_at), "dd/MM/yyyy", { locale: ptBR })
                            : '-'
                          }
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
