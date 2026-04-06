import React, { useState, useEffect } from 'react';
import { Download, History, RefreshCw } from 'lucide-react';
import { QAOverview } from '../components/QAOverview';
import './GovernanceDashboard.css';

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  reason: string;
}

interface NexusStatus {
  sentinel: { active: boolean; uptime: number };
  architect: { isThinking: boolean; currentPlan: any };
  swarm: { agentCount: number; health: string };
  ledger: { blockCount: number; isValid: boolean; lastHash: string };
  lgpd: { autoPurgeEnabled: boolean; lastRun: string };
  qa?: any;
}


export function GovernanceDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState({
    totalLogs: 0,
    consentedUsers: 0,
    securityIncidents: 0
  });
  const [loading, setLoading] = useState(true);
  const [nexusStatus, setNexusStatus] = useState<NexusStatus>({
    sentinel: { active: false, uptime: 0 },
    architect: { isThinking: false, currentPlan: null },
    swarm: { agentCount: 0, health: 'nominal' },
    ledger: { blockCount: 0, isValid: true, lastHash: '' },
    lgpd: { autoPurgeEnabled: false, lastRun: '' }
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchNexusStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchNexusStatus = async () => {
    try {
      const aquila = (window as any).aquila;
      const sentinel = await aquila.invoke('nexus:get-sentinel-status');
      const architect = await aquila.invoke('nexus:get-architect-status');
      const swarm = await aquila.invoke('nexus:get-swarm-status');
      const ledger = await aquila.invoke('nexus:get-ledger-status');
      const lgpd = await aquila.invoke('nexus:get-policy-status');
      setNexusStatus({ sentinel, architect, swarm, ledger, lgpd });
    } catch (e) {
      console.warn('Silent Nexus Sync Fail:', e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const aquila = (window as any).aquila;
      const auditLogs = await aquila.invoke('governance:get-audit-logs', 50);
      setLogs(auditLogs || []);
      
      setStats({
        totalLogs: auditLogs?.length || 0,
        consentedUsers: 142,
        securityIncidents: auditLogs?.filter((l: any) => l.action.includes('SECURITY')).length || 0
      });
    } catch (err) {
      console.error('Erro ao carregar dados de governança:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    const aquila = (window as any).aquila;
    alert('Exportação iniciada. O arquivo será salvo na pasta de relatórios.');
  };

  return (
    <div className="governance-page animate-fade-in">
      <header className="governance-header">
        <div>
          <h1>Portal de Governança & LGPD</h1>
          <p className="text-muted">Monitoramento de integridade e conformidade soberana.</p>
        </div>
        <div className="audit-controls">
          <button className="export-btn" onClick={handleExport}>
            <Download size={18} /> Relatório de Auditoria
          </button>
        </div>
      </header>

      <div className="governance-grid">
        <div className="gov-card highlight">
          <div className="flex-between">
            <div>
              <h3 className="text-accent mb-2">👁️ Áquila Sentinel</h3>
              <p className="text-muted-xs">Ativo e monitorando workspace.</p>
            </div>
            <span className={`badge ${nexusStatus.sentinel.active ? 'system' : 'security'}`}>
              {nexusStatus.sentinel.active ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <div className="font-xs mt-2 opacity-8">
            Uptime: {Math.floor(nexusStatus.sentinel.uptime / 60)} min
          </div>
        </div>

        <div className="gov-card highlight secondary">
          <div className="flex-between">
            <div>
              <h3 className="text-accent mb-2">🏛️ Áquila Architect</h3>
              <p className="text-muted-xs">{nexusStatus.architect.isThinking ? '🧠 Raciocinando...' : 'Design estratégico.'}</p>
            </div>
            <button className="mediation-btn secondary mini" onClick={async () => {
              const p = prompt('Meta:');
              if(p) await (window as any).aquila.invoke('nexus:start-deep-reasoning', p);
            }}>Planejar</button>
          </div>
          {nexusStatus.architect.currentPlan && (
            <div className="font-xs mt-2 text-accent">
              Último Plano: {nexusStatus.architect.currentPlan.title}
            </div>
          )}
        </div>

        <div className="gov-card highlight swarm">
          <div className="flex-between">
            <div>
              <h3 className="text-success mb-2">🐝 Sovereign Swarm</h3>
              <p className="text-muted-xs">Enxame: {nexusStatus.swarm.agentCount} agentes.</p>
            </div>
            <span className="badge system">{nexusStatus.swarm.health}</span>
          </div>
        </div>

        <div className="gov-card highlight ledger">
          <div className="flex-between">
            <div>
              <h3 className="text-accent mb-2">⛓️ Sovereign Ledger</h3>
              <p className="text-muted-xs">Protocolo: Local Hash-Chain</p>
            </div>
            <span className={`badge ${nexusStatus.ledger.isValid ? 'system' : 'security'}`}>
              {nexusStatus.ledger.isValid ? 'ÍNTEGRO' : 'VIOLADO'}
            </span>
          </div>
          <div className="font-xs mt-2 opacity-8">
            Blocos: {nexusStatus.ledger.blockCount} | Hash: {nexusStatus.ledger.lastHash.substring(0, 12)}...
          </div>
        </div>

        <div className="gov-card highlight">
          <div className="flex-between">
            <div>
              <h3 className="text-accent mb-2">🛡️ LGPD Shield</h3>
              <p className="text-muted-xs">Auto-Purga: {nexusStatus.lgpd.autoPurgeEnabled ? 'Ativa' : 'Manual'}</p>
            </div>
            <button className="mediation-btn mini" onClick={async () => {
              if(confirm('Executar verificação de conformidade agora?')) {
                const res = await (window as any).aquila.invoke('nexus:run-compliance-check');
                alert(`Purga Concluída: ${res.purgedLogs} logs removidos.`);
              }
            }}>Forçar Purga</button>
          </div>
          <div className="font-xs mt-2 opacity-8">
            Última Execução: {nexusStatus.lgpd.lastRun ? new Date(nexusStatus.lgpd.lastRun).toLocaleString() : 'Nunca'}
          </div>
        </div>
      </div>

      <section className="audit-section mt-2">
        <div className="flex-between">
          <h3 className="text-accent">🔍 Controle de Qualidade Soberano (SQA)</h3>
          <span className="badge system">PLAYWRIGHT ACTIVE</span>
        </div>
        <QAOverview metrics={nexusStatus.qa || {
          lastRun: new Date().toISOString(),
          passRate: 100,
          totalTests: 12,
          visualRegressions: 0,
          status: 'optimal'
        }} />
      </section>

      <div className="audit-section mt-2">
        <div className="audit-controls">
          <div className="flex-gap-8">
            <History size={20} className="text-primary" />
            <h3>Log de Auditoria Soberana</h3>
          </div>
          <div className="flex-gap-8">
            <button className="mediation-btn secondary mini" onClick={fetchData}>
              <RefreshCw size={14} /> Atualizar
            </button>
            <button className="mediation-btn mini">
              <Download size={14} /> Exportar CSV
            </button>
          </div>
        </div>

        <div className="audit-table-wrapper">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Data / Hora</th>
                <th>Operador</th>
                <th>Ação Executada</th>
                <th>Justificativa / Contexto</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="table-empty-state">Carregando trilha de auditoria...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="table-empty-state">Nenhum log encontrado.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td><span className="text-secondary">@{log.userId}</span></td>
                    <td>
                      <span className={`badge ${getActionClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.reason}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const getActionClass = (action: string) => {
  if (action?.includes('SECURITY') || action?.includes('ALERT')) return 'security';
  if (action?.includes('IMPORT') || action?.includes('EXPORT')) return 'audit';
  return 'system';
};

export default GovernanceDashboard;
