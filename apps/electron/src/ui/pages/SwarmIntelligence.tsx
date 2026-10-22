import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Zap, 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw,
  Cpu,
  Globe,
  MessageSquare
} from 'lucide-react';
import './SwarmIntelligence.css';

interface SwarmAgent {
  id: string;
  name: string;
  status: string;
  type: string;
  reports: any[];
  currentPlan?: any;
}

const SwarmIntelligence: React.FC = () => {
  const [swarm, setSwarm] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSwarmData = async () => {
    try {
      const status = await (window as any).aquila.invoke('swarm:get-status');
      const swarmTasks = await (window as any).aquila.invoke('swarm:get-tasks');
      setSwarm(status);
      setTasks(swarmTasks || []);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar dados do enxame:', err);
    }
  };

  useEffect(() => {
    fetchSwarmData();
    const interval = setInterval(fetchSwarmData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !swarm) {
    return <div className="swarm-loading">Sincronizando com o Enxame Soberano...</div>;
  }

  return (
    <div className="swarm-container">
      <header className="swarm-header">
        <div className="flex-row items-center gap-4">
          <Brain className="swarm-icon-pulse" size={32} />
          <div>
            <h1>Inteligência de Enxame</h1>
            <p>Orquestração Agêntica Autônoma — Áquila Pro v2.0.0</p>
          </div>
        </div>
        <div className="swarm-health-badge">
           <span className="label">Swarm Health</span>
           <span className="value">{swarm.healthIndex}%</span>
        </div>
      </header>

      <div className="swarm-layout">
        {/* Agentes Ativos */}
        <section className="agents-grid">
          {swarm.agents.map((agent: SwarmAgent) => (
            <div key={agent.id} className={`agent-card ${agent.status}`}>
              <div className="agent-header">
                 <div className="agent-info">
                    <strong>{agent.name}</strong>
                    <span>{agent.type.toUpperCase()} AGENT</span>
                 </div>
                 <div className={`status-dot ${agent.status}`}></div>
              </div>
              
              <div className="agent-metrics-mini">
                 <div className="metric">
                    <Activity size={12} />
                    <span>72 ops/s</span>
                 </div>
                 <div className="metric">
                    <Cpu size={12} />
                    <span>12% NPU</span>
                 </div>
              </div>

              {agent.currentPlan && (
                <div className="agent-plan-box">
                  <Zap size={14} className="text-yellow-400" />
                  <span>Plano Ativo: {agent.currentPlan.goal}</span>
                </div>
              )}

              <div className="agent-log">
                {agent.reports.slice(0, 2).map((r, i) => (
                  <div key={i} className="log-entry">
                    <span className="time">{new Date(r.timestamp).toLocaleTimeString()}</span>
                    <span className="msg">{r.message}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Fila de Tarefas e Reflexões */}
        <aside className="swarm-sidebar">
          <div className="tasks-section glass-panel">
            <h3><Activity size={18} /> Fila de Tarefas Autônomas</h3>
            <div className="task-list">
              {tasks.length === 0 ? (
                <p className="empty-msg">Nenhuma tarefa pendente no momento.</p>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className={`task-item ${task.status}`}>
                    <div className="task-info">
                       <strong>{task.name}</strong>
                       <span>Tool: {task.tool}</span>
                    </div>
                    {task.status === 'completed' ? <CheckCircle2 size={16} className="text-emerald-400" /> : <RefreshCw size={16} className="spin" />}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="reflections-section glass-panel">
            <h3><MessageSquare size={18} /> Reflexões do Enxame</h3>
            <div className="reflection-feed">
               <div className="reflection-item">
                  <span className="r-tag">SECURITY</span>
                  <p>"Identificado padrão de evasão no Bloco B. Sugerindo auditoria de presença cruzada."</p>
                  <span className="r-time">há 2 min</span>
               </div>
               <div className="reflection-item">
                  <span className="r-tag">PERFORMANCE</span>
                  <p>"NPU Throttling evitado. Deslocando inferência para Hub Secundário (Nexus)."</p>
                  <span className="r-time">há 5 min</span>
               </div>
            </div>
          </div>
        </aside>
      </div>

      <footer className="swarm-footer">
         <Globe size={14} />
         <span>Consenso do Enxame: <strong>READY</strong> | Ativos na Rede Nexus: 12 Hubs</span>
      </footer>
    </div>
  );
};

export default SwarmIntelligence;
