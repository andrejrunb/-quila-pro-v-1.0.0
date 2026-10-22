import React, { useState } from 'react';
import { 
  Download, FileText, CheckCircle, Clock, AlertTriangle, X, 
  ExternalLink, Share2, Package, Cpu, Database, Save, ArrowRight, Loader2
} from 'lucide-react';
import { usePerformance } from '../hooks/PerformanceContext';
import './ExportHub.css';

interface StudyBundle {
  id: string;
  name: string;
  type: string;
  size: string;
  createdAt: string;
}

export const ExportHub: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { isLiteMode } = usePerformance();
  const [status, setStatus] = useState<'IDLE' | 'COMPILING' | 'SUCCESS'>('IDLE');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  
  const bundles: StudyBundle[] = [
    { id: '1', name: 'Semana 14: IA Avançada', type: 'NotebookLM', size: '12MB', createdAt: '2023-10-27' },
    { id: '2', name: 'Semana 13: Neurociência', type: 'Anki/SRS', size: '8MB', createdAt: '2023-10-20' }
  ];

  const steps = [
    'Recuperando Transcrições de Aula...',
    'Limpando Ruído com IA Soberana...',
    'Indexando Vetores (RAG)...',
    'Formatando p/ NotebookLM...',
    'Empacotando Estudo Semanal...'
  ];

  const handleExport = async () => {
    setStatus('COMPILING');
    let p = 0;
    let stepIndex = 0;
    
    // Simulação visual de progresso (v3469)
    const interval = setInterval(() => {
      p += 5;
      setProgress(p);
      
      if (p % 20 === 0 && stepIndex < steps.length - 1) {
        stepIndex++;
        setCurrentStep(steps[stepIndex]);
      }

      if (p >= 100) {
        clearInterval(interval);
      }
    }, 100);

    try {
      // Chamada real ao motor de exportação (v3470)
      const data = {
        title: `Compilação Semanal - ${new Date().toLocaleDateString()}`,
        content: "Conteúdo consolidado das aulas e interações de IA da semana.",
        metadata: { id: Date.now(), unit: 'Alpha' },
        sources: ['Enxame Áquila Pro', 'Nexus Alpha']
      };
      
      const filePath = await (window as any).electron.ipcRenderer.invoke('ai:export-notebook', data);
      console.log('[Export] Arquivo gerado:', filePath);
      setStatus('SUCCESS');
    } catch (err) {
      console.error('[ExportHub] Falha na exportação:', err);
      setStatus('IDLE');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`export-hub-overlay animate-fade-in ${isLiteMode ? 'mode-lite' : ''}`}>
      <div className="export-hub-modal glass-premium">
        <header className="export-header">
           <div className="export-title-group">
            <div className="export-icon-main"><Package size={24} /></div>
            <div>
              <h2>HUB DE EXPORTAÇÃO</h2>
              <p>Compilação de Fontes RAG para Intelligence Swarm</p>
            </div>
           </div>
           <button className="btn-close-export" onClick={onClose} title="Fechar Hub"><X size={20} /></button>
        </header>

        <main className="export-body">
          {status === 'IDLE' && (
            <div className="export-idle-view animate-fade-in">
               <div className="export-hero">
                  <div className="hero-icon-stack">
                     <Package className="icon-main" />
                     <div className="icon-sub"><Cpu size={14} /></div>
                  </div>
                  <h3>Compilador de Estudo Soberano</h3>
                  <p>Transforme suas aulas em fontes de alta fidelidade para o NotebookLM ou SRS.</p>
               </div>

               <div className="recent-bundles-section">
                  <div className="section-label">BUNDLES RECENTES</div>
                  <div className="bundles-list">
                     {bundles.map(b => (
                       <div key={b.id} className="bundle-card glass-premium">
                          <FileText size={18} className="text-blue-400" />
                          <div className="bundle-info">
                             <span className="bundle-name">{b.name}</span>
                             <span className="bundle-meta">{b.type} • {b.size}</span>
                          </div>
                          <button 
                            className="btn-download-mini" 
                            title="Baixar"
                            onClick={() => {
                              (window as any).aquila?.invoke('shell:openPath', 'C:/aquila/exports');
                              (window as any).showToast?.(`Abrindo pacote: ${b.name}`, 'info');
                            }}
                          >
                            <Download size={14} />
                          </button>
                       </div>
                     ))}
                  </div>
               </div>

               <button className="btn-start-export" onClick={handleExport}>
                  GERAR NOVO BUNDLE <ArrowRight size={18} />
               </button>
            </div>
          )}

          {status === 'COMPILING' && (
            <div className="export-compiling-view animate-fade-in">
               <div className="compiling-loader">
                  <Loader2 className="animate-spin text-blue-500" size={48} />
                  <div className="loader-glow"></div>
               </div>
               <h3 className="compiling-title">{currentStep || steps[0]}</h3>
               <div className="compiling-progress-container">
                  <div className="c-progress-bar">
                    <div 
                      className="c-progress-fill" 
                      style={{ '--compile-width': `${progress}%` } as React.CSSProperties}
                    ></div>
                  </div>
                  <span className="c-progress-value">{progress}%</span>
               </div>
               
               <div className="neural-timeline-mini">
                  <div className={`mini-step ${progress > 20 ? 'active' : ''}`}><Database size={12} /></div>
                  <div className={`mini-step ${progress > 60 ? 'active' : ''}`}><Cpu size={12} /></div>
                  <div className={`mini-step ${progress > 90 ? 'active' : ''}`}><Save size={12} /></div>
               </div>
            </div>
          )}

          {status === 'SUCCESS' && (
            <div className="export-success-view animate-fade-in">
               <div className="success-icon-anim">
                  <CheckCircle size={64} className="text-emerald-500" />
                  <div className="success-glow"></div>
               </div>
               <h3 className="success-title">CONTEÚDO PRONTO!</h3>
               <p className="success-desc">Seus arquivos foram otimizados e estão prontos para seu Segundo Cérebro.</p>
               
               <div className="success-actions">
                  <button className="btn-download-bundle" onClick={() => (window as any).aquila?.invoke('shell:openPath', 'C:/aquila/exports')}>
                    ABRIR PASTA DE EXPORTAÇÃO
                  </button>
                  <button className="btn-cloud-sync-mini" onClick={() => {
                    navigator.clipboard.writeText('Contexto de estudo gerado via Áquila Pro Sovereign Swarm.');
                    (window as any).showToast?.('Link de compartilhamento copiado!', 'success');
                  }}>
                    <Share2 size={14} /> SHARE
                  </button>
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
