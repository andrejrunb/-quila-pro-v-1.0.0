import React from 'react';
import { CheckCircle, XCircle, Clock, Image as ImageIcon } from 'lucide-react';

interface QAMetrics {
  lastRun: string;
  passRate: number;
  totalTests: number;
  visualRegressions: number;
  status: 'optimal' | 'warning' | 'critical';
}

export const QAOverview: React.FC<{ metrics: QAMetrics }> = ({ metrics }) => {
  return (
    <div className="qa-overview-container">
      <div className="qa-card-grid">
        
        <div className="mini-stat-v2 border-success">
          <strong>TAXA DE SUCESSO</strong>
          <div className="text-success-bold">{metrics.passRate}%</div>
          <span className="text-muted-xs">{metrics.totalTests} testes totais</span>
        </div>

        <div className="mini-stat-v2 border-primary">
          <strong>REGRESSÃO VISUAL</strong>
          <div className="text-primary-bold">{metrics.visualRegressions}</div>
          <span className="text-muted-xs">Diferenças detectadas</span>
        </div>

        <div className="mini-stat-v2 border-warning">
          <strong>ÚLTIMA EXECUÇÃO</strong>
          <div className="font-sm">{new Date(metrics.lastRun).toLocaleString()}</div>
          <Clock size={12} className="opacity-8 mt-2" />
        </div>

        <div className="mini-stat-v2 border-purple">
          <strong>STATUS SQA</strong>
          <div className={`${metrics.status === 'optimal' ? 'text-success' : 'text-warning'} font-bold`}>
            {metrics.status.toUpperCase()}
          </div>
          <span className="text-muted-xs">Sovereign Quality</span>
        </div>

      </div>

      <div className="qa-action-bar">
        <button className="mediation-btn mini" onClick={() => (window as any).aquila.invoke('nexus:run-security-scan')}>
          Gerar Snapshots de Referência
        </button>
        <button className="mediation-btn secondary mini" onClick={() => alert('Abrindo Relatório HTML de Testes...')}>
          Ver Relatório Detalhado (Playwright)
        </button>
      </div>
    </div>
  );
};
