import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  TrendingDown, 
  FileSearch, 
  CheckCircle2, 
  RefreshCw,
  MoreVertical,
  Zap
} from 'lucide-react';
import './CoordinationOverview.css';

interface Insight {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  type: string;
  description: string;
  riskLevel: 'critical' | 'high' | 'moderate';
  status: 'pending' | 'resolved';
}

interface Summary {
  criticalStudents: number;
  activeDossiers: number;
  pendingInsights: number;
  retentionRate: number;
  insights: Insight[];
}

export const CoordinationOverview: React.FC = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const aquila = (window as any).aquila;

  const loadSummary = async () => {
    setIsRefreshing(true);
    try {
      const data = await aquila.invoke('coordination:get-summary');
      setSummary(data);
    } catch (error) {
      console.error('Failed to load coordination summary:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleResolve = async (insightId: string) => {
    const notes = window.prompt('Notas de resolução (opcional):');
    if (notes === null) return;

    try {
      await aquila.invoke('coordination:resolve-insight', { id: insightId, resolution: notes });
      loadSummary(); // Refresh
    } catch (error) {
      console.error('Failed to resolve insight:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="coordination-overview flex items-center justify-center h-full">
        <div className="animate-pulse flex flex-col items-center">
          <Zap className="text-indigo-500 mb-4 animate-bounce" size={48} />
          <p className="text-dim uppercase tracking-tighter font-black">Sincronizando Córtex Pedagógico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="coordination-overview">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
            Panorama de Retenção Ativa
          </h1>
          <p className="text-slate-400 text-sm mt-1">Inteligência Soberana v501 — Monitoramento de Evasão e Risco</p>
        </div>
        
        <button 
          onClick={loadSummary} 
          className={`btn-refresh ${isRefreshing ? 'spin' : ''}`}
          disabled={isRefreshing}
        >
          <RefreshCw size={18} />
        </button>
      </header>

      {/* Summary Cards */}
      <div className="co-summary-bar">
        <div className="summary-item">
          <div className="summary-label">Alunos em Risco Crítico</div>
          <div className="summary-value critical">{summary?.criticalStudents || 0}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Dossiês Ativos</div>
          <div className="summary-value">{summary?.activeDossiers || 0}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Insights Pendentes</div>
          <div className="summary-value">{summary?.pendingInsights || 0}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Taxa de Retenção</div>
          <div className="summary-value">{(summary?.retentionRate || 0) * 100}%</div>
        </div>
      </div>

      {/* Critical Insights Section */}
      <section className="insight-section">
        <div className="section-title">
          <AlertTriangle className="text-red-500" />
          Prioridade de Intervenção
          <span className="badge">{summary?.insights.length || 0} pendentes</span>
        </div>

        <div className="insight-grid">
          {summary?.insights && summary.insights.length > 0 ? (
            summary.insights.map((insight) => (
              <div key={insight.id} className={`insight-card ${insight.riskLevel === 'critical' ? 'critical' : ''}`}>
                <div className="insight-header">
                  <div className="student-info">
                    <div className="student-avatar">
                      {insight.studentName.charAt(0)}
                    </div>
                    <div>
                      <div className="student-name">{insight.studentName}</div>
                      <div className="student-class">{insight.className}</div>
                    </div>
                  </div>
                  <div className={`risk-level risk-${insight.riskLevel}`}>
                    {insight.riskLevel}
                  </div>
                </div>

                <div className="insight-body">
                  <div className="insight-type">{insight.type}</div>
                  <p className="insight-description">{insight.description}</p>
                </div>

                <div className="insight-footer">
                  <button onClick={() => handleResolve(insight.id)} className="btn-resolve">
                    <CheckCircle2 size={14} className="mr-2" /> Resolver
                  </button>
                  <button className="btn-dossier">
                    <FileSearch size={14} className="mr-2" /> Ver Dossiê
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-insights">
              <div className="empty-icon">🛡️</div>
              <h3 className="text-xl font-bold text-slate-300">Córtex Limpo</h3>
              <p className="text-slate-500 mt-2">Nenhum insight de risco detectado no momento.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CoordinationOverview;
