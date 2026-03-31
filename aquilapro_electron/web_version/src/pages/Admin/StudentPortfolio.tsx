import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Clock, AlertCircle, TrendingUp, Users, Calendar, Eye } from "lucide-react";

export default function StudentPortfolio() {
  const { studentId, periodId } = useParams<{ studentId: string; periodId: string }>();
  const [activeTab, setActiveTab] = useState("overview");

  const studentIdNum = parseInt(studentId || "0");
  const periodIdNum = parseInt(periodId || "0");

  const { data: metrics, isLoading: metricsLoading } = trpc.portfolio.getMetrics.useQuery(
    {
      studentId: studentIdNum,
      academicPeriodId: periodIdNum,
    },
    { enabled: studentIdNum > 0 && periodIdNum > 0 }
  );

  const { data: lateArrivals } = trpc.portfolio.getLateArrivals.useQuery(
    { studentId: studentIdNum, limit: 20 },
    { enabled: studentIdNum > 0 }
  );

  const { data: absences } = trpc.portfolio.getAbsences.useQuery(
    { studentId: studentIdNum, limit: 20 },
    { enabled: studentIdNum > 0 }
  );

  const { data: roomExits } = trpc.portfolio.getRoomExits.useQuery(
    { studentId: studentIdNum, limit: 20 },
    { enabled: studentIdNum > 0 }
  );

  const { data: comparisons } = trpc.portfolio.getComparisons.useQuery(
    {
      studentId: studentIdNum,
      academicPeriodId: periodIdNum,
    },
    { enabled: studentIdNum > 0 && periodIdNum > 0 }
  );

  // Determinar status
  const getStatus = (presence: number) => {
    if (presence >= 95) return { label: "Excelente", color: "bg-green-100 text-green-800" };
    if (presence >= 85) return { label: "Bom", color: "bg-blue-100 text-blue-800" };
    if (presence >= 75) return { label: "Atenção", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Crítico", color: "bg-red-100 text-red-800" };
  };

  const status = getStatus(metrics?.presencePercentage || 0);

  // Dados para gráficos
  const timeData = [
    {
      name: "Em Sala",
      value: metrics?.totalHoursInClass || 0,
      fill: "#3b82f6",
    },
    {
      name: "Fora de Sala",
      value: metrics?.totalHoursOutOfClass || 0,
      fill: "#f59e0b",
    },
  ];

  const lateData = (lateArrivals || []).slice(0, 10).map((late) => ({
    date: late.date,
    minutos: late.durationMinutes,
  }));

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando portfólio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portfólio do Aluno</h1>
          <p className="text-gray-600 mt-2">Análise completa de comportamento e assiduidade</p>
        </div>
        <Badge className={`${status.color} text-lg px-4 py-2`}>{status.label}</Badge>
      </div>

      {/* Resumo Executivo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Presença</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{metrics?.presencePercentage || 0}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics?.totalDaysPresent || 0} dias presentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Atrasos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{metrics?.totalMinutesLate || 0}min</div>
            <p className="text-xs text-gray-500 mt-1">Acumulados no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Faltas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{metrics?.totalDaysAbsent || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Dias ausentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Fora de Sala</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{metrics?.totalMinutesOutOfClass || 0}min</div>
            <p className="text-xs text-gray-500 mt-1">Tempo acumulado</p>
          </CardContent>
        </Card>
      </div>

      {/* Abas de Conteúdo */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="comparisons">Comparativos</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de Tempo em Sala */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Tempo</CardTitle>
                <CardDescription>Horas em sala vs. fora de sala</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={timeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}h`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {timeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Atrasos */}
            <Card>
              <CardHeader>
                <CardTitle>Atrasos Recentes</CardTitle>
                <CardDescription>Últimos 10 atrasos registrados</CardDescription>
              </CardHeader>
              <CardContent>
                {lateData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={lateData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="minutos" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-300 text-gray-500">
                    Sem atrasos registrados
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Comparativos Rápidos */}
          <Card>
            <CardHeader>
              <CardTitle>Posição na Turma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Presença vs. Média da Turma</span>
                    <span className="text-sm text-gray-600">
                      {metrics?.presencePercentage || 0}% vs {comparisons?.classAveragePresence || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min((metrics?.presencePercentage || 0) / 100, 1) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Ranking na Turma</span>
                    <span className="text-sm text-gray-600">
                      {comparisons?.classRankingPosition || 0}º de {comparisons?.classRankingTotal || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${Math.max(100 - ((comparisons?.classRankingPosition || 1) / (comparisons?.classRankingTotal || 1)) * 100, 0)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Percentil Escolar</span>
                    <span className="text-sm text-gray-600">{comparisons?.schoolPercentile || 0}º percentil</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${comparisons?.schoolPercentile || 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="history" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Atrasos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Histórico de Atrasos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {lateArrivals && lateArrivals.length > 0 ? (
                    lateArrivals.map((late, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                        <div>
                          <p className="font-medium text-sm">{late.date}</p>
                          <p className="text-xs text-gray-600">{late.time}</p>
                        </div>
                        <Badge variant="outline">{late.durationMinutes} min</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Sem atrasos registrados</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Faltas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Histórico de Faltas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {absences && absences.length > 0 ? (
                    absences.map((absence, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-red-50 rounded">
                        <div>
                          <p className="font-medium text-sm">{absence.date}</p>
                          <p className="text-xs text-gray-600">
                            {absence.period === "morning"
                              ? "Manhã"
                              : absence.period === "afternoon"
                                ? "Tarde"
                                : "Integral"}
                          </p>
                        </div>
                        <Badge variant={absence.justified ? "default" : "destructive"}>
                          {absence.justified ? "Justificada" : "Injustificada"}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Sem faltas registradas</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Saídas de Sala */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Histórico de Saídas de Sala
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {roomExits && roomExits.length > 0 ? (
                    roomExits.map((exit, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-purple-50 rounded">
                        <div>
                          <p className="font-medium text-sm">
                            {exit.date} - {exit.exitTime}
                          </p>
                          <p className="text-xs text-gray-600 capitalize">{exit.reason}</p>
                        </div>
                        <Badge variant="outline">{exit.durationMinutes} min</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Sem saídas registradas</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Comparativos */}
        <TabsContent value="comparisons">
          <Card>
            <CardHeader>
              <CardTitle>Análise Comparativa</CardTitle>
              <CardDescription>Desempenho do aluno em relação à turma e escola</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Presença</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Aluno</span>
                      <span className="font-medium">{metrics?.presencePercentage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${metrics?.presencePercentage || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Média da Turma</span>
                      <span className="font-medium">{comparisons?.classAveragePresence || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${comparisons?.classAveragePresence || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Média da Escola</span>
                      <span className="font-medium">{comparisons?.schoolAveragePresence || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${comparisons?.schoolAveragePresence || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-4">Posição</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Ranking na Turma</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {comparisons?.classRankingPosition || 0}º
                    </p>
                    <p className="text-xs text-gray-500">
                      de {comparisons?.classRankingTotal || 0} alunos
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Percentil Escolar</p>
                    <p className="text-2xl font-bold text-green-600">
                      {comparisons?.schoolPercentile || 0}%
                    </p>
                    <p className="text-xs text-gray-500">Acima da média</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alertas */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alertas e Recomendações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(metrics?.presencePercentage || 0) < 75 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Presença Crítica</p>
                    <p className="text-sm text-red-800">
                      Presença abaixo de 75%. Ação imediata necessária.
                    </p>
                  </div>
                </div>
              )}

              {(metrics?.totalMinutesLate || 0) > 180 && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-orange-900">Atrasos Frequentes</p>
                    <p className="text-sm text-orange-800">
                      Aluno chegando frequentemente atrasado. Recomendamos conversa com responsável.
                    </p>
                  </div>
                </div>
              )}

              {(metrics?.totalMinutesOutOfClass || 0) > 300 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900">Tempo Excessivo Fora de Sala</p>
                    <p className="text-sm text-yellow-800">
                      Pode indicar dificuldade de concentração ou problemas de saúde.
                    </p>
                  </div>
                </div>
              )}

              {(metrics?.presencePercentage || 0) >= 95 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
                  <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">Excelente Desempenho</p>
                    <p className="text-sm text-green-800">
                      Continue assim! Mantenha a assiduidade e o comprometimento.
                    </p>
                  </div>
                </div>
              )}

              {(metrics?.presencePercentage || 0) >= 85 &&
                (metrics?.presencePercentage || 0) < 95 &&
                (metrics?.totalMinutesLate || 0) <= 180 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900">Bom Desempenho</p>
                      <p className="text-sm text-blue-800">
                        Aluno apresenta bom desempenho. Mantenha o acompanhamento.
                      </p>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
