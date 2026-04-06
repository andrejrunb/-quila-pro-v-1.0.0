import React, { useState, useEffect } from 'react';
import { Server, Activity, Cpu, Database, Network } from 'lucide-react';
import './DashboardComando.css';

interface Node {
  id: string;
  name: string;
  sector: string;
  role: 'ADMIN' | 'PEDAGOGY' | 'FINANCIAL' | 'SECURITY';
  status: 'ONLINE' | 'BUSY' | 'OFFLINE';
  cpuLoad: number;
  ramUsage: number;
  model: string;
}

/**
 * DashboardComando (v3446)
 * O "Cérebro" de TI da escola. Monitora todos os nós do enxame distribuído.
 */
export const DashboardComando: React.FC = () => {
  const [viewMode, setViewMode] = useState<'SECTOR' | 'HARDWARE'>('SECTOR');
  const [nodes, setNodes] = useState<Node[]>([]);

  // Simulação de Dados do Enxame (Em prod, vem via IPC 'swarm:get-topology')
  useEffect(() => {
    const mockNodes: Node[] = [
      { id: '1', name: 'PC-FIN-01', sector: 'FINANCEIRO', role: 'FINANCIAL', status: 'ONLINE', cpuLoad: 12, ramUsage: 45, model: 'llama3:8b' },
      { id: '2', name: 'PC-RH-01', sector: 'RECURSOS HUMANOS', role: 'ADMIN', status: 'BUSY', cpuLoad: 88, ramUsage: 72, model: 'llama3:8b' },
      { id: '3', name: 'PC-SALA7-01', sector: 'SALA 07B', role: 'PEDAGOGY', status: 'ONLINE', cpuLoad: 5, ramUsage: 12, model: 'llama3:3b' },
      { id: '4', name: 'PC-SUP-01', sector: 'SUPORTE TÉCNICO', role: 'SECURITY', status: 'ONLINE', cpuLoad: 25, ramUsage: 40, model: 'llama3:8b' },
    ];
    setNodes(mockNodes);
  }, []);

  const renderNodeCard = (node: Node) => (
    <div key={node.id} className={`node-card glass status-${node.status.toLowerCase()}`}>
       <div className="node-icon">
          <Server size={24} color={node.status === 'OFFLINE' ? '#555' : '#8b5cf6'} />
       </div>
       <div className="node-body">
          <span className="node-name">{node.name}</span>
          <span className="node-sector">{node.sector}</span>
          
          <div className="node-metrics">
             <div className="metric">
                <Cpu size={12} />
                <span>{node.cpuLoad}%</span>
             </div>
             <div className="metric">
                <Database size={12} />
                <span>{node.ramUsage}%</span>
             </div>
          </div>
          
          <div className="node-model-pill">
             <Activity size={10} />
             <span>{node.model}</span>
          </div>
       </div>

       {node.status === 'BUSY' && (
         <div className="busy-overlay">
            <span className="throb">PROCESSANDO...</span>
         </div>
       )}
    </div>
  );

  return (
    <div className="dashboard-comando-container">
      <header className="cmd-header">
         <div className="title-group">
            <Network size={32} className="text-violet-500" />
            <h1 className="text-4xl font-black text-gradient uppercase">Comando do Enxame</h1>
         </div>
         
         <div className="cmd-controls glass">
            <button 
              className={viewMode === 'SECTOR' ? 'active' : ''} 
              onClick={() => setViewMode('SECTOR')}
            >
              Setores
            </button>
            <button 
              className={viewMode === 'HARDWARE' ? 'active' : ''} 
              onClick={() => setViewMode('HARDWARE')}
            >
              Poder (NPU/RAM)
            </button>
         </div>
      </header>

      <div className="swarm-topology-view">
         {viewMode === 'SECTOR' ? (
           <div className="sector-grid">
              {/* Agrupar por setor (simplificado aqui) */}
              {nodes.map(renderNodeCard)}
           </div>
         ) : (
           <div className="hardware-ranking-view">
              {/* Ordenar por hardware (simplificado aqui) */}
              {nodes.sort((a, b) => b.ramUsage - a.ramUsage).map(renderNodeCard)}
           </div>
         )}
      </div>

      <footer className="cmd-footer glass">
         <div className="swarm-stats">
            <span>Nós Ativos: {nodes.filter(n => n.status !== 'OFFLINE').length}</span>
            <span>Uptime: 99.9%</span>
            <span>Segurança: LOCK_SITUATIONAL</span>
         </div>
         <div className="sync-pulse">
            <div className="pulse-dot"></div>
            <span>SINCRONIZAÇÃO NÁUTICA ATIVA</span>
         </div>
      </footer>
    </div>
  );
};
