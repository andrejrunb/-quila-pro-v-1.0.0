import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  FileText, 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Play,
  TrendingUp,
  Search
} from 'lucide-react';
import './SmartSecretariatDashboard.css';

const SmartSecretariatDashboard: React.FC = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalHoursSaved: 0, roiPercentage: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);

  const fetchQueue = async () => {
    const q = await (window as any).aquila.invoke('automation:get-queue');
    setQueue(q);
  };

  const fetchStats = async () => {
    const s = await (window as any).aquila.invoke('automation:get-stats');
    setStats(s);
  };

  const runAutomation = async (type: string) => {
    setIsProcessing(true);
    await (window as any).aquila.invoke('automation:run-task', { type, studentId: 'STU-999' });
    setTimeout(() => {
      fetchQueue();
      fetchStats();
      setIsProcessing(false);
    }, 1000);
  };

  const generateSchedule = async () => {
    setIsGeneratingSchedule(true);
    try {
      const response = await (window as any).aquila.invoke('secretaria:generate-schedule');
      if (response.success) {
        alert("A IA Soberana otimizou sua grade horária! Catracas faciais sincronizadas.");
      } else {
        alert("Erro ao gerar grade: " + response.message);
      }
    } catch (err: any) {
      alert("Falha de comunicação: " + err.message);
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchStats();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="secretariat-container">
      <header className="secretariat-header">
        <div className="flex items-center gap-4">
          <Briefcase size={32} className="text-indigo-400" />
          <div>
            <h1>Secretaria Digital Soberana</h1>
            <p>Automação Cognitiva & Fluxos de Documentos — Nível 36</p>
          </div>
        </div>
        
        <div className="roi-card glass-panel">
           <TrendingUp size={16} className="text-emerald-400" />
           <div className="roi-info">
              <strong>{stats.totalHoursSaved.toFixed(1)}h</strong>
              <span>Economizadas este mês</span>
           </div>
        </div>
      </header>

      <div className="secretariat-grid">
        {/* Painel de Ações Rápidas (Automation Pills) */}
        <section className="automation-pills glass-panel">
           <h3><Zap size={18} /> Ações Rápidas de Automação</h3>
           <div className="pills-grid">
              <button className="pill-btn" onClick={() => runAutomation('CERTIFICATE')}>
                 <FileText size={16} /> Gerar Certificado
              </button>
              <button className="pill-btn" onClick={() => runAutomation('REPORT_CARD')}>
                 <Zap size={16} /> Fechar Bimestre
              </button>
              <button className="pill-btn" onClick={() => runAutomation('ENROLLMENT_CONFIRMATION')}>
                 <CheckCircle size={16} /> Confirmar Matrículas
              </button>
              <button className="pill-btn disabled">
                 <Play size={16} /> Iniciar Rematrícula IA
              </button>
              <button 
                 className={`pill-btn ${isGeneratingSchedule ? 'disabled' : ''}`} 
                 onClick={generateSchedule}
                 disabled={isGeneratingSchedule}
                 style={{ backgroundColor: isGeneratingSchedule ? '#475569' : '#4f46e5' }}
              >
                 {isGeneratingSchedule ? <Clock size={16} /> : <Zap size={16} />}
                 {isGeneratingSchedule ? 'Gerando...' : 'Gerar Grade IA'}
              </button>
           </div>
        </section>

        {/* Fila de Processamento e Aprovação */}
        <main className="automation-queue glass-panel">
           <div className="flex justify-between items-center mb-6">
              <h3><Clock size={18} /> Fila de Documentos Autônomos</h3>
              <div className="search-box">
                 <Search size={14} />
                 <input type="text" placeholder="Filtrar processos..." />
              </div>
           </div>

           <div className="queue-list">
              {queue.map((task, i) => (
                <div key={i} className="task-item">
                   <div className={`status-dot ${task.status.toLowerCase()}`}></div>
                   <div className="task-info">
                      <strong>{task.type} - {task.studentId}</strong>
                      <span>Iniciado em {new Date(task.timestamp).toLocaleTimeString()}</span>
                   </div>
                   <div className="task-status">
                      {task.status === 'READY_FOR_REVIEW' ? (
                        <button className="approve-btn">Revisar & Assinar</button>
                      ) : (
                        <span className="status-label">{task.status}</span>
                      )}
                   </div>
                </div>
              ))}
              {queue.length === 0 && (
                <div className="empty-queue">
                   <AlertCircle size={32} className="opacity-10 mb-4" />
                   <p>Nenhuma tarefa de automação ativa no momento.</p>
                </div>
              )}
           </div>
        </main>
      </div>

      <footer className="secretariat-footer">
         <CheckCircle size={14} className="text-indigo-400" />
         <span>Assinatura Digital Soberana Ativa (Local)</span>
      </footer>
    </div>
  );
};

export default SmartSecretariatDashboard;
