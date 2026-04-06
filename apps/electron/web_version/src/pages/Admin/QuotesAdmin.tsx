/**
 * Painel Admin de Orçamentos (CRM Básico)
 * Gerencia solicitações de orçamento recebidas pelo site
 */

import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  Filter,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { Link } from "wouter";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  new: { label: "Novo", color: "bg-blue-100 text-blue-700", icon: Clock },
  contacted: { label: "Contatado", color: "bg-yellow-100 text-yellow-700", icon: Phone },
  meeting_scheduled: { label: "Reunião Agendada", color: "bg-purple-100 text-purple-700", icon: Calendar },
  proposal_sent: { label: "Proposta Enviada", color: "bg-indigo-100 text-indigo-700", icon: Mail },
  negotiating: { label: "Negociando", color: "bg-orange-100 text-orange-700", icon: MessageCircle },
  won: { label: "Ganho", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  lost: { label: "Perdido", color: "bg-red-100 text-red-700", icon: XCircle },
};

const BUDGET_LABELS: Record<string, string> = {
  under_10k: "Até R$ 10.000",
  "10k_25k": "R$ 10.000 - R$ 25.000",
  "25k_50k": "R$ 25.000 - R$ 50.000",
  "50k_100k": "R$ 50.000 - R$ 100.000",
  above_100k: "Acima de R$ 100.000",
  unknown: "Não definido",
};

const TIMELINE_LABELS: Record<string, string> = {
  immediate: "Imediato",
  "1_month": "1 mês",
  "3_months": "3 meses",
  "6_months": "6 meses",
  next_year: "Próximo ano",
  unknown: "Não definido",
};

const SCHOOL_TYPE_LABELS: Record<string, string> = {
  public_municipal: "Pública Municipal",
  public_state: "Pública Estadual",
  public_federal: "Pública Federal",
  private: "Particular",
  other: "Outro",
};

export default function QuotesAdmin() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Verificar se é admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
            <p className="text-gray-600 mb-4">
              Esta página é restrita a administradores do sistema.
            </p>
            <Link href="/">
              <Button>Voltar ao Início</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Queries
  const quotesQuery = trpc.quotes.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 100,
    offset: 0,
  });

  const statsQuery = trpc.quotes.stats.useQuery();

  // Mutations
  const updateStatusMutation = trpc.quotes.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      quotesQuery.refetch();
      statsQuery.refetch();
      setSelectedQuote(null);
      setNewStatus("");
      setNotes("");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const handleUpdateStatus = () => {
    if (!selectedQuote || !newStatus) return;
    updateStatusMutation.mutate({
      quoteId: selectedQuote.id,
      status: newStatus as any,
      notes: notes || undefined,
    });
  };

  // Filter quotes by search
  const filteredQuotes = useMemo(() => {
    const quotes = quotesQuery.data?.quotes || [];
    if (!searchTerm.trim()) return quotes;
    const term = searchTerm.toLowerCase();
    return quotes.filter(
      (q: any) =>
        q.schoolName?.toLowerCase().includes(term) ||
        q.contactName?.toLowerCase().includes(term) ||
        q.contactEmail?.toLowerCase().includes(term) ||
        q.city?.toLowerCase().includes(term)
    );
  }, [quotesQuery.data?.quotes, searchTerm]);

  const stats = statsQuery.data || { total: 0, new: 0, contacted: 0, meeting_scheduled: 0, proposal_sent: 0, negotiating: 0, won: 0, lost: 0 };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Link href="/">
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Gerenciamento de Orçamentos</h1>
                <p className="text-xs text-gray-500">CRM - Áquila Pro</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Total", value: stats.total, color: "bg-gray-100 text-gray-700" },
            { label: "Novos", value: stats.new, color: "bg-blue-100 text-blue-700" },
            { label: "Contatados", value: stats.contacted, color: "bg-yellow-100 text-yellow-700" },
            { label: "Reunião", value: stats.meeting_scheduled, color: "bg-purple-100 text-purple-700" },
            { label: "Proposta", value: stats.proposal_sent, color: "bg-indigo-100 text-indigo-700" },
            { label: "Ganhos", value: stats.won, color: "bg-green-100 text-green-700" },
            { label: "Perdidos", value: stats.lost, color: "bg-red-100 text-red-700" },
          ].map((stat) => (
            <Card key={stat.label} className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <Badge className={`${stat.color} border-0 text-xs mt-1`}>{stat.label}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por escola, contato, email ou cidade..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {quotesQuery.isLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-gray-500">Carregando orçamentos...</p>
              </div>
            ) : filteredQuotes.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nenhum orçamento encontrado</p>
                <p className="text-sm text-gray-400 mt-1">
                  {searchTerm ? "Tente ajustar os filtros de busca." : "Orçamentos enviados pelo site aparecerão aqui."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">#</TableHead>
                      <TableHead>Escola</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead className="text-center">Alunos</TableHead>
                      <TableHead>Orçamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="w-[80px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuotes.map((quote: any) => {
                      const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.new;
                      return (
                        <TableRow key={quote.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedQuote(quote)}>
                          <TableCell className="font-mono text-sm text-gray-500">
                            #{quote.id}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{quote.schoolName}</p>
                              <p className="text-xs text-gray-500">
                                {SCHOOL_TYPE_LABELS[quote.schoolType] || quote.schoolType}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm text-gray-900">{quote.contactName}</p>
                              <p className="text-xs text-gray-500">{quote.contactRole}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {quote.city}/{quote.state}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm font-medium text-gray-900">{quote.totalStudents}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {BUDGET_LABELS[quote.budget] || "N/D"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusConfig.color} border-0 text-xs`}>
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-500">
                              {new Date(quote.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedQuote(quote);
                              }}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total count */}
        {filteredQuotes.length > 0 && (
          <p className="text-sm text-gray-500 text-center">
            Exibindo {filteredQuotes.length} de {quotesQuery.data?.total || 0} orçamentos
          </p>
        )}
      </main>

      {/* Quote Detail Dialog */}
      <Dialog open={!!selectedQuote} onOpenChange={(open) => !open && setSelectedQuote(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedQuote && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Orçamento #{selectedQuote.id} - {selectedQuote.schoolName}
                </DialogTitle>
                <DialogDescription>
                  Recebido em {new Date(selectedQuote.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 mt-4">
                {/* Status atual */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Status atual:</span>
                  <Badge className={`${(STATUS_CONFIG[selectedQuote.status] || STATUS_CONFIG.new).color} border-0`}>
                    {(STATUS_CONFIG[selectedQuote.status] || STATUS_CONFIG.new).label}
                  </Badge>
                </div>

                {/* Dados da Escola */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Dados da Escola
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Nome:</span>{" "}
                      <span className="font-medium">{selectedQuote.schoolName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Tipo:</span>{" "}
                      <span className="font-medium">{SCHOOL_TYPE_LABELS[selectedQuote.schoolType]}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Localização:</span>{" "}
                      <span className="font-medium">{selectedQuote.city}/{selectedQuote.state}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Alunos:</span>{" "}
                      <span className="font-medium">{selectedQuote.totalStudents}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Salas:</span>{" "}
                      <span className="font-medium">{selectedQuote.totalRooms}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Câmeras existentes:</span>{" "}
                      <span className="font-medium">{selectedQuote.existingCameras}</span>
                    </div>
                    {selectedQuote.cameraBrand && (
                      <div>
                        <span className="text-gray-500">Marca câmeras:</span>{" "}
                        <span className="font-medium">{selectedQuote.cameraBrand}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">DVR/NVR:</span>{" "}
                      <span className="font-medium">{selectedQuote.hasDVR ? "Sim" : "Não"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Rede cabeada:</span>{" "}
                      <span className="font-medium">{selectedQuote.hasNetwork ? "Sim" : "Não"}</span>
                    </div>
                  </div>
                </div>

                {/* Dados do Contato */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Dados do Contato
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Nome:</span>{" "}
                      <span className="font-medium">{selectedQuote.contactName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Cargo:</span>{" "}
                      <span className="font-medium">{selectedQuote.contactRole}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>{" "}
                      <a href={`mailto:${selectedQuote.contactEmail}`} className="font-medium text-blue-600 hover:underline">
                        {selectedQuote.contactEmail}
                      </a>
                    </div>
                    <div>
                      <span className="text-gray-500">Telefone:</span>{" "}
                      <a href={`tel:${selectedQuote.contactPhone}`} className="font-medium text-blue-600 hover:underline">
                        {selectedQuote.contactPhone}
                      </a>
                    </div>
                    {selectedQuote.contactWhatsapp && (
                      <div>
                        <span className="text-gray-500">WhatsApp:</span>{" "}
                        <a
                          href={`https://wa.me/${selectedQuote.contactWhatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-green-600 hover:underline"
                        >
                          {selectedQuote.contactWhatsapp}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interesse */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Interesse
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Orçamento:</span>{" "}
                      <span className="font-medium">{BUDGET_LABELS[selectedQuote.budget]}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Prazo:</span>{" "}
                      <span className="font-medium">{TIMELINE_LABELS[selectedQuote.timeline]}</span>
                    </div>
                  </div>
                  {selectedQuote.interestedFeatures && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-500">Funcionalidades:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(() => {
                          try {
                            const features = typeof selectedQuote.interestedFeatures === "string"
                              ? JSON.parse(selectedQuote.interestedFeatures)
                              : selectedQuote.interestedFeatures;
                            return features.map((f: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {f}
                              </Badge>
                            ));
                          } catch {
                            return <span className="text-xs text-gray-400">N/D</span>;
                          }
                        })()}
                      </div>
                    </div>
                  )}
                  {selectedQuote.message && (
                    <div className="mt-2 bg-white rounded-lg p-3 border">
                      <span className="text-sm text-gray-500 block mb-1">Mensagem:</span>
                      <p className="text-sm text-gray-900">{selectedQuote.message}</p>
                    </div>
                  )}
                </div>

                {/* Notas existentes */}
                {selectedQuote.notes && (
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 text-sm mb-1">Notas Internas</h4>
                    <p className="text-sm text-yellow-700">{selectedQuote.notes}</p>
                  </div>
                )}

                {/* Atualizar Status */}
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-gray-900">Atualizar Status</h4>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o novo status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Adicionar notas (opcional)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setSelectedQuote(null)}>
                      Fechar
                    </Button>
                    <Button
                      onClick={handleUpdateStatus}
                      disabled={!newStatus || updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        "Salvar Alterações"
                      )}
                    </Button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Ações Rápidas</h4>
                  <div className="flex flex-wrap gap-2">
                    <a href={`mailto:${selectedQuote.contactEmail}?subject=Orçamento Áquila Pro - ${selectedQuote.schoolName}`}>
                      <Button size="sm" variant="outline">
                        <Mail className="w-3 h-3 mr-1" />
                        Email
                      </Button>
                    </a>
                    <a href={`tel:${selectedQuote.contactPhone}`}>
                      <Button size="sm" variant="outline">
                        <Phone className="w-3 h-3 mr-1" />
                        Ligar
                      </Button>
                    </a>
                    {selectedQuote.contactWhatsapp && (
                      <a
                        href={`https://wa.me/${selectedQuote.contactWhatsapp.replace(/\D/g, "")}?text=Olá ${selectedQuote.contactName}, tudo bem? Sou da equipe Áquila Pro e recebi sua solicitação de orçamento para a ${selectedQuote.schoolName}. Gostaria de agendar uma conversa para entender melhor suas necessidades.`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="outline" className="text-green-600 border-green-200">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          WhatsApp
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
