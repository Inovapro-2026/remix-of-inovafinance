import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Loader2, 
  Search, 
  UsersRound, 
  MoreHorizontal, 
  Edit, 
  Ban, 
  Unlock, 
  Trash2, 
  RefreshCw, 
  Eye,
  Copy,
  Check,
  Calculator
} from "lucide-react";
import { 
  getAffiliateAccounts, 
  blockAffiliate, 
  unblockAffiliate, 
  deleteAffiliate,
  deleteAffiliatesBulk,
  recalculateAffiliateBalance,
  type AffiliateAccount 
} from "@/services/adminAffiliateService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AdminAffiliateAccountsPanel() {
  const [affiliates, setAffiliates] = useState<AffiliateAccount[]>([]);
  const [filteredAffiliates, setFilteredAffiliates] = useState<AffiliateAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateAccount | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [copiedLink, setCopiedLink] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedMatriculas, setSelectedMatriculas] = useState<number[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [affiliateToDelete, setAffiliateToDelete] = useState<number | null>(null);

  useEffect(() => {
    loadAffiliates();
  }, []);

  useEffect(() => {
    filterAffiliates();
  }, [affiliates, searchTerm]);

  const loadAffiliates = async () => {
    try {
      setIsLoading(true);
      const data = await getAffiliateAccounts();
      setAffiliates(data);
    } catch (error) {
      console.error('Error loading affiliates:', error);
      toast.error('Erro ao carregar afiliados');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAffiliates = () => {
    if (!searchTerm) {
      setFilteredAffiliates(affiliates);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = affiliates.filter(a => 
      a.full_name?.toLowerCase().includes(term) ||
      a.email?.toLowerCase().includes(term) ||
      a.matricula.toString().includes(term) ||
      a.affiliate_code?.toLowerCase().includes(term)
    );
    setFilteredAffiliates(filtered);
  };

  const handleBlock = async (matricula: number) => {
    try {
      setActionLoading(`block-${matricula}`);
      await blockAffiliate(matricula);
      toast.success('Afiliado bloqueado com sucesso');
      await loadAffiliates();
    } catch (error) {
      toast.error('Erro ao bloquear afiliado');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblock = async (matricula: number) => {
    try {
      setActionLoading(`unblock-${matricula}`);
      await unblockAffiliate(matricula);
      toast.success('Afiliado desbloqueado com sucesso');
      await loadAffiliates();
    } catch (error) {
      toast.error('Erro ao desbloquear afiliado');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (matricula: number) => {
    setAffiliateToDelete(matricula);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!affiliateToDelete) return;
    
    try {
      setActionLoading(`delete-${affiliateToDelete}`);
      await deleteAffiliate(affiliateToDelete);
      toast.success('Afiliado apagado permanentemente');
      setSelectedMatriculas(prev => prev.filter(m => m !== affiliateToDelete));
      await loadAffiliates();
    } catch (error) {
      toast.error('Erro ao apagar afiliado');
    } finally {
      setActionLoading(null);
      setShowDeleteDialog(false);
      setAffiliateToDelete(null);
    }
  };

  const handleBulkDelete = () => {
    if (selectedMatriculas.length === 0) {
      toast.error('Selecione pelo menos um afiliado');
      return;
    }
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    try {
      setActionLoading('bulk-delete');
      await deleteAffiliatesBulk(selectedMatriculas);
      toast.success(`${selectedMatriculas.length} afiliado(s) apagado(s) permanentemente`);
      setSelectedMatriculas([]);
      await loadAffiliates();
    } catch (error) {
      toast.error('Erro ao apagar afiliados');
    } finally {
      setActionLoading(null);
      setShowBulkDeleteDialog(false);
    }
  };

  const toggleSelectAffiliate = (matricula: number) => {
    setSelectedMatriculas(prev => 
      prev.includes(matricula)
        ? prev.filter(m => m !== matricula)
        : [...prev, matricula]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMatriculas.length === filteredAffiliates.length) {
      setSelectedMatriculas([]);
    } else {
      setSelectedMatriculas(filteredAffiliates.map(a => a.matricula));
    }
  };

  const handleRecalculate = async (matricula: number) => {
    try {
      setActionLoading(`recalc-${matricula}`);
      const newBalance = await recalculateAffiliateBalance(matricula);
      toast.success(`Saldo recalculado: R$ ${newBalance.toFixed(2)}`);
      await loadAffiliates();
    } catch (error) {
      toast.error('Erro ao recalcular saldo');
    } finally {
      setActionLoading(null);
    }
  };

  const copyLink = async (matricula: number) => {
    const link = `${window.location.origin}/lp/inovafinace?ref=${matricula}`;
    await navigator.clipboard.writeText(link);
    setCopiedLink(matricula);
    toast.success('Link copiado!');
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const formatCurrency = (value: number | null) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

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
          <h1 className="text-2xl font-bold text-white">Contas de Afiliados</h1>
          <p className="text-slate-400 text-sm">Gerenciamento completo dos afiliados</p>
        </div>
        <Button onClick={loadAffiliates} variant="outline" size="sm" className="border-slate-600">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Total de Afiliados</p>
            <p className="text-2xl font-bold text-white">{affiliates.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Afiliados Ativos</p>
            <p className="text-2xl font-bold text-green-400">{affiliates.filter(a => !a.blocked).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Afiliados Bloqueados</p>
            <p className="text-2xl font-bold text-red-400">{affiliates.filter(a => a.blocked).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Saldo Total</p>
            <p className="text-2xl font-bold text-emerald-400">
              {formatCurrency(affiliates.reduce((sum, a) => sum + (a.affiliate_balance || 0), 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, email, matrícula ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700"
          />
        </div>
        {selectedMatriculas.length > 0 && (
          <Button
            onClick={handleBulkDelete}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
            disabled={actionLoading === 'bulk-delete'}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Apagar Selecionados ({selectedMatriculas.length})
          </Button>
        )}
      </div>

      {/* Affiliates Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-white">
            <UsersRound className="w-4 h-4 text-purple-400" />
            Lista de Afiliados ({filteredAffiliates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedMatriculas.length === filteredAffiliates.length && filteredAffiliates.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-slate-400">Matrícula</TableHead>
                  <TableHead className="text-slate-400">Nome</TableHead>
                  <TableHead className="text-slate-400">Email</TableHead>
                  <TableHead className="text-slate-400">Indicações</TableHead>
                  <TableHead className="text-slate-400">Convertidas</TableHead>
                  <TableHead className="text-slate-400">Saldo</TableHead>
                  <TableHead className="text-slate-400">Total Sacado</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAffiliates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-slate-400 py-8">
                      Nenhum afiliado encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAffiliates.map((affiliate) => (
                    <TableRow key={affiliate.id} className="border-slate-700 hover:bg-slate-700/30">
                      <TableCell>
                        <Checkbox
                          checked={selectedMatriculas.includes(affiliate.matricula)}
                          onCheckedChange={() => toggleSelectAffiliate(affiliate.matricula)}
                        />
                      </TableCell>
                      <TableCell className="text-slate-300 font-mono">{affiliate.matricula}</TableCell>
                      <TableCell className="text-white font-medium">{affiliate.full_name || '-'}</TableCell>
                      <TableCell className="text-slate-300">{affiliate.email || '-'}</TableCell>
                      <TableCell className="text-blue-400">{affiliate.total_indicacoes}</TableCell>
                      <TableCell className="text-green-400">{affiliate.total_convertidas}</TableCell>
                      <TableCell className="text-emerald-400 font-semibold">
                        {formatCurrency(affiliate.affiliate_balance)}
                      </TableCell>
                      <TableCell className="text-yellow-400">
                        {formatCurrency(affiliate.total_sacado)}
                      </TableCell>
                      <TableCell>
                        {affiliate.blocked ? (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Bloqueado</Badge>
                        ) : (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ativo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAffiliate(affiliate);
                                setShowDetails(true);
                              }}
                              className="text-slate-300 focus:bg-slate-700"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => copyLink(affiliate.matricula)}
                              className="text-slate-300 focus:bg-slate-700"
                            >
                              {copiedLink === affiliate.matricula ? (
                                <Check className="w-4 h-4 mr-2 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 mr-2" />
                              )}
                              Copiar Link
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRecalculate(affiliate.matricula)}
                              disabled={actionLoading === `recalc-${affiliate.matricula}`}
                              className="text-slate-300 focus:bg-slate-700"
                            >
                              <Calculator className="w-4 h-4 mr-2" />
                              Recalcular Saldo
                            </DropdownMenuItem>
                            {affiliate.blocked ? (
                              <DropdownMenuItem
                                onClick={() => handleUnblock(affiliate.matricula)}
                                disabled={actionLoading === `unblock-${affiliate.matricula}`}
                                className="text-green-400 focus:bg-slate-700"
                              >
                                <Unlock className="w-4 h-4 mr-2" />
                                Desbloquear
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleBlock(affiliate.matricula)}
                                disabled={actionLoading === `block-${affiliate.matricula}`}
                                className="text-yellow-400 focus:bg-slate-700"
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                Bloquear
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDelete(affiliate.matricula)}
                              disabled={actionLoading === `delete-${affiliate.matricula}`}
                              className="text-red-400 focus:bg-slate-700"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Apagar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Detalhes do Afiliado</DialogTitle>
            <DialogDescription className="text-slate-400">
              Informações completas do afiliado
            </DialogDescription>
          </DialogHeader>
          {selectedAffiliate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Matrícula</p>
                  <p className="text-white font-mono">{selectedAffiliate.matricula}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Status</p>
                  <p className={selectedAffiliate.blocked ? "text-red-400" : "text-green-400"}>
                    {selectedAffiliate.blocked ? "Bloqueado" : "Ativo"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Nome</p>
                  <p className="text-white">{selectedAffiliate.full_name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="text-white">{selectedAffiliate.email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Telefone</p>
                  <p className="text-white">{selectedAffiliate.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Código</p>
                  <p className="text-white font-mono">{selectedAffiliate.affiliate_code || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">PIX ({selectedAffiliate.pix_key_type || 'N/A'})</p>
                  <p className="text-white font-mono text-sm">{selectedAffiliate.pix_key || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Data de Cadastro</p>
                  <p className="text-white">
                    {format(new Date(selectedAffiliate.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                <div>
                  <p className="text-xs text-slate-400">Total de Indicações</p>
                  <p className="text-2xl font-bold text-blue-400">{selectedAffiliate.total_indicacoes}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Indicações Convertidas</p>
                  <p className="text-2xl font-bold text-green-400">{selectedAffiliate.total_convertidas}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Saldo Disponível</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {formatCurrency(selectedAffiliate.affiliate_balance)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Sacado</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {formatCurrency(selectedAffiliate.total_sacado)}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Link de Indicação</p>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/lp/inovafinace?ref=${selectedAffiliate.matricula}`}
                    readOnly
                    className="bg-slate-700/50 border-slate-600 text-xs font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyLink(selectedAffiliate.matricula)}
                    className="border-slate-600"
                  >
                    {copiedLink === selectedAffiliate.matricula ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Single Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Apagar Afiliado Permanentemente</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Esta ação é irreversível. O afiliado e todos os seus dados relacionados (convites, comissões, saques) serão apagados permanentemente do banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Apagar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Apagar {selectedMatriculas.length} Afiliado(s)</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Esta ação é irreversível. Todos os afiliados selecionados e seus dados relacionados serão apagados permanentemente do banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Apagar {selectedMatriculas.length} Afiliado(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
