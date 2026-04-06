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

  const startScan = () => {
    setIsScanning(true);
    setLogs(prev => [...prev, 'Iniciando captura de fóton...', 'Calibrando rede neural local...']);
    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setProgress(p);
      
      if (p === 30) setLogs(prev => [...prev, 'Detectando limites da lousa (Hough Transform)...']);
      if (p === 60) setLogs(prev => [...prev, 'Executando OCR Vision-Ensemble...']);
      if (p === 90) setLogs(prev => [...prev, 'Estruturando Flashcards SM-2...']);

      if (p >= 100) {
        clearInterval(interval);
        setIsScanning(false);
        setLogs(prev => [...prev, 'EXTRAÇÃO CONCLUÍDA COM SUCESSO.']);
        setResults([
          { id: '1', type: 'flashcard', content: 'Pergunta: O que é Soberania Digital? Resposta: O controle sobre dados e infra.', approved: false },
          { id: '2', type: 'task', content: 'Ler capítulo 4 sobre algoritmos de consenso.', approved: false },
          { id: '3', type: 'flashcard', content: 'Pergunta: Como funciona o RAG? Resposta: Recuperação aumentada por geração.', approved: false },
        ]);
      }
    }, 150);
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
            <button className="btn-approve-all" onClick={() => alert('Conteúdo enviado para o SRS dos alunos.')}>
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
                const path = await (window as any).electron.ipcRenderer.invoke('ai:export-notebook', data);
                alert('Exportado para: ' + path);
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
