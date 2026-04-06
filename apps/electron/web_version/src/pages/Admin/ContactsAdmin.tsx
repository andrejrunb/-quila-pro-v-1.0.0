import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Mail,
  Phone,
  MessageSquare,
  Trash2,
  Archive,
  Eye,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { exportToCSV, formatContactsForExport, generateFilename } from "@/utils/csvExport";

export default function ContactsAdmin() {
  const { user } = useAuth();
  
  // Verificar se é admin
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }
  const [selectedStatus, setSelectedStatus] = useState<
    "new" | "read" | "responded" | "archived" | "all"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Queries
  const { data: allContacts = [], isLoading: isLoadingAll } =
    trpc.contact.list.useQuery(undefined, {
      enabled: user?.role === "admin",
    });

  const { data: filteredByStatus = [] } = trpc.contact.listByStatus.useQuery(
    { status: selectedStatus as any },
    {
      enabled: user?.role === "admin" && selectedStatus !== "all",
    }
  );

  // Mutations
  const updateStatusMutation = trpc.contact.updateStatus.useMutation();
  const respondMutation = trpc.contact.respond.useMutation();
  const deleteMutation = trpc.contact.delete.useMutation();

  // Filter contacts
  const contacts = useMemo(() => {
    const source = selectedStatus === "all" ? allContacts : filteredByStatus;
    return source.filter(
      (contact: any) =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.schoolName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allContacts, filteredByStatus, selectedStatus, searchTerm]);

  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "read":
        return "bg-yellow-100 text-yellow-800";
      case "responded":
        return "bg-green-100 text-green-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new":
        return "Novo";
      case "read":
        return "Lido";
      case "responded":
        return "Respondido";
      case "archived":
        return "Arquivado";
      default:
        return status;
    }
  };

  // Handle actions
  const handleViewDetails = (contact: any) => {
    setSelectedContact(contact);
    setResponseMessage("");
    setIsDialogOpen(true);

    // Mark as read
    if (contact.status === "new") {
      updateStatusMutation.mutate({
        id: contact.id,
        status: "read",
      });
    }
  };

  const handleRespond = async () => {
    if (!responseMessage.trim()) {
      toast.error("Por favor, escreva uma resposta.");
      return;
    }

    try {
      await respondMutation.mutateAsync({
        id: selectedContact.id,
        responseMessage,
      });

      toast.success("Resposta enviada com sucesso!");
      setIsDialogOpen(false);
      setResponseMessage("");
      setSelectedContact(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar resposta.");
    }
  };

  const handleArchive = (contactId: number) => {
    updateStatusMutation.mutate(
      {
        id: contactId,
        status: "archived",
      },
      {
        onSuccess: () => {
          toast.success("Contato arquivado.");
        },
      }
    );
  };

  const handleDelete = (contactId: number) => {
    if (confirm("Tem certeza que deseja deletar este contato?")) {
      deleteMutation.mutate(
        { id: contactId },
        {
          onSuccess: () => {
            toast.success("Contato deletado.");
          },
        }
      );
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(contacts.map((c: any) => c.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectContact = (contactId: number, checked: boolean) => {
    if (checked) {
      setSelectedContacts([...selectedContacts, contactId]);
    } else {
      setSelectedContacts(selectedContacts.filter((id) => id !== contactId));
    }
  };

  const handleBulkArchive = () => {
    if (selectedContacts.length === 0) {
      toast.error("Selecione pelo menos um contato.");
      return;
    }

    selectedContacts.forEach((id) => {
      updateStatusMutation.mutate({ id, status: "archived" });
    });

    setSelectedContacts([]);
    toast.success("Contatos arquivados.");
  };

  const handleBulkDelete = () => {
    if (selectedContacts.length === 0) {
      toast.error("Selecione pelo menos um contato.");
      return;
    }

    if (
      confirm(
        `Tem certeza que deseja deletar ${selectedContacts.length} contato(s)?`
      )
    ) {
      selectedContacts.forEach((id) => {
        deleteMutation.mutate({ id });
      });

      setSelectedContacts([]);
      toast.success("Contatos deletados.");
    }
  };

  const handleExportCSV = () => {
    try {
      const contactsToExport = contacts.map((contact: any) => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        schoolName: contact.schoolName,
        subject: contact.subject,
        message: contact.message,
        status: contact.status,
        createdAt: contact.createdAt,
        responseMessage: contact.responseMessage,
        respondedAt: contact.respondedAt,
      }));

      const formatted = formatContactsForExport(contactsToExport);
      const filename = generateFilename("contatos_aquila");
      exportToCSV(formatted, filename);
      toast.success(`${formatted.length} contato(s) exportado(s)!`);
    } catch (error) {
      toast.error("Erro ao exportar contatos.");
      console.error(error);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Acesso Negado
          </h1>
          <p className="text-gray-600">
            Você não tem permissão para acessar este painel.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Gerenciar Contatos
          </h1>
          <p className="text-gray-600">
            Visualize, responda e gerencie todas as submissões de contato
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="text-3xl font-bold text-blue-600">
              {allContacts.length}
            </div>
            <p className="text-gray-600 text-sm mt-1">Total de Contatos</p>
          </Card>
          <Card className="p-6">
            <div className="text-3xl font-bold text-yellow-600">
              {allContacts.filter((c: any) => c.status === "new").length}
            </div>
            <p className="text-gray-600 text-sm mt-1">Novos</p>
          </Card>
          <Card className="p-6">
            <div className="text-3xl font-bold text-green-600">
              {allContacts.filter((c: any) => c.status === "responded").length}
            </div>
            <p className="text-gray-600 text-sm mt-1">Respondidos</p>
          </Card>
          <Card className="p-6">
            <div className="text-3xl font-bold text-gray-600">
              {allContacts.filter((c: any) => c.status === "archived").length}
            </div>
            <p className="text-gray-600 text-sm mt-1">Arquivados</p>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Buscar
                </label>
                <Input
                  placeholder="Nome, email ou escola..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Status
                </label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value: any) => setSelectedStatus(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="new">Novos</SelectItem>
                    <SelectItem value="read">Lidos</SelectItem>
                    <SelectItem value="responded">Respondidos</SelectItem>
                    <SelectItem value="archived">Arquivados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  disabled={contacts.length === 0}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV ({contacts.length})
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBulkArchive}
                  disabled={selectedContacts.length === 0}
                  className="flex-1"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Arquivar ({selectedContacts.length})
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                  disabled={selectedContacts.length === 0}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deletar ({selectedContacts.length})
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedContacts.length === contacts.length &&
                        contacts.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Escola</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingAll ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Carregando contatos...
                    </TableCell>
                  </TableRow>
                ) : contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Nenhum contato encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((contact: any) => (
                    <TableRow
                      key={contact.id}
                      className={
                        contact.status === "new" ? "bg-blue-50" : undefined
                      }
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={(checked) =>
                            handleSelectContact(contact.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {contact.name}
                      </TableCell>
                      <TableCell>
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Mail className="w-4 h-4" />
                          {contact.email}
                        </a>
                      </TableCell>
                      <TableCell>{contact.schoolName || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {contact.subject}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(contact.status)}>
                          {getStatusLabel(contact.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(contact.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog
                            open={
                              isDialogOpen && selectedContact?.id === contact.id
                            }
                            onOpenChange={setIsDialogOpen}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(contact)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Detalhes do Contato</DialogTitle>
                                <DialogDescription>
                                  ID: {selectedContact?.id}
                                </DialogDescription>
                              </DialogHeader>

                              {selectedContact && (
                                <div className="space-y-6">
                                  {/* Contact Info */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">
                                        Nome
                                      </label>
                                      <p className="text-gray-900 font-medium">
                                        {selectedContact.name}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">
                                        Email
                                      </label>
                                      <a
                                        href={`mailto:${selectedContact.email}`}
                                        className="text-blue-600 hover:underline"
                                      >
                                        {selectedContact.email}
                                      </a>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">
                                        Telefone
                                      </label>
                                      <p className="text-gray-900">
                                        {selectedContact.phone ? (
                                          <a
                                            href={`tel:${selectedContact.phone}`}
                                            className="text-blue-600 hover:underline flex items-center gap-1"
                                          >
                                            <Phone className="w-4 h-4" />
                                            {selectedContact.phone}
                                          </a>
                                        ) : (
                                          "-"
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">
                                        Escola
                                      </label>
                                      <p className="text-gray-900">
                                        {selectedContact.schoolName || "-"}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Message */}
                                  <div>
                                    <label className="text-sm font-medium text-gray-600 mb-2 block">
                                      Assunto
                                    </label>
                                    <p className="text-gray-900 font-medium">
                                      {selectedContact.subject}
                                    </p>
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium text-gray-600 mb-2 block">
                                      Mensagem
                                    </label>
                                    <div className="bg-gray-50 p-4 rounded-lg border">
                                      <p className="text-gray-900 whitespace-pre-wrap">
                                        {selectedContact.message}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Response */}
                                  {selectedContact.responseMessage && (
                                    <div>
                                      <label className="text-sm font-medium text-green-600 mb-2 block">
                                        Sua Resposta
                                      </label>
                                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                        <p className="text-gray-900 whitespace-pre-wrap">
                                          {selectedContact.responseMessage}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Reply Form */}
                                  {selectedContact.status !== "responded" && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-600 mb-2 block">
                                        Responder
                                      </label>
                                      <Textarea
                                        placeholder="Digite sua resposta..."
                                        value={responseMessage}
                                        onChange={(e) =>
                                          setResponseMessage(e.target.value)
                                        }
                                        rows={4}
                                      />
                                      <Button
                                        onClick={handleRespond}
                                        className="mt-4 w-full"
                                        disabled={respondMutation.isPending}
                                      >
                                        <Send className="w-4 h-4 mr-2" />
                                        {respondMutation.isPending
                                          ? "Enviando..."
                                          : "Enviar Resposta"}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchive(contact.id)}
                            disabled={contact.status === "archived"}
                          >
                            <Archive className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(contact.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
