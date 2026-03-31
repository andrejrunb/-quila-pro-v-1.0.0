import React, { useState, useEffect } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import './Monitoring.css';

interface SystemMetrics {
  timestamp: Date;
  cpu: number;
  ram: number;
  disk: number;
  fps: number;
  latency: number;
  detections: number;
  recognitions: number;
  alerts: number;
  uptime: number;
  activeUsers: number;
  activeCameras: number;
}

interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
}

/**
 * Dashboard de Monitoramento em Tempo Real
 */
const MetricMeter: React.FC<{ 
  label: string; 
  value: number; 
  unit: string; 
  thresholds: [number, number]; 
  history: SystemMetrics[]; 
  historyKey: keyof SystemMetrics;
  barWidthCalc?: (v: number) => number;
}> = ({ label, value, unit, thresholds, history, historyKey, barWidthCalc }) => {
  const barRef = React.useRef<HTMLDivElement>(null);
  const valueRef = React.useRef<HTMLSpanElement>(null);

  const getMetricColor = (v: number, t: [number, number]) => {
    if (v <= t[0]) return '#4CAF50';
    if (v <= t[1]) return '#FF9800';
    return '#F44336';
  };

  React.useEffect(() => {
    const color = getMetricColor(label === 'FPS' ? 60 - value : value, thresholds);
    const width = barWidthCalc ? barWidthCalc(value) : value;
    
    if (barRef.current) {
      barRef.current.style.setProperty('--bar-width', `${width}%`);
      barRef.current.style.backgroundColor = color;
    }
    if (valueRef.current) {
      valueRef.current.style.color = color;
    }
  }, [value, thresholds, label, barWidthCalc]);

  return (
    <div className="metric-card">
      <div className="metric-header">
        <h3>{label}</h3>
        <span ref={valueRef} className="metric-value">
          {value.toFixed(label === 'Latência' ? 0 : 1)}{unit}
        </span>
      </div>
      <div className="metric-chart">
        <svg viewBox="0 0 100 30" preserveAspectRatio="none">
          <polyline
            points={history
              .map((m, i) => {
                const val = m[historyKey] as number;
                const y = label === 'Latência' ? Math.min(100, (val / 2000) * 100) : (label === 'FPS' ? (val / 60) * 100 : 100 - val);
                return `${(i / (history.length - 1)) * 100},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="#0066cc"
            strokeWidth="0.5"
          />
        </svg>
      </div>
      <div className="metric-bar">
        <div ref={barRef} className="bar-fill" />
      </div>
    </div>
  );
};

export const Monitoring: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    timestamp: new Date(),
    cpu: 35,
    ram: 12,
    disk: 45,
    fps: 28,
    latency: 120,
    detections: 1250,
    recognitions: 980,
    alerts: 3,
    uptime: 45,
    activeUsers: 5,
    activeCameras: 8,
  });

  const [history, setHistory] = useState<SystemMetrics[]>([metrics]);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    status: 'healthy',
    message: 'Sistema operando normalmente',
    timestamp: new Date(),
  });

  const [alerts, setAlerts] = useState<HealthStatus[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { isConnected, lastMessage } = useWebSocket();

  // Simular atualização de métricas
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setMetrics(prev => {
        const newMetrics: SystemMetrics = {
          timestamp: new Date(),
          cpu: Math.max(10, Math.min(95, prev.cpu + (Math.random() - 0.5) * 10)),
          ram: Math.max(5, Math.min(90, prev.ram + (Math.random() - 0.5) * 3)),
          disk: prev.disk, // Disco não muda tão rápido
          fps: Math.max(10, Math.min(60, prev.fps + (Math.random() - 0.5) * 5)),
          latency: Math.max(50, Math.min(2000, prev.latency + (Math.random() - 0.5) * 50)),
          detections: prev.detections + Math.floor(Math.random() * 20),
          recognitions: prev.recognitions + Math.floor(Math.random() * 15),
          alerts: Math.max(0, prev.alerts + Math.floor((Math.random() - 0.7) * 2)),
          uptime: prev.uptime + 1 / 60, // Incrementar por segundo
          activeUsers: Math.floor(Math.random() * 10) + 1,
          activeCameras: 8,
        };

        // Atualizar histórico
        setHistory(h => [...h.slice(-59), newMetrics]);

        // Verificar saúde do sistema
        updateHealthStatus(newMetrics);

        return newMetrics;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const updateHealthStatus = (m: SystemMetrics) => {
    let status: HealthStatus['status'] = 'healthy';
    let message = 'Sistema operando normalmente';

    if (m.cpu > 90 || m.ram > 85 || m.latency > 1500) {
      status = 'critical';
      message = 'Sistema em estado crítico - ação necessária';
    } else if (m.cpu > 75 || m.ram > 70 || m.latency > 1000) {
      status = 'warning';
      message = 'Sistema sob pressão - monitore de perto';
    }

    setHealthStatus({
      status,
      message,
      timestamp: new Date(),
    });

    // Adicionar alerta se crítico
    if (status === 'critical') {
      const alert: HealthStatus = {
        status,
        message,
        timestamp: new Date(),
      };
      setAlerts(a => [alert, ...a.slice(0, 9)]);
    }
  };

  const formatUptime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours % 1) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="monitoring-page">
      {/* Header */}
      <div className="monitoring-header">
        <div>
          <h1>Monitoramento em Tempo Real</h1>
          <p>Última atualização: {metrics.timestamp.toLocaleTimeString()}</p>
        </div>
        <div className="header-controls">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
            />
            Auto-atualizar
          </label>
          <span className={`ws-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
          </span>
        </div>
      </div>

      {/* Status de Saúde */}
      <div className={`health-status status-${healthStatus.status}`}>
        <div className="status-icon">
          {healthStatus.status === 'healthy' && '✅'}
          {healthStatus.status === 'warning' && '⚠️'}
          {healthStatus.status === 'critical' && '🔴'}
        </div>
        <div className="status-content">
          <h3>Status do Sistema</h3>
          <p>{healthStatus.message}</p>
        </div>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="metrics-grid">
        <MetricMeter label="CPU" value={metrics.cpu} unit="%" thresholds={[70, 85]} history={history} historyKey="cpu" />
        <MetricMeter label="RAM" value={metrics.ram} unit=" GB" thresholds={[60, 75]} history={history} historyKey="ram" barWidthCalc={(v) => (v / 128) * 100} />
        <MetricMeter label="FPS" value={metrics.fps} unit="" thresholds={[10, 20]} history={history} historyKey="fps" barWidthCalc={(v) => (v / 60) * 100} />
        <MetricMeter label="Latência" value={metrics.latency} unit="ms" thresholds={[500, 1000]} history={history} historyKey="latency" barWidthCalc={(v) => Math.min(100, (v / 2000) * 100)} />
      </div>

      {/* Estatísticas */}
      <div className="statistics-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <span className="stat-label">Total de Detecções</span>
            <span className="stat-value">{metrics.detections.toLocaleString()}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👤</div>
          <div className="stat-content">
            <span className="stat-label">Reconhecimentos</span>
            <span className="stat-value">{metrics.recognitions.toLocaleString()}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <span className="stat-label">Alertas Ativos</span>
            <span className="stat-value">{metrics.alerts}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <span className="stat-label">Uptime</span>
            <span className="stat-value">{formatUptime(metrics.uptime)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <span className="stat-label">Usuários Ativos</span>
            <span className="stat-value">{metrics.activeUsers}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📹</div>
          <div className="stat-content">
            <span className="stat-label">Câmeras Ativas</span>
            <span className="stat-value">{metrics.activeCameras}</span>
          </div>
        </div>
      </div>

      {/* Alertas Recentes */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          <h2>Alertas Recentes</h2>
          <div className="alerts-list">
            {alerts.map((alert, idx) => (
              <div key={idx} className={`alert-item alert-${alert.status}`}>
                <div className="alert-time">{alert.timestamp.toLocaleTimeString()}</div>
                <div className="alert-message">{alert.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Monitoring;
