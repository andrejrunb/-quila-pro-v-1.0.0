import React, { useState, useEffect } from 'react';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  ip: string;
}

interface AuditLogViewerProps {
  onBack: () => void;
}

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ onBack }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const aquila = (window as any).aquila;
        const result = await aquila.invoke('governance:get-audit-logs');
        setLogs(result);
      } catch (err) {
        console.error('Erro ao buscar logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="page-container animate-fade-in">
      <header className="page-header">
        <button className="btn-back" onClick={onBack}>←</button>
        <h1>Log de Auditoria (LGPD)</h1>
      </header>

      <div className="content-area">
        <div className="table-responsive glass">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Usuário</th>
                <th>Ação</th>
                <th>IP Origem</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td className="time">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="user">@{log.user}</td>
                  <td><span className={`badge-action ${log.action.toLowerCase()}`}>{log.action}</span></td>
                  <td className="ip">{log.ip}</td>
                  <td className="details">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .audit-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .audit-table th, .audit-table td { padding: 16px; text-align: left; border-bottom: 1px solid var(--border-color); }
        .audit-table th { font-weight: 600; color: var(--text-muted); font-size: 0.85em; text-transform: uppercase; }
        .audit-table tr:hover { background: rgba(255, 255, 255, 0.02); }
        .time { white-space: nowrap; font-family: monospace; font-size: 0.9em; }
        .user { font-weight: 600; color: var(--primary); }
        .ip { font-family: monospace; font-size: 0.85em; opacity: 0.6; }
        .badge-action { 
          padding: 4px 8px; border-radius: 4px; font-size: 0.75em; font-weight: bold;
          background: rgba(100, 116, 139, 0.1);
        }
        .badge-action.export_data { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
        .badge-action.login { background: rgba(16, 185, 129, 0.1); color: var(--success); }
        .details { font-size: 0.9em; color: var(--text-muted); }
        .table-responsive { border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color); }
      `}</style>
    </div>
  );
};

export default AuditLogViewer;
