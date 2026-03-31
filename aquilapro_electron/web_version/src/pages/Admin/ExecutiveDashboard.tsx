import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Users, Clock, Shield, TrendingUp, TrendingDown, AlertTriangle,
  BarChart3, Eye, Bell, Calendar, Download, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, MinusCircle, ArrowUpRight, ArrowDownRight
} from "lucide-react";

export default function ExecutiveDashboard() {
  const [period, setPeriod] = useState("today");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const kpis = {
    today: {
      totalStudents: 247,
      presentStudents: 231,
      absentStudents: 16,
      attendanceRate: 93.5,
      attendanceTrend: 1.2,
      lateArrivals: 8,
      earlyDepartures: 3,
      securityAlerts: 2,
      camerasOnline: 10,
      camerasTotal: 10,
      avgTimeInClass: 42.5,
      avgTimeOutside: 7.3,
      unidentifiedPersons: 1,
      classroomsMonitored: 8,
    },
    week: {
      totalStudents: 247,
      presentStudents: 228,
      absentStudents: 19,
      attendanceRate: 92.3,
      attendanceTrend: -0.5,
      lateArrivals: 34,
      earlyDepartures: 12,
      securityAlerts: 7,
      camerasOnline: 10,
      camerasTotal: 10,
      avgTimeInClass: 41.8,
      avgTimeOutside: 8.1,
      unidentifiedPersons: 4,
      classroomsMonitored: 8,
    },
    month: {
      totalStudents: 247,
      presentStudents: 222,
      absentStudents: 25,
      attendanceRate: 89.9,
      attendanceTrend: -2.1,
      lateArrivals: 142,
      earlyDepartures: 48,
      securityAlerts: 23,
      camerasOnline: 10,
      camerasTotal: 10,
      avgTimeInClass: 40.2,
      avgTimeOutside: 9.5,
      unidentifiedPersons: 12,
      classroomsMonitored: 8,
    }
  };

  const data = kpis[period as keyof typeof kpis];

  const classroomRanking = [
    { name: "3A - Ensino Médio", rate: 97.2, students: 35, trend: "up" },
    { name: "2B - Ensino Médio", rate: 95.8, students: 32, trend: "up" },
    { name: "1A - Ensino Médio", rate: 94.1, students: 30, trend: "stable" },
    { name: "3B - Ensino Médio", rate: 93.5, students: 33, trend: "down" },
    { name: "2A - Ensino Médio", rate: 91.2, students: 31, trend: "down" },
    { name: "1B - Ensino Médio", rate: 90.8, students: 28, trend: "up" },
    { name: "9A - Fundamental", rate: 89.5, students: 30, trend: "stable" },
    { name: "9B - Fundamental", rate: 87.3, students: 28, trend: "down" },
  ];

  const recentAlerts = [
    { time: "14:32", type: "security", message: "Aluno não identificado no corredor B2", severity: "high" },
    { time: "13:15", type: "attendance", message: "Taxa de presença abaixo de 85% na turma 9B", severity: "medium" },
    { time: "11:45", type: "behavior", message: "Aluno João S. saiu 3x da sala em 2h", severity: "medium" },
    { time: "10:20", type: "system", message: "Câmera 7 reconectada após 5min offline", severity: "low" },
    { time: "08:30", type: "attendance", message: "16 alunos ausentes hoje (6.5%)", severity: "low" },
  ];

  const weeklyAttendance = [
    { day: "Seg", rate: 94.2 },
    { day: "Ter", rate: 93.8 },
    { day: "Qua", rate: 91.5 },
    { day: "Qui", rate: 95.1 },
    { day: "Sex", rate: 89.7 },
  ];

  const insights = [
    {
      title: "Padrão de Ausência",
      description: "Sextas-feiras têm 4.5% mais faltas que outros dias. Considere atividades especiais.",
      type: "pattern",
      action: "Analisar detalhes"
    },
    {
      title: "Turma em Risco",
      description: "9B apresenta queda de 3.2% na presença nas últimas 2 semanas.",
      type: "risk",
      action: "Ver turma"
    },
    {
      title: "Melhoria Detectada",
      description: "3A aumentou presença em 2.1% após implementação do sistema.",
      type: "improvement",
      action: "Ver relatório"
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "pattern": return <BarChart3 className="w-5 h-5 text-blue-600" />;
      case "risk": return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "improvement": return <TrendingUp className="w-5 h-5 text-green-600" />;
      default: return <Eye className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-24">
        {/* Header */}
        <section className="py-8 px-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          <div className="container max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Dashboard Executivo</h1>
                <p className="text-gray-300 mt-1">Visão geral do sistema Áquila Pro</p>
              </div>
              <div className="flex gap-3">
                <div className="flex bg-gray-700 rounded-lg overflow-hidden">
                  {[
                    { key: "today", label: "Hoje" },
                    { key: "week", label: "Semana" },
                    { key: "month", label: "Mês" }
                  ].map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setPeriod(p.key)}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        period === p.key ? "bg-blue-600 text-white" : "text-gray-300 hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* KPI Cards */}
        <section className="py-8 px-4 bg-gray-50">
          <div className="container max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className={`flex items-center text-sm font-medium ${data.attendanceTrend >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {data.attendanceTrend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {Math.abs(data.attendanceTrend)}%
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{data.attendanceRate}%</div>
                <div className="text-sm text-gray-500 mt-1">Taxa de Presença</div>
                <div className="text-xs text-gray-400 mt-2">{data.presentStudents}/{data.totalStudents} alunos</div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <span className="text-sm text-orange-600 font-medium">{data.lateArrivals} atrasos</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{data.absentStudents}</div>
                <div className="text-sm text-gray-500 mt-1">Alunos Ausentes</div>
                <div className="text-xs text-gray-400 mt-2">{data.earlyDepartures} saídas antecipadas</div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  <span className={`text-sm font-medium ${data.securityAlerts > 5 ? "text-red-600" : "text-green-600"}`}>
                    {data.securityAlerts > 5 ? "Atenção" : "Normal"}
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{data.securityAlerts}</div>
                <div className="text-sm text-gray-500 mt-1">Alertas de Segurança</div>
                <div className="text-xs text-gray-400 mt-2">{data.unidentifiedPersons} pessoa(s) não identificada(s)</div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Eye className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">{data.camerasOnline}/{data.camerasTotal} online</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{data.classroomsMonitored}</div>
                <div className="text-sm text-gray-500 mt-1">Salas Monitoradas</div>
                <div className="text-xs text-gray-400 mt-2">Tempo médio em sala: {data.avgTimeInClass}min</div>
              </Card>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <section className="py-8 px-4 bg-white">
          <div className="container max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              
              {/* Classroom Ranking */}
              <div className="md:col-span-2">
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Ranking de Salas por Presença</h2>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {classroomRanking.map((room, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          idx < 3 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{room.name}</div>
                          <div className="text-sm text-gray-500">{room.students} alunos</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                room.rate >= 95 ? "bg-green-500" :
                                room.rate >= 90 ? "bg-blue-500" :
                                room.rate >= 85 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              style={{ width: `${room.rate}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-900 w-14 text-right">{room.rate}%</span>
                          {room.trend === "up" && <TrendingUp className="w-4 h-4 text-green-500" />}
                          {room.trend === "down" && <TrendingDown className="w-4 h-4 text-red-500" />}
                          {room.trend === "stable" && <MinusCircle className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Recent Alerts */}
              <div>
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Alertas Recentes</h2>
                    <Bell className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="space-y-3">
                    {recentAlerts.map((alert, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-medium uppercase">{alert.type}</span>
                          <span className="text-xs">{alert.time}</span>
                        </div>
                        <p className="text-sm">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Insights Section */}
        <section className="py-8 px-4 bg-gray-50">
          <div className="container max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Insights da IA</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {insights.map((insight, idx) => (
                <Card key={idx} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-4">
                    {getInsightIcon(insight.type)}
                    <h3 className="font-bold text-gray-900">{insight.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{insight.description}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    {insight.action}
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Weekly Chart */}
        <section className="py-8 px-4 bg-white">
          <div className="container max-w-7xl mx-auto">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Presença Semanal</h2>
              <div className="flex items-end gap-4 h-48">
                {weeklyAttendance.map((day, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{day.rate}%</span>
                    <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: "100%" }}>
                      <div
                        className={`absolute bottom-0 w-full rounded-t-lg transition-all ${
                          day.rate >= 93 ? "bg-green-500" :
                          day.rate >= 90 ? "bg-blue-500" : "bg-yellow-500"
                        }`}
                        style={{ height: `${(day.rate / 100) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500">{day.day}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
