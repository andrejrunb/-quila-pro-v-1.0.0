import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import './AdvancedDashboard.css';

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

  const [attendanceData] = useState<AttendanceData[]>([
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

  const recentAlerts = [
    { id: 1, type: 'Ausência', student: 'João Silva', room: 'Sala 101', time: '08:45', severity: 'high' },
    { id: 2, type: 'Atraso', student: 'Maria Santos', room: 'Sala 102', time: '09:15', severity: 'medium' },
    { id: 3, type: 'Câmera Offline', student: '-', room: 'Sala 105', time: '10:30', severity: 'high' },
    { id: 4, type: 'Não Identificado', student: 'Desconhecido', room: 'Corredor', time: '11:00', severity: 'medium' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        presentToday: Math.floor(Math.random() * (245 - 230) + 230),
        systemUptime: 99.5 + Math.random() * 0.3,
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="advanced-dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1>Dashboard Áquila Pro</h1>
        <p>Monitoramento em Tempo Real - {new Date().toLocaleDateString('pt-BR')}</p>
      </header>

      {/* Métricas Principais */}
      <div className="metrics-row">
        <div className="metric-card students">
          <div className="metric-info">
            <p>Total de Alunos</p>
            <div className="metric-value">{metrics.totalStudents}</div>
          </div>
          <Users size={48} className="metric-icon" />
        </div>

        <div className="metric-card presence">
          <div className="metric-info">
            <p>Presentes Hoje</p>
            <div className="metric-value">{metrics.presentToday}</div>
            <div className="metric-sub">{metrics.averageAttendance}% média</div>
          </div>
          <CheckCircle size={48} className="metric-icon" />
        </div>

        <div className="metric-card absence">
          <div className="metric-info">
            <p>Ausências</p>
            <div className="metric-value">{metrics.absentToday}</div>
            <div className="metric-sub">{metrics.lateToday} atrasados</div>
          </div>
          <XCircle size={48} className="metric-icon" />
        </div>

        <div className="metric-card alerts">
          <div className="metric-info">
            <p>Alertas Críticos</p>
            <div className="metric-value">{metrics.criticalAlerts}</div>
            <div className="metric-sub">Uptime: {metrics.systemUptime.toFixed(1)}%</div>
          </div>
          <AlertCircle size={48} className="metric-icon" />
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        <div className="chart-panel">
          <h2>Presença Semanal</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              <Bar dataKey="present" fill="#10b981" name="Presentes" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" fill="#ef4444" name="Ausentes" radius={[4, 4, 0, 0]} />
              <Bar dataKey="late" fill="#f97316" name="Atrasados" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-panel">
          <h2>Distribuição de Alertas</h2>
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
                dataKey="count"
              >
                {alertData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alertas Recentes */}
      <section className="alerts-panel">
        <h2>Alertas Recentes</h2>
        <div className="alerts-list">
          {recentAlerts.map(alert => (
            <div key={alert.id} className={`alert-item ${alert.severity}`}>
              <div className="alert-main">
                <div className="alert-type">{alert.type}</div>
                <div className="alert-desc">
                  {alert.student} • {alert.room} • {alert.time}
                </div>
              </div>
              <span className="severity-badge">
                {alert.severity === 'high' ? 'Crítico' : 'Aviso'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdvancedDashboard;
