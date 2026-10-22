import React, { useState, useEffect } from 'react';
import { Activity, UserCheck, RefreshCw, Clock, History } from 'lucide-react';
import './BiometricEvolutionMonitor.css';

interface RefinementEvent {
  studentId: string;
  studentName: string;
  progress: number; // 0-100 (based on buffer size)
  status: 'refining' | 'refined';
  lastCapture: string;
  confidence: number;
}

const BiometricEvolutionMonitor: React.FC = () => {
  const [refinements, setRefinements] = useState<RefinementEvent[]>([
    {
      studentId: 'stu-101',
      studentName: 'Ana Clara Borges',
      progress: 60,
      status: 'refining',
      lastCapture: new Date().toISOString(),
      confidence: 0.96
    },
    {
      studentId: 'stu-442',
      studentName: 'Bruno Carvalho',
      progress: 100,
      status: 'refined',
      lastCapture: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      confidence: 0.99
    }
  ]);

  const [stats, setStats] = useState({
    totalRefinements: 142,
    activeBuffers: 3
  });

  useEffect(() => {
    const ipc = (window as any).electron?.ipcRenderer;
    if (!ipc) return;

    // Listener para refinamentos em tempo real
    const removeListener = ipc.on('identity-refined', (_e: any, data: any) => {
      setRefinements(prev => {
        const existingIndex = prev.findIndex(r => r.studentId === data.studentId);
        const newRef = {
          studentId: data.studentId,
          studentName: data.studentName || 'Aluno Desconhecido',
          progress: 100,
          status: 'refined' as const,
          lastCapture: new Date().toISOString(),
          confidence: data.newConfidence || 0.98
        };

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newRef;
          return updated;
        }
        return [newRef, ...prev].slice(0, 6); // Keep last 6
      });

      // Atualiza o total
      setStats(prev => ({ ...prev, totalRefinements: prev.totalRefinements + 1 }));
    });

    const pollInterval = setInterval(async () => {
      try {
        const currentStats = await ipc.invoke('identity:get-stats');
        setStats({
          totalRefinements: currentStats.totalRefinements,
          activeBuffers: currentStats.bufferStatus
        });
      } catch (error) {
        console.error('[BiometricEvolution] Error polling stats:', error);
      }
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      if (typeof removeListener === 'function') removeListener();
    };
  }, []);

  return (
    <div className="biometric-evolution-monitor glass">
      <div className="be-header">
        <h3>
          <Activity size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Evolução Biométrica Autonômica
        </h3>
        <div className="be-stats-mini">
          <div className="be-stat-pill">Total: {stats.totalRefinements}</div>
          <div className="be-stat-pill">Ativos: {stats.activeBuffers}</div>
        </div>
      </div>

      <div className="be-grid">
        {refinements.map((ref) => (
          <div key={ref.studentId} className={`be-card ${ref.status}`}>
            <div className="be-card-top">
              <div className="be-student-info">
                <span className="be-student-name">{ref.studentName}</span>
                <span className="be-student-id">{ref.studentId}</span>
              </div>
              <div className={`be-status-badge status-${ref.status}`}>
                {ref.status === 'refining' ? (
                  <><RefreshCw size={10} className="animate-spin" /> Recapturando</>
                ) : (
                  <><UserCheck size={10} /> Refinado</>
                )}
              </div>
            </div>

            <div className="be-progress-container">
              <div className="be-progress-label">
                <span>Progresso da Malha</span>
                <span>{ref.progress}%</span>
              </div>
              <div className="be-progress-track">
                <div 
                  className={`be-progress-fill fill-${ref.status}`} 
                  style={{ width: `${ref.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="be-last-refined">
              <Clock size={10} />
              <span>Última captura: {new Date(ref.lastCapture).toLocaleTimeString()}</span>
              <span style={{ marginLeft: 'auto', color: ref.confidence > 0.95 ? '#10b981' : '#f59e0b' }}>
                {(ref.confidence * 100).toFixed(1)}% Conf.
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="be-footer" style={{ marginTop: '15px', textAlign: 'right' }}>
        <button className="btn-text" style={{ fontSize: '0.7rem', opacity: 0.6 }}>
          <History size={12} style={{ marginRight: '4px' }} /> Ver Histórico de Recaptura
        </button>
      </div>
    </div>
  );
};

export default BiometricEvolutionMonitor;
