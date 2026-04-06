import React, { useState, useEffect } from 'react';
import { Server, Cpu, Zap, Shield, CheckCircle, Activity, Save, Loader2 } from 'lucide-react';
import './AIServerSetup.css';

interface AIModel {
  id: string;
  name: string;
  params: string;
  quant: string;
  minRam: string;
}

const MODELS: AIModel[] = [
  { id: 'llama3:8b', name: 'Llama 3', params: '8B', quant: '3-bit TQ', minRam: '4GB' },
  { id: 'phi3:mini', name: 'Phi-3 Mini', params: '3.8B', quant: '4-bit', minRam: '2GB' },
  { id: 'mistral:latest', name: 'Mistral v0.3', params: '7B', quant: 'Q4_K_M', minRam: '6GB' },
];

export const AIServerSetup: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [deploying, setDeploying] = useState(false);
  const [activeNode, setActiveNode] = useState('Alpha-Node');
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const installed = await (window as any).electron.ipcRenderer.invoke('swarm:get-installed-models');
      setModels(installed || ['llama3:latest', 'mistral:latest']);
    } catch (err) {
      console.error('[AIServerSetup] Erro ao carregar modelos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      await (window as any).electron.ipcRenderer.invoke('swarm:deploy-model', {
        nodeId: activeNode,
        model: selectedModel
      });
      alert(`✅ Deploy concluído: ${selectedModel} em ${activeNode}`);
      fetchData();
    } catch (err) {
      alert(`❌ Erro no deploy: ${err}`);
    } finally {
      setDeploying(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline mr-2 text-blue-500" /> Sincronizando com o Enxame...</div>;

  return (
    <div className="ai-server-setup glass-premium animate-fade-in">
      <header className="setup-header">
         <button onClick={onBack} className="btn-setup-back">← Voltar</button>
         <div className="title-group">
            <Zap className="text-blue-500" size={28} />
            <h1>Configuração de IA Soberana</h1>
         </div>
      </header>

      <section className="setup-main-content">
        <div className="section-head">
          <Cpu size={20} className="text-blue-400" />
          <h3>Orquestração de Modelos LLM</h3>
        </div>

        <div className="model-selector-grid">
           {MODELS.map(model => (
             <div 
               key={model.id} 
               className={`model-card glass-mini ${selectedModel === model.id ? 'active' : ''}`}
               onClick={() => setSelectedModel(model.id)}
             >
               <div className="model-header">
                 <Server size={16} />
                 <strong>{model.name}</strong>
               </div>
               <div className="model-meta">
                 <span>{model.params}</span>
                 <span className="quant-badge">{model.quant}</span>
               </div>
               <div className="model-ram">Min. RAM: {model.minRam}</div>
             </div>
           ))}
        </div>

        <div className="deployment-controls">
           <div className="target-info">
              <Activity size={14} className="text-emerald-400" />
              <span>Deploy Alvo: <strong>{activeNode}</strong></span>
           </div>
           <button 
             className="btn-deploy-start" 
             disabled={deploying}
             onClick={handleDeploy}
           >
             {deploying ? 'Injetando Pesos...' : 'EXECUTAR DEPLOY NO ENXAME'}
           </button>
        </div>

        <div className="installed-section">
           <div className="section-head">
              <Save size={18} className="text-purple-400" />
              <h4>Modelos Ativos no Enxame</h4>
           </div>
           <div className="installed-list">
              {models.map(m => (
                <div key={m} className="installed-item glass-mini">
                   <span>{m}</span>
                   <CheckCircle size={14} className="text-emerald-500" />
                </div>
              ))}
           </div>
        </div>
      </section>

      <footer className="setup-footer">
        <Shield size={14} className="text-blue-400" />
        <span>Garantia de Soberania: Pesos e Processamento 100% Locais.</span>
      </footer>
    </div>
  );
};

export default AIServerSetup;
