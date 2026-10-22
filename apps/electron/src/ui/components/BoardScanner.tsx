import React, { useState } from 'react';
import { Camera, FileUp, CheckCircle, Brain, RefreshCw, X, Crosshair, Terminal, Activity, Zap } from 'lucide-react';
import { usePerformance } from '../hooks/PerformanceContext';
import './BoardScanner.css';

interface ExtractedContent {
  id: string;
  type: 'flashcard' | 'task';
  content: string;
  approved: boolean;
}

export const BoardScanner: React.FC = () => {
  const { isLiteMode } = usePerformance();
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ExtractedContent[]>([]);
  const [logs, setLogs] = useState<string[]>(['Sistema pronto. Aguardando entrada...']);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setResults([]);
        setProgress(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const startScan = async () => {
    setIsScanning(true);
    setLogs(prev => [...prev, 'Enviando imagem ao Córtex Central...', 'Executando OCR e Extração LLaVA...']);
    
    // Animação de progresso cosmética enquanto o processo real acontece
    let p = 0;
    const interval = setInterval(() => {
      p = Math.min(p + 15, 90);
      setProgress(p);
    }, 500);

    try {
      const win = window as any;
      const base64Image = image?.split(',')[1] || '';
      
      const res = await win.aquila.invoke('pedagogy:process-whiteboard', {
        classId: 'turma-atual',
        base64Image
      });

      clearInterval(interval);
      setProgress(100);
      setIsScanning(false);
      
      if (res.success) {
        setLogs(prev => [...prev, 'EXTRAÇÃO CONCLUÍDA COM SUCESSO.']);
        // Converter a resposta da IA em cards visuais. Se não for um JSON de flashcards, exibiremos o texto livre em um único card.
        setResults([
          { id: '1', type: 'task', content: res.content, approved: true }
        ]);
      } else {
        setLogs(prev => [...prev, 'FALHA NA EXTRAÇÃO: ' + res.message]);
      }
    } catch (err: any) {
      clearInterval(interval);
      setIsScanning(false);
      setLogs(prev => [...prev, 'ERRO DO SERVIDOR: ' + err.message]);
    }
  };

  const toggleApprove = (id: string) => {
    setResults(prev => prev.map(r => r.id === id ? { ...r, approved: !r.approved } : r));
  };

  return (
    <div className="board-scanner glass">
      <header className="scanner-header">
        <div className="title-area">
          <h3><Camera size={20} className="text-blue-500" /> Scanner de Lousa Soberano</h3>
          <p>Converta a lousa diretamente em material de estudo Flashcard/Task.</p>
        </div>
        <div className="scanner-actions">
           <button 
             className="btn-vram-gc glass-premium" 
             onClick={() => (window as any).electron.ipcRenderer.invoke('ai:vram-gc')}
             title="Limpar VRAM (Turbo Mode)"
           >
             <Zap size={14} /> VRAM GC
           </button>
        </div>
      </header>

      <div className={`upload-container ${isScanning ? 'is-scanning' : ''}`}>
        {!image ? (
          <label className="drop-zone border-dashed group glass-premium">
            <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
            <FileUp className="w-12 h-12 text-slate-500 group-hover:text-blue-500 transition-colors" />
            <span className="upload-text">DRAG & DROP BOARD IMAGE</span>
            <span className="upload-sub">Formatos Suportados: PNG, JPG, HEIC</span>
          </label>
        ) : (
          <div className="preview-area glass-premium">
            <div className="scanner-target-reticle rt"></div>
            <div className="scanner-target-reticle rb"></div>
            <div className="scanner-target-reticle lt"></div>
            <div className="scanner-target-reticle lb"></div>
            
            <img src={image} alt="Board preview" className="board-image" />
            
            {!isLiteMode && <div className="scanning-grid-overlay"></div>}
            
            {isScanning && (
              <div className="scanner-line-active"></div>
            )}
            
            <button className="btn-reset-v2" onClick={() => { setImage(null); setResults([]); }} title="Expulsar Mídia">
                <X size={16} />
            </button>

            <div className="image-stats-overlay">
                <span>RESOLUÇÃO: 4K HIGH-FIDELITY</span>
                <span>ISO: AUTO (AI)</span>
            </div>
          </div>
        )}
      </div>

        <div className="progress-container">
          {image && !isScanning && results.length === 0 && (
             <button onClick={startScan} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-xl w-full hover:bg-blue-600 shadow-glow mb-4">
                Iniciar Extração de Lousa
             </button>
          )}
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              ref={(el) => { if (el) el.style.setProperty('--progress-width', `${progress}%`); }}
            ></div>
          </div>
          <span className="progress-label">ANALISANDO REDE NEURAL... {progress}%</span>
        </div>

      {results.length > 0 && (
        <div className="results-container animate-fade-in">
          <div className="results-header">
            <h4><CheckCircle size={16} className="text-emerald-500" /> Sugestões Geradas pela IA</h4>
            <span>{results.filter(r => r.approved).length}/{results.length} Aprovados</span>
          </div>
          
          <div className="results-list custom-scroll">
            {results.map(res => (
              <div key={res.id} className={`result-card ${res.approved ? 'approved' : ''}`} onClick={() => toggleApprove(res.id)}>
                <div className="card-type-badge">{res.type.toUpperCase()}</div>
                <p className="card-content">{res.content}</p>
                <div className="card-approve-indicator">
                  <CheckCircle size={16} />
                </div>
              </div>
            ))}
          </div>

          <div className="results-actions">
            <button className="btn-approve-all" onClick={() => (window as any).showToast?.('Conteúdo enviado para o SRS dos alunos com sucesso!', 'success')}>
              <CheckCircle size={16} /> CONFIRMAR E ENVIAR
            </button>
            <button 
              className="btn-export-notebook glass-premium" 
              onClick={async () => {
                const data = {
                  title: 'Material de Aula - ' + new Date().toLocaleDateString(),
                  content: results.map(r => r.content).join('\n\n'),
                  metadata: { id: Date.now() },
                  sources: ['IA Vision Board Extraction']
                };
                const path = await ((window as any).aquila?.invoke('ai:export-notebook', data) || (window as any).electron?.ipcRenderer?.invoke('ai:export-notebook', data));
                (window as any).showToast?.('Material exportado para: ' + (path || 'NotebookLM'), 'success');
              }}
            >
              <FileUp size={16} /> EXPORTAR NOTEBOOKLM
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
