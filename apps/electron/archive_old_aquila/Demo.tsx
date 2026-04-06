import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, Clock, AlertCircle, TrendingUp } from "lucide-react";

export default function Demo() {
  const [selectedDate] = useState("2026-02-26");

  // Mock data for charts
  const presenceData = [
    { time: "08:00", presente: 95, ausente: 5 },
    { time: "09:00", presente: 98, ausente: 2 },
    { time: "10:00", presente: 97, ausente: 3 },
    { time: "11:00", presente: 96, ausente: 4 },
    { time: "12:00", presente: 85, ausente: 15 },
    { time: "13:00", presente: 99, ausente: 1 },
    { time: "14:00", presente: 98, ausente: 2 },
  ];

  const engagementData = [
    { name: "Alto", value: 65, color: "#3b82f6" },
    { name: "Médio", value: 25, color: "#60a5fa" },
    { name: "Baixo", value: 10, color: "#93c5fd" },
  ];

  const roomData = [
    { sala: "101", presentes: 28, ausentes: 2 },
    { sala: "102", presentes: 30, ausentes: 0 },
    { sala: "103", presentes: 27, ausentes: 3 },
    { sala: "104", presentes: 29, ausentes: 1 },
    { sala: "105", presentes: 26, ausentes: 4 },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <section className="py-12 px-4 bg-gradient-to-br from-blue-50 to-white border-b">
          <div className="container max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Dashboard Interativo
            </h1>
            <p className="text-gray-600">
              Explore as funcionalidades do Sistema Áquila Pro com dados simulados
            </p>
          </div>
        </section>

        {/* Dashboard */}
        <section className="py-8 px-4 bg-white">
          <div className="container max-w-6xl mx-auto">
            {/* KPI Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total de Alunos</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">487</p>
                  </div>
                  <Users className="w-12 h-12 text-blue-600 opacity-20" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Presentes Hoje</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">465</p>
                  </div>
                  <Clock className="w-12 h-12 text-green-600 opacity-20" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Taxa de Presença</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">95.5%</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-blue-600 opacity-20" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Alertas Hoje</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">3</p>
                  </div>
                  <AlertCircle className="w-12 h-12 text-orange-600 opacity-20" />
                </div>
              </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="presence" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="presence">Presença</TabsTrigger>
                <TabsTrigger value="engagement">Engajamento</TabsTrigger>
                <TabsTrigger value="rooms">Por Sala</TabsTrigger>
              </TabsList>

              <TabsContent value="presence" className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Presença ao Longo do Dia - {selectedDate}
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={presenceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="presente" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="ausente" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </TabsContent>

              <TabsContent value="engagement" className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Distribuição de Engajamento
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={engagementData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {engagementData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </TabsContent>

              <TabsContent value="rooms" className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Presença por Sala de Aula
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={roomData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sala" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="presentes" fill="#3b82f6" />
                      <Bar dataKey="ausentes" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Recent Alerts */}
            <Card className="p-6 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Alertas Recentes
              </h3>
              <div className="space-y-4">
                {[
                  { aluno: "João Silva", evento: "Saída não autorizada", hora: "10:45", tipo: "warning" },
                  { aluno: "Maria Santos", evento: "Ausência em aula", hora: "09:30", tipo: "info" },
                  { aluno: "Pedro Costa", evento: "Padrão de faltas detectado", hora: "08:15", tipo: "alert" },
                ].map((alert, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{alert.aluno}</p>
                      <p className="text-sm text-gray-600">{alert.evento}</p>
                    </div>
                    <span className="text-sm text-gray-500">{alert.hora}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* Features Highlight */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="container max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Recursos Demonstrados
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  title: "Monitoramento em Tempo Real",
                  description: "Visualize a presença dos alunos em tempo real com atualização automática dos dados."
                },
                {
                  title: "Análise de Engajamento",
                  description: "Identifique padrões de comportamento e engajamento para intervenções pedagógicas."
                },
                {
                  title: "Relatórios Detalhados",
                  description: "Gere relatórios personalizáveis com dados de presença, frequência e comportamento."
                },
                {
                  title: "Alertas Inteligentes",
                  description: "Receba notificações automáticas sobre eventos críticos e anomalias detectadas."
                },
              ].map((feature, idx) => (
                <div key={idx} className="bg-white p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
