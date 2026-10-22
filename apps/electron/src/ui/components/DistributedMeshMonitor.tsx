import React, { useState, useEffect } from 'react';
import { Cpu, Globe, Zap, Server, Activity } from 'lucide-react';
import './DistributedMeshMonitor.css';

interface MeshNode {
  id: string;
  name: string;
  isLocal: boolean;
  npuLoad: number;
  status: 'online' | 'busy' | 'offline';
}

interface ActiveTask {
  id: string;
  type: string;
  sourceNode: string;
  targetNode: string;
  progress: number;
}

const DistributedMeshMonitor: React.FC = () => {
  const [nodes, setNodes] = useState<MeshNode[]>([
    { id: 'alpha-hub', name: 'Hub Principal (Local)', isLocal: true, npuLoad: 42, status: 'online' },
    { id: 'beta-hub', name: 'Hub Unidade Norte', isLocal: false, npuLoad: 28, status: 'online' },
    { id: 'gamma-hub', name: 'Hub Unidade Sul', isLocal: false, npuLoad: 85, status: 'busy' }
  ]);

  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([
    { id: 'task-1', type: 'Sentiment Analysis', sourceNode: 'alpha-hub', targetNode: 'beta-hub', progress: 45 },
    { id: 'task-2', type: 'Entity Extraction', sourceNode: 'alpha-hub', targetNode: 'gamma-hub', progress: 12 }
  ]);

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const ipc = (window as any).electron?.ipcRenderer;
        if (!ipc) return;

        const meshState = await ipc.invoke('mesh:get-inference-state');
        if (meshState) {
          setNodes(meshState.nodes);
          
          // Map backend tasks to UI format
          const mappedTasks: ActiveTask[] = meshState.tasks.map((t: any) => ({
            id: t.id,
            type: t.type.toUpperCase(),
            sourceNode: t.sourceNodeId.substring(0, 8),
            targetNode: t.targetNodeId ? t.targetNodeId.substring(0, 8) : 'ALL',
            progress: t.status === 'completed' ? 100 : (t.status === 'processing' ? 50 : 10)
          }));
          
          setActiveTasks(mappedTasks);
        }
      } catch (error) {
        console.error('[MeshMonitor] Error polling state:', error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, []);

  return (
    <div className="distributed-mesh-monitor glass">
      <div className="dmm-header">
        <h3>
          <Globe size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Córtex Transcendente (Malha NPU)
        </h3>
        <div className="be-stat-pill" style={{ color: '#f472b6', borderColor: '#f472b6' }}>
          <Zap size={10} /> {nodes.filter(n => n.status === 'online').length} Nós Ativos
        </div>
      </div>

      <div className="dmm-mesh-viz">
        {nodes.map((node, i) => {
          const angle = (i / nodes.length) * 2 * Math.PI;
          const radius = 70;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <div 
              key={node.id} 
              className={`dmm-node ${node.isLocal ? 'master' : ''}`}
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              <Server size={20} color={node.isLocal ? '#38bdf8' : '#f472b6'} />
              <div className="dmm-node-label">{node.name}</div>
            </div>
          );
        })}
        
        {/* Simplified connections */}
        <div className="dmm-link" style={{ width: '140px', transform: 'rotate(30deg)' }}></div>
        <div className="dmm-link" style={{ width: '140px', transform: 'rotate(150deg)' }}></div>
        <div className="dmm-link" style={{ width: '140px', transform: 'rotate(270deg)' }}></div>
      </div>

      <div className="dmm-tasks-list">
        <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '5px' }}>Tarefas Distribuídas em Tempo Real</div>
        {activeTasks.map(task => (
          <div key={task.id} className="dmm-task-item">
            <div className="dmm-task-info">
              <div className="dmm-task-type">{task.type}</div>
              <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
                {task.sourceNode} → {task.targetNode}
              </div>
            </div>
            <div className="dmm-task-progress" style={{ width: '60px' }}>
              <div className="be-progress-track">
                <div 
                  className="be-progress-fill" 
                  style={{ width: `${task.progress}%`, background: '#f472b6' }}
                ></div>
              </div>
            </div>
            <div className="dmm-task-status status-processing">Processando</div>
          </div>
        ))}
      </div>

      <div className="dmm-node-stats">
        {nodes.map(node => (
          <div key={node.id} style={{ flex: 1 }}>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
              <span>{node.id}</span>
              <span>{node.npuLoad}% NPU</span>
            </div>
            <div className="dmm-npu-bar">
              <div className="dmm-npu-fill" style={{ width: `${node.npuLoad}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DistributedMeshMonitor;
