import React, { useMemo } from 'react';
import { Network, Cpu, Zap, Share2 } from 'lucide-react';
import './NeuralShardVisualizer.css';

interface NeuralShardVisualizerProps {
  modelName?: string;
  totalLayers?: number;
  shards?: Array<{ nodeId: string; layers: number[]; latency: number }>;
}

/**
 * NEURAL SHARD VISUALIZER (v3901)
 * Visualização de como o processamento de IA é distribuído entre os nós.
 */
const NeuralShardVisualizer: React.FC<NeuralShardVisualizerProps> = ({ 
  modelName = "Llama-3-8B-Sovereign", 
  totalLayers = 32,
  shards = [
    { nodeId: 'node-01', layers: [0, 1, 2, 3, 4, 5, 6, 7, 16, 17, 18, 19], latency: 5 },
    { nodeId: 'node-02', layers: [8, 9, 10, 11, 12, 13, 14, 15], latency: 12 },
    { nodeId: 'node-03', layers: [20, 21, 22, 23, 24, 25, 26, 27], latency: 25 },
    { nodeId: 'node-hq', layers: [28, 29, 30, 31], latency: 2 }
  ]
}) => {
  const layerMap = useMemo(() => {
    const map = new Array(totalLayers).fill(null);
    shards.forEach(shard => {
      shard.layers.forEach(layer => {
        if (layer < totalLayers) map[layer] = shard.nodeId;
      });
    });
    return map;
  }, [shards, totalLayers]);

  return (
    <div className="neural-shard-visualizer glass">
      <div className="visualizer-header">
        <div className="flex items-center gap-2">
          <Share2 size={18} className="text-emerald-400" />
          <h4 className="text-sm font-black tracking-widest">{modelName}</h4>
        </div>
        <div className="latency-badge">
          <Zap size={10} />
          <span>MESH-LLM ACTIVE</span>
        </div>
      </div>

      <div className="shard-grid">
        {layerMap.map((nodeId, idx) => (
          <div 
            key={idx} 
            className={`layer-node node-${nodeId || 'empty'}`}
            title={`Layer ${idx}: ${nodeId || 'Unassigned'}`}
          >
            <div className="layer-dot"></div>
            {idx % 8 === 0 && <span className="layer-index">L{idx}</span>}
          </div>
        ))}
      </div>

      <div className="sharding-legend">
        {shards.map(shard => (
          <div key={shard.nodeId} className="legend-item">
            <div className={`legend-dot node-${shard.nodeId}`}></div>
            <span className="legend-name">{shard.nodeId.toUpperCase()}</span>
            <span className="legend-latency">{shard.latency}ms</span>
          </div>
        ))}
      </div>

      <div className="mesh-status">
        <div className="mesh-activity-pulse"></div>
        <p>Inferência distribuída via Sovereign Relay - 4 Shards Operacionais</p>
      </div>
    </div>
  );
};

export default NeuralShardVisualizer;
