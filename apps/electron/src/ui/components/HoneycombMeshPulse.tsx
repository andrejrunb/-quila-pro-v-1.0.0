import React, { useEffect, useState } from 'react';
import { HexCellCard } from './HexCellCard';
import '../styles/CoolmeiaUX.css';

/**
 * HONEYCOMB MESH PULSE (v4002)
 * ----------------------------
 * Visualiza a resiliência da rede escolar em formato de colmeia.
 * Conectado ao NexusSyncService para métricas reais do enxame.
 */
export const HoneycombMeshPulse: React.FC = () => {
  const [nodes, setNodes] = useState<any[]>([]);

  useEffect(() => {
    const updateNodes = async () => {
      try {
        const swarm = await window.aquila.getSwarmStatus();
        setNodes(swarm || []);
      } catch (err) {
        console.error('Failed to sync honeycomb nodes:', err);
      }
    };

    updateNodes();

    // Subscribe to pulse-based refreshes
    const unsubscribe = window.aquila.onNexusPulse(() => updateNodes());

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="honeycomb-pulse-container">
       <h2 className="hive-title hive-header-title">
          NEXUS MESH NETWORK | SOVEREIGN STATUS v4002
       </h2>
       
       <div className="honeycomb-grid">
          {nodes.length > 0 ? nodes.map(node => (
            <HexCellCard 
              key={node.id} 
              title={node.name} 
              subtitle={`NPU LOAD: ${Math.round(node.load * 100)}%`} 
              status={node.syncStatus === 'synced' ? 'active' : (node.syncStatus === 'offline' ? 'alert' : 'sync')}
              icon={node.syncStatus === 'offline' ? '⚠️' : (node.load > 0.8 ? '🔥' : '🔋')}
            />
          )) : (
            <div className="loading-swarm">INICIALIZANDO ENXAME NEXUS...</div>
          )}
       </div>

       {/* LEGEND (v4002) */}
       <div className="hive-legend">
          <div className="legend-item">🟢 ACTIVE: NEXUS COMPUTE READY</div>
          <div className="legend-item">🟡 SYNC: DATA SHARDING IN PROGRESS</div>
          <div className="legend-item">🔴 OFFLINE: NODE ISOLATED</div>
          <div className="legend-item">🔥 CRITICAL: HIGH NPU THERMAL LOAD</div>
       </div>
    </div>
  );
};
