import React, { useState, useEffect } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import './Alerts.css';

interface Alert {
  id: string;
  type: 'absence' | 'late' | 'unknown' | 'crowding' | 'camera_offline';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

/**
 * Página de Alertas com filtros e ações
 */
export const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { isConnected, lastMessage } = useWebSocket();

  // Processar novos alertas do WebSocket
  useEffect(() => {
    if (lastMessage?.type === 'alert') {
      const newAlert: Alert = {
        id: lastMessage.data.id,
        type: lastMessage.data.type,
        severity: lastMessage.data.severity,
        title: lastMessage.data.title,
        message: lastMessage.data.message,
        timestamp: new Date(lastMessage.data.timestamp),
        read: false,
      };
      setAlerts([newAlert, ...alerts]);
    }
  }, [lastMessage]);

  const getTypeLabel = (type: Alert['type']) => {
    const labels: Record<Alert['type'], string> = {
      absence: 'Ausência',
      late: 'Atraso',
      unknown: 'Desconhecido',
      crowding: 'Aglomeração',
      camera_offline: 'Câmera Offline',
    };
    return labels[type];
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread' && alert.read) return false;
    if (filter === 'critical' && alert.severity !== 'critical') return false;
    if (typeFilter !== 'all' && alert.type !== typeFilter) return false;
    return true;
  });

  const markAsRead = (alertId: string) => {
    setAlerts(
      alerts.map(a => (a.id === alertId ? { ...a, read: true } : a))
    );
  };

  const deleteAlert = (alertId: string) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
  };

  const markAllAsRead = () => {
    setAlerts(alerts.map(a => ({ ...a, read: true })));
  };

  const unreadCount = alerts.filter(a => !a.read).length;
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  return (
    <div className="alerts-page">
      <div className="alerts-header">
        <h1>Alertas</h1>
        <div className="alerts-stats">
          <div className="stat">
            <span className="label">Não Lidos:</span>
            <span className="value">{unreadCount}</span>
          </div>
          <div className="stat critical">
            <span className="label">Críticos:</span>
            <span className="value">{criticalCount}</span>
          </div>
        </div>
      </div>

      <div className="alerts-controls">
        <div className="filter-group">
          <label>Filtro:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)} title="Filtrar por Status">
            <option value="all">Todos</option>
            <option value="unread">Não Lidos</option>
            <option value="critical">Críticos</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Tipo:</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} title="Filtrar por Tipo">
            <option value="all">Todos os Tipos</option>
            <option value="absence">Ausência</option>
            <option value="late">Atraso</option>
            <option value="unknown">Desconhecido</option>
            <option value="crowding">Aglomeração</option>
            <option value="camera_offline">Câmera Offline</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status WebSocket:</label>
          <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
          </span>
        </div>

        {unreadCount > 0 && (
          <button className="btn btn-small btn-secondary" onClick={markAllAsRead}>
            Marcar Todos como Lidos
          </button>
        )}
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum alerta encontrado</p>
        </div>
      ) : (
        <div className="alerts-list">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`alert-item alert-${alert.severity} ${alert.read ? 'read' : 'unread'}`}
            >
              <div className="alert-icon">
                <div className="severity-indicator" />
              </div>

              <div className="alert-content">
                <div className="alert-header">
                  <h3>{alert.title}</h3>
                  <span className="alert-type">{getTypeLabel(alert.type)}</span>
                </div>
                <p className="alert-message">{alert.message}</p>
                <div className="alert-meta">
                  <span className="timestamp">
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="alert-actions">
                {!alert.read && (
                  <button
                    className="btn btn-small btn-secondary"
                    onClick={() => markAsRead(alert.id)}
                  >
                    Marcar como Lido
                  </button>
                )}
                <button
                  className="btn btn-small btn-danger"
                  onClick={() => deleteAlert(alert.id)}
                >
                  Deletar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
