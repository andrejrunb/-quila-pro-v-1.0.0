import React, { useEffect, useRef } from 'react';
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Calendar, Users, Briefcase, GraduationCap } from 'lucide-react';
import './AnalyticsBI.css';

interface AnalyticsBIProps {
  onBack: () => void;
}

export const AnalyticsBI: React.FC<AnalyticsBIProps> = ({ onBack }) => {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  const data = [45, 60, 40, 80, 95, 70, 90];

  useEffect(() => {
    data.forEach((h, i) => {
      if (barRefs.current[i]) {
        barRefs.current[i]?.style.setProperty('--bar-height', `${h}%`);
      }
    });
  }, []);

  return (
    <div className="analytics-container animate-fade-in">
       <button 
        onClick={onBack}
        className="back-dashboard"
      >
        <ArrowLeft size={18} className="back-icon" />
        Voltar ao Dashboard
      </button>

      <div className="analytics-header">
        <div>
          <h1 className="analytics-title">
            <BarChart3 className="icon-blue mr-3" size={32} />
            Business Intelligence & Tendências
          </h1>
          <p className="analytics-subtitle">Análise preditiva de assiduidade e comportamento bimestral.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-premium">
            <div className="stat-header">
                <Users className="icon-blue" size={20} />
                <span className="stat-trend-up">
                    <TrendingUp size={12} className="mr-1" /> +4.2%
                </span>
            </div>
            <p className="stat-label">Assiduidade Geral</p>
            <p className="stat-value">96.8%</p>
            <p className="stat-footer">Vs. 92.6% no mesmo período anterior.</p>
        </div>

        <div className="stat-card glass-premium">
            <div className="stat-header">
                <GraduationCap className="icon-purple" size={20} />
                <span className="stat-trend-down">
                    <TrendingDown size={12} className="mr-1" /> -1.5%
                </span>
            </div>
            <p className="stat-label">Evasão Preditiva (Risco)</p>
            <p className="stat-value">2 Alunos</p>
            <p className="stat-footer">Acomatilhamento baseado em faltas recorrentes.</p>
        </div>

        <div className="stat-card glass-premium">
            <div className="stat-header">
                <Briefcase className="icon-emerald" size={20} />
                <span className="stat-label-stable">
                    <Calendar size={12} className="mr-1" /> Estável
                </span>
            </div>
            <p className="stat-label">Engajamento de Pais</p>
            <p className="stat-value">88%</p>
            <p className="stat-footer">Taxa de visualização de mensagens no WhatsApp.</p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card glass-premium">
            <h3 className="chart-title">Tendência de Assiduidade (Bimestral)</h3>
            <div className="chart-visual">
                {data.map((h, i) => (
                    <div key={i} className="chart-bar-container">
                         <div 
                            ref={el => barRefs.current[i] = el}
                            className="chart-bar"
                        />
                        <span className="chart-label">BIM {i+1}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="insight-card glass-premium">
             <h3 className="insight-title">Insight da IA</h3>
             <div className="insight-box">
                <p className="insight-text">
                    "Detectamos um pico de atrasos nas turmas do 9º Ano B nas últimas 3 semanas. 
                    Recomendamos agendar um informativo preventivo para os pais desta turma visando normalizar a pontualidade."
                </p>
             </div>
             <div className="insight-metrics">
                <div className="insight-row">
                    <span className="insight-label">Tempo médio de permanência</span>
                    <span className="insight-value">5h 42min</span>
                </div>
                <div className="insight-row">
                    <span className="insight-label">Pico de detecções (Hora)</span>
                    <span className="insight-value">07:12 AM</span>
                </div>
                <div className="insight-row">
                    <span className="insight-label">Economia de Papel (Digitalização)</span>
                    <span className="insight-value-success">12.500 folhas/ano</span>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};
