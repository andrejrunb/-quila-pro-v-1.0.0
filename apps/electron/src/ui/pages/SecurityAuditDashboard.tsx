import React from 'react';
import { Zap, Timer, Play, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import './SecurityAuditDashboard.css';

// Interface mock para tipagem (Zero-Debt)
export interface DrillResult {
  drillId: string;
  type: string;
  status: string;
  avgResponseTimeMs: number;
}

const SecurityAuditDashboard: React.FC = () => {
  const [activeDrill, setActiveDrill] = React.useState<DrillResult | null>(null);
  const [history, setHistory] = React.useState<DrillResult[]>([]);
  const [responseTime, setResponseTime] = React.useState(0);

  const startDrill = async (type: 'lockdown' | 'panic' | 'fire') => {
    const drill = await window.aquila.startDrill(type);
    setActiveDrill(drill);
    
    // Simular respostas da equipe via Main Process
    const timer = setInterval(() => {
      setResponseTime(prev => prev + 100);
      if (Math.random() > 0.8) {
        window.aquila.registerDrillResponse('Guard-01', Math.random() * 3000 + 1000);
      }
    }, 500);

    // Finalizar automaticamente após 10 segundos
    setTimeout(async () => {
      clearInterval(timer);
      const result = await window.aquila.finalizeDrill();
      if (result) {
        setHistory(prev => [result, ...prev]);
        setActiveDrill(null);
        setResponseTime(0);
      }
    }, 10000);
  };

  return (
    <div className="security-audit-container">
      <div className="audit-hero glass animate-fade-in">
        <div className="audit-icon-box bg-red-500/10 text-red-500">
          <ShieldAlert size={32} />
        </div>
        <div className="audit-info">
          <h1 className="text-3xl font-black italic">RED AUDIT CENTER</h1>
          <p className="text-xs text-zinc-500 uppercase font-black">Validar Resiliência via Simulações (Phase v3441)</p>
        </div>
      </div>

      {activeDrill ? (
        <div className="active-drill-panel glass border-red-500/50 shadow-glow">
          <div className="panel-header">
            <div className="pulse-circle red"></div>
            <h2 className="text-xl font-bold">SIMULAÇÃO EM CURSO: {activeDrill.type.toUpperCase()}</h2>
          </div>
          <div className="drill-metrics">
            <div className="metric">
              <Timer size={24} className="text-red-500" />
              <span className="m-val">{Math.floor(responseTime / 1000)}s</span>
              <span className="m-label">TEMPO DECORRIDO</span>
            </div>
            <div className="metric">
              <Zap size={24} className="text-amber-500" />
              <span className="m-val">2/10</span>
              <span className="m-label">CONFIRMAÇÕES</span>
            </div>
          </div>
          <p className="drill-warning text-xs text-zinc-400 mt-4 text-center uppercase font-black tracking-widest">Aviso: Equipamentos reais não disparados (Modo Teste)</p>
        </div>
      ) : (
        <div className="drill-launcher-grid">
          <div className="launcher-card glass hover:border-red-500" onClick={() => startDrill('lockdown')}>
            <Play size={32} className="text-red-500 mb-4" />
            <h3 className="font-bold">LOCKDOWN DRILL</h3>
            <p className="text-xs text-zinc-500">Testar tempo de trancamento estratégico</p>
          </div>
          <div className="launcher-card glass hover:border-amber-500" onClick={() => startDrill('panic')}>
            <AlertTriangle size={32} className="text-amber-500 mb-4" />
            <h3 className="font-bold">PANIC DRILL</h3>
            <p className="text-xs text-zinc-500">Validar prontidão do staff em estresse</p>
          </div>
        </div>
      )}

      {/* Histórico de Auditoria */}
      <section className="audit-history-section mt-10">
        <h2 className="text-xl font-black mb-6">Relatórios Post-Audit</h2>
        <div className="history-list">
          {history.length === 0 ? (
            <div className="glass p-6 text-center text-zinc-500 text-xs uppercase font-black">Nenhum Relatório Disponível</div>
          ) : (
            history.map(item => (
              <div key={item.drillId} className="history-item glass">
                <div className="h-type">{item.type.toUpperCase()}</div>
                <div className="h-time">{Math.floor(item.avgResponseTimeMs / 1000)}s Média</div>
                <div className={`h-status ${item.status.toLowerCase()}`}>
                  {item.status === 'SUCCESS' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  {item.status}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default SecurityAuditDashboard;
