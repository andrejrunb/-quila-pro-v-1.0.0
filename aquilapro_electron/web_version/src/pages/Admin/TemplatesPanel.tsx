import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, MessageCircle, BarChart3, Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function TemplatesPanel() {
  const [activeTab, setActiveTab] = useState("sms");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    content: "",
    variables: "",
  });

  const smsTemplates = [
    {
      id: 1,
      name: "Saída não autorizada",
      alertType: "unauthorized_exit",
      content: "⚠️ ALERTA: {studentName} saiu da escola sem autorização às {time}. Contate a escola imediatamente.",
      isActive: 1,
    },
    {
      id: 2,
      name: "Atraso na chegada",
      alertType: "late_arrival",
      content: "ℹ️ Seu filho {studentName} chegou atrasado na escola hoje.",
      isActive: 1,
    },
    {
      id: 3,
      name: "Ausência",
      alertType: "absence",
      content: "⚠️ {studentName} não foi marcado presente na escola hoje.",
      isActive: 1,
    },
  ];

  const whatsappTemplates = [
    {
      id: 1,
      name: "Confirmação de presença",
      notificationType: "attendance_confirmation",
      content: "✅ Presença confirmada: {studentName} chegou na escola às {time}. Tenha um ótimo dia!",
      isActive: 1,
    },
    {
      id: 2,
      name: "Relatório diário",
      notificationType: "daily_report",
      content: "📊 Relatório de Presença - {studentName}\n\nPresente: {presentDays} dias\nAusente: {absentDays} dias\nTaxa: {attendanceRate}%",
      isActive: 1,
    },
  ];

  const messageLogs = [
    {
      id: 1,
      messageType: "sms",
      recipientPhone: "+5561999623099",
      status: "delivered",
      sentAt: "2024-02-26 14:30",
      content: "⚠️ ALERTA: João Silva saiu da escola...",
    },
    {
      id: 2,
      messageType: "whatsapp",
      recipientPhone: "+5511988888888",
      status: "sent",
      sentAt: "2024-02-26 14:25",
      content: "✅ Presença confirmada: Maria Santos chegou...",
    },
    {
      id: 3,
      messageType: "sms",
      recipientPhone: "+5511977777777",
      status: "failed",
      sentAt: "2024-02-26 14:20",
      content: "ℹ️ Seu filho chegou atrasado...",
    },
  ];

  const handleSaveTemplate = () => {
    if (editingId) {
      console.log("Atualizando template:", editingId, formData);
    } else {
      console.log("Criando novo template:", formData);
    }
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: "", description: "", content: "", variables: "" });
  };

  const handleEditTemplate = (template: any) => {
    setFormData({
      name: template.name,
      description: template.description || "",
      content: template.content,
      variables: template.variables || "",
    });
    setEditingId(template.id);
    setShowForm(true);
  };

  const handleDeleteTemplate = (id: number) => {
    console.log("Deletando template:", id);
  };

  const handleToggleStatus = (id: number) => {
    console.log("Alternando status do template:", id);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 pt-24">
        {/* Header */}
        <section className="py-12 px-4 bg-gradient-to-br from-indigo-50 to-white">
          <div className="container max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Painel de Administração</h1>
            <p className="text-gray-600">Gerencie templates de SMS e WhatsApp para notificações automáticas</p>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12 px-4 bg-white">
          <div className="container max-w-6xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="sms" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  SMS Templates
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Templates
                </TabsTrigger>
                <TabsTrigger value="logs" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Message Logs
                </TabsTrigger>
              </TabsList>

              {/* SMS Templates Tab */}
              <TabsContent value="sms" className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Templates de SMS</h2>
                  <button
                    onClick={() => {
                      setShowForm(true);
                      setEditingId(null);
                      setFormData({ name: "", description: "", content: "", variables: "" });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Template
                  </button>
                </div>

                {showForm && activeTab === "sms" && (
                  <Card className="p-6 mb-6 bg-blue-50 border-l-4 border-blue-600">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {editingId ? "Editar Template" : "Criar Novo Template"}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: Saída não autorizada"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <input
                          type="text"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Descrição do template"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo da Mensagem</label>
                        <textarea
                          value={formData.content}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                          placeholder="Ex: ⚠️ ALERTA: {studentName} saiu da escola..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Variáveis Disponíveis</label>
                        <p className="text-sm text-gray-600 mb-2">
                          Use: {"{studentName}"}, {"{time}"}, {"{parentName}"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveTemplate}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => {
                            setShowForm(false);
                            setEditingId(null);
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </Card>
                )}

                <div className="grid gap-4">
                  {smsTemplates.map((template) => (
                    <Card key={template.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{template.content}</p>
                          <div className="mt-3 flex gap-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {template.alertType}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded ${template.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                              {template.isActive ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleStatus(template.id)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title={template.isActive ? "Desativar" : "Ativar"}
                          >
                            {template.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleEditTemplate(template)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* WhatsApp Templates Tab */}
              <TabsContent value="whatsapp" className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Templates de WhatsApp</h2>
                  <button
                    onClick={() => {
                      setShowForm(true);
                      setEditingId(null);
                      setFormData({ name: "", description: "", content: "", variables: "" });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Template
                  </button>
                </div>

                {showForm && activeTab === "whatsapp" && (
                  <Card className="p-6 mb-6 bg-green-50 border-l-4 border-green-600">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {editingId ? "Editar Template" : "Criar Novo Template"}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Ex: Confirmação de presença"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo da Mensagem</label>
                        <textarea
                          value={formData.content}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 h-24"
                          placeholder="Ex: ✅ Presença confirmada: {studentName}..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveTemplate}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => {
                            setShowForm(false);
                            setEditingId(null);
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </Card>
                )}

                <div className="grid gap-4">
                  {whatsappTemplates.map((template) => (
                    <Card key={template.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{template.content}</p>
                          <div className="mt-3 flex gap-2">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              {template.notificationType}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded ${template.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                              {template.isActive ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleStatus(template.id)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                          >
                            {template.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleEditTemplate(template)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Message Logs Tab */}
              <TabsContent value="logs" className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Histórico de Mensagens</h2>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <Card className="p-4 text-center">
                      <div className="text-3xl font-bold text-gray-900">157</div>
                      <div className="text-sm text-gray-600 mt-1">Total Enviadas</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="text-3xl font-bold text-green-600">142</div>
                      <div className="text-sm text-gray-600 mt-1">Entregues</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="text-3xl font-bold text-blue-600">12</div>
                      <div className="text-sm text-gray-600 mt-1">Enviadas</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="text-3xl font-bold text-red-600">3</div>
                      <div className="text-sm text-gray-600 mt-1">Falhadas</div>
                    </Card>
                  </div>
                </div>

                {/* Logs Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Tipo</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Destinatário</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Enviado em</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Conteúdo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messageLogs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs rounded font-medium ${log.messageType === "sms" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                              {log.messageType.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{log.recipientPhone}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs rounded font-medium ${
                              log.status === "delivered" ? "bg-green-100 text-green-800" :
                              log.status === "sent" ? "bg-blue-100 text-blue-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {log.status === "delivered" ? "Entregue" : log.status === "sent" ? "Enviado" : "Falhou"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{log.sentAt}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 truncate">{log.content}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
