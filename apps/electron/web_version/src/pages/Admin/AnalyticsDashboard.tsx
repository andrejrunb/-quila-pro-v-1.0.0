import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  BarChart3, TrendingUp, TrendingDown, Users, Clock, Eye,
  Download, Calendar, Filter, ArrowUpRight, ArrowDownRight,
  Brain, Target, AlertTriangle, CheckCircle2, Zap
} from "lucide-react";

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState("month");
  const [activeView, setActiveView] = useState("overview");

  // KPIs Principais
  const mainKPIs = {
    avgAttendance: { value: 92.3, change: 1.8, label: "Presença Média" },
    avgLateness: { value: 4.2, change: -0.5, label: "Atrasos/Dia" },
    securityScore: { value: 98.5, change: 0.3, label: "Score Segurança" },
    aiAccuracy: { value: 99.2, change: 0.1, label: "Precisão IA" },
  };

  // Tendências Semanais
  const weeklyTrends = [
    { week: "Sem 1", attendance: 91.2, alerts: 12, lateness: 5.1 },
    { week: "Sem 2", attendance: 92.8, alerts: 8, lateness: 4.3 },
    { week: "Sem 3", attendance: 90.5, alerts: 15, lateness: 5.8 },
    { week: "Sem 4", attendance: 93.7, alerts: 6, lateness: 3.2 },
  ];

  // Previsões da IA
  const aiPredictions = [
    {
      title: "Previsão de Presença - Próxima Semana",
      prediction: "91.8%",
      confidence: 87,
      reasoning: "Baseado no padrão histórico e previsão de chuva para quarta-feira",
      trend: "stable"
    },
    {
      title: "Risco de Evasão - 9B",
      prediction: "3 alunos em risco",
      confidence: 72,
      reasoning: "Queda progressiva de presença nos últimos 15 dias",
      trend: "down"
    },
    {
      title: "Impacto Climático",
      prediction: "+2.3% faltas",
      confidence: 81,
      reasoning: "Previsão de chuva forte para quinta e sexta",
      trend: "down"
    }
  ];

  // Padrões Comportamentais
  const behaviorPatterns = [
    { pattern: "Pico de atrasos às segundas-feiras (7:15-7:30)", frequency: "Semanal", impact: "Médio", suggestion: "Considerar tolerância de 10min às segundas" },
    { pattern: "Queda de presença pós-feriado prolongado", frequency: "Mensal", impact: "Alto", suggestion: "Enviar lembrete aos pais na véspera do retorno" },
    { pattern: "Alunos do 9B saem mais da sala (média 3.2x/aula)", frequency: "Diário", impact: "Médio", suggestion: "Conversar com professor titular da turma" },
    { pattern: "Sextas-feiras têm 4.5% menos presença", frequency: "Semanal", impact: "Alto", suggestion: "Implementar atividades especiais às sextas" },
    { pattern: "Correlação entre clima chuvoso e +15% atrasos", frequency: "Variável", impact: "Médio", suggestion: "Notificar pais sobre previsão de chuva" },
  ];

  // Ranking por Turma
  const classRanking = [
    { name: "3A", attendance: 97.2, trend: 1.5, students: 35, alerts: 1 },
    { name: "2B", attendance: 95.8, trend: 0.8, students: 32, alerts: 2 },
    { name: "1A", attendance: 94.1, trend: 0.2, students: 30, alerts: 3 },
    { name: "3B", attendance: 93.5, trend: -0.5, students: 33, alerts: 2 },
    { name: "2A", attendance: 91.2, trend: -1.2, students: 31, alerts: 4 },
    { name: "1B", attendance: 90.8, trend: 0.3, students: 28, alerts: 3 },
    { name: "9A", attendance: 89.5, trend: -0.8, students: 30, alerts: 5 },
    { name: "9B", attendance: 87.3, trend: -2.1, students: 28, alerts: 8 },
  ];

  // Horas do dia com mais atividade
  const hourlyActivity = [
    { hour: "07:00", arrivals: 45, departures: 0, alerts: 0 },
    { hour: "07:15", arrivals: 120, departures: 0, alerts: 1 },
    { hour: "07:30", arrivals: 65, departures: 0, alerts: 2 },
    { hour: "08:00", arrivals: 12, departures: 0, alerts: 0 },
    { hour: "09:00", arrivals: 3, departures: 2, alerts: 0 },
    { hour: "10:00", arrivals: 0, departures: 5, alerts: 1 },
    { hour: "11:00", arrivals: 0, departures: 8, alerts: 0 },
    { hour: "12:00", arrivals: 0, departures: 45, alerts: 0 },
    { hour: "12:30", arrivals: 0, departures: 180, alerts: 1 },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-24">
        {/* Header */}
        <section className="py-8 px-4 bg-gradient-to-br from-indigo-900 to-purple-900 text-white">
          <div className="container max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Brain className="w-8 h-8 text-purple-300" />
                  <h1 className="text-3xl font-bold">Analytics Avançado</h1>
                </div>
                <p className="text-purple-200">Inteligência Artificial aplicada à gestão escolar</p>
              </div>
              <div className="flex gap-3">
                <div className="flex bg-white/10 rounded-lg overflow-hidden">
                  {[
                    { key: "week", label: "Semana" },
                    { key: "month", label: "Mês" },
                    { key: "semester", label: "Semestre" },
                    { key: "year", label: "Ano" }
                  ].map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setPeriod(p.key)}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        period === p.key ? "bg-white text-indigo-900" : "text-white/70 hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>

            {/* View Tabs */}
            <div className="flex gap-2 mt-6">
              {[
                { key: "overview", label: "Visão Geral", icon: <BarChart3 className="w-4 h-4" /> },
                { key: "predictions", label: "Previsões IA", icon: <Brain className="w-4 h-4" /> },
                { key: "patterns", label: "Padrões", icon: <Target className="w-4 h-4" /> },
                { key: "classes", label: "Por Turma", icon: <Users className="w-4 h-4" /> },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveView(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === tab.key ? "bg-white text-indigo-900" : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* KPI Cards */}
        <section className="py-6 px-4 bg-gray-50">
          <div className="container max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(mainKPIs).map(([key, kpi]) => (
                <Card key={key} className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">{kpi.label}</span>
                    <span className={`flex items-center text-sm font-medium ${kpi.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {kpi.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      {Math.abs(kpi.change)}%
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {typeof kpi.value === "number" && kpi.value > 50 ? `${kpi.value}%` : kpi.value}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8 px-4 bg-white">
          <div className="container max-w-7xl mx-auto">

            {/* Overview */}
            {activeView === "overview" && (
              <div className="space-y-8">
                {/* Weekly Trends Chart */}
                <Card className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Tendências Semanais</h2>
                  <div className="grid md:grid-cols-4 gap-4">
                    {weeklyTrends.map((week, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-500 mb-3">{week.week}</div>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Presença</span>
                              <span className="font-semibold">{week.attendance}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${week.attendance}%` }} />
                            </div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Alertas</span>
                            <span className={`font-semibold ${week.alerts > 10 ? "text-red-600" : "text-green-600"}`}>{week.alerts}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Atrasos/dia</span>
                            <span className="font-semibold text-yellow-600">{week.lateness}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Hourly Activity */}
                <Card className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Atividade por Horário</h2>
                  <div className="overflow-x-auto">
                    <div className="flex items-end gap-2 h-40 min-w-[600px]">
                      {hourlyActivity.map((hour, idx) => {
                        const maxVal = Math.max(...hourlyActivity.map(h => h.arrivals + h.departures));
                        const total = hour.arrivals + hour.departures;
                        const height = maxVal > 0 ? (total / maxVal) * 100 : 0;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs text-gray-500">{total}</span>
                            <div className="w-full flex flex-col justify-end" style={{ height: "120px" }}>
                              {hour.arrivals > 0 && (
                                <div
                                  className="w-full bg-green-400 rounded-t"
                                  style={{ height: `${(hour.arrivals / maxVal) * 100}%` }}
                                  title={`${hour.arrivals} chegadas`}
                                />
                              )}
                              {hour.departures > 0 && (
                                <div
                                  className="w-full bg-blue-400"
                                  style={{ height: `${(hour.departures / maxVal) * 100}%` }}
                                  title={`${hour.departures} saídas`}
                                />
                              )}
                            </div>
                            <span className="text-xs text-gray-500">{hour.hour}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-4 mt-4 justify-center">
                      <span className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-3 h-3 bg-green-400 rounded" /> Chegadas
                      </span>
                      <span className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-3 h-3 bg-blue-400 rounded" /> Saídas
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Predictions */}
            {activeView === "predictions" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Previsões da Inteligência Artificial</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {aiPredictions.map((pred, idx) => (
                    <Card key={idx} className="p-6 border-2 border-purple-100">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-bold text-gray-900 text-lg">{pred.title}</h3>
                        {pred.trend === "up" ? <TrendingUp className="w-5 h-5 text-green-500" /> :
                         pred.trend === "down" ? <TrendingDown className="w-5 h-5 text-red-500" /> :
                         <Zap className="w-5 h-5 text-yellow-500" />}
                      </div>
                      <div className="text-3xl font-bold text-purple-700 mb-3">{pred.prediction}</div>
                      <p className="text-sm text-gray-600 mb-4">{pred.reasoning}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${pred.confidence}%` }} />
                        </div>
                        <span className="text-sm font-medium text-gray-600">{pred.confidence}%</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Confiança da previsão</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Patterns */}
            {activeView === "patterns" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Padrões Comportamentais Detectados</h2>
                </div>
                <div className="space-y-4">
                  {behaviorPatterns.map((pattern, idx) => (
                    <Card key={idx} className="p-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className={`w-5 h-5 ${
                              pattern.impact === "Alto" ? "text-red-500" :
                              pattern.impact === "Médio" ? "text-yellow-500" : "text-blue-500"
                            }`} />
                            <h3 className="font-bold text-gray-900">{pattern.pattern}</h3>
                          </div>
                          <div className="flex gap-4 text-sm text-gray-500 mb-3">
                            <span>Frequência: <strong>{pattern.frequency}</strong></span>
                            <span>Impacto: <strong className={
                              pattern.impact === "Alto" ? "text-red-600" :
                              pattern.impact === "Médio" ? "text-yellow-600" : "text-blue-600"
                            }>{pattern.impact}</strong></span>
                          </div>
                        </div>
                        <div className="md:w-80 bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-800">Sugestão da IA</span>
                          </div>
                          <p className="text-sm text-green-700">{pattern.suggestion}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Classes */}
            {activeView === "classes" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Análise por Turma</h2>
                </div>
                <Card className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Pos.</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Turma</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">Alunos</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">Presença</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">Tendência</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">Alertas</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classRanking.map((cls, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                idx < 3 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                              }`}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium text-gray-900">{cls.name}</td>
                            <td className="text-center py-3 px-4 text-gray-600">{cls.students}</td>
                            <td className="text-center py-3 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      cls.attendance >= 95 ? "bg-green-500" :
                                      cls.attendance >= 90 ? "bg-blue-500" :
                                      cls.attendance >= 85 ? "bg-yellow-500" : "bg-red-500"
                                    }`}
                                    style={{ width: `${cls.attendance}%` }}
                                  />
                                </div>
                                <span className="font-semibold text-sm">{cls.attendance}%</span>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              <span className={`flex items-center justify-center gap-1 text-sm font-medium ${
                                cls.trend >= 0 ? "text-green-600" : "text-red-600"
                              }`}>
                                {cls.trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                {Math.abs(cls.trend)}%
                              </span>
                            </td>
                            <td className="text-center py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                cls.alerts <= 2 ? "bg-green-100 text-green-700" :
                                cls.alerts <= 5 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                              }`}>
                                {cls.alerts}
                              </span>
                            </td>
                            <td className="text-center py-3 px-4">
                              {cls.attendance >= 90 ? (
                                <span className="text-green-600 text-sm font-medium">Saudável</span>
                              ) : cls.attendance >= 85 ? (
                                <span className="text-yellow-600 text-sm font-medium">Atenção</span>
                              ) : (
                                <span className="text-red-600 text-sm font-medium">Crítico</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
