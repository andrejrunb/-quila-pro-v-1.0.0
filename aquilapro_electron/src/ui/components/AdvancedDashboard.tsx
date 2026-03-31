import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, Users, Clock, CheckCircle, XCircle } from 'lucide-react';

interface DashboardMetrics {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  averageAttendance: number;
  criticalAlerts: number;
  systemUptime: number;
}

interface AttendanceData {
  date: string;
  present: number;
  absent: number;
  late: number;
}

interface AlertData {
  type: string;
  count: number;
  color: string;
}

export const AdvancedDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalStudents: 250,
    presentToday: 235,
    absentToday: 10,
    lateToday: 5,
    averageAttendance: 94,
    criticalAlerts: 3,
    systemUptime: 99.8,
  });

  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([
    { date: 'Seg', present: 240, absent: 8, late: 2 },
    { date: 'Ter', present: 242, absent: 6, late: 2 },
    { date: 'Qua', present: 235, absent: 10, late: 5 },
    { date: 'Qui', present: 238, absent: 9, late: 3 },
    { date: 'Sex', present: 245, absent: 4, late: 1 },
  ]);

  const [alertData] = useState<AlertData[]>([
    { type: 'Ausência', count: 15, color: '#ef4444' },
    { type: 'Atraso', count: 8, color: '#f97316' },
    { type: 'Câmera Offline', count: 2, color: '#8b5cf6' },
    { type: 'Não Identificado', count: 5, color: '#06b6d4' },
  ]);

  const [recentAlerts, setRecentAlerts] = useState([
    { id: 1, type: 'Ausência', student: 'João Silva', room: 'Sala 101', time: '08:45', severity: 'high' },
    { id: 2, type: 'Atraso', student: 'Maria Santos', room: 'Sala 102', time: '09:15', severity: 'medium' },
    { id: 3, type: 'Câmera Offline', student: '-', room: 'Sala 105', time: '10:30', severity: 'high' },
    { id: 4, type: 'Não Identificado', student: 'Desconhecido', room: 'Corredor', time: '11:00', severity: 'medium' },
  ]);

  useEffect(() => {
    // Simular atualização de dados em tempo real
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        presentToday: Math.floor(Math.random() * (245 - 230) + 230),
        systemUptime: 99.5 + Math.random() * 0.3,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Dashboard Áquila Pro</h1>
        <p className="text-slate-400">Monitoramento em Tempo Real - {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total de Alunos */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total de Alunos</p>
              <p className="text-3xl font-bold mt-2">{metrics.totalStudents}</p>
            </div>
            <Users className="w-12 h-12 text-blue-300 opacity-50" />
          </div>
        </div>

        {/* Presentes Hoje */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Presentes Hoje</p>
              <p className="text-3xl font-bold mt-2">{metrics.presentToday}</p>
              <p className="text-green-100 text-xs mt-1">{metrics.averageAttendance}% média</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-300 opacity-50" />
          </div>
        </div>

        {/* Ausências */}
        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Ausências</p>
              <p className="text-3xl font-bold mt-2">{metrics.absentToday}</p>
              <p className="text-red-100 text-xs mt-1">{metrics.lateToday} atrasados</p>
            </div>
            <XCircle className="w-12 h-12 text-red-300 opacity-50" />
          </div>
        </div>

        {/* Alertas Críticos */}
        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Alertas Críticos</p>
              <p className="text-3xl font-bold mt-2">{metrics.criticalAlerts}</p>
              <p className="text-orange-100 text-xs mt-1">Uptime: {metrics.systemUptime.toFixed(1)}%</p>
            </div>
            <AlertCircle className="w-12 h-12 text-orange-300 opacity-50" />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Gráfico de Presença */}
        <div className="lg:col-span-2 bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700">
          <h2 className="text-white text-lg font-semibold mb-4">Presença Semanal</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
              <Legend />
              <Bar dataKey="present" fill="#10b981" name="Presentes" />
              <Bar dataKey="absent" fill="#ef4444" name="Ausentes" />
              <Bar dataKey="late" fill="#f97316" name="Atrasados" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Alertas */}
        <div className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700">
          <h2 className="text-white text-lg font-semibold mb-4">Distribuição de Alertas</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={alertData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                nameKey="type"
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {alertData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alertas Recentes */}
      <div className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700">
        <h2 className="text-white text-lg font-semibold mb-4">Alertas Recentes</h2>
        <div className="space-y-3">
          {recentAlerts.map(alert => (
            <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.severity)}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold">{alert.type}</p>
                  <p className="text-sm opacity-75">
                    {alert.student} • {alert.room} • {alert.time}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-opacity-20 bg-current">
                    {alert.severity === 'high' ? 'Crítico' : 'Aviso'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedDashboard;

