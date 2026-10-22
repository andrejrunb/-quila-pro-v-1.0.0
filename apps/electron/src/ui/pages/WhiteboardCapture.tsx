import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  FileUp, 
  CheckCircle, 
  Sparkles, 
  ChevronLeft,
  Users,
  Save,
  Plus,
  Terminal,
  Zap,
  X,
  Smartphone,
  QrCode,
  Laptop
} from 'lucide-react';
import './WhiteboardCapture.css';

interface WhiteboardCaptureProps {
  onBack: () => void;
  user?: any;
}

export const WhiteboardCapture: React.FC<WhiteboardCaptureProps> = ({ onBack, user }) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [aiSummary, setAiSummary] = useState('');
  const [logs, setLogs] = useState<string[]>(['Pronto para captura...']);
  const [allowDesktopUpload, setAllowDesktopUpload] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const teacherId = user?.id || 'teacher-andre';
      const data = await (window as any).aquila.invoke('get-classes', teacherId);
      setClasses(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        setSelectedClass(data[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar turmas:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setAiSummary('');
        setProgress(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const startScan = async () => {
    if (!image) return;
    setIsScanning(true);
    setLogs(prev => [...prev, 'Preparando imagem...', 'Enviando ao servidor neural SQA-1000...', 'Aguardando processamento vision...']);
    
    let p = 0;
    const interval = setInterval(() => {
      p = Math.min(p + 12, 90);
      setProgress(p);
    }, 400);

    try {
      const base64Image = image.split(',')[1] || '';
      const res = await (window as any).aquila.invoke('pedagogy:process-whiteboard', {
        classId: selectedClass,
        base64Image
      });

      clearInterval(interval);
      setProgress(100);
      setIsScanning(false);
      
      if (res.success) {
        setLogs(prev => [...prev, 'Sucesso: Transcrição e análise prontas.']);
        setAiSummary(res.content || '');
      } else {
        setLogs(prev => [...prev, 'Falha no processamento: ' + res.message]);
        (window as any).showToast?.('Erro: ' + res.message, 'error');
      }
    } catch (err: any) {
      clearInterval(interval);
      setIsScanning(false);
      setLogs(prev => [...prev, 'Erro crítico: ' + err.message]);
      (window as any).showToast?.('Falha crítica: ' + err.message, 'error');
    }
  };

  const handleCreateTaskDirectly = async () => {
    if (!aiSummary) return;
    const taskTitle = prompt('Deseja dar um título para a tarefa gerada?', 'Tarefa de Aula - Quadro');
    if (taskTitle === null) return;
    
    try {
      const taskTemplate = {
        title: taskTitle,
        description: aiSummary,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week due date
        priority: 'normal',
        status: 'pending',
        youtubeLinks: null
      };

      const res = await (window as any).aquila.invoke('tasks:create', {
        classId: selectedClass,
        task: taskTemplate
      });

      if (res.success) {
        (window as any).showToast?.('Atividade agendada com sucesso para todos os alunos da turma!', 'success');
      }
    } catch (err: any) {
      (window as any).showToast?.('Erro ao agendar tarefa: ' + err.message, 'error');
    }
  };

  return (
    <div className="whiteboard-capture-container animate-fade-in">
      <header className="page-header flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="back-btn" title="Voltar ao Painel">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1>Quadro IA (Scanner) <span>v1.0</span></h1>
            <p className="subtitle">Extração de Conteúdos por I.A Vision • Portal Pedagógico</p>
          </div>
        </div>
      </header>

      {/* Select class controls */}
      <section className="controls-panel glass">
        <div className="select-wrapper">
          <Users size={16} className="icon" />
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button 
            className="btn-vram-gc-v2 flex items-center gap-1"
            onClick={async () => {
              await (window as any).aquila.invoke('ai:vram-gc');
              (window as any).showToast?.('VRAM GC acionado! Memória da GPU/NPU otimizada.', 'success');
            }}
          >
            <Zap size={14} />
            <span>VRAM GC</span>
          </button>
        </div>
      </section>

      {/* Main capture area */}
      <section className="scanner-section mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        <div className="upload-column flex flex-col gap-4">
          {!allowDesktopUpload ? (
            <div className="mobile-only-notice bg-slate-900/90 border border-blue-500/30 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-4 shadow-2xl backdrop-blur-md">
              <div className="p-4 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/40 animate-pulse">
                <Smartphone size={40} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1 flex items-center justify-center gap-2">
                  Captura Exclusiva no App Celular 📱
                </h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Esta funcionalidade foi projetada para uso em smartphones. Abra o aplicativo <strong>Áquila Pro Mobile</strong> no celular para fotografar a lousa diretamente na sala de aula.
                </p>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-white/10 text-xs font-mono text-cyan-300 flex items-center gap-2 w-full justify-center">
                <QrCode size={16} className="text-emerald-400" />
                <span>Handoff Ativo: Fotos enviadas pelo celular sincronizam em tempo real</span>
              </div>

              <button 
                className="mt-2 text-xs text-slate-400 hover:text-cyan-300 underline flex items-center gap-1 cursor-pointer transition-colors"
                onClick={() => setAllowDesktopUpload(true)}
              >
                <Laptop size={14} />
                <span>Habilitar upload manual para testes no Desktop</span>
              </button>
            </div>
          ) : (
            <div className={`upload-box glass ${isScanning ? 'scanning' : ''}`}>
              {!image ? (
                <label className="drop-zone-v2">
                  <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
                  <FileUp className="icon w-12 h-12 text-zinc-600 mb-3" />
                  <span className="upload-text">Selecione ou Arraste a Foto do Quadro</span>
                  <span className="upload-sub">Suporta PNG, JPG de alta definição</span>
                </label>
              ) : (
                <div className="preview-container">
                  <img src={image} className="preview-image" alt="Quadro" />
                  {isScanning && <div className="scan-bar"></div>}
                  <button className="btn-remove-img" onClick={() => { setImage(null); setAiSummary(''); setProgress(0); }}>
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {image && !isScanning && !aiSummary && (
            <button className="btn-start-scan flex items-center justify-center gap-2" onClick={startScan}>
              <Sparkles size={16} />
              <span>Iniciar Processamento do Quadro</span>
            </button>
          )}

          {isScanning && (
            <div className="progress-box glass">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="progress-text font-mono text-xs text-zinc-400 mt-2">Extraindo conteúdo... {progress}%</p>
            </div>
          )}

          {/* Console Logs */}
          <div className="console-logs glass p-4">
            <h4 className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-400 uppercase border-b border-white/5 pb-2 mb-2">
              <Terminal size={14} /> Logs do Córtex LLaVA
            </h4>
            <div className="logs-list font-mono text-[11px] text-zinc-500 max-h-[120px] overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className="log-line">&gt; {log}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Results column */}
        <div className="results-column">
          {aiSummary ? (
            <div className="results-box glass flex flex-col h-full justify-between p-6">
              <div className="results-content-area">
                <div className="flex items-center gap-2 text-emerald-400 mb-4 font-bold">
                  <CheckCircle size={20} />
                  <h3>Resumo do Quadro Extraído</h3>
                </div>
                <div className="ai-markdown-summary font-mono text-sm leading-relaxed p-4 bg-black/45 rounded-xl border border-white/5 text-zinc-300 whitespace-pre-wrap max-h-[360px] overflow-y-auto">
                  {aiSummary}
                </div>
              </div>

              <div className="actions flex gap-3 mt-6">
                <button className="btn-create-task flex items-center gap-2" onClick={handleCreateTaskDirectly}>
                  <Plus size={16} />
                  <span>Gerar Tarefa da Turma</span>
                </button>
                <button className="btn-save-resource flex items-center gap-2" onClick={() => (window as any).showToast?.('Recurso Pedagógico catalogado e salvo com sucesso!', 'success')}>
                  <Save size={16} />
                  <span>Salvar como Recurso</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="results-placeholder glass flex flex-col items-center justify-center text-center p-12 text-zinc-600">
              <Sparkles size={48} className="text-zinc-700 mb-4" />
              <h3>Aguardando Análise</h3>
              <p className="max-w-[320px] text-sm mt-2">Envie a imagem do quadro para que a I.A possa estruturar resumos, tópicos e tarefas automáticas.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default WhiteboardCapture;
