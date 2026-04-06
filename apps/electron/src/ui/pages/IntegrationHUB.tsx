import React, { useState } from 'react';
import { 
  Database, RefreshCw, Link2, 
  Settings2, Activity, CheckCircle, 
  AlertTriangle, ArrowRight, Zap
} from 'lucide-react';
import { aquilaConnectorService, SyncResult } from '../../services/AquilaConnectorService';
import './IntegrationHUB.css';

/**
 * IntegrationHUB (v1635)
 * Dashboad Admin para configurar e monitorar conectores externos (Setti, Urania, etc).
 */
export const IntegrationHUB: React.FC = () => {
  const [logs, setLogs] = useState<SyncResult[]>(aquilaConnectorService.getSyncLogs());
  const [isSyncing, setIsSyncing] = useState(false);

  const triggerSync = async (source: any, type: any) => {
    setIsSyncing(true);
    // Simulação de gatilho
    await new Promise(r => setTimeout(r, 1500));
    await aquilaConnectorService.syncEnrollmentData(source, { students: [{ id: 'std-001', legacyId: 'EXT-123' }] });
    setLogs(aquilaConnectorService.getSyncLogs());
    setIsSyncing(false);
  };

  const connectors = [
    { name: 'Setti Educacional', type: 'SIS/ERP', status: 'CONNECTED', lastSync: '10 min atrás', icon: <Database color="#3b82f6" /> },
    { name: 'Urânia Grade', type: 'Scheduling', status: 'WARNING', lastSync: '2 horas atrás', icon: <RefreshCw color="#eab308" /> },
    { name: 'SIESCOLA', type: 'Secretary', status: 'DISCONNECTED', lastSync: 'N/A', icon: <Link2 color="#ef4444" /> }
  ];

  return (
    <div className="integration-hub-container">
      <header className="hub-header">
         <div className="flex items-center gap-4">
            <Zap size={32} className="text-yellow-400" />
            <h1 className="text-3xl font-black">Interoperability Bridge</h1>
         </div>
         <button className={`sync-all-btn ${isSyncing ? 'animate-spin' : ''}`} onClick={() => triggerSync('SETTI', 'STUDENT')}>
            <RefreshCw size={20} />
            <span>SINCRONIZAR TUDO</span>
         </button>
      </header>

      <div className="hub-grid">
         {/* Conectores Ativos */}
         <section className="connectors-panel">
            <h2 className="panel-title">CONECTORES INSTITUCIONAIS</h2>
            <div className="connector-list">
               {connectors.map((c, idx) => (
                  <div key={idx} className={`connector-card ${c.status.toLowerCase()}`}>
                     <div className="card-top">
                        {c.icon}
                        <div className="flex-1">
                           <p className="conn-name">{c.name}</p>
                           <p className="conn-type">{c.type}</p>
                        </div>
                        <Settings2 size={18} className="text-slate-600 cursor-pointer" />
                     </div>
                     <div className="card-bottom">
                        <span className="last-sync">Última sinc: {c.lastSync}</span>
                        <span className="status-label">{c.status}</span>
                     </div>
                  </div>
               ))}
            </div>
         </section>

         {/* Logs de Sincronização */}
         <section className="logs-panel">
            <h2 className="panel-title">FLUXO DE DADOS EM TEMPO REAL</h2>
            <div className="log-list">
               {logs.length > 0 ? logs.map((log, idx) => (
                  <div key={idx} className="log-entry">
                     {log.status === 'SUCCESS' ? <CheckCircle size={16} className="text-green-500" /> : <AlertTriangle size={16} className="text-yellow-500" />}
                     <div className="flex-1">
                        <p className="log-msg"><span className="font-bold">[{log.source}]</span> {log.message}</p>
                        <p className="log-meta">{new Date(log.timestamp).toLocaleTimeString()} • {log.recordsProcessed} registros</p>
                     </div>
                     <ArrowRight size={14} className="text-slate-700" />
                  </div>
               )) : (
                  <div className="empty-logs">Aguardando gatilho de sincronização...</div>
               )}
            </div>
         </section>
      </div>
    </div>
  );
};
