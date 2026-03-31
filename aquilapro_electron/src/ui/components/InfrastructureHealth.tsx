import React, { useState, useEffect, useRef } from 'react';
import { Server, Globe, Activity, ShieldAlert, Cpu, HardDrive, RefreshCw, Zap } from 'lucide-react';
import { redundancyManager, ServerNode } from '../../services/RedundancyManager';
import { geoReplication, ReplicationNode } from '../../services/GeoReplicationService';
import { predictiveSafetyService } from '../../services/PredictiveSafetyService';
import './InfrastructureHealth.css';

/**
 * Componente Phase 201-203: Monitoramento de Infraestrutura Crítica
 * Exibe o status do cluster de redundância quádrupla e replicação geográfica.
 */
export const InfrastructureHealth: React.FC = () => {
  const [cluster, setCluster] = useState<ServerNode[]>([]);
  const [geoNodes, setGeoNodes] = useState<ReplicationNode[]>([]);
  const [safetyRisk, setSafetyRisk] = useState<number>(0);
  const [npuStatus, setNpuStatus] = useState<any>(null);
  const riskRef = useRef<HTMLDivElement>(null);
  const npuTempRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (riskRef.current) {
      riskRef.current.style.setProperty('--risk-width', `${safetyRisk}%`);
    }
  }, [safetyRisk]);

  useEffect(() => {
    if (npuTempRef.current) {
      npuTempRef.current.style.setProperty('--temp-width', `${(npuStatus?.temperature || 40)}%`);
    }
  }, [npuStatus?.temperature]);

  useEffect(() => {
    setSafetyRisk(predictiveSafetyService.getCurrentRiskLevel());
    setCluster(redundancyManager.getCluster());
    setGeoNodes(geoReplication.getNodes());

    const unsubCluster = redundancyManager.on('cluster-updated', setCluster);
    const unsubGeo = geoReplication.on('nodes-updated', setGeoNodes);

    // Monitoramento de NPU (Phase v3450)
    const unsubNpu = window.aquila?.onNpuStatus?.(setNpuStatus);

    return () => {
      if (unsubNpu) unsubNpu();
    };
  }, []);

  const handleFailover = (id: string) => {
    if (window.confirm('Deseja iniciar o failover manual para este nó?')) {
      redundancyManager.initiateFailover(id);
    }
  };

  return (
    <div className="infra-health-container" role="region" aria-label="Saúde da Infraestrutura">
      <header className="infra-header">
        <div className="flex items-center gap-3">
          <Server className="text-blue-400" size={20} />
          <h2 className="text-lg font-bold">Resiliência de Cluster (Quad-Redundancy)</h2>
        </div>
        <div className="text-xs text-slate-500 font-mono">V.2.0.1-RESILIENT</div>
      </header>

      <div className="safety-index-widget mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className={safetyRisk > 50 ? 'text-red-500' : 'text-blue-400'} size={18} />
            <span className="text-sm font-black uppercase">Índice de Risco Preditivo (v1641)</span>
          </div>
          <span className={`risk-value ${safetyRisk > 50 ? 'critical' : ''}`}>{safetyRisk}%</span>
        </div>
        <div className="risk-bar-bg">
          <div 
            ref={riskRef}
            className="risk-bar-fill" 
          ></div>
        </div>
        <p className="text-[10px] opacity-50 mt-2">
          O enxame está analisando trajetórias e densidade em tempo real. Status: {predictiveSafetyService.getSafetyStatus()}
        </p>
      </div>

      <div className="cluster-grid">
        {cluster.map(node => (
          <div key={node.id} className={`node-card ${node.role === 'primary' ? 'node-card--primary' : ''}`}>
            <div className="node-role">{node.role}</div>
            <div className="node-id">{node.id}</div>
            
            <div className="node-status-indicator">
              <div className={`status-dot status-dot--${node.health}`} />
              <span className="capitalize">{node.health}</span>
            </div>

            <div className="node-metrics">
              <div className="metric-item">
                <div className="metric-label">
                  <span>Carga de CPU</span>
                  <span>{node.load}%</span>
                </div>
                <NodeLoadBar load={node.load} />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">IP: {node.ip}</div>
            </div>

            {node.role !== 'primary' && node.health === 'healthy' && (
              <button 
                onClick={() => handleFailover(node.id)}
                className="mt-4 w-full py-1 text-[10px] bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
              >
                Promover a Primário
              </button>
            )}
          </div>
        ))}
      </div>

      {/* AI PROCESSOR (NPU/GPU) - Phase v3450 */}
      <div className="npu-stats-widget mt-6 mb-6">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="text-yellow-400" size={18} />
            <h3 className="text-md font-semibold italic">AI Processor (NPU/GPU Acceleration)</h3>
          </div>
          {npuStatus?.npuUsed && <div className="text-[10px] bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded border border-yellow-400/20">DIRECT-ML ACTIVE</div>}
        </header>

        <div className="npu-grid">
          <div className="npu-card">
            <div className="text-[10px] text-slate-500 uppercase">Aceleração</div>
            <div className="text-xl font-black text-yellow-400">{npuStatus?.modelAcceleration || 4.5}x</div>
            <div className="text-[9px] opacity-50">vs CPU Baseline</div>
          </div>
          <div className="npu-card">
            <div className="text-[10px] text-slate-500 uppercase">Temperature</div>
            <div className="text-xl font-bold">{npuStatus?.temperature.toFixed(1) || 42}°C</div>
            <div className="temp-bar-bg">
               <div 
                 ref={npuTempRef}
                 className="temp-bar-fill" 
               ></div>
            </div>
          </div>
          <div className="npu-card">
            <div className="text-[10px] text-slate-500 uppercase">Power Draw</div>
            <div className="text-xl font-bold">{npuStatus?.powerDraw.toFixed(1) || 3.2}W</div>
            <div className="text-[9px] opacity-50 text-emerald-400 italic">Ultra-Efficient</div>
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {npuStatus?.activeKernels.map((k: string) => (
            <span key={k} className="text-[9px] bg-slate-800 text-slate-400 px-2 py-1 rounded-sm border border-slate-700">
              {k}
            </span>
          ))}
        </div>
      </div>

      <div className="geo-nodes-section">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="text-emerald-400" size={18} />
            <h3 className="text-md font-semibold">Replicação Geográfica (Multi-Site)</h3>
          </div>
          <Activity className="text-emerald-500 animate-pulse" size={16} />
        </header>

        <div className="geo-list">
          {geoNodes.map(node => (
            <div key={node.id} className="geo-item">
              <div className="geo-info">
                <div className={`w-2 h-2 rounded-full ${node.status === 'active' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                <div>
                  <div className="text-sm font-medium">{node.name}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{node.region}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="latency-badge">{node.latency}ms</div>
                <div className="text-[10px] text-slate-400">
                  Sync: {new Date(node.lastSync).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
const NodeLoadBar: React.FC<{ load: number }> = ({ load }) => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.setProperty('--load-percent', `${load}%`);
    }
  }, [load]);

  return (
    <div className="metric-bar-bg">
      <div 
        ref={barRef}
        className={`metric-bar-fill ${load > 80 ? 'is-critical' : 'is-normal'}`} 
      />
    </div>
  );
};
