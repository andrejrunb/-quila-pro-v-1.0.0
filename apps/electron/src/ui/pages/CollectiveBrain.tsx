import React, { useState, useEffect } from 'react';
import { Cpu, Activity, Zap, Server, Brain, Shield } from 'lucide-react';
import './CollectiveBrain.css';

interface SharedTask {
  id: string;
  name: string;
  sourceHub: string;
  status: 'processing' | 'verifying' | 'completed';
  progress: number;
}

interface MeshNode {
  id: string;
  name: string;
  isLocal: boolean;
  npuLoad: number;
  temp: number;
  reputation: number;
  status: 'online' | 'offline' | 'throttled';
}

interface MetaEvolution {
  suggestions: string[];
  criticalAlerts: string[];
}

const CollectiveBrain: React.FC = () => {
  const [sharedTops, setSharedTops] = useState(0);
  const [activeHubs, setActiveHubs] = useState(0);
  const [tasks, setTasks] = useState<SharedTask[]>([]);
  const [nodes, setNodes] = useState<MeshNode[]>([]);
  const [npuLoad, setNpuLoad] = useState(0);
  const [temperature, setTemperature] = useState(42);
  const [evolution, setEvolution] = useState<MetaEvolution>({ suggestions: [], criticalAlerts: [] });
  const [isStressing, setIsStressing] = useState(false);
  const [optimizations, setOptimizations] = useState<any[]>([]);

  const toggleStress = async () => {
    try {
      if (isStressing) {
        await (window as any).aquila.invoke('stress:stop');
        setIsStressing(false);
      } else {
        await (window as any).aquila.invoke('stress:start');
        setIsStressing(true);
      }
    } catch (err) {
      console.error('Stress test toggle failed', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const state = await (window as any).aquila.invoke('mesh:get-inference-state');
        const reputationStats = await (window as any).aquila.invoke('mesh:reputation-stats');
        const evolutionStats = await (window as any).aquila.invoke('cortex:run-meta-evolution');
        const haloOptimizations = await (window as any).aquila.invoke('halo:get-optimizations');

        setOptimizations(haloOptimizations || []);
        const rawNodes = state.nodes || [];
        const reputations = reputationStats.reputations || {};
        
        const enrichedNodes: MeshNode[] = rawNodes.map((n: any) => ({
          ...n,
          reputation: n.isLocal ? 1.0 : (reputations[n.id] || 0.8)
        }));

        setNodes(enrichedNodes);
        setActiveHubs(enrichedNodes.length);
        setSharedTops(enrichedNodes.reduce((acc, node) => acc + (node.tops || 26), 0));

        const localNode = enrichedNodes.find(n => n.isLocal);
        if (localNode) {
          setNpuLoad(localNode.npuLoad || 0);
          setTemperature(localNode.temp || 42);
        }

        const tasksList = (state.tasks || []).map((task: any) => ({
          id: task.id,
          name: task.type ? task.type.toUpperCase().replace('_', ' ') : 'TAREFA',
          sourceHub: task.sourceNodeId === 'local' ? 'Hub Principal' : `Hub ${task.sourceNodeId.substring(0, 8)}`,
          status: task.status === 'processing' ? 'processing' : 'verifying',
          progress: task.progress || (task.status === 'completed' ? 100 : 45)
        }));

        setTasks(tasksList);
        setEvolution(evolutionStats || { suggestions: [], criticalAlerts: [] });
      } catch (err) {
        console.error('[CollectiveBrain] Erro na sincronização inicial:', err);
      }
    };

    fetchData();

    // Event listeners para atualizações em tempo real (v1.5.0-PRO)
    const offTaskUpdate = (window as any).aquila.on('task:update', (task: any) => {
      setTasks(prev => {
        const index = prev.findIndex(t => t.id === task.id);
        const updatedTask: SharedTask = {
          id: task.id,
          name: task.type ? task.type.toUpperCase().replace('_', ' ') : 'TAREFA',
          sourceHub: task.sourceNodeId === 'local' ? 'Hub Principal' : `Hub ${task.sourceNodeId.substring(0, 8)}`,
          status: task.status === 'processing' ? 'processing' : 'verifying',
          progress: task.progress || (task.status === 'completed' ? 100 : 45)
        };

        if (index >= 0) {
          const newTasks = [...prev];
          newTasks[index] = updatedTask;
          return newTasks;
        }
        return [...prev, updatedTask];
      });
    });

    const offMeshUpdate = (window as any).aquila.on('mesh:update', (capabilities: any) => {
      // Atualiza o nó local em tempo real
      setNpuLoad(capabilities.currentLoad || 0);
      setTemperature(capabilities.temperature || 42);
      
      setNodes(prev => prev.map(n => n.isLocal ? {
        ...n,
        npuLoad: capabilities.currentLoad || 0,
        temp: capabilities.temperature || 42,
        status: capabilities.status || 'online'
      } : n));
    });

    const offPulse = (window as any).aquila.on('cortex:pulse', (insight: any) => {
      if (insight.type === 'EVOLUTION_SUGGESTION') {
        setEvolution(prev => ({
          ...prev,
          suggestions: [insight.content, ...prev.suggestions].slice(0, 5)
        }));
      }
    });

    return () => {
      if (offTaskUpdate) offTaskUpdate();
      if (offMeshUpdate) offMeshUpdate();
      if (offPulse) offPulse();
    };
  }, []);

  return (
    <div className="brain-container">
      <header className="brain-header">
        <div>
          <h1>Córtex Transcendente</h1>
          <p className="subtitle">Cognição Distribuída & Consenso de Reputação</p>
        </div>
        <div className="status-badge">
          <Activity size={16} />
          <span>Sincronização Neural Estável</span>
        </div>
      </header>

      <section className="brain-stats">
        <div className="stat-card">
          <div className="stat-label">Poder Computacional Total</div>
          <div className="stat-value">{sharedTops} TOPS</div>
          <div className="stat-desc">Capacidade NPU Compartilhada na Malha</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Nós Cognitivos Ativos</div>
          <div className="stat-value">{activeHubs}</div>
          <div className="stat-desc">Hubs colaborando via Sovereign Mesh</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Uso da NPU Local</div>
          <div className="stat-value">{npuLoad}%</div>
          <div className="stat-desc">Carga de processamento neural atual</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Homeostase Térmica</div>
          <div className="stat-value" style={{ color: temperature > 65 ? '#ef4444' : 'inherit' }}>
            {temperature.toFixed(1)}°C
          </div>
          <div className="stat-desc">
            {temperature > 75 ? 'Throttling Ativo / Offload' : 'Estabilidade Térmica Nominal'}
          </div>
        </div>
      </section>

      <div className="brain-grid-main">
        <section className="node-reputation-grid">
          <h3>Saúde e Reputação da Malha</h3>
          <div className="nodes-container">
            {nodes.map(node => (
              <div key={node.id} className={`node-card ${node.isLocal ? 'local' : ''}`}>
                <div className="node-info">
                  <div className="node-name">
                    <Server size={14} />
                    {node.name}
                  </div>
                  <div className="node-reputation-score">
                    {(node.reputation * 100).toFixed(0)}% Trust
                  </div>
                </div>
                <div className="reputation-bar">
                  <div 
                    className="reputation-fill" 
                    style={{ width: `${node.reputation * 100}%`, background: node.reputation > 0.7 ? '#10b981' : '#f59e0b' }}
                  ></div>
                </div>
                <div className="node-metrics">
                  <span>Load: {node.npuLoad}%</span>
                  <span>Temp: {node.temp}°C</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="meta-evolution-panel">
          <h3>Meta-Evolução (SIE)</h3>
          <div className="evolution-content">
            {evolution.criticalAlerts.map((alert, i) => (
              <div key={i} className="evolution-alert critical">
                <Zap size={16} />
                <span>{alert}</span>
              </div>
            ))}
            {evolution.suggestions.map((suggestion, i) => (
              <div key={i} className="evolution-alert suggestion">
                <Brain size={16} />
                <span>{suggestion}</span>
              </div>
            ))}
            {evolution.criticalAlerts.length === 0 && evolution.suggestions.length === 0 && (
              <div className="evolution-idle">
                Sistema operando em harmonia evolutiva.
              </div>
            )}
          </div>
        </section>


      </div>

      <div className="brain-grid-secondary" style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <section className="trace-optimizer-panel">
          <h3>Otimizador de Ciclos HALO</h3>
          <div className="optimizations-container">
            {optimizations.map((opt, i) => (
              <div key={i} className={`opt-card ${opt.severity}`}>
                <div className="opt-header">
                  <span className="issue-type">{opt.issue}</span>
                  <span className="severity-badge">{opt.severity.toUpperCase()}</span>
                </div>
                <p className="recommendation">{opt.recommendation}</p>
                <div className="opt-meta">
                  <span>ID: {opt.traceId.substring(0, 8)}</span>
                  <span>Ocorrências: {opt.count}</span>
                </div>
              </div>
            ))}
            {optimizations.length === 0 && (
              <div className="evolution-idle">
                Nenhum gargalo de execução identificado pelo HALO.
              </div>
            )}
          </div>
        </section>

        <section className="stress-simulation-panel">
          <h3>Simulador de Carga (Stress Test)</h3>
          <div className="stress-controls">
            <button 
              className={`stress-btn ${isStressing ? 'active' : ''}`}
              onClick={toggleStress}
            >
              {isStressing ? 'Interromper Simulação' : 'Iniciar Stress Test NPU'}
            </button>
            <div className="stress-info">
              {isStressing ? (
                <div className="stress-active-msg">
                  <Activity className="spin" size={16} />
                  <span>Simulação de carga extrema em execução...</span>
                </div>
              ) : (
                <span>Pronto para simular demanda institucional.</span>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="active-tasks">
        <h3>Fila de Processamento Global</h3>
        <div className="task-list">
          {tasks.map(task => (
            <div key={task.id} className="task-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Cpu size={20} color="var(--primary-color)" />
                <div>
                  <div style={{ fontWeight: 600 }}>{task.name}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Origem: {task.sourceHub}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div className="task-progress-bar">
                  <div className="task-progress-fill" style={{ width: `${task.progress}%` }}></div>
                </div>
                <div style={{ width: '100px', textAlign: 'right' }}>
                  {task.status === 'processing' ? 'Processando' : 'Verificando'}
                </div>
                <Shield size={16} color={task.status === 'verifying' ? '#10b981' : '#6366f1'} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CollectiveBrain;
