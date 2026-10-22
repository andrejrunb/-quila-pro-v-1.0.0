import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, Users, Clock, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import './AdvancedDashboard.css';

interface DashboardMetrics {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  averageAttendance: number;
  criticalAlerts: number;
  systemUptime: number;
  npuTemp: number;
  npuHealth: number;
  npuLoad: number;
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
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    averageAttendance: 0,
    criticalAlerts: 0,
    systemUptime: 0,
    npuTemp: 0,
    npuHealth: 0,
    npuLoad: 0,
  });

  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [alertData, setAlertData] = useState<AlertData[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const stats = await (window as any).aquila.ipcRenderer.invoke('system:get-dashboard-stats');
      const hardware = await (window as any).aquila.ipcRenderer.invoke('system:get-hardware-telemetry');
      
      if (stats) {
        setMetrics({
          ...stats,
          npuTemp: hardware?.temperature || 0,
          npuHealth: hardware?.healthScore || 0,
          npuLoad: (hardware?.load_factor || 0) * 100
        });
      }

      const weekly = await (window as any).aquila.ipcRenderer.invoke('system:get-weekly-attendance');
      if (weekly) setAttendanceData(weekly);

      const alerts = await (window as any).aquila.ipcRenderer.invoke('system:get-recent-alerts');
      if (alerts) {
        setRecentAlerts(alerts);
        
        // Calcular alertData para o PieChart
        const distribution = alerts.reduce((acc: any, curr: any) => {
          acc[curr.type] = (acc[curr.type] || 0) + 1;
          return acc;
        }, {});
        
        const colors = ['#ef4444', '#f97316', '#8b5cf6', '#06b6d4'];
        setAlertData(Object.keys(distribution).map((type, i) => ({
          type,
          count: distribution[type],
          color: colors[i % colors.length]
        })));
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  };

  const handleDismiss = async (studentId: string, riskType: string) => {
    if (!studentId) return;
    const reason = window.prompt("Justificativa para o descarte do alerta:");
    if (reason === null) return; // Cancelado

    try {
      const result = await (window as any).aquila.ipcRenderer.invoke('pedagogical:dismiss-risk', studentId, riskType, reason);
      if (result.success) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Erro ao descartar risco:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // Refresh every 10s
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
            <p>Estado do Sistema</p>
            <div className="metric-value">{metrics.npuHealth}%</div>
            <div className="metric-sub">NPU: {metrics.npuTemp}°C | Load: {metrics.npuLoad.toFixed(1)}%</div>
          </div>
          <ShieldAlert size={48} className="metric-icon" />
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
              <div className="alert-actions">
                <span className="severity-badge">
                  {alert.severity === 'high' ? 'Crítico' : 'Aviso'}
                </span>
                <button 
                  className="dismiss-btn" 
                  onClick={() => handleDismiss(alert.studentId, alert.riskType)}
                  title="Descartar Alerta"
                >
                  Descartar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdvancedDashboard;
