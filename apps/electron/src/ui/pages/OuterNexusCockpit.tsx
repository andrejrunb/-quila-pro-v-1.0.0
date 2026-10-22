import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Wifi, 
  Database, 
  Activity, 
  Maximize2,
  ChevronRight,
  Share2
} from 'lucide-react';
import './OuterNexusCockpit.css';

const OuterNexusCockpit: React.FC = () => {
  const [nodes, setNodes] = useState<any[]>([]);

  const fetchFootprint = async () => {
    try {
      const f = await (window as any).aquila.invoke('outer:get-footprint');
      setNodes(f);
    } catch (err) {
      console.error('Erro ao buscar pegada galática:', err);
    }
  };

  const syncNode = async (id: string) => {
    await (window as any).aquila.invoke('outer:sync-node', { nodeId: id });
    alert(`Nó ${id} sincronizado com o Córtex Central!`);
    fetchFootprint();
  };

  useEffect(() => {
    fetchFootprint();
  }, []);

  return (
    <div className="outer-nexus-container">
      <div className="nebula-bg"></div>
      
      <header className="outer-nexus-header">
        <div className="flex items-center gap-6">
          <div className="nexus-icon-glow">
             <Globe size={40} className="text-purple-400" />
          </div>
          <div>
            <h1>Outer Nexus</h1>
            <p>Galactic Intelligence Expansion — Áquila Pro Nível 49</p>
          </div>
        </div>
      </header>

      <div className="outer-nexus-grid">
        {/* Mapa de Expansão (Lista de Unidades) */}
        <section className="expansion-map glass-panel">
           <h3>Mapa de Expansão Institucional</h3>
           <div className="nodes-list">
              {nodes.map((node, i) => (
                <div key={i} className={`node-row status-${node.status?.toLowerCase() || ''}`}>
                   <div className="n-info">
                      <div className="status-indicator"></div>
                      <div>
                         <strong>{node.name}</strong>
                         <p>ID: {node.id}</p>
                      </div>
                   </div>
                   <div className="n-stats">
                      <div className="stat">
                         <label>Carga Cognitiva</label>
                         <div className="mini-bar"><div className="fill" style={{ width: `${node.cognitiveLoad}%` }}></div></div>
                      </div>
                      <button className="sync-btn" onClick={() => syncNode(node.id)}>
                         Sincronizar <Activity size={14} />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* Estatísticas de Rede Inter-Planetária */}
        <aside className="nexus-stats">
           <div className="glass-panel global-capacity">
              <Database size={32} className="text-purple-400 mb-4" />
              <h3>Capacidade Federada</h3>
              <div className="cap-val">820 TOPS</div>
              <p>Somatória de NPUs em rede</p>
           </div>

           <div className="glass-panel network-health">
              <h3>Saúde da Rede</h3>
              <div className="health-line">
                 <Wifi size={16} className="text-emerald-400" />
                 <span>Latência Média: 1.2ms</span>
              </div>
              <div className="health-line">
                 <Share2 size={16} className="text-blue-400" />
                 <span>Sincronia Global: 99.9%</span>
              </div>
           </div>

           <button className="expand-view glass-panel">
              <Maximize2 size={18} /> Ver Visão Galática <ChevronRight size={14} />
           </button>
        </aside>
      </div>

      <footer className="outer-nexus-footer">
         <Globe size={14} className="text-purple-400" />
         <span>Outer Nexus: Expandindo a soberania para além das fronteiras físicas.</span>
      </footer>
    </div>
  );
};

export default OuterNexusCockpit;
