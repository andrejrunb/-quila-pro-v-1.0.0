import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Clock, TrendingUp, Users } from "lucide-react";

/**
 * Painel de Coordenação
 * Interface para coordenadores gerenciarem alertas e insights
 */
export default function CoordinationDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<number | undefined>(undefined);
  const [selectedClass, setSelectedClass] = useState<number | undefined>(undefined);

  // Queries
  const periodsQuery = trpc.periods.list.useQuery(
    selectedPeriod ? { schoolId: 1 } : { schoolId: 1 },
    { enabled: !!user }
  );

  const pendingAlertsQuery = trpc.alerts.getPendingAlerts.useQuery(
    { limit: 50 },
    { enabled: !!user }
  );

  const alertStatsQuery = trpc.alerts.getAlertStats.useQuery(
    undefined,
    { enabled: !!user }
  );

  const criticalInsightsQuery = trpc.analysis.getCriticalInsights.useQuery(
    selectedPeriod ? { periodId: selectedPeriod, classId: selectedClass } : { periodId: 1, classId: selectedClass },
    { enabled: !!user && !!selectedPeriod }
  );

  const trackingSummaryQuery = trpc.tracking.getDailySummary.useQuery(
    selectedPeriod ? { periodId: selectedPeriod, classId: selectedClass, date: new Date() } : { periodId: 1, classId: selectedClass, date: new Date() },
    { enabled: !!user && !!selectedPeriod }
  );

  // Mutations
  const markAlertAsSentMutation = trpc.alerts.markAlertAsSent.useMutation({
    onSuccess: () => {
      pendingAlertsQuery.refetch();
      alertStatsQuery.refetch();
    },
  });

  const generateStudentAlertsMutation = trpc.alerts.generateStudentAlerts.useMutation({
    onSuccess: () => {
      pendingAlertsQuery.refetch();
      alertStatsQuery.refetch();
    },
  });

  const createParentAlertMutation = trpc.alerts.createParentAlert.useMutation({
    onSuccess: () => {
      pendingAlertsQuery.refetch();
      alertStatsQuery.refetch();
    },
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Apenas coordenadores podem acessar este painel
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Painel de Coordenação</h1>
          <p className="text-gray-600 mt-2">
            Gerencie alertas, insights e dados de segurança da escola
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período Letivo
                </label>
                <select
                  value={selectedPeriod || ""}
                  onChange={(e) => setSelectedPeriod(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Selecione um período</option>
                  {periodsQuery.data?.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Turma (Opcional)
                </label>
                <input
                  type="number"
                  value={selectedClass || ""}
                  onChange={(e) => setSelectedClass(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="ID da turma"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        {alertStatsQuery.data && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total de Alertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{alertStatsQuery.data.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {alertStatsQuery.data.pending}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Enviados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {alertStatsQuery.data.sent}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Entregues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {alertStatsQuery.data.delivered}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Falhados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {alertStatsQuery.data.failed}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Abas de Conteúdo */}
        <Tabs defaultValue="alerts" className="w-full">
          <TabsList>
            <TabsTrigger value="alerts">Alertas Pendentes</TabsTrigger>
            <TabsTrigger value="insights">Insights Críticos</TabsTrigger>
            <TabsTrigger value="summary">Resumo do Dia</TabsTrigger>
          </TabsList>

          {/* Alertas Pendentes */}
          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Alertas Aguardando Envio</CardTitle>
                <CardDescription>
                  {pendingAlertsQuery.data?.totalPending || 0} alertas pendentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingAlertsQuery.isLoading ? (
                  <div className="text-center py-8">Carregando...</div>
                ) : pendingAlertsQuery.data?.alerts && pendingAlertsQuery.data.alerts.length > 0 ? (
                  <div className="space-y-4">
                    {pendingAlertsQuery.data.alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                            <span className="font-medium">Aluno ID: {alert.studentId}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {alert.messageType === "sms" && `📱 ${alert.parentPhone}`}
                            {alert.messageType === "email" && `📧 ${alert.parentEmail}`}
                            {alert.messageType === "whatsapp" && `💬 ${alert.parentPhone}`}
                          </p>
                          <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                            {alert.content}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() =>
                            markAlertAsSentMutation.mutate({ alertId: alert.id })
                          }
                          disabled={markAlertAsSentMutation.isPending}
                        >
                          Marcar Enviado
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum alerta pendente
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Críticos */}
          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle>Insights Críticos</CardTitle>
                <CardDescription>
                  {criticalInsightsQuery.data?.totalCritical || 0} insights críticos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {criticalInsightsQuery.isLoading ? (
                  <div className="text-center py-8">Carregando...</div>
                ) : criticalInsightsQuery.data?.insights && criticalInsightsQuery.data.insights.length > 0 ? (
                  <div className="space-y-4">
                    {criticalInsightsQuery.data.insights.map((insight) => (
                      <div
                        key={insight.id}
                        className="p-4 border border-red-200 bg-red-50 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-5 h-5 text-red-600" />
                              <span className="font-medium text-red-900">
                                {insight.category}
                              </span>
                              <span className="text-sm bg-red-200 text-red-800 px-2 py-1 rounded">
                                Score: {insight.score}
                              </span>
                            </div>
                            <p className="text-sm text-red-800 mt-2">
                              {insight.description}
                            </p>
                            {insight.recommendation && (
                              <p className="text-sm text-red-700 mt-2 font-medium">
                                Recomendação: {insight.recommendation}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // TODO: Implementar criação de alerta para pais
                              createParentAlertMutation.mutate({
                                studentId: insight.studentId,
                                parentPhone: "+55 (XX) XXXXX-XXXX",
                                messageType: "sms",
                                content: `Alerta: ${insight.description}`,
                                insightId: insight.id,
                              });
                            }}
                          >
                            Enviar Alerta
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum insight crítico
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resumo do Dia */}
          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Eventos - Hoje</CardTitle>
              </CardHeader>
              <CardContent>
                {trackingSummaryQuery.isLoading ? (
                  <div className="text-center py-8">Carregando...</div>
                ) : trackingSummaryQuery.data ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-5 h-5 text-blue-600" />
                          <span className="text-sm text-gray-600">Total de Eventos</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {trackingSummaryQuery.data.totalEvents}
                        </div>
                      </div>

                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-5 h-5 text-yellow-600" />
                          <span className="text-sm text-gray-600">Atrasos</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {trackingSummaryQuery.data.eventsByType.late_arrivals || 0}
                        </div>
                      </div>

                      <div className="p-4 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <span className="text-sm text-gray-600">Críticos</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {trackingSummaryQuery.data.criticalEvents}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium mb-3">Detalhamento de Eventos</h3>
                      <div className="space-y-2 text-sm">
                        {Object.entries(trackingSummaryQuery.data.eventsByType).map(
                          ([type, count]) => (
                            <div key={type} className="flex justify-between">
                              <span className="text-gray-600">{type}:</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium mb-2">Tempo Médio Fora de Sala</h3>
                      <div className="text-2xl font-bold">
                        {trackingSummaryQuery.data.averageExitDuration} min
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
