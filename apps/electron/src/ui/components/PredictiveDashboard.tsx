import React, { useState, useEffect } from 'react';
import './PredictiveDashboard.css';

interface PredictiveRisk {
  studentId: string;
  score: number;
  factors: string[];
  classification: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  predictedIncident?: string;
  studentName?: string; // Hydrated on UI
}

export const PredictiveDashboard: React.FC = () => {
  const [risks, setRisks] = useState<PredictiveRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
    
    // Refresh a cada 5 minutos
    const interval = setInterval(loadAnalytics, 300000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const data = await window.electron.invoke('predictive:get-analytics');
      setRisks(data || []);
    } catch (err) {
      console.error('Falha ao carregar predições:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (classification: string) => {
    switch (classification) {
      case 'CRITICAL': return 'risk-critical';
      case 'HIGH': return 'risk-high';
      case 'MEDIUM': return 'risk-medium';
      default: return 'risk-low';
    }
  };

  return (
    <div className="predictive-dashboard-container">
      <header className="radar-header">
        <div className="radar-title-section">
          <h1>RADAR PREDITIVO</h1>
          <div className="radar-subtitle">
            <span className="pulse-dot"></span>
            MATURIDADE NÍVEL 4 | MONITORAMENTO COMPORTAMENTAL EM TEMPO REAL
          </div>
        </div>
        <button className="btn-elite btn-secondary" onClick={loadAnalytics}>
          RECALIBRAR CÓRTEX
        </button>
      </header>

      <div className="radar-grid">
        <section className="risk-list-section">
          <div className="section-header">
            <h2>ALUNOS EM OBSERVAÇÃO PRIORITÁRIA</h2>
            <span className="count-badge">{risks.length} ALVOS</span>
          </div>

          <div className="risk-scroll-area">
            {loading ? (
              <div className="loading-state">PROCESSANDO CÓRTEX...</div>
            ) : risks.length === 0 ? (
              <div className="empty-state">Nenhum risco detectado no perímetro atual.</div>
            ) : (
              risks.map((risk) => (
                <div key={risk.studentId} className="student-risk-card">
                  <div className="card-main-info">
                    <div className="student-name-group">
                      <h3>{risk.studentName || `ALUNO-${risk.studentId.substring(0, 8)}`}</h3>
                      <span className={`risk-badge ${getRiskColor(risk.classification)}`}>
                        {risk.classification}
                      </span>
                    </div>
                    <div className="risk-percentage">
                      {risk.score}%
                    </div>
                  </div>

                  <div className="risk-metrics-row">
                    <div className="metric-item">
                      <span className="metric-label">Vulnerabilidade</span>
                      <span className="metric-value">{risk.predictedIncident || 'ESTÁVEL'}</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Fatores</span>
                      <span className="metric-value">{risk.factors.join(', ')}</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Confiança IA</span>
                      <span className="metric-value">94.2%</span>
                    </div>
                  </div>

                  <div className="action-preview-box">
                    <p>
                      <strong>Sugestão Áquila:</strong> {risk.classification === 'CRITICAL' 
                        ? 'Acionar conselho tutelar e monitoramento de saída imediato.' 
                        : 'Agendar conversa com coordenação pedagógica nos próximos 3 dias.'}
                    </p>
                  </div>

                  <div className="card-actions">
                    <button className="btn-elite btn-primary">ABRIR DOSSIÊ</button>
                    <button className="btn-elite btn-secondary">NOTIFICAR PAIS</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <aside className="intelligence-summary-sidebar">
          <div className="nexus-insight-card">
            <div className="insight-header">
              <div className="insight-icon">🧠</div>
              <h4>NEXUS INSIGHT</h4>
            </div>
            <div className="insight-content">
              <p>
                O ecossistema detectou um padrão de isolamento social crescente no 9º Ano B. 
                A correlação com a queda de frequência sugere um evento de desengajamento coletivo.
              </p>
              <div className="insight-stat-row">
                <div className="stat-pill">COESÃO: 64%</div>
                <div className="stat-pill">RESILIÊNCIA: ALTA</div>
              </div>
            </div>
          </div>

          <div className="at-risk-clusters">
             {/* Componente de Mini Grafo Social poderia entrar aqui */}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PredictiveDashboard;
