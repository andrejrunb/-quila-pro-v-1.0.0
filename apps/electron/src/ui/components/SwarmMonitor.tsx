import React, { useState, useEffect } from 'react';
import { Activity, Server, Cpu, Cloud, Zap } from 'lucide-react';
import './SwarmMonitor.css';

interface SwarmNode {
  id: string;
  name: string;
  type: 'NPU' | 'SERVER' | 'CLOUD';
  load: number;
  isProcessingVision: boolean;
  active: boolean;
}

export const SwarmMonitor: React.FC<{ role: 'admin' | 'teacher' | 'staff' }> = ({ role }) => {
  const isManagement = role === 'admin' || role === 'staff';
  const [nodes, setNodes] = useState<SwarmNode[]>([
    { id: '1', name: 'NPU-Local-01 (Sala 102)', type: 'NPU', load: 45, isProcessingVision: true, active: true },
    { id: '2', name: 'NPU-Local-02 (Corredor)', type: 'NPU', load: 12, isProcessingVision: false, active: true },
    { id: '3', name: 'Server-Central-HQ', type: 'SERVER', load: 68, isProcessingVision: false, active: true },
    { id: '4', name: 'Cloud-GPU-Cluster', type: 'CLOUD', load: 0, isProcessingVision: false, active: false },
  ]);

  // Simular troca de processamento
  // Simular troca de processamento e Filtragem RBAC (v3469)
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes(prev => {
        const updated = prev.map(node => ({
          ...node,
          load: node.active ? Math.max(10, Math.min(95, node.load + (Math.random() * 20 - 10))) : 0,
          isProcessingVision: node.type === 'NPU' && Math.random() > 0.8
        }));

        // Se for professor, filtrar apenas o nó local (Simulado como ID 1)
        if (!isManagement) {
          return updated.filter(n => n.id === '1' || n.name.includes('Local'));
        }
        return updated;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isManagement]);

  return (
    <div className="swarm-monitor glass">
      <header className="swarm-header">
        <div className="swarm-title-group">
          <Activity className="text-blue-500 animate-pulse" size={20} />
          <h3>{isManagement ? 'Monitor Global do Enxame' : 'Status do Nó Local'}</h3>
        </div>
        <div className="swarm-active-badge">
          {nodes.filter(n => n.active).length} NÓS ONLINE
        </div>
      </header>

      <div className="swarm-grid">
        {nodes.map(node => (
          <div key={node.id} className={`swarm-card ${node.isProcessingVision ? 'processing-vision' : ''} ${!node.active ? 'offline' : ''}`}>
            <div className="swarm-node-icon">
              {node.type === 'NPU' && <Cpu size={24} />}
              {node.type === 'SERVER' && <Server size={24} />}
              {node.type === 'CLOUD' && <Cloud size={24} />}
            </div>
            
            <div className="swarm-node-info">
              <span className="node-name">{node.name}</span>
              <span className="node-type">{node.type} NODE</span>
            </div>

            <div className="swarm-node-status">
               <div className="load-bar">
                 <div 
                   className="load-fill" 
                   ref={(el) => { if (el) el.style.setProperty('--node-load', `${node.load}%`); }}
                 ></div>
               </div>
               <span className="load-val">{Math.round(node.load)}%</span>
            </div>

            {node.isProcessingVision && (
              <div className="vision-tag">
                <Zap size={10} /> VISION ACTIVE
              </div>
            )}
          </div>
        ))}
      </div>

      <footer className="swarm-footer">
        <p>Orquestração de Inteligência Distribuída</p>
        <span className="latency-info">Latência Média: 12ms</span>
      </footer>
    </div>
  );
};
