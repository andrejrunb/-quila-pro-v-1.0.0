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
  const [resilience, setResilience] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await window.aquila.invoke('coordination:get-resilience-stats');
        setResilience(stats);
      } catch (err) {
        console.error('Falha ao buscar status de resiliência:', err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Atualizar a cada 10s
    return () => clearInterval(interval);
  }, []);

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

      {/* BLUE AUDIT: INTEGRITY PULSE */}
      <section className="blue-audit-panel glass mb-10 border-blue-500/20 p-6 rounded-2xl bg-blue-500/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h2 className="text-sm font-black text-blue-400 uppercase tracking-tighter">BLUE AUDIT: PASSIVE INTEGRITY</h2>
            <p className="text-[10px] text-zinc-500 font-bold">MONITORAMENTO DE KERNEL & HASH SHA3-256</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-4 rounded-xl border-blue-500/10">
            <span className="block text-[9px] text-zinc-500 font-black mb-1 uppercase">Kernel Status</span>
            <span className="text-2xl font-black text-white">{resilience?.kernelIntegrity || '100%'}</span>
          </div>
          <div className="glass p-4 rounded-xl border-blue-500/10">
            <span className="block text-[9px] text-zinc-500 font-black mb-1 uppercase">Encryption</span>
            <span className="text-xs font-bold text-blue-200">{resilience?.encryptionStandard || 'SHA3-256 / AES-GCM'}</span>
          </div>
          <div className="glass p-4 rounded-xl border-blue-500/10">
            <span className="block text-[9px] text-zinc-500 font-black mb-1 uppercase">Last Scan</span>
            <span className="text-xs font-bold text-zinc-300">{resilience?.lastAudit ? new Date(resilience.lastAudit).toLocaleString() : 'STANDBY'}</span>
          </div>
        </div>
      </section>

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
                <div className={`h-status ${item.status?.toLowerCase() || ''}`}>
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
