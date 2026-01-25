import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, ShoppingCart, Filter, Download, RefreshCw } from "lucide-react";
import { getSales, SUBSCRIPTION_PRICE, type Sale } from "@/services/adminAffiliateService";
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

type FilterPeriod = 'all' | 'today' | 'week' | 'month' | 'custom';

export function AdminSalesPanel() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("all");
  const [filterType, setFilterType] = useState<'all' | 'affiliate' | 'direct'>("all");
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending' | 'rejected'>("all");

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sales, searchTerm, filterPeriod, filterType, filterStatus]);

  const loadSales = async () => {
    try {
      setIsLoading(true);
      const data = await getSales();
      setSales(data);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...sales];

    // Period filter
    const now = new Date();
    if (filterPeriod === 'today') {
      const start = startOfDay(now).toISOString();
      result = result.filter(s => s.created_at >= start);
    } else if (filterPeriod === 'week') {
      const start = subWeeks(now, 1).toISOString();
      result = result.filter(s => s.created_at >= start);
    } else if (filterPeriod === 'month') {
      const start = subMonths(now, 1).toISOString();
      result = result.filter(s => s.created_at >= start);
    }

    // Type filter
    if (filterType === 'affiliate') {
      result = result.filter(s => s.is_affiliate_sale);
    } else if (filterType === 'direct') {
      result = result.filter(s => !s.is_affiliate_sale);
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(s => s.payment_status === filterStatus);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.full_name.toLowerCase().includes(term) ||
        s.id.toLowerCase().includes(term) ||
        (s.affiliate_name && s.affiliate_name.toLowerCase().includes(term))
      );
    }

    setFilteredSales(result);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate summary stats
  const approvedSales = filteredSales.filter(s => s.payment_status === 'approved');
  const totalRevenue = approvedSales.length * SUBSCRIPTION_PRICE;
  const affiliateSales = approvedSales.filter(s => s.is_affiliate_sale);
  const totalCommissions = affiliateSales.length * SUBSCRIPTION_PRICE * 0.5;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vendas</h1>
          <p className="text-slate-400 text-sm">Gerenciamento de todas as vendas • Valor fixo: {formatCurrency(SUBSCRIPTION_PRICE)}</p>
        </div>
        <Button onClick={loadSales} variant="outline" size="sm" className="border-slate-600">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Total de Vendas</p>
            <p className="text-2xl font-bold text-white">{filteredSales.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Vendas Aprovadas</p>
            <p className="text-2xl font-bold text-green-400">{approvedSales.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Faturamento</p>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Comissões Geradas</p>
            <p className="text-2xl font-bold text-yellow-400">{formatCurrency(totalCommissions)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome, ID ou afiliado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700/50 border-slate-600"
              />
            </div>
            
            <Select value={filterPeriod} onValueChange={(v) => setFilterPeriod(v as FilterPeriod)}>
              <SelectTrigger className="w-[140px] bg-slate-700/50 border-slate-600">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
              <SelectTrigger className="w-[140px] bg-slate-700/50 border-slate-600">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="affiliate">Afiliado</SelectItem>
                <SelectItem value="direct">Direta</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
              <SelectTrigger className="w-[140px] bg-slate-700/50 border-slate-600">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-white">
            <ShoppingCart className="w-4 h-4 text-blue-400" />
            Lista de Vendas ({filteredSales.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">ID</TableHead>
                  <TableHead className="text-slate-400">Data</TableHead>
                  <TableHead className="text-slate-400">Cliente</TableHead>
                  <TableHead className="text-slate-400">Valor</TableHead>
                  <TableHead className="text-slate-400">Tipo</TableHead>
                  <TableHead className="text-slate-400">Afiliado</TableHead>
                  <TableHead className="text-slate-400">Comissão</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-slate-400 py-8">
                      Nenhuma venda encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id} className="border-slate-700 hover:bg-slate-700/30">
                      <TableCell className="text-slate-300 font-mono text-xs">
                        {sale.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {format(new Date(sale.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-white font-medium">{sale.full_name}</TableCell>
                      <TableCell className="text-emerald-400 font-semibold">
                        {formatCurrency(SUBSCRIPTION_PRICE)}
                      </TableCell>
                      <TableCell>
                        {sale.is_affiliate_sale ? (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Afiliado</Badge>
                        ) : (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Direta</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {sale.affiliate_name || '-'}
                      </TableCell>
                      <TableCell className="text-yellow-400">
                        {sale.is_affiliate_sale ? formatCurrency(SUBSCRIPTION_PRICE * 0.5) : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(sale.payment_status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
